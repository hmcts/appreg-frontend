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
    "coverage/",
    "setup.jest.ts",
    "setup.a11y.ts",
    "**/*.d.ts",
    "jest.*config.js",
    ".eslintrc.js",
    "eslint.config.js",
    ".pnp.*",
  ]),

  // Base JS/TS-agnostic rules and plugins (no Node rules here)
  {
    plugins: {
      import: fixupPluginRules(importPlugin),
      jest: fixupPluginRules(jestPlugin),
      "@typescript-eslint": fixupPluginRules(tsEslintPlugin),
    },
    extends: fixupConfigRules(
      compat.extends(
        "eslint:recommended",
        "plugin:import/errors",
        "plugin:import/warnings",
        "plugin:import/typescript",
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
      quotes: ["error", "single", { allowTemplateLiterals: false, avoidEscape: true }],
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
    settings: {
      "import/resolver": {
        typescript: {
          project: ["./tsconfig.eslint.json", "./test/tsconfig.json"],
        },
      },
    },
  },

  // TypeScript files (type-aware)
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: ["./tsconfig.eslint.json", "./test/tsconfig.json"],
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
      "@typescript-eslint/no-unused-vars": ["error", { ignoreRestSiblings: true }],
      "@typescript-eslint/no-var-requires": "off",
    },
  },

  // JS config files (Node context)
  {
    files: ["**/*.config.js", "**/jest.routes.config.js", "cypress.config.js"],
    plugins: { node: fixupPluginRules(nodePlugin) },
    extends: fixupConfigRules(compat.extends("plugin:node/recommended")),
    rules: {
      "node/no-unpublished-require": "off",
      "node/no-missing-require": "off",
      "import/order": "off", // optional: configs often group imports differently
      quotes: "off",         // optional
    },
  },

  // Jest test files override (keeps your “unsafe-*” relaxed for tests)
  {
    files: ["**/*.spec.ts", "**/*.test.ts", "**/*.routes.spec.ts", "**/*.a11y.spec.ts"],
    languageOptions: { globals: { ...globals.jest } },
    rules: {
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
    },
  },

  // Cypress step definitions (no type-aware parsing here)
  {
    files: ["test/functional/**/*.steps.ts"],
    plugins: { node: fixupPluginRules(nodePlugin) },
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
    },
    rules: {
      "node/no-unpublished-import": "off",
      "node/no-unpublished-require": "off",
      "node/no-missing-import": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
    },
  },

  // Server entrypoints (allow console)
  {
    files: ["src/main.ts", "src/server.ts"],
    rules: { "no-console": "off" },
  },
]);
