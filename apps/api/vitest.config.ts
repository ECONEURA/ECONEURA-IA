import { defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/**.spec.ts', 'src/**/**.test.ts'],
  setupFiles: [path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'tests/helpers/setup.ts')],
    threads: false,
    testTimeout: 60000,
    hookTimeout: 60000,
    passWithNoTests: true,
  },
  resolve: {
  alias: {},
  },
});
