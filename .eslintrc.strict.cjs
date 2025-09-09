module.exports = {
  extends: ['./.eslintrc.cjs'],
  rules: {
    // Strict rules for CI nightly builds
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-non-null-assertion': 'error',
    '@typescript-eslint/prefer-nullish-coalescing': 'error',
    '@typescript-eslint/prefer-optional-chain': 'error',
    'no-console': 'warn',
    'prefer-const': 'error',
    'no-var': 'error',
    'no-duplicate-imports': 'error',
    'no-unused-expressions': 'error',
    'eqeqeq': 'error',
    'curly': ['error', 'all'],
    'complexity': ['warn', { max: 10 }],
    'max-depth': ['warn', { max: 4 }],
    'max-lines-per-function': ['warn', { max: 50 }],
    'max-params': ['warn', { max: 5 }]
  },
  overrides: [
    {
      files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
      rules: {
        // Relax some rules for test files
        '@typescript-eslint/no-explicit-any': 'off',
        'no-console': 'off',
        'max-lines-per-function': 'off'
      }
    }
  ]
};