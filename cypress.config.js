const { defineConfig } = require("cypress");
const createBundler = require("@bahmutov/cypress-esbuild-preprocessor");
const {
  addCucumberPreprocessorPlugin,
} = require("@badeball/cypress-cucumber-preprocessor");
const {
  createEsbuildPlugin,
} = require("@badeball/cypress-cucumber-preprocessor/esbuild");

module.exports = defineConfig({
  typescript: {
    configFile: "tsconfig.cypress.json",
  },
  e2e: {
    // Report Configuration
    reporter: "cypress-multi-reporters",
    reporterOptions: {
      reporterEnabled: "cypress-mochawesome-reporter, mocha-junit-reporter",
      mochaJunitReporterReporterOptions: {
        mochaFile: "cypress/reports/junit/e2e-results-[hash].xml",
        toConsole: false,
      },
      cypressMochawesomeReporterReporterOptions: {
        reportDir: "cypress/reports/e2e",
        charts: true,
        reportPageTitle: "Application Register E2E Test Results",
        embeddedScreenshots: true,
        html: true,
        json: true,
      },
    },
    // Test Files Configuration
    specPattern: "cypress/e2e/**/*.feature",
    supportFile: "cypress/support/e2e.ts",
    fixturesFolder: "cypress/fixtures",

    // Base URL and Timeouts
    baseUrl: process.env.BASE_URL || "http://localhost:4000",
    defaultCommandTimeout: 20000,
    pageLoadTimeout: 120000,
    requestTimeout: 20000,
    responseTimeout: 30000,

    // Browser and Security Settings
    chromeWebSecurity: false,
    experimentalModifyObstructiveThirdPartyCode: true,
    experimentalOriginDependencies: true,

    // Report and Media Settings
    video: false,
    screenshotOnRunFailure: true,
    screenshotsFolder: "cypress/reports/html/screenshots",
    async setupNodeEvents(on, config) {
      require("cypress-mochawesome-reporter/plugin")(on);
      // Set up environment variables for Microsoft AD login
      config.env = {
        ...config.env,
        SSO_USERS: {
          default: {
            email:
              process.env.CYPRESS_TEST_EMAIL ||
              process.env.TEST_USER_EMAIL ||
              "opal-test@hmcts.net",
            password:
              process.env.CYPRESS_TEST_PASSWORD ||
              process.env.TEST_USER_PASSWORD ||
              "OpalFinesService1",
          },
          admin: {
            email:
              process.env.ADMIN_TEST_EMAIL ||
              process.env.TEST_ADMIN_EMAIL ||
              "opal-test@hmcts.net",
            password:
              process.env.ADMIN_TEST_PASSWORD ||
              process.env.TEST_ADMIN_PASSWORD ||
              "OpalFinesService1",
          },
        },
      };

      await addCucumberPreprocessorPlugin(on, {
        ...config,
        cucumber: {
          stepDefinitions: "cypress/e2e/step_definitions/**/*.ts",
        },
      });
      on(
        "file:preprocessor",
        createBundler({
          plugins: [createEsbuildPlugin(config)],
        }),
      );
      return config;
    },
  },
  component: {
    specPattern: "cypress/component/**/*.cy.{js,ts}",
    supportFile: "cypress/support/component.js",
    fixturesFolder: "cypress/fixtures",
    devServer: {
      framework: "angular",
      bundler: "webpack",
    },
    baseUrl: process.env.BASE_URL || "http://localhost:4000",
    // Component Test Report Configuration
    reporter: "cypress-multi-reporters",
    reporterOptions: {
      reporterEnabled: "cypress-mochawesome-reporter, mocha-junit-reporter",
      mochaJunitReporterReporterOptions: {
        mochaFile: "cypress/reports/junit/component-results-[hash].xml",
        toConsole: false,
      },
      cypressMochawesomeReporterReporterOptions: {
        reportDir: "cypress/reports/component",
        charts: true,
        reportPageTitle: "Application Register Component Test Results",
        embeddedScreenshots: true,
        html: true,
        json: true,
      },
    },
  },
});
