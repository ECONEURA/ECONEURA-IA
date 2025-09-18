/**
 * Tests para FinOps Enforcement Middleware
 * FASE 3 - FINOPS ENFORCE
 * 
 * Tests incluidos:
 * - Tests de límites de presupuesto
 * - Tests de enforcement
 * - Tests de kill-switch
 * - Tests de headers
 * - Tests de eventos
 */

import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { 
  FinOpsEnforcementMiddleware, 
  BudgetManager, 
  CostCalculator,
  CostEstimate,
  BudgetLimits 
} from '../middleware/finops-enforce-v2.js';

// ============================================================================
// MOCKS
// ============================================================================

const mockReq: Partial<Request> = {
  path: '/api/v1/ai/chat',
  headers: {},
  body: { message: 'Test message' },
  query: {},
  on: vi.fn(),
};

const mockRes: Partial<Response> = {
  status: vi.fn().mockReturnThis(),
  json: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
};

const mockNext: NextFunction = vi.fn();

// ============================================================================
// TEST DATA
// ============================================================================

const testCostEstimates: CostEstimate[] = [
  {
    provider: 'openai',
    model: 'gpt-4',
    inputTokens: 1000,
    outputTokens: 500,
    costPerInputToken: 0.00003,
    costPerOutputToken: 0.00006,
  },
  {
    provider: 'anthropic',
    model: 'claude-3-sonnet',
    inputTokens: 2000,
    outputTokens: 1000,
    costPerInputToken: 0.000003,
    costPerOutputToken: 0.000015,
  },
  {
    provider: 'google',
    model: 'gemini-pro',
    inputTokens: 500,
    outputTokens: 250,
    costPerInputToken: 0.0000005,
    costPerOutputToken: 0.0000015,
  },
];

const testBudgetLimits: BudgetLimits[] = [
  {
    dailyLimitEUR: 100,
    monthlyLimitEUR: 1000,
    perRequestLimitEUR: 10,
    warningThreshold: 0.8,
    criticalThreshold: 0.95,
    emergencyThreshold: 1.0,
  },
  {
    dailyLimitEUR: 50,
    monthlyLimitEUR: 500,
    perRequestLimitEUR: 5,
    warningThreshold: 0.7,
    criticalThreshold: 0.9,
    emergencyThreshold: 1.0,
  },
  {
    dailyLimitEUR: 10,
    monthlyLimitEUR: 100,
    perRequestLimitEUR: 1,
    warningThreshold: 0.5,
    criticalThreshold: 0.8,
    emergencyThreshold: 1.0,
  },
];

// ============================================================================
// TEST SUITE
// ============================================================================

