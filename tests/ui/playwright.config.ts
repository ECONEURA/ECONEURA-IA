import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  // Ejecutar tests en esta carpeta (ubicado en tests/ui)
  testDir: './',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'status/playwright-report', open: 'never' }]
  ],
  use: {
    baseURL: process.env.BASE_URL || process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    viewport: { width: 1440, height: 900 }
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } }
  ],
  webServer: {
    // Use el comando que arranca la app en preview; reuseExistingServer evita reiniciar cuando ya está corriendo
    command: 'pnpm --filter @econeura/web start',
    url: 'http://localhost:3000',
    reuseExistingServer: true
  }
})
