import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/contract/**/*.test.ts', 'tests/contract/**/*.spec.ts'],
    passWithNoTests: false,
    testTimeout: 60000,
    hookTimeout: 60000,
  },
  resolve: {
    alias: {
      '@econeura/shared': path.resolve(__dirname, '../../packages/shared/src'),
      '@econeura/db': path.resolve(__dirname, '../../packages/db/src'),
    },
  },
});
