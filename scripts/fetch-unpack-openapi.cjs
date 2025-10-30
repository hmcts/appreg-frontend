/* 
Script to fetch and decompress jar file containing OpenAPI specs
------------------------------------
IMPORTANT:
SPEC_VERSION must match version in azure artifacts
------------------------------------
*/

'use strict';

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');

const AdmZip = require('adm-zip');

function envOr(k, d) {
  return Object.hasOwn(process.env, k) ? process.env[k] : d;
}

const SPEC_VERSION = envOr('SPEC_VERSION', '0.1.2');
const POM = envOr('OPENAPI_POM', 'tools/openapi/pom.xml');
const OUT_DIR = envOr('OUT_DIR', 'tools/openapi/vendor/openapi');
const DEST_JAR = envOr('DEST_JAR', path.join(OUT_DIR, 'openapi.jar'));

async function ensureDir(p) {
  await fsp.mkdir(p, { recursive: true });
}

function runMaven() {
  /* 
  Using tools/openapi/pom.xml, download openapi.jar
  */
  const args = ['-q', '-f', POM, `-Dspec.version=${SPEC_VERSION}`, 'validate'];
  const res = spawnSync('mvn', args, { stdio: ['ignore', 'pipe', 'pipe'] });
  if (res.status !== 0) {
    process.stderr.write('[error] Maven fetch failed\n');
    process.stderr.write(res.stderr.toString() || '');
    process.exit(1);
  }
  process.stdout.write('[ok] Maven fetch completed\n');
}

async function verifyAndUnpack() {
  /* 
  Unpack downloaded Jar file
  */
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

  // Delete jar + META-INF
  try {
    await fsp.rm(path.join(OUT_DIR, 'META-INF'), {
      recursive: true,
      force: true,
    });
  } catch (e) {
    process.stderr.write(`[warn] Could not delete META-INF: ${e.message}\n`);
  }

  try {
    await fsp.rm(DEST_JAR, { force: true });
    process.stdout.write(`[ok] Removed jar: ${DEST_JAR}\n`);
  } catch (e) {
    process.stderr.write(`[warn] Could not delete jar: ${e.message}\n`);
  }
}

(async () => {
  // Ensure we clean up dir before download
  await fsp.rm(OUT_DIR, { recursive: true, force: true });
  await ensureDir(OUT_DIR);
  process.stdout.write(`[info] Using POM: ${POM}\n`);
  process.stdout.write(`[info] SPEC_VERSION: ${SPEC_VERSION}\n`);
  runMaven();
  await verifyAndUnpack();
})().catch((e) => {
  process.stderr.write(`[error] ${e.message}\n`);
  process.exit(1);
});
