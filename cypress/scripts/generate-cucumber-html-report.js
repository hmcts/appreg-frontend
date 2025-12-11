/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

// Get browser from command line argument (chrome, edge, or undefined for combined)
const browser = process.argv[2]; // 'chrome', 'edge', or undefined

// Configuration
// Output directory based on browser parameter
const OUTPUT_DIR = browser
  ? path.join(
      __dirname,
      `../../functional-output/${browser}/regression/cucumber-html`,
    )
  : path.join(__dirname, '../../functional-output/regression/cucumber-html');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'detailed-test-report.html');

/**
 * Read and parse all Cucumber JSON files from multiple directories
 */
function readCucumberJsonFiles() {
  // Search for cucumber-json directories based on browser parameter
  let cucumberDirs;

  if (browser === 'chrome') {
    // Chrome-specific report: Only read from Chrome directories
    cucumberDirs = [
      path.join(
        __dirname,
        '../../functional-output/chrome/regression/cucumber-json',
      ),
      path.join(
        __dirname,
        '../../functional-output/chrome/smoke/cucumber-json',
      ),
      path.join(
        __dirname,
        '../../functional-output/chrome/apiTests/cucumber-json',
      ),
    ];
  } else if (browser === 'edge') {
    // Edge-specific report: Only read from Edge directories
    cucumberDirs = [
      path.join(
        __dirname,
        '../../functional-output/edge/regression/cucumber-json',
      ),
      path.join(__dirname, '../../functional-output/edge/smoke/cucumber-json'),
      path.join(
        __dirname,
        '../../functional-output/edge/apiTests/cucumber-json',
      ),
    ];
  } else {
    // Combined report - read from all directories
    cucumberDirs = [
      path.join(__dirname, '../../functional-output/regression/cucumber-json'),
      path.join(__dirname, '../../functional-output/smoke/cucumber-json'),
      path.join(__dirname, '../../functional-output/merged/cucumber-json'),
      path.join(
        __dirname,
        '../../functional-output/chrome/regression/cucumber-json',
      ),
      path.join(
        __dirname,
        '../../functional-output/chrome/smoke/cucumber-json',
      ),
      path.join(
        __dirname,
        '../../functional-output/chrome/apiTests/cucumber-json',
      ),
      path.join(
        __dirname,
        '../../functional-output/edge/regression/cucumber-json',
      ),
      path.join(__dirname, '../../functional-output/edge/smoke/cucumber-json'),
      path.join(
        __dirname,
        '../../functional-output/edge/apiTests/cucumber-json',
      ),
      path.join(__dirname, '../../functional-output/apiTests/cucumber-json'),
    ];
  }

  const allFeatures = [];

  cucumberDirs.forEach((dirPath) => {
    if (!fs.existsSync(dirPath)) {
      console.log(`Directory not found (skipping): ${dirPath}`);
      return;
    }

    console.log(`\nReading Cucumber JSON files from: ${dirPath}`);

    // Detect browser from path (for combined report)
    let browserSource = 'Unknown';
    if (dirPath.includes('/chrome/')) {
      browserSource = 'Chrome';
    } else if (dirPath.includes('/edge/')) {
      browserSource = 'Edge';
    } else if (!browser) {
      // For legacy paths in combined report, mark as "Mixed"
      browserSource = 'Mixed';
    }

    const files = fs
      .readdirSync(dirPath)
      .filter((file) => file.endsWith('.json'));

    console.log(`Found ${files.length} JSON files`);

    files.forEach((file) => {
      const filePath = path.join(dirPath, file);
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(content);
        // Handle both array and object formats
        const features = Array.isArray(data) ? data : [data];

        // Add browser metadata to each feature for combined reports
        features.forEach((feature) => {
          if (!browser) {
            // Only add browser info for combined reports
            feature._browserSource = browserSource;
          }
        });

        allFeatures.push(...features);
        console.log(`  Parsed ${file}: ${features.length} features`);
      } catch (error) {
        console.error(`  Error parsing ${file}:`, error.message);
      }
    });
  });

  console.log(
    `\nTotal features loaded from all directories: ${allFeatures.length}`,
  );
  return allFeatures;
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
  const processedScenarios = new Set(); // Track scenarios to avoid duplicates

  features.forEach((feature) => {
    const featureName = feature.name;

    // Skip features without elements
    if (!feature.elements || !Array.isArray(feature.elements)) {
      return;
    }

    if (!testsByFeature.has(featureName)) {
      testsByFeature.set(featureName, []);
    }

    feature.elements.forEach((scenario) => {
      const scenarioName = scenario.name;

      // Skip duplicate scenarios (same feature + scenario name)
      const scenarioKey = `${featureName}::${scenarioName}`;
      if (processedScenarios.has(scenarioKey)) {
        console.log(`  Skipping duplicate: ${scenarioKey}`);
        return;
      }
      processedScenarios.add(scenarioKey);

      // Process steps
      const steps = scenario.steps.map((step) => {
        const status = step.result ? step.result.status : 'skipped';
        const duration = step.result ? step.result.duration : 0;
        const errorMessage =
          step.result && step.result.error_message
            ? step.result.error_message
            : null;

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
          duration: duration / 1000000, // Convert nanoseconds to milliseconds
          errorMessage,
          screenshots,
        };
      });

      // Calculate scenario status and duration
      const failedSteps = steps.filter((s) => s.status === 'failed');
      const skippedSteps = steps.filter((s) => s.status === 'skipped');
      let scenarioStatus = 'passed';
      if (failedSteps.length > 0) {
        scenarioStatus = 'failed';
      } else if (skippedSteps.length > 0) {
        scenarioStatus = 'skipped';
      }

      const scenarioDuration = steps.reduce(
        (sum, step) => sum + step.duration,
        0,
      );

      // Update stats
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

      testsByFeature.get(featureName).push({
        name: scenarioName,
        status: scenarioStatus,
        duration: scenarioDuration,
        steps,
        browser: feature._browserSource || null, // Add browser source for combined reports
      });
    });
  });

  console.log('\nTest Statistics:');
  console.log(`Total: ${stats.total}`);
  console.log(`Passed: ${stats.passed}`);
  console.log(`Failed: ${stats.failed}`);
  console.log(`Skipped: ${stats.skipped}`);
  console.log(`Pass Rate: ${((stats.passed / stats.total) * 100).toFixed(2)}%`);

  return { stats, testsByFeature };
}

