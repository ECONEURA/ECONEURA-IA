import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('/login')
    
    await page.fill('[data-testid="email-input"]', 'admin@ecoretail.com')
    await page.fill('[data-testid="password-input"]', 'Demo1234!')
    await page.click('[data-testid="login-button"]')
    
    await page.waitForURL('/dashboard')
    await expect(page.locator('[data-testid="dashboard-title"]')).toContainText('Dashboard')
  })

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login')
    
    await page.fill('[data-testid="email-input"]', 'invalid@example.com')
    await page.fill('[data-testid="password-input"]', 'wrongpassword')
    await page.click('[data-testid="login-button"]')
    
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
  })

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.fill('[data-testid="email-input"]', 'admin@ecoretail.com')
    await page.fill('[data-testid="password-input"]', 'Demo1234!')
    await page.click('[data-testid="login-button"]')
    await page.waitForURL('/dashboard')
    
    // Logout
    await page.click('[data-testid="logout-button"]')
    await page.waitForURL('/login')
    await expect(page.locator('[data-testid="login-title"]')).toContainText('Iniciar sesión')
  })

  test('should protect routes from unauthorized access', async ({ page }) => {
    await page.goto('/crm/companies')
    await page.waitForURL('/login')
    await expect(page.locator('[data-testid="login-title"]')).toContainText('Iniciar sesión')
  })
})