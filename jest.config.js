const useStub = process.env.OPENAPI_STUB === '1'; // Allows for offline testing of OpenAPI tests

module.exports = {
  preset: 'jest-preset-angular',
  roots: ['<rootDir>/test/unit'],
  testMatch: ['**/+(*.)+(spec|test).+(ts)'],
  setupFilesAfterEnv: ['<rootDir>/setup.jest.ts'],
  moduleFileExtensions: ['ts', 'js', 'html', 'json'],

  transform: {
    '^.+\\.(ts|js|html)$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        stringifyContentPathRegex: '\\.html$',
      },
    ],
  },

  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/__mocks__/file-mock.js',
    '^@app/(.*)$': '<rootDir>/src/app/$1',
    '^@env/(.*)$': '<rootDir>/src/environments/$1',
    '^src/app/core/openapi$': useStub
      ? '<rootDir>/test/stubs/openapi.stub.ts'
      : '<rootDir>/src/app/core/openapi',
  },

  transformIgnorePatterns: ['node_modules/(?!.*\\.mjs$)'],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['html', 'lcov', 'text'],
};
