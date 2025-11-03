const reporter = require('multiple-cucumber-html-reporter');

// Note: Mochawesome reports are generated automatically by cypress-mochawesome-reporter plugin
// No manual merge or generation needed

// Generate Cucumber HTML report
reporter.generate({
  jsonDir: 'cypress/reports/cucumber-json',
  reportPath: 'cypress/reports/cucumber-html',
  reportName: 'AppReg Frontend Cucumber Report',
  pageTitle: 'AppReg Test Results',
  displayDuration: true,
  screenshotsDirectory: 'cypress/reports/screenshots',
  customStyle: 'cypress/scripts/custom.css',
  metadata: {
    browser: {
      name: 'chrome',
      version: 'latest',
    },
    device: 'Local test machine',
    platform: {
      name: 'macOS',
      version: 'latest',
    },
  },
  customData: {
    title: 'Run info',
    data: [
      { label: 'Project', value: 'AppReg Frontend' },
      { label: 'Release', value: '1.0.0' },
      { label: 'Cycle', value: 'Regression' },
      {
        label: 'Environment',
        value: process.env.TEST_URL || 'http://localhost:4000',
      },
      { label: 'Execution Start Time', value: new Date().toLocaleString() },
    ],
  },
});
