import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
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
        '**/seed.js'
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
