#!/usr/bin/env node
/* eslint-disable import/namespace */
/**
 * Generate WireMock mappings from an OpenAPI spec — without duplicates.
 *
 * - One success (2xx) mapping per endpoint (bound to Scenario state "Started").
 * - One error mapping per status code (4xx/5xx) per endpoint, reusing __files/errors via bodyFileName,
 *   each gated by a WireMock Scenario state "FORCE_<status>".
 * - Guard stubs (header/content/pagination) are OFF by default to avoid duplicates; enable with EMIT_GUARD_STUBS=1.
 * - If a fixture exists under wiremock/__files/fixtures/<group>/<kebab(operationId)>-<status>.json,
 *   use it as response via bodyFileName.
 */

import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';

import { generate as jsfGenerate } from 'json-schema-faker';
import YAML from 'yaml';

// ---------- Config (override via env) ----------
const SPEC_PATH =
  process.env['MOCK_GEN_SPEC_PATH'] ||
  'tools/openapi/vendor/openapi/openapi.yaml';
const SPEC_DIR =
  process.env['MOCK_GEN_SPEC_DIR'] || 'tools/openapi/vendor/openapi';
const MAPPINGS_DIR =
  process.env['MOCK_GEN_MAPPINGS_DIR'] || 'wiremock/mappings';
const DEFAULT_VENDOR = 'application/vnd.hmcts.appreg.v1+json';
const STUB_DELAY_MS = Number.parseInt(process.env.STUB_DELAY_MS || '0', 10);
const EMIT_GUARD_STUBS = ['1', 'true', 'yes'].includes(
  String(process.env.EMIT_GUARD_STUBS || '').toLowerCase(),
);
const WM_FILES_DIR = process.env['MOCK_GEN_WM_FILES_DIR'] || 'wiremock/__files';
const FIXTURE_ROOT = process.env['MOCK_GEN_FIXTURE_ROOT'] || 'fixtures';
const REPORT_CSV_DEFAULT = 'reports/sample.csv';
const REPORT_CSV_FILENAME = 'report.csv';

const FIXTURE_OVERRIDES = Object.freeze({
  'application-list-entries:bulkUploadApplicationListEntries:202':
    path.posix.join(
      FIXTURE_ROOT,
      'actions',
      'bulk-upload-application-list-entries-202.json',
    ),
  'jobs:getJobStatusById:200': path.posix.join(
    FIXTURE_ROOT,
    'jobs',
    'get-job-status-200.json',
  ),
});

// Disable response-template for specific success mappings (opId:status)
const DISABLE_TEMPLATE_FOR = new Set(['getApplicationCodeByCodeAndDate:200']);

// Map status ➜ shared error body file under __files/errors
const ERROR_FILE_BY_STATUS = Object.freeze({
  400: 'errors/bad-request.json',
  401: 'errors/unauthorized.json',
  403: 'errors/forbidden.json',
  404: 'errors/not-found.json',
  406: 'errors/not-acceptable.json',
  409: 'errors/conflict.json',
  413: 'errors/payload-too-large.json',
  415: 'errors/unsupported-media-type.json',
  500: 'errors/internal-server-error.json',
});

// ---------- FS helpers ----------
async function fileExists(p) {
  try {
    await fsp.access(p, fs.constants.R_OK);
    return true;
    // eslint-disable-next-line no-unused-vars
  } catch (_e) {
    return false;
  }
}

async function ensureDir(p) {
  await fsp.mkdir(p, { recursive: true });
}

async function safeWriteJson(file, obj) {
  const json = JSON.stringify(obj, null, 2) + '\n';
  await ensureDir(path.dirname(file));
  await fsp.writeFile(file, json, 'utf8');
}

// ---------- Spec loading / minimal $ref resolver ----------
async function findSpecPath() {
  if (SPEC_PATH) {
    const p = path.resolve(SPEC_PATH);
    if (!(await fileExists(p))) {
      throw new Error(`SPEC_PATH not found: ${p}`);
    }
    return p;
  }
  const dir = path.resolve(SPEC_DIR);
  const entries = await fsp.readdir(dir);
  let chosen =
    entries.find((f) => /^openapi\.(ya?ml|json)$/i.test(f)) ||
    entries.find((f) => /\.(ya?ml|json)$/i.test(f));
  if (!chosen) {
    throw new Error(`No spec files found in ${dir}`);
  }
  return path.join(dir, chosen);
}

