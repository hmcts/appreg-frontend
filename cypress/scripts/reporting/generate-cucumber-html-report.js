const fs = require('node:fs');
const path = require('node:path');

const { generateHTML } = require('./html-template');
const logger = require('./logger');

// Get browser and optional scope from command line arguments
const browser = process.argv[2]; // 'chrome', 'edge', or undefined
const scope = process.argv[3] || 'regression'; // 'regression', 'smoke', etc.
const runId =
  process.env.RUN_ID || process.env.BUILD_TAG || process.env.BUILD_NUMBER;

const OUTPUT_ROOT = path.join(__dirname, '../../../functional-output');
const RUN_SCOPED_ROOT = runId
  ? path.join(__dirname, '../../../functional-output', runId)
  : null;

// Configuration
// Output directory based on browser parameter
const OUTPUT_DIR = browser
  ? path.join(OUTPUT_ROOT, `${browser}`, scope, 'cucumber-html')
  : path.join(OUTPUT_ROOT, scope, 'cucumber-html');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'detailed-test-report.html');

/**
 * Get browser source from directory path
 */
function getBrowserSource(dirPath) {
  if (dirPath.includes('/chrome/')) {
    return 'Chrome';
  }
  if (dirPath.includes('/edge/')) {
    return 'Edge';
  }
  if (!browser) {
    return 'Mixed';
  }
  return 'Unknown';
}

/**
 * Parse a single JSON file and extract features
 */
function parseJsonFile(file, dirPath, browserSource) {
  const filePath = path.join(dirPath, file);
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);
    const features = Array.isArray(data) ? data : [data];

    // Add browser metadata to each feature for combined reports
    if (!browser) {
      features.forEach((feature) => {
        feature._browserSource = browserSource;
      });
    }

    logger.info(`  Parsed ${file}: ${features.length} features`);
    return features;
  } catch (error) {
    logger.error(`  Error parsing ${file}:`, error.message);
    return [];
  }
}

/**
 * Read JSON files from a single directory
 */
function readJsonFilesFromDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    logger.info(`Directory not found (skipping): ${dirPath}`);
    return [];
  }

  logger.info(`\nReading Cucumber JSON files from: ${dirPath}`);

  const browserSource = getBrowserSource(dirPath);
  const files = fs
    .readdirSync(dirPath)
    .filter((file) => file.endsWith('.json'));

  logger.info(`Found ${files.length} JSON files`);

  const allFeatures = [];
  files.forEach((file) => {
    const features = parseJsonFile(file, dirPath, browserSource);
    allFeatures.push(...features);
  });

  return allFeatures;
}

/**
 * Helper to build paths with optional run-scoped root, then legacy root fallback
 */
function buildPaths(segmentGroups) {
  const paths = [];

  if (RUN_SCOPED_ROOT) {
    segmentGroups.forEach((segments) =>
      paths.push(path.join(RUN_SCOPED_ROOT, ...segments)),
    );
  }

  segmentGroups.forEach((segments) =>
    paths.push(path.join(OUTPUT_ROOT, ...segments)),
  );

  return paths;
}

/**
 * Get list of cucumber directories based on browser parameter
 */
function getCucumberDirectories() {
  // With a browser specified, honor the provided scope directly.
  if (browser === 'chrome' || browser === 'edge') {
    return buildPaths([[browser, scope, 'cucumber-json']]);
  }

  // Combined report fallback
  return buildPaths([[scope, 'cucumber-json']]);
}

/**
 * Read and parse all Cucumber JSON files from multiple directories
 */
function readCucumberJsonFiles() {
  const cucumberDirs = getCucumberDirectories();
  const allFeatures = [];

  cucumberDirs.forEach((dirPath) => {
    const features = readJsonFilesFromDirectory(dirPath);
    allFeatures.push(...features);
  });

  logger.info(
    `\nTotal features loaded from all directories: ${allFeatures.length}`,
  );
  return allFeatures;
}

/**
 * Process a single step and extract data
 */
function processStep(step) {
  const status = step.result ? step.result.status : 'skipped';
  const duration = step.result ? step.result.duration : 0;
  const durationInMs = duration / 1000000; // Convert nanoseconds to milliseconds
  const errorMessage =
    step.result && step.result.error_message ? step.result.error_message : null;

  // Extract screenshots from embeddings
  const screenshots = step.embeddings
    ? step.embeddings
        .filter((emb) => emb.mime_type === 'image/png')
        .map((emb) => ({
          data: emb.data,
          mimeType: emb.mime_type,
        }))
    : [];

  return {
    keyword: step.keyword,
    name: step.name,
    status,
    duration: durationInMs,
    errorMessage,
    screenshots,
  };
}

