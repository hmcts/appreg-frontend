#!/usr/bin/env node
'use strict';

/**
 * Generate WireMock mappings from an OpenAPI spec.
 *
 * - Looks for SPEC_PATH (env) or tools/openapi/vendor/openapi/openapi.(yaml|yml|json)
 * - If not found, falls back to the first *.yaml|*.yml|*.json in that folder
 * - Emits files under ./mappings/<firstTag|misc>/
 * - Adds Accept/Authorization/Content-Type guards
 * - Adds pagination guards (page / size / pageNumber / pageSize) so NaN/missing becomes 0/100
 *
 * Env:
 *   SPEC_PATH=tools/openapi/vendor/openapi/openapi.yaml  # optional explicit override
 *   SPEC_DIR=tools/openapi/vendor/openapi                # folder to search if SPEC_PATH is not set
 *   MAPPINGS_DIR=mappings                                # output dir (default: mappings)
 *   VENDOR_ACCEPT=application/vnd.hmcts.appreg.v1+json   # default response + Accept matcher
 *   STUB_DELAY_MS=100                                    # optional fixed delay
 *   DEBUG_GEN=1                                          # extra logging
 */

const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const YAML = require('yaml');
const Ajv = require('ajv');
const jsf = require('json-schema-faker');
const $RefParser = require('@apidevtools/json-schema-ref-parser');

const SPEC_PATH = 'tools/openapi/vendor/openapi/openapi.yaml';
const SPEC_DIR = 'tools/openapi/vendor/openapi';
const MAPPINGS_DIR = 'wiremock/mappings';
const DEFAULT_VENDOR = 'application/vnd.hmcts.appreg.v1+json';
const STUB_DELAY_MS = Number.parseInt('0', 10);
const DEBUG = false;

// JSON Schema Faker setup
const ajv = new Ajv({ strict: false, allowUnionTypes: true });
jsf.option({
  alwaysFakeOptionals: true,
  useDefaultValue: true,
  fillProperties: true,
});
jsf.option({ minItems: 1, maxItems: 3 });
jsf.extend('ajv', () => ajv);

// --- Sanity checks -----------------------------------------------------------
function summarize(opCount, spec) {
  const ver = String(spec.openapi || spec.swagger || 'unknown');
  return `openapi=${ver} paths=${
    Object.keys(spec.paths || {}).length
  } ops=${opCount}`;
}

/** Fail early if the spec looks wrong */
function sanityCheckSpec(spec, { vendor = DEFAULT_VENDOR } = {}) {
  const problems = [];

  const ver = String(spec.openapi || spec.swagger || '');
  if (!/^3\./.test(ver))
    problems.push(`Unexpected OpenAPI version "${ver}" (expected 3.x).`);

  if (!spec.info?.title || !spec.info?.version) {
    problems.push('Missing info.title or info.version.');
  }

  if (!spec.paths || !Object.keys(spec.paths).length) {
    problems.push('Spec has zero paths.');
  }

  // Optional: ensure the vendor media type appears at least once
  const hasVendor = JSON.stringify(spec).includes(vendor);
  if (!hasVendor) {
    problems.push(
      `Vendor media type "${vendor}" not found anywhere in spec content types.`,
    );
  }

  // Optional: verify a few expected operations (configurable via env)
  const expected = (process.env.EXPECT_ROUTES || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean); // e.g. "GET /court-locations,GET /criminal-justice-areas"

  for (const item of expected) {
    const m = item.split(/\s+/)[0]?.toLowerCase();
    const route = item.replace(/^\S+\s+/, '');
    if (!m || !route) continue;
    if (!spec.paths?.[route]?.[m]) {
      problems.push(`Missing expected operation: ${m.toUpperCase()} ${route}`);
    }
  }

  if (problems.length) {
    console.error('[sanity] Spec check failed:\n- ' + problems.join('\n- '));
    process.exit(4);
  }
}

