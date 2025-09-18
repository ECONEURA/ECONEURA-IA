import { test, expect } from '@playwright/test';

test('ui smoke: homepage responds', async ({ page }) => {
  // Skip if UI not present by env variable
  const base = process.env.UI_BASE_URL || 'http://localhost:3000';
  await page.goto(base, { waitUntil: 'networkidle' });
  const title = await page.title();
  expect(title.length).toBeGreaterThan(0);
});
