#!/usr/bin/env node
'use strict';

/**
 * Generate WireMock mappings from an OpenAPI spec — without duplicates.
 *
 * - One success (2xx) mapping per endpoint.
 * - One error mapping per status code (4xx/5xx) per endpoint, reusing __files/errors via bodyFileName.
 * - Guard stubs (header/content/pagination) are OFF by default to avoid duplicates; enable with EMIT_GUARD_STUBS=1.
 * - NEW: If a fixture exists under wiremock/__files/fixtures/<group>/<kebab(operationId)>-<status>.json,
 *        use it as response via bodyFileName.
 */

const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');

const Ajv = require('ajv');
const jsf = require('json-schema-faker');
const YAML = require('yaml');

// ---------- Config (override via env) ----------
const SPEC_PATH = 'tools/openapi/vendor/openapi/openapi.yaml';
const SPEC_DIR = 'tools/openapi/vendor/openapi';
const MAPPINGS_DIR = 'wiremock/mappings';
const DEFAULT_VENDOR = 'application/vnd.hmcts.appreg.v1+json';
const STUB_DELAY_MS = Number.parseInt(process.env.STUB_DELAY_MS || '0', 10);
const DEBUG = ['1', 'true', 'yes'].includes(
  String(process.env.DEBUG_GEN || '').toLowerCase(),
);
const EMIT_GUARD_STUBS = ['1', 'true', 'yes'].includes(
  String(process.env.EMIT_GUARD_STUBS || '').toLowerCase(),
);
const WM_FILES_DIR = 'wiremock/__files';
const FIXTURE_ROOT = 'fixtures';

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

function log(...args) {
  if (DEBUG) console.log('[gen]', ...args);
}

// ---------- FS helpers ----------
async function fileExists(p) {
  try {
    await fsp.access(p, fs.constants.R_OK);
    return true;
  } catch {
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
  if (!chosen) throw new Error(`No spec files found in ${dir}`);
  return path.join(dir, chosen);
}

async function readFileAsObject(p) {
  const raw = await fsp.readFile(p, 'utf8');
  return /\.ya?ml$/i.test(p) ? YAML.parse(raw) : JSON.parse(raw);
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
    if (!node || typeof node !== 'object') return node;
    if (Array.isArray(node))
      return Promise.all(node.map((it) => deref(it, baseDir)));
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
const ajv = new Ajv({ strict: false, allowUnionTypes: true });
jsf.option({
  alwaysFakeOptionals: true,
  useDefaultValue: true,
  fillProperties: true,
});
jsf.option({ minItems: 1, maxItems: 3 });
jsf.extend('ajv', () => ajv);

// ---------- Utility: operation grouping / url matching ----------
function toGroup(op) {
  const tags =
    op && Array.isArray(op.tags) && op.tags.length ? op.tags : ['misc'];
  return String(tags[0]).replace(/\s+/g, '-').toLowerCase();
}

function toKebab(s) {
  if (!s) return '';
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
      if (n.includes('id') || n.includes('uuid')) return '[0-9a-f-]{36}';
      return '[^/]+';
    });
    return { kind: 'urlPathPattern', value: `^${re}$` };
  }
  return { kind: 'urlPath', value: p };
}

// ---------- Content helpers ----------
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

function houseRuleHeadersForRequest(hasBody) {
  const headers = {
    Accept: { contains: DEFAULT_VENDOR },
    Authorization: { matches: 'Bearer .+' },
  };
  if (hasBody) {
    headers['Content-Type'] = {
      matches:
        '(application/vnd\\.hmcts\\.appreg\\.v[0-9]+\\+json|application/json|application/.+\\+json)',
    };
  }
  return headers;
}

function houseRuleResponseHeaders(statusCode) {
  if (String(statusCode) === '204') return { Vary: 'Accept' };
  return { 'Content-Type': DEFAULT_VENDOR, Vary: 'Accept' };
}

function buildQueryParameters(parameters = []) {
  const qp = {};
  for (const p of parameters) {
    if (p.in !== 'query') continue;
    const schema = p.schema || {};
    let matcher = '.*';
    if (schema.type === 'integer' || schema.type === 'number')
      matcher = '^[0-9]+$';
    if (schema.format === 'date') matcher = '^\\d{4}-\\d{2}-\\d{2}$';
    qp[p.name] = p.required ? { matches: matcher } : { matches: '.*' };
  }
  return Object.keys(qp).length ? qp : undefined;
}

