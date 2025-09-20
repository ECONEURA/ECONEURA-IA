import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./test/setup.ts'],
    include: [
      '**/*.test.ts',
      '**/*.spec.ts',
      '**/*.integration.test.ts',
      '**/*.integration.spec.ts',
      '**/*.e2e.test.ts',
      '**/*.e2e.spec.ts'
    ],
    exclude: [
      '**/*.performance.test.ts',
      '**/*.performance.spec.ts',
      'node_modules/',
      'dist/',
      'build/',
      '.next/',
      'coverage/',
      'test-results/',
      'performance-results/',
      '**/*.config.ts',
      '**/*.config.js',
      '**/drizzle/**',
      '**/migrations/**',
      '**/seed.ts',
      '**/seed.js'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov', 'cobertura'],
      reportsDirectory: './coverage',
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
        '**/*.integration.test.ts',
        '**/*.integration.spec.ts',
        '**/*.e2e.test.ts',
        '**/*.e2e.spec.ts',
        '**/*.config.ts',
        '**/*.config.js',
        '**/drizzle/**',
        '**/migrations/**',
        '**/seed.ts',
        '**/seed.js',
        '**/types/**',
        '**/generated/**'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        },
        './apps/api/': {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85
        },
        './packages/shared/': {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90
        }
      },
      all: true,
      include: [
        'apps/*/src/**/*.{ts,tsx}',
        'packages/*/src/**/*.{ts,tsx}'
      ]
    },
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 5000
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