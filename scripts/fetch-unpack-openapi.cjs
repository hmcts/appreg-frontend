/* 
Fetch + unpack OpenAPI JAR using helper POM.
Auto-resolve SPEC_VERSION from Azure Artifacts when set to "latest" or unset.
Works with anonymous feed or OAuth/PAT if later required.
*/

'use strict';

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const https = require('node:https');
const path = require('node:path');

const AdmZip = require('adm-zip');

function envOr(k, d) {
  return Object.hasOwn(process.env, k) ? process.env[k] : d;
}

const ORG = envOr('AZ_ORG', 'hmcts');
const PROJECT = envOr('AZ_PROJECT', 'Artifacts');
const FEED_ID = envOr('AZ_FEED_ID', '0bf8a9df-48b4-4295-9732-56b9e38f612a');
const GROUP_PATH = envOr('GROUP_PATH', 'uk.gov.hmcts.appregister');
const ARTIFACT_ID = envOr('ARTIFACT_ID', 'appreg-api');

// File layout
const POM = envOr('OPENAPI_POM', 'tools/openapi/pom.xml');
const OUT_DIR = envOr('OUT_DIR', 'tools/openapi/vendor/openapi');
const DEST_JAR = envOr('DEST_JAR', path.join(OUT_DIR, 'openapi.jar'));
let SPEC_VERSION = envOr('SPEC_VERSION', 'latest');

// HTTP helpers
function httpGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers }, (res) => {
      const { statusCode, headers: h } = res;
      if (statusCode >= 300 && statusCode < 400 && h.location) {
        res.resume();
        return resolve(httpGet(h.location, headers));
      }
      if (statusCode !== 200) {
        res.resume();
        return reject(new Error(`HTTP ${statusCode} for ${url}`));
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    });
    req.on('error', reject);
  });
}

function authHeaders() {
  // Prefer pipeline OAuth if available, else PAT, else none
  if (process.env.SYSTEM_ACCESSTOKEN) {
    return { Authorization: `Bearer ${process.env.SYSTEM_ACCESSTOKEN}` };
  }
  if (process.env.AZURE_DEVOPS_PAT) {
    const b64 = Buffer.from(`:${process.env.AZURE_DEVOPS_PAT}`).toString(
      'base64',
    );
    return { Authorization: `Basic ${b64}` };
  }
  return {};
}

// Version resolvers
async function resolveLatestFromPackagesApi() {
  const url =
    `https://pkgs.dev.azure.com/${ORG}/${PROJECT}/_apis/packaging/feeds/${FEED_ID}` +
    `/packages?protocolType=maven&packageNameQuery=${encodeURIComponent(ARTIFACT_ID)}` +
    '&includeAllVersions=true&api-version=7.1-preview.1';
  const buf = await httpGet(url, authHeaders());
  const json = JSON.parse(buf.toString('utf8'));
  const pkg = (json.value || [])[0];
  if (!pkg || !pkg.versions || !pkg.versions.length) {
    throw new Error('No versions found via packages API');
  }
  const flagged = pkg.versions.find(
    (v) => v.isLatest === true || v.isLatestStable === true,
  );
  if (flagged && flagged.version) {
    return flagged.version;
  }
  const versions = pkg.versions.map((v) => v.version).filter(Boolean);
  versions.sort(semverLikeDesc);
  return versions[0];
}

async function resolveLatestFromMavenMetadata() {
  const groupSlashed = GROUP_PATH.replace(/\./g, '/');
  const url = `https://pkgs.dev.azure.com/${ORG}/${PROJECT}/_packaging/${FEED_ID}/maven/v1/${groupSlashed}/${ARTIFACT_ID}/maven-metadata.xml`;
  const xml = (await httpGet(url, authHeaders())).toString('utf8');

  const rel = /<release>\s*([^<]+)\s*<\/release>/i.exec(xml);
  if (rel && rel[1]) {
    return rel[1].trim();
  }
  const matches = [...xml.matchAll(/<version>\s*([^<]+)\s*<\/version>/gi)].map(
    (m) => m[1].trim(),
  );
  if (!matches.length) {
    throw new Error('No <version> entries in maven-metadata.xml');
  }
  matches.sort(semverLikeDesc);
  return matches[0];
}

function semverLikeDesc(a, b) {
  const pa = a.split('.').map((n) => parseInt(n, 10));
  const pb = b.split('.').map((n) => parseInt(n, 10));
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const ai = Number.isFinite(pa[i]) ? pa[i] : 0;
    const bi = Number.isFinite(pb[i]) ? pb[i] : 0;
    if (ai !== bi) {
      return bi - ai;
    }
  }

  return b.localeCompare(a);
}

async function resolveLatestSpecVersion() {
  // Try JSON API. Fall back to Maven metadata.
  try {
    return await resolveLatestFromPackagesApi();
  } catch (error__) {
    try {
      return await resolveLatestFromMavenMetadata();
    } catch (error_) {
      const msg = `[error] Could not determine latest version. API: ${error__.message}. Metadata: ${error_.message}\n`;
      process.stderr.write(msg);
      process.exit(1);
    }
  }
}

// Maven + unpack
function runMaven(specVersion) {
  const args = ['-q', '-f', POM, `-Dspec.version=${specVersion}`, 'validate'];
  const res = spawnSync('mvn', args, { stdio: ['ignore', 'pipe', 'pipe'] });
  if (res.status !== 0) {
    process.stderr.write('[error] Maven fetch failed\n');
    process.stderr.write((res.stderr && res.stderr.toString()) || '');
    process.exit(1);
  }
  process.stdout.write('[ok] Maven fetch completed\n');
}

async function verifyExtractAndCleanup() {
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

  // cleanup META-INF and the jar
  await fsp.rm(path.join(OUT_DIR, 'META-INF'), {
    recursive: true,
    force: true,
  });
  await fsp.rm(DEST_JAR, { force: true });
  process.stdout.write(`[ok] Spec ready in: ${OUT_DIR}\n`);
}

(async () => {
  await fsp.rm(OUT_DIR, { recursive: true, force: true }); // clean to avoid stale files
  await fsp.mkdir(OUT_DIR, { recursive: true });

  if (!SPEC_VERSION || SPEC_VERSION.toLowerCase() === 'latest') {
    process.stdout.write('[info] Resolving latest SPEC_VERSION from feed…\n');
    SPEC_VERSION = await resolveLatestSpecVersion();
    process.stdout.write(`[ok] Latest version: ${SPEC_VERSION}\n`);
  } else {
    process.stdout.write(`[info] Using SPEC_VERSION: ${SPEC_VERSION}\n`);
  }

  runMaven(SPEC_VERSION);
  await verifyExtractAndCleanup();
})().catch((e) => {
  process.stderr.write(`[error] ${e.message}\n`);
  process.exit(1);
});