/**
 * Generate HTML report
 */
function generateHTML(stats, testsByFeature) {
  const passRate = ((stats.passed / stats.total) * 100).toFixed(2);
  const avgDuration = (stats.totalDuration / stats.total).toFixed(0);

  // Add browser info to title if browser-specific report
  const browserInfo = browser
    ? ` - ${browser.charAt(0).toUpperCase() + browser.slice(1)}`
    : '';
  const reportTitle = `Application Register${browserInfo}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${reportTitle} - Test Report</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }
    
    .container {
      max-width: 1400px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      overflow: hidden;
    }
    
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    
    .header h1 {
      font-size: 2.5em;
      margin-bottom: 10px;
    }
    
    .header p {
      font-size: 1.1em;
      opacity: 0.9;
    }
    
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      padding: 30px;
      background: #f8f9fa;
    }
    
    .stat-card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      text-align: center;
    }
    
    .stat-card .value {
      font-size: 2.5em;
      font-weight: bold;
      margin: 10px 0;
    }
    
    .stat-card .label {
      color: #666;
      font-size: 0.9em;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .stat-card.passed .value { color: #28a745; }
    .stat-card.failed .value { color: #dc3545; }
    .stat-card.skipped .value { color: #ffc107; }
    .stat-card.total .value { color: #17a2b8; }
    
    .controls {
      padding: 20px 30px;
      background: white;
      border-bottom: 1px solid #eee;
      display: flex;
      gap: 15px;
      align-items: center;
      flex-wrap: wrap;
    }
    
    .search-box {
      flex: 1;
      min-width: 250px;
      padding: 10px 15px;
      border: 2px solid #ddd;
      border-radius: 6px;
      font-size: 1em;
    }
    
    .filter-btn {
      padding: 10px 20px;
      border: 2px solid #667eea;
      background: white;
      color: #667eea;
      border-radius: 6px;
      cursor: pointer;
      font-size: 1em;
      transition: all 0.3s;
    }
    
    .filter-btn:hover {
      background: #667eea;
      color: white;
    }
    
    .filter-btn.active {
      background: #667eea;
      color: white;
    }
    
    .content {
      padding: 30px;
    }
    
    .feature {
      margin-bottom: 30px;
      border: 1px solid #ddd;
      border-radius: 8px;
      overflow: hidden;
    }
    
    .feature-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 15px 20px;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .feature-header:hover {
      opacity: 0.9;
    }
    
    .feature-name {
      font-size: 1.3em;
      font-weight: bold;
    }
    
    .feature-stats {
      font-size: 0.9em;
      opacity: 0.9;
    }
    
    .scenarios {
      background: white;
    }
    
    .scenario {
      border-bottom: 1px solid #eee;
      padding: 15px 20px;
    }
    
    .scenario:last-child {
      border-bottom: none;
    }
    
    .scenario-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      padding: 10px;
      border-radius: 6px;
      transition: background 0.2s;
    }
    
    .scenario-header:hover {
      background: #f8f9fa;
    }
    
    .scenario-title {
      display: flex;
      align-items: center;
      gap: 10px;
      flex: 1;
    }
    
    .status-badge {
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.85em;
      font-weight: bold;
      text-transform: uppercase;
    }
    
    .status-badge.passed {
      background: #d4edda;
      color: #155724;
    }
    
    .status-badge.failed {
      background: #f8d7da;
      color: #721c24;
    }
    
    .status-badge.skipped {
      background: #fff3cd;
      color: #856404;
    }
    
    .scenario-name {
      font-weight: 500;
    }
    
    .browser-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      margin-left: 8px;
      vertical-align: middle;
    }
    
    .scenario-duration {
      color: #666;
      font-size: 0.9em;
    }
    
    .steps-container {
      display: none;
      margin-top: 15px;
      padding-left: 20px;
    }
    
    .steps-container.active {
      display: block;
    }
    
    .step {
      padding: 10px;
      margin: 5px 0;
      border-left: 3px solid #ddd;
      background: #f8f9fa;
      border-radius: 4px;
    }
    
    .step.passed {
      border-left-color: #28a745;
      background: #d4edda;
    }
    
    .step.failed {
      border-left-color: #dc3545;
      background: #f8d7da;
    }
    
    .step.skipped {
      border-left-color: #ffc107;
      background: #fff3cd;
    }
    
    .step-text {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .step-keyword {
      font-weight: bold;
      color: #667eea;
    }
    
    .step-name {
      flex: 1;
    }
    
    .step-duration {
      color: #666;
      font-size: 0.85em;
    }
    
    .step-error {
      margin-top: 10px;
      padding: 10px;
      background: white;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 0.9em;
      color: #dc3545;
      white-space: pre-wrap;
      word-break: break-word;
    }
    
    .step-screenshot {
      margin-top: 10px;
      text-align: center;
    }
    
    .step-screenshot img {
      max-width: 100%;
      border: 1px solid #ddd;
      border-radius: 4px;
      cursor: pointer;
      transition: transform 0.2s;
    }
    
    .step-screenshot img:hover {
      transform: scale(1.02);
    }
    
    .screenshot-label {
      font-size: 0.85em;
      color: #666;
      margin-top: 5px;
    }
    
    .expand-icon {
      transition: transform 0.3s;
    }
    
    .expand-icon.rotated {
      transform: rotate(180deg);
    }
    
    .hidden {
      display: none !important;
    }
    
    /* Modal for full-size screenshots */
    .modal {
      display: none;
      position: fixed;
      z-index: 1000;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.9);
    }
    
    .modal-content {
      margin: auto;
      display: block;
      max-width: 90%;
      max-height: 90%;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }
    
    .modal-close {
      position: absolute;
      top: 20px;
      right: 40px;
      color: white;
      font-size: 40px;
      font-weight: bold;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${reportTitle}</h1>
      <p>Detailed Test Results with Steps and Screenshots</p>
      <p>Generated: ${new Date().toLocaleString()}</p>
    </div>
    
    <div class="stats">
      <div class="stat-card total">
        <div class="label">Total Tests</div>
        <div class="value">${stats.total}</div>
      </div>
      <div class="stat-card passed">
        <div class="label">Passed</div>
        <div class="value">${stats.passed}</div>
      </div>
      <div class="stat-card failed">
        <div class="label">Failed</div>
        <div class="value">${stats.failed}</div>
      </div>
      <div class="stat-card skipped">
        <div class="label">Skipped</div>
        <div class="value">${stats.skipped}</div>
      </div>
      <div class="stat-card">
        <div class="label">Pass Rate</div>
        <div class="value" style="color: ${passRate >= 90 ? '#28a745' : passRate >= 70 ? '#ffc107' : '#dc3545'}">${passRate}%</div>
      </div>
      <div class="stat-card">
        <div class="label">Avg Duration</div>
        <div class="value" style="color: #6c757d">${avgDuration}ms</div>
      </div>
    </div>
    
    <div class="controls">
      <input type="text" class="search-box" placeholder="Search tests..." id="searchInput">
      <button class="filter-btn active" data-filter="all">All</button>
      <button class="filter-btn" data-filter="passed">Passed</button>
      <button class="filter-btn" data-filter="failed">Failed</button>
      <button class="filter-btn" data-filter="skipped">Skipped</button>
    </div>
    
    <div class="content" id="testsContainer">
      ${generateFeaturesHTML(testsByFeature)}
    </div>
  </div>
  
  <!-- Modal for full-size screenshots -->
  <div id="screenshotModal" class="modal">
    <span class="modal-close">&times;</span>
    <img class="modal-content" id="modalImage">
  </div>
  
  <script>
    // Search functionality
    document.getElementById('searchInput').addEventListener('input', function(e) {
      const searchTerm = e.target.value.toLowerCase();
      const features = document.querySelectorAll('.feature');
      
      features.forEach(feature => {
        const featureName = feature.querySelector('.feature-name').textContent.toLowerCase();
        const scenarios = feature.querySelectorAll('.scenario');
        let featureHasMatch = false;
        
        scenarios.forEach(scenario => {
          const scenarioName = scenario.querySelector('.scenario-name').textContent.toLowerCase();
          if (featureName.includes(searchTerm) || scenarioName.includes(searchTerm)) {
            scenario.style.display = '';
            featureHasMatch = true;
          } else {
            scenario.style.display = 'none';
          }
        });
        
        feature.style.display = featureHasMatch ? '' : 'none';
      });
    });
    
    // Filter functionality
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        
        const filter = this.dataset.filter;
        const scenarios = document.querySelectorAll('.scenario');
        
        scenarios.forEach(scenario => {
          const status = scenario.querySelector('.status-badge').classList;
          if (filter === 'all' || status.contains(filter)) {
            scenario.style.display = '';
          } else {
            scenario.style.display = 'none';
          }
        });
        
        // Hide features with no visible scenarios
        document.querySelectorAll('.feature').forEach(feature => {
          const visibleScenarios = Array.from(feature.querySelectorAll('.scenario'))
            .filter(s => s.style.display !== 'none');
          feature.style.display = visibleScenarios.length > 0 ? '' : 'none';
        });
      });
    });
    
    // Toggle feature collapse
    document.querySelectorAll('.feature-header').forEach(header => {
      header.addEventListener('click', function() {
        const scenarios = this.nextElementSibling;
        const icon = this.querySelector('.expand-icon');
        scenarios.classList.toggle('hidden');
        icon.classList.toggle('rotated');
      });
    });
    
    // Toggle scenario steps
    document.querySelectorAll('.scenario-header').forEach(header => {
      header.addEventListener('click', function(e) {
        e.stopPropagation();
        const stepsContainer = this.nextElementSibling;
        const icon = this.querySelector('.expand-icon');
        stepsContainer.classList.toggle('active');
        icon.classList.toggle('rotated');
      });
    });
    
    // Screenshot modal
    const modal = document.getElementById('screenshotModal');
    const modalImg = document.getElementById('modalImage');
    const closeBtn = document.querySelector('.modal-close');
    
    document.querySelectorAll('.step-screenshot img').forEach(img => {
      img.addEventListener('click', function() {
        modal.style.display = 'block';
        modalImg.src = this.src;
      });
    });
    
    closeBtn.addEventListener('click', function() {
      modal.style.display = 'none';
    });
    
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });
  </script>
</body>
</html>`;

  return html;
}

