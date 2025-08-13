const { defineConfig, globalIgnores } = require("eslint/config");
const globals = require("globals");
const tsParser = require("@typescript-eslint/parser");

const importPlugin = require("eslint-plugin-import");
const jestPlugin = require("eslint-plugin-jest");
const tsEslintPlugin = require("@typescript-eslint/eslint-plugin");
const nodePlugin = require("eslint-plugin-node");

const { fixupPluginRules, fixupConfigRules } = require("@eslint/compat");
const js = require("@eslint/js");
const { FlatCompat } = require("@eslint/eslintrc");

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

module.exports = defineConfig([
  // Ignore build output and helper files
  globalIgnores([
    ".angular/",
    "dist/",
    "node_modules/",
    ".yarn/",
    "eslint.config.js",
    "coverage/",
    "setup.jest.ts",
    "setup.a11y.ts",
    "**/*.d.ts",
    "jest.*config.js",
    ".eslintrc.js",
    "**/*.js",
    ".pnp.*",
  ]),

  // Allow dev-only requires in config files
  {
    files: ["**/*.config.js", "**/jest.routes.config.js"],
    plugins: {
      node: fixupPluginRules(nodePlugin),
    },
    rules: {
      "node/no-unpublished-require": "off",
      "node/no-missing-require": "off",
    },
  },

  // Base JS rules and plugins
  {
    plugins: {
      import: fixupPluginRules(importPlugin),
      jest: fixupPluginRules(jestPlugin),
      node: fixupPluginRules(nodePlugin),
      "@typescript-eslint": fixupPluginRules(tsEslintPlugin),
    },
    extends: fixupConfigRules(
      compat.extends(
        "eslint:recommended",
        "plugin:import/errors",
        "plugin:import/warnings",
        "plugin:import/typescript",
        "plugin:node/recommended",
        "prettier",
      ),
    ),
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        Atomics: "readonly",
        SharedArrayBuffer: "readonly",
      },
      ecmaVersion: 2018,
      sourceType: "module",
    },
    rules: {
      curly: "error",
      eqeqeq: "error",
      "no-console": "warn",
      "no-return-await": "error",
      "no-unneeded-ternary": ["error", { defaultAssignment: false }],
      "object-curly-spacing": ["error", "always"],
      "object-shorthand": ["error", "properties"],
      quotes: [
        "error",
        "single",
        { allowTemplateLiterals: false, avoidEscape: true },
      ],
      semi: ["error", "always"],
      "sort-imports": [
        "error",
        {
          allowSeparatedGroups: false,
          ignoreCase: false,
          ignoreDeclarationSort: true,
          ignoreMemberSort: false,
        },
      ],
      "import/no-duplicates": "error",
      "import/no-named-as-default": "error",
      "import/order": [
        "error",
        {
          alphabetize: { order: "asc", caseInsensitive: false },
          "newlines-between": "always",
        },
      ],
      "jest/prefer-to-have-length": "error",
      "jest/valid-expect": "off",
    },
  },

  // TypeScript files linting (enable type-checking)
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "./tsconfig.eslint.json",
        tsconfigRootDir: __dirname,
      },
    },
    plugins: {
      "@typescript-eslint": fixupPluginRules(tsEslintPlugin),
    },
    extends: fixupConfigRules(
      compat.extends(
        "plugin:@typescript-eslint/eslint-recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:@typescript-eslint/recommended-requiring-type-checking",
      ),
    ),
    rules: {
      "@typescript-eslint/array-type": "error",
      "@typescript-eslint/explicit-module-boundary-types": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-shadow": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { ignoreRestSiblings: true },
      ],
      "@typescript-eslint/no-var-requires": "off",
      "node/no-unsupported-features/es-syntax": "off",
      "node/no-missing-import": "off",
      "import/order": "off",
    },
    settings: {
      "import/resolver": {
        typescript: {
          project: "./tsconfig.eslint.json",
        },
      },
    },
  },

  // Jest test files override
  {
    files: [
      "**/*.spec.ts",
      "**/*.test.ts",
      "**/*.routes.spec.ts",
      "**/*.a11y.spec.ts",
    ],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
    rules: {
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
    },
  },

  // Cypress step definitions (no type-checking)
  {
    files: ["src/test/functional/**/*.steps.ts"],
    plugins: {
      node: fixupPluginRules(nodePlugin),
    },
    languageOptions: {
      globals: {
        ...globals.cypress,
        Given: "readonly",
        When: "readonly",
        Then: "readonly",
        Feature: "readonly",
        Scenario: "readonly",
        Before: "readonly",
        After: "readonly",
      },
      // Note: no parserOptions.project here
    },
    rules: {
      // disable node import checks
      "node/no-unpublished-import": "off",
      "node/no-unpublished-require": "off",
      "node/no-missing-import": "off",

      // disable all the unsafe-* rules in these test files
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
    },
  },

  // Server entrypoints
  {
    files: ["src/main.ts", "src/server.ts"],
    rules: {
      "no-console": "off",
    },
  },

  // Cypress config file override
  {
    files: ["cypress.config.js"],
    plugins: {
      node: fixupPluginRules(nodePlugin),
    },
    rules: {
      "node/no-unpublished-require": "off",
      "node/no-missing-require": "off",
      "import/order": "off",
      quotes: "off",
    },
  },
]);
