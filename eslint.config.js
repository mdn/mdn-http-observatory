import path from "node:path";
import { fileURLToPath } from "node:url";

import { includeIgnoreFile } from "@eslint/config-helpers";
import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import prettierConfig from "eslint-config-prettier/flat";
import importX from "eslint-plugin-import-x";
import jsdoc from "eslint-plugin-jsdoc";
import n from "eslint-plugin-n";
import unicorn from "eslint-plugin-unicorn";
import tseslint from "typescript-eslint";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const gitignorePath = path.resolve(__dirname, ".gitignore");

export default defineConfig([
  includeIgnoreFile(gitignorePath),
  jsdoc.configs["flat/recommended"],
  n.configs["flat/recommended"],
  unicorn.configs["recommended"],
  { files: ["**/*.{js,mjs,cjs}"] },
  {
    files: ["**/*.{js,mjs,cjs}"],
    plugins: { js },
    extends: ["js/recommended"],
  },
  {
    files: ["**/*.{js,mjs,cjs}"],
    plugins: { "@typescript-eslint": tseslint.plugin },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: {
          // `.github` is a dot-directory, so TypeScript excludes it from the
          // project; allow its scripts to use the default inferred project.
          allowDefaultProject: [".github/scripts/*.js"],
        },
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      "@typescript-eslint/ban-ts-comment": [
        "error",
        {
          "ts-expect-error": false,
        },
      ],
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
      // Prefer the typescript-eslint versions of these overlapping core rules,
      // which understand type positions and JSDoc-referenced imports.
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-useless-constructor": "error",
    },
  },
  {
    rules: {
      // Disabled in favor of the typescript-eslint extension rules above.
      "no-useless-constructor": "off",
      "no-unused-vars": "off",
      "jsdoc/no-undefined-types": "off",
      "jsdoc/reject-any-type": "off",
      "jsdoc/require-jsdoc": "off",
      "jsdoc/require-param-description": "off",
      "jsdoc/require-param-type": "off",
      "jsdoc/require-property": "off",
      "jsdoc/require-property-description": "off",
      "jsdoc/require-returns": "off",
      "jsdoc/require-returns-description": "off",
      "jsdoc/require-returns-type": "off",
      "jsdoc/tag-lines": "off",
      "n/no-missing-import": "off",
      "n/no-unsupported-features/node-builtins": ["off"],
      "n/no-unpublished-import": "off",
      "unicorn/no-array-reverse": "off",
      "unicorn/no-array-sort": "off",
      "unicorn/no-array-callback-reference": "off",
      "unicorn/no-null": ["off"],
      "unicorn/prevent-abbreviations": ["off"],
      "unicorn/switch-case-braces": "off",
      "unicorn/template-indent": ["off"],
    },
  },
  {
    files: ["**/*.{js,mjs,cjs}"],
    plugins: { "import-x": importX },
    rules: {
      "sort-imports": "off",
      "import-x/order": [
        "error",
        {
          alphabetize: {
            order: "asc",
          },
          named: true,
          "newlines-between": "always-and-inside-groups",
        },
      ],
    },
  },
  {
    // The `node:test` runner awaits the promises returned by `describe`/`it`,
    // so floating promises in test files are expected rather than bugs.
    files: ["test/**/*.{js,mjs,cjs}"],
    rules: {
      "@typescript-eslint/no-floating-promises": "off",
      "@typescript-eslint/no-misused-promises": "off",
    },
  },
  {
    // Intentionally disabled: these rules are stylistic/opinionated or would
    // require behavior-affecting refactors, so they are left off pending a
    // decision rather than auto-fixed. Counts are violations at time of
    // writing. Re-enable individually if the team wants to adopt them.
    rules: {
      // Legitimate in a CLI/server entry point that exits with a status code.
      "n/no-process-exit": "off", // 5
      "unicorn/no-process-exit": "off", // 4
      // Stylistic control-flow preferences.
      "unicorn/prefer-ternary": "off", // 9
      "unicorn/no-negated-condition": "off", // 6
      "unicorn/no-array-for-each": "off", // 4
      "unicorn/no-array-reduce": "off", // 5
      // Structural / API-shape changes.
      "unicorn/no-anonymous-default-export": "off", // 5
      "unicorn/prefer-top-level-await": "off", // 2
      "unicorn/prefer-module": "off", // 1
      "unicorn/no-this-assignment": "off", // 1
      // File rename with import churn.
      "unicorn/filename-case": "off", // 1
    },
  },
  prettierConfig,
]);
