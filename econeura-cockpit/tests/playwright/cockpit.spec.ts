/**
 * Tests de Playwright para Cockpit
 * FASE 4 - COCKPIT SIN MOCKS EMBEBIDOS
 * 
 * Tests incluidos:
 * - Tests visuales ≤2%
 * - Tests de funcionalidad
 * - Tests de tiempo real
 * - Tests de costos
 */

import { test, expect, Page } from '@playwright/test';

// ============================================================================
// TEST SETUP
// ============================================================================

test.beforeEach(async ({ page }) => {
  // Mock API responses
  await page.route('**/api/cockpit/bff*', async (route) => {
    const url = new URL(route.request().url());
    const endpoint = url.searchParams.get('endpoint');
    
    switch (endpoint) {
      case 'agents':
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                key: 'agent-1',
                name: 'Análisis de Datos',
                description: 'Procesa y analiza datos de ventas para generar insights',
                dept: 'ia',
                status: 'idle',
                usage: {
                  tokens: 1250,
                  cost: 0.0025,
                  requests: 15,
                  lastUpdated: new Date().toISOString()
                }
              },
              {
                key: 'agent-2',
                name: 'Reportes Automáticos',
                description: 'Genera reportes periódicos de KPIs del departamento',
                dept: 'ia',
                status: 'completed',
                usage: {
                  tokens: 2100,
                  cost: 0.0042,
                  requests: 8,
                  lastUpdated: new Date().toISOString()
                }
              }
            ]
          })
        });
        break;
        
      case 'timeline':
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                id: 'event-1',
                type: 'agent_start',
                timestamp: new Date().toISOString(),
                dept: 'ia',
                agent: 'agent-1',
                message: 'Agente iniciado',
                metadata: {}
              }
            ]
          })
        });
        break;
        
      case 'run-orders':
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: []
          })
        });
        break;
        
      case 'cost-status':
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              currentDaily: 45.50,
              currentMonthly: 450.75,
              limits: {
                dailyLimitEUR: 100,
                monthlyLimitEUR: 1000,
                perRequestLimitEUR: 10
              },
              status: 'healthy',
              killSwitchActive: false
            }
          })
        });
        break;
        
      default:
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Endpoint not found'
          })
        });
    }
  });

  // Mock WebSocket connection
  await page.addInitScript(() => {
    window.WebSocket = class MockWebSocket {
      readyState = 1;
      onopen = null;
      onclose = null;
      onmessage = null;
      onerror = null;
      
      constructor() {
        setTimeout(() => {
          if (this.onopen) this.onopen(new Event('open'));
        }, 100);
      }
      
      send() {}
      close() {}
    };
  });

  // Mock EventSource
  await page.addInitScript(() => {
    window.EventSource = class MockEventSource {
      readyState = 1;
      onopen = null;
      onclose = null;
      onmessage = null;
      onerror = null;
      
      constructor() {
        setTimeout(() => {
          if (this.onopen) this.onopen(new Event('open'));
        }, 100);
      }
      
      addEventListener() {}
      removeEventListener() {}
      close() {}
    };
  });
});

// ============================================================================
// VISUAL TESTS
// ============================================================================

test('Cockpit visual appearance - main layout', async ({ page }) => {
  await page.goto('/cockpit');
  
  // Wait for content to load
  await page.waitForSelector('[data-testid="cockpit-container"]', { timeout: 10000 });
  
  // Take screenshot for visual comparison
  await expect(page).toHaveScreenshot('cockpit-main-layout.png', {
    threshold: 0.02, // 2% threshold as required
    maxDiffPixels: 1000,
  });
});

test('Cockpit visual appearance - IA department with costs', async ({ page }) => {
  await page.goto('/cockpit');
  
  // Wait for content to load
  await page.waitForSelector('[data-testid="cockpit-container"]', { timeout: 10000 });
  
  // Switch to IA department
  await page.click('[data-testid="dept-ia"]');
  await page.waitForTimeout(1000);
  
  // Take screenshot for visual comparison
  await expect(page).toHaveScreenshot('cockpit-ia-department.png', {
    threshold: 0.02, // 2% threshold as required
    maxDiffPixels: 1000,
  });
});