/**
 * Generate HTML for all features
 */
function generateFeaturesHTML(testsByFeature) {
  let html = '';

  for (const [featureName, scenarios] of testsByFeature) {
    const passed = scenarios.filter((s) => s.status === 'passed').length;
    const failed = scenarios.filter((s) => s.status === 'failed').length;
    const skipped = scenarios.filter((s) => s.status === 'skipped').length;

    html += `
      <div class="feature">
        <div class="feature-header">
          <div class="feature-name">${featureName}</div>
          <div class="feature-stats">
            ${scenarios.length} scenarios | 
            <span style="color: #d4edda;">✓ ${passed}</span> | 
            <span style="color: #f8d7da;">✗ ${failed}</span> | 
            <span style="color: #fff3cd;">⊘ ${skipped}</span>
            <span class="expand-icon">▼</span>
          </div>
        </div>
        <div class="scenarios">
          ${generateScenariosHTML(scenarios)}
        </div>
      </div>`;
  }

  return html;
}

/**
 * Generate HTML for scenarios
 */
function generateScenariosHTML(scenarios) {
  return scenarios
    .map((scenario) => {
      // Add browser badge for combined reports
      const browserBadge =
        scenario.browser && !browser
          ? `<span class="browser-badge" style="background: ${scenario.browser === 'Chrome' ? '#4285f4' : '#0078d4'}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; margin-left: 8px;">🌐 ${scenario.browser}</span>`
          : '';

      return `
    <div class="scenario">
      <div class="scenario-header">
        <div class="scenario-title">
          <span class="status-badge ${scenario.status}">${scenario.status}</span>
          <span class="scenario-name">${scenario.name}</span>
          ${browserBadge}
        </div>
        <div>
          <span class="scenario-duration">${scenario.duration.toFixed(0)}ms</span>
          <span class="expand-icon">▼</span>
        </div>
      </div>
      <div class="steps-container">
        ${generateStepsHTML(scenario.steps)}
      </div>
    </div>
  `;
    })
    .join('');
}

