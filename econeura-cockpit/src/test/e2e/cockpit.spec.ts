// E2E Tests - ECONEURA Cockpit
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('ECONEURA Cockpit', () => {
  test('should load the main cockpit page', async ({ page }) => {
    await page.goto('/');

    // Check if main elements are present
    await expect(page.locator('h1')).toContainText('ECONEURA Cockpit');
    await expect(page.locator('aside')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
  });

  test('should navigate between departments', async ({ page }) => {
    await page.goto('/');

    // Test navigation to different departments
    const departments = ['CEO', 'IA', 'CSO', 'CTO', 'CISO', 'COO', 'CHRO', 'CGO', 'CFO', 'CDO'];

    for (const dept of departments) {
      await page.click(`button:has-text("${dept}")`);
      await expect(page.locator('h2')).toContainText(dept);
    }
  });

  test('should open NEURA chat in IA department', async ({ page }) => {
    await page.goto('/');

    // Navigate to IA department
    await page.click('button:has-text("Plataforma IA")');

    // Check if NEURA chat is visible
    await expect(page.locator('text=NEURA - Asistente de IA')).toBeVisible();
    await expect(page.locator('button:has-text("Abrir chat")')).toBeVisible();

    // Open chat
    await page.click('button:has-text("Abrir chat")');
    await expect(page.locator('input[placeholder="Escribe tu mensaje..."]')).toBeVisible();
  });

  test('should execute agent and show in timeline', async ({ page }) => {
    await page.goto('/');

    // Find an agent card with "Ejecutar" button
    const executeButton = page.locator('button:has-text("Ejecutar")').first();
    await expect(executeButton).toBeVisible();

    // Click execute
    await executeButton.click();

    // Check if timeline shows the execution event
    await expect(page.locator('text=Timeline de Actividad')).toBeVisible();
  });

  test('should show footer with compliance information', async ({ page }) => {
    await page.goto('/');

    // Check footer content
    await expect(page.locator('footer')).toBeVisible();
    await expect(page.locator('text=Alojado en la UE')).toBeVisible();
    await expect(page.locator('text=GDPR/AI Act')).toBeVisible();
    await expect(page.locator('text=TLS 1.2+/AES-256')).toBeVisible();
    await expect(page.locator('text=SSO Entra ID')).toBeVisible();
  });

  test('should be accessible', async ({ page }) => {
    await page.goto('/');

    // Run accessibility tests
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should handle API calls correctly', async ({ page }) => {
    await page.goto('/');

    // Navigate to IA department and open chat
    await page.click('button:has-text("Plataforma IA")');
    await page.click('button:has-text("Abrir chat")');

    // Type a message and send
    await page.fill('input[placeholder="Escribe tu mensaje..."]', 'Hello NEURA');
    await page.click('button:has-text("Enviar")');

    // Check if response appears
    await expect(page.locator('text=NEURA demo: Hello NEURA')).toBeVisible();
  });
});

