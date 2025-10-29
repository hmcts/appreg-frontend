'use strict';

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');

const AdmZip = require('adm-zip');

function envOr(k, d) {
  return Object.hasOwn(process.env, k) ? process.env[k] : d;
}

const SPEC_VERSION = envOr('SPEC_VERSION', '0.0.1');
const POM = envOr('OPENAPI_POM', 'tools/openapi/pom.xml');
const OUT_DIR = envOr('OUT_DIR', 'tools/openapi/vendor/openapi');
const DEST_JAR = envOr('DEST_JAR', path.join(OUT_DIR, 'openapi.jar'));

async function ensureDir(p) {
  await fsp.mkdir(p, { recursive: true });
}

function runMaven() {
  const args = ['-q', '-f', POM, `-Dspec.version=${SPEC_VERSION}`, 'validate'];
  const res = spawnSync('mvn', args, { stdio: ['ignore', 'pipe', 'pipe'] });
  if (res.status !== 0) {
    process.stderr.write('[error] Maven fetch failed\n');
    process.stderr.write(res.stderr.toString() || '');
    process.exit(1);
  }
  process.stdout.write('[ok] Maven fetch completed\n');
}

function verifyAndUnpack() {
  if (!fs.existsSync(DEST_JAR)) {
    process.stderr.write(`[error] Expected jar not found: ${DEST_JAR}\n`);
    process.exit(1);
  }
  const zip = new AdmZip(DEST_JAR);
  const entries = zip.getEntries().map((e) => e.entryName);
  const spec = entries.find((e) => /(^|\/)openapi\.(ya?ml|json)$/i.test(e));
  if (!spec) {
    process.stderr.write(
      '[error] Spec not found in JAR (expected openapi.yaml|yml|json)\n',
    );
    process.stderr.write(`Contents:\n${entries.join('\n')}\n`);
    process.exit(1);
  }
  zip.extractAllTo(OUT_DIR, true);
  process.stdout.write(`[ok] Spec ready: ${path.join(OUT_DIR, spec)}\n`);
}

(async () => {
  await ensureDir(OUT_DIR);
  process.stdout.write(`[info] Using POM: ${POM}\n`);
  process.stdout.write(`[info] SPEC_VERSION: ${SPEC_VERSION}\n`);
  runMaven();
  verifyAndUnpack();
})().catch((e) => {
  process.stderr.write(`[error] ${e.message}\n`);
  process.exit(1);
});
