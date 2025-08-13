module.exports = {
  // Identify this suite
  displayName: 'smoke',

  // Use Node environment for HTTP requests
  testEnvironment: 'node',

  // Increase timeout for network calls
  testTimeout: 30000,

  // Only load tests from the smoke folder
  roots: ['<rootDir>/src/test/smoke'],

  // Match files ending in .smoke.spec.ts
  testMatch: ['**/*.smoke.spec.ts'],

  // Compile TypeScript for tests
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },

  // File extensions to recognize
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
};
