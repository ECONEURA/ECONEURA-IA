import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./test/performance-setup.ts'],
    include: ['**/*.performance.test.ts', '**/*.performance.spec.ts'],
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
      ]
    },
    testTimeout: 60000,
    hookTimeout: 60000,
    teardownTimeout: 60000
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
