import { defineConfig } from 'vitest/config'
import path from 'path'

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
