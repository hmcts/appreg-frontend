module.exports = {
<<<<<<< HEAD
  preset: "jest-preset-angular",
  roots: ["<rootDir>/src/test/unit"],
  testMatch: ["**/+(*.)+(spec|test).+(ts)"],
  setupFilesAfterEnv: ["<rootDir>/setup.jest.ts"],
  moduleFileExtensions: ["ts", "js", "html", "json"],

  transform: {
    "^.+\\.(ts|js|html)$": [
      "jest-preset-angular",
      {
        tsconfig: "<rootDir>/tsconfig.spec.json",
        stringifyContentPathRegex: "\\.html$",
=======
  preset: 'jest-preset-angular',
  roots: ['<rootDir>/src/test/unit'],
  testMatch: ['**/+(*.)+(spec|test).+(ts)'],
  setupFilesAfterEnv: ['<rootDir>/setup.jest.ts'],
  moduleFileExtensions: ['ts', 'js', 'html', 'json'],

  transform: {
    '^.+\\.(ts|js|html)$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        stringifyContentPathRegex: '\\.html$',
>>>>>>> 38048e2 (Rebasing Code)
      },
    ],
  },

  moduleNameMapper: {
<<<<<<< HEAD
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    "\\.(jpg|jpeg|png|gif|svg)$": "<rootDir>/__mocks__/file-mock.js",
    "^@app/(.*)$": "<rootDir>/src/app/$1",
    "^@env/(.*)$": "<rootDir>/src/environments/$1",
  },

  transformIgnorePatterns: ["node_modules/(?!.*\\.mjs$)"],
  coverageDirectory: "<rootDir>/coverage",
  coverageReporters: ["html", "lcov", "text"],
=======
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/__mocks__/file-mock.js',
    '^@app/(.*)$': '<rootDir>/src/app/$1',
    '^@env/(.*)$': '<rootDir>/src/environments/$1',
  },

  transformIgnorePatterns: ['node_modules/(?!.*\\.mjs$)'],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['html', 'lcov', 'text'],
>>>>>>> 38048e2 (Rebasing Code)
};
