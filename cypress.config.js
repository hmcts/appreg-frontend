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
    async setupNodeEvents(on, config) {
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