async function readFileAsObject(p) {
  const raw = await fsp.readFile(p, 'utf8');
  return /\.ya?ml$/i.test(p) ? YAML.parse(raw) : JSON.parse(raw);
}

function headersFor204Request() {
  return {
    Authorization: { matches: 'Bearer .+' },
    // no Accept constraint for 204
  };
}

/**
 * Very lightweight deref for local relative $ref files (common in this repo).
 * It resolves $ref: './something.yaml' nodes by loading and returning that file’s content.
 * It does NOT fully resolve JSON Pointer fragments inside the referenced file.
 */
async function readSpecWithDeref() {
  const rootPath = await findSpecPath();
  const rootDir = path.dirname(rootPath);
  const root = await readFileAsObject(rootPath);

  async function deref(node, baseDir) {
    if (!node || typeof node !== 'object') {
      return node;
    }
    if (Array.isArray(node)) {
      return Promise.all(node.map((it) => deref(it, baseDir)));
    }
    if (node.$ref && typeof node.$ref === 'string') {
      const ref = node.$ref;
      if (ref.startsWith('./')) {
        const refPath = path.resolve(baseDir, ref);
        const obj = await readFileAsObject(refPath);
        return deref(obj, path.dirname(refPath));
      }
      return node; // leave internal pointers as-is
    }
    const out = {};
    for (const [k, v] of Object.entries(node)) {
      out[k] = await deref(v, baseDir);
    }
    return out;
  }

  const out = { ...root };
  if (root.paths) {
    out.paths = {};
    for (const [p, item] of Object.entries(root.paths)) {
      out.paths[p] = await deref(item, rootDir);
    }
  }
  return out;
}

// ---------- JSON Schema Faker setup ----------
const JSF_OPTIONS = {
  alwaysFakeOptionals: true,
  useDefaultValue: true,
  fillProperties: true,
  minItems: 1,
  maxItems: 3,
  failOnInvalidTypes: false,
};

// ---------- Utility: operation grouping / url matching ----------
function toGroup(op) {
  const tags =
    op && Array.isArray(op.tags) && op.tags.length ? op.tags : ['misc'];
  return String(tags[0]).replace(/\s+/g, '-').toLowerCase();
}

function toKebab(s) {
  if (!s) {
    return '';
  }
  return String(s)
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function slugPath(p) {
  return p.replace(/^\/+/, '').replace(/\/+/g, '_').replace(/[{}]/g, '');
}

function pathToUrlMatcher(p) {
  if (/\{[^}]+}/.test(p)) {
    const re = p.replace(/\{([^}]+)}/g, (_, name) => {
      const n = String(name).toLowerCase();
      if (n.includes('id') || n.includes('uuid')) {
        return '[0-9a-f-]{36}';
      }
      return '[^/]+';
    });
    return { kind: 'urlPathPattern', value: `^${re}$` };
  }
  return { kind: 'urlPath', value: p };
}

// ---------- Content helpers ----------
function pick2xxResponse(responses) {
  if (!responses) {
    return null;
  }
  const pref = ['200', '201', '204'];
  for (const c of pref) {
    if (responses[c]) {
      return [c, responses[c]];
    }
  }
  const any2xx = Object.keys(responses).find((c) => /^2\d\d$/.test(c));
  return any2xx ? [any2xx, responses[any2xx]] : null;
}

function pickJsonMedia(content) {
  if (!content) {
    return null;
  }
  const keys = Object.keys(content);
  const key =
    keys.find((k) => /\+json$/i.test(k)) ||
    keys.find((k) => /^application\/json$/i.test(k)) ||
    keys.find((k) => /\/json$/i.test(k) || /json/i.test(k));
  return key ? [key, content[key]] : null;
}

function bodyJsonString(objOrTemplate) {
  if (typeof objOrTemplate === 'string') {
    return objOrTemplate;
  }
  return JSON.stringify(objOrTemplate, null, 2) + '\n';
}

// UPDATED: accept optional `op` and detect multipart from requestBody content
function houseRuleHeadersForRequest(hasBody, op /* optional */) {
  const headers = {
    Accept: { matches: '.*' },
    Authorization: { matches: 'Bearer .+' },
  };
  if (!hasBody) {
    return headers;
  }

  const content = (op && op.requestBody && op.requestBody.content) || {};
  const types = Object.keys(content).map((k) => k.toLowerCase());

  if (types.includes('multipart/form-data')) {
    // Allow any multipart with or without explicit boundary
    headers['Content-Type'] = { matches: '^multipart/form-data(?:;.*)?$' };
  } else if (
    types.some((k) => k.endsWith('+json') || k === 'application/json')
  ) {
    headers['Content-Type'] = {
      matches:
        '(application/vnd\\.hmcts\\.appreg\\.v[0-9]+\\+json|application/json|application/.+\\+json)',
    };
  } else {
    // Fallback: leave Content-Type unconstrained if we can't confidently guess
    // (do nothing)
  }

  return headers;
}

