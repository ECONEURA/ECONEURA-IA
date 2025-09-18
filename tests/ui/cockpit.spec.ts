import { test, expect } from '@playwright/test';

const threshold = Number(process.env.SNAPSHOT_THRESHOLD || '0.02'); // 2%

test('Cockpit snapshot ≤2%', async ({ page, baseURL }) => {
  test.skip(!baseURL, 'BASE_URL no configurado');
  await page.goto(baseURL!);
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveScreenshot('cockpit.png', { maxDiffPixelRatio: threshold });
});
