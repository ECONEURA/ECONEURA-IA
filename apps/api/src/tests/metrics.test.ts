// ============================================================================
// METRICS TESTS - UNIT AND INTEGRATION TESTS
// ============================================================================

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import {
  metricsMiddleware,
  trackAuthMetrics,
  trackDatabaseMetrics,
  trackUserMetrics,
  trackContactMetrics,
  trackDealMetrics,
  trackOrderMetrics,
  trackAIMetrics,
  trackSystemMetrics,
  getMetricsData,
  clearMetrics,
  startSystemMetricsCollection,
  stopSystemMetricsCollection
} from '../middleware/metrics.js';

// ============================================================================
// MOCK SETUP
// ============================================================================

// Mock the shared metrics module
vi.mock('@econeura/shared/metrics', () => ({
  initializeMetrics: vi.fn(() => ({
    getMetrics: vi.fn().mockResolvedValue([]),
    getStats: vi.fn().mockReturnValue({ totalMetrics: 0, lastUpdated: new Date().toISOString() }),
    clearMetrics: vi.fn().mockResolvedValue(undefined)
  })),
  getMetrics: vi.fn().mockResolvedValue([]),
  PredefinedMetrics: {
    API_REQUESTS_TOTAL: 'api_requests_total',
    API_REQUEST_DURATION: 'api_request_duration',
    API_ERRORS_TOTAL: 'api_errors_total',
    AUTH_LOGINS_TOTAL: 'auth_logins_total',
    DB_QUERIES_TOTAL: 'db_queries_total',
    DB_ERRORS_TOTAL: 'db_errors_total',
    USERS_TOTAL: 'users_total',
    CONTACTS_TOTAL: 'contacts_total',
    DEALS_TOTAL: 'deals_total',
    ORDERS_TOTAL: 'orders_total',
    AI_REQUESTS_TOTAL: 'ai_requests_total',
    AI_TOKENS_USED: 'ai_tokens_used'
  },
  counter: vi.fn(),
  gauge: vi.fn(),
  histogram: vi.fn()
}));

// Mock structured logger
vi.mock('../lib/structured-logger.js', () => ({
  structuredLogger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  }
}));

// ============================================================================
// TEST HELPERS
// ============================================================================

const createMockRequest = (overrides: Partial<Request> = {}): Partial<Request> => ({
  method: 'GET',
  path: '/test',
  headers: {
    'x-request-id': 'test-request-id',
    'user-agent': 'test-user-agent'
  },
  ip: '127.0.0.1',
  user: { id: 'test-user' },
  body: {},
  ...overrides
});

const createMockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {
    statusCode: 200,
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    end: vi.fn()
  };
  return res;
};

const createMockNext = (): NextFunction => vi.fn();

// ============================================================================
// TESTS
// ============================================================================