function houseRuleResponseHeaders(statusCode) {
  if (String(statusCode) === '204') {
    return { Vary: 'Accept' };
  }
  return { 'Content-Type': DEFAULT_VENDOR, Vary: 'Accept' };
}

function buildQueryParameters(parameters = []) {
  const qp = {};
  for (const p of parameters) {
    if (p.in !== 'query' || !p.required) {
      continue;
    }
    const schema = p.schema || {};
    let matcher = '.*';
    if (schema.type === 'integer' || schema.type === 'number') {
      matcher = '^[0-9]+$';
    }
    if (schema.format === 'date') {
      matcher = '^\\d{4}-\\d{2}-\\d{2}$';
    }
    qp[p.name] = { matches: matcher };
  }
  return Object.keys(qp).length ? qp : undefined;
}

async function exampleFromSchemaOrGenerate(media) {
  if (media && media.example) {
    return media.example;
  }
  if (media && media.examples) {
    const firstKey = Object.keys(media.examples)[0];
    if (
      firstKey &&
      media.examples[firstKey] &&
      media.examples[firstKey].value
    ) {
      return media.examples[firstKey].value;
    }
  }
  if (media && media.schema) {
    try {
      return await jsfGenerate(media.schema, JSF_OPTIONS);
      // eslint-disable-next-line no-unused-vars
    } catch (_e) {
      // ignore
    }
  }
  return {};
}

function applyListGuardsIfLooksPaged(bodyStr) {
  let s = bodyStr;
  const guardPage =
    '{{#if request.query.pageNumber}}' +
    "{{#if (matches request.query.page.[0] '^[0-9]+$')}}" +
    '{{request.query.pageNumber.[0]}}' +
    '{{else}}0{{/if}}' +
    '{{else}}0{{/if}}';
  const guardSizePrefSize =
    '{{#if request.query.pageSize}}' +
    "{{#if (matches request.query.size.[0] '^[0-9]+$')}}" +
    '{{request.query.pageSize.[0]}}' +
    '{{else}}100{{/if}}' +
    '{{else}}100{{/if}}';
  const guardPageSizeOrSize =
    '{{#if request.query.pageSize}}' +
    "{{#if (matches request.query.pageSize.[0] '^[0-9]+$')}}" +
    '{{request.query.pageSize.[0]}}' +
    '{{else}}100{{/if}}' +
    `{{else}}${guardSizePrefSize}{{/if}}`;
  s = s.replaceAll(/"pageNumber"\s*:\s*\d+/g, `"pageNumber": ${guardPage}`);
  s = s.replaceAll(/"page"\s*:\s*\d+/g, `"page": ${guardPage}`);
  s = s.replaceAll(
    /"pageSize"\s*:\s*\d+/g,
    `"pageSize": ${guardPageSizeOrSize}`,
  );
  s = s.replaceAll(/"size"\s*:\s*\d+/g, `"size": ${guardSizePrefSize}`);
  return s;
}

// UPDATED: accept optional `op` and pass it to header builder
function mkBaseRequest(method, url, hasBody, opParams = [], op /* optional */) {
  const req = {
    method,
    [url.kind]: url.value,
    headers: houseRuleHeadersForRequest(hasBody, op),
  };
  const qp = buildQueryParameters(opParams || []);
  if (qp) {
    req.queryParameters = qp;
  }
  return req;
}

// ---------- Fixture resolver ----------
async function resolveFixture(group, opId, statusCode) {
  if (!opId) {
    return null;
  }
  const overrideKey = `${group}:${opId}:${statusCode}`;
  const overrideRel = FIXTURE_OVERRIDES[overrideKey];
  if (overrideRel) {
    const overrideAbs = path.join(WM_FILES_DIR, overrideRel);
    if (await fileExists(overrideAbs)) {
      return { rel: overrideRel, abs: overrideAbs };
    }
  }
  const kebab = toKebab(opId);
  const rel = path.posix.join(
    FIXTURE_ROOT,
    group,
    `${kebab}-${statusCode}.json`,
  );
  const abs = path.join(WM_FILES_DIR, rel);
  if (await fileExists(abs)) {
    return { rel, abs };
  }
  return null;
}

