#!/usr/bin/env node
'use strict';

/**
 * Generate WireMock mappings from an OpenAPI spec previously fetched by the team's fetch script.
 * - Reads tools/openapi/vendor/openapi/openapi.(yaml|yml|json)
 * - Emits mappings under ./mappings/<firstTag or misc>/
 * - Applies "house rules" (vendor Accept, Authorization, Content-Type, response-template)
 * - Adds Handlebars guards for pagination fields so NaN or missing values default safely
 *
 * Usage:
 *   node tools/openapi/gen-wiremock-mappings.cjs
 *
 * Env:
 *   VENDOR_ACCEPT=application/vnd.hmcts.appreg.v1+json (default)
 *   STUB_DELAY_MS=100 (optional fixed delay)
 */

const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const YAML = require('yaml');
const Ajv = require('ajv');
const jsf = require('json-schema-faker');

const SPEC_DIR = 'tools/openapi/vendor/openapi';
const MAPPINGS_DIR = 'wiremock/mappings';
const DEFAULT_VENDOR = process.env.VENDOR_ACCEPT || 'application/vnd.hmcts.appreg.v1+json';
const STUB_DELAY_MS = Number.parseInt(process.env.STUB_DELAY_MS || '0', 10) || undefined;

// JSON Schema Faker setup
const ajv = new Ajv({ strict: false, allowUnionTypes: true });
jsf.option({ alwaysFakeOptionals: true, useDefaultValue: true });
jsf.option({ fillProperties: true, minItems: 1, maxItems: 3 });
jsf.extend('ajv', () => ajv);

/* ---------------- helpers ---------------- */

async function readSpec() {
  const files = await fsp.readdir(SPEC_DIR);
  const specName = files.find(f => /^openapi\.(ya?ml|json)$/i.test(f));
  if (!specName) {
    throw new Error(`openapi.(yaml|yml|json) not found in ${SPEC_DIR}`);
  }
  const raw = await fsp.readFile(path.join(SPEC_DIR, specName), 'utf8');
  return /\.ya?ml$/i.test(specName) ? YAML.parse(raw) : JSON.parse(raw);
}

function toGroup(op) {
  const tags = (op && Array.isArray(op.tags) && op.tags.length) ? op.tags : ['misc'];
  return String(tags[0]).replace(/\s+/g, '-').toLowerCase();
}

function slugPath(p) {
  return p.replace(/^\/+/, '').replace(/\/+/g, '_').replace(/[{}]/g, '');
}

function pathToUrlMatcher(p) {
  // If path has params, use a conservative regex per segment
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
  const any2xx = Object.keys(responses).find(c => /^2\d\d$/.test(c));
  return any2xx ? [any2xx, responses[any2xx]] : null;
}

function pickJsonMedia(content) {
  if (!content) return null;
  const keys = Object.keys(content);
  // prefer vendor +json, then application/json, then anything */json
  let key = keys.find(k => /\+json$/i.test(k))
    || keys.find(k => /^application\/json$/i.test(k))
    || keys.find(k => /\/json$/i.test(k) || /json/i.test(k));
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
      matches: '(application/vnd\\.hmcts\\.appreg\\.v[0-9]+\\+json|application/json|application/.+\\+json)',
    };
  }
  return headers;
}

function houseRuleResponseHeaders(statusCode) {
  // For 204 no-body response, don't force a Content-Type
  if (String(statusCode) === '204') {
    return { Vary: 'Accept' };
  }
  return {
    'Content-Type': DEFAULT_VENDOR,
    'Vary': 'Accept',
  };
}

