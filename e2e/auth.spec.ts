import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('/login')

    await page.fill('input[name="email"]', 'admin@ecoretail.com')
    await page.fill('input[name="password"]', 'Demo1234!')
    await page.click('button[type="submit"]')

    await page.waitForURL('/dashboard')
    await expect(page.locator('h1')).toContainText('Dashboard')
  })

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login')

    await page.fill('input[name="email"]', 'invalid@example.com')
    await page.fill('input[name="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')

    await expect(page.locator('.text-red-800')).toBeVisible()
  })

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.fill('input[name="email"]', 'admin@ecoretail.com')
    await page.fill('input[name="password"]', 'Demo1234!')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')

    // Logout
    await page.click('button:has-text("Cerrar sesión")')
    await page.waitForURL('/login')
    await expect(page.locator('h2')).toContainText('Iniciar sesión')
  })

  test('should protect routes from unauthorized access', async ({ page }) => {
    await page.goto('/crm/companies')
    await page.waitForURL('/login')
    await expect(page.locator('h2')).toContainText('Iniciar sesión')
  })
})
