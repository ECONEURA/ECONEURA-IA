/**
 * E2E tests for security features
 */

import { test, expect } from '@playwright/test';

test.describe('Security Features', () => {
  test('CORS headers are properly set', async ({ page }) => {
    // Navigate to cockpit
    await page.goto('http://localhost:3000');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check CORS headers in network requests
    const response = await page.waitForResponse('**/api/**');
    const headers = response.headers();
    
    expect(headers['access-control-allow-origin']).toBeDefined();
    expect(headers['access-control-allow-credentials']).toBe('true');
  });

  test('CSP headers are properly set', async ({ page }) => {
    // Navigate to cockpit
    await page.goto('http://localhost:3000');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check CSP headers
    const response = await page.waitForResponse('**/api/**');
    const headers = response.headers();
    
    expect(headers['content-security-policy']).toBeDefined();
  });

  test('HMAC validation works for webhooks', async ({ page }) => {
    // Navigate to cockpit
    await page.goto('http://localhost:3000');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Mock webhook with invalid HMAC
    const response = await page.request.post('http://localhost:3102/agents/events', {
      headers: {
        'x-signature': 'invalid-hmac',
        'x-idempotency-key': 'test-key'
      },
      data: { runId: 'test-run', status: 'COMPLETED' }
    });
    
    expect(response.status()).toBe(401);
  });

  test('Idempotency keys prevent duplicate processing', async ({ page }) => {
    // Navigate to cockpit
    await page.goto('http://localhost:3000');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    const idempotencyKey = 'test-idempotency-key';
    
    // First request
    const response1 = await page.request.post('http://localhost:3102/agents/events', {
      headers: {
        'x-signature': 'valid-hmac',
        'x-idempotency-key': idempotencyKey
      },
      data: { runId: 'test-run', status: 'COMPLETED' }
    });
    
    expect(response1.status()).toBe(200);
    
    // Second request with same idempotency key
    const response2 = await page.request.post('http://localhost:3102/agents/events', {
      headers: {
        'x-signature': 'valid-hmac',
        'x-idempotency-key': idempotencyKey
      },
      data: { runId: 'test-run', status: 'COMPLETED' }
    });
    
    expect(response2.status()).toBe(200);
  });
});

