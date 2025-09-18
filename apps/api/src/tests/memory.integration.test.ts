import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '../app';
import { MemoryRepository } from '../db/memory.repo';

describe('Memory API Integration Tests', () => {
  let memoryRepo: MemoryRepository;

  beforeEach(async () => {
    memoryRepo = new MemoryRepository();
    await memoryRepo.createTable();
  });

  afterEach(async () => {
    // Clean up test data
    await memoryRepo.deleteMemory('test-memory-1');
    await memoryRepo.deleteMemory('test-memory-2');
  });

  describe('POST /v1/memory/put', () => {
    it('should store memory entry successfully', async () => {
      const memoryData = {
        tenantId: 'tenant-123',
        userId: 'user-456',
        agentId: 'agent-789',
        namespace: 'conversations',
        text: 'User asked about pricing',
        vector: [0.1, 0.2, 0.3, 0.4, 0.5],
        meta: { source: 'chat', timestamp: '2024-01-10T10:00:00Z' }
      };

      const response = await request(app)
        .post('/v1/memory/put')
        .set('Authorization', 'Bearer test-token')
        .set('x-idempotency-key', 'test-key-1')
        .send(memoryData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('ok', true);
      expect(response.body).toHaveProperty('id');
      expect(response.body.id).toMatch(/^mem-/);
    });

    it('should handle idempotency correctly', async () => {
      const memoryData = {
        tenantId: 'tenant-123',
        userId: 'user-456',
        agentId: 'agent-789',
        namespace: 'conversations',
        text: 'User asked about pricing'
      };

      const idempotencyKey = 'test-idempotency-key';

      // First request
      const response1 = await request(app)
        .post('/v1/memory/put')
        .set('Authorization', 'Bearer test-token')
        .set('x-idempotency-key', idempotencyKey)
        .send(memoryData);

      // Second request with same idempotency key
      const response2 = await request(app)
        .post('/v1/memory/put')
        .set('Authorization', 'Bearer test-token')
        .set('x-idempotency-key', idempotencyKey)
        .send(memoryData);

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      expect(response1.body.id).toBe(response2.body.id);
    });

    it('should validate required fields', async () => {
      const invalidData = {
        tenantId: 'tenant-123',
        // Missing userId, agentId, namespace
        text: 'Some text'
      };

      const response = await request(app)
        .post('/v1/memory/put')
        .set('Authorization', 'Bearer test-token')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('type');
      expect(response.body).toHaveProperty('title', 'Validation Failed');
      expect(response.body).toHaveProperty('errors');
    });

    it('should validate vector format', async () => {
      const invalidData = {
        tenantId: 'tenant-123',
        userId: 'user-456',
        agentId: 'agent-789',
        namespace: 'conversations',
        vector: ['invalid', 'not', 'numbers']
      };

      const response = await request(app)
        .post('/v1/memory/put')
        .set('Authorization', 'Bearer test-token')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors).toContain('vector must contain only valid numbers');
    });

    it('should handle TTL correctly', async () => {
      const memoryData = {
        tenantId: 'tenant-123',
        userId: 'user-456',
        agentId: 'agent-789',
        namespace: 'conversations',
        text: 'Temporary memory',
        ttlSec: 1 // 1 second TTL
      };

      const response = await request(app)
        .post('/v1/memory/put')
        .set('Authorization', 'Bearer test-token')
        .send(memoryData);

      expect(response.status).toBe(200);

      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Try to query the memory - should not find it
      const queryResponse = await request(app)
        .post('/v1/memory/query')
        .set('Authorization', 'Bearer test-token')
        .send({
          tenantId: 'tenant-123',
          namespace: 'conversations',
          query: 'temporary'
        });

      expect(queryResponse.status).toBe(200);
      expect(queryResponse.body.matches).toHaveLength(0);
    });
  });

  describe('POST /v1/memory/query', () => {
    beforeEach(async () => {
      // Setup test data
      const testMemories = [
        {
          tenantId: 'tenant-123',
          userId: 'user-456',
          agentId: 'agent-789',
          namespace: 'conversations',
          text: 'User asked about pricing for premium plan',
          vector: [0.1, 0.2, 0.3, 0.4, 0.5],
          meta: { source: 'chat', plan: 'premium' }
        },
        {
          tenantId: 'tenant-123',
          userId: 'user-456',
          agentId: 'agent-789',
          namespace: 'conversations',
          text: 'User requested demo of basic features',
          vector: [0.2, 0.3, 0.4, 0.5, 0.6],
          meta: { source: 'chat', plan: 'basic' }
        }
      ];

      for (const memory of testMemories) {
        await request(app)
          .post('/v1/memory/put')
          .set('Authorization', 'Bearer test-token')
          .send(memory);
      }
    });

    it('should query memory entries successfully', async () => {
      const queryData = {
        tenantId: 'tenant-123',
        namespace: 'conversations',
        query: 'pricing'
      };

      const response = await request(app)
        .post('/v1/memory/query')
        .set('Authorization', 'Bearer test-token')
        .send(queryData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('matches');
      expect(Array.isArray(response.body.matches)).toBe(true);
      expect(response.body.matches.length).toBeGreaterThan(0);
      
      const match = response.body.matches[0];
      expect(match).toHaveProperty('id');
      expect(match).toHaveProperty('score');
      expect(match).toHaveProperty('text');
    });

    it('should filter by userId and agentId', async () => {
      const queryData = {
        tenantId: 'tenant-123',
        userId: 'user-456',
        agentId: 'agent-789',
        namespace: 'conversations',
        query: 'demo'
      };

      const response = await request(app)
        .post('/v1/memory/query')
        .set('Authorization', 'Bearer test-token')
        .send(queryData);

      expect(response.status).toBe(200);
      expect(response.body.matches).toHaveLength(1);
      expect(response.body.matches[0].text).toContain('demo');
    });

    it('should respect topK parameter', async () => {
      const queryData = {
        tenantId: 'tenant-123',
        namespace: 'conversations',
        query: 'user',
        topK: 1
      };

      const response = await request(app)
        .post('/v1/memory/query')
        .set('Authorization', 'Bearer test-token')
        .send(queryData);

      expect(response.status).toBe(200);
      expect(response.body.matches.length).toBeLessThanOrEqual(1);
    });

    it('should validate required fields', async () => {
      const invalidData = {
        tenantId: 'tenant-123',
        // Missing namespace and query
      };

      const response = await request(app)
        .post('/v1/memory/query')
        .set('Authorization', 'Bearer test-token')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('title', 'Validation Failed');
      expect(response.body).toHaveProperty('errors');
    });

    it('should handle empty results gracefully', async () => {
      const queryData = {
        tenantId: 'tenant-123',
        namespace: 'nonexistent',
        query: 'some query'
      };

      const response = await request(app)
        .post('/v1/memory/query')
        .set('Authorization', 'Bearer test-token')
        .send(queryData);

      expect(response.status).toBe(200);
      expect(response.body.matches).toHaveLength(0);
    });
  });

  describe('Authentication and Authorization', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .post('/v1/memory/put')
        .send({
          tenantId: 'tenant-123',
          userId: 'user-456',
          agentId: 'agent-789',
          namespace: 'conversations',
          text: 'test'
        });

      expect(response.status).toBe(401);
    });

    it('should require valid token', async () => {
      const response = await request(app)
        .post('/v1/memory/put')
        .set('Authorization', 'Bearer invalid-token')
        .send({
          tenantId: 'tenant-123',
          userId: 'user-456',
          agentId: 'agent-789',
          namespace: 'conversations',
          text: 'test'
        });

      expect(response.status).toBe(401);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      const memoryData = {
        tenantId: 'tenant-123',
        userId: 'user-456',
        agentId: 'agent-789',
        namespace: 'conversations',
        text: 'test'
      };

      // Make multiple requests quickly
      const promises = Array.from({ length: 150 }, () =>
        request(app)
          .post('/v1/memory/put')
          .set('Authorization', 'Bearer test-token')
          .send(memoryData)
      );

      const responses = await Promise.all(promises);
      
      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });
});
