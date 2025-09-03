module.exports = {
  stepDefinitions: "cypress/e2e/step_definitions/**/*.ts",
  json: {
    enabled: true,
    output: "cypress/reports/cucumber-json/cucumber-report.json"
  }
};
