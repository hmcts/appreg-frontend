// eslint-disable-next-line node/no-unpublished-require
<<<<<<< HEAD
const { pathsToModuleNameMapper } = require("ts-jest");

const { compilerOptions } = require("./tsconfig.spec.json");

module.exports = {
  preset: "jest-preset-angular",
  displayName: "routes",

  // Only look in the routes test directory
  roots: ["<rootDir>/src/test/routes"],

  // Match files ending with .routes.spec.ts or .routing.spec.ts
  testMatch: ["**/?(*.)+(routes|routing).spec.ts"],

  // Bootstrap the Angular testing environment
  setupFilesAfterEnv: ["<rootDir>/setup.jest.ts"],

  // Recognize these extensions
  moduleFileExtensions: ["ts", "js", "html", "json"],

  // Transform TS, JS, HTML via jest-preset-angular
  transform: {
    "^.+\\.(ts|js|html)$": [
      "jest-preset-angular",
      {
        tsconfig: "<rootDir>/tsconfig.spec.json",
        stringifyContentPathRegex: "\\.(html|svg)$",
=======
const { pathsToModuleNameMapper } = require('ts-jest');

const { compilerOptions } = require('./tsconfig.spec.json');

module.exports = {
  preset: 'jest-preset-angular',
  displayName: 'routes',

  // Only look in the routes test directory
  roots: ['<rootDir>/src/test/routes'],

  // Match files ending with .routes.spec.ts or .routing.spec.ts
  testMatch: ['**/?(*.)+(routes|routing).spec.ts'],

  // Bootstrap the Angular testing environment
  setupFilesAfterEnv: ['<rootDir>/setup.jest.ts'],

  // Recognize these extensions
  moduleFileExtensions: ['ts', 'js', 'html', 'json'],

  // Transform TS, JS, HTML via jest-preset-angular
  transform: {
    '^.+\\.(ts|js|html)$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        stringifyContentPathRegex: '\\.(html|svg)$',
>>>>>>> 38048e2 (Rebasing Code)
      },
    ],
  },

  // Map paths from tsconfig
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths || {}, {
<<<<<<< HEAD
    prefix: "<rootDir>/",
  }),
  transformIgnorePatterns: ["node_modules/(?!.*\\.mjs$)"],
=======
    prefix: '<rootDir>/',
  }),
  transformIgnorePatterns: ['node_modules/(?!.*\\.mjs$)'],
>>>>>>> 38048e2 (Rebasing Code)
  collectCoverage: false,
};
