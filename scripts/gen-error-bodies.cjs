#!/usr/bin/env node
'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const YAML = require('yaml');

// Where the response components live in your repo
const RESP_DIR = 'tools/openapi/vendor/openapi/components/responses';
// Where you want the reusable JSON bodies to go
const OUT_DIR = 'wiremock/__files/errors';

// Map spec filenames → output file + HTTP status + default title
const MAP = {
  'bad-request-error.yaml':            { out: 'bad-request.json',            status: 400, title: 'Bad Request' },
  'unauthorized-error.yaml':           { out: 'unauthorized.json',           status: 401, title: 'Unauthorized' },
  'forbidden-error.yaml':              { out: 'forbidden.json',              status: 403, title: 'Forbidden' },
  'not-found-error.yaml':              { out: 'not-found.json',              status: 404, title: 'Not Found' },
  'not-acceptable-error.yaml':         { out: 'not-acceptable.json',         status: 406, title: 'Not Acceptable' },
  'conflict-error.yaml':               { out: 'conflict.json',               status: 409, title: 'Conflict' },
  'payload-too-large-error.yaml':      { out: 'payload-too-large.json',      status: 413, title: 'Payload Too Large' },
  'unsupported-media-type-error.yaml': { out: 'unsupported-media-type.json', status: 415, title: 'Unsupported Media Type' },
  'internal-server-error.yaml':        { out: 'internal-server-error.json',  status: 500, title: 'Internal Server Error' },
};

function tmplBody({ title, status }) {
  // WireMock response-template placeholders work inside body files too
  return JSON.stringify({
    type: "about:blank",
    title,
    status,
    detail: "{{request.query.detail default=''}}",
    path: "{{request.path}}",
    timestamp: "{{now format=\"yyyy-MM-dd'T'HH:mm:ssXXX\"}}",
    traceId: "{{randomValue length=12 type='ALPHANUMERIC'}}"
  }, null, 2) + "\n";
}

(async () => {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const files = await fs.readdir(RESP_DIR);

  let written = 0;
  for (const f of files) {
    if (!MAP[f]) continue;

    const full = path.join(RESP_DIR, f);
    const raw = await fs.readFile(full, 'utf8');
    const y = YAML.parse(raw) || {};

    // Prefer the spec's description as the title if present
    const title = (y.description && String(y.description).trim()) || MAP[f].title;
    const status = MAP[f].status;

    const outPath = path.join(OUT_DIR, MAP[f].out);
    await fs.writeFile(outPath, tmplBody({ title, status }), 'utf8');
    written++;
    console.log(`[ok] wrote ${outPath}`);
  }

  if (!written) {
    console.warn('[warn] No error bodies were generated. Check RESP_DIR path or MAP keys.');
    process.exitCode = 2;
  }
})();
