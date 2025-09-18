/**
 * Tests para agentes NEURA
 * FASE 2 - AGENTES NEURA + MEMORIA
 * 
 * Tests incluidos:
 * - Tests unitarios table-driven
 * - 1 test de integración de éxito
 * - 1 test de integración de error
 */

import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { AgentsController } from '../presentation/controllers/agents.controller.js';
import { AgentConnector, AgentExecutionResult, AgentHealth } from '../../../../packages/agents/connector.d.js';
import { AgentSpecificMemory } from '../../../../packages/agents/memory.js';
import { AgentContext, AgentResult } from '../../../../packages/agents/src/types.js';

// ============================================================================
// MOCKS
// ============================================================================

const mockMemory: Partial<AgentSpecificMemory> = {
  putAgentResult: vi.fn(),
  getAgentResult: vi.fn(),
  putAgentContext: vi.fn(),
  query: vi.fn(),
  deleteByPattern: vi.fn(),
};

const mockConnector: Partial<AgentConnector> = {
  id: 'test-agent',
  name: 'Test Agent',
  version: '1.0.0',
  inputSchema: {},
  outputSchema: {},
  policy: {
    maxExecutionTimeMs: 30000,
    maxRetries: 3,
    retryDelayMs: 1000,
    requiresApproval: false,
    costCategory: 'low',
  },
  idempotencyConfig: {
    key: 'test-key',
    ttlSeconds: 3600,
    returnCached: true,
  },
  retryConfig: {
    maxRetries: 3,
    initialDelayMs: 1000,
    backoffMultiplier: 2,
    maxDelayMs: 10000,
    retryableErrors: [500, 502, 503, 504],
  },
  circuitBreakerConfig: {
    failureThreshold: 5,
    recoveryTimeoutMs: 30000,
    failureRateThreshold: 50,
    windowMs: 60000,
  },
  run: vi.fn(),
  health: vi.fn(),
  validateInputs: vi.fn(),
  validateOutputs: vi.fn(),
  getStats: vi.fn(),
  resetCircuitBreaker: vi.fn(),
  clearIdempotencyCache: vi.fn(),
};

// ============================================================================
// TEST DATA
// ============================================================================

const testCases = [
  {
    name: 'Valid execution with simple inputs',
    inputs: { message: 'Hello World' },
    expectedResult: { response: 'Hello World processed' },
    shouldSucceed: true,
  },
  {
    name: 'Valid execution with complex inputs',
    inputs: { 
      data: { users: [{ id: 1, name: 'John' }] },
      options: { format: 'json' }
    },
    expectedResult: { processed: true, count: 1 },
    shouldSucceed: true,
  },
  {
    name: 'Execution with invalid inputs',
    inputs: { invalid: 'data' },
    expectedResult: null,
    shouldSucceed: false,
    expectedError: 'Invalid inputs',
  },
  {
    name: 'Execution with idempotency key',
    inputs: { message: 'Test' },
    idempotencyKey: 'test-key-123',
    expectedResult: { response: 'Test processed' },
    shouldSucceed: true,
    shouldBeIdempotent: true,
  },
];

const healthTestCases = [
  {
    name: 'Healthy agent',
    health: {
      status: 'healthy' as const,
      lastChecked: new Date(),
      avgResponseTimeMs: 150,
      successCount: 100,
      failureCount: 2,
      circuitBreakerState: 'closed' as const,
      message: 'All systems operational',
    },
    expectedStatus: 'healthy',
  },
  {
    name: 'Degraded agent',
    health: {
      status: 'degraded' as const,
      lastChecked: new Date(),
      avgResponseTimeMs: 2000,
      successCount: 50,
      failureCount: 10,
      circuitBreakerState: 'half-open' as const,
      message: 'High response times detected',
    },
    expectedStatus: 'degraded',
  },
  {
    name: 'Unhealthy agent',
    health: {
      status: 'unhealthy' as const,
      lastChecked: new Date(),
      avgResponseTimeMs: 5000,
      successCount: 10,
      failureCount: 50,
      circuitBreakerState: 'open' as const,
      message: 'Circuit breaker open',
    },
    expectedStatus: 'unhealthy',
  },
];

// ============================================================================
// TEST SUITE
// ============================================================================