async function exampleFromSchemaOrGenerate(media) {
  if (media?.example) return media.example;
  if (media?.examples) {
    const firstKey = Object.keys(media.examples)[0];
    if (firstKey && media.examples[firstKey]?.value)
      return media.examples[firstKey].value;
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

function applyListGuardsIfLooksPaged(bodyStr) {
  let s = bodyStr;
  const guardPage =
    '{{#if request.query.page}}' +
    "{{#if (matches request.query.page.[0] '^[0-9]+$')}}" +
    '{{request.query.page.[0]}}' +
    '{{else}}0{{/if}}' +
    '{{else}}0{{/if}}';
  const guardSizePrefSize =
    '{{#if request.query.size}}' +
    "{{#if (matches request.query.size.[0] '^[0-9]+$')}}" +
    '{{request.query.size.[0]}}' +
    '{{else}}100{{/if}}' +
    '{{else}}100{{/if}}';
  const guardPageSizeOrSize =
    '{{#if request.query.pageSize}}' +
    "{{#if (matches request.query.pageSize.[0] '^[0-9]+$')}}" +
    '{{request.query.pageSize.[0]}}' +
    '{{else}}100{{/if}}' +
    `{{else}}${guardSizePrefSize}{{/if}}`;
  s = s.replace(/"pageNumber"\s*:\s*\d+/g, `"pageNumber": ${guardPage}`);
  s = s.replace(/"page"\s*:\s*\d+/g, `"page": ${guardPage}`);
  s = s.replace(/"pageSize"\s*:\s*\d+/g, `"pageSize": ${guardPageSizeOrSize}`);
  s = s.replace(/"size"\s*:\s*\d+/g, `"size": ${guardSizePrefSize}`);
  return s;
}

function mkBaseRequest(method, url, hasBody, opParams = []) {
  const req = {
    method,
    [url.kind]: url.value,
    headers: houseRuleHeadersForRequest(hasBody),
  };
  const qp = buildQueryParameters(opParams || []);
  if (qp) req.queryParameters = qp;
  return req;
}

// ---------- Fixture resolver (NEW) ----------
async function resolveFixture(group, opId, statusCode) {
  if (!opId) return null;
  const kebab = toKebab(opId);
  const rel = path.posix.join(
    FIXTURE_ROOT,
    group,
    `${kebab}-${statusCode}.json`,
  );
  const abs = path.join(WM_FILES_DIR, rel);
  if (await fileExists(abs)) return { rel, abs };
  return null;
}

// ---------- Optional “guard” emitters (OFF by default) ----------
async function emit400InvalidQuery(op, dir, m, url, seenPerOp) {
  const key = `${m} ${url.value} 400-guard-query`;
  if (seenPerOp.has(key)) return;
  const qp = buildQueryParameters(op.parameters || []);
  if (!qp) return;
  const mapping = {
    name: `${op.operationId || `${m} ${url.value}`} – 400 (invalid query)`,
    priority: 2,
    request: {
      method: m,
      [url.kind]: url.value,
      headers: houseRuleHeadersForRequest(!!op.requestBody),
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
  if (seenPerOp.has(key)) return;
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
  if (seenPerOp.has(key)) return;
  const baseReq = mkBaseRequest(m, url, !!op.requestBody, op.parameters || []);
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
  if (seenPerOp.has(key)) return;
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
  if (seenPerOp.has(key)) return;
  if (!op.requestBody) return;
  const mapping = {
    name: `${
      op.operationId || `${m} ${url.value}`
    } – 400 (missing body fields)`,
    priority: 2,
    request: {
      method: m,
      [url.kind]: url.value,
      headers: houseRuleHeadersForRequest(true),
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
    console.error(
      '[error] Spec has no paths. Check you fetched the right file.',
    );
    process.exit(2);
  }

  // Soft sanity: vendor presence (don’t fail if absent)
  const mediaKeys = new Set();
  for (const [, ops] of Object.entries(spec.paths)) {
    for (const [, op] of Object.entries(ops)) {
      const resp = (op && op.responses) || {};
      for (const r of Object.values(resp)) {
        if (r && r.content)
          Object.keys(r.content).forEach((k) => mediaKeys.add(k));
      }
      const rb = op && op.requestBody && op.requestBody.content;
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
  const emittedErrorKeys = new Set();

  for (const [p, ops] of Object.entries(spec.paths)) {
    for (const [method, op] of Object.entries(ops)) {
      const m = method.toUpperCase();
      if (!['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(m)) continue;

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
        if (!specErrorCodes.has(400))
          await emit400InvalidQuery(op, dir, m, url, seenPerOp);
        if (!specErrorCodes.has(400) && hasBody)
          await emit400MissingBodyFields(op, dir, m, url, seenPerOp);
        if (!specErrorCodes.has(401))
          await emit401MissingAuth(op, dir, m, url, seenPerOp);
        if (!specErrorCodes.has(403))
          await emit403ForbiddenDebug(op, dir, m, url, seenPerOp);
        if (!specErrorCodes.has(406))
          await emit406WrongAccept(op, dir, m, url, seenPerOp);
      }

      // Spec-declared error mappings (one per status per endpoint)
      for (const [codeStr] of Object.entries(op.responses || {})) {
        if (!/^[45]\d\d$/.test(String(codeStr))) continue;
        const code = Number(codeStr);
        const bodyFileName = ERROR_FILE_BY_STATUS[code];
        if (!bodyFileName) continue;

        const errKey = `${m} ${url.kind}:${url.value} ${code}`;
        if (emittedErrorKeys.has(errKey)) {
          log('skip duplicate error mapping:', errKey);
          continue;
        }

        const baseReq = mkBaseRequest(m, url, hasBody, op.parameters || []);
        const errReq = {
          ...baseReq,
          queryParameters: {
            ...(baseReq.queryParameters || {}),
            [`X-Debug-${code}`]: { equalTo: 'true' },
          },
        };

        const errMapping = {
          name: `${(op.operationId || `${m} ${p}`).replace(
            /\s+/g,
            ' ',
          )} – ${code}`,
          priority: 3,
          request: errReq,
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
        generatedErrors++;
        emittedErrorKeys.add(errKey);
        log('wrote error', errFile);
      }

      // Success (2xx) mapping — exactly one per endpoint
      const picked = pick2xxResponse(op.responses);
      if (!picked) {
        log(`skip ${m} ${p} (no 2xx response)`);
        continue;
      }
      const [statusCode, resp] = picked;
      const headers = houseRuleResponseHeaders(statusCode);

      // NEW: Prefer curated fixture if present
      let successResponse = {};
      const maybeFixture = await resolveFixture(
        group,
        op.operationId,
        statusCode,
      );
      if (maybeFixture && String(statusCode) !== '204') {
        // Use fixture file relative to __files/
        successResponse = {
          status: Number(statusCode),
          headers,
          transformers: ['response-template'],
          ...(STUB_DELAY_MS ? { fixedDelayMilliseconds: STUB_DELAY_MS } : {}),
          bodyFileName: maybeFixture.rel,
        };
        log(
          'using fixture',
          maybeFixture.rel,
          'for',
          op.operationId || `${m} ${p}`,
        );
      } else {
        // Fallback: example/schema-based body
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

      const successMapping = {
        name: (op.operationId || `${m} ${p}`).replace(/\s+/g, ' '),
        priority: 5,
        request: mkBaseRequest(m, url, hasBody, op.parameters || []),
        response: successResponse,
      };

      const file = path.join(
        dir,
        `${(
          op.operationId || `${m}_${slugPath(p)}`
        ).toLowerCase()}-${statusCode}.json`,
      );
      await safeWriteJson(file, successMapping);
      generated++;
      log('wrote success', file);
    }
  }

  if (!generated) {
    console.error(
      '[warn] No mappings were generated. Likely causes: wrong spec file, no 2xx responses, or all methods unsupported.',
    );
    process.exit(3);
  }

  console.log(
    `[ok] Generated ${generated} success mappings and ${generatedErrors} error mappings in ${MAPPINGS_DIR}`,
  );
}

main().catch((e) => {
  console.error('[error]', e);
  process.exit(1);
});
