module.exports = {
  preset: 'jest-preset-angular',
  coverageProvider: 'v8',
  roots: ['<rootDir>/test/unit'],
  testMatch: ['**/+(*.)+(spec|test).+(ts)'],
  setupFilesAfterEnv: ['<rootDir>/setup.jest.ts'],
  moduleFileExtensions: ['ts', 'js', 'html', 'json'],

  transform: {
    '^.+\\.(ts|js|html)$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        stringifyContentPathRegex: String.raw`\.html$`,
      },
    ],
  },

  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/__mocks__/file-mock.js',
    '^@app/(.*)$': '<rootDir>/src/app/$1',
    '^@env/(.*)$': '<rootDir>/src/environments/$1',
    '^@components/(.*)$': [
      '<rootDir>/src/app/shared/components/$1',
      '<rootDir>/src/app/core/components/$1',
      '<rootDir>/src/app/pages/$1',
    ],
    '^@util/(.*)$': [
      '<rootDir>/src/app/shared/util/$1',
      '<rootDir>/src/app/core/util/$1',
    ],
    '^@openapi$': '<rootDir>/src/generated/openapi',
    '^@page-types/(.*)$': '<rootDir>/src/app/pages/$1/util/types',
    '^@shared-types/(.*)$': '<rootDir>/src/app/shared/models/$1',
    '^@core-types/(.*)$': '<rootDir>/src/app/core/models/$1',
    '^@entry-create-util/(.*)$':
      '<rootDir>/src/app/pages/applications-list-entry-create/util/$1',
    '^@constants/(.*)$': '<rootDir>/src/app/shared/constants/$1',
    '^@services/(.*)$': [
      '<rootDir>/src/app/shared/services/$1',
      '<rootDir>/src/app/core/services/$1',
    ],
    '^@context/(.*)$': '<rootDir>/src/app/shared/context/$1',
    '^@validators/(.*)$': '<rootDir>/src/app/shared/validators/$1',
    '^@interceptors/(.*)$': [
      '<rootDir>/src/app/core/interceptors/$1',
      '<rootDir>/src/app/shared/interceptors/$1',
    ],
    '^@guards/(.*)$': ['<rootDir>/src/app/guards/$1'],
  },

  transformIgnorePatterns: [String.raw`node_modules/(?!.*\.mjs$)`],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['html', 'lcov', 'text'],
};
