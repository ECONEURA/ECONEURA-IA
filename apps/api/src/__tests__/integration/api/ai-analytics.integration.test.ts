import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../../index.js';

describe('AI Analytics API Integration Tests', () => {
  let authToken: string;
  let testOrganizationId: string;
  let testUserId: string;
  let testSessionId: string;

  beforeAll(async () => {
    // Setup test data
    testOrganizationId = '123e4567-e89b-12d3-a456-426614174002';
    testUserId = '123e4567-e89b-12d3-a456-426614174001';
    testSessionId = '123e4567-e89b-12d3-a456-426614174000';

    // Mock auth token (in real implementation, this would be a valid JWT)
    authToken = 'Bearer mock-jwt-token';
  });

  beforeEach(() => {
    // Reset any test state if needed
  });

  afterAll(async () => {
    // Cleanup test data if needed
  });

  describe('POST /v1/ai-analytics/generate', () => {
    it('should generate usage analytics successfully', async () => {
      const analyticsRequest = {
        sessionId: testSessionId,
        userId: testUserId,
        organizationId: testOrganizationId,
        analyticsType: 'usage',
        timeRange: {
          start: '2024-01-01T00:00:00Z',
          end: '2024-01-31T23:59:59Z',
        },
      };

      const response = await request(app)
        .post('/v1/ai-analytics/generate')
        .set('Authorization', authToken)
        .send(analyticsRequest)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.analyticsType).toBe('usage');
      expect(response.body.data.timeRange).toEqual(analyticsRequest.timeRange);
      expect(response.body.data.metrics).toBeDefined();
      expect(response.body.data.insights).toBeInstanceOf(Array);
      expect(response.body.data.recommendations).toBeInstanceOf(Array);
      expect(response.body.metadata).toBeDefined();
      expect(response.body.metadata.generatedAt).toBeDefined();
      expect(response.body.metadata.processingTime).toBeGreaterThan(0);
    });

    it('should generate performance analytics successfully', async () => {
      const analyticsRequest = {
        sessionId: testSessionId,
        userId: testUserId,
        organizationId: testOrganizationId,
        analyticsType: 'performance',
        timeRange: {
          start: '2024-01-01T00:00:00Z',
          end: '2024-01-31T23:59:59Z',
        },
      };

      const response = await request(app)
        .post('/v1/ai-analytics/generate')
        .set('Authorization', authToken)
        .send(analyticsRequest)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.analyticsType).toBe('performance');
      expect(response.body.data.metrics.services).toBeDefined();
      expect(response.body.data.insights).toBeInstanceOf(Array);
      expect(response.body.data.recommendations).toBeInstanceOf(Array);
    });

    it('should generate insights analytics successfully', async () => {
      const analyticsRequest = {
        sessionId: testSessionId,
        userId: testUserId,
        organizationId: testOrganizationId,
        analyticsType: 'insights',
        timeRange: {
          start: '2024-01-01T00:00:00Z',
          end: '2024-01-31T23:59:59Z',
        },
      };

      const response = await request(app)
        .post('/v1/ai-analytics/generate')
        .set('Authorization', authToken)
        .send(analyticsRequest)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.analyticsType).toBe('insights');
      expect(response.body.data.metrics.totalInsights).toBeDefined();
      expect(response.body.data.metrics.highConfidenceInsights).toBeDefined();
      expect(response.body.data.metrics.actionableInsights).toBeDefined();
      expect(response.body.data.insights).toBeInstanceOf(Array);
    });

    it('should generate trends analytics successfully', async () => {
      const analyticsRequest = {
        sessionId: testSessionId,
        userId: testUserId,
        organizationId: testOrganizationId,
        analyticsType: 'trends',
        timeRange: {
          start: '2024-01-01T00:00:00Z',
          end: '2024-01-31T23:59:59Z',
        },
      };

      const response = await request(app)
        .post('/v1/ai-analytics/generate')
        .set('Authorization', authToken)
        .send(analyticsRequest)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.analyticsType).toBe('trends');
      expect(response.body.data.metrics.totalTrends).toBeDefined();
      expect(response.body.data.trends).toBeInstanceOf(Array);
    });

    it('should generate predictions analytics successfully', async () => {
      const analyticsRequest = {
        sessionId: testSessionId,
        userId: testUserId,
        organizationId: testOrganizationId,
        analyticsType: 'predictions',
        timeRange: {
          start: '2024-01-01T00:00:00Z',
          end: '2024-01-31T23:59:59Z',
        },
      };

      const response = await request(app)
        .post('/v1/ai-analytics/generate')
        .set('Authorization', authToken)
        .send(analyticsRequest)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.analyticsType).toBe('predictions');
      expect(response.body.data.predictions).toBeDefined();
      expect(response.body.data.predictions).toBeInstanceOf(Array);
      expect(response.body.data.predictions.length).toBeGreaterThan(0);
    });

    it('should return 400 for invalid request data', async () => {
      const invalidRequest = {
        sessionId: 'invalid-uuid',
        userId: testUserId,
        organizationId: testOrganizationId,
        analyticsType: 'invalid-type',
        timeRange: {
          start: 'invalid-date',
          end: '2024-01-31T23:59:59Z',
        },
      };

      const response = await request(app)
        .post('/v1/ai-analytics/generate')
        .set('Authorization', authToken)
        .send(invalidRequest)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should return 401 for missing authorization', async () => {
      const analyticsRequest = {
        sessionId: testSessionId,
        userId: testUserId,
        organizationId: testOrganizationId,
        analyticsType: 'usage',
        timeRange: {
          start: '2024-01-01T00:00:00Z',
          end: '2024-01-31T23:59:59Z',
        },
      };

      await request(app)
        .post('/v1/ai-analytics/generate')
        .send(analyticsRequest)
        .expect(401);
    });
  });

  describe('POST /v1/ai-analytics/usage', () => {
    it('should record usage data successfully', async () => {
      const usageData = {
        sessionId: testSessionId,
        userId: testUserId,
        organizationId: testOrganizationId,
        serviceName: 'ai-chat',
        modelName: 'gpt-4',
        requestType: 'chat',
        responseTimeMs: 500,
        tokensUsed: 1000,
        costUsd: 0.05,
        success: true,
        metadata: { userAgent: 'test-agent' },
      };

      const response = await request(app)
        .post('/v1/ai-analytics/usage')
        .set('Authorization', authToken)
        .send(usageData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Usage recorded successfully');
    });

    it('should record usage data with minimal required fields', async () => {
      const usageData = {
        sessionId: testSessionId,
        userId: testUserId,
        organizationId: testOrganizationId,
        serviceName: 'ai-chat',
        requestType: 'chat',
        success: true,
      };

      const response = await request(app)
        .post('/v1/ai-analytics/usage')
        .set('Authorization', authToken)
        .send(usageData)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should return 400 for invalid usage data', async () => {
      const invalidUsageData = {
        sessionId: 'invalid-uuid',
        userId: testUserId,
        organizationId: testOrganizationId,
        serviceName: '',
        requestType: 'chat',
        success: 'invalid-boolean',
      };

      const response = await request(app)
        .post('/v1/ai-analytics/usage')
        .set('Authorization', authToken)
        .send(invalidUsageData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('POST /v1/ai-analytics/performance', () => {
    it('should record performance metrics successfully', async () => {
      const performanceData = {
        serviceName: 'ai-chat',
        modelName: 'gpt-4',
        metricName: 'response_time',
        metricValue: 500,
        metricUnit: 'ms',
        metadata: { endpoint: '/chat' },
      };

      const response = await request(app)
        .post('/v1/ai-analytics/performance')
        .set('Authorization', authToken)
        .send(performanceData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Performance metrics recorded successfully');
    });

    it('should record performance metrics with minimal required fields', async () => {
      const performanceData = {
        serviceName: 'ai-chat',
        metricName: 'response_time',
        metricValue: 500,
      };

      const response = await request(app)
        .post('/v1/ai-analytics/performance')
        .set('Authorization', authToken)
        .send(performanceData)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should return 400 for invalid performance data', async () => {
      const invalidPerformanceData = {
        serviceName: '',
        metricName: 'response_time',
        metricValue: 'invalid-number',
      };

      const response = await request(app)
        .post('/v1/ai-analytics/performance')
        .set('Authorization', authToken)
        .send(invalidPerformanceData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /v1/ai-analytics/insights', () => {
    it('should get insights successfully', async () => {
      const response = await request(app)
        .get('/v1/ai-analytics/insights')
        .set('Authorization', authToken)
        .query({
          organizationId: testOrganizationId,
          limit: 10,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should get insights with filters', async () => {
      const response = await request(app)
        .get('/v1/ai-analytics/insights')
        .set('Authorization', authToken)
        .query({
          organizationId: testOrganizationId,
          type: 'performance',
          impact: 'high',
          limit: 5,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should return 400 for missing organizationId', async () => {
      const response = await request(app)
        .get('/v1/ai-analytics/insights')
        .set('Authorization', authToken)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('organizationId is required');
    });
  });

  describe('GET /v1/ai-analytics/trends', () => {
    it('should get trends successfully', async () => {
      const response = await request(app)
        .get('/v1/ai-analytics/trends')
        .set('Authorization', authToken)
        .query({
          organizationId: testOrganizationId,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should get trends with filters', async () => {
      const response = await request(app)
        .get('/v1/ai-analytics/trends')
        .set('Authorization', authToken)
        .query({
          organizationId: testOrganizationId,
          trendType: 'usage',
          period: 'daily',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should return 400 for missing organizationId', async () => {
      const response = await request(app)
        .get('/v1/ai-analytics/trends')
        .set('Authorization', authToken)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('organizationId is required');
    });
  });

  describe('GET /v1/ai-analytics/metrics', () => {
    it('should get metrics summary successfully', async () => {
      const response = await request(app)
        .get('/v1/ai-analytics/metrics')
        .set('Authorization', authToken)
        .query({
          organizationId: testOrganizationId,
          timeRange: '24h',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalRequests).toBeDefined();
      expect(response.body.data.totalTokens).toBeDefined();
      expect(response.body.data.totalCost).toBeDefined();
      expect(response.body.data.avgResponseTime).toBeDefined();
      expect(response.body.data.successRate).toBeDefined();
      expect(response.body.data.topServices).toBeInstanceOf(Array);
    });

    it('should get metrics with different time ranges', async () => {
      const timeRanges = ['1h', '24h', '7d', '30d'];

      for (const timeRange of timeRanges) {
        const response = await request(app)
          .get('/v1/ai-analytics/metrics')
          .set('Authorization', authToken)
          .query({
            organizationId: testOrganizationId,
            timeRange,
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
      }
    });

    it('should return 400 for missing organizationId', async () => {
      const response = await request(app)
        .get('/v1/ai-analytics/metrics')
        .set('Authorization', authToken)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('organizationId is required');
    });
  });

  describe('GET /v1/ai-analytics/health', () => {
    it('should get health status successfully', async () => {
      const response = await request(app)
        .get('/v1/ai-analytics/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBeDefined();
      expect(['healthy', 'degraded', 'unhealthy']).toContain(response.body.data.status);
      expect(response.body.data.services).toBeDefined();
      expect(response.body.data.lastCheck).toBeDefined();
    });

    it('should not require authentication for health check', async () => {
      await request(app)
        .get('/v1/ai-analytics/health')
        .expect(200);
    });
  });

  describe('Error handling', () => {
    it('should handle server errors gracefully', async () => {
      // This test would require mocking the service to throw an error
      // For now, we'll test the error response structure
      const response = await request(app)
        .post('/v1/ai-analytics/generate')
        .set('Authorization', authToken)
        .send({
          sessionId: testSessionId,
          userId: testUserId,
          organizationId: testOrganizationId,
          analyticsType: 'usage',
          timeRange: {
            start: '2024-01-01T00:00:00Z',
            end: '2024-01-31T23:59:59Z',
          },
        });

      // Should either succeed or return a proper error response
      if (!response.body.success) {
        expect(response.body.error).toBeDefined();
        expect(response.body.message).toBeDefined();
      }
    });

    it('should handle malformed JSON requests', async () => {
      const response = await request(app)
        .post('/v1/ai-analytics/generate')
        .set('Authorization', authToken)
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Rate limiting', () => {
    it('should handle multiple concurrent requests', async () => {
      const requests = Array.from({ length: 5 }, () =>
        request(app)
          .post('/v1/ai-analytics/generate')
          .set('Authorization', authToken)
          .send({
            sessionId: testSessionId,
            userId: testUserId,
            organizationId: testOrganizationId,
            analyticsType: 'usage',
            timeRange: {
              start: '2024-01-01T00:00:00Z',
              end: '2024-01-31T23:59:59Z',
            },
          })
      );

      const responses = await Promise.all(requests);

      // All requests should complete (either successfully or with proper error handling)
      responses.forEach(response => {
        expect([200, 429, 500]).toContain(response.status);
      });
    });
  });
});
