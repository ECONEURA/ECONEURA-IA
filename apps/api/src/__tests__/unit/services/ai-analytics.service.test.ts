import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { aiAnalyticsService, AIAnalyticsRequestSchema } from '../../../services/ai-analytics.service.js';

// Mock the database service
vi.mock('../../../lib/database.service.js', () => ({
  getDatabaseService: () => ({
    query: vi.fn(),
  }),
}));

// Mock the structured logger
vi.mock('../../../lib/structured-logger.js', () => ({
  structuredLogger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('AIAnalyticsService', () => {
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      query: vi.fn(),
    };
    
    // Reset all mocks
    vi.clearAllMocks();
    
    // Mock the database service
    vi.mocked(aiAnalyticsService['db']).query = mockDb.query;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('generateAnalytics', () => {
    it('should generate usage analytics successfully', async () => {
      const request = {
        sessionId: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        organizationId: '123e4567-e89b-12d3-a456-426614174002',
        analyticsType: 'usage' as const,
        timeRange: {
          start: '2024-01-01T00:00:00Z',
          end: '2024-01-31T23:59:59Z',
        },
      };

      const mockUsageData = [
        {
          service_name: 'ai-chat',
          model_name: 'gpt-4',
          request_type: 'chat',
          request_count: '100',
          avg_response_time: '500',
          total_tokens: '50000',
          total_cost: '25.00',
          success_count: '95',
          error_count: '5',
        },
      ];

      mockDb.query.mockResolvedValueOnce({ rows: mockUsageData });

      const result = await aiAnalyticsService.generateAnalytics(request);

      expect(result.success).toBe(true);
      expect(result.data.analyticsType).toBe('usage');
      expect(result.data.metrics.totalRequests).toBe(100);
      expect(result.data.metrics.totalTokens).toBe(50000);
      expect(result.data.metrics.totalCost).toBe(25.00);
      expect(result.data.insights).toBeInstanceOf(Array);
      expect(result.data.recommendations).toBeInstanceOf(Array);
    });

    it('should generate performance analytics successfully', async () => {
      const request = {
        sessionId: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        organizationId: '123e4567-e89b-12d3-a456-426614174002',
        analyticsType: 'performance' as const,
        timeRange: {
          start: '2024-01-01T00:00:00Z',
          end: '2024-01-31T23:59:59Z',
        },
      };

      const mockPerformanceData = [
        {
          service_name: 'ai-chat',
          model_name: 'gpt-4',
          metric_name: 'response_time',
          avg_value: '500',
          min_value: '100',
          max_value: '2000',
          p95_value: '800',
          p99_value: '1200',
          data_points: '100',
        },
      ];

      mockDb.query.mockResolvedValueOnce({ rows: mockPerformanceData });

      const result = await aiAnalyticsService.generateAnalytics(request);

      expect(result.success).toBe(true);
      expect(result.data.analyticsType).toBe('performance');
      expect(result.data.metrics.services).toBeDefined();
      expect(result.data.insights).toBeInstanceOf(Array);
      expect(result.data.recommendations).toBeInstanceOf(Array);
    });

    it('should generate insights analytics successfully', async () => {
      const request = {
        sessionId: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        organizationId: '123e4567-e89b-12d3-a456-426614174002',
        analyticsType: 'insights' as const,
        timeRange: {
          start: '2024-01-01T00:00:00Z',
          end: '2024-01-31T23:59:59Z',
        },
      };

      const mockInsightsData = [
        {
          insight_type: 'performance',
          insight_title: 'High response time detected',
          insight_description: 'Response time is above threshold',
          insight_data: { service: 'ai-chat', response_time: 2000 },
          confidence_score: '0.85',
          impact_level: 'high',
          actionable: true,
          created_at: '2024-01-15T10:00:00Z',
        },
      ];

      mockDb.query.mockResolvedValueOnce({ rows: mockInsightsData });

      const result = await aiAnalyticsService.generateAnalytics(request);

      expect(result.success).toBe(true);
      expect(result.data.analyticsType).toBe('insights');
      expect(result.data.metrics.totalInsights).toBe(1);
      expect(result.data.metrics.highConfidenceInsights).toBe(1);
      expect(result.data.metrics.actionableInsights).toBe(1);
      expect(result.data.insights).toContain('High response time detected');
    });

    it('should generate trends analytics successfully', async () => {
      const request = {
        sessionId: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        organizationId: '123e4567-e89b-12d3-a456-426614174002',
        analyticsType: 'trends' as const,
        timeRange: {
          start: '2024-01-01T00:00:00Z',
          end: '2024-01-31T23:59:59Z',
        },
      };

      const mockTrendsData = [
        {
          trend_name: 'daily_usage',
          trend_type: 'usage',
          trend_data: {
            values: [100, 120, 110, 130],
            timestamps: ['2024-01-01', '2024-01-02', '2024-01-03', '2024-01-04'],
          },
          trend_period: 'daily',
          created_at: '2024-01-15T10:00:00Z',
        },
      ];

      mockDb.query.mockResolvedValueOnce({ rows: mockTrendsData });

      const result = await aiAnalyticsService.generateAnalytics(request);

      expect(result.success).toBe(true);
      expect(result.data.analyticsType).toBe('trends');
      expect(result.data.metrics.totalTrends).toBe(1);
      expect(result.data.trends).toHaveLength(1);
      expect(result.data.trends[0].metric).toBe('daily_usage');
      expect(result.data.trends[0].values).toEqual([100, 120, 110, 130]);
    });

    it('should generate predictions analytics successfully', async () => {
      const request = {
        sessionId: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        organizationId: '123e4567-e89b-12d3-a456-426614174002',
        analyticsType: 'predictions' as const,
        timeRange: {
          start: '2024-01-01T00:00:00Z',
          end: '2024-01-31T23:59:59Z',
        },
      };

      const result = await aiAnalyticsService.generateAnalytics(request);

      expect(result.success).toBe(true);
      expect(result.data.analyticsType).toBe('predictions');
      expect(result.data.predictions).toBeDefined();
      expect(result.data.predictions).toHaveLength(3);
      expect(result.data.predictions[0].metric).toBe('request_volume');
      expect(result.data.predictions[0].confidence).toBeGreaterThan(0.7);
    });

    it('should handle database errors gracefully', async () => {
      const request = {
        sessionId: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        organizationId: '123e4567-e89b-12d3-a456-426614174002',
        analyticsType: 'usage' as const,
        timeRange: {
          start: '2024-01-01T00:00:00Z',
          end: '2024-01-31T23:59:59Z',
        },
      };

      mockDb.query.mockRejectedValueOnce(new Error('Database connection failed'));

      const result = await aiAnalyticsService.generateAnalytics(request);

      expect(result.success).toBe(false);
      expect(result.data.metrics).toEqual({});
      expect(result.data.insights).toEqual([]);
      expect(result.data.recommendations).toEqual([]);
    });

    it('should validate request schema', () => {
      const validRequest = {
        sessionId: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        organizationId: '123e4567-e89b-12d3-a456-426614174002',
        analyticsType: 'usage',
        timeRange: {
          start: '2024-01-01T00:00:00Z',
          end: '2024-01-31T23:59:59Z',
        },
      };

      expect(() => AIAnalyticsRequestSchema.parse(validRequest)).not.toThrow();

      const invalidRequest = {
        sessionId: 'invalid-uuid',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        organizationId: '123e4567-e89b-12d3-a456-426614174002',
        analyticsType: 'invalid-type',
        timeRange: {
          start: 'invalid-date',
          end: '2024-01-31T23:59:59Z',
        },
      };

      expect(() => AIAnalyticsRequestSchema.parse(invalidRequest)).toThrow();
    });
  });

  describe('recordUsage', () => {
    it('should record usage data successfully', async () => {
      const usageData = {
        sessionId: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        organizationId: '123e4567-e89b-12d3-a456-426614174002',
        serviceName: 'ai-chat',
        modelName: 'gpt-4',
        requestType: 'chat',
        responseTimeMs: 500,
        tokensUsed: 1000,
        costUsd: 0.05,
        success: true,
        metadata: { userAgent: 'test' },
      };

      mockDb.query.mockResolvedValueOnce({ rows: [] });

      await aiAnalyticsService.recordUsage(usageData);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO ai_analytics_usage'),
        expect.arrayContaining([
          usageData.sessionId,
          usageData.userId,
          usageData.organizationId,
          usageData.serviceName,
          usageData.modelName,
          usageData.requestType,
          usageData.responseTimeMs,
          usageData.tokensUsed,
          usageData.costUsd,
          usageData.success,
          undefined, // errorMessage
          JSON.stringify(usageData.metadata),
        ])
      );
    });

    it('should handle database errors when recording usage', async () => {
      const usageData = {
        sessionId: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        organizationId: '123e4567-e89b-12d3-a456-426614174002',
        serviceName: 'ai-chat',
        requestType: 'chat',
        success: true,
      };

      mockDb.query.mockRejectedValueOnce(new Error('Database error'));

      // Should not throw
      await expect(aiAnalyticsService.recordUsage(usageData)).resolves.not.toThrow();
    });
  });

  describe('recordPerformance', () => {
    it('should record performance metrics successfully', async () => {
      const performanceData = {
        serviceName: 'ai-chat',
        modelName: 'gpt-4',
        metricName: 'response_time',
        metricValue: 500,
        metricUnit: 'ms',
        metadata: { endpoint: '/chat' },
      };

      mockDb.query.mockResolvedValueOnce({ rows: [] });

      await aiAnalyticsService.recordPerformance(performanceData);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO ai_analytics_performance'),
        expect.arrayContaining([
          performanceData.serviceName,
          performanceData.modelName,
          performanceData.metricName,
          performanceData.metricValue,
          performanceData.metricUnit,
          JSON.stringify(performanceData.metadata),
        ])
      );
    });

    it('should handle database errors when recording performance', async () => {
      const performanceData = {
        serviceName: 'ai-chat',
        metricName: 'response_time',
        metricValue: 500,
      };

      mockDb.query.mockRejectedValueOnce(new Error('Database error'));

      // Should not throw
      await expect(aiAnalyticsService.recordPerformance(performanceData)).resolves.not.toThrow();
    });
  });

  describe('getHealthStatus', () => {
    it('should return healthy status when all services are working', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [{ '?column?': 1 }] });

      const healthStatus = await aiAnalyticsService.getHealthStatus();

      expect(healthStatus.status).toBe('healthy');
      expect(healthStatus.services.database).toBe(true);
      expect(healthStatus.services.cache).toBe(true);
      expect(healthStatus.services.backgroundProcessing).toBe(true);
    });

    it('should return degraded status when some services are failing', async () => {
      mockDb.query.mockRejectedValueOnce(new Error('Database connection failed'));

      const healthStatus = await aiAnalyticsService.getHealthStatus();

      expect(healthStatus.status).toBe('degraded');
      expect(healthStatus.services.database).toBe(false);
      expect(healthStatus.services.cache).toBe(true);
      expect(healthStatus.services.backgroundProcessing).toBe(true);
    });

    it('should return unhealthy status when most services are failing', async () => {
      mockDb.query.mockRejectedValueOnce(new Error('Database connection failed'));
      
      // Mock cache to be empty (simulating failure)
      aiAnalyticsService['analyticsCache'].clear();

      const healthStatus = await aiAnalyticsService.getHealthStatus();

      expect(healthStatus.status).toBe('unhealthy');
      expect(healthStatus.services.database).toBe(false);
      expect(healthStatus.services.cache).toBe(false);
      expect(healthStatus.services.backgroundProcessing).toBe(false);
    });
  });

  describe('insight generation', () => {
    it('should generate usage insights correctly', () => {
      const metrics = {
        successRate: 92,
        avgResponseTime: 1500,
        totalCost: 150,
        services: [
          { service_name: 'ai-chat', request_count: '100' },
        ],
      };

      const insights = aiAnalyticsService['generateUsageInsights'](metrics);

      expect(insights).toContain('Success rate is below 95% (92.0%), indicating potential service issues');
      expect(insights).toContain('Average response time is high (1500ms), consider optimization');
      expect(insights).toContain('High usage costs detected ($150.00), review usage patterns');
      expect(insights).toContain('ai-chat is the most used service with 100 requests');
    });

    it('should generate usage recommendations correctly', () => {
      const metrics = {
        successRate: 92,
        avgResponseTime: 1500,
        totalCost: 150,
        services: [],
      };

      const recommendations = aiAnalyticsService['generateUsageRecommendations'](metrics);

      expect(recommendations).toContain('Investigate and fix service reliability issues');
      expect(recommendations).toContain('Optimize service performance and consider caching');
      expect(recommendations).toContain('Implement usage monitoring and cost optimization strategies');
      expect(recommendations).toContain('Set up automated alerts for service health monitoring');
    });

    it('should generate performance insights correctly', () => {
      const metrics = {
        services: {
          'ai-chat': {
            'response_time': {
              p95: 2500,
            },
            'error_rate': {
              avg: 0.08,
            },
          },
        },
      };

      const insights = aiAnalyticsService['generatePerformanceInsights'](metrics);

      expect(insights).toContain('ai-chat has high P95 response time (2500ms)');
      expect(insights).toContain('ai-chat has elevated error rate (8.0%)');
    });
  });

  describe('cache functionality', () => {
    it('should cache and retrieve results correctly', () => {
      const request = {
        sessionId: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        organizationId: '123e4567-e89b-12d3-a456-426614174002',
        analyticsType: 'usage' as const,
        timeRange: {
          start: '2024-01-01T00:00:00Z',
          end: '2024-01-31T23:59:59Z',
        },
      };

      const cacheKey = aiAnalyticsService['generateCacheKey'](request);
      const mockResponse = {
        success: true,
        data: { test: 'data' },
        metadata: { generatedAt: new Date().toISOString() },
      };

      // Set cache
      aiAnalyticsService['setCachedResult'](cacheKey, mockResponse);

      // Get from cache
      const cachedResult = aiAnalyticsService['getCachedResult'](cacheKey);

      expect(cachedResult).toEqual(mockResponse);
    });

    it('should return null for expired cache entries', () => {
      const request = {
        sessionId: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        organizationId: '123e4567-e89b-12d3-a456-426614174002',
        analyticsType: 'usage' as const,
        timeRange: {
          start: '2024-01-01T00:00:00Z',
          end: '2024-01-31T23:59:59Z',
        },
      };

      const cacheKey = aiAnalyticsService['generateCacheKey'](request);
      const mockResponse = {
        success: true,
        data: { test: 'data' },
        metadata: { generatedAt: new Date().toISOString() },
      };

      // Set cache with old timestamp
      aiAnalyticsService['analyticsCache'].set(cacheKey, {
        data: mockResponse,
        timestamp: Date.now() - 10 * 60 * 1000, // 10 minutes ago
      });

      // Get from cache (should be expired)
      const cachedResult = aiAnalyticsService['getCachedResult'](cacheKey);

      expect(cachedResult).toBeNull();
    });
  });
});
