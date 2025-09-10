import { test, expect } from '@playwright/test'

test.describe('Dashboard Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login to access dashboard
    await page.goto('/login')
    await page.fill('[data-testid="email-input"]', 'admin@ecoretail.com')
    await page.fill('[data-testid="password-input"]', 'Demo1234!')
    await page.click('[data-testid="login-button"]')
    await page.waitForURL('/dashboard')
  })

  test('dashboard layout visual snapshot', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    
    // Wait for main content to load
    await page.waitForSelector('[data-testid="dashboard-main"]', { timeout: 10000 })
    
    await expect(page).toHaveScreenshot('dashboard-layout.png')
  })

  test('dashboard metrics cards visual snapshot', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForSelector('[data-testid="metrics-cards"]', { timeout: 10000 })
    
    const metricsSection = page.locator('[data-testid="metrics-cards"]')
    await expect(metricsSection).toHaveScreenshot('dashboard-metrics.png')
  })

  test('dashboard sidebar visual snapshot', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForSelector('[data-testid="sidebar"]', { timeout: 10000 })
    
    const sidebar = page.locator('[data-testid="sidebar"]')
    await expect(sidebar).toHaveScreenshot('dashboard-sidebar.png')
  })
})