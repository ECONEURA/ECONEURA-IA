import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: __dirname,
  forbidOnly: true,
  timeout: 60_000,
  retries: 0,
  use: {
    baseURL: process.env.BASE_URL || '',
    viewport: { width: 1440, height: 900 }
  },
  reporter: [
    ['list'],
    ['html', { outputFolder: 'status/playwright-report', open: 'never' }]
  ],
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } }
  ]
});