test('Cockpit visual appearance - agent cards', async ({ page }) => {
  await page.goto('/cockpit');
  
  // Wait for content to load
  await page.waitForSelector('[data-testid="cockpit-container"]', { timeout: 10000 });
  
  // Switch to IA department to see agent cards
  await page.click('[data-testid="dept-ia"]');
  await page.waitForTimeout(1000);
  
  // Take screenshot of agent cards
  const agentCards = page.locator('[data-testid="agent-card"]').first();
  await expect(agentCards).toHaveScreenshot('agent-card.png', {
    threshold: 0.02, // 2% threshold as required
    maxDiffPixels: 500,
  });
});

test('Cockpit visual appearance - cost display', async ({ page }) => {
  await page.goto('/cockpit');
  
  // Wait for content to load
  await page.waitForSelector('[data-testid="cockpit-container"]', { timeout: 10000 });
  
  // Switch to IA department to see cost display
  await page.click('[data-testid="dept-ia"]');
  await page.waitForTimeout(1000);
  
  // Take screenshot of cost display
  const costDisplay = page.locator('[data-testid="cost-display"]');
  await expect(costDisplay).toHaveScreenshot('cost-display.png', {
    threshold: 0.02, // 2% threshold as required
    maxDiffPixels: 500,
  });
});

// ============================================================================
// FUNCTIONALITY TESTS
// ============================================================================

test('Cockpit loads without errors', async ({ page }) => {
  await page.goto('/cockpit');
  
  // Wait for content to load
  await page.waitForSelector('[data-testid="cockpit-container"]', { timeout: 10000 });
  
  // Check that no error messages are visible
  const errorMessages = page.locator('[data-testid="error-message"]');
  await expect(errorMessages).toHaveCount(0);
  
  // Check that main elements are present
  await expect(page.locator('[data-testid="header"]')).toBeVisible();
  await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();
  await expect(page.locator('[data-testid="main-content"]')).toBeVisible();
});

test('Department switching works correctly', async ({ page }) => {
  await page.goto('/cockpit');
  
  // Wait for content to load
  await page.waitForSelector('[data-testid="cockpit-container"]', { timeout: 10000 });
  
  // Test switching to different departments
  const departments = ['ventas', 'marketing', 'operaciones', 'finanzas', 'ia', 'soporte_qa'];
  
  for (const dept of departments) {
    await page.click(`[data-testid="dept-${dept}"]`);
    await page.waitForTimeout(500);
    
    // Check that department header updates
    const deptHeader = page.locator('[data-testid="dept-header"]');
    await expect(deptHeader).toContainText(dept.toUpperCase());
  }
});

test('Cost display only shows in IA department', async ({ page }) => {
  await page.goto('/cockpit');
  
  // Wait for content to load
  await page.waitForSelector('[data-testid="cockpit-container"]', { timeout: 10000 });
  
  // Check that cost display is not visible in other departments
  const otherDepts = ['ventas', 'marketing', 'operaciones', 'finanzas', 'soporte_qa'];
  
  for (const dept of otherDepts) {
    await page.click(`[data-testid="dept-${dept}"]`);
    await page.waitForTimeout(500);
    
    const costDisplay = page.locator('[data-testid="cost-display"]');
    await expect(costDisplay).not.toBeVisible();
  }
  
  // Check that cost display is visible in IA department
  await page.click('[data-testid="dept-ia"]');
  await page.waitForTimeout(500);
  
  const costDisplay = page.locator('[data-testid="cost-display"]');
  await expect(costDisplay).toBeVisible();
});

