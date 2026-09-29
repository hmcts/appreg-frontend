// jest.a11y.config.js
module.exports = {
  // Give this project a name so you can run it in isolation
  displayName: 'a11y',

  // Run in a Node environment since we're using fetch/pa11y
  testEnvironment: 'node',

  // Look for a11y tests anywhere in the project
  roots: ['<rootDir>/'],

  // Match files ending in .a11y.spec.ts
  testMatch: ['**/*.a11y.spec.ts'],

  // Use ts-jest to compile TS tests
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        useESM: true,
      },
    ],
  },

  // Pa11y 10 loads Puppeteer 25, which is published as ESM.
  extensionsToTreatAsEsm: ['.ts'],
  transformIgnorePatterns: ['/node_modules/(?!puppeteer|puppeteer-core/)'],

  // Recognize TypeScript and JavaScript
  moduleFileExtensions: ['ts', 'js', 'json'],

  // Increase timeout, since pa11y can be slow
  testTimeout: 30000,
};
