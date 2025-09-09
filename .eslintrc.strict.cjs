/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: ['./.eslintrc.cjs'],
  rules: {
    // Stricter rules for nightly checks
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'error', 
    '@typescript-eslint/prefer-const': 'error',
    '@typescript-eslint/no-var-requires': 'error',
    '@typescript-eslint/no-non-null-assertion': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/await-thenable': 'error',
    '@typescript-eslint/no-misused-promises': 'error',
    
    // JavaScript strict rules
    'prefer-const': 'error',
    'no-var': 'error',
    'no-console': 'warn',
    'no-debugger': 'error',
    'no-alert': 'error',
    'eqeqeq': 'error',
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error',
    
    // Code quality rules
    'complexity': ['error', { max: 10 }],
    'max-depth': ['error', { max: 4 }],
    'max-lines-per-function': ['error', { max: 50 }],
    'max-params': ['error', { max: 5 }],
    'max-statements': ['error', { max: 20 }],
    'max-lines': ['error', { max: 300, skipBlankLines: true, skipComments: true }],
    
    // Import/Export rules
    'import/no-unused-modules': 'error',
    'import/no-deprecated': 'warn',
    'import/no-extraneous-dependencies': 'error',
    'import/order': ['error', {
      'groups': ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
      'newlines-between': 'always'
    }],
    
    // Security rules
    'no-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error',
    'no-proto': 'error',
    
    // Performance rules
    'no-loop-func': 'error',
    'no-unreachable-loop': 'error',
    
    // Best practices
    'no-magic-numbers': ['warn', { 
      ignore: [-1, 0, 1, 2],
      ignoreArrayIndexes: true,
      ignoreDefaultValues: true
    }],
    'prefer-template': 'error',
    'prefer-arrow-callback': 'error',
    'object-shorthand': 'error',
    'prefer-destructuring': ['error', {
      'array': false,
      'object': true
    }],
    
    // Documentation
    'valid-jsdoc': ['warn', {
      'requireReturn': false,
      'requireReturnDescription': false,
      'requireParamDescription': true
    }],
    
    // React-specific (for web app)
    'react-hooks/exhaustive-deps': 'error',
    'react/jsx-no-target-blank': 'error',
    'react/no-danger': 'error',
    'react/no-danger-with-children': 'error',
    'react/no-deprecated': 'error',
  },
  overrides: [
    {
      files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
      rules: {
        // Relax some rules for test files
        'max-lines-per-function': 'off',
        'max-statements': 'off',
        '@typescript-eslint/no-explicit-any': 'warn',
        'no-magic-numbers': 'off',
      }
    },
    {
      files: ['**/*.config.js', '**/*.config.ts', '**/vitest.config.ts', '**/playwright.config.ts'],
      rules: {
        // Relax rules for config files
        '@typescript-eslint/no-var-requires': 'off',
        'import/no-extraneous-dependencies': 'off',
      }
    }
  ]
};