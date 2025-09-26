import path from 'path'

import { defineConfig } from 'vitest/config'

export default defineConfig({
  esbuild: { sourcemap: true },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './apps/web/src'),
      '@shared': path.resolve(__dirname, './packages/shared/src')
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./apps/web/src/test-utils/setup.ts'],
    reporters: ['default','json'],
    outputFile: { json: 'reports/vitest.json' },
    testTimeout: 8000,
    retry: 1,
    include: ['apps/web/**/*.{test,spec}.ts?(x)'],
    exclude: [
      '**/node_modules/**',
      'apps/web/src/app/api/**/*',
      'apps/api/**/*',
      'packages/**/*'
    ]
  }
})
