#!/usr/bin/env node
'use strict';

/**
 * Generate WireMock mappings from an OpenAPI spec, including error stubs.
 *
 * - Finds SPEC_PATH (env) or falls back to tools/openapi/vendor/openapi/openapi.(yaml|yml|json)
 * - Emits files under MAPPINGS_DIR/<firstTag|misc>/
 * - Success stubs: priority 5
 * - Error stubs:   priority 2  (win before success)
 *   • 400 invalid query values (number/date/enum)
 *   • 400 missing required body fields
 *   • 406 wrong Accept
 *   • 401 missing/invalid Authorization
 *   • 403 forbidden (debug token pattern)
 *   • 404/409/500 debug toggles (X-Debug-Not-Found / -Conflict / -Error)
 * - Paged list bodies get guards so page/size NaN → sensible defaults
 *
 * Env (all optional — you can hardcode below if preferred):
 *   SPEC_PATH=tools/openapi/vendor/openapi/openapi.yaml
 *   SPEC_DIR=tools/openapi/vendor/openapi
 *   MAPPINGS_DIR=wiremock/mappings
 *   VENDOR_ACCEPT=application/vnd.hmcts.appreg.v1+json   # Accept + response Content-Type
 *   STUB_DELAY_MS=0
 *   DEBUG_GEN=0
 */

const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const YAML = require('yaml');
const Ajv = require('ajv');
const jsf = require('json-schema-faker');
const { promisify } = require('node:util');

// ---------- Config (env with sensible fallbacks)
const SPEC_PATH =
  process.env.SPEC_PATH || 'tools/openapi/vendor/openapi/openapi.yaml';
const SPEC_DIR = process.env.SPEC_DIR || 'tools/openapi/vendor/openapi';
const MAPPINGS_DIR = process.env.MAPPINGS_DIR || 'wiremock/mappings';
const DEFAULT_VENDOR =
  process.env.VENDOR_ACCEPT || 'application/vnd.hmcts.appreg.v1+json';
const STUB_DELAY_MS = Number.parseInt(process.env.STUB_DELAY_MS || '0', 10);
const DEBUG = /^(1|true|yes)$/i.test(process.env.DEBUG_GEN || '0');

// ---------- JSON Schema Faker setup
const ajv = new Ajv({ strict: false, allowUnionTypes: true });
jsf.option({
  alwaysFakeOptionals: true,
  useDefaultValue: true,
  fillProperties: true,
});
jsf.option({ minItems: 1, maxItems: 3 });
jsf.extend('ajv', () => ajv);

// ---------- Utils
function log(...args) {
  if (DEBUG) console.log('[gen]', ...args);
}

