import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 60000,
    hookTimeout: 60000,
  },
  resolve: {
    alias: {
      '@econeura/shared': path.resolve(__dirname, '../../packages/shared/src'),
    },
  },
});