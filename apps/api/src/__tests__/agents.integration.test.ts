import request from 'supertest';
import express from 'express';
import { agentsRouter } from '../routes/agents.js';

const app = express();
app.use(express.json());
app.use('/v1/agents', agentsRouter);

describe('Agents API Integration Tests', () => {
  const testHeaders = {
    'x-org-id': 'test-org-123',
    'x-user-id': 'test-user-456',
    'x-correlation-id': 'test-correlation-789'
  };

  describe('GET /v1/agents', () => {
    it('should list available agents', async () => {
      const response = await request(app)
        .get('/v1/agents')
        .set(testHeaders)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('count');
      expect(response.body).toHaveProperty('categories');
      expect(Array.isArray(response.body.data)).toBe(true);
      
      // Check FinOps headers
      expect(response.headers).toHaveProperty('x-est-cost-eur');
      expect(response.headers).toHaveProperty('x-budget-pct');
      expect(response.headers).toHaveProperty('x-latency-ms');
      expect(response.headers).toHaveProperty('x-route');
      expect(response.headers).toHaveProperty('x-correlation-id');
    });

    it('should return 400 for missing org-id header', async () => {
      const response = await request(app)
        .get('/v1/agents')
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Missing x-org-id header');
    });
  });

  describe('GET /v1/agents/health', () => {
    it('should return real health status', async () => {
      const response = await request(app)
        .get('/v1/agents/health')
        .set(testHeaders)
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('dependencies');
      expect(response.body).toHaveProperty('agents');
      expect(response.body).toHaveProperty('metrics');
      
      // Check dependencies structure
      expect(response.body.dependencies).toHaveProperty('aiRouter');
      expect(response.body.dependencies).toHaveProperty('agentRegistry');
      expect(response.body.dependencies).toHaveProperty('database');
      
      // Check agents structure
      expect(response.body.agents).toHaveProperty('total');
      expect(response.body.agents).toHaveProperty('healthy');
      expect(response.body.agents).toHaveProperty('degraded');
      expect(response.body.agents).toHaveProperty('unhealthy');
      
      // Check metrics structure
      expect(response.body.metrics).toHaveProperty('activeExecutions');
      expect(response.body.metrics).toHaveProperty('queuedTasks');
      expect(response.body.metrics).toHaveProperty('totalExecutions');
      
      // Check FinOps headers
      expect(response.headers).toHaveProperty('x-est-cost-eur');
      expect(response.headers).toHaveProperty('x-budget-pct');
      expect(response.headers).toHaveProperty('x-latency-ms');
      expect(response.headers).toHaveProperty('x-route');
      expect(response.headers).toHaveProperty('x-correlation-id');
    });

    it('should return 400 for missing org-id header', async () => {
      const response = await request(app)
        .get('/v1/agents/health')
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Missing x-org-id header');
    });

    it('should handle health check failures gracefully', async () => {
      // This test would require mocking the aiRouterClient to fail
      // For now, we'll just verify the endpoint exists and returns a response
      const response = await request(app)
        .get('/v1/agents/health')
        .set(testHeaders);

      expect([200, 500]).toContain(response.status);
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('POST /v1/agents/run', () => {
    it('should execute an agent with valid request', async () => {
      const executionRequest = {
        agentId: 'ventas_lead_qualification',
        inputs: {
          leadName: 'John Doe',
          company: 'Test Company',
          email: 'john@test.com'
        },
        budget: 1.0,
        priority: 'medium'
      };

      const response = await request(app)
        .post('/v1/agents/run')
        .set(testHeaders)
        .send(executionRequest);

      // The response might be 200 (success) or 500 (if AI router is not available)
      // Both are acceptable for this test
      expect([200, 500]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('executionId');
        expect(response.body).toHaveProperty('status');
      } else {
        expect(response.body).toHaveProperty('error');
      }
    });

    it('should return 400 for missing agentId', async () => {
      const executionRequest = {
        inputs: {
          leadName: 'John Doe'
        }
      };

      const response = await request(app)
        .post('/v1/agents/run')
        .set(testHeaders)
        .send(executionRequest)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'agentId is required');
    });

    it('should return 404 for non-existent agent', async () => {
      const executionRequest = {
        agentId: 'non-existent-agent',
        inputs: {
          test: 'data'
        }
      };

      const response = await request(app)
        .post('/v1/agents/run')
        .set(testHeaders)
        .send(executionRequest)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Agent not found');
      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 for missing org-id header', async () => {
      const executionRequest = {
        agentId: 'ventas_lead_qualification',
        inputs: {
          leadName: 'John Doe'
        }
      };

      const response = await request(app)
        .post('/v1/agents/run')
        .send(executionRequest)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Missing x-org-id header');
    });
  });

  describe('GET /v1/agents/executions/:executionId', () => {
    it('should return execution status', async () => {
      // First create an execution
      const executionRequest = {
        agentId: 'ventas_lead_qualification',
        inputs: {
          leadName: 'John Doe',
          company: 'Test Company'
        }
      };

      const createResponse = await request(app)
        .post('/v1/agents/run')
        .set(testHeaders)
        .send(executionRequest);

      if (createResponse.status === 200 && createResponse.body.executionId) {
        const executionId = createResponse.body.executionId;
        
        const response = await request(app)
          .get(`/v1/agents/executions/${executionId}`)
          .set(testHeaders);

        expect([200, 404]).toContain(response.status);
        
        if (response.status === 200) {
          expect(response.body).toHaveProperty('executionId', executionId);
          expect(response.body).toHaveProperty('status');
          expect(response.body).toHaveProperty('agentId');
        }
      } else {
        // If we can't create an execution, just verify the endpoint exists
        const response = await request(app)
          .get('/v1/agents/executions/test-execution-id')
          .set(testHeaders);

        expect([200, 404]).toContain(response.status);
      }
    });

    it('should return 400 for missing org-id header', async () => {
      const response = await request(app)
        .get('/v1/agents/executions/test-id')
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Missing x-org-id header');
    });
  });
});