/**
 * Calculate scenario status based on steps
 */
function calculateScenarioStatus(steps) {
  const failedSteps = steps.filter((s) => s.status === 'failed');
  const skippedSteps = steps.filter((s) => s.status === 'skipped');

  if (failedSteps.length > 0) {
    return 'failed';
  }
  if (skippedSteps.length > 0) {
    return 'skipped';
  }
  return 'passed';
}

/**
 * Update statistics with scenario results
 */
function updateStats(stats, scenarioStatus, scenarioDuration) {
  stats.total++;
  if (scenarioStatus === 'passed') {
    stats.passed++;
  }
  if (scenarioStatus === 'failed') {
    stats.failed++;
  }
  if (scenarioStatus === 'skipped') {
    stats.skipped++;
  }
  stats.totalDuration += scenarioDuration;
}

/**
 * Process a single scenario
 */
function processScenario(scenario, feature, stats, testsByFeature) {
  const featureName = feature.name;
  const scenarioName = scenario.name;

  // Process steps
  const steps = scenario.steps.map(processStep);

  // Calculate scenario status and duration
  const scenarioStatus = calculateScenarioStatus(steps);
  const scenarioDuration = steps.reduce((sum, step) => sum + step.duration, 0);

  // Extract tags from scenario
  const tags = scenario.tags ? scenario.tags.map(tag => tag.name) : [];

  // Update stats
  updateStats(stats, scenarioStatus, scenarioDuration);

  // Add scenario to feature
  testsByFeature.get(featureName).push({
    name: scenarioName,
    status: scenarioStatus,
    duration: scenarioDuration,
    steps,
    browser: feature._browserSource || null,
    tags,
  });
}

/**
 * Process a single feature
 */
function processFeature(feature, stats, testsByFeature) {
  const featureName = feature.name;

  // Skip features without elements
  if (!feature.elements || !Array.isArray(feature.elements)) {
    return;
  }

  if (!testsByFeature.has(featureName)) {
    testsByFeature.set(featureName, []);
  }

  feature.elements.forEach((scenario) => {
    processScenario(scenario, feature, stats, testsByFeature);
  });
}

/**
 * Log statistics
 */
function logStatistics(stats) {
  logger.info('\nTest Statistics:');
  logger.info(`Total: ${stats.total}`);
  logger.info(`Passed: ${stats.passed}`);
  logger.info(`Failed: ${stats.failed}`);
  logger.info(`Skipped: ${stats.skipped}`);
  logger.info(`Pass Rate: ${((stats.passed / stats.total) * 100).toFixed(2)}%`);
}

/**
 * Process features to extract test data with steps
 */
function processFeatures(features) {
  const stats = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    totalDuration: 0,
  };

  const testsByFeature = new Map();

  features.forEach((feature) => {
    processFeature(feature, stats, testsByFeature);
  });

  logStatistics(stats);

  return { stats, testsByFeature };
}

/**
 * Main execution
 */
function main() {
  logger.info('\n=== Generating Detailed Cucumber HTML Report ===\n');
  logger.info(`Browser: ${browser || 'combined'}`);
  logger.info(`Scope: ${scope}`);
  logger.info(`Run ID: ${runId || 'N/A'}`);

  // Read Cucumber JSON files
  const features = readCucumberJsonFiles();

  if (features.length === 0) {
    logger.error('No features found in Cucumber JSON files');
    logger.info(
      '\nPossible reasons:\n' +
        '  1. Tests have not been run yet\n' +
        '  2. All tests failed before generating reports\n' +
        '  3. Cucumber JSON output directory is incorrect\n' +
        '  4. For parallel runs, make sure to merge reports first using merge-parallel-reports.js\n',
    );
    process.exit(1);
  }

  // Process features
  const { stats, testsByFeature } = processFeatures(features);

  // Generate HTML
  const html = generateHTML(stats, testsByFeature, browser);

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Write HTML file
  fs.writeFileSync(OUTPUT_FILE, html);

  logger.info('\n✅ Report generated successfully!');
  logger.info(`📄 Report location: ${OUTPUT_FILE}`);
  logger.info('\n=== Report Generation Complete ===\n');
}

// Run the script
main();
