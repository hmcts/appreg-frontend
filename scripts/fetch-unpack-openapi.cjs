/* Fetch + unpack OpenAPI JAR without Maven.
   - SPEC_VERSION=latest (default) resolves the newest version from the feed
   - Keeps extracted folders, removes only META-INF and the JAR
*/

'use strict';

const fsp = require('node:fs/promises');
const https = require('node:https');
const path = require('node:path');

const AdmZip = require('adm-zip');

function envOr(k, d) {
  return Object.hasOwn(process.env, k) ? process.env[k] : d;
}

// Feed coords
const ORG = envOr('AZ_ORG', 'hmcts');
const PROJECT = envOr('AZ_PROJECT', 'Artifacts');
const FEED_ID = envOr('AZ_FEED_ID', '0bf8a9df-48b4-4295-9732-56b9e38f612a');
const GROUP_DOT = envOr('GROUP_PATH', 'uk.gov.hmcts.appregister'); // dot path
const ARTIFACT = envOr('ARTIFACT_ID', 'appreg-api');

const OUT_DIR = envOr('OUT_DIR', 'tools/openapi/vendor/openapi');
const SPEC_FILE_REGEX = /(^|\/)openapi\.(ya?ml|json)$/i;
const API_VER = '7.1-preview.1';

let SPEC_VERSION = envOr('SPEC_VERSION', 'latest');

function authHeaders() {
  if (process.env.SYSTEM_ACCESSTOKEN) {
    return { Authorization: `Bearer ${process.env.SYSTEM_ACCESSTOKEN}` };
  }
  if (process.env.AZURE_DEVOPS_PAT) {
    return {
      Authorization: `Basic ${Buffer.from(':' + process.env.AZURE_DEVOPS_PAT).toString('base64')}`,
    };
  }
  return {};
}

function httpGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers }, (res) => {
      const code = res.statusCode || 0;
      if (code >= 300 && code < 400 && res.headers.location) {
        res.resume();
        return resolve(httpGet(res.headers.location, headers));
      }
      if (code !== 200) {
        res.resume();
        return reject(
          new Error(`HTTP ${code} ${res.statusMessage} for ${url}`),
        );
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    });
    req.on('error', reject);
  });
}

function semverLikeDesc(a, b) {
  const pa = a.split('.').map((n) => Number.parseInt(n, 10));
  const pb = b.split('.').map((n) => Number.parseInt(n, 10));
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

async function resolveLatestVersion() {
  // Packages API
  const url =
    `https://pkgs.dev.azure.com/${ORG}/${PROJECT}/_apis/packaging/feeds/${FEED_ID}` +
    `/packages?protocolType=maven&packageNameQuery=${encodeURIComponent(ARTIFACT)}` +
    `&includeAllVersions=true&api-version=${API_VER}`;
  try {
    const buf = await httpGet(url, authHeaders());
    const json = JSON.parse(buf.toString('utf8'));
    const pkg = (json.value || [])[0];
    const list = pkg && pkg.versions ? pkg.versions : [];
    const flagged = list.find(
      (v) => v.isLatest === true || v.isLatestStable === true,
    );
    if (flagged && flagged.version) {
      return flagged.version;
    }
    const versions = list
      .map((v) => v.version)
      .filter(Boolean)
      .sort(semverLikeDesc);
    if (!versions.length) {
      throw new Error('no versions');
    }
    return versions[0];
  } catch (e) {
    // Fallback to Maven (This doesn't work on the Jenkins pipeline)
    process.stdout.write(`[info] Failed to fetch. Trying MAVEN fetch: ${e}\n`);
    const groupSlash = GROUP_DOT.replaceAll('.', '/');
    const meta = `https://pkgs.dev.azure.com/${ORG}/${PROJECT}/_packaging/${FEED_ID}/maven/v1/${groupSlash}/${ARTIFACT}/maven-metadata.xml`;
    const xml = (await httpGet(meta, authHeaders())).toString('utf8');
    const rel = /<release>\s*([^<]+)\s*<\/release>/i.exec(xml);
    if (rel && rel[1]) {
      return rel[1].trim();
    }
    const matches = [...xml.matchAll(/<version>\s*([^<]+)\s*<\/version>/gi)]
      .map((m) => m[1].trim())
      .sort(semverLikeDesc);
    if (!matches.length) {
      throw new Error('no <version> entries');
    }
    return matches[0];
  }
}

async function cleanOutDir() {
  const p = path.resolve(OUT_DIR);
  if (!p.includes(`${path.sep}openapi${path.sep}`)) {
    throw new Error(`Refusing to delete non-openapi path: ${p}`);
  }
  await fsp.rm(p, { recursive: true, force: true }); // remove old/stale files
  await fsp.mkdir(p, { recursive: true });
}

async function main() {
  await cleanOutDir();

  if (!SPEC_VERSION || SPEC_VERSION.toLowerCase() === 'latest') {
    process.stdout.write('[info] Resolving latest SPEC_VERSION from feed…\n');
    SPEC_VERSION = await resolveLatestVersion();
    process.stdout.write(`[ok] Latest version: ${SPEC_VERSION}\n`);
  } else {
    process.stdout.write(`[info] Using SPEC_VERSION: ${SPEC_VERSION}\n`);
  }

  const jarUrl =
    `https://pkgs.dev.azure.com/${ORG}/${PROJECT}` +
    `/_apis/packaging/feeds/${FEED_ID}/maven/${GROUP_DOT}/${ARTIFACT}/${SPEC_VERSION}` +
    `/${ARTIFACT}-${SPEC_VERSION}-openapi.jar/content?api-version=${API_VER}`;

  const jarPath = path.join(OUT_DIR, `${ARTIFACT}-${SPEC_VERSION}-openapi.jar`);
  process.stdout.write(`[info] Downloading: ${jarUrl}\n`);
  const jarBuf = await httpGet(jarUrl, authHeaders());
  await fsp.writeFile(jarPath, jarBuf);

  const zip = new AdmZip(jarPath);
  const entries = zip.getEntries().map((e) => e.entryName);
  const hasSpec = entries.some((e) => SPEC_FILE_REGEX.test(e));
  if (!hasSpec) {
    process.stderr.write(
      '[error] Spec not found in JAR (expected openapi.yaml|yml|json)\n',
    );
    process.stderr.write(`Contents:\n${entries.join('\n')}\n`);
    process.exit(1);
  }

  zip.extractAllTo(OUT_DIR, true);
  await fsp.rm(path.join(OUT_DIR, 'META-INF'), {
    recursive: true,
    force: true,
  });
  await fsp.rm(jarPath, { force: true });

  process.stdout.write(`[ok] Extracted to: ${OUT_DIR}\n`);
}

main().catch((e) => {
  process.stderr.write(`[error] ${e.message}\n`);
  process.exit(1);
});
