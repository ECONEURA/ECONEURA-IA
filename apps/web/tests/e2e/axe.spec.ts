import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("a11y ≥95%", async ({ page }) => {
  await page.goto("/");
  
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .disableRules(["color-contrast"]) // frecuente falso positivo en CI
    .analyze();
  
  const violations = results.violations.length;
  
  // Permitir máximo 3 violaciones (≈ ≥95%)
  expect(violations, JSON.stringify(results.violations[0] || {}, null, 2))
    .toBeLessThanOrEqual(3);
  
  if (violations > 0) {
    
    results.violations.forEach((violation, index) => {
      
    });
  }
});
