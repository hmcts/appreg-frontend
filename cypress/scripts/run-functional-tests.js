const { execSync } = require('child_process');
const path = require('path');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const rootDir = path.resolve(__dirname, '../..');
let exitCode = 0;

try {
  console.log('Running Cypress tests...');
  execSync(
    "cypress run --spec 'cypress/e2e/features/smoke/**/*.feature'",
    { stdio: 'inherit', cwd: rootDir }
  );
} catch (error) {
  console.log('Tests completed with failures, continuing to generate reports...');
  exitCode = 1;
}

try {
  console.log('\nGenerating Mochawesome HTML report...');
  execSync(
    'yarn mochawesome-merge cypress/reports/e2e/html/.jsons/*.json -o cypress/reports/e2e/html/mochawesome.json',
    { stdio: 'inherit', cwd: rootDir }
  );
  execSync(
    'yarn mochawesome-report-generator cypress/reports/e2e/html/mochawesome.json -o cypress/reports/e2e/html',
    { stdio: 'inherit', cwd: rootDir }
  );
  console.log('Mochawesome report generated successfully');
} catch (error) {
  console.log('Failed to generate Mochawesome report:', error.message);
}

try {
  console.log('\nGenerating Cucumber HTML report...');
  require('./generate-cucumber-report.js');
  console.log('Cucumber report generated successfully');
} catch (error) {
  console.log('Failed to generate Cucumber report:', error.message);
}

process.exit(exitCode);