describe('FinOpsEnforcementMiddleware', () => {
  let middleware: FinOpsEnforcementMiddleware;
  let budgetManager: BudgetManager;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Create fresh instances
    middleware = new FinOpsEnforcementMiddleware();
    budgetManager = BudgetManager.getInstance();
    
    // Setup request/response mocks
    mockReq.headers = { 'x-org-id': 'test-org-123' };
    mockReq.path = '/api/v1/ai/chat';
    mockReq.body = { message: 'Test message' };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================================================
  // COST CALCULATOR TESTS
  // ============================================================================

  describe('CostCalculator', () => {
    testCostEstimates.forEach((estimate, index) => {
      it(`should calculate cost correctly for estimate ${index + 1}`, () => {
        const cost = CostCalculator.calculateCost(estimate);
        const expectedCost = (estimate.inputTokens * estimate.costPerInputToken) + 
                           (estimate.outputTokens * estimate.costPerOutputToken);
        
        expect(cost).toBeCloseTo(expectedCost, 6);
      });
    });

    it('should estimate cost from request', () => {
      const estimate = CostCalculator.estimateFromRequest(mockReq as any);
      
      expect(estimate).toMatchObject({
        provider: 'openai',
        model: 'gpt-4',
        inputTokens: expect.any(Number),
        outputTokens: expect.any(Number),
        costPerInputToken: expect.any(Number),
        costPerOutputToken: expect.any(Number),
      });
      
      expect(estimate.inputTokens).toBeGreaterThan(0);
      expect(estimate.outputTokens).toBeGreaterThan(0);
    });

    it('should get cost per token for different providers', () => {
      const openaiCosts = CostCalculator.getCostPerToken('openai', 'gpt-4');
      const anthropicCosts = CostCalculator.getCostPerToken('anthropic', 'claude-3-sonnet');
      const unknownCosts = CostCalculator.getCostPerToken('unknown', 'unknown-model');
      
      expect(openaiCosts.input).toBe(0.00003);
      expect(openaiCosts.output).toBe(0.00006);
      expect(anthropicCosts.input).toBe(0.000003);
      expect(anthropicCosts.output).toBe(0.000015);
      expect(unknownCosts.input).toBe(0.00003); // Default fallback
      expect(unknownCosts.output).toBe(0.00006); // Default fallback
    });
  });

  // ============================================================================
  // BUDGET MANAGER TESTS
  // ============================================================================

  describe('BudgetManager', () => {
    it('should initialize cost status for new organization', async () => {
      const orgId = 'new-org-123';
      const status = await budgetManager.getCostStatus(orgId);
      
      expect(status).toMatchObject({
        orgId,
        currentDaily: 0,
        currentMonthly: 0,
        status: 'healthy',
        killSwitchActive: false,
      });
      
      expect(status.limits).toMatchObject({
        dailyLimitEUR: 100,
        monthlyLimitEUR: 1000,
        perRequestLimitEUR: 10,
      });
    });

    it('should update cost correctly', async () => {
      const orgId = 'test-org-123';
      const cost = 5.0;
      
      const status = await budgetManager.updateCost(orgId, cost);
      
      expect(status.currentDaily).toBe(cost);
      expect(status.currentMonthly).toBe(cost);
      expect(status.status).toBe('healthy');
    });

    it('should change status to warning when threshold reached', async () => {
      const orgId = 'test-org-123';
      const status = await budgetManager.getCostStatus(orgId);
      
      // Set warning threshold to 80% of daily limit
      const warningCost = status.limits.dailyLimitEUR * 0.8;
      await budgetManager.updateCost(orgId, warningCost);
      
      const updatedStatus = await budgetManager.getCostStatus(orgId);
      expect(updatedStatus.status).toBe('warning');
    });

    it('should change status to critical when threshold reached', async () => {
      const orgId = 'test-org-123';
      const status = await budgetManager.getCostStatus(orgId);
      
      // Set critical threshold to 95% of daily limit
      const criticalCost = status.limits.dailyLimitEUR * 0.95;
      await budgetManager.updateCost(orgId, criticalCost);
      
      const updatedStatus = await budgetManager.getCostStatus(orgId);
      expect(updatedStatus.status).toBe('critical');
    });

    it('should activate kill switch when emergency threshold reached', async () => {
      const orgId = 'test-org-123';
      const status = await budgetManager.getCostStatus(orgId);
      
      // Set emergency threshold to 100% of daily limit
      const emergencyCost = status.limits.dailyLimitEUR * 1.0;
      await budgetManager.updateCost(orgId, emergencyCost);
      
      const updatedStatus = await budgetManager.getCostStatus(orgId);
      expect(updatedStatus.status).toBe('emergency');
      expect(updatedStatus.killSwitchActive).toBe(true);
      expect(budgetManager.isKillSwitchActive(orgId)).toBe(true);
    });

    it('should validate request within limits', async () => {
      const orgId = 'test-org-123';
      const cost = 1.0;
      
      const validation = await budgetManager.validateRequest(orgId, cost);
      
      expect(validation.allowed).toBe(true);
      expect(validation.status).toBeDefined();
    });

    it('should reject request exceeding per-request limit', async () => {
      const orgId = 'test-org-123';
      const cost = 15.0; // Exceeds default per-request limit of 10
      
      const validation = await budgetManager.validateRequest(orgId, cost);
      
      expect(validation.allowed).toBe(false);
      expect(validation.exceededLimit).toBe('per_request');
    });

    it('should reject request exceeding daily limit', async () => {
      const orgId = 'test-org-123';
      const status = await budgetManager.getCostStatus(orgId);
      
      // Set current daily cost to 90% of limit
      await budgetManager.updateCost(orgId, status.limits.dailyLimitEUR * 0.9);
      
      // Try to add cost that would exceed daily limit
      const additionalCost = status.limits.dailyLimitEUR * 0.2;
      const validation = await budgetManager.validateRequest(orgId, additionalCost);
      
      expect(validation.allowed).toBe(false);
      expect(validation.exceededLimit).toBe('daily');
    });

    it('should reject request when kill switch is active', async () => {
      const orgId = 'test-org-123';
      
      // Activate kill switch
      budgetManager.activateKillSwitch(orgId);
      
      const validation = await budgetManager.validateRequest(orgId, 1.0);
      
      expect(validation.allowed).toBe(false);
      expect(validation.status.killSwitchActive).toBe(true);
    });

    it('should reset kill switch', () => {
      const orgId = 'test-org-123';
      
      // Activate kill switch
      budgetManager.activateKillSwitch(orgId);
      expect(budgetManager.isKillSwitchActive(orgId)).toBe(true);
      
      // Reset kill switch
      budgetManager.resetKillSwitch(orgId);
      expect(budgetManager.isKillSwitchActive(orgId)).toBe(false);
    });

    it('should set custom budget limits', async () => {
      const orgId = 'test-org-123';
      const customLimits = {
        dailyLimitEUR: 200,
        monthlyLimitEUR: 2000,
        perRequestLimitEUR: 20,
      };
      
      await budgetManager.setBudgetLimits(orgId, customLimits);
      const status = await budgetManager.getCostStatus(orgId);
      
      expect(status.limits.dailyLimitEUR).toBe(200);
      expect(status.limits.monthlyLimitEUR).toBe(2000);
      expect(status.limits.perRequestLimitEUR).toBe(20);
    });
  });

  // ============================================================================
  // MIDDLEWARE TESTS
  // ============================================================================

  describe('FinOpsEnforcementMiddleware', () => {
    it('should allow request within budget limits', async () => {
      mockReq.headers = { 'x-org-id': 'test-org-123' };
      mockReq.path = '/api/v1/ai/chat';
      
      await middleware.enforce(mockReq as any, mockRes as any, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalledWith(402);
    });

    it('should block request exceeding budget limits', async () => {
      const orgId = 'test-org-123';
      mockReq.headers = { 'x-org-id': orgId };
      mockReq.path = '/api/v1/ai/chat';
      
      // Set high cost estimate that exceeds limits
      mockReq.costEstimate = {
        provider: 'openai',
        model: 'gpt-4',
        inputTokens: 1000000, // Very high token count
        outputTokens: 500000,
        costPerInputToken: 0.00003,
        costPerOutputToken: 0.00006,
      };
      
      await middleware.enforce(mockReq as any, mockRes as any, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(402);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'BUDGET_EXCEEDED',
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should block request when kill switch is active', async () => {
      const orgId = 'test-org-123';
      mockReq.headers = { 'x-org-id': orgId };
      mockReq.path = '/api/v1/ai/chat';
      
      // Activate kill switch
      budgetManager.activateKillSwitch(orgId);
      
      await middleware.enforce(mockReq as any, mockRes as any, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(402);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'BUDGET_EXCEEDED',
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should skip enforcement for non-AI endpoints', async () => {
      mockReq.path = '/api/v1/users';
      mockReq.headers = { 'x-org-id': 'test-org-123' };
      
      await middleware.enforce(mockReq as any, mockRes as any, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalledWith(402);
    });

    it('should return 400 for missing org ID', async () => {
      mockReq.headers = {};
      mockReq.path = '/api/v1/ai/chat';
      
      await middleware.enforce(mockReq as any, mockRes as any, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'MISSING_ORG_ID',
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should set required headers on successful request', async () => {
      mockReq.headers = { 'x-org-id': 'test-org-123' };
      mockReq.path = '/api/v1/ai/chat';
      
      await middleware.enforce(mockReq as any, mockRes as any, mockNext);
      
      // Check required headers from FASE 3
      expect(mockRes.set).toHaveBeenCalledWith('X-Est-Cost-EUR', expect.any(String));
      expect(mockRes.set).toHaveBeenCalledWith('X-Budget-Pct', expect.any(String));
      expect(mockRes.set).toHaveBeenCalledWith('X-Latency-ms', expect.any(String));
      expect(mockRes.set).toHaveBeenCalledWith('X-Route', '/api/v1/ai/chat');
      expect(mockRes.set).toHaveBeenCalledWith('X-Correlation-Id', expect.any(String));
      
      // Check additional headers
      expect(mockRes.set).toHaveBeenCalledWith('X-Budget-Daily', expect.any(String));
      expect(mockRes.set).toHaveBeenCalledWith('X-Budget-Monthly', expect.any(String));
      expect(mockRes.set).toHaveBeenCalledWith('X-Budget-Status', expect.any(String));
      expect(mockRes.set).toHaveBeenCalledWith('X-Kill-Switch', expect.any(String));
    });

    it('should set headers on blocked request', async () => {
      const orgId = 'test-org-123';
      mockReq.headers = { 'x-org-id': orgId };
      mockReq.path = '/api/v1/ai/chat';
      
      // Activate kill switch to block request
      budgetManager.activateKillSwitch(orgId);
      
      await middleware.enforce(mockReq as any, mockRes as any, mockNext);
      
      // Should still set headers even on blocked request
      expect(mockRes.set).toHaveBeenCalledWith('X-Est-Cost-EUR', expect.any(String));
      expect(mockRes.set).toHaveBeenCalledWith('X-Budget-Pct', expect.any(String));
      expect(mockRes.set).toHaveBeenCalledWith('X-Latency-ms', expect.any(String));
      expect(mockRes.set).toHaveBeenCalledWith('X-Route', '/api/v1/ai/chat');
      expect(mockRes.set).toHaveBeenCalledWith('X-Correlation-Id', expect.any(String));
    });

    it('should handle enforcement errors gracefully', async () => {
      mockReq.headers = { 'x-org-id': 'test-org-123' };
      mockReq.path = '/api/v1/ai/chat';
      
      // Mock budget manager to throw error
      vi.spyOn(budgetManager, 'validateRequest').mockRejectedValue(new Error('Database error'));
      
      await middleware.enforce(mockReq as any, mockRes as any, mockNext);
      
      // Should fail open and continue
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalledWith(402);
    });
  });

  // ============================================================================
  // INTEGRATION TESTS
  // ============================================================================

  describe('Integration Tests', () => {
    it('should handle complete budget enforcement flow', async () => {
      const orgId = 'integration-test-org';
      mockReq.headers = { 'x-org-id': orgId };
      mockReq.path = '/api/v1/ai/chat';
      
      // Set custom budget limits
      await budgetManager.setBudgetLimits(orgId, {
        dailyLimitEUR: 10,
        monthlyLimitEUR: 100,
        perRequestLimitEUR: 2,
      });
      
      // First request should succeed
      await middleware.enforce(mockReq as any, mockRes as any, mockNext);
      expect(mockNext).toHaveBeenCalled();
      
      // Reset mocks
      vi.clearAllMocks();
      
      // Set high cost estimate to exceed per-request limit
      mockReq.costEstimate = {
        provider: 'openai',
        model: 'gpt-4',
        inputTokens: 100000,
        outputTokens: 50000,
        costPerInputToken: 0.00003,
        costPerOutputToken: 0.00006,
      };
      
      // Second request should be blocked
      await middleware.enforce(mockReq as any, mockRes as any, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(402);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle kill switch activation and deactivation', async () => {
      const orgId = 'kill-switch-test-org';
      mockReq.headers = { 'x-org-id': orgId };
      mockReq.path = '/api/v1/ai/chat';
      
      // First request should succeed
      await middleware.enforce(mockReq as any, mockRes as any, mockNext);
      expect(mockNext).toHaveBeenCalled();
      
      // Reset mocks
      vi.clearAllMocks();
      
      // Activate kill switch
      budgetManager.activateKillSwitch(orgId);
      
      // Second request should be blocked
      await middleware.enforce(mockReq as any, mockRes as any, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(402);
      expect(mockNext).not.toHaveBeenCalled();
      
      // Reset mocks
      vi.clearAllMocks();
      
      // Reset kill switch
      budgetManager.resetKillSwitch(orgId);
      
      // Third request should succeed again
      await middleware.enforce(mockReq as any, mockRes as any, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // EDGE CASES
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle zero cost requests', async () => {
      mockReq.headers = { 'x-org-id': 'test-org-123' };
      mockReq.path = '/api/v1/ai/chat';
      mockReq.costEstimate = {
        provider: 'local',
        model: 'llama-2',
        inputTokens: 0,
        outputTokens: 0,
        costPerInputToken: 0,
        costPerOutputToken: 0,
      };
      
      await middleware.enforce(mockReq as any, mockRes as any, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.set).toHaveBeenCalledWith('X-Est-Cost-EUR', '0.000000');
    });

    it('should handle very high cost requests', async () => {
      mockReq.headers = { 'x-org-id': 'test-org-123' };
      mockReq.path = '/api/v1/ai/chat';
      mockReq.costEstimate = {
        provider: 'openai',
        model: 'gpt-4',
        inputTokens: 10000000,
        outputTokens: 5000000,
        costPerInputToken: 0.00003,
        costPerOutputToken: 0.00006,
      };
      
      await middleware.enforce(mockReq as any, mockRes as any, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(402);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'BUDGET_EXCEEDED',
        })
      );
    });

    it('should handle missing cost estimate', async () => {
      mockReq.headers = { 'x-org-id': 'test-org-123' };
      mockReq.path = '/api/v1/ai/chat';
      mockReq.costEstimate = undefined;
      
      await middleware.enforce(mockReq as any, mockRes as any, mockNext);
      
      // Should estimate cost from request
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.set).toHaveBeenCalledWith('X-Est-Cost-EUR', expect.any(String));
    });
  });
});