test('Agent execution works correctly', async ({ page }) => {
  await page.goto('/cockpit');
  
  // Wait for content to load
  await page.waitForSelector('[data-testid="cockpit-container"]', { timeout: 10000 });
  
  // Switch to IA department
  await page.click('[data-testid="dept-ia"]');
  await page.waitForTimeout(1000);
  
  // Mock successful agent execution
  await page.route('**/api/cockpit/bff?endpoint=execute', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          executionId: 'exec-123',
          status: 'running',
          cost: 0.0025,
          tokens: 150
        }
      })
    });
  });
  
  // Click execute button on first agent
  const executeButton = page.locator('[data-testid="agent-card"]').first().locator('button');
  await executeButton.click();
  
  // Check that button shows executing state
  await expect(executeButton).toContainText('Ejecutando...');
  
  // Wait for execution to complete (mocked)
  await page.waitForTimeout(2000);
  
  // Check that execution result is displayed
  const lastExecution = page.locator('[data-testid="last-execution"]');
  await expect(lastExecution).toBeVisible();
});

test('Timeline updates correctly', async ({ page }) => {
  await page.goto('/cockpit');
  
  // Wait for content to load
  await page.waitForSelector('[data-testid="cockpit-container"]', { timeout: 10000 });
  
  // Check that timeline is visible
  const timeline = page.locator('[data-testid="timeline"]');
  await expect(timeline).toBeVisible();
  
  // Check that timeline events are displayed
  const timelineEvents = page.locator('[data-testid="timeline-event"]');
  await expect(timelineEvents).toHaveCount(1); // Based on mock data
});

test('Real-time connection status is displayed', async ({ page }) => {
  await page.goto('/cockpit');
  
  // Wait for content to load
  await page.waitForSelector('[data-testid="cockpit-container"]', { timeout: 10000 });
  
  // Check that real-time connection status is shown
  const connectionStatus = page.locator('[data-testid="connection-status"]');
  await expect(connectionStatus).toBeVisible();
});

// ============================================================================
// ERROR HANDLING TESTS
// ============================================================================

test('Handles API errors gracefully', async ({ page }) => {
  await page.goto('/cockpit');
  
  // Mock API error
  await page.route('**/api/cockpit/bff*', async (route) => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({
        success: false,
        error: 'Internal server error'
      })
    });
  });
  
  // Reload page to trigger API error
  await page.reload();
  
  // Check that error message is displayed
  const errorMessage = page.locator('[data-testid="error-message"]');
  await expect(errorMessage).toBeVisible();
  await expect(errorMessage).toContainText('Error al cargar el Cockpit');
  
  // Check that retry button is available
  const retryButton = page.locator('button:has-text("Reintentar")');
  await expect(retryButton).toBeVisible();
});

test('Handles network errors gracefully', async ({ page }) => {
  await page.goto('/cockpit');
  
  // Block all network requests
  await page.route('**/*', route => route.abort());
  
  // Reload page to trigger network error
  await page.reload();
  
  // Check that error message is displayed
  const errorMessage = page.locator('[data-testid="error-message"]');
  await expect(errorMessage).toBeVisible();
});

// ============================================================================
// PERFORMANCE TESTS
// ============================================================================

test('Page loads within acceptable time', async ({ page }) => {
  const startTime = Date.now();
  
  await page.goto('/cockpit');
  await page.waitForSelector('[data-testid="cockpit-container"]', { timeout: 10000 });
  
  const loadTime = Date.now() - startTime;
  
  // Page should load within 5 seconds
  expect(loadTime).toBeLessThan(5000);
});

test('Responsive design works on mobile', async ({ page }) => {
  // Set mobile viewport
  await page.setViewportSize({ width: 375, height: 667 });
  
  await page.goto('/cockpit');
  await page.waitForSelector('[data-testid="cockpit-container"]', { timeout: 10000 });
  
  // Take screenshot for mobile visual comparison
  await expect(page).toHaveScreenshot('cockpit-mobile.png', {
    threshold: 0.02, // 2% threshold as required
    maxDiffPixels: 1000,
  });
});

test('Responsive design works on tablet', async ({ page }) => {
  // Set tablet viewport
  await page.setViewportSize({ width: 768, height: 1024 });
  
  await page.goto('/cockpit');
  await page.waitForSelector('[data-testid="cockpit-container"]', { timeout: 10000 });
  
  // Take screenshot for tablet visual comparison
  await expect(page).toHaveScreenshot('cockpit-tablet.png', {
    threshold: 0.02, // 2% threshold as required
    maxDiffPixels: 1000,
  });
});
