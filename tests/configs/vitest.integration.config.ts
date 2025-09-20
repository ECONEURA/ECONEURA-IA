import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/utils/integration-setup.ts'],
    include: ['tests/integration/**/*.test.ts', 'tests/integration/**/*.spec.ts'],
    exclude: [
      'tests/unit/**',
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
      reportsDirectory: './coverage/integration',
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
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    },
    testTimeout: 15000,
    hookTimeout: 10000
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