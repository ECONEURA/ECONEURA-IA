import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Evita recoger pruebas de Playwright/Jest y de integración/performance por defecto
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      'e2e/**',
      'tests/ui/**',
      'test/**',
      'apps/web/**',
    ],
    passWithNoTests: true,
  },
  resolve: {
    alias: {
      '@econeura/shared': resolve(__dirname, './packages/shared/src'),
      '@econeura/db': resolve(__dirname, './packages/db/src'),
    },
  },
})