/** Ensure we actually wrote valid JSON mappings */
async function sanityCheckOutput(dir, { min = 1 } = {}) {
  async function listJsonFiles(root) {
    const out = [];
    const stack = [root];
    while (stack.length) {
      const d = stack.pop();
      const ents = await fsp.readdir(d, { withFileTypes: true });
      for (const ent of ents) {
        const p = path.join(d, ent.name);
        if (ent.isDirectory()) stack.push(p);
        else if (ent.isFile() && /\.json$/i.test(ent.name)) out.push(p);
      }
    }
    return out;
  }

  // dir must exist and be writable
  try {
    await fsp.mkdir(dir, { recursive: true });
    await fsp.access(dir, fs.constants.W_OK);
  } catch {
    console.error(`[sanity] Output directory not writable: ${dir}`);
    process.exit(5);
  }

  const files = await listJsonFiles(dir);
  if (files.length < min) {
    console.error(
      `[sanity] Expected at least ${min} mapping(s), found ${files.length} in ${dir}`,
    );
    process.exit(6);
  }

  for (const f of files) {
    try {
      JSON.parse(await fsp.readFile(f, 'utf8'));
    } catch (e) {
      console.error(`[sanity] Invalid JSON in mapping: ${f}\n${e.message}`);
      process.exit(7);
    }
  }

  if (process.env.DEBUG_GEN === '1') {
    console.log(`[sanity] Output OK (${files.length} files) in ${dir}`);
  }
}

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
  // prefer openapi.*
  let chosen = entries.find((f) => /^openapi\.(ya?ml|json)$/i.test(f));
  if (!chosen) {
    // fallback: first .yaml/.yml/.json
    chosen = entries.find((f) => /\.(ya?ml|json)$/i.test(f));
  }
  if (!chosen) throw new Error(`No spec files found in ${dir}`);
  return path.join(dir, chosen);
}

async function readSpec() {
  const p = await findSpecPath();
  const abs = path.resolve(p);
  try {
    const deref = await $RefParser.dereference(abs, {
      dereference: { circular: 'ignore' },
    });
    if (!deref || typeof deref !== 'object') {
      throw new Error('Parsed spec empty');
    }
    return deref;
  } catch (e) {
    throw new Error(`Failed to load/deref spec (${abs}): ${e.message}`);
  }
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
  let key =
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
    let matcher = '.+';
    if (schema.type === 'integer' || schema.type === 'number')
      matcher = '^[0-9]+$';
    if (schema.format === 'date') matcher = '^\\d{4}-\\d{2}-\\d{2}$';
    qp[p.name] = p.required ? { matches: matcher } : { matches: '.*' };
  }
  return Object.keys(qp).length ? qp : undefined;
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

async function main() {
  const spec = await readSpec();
  sanityCheckSpec(spec, { vendor: DEFAULT_VENDOR });

  if (!spec.paths || !Object.keys(spec.paths).length) {
    console.error(
      '[error] Spec has no paths. Check you fetched the right file.',
    );
    process.exit(2);
  }
  log('paths:', Object.keys(spec.paths).length);

  await ensureDir(MAPPINGS_DIR);

  let generated = 0;
  for (const [p, ops] of Object.entries(spec.paths)) {
    for (const [method, op] of Object.entries(ops)) {
      const m = method.toUpperCase();
      if (!['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(m)) continue;

      const group = toGroup(op || {});
      const url = pathToUrlMatcher(p);
      const hasBody = !!op.requestBody;
      const headers = houseRuleHeadersForRequest(hasBody);
      const queryParameters = buildQueryParameters(op.parameters || []);
      const bodyPatterns = buildBodyPatterns(op.requestBody);

      const picked = pick2xxResponse(op.responses);
      if (!picked) {
        log(`skip ${m} ${p} (no 2xx response)`);
        continue;
      }
      const [statusCode, resp] = picked;

      const responseHeaders = houseRuleResponseHeaders(statusCode);

      let responseBodyStr = '';
      if (String(statusCode) !== '204') {
        const json = pickJsonMedia(resp.content || {}) || [];
        const media = json[1];
        const example = media ? await exampleFromSchemaOrGenerate(media) : {};
        responseBodyStr = applyListGuardsIfLooksPaged(bodyJsonString(example));
      }

      const name = (op.operationId || `${m} ${p}`).replace(/\s+/g, ' ');
      const mapping = {
        name,
        priority: 5,
        request: {
          method: m,
          [url.kind]: url.value,
          headers,
        },
        response: {
          status: Number(statusCode),
          headers: responseHeaders,
          transformers: ['response-template'],
          ...(STUB_DELAY_MS ? { fixedDelayMilliseconds: STUB_DELAY_MS } : {}),
          ...(String(statusCode) === '204' ? {} : { body: responseBodyStr }),
        },
      };
      if (queryParameters) mapping.request.queryParameters = queryParameters;
      if (bodyPatterns) mapping.request.bodyPatterns = bodyPatterns;

      const dir = path.join(MAPPINGS_DIR, group);
      await ensureDir(dir);
      const file = path.join(
        dir,
        `${(
          op.operationId || `${m}_${slugPath(p)}`
        ).toLowerCase()}-${statusCode}.json`,
      );
      await fsp.writeFile(
        file,
        JSON.stringify(mapping, null, 2) + '\n',
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
  await sanityCheckOutput(MAPPINGS_DIR, {
    min: Number(process.env.MIN_MAPPINGS || 1),
  });

  console.log(
    `[ok] Generated ${generated} WireMock mappings in ${MAPPINGS_DIR}`,
  );
}

main().catch((e) => {
  console.error('[error]', e);
  process.exit(1);
});
