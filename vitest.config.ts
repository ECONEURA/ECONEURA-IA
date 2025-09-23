import { defineConfig } from 'vitest/config'

export default defineConfig({
  esbuild: { sourcemap: true },
  test: {
    environment: 'node',
    reporters: ['default','json'],
    outputFile: { json: 'reports/vitest.json' },
    testTimeout: 8000,
    retry: 1,
    projects: [
      {
        test: {
          include: ['apps/web/**/*.{test,spec}.ts?(x)'],
          environment: 'jsdom'
        }
      },
      {
        test: {
          include: ['apps/api/**/*.{test,spec}.ts']
        }
      },
      {
        test: {
          include: ['packages/**/*.{test,spec}.ts']
        }
      }
    ]
  }
})
