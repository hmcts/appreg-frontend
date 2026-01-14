const path = require('node:path');

const REPORT_ROOT = process.env.REPORT_ROOT || path.join('cypress', 'reports');
const DEFAULT_CUCUMBER_JSON_OUTPUT = path.join(
  REPORT_ROOT,
  'cucumber-json',
  `cucumber-report-${process.pid}.json`,
);

module.exports = {
  stepDefinitions: 'cypress/e2e/step_definitions/**/*.ts',
  messages: {
    enabled: true,
    output: 'cypress/reports/cucumber-messages',
  },
  json: {
    enabled: true,
    output: process.env.CUCUMBER_JSON_OUTPUT || DEFAULT_CUCUMBER_JSON_OUTPUT,
  },
  filterSpecs: true,
  omitFiltered: true,
};
