import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        'build/',
        '.next/',
        'coverage/',
        'test-results/',
        'performance-results/',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/*.config.ts',
        '**/*.config.js',
        '**/drizzle/**',
        '**/migrations/**',
        '**/seed.ts',
        '**/seed.js',
        // Exclude large directories that aren't part of our core application
        'scripts/',
        'tools/',
        '.analysis/',
        'postman/',
        'snapshots/',
        'infrastructure/',
        'ops/',
        'reports/',
        // Only include specific source directories
        '!tests/',
        '!packages/*/src/**',
        '!apps/*/src/**'
      ],
      include: [
        'tests/**/*.ts',
        'packages/*/src/**/*.ts',
        'apps/*/src/**/*.ts'
      ],
      thresholds: {
        // Lower thresholds for existing code, can be increased gradually
        global: {
          branches: 40,
          functions: 40,
          lines: 40,
          statements: 40
        },
        // Stricter thresholds for new files can be enforced via changed-file coverage
        perFile: true
      }
    },
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 10000
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