/**
 * Generate HTML for steps
 */
function generateStepsHTML(steps) {
  return steps
    .map((step) => {
      let screenshotsHTML = '';
      if (step.screenshots && step.screenshots.length > 0) {
        screenshotsHTML = step.screenshots
          .map(
            (screenshot) => `
        <div class="step-screenshot">
          <img src="data:${screenshot.mimeType};base64,${screenshot.data}" alt="Screenshot" />
          <div class="screenshot-label">📸 Screenshot</div>
        </div>
      `,
          )
          .join('');
      }

      let errorHTML = '';
      if (step.errorMessage) {
        errorHTML = `<div class="step-error">${step.errorMessage}</div>`;
      }

      return `
      <div class="step ${step.status}">
        <div class="step-text">
          <span class="step-keyword">${step.keyword}</span>
          <span class="step-name">${step.name}</span>
          <span class="step-duration">${step.duration.toFixed(0)}ms</span>
        </div>
        ${errorHTML}
        ${screenshotsHTML}
      </div>
    `;
    })
    .join('');
}

/**
 * Main execution
 */
function main() {
  console.log('\n=== Generating Detailed Cucumber HTML Report ===\n');

  // Read Cucumber JSON files
  const features = readCucumberJsonFiles();

  if (features.length === 0) {
    console.error('No features found in Cucumber JSON files');
    process.exit(1);
  }

  // Process features
  const { stats, testsByFeature } = processFeatures(features);

  // Generate HTML
  const html = generateHTML(stats, testsByFeature);

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Write HTML file
  fs.writeFileSync(OUTPUT_FILE, html);

  console.log('\n✅ Report generated successfully!');
  console.log(`📄 Report location: ${OUTPUT_FILE}`);
  console.log('\n=== Report Generation Complete ===\n');
}

// Run the script
main();
