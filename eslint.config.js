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
    // Ratcheting baseline: these rules currently report violations and are
    // temporarily disabled so the tree lints clean. They are being re-enabled
    // and fixed one at a time, each in its own commit.
    rules: {
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-floating-promises": "off",
      "@typescript-eslint/no-misused-promises": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-useless-constructor": "off",
      "jsdoc/require-param": "off",
      "jsdoc/valid-types": "off",
      "n/hashbang": "off",
      "n/no-process-exit": "off",
      "no-useless-assignment": "off",
      "no-useless-escape": "off",
      "preserve-caught-error": "off",
      "unicorn/catch-error-name": "off",
      "unicorn/explicit-length-check": "off",
      "unicorn/filename-case": "off",
      "unicorn/import-style": "off",
      "unicorn/new-for-builtins": "off",
      "unicorn/no-anonymous-default-export": "off",
      "unicorn/no-array-for-each": "off",
      "unicorn/no-array-reduce": "off",
      "unicorn/no-await-expression-member": "off",
      "unicorn/no-for-loop": "off",
      "unicorn/no-lonely-if": "off",
      "unicorn/no-negated-condition": "off",
      "unicorn/no-process-exit": "off",
      "unicorn/no-this-assignment": "off",
      "unicorn/numeric-separators-style": "off",
      "unicorn/prefer-array-flat-map": "off",
      "unicorn/prefer-array-some": "off",
      "unicorn/prefer-at": "off",
      "unicorn/prefer-code-point": "off",
      "unicorn/prefer-includes": "off",
      "unicorn/prefer-module": "off",
      "unicorn/prefer-node-protocol": "off",
      "unicorn/prefer-number-properties": "off",
      "unicorn/prefer-optional-catch-binding": "off",
      "unicorn/prefer-set-has": "off",
      "unicorn/prefer-spread": "off",
      "unicorn/prefer-string-replace-all": "off",
      "unicorn/prefer-string-slice": "off",
      "unicorn/prefer-switch": "off",
      "unicorn/prefer-ternary": "off",
      "unicorn/prefer-top-level-await": "off",
    },
  },
  prettierConfig,
]);
