import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    name: 'integration',
    globals: true,
    environment: 'node',
    setupFiles: ['./test/setup.integration.ts'],
    include: [
      '**/*.integration.test.ts',
      '**/*.integration.spec.ts',
      'test/integration/**/*.test.ts',
      'test/integration/**/*.spec.ts',
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/*.unit.test.ts',
      '**/*.unit.spec.ts',
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
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70,
        },
      },
    },
    testTimeout: 30000, // 30 seconds for integration tests
    hookTimeout: 10000, // 10 seconds for hooks
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
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
