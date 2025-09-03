const reporter = require('multiple-cucumber-html-reporter');

reporter.generate({
  jsonDir: 'cypress/reports/cucumber-json',
  reportPath: 'cypress/reports/cucumber-html',
  reportName: 'AppReg Frontend Cucumber Report', 
  pageTitle: 'AppReg Test Results', 
  displayDuration: true,
  metadata: {
    browser: {
      name: 'chrome',
      version: 'latest'
    },
    device: 'Local test machine',
    platform: {
      name: 'macOS',
      version: 'latest'
    }
  },
  customData: {
    title: 'Run info',
    data: [
      { label: 'Project', value: 'AppReg Frontend' },
      { label: 'Release', value: '1.0.0' },
      { label: 'Cycle', value: 'Regression' },
      { label: 'Execution Start Time', value: new Date().toLocaleString() }
    ]
  }
});
