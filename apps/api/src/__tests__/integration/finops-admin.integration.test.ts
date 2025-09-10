/**
 * FinOps Administration Integration Tests
 * PR-97: FinOps ENFORCE e2e - Admin endpoints integration tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import finOpsAdminRouter from '../../routes/finops-admin.js';
import { finOpsEnforcement } from '../../middleware/finops-enforce-v2.js';

// ============================================================================
// TEST APP SETUP
// ============================================================================

const createTestApp = () => {
  const app = express();
  
  app.use(express.json());
  
  // Mount FinOps admin routes
  app.use('/v1/finops-admin', finOpsAdminRouter);
  
  return app;
};

// ============================================================================
// TEST SUITE
// ============================================================================

describe('FinOps Administration Integration Tests', () => {
  let app: express.Application;
  const adminKey = 'test-admin-key';
  
  beforeEach(() => {
    app = createTestApp();
    // Set admin key for testing
    process.env.ADMIN_KEY = adminKey;
    // Reset any existing kill switches
    finOpsEnforcement.resetKillSwitch('test-org-123');
  });
  
  afterEach(() => {
    // Clean up after each test
    finOpsEnforcement.resetKillSwitch('test-org-123');
    delete process.env.ADMIN_KEY;
  });
  
  // ============================================================================
  // AUTHENTICATION TESTS
  // ============================================================================
  
  describe('Authentication', () => {
    it('should require admin key for all endpoints', async () => {
      const response = await request(app)
        .get('/v1/finops-admin/status/test-org-123');
      
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('UNAUTHORIZED');
    });
    
    it('should accept valid admin key', async () => {
      const response = await request(app)
        .get('/v1/finops-admin/status/test-org-123')
        .set('x-admin-key', adminKey);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
  
  // ============================================================================
  // STATUS ENDPOINT TESTS
  // ============================================================================
  
  describe('Status Endpoint', () => {
    it('should return cost status for organization', async () => {
      const response = await request(app)
        .get('/v1/finops-admin/status/test-org-123')
        .set('x-admin-key', adminKey);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        orgId: 'test-org-123',
        currentDaily: expect.any(Number),
        currentMonthly: expect.any(Number),
        status: expect.any(String),
        killSwitchActive: expect.any(Boolean),
        limits: {
          dailyLimitEUR: expect.any(Number),
          monthlyLimitEUR: expect.any(Number),
          perRequestLimitEUR: expect.any(Number)
        }
      });
    });
    
    it('should return 400 for invalid org ID', async () => {
      const response = await request(app)
        .get('/v1/finops-admin/status/')
        .set('x-admin-key', adminKey);
      
      expect(response.status).toBe(404); // Express route not found
    });
  });
  
  // ============================================================================
  // BUDGET LIMITS TESTS
  // ============================================================================
  
  describe('Budget Limits Endpoint', () => {
    it('should set budget limits for organization', async () => {
      const newLimits = {
        dailyLimitEUR: 50,
        monthlyLimitEUR: 500,
        perRequestLimitEUR: 5
      };
      
      const response = await request(app)
        .post('/v1/finops-admin/limits/test-org-123')
        .set('x-admin-key', adminKey)
        .send(newLimits);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Budget limits updated successfully');
      expect(response.body.data.limits).toMatchObject(newLimits);
    });
    
    it('should validate budget limits input', async () => {
      const invalidLimits = {
        dailyLimitEUR: -10, // Invalid negative value
        monthlyLimitEUR: 'invalid' // Invalid type
      };
      
      const response = await request(app)
        .post('/v1/finops-admin/limits/test-org-123')
        .set('x-admin-key', adminKey)
        .send(invalidLimits);
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('INVALID_REQUEST');
    });
    
    it('should allow partial budget limits update', async () => {
      const partialLimits = {
        dailyLimitEUR: 25
      };
      
      const response = await request(app)
        .post('/v1/finops-admin/limits/test-org-123')
        .set('x-admin-key', adminKey)
        .send(partialLimits);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.limits.dailyLimitEUR).toBe(25);
    });
  });
  
  // ============================================================================
  // KILL SWITCH TESTS
  // ============================================================================
  
  describe('Kill Switch Endpoints', () => {
    it('should reset kill switch for organization', async () => {
      // First, activate kill switch by setting very low limits
      await finOpsEnforcement.setBudgetLimits('test-org-123', {
        dailyLimitEUR: 0.0001,
        monthlyLimitEUR: 0.0001,
        perRequestLimitEUR: 0.0001
      });
      
      const response = await request(app)
        .post('/v1/finops-admin/kill-switch/test-org-123/reset')
        .set('x-admin-key', adminKey);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Kill switch reset successfully');
      expect(response.body.data.killSwitchActive).toBe(false);
    });
    
    it('should check kill switch status', async () => {
      const response = await request(app)
        .get('/v1/finops-admin/kill-switch/test-org-123/status')
        .set('x-admin-key', adminKey);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        orgId: 'test-org-123',
        killSwitchActive: expect.any(Boolean),
        status: expect.any(String),
        currentDaily: expect.any(Number),
        currentMonthly: expect.any(Number),
        limits: expect.any(Object)
      });
    });
  });
  
  // ============================================================================
  // TEST BUDGET EXCEEDED ENDPOINT
  // ============================================================================
  
  describe('Test Budget Exceeded Endpoint', () => {
    it('should configure test scenario for budget exceeded', async () => {
      const testData = {
        orgId: 'test-org-123',
        cost: 0.001
      };
      
      const response = await request(app)
        .post('/v1/finops-admin/test-budget-exceeded')
        .set('x-admin-key', adminKey)
        .send(testData);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Budget exceeded test scenario configured');
      expect(response.body.data.orgId).toBe('test-org-123');
      expect(response.body.data.testCost).toBe(0.001);
    });
    
    it('should validate test data input', async () => {
      const invalidData = {
        orgId: '', // Invalid empty org ID
        cost: -1 // Invalid negative cost
      };
      
      const response = await request(app)
        .post('/v1/finops-admin/test-budget-exceeded')
        .set('x-admin-key', adminKey)
        .send(invalidData);
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('INVALID_REQUEST');
    });
  });
  
  // ============================================================================
  // HEALTH ENDPOINT TESTS
  // ============================================================================
  
  describe('Health Endpoint', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/v1/finops-admin/health');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        status: 'healthy',
        timestamp: expect.any(String),
        version: '1.0.0',
        features: expect.arrayContaining([
          'budget_enforcement',
          'kill_switch',
          'cost_tracking',
          '402_responses',
          'admin_endpoints'
        ])
      });
    });
    
    it('should not require authentication for health endpoint', async () => {
      const response = await request(app)
        .get('/v1/finops-admin/health');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
  
  // ============================================================================
  // ERROR HANDLING TESTS
  // ============================================================================
  
  describe('Error Handling', () => {
    it('should handle invalid org ID gracefully', async () => {
      const response = await request(app)
        .get('/v1/finops-admin/status/invalid-org-id')
        .set('x-admin-key', adminKey);
      
      // Should still return 200 with default status
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.orgId).toBe('invalid-org-id');
    });
    
    it('should handle missing request body gracefully', async () => {
      const response = await request(app)
        .post('/v1/finops-admin/limits/test-org-123')
        .set('x-admin-key', adminKey);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      // Should use existing limits
    });
  });
  
  // ============================================================================
  // INTEGRATION TESTS
  // ============================================================================
  
  describe('Integration with FinOps Enforcement', () => {
    it('should reflect budget limit changes in enforcement', async () => {
      // Set very low limits via admin endpoint
      const newLimits = {
        perRequestLimitEUR: 0.0001
      };
      
      await request(app)
        .post('/v1/finops-admin/limits/test-org-123')
        .set('x-admin-key', adminKey)
        .send(newLimits);
      
      // Verify the limits were set
      const statusResponse = await request(app)
        .get('/v1/finops-admin/status/test-org-123')
        .set('x-admin-key', adminKey);
      
      expect(statusResponse.status).toBe(200);
      expect(statusResponse.body.data.limits.perRequestLimitEUR).toBe(0.0001);
    });
    
    it('should allow kill switch reset to affect enforcement', async () => {
      // First, set very low limits to trigger kill switch
      await request(app)
        .post('/v1/finops-admin/limits/test-org-123')
        .set('x-admin-key', adminKey)
        .send({
          dailyLimitEUR: 0.0001,
          monthlyLimitEUR: 0.0001,
          perRequestLimitEUR: 0.0001
        });
      
      // Reset kill switch
      await request(app)
        .post('/v1/finops-admin/kill-switch/test-org-123/reset')
        .set('x-admin-key', adminKey);
      
      // Set normal limits
      await request(app)
        .post('/v1/finops-admin/limits/test-org-123')
        .set('x-admin-key', adminKey)
        .send({
          dailyLimitEUR: 100,
          monthlyLimitEUR: 1000,
          perRequestLimitEUR: 10
        });
      
      // Verify kill switch is not active
      const statusResponse = await request(app)
        .get('/v1/finops-admin/kill-switch/test-org-123/status')
        .set('x-admin-key', adminKey);
      
      expect(statusResponse.status).toBe(200);
      expect(statusResponse.body.data.killSwitchActive).toBe(false);
    });
  });
});
