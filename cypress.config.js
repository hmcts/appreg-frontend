
const { defineConfig } = require('cypress');
const createBundler = require('@bahmutov/cypress-esbuild-preprocessor');
const {
  addCucumberPreprocessorPlugin,
} = require('@badeball/cypress-cucumber-preprocessor');
const {
  createEsbuildPlugin,
} = require('@badeball/cypress-cucumber-preprocessor/esbuild');
async function loadAppConfig() {
  const appConfig = require('config');
  const nodeEnv = process.env.NODE_ENV || 'development';
  
  try {
    if (nodeEnv === 'development') {
      console.log('[cypress] Attempting to load Azure vault secrets for development');
      const { addFromAzureVault } = require('@hmcts/properties-volume');
      await addFromAzureVault(appConfig, {
        pathToHelmChart: 'charts/appreg-frontend/values.yaml',
        env: process.env.AKS_ENV || 'stg',
      });
      console.log('[cypress] Azure vault secrets loaded successfully');
    } else {
      console.log('[cypress] Loading mounted secrets via properties-volume');
      const pv = require('@hmcts/properties-volume');
      pv.addTo(appConfig);
    }
  } catch (err) {
    if (nodeEnv === 'development') {
      console.warn('[cypress] Azure vault not available, falling back to local development.json');
    } else {
      console.warn('[cypress] properties-volume not loaded:', err?.message || err);
    }
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
    reporter: 'cypress-mochawesome-reporter',
    reporterOptions: {
      reportFilename: '[datetime]-[name]-report',
      reportDir: 'cypress/reports/e2e/html',
      embeddedScreenshots: true,
      charts: true,
      reportPageTitle: 'AppregFrontend E2E Test Results',
      inlineAssets: true,
      saveAllAttempts: false,
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
    // Browser and Security Settings
    chromeWebSecurity: false,
    experimentalModifyObstructiveThirdPartyCode: true,
    experimentalOriginDependencies: true,
    testIsolation: true,
    // Report and Media Settings
    video: false,
    screenshotOnRunFailure: true,
    screenshotsFolder: 'cypress/reports/html/screenshots',
    async setupNodeEvents(on, config) {
      // Custom task to log accessibility violations
      on('task', {
        logA11yViolations(violations) {
          const fs = require('fs');
          const path = require('path');
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
      });
      require('cypress-mochawesome-reporter/plugin')(on);

      const appConfig = await loadAppConfig();

      config.env = {
        ...config.env,
        SSO_USERS: {
          user1: {
            email:
              appConfigGet(appConfig, 'secrets.appreg.TEST-USER1-EMAIL', 'ar-test-1@hmcts.net'),
            password: appConfigGet(appConfig, 'secrets.appreg.TEST-USERS-PASSWORD', ''),
          },
          user2: {
            email:
              appConfigGet(appConfig, 'secrets.appreg.TEST-USER2-EMAIL', 'ar-test-2@hmcts.net'),
            password: appConfigGet(appConfig, 'secrets.appreg.TEST-USERS-PASSWORD', ''),
          },
          user3: {
            email:
              appConfigGet(appConfig, 'secrets.appreg.TEST-USER3-EMAIL', 'ar-test-3@hmcts.net'),
            password: appConfigGet(appConfig, 'secrets.appreg.TEST-USERS-PASSWORD', ''),
          },
          admin1: {
            email:
              appConfigGet(appConfig, 'secrets.appreg.TEST-ADMIN1-EMAIL', 'ar-test-4@hmcts.net'),
            password: appConfigGet(appConfig, 'secrets.appreg.TEST-USERS-PASSWORD', ''),
          },
          admin2: {
            email:
              appConfigGet(appConfig, 'secrets.appreg.TEST-ADMIN2-EMAIL', 'ar-test-5@hmcts.net'),
            password: appConfigGet(appConfig, 'secrets.appreg.TEST-USERS-PASSWORD', ''),
          },
          admin3: {
            email:
              appConfigGet(appConfig, 'secrets.appreg.TEST-ADMIN3-EMAIL', 'ar-test-6@hmcts.net'),
            password: appConfigGet(appConfig, 'secrets.appreg.TEST-USERS-PASSWORD', ''),
          },
        },
      };
      await addCucumberPreprocessorPlugin(on, {
        ...config,
        cucumber: {
          stepDefinitions: 'cypress/e2e/step_definitions/**/*.ts',
        },
      });
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