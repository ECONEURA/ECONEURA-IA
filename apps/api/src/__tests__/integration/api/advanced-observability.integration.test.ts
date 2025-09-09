/**
 * PR-56: Advanced Observability - Integration Tests
 *
 * Pruebas de integración para el sistema de observabilidad avanzada:
 * - Métricas en tiempo real
 * - Logs estructurados
 * - Trazabilidad distribuida
 * - Alertas inteligentes
 * - Dashboards personalizables
 * - Análisis de rendimiento
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import advancedObservabilityRouter from '../../../routes/advanced-observability.js';

const app = express();
app.use(express.json());
app.use('/v1/advanced-observability', advancedObservabilityRouter);

describe('Advanced Observability API Integration Tests', () => {
  describe('GET /v1/advanced-observability/metrics', () => {
    it('should return observability metrics', async () => {
      const response = await request(app)
        .get('/v1/advanced-observability/metrics')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.logs).toBeGreaterThan(0);
      expect(response.body.data.traces).toBeGreaterThan(0);
      expect(response.body.data.metrics).toBeGreaterThan(0);
      expect(response.body.data.performance).toBeDefined();
      expect(response.body.data.system).toBeDefined();
      expect(response.body.timestamp).toBeDefined();
    });

    it('should include performance metrics', async () => {
      const response = await request(app)
        .get('/v1/advanced-observability/metrics')
        .expect(200);

      const metrics = response.body.data;
      expect(metrics.performance.avgResponseTime).toBeGreaterThan(0);
      expect(metrics.performance.p95ResponseTime).toBeGreaterThan(0);
      expect(metrics.performance.p99ResponseTime).toBeGreaterThan(0);
      expect(metrics.performance.throughput).toBeGreaterThan(0);
      expect(metrics.performance.errorRate).toBeGreaterThanOrEqual(0);
    });

    it('should include system metrics', async () => {
      const response = await request(app)
        .get('/v1/advanced-observability/metrics')
        .expect(200);

      const metrics = response.body.data;
      expect(metrics.system.cpuUsage).toBeGreaterThanOrEqual(0);
      expect(metrics.system.memoryUsage).toBeGreaterThanOrEqual(0);
      expect(metrics.system.diskUsage).toBeGreaterThanOrEqual(0);
      expect(metrics.system.networkLatency).toBeGreaterThanOrEqual(0);
    });
  });

  describe('POST /v1/advanced-observability/performance-analysis', () => {
    it('should generate performance analysis', async () => {
      const requestData = {
        service: 'test-service',
        timeRange: '1h'
      };

      const response = await request(app)
        .post('/v1/advanced-observability/performance-analysis')
        .send(requestData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.service).toBe('test-service');
      expect(response.body.data.timeRange).toBe('1h');
      expect(response.body.data.metrics).toBeDefined();
      expect(response.body.data.trends).toBeDefined();
      expect(response.body.data.recommendations).toBeDefined();
    });

    it('should validate request data', async () => {
      const invalidRequest = {
        service: '', // Invalid empty service
        timeRange: '1h'
      };

      const response = await request(app)
        .post('/v1/advanced-observability/performance-analysis')
        .send(invalidRequest)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid request data');
      expect(response.body.details).toBeDefined();
    });

    it('should require service parameter', async () => {
      const requestData = {
        timeRange: '1h'
      };

      const response = await request(app)
        .post('/v1/advanced-observability/performance-analysis')
        .send(requestData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid request data');
    });
  });

  describe('GET /v1/advanced-observability/logs', () => {
    it('should return logs without filters', async () => {
      const response = await request(app)
        .get('/v1/advanced-observability/logs')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.count).toBeDefined();
      expect(response.body.timestamp).toBeDefined();
    });

    it('should filter logs by level', async () => {
      const response = await request(app)
        .get('/v1/advanced-observability/logs?level=error')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter logs by service', async () => {
      const response = await request(app)
        .get('/v1/advanced-observability/logs?service=test-service')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should limit number of logs', async () => {
      const response = await request(app)
        .get('/v1/advanced-observability/logs?limit=10')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(10);
    });

    it('should validate limit parameter', async () => {
      const response = await request(app)
        .get('/v1/advanced-observability/logs?limit=2000') // Exceeds max limit
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid request parameters');
    });
  });

  describe('POST /v1/advanced-observability/logs', () => {
    it('should create a new log entry', async () => {
      const logData = {
        level: 'info',
        message: 'Test log message',
        service: 'test-service',
        metadata: { test: true }
      };

      const response = await request(app)
        .post('/v1/advanced-observability/logs')
        .send(logData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.level).toBe('info');
      expect(response.body.data.message).toBe('Test log message');
      expect(response.body.data.service).toBe('test-service');
      expect(response.body.data.metadata).toEqual({ test: true });
    });

    it('should create log with optional fields', async () => {
      const logData = {
        level: 'error',
        message: 'Error log message',
        service: 'test-service',
        userId: 'user-123',
        requestId: 'req-456',
        traceId: 'trace-789',
        spanId: 'span-101'
      };

      const response = await request(app)
        .post('/v1/advanced-observability/logs')
        .send(logData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.userId).toBe('user-123');
      expect(response.body.data.requestId).toBe('req-456');
      expect(response.body.data.traceId).toBe('trace-789');
      expect(response.body.data.spanId).toBe('span-101');
    });

    it('should validate required fields', async () => {
      const invalidLogData = {
        level: 'info',
        // Missing required message and service fields
      };

      const response = await request(app)
        .post('/v1/advanced-observability/logs')
        .send(invalidLogData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid request data');
    });

    it('should validate log level', async () => {
      const invalidLogData = {
        level: 'invalid-level',
        message: 'Test message',
        service: 'test-service'
      };

      const response = await request(app)
        .post('/v1/advanced-observability/logs')
        .send(invalidLogData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid request data');
    });
  });

  describe('GET /v1/advanced-observability/traces', () => {
    it('should return traces without filters', async () => {
      const response = await request(app)
        .get('/v1/advanced-observability/traces')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.count).toBeDefined();
    });

    it('should filter traces by service', async () => {
      const response = await request(app)
        .get('/v1/advanced-observability/traces?service=test-service')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter traces by operation name', async () => {
      const response = await request(app)
        .get('/v1/advanced-observability/traces?operationName=test-operation')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should limit number of traces', async () => {
      const response = await request(app)
        .get('/v1/advanced-observability/traces?limit=5')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(5);
    });
  });

  describe('POST /v1/advanced-observability/traces', () => {
    it('should create a new trace span', async () => {
      const traceData = {
        traceId: 'trace-123',
        operationName: 'test-operation',
        service: 'test-service',
        status: 'started',
        tags: { test: true }
      };

      const response = await request(app)
        .post('/v1/advanced-observability/traces')
        .send(traceData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.traceId).toBe('trace-123');
      expect(response.body.data.operationName).toBe('test-operation');
      expect(response.body.data.service).toBe('test-service');
      expect(response.body.data.status).toBe('started');
      expect(response.body.data.tags).toEqual({ test: true });
    });

    it('should create trace with parent ID', async () => {
      const traceData = {
        traceId: 'trace-123',
        parentId: 'parent-456',
        operationName: 'child-operation',
        service: 'test-service',
        status: 'started'
      };

      const response = await request(app)
        .post('/v1/advanced-observability/traces')
        .send(traceData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.parentId).toBe('parent-456');
    });

    it('should validate required fields', async () => {
      const invalidTraceData = {
        operationName: 'test-operation',
        service: 'test-service',
        status: 'started'
        // Missing required traceId
      };

      const response = await request(app)
        .post('/v1/advanced-observability/traces')
        .send(invalidTraceData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid request data');
    });
  });

  describe('GET /v1/advanced-observability/alert-rules', () => {
    it('should return alert rules', async () => {
      const response = await request(app)
        .get('/v1/advanced-observability/alert-rules')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.count).toBeDefined();
    });

    it('should return rules with required fields', async () => {
      const response = await request(app)
        .get('/v1/advanced-observability/alert-rules')
        .expect(200);

      if (response.body.data.length > 0) {
        const rule = response.body.data[0];
        expect(rule.id).toBeDefined();
        expect(rule.name).toBeDefined();
        expect(rule.description).toBeDefined();
        expect(rule.enabled).toBeDefined();
        expect(rule.conditions).toBeDefined();
        expect(rule.actions).toBeDefined();
        expect(rule.severity).toBeDefined();
        expect(rule.cooldownMinutes).toBeDefined();
      }
    });
  });

  describe('POST /v1/advanced-observability/alert-rules', () => {
    it('should create a new alert rule', async () => {
      const ruleData = {
        name: 'Test Alert Rule',
        description: 'Test description',
        enabled: true,
        conditions: [
          {
            metric: 'error_rate',
            operator: 'gt',
            threshold: 5,
            timeWindow: 300
          }
        ],
        actions: [
          {
            type: 'email',
            target: 'admin@example.com'
          }
        ],
        severity: 'high',
        cooldownMinutes: 15
      };

      const response = await request(app)
        .post('/v1/advanced-observability/alert-rules')
        .send(ruleData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.name).toBe('Test Alert Rule');
      expect(response.body.data.severity).toBe('high');
    });

    it('should validate alert rule data', async () => {
      const invalidRuleData = {
        name: 'Test Rule',
        // Missing required fields
      };

      const response = await request(app)
        .post('/v1/advanced-observability/alert-rules')
        .send(invalidRuleData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid request data');
    });
  });

  describe('GET /v1/advanced-observability/alerts', () => {
    it('should return alerts without filters', async () => {
      const response = await request(app)
        .get('/v1/advanced-observability/alerts')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.count).toBeDefined();
    });

    it('should filter alerts by status', async () => {
      const response = await request(app)
        .get('/v1/advanced-observability/alerts?status=firing')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter alerts by severity', async () => {
      const response = await request(app)
        .get('/v1/advanced-observability/alerts?severity=high')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /v1/advanced-observability/dashboards', () => {
    it('should return dashboards', async () => {
      const response = await request(app)
        .get('/v1/advanced-observability/dashboards')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.count).toBeDefined();
    });

    it('should return dashboards with required fields', async () => {
      const response = await request(app)
        .get('/v1/advanced-observability/dashboards')
        .expect(200);

      if (response.body.data.length > 0) {
        const dashboard = response.body.data[0];
        expect(dashboard.id).toBeDefined();
        expect(dashboard.name).toBeDefined();
        expect(dashboard.widgets).toBeDefined();
        expect(dashboard.refreshInterval).toBeDefined();
        expect(dashboard.createdAt).toBeDefined();
        expect(dashboard.updatedAt).toBeDefined();
      }
    });
  });

  describe('POST /v1/advanced-observability/dashboards', () => {
    it('should create a new dashboard', async () => {
      const dashboardData = {
        name: 'Test Dashboard',
        description: 'Test dashboard description',
        widgets: [
          {
            id: 'widget-1',
            type: 'metric',
            title: 'Test Widget',
            position: { x: 0, y: 0, w: 6, h: 4 },
            config: { metric: 'response_time' }
          }
        ],
        refreshInterval: 30
      };

      const response = await request(app)
        .post('/v1/advanced-observability/dashboards')
        .send(dashboardData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.name).toBe('Test Dashboard');
      expect(response.body.data.widgets).toHaveLength(1);
    });

    it('should validate dashboard data', async () => {
      const invalidDashboardData = {
        name: 'Test Dashboard',
        // Missing required widgets
      };

      const response = await request(app)
        .post('/v1/advanced-observability/dashboards')
        .send(invalidDashboardData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid request data');
    });
  });

  describe('GET /v1/advanced-observability/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/v1/advanced-observability/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.metrics).toBeDefined();
      expect(response.body.uptime).toBeDefined();
    });

    it('should include metrics in health check', async () => {
      const response = await request(app)
        .get('/v1/advanced-observability/health')
        .expect(200);

      expect(response.body.metrics.logs).toBeGreaterThan(0);
      expect(response.body.metrics.traces).toBeGreaterThan(0);
      expect(response.body.metrics.alerts).toBeGreaterThanOrEqual(0);
      expect(response.body.metrics.errors).toBeGreaterThanOrEqual(0);
    });
  });
});