async function fileExists(p) {
  try {
    await fsp.access(p, fs.constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

async function findSpecPath() {
  if (SPEC_PATH) {
    const p = path.resolve(SPEC_PATH);
    if (!(await fileExists(p))) throw new Error(`SPEC_PATH not found: ${p}`);
    return p;
  }
  const dir = path.resolve(SPEC_DIR);
  const entries = await fsp.readdir(dir);
  let chosen = entries.find((f) => /^openapi\.(ya?ml|json)$/i.test(f));
  if (!chosen) chosen = entries.find((f) => /\.(ya?ml|json)$/i.test(f));
  if (!chosen) throw new Error(`No spec files found in ${dir}`);
  return path.join(dir, chosen);
}

async function readSpecWithDeref() {
  const specPath = await findSpecPath();
  const raw = await fsp.readFile(specPath, 'utf8');
  const baseDir = path.dirname(specPath);
  const spec = /\.ya?ml$/i.test(specPath) ? YAML.parse(raw) : JSON.parse(raw);
  return await derefExternalRefs(spec, baseDir);
}

async function derefExternalRefs(node, baseDir, seen = new Map()) {
  if (!node || typeof node !== 'object') return node;

  // If this node is *just* a $ref, and it's a file path (not a '#/...' pointer)
  if (
    node.$ref &&
    typeof node.$ref === 'string' &&
    !node.$ref.startsWith('#')
  ) {
    const refPath = path.resolve(baseDir, node.$ref);
    if (seen.has(refPath)) return seen.get(refPath); // avoid cycles

    const raw = await fsp.readFile(refPath, 'utf8');
    const parsed = refPath.endsWith('.json')
      ? JSON.parse(raw)
      : YAML.parse(raw);
    // Remember before diving deeper (break self-cycles)
    seen.set(refPath, parsed);
    return await derefExternalRefs(
      parsed,
      path.dirname(refPath),
      seen,
    );
  }

  // Otherwise walk children
  if (Array.isArray(node)) {
    const arr = [];
    for (const v of node) arr.push(await derefExternalRefs(v, baseDir, seen));
    return arr;
  }

  const out = {};
  for (const [k, v] of Object.entries(node)) {
    out[k] = await derefExternalRefs(v, baseDir, seen);
  }
  return out;
}

function toGroup(op) {
  const tags =
    op && Array.isArray(op.tags) && op.tags.length ? op.tags : ['misc'];
  return String(tags[0]).replace(/\s+/g, '-').toLowerCase();
}

function slugPath(p) {
  return p.replace(/^\/+/, '').replace(/\/+/g, '_').replace(/[{}]/g, '');
}

function pathToUrlMatcher(p) {
  if (/\{[^}]+\}/.test(p)) {
    const re = p.replace(/\{([^}]+)\}/g, (_, name) => {
      const n = String(name).toLowerCase();
      if (n.includes('id') || n.includes('uuid')) return '[0-9a-f-]{36}';
      return '[^/]+';
    });
    return { kind: 'urlPathPattern', value: `^${re}$` };
  }
  return { kind: 'urlPath', value: p };
}

function pick2xxResponse(responses) {
  if (!responses) return null;
  const pref = ['200', '201', '204'];
  for (const c of pref) if (responses[c]) return [c, responses[c]];
  const any2xx = Object.keys(responses).find((c) => /^2\d\d$/.test(c));
  return any2xx ? [any2xx, responses[any2xx]] : null;
}

function pickJsonMedia(content) {
  if (!content) return null;
  const keys = Object.keys(content);
  const key =
    keys.find((k) => /\+json$/i.test(k)) ||
    keys.find((k) => /^application\/json$/i.test(k)) ||
    keys.find((k) => /\/json$/i.test(k) || /json/i.test(k));
  return key ? [key, content[key]] : null;
}

function bodyJsonString(objOrTemplate) {
  if (typeof objOrTemplate === 'string') return objOrTemplate;
  return JSON.stringify(objOrTemplate, null, 2) + '\n';
}

function ensureDir(p) {
  return fsp.mkdir(p, { recursive: true });
}

function vendorAcceptMatcher() {
  return { contains: DEFAULT_VENDOR };
}

function authRequiredMatcher() {
  return { matches: 'Bearer .+' };
}

function contentTypeJsonMatcher() {
  return {
    matches:
      '(application/vnd\\.hmcts\\.appreg\\.v\\d+\\+json|application/json|application/.+\\+json)',
  };
}

function mkProblemHeaders() {
  return { 'Content-Type': 'application/problem+json' };
}

function houseRuleResponseHeaders(statusCode) {
  if (String(statusCode) === '204') return { Vary: 'Accept' };
  return { 'Content-Type': DEFAULT_VENDOR, Vary: 'Accept' };
}

function mkBaseRequest(m, url, hasBody) {
  const req = {
    method: m,
    [url.kind]: url.value,
    headers: {
      Accept: vendorAcceptMatcher(),
      Authorization: authRequiredMatcher(),
    },
  };
  if (hasBody) req.headers['Content-Type'] = contentTypeJsonMatcher();
  return req;
}

function writeStubFile(dir, name, mapping) {
  return fsp.writeFile(
    path.join(dir, name),
    JSON.stringify(mapping, null, 2) + '\n',
    'utf8',
  );
}

function buildBodyPatterns(requestBody) {
  if (!requestBody || !requestBody.content) return undefined;
  const json = pickJsonMedia(requestBody.content);
  if (!json) return undefined;
  const [, media] = json;
  const schema = media.schema || {};
  const req = Array.isArray(schema.required) ? schema.required : [];
  if (!req.length) return undefined;
  return req.map((name) => ({ matchesJsonPath: `$.${name}` }));
}

async function exampleFromSchemaOrGenerate(media) {
  if (media?.example) return media.example;
  if (media?.examples) {
    const firstKey = Object.keys(media.examples)[0];
    if (firstKey && media.examples[firstKey]?.value) {
      return media.examples[firstKey].value;
    }
  }
  if (media?.schema) {
    try {
      return await jsf.resolve(media.schema);
    } catch (e) {
      log('jsf failed; falling back to {}', e.message);
    }
  }
  return {};
}

// Replace simple numeric/date paging fields with guarded templating so NaN -> defaults
function applyListGuardsIfLooksPaged(bodyStr) {
  let s = bodyStr;

  const guardPage =
    `{{#if request.query.page}}` +
    `{{#if (matches request.query.page.[0] '^[0-9]+$')}}` +
    `{{request.query.page.[0]}}` +
    `{{else}}0{{/if}}` +
    `{{else}}0{{/if}}`;

  const guardSizePrefSize =
    `{{#if request.query.size}}` +
    `{{#if (matches request.query.size.[0] '^[0-9]+$')}}` +
    `{{request.query.size.[0]}}` +
    `{{else}}100{{/if}}` +
    `{{else}}100{{/if}}`;

  const guardPageSizeOrSize =
    `{{#if request.query.pageSize}}` +
    `{{#if (matches request.query.pageSize.[0] '^[0-9]+$')}}` +
    `{{request.query.pageSize.[0]}}` +
    `{{else}}100{{/if}}` +
    `{{else}}${guardSizePrefSize}{{/if}}`;

  s = s.replace(/"pageNumber"\s*:\s*\d+/g, `"pageNumber": ${guardPage}`);
  s = s.replace(/"page"\s*:\s*\d+/g, `"page": ${guardPage}`);
  s = s.replace(/"pageSize"\s*:\s*\d+/g, `"pageSize": ${guardPageSizeOrSize}`);
  s = s.replace(/"size"\s*:\s*\d+/g, `"size": ${guardSizePrefSize}`);

  return s;
}

// ---------- Error stub builders

function invalidRegexForParam(p) {
  const sch = p.schema || {};
  if (sch.type === 'integer' || sch.type === 'number') return '^(?![0-9]+$).*';
  if (sch.format === 'date') return '^(?!\\d{4}-\\d{2}-\\d{2}$).*';
  if (sch.type === 'string' && Array.isArray(sch.enum) && sch.enum.length) {
    const safe = sch.enum
      .map((v) => String(v).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('|');
    return `^(?!(${safe})$).*`; // not in enum
  }
  return null;
}

async function emit400InvalidQuery(op, groupDir, m, url) {
  const params = (op.parameters || []).filter((p) => p.in === 'query');
  const invalidables = params
    .map((p) => ({ p, re: invalidRegexForParam(p) }))
    .filter((x) => x.re);

  const tasks = invalidables.map(({ p, re }) => {
    const req = mkBaseRequest(m, url, !!op.requestBody);
    req.queryParameters = { [p.name]: { matches: re } };

    const body =
      `{ "type":"about:blank","title":"Bad Request","status":400,` +
      `"detail":"Query parameter '${p.name}' is invalid.","path":"{{request.path}}","timestamp":"{{now format='yyyy-MM-dd'T'HH:mm:ssXXX'}}","traceId":"{{randomValue length=12 type='ALPHANUMERIC'}}" }`;
    const mapping = {
      name: `${op.operationId || `${m} ${url.value}`} – 400 invalid ${p.name}`,
      priority: 2,
      request: req,
      response: {
        status: 400,
        headers: mkProblemHeaders(),
        transformers: ['response-template'],
        body,
      },
    };
    const fname = `${(
      op.operationId || `${m}_${slugPath(url.value)}`
    ).toLowerCase()}-400-${p.name}.json`;
    return writeStubFile(groupDir, fname, mapping);
  });

  await Promise.all(tasks);
}

function requiredBodyFields(op) {
  const content = op.requestBody?.content || null;
  if (!content) return [];
  const [, media] = pickJsonMedia(content) || [];
  const schema = media?.schema || {};
  return Array.isArray(schema.required) ? schema.required : [];
}

async function emit400MissingBodyFields(op, groupDir, m, url) {
  const fields = requiredBodyFields(op);
  const tasks = fields.map((field) => {
    const req = mkBaseRequest(m, url, true);
    req.bodyPatterns = [{ not: { matchesJsonPath: `$.${field}` } }];

    const body =
      `{ "type":"about:blank","title":"Bad Request","status":400,` +
      `"detail":"Missing required field: ${field}","path":"{{request.path}}","timestamp":"{{now format='yyyy-MM-dd'T'HH:mm:ssXXX'}}","traceId":"{{randomValue length=12 type='ALPHANUMERIC'}}" }`;
    const mapping = {
      name: `${op.operationId || `${m} ${url.value}`} – 400 missing ${field}`,
      priority: 2,
      request: req,
      response: {
        status: 400,
        headers: mkProblemHeaders(),
        transformers: ['response-template'],
        body,
      },
    };
    const fname = `${(
      op.operationId || `${m}_${slugPath(url.value)}`
    ).toLowerCase()}-400-missing-${field}.json`;
    return writeStubFile(groupDir, fname, mapping);
  });

  await Promise.all(tasks);
}

async function emit406WrongAccept(op, groupDir, m, url) {
  const req = {
    method: m,
    [url.kind]: url.value,
    headers: { Accept: { doesNotContain: DEFAULT_VENDOR } },
  };
  const body =
    `{ "type":"about:blank","title":"Not Acceptable","status":406,` +
    `"detail":"Set Accept: ${DEFAULT_VENDOR}.","path":"{{request.path}}","timestamp":"{{now format='yyyy-MM-dd'T'HH:mm:ssXXX'}}","traceId":"{{randomValue length=12 type='ALPHANUMERIC'}}" }`;
  const mapping = {
    name: `${op.operationId || `${m} ${url.value}`} – 406`,
    priority: 2,
    request: req,
    response: {
      status: 406,
      headers: mkProblemHeaders(),
      transformers: ['response-template'],
      body,
    },
  };
  const fname = `${(
    op.operationId || `${m}_${slugPath(url.value)}`
  ).toLowerCase()}-406.json`;
  await writeStubFile(groupDir, fname, mapping);
}

async function emit401MissingAuth(op, groupDir, m, url) {
  const req = {
    method: m,
    [url.kind]: url.value,
    headers: { Authorization: { absent: true } },
  };
  const body =
    `{ "type":"about:blank","title":"Unauthorized","status":401,` +
    `"detail":"Missing or invalid Authorization header.","path":"{{request.path}}","timestamp":"{{now format='yyyy-MM-dd'T'HH:mm:ssXXX'}}","traceId":"{{randomValue length=12 type='ALPHANUMERIC'}}" }`;
  const mapping = {
    name: `${op.operationId || `${m} ${url.value}`} – 401`,
    priority: 2,
    request: req,
    response: {
      status: 401,
      headers: mkProblemHeaders(),
      transformers: ['response-template'],
      body,
    },
  };
  const fname = `${(
    op.operationId || `${m}_${slugPath(url.value)}`
  ).toLowerCase()}-401.json`;
  await writeStubFile(groupDir, fname, mapping);
}

async function emit403ForbiddenDebug(op, groupDir, m, url) {
  const req = {
    method: m,
    [url.kind]: url.value,
    headers: { Authorization: { matches: 'Bearer forbidden.*' } },
  };
  const body =
    `{ "type":"about:blank","title":"Forbidden","status":403,` +
    `"detail":"Access denied.","path":"{{request.path}}","timestamp":"{{now format='yyyy-MM-dd'T'HH:mm:ssXXX'}}","traceId":"{{randomValue length=12 type='ALPHANUMERIC'}}" }`;
  const mapping = {
    name: `${op.operationId || `${m} ${url.value}`} – 403`,
    priority: 2,
    request: req,
    response: {
      status: 403,
      headers: mkProblemHeaders(),
      transformers: ['response-template'],
      body,
    },
  };
  const fname = `${(
    op.operationId || `${m}_${slugPath(url.value)}`
  ).toLowerCase()}-403.json`;
  await writeStubFile(groupDir, fname, mapping);
}

async function emitDebugToggles(op, groupDir, m, url) {
  const base = mkBaseRequest(m, url, !!op.requestBody);

  const make = (hdrName, status, title, detail) => {
    const req = JSON.parse(JSON.stringify(base));
    req.headers[hdrName] = { equalTo: 'true' };
    const mapping = {
      name: `${op.operationId || `${m} ${url.value}`} – ${status} debug`,
      priority: 2,
      request: req,
      response: {
        status,
        headers: mkProblemHeaders(),
        transformers: ['response-template'],
        body:
          `{ "type":"about:blank","title":"${title}","status":${status},` +
          `"detail":"${detail}","path":"{{request.path}}","timestamp":"{{now format='yyyy-MM-dd'T'HH:mm:ssXXX'}}","traceId":"{{randomValue length=12 type='ALPHANUMERIC'}}" }`,
      },
    };
    const fname = `${(
      op.operationId || `${m}_${slugPath(url.value)}`
    ).toLowerCase()}-${status}-debug.json`;
    return writeStubFile(groupDir, fname, mapping);
  };

  await Promise.all([
    make(
      'X-Debug-Not-Found',
      404,
      'Not Found',
      'Simulated not found (debug toggle).',
    ),
    make(
      'X-Debug-Conflict',
      409,
      'Conflict',
      'Simulated conflict (debug toggle).',
    ),
    make(
      'X-Debug-Error',
      500,
      'Internal Server Error',
      'Simulated server error (debug toggle).',
    ),
  ]);
}

// ---------- Main
async function main() {
  const spec = await readSpecWithDeref();

  if (!spec.paths || !Object.keys(spec.paths).length) {
    console.error(
      '[error] Spec has no paths. Check you fetched the right file.',
    );
    process.exit(2);
  }

  // Soft sanity: warn if DEFAULT_VENDOR isn’t present in any content types (don’t fail)
  const mediaKeys = new Set();
  for (const [p, ops] of Object.entries(spec.paths)) {
    for (const [, op] of Object.entries(ops)) {
      const resp = op?.responses || {};
      for (const r of Object.values(resp)) {
        if (r?.content) Object.keys(r.content).forEach((k) => mediaKeys.add(k));
      }
      const rb = op?.requestBody?.content || null;
      if (rb) Object.keys(rb).forEach((k) => mediaKeys.add(k));
    }
  }
  if (
    ![...mediaKeys].some(
      (k) => k.toLowerCase() === DEFAULT_VENDOR.toLowerCase(),
    )
  ) {
    console.warn(
      '[sanity] Vendor media type not found in spec content types. Using it anyway for Accept/response.',
    );
  }

  await ensureDir(MAPPINGS_DIR);

  let generated = 0;
  let generatedErrors = 0;

  for (const [p, ops] of Object.entries(spec.paths)) {
    for (const [method, op] of Object.entries(ops)) {
      const m = method.toUpperCase();
      if (!['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(m)) continue;

      const group = toGroup(op || {});
      const url = pathToUrlMatcher(p);
      const hasBody = !!op.requestBody;
      const dir = path.join(MAPPINGS_DIR, group);
      await ensureDir(dir);

      // ---- Error stubs (priority 2)
      await emit400InvalidQuery(op, dir, m, url);
      if (hasBody) await emit400MissingBodyFields(op, dir, m, url);
      await emit406WrongAccept(op, dir, m, url);
      await emit401MissingAuth(op, dir, m, url);
      await emit403ForbiddenDebug(op, dir, m, url);
      await emitDebugToggles(op, dir, m, url);

      // Count roughly (not exact file count, but close enough for summary)
      generatedErrors += 1;

      // ---- Success (2xx) stub (priority 5)
      const picked = pick2xxResponse(op.responses);
      if (!picked) {
        log(`skip ${m} ${p} (no 2xx response)`);
        continue;
      }
      const [statusCode, resp] = picked;
      const headers = houseRuleResponseHeaders(statusCode);

      let responseBodyStr = '';
      if (String(statusCode) !== '204') {
        const json = pickJsonMedia(resp.content || {}) || [];
        const media = json[1];
        const example = media ? await exampleFromSchemaOrGenerate(media) : {};
        responseBodyStr = applyListGuardsIfLooksPaged(bodyJsonString(example));
      }

      const successMapping = {
        name: (op.operationId || `${m} ${p}`).replace(/\s+/g, ' '),
        priority: 5,
        request: mkBaseRequest(m, url, hasBody),
        response: {
          status: Number(statusCode),
          headers,
          transformers: ['response-template'],
          ...(STUB_DELAY_MS ? { fixedDelayMilliseconds: STUB_DELAY_MS } : {}),
          ...(String(statusCode) === '204' ? {} : { body: responseBodyStr }),
        },
      };

      const file = path.join(
        dir,
        `${(
          op.operationId || `${m}_${slugPath(p)}`
        ).toLowerCase()}-${statusCode}.json`,
      );
      await fsp.writeFile(
        file,
        JSON.stringify(successMapping, null, 2) + '\n',
        'utf8',
      );
      generated++;
      log('wrote', file);
    }
  }

  if (!generated) {
    console.error(
      '[warn] No mappings were generated. Likely causes: wrong spec file, no 2xx responses, or all methods unsupported.',
    );
    process.exit(3);
  }

  console.log(
    `[ok] Generated ${generated} success mappings (+ error guards per op) into ${MAPPINGS_DIR}`,
  );
}

main().catch((e) => {
  console.error('[error]', e);
  process.exit(1);
});
