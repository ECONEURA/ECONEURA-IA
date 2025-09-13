import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '../../../index.js';

// Mock de autenticación
const mockAuth = {
  id: 'user-123',
  email: 'test@example.com',
  organizationId: 'org-123'
};

// Mock del middleware de autenticación
vi.mock('../../../middleware/auth.middleware.js', () => ({
  authenticateToken: (req: any, res: any, next: any) => {
    req.user = mockAuth;
    next();
  }
}));

// Mock del middleware de rate limiting
vi.mock('../../../middleware/rate-limiter.middleware.js', () => ({
  rateLimiter: (req: any, res: any, next: any) => {
    next();
  }
}));

// Mock del middleware de validación
vi.mock('../../../middleware/validation.middleware.js', () => ({
  validateRequest: (schema: any) => (req: any, res: any, next: any) => {
    next();
  }
}));

describe('AI Performance Optimization API Integration Tests', () => {
  const baseUrl = '/v1/ai-performance-optimization';

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /metrics', () => {
    it('should record performance metric successfully', async () => {
      const metricData = {
        serviceName: 'ai-chat-service',
        metricType: 'latency',
        value: 1500,
        unit: 'ms',
        metadata: { requestId: 'req-123' }
      };

      const response = await request(app)
        .post(`${baseUrl}/metrics`)
        .send(metricData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          serviceName: metricData.serviceName,
          metricType: metricData.metricType,
          value: metricData.value,
          unit: metricData.unit
        }),
        message: 'Performance metric recorded successfully'
      });
    });

    it('should validate metric type enum', async () => {
      const invalidMetricData = {
        serviceName: 'ai-chat-service',
        metricType: 'invalid_metric_type',
        value: 1500,
        unit: 'ms'
      };

      const response = await request(app)
        .post(`${baseUrl}/metrics`)
        .send(invalidMetricData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.any(String)
      });
    });

    it('should validate positive value', async () => {
      const invalidMetricData = {
        serviceName: 'ai-chat-service',
        metricType: 'latency',
        value: -100,
        unit: 'ms'
      };

      const response = await request(app)
        .post(`${baseUrl}/metrics`)
        .send(invalidMetricData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.any(String)
      });
    });
  });

  describe('GET /metrics', () => {
    it('should retrieve performance metrics with filters', async () => {
      const response = await request(app)
        .get(`${baseUrl}/metrics?serviceName=ai-chat-service&metricType=latency&limit=50`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.any(Array),
        count: expect.any(Number)
      });
    });

    it('should retrieve all metrics when no filters provided', async () => {
      const response = await request(app)
        .get(`${baseUrl}/metrics`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.any(Array),
        count: expect.any(Number)
      });
    });
  });

  describe('GET /rules', () => {
    it('should retrieve optimization rules', async () => {
      const response = await request(app)
        .get(`${baseUrl}/rules`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.any(Array),
        count: expect.any(Number)
      });
    });
  });

  describe('POST /rules', () => {
    it('should create optimization rule successfully', async () => {
      const ruleData = {
        name: 'High Latency Rule',
        description: 'Alert when latency exceeds 5 seconds',
        condition: {
          metric: 'latency',
          operator: 'gt',
          threshold: 5000,
          duration: 60
        },
        action: {
          type: 'scale_up',
          parameters: { instances: 2 },
          priority: 'high'
        },
        isActive: true
      };

      const response = await request(app)
        .post(`${baseUrl}/rules`)
        .send(ruleData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          name: ruleData.name,
          condition: ruleData.condition,
          action: ruleData.action
        }),
        message: 'Optimization rule created successfully'
      });
    });

    it('should validate action type enum', async () => {
      const invalidRuleData = {
        name: 'Test Rule',
        description: 'Test rule description',
        condition: {
          metric: 'latency',
          operator: 'gt',
          threshold: 5000,
          duration: 60
        },
        action: {
          type: 'invalid_action_type',
          parameters: {},
          priority: 'high'
        }
      };

      const response = await request(app)
        .post(`${baseUrl}/rules`)
        .send(invalidRuleData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.any(String)
      });
    });
  });

  describe('PUT /rules/:id', () => {
    it('should update optimization rule', async () => {
      const ruleId = 'rule-123';
      const updateData = {
        name: 'Updated Rule Name',
        isActive: false
      };

      const response = await request(app)
        .put(`${baseUrl}/rules/${ruleId}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          id: ruleId,
          name: updateData.name,
          isActive: updateData.isActive
        }),
        message: 'Optimization rule updated successfully'
      });
    });
  });

  describe('GET /alerts', () => {
    it('should retrieve performance alerts', async () => {
      const response = await request(app)
        .get(`${baseUrl}/alerts`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.any(Array),
        count: expect.any(Number)
      });
    });
  });

  describe('PUT /alerts/:id/resolve', () => {
    it('should resolve performance alert', async () => {
      const alertId = 'alert-123';

      const response = await request(app)
        .put(`${baseUrl}/alerts/${alertId}/resolve`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          id: alertId,
          status: 'resolved'
        }),
        message: 'Performance alert resolved successfully'
      });
    });
  });

  describe('POST /optimize', () => {
    it('should optimize performance for high latency', async () => {
      const optimizationData = {
        serviceName: 'ai-chat-service',
        metricType: 'latency',
        value: 3000,
        metadata: { requestId: 'req-123' }
      };

      const response = await request(app)
        .post(`${baseUrl}/optimize`)
        .send(optimizationData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          optimized: true,
          actions: expect.any(Array),
          recommendations: expect.any(Array),
          metrics: expect.objectContaining({
            before: optimizationData.value,
            after: expect.any(Number),
            improvement: expect.any(Number)
          })
        }),
        message: 'Performance optimization completed'
      });
    });

    it('should optimize performance for low accuracy', async () => {
      const optimizationData = {
        serviceName: 'ai-chat-service',
        metricType: 'accuracy',
        value: 0.8,
        metadata: { requestId: 'req-123' }
      };

      const response = await request(app)
        .post(`${baseUrl}/optimize`)
        .send(optimizationData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          optimized: true,
          actions: expect.arrayContaining([
            expect.objectContaining({
              type: 'model_switch',
              description: expect.stringContaining('Switch to more accurate model')
            })
          ])
        })
      });
    });

    it('should optimize performance for high cost', async () => {
      const optimizationData = {
        serviceName: 'ai-chat-service',
        metricType: 'cost',
        value: 0.02,
        metadata: { requestId: 'req-123' }
      };

      const response = await request(app)
        .post(`${baseUrl}/optimize`)
        .send(optimizationData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          optimized: true,
          actions: expect.arrayContaining([
            expect.objectContaining({
              type: 'model_switch',
              description: expect.stringContaining('Switch to more cost-effective model')
            })
          ])
        })
      });
    });

    it('should not optimize when metrics are within normal range', async () => {
      const optimizationData = {
        serviceName: 'ai-chat-service',
        metricType: 'latency',
        value: 1000,
        metadata: { requestId: 'req-123' }
      };

      const response = await request(app)
        .post(`${baseUrl}/optimize`)
        .send(optimizationData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          optimized: false,
          actions: [],
          recommendations: []
        })
      });
    });
  });

  describe('POST /reports', () => {
    it('should generate optimization report successfully', async () => {
      const reportData = {
        serviceName: 'ai-chat-service',
        reportType: 'daily',
        period: {
          start: '2024-01-01T00:00:00Z',
          end: '2024-01-02T00:00:00Z'
        }
      };

      const response = await request(app)
        .post(`${baseUrl}/reports`)
        .send(reportData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          serviceName: reportData.serviceName,
          reportType: reportData.reportType,
          summary: expect.objectContaining({
            totalRequests: expect.any(Number),
            averageLatency: expect.any(Number),
            averageThroughput: expect.any(Number),
            averageAccuracy: expect.any(Number),
            totalCost: expect.any(Number),
            errorRate: expect.any(Number),
            successRate: expect.any(Number)
          }),
          optimizations: expect.any(Array)
        }),
        message: 'Optimization report generated successfully'
      });
    });

    it('should validate report type enum', async () => {
      const invalidReportData = {
        serviceName: 'ai-chat-service',
        reportType: 'invalid_report_type',
        period: {
          start: '2024-01-01T00:00:00Z',
          end: '2024-01-02T00:00:00Z'
        }
      };

      const response = await request(app)
        .post(`${baseUrl}/reports`)
        .send(invalidReportData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.any(String)
      });
    });
  });

  describe('GET /reports', () => {
    it('should retrieve optimization reports with filters', async () => {
      const response = await request(app)
        .get(`${baseUrl}/reports?serviceName=ai-chat-service&reportType=daily&limit=10`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.any(Array),
        count: expect.any(Number),
        pagination: expect.objectContaining({
          limit: 10,
          total: expect.any(Number)
        })
      });
    });
  });

  describe('GET /autoscaling/config', () => {
    it('should retrieve auto-scaling configuration', async () => {
      const response = await request(app)
        .get(`${baseUrl}/autoscaling/config`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          minInstances: expect.any(Number),
          maxInstances: expect.any(Number),
          targetUtilization: expect.any(Number),
          scaleUpThreshold: expect.any(Number),
          scaleDownThreshold: expect.any(Number),
          cooldownPeriod: expect.any(Number)
        }),
        message: 'Auto-scaling configuration retrieved successfully'
      });
    });
  });

  describe('PUT /autoscaling/config', () => {
    it('should update auto-scaling configuration', async () => {
      const configData = {
        minInstances: 3,
        maxInstances: 15,
        targetUtilization: 75,
        scaleUpThreshold: 85,
        scaleDownThreshold: 25,
        cooldownPeriod: 300
      };

      const response = await request(app)
        .put(`${baseUrl}/autoscaling/config`)
        .send(configData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: configData,
        message: 'Auto-scaling configuration updated successfully'
      });
    });
  });

  describe('GET /realtime', () => {
    it('should retrieve realtime metrics', async () => {
      const response = await request(app)
        .get(`${baseUrl}/realtime?serviceName=ai-chat-service`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          timestamp: expect.any(String),
          serviceName: 'ai-chat-service',
          metrics: expect.objectContaining({
            latency: expect.any(Number),
            throughput: expect.any(Number),
            accuracy: expect.any(Number),
            cost: expect.any(Number),
            memory: expect.any(Number),
            cpu: expect.any(Number),
            errorRate: expect.any(Number),
            successRate: expect.any(Number)
          }),
          status: expect.stringMatching(/^(healthy|degraded|unhealthy)$/)
        }),
        message: 'Realtime metrics retrieved successfully'
      });
    });
  });

  describe('GET /health', () => {
    it('should return healthy status', async () => {
      const response = await request(app)
        .get(`${baseUrl}/health`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          status: expect.stringMatching(/^(healthy|degraded|unhealthy)$/),
          services: expect.objectContaining({
            database: expect.any(Boolean),
            monitoring: expect.any(Boolean),
            alerts: expect.any(Boolean)
          }),
          lastCheck: expect.any(String)
        })
      });
    });
  });

  describe('GET /stats', () => {
    it('should return service statistics', async () => {
      const response = await request(app)
        .get(`${baseUrl}/stats`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          metrics: expect.objectContaining({
            total: expect.any(Number),
            byType: expect.objectContaining({
              latency: expect.any(Number),
              throughput: expect.any(Number),
              accuracy: expect.any(Number),
              cost: expect.any(Number),
              memory: expect.any(Number),
              cpu: expect.any(Number),
              error_rate: expect.any(Number),
              success_rate: expect.any(Number)
            })
          }),
          rules: expect.objectContaining({
            total: expect.any(Number),
            active: expect.any(Number),
            byType: expect.objectContaining({
              scale_up: expect.any(Number),
              scale_down: expect.any(Number),
              cache_clear: expect.any(Number),
              model_switch: expect.any(Number),
              retry: expect.any(Number),
              fallback: expect.any(Number)
            })
          }),
          alerts: expect.objectContaining({
            total: expect.any(Number),
            active: expect.any(Number),
            resolved: expect.any(Number),
            bySeverity: expect.objectContaining({
              low: expect.any(Number),
              medium: expect.any(Number),
              high: expect.any(Number),
              critical: expect.any(Number)
            })
          }),
          optimizations: expect.objectContaining({
            total: expect.any(Number),
            successful: expect.any(Number),
            failed: expect.any(Number),
            averageImprovement: expect.any(Number)
          })
        }),
        message: 'Statistics retrieved successfully'
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle authentication errors', async () => {
      // Simular error de autenticación
      vi.mocked(require('../../../middleware/auth.middleware.js').authenticateToken)
        .mockImplementationOnce((req: any, res: any, next: any) => {
          res.status(401).json({ error: 'Unauthorized' });
        });

      const response = await request(app)
        .get(`${baseUrl}/metrics`)
        .expect(401);

      expect(response.body).toMatchObject({
        error: 'Unauthorized'
      });
    });

    it('should handle rate limiting', async () => {
      // Simular rate limiting
      vi.mocked(require('../../../middleware/rate-limiter.middleware.js').rateLimiter)
        .mockImplementationOnce((req: any, res: any, next: any) => {
          res.status(429).json({ error: 'Too many requests' });
        });

      const response = await request(app)
        .get(`${baseUrl}/metrics`)
        .expect(429);

      expect(response.body).toMatchObject({
        error: 'Too many requests'
      });
    });

    it('should handle server errors gracefully', async () => {
      // Simular error del servidor
      vi.mocked(require('../../../services/ai-performance-optimization.service.js').aiPerformanceOptimizationService.getPerformanceMetrics)
        .mockRejectedValueOnce(new Error('Internal server error'));

      const response = await request(app)
        .get(`${baseUrl}/metrics`)
        .expect(500);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Failed to retrieve performance metrics'
      });
    });
  });

  describe('Security Headers', () => {
    it('should include security headers in responses', async () => {
      const response = await request(app)
        .get(`${baseUrl}/health`)
        .expect(200);

      // Verificar headers de seguridad básicos
      expect(response.headers).toMatchObject({
        'x-content-type-options': 'nosniff',
        'x-frame-options': 'DENY',
        'x-xss-protection': '1; mode=block'
      });
    });
  });
});
