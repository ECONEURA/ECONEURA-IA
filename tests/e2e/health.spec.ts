import { test, expect } from "@playwright/test";

test("web alive", async ({ page }) => {
  await page.goto("https://econeura-web-dev-dpehcua9augngbcb.northeurope-01.azurewebsites.net/");
  await expect(page).toHaveURL(/azurewebsites\.net/);
});
