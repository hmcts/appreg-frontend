const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const reporter = require('multiple-cucumber-html-reporter');

// Generate Mochawesome HTML report
const mochawesomeJsonDir = path.join(__dirname, '../../cypress/reports/.jsons');
const mochawesomeOutput = path.join(
  __dirname,
  '../../cypress/reports/mochawesome.json',
);
const reportsDir = path.join(__dirname, '../../cypress/reports');

if (fs.existsSync(mochawesomeJsonDir)) {
  try {
    // Get all JSON files in the directory
    const jsonFiles = fs
      .readdirSync(mochawesomeJsonDir)
      .filter((file) => file.endsWith('.json'))
      .map((file) => path.join(mochawesomeJsonDir, file));

    if (jsonFiles.length > 0) {
      // Merge JSON files
      execFileSync(
        'yarn',
        ['mochawesome-merge', ...jsonFiles, '-o', mochawesomeOutput],
        { stdio: 'inherit' },
      );

      // Generate HTML report
      execFileSync(
        'yarn',
        ['mochawesome-report-generator', mochawesomeOutput, '-o', reportsDir],
        { stdio: 'inherit' },
      );
    }
  } catch {
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