function buildQueryParameters(parameters = []) {
  const qp = {};
  for (const p of parameters) {
    if (p.in !== 'query') continue;
    const schema = p.schema || {};
    let matcher = '.+';
    if (schema.type === 'integer' || schema.type === 'number') matcher = '^[0-9]+$';
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
  return req.map(name => ({ matchesJsonPath: `$.${name}` }));
}

async function exampleFromSchemaOrGenerate(media) {
  // prefer explicit example(s)
  if (media?.example) return media.example;
  if (media?.examples) {
    const firstKey = Object.keys(media.examples)[0];
    if (firstKey && media.examples[firstKey]?.value) {
      return media.examples[firstKey].value;
    }
  }
  // else generate from schema
  if (media?.schema) {
    try {
      return await jsf.resolve(media.schema);
    } catch {
      // fall through
    }
  }
  return {}; // last resort
}

/**
 * Add Handlebars guards for common pagination fields so bad inputs (e.g., page=NaN) default safely.
 * We do simple, targeted replacements on JSON text so resulting values are unquoted expressions.
 */
function applyListGuardsIfLooksPaged(bodyStr) {
  let s = bodyStr;

  const guardPage =
    `{{#if request.query.page}}` +
    `{{#if (matches request.query.page.[0] '^[0-9]+$')}}` +
    `{{request.query.page.[0]}}` +
    `{{else}}0{{/if}}` +
    `{{else}}0{{/if}}`;

  const guardPageSizePrefSize =
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
    `{{else}}${guardPageSizePrefSize}{{/if}}`;

  // Replace page / pageNumber defaults
  s = s.replace(/"pageNumber"\s*:\s*\d+/g, `"pageNumber": ${guardPage}`);
  s = s.replace(/"page"\s*:\s*\d+/g, `"page": ${guardPage}`);

  // Replace size / pageSize defaults (do pageSize first to avoid catching its "size" substring)
  s = s.replace(/"pageSize"\s*:\s*\d+/g, `"pageSize": ${guardPageSizeOrSize}`);
  s = s.replace(/"size"\s*:\s*\d+/g, `"size": ${guardPageSizePrefSize}`);

  return s;
}

/* ---------------- main generation ---------------- */

async function main() {
  const spec = await readSpec();
  await ensureDir(MAPPINGS_DIR);

  const paths = spec.paths || {};
  for (const [p, ops] of Object.entries(paths)) {
    for (const [method, op] of Object.entries(ops)) {
      const m = method.toUpperCase();
      if (!['GET','POST','PUT','PATCH','DELETE'].includes(m)) continue;

      const group = toGroup(op || {});
      const url = pathToUrlMatcher(p);

      const hasBody = !!op.requestBody;
      const headers = houseRuleHeadersForRequest(hasBody);
      const queryParameters = buildQueryParameters(op.parameters || []);
      const bodyPatterns = buildBodyPatterns(op.requestBody);

      const picked = pick2xxResponse(op.responses);
      if (!picked) continue;
      const [statusCode, resp] = picked;

      const responseHeaders = houseRuleResponseHeaders(statusCode);

      let responseBodyStr = '';
      if (String(statusCode) !== '204') {
        const json = pickJsonMedia(resp.content || {}) || [];
        const media = json[1];
        const example = media ? await exampleFromSchemaOrGenerate(media) : {};
        responseBodyStr = bodyJsonString(example);
        responseBodyStr = applyListGuardsIfLooksPaged(responseBodyStr);
      }

      const name = (op.operationId || `${m} ${p}`).replace(/\s+/g, ' ');
      const mapping = {
        name,
        priority: 5,
        request: {
          method: m,
          [url.kind]: url.value,
          headers
        },
        response: {
          status: Number(statusCode),
          headers: responseHeaders,
          transformers: ['response-template'],
          ...(STUB_DELAY_MS ? { fixedDelayMilliseconds: STUB_DELAY_MS } : {}),
          ...(String(statusCode) === '204' ? {} : { body: responseBodyStr })
        }
      };

      if (queryParameters) mapping.request.queryParameters = queryParameters;
      if (bodyPatterns) mapping.request.bodyPatterns = bodyPatterns;

      const dir = path.join(MAPPINGS_DIR, group);
      await ensureDir(dir);
      const file = path.join(
        dir,
        `${(op.operationId || `${m}_${slugPath(p)}`).toLowerCase()}-${statusCode}.json`
      );
      await fsp.writeFile(file, JSON.stringify(mapping, null, 2) + '\n', 'utf8');
    }
  }

  process.stdout.write(`[ok] Generated WireMock mappings in ${MAPPINGS_DIR}\n`);
}

main().catch(e => {
  console.error('[error]', e);
  process.exit(1);
});
