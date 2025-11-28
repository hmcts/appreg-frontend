const { defineConfig } = require('cypress');
const createBundler = require('@bahmutov/cypress-esbuild-preprocessor');
const {
  addCucumberPreprocessorPlugin,
} = require('@badeball/cypress-cucumber-preprocessor');
const {
  createEsbuildPlugin,
} = require('@badeball/cypress-cucumber-preprocessor/esbuild');

// Use process.stdout.write for direct output (no ESLint warnings)
const cypressLog = {
  info: (message) => process.stdout.write(`[cypress-config] ${message}\n`),
  warn: (message) =>
    process.stderr.write(`[cypress-config] WARNING: ${message}\n`),
};

async function loadAppConfig() {
  const appConfig = require('config');
  const nodeEnv = process.env.NODE_ENV || 'development';

  // Development uses staging vault secrets
  const vaultEnv =
    process.env.AKS_ENV || (nodeEnv === 'development' ? 'stg' : nodeEnv);

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
    reporter: 'cypress-mochawesome-reporter',
    reporterOptions: {
      reportDir: 'cypress/reports',
      reportPageTitle: 'AppregFrontend E2E Test Results',
      embeddedScreenshots: true,
      inlineAssets: true,
      autoOpen: false,
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
    screenshotsFolder: 'cypress/reports/screenshots',
    async setupNodeEvents(on, config) {
      // Custom task to log accessibility violations
      on('task', {
        logA11yViolations(violations) {
          const fs = require('node:fs');
          const path = require('node:path');
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
        CLIENT_SECRET: appConfigGet(appConfig, 'secrets.appreg.azure-client-secret-fe'),
        TENANT_ID: appConfigGet(appConfig, 'secrets.appreg.azure-tenant-id-fe'),
        SCOPE: appConfigGet(appConfig, 'auth.scopes', []).join(' '),
        API_BASE_URL: appConfigGet(appConfig, 'api.baseUrl'),
        SESSION_COOKIE_NAME: appConfigGet(appConfig, 'session.cookieName'),
      };
      await addCucumberPreprocessorPlugin(on, config);
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
