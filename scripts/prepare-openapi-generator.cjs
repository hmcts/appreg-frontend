'use strict';

const fsp = require('node:fs/promises');
const https = require('node:https');
const os = require('node:os');
const path = require('node:path');

const DEFAULT_MIRROR_URL =
  'https://pkgs.dev.azure.com/hmcts/Artifacts/_packaging/temp-maven-central-mirror/maven/v1';
const GROUP_ID = 'org.openapitools';
const ARTIFACT_ID = 'openapi-generator-cli';
const CONFIG_PATH = 'openapitools.json';

function readJson(filePath) {
  return fsp.readFile(filePath, 'utf8').then((content) => JSON.parse(content));
}

function pathFromGroupId(groupId) {
  return groupId.replaceAll('.', '/');
}

function buildMirrorDownloadUrl({
  mirrorUrl = DEFAULT_MIRROR_URL,
  groupId = GROUP_ID,
  artifactId = ARTIFACT_ID,
  version,
}) {
  if (!version) {
    throw new Error('Missing OpenAPI generator version');
  }

  const normalizedMirrorUrl = mirrorUrl.replace(/\/+$/, '');
  const groupPath = pathFromGroupId(groupId);

  return (
    `${normalizedMirrorUrl}/${groupPath}/${artifactId}/${version}` +
    `/${artifactId}-${version}.jar`
  );
}

function createBasicAuthHeader(token, username = 'jenkins') {
  return `Basic ${Buffer.from(`${username}:${token}`).toString('base64')}`;
}

function getAuthToken(env = process.env) {
  return env.ADO_MAVEN_PAT || env.AZURE_DEVOPS_PAT || '';
}

function resolveStorageDir(config, cwd = process.cwd()) {
  const configured =
    config['generator-cli'] && config['generator-cli'].storageDir;

  if (configured) {
    const expanded = configured.startsWith('~')
      ? path.join(os.homedir(), configured.slice(1))
      : configured;

    return path.resolve(cwd, expanded);
  }

  const packageJsonPath = require.resolve(
    '@openapitools/openapi-generator-cli/package.json',
    { paths: [cwd] },
  );

  return path.join(path.dirname(packageJsonPath), 'versions');
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
          new Error(`HTTP ${code} ${res.statusMessage || ''}`.trim()),
        );
      }

      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    });

    req.on('error', reject);
  });
}

async function fileExists(filePath) {
  try {
    const stat = await fsp.stat(filePath);
    return stat.isFile() && stat.size > 0;
  } catch (e) {
    if (e && e.code === 'ENOENT') {
      return false;
    }

    throw e;
  }
}

async function downloadGenerator({
  config,
  cwd = process.cwd(),
  env = process.env,
}) {
  const generatorConfig = config['generator-cli'] || {};
  const version = generatorConfig.version;

  if (!version) {
    throw new Error('Missing generator-cli.version in openapitools.json');
  }

  const storageDir = resolveStorageDir(config, cwd);
  const jarPath = path.join(storageDir, `${version}.jar`);

  if (await fileExists(jarPath)) {
    process.stdout.write(
      `[info] OpenAPI generator ${version} already cached\n`,
    );
    return jarPath;
  }

  const token = getAuthToken(env);

  if (!token) {
    process.stdout.write(
      '[info] ADO_MAVEN_PAT not set; openapi-generator-cli will download the generator if needed\n',
    );
    return null;
  }

  const mirrorUrl = env.ADO_MAVEN_MIRROR_URL || DEFAULT_MIRROR_URL;
  const url = buildMirrorDownloadUrl({ mirrorUrl, version });
  const headers = { Authorization: createBasicAuthHeader(token) };

  process.stdout.write(
    `[info] Downloading OpenAPI generator ${version} from Azure Artifacts mirror\n`,
  );

  const jar = await httpGet(url, headers);
  await fsp.mkdir(storageDir, { recursive: true });

  const tmpPath = `${jarPath}.tmp`;
  await fsp.writeFile(tmpPath, jar);
  await fsp.rename(tmpPath, jarPath);

  process.stdout.write(`[ok] Cached OpenAPI generator ${version}\n`);
  return jarPath;
}

async function main() {
  const cwd = process.cwd();
  const config = await readJson(path.join(cwd, CONFIG_PATH));

  await downloadGenerator({ config, cwd });
}

if (require.main === module) {
  main().catch((e) => {
    process.stderr.write(`[error] ${e.message}\n`);
    process.exit(1);
  });
}

module.exports = {
  buildMirrorDownloadUrl,
  createBasicAuthHeader,
  downloadGenerator,
  getAuthToken,
  resolveStorageDir,
};
