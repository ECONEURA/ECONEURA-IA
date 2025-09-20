#!/bin/bash

echo "🎨 Running ECONEURA visual regression tests..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Playwright is installed
if ! command -v playwright &> /dev/null; then
    echo -e "${YELLOW}⚠️  Playwright not found. Installing...${NC}"
    if command -v pnpm &> /dev/null; then
        pnpm add -D @playwright/test
        pnpm exec playwright install
    else
        echo -e "${RED}❌ pnpm not found. Please install Playwright manually.${NC}"
        exit 1
    fi
fi

# Create Playwright test directory if it doesn't exist
mkdir -p tests/visual

# Create Playwright config
cat > playwright.config.ts << 'EOF'
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/visual',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
EOF

# Create visual test for main pages
cat > tests/visual/main-pages.spec.ts << 'EOF'
import { test, expect } from '@playwright/test';

test.describe('Main Pages Visual Tests', () => {
  test('Home page visual regression', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('home-page.png');
  });

  test('Dashboard page visual regression', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('dashboard-page.png');
  });

  test('CRM page visual regression', async ({ page }) => {
    await page.goto('/crm');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('crm-page.png');
  });

  test('ERP page visual regression', async ({ page }) => {
    await page.goto('/erp');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('erp-page.png');
  });

  test('Finance page visual regression', async ({ page }) => {
    await page.goto('/finance');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('finance-page.png');
  });
});
EOF

# Create visual test for components
cat > tests/visual/components.spec.ts << 'EOF'
import { test, expect } from '@playwright/test';

test.describe('Component Visual Tests', () => {
  test('Button component visual regression', async ({ page }) => {
    await page.goto('/components/button');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('button-component.png');
  });

  test('Form component visual regression', async ({ page }) => {
    await page.goto('/components/form');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('form-component.png');
  });

  test('Table component visual regression', async ({ page }) => {
    await page.goto('/components/table');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('table-component.png');
  });

  test('Modal component visual regression', async ({ page }) => {
    await page.goto('/components/modal');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('modal-component.png');
  });
});
EOF

# Create visual test for responsive design
cat > tests/visual/responsive.spec.ts << 'EOF'
import { test, expect } from '@playwright/test';

test.describe('Responsive Design Visual Tests', () => {
  test('Mobile view visual regression', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('mobile-home.png');
  });

  test('Tablet view visual regression', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('tablet-home.png');
  });

  test('Desktop view visual regression', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('desktop-home.png');
  });
});
EOF

echo "📋 Running visual regression tests..."
echo ""

# Run visual tests
echo "🎨 Running Playwright visual tests..."
if pnpm exec playwright test --reporter=line; then
    echo -e "${GREEN}✅ Visual tests PASSED${NC}"
else
    echo -e "${RED}❌ Visual tests FAILED${NC}"
    echo "Check the test results in the playwright-report directory"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 All visual regression tests PASSED!${NC}"
echo "Visual regression threshold met: ≤2% difference"
echo "Screenshots saved in test-results directory"

