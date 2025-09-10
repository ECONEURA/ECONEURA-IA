import { test, expect } from '@playwright/test'
import { injectAxe, checkA11y, getViolations } from '@axe-core/playwright'

test.describe('Dashboard Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login to access dashboard
    await page.goto('/login')
    await page.fill('[data-testid="email-input"]', 'admin@ecoretail.com')
    await page.fill('[data-testid="password-input"]', 'Demo1234!')
    await page.click('[data-testid="login-button"]')
    await page.waitForURL('/dashboard')
    
    // Inject axe-core
    await injectAxe(page)
  })

  test('dashboard page meets accessibility standards', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    
    // Run axe accessibility scan
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true }
    })
  })

  test('dashboard navigation is keyboard accessible', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    
    // Test keyboard navigation
    await page.keyboard.press('Tab')
    const firstFocusable = await page.evaluate(() => document.activeElement?.tagName)
    expect(['A', 'BUTTON', 'INPUT']).toContain(firstFocusable)
    
    // Check for focus visibility
    const focusedElement = page.locator(':focus')
    await expect(focusedElement).toBeVisible()
    
    // Run axe scan focusing on keyboard accessibility
    await checkA11y(page, null, {
      tags: ['wcag2a', 'wcag2aa', 'wcag21aa'],
      rules: {
        'focus-order-semantics': { enabled: true },
        'tabindex': { enabled: true }
      }
    })
  })

  test('dashboard has proper ARIA labels and roles', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    
    // Check main navigation has proper ARIA
    const nav = page.locator('[role="navigation"]')
    await expect(nav).toBeVisible()
    
    // Check main content area
    const main = page.locator('[role="main"]')
    await expect(main).toBeVisible()
    
    // Run axe scan for ARIA compliance
    await checkA11y(page, null, {
      tags: ['wcag2a', 'wcag2aa'],
      rules: {
        'aria-labels': { enabled: true },
        'aria-roles': { enabled: true },
        'landmark-one-main': { enabled: true }
      }
    })
  })

  test('dashboard color contrast meets WCAG standards', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    
    // Run axe scan specifically for color contrast
    await checkA11y(page, null, {
      tags: ['wcag2aa'],
      rules: {
        'color-contrast': { enabled: true }
      }
    })
  })

  test('dashboard forms are accessible', async ({ page }) => {
    // Navigate to a page with forms if available
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    
    // Look for any forms or form elements
    const forms = await page.locator('form, input, select, textarea').count()
    
    if (forms > 0) {
      // Run axe scan for form accessibility
      await checkA11y(page, null, {
        tags: ['wcag2a', 'wcag2aa'],
        rules: {
          'label': { enabled: true },
          'form-field-multiple-labels': { enabled: true }
        }
      })
    }
  })
})

// Helper function to calculate accessibility score
test('calculate accessibility score', async ({ page }) => {
  await page.goto('/dashboard')
  await injectAxe(page)
  
  const violations = await getViolations(page)
  const totalChecks = violations.reduce((sum, violation) => sum + violation.nodes.length, 0)
  const passedChecks = Math.max(0, 100 - totalChecks) // Simple calculation
  const score = totalChecks === 0 ? 100 : Math.max(0, 100 - (totalChecks * 2))
  
  // Write score to report file for CI
  const report = {
    score,
    violations: violations.length,
    totalIssues: totalChecks,
    timestamp: new Date().toISOString()
  }
  
  await page.evaluate((reportData) => {
    // This would be written to a file in a real implementation
    console.log('Accessibility Report:', JSON.stringify(reportData, null, 2))
  }, report)
  
  expect(score).toBeGreaterThanOrEqual(95)
})