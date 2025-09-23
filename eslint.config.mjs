import js from '@eslint/js'
import ts from 'typescript-eslint'

export default [
  js.configs.recommended,
  ...ts.configs.recommended,
  {
    files: ['**/*.ts','**/*.tsx'],
    languageOptions: { parser: ts.parser, parserOptions: { project: false } },
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      '@typescript-eslint/no-unused-vars': 'error'
    }
  },
  { files:['**/*.{test,spec}.ts?(x)'], rules:{ 'no-undef':'off','@typescript-eslint/no-explicit-any':'off' } },
  { ignores:['dist','build','coverage','reports','**/*.d.ts','**/*.gen.ts'] }
]