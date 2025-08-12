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
    specPattern: "src/test/functional/**/*.feature",
    baseUrl: process.env.BASE_URL || "http://localhost:4000",
    supportFile: false,

    async setupNodeEvents(on, config) {
      await addCucumberPreprocessorPlugin(on, config, {
        stepDefinitions: ["src/test/functional/steps/**/*.steps.ts"],
      });

      on(
        "file:preprocessor",
        createBundler({
          plugins: [createEsbuildPlugin(config)],
          tsconfig: "src/test/tsconfig.json",
        }),
      );

      return config;
    },

    defaultCommandTimeout: 10000,
    pageLoadTimeout: 30000,
  },
});
