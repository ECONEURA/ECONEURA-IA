import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    name: 'performance',
    globals: true,
    environment: 'node',
    setupFiles: ['./test/setup.performance.ts'],
    include: [
      '**/*.performance.test.ts',
      '**/*.performance.spec.ts',
      'test/performance/**/*.test.ts',
      'test/performance/**/*.spec.ts',
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/*.unit.test.ts',
      '**/*.unit.spec.ts',
      '**/*.integration.test.ts',
      '**/*.integration.spec.ts',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/.next/**',
        '**/*.config.ts',
        '**/test/**',
        '**/*.test.ts',
        '**/*.spec.ts',
      ],
      thresholds: {
        global: {
          branches: 50,
          functions: 50,
          lines: 50,
          statements: 50,
        },
      },
    },
    testTimeout: 60000, // 60 seconds for performance tests
    hookTimeout: 15000, // 15 seconds for hooks
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    reporters: ['verbose', 'json'],
    outputFile: {
      json: './performance-results/results.json',
    },
  },
  resolve: {
    alias: {
      '@econeura/shared': resolve(__dirname, './packages/shared/src'),
      '@econeura/db': resolve(__dirname, './packages/db/src'),
      '@econeura/playbooks': resolve(__dirname, './packages/playbooks/src'),
    },
  },
})
