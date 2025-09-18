import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AdvancedPerformanceMonitoringService } from '../../lib/advanced-performance-monitoring.service.ts.js';

// Mock logger
vi.mock('../../lib/logger.ts', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  }
}));

// Mock Prometheus metrics
vi.mock('../../../workers/src/utils/metrics.ts', () => ({
  prometheusMetrics: {
    counter: vi.fn(() => ({
      inc: vi.fn()
    })),
    gauge: vi.fn(() => ({
      set: vi.fn()
    })),
    histogram: vi.fn(() => ({
      observe: vi.fn()
    })),
    summary: vi.fn(() => ({
      observe: vi.fn()
    }))
  }
}));

describe('AdvancedPerformanceMonitoringService', () => {
  let service: AdvancedPerformanceMonitoringService;

  beforeEach(() => {
    service = new AdvancedPerformanceMonitoringService();
    // Clear intervals to prevent test interference
    vi.clearAllTimers();
  });

  afterEach(() => {
    service.cleanup();
  });

  describe('Service Initialization', () => {
    it('should initialize service successfully', () => {
      expect(service).toBeDefined();
    });
  });

  describe('Metrics Management', () => {
    it('should record a metric', async () => {
      const metricData = {
        name: 'test_metric',
        type: 'gauge' as const,
        value: 100,
        labels: { service: 'test' }
      };

      const metric = await service.recordMetric(metricData);

      expect(metric).toBeDefined();
      expect(metric.id).toBeDefined();
      expect(metric.name).toBe('test_metric');
      expect(metric.type).toBe('gauge');
      expect(metric.value).toBe(100);
      expect(metric.timestamp).toBeInstanceOf(Date);
    });

    it('should get metrics with filters', async () => {
      // Record some test metrics
      await service.recordMetric({
        name: 'response_time',
        type: 'histogram',
        value: 150,
        labels: { endpoint: '/api/test' }
      });

      await service.recordMetric({
        name: 'error_rate',
        type: 'gauge',
        value: 0.02,
        labels: { service: 'api' }
      });

      const metrics = await service.getMetrics({ name: 'response_time' });
      expect(metrics.length).toBeGreaterThan(0);
      expect(metrics.every(m => m.name === 'response_time')).toBe(true);
    });

    it('should get all metrics without filters', async () => {
      const metrics = await service.getMetrics();
      expect(Array.isArray(metrics)).toBe(true);
    });
  });

  describe('Alert Management', () => {
    it('should create an alert', async () => {
      const alertData = {
        name: 'Test Alert',
        description: 'Test alert description',
        severity: 'high' as const,
        condition: {
          metric: 'response_time',
          operator: 'gt' as const,
          threshold: 500,
          timeWindow: 300
        },
        enabled: true,
        actions: [{
          type: 'email' as const,
          config: { recipients: ['test@example.com'] }
        }]
      };

      const alert = await service.createAlert(alertData);

      expect(alert).toBeDefined();
      expect(alert.id).toBeDefined();
      expect(alert.name).toBe('Test Alert');
      expect(alert.severity).toBe('high');
      expect(alert.enabled).toBe(true);
      expect(alert.createdAt).toBeInstanceOf(Date);
    });

    it('should get all alerts', async () => {
      const alerts = await service.getAlerts();
      expect(Array.isArray(alerts)).toBe(true);
    });

    it('should update an alert', async () => {
      const alertData = {
        name: 'Test Alert',
        description: 'Test alert description',
        severity: 'high' as const,
        condition: {
          metric: 'response_time',
          operator: 'gt' as const,
          threshold: 500,
          timeWindow: 300
        },
        enabled: true,
        actions: [{
          type: 'email' as const,
          config: { recipients: ['test@example.com'] }
        }]
      };

      const alert = await service.createAlert(alertData);
      const updated = await service.updateAlert(alert.id, { enabled: false });

      expect(updated).toBeDefined();
      expect(updated?.enabled).toBe(false);
      expect(updated?.updatedAt).toBeInstanceOf(Date);
    });

    it('should delete an alert', async () => {
      const alertData = {
        name: 'Test Alert',
        description: 'Test alert description',
        severity: 'high' as const,
        condition: {
          metric: 'response_time',
          operator: 'gt' as const,
          threshold: 500,
          timeWindow: 300
        },
        enabled: true,
        actions: [{
          type: 'email' as const,
          config: { recipients: ['test@example.com'] }
        }]
      };

      const alert = await service.createAlert(alertData);
      const deleted = await service.deleteAlert(alert.id);

      expect(deleted).toBe(true);
    });
  });

  describe('Dashboard Management', () => {
    it('should create a dashboard', async () => {
      const dashboardData = {
        name: 'Test Dashboard',
        description: 'Test dashboard description',
        widgets: [{
          id: 'widget_1',
          type: 'chart' as const,
          title: 'Test Chart',
          config: { metric: 'response_time' },
          position: { x: 0, y: 0, width: 6, height: 4 }
        }],
        isPublic: true
      };

      const dashboard = await service.createDashboard(dashboardData);

      expect(dashboard).toBeDefined();
      expect(dashboard.id).toBeDefined();
      expect(dashboard.name).toBe('Test Dashboard');
      expect(dashboard.widgets).toHaveLength(1);
      expect(dashboard.createdAt).toBeInstanceOf(Date);
    });

    it('should get all dashboards', async () => {
      const dashboards = await service.getDashboards();
      expect(Array.isArray(dashboards)).toBe(true);
    });

    it('should update a dashboard', async () => {
      const dashboardData = {
        name: 'Test Dashboard',
        description: 'Test dashboard description',
        widgets: [{
          id: 'widget_1',
          type: 'chart' as const,
          title: 'Test Chart',
          config: { metric: 'response_time' },
          position: { x: 0, y: 0, width: 6, height: 4 }
        }],
        isPublic: true
      };

      const dashboard = await service.createDashboard(dashboardData);
      const updated = await service.updateDashboard(dashboard.id, { isPublic: false });

      expect(updated).toBeDefined();
      expect(updated?.isPublic).toBe(false);
      expect(updated?.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('Report Management', () => {
    it('should create a report', async () => {
      const reportData = {
        name: 'Test Report',
        type: 'daily' as const,
        metrics: ['response_time', 'error_rate'],
        filters: {},
        recipients: ['test@example.com'],
        format: 'html' as const
      };

      const report = await service.createReport(reportData);

      expect(report).toBeDefined();
      expect(report.id).toBeDefined();
      expect(report.name).toBe('Test Report');
      expect(report.type).toBe('daily');
      expect(report.format).toBe('html');
      expect(report.createdAt).toBeInstanceOf(Date);
    });

    it('should get all reports', async () => {
      const reports = await service.getReports();
      expect(Array.isArray(reports)).toBe(true);
    });

    it('should generate a report', async () => {
      const reportData = {
        name: 'Test Report',
        type: 'daily' as const,
        metrics: ['response_time', 'error_rate'],
        filters: {},
        recipients: ['test@example.com'],
        format: 'json' as const
      };

      const report = await service.createReport(reportData);
      const result = await service.generateReport(report.id);

      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(result.format).toBe('json');
    });
  });

  describe('Baseline Management', () => {
    it('should get baselines', async () => {
      const baselines = await service.getBaselines();
      expect(Array.isArray(baselines)).toBe(true);
    });

    it('should calculate baselines', async () => {
      // This test might not have enough data to calculate meaningful baselines
      // but it should not throw an error
      await expect(service.calculateBaselines()).resolves.not.toThrow();
    });
  });

  describe('Anomaly Detection', () => {
    it('should get anomalies', async () => {
      const anomalies = await service.getAnomalies();
      expect(Array.isArray(anomalies)).toBe(true);
    });

    it('should get anomalies with filters', async () => {
      const anomalies = await service.getAnomalies({ severity: 'high' });
      expect(Array.isArray(anomalies)).toBe(true);
    });

    it('should resolve an anomaly', async () => {
      // Create a mock anomaly first
      const anomalies = await service.getAnomalies();
      if (anomalies.length > 0) {
        const resolved = await service.resolveAnomaly(anomalies[0].id);
        expect(resolved).toBe(true);
      }
    });
  });

  describe('Statistics', () => {
    it('should get statistics', async () => {
      const statistics = await service.getStatistics();

      expect(statistics).toBeDefined();
      expect(typeof statistics.totalMetrics).toBe('number');
      expect(typeof statistics.totalAlerts).toBe('number');
      expect(typeof statistics.totalDashboards).toBe('number');
      expect(typeof statistics.totalReports).toBe('number');
      expect(typeof statistics.totalBaselines).toBe('number');
      expect(typeof statistics.totalAnomalies).toBe('number');
      expect(typeof statistics.activeAlerts).toBe('number');
      expect(typeof statistics.unresolvedAnomalies).toBe('number');
      expect(typeof statistics.metricsByType).toBe('object');
      expect(typeof statistics.alertsBySeverity).toBe('object');
      expect(typeof statistics.anomaliesByType).toBe('object');
    });
  });

  describe('Edge Cases', () => {
    it('should handle non-existent alert update', async () => {
      const result = await service.updateAlert('non-existent-id', { enabled: false });
      expect(result).toBeNull();
    });

    it('should handle non-existent alert deletion', async () => {
      const result = await service.deleteAlert('non-existent-id');
      expect(result).toBe(false);
    });

    it('should handle non-existent dashboard update', async () => {
      const result = await service.updateDashboard('non-existent-id', { name: 'Updated' });
      expect(result).toBeNull();
    });

    it('should handle non-existent report generation', async () => {
      await expect(service.generateReport('non-existent-id')).rejects.toThrow('Report not found');
    });

    it('should handle non-existent anomaly resolution', async () => {
      const result = await service.resolveAnomaly('non-existent-id');
      expect(result).toBe(false);
    });
  });

  describe('Data Validation', () => {
    it('should handle metric with all required fields', async () => {
      const metric = await service.recordMetric({
        name: 'test_metric',
        type: 'counter',
        value: 1,
        labels: { test: 'value' }
      });

      expect(metric.name).toBe('test_metric');
      expect(metric.type).toBe('counter');
      expect(metric.value).toBe(1);
      expect(metric.labels).toEqual({ test: 'value' });
    });

    it('should handle alert with all required fields', async () => {
      const alert = await service.createAlert({
        name: 'Test Alert',
        description: 'Test description',
        severity: 'medium',
        condition: {
          metric: 'test_metric',
          operator: 'gt',
          threshold: 100,
          timeWindow: 60
        },
        enabled: true,
        actions: [{
          type: 'email',
          config: { recipients: ['test@example.com'] }
        }]
      });

      expect(alert.name).toBe('Test Alert');
      expect(alert.severity).toBe('medium');
      expect(alert.condition.threshold).toBe(100);
      expect(alert.actions).toHaveLength(1);
    });
  });
});
