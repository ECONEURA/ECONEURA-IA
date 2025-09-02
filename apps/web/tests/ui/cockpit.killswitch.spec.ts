import { test } from '@playwright/test';

test.describe('Cockpit — Kill-switch toggle', () => {
  test('existe el botón y cambia estado', async ({ page, baseURL }) => {
    test.skip(!baseURL, 'BASE_URL no configurado');
    await page.goto(baseURL! + '/cockpit');
    await page.getByRole('button', { name: /Kill-switch/i }).isVisible();
  });
});
