import js from '@eslint/js'
import ts from 'typescript-eslint'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import importPlugin from 'eslint-plugin-import'
import security from 'eslint-plugin-security'
import promise from 'eslint-plugin-promise'
import unusedImports from 'eslint-plugin-unused-imports'

export default [
  js.configs.recommended,
  ...ts.configs.recommended,
  react.configs.flat.recommended,
  react.configs.flat['jsx-runtime'],
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      parser: ts.parser,
      parserOptions: {
        project: false,
        ecmaVersion: 2022,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'import': importPlugin,
      'security': security,
      'promise': promise,
      'unused-imports': unusedImports,
    },
    settings: {
      react: {
        version: 'detect',
      },
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
        },
      },
    },
    rules: {
      // TypeScript strict rules
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-var-requires': 'error',
      '@typescript-eslint/no-non-null-assertion': 'warn',

      // React rules
      'react/prop-types': 'off', // Using TypeScript for prop validation
      'react/react-in-jsx-scope': 'off', // Not needed in React 17+
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // Import rules - relaxed for monorepo
      'import/order': ['error', {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        'newlines-between': 'always',
      }],
      'import/no-unresolved': 'warn', // Downgraded for monorepo workspace resolution
      'import/no-cycle': 'error',

      // Security rules - relaxed for generated/minified code
      'security/detect-object-injection': 'warn', // Downgraded to warn for false positives
      'security/detect-eval-with-expression': 'error',
      'security/detect-no-csrf-before-method-override': 'error',

      // Promise rules
      'promise/always-return': 'error',
      'promise/no-return-wrap': 'error',
      'promise/param-names': 'error',
      'promise/catch-or-return': 'error',

      // Unused imports
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': ['error', {
        vars: 'all',
        varsIgnorePattern: '^_',
        args: 'after-used',
        argsIgnorePattern: '^_',
      }],

      // General rules
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
      'no-debugger': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },
  // Test files - relaxed rules
  {
    files: ['**/*.{test,spec}.ts?(x)'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      'react/display-name': 'off',
    },
  },
  // Config files - allow console and any
  {
    files: ['**/*.config.{ts,js,mjs}', '**/vitest.*.ts', '**/eslint.config.mjs'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-var-requires': 'off',
    },
  },
  // Generated/minified files - disable problematic rules
  {
    files: ['**/*.min.js', '**/*.bundle.js', '**/*.chunk.js', '**/vendor/**', '**/lib/**', '**/libs/**'],
    rules: {
      'security/detect-object-injection': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      'prefer-const': 'off',
      'no-var': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'off',
      'no-control-regex': 'off',
    },
  },
  // Ignore patterns
  {
    ignores: [
      'dist/**',
      'build/**',
      'coverage/**',
      'reports/**',
      '**/*.d.ts',
      '**/*.gen.ts',
      'node_modules/**',
      '.next/**',
      'out/**',
      'artifacts/**',
      'audit/**',
      'patches*/**',
      'ci_activation*/**',
      'monitoring/**',
      'services/**',
      'test/**',
      'tests/**',
      '**/*.min.js',
      '**/*.bundle.js',
      '**/*.chunk.js',
      '**/vendor/**',
      '**/.cache/**',
      '**/.tmp/**',
      '**/.sync/**',
      '**/generated/**',
      '**/__generated__/**',
      '**/auto-generated/**',
      '**/third-party/**',
      '**/external/**',
      '**/lib/**',
      '**/libs/**',
      '**/vendor/**',
      '**/vendors/**',
      '**/*.map',
      '**/*.min.css',
      '**/*.min.js.map',
      '**/webpack.config.js',
      '**/rollup.config.js',
      '**/vite.config.js',
      '**/babel.config.js',
      '**/postcss.config.js',
      '**/tailwind.config.js',
      '**/jest.config.js',
      '**/vitest.config.js',
      '**/eslint.config.js',
      '**/eslint.config.mjs',
      '**/eslint.config.cjs',
      '**/prettier.config.js',
      '**/stylelint.config.js',
      '**/commitlint.config.js',
      '**/lint-staged.config.js',
      '**/husky/**',
      '**/.husky/**',
      '**/.github/**',
      '**/docs/**',
      '**/README.md',
      '**/CHANGELOG.md',
      '**/LICENSE',
      '**/package-lock.json',
      '**/pnpm-lock.yaml',
      '**/yarn.lock',
      '**/tsconfig.json',
      '**/tsconfig.*.json',
      '**/jsconfig.json',
      '**/babel.config.json',
      '**/postcss.config.json',
      '**/tailwind.config.json',
      '**/jest.config.json',
      '**/vitest.config.json',
      '**/eslint.config.json',
      '**/prettier.config.json',
      '**/stylelint.config.json',
      '**/commitlint.config.json',
      '**/lint-staged.config.json',
      '**/.editorconfig',
      '**/.gitignore',
      '**/.eslintignore',
      '**/.prettierignore',
      '**/.lycheeignore',
      '**/.cpdignore',
      '**/.gitleaks.toml',
      '**/.spectral.yml',
      '**/.lychee.toml',
      '**/.size-limit.json',
      '**/.releaserc.json',
      '**/.npmrc',
      '**/.nvmrc',
      '**/.env*',
      '**/.*rc',
      '**/.*rc.js',
      '**/.*rc.json',
      '**/.*rc.yml',
      '**/.*rc.yaml',
      '**/.*config',
      '**/.*config.js',
      '**/.*config.json',
      '**/.*config.yml',
      '**/.*config.yaml',
    ],
  },
]