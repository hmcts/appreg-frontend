const { defineConfig } = require("cypress");
const createBundler = require("@bahmutov/cypress-esbuild-preprocessor");
const {
  addCucumberPreprocessorPlugin,
} = require("@badeball/cypress-cucumber-preprocessor");
const {
  createEsbuildPlugin,
} = require("@badeball/cypress-cucumber-preprocessor/esbuild");

module.exports = defineConfig({
  e2e: {
    specPattern: "cypress/e2e/**/*.feature",
    supportFile: "cypress/support/e2e.ts",
    fixturesFolder: "cypress/fixtures",
    baseUrl: process.env.BASE_URL || "http://localhost:4000",
    defaultCommandTimeout: 20000,
    pageLoadTimeout: 120000,
    requestTimeout: 20000,
    responseTimeout: 30000,
    chromeWebSecurity: false,
    experimentalModifyObstructiveThirdPartyCode: true,
    async setupNodeEvents(on, config) {
      // Set up environment variables for Microsoft AD login
      config.env = {
        ...config.env,
        SSO_USERS: {
          default: {
            email: process.env.CYPRESS_TEST_EMAIL || process.env.TEST_USER_EMAIL || 'preksha.jain1@hmcts.net',
            password: process.env.CYPRESS_TEST_PASSWORD || process.env.TEST_USER_PASSWORD || 'Test@123'
          },
          admin: {
            email: process.env.ADMIN_TEST_EMAIL || process.env.TEST_ADMIN_EMAIL || 'admin@example.com',
            password: process.env.ADMIN_TEST_PASSWORD || process.env.TEST_ADMIN_PASSWORD || 'Admin@123'
          }
        }
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
  },
});
