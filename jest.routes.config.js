const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('./tsconfig.spec.json');

module.exports = {
  displayName: 'routes',
  testEnvironment: 'node',

  // Only look in the routes test directory
  roots: ['<rootDir>/test/routes'],

  // Match all .spec.ts in that folder
  testMatch: ['**/*.spec.ts'],

  // IMPORTANT: do not load Angular/Zone setup for Node route tests
  setupFilesAfterEnv: [],

  // Recognized extensions
  moduleFileExtensions: ['ts', 'js', 'json'],

  // Use ts-jest to compile TS
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
      },
    ],
    '^.+\\.m?js$': [
      'ts-jest',
      {
        tsconfig: {
          target: 'ES2022',
          module: 'CommonJS',
          esModuleInterop: true,
          allowJs: true,
        },
      },
    ],
  },

  // Map tsconfig paths
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths || {}, {
    prefix: '<rootDir>/',
  }),

  // The v4 proxy and its ESM dependencies need transformation for Jest's CJS runner.
  transformIgnorePatterns: [
    '/node_modules/(?!(http-proxy-middleware|httpxy|is-plain-obj)/)',
  ],

  collectCoverage: false,

  // Nice to have for isolated tests
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};
