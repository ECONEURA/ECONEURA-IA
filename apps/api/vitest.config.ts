import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/__tests__/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        'src/__tests__/',
        '**/*.d.ts',
        '**/*.config.*',
        'src/test-*.ts'
      ],
      thresholds: {
        global: {
          statements: 40,
          branches: 30,
          functions: 40,
          lines: 40
        }
      }
    },
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 10000
  }
});