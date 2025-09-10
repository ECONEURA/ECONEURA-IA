/**
 * Cockpit BFF Live Integration Tests
 * PR-98: Cockpit BFF Live (web+api) - SSE y WebSocket integration tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import cockpitBFFLiveRouter from '../../routes/cockpit-bff-live.js';
import { cockpitBFFLiveService } from '../../services/cockpit-bff-live.service.js';

// ============================================================================
// TEST APP SETUP
// ============================================================================

const createTestApp = () => {
  const app = express();
  
  app.use(express.json());
  
  // Mount Cockpit BFF Live routes
  app.use('/v1/cockpit-bff-live', cockpitBFFLiveRouter);
  
  return app;
};

// ============================================================================
// TEST SUITE
// ============================================================================

describe('Cockpit BFF Live Integration Tests', () => {
  let app: express.Application;
  
  beforeEach(() => {
    app = createTestApp();
  });
  
  afterEach(() => {
    // Clean up after each test
    vi.clearAllMocks();
  });
  
  // ============================================================================
  // SSE ENDPOINT TESTS
  // ============================================================================
  
  describe('SSE Endpoints', () => {
    it('should establish SSE connection for cockpit updates', async () => {
      const response = await request(app)
        .get('/v1/cockpit-bff-live/sse')
        .set('x-org-id', 'test-org-123')
        .set('x-user-id', 'test-user-456')
        .query({ subscribe: 'metrics_update,agent_status' });
      
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/event-stream');
      expect(response.headers['cache-control']).toBe('no-cache');
      expect(response.headers['connection']).toBe('keep-alive');
      expect(response.headers['x-correlation-id']).toBeDefined();
    });
    
    it('should include FinOps headers in SSE response', async () => {
      const response = await request(app)
        .get('/v1/cockpit-bff-live/sse')
        .set('x-org-id', 'test-org-123')
        .set('x-user-id', 'test-user-456');
      
      expect(response.status).toBe(200);
      expect(response.headers['x-est-cost-eur']).toBeDefined();
      expect(response.headers['x-budget-pct']).toBeDefined();
      expect(response.headers['x-latency-ms']).toBeDefined();
      expect(response.headers['x-route']).toBe('/v1/cockpit-bff-live/sse');
    });
    
    it('should handle SSE connection without org/user headers', async () => {
      const response = await request(app)
        .get('/v1/cockpit-bff-live/sse');
      
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/event-stream');
    });
  });
  
  // ============================================================================
  // METRICS ENDPOINT TESTS
  // ============================================================================
  
  describe('Metrics Endpoints', () => {
    it('should get latest metrics for a department', async () => {
      const response = await request(app)
        .get('/v1/cockpit-bff-live/metrics/ia');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        department: 'ia',
        timestamp: expect.any(String),
        metrics: {
          activeAgents: expect.any(Number),
          totalCost: expect.any(Number),
          totalTokens: expect.any(Number),
          successRate: expect.any(Number),
          responseTime: expect.any(Number),
          errorRate: expect.any(Number),
          uptime: expect.any(Number),
        },
        alerts: expect.any(Array)
      });
    });
    
    it('should get metrics history for a department', async () => {
      const response = await request(app)
        .get('/v1/cockpit-bff-live/metrics/ia/history')
        .query({ limit: 5 });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        department: 'ia',
        history: expect.any(Array),
        totalRecords: expect.any(Number),
        limit: 5
      });
    });
    
    it('should return 404 for non-existent department metrics', async () => {
      const response = await request(app)
        .get('/v1/cockpit-bff-live/metrics/nonexistent');
      
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('METRICS_NOT_FOUND');
    });
    
    it('should validate department parameter', async () => {
      const response = await request(app)
        .get('/v1/cockpit-bff-live/metrics/invalid-dept');
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('INVALID_REQUEST');
    });
  });
  
  // ============================================================================
  // AGENT STATUS ENDPOINT TESTS
  // ============================================================================
  
  describe('Agent Status Endpoints', () => {
    it('should get status of a specific agent', async () => {
      const response = await request(app)
        .get('/v1/cockpit-bff-live/agent/agent-ia-1/status');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        agentId: 'agent-ia-1',
        department: 'ia',
        status: expect.any(String),
        lastActivity: expect.any(String),
        metrics: {
          requestsProcessed: expect.any(Number),
          averageResponseTime: expect.any(Number),
          errorCount: expect.any(Number),
          cost: expect.any(Number),
        },
        health: {
          cpu: expect.any(Number),
          memory: expect.any(Number),
          disk: expect.any(Number),
          network: expect.any(Number),
        }
      });
    });
    
    it('should get all agents for a department', async () => {
      const response = await request(app)
        .get('/v1/cockpit-bff-live/department/ia/agents');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        department: 'ia',
        agents: expect.any(Array),
        totalAgents: expect.any(Number),
        activeAgents: expect.any(Number),
        errorAgents: expect.any(Number)
      });
      
      expect(response.body.data.agents.length).toBeGreaterThan(0);
    });
    
    it('should return 404 for non-existent agent', async () => {
      const response = await request(app)
        .get('/v1/cockpit-bff-live/agent/nonexistent-agent/status');
      
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('AGENT_NOT_FOUND');
    });
    
    it('should validate department parameter for agents endpoint', async () => {
      const response = await request(app)
        .get('/v1/cockpit-bff-live/department/invalid-dept/agents');
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('INVALID_REQUEST');
    });
  });
  
  // ============================================================================
  // EVENT ENDPOINT TESTS
  // ============================================================================
  
  describe('Event Endpoints', () => {
    it('should get event history for a department', async () => {
      const response = await request(app)
        .get('/v1/cockpit-bff-live/events/ia/history')
        .query({ limit: 10, type: 'metrics_update' });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        department: 'ia',
        events: expect.any(Array),
        totalRecords: expect.any(Number),
        limit: 10,
        type: 'metrics_update'
      });
    });
    
    it('should validate event history parameters', async () => {
      const response = await request(app)
        .get('/v1/cockpit-bff-live/events/invalid-dept/history');
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('INVALID_REQUEST');
    });
  });
  
  // ============================================================================
  // WEBSOCKET ENDPOINT TESTS
  // ============================================================================
  
  describe('WebSocket Endpoints', () => {
    it('should get WebSocket connection information', async () => {
      const response = await request(app)
        .get('/v1/cockpit-bff-live/websocket/info');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        websocketEnabled: true,
        collaborationAnalytics: expect.any(Object),
        connectionInfo: {
          protocol: 'ws',
          endpoint: '/ws',
          supportedEvents: expect.any(Array)
        }
      });
    });
  });
  
  // ============================================================================
  // SYSTEM ENDPOINT TESTS
  // ============================================================================
  
  describe('System Endpoints', () => {
    it('should get overall cockpit system status', async () => {
      const response = await request(app)
        .get('/v1/cockpit-bff-live/status');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        overallStatus: expect.any(String),
        totalDepartments: 10,
        healthyDepartments: expect.any(Number),
        warningDepartments: expect.any(Number),
        errorDepartments: expect.any(Number),
        departments: expect.any(Array),
        features: {
          sse: true,
          websocket: true,
          realTimeUpdates: true,
          metrics: true,
          agentStatus: true
        }
      });
      
      expect(response.body.data.departments.length).toBe(10);
      expect(response.body.data.departments[0]).toMatchObject({
        department: expect.any(String),
        status: expect.any(String),
        activeAgents: expect.any(Number),
        totalAgents: expect.any(Number),
        lastMetricsUpdate: expect.any(String)
      });
    });
    
    it('should get health check information', async () => {
      const response = await request(app)
        .get('/v1/cockpit-bff-live/health');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        status: 'healthy',
        service: 'cockpit-bff-live',
        timestamp: expect.any(String),
        version: '1.0.0',
        uptime: expect.any(Number),
        memory: expect.any(Object),
        features: {
          sse: true,
          websocket: true,
          realTimeUpdates: true,
          metrics: true,
          agentStatus: true,
          eventHistory: true
        }
      });
    });
  });
  
  // ============================================================================
  // INTEGRATION TESTS
  // ============================================================================
  
  describe('Integration Tests', () => {
    it('should handle complete cockpit workflow', async () => {
      // 1. Get system status
      const statusResponse = await request(app)
        .get('/v1/cockpit-bff-live/status');
      
      expect(statusResponse.status).toBe(200);
      expect(statusResponse.body.data.overallStatus).toBeDefined();
      
      // 2. Get metrics for a department
      const metricsResponse = await request(app)
        .get('/v1/cockpit-bff-live/metrics/ia');
      
      expect(metricsResponse.status).toBe(200);
      expect(metricsResponse.body.data.department).toBe('ia');
      
      // 3. Get agents for the same department
      const agentsResponse = await request(app)
        .get('/v1/cockpit-bff-live/department/ia/agents');
      
      expect(agentsResponse.status).toBe(200);
      expect(agentsResponse.body.data.department).toBe('ia');
      expect(agentsResponse.body.data.agents.length).toBeGreaterThan(0);
      
      // 4. Get specific agent status
      const agentId = agentsResponse.body.data.agents[0].agentId;
      const agentResponse = await request(app)
        .get(`/v1/cockpit-bff-live/agent/${agentId}/status`);
      
      expect(agentResponse.status).toBe(200);
      expect(agentResponse.body.data.agentId).toBe(agentId);
    });
    
    it('should handle multiple departments', async () => {
      const departments = ['ceo', 'ia', 'cso', 'cto', 'ciso'];
      
      for (const dept of departments) {
        const response = await request(app)
          .get(`/v1/cockpit-bff-live/metrics/${dept}`);
        
        expect(response.status).toBe(200);
        expect(response.body.data.department).toBe(dept);
      }
    });
    
    it('should provide consistent data across endpoints', async () => {
      // Get system status
      const statusResponse = await request(app)
        .get('/v1/cockpit-bff-live/status');
      
      // Get individual department data
      const iaMetricsResponse = await request(app)
        .get('/v1/cockpit-bff-live/metrics/ia');
      
      const iaAgentsResponse = await request(app)
        .get('/v1/cockpit-bff-live/department/ia/agents');
      
      // Verify consistency
      const iaStatus = statusResponse.body.data.departments.find((d: any) => d.department === 'ia');
      expect(iaStatus).toBeDefined();
      expect(iaStatus.activeAgents).toBe(iaAgentsResponse.body.data.activeAgents);
    });
  });
  
  // ============================================================================
  // ERROR HANDLING TESTS
  // ============================================================================
  
  describe('Error Handling', () => {
    it('should handle invalid department names', async () => {
      const invalidDepartments = ['invalid', 'test', 'xyz'];
      
      for (const dept of invalidDepartments) {
        const response = await request(app)
          .get(`/v1/cockpit-bff-live/metrics/${dept}`);
        
        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('INVALID_REQUEST');
      }
    });
    
    it('should handle missing parameters gracefully', async () => {
      const response = await request(app)
        .get('/v1/cockpit-bff-live/agent//status');
      
      expect(response.status).toBe(404); // Express route not found
    });
    
    it('should handle malformed query parameters', async () => {
      const response = await request(app)
        .get('/v1/cockpit-bff-live/metrics/ia/history')
        .query({ limit: 'invalid' });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('INVALID_REQUEST');
    });
  });
  
  // ============================================================================
  // PERFORMANCE TESTS
  // ============================================================================
  
  describe('Performance', () => {
    it('should respond to status endpoint within reasonable time', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/v1/cockpit-bff-live/status');
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
    });
    
    it('should handle concurrent requests', async () => {
      const departments = ['ceo', 'ia', 'cso', 'cto', 'ciso'];
      
      const promises = departments.map(dept => 
        request(app).get(`/v1/cockpit-bff-live/metrics/${dept}`)
      );
      
      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });
});