// ---------- Scenario helpers ----------
function scenarioNameFor(opId, method, pathStr) {
  return (opId || `${method} ${pathStr}`).replace(/\s+/g, ' ');
}

function scenarioStateFor(code) {
  return `FORCE_${code}`;
}

// ---------- Optional “guard” emitters (OFF by default) ----------
async function emit400InvalidQuery(op, dir, m, url, seenPerOp) {
  const key = `${m} ${url.value} 400-guard-query`;
  if (seenPerOp.has(key)) {
    return;
  }
  const qp = buildQueryParameters(op.parameters || []);
  if (!qp) {
    return;
  }
  const mapping = {
    name: `${op.operationId || `${m} ${url.value}`} – 400 (invalid query)`,
    priority: 2,
    request: {
      method: m,
      [url.kind]: url.value,
      headers: houseRuleHeadersForRequest(!!op.requestBody, op),
    },
    response: {
      status: 400,
      headers: { 'Content-Type': 'application/problem+json' },
      transformers: ['response-template'],
      bodyFileName: ERROR_FILE_BY_STATUS[400],
      ...(STUB_DELAY_MS ? { fixedDelayMilliseconds: STUB_DELAY_MS } : {}),
    },
  };
  await safeWriteJson(
    path.join(
      dir,
      `${op.operationId || `${m}_${slugPath(url.value)}`}-400-guard.json`,
    ),
    mapping,
  );
  seenPerOp.add(key);
}

async function emit401MissingAuth(op, dir, m, url, seenPerOp) {
  const key = `${m} ${url.value} 401-guard-auth`;
  if (seenPerOp.has(key)) {
    return;
  }
  const mapping = {
    name: `${op.operationId || `${m} ${url.value}`} – 401 (missing auth)`,
    priority: 2,
    request: {
      method: m,
      [url.kind]: url.value,
      headers: { Accept: { contains: DEFAULT_VENDOR } },
    },
    response: {
      status: 401,
      headers: { 'Content-Type': 'application/problem+json' },
      transformers: ['response-template'],
      bodyFileName: ERROR_FILE_BY_STATUS[401],
      ...(STUB_DELAY_MS ? { fixedDelayMilliseconds: STUB_DELAY_MS } : {}),
    },
  };
  await safeWriteJson(
    path.join(
      dir,
      `${op.operationId || `${m}_${slugPath(url.value)}`}-401-guard.json`,
    ),
    mapping,
  );
  seenPerOp.add(key);
}

async function emit403ForbiddenDebug(op, dir, m, url, seenPerOp) {
  const key = `${m} ${url.value} 403-guard-debug`;
  if (seenPerOp.has(key)) {
    return;
  }
  const baseReq = mkBaseRequest(
    m,
    url,
    !!op.requestBody,
    op.parameters || [],
    op,
  );
  const req = {
    ...baseReq,
    queryParameters: {
      ...(baseReq.queryParameters || {}),
      'X-Debug-Forbidden': { equalTo: 'true' },
    },
  };
  const mapping = {
    name: `${op.operationId || `${m} ${url.value}`} – 403 (debug)`,
    priority: 2,
    request: req,
    response: {
      status: 403,
      headers: { 'Content-Type': 'application/problem+json' },
      transformers: ['response-template'],
      bodyFileName: ERROR_FILE_BY_STATUS[403],
      ...(STUB_DELAY_MS ? { fixedDelayMilliseconds: STUB_DELAY_MS } : {}),
    },
  };
  await safeWriteJson(
    path.join(
      dir,
      `${op.operationId || `${m}_${slugPath(url.value)}`}-403-debug.json`,
    ),
    mapping,
  );
  seenPerOp.add(key);
}

async function emit406WrongAccept(op, dir, m, url, seenPerOp) {
  const key = `${m} ${url.value} 406-guard-accept`;
  if (seenPerOp.has(key)) {
    return;
  }
  const mapping = {
    name: `${op.operationId || `${m} ${url.value}`} – 406 (wrong accept)`,
    priority: 2,
    request: {
      method: m,
      [url.kind]: url.value,
      headers: { Accept: { doesNotContain: DEFAULT_VENDOR } },
    },
    response: {
      status: 406,
      headers: { 'Content-Type': 'application/problem+json' },
      transformers: ['response-template'],
      bodyFileName: ERROR_FILE_BY_STATUS[406],
      ...(STUB_DELAY_MS ? { fixedDelayMilliseconds: STUB_DELAY_MS } : {}),
    },
  };
  await safeWriteJson(
    path.join(
      dir,
      `${op.operationId || `${m}_${slugPath(url.value)}`}-406-guard.json`,
    ),
    mapping,
  );
  seenPerOp.add(key);
}

