const fs = require('fs');

const reporter = require('multiple-cucumber-html-reporter');

const logger = require('./logger');

// Function to check if JSON files are valid cucumber format
function hasValidCucumberJson(dir) {
  if (!fs.existsSync(dir)) {
    return false;
  }
  const files = fs.readdirSync(dir).filter((file) => file.endsWith('.json'));
  if (files.length === 0) {
    return false;
  }

  // Check if at least one file has cucumber format (array with feature objects)
  for (const file of files) {
    try {
      const content = fs.readFileSync(`${dir}/${file}`, 'utf8');
      const json = JSON.parse(content);
      // Cucumber JSON should be an array of feature objects
      if (
        Array.isArray(json) &&
        json.length > 0 &&
        json[0].keyword === 'Feature'
      ) {
        return true;
      }
    } catch (error) {
      logger.warn(`Skipping invalid JSON file: ${file} - ${error.message}`);
    }
  }
  return false;
}

// Determine which directory to use for JSON files
let jsonDir = 'cypress/reports/cucumber-json';

// Skip HTML report generation for parallel runs (JUnit XML is sufficient)
// Parallel runs create merged/large JSON files that can cause issues
if (fs.existsSync('runner-results')) {
  logger.info(
    '✓ Parallel execution detected. Skipping cucumber HTML report generation.',
  );
  logger.info(
    '  JUnit XML reports are available in functional-output/*/junit/',
  );
  process.exit(0);
}

// Check for valid cucumber JSON in different directories
if (hasValidCucumberJson('.jsons')) {
  logger.info('Using .jsons directory for report generation');
  jsonDir = '.jsons';
} else if (hasValidCucumberJson('cypress/reports/cucumber-json')) {
  logger.info('Using default cypress/reports/cucumber-json directory');
  jsonDir = 'cypress/reports/cucumber-json';
} else {
  logger.warn(
    'No valid cucumber JSON files found. Skipping HTML report generation.',
  );
  logger.info('Note: JUnit XML reports are still available for Jenkins.');
  process.exit(0);
}

try {
  reporter.generate({
    jsonDir,
    reportPath: 'cypress/reports/cucumber-html',
    reportName: 'AppReg Frontend Cucumber Report',
    pageTitle: 'AppReg Test Results',
    displayDuration: true,
    screenshotsDirectory: './cypress/reports/html/screenshots',
    customStyle: 'cypress/scripts/styles/custom.css',
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
  logger.info('✓ Cucumber HTML report generated successfully');
} catch (error) {
  logger.error('Error generating cucumber HTML report:', error.message);
  logger.info('Note: JUnit XML reports are still available for Jenkins.');
  // Don't fail the build if report generation fails
  process.exit(0);
}