describe('Metrics Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = createMockRequest();
    mockRes = createMockResponse();
    mockNext = createMockNext();
    vi.clearAllMocks();
  });

  afterEach(() => {
    stopSystemMetricsCollection();
  });

  // ============================================================================
  // METRICS MIDDLEWARE TESTS
  // ============================================================================

  describe('metricsMiddleware', () => {
    it('should track request metrics', () => {
      metricsMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should track request duration on response end', () => {
      const { counter, histogram } = require('@econeura/shared/metrics');

      metricsMiddleware(mockReq as Request, mockRes as Response, mockNext);

      // Simulate response end
      (mockRes.end as any)();

      expect(counter).toHaveBeenCalledWith('api_requests_total', 1, {
        method: 'GET',
        path: '/test',
        status: '200'
      });

      expect(histogram).toHaveBeenCalledWith('api_request_duration', expect.any(Number), {
        method: 'GET',
        path: '/test',
        status: '200'
      });
    });

    it('should track errors for 4xx and 5xx responses', () => {
      const { counter } = require('@econeura/shared/metrics');

      mockRes.statusCode = 404;
      metricsMiddleware(mockReq as Request, mockRes as Response, mockNext);

      // Simulate response end
      (mockRes.end as any)();

      expect(counter).toHaveBeenCalledWith('api_errors_total', 1, {
        method: 'GET',
        path: '/test',
        status: '404',
        error_type: 'client_error'
      });
    });

    it('should track server errors for 5xx responses', () => {
      const { counter } = require('@econeura/shared/metrics');

      mockRes.statusCode = 500;
      metricsMiddleware(mockReq as Request, mockRes as Response, mockNext);

      // Simulate response end
      (mockRes.end as any)();

      expect(counter).toHaveBeenCalledWith('api_errors_total', 1, {
        method: 'GET',
        path: '/test',
        status: '500',
        error_type: 'server_error'
      });
    });
  });

  // ============================================================================
  // AUTH METRICS TESTS
  // ============================================================================

  describe('trackAuthMetrics', () => {
    it('should track successful login', () => {
      const { counter } = require('@econeura/shared/metrics');

      mockReq.path = '/auth/login';
      mockRes.statusCode = 200;

      trackAuthMetrics(mockReq as Request, mockRes as Response, mockNext);
      (mockRes.end as any)();

      expect(counter).toHaveBeenCalledWith('auth_logins_total', 1, {
        status: 'success',
        method: 'password'
      });
    });

    it('should track failed login', () => {
      const { counter } = require('@econeura/shared/metrics');

      mockReq.path = '/auth/login';
      mockRes.statusCode = 401;

      trackAuthMetrics(mockReq as Request, mockRes as Response, mockNext);
      (mockRes.end as any)();

      expect(counter).toHaveBeenCalledWith('auth_logins_total', 1, {
        status: 'failure',
        method: 'password',
        reason: 'invalid_credentials'
      });
    });
  });

  // ============================================================================
  // DATABASE METRICS TESTS
  // ============================================================================

  describe('trackDatabaseMetrics', () => {
    it('should track successful database query', () => {
      const { counter } = require('@econeura/shared/metrics');

      trackDatabaseMetrics('SELECT * FROM users', 100, true);

      expect(counter).toHaveBeenCalledWith('db_queries_total', 1, {
        success: 'true',
        query_type: 'select'
      });
    });

    it('should track failed database query', () => {
      const { counter } = require('@econeura/shared/metrics');

      trackDatabaseMetrics('INSERT INTO users', 50, false);

      expect(counter).toHaveBeenCalledWith('db_queries_total', 1, {
        success: 'false',
        query_type: 'insert'
      });

      expect(counter).toHaveBeenCalledWith('db_errors_total', 1, {
        query_type: 'insert'
      });
    });

    it('should identify query types correctly', () => {
      const { counter } = require('@econeura/shared/metrics');

      trackDatabaseMetrics('UPDATE users SET name = ?', 75, true);
      expect(counter).toHaveBeenCalledWith('db_queries_total', 1, {
        success: 'true',
        query_type: 'update'
      });

      trackDatabaseMetrics('DELETE FROM users WHERE id = ?', 25, true);
      expect(counter).toHaveBeenCalledWith('db_queries_total', 1, {
        success: 'true',
        query_type: 'delete'
      });
    });
  });

  // ============================================================================
  // BUSINESS METRICS TESTS
  // ============================================================================

  describe('Business Metrics', () => {
    it('should track user metrics', () => {
      const { counter } = require('@econeura/shared/metrics');

      trackUserMetrics('created', 'org-123');

      expect(counter).toHaveBeenCalledWith('users_total', 1, {
        action: 'created',
        organization_id: 'org-123'
      });
    });

    it('should track contact metrics', () => {
      const { counter } = require('@econeura/shared/metrics');

      trackContactMetrics('updated', 'org-456');

      expect(counter).toHaveBeenCalledWith('contacts_total', 1, {
        action: 'updated',
        organization_id: 'org-456'
      });
    });

    it('should track deal metrics', () => {
      const { counter } = require('@econeura/shared/metrics');

      trackDealMetrics('closed', 'org-789');

      expect(counter).toHaveBeenCalledWith('deals_total', 1, {
        action: 'closed',
        organization_id: 'org-789'
      });
    });

    it('should track order metrics', () => {
      const { counter } = require('@econeura/shared/metrics');

      trackOrderMetrics('completed', 'org-101');

      expect(counter).toHaveBeenCalledWith('orders_total', 1, {
        action: 'completed',
        organization_id: 'org-101'
      });
    });

    it('should track AI metrics', () => {
      const { counter } = require('@econeura/shared/metrics');

      trackAIMetrics('generate_text', 1000, 0.02);

      expect(counter).toHaveBeenCalledWith('ai_requests_total', 1, {
        action: 'generate_text'
      });

      expect(counter).toHaveBeenCalledWith('ai_tokens_used', 1000, {
        action: 'generate_text'
      });
    });
  });

  // ============================================================================
  // SYSTEM METRICS TESTS
  // ============================================================================

  describe('trackSystemMetrics', () => {
    it('should track system metrics', () => {
      const { gauge } = require('@econeura/shared/metrics');

      trackSystemMetrics();

      expect(gauge).toHaveBeenCalledWith('memory_usage_bytes', expect.any(Number), {
        type: 'heap_used'
      });

      expect(gauge).toHaveBeenCalledWith('memory_usage_bytes', expect.any(Number), {
        type: 'heap_total'
      });

      expect(gauge).toHaveBeenCalledWith('memory_usage_bytes', expect.any(Number), {
        type: 'rss'
      });

      expect(gauge).toHaveBeenCalledWith('uptime_seconds', expect.any(Number));
    });
  });

  // ============================================================================
  // METRICS ENDPOINTS TESTS
  // ============================================================================

  describe('getMetricsData', () => {
    it('should return metrics data successfully', async () => {
      const mockReq = createMockRequest();
      const mockRes = createMockResponse();

      await getMetricsData(mockReq as Request, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          metrics: [],
          stats: { totalMetrics: 0, lastUpdated: expect.any(String) },
          timestamp: expect.any(String)
        },
        requestId: 'test-request-id',
        timestamp: expect.any(String)
      });
    });

    it('should handle errors gracefully', async () => {
      const { structuredLogger } = require('../lib/structured-logger.js');
      const mockReq = createMockRequest();
      const mockRes = createMockResponse();

      // Mock metrics service to throw error
      const { initializeMetrics } = require('@econeura/shared/metrics');
      const mockMetricsService = {
        getMetrics: vi.fn().mockRejectedValue(new Error('Metrics service unavailable')),
        getStats: vi.fn().mockReturnValue({ totalMetrics: 0, lastUpdated: new Date().toISOString() })
      };
      initializeMetrics.mockReturnValue(mockMetricsService);

      await getMetricsData(mockReq as Request, mockRes as Response);

      expect(structuredLogger.error).toHaveBeenCalledWith(
        'Failed to get metrics data',
        { error: 'Metrics service unavailable' }
      );

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to get metrics data',
        requestId: 'test-request-id',
        timestamp: expect.any(String)
      });
    });
  });

  describe('clearMetrics', () => {
    it('should clear metrics successfully', async () => {
      const { structuredLogger } = require('../lib/structured-logger.js');
      const mockReq = createMockRequest();
      const mockRes = createMockResponse();

      await clearMetrics(mockReq as Request, mockRes as Response);

      expect(structuredLogger.info).toHaveBeenCalledWith(
        'Metrics cleared',
        { clearedBy: 'test-user' }
      );

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Metrics cleared successfully',
        requestId: 'test-request-id',
        timestamp: expect.any(String)
      });
    });

    it('should handle clear errors gracefully', async () => {
      const { structuredLogger } = require('../lib/structured-logger.js');
      const mockReq = createMockRequest();
      const mockRes = createMockResponse();

      // Mock metrics service to throw error
      const { initializeMetrics } = require('@econeura/shared/metrics');
      const mockMetricsService = {
        clearMetrics: vi.fn().mockRejectedValue(new Error('Clear failed')),
        getStats: vi.fn().mockReturnValue({ totalMetrics: 0, lastUpdated: new Date().toISOString() })
      };
      initializeMetrics.mockReturnValue(mockMetricsService);

      await clearMetrics(mockReq as Request, mockRes as Response);

      expect(structuredLogger.error).toHaveBeenCalledWith(
        'Failed to clear metrics',
        { error: 'Clear failed' }
      );

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to clear metrics',
        requestId: 'test-request-id',
        timestamp: expect.any(String)
      });
    });
  });

  // ============================================================================
  // SYSTEM METRICS COLLECTION TESTS
  // ============================================================================

  describe('System Metrics Collection', () => {
    it('should start system metrics collection', () => {
      const { structuredLogger } = require('../lib/structured-logger.js');

      startSystemMetricsCollection(5000);

      expect(structuredLogger.info).toHaveBeenCalledWith(
        'System metrics collection started',
        { interval: 5000 }
      );
    });

    it('should stop system metrics collection', () => {
      const { structuredLogger } = require('../lib/structured-logger.js');

      startSystemMetricsCollection(5000);
      stopSystemMetricsCollection();

      expect(structuredLogger.info).toHaveBeenCalledWith(
        'System metrics collection stopped'
      );
    });

    it('should not start multiple intervals', () => {
      const { structuredLogger } = require('../lib/structured-logger.js');

      startSystemMetricsCollection(5000);
      startSystemMetricsCollection(10000); // Should clear previous interval

      expect(structuredLogger.info).toHaveBeenCalledWith(
        'System metrics collection started',
        { interval: 10000 }
      );
    });
  });
});
