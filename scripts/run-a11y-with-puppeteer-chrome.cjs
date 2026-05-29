#!/usr/bin/env node

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');

function runYarn(args, options = {}) {
  const yarnEntrypoint = process.env.npm_execpath;
  const runEntrypointWithNode =
    yarnEntrypoint &&
    (process.platform === 'win32' || /\.c?js$/.test(yarnEntrypoint));
  const command = runEntrypointWithNode ? process.execPath : yarnEntrypoint;
  const commandArgs = runEntrypointWithNode ? [yarnEntrypoint, ...args] : args;

  const result = spawnSync(command, commandArgs, {
    cwd: process.cwd(),
    env: process.env,
    encoding: 'utf8',
    stdio: options.captureStdout ? ['ignore', 'pipe', 'inherit'] : 'inherit',
  });

  if (result.error) {
    throw result.error;
  }

  return result;
}

function assertExecutable(executablePath) {
  const mode =
    process.platform === 'win32' ? fs.constants.F_OK : fs.constants.X_OK;
  fs.accessSync(executablePath, mode);
}

const install = runYarn(
  ['puppeteer', 'browsers', 'install', 'chrome', '--format', '{{path}}'],
  { captureStdout: true },
);

if (install.status !== 0) {
  process.exit(install.status);
}

const executablePath = install.stdout
  .split(/\r?\n/)
  .map((line) => line.trim())
  .findLast(Boolean);

if (!executablePath) {
  console.error('Puppeteer did not report a Chrome executable path.');
  process.exit(1);
}

assertExecutable(executablePath);
console.log(`Puppeteer Chrome executable: ${executablePath}`);

process.env.PUPPETEER_EXECUTABLE_PATH = executablePath;

const a11y = runYarn(['test:a11y']);
process.exit(a11y.status);
