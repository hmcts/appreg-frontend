module.exports = {
  stepDefinitions: 'cypress/e2e/step_definitions/**/*.ts',
  messages: {
    enabled: true,
    output: 'cypress/reports/cucumber-messages',
  },
  json: {
    enabled: true,
    // Standard Cucumber JSON output for HTML report generation
    output: 'cypress/reports/cucumber-json/cucumber-report.json',
  },
  filterSpecs: true,
  omitFiltered: true,
};
