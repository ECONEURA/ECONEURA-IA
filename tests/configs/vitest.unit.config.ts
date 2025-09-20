import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/unit/**/*.test.ts', 'tests/unit/**/*.spec.ts'],
    exclude: [
      'tests/integration/**',
      'tests/e2e/**',
      'node_modules/',
      'dist/',
      'build/',
      '.next/',
      'coverage/',
      '**/*.config.ts',
      '**/*.config.js'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage/unit',
      exclude: [
        'node_modules/',
        'dist/',
        'build/',
        '.next/',
        'coverage/',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/*.config.ts',
        '**/*.config.js',
        '**/types/**',
        '**/generated/**',
        'tests/**'
      ],
      thresholds: {
        global: {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85
        }
      }
    },
    testTimeout: 5000,
    hookTimeout: 5000
  },
  resolve: {
    alias: {
      '@econeura/shared': resolve(__dirname, './packages/shared/src'),
      '@econeura/db': resolve(__dirname, './packages/db/src'),
      '@econeura/sdk': resolve(__dirname, './packages/sdk/src'),
      '@econeura/api': resolve(__dirname, './apps/api/src'),
      '@econeura/web': resolve(__dirname, './apps/web/src'),
    }
  }
});