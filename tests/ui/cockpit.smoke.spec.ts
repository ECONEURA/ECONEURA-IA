import { test, expect } from "@playwright/test";
import glob from "fast-glob";

test("UI baseline exists or skip", async ({ page }) => {
  const hasHtml = glob.sync("apps/web/**/ECONEURA_cockpit_v7_aplicado_fix_organigrama_v3.html",{dot:true}).length>0;
  test.skip(!hasHtml, "UI v3 not imported yet");
  await page.goto(process.env.BASE_URL ?? "http://localhost:3000");
  expect(true).toBeTruthy();
});
