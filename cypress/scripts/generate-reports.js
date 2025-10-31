const { execSync } = require('child_process');
const reporter = require('multiple-cucumber-html-reporter');
const fs = require('fs');
const path = require('path');

// Generate Mochawesome HTML report
const mochawesomeJsonDir = path.join(__dirname, '../../cypress/reports/.jsons');
const mochawesomeOutput = path.join(
  __dirname,
  '../../cypress/reports/mochawesome.json',
);
const reportsDir = path.join(__dirname, '../../cypress/reports');

if (fs.existsSync(mochawesomeJsonDir)) {
  try {
    execSync(
      `npx mochawesome-merge ${mochawesomeJsonDir}/*.json -o ${mochawesomeOutput}`,
      { stdio: 'inherit' },
    );
    execSync(
      `npx mochawesome-report-generator ${mochawesomeOutput} -o ${reportsDir}`,
      { stdio: 'inherit' },
    );
  } catch (error) {
    // Continue even if mochawesome generation fails
  }
}

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
