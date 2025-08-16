/* eslint.config.js */
const { defineConfig, globalIgnores } = require("eslint/config");
const globals = require("globals");
const js = require("@eslint/js");
const { FlatCompat } = require("@eslint/eslintrc");
const { fixupPluginRules, fixupConfigRules } = require("@eslint/compat");

const tsParser = require("@typescript-eslint/parser");
const tsEslintPlugin = require("@typescript-eslint/eslint-plugin");

const importPlugin = require("eslint-plugin-import");
const jestPlugin = require("eslint-plugin-jest");
const nodePlugin = require("eslint-plugin-node");

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

  // Base (shared) – no type-aware parser configured here
  {
    plugins: {
      import: fixupPluginRules(importPlugin),
      jest: fixupPluginRules(jestPlugin),
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
      ecmaVersion: 2018,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
        Atomics: "readonly",
        SharedArrayBuffer: "readonly",
      },
    },
    // Keep the import resolver here (non-parser); point it at ONE project.
    settings: {
      "import/resolver": {
        typescript: {
          project: ["./tsconfig.eslint.json"],
        },
      },
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
  },

  // APPLICATION / LIBRARY TS (type-aware) — explicitly exclude tests here
  {
    files: ["**/*.ts", "**/*.tsx"],
    ignores: [
      "**/*.spec.ts",
      "**/*.test.ts",
      "**/*.routes.spec.ts",
      "**/*.a11y.spec.ts",
      "test/**",
    ],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        // exactly one project for this block
        project: "./tsconfig.eslint.json",
        tsconfigRootDir: __dirname,
        noWarnOnMultipleProjects: true, // hard stop for the warning
      },
    },
    plugins: { "@typescript-eslint": fixupPluginRules(tsEslintPlugin) },
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

  // TESTS (type-aware), with their own single project + resolver scoped here
  {
    files: [
      "**/*.spec.ts",
      "**/*.test.ts",
      "**/*.routes.spec.ts",
      "**/*.a11y.spec.ts",
    ],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        // exactly one project for tests
        project: "./test/tsconfig.json",
        tsconfigRootDir: __dirname,
        noWarnOnMultipleProjects: true, // belt-and-braces
      },
      globals: { ...globals.jest },
    },
    // Make the import resolver use the TEST tsconfig for these files only
    settings: {
      "import/resolver": {
        typescript: {
          project: ["./test/tsconfig.json"],
        },
      },
    },
    plugins: { "@typescript-eslint": fixupPluginRules(tsEslintPlugin) },
    extends: fixupConfigRules(
      compat.extends(
        "plugin:@typescript-eslint/eslint-recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:@typescript-eslint/recommended-requiring-type-checking",
      ),
    ),
    rules: {
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
    },
  },

  // Cypress step definitions (no type-aware parsing)
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
