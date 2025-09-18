/**
 * E2E tests for telemetry and FinOps
 */

import { test, expect } from '@playwright/test';

test.describe('Telemetry and FinOps', () => {
  test('Telemetry headers are exposed', async ({ page }) => {
    // Navigate to cockpit
    await page.goto('http://localhost:3000');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check telemetry headers in network requests
    const response = await page.waitForResponse('**/api/**');
    const headers = response.headers();
    
    expect(headers['x-est-cost-eur']).toBeDefined();
    expect(headers['x-budget-pct']).toBeDefined();
    expect(headers['x-latency-ms']).toBeDefined();
    expect(headers['x-route']).toBeDefined();
    expect(headers['x-correlation-id']).toBeDefined();
  });

  test('Budget guard blocks execution when limit exceeded', async ({ page }) => {
    // Navigate to cockpit
    await page.goto('http://localhost:3000');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Mock high budget usage
    await page.evaluate(() => {
      window.localStorage.setItem('budget-pct', '95');
    });
    
    // Try to execute an agent
    await page.click('[data-testid="agent-execute-button"]');
    
    // Check if budget warning appears
    const budgetWarning = await page.locator('[data-testid="budget-warning"]');
    await expect(budgetWarning).toBeVisible();
    
    // Check if agent execution was blocked
    const agentEvent = await page.locator('[data-testid="agent-event"]');
    await expect(agentEvent).not.toBeVisible();
  });

  test('Cost tracking works correctly', async ({ page }) => {
    // Navigate to cockpit
    await page.goto('http://localhost:3000');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Switch to IA department
    await page.click('[data-testid="dept-ia"]');
    
    // Get initial cost
    const initialCost = await page.locator('[data-testid="cost-counter"]').textContent();
    
    // Execute an agent
    await page.click('[data-testid="agent-execute-button"]');
    
    // Wait for cost update
    await page.waitForTimeout(1000);
    
    // Check if cost was updated
    const newCost = await page.locator('[data-testid="cost-counter"]').textContent();
    expect(newCost).not.toBe(initialCost);
  });
});

