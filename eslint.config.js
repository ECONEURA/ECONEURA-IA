// Modern ESLint Flat Configuration for ECONEURA
// This replaces .eslintrc.cjs while maintaining all existing rules
import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';

export default [
  // Base configuration for all files
  {
    ...js.configs.recommended,
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        node: true,
        es2022: true,
      },
    },
    rules: {
      // Preserve existing rules from .eslintrc.cjs
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': 'warn',
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },
  
  // TypeScript specific configuration
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      // TypeScript specific rules
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-unused-vars': 'off', // Turn off base rule as it's covered by TypeScript
    },
  },
  
  // Global ignores (replaces .eslintignore)
  {
    ignores: [
      'dist/',
      'build/',
      'node_modules/',
      '*.min.js',
      '.tsbuildinfo',
      '.next/**',
      'out/**',
      'next-env.d.ts',
      'coverage/**',
      'test-results/**',
    ],
  },
];