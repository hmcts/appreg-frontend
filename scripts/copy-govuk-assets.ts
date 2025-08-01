// scripts/copy-govuk-to-src.js
const path = require('path');

const fs = require('fs-extra');

// Where govuk-frontend actually installs its assets
const src = path.resolve(__dirname, '..', 'node_modules', 'govuk-frontend', 'dist', 'govuk', 'assets');

// Your staging area in src/
const dest = path.resolve(__dirname, '..', 'src', 'assets', 'govuk');

// Delete any old copy, then mirror everything
fs.rmSync(dest, { recursive: true, force: true });
fs.copySync(src, dest);

console.log('✔ Copied GOV.UK assets:\n', src, '\n→', dest);
