// https://eslint.org/docs/latest/use/configure/configuration-files
const js = require('@eslint/js');
const ts = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');
const reactRecommended = require('eslint-plugin-react/configs/recommended.js');
const reactNative = require('eslint-plugin-react-native');
const globals = require('globals');

// Common rules for both JS and TS
const commonRules = {
  ...js.configs.recommended.rules,
  'react/prop-types': 'off', // Not needed with TypeScript
};

module.exports = [
  // Base JS config
  {
    files: ['**/*.{js,jsx,mjs,cjs}'],
    ignores: ['**/*.d.ts', 'node_modules/', '**/node_modules/'],
    languageOptions: {
      sourceType: 'module',
      ecmaVersion: 'latest',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      'react-native': reactNative,
    },
    rules: {
      ...commonRules,
      'react-native/no-unused-styles': 'warn',
      'react-native/split-platform-components': 'warn',
      'react-native/no-inline-styles': 'warn',
      'react-native/no-color-literals': 'warn',
      'react-native/no-raw-text': 'warn',
    },
  },
  // TypeScript config
  {
    files: ['**/*.{ts,tsx}'],
    ignores: ['**/*.d.ts', 'node_modules/', '**/node_modules/'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        project: './tsconfig.json',
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      '@typescript-eslint': ts,
      'react-native': reactNative,
    },
    rules: {
      ...ts.configs['recommended'].rules,
      ...ts.configs['eslint-recommended'].rules,
      ...commonRules,
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-require-imports': 'error',
      'react-native/no-unused-styles': 'warn',
      'react-native/split-platform-components': 'warn',
      'react-native/no-inline-styles': 'warn',
      'react-native/no-color-literals': 'warn',
      'react-native/no-raw-text': 'warn',
    },
  },
  // React Native specific rules
  {
    files: ['**/*.{jsx,tsx}'],
    rules: {
      'react-native/no-inline-styles': 'warn',
      'react-native/no-color-literals': 'warn',
    },
  },
];
