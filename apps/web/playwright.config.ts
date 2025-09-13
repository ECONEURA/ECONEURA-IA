import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,                 // anti-flaky en CI
  use: { 
    baseURL: process.env.WEB_BASE_URL || "http://127.0.0.1:3000", 
    trace: "on-first-retry" 
  },
  expect: { 
    toHaveScreenshot: { maxDiffPixelRatio: 0.02 } // ≤2%
  },
  timeout: 30000,
  retries: 2,
  reporter: [
    ["html"],
    ["junit", { outputFile: "../../.artifacts/playwright-results.xml" }]
  ],
  projects: [
    {
      name: "chromium",
      use: { 
        ...devices["Desktop Chrome"],
        // Configuración para CI
        launchOptions: {
          args: ["--no-sandbox", "--disable-setuid-sandbox"]
        }
      },
    },
  ],
});
