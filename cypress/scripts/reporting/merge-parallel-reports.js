const fs = require('node:fs');
const path = require('node:path');

const logger = require('./logger');

const REPORT_ROOT =
  process.env.REPORT_ROOT || path.join(__dirname, '../../../cypress/reports');

// Get scope from command line arguments
const scope = process.argv[2] || 'regression'; // 'smoke', 'regression', 'all'
const browser = process.argv[3] || 'chrome';

// Paths
const PARALLEL_REPORTS_DIR = path.join(REPORT_ROOT, 'parallel', scope);
const GLOBAL_REPORTS_DIR = path.join(REPORT_ROOT, 'cucumber-json');
const OUTPUT_DIR = path.join(
  __dirname,
  `../../../functional-output/${browser}/${scope}/cucumber-json`,
);
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'cucumber-report.json');

/**
 * Find all cucumber JSON files in parallel report directories
 */
function findCucumberJsonFiles(baseDir) {
  const jsonFiles = [];

  if (!fs.existsSync(baseDir)) {
    logger.warn(`Parallel reports directory not found: ${baseDir}`);
    return jsonFiles;
  }

  logger.info(`Searching for cucumber JSON files in: ${baseDir}`);

  // Read all subdirectories (each parallel thread creates its own directory)
  const threadDirs = fs
    .readdirSync(baseDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  logger.info(`Found ${threadDirs.length} parallel thread directories`);

  // Search for cucumber JSON files in each thread directory
  threadDirs.forEach((threadDir) => {
    const threadPath = path.join(baseDir, threadDir);
    const cucumberJsonPath = path.join(
      threadPath,
      'cucumber-json',
      'cucumber-report.json',
    );

    if (fs.existsSync(cucumberJsonPath)) {
      jsonFiles.push(cucumberJsonPath);
      logger.info(`  Found: ${cucumberJsonPath}`);
    } else {
      // Also check in reports subdirectory (alternative structure)
      const altPath = path.join(
        threadPath,
        'reports',
        'cucumber-json',
        'cucumber-report.json',
      );
      if (fs.existsSync(altPath)) {
        jsonFiles.push(altPath);
        logger.info(`  Found: ${altPath}`);
      } else {
        logger.warn(`  No cucumber JSON found in: ${threadPath}`);
      }
    }
  });

  return jsonFiles;
}

function findGlobalCucumberJsonFiles(dirPath) {
  const jsonFiles = [];

  if (!fs.existsSync(dirPath)) {
    return jsonFiles;
  }

  const files = fs
    .readdirSync(dirPath)
    .filter((file) => file.endsWith('.json'));

  files.forEach((file) => {
    jsonFiles.push(path.join(dirPath, file));
  });

  if (jsonFiles.length > 0) {
    logger.info(`Found ${jsonFiles.length} JSON files in global cucumber-json directory: ${dirPath}`);
  }

  return jsonFiles;
}

/**
 * Merge multiple cucumber JSON files into one
 */
function mergeCucumberJsonFiles(jsonFiles) {
  const mergedFeatures = [];

  jsonFiles.forEach((file, index) => {
    try {
      logger.info(`\nMerging file ${index + 1}/${jsonFiles.length}: ${file}`);
      const content = fs.readFileSync(file, 'utf8');
      const data = JSON.parse(content);

      // Handle both array and single feature
      const features = Array.isArray(data) ? data : [data];

      logger.info(`  Features in file: ${features.length}`);
      features.forEach((feature) => {
        if (feature && feature.elements) {
          logger.info(
            `    - ${feature.name}: ${feature.elements.length} scenarios`,
          );
        }
      });

      mergedFeatures.push(...features);
    } catch (error) {
      logger.error(`  Error reading/parsing ${file}:`, error.message);
    }
  });

  return mergedFeatures;
}

/**
 * Main execution
 */
function main() {
  logger.info('\n=== Merging Parallel Cucumber Reports ===\n');
  logger.info(`Scope: ${scope}`);
  logger.info(`Browser: ${browser}`);

  // Find all cucumber JSON files from parallel runs
  const jsonFiles = [
    ...findCucumberJsonFiles(PARALLEL_REPORTS_DIR),
    ...findGlobalCucumberJsonFiles(GLOBAL_REPORTS_DIR),
  ];

  if (jsonFiles.length === 0) {
    logger.error(
      '\n No cucumber JSON files found from parallel runs. Nothing to merge.',
    );
    logger.info(
      '\nThis could be because:\n' +
        '  1. Tests have not been run yet\n' +
        '  2. All tests failed before generating reports\n' +
        '  3. Incorrect parallel reports directory path\n',
    );
    process.exit(1);
  }

  logger.info(`\n Found ${jsonFiles.length} report files to merge`);

  // Merge all JSON files
  const mergedFeatures = mergeCucumberJsonFiles(jsonFiles);

  logger.info(`\n Total merged features: ${mergedFeatures.length}`);

  // Count total scenarios
  const totalScenarios = mergedFeatures.reduce((sum, feature) => {
    return sum + (feature.elements ? feature.elements.length : 0);
  }, 0);
  logger.info(`\n Total merged scenarios: ${totalScenarios}`);

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    logger.info(`\n Created output directory: ${OUTPUT_DIR}`);
  }

  // Write merged JSON file
  const mergedContent = JSON.stringify(mergedFeatures, null, 2);
  fs.writeFileSync(OUTPUT_FILE, mergedContent);

  logger.info('\n Merged report saved successfully!');
  logger.info(` Output file: ${OUTPUT_FILE}`);
  logger.info(` File size: ${(mergedContent.length / 1024).toFixed(2)} KB`);
  logger.info('\n=== Merge Complete ===\n');
}

// Run the script
main();