describe('AgentsController', () => {
  let controller: AgentsController;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Create controller
    controller = new AgentsController(mockMemory as AgentSpecificMemory);
    
    // Register test agent
    controller.registerAgent(mockConnector as AgentConnector);
    
    // Setup request/response mocks
    mockReq = {
      params: { id: 'test-agent' },
      body: {},
      user: { id: 'user-123', orgId: 'org-456', isAdmin: false },
      get: vi.fn(),
      ip: '127.0.0.1',
      headers: {},
    };
    
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    
    mockNext = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================================================
  // UNIT TESTS - TABLE DRIVEN
  // ============================================================================

  describe('executeAgent - Table Driven Tests', () => {
    testCases.forEach((testCase) => {
      it(`should handle ${testCase.name}`, async () => {
        // Arrange
        mockReq.body = {
          inputs: testCase.inputs,
          idempotencyKey: testCase.idempotencyKey,
        };

        if (testCase.shouldBeIdempotent) {
          (mockMemory.getAgentResult as Mock).mockResolvedValue(testCase.expectedResult);
        } else {
          (mockMemory.getAgentResult as Mock).mockResolvedValue(null);
        }

        if (testCase.shouldSucceed) {
          (mockConnector.validateInputs as Mock).mockReturnValue({ valid: true });
          (mockConnector.validateOutputs as Mock).mockReturnValue({ valid: true });
          
          const executionResult: AgentExecutionResult = {
            success: true,
            data: testCase.expectedResult,
            executionId: 'exec-123',
            startedAt: new Date(),
            completedAt: new Date(),
            executionTimeMs: 100,
            retryCount: 0,
            circuitBreakerState: 'closed',
            costEur: 0.01,
          };
          
          (mockConnector.run as Mock).mockResolvedValue(executionResult);
        } else {
          (mockConnector.validateInputs as Mock).mockReturnValue({ 
            valid: false, 
            errors: [testCase.expectedError || 'Validation failed'] 
          });
        }

        // Act
        await controller.executeAgent(mockReq as Request, mockRes as Response, mockNext);

        // Assert
        if (testCase.shouldSucceed) {
          expect(mockRes.status).not.toHaveBeenCalledWith(400);
          expect(mockRes.status).not.toHaveBeenCalledWith(500);
          expect(mockRes.json).toHaveBeenCalledWith(
            expect.objectContaining({
              success: true,
              data: testCase.expectedResult,
            })
          );

          if (testCase.shouldBeIdempotent) {
            expect(mockRes.json).toHaveBeenCalledWith(
              expect.objectContaining({
                idempotent: true,
              })
            );
          }
        } else {
          expect(mockRes.status).toHaveBeenCalledWith(400);
          expect(mockRes.json).toHaveBeenCalledWith(
            expect.objectContaining({
              success: false,
              error: testCase.expectedError,
            })
          );
        }
      });
    });
  });

  describe('getAgentHealth - Table Driven Tests', () => {
    healthTestCases.forEach((testCase) => {
      it(`should return ${testCase.name}`, async () => {
        // Arrange
        (mockConnector.health as Mock).mockResolvedValue(testCase.health);

        // Act
        await controller.getAgentHealth(mockReq as Request, mockRes as Response, mockNext);

        // Assert
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: true,
            data: expect.objectContaining({
              agentId: 'test-agent',
              status: testCase.expectedStatus,
            }),
          })
        );
      });
    });
  });

  // ============================================================================
  // INTEGRATION TESTS
  // ============================================================================

  describe('Integration Tests', () => {
    it('should successfully execute agent with full flow', async () => {
      // Arrange
      const inputs = { message: 'Integration test' };
      const expectedResult = { response: 'Integration test processed' };
      
      mockReq.body = { inputs };
      
      (mockMemory.getAgentResult as Mock).mockResolvedValue(null);
      (mockConnector.validateInputs as Mock).mockReturnValue({ valid: true });
      (mockConnector.validateOutputs as Mock).mockReturnValue({ valid: true });
      
      const executionResult: AgentExecutionResult = {
        success: true,
        data: expectedResult,
        executionId: 'exec-integration-123',
        startedAt: new Date(),
        completedAt: new Date(),
        executionTimeMs: 150,
        retryCount: 0,
        circuitBreakerState: 'closed',
        costEur: 0.02,
      };
      
      (mockConnector.run as Mock).mockResolvedValue(executionResult);

      // Act
      await controller.executeAgent(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockConnector.validateInputs).toHaveBeenCalledWith(inputs);
      expect(mockConnector.run).toHaveBeenCalledWith(
        inputs,
        expect.objectContaining({
          orgId: 'org-456',
          userId: 'user-123',
          correlationId: expect.any(String),
        })
      );
      expect(mockConnector.validateOutputs).toHaveBeenCalledWith(expectedResult);
      expect(mockMemory.putAgentContext).toHaveBeenCalled();
      
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expectedResult,
          metadata: expect.objectContaining({
            executionId: 'exec-integration-123',
            executionTimeMs: expect.any(Number),
            costEur: 0.02,
            retryCount: 0,
            circuitBreakerState: 'closed',
          }),
        })
      );
    });

    it('should handle agent execution error gracefully', async () => {
      // Arrange
      const inputs = { message: 'Error test' };
      const errorMessage = 'Agent execution failed';
      
      mockReq.body = { inputs };
      
      (mockMemory.getAgentResult as Mock).mockResolvedValue(null);
      (mockConnector.validateInputs as Mock).mockReturnValue({ valid: true });
      (mockConnector.run as Mock).mockRejectedValue(new Error(errorMessage));

      // Act
      await controller.executeAgent(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: errorMessage,
        })
      );
    });

    it('should handle agent not found error', async () => {
      // Arrange
      mockReq.params = { id: 'non-existent-agent' };
      mockReq.body = { inputs: { test: 'data' } };

      // Act
      await controller.executeAgent(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Agent not found',
          agentId: 'non-existent-agent',
        })
      );
    });

    it('should handle invalid request body', async () => {
      // Arrange
      mockReq.body = { invalid: 'body' };

      // Act
      await controller.executeAgent(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Invalid request body',
        })
      );
    });
  });

  // ============================================================================
  // EDGE CASES
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle missing user context', async () => {
      // Arrange
      mockReq.user = undefined;
      mockReq.body = { inputs: { test: 'data' } };
      
      (mockMemory.getAgentResult as Mock).mockResolvedValue(null);
      (mockConnector.validateInputs as Mock).mockReturnValue({ valid: true });
      (mockConnector.validateOutputs as Mock).mockReturnValue({ valid: true });
      
      const executionResult: AgentExecutionResult = {
        success: true,
        data: { result: 'success' },
        executionId: 'exec-123',
        startedAt: new Date(),
        completedAt: new Date(),
        executionTimeMs: 100,
        retryCount: 0,
        circuitBreakerState: 'closed',
        costEur: 0.01,
      };
      
      (mockConnector.run as Mock).mockResolvedValue(executionResult);

      // Act
      await controller.executeAgent(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockConnector.run).toHaveBeenCalledWith(
        { test: 'data' },
        expect.objectContaining({
          orgId: 'unknown',
          userId: 'unknown',
        })
      );
    });

    it('should handle circuit breaker open state', async () => {
      // Arrange
      const health: AgentHealth = {
        status: 'unhealthy',
        lastChecked: new Date(),
        avgResponseTimeMs: 5000,
        successCount: 5,
        failureCount: 20,
        circuitBreakerState: 'open',
        message: 'Circuit breaker open due to high failure rate',
      };
      
      (mockConnector.health as Mock).mockResolvedValue(health);

      // Act
      await controller.getAgentHealth(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            status: 'unhealthy',
            circuitBreakerState: 'open',
            message: 'Circuit breaker open due to high failure rate',
          }),
        })
      );
    });

    it('should handle admin reset operations', async () => {
      // Arrange
      mockReq.user = { id: 'admin-123', orgId: 'org-456', isAdmin: true };
      mockReq.body = { 
        resetCircuitBreaker: true, 
        clearIdempotencyCache: true 
      };
      
      (mockConnector.resetCircuitBreaker as Mock).mockResolvedValue(undefined);
      (mockConnector.clearIdempotencyCache as Mock).mockResolvedValue(undefined);

      // Act
      await controller.resetAgent(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockConnector.resetCircuitBreaker).toHaveBeenCalled();
      expect(mockConnector.clearIdempotencyCache).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            agentId: 'test-agent',
            resetCircuitBreaker: true,
            clearIdempotencyCache: true,
          }),
        })
      );
    });

    it('should reject non-admin reset operations', async () => {
      // Arrange
      mockReq.user = { id: 'user-123', orgId: 'org-456', isAdmin: false };
      mockReq.body = { resetCircuitBreaker: true };

      // Act
      await controller.resetAgent(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Admin privileges required',
        })
      );
    });
  });
});
