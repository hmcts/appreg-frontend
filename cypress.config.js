const { defineConfig } = require('cypress');
const createBundler = require('@bahmutov/cypress-esbuild-preprocessor');
const {
  addCucumberPreprocessorPlugin,
} = require('@badeball/cypress-cucumber-preprocessor');
const {
  createEsbuildPlugin,
} = require('@badeball/cypress-cucumber-preprocessor/esbuild');
const { PDFParse } = require('pdf-parse');

// Use process.stdout.write for direct output (no ESLint warnings)
const cypressLog = {
  info: (message) => process.stdout.write(`[cypress-config] ${message}\n`),
  warn: (message) =>
    process.stderr.write(`[cypress-config] WARNING: ${message}\n`),
};

async function loadAppConfig() {
  // Set NODE_ENV to 'test' if not already set, so config library loads test.json
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'test';
  }

  const appConfig = require('config');
  const nodeEnv = process.env.NODE_ENV || 'test';

  // Test uses staging vault secrets
  const vaultEnv = nodeEnv === 'test' ? 'stg' : nodeEnv;

  try {
    cypressLog.info(
      `Loading Azure vault secrets for ${nodeEnv} environment (using ${vaultEnv} vault)`,
    );
    const { addFromAzureVault } = require('@hmcts/properties-volume');
    await addFromAzureVault(appConfig, {
      pathToHelmChart: 'charts/appreg-frontend/values.yaml',
      env: vaultEnv,
    });
    cypressLog.info('Azure vault secrets loaded successfully');
  } catch (err) {
    cypressLog.warn(
      `Azure vault not available for ${nodeEnv} (${vaultEnv}): ${err && err.message ? err.message : err}. Falling back to local configuration.`,
    );
  }

  return appConfig;
}
function appConfigGet(appConfig, path, fallback) {
  try {
    return appConfig.has(path) ? appConfig.get(path) : fallback;
  } catch {
    return fallback;
  }
}
module.exports = defineConfig({
  typescript: {
    configFile: 'tsconfig.cypress.json',
  },
  e2e: {
    retries: {
      runMode: 0,
      openMode: 0,
    },
    // Test Files Configuration
    specPattern: 'cypress/e2e/**/*.feature',
    supportFile: 'cypress/support/e2e.ts',
    fixturesFolder: 'cypress/fixtures',
    // Base URL and Timeouts
    baseUrl: process.env.TEST_URL || 'http://localhost:4000',
    defaultCommandTimeout: 20000,
    pageLoadTimeout: 120000,
    requestTimeout: 20000,
    responseTimeout: 30000,
    taskTimeout: 300000,
    // Browser and Security Settings
    chromeWebSecurity: false,
    experimentalModifyObstructiveThirdPartyCode: true,
    experimentalOriginDependencies: true,
    testIsolation: true,
    // Report and Media Settings
    reporter: 'cypress-multi-reporters',
    reporterOptions: {
      reporterEnabled:
        'spec, cypress-mochawesome-reporter, mocha-junit-reporter',
      mochaJunitReporterReporterOptions: {
        mochaFile: 'cypress/reports/junit/results-[hash].xml',
        toConsole: false,
      },
      cypressMochawesomeReporterReporterOptions: {
        reportDir: 'cypress/reports/mochawesome',
        charts: true,
        reportPageTitle: 'Application Register E2E Test Results',
        embeddedScreenshots: true,
        inlineAssets: true,
        html: true,
        json: true,
      },
    },
    video: true,
    videosFolder: 'cypress/reports/videos',
    screenshotOnRunFailure: true,
    screenshotsFolder: 'cypress/reports/screenshots',
    trashAssetsBeforeRuns: false,
    // Downloads Configuration
    downloadsFolder: 'cypress/downloads',
    async setupNodeEvents(on, config) {
      const fs = require('node:fs');
      const path = require('node:path');

      require('cypress-mochawesome-reporter/plugin')(on);
      await addCucumberPreprocessorPlugin(on, config);

      // Custom task to log accessibility violations
      on('task', {
        // Secure env access from Node context
        getEnv(key) {
          return config.env[key] || null;
        },
        logA11yViolations(violations) {
          const logPath = path.join(
            __dirname,
            'cypress/reports/a11y-violations.log',
          );
          fs.appendFileSync(
            logPath,
            JSON.stringify(violations, null, 2) + '\n',
          );
          return null;
        },
        // PDF helper tasks
        clearDownloadsFolder(downloadsPath) {
          if (fs.existsSync(downloadsPath)) {
            const files = fs.readdirSync(downloadsPath);
            for (const file of files) {
              if (file.endsWith('.pdf')) {
                fs.unlinkSync(path.join(downloadsPath, file));
              }
            }
          }
          return null;
        },
        listPdfFiles(downloadsPath) {
          if (!fs.existsSync(downloadsPath)) {
            return [];
          }
          const files = fs.readdirSync(downloadsPath);
          return files.filter((file) => file.endsWith('.pdf'));
        },
        async parsePdfContent(filePath) {
          if (!fs.existsSync(filePath)) {
            throw new Error(`PDF file not found: ${filePath}`);
          }

          const dataBuffer = fs.readFileSync(filePath);
          const parser = new PDFParse({ data: dataBuffer });
          const pdfData = await parser.getText();

          return {
            text: pdfData.text,
            numPages: pdfData.total,
            info: pdfData,
          };
        },
      });

      const appConfig = await loadAppConfig();

      const tags =
        process.env.TAGS ||
        process.env.CYPRESS_TAGS ||
        (config.env && config.env.TAGS);

      config.env = {
        ...config.env,
        SSO_USERS: {
          user1: {
            email: appConfigGet(appConfig, 'secrets.appreg.TEST-USER1-EMAIL'),
            password: appConfigGet(
              appConfig,
              'secrets.appreg.TEST-USERS-PASSWORD',
            ),
          },
          user2: {
            email: appConfigGet(appConfig, 'secrets.appreg.TEST-USER2-EMAIL'),
            password: appConfigGet(
              appConfig,
              'secrets.appreg.TEST-USERS-PASSWORD',
            ),
          },
          user3: {
            email: appConfigGet(appConfig, 'secrets.appreg.TEST-USER3-EMAIL'),
            password: appConfigGet(
              appConfig,
              'secrets.appreg.TEST-USERS-PASSWORD',
            ),
          },
          admin1: {
            email: appConfigGet(appConfig, 'secrets.appreg.TEST-ADMIN1-EMAIL'),
            password: appConfigGet(
              appConfig,
              'secrets.appreg.TEST-USERS-PASSWORD',
            ),
          },
          admin2: {
            email: appConfigGet(appConfig, 'secrets.appreg.TEST-ADMIN2-EMAIL'),
            password: appConfigGet(
              appConfig,
              'secrets.appreg.TEST-USERS-PASSWORD',
            ),
          },
          admin3: {
            email: appConfigGet(appConfig, 'secrets.appreg.TEST-ADMIN3-EMAIL'),
            password: appConfigGet(
              appConfig,
              'secrets.appreg.TEST-USERS-PASSWORD',
            ),
          },
        },
        CLIENT_ID: appConfigGet(appConfig, 'secrets.appreg.azure-app-id-fe'),
        CLIENT_SECRET: appConfigGet(
          appConfig,
          'secrets.appreg.azure-client-secret-fe',
        ),
        TENANT_ID: appConfigGet(appConfig, 'secrets.appreg.azure-tenant-id-fe'),
        SCOPE: `api://${appConfigGet(appConfig, 'secrets.appreg.azure-app-id-fe')}/frontend`,
        API_BASE_URL: appConfigGet(appConfig, 'api.baseUrl'),
        SESSION_COOKIE_NAME: appConfigGet(appConfig, 'session.cookieName'),
        ...(tags ? { TAGS: tags } : {}),
      };

      on(
        'file:preprocessor',
        createBundler({
          plugins: [createEsbuildPlugin(config)],
        }),
      );
      return config;
    },
  },
  component: {
    specPattern: 'cypress/component/**/*.cy.{js,ts}',
    supportFile: 'cypress/support/component.js',
    fixturesFolder: 'cypress/fixtures',
    devServer: {
      framework: 'angular',
      bundler: 'webpack',
    },
    baseUrl: process.env.TEST_URL || 'http://localhost:4000',
    // Component Test Report Configuration
    reporter: 'cypress-multi-reporters',
    reporterOptions: {
      reporterEnabled: 'cypress-mochawesome-reporter, mocha-junit-reporter',
      mochaJunitReporterReporterOptions: {
        mochaFile: 'cypress/reports/junit/component-results-[hash].xml',
        toConsole: false,
      },
      cypressMochawesomeReporterReporterOptions: {
        reportDir: 'cypress/reports/component',
        charts: true,
        reportPageTitle: 'Application Register Component Test Results',
        embeddedScreenshots: true,
        html: true,
        json: true,
      },
    },
  },
});