async function emit400MissingBodyFields(op, dir, m, url, seenPerOp) {
  const key = `${m} ${url.value} 400-guard-body`;
  if (seenPerOp.has(key)) {
    return;
  }
  if (!op.requestBody) {
    return;
  }
  const mapping = {
    name: `${
      op.operationId || `${m} ${url.value}`
    } – 400 (missing body fields)`,
    priority: 2,
    request: {
      method: m,
      [url.kind]: url.value,
      headers: houseRuleHeadersForRequest(true, op),
    },
    response: {
      status: 400,
      headers: { 'Content-Type': 'application/problem+json' },
      transformers: ['response-template'],
      bodyFileName: ERROR_FILE_BY_STATUS[400],
      ...(STUB_DELAY_MS ? { fixedDelayMilliseconds: STUB_DELAY_MS } : {}),
    },
  };
  await safeWriteJson(
    path.join(
      dir,
      `${op.operationId || `${m}_${slugPath(url.value)}`}-400-guard-body.json`,
    ),
    mapping,
  );
  seenPerOp.add(key);
}

// ---------- Main ----------
async function main() {
  const spec = await readSpecWithDeref();
  if (!spec.paths || !Object.keys(spec.paths).length) {
    process.exit(2);
  }

  // Soft sanity: vendor presence (don’t fail if absent)
  const mediaKeys = new Set();
  for (const [, ops] of Object.entries(spec.paths)) {
    for (const [, op] of Object.entries(ops)) {
      const resp = (op && op.responses) || {};
      for (const r of Object.values(resp)) {
        if (r && r.content) {
          Object.keys(r.content).forEach((k) => mediaKeys.add(k));
        }
      }
      const rb = op && op.requestBody && op.requestBody.content;
      if (rb) {
        Object.keys(rb).forEach((k) => mediaKeys.add(k));
      }
    }
  }
  if (
    ![...mediaKeys].some(
      (k) => k.toLowerCase() === DEFAULT_VENDOR.toLowerCase(),
    )
  ) {
    // ignore
  }

  await ensureDir(MAPPINGS_DIR);

  const emittedErrorKeys = new Set();

  for (const [p, ops] of Object.entries(spec.paths)) {
    for (const [method, op] of Object.entries(ops)) {
      const m = method.toUpperCase();
      if (!['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(m)) {
        continue;
      }

      const group = toGroup(op || {});
      const url = pathToUrlMatcher(p);
      const hasBody = !!op.requestBody;
      const dir = path.join(MAPPINGS_DIR, group);
      await ensureDir(dir);

      const seenPerOp = new Set();
      const specErrorCodes = new Set(
        Object.keys(op.responses || {})
          .filter((c) => /^[45]\d\d$/.test(c))
          .map(Number),
      );

      if (EMIT_GUARD_STUBS) {
        if (!specErrorCodes.has(400)) {
          await emit400InvalidQuery(op, dir, m, url, seenPerOp);
        }
        if (!specErrorCodes.has(400) && hasBody) {
          await emit400MissingBodyFields(op, dir, m, url, seenPerOp);
        }
        if (!specErrorCodes.has(401)) {
          await emit401MissingAuth(op, dir, m, url, seenPerOp);
        }
        if (!specErrorCodes.has(403)) {
          await emit403ForbiddenDebug(op, dir, m, url, seenPerOp);
        }
        if (!specErrorCodes.has(406)) {
          await emit406WrongAccept(op, dir, m, url, seenPerOp);
        }
      }

      // Spec-declared error mappings (one per status per endpoint) — SCENARIO-BASED
      for (const [codeStr] of Object.entries(op.responses || {})) {
        if (!/^[45]\d\d$/.test(String(codeStr))) {
          continue;
        }
        const code = Number(codeStr);
        const bodyFileName = ERROR_FILE_BY_STATUS[code];
        if (!bodyFileName) {
          continue;
        }

        const errKey = `${m} ${url.kind}:${url.value} ${code}`;
        if (emittedErrorKeys.has(errKey)) {
          continue;
        }

        const baseReq = mkBaseRequest(m, url, hasBody, op.parameters || [], op);

        const errMapping = {
          name: `${(op.operationId || `${m} ${p}`).replace(
            /\s+/g,
            ' ',
          )} – ${code}`,

          // Scenario wiring
          scenarioName: scenarioNameFor(op.operationId, m, p),
          requiredScenarioState: scenarioStateFor(code),

          priority: 3,
          request: baseReq,
          response: {
            status: code,
            headers: { 'Content-Type': 'application/problem+json' },
            transformers: ['response-template'],
            ...(STUB_DELAY_MS ? { fixedDelayMilliseconds: STUB_DELAY_MS } : {}),
            bodyFileName,
          },
        };

        const errFile = path.join(
          dir,
          `${(
            op.operationId || `${m}_${slugPath(p)}`
          ).toLowerCase()}-${code}.json`,
        );
        await safeWriteJson(errFile, errMapping);
        emittedErrorKeys.add(errKey);
      }

      // Success (2xx) mapping — exactly one per endpoint (Scenario state: Started)
      const picked = pick2xxResponse(op.responses);
      if (!picked) {
        continue;
      }
      const [statusCode, resp] = picked;

      // Detect media type for the 2xx response
      const mediaKey =
        resp && resp.content ? Object.keys(resp.content)[0] : null;
      const isCsv =
        !!mediaKey && String(mediaKey).toLowerCase().includes('text/csv');

      // Default headers vary by media
      const headers = isCsv
        ? {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="${REPORT_CSV_FILENAME}"`,
            Vary: 'Accept',
          }
        : houseRuleResponseHeaders(statusCode);

      // Prefer curated fixture if present (JSON only)
      let successResponse = {};
      const maybeFixture =
        !isCsv && (await resolveFixture(group, op.operationId, statusCode));

      if (isCsv) {
        // CSV download: serve the shared sample.csv
        successResponse = {
          status: Number(statusCode),
          headers,
          ...(STUB_DELAY_MS ? { fixedDelayMilliseconds: STUB_DELAY_MS } : {}),
          bodyFileName: REPORT_CSV_DEFAULT, // e.g. "reports/sample.csv"
        };
      } else if (maybeFixture && String(statusCode) !== '204') {
        // JSON fixture
        successResponse = {
          status: Number(statusCode),
          headers,
          transformers: ['response-template'],
          ...(STUB_DELAY_MS ? { fixedDelayMilliseconds: STUB_DELAY_MS } : {}),
          bodyFileName: maybeFixture.rel, // fixtures/<group>/<op>-200.json
        };
      } else {
        // Fallback: example/schema-based JSON body
        let responseBodyStr = '';
        if (String(statusCode) !== '204') {
          const json = pickJsonMedia(resp.content || {}) || [];
          const media = json[1];
          const example = media ? await exampleFromSchemaOrGenerate(media) : {};
          responseBodyStr = applyListGuardsIfLooksPaged(
            bodyJsonString(example),
          );
        }
        successResponse = {
          status: Number(statusCode),
          headers,
          transformers: ['response-template'],
          ...(STUB_DELAY_MS ? { fixedDelayMilliseconds: STUB_DELAY_MS } : {}),
          ...(String(statusCode) === '204' ? {} : { body: responseBodyStr }),
        };
      }

      const is204 = String(statusCode) === '204';

      const disableKey = `${op.operationId}:${statusCode}`;
      if (
        DISABLE_TEMPLATE_FOR.has(disableKey) &&
        successResponse.transformers
      ) {
        delete successResponse.transformers;
      }

      const successMapping = {
        name: (op.operationId || `${m} ${p}`).replace(/\s+/g, ' '),
        // Scenario wiring: happy path = default state
        scenarioName: scenarioNameFor(op.operationId, m, p),
        requiredScenarioState: 'Started',
        priority: 5,
        request: is204
          ? {
              method: m,
              [url.kind]: url.value,
              headers: headersFor204Request(),
            }
          : mkBaseRequest(m, url, hasBody, op.parameters || [], op),
        response: successResponse,
      };

      const file = path.join(
        dir,
        `${(op.operationId || `${m}_${slugPath(p)}`).toLowerCase()}-${statusCode}.json`,
      );
      await safeWriteJson(file, successMapping);
    }
  }
}

main().catch(() => {
  process.exit(1);
});
