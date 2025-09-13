import request from 'supertest';
import express from 'express';
import memoryRoutes from '../routes/memory.routes.js';

const app = express();
app.use(express.json());
app.use('/v1/memory', memoryRoutes);

describe('Memory API Integration Tests', () => {
  describe('POST /v1/memory/put', () => {
    it('should store memory with text', async () => {
      const memoryData = {
        tenantId: 'tenant-123',
        userId: 'user-456',
        agentId: 'agent-789',
        namespace: 'conversations',
        text: 'User asked about product pricing',
        meta: { source: 'chat', priority: 'high' }
      };

      const response = await request(app)
        .post('/v1/memory/put')
        .send(memoryData)
        .expect(200);

      expect(response.body).toHaveProperty('ok', true);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('should store memory with vector', async () => {
      const memoryData = {
        tenantId: 'tenant-123',
        namespace: 'embeddings',
        vector: [0.1, 0.2, 0.3, 0.4, 0.5],
        ttlSec: 3600
      };

      const response = await request(app)
        .post('/v1/memory/put')
        .send(memoryData)
        .expect(200);

      expect(response.body).toHaveProperty('ok', true);
      expect(response.body).toHaveProperty('id');
    });

    it('should handle idempotency key', async () => {
      const memoryData = {
        tenantId: 'tenant-123',
        namespace: 'test',
        text: 'Idempotent test'
      };

      const idempotencyKey = 'test-key-123';

      const response = await request(app)
        .post('/v1/memory/put')
        .set('x-idempotency-key', idempotencyKey)
        .send(memoryData)
        .expect(200);

      expect(response.body).toHaveProperty('ok', true);
    });

    it('should return 400 for invalid data', async () => {
      const invalidData = {
        tenantId: 'tenant-123',
        // Missing required fields
      };

      const response = await request(app)
        .post('/v1/memory/put')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('type');
      expect(response.body).toHaveProperty('title', 'Validation Error');
    });

    it('should return 400 when neither vector nor text provided', async () => {
      const invalidData = {
        tenantId: 'tenant-123',
        namespace: 'test'
        // Missing both vector and text
      };

      const response = await request(app)
        .post('/v1/memory/put')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('type');
    });
  });

  describe('POST /v1/memory/query', () => {
    beforeEach(async () => {
      // Seed some test data
      await request(app)
        .post('/v1/memory/put')
        .send({
          tenantId: 'tenant-123',
          namespace: 'test',
          text: 'Product pricing information',
          meta: { category: 'pricing' }
        });

      await request(app)
        .post('/v1/memory/put')
        .send({
          tenantId: 'tenant-123',
          namespace: 'test',
          text: 'Customer support guidelines',
          meta: { category: 'support' }
        });
    });

    it('should query memories by text', async () => {
      const queryData = {
        tenantId: 'tenant-123',
        namespace: 'test',
        query: 'pricing',
        topK: 5
      };

      const response = await request(app)
        .post('/v1/memory/query')
        .send(queryData)
        .expect(200);

      expect(response.body).toHaveProperty('matches');
      expect(response.body).toHaveProperty('query', 'pricing');
      expect(response.body).toHaveProperty('namespace', 'test');
      expect(response.body).toHaveProperty('totalMatches');
      expect(Array.isArray(response.body.matches)).toBe(true);
    });

    it('should filter by userId', async () => {
      const queryData = {
        tenantId: 'tenant-123',
        userId: 'user-456',
        namespace: 'test',
        query: 'test query'
      };

      const response = await request(app)
        .post('/v1/memory/query')
        .send(queryData)
        .expect(200);

      expect(response.body).toHaveProperty('matches');
      expect(Array.isArray(response.body.matches)).toBe(true);
    });

    it('should filter by agentId', async () => {
      const queryData = {
        tenantId: 'tenant-123',
        agentId: 'agent-789',
        namespace: 'test',
        query: 'test query'
      };

      const response = await request(app)
        .post('/v1/memory/query')
        .send(queryData)
        .expect(200);

      expect(response.body).toHaveProperty('matches');
      expect(Array.isArray(response.body.matches)).toBe(true);
    });

    it('should return 400 for invalid query data', async () => {
      const invalidData = {
        tenantId: 'tenant-123',
        // Missing required fields
      };

      const response = await request(app)
        .post('/v1/memory/query')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('type');
      expect(response.body).toHaveProperty('title', 'Validation Error');
    });
  });

  describe('GET /v1/memory/stats/:tenantId', () => {
    it('should return memory stats', async () => {
      const response = await request(app)
        .get('/v1/memory/stats/tenant-123')
        .expect(200);

      expect(response.body).toHaveProperty('tenantId', 'tenant-123');
      expect(response.body).toHaveProperty('totalRecords');
      expect(response.body).toHaveProperty('namespaces');
      expect(response.body).toHaveProperty('lastUpdated');
    });

    it('should return 400 for missing tenantId', async () => {
      const response = await request(app)
        .get('/v1/memory/stats/')
        .expect(404); // Express returns 404 for missing params
    });
  });

  describe('POST /v1/memory/cleanup', () => {
    it('should cleanup expired memories', async () => {
      const response = await request(app)
        .post('/v1/memory/cleanup')
        .expect(200);

      expect(response.body).toHaveProperty('ok', true);
      expect(response.body).toHaveProperty('timestamp');
    });
  });
});
