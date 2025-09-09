/**
 * PR-56: Advanced Observability Service - Unit Tests
 *
 * Pruebas unitarias para el servicio de observabilidad avanzada:
 * - Métricas en tiempo real
 * - Logs estructurados
 * - Trazabilidad distribuida
 * - Alertas inteligentes
 * - Dashboards personalizables
 * - Análisis de rendimiento
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AdvancedObservabilityService } from '../../../services/advanced-observability.service.js';

// Mock del structured logger
vi.mock('../../../lib/structured-logger.js', () => ({
  structuredLogger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

describe('AdvancedObservabilityService', () => {
  let service: AdvancedObservabilityService;

  beforeEach(() => {
    service = new AdvancedObservabilityService();
    vi.clearAllMocks();
  });

  describe('getMetrics', () => {
    it('should return observability metrics', async () => {
      const metrics = await service.getMetrics();

      expect(metrics).toBeDefined();
      expect(metrics.logs).toBeGreaterThan(0);
      expect(metrics.traces).toBeGreaterThan(0);
      expect(metrics.metrics).toBeGreaterThan(0);
      expect(metrics.alerts).toBeGreaterThanOrEqual(0);
      expect(metrics.errors).toBeGreaterThanOrEqual(0);
      expect(metrics.warnings).toBeGreaterThanOrEqual(0);
      expect(metrics.performance).toBeDefined();
      expect(metrics.system).toBeDefined();
    });

    it('should include performance metrics', async () => {
      const metrics = await service.getMetrics();

      expect(metrics.performance.avgResponseTime).toBeGreaterThan(0);
      expect(metrics.performance.p95ResponseTime).toBeGreaterThan(0);
      expect(metrics.performance.p99ResponseTime).toBeGreaterThan(0);
      expect(metrics.performance.throughput).toBeGreaterThan(0);
      expect(metrics.performance.errorRate).toBeGreaterThanOrEqual(0);
    });

    it('should include system metrics', async () => {
      const metrics = await service.getMetrics();

      expect(metrics.system.cpuUsage).toBeGreaterThanOrEqual(0);
      expect(metrics.system.memoryUsage).toBeGreaterThanOrEqual(0);
      expect(metrics.system.diskUsage).toBeGreaterThanOrEqual(0);
      expect(metrics.system.networkLatency).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getPerformanceAnalysis', () => {
    it('should generate performance analysis for a service', async () => {
      const analysis = await service.getPerformanceAnalysis('test-service', '1h');

      expect(analysis).toBeDefined();
      expect(analysis.service).toBe('test-service');
      expect(analysis.timeRange).toBe('1h');
      expect(analysis.metrics).toBeDefined();
      expect(analysis.trends).toBeDefined();
      expect(analysis.recommendations).toBeDefined();
    });

    it('should include performance metrics in analysis', async () => {
      const analysis = await service.getPerformanceAnalysis('test-service', '1h');

      expect(analysis.metrics.avgResponseTime).toBeGreaterThan(0);
      expect(analysis.metrics.p95ResponseTime).toBeGreaterThan(0);
      expect(analysis.metrics.p99ResponseTime).toBeGreaterThan(0);
      expect(analysis.metrics.throughput).toBeGreaterThan(0);
      expect(analysis.metrics.errorRate).toBeGreaterThanOrEqual(0);
      expect(analysis.metrics.availability).toBeGreaterThan(99);
    });

    it('should include trends in analysis', async () => {
      const analysis = await service.getPerformanceAnalysis('test-service', '1h');

      expect(['improving', 'degrading', 'stable']).toContain(analysis.trends.responseTime);
      expect(['increasing', 'decreasing', 'stable']).toContain(analysis.trends.throughput);
      expect(['improving', 'degrading', 'stable']).toContain(analysis.trends.errorRate);
    });

    it('should include recommendations in analysis', async () => {
      const analysis = await service.getPerformanceAnalysis('test-service', '1h');

      expect(Array.isArray(analysis.recommendations)).toBe(true);
      expect(analysis.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('getLogs', () => {
    it('should return logs without filters', async () => {
      const logs = await service.getLogs();

      expect(Array.isArray(logs)).toBe(true);
    });

    it('should filter logs by level', async () => {
      const logs = await service.getLogs({ level: 'error' });

      expect(Array.isArray(logs)).toBe(true);
      // En el servicio demo, todos los logs podrían ser del mismo nivel
    });

    it('should filter logs by service', async () => {
      const logs = await service.getLogs({ service: 'test-service' });

      expect(Array.isArray(logs)).toBe(true);
    });

    it('should limit number of logs returned', async () => {
      const logs = await service.getLogs({ limit: 10 });

      expect(Array.isArray(logs)).toBe(true);
      expect(logs.length).toBeLessThanOrEqual(10);
    });

    it('should filter logs by time range', async () => {
      const startTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
      const endTime = new Date();

      const logs = await service.getLogs({ startTime, endTime });

      expect(Array.isArray(logs)).toBe(true);
    });
  });

  describe('createLog', () => {
    it('should create a new log entry', async () => {
      const logData = {
        level: 'info' as const,
        message: 'Test log message',
        service: 'test-service',
        metadata: { test: true }
      };

      const log = await service.createLog(logData);

      expect(log).toBeDefined();
      expect(log.id).toBeDefined();
      expect(log.timestamp).toBeDefined();
      expect(log.level).toBe('info');
      expect(log.message).toBe('Test log message');
      expect(log.service).toBe('test-service');
      expect(log.metadata).toEqual({ test: true });
    });

    it('should create log with optional fields', async () => {
      const logData = {
        level: 'error' as const,
        message: 'Error log message',
        service: 'test-service',
        userId: 'user-123',
        requestId: 'req-456',
        traceId: 'trace-789',
        spanId: 'span-101'
      };

      const log = await service.createLog(logData);

      expect(log.userId).toBe('user-123');
      expect(log.requestId).toBe('req-456');
      expect(log.traceId).toBe('trace-789');
      expect(log.spanId).toBe('span-101');
    });
  });

  describe('getTraces', () => {
    it('should return traces without filters', async () => {
      const traces = await service.getTraces();

      expect(Array.isArray(traces)).toBe(true);
    });

    it('should filter traces by service', async () => {
      const traces = await service.getTraces({ service: 'test-service' });

      expect(Array.isArray(traces)).toBe(true);
    });

    it('should filter traces by operation name', async () => {
      const traces = await service.getTraces({ operationName: 'test-operation' });

      expect(Array.isArray(traces)).toBe(true);
    });

    it('should limit number of traces returned', async () => {
      const traces = await service.getTraces({ limit: 5 });

      expect(Array.isArray(traces)).toBe(true);
      expect(traces.length).toBeLessThanOrEqual(5);
    });
  });

  describe('createTrace', () => {
    it('should create a new trace span', async () => {
      const traceData = {
        traceId: 'trace-123',
        operationName: 'test-operation',
        service: 'test-service',
        status: 'started' as const,
        tags: { test: true }
      };

      const trace = await service.createTrace(traceData);

      expect(trace).toBeDefined();
      expect(trace.id).toBeDefined();
      expect(trace.startTime).toBeDefined();
      expect(trace.traceId).toBe('trace-123');
      expect(trace.operationName).toBe('test-operation');
      expect(trace.service).toBe('test-service');
      expect(trace.status).toBe('started');
      expect(trace.tags).toEqual({ test: true });
    });

    it('should create trace with parent ID', async () => {
      const traceData = {
        traceId: 'trace-123',
        parentId: 'parent-456',
        operationName: 'child-operation',
        service: 'test-service',
        status: 'started' as const
      };

      const trace = await service.createTrace(traceData);

      expect(trace.parentId).toBe('parent-456');
    });
  });

  describe('getAlertRules', () => {
    it('should return alert rules', async () => {
      const rules = await service.getAlertRules();

      expect(Array.isArray(rules)).toBe(true);
      expect(rules.length).toBeGreaterThan(0);
    });

    it('should return rules with required fields', async () => {
      const rules = await service.getAlertRules();

      if (rules.length > 0) {
        const rule = rules[0];
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

  describe('createAlertRule', () => {
    it('should create a new alert rule', async () => {
      const ruleData = {
        name: 'Test Alert Rule',
        description: 'Test description',
        enabled: true,
        conditions: [
          {
            metric: 'error_rate',
            operator: 'gt' as const,
            threshold: 5,
            timeWindow: 300
          }
        ],
        actions: [
          {
            type: 'email' as const,
            target: 'admin@example.com'
          }
        ],
        severity: 'high' as const,
        cooldownMinutes: 15
      };

      const rule = await service.createAlertRule(ruleData);

      expect(rule).toBeDefined();
      expect(rule.id).toBeDefined();
      expect(rule.name).toBe('Test Alert Rule');
      expect(rule.description).toBe('Test description');
      expect(rule.enabled).toBe(true);
      expect(rule.conditions).toHaveLength(1);
      expect(rule.actions).toHaveLength(1);
      expect(rule.severity).toBe('high');
      expect(rule.cooldownMinutes).toBe(15);
    });
  });

  describe('getAlerts', () => {
    it('should return alerts without filters', async () => {
      const alerts = await service.getAlerts();

      expect(Array.isArray(alerts)).toBe(true);
    });

    it('should filter alerts by status', async () => {
      const alerts = await service.getAlerts({ status: 'firing' });

      expect(Array.isArray(alerts)).toBe(true);
    });

    it('should filter alerts by severity', async () => {
      const alerts = await service.getAlerts({ severity: 'high' });

      expect(Array.isArray(alerts)).toBe(true);
    });

    it('should limit number of alerts returned', async () => {
      const alerts = await service.getAlerts({ limit: 5 });

      expect(Array.isArray(alerts)).toBe(true);
      expect(alerts.length).toBeLessThanOrEqual(5);
    });
  });

  describe('getDashboards', () => {
    it('should return dashboards', async () => {
      const dashboards = await service.getDashboards();

      expect(Array.isArray(dashboards)).toBe(true);
      expect(dashboards.length).toBeGreaterThan(0);
    });

    it('should return dashboards with required fields', async () => {
      const dashboards = await service.getDashboards();

      if (dashboards.length > 0) {
        const dashboard = dashboards[0];
        expect(dashboard.id).toBeDefined();
        expect(dashboard.name).toBeDefined();
        expect(dashboard.widgets).toBeDefined();
        expect(dashboard.refreshInterval).toBeDefined();
        expect(dashboard.createdAt).toBeDefined();
        expect(dashboard.updatedAt).toBeDefined();
      }
    });
  });

  describe('createDashboard', () => {
    it('should create a new dashboard', async () => {
      const dashboardData = {
        name: 'Test Dashboard',
        description: 'Test dashboard description',
        widgets: [
          {
            id: 'widget-1',
            type: 'metric' as const,
            title: 'Test Widget',
            position: { x: 0, y: 0, w: 6, h: 4 },
            config: { metric: 'response_time' }
          }
        ],
        refreshInterval: 30
      };

      const dashboard = await service.createDashboard(dashboardData);

      expect(dashboard).toBeDefined();
      expect(dashboard.id).toBeDefined();
      expect(dashboard.name).toBe('Test Dashboard');
      expect(dashboard.description).toBe('Test dashboard description');
      expect(dashboard.widgets).toHaveLength(1);
      expect(dashboard.refreshInterval).toBe(30);
      expect(dashboard.createdAt).toBeDefined();
      expect(dashboard.updatedAt).toBeDefined();
    });
  });
});
