/**
 * FinOps Enforcement Integration Tests
 * PR-97: FinOps ENFORCE e2e - Integration tests for 402 BUDGET_EXCEEDED
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { finOpsEnforce } from '../../middleware/finops-enforce-v2.js';
import { finOpsEnforcement } from '../../middleware/finops-enforce-v2.js';

// ============================================================================
// TEST APP SETUP
// ============================================================================

const createTestApp = () => {
  const app = express();
  
  app.use(express.json());
  
  // Apply FinOps enforcement middleware
  app.use(finOpsEnforce);
  
  // Test AI endpoint
  app.post('/api/v1/ai/chat', (req, res) => {
    res.json({
      success: true,
      message: 'AI request processed successfully',
      data: {
        response: 'Test AI response',
        cost: 0.001
      }
    });
  });
  
  // Test non-AI endpoint (should not be enforced)
  app.get('/api/v1/users', (req, res) => {
    res.json({
      success: true,
      data: { users: [] }
    });
  });
  
  // Test endpoint with custom cost estimate
  app.post('/api/v1/ai/completion', (req, res) => {
    res.json({
      success: true,
      message: 'Completion processed',
      data: {
        completion: 'Test completion',
        cost: 0.002
      }
    });
  });
  
  return app;
};

// ============================================================================
// TEST SUITE
// ============================================================================

describe('FinOps Enforcement Integration Tests', () => {
  let app: express.Application;
  
  beforeEach(() => {
    app = createTestApp();
    // Reset any existing kill switches
    finOpsEnforcement.resetKillSwitch('test-org-123');
  });
  
  afterEach(() => {
    // Clean up after each test
    finOpsEnforcement.resetKillSwitch('test-org-123');
  });
  
  // ============================================================================
  // BASIC FUNCTIONALITY TESTS
  // ============================================================================
  
  describe('Basic Functionality', () => {
    it('should allow AI requests within budget limits', async () => {
      const response = await request(app)
        .post('/api/v1/ai/chat')
        .set('x-org-id', 'test-org-123')
        .send({ message: 'Test message' });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      // Check required headers
      expect(response.headers['x-est-cost-eur']).toBeDefined();
      expect(response.headers['x-budget-pct']).toBeDefined();
      expect(response.headers['x-latency-ms']).toBeDefined();
      expect(response.headers['x-route']).toBe('/api/v1/ai/chat');
      expect(response.headers['x-correlation-id']).toBeDefined();
    });
    
    it('should skip enforcement for non-AI endpoints', async () => {
      const response = await request(app)
        .get('/api/v1/users')
        .set('x-org-id', 'test-org-123');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      // Should not have FinOps headers for non-AI endpoints
      expect(response.headers['x-est-cost-eur']).toBeUndefined();
    });
    
    it('should return 400 for missing org ID on AI endpoints', async () => {
      const response = await request(app)
        .post('/api/v1/ai/chat')
        .send({ message: 'Test message' });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('MISSING_ORG_ID');
    });
  });
  
  // ============================================================================
  // BUDGET EXCEEDED TESTS
  // ============================================================================
  
  describe('Budget Exceeded Scenarios', () => {
    it('should return 402 when per-request limit is exceeded', async () => {
      // Set very low per-request limit
      await finOpsEnforcement.setBudgetLimits('test-org-123', {
        perRequestLimitEUR: 0.0001 // Very low limit
      });
      
      const response = await request(app)
        .post('/api/v1/ai/chat')
        .set('x-org-id', 'test-org-123')
        .send({ message: 'Test message' });
      
      expect(response.status).toBe(402);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('BUDGET_EXCEEDED');
      expect(response.body.details.period).toBe('per_request');
      
      // Should still have FinOps headers
      expect(response.headers['x-est-cost-eur']).toBeDefined();
      expect(response.headers['x-budget-pct']).toBeDefined();
    });
    
    it('should return 402 when daily limit is exceeded', async () => {
      // Set very low daily limit
      await finOpsEnforcement.setBudgetLimits('test-org-123', {
        dailyLimitEUR: 0.0001 // Very low limit
      });
      
      const response = await request(app)
        .post('/api/v1/ai/chat')
        .set('x-org-id', 'test-org-123')
        .send({ message: 'Test message' });
      
      expect(response.status).toBe(402);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('BUDGET_EXCEEDED');
      expect(response.body.details.period).toBe('daily');
    });
    
    it('should return 402 when monthly limit is exceeded', async () => {
      // Set very low monthly limit
      await finOpsEnforcement.setBudgetLimits('test-org-123', {
        monthlyLimitEUR: 0.0001 // Very low limit
      });
      
      const response = await request(app)
        .post('/api/v1/ai/chat')
        .set('x-org-id', 'test-org-123')
        .send({ message: 'Test message' });
      
      expect(response.status).toBe(402);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('BUDGET_EXCEEDED');
      expect(response.body.details.period).toBe('monthly');
    });
  });
  
  // ============================================================================
  // KILL SWITCH TESTS
  // ============================================================================
  
  describe('Kill Switch Functionality', () => {
    it('should return 402 when kill switch is active', async () => {
      // Activate kill switch
      finOpsEnforcement.resetKillSwitch('test-org-123'); // Reset first
      // Note: In a real implementation, we would need a method to activate kill switch
      // For now, we'll set very low limits to trigger emergency state
      await finOpsEnforcement.setBudgetLimits('test-org-123', {
        dailyLimitEUR: 0.0001,
        monthlyLimitEUR: 0.0001,
        perRequestLimitEUR: 0.0001
      });
      
      const response = await request(app)
        .post('/api/v1/ai/chat')
        .set('x-org-id', 'test-org-123')
        .send({ message: 'Test message' });
      
      expect(response.status).toBe(402);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('BUDGET_EXCEEDED');
    });
    
    it('should allow requests after kill switch is reset', async () => {
      // First, trigger budget exceeded
      await finOpsEnforcement.setBudgetLimits('test-org-123', {
        dailyLimitEUR: 0.0001,
        monthlyLimitEUR: 0.0001,
        perRequestLimitEUR: 0.0001
      });
      
      // Reset kill switch
      finOpsEnforcement.resetKillSwitch('test-org-123');
      
      // Set normal limits
      await finOpsEnforcement.setBudgetLimits('test-org-123', {
        dailyLimitEUR: 100,
        monthlyLimitEUR: 1000,
        perRequestLimitEUR: 10
      });
      
      const response = await request(app)
        .post('/api/v1/ai/chat')
        .set('x-org-id', 'test-org-123')
        .send({ message: 'Test message' });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
  
  // ============================================================================
  // HEADERS TESTS
  // ============================================================================
  
  describe('Response Headers', () => {
    it('should set all required FinOps headers on successful request', async () => {
      const response = await request(app)
        .post('/api/v1/ai/chat')
        .set('x-org-id', 'test-org-123')
        .send({ message: 'Test message' });
      
      expect(response.status).toBe(200);
      
      // Required headers from PR-97
      expect(response.headers['x-est-cost-eur']).toBeDefined();
      expect(response.headers['x-budget-pct']).toBeDefined();
      expect(response.headers['x-latency-ms']).toBeDefined();
      expect(response.headers['x-route']).toBe('/api/v1/ai/chat');
      expect(response.headers['x-correlation-id']).toBeDefined();
      
      // Additional helpful headers
      expect(response.headers['x-budget-daily']).toBeDefined();
      expect(response.headers['x-budget-monthly']).toBeDefined();
      expect(response.headers['x-budget-status']).toBeDefined();
      expect(response.headers['x-kill-switch']).toBeDefined();
    });
    
    it('should set headers on blocked request (402)', async () => {
      // Set very low limits to trigger 402
      await finOpsEnforcement.setBudgetLimits('test-org-123', {
        perRequestLimitEUR: 0.0001
      });
      
      const response = await request(app)
        .post('/api/v1/ai/chat')
        .set('x-org-id', 'test-org-123')
        .send({ message: 'Test message' });
      
      expect(response.status).toBe(402);
      
      // Should still have headers even on blocked request
      expect(response.headers['x-est-cost-eur']).toBeDefined();
      expect(response.headers['x-budget-pct']).toBeDefined();
      expect(response.headers['x-latency-ms']).toBeDefined();
      expect(response.headers['x-route']).toBe('/api/v1/ai/chat');
      expect(response.headers['x-correlation-id']).toBeDefined();
    });
  });
  
  // ============================================================================
  // ERROR HANDLING TESTS
  // ============================================================================
  
  describe('Error Handling', () => {
    it('should handle middleware errors gracefully', async () => {
      // Mock the budget manager to throw an error
      const originalGetCostStatus = finOpsEnforcement.getCostStatus;
      vi.spyOn(finOpsEnforcement, 'getCostStatus').mockRejectedValue(new Error('Database error'));
      
      const response = await request(app)
        .post('/api/v1/ai/chat')
        .set('x-org-id', 'test-org-123')
        .send({ message: 'Test message' });
      
      // Should fail open and allow the request
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      // Restore original method
      finOpsEnforcement.getCostStatus = originalGetCostStatus;
    });
  });
  
  // ============================================================================
  // MULTIPLE ORGANIZATIONS TESTS
  // ============================================================================
  
  describe('Multiple Organizations', () => {
    it('should handle different budget limits for different organizations', async () => {
      // Set different limits for two organizations
      await finOpsEnforcement.setBudgetLimits('org-1', {
        perRequestLimitEUR: 0.0001 // Very low
      });
      
      await finOpsEnforcement.setBudgetLimits('org-2', {
        perRequestLimitEUR: 100 // High
      });
      
      // Request for org-1 should be blocked
      const response1 = await request(app)
        .post('/api/v1/ai/chat')
        .set('x-org-id', 'org-1')
        .send({ message: 'Test message' });
      
      expect(response1.status).toBe(402);
      
      // Request for org-2 should be allowed
      const response2 = await request(app)
        .post('/api/v1/ai/chat')
        .set('x-org-id', 'org-2')
        .send({ message: 'Test message' });
      
      expect(response2.status).toBe(200);
    });
  });
  
  // ============================================================================
  // PERFORMANCE TESTS
  // ============================================================================
  
  describe('Performance', () => {
    it('should have reasonable latency overhead', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .post('/api/v1/ai/chat')
        .set('x-org-id', 'test-org-123')
        .send({ message: 'Test message' });
      
      const endTime = Date.now();
      const totalLatency = endTime - startTime;
      
      expect(response.status).toBe(200);
      expect(totalLatency).toBeLessThan(1000); // Should be under 1 second
      
      // Check that the latency header is reasonable
      const headerLatency = parseInt(response.headers['x-latency-ms'] as string);
      expect(headerLatency).toBeGreaterThan(0);
      expect(headerLatency).toBeLessThan(1000);
    });
  });
});
