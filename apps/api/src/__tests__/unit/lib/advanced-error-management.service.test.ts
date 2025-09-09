import { describe, it, expect, beforeEach, vi } from 'vitest';
import { advancedErrorManagementService } from '../../../lib/advanced-error-management.service.js';

// ============================================================================
// ADVANCED ERROR MANAGEMENT SERVICE UNIT TESTS - PR-73
// ============================================================================

describe('AdvancedErrorManagementService - PR-73', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // Reset service state for isolation
    (advancedErrorManagementService as any).errors = new Map();
    (advancedErrorManagementService as any).patterns = new Map();
    (advancedErrorManagementService as any).metrics = new Map();
    (advancedErrorManagementService as any).alerts = new Map();
    advancedErrorManagementService.init(); // Re-initialize with demo data
  });

  describe('Error Management', () => {
    it('should create error event with complete context and impact analysis', async () => {
      const errorData = {
        organizationId: 'test-org-1',
        service: 'test-service',
        environment: 'production' as const,
        errorType: 'TestError',
        errorMessage: 'Test error message',
        stackTrace: 'Error: Test error\n    at TestFunction()',
        context: {
          userId: 'user_123',
          sessionId: 'session_456',
          requestId: 'req_789',
          endpoint: '/api/v1/test',
          method: 'GET',
          userAgent: 'Mozilla/5.0...',
          ipAddress: '192.168.1.100',
          timestamp: new Date().toISOString()
        },
        severity: 'high' as const,
        category: 'application' as const,
        impact: {
          affectedUsers: 50,
          businessImpact: 'high' as const,
          revenueImpact: 1000,
          slaImpact: true
        },
        performance: {
          responseTime: 2000,
          memoryUsage: 75.5,
          cpuUsage: 85.3,
          databaseQueries: 5,
          cacheHitRate: 90.0
        }
      };

      const error = await advancedErrorManagementService.createError(errorData);

      expect(error).toBeDefined();
      expect(error.organizationId).toBe('test-org-1');
      expect(error.service).toBe('test-service');
      expect(error.errorType).toBe('TestError');
      expect(error.severity).toBe('high');
      expect(error.category).toBe('application');
      expect(error.impact.affectedUsers).toBe(50);
      expect(error.performance.responseTime).toBe(2000);
      expect(error.metadata.tags).toBeDefined();
    });

    it('should get errors with comprehensive filters', async () => {
      const errors = await advancedErrorManagementService.getErrors('demo-org-1', {
        service: 'api-gateway',
        severity: 'high',
        category: 'database',
        status: 'investigating',
        limit: 10
      });

      expect(errors).toBeDefined();
      expect(Array.isArray(errors)).toBe(true);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.every(e => e.service === 'api-gateway')).toBe(true);
      expect(errors.every(e => e.severity === 'high')).toBe(true);
      expect(errors.every(e => e.category === 'database')).toBe(true);
    });

    it('should get errors by date range and status', async () => {
      const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const endDate = new Date().toISOString();

      const errors = await advancedErrorManagementService.getErrors('demo-org-1', {
        startDate,
        endDate,
        status: 'investigating',
        limit: 20
      });

      expect(errors).toBeDefined();
      expect(Array.isArray(errors)).toBe(true);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.every(e => e.resolution.status === 'investigating')).toBe(true);
    });
  });

  describe('Pattern Management', () => {
    it('should create pattern with complex conditions and actions', async () => {
      const patternData = {
        organizationId: 'test-org-1',
        name: 'Test Pattern',
        description: 'Test pattern for unit testing',
        pattern: {
          errorType: 'TestError',
          category: 'application',
          conditions: [
            { field: 'severity', operator: 'equals', value: 'high' },
            { field: 'impact.businessImpact', operator: 'equals', value: 'high' },
            { field: 'performance.responseTime', operator: 'greater_than', value: 1000 }
          ]
        },
        action: {
          type: 'escalate' as const,
          config: {
            escalationLevel: 2,
            alertChannels: ['slack', 'pagerduty'],
            notificationTemplate: 'critical_error'
          }
        }
      };

      const pattern = await advancedErrorManagementService.createPattern(patternData);

      expect(pattern).toBeDefined();
      expect(pattern.name).toBe('Test Pattern');
      expect(pattern.pattern.errorType).toBe('TestError');
      expect(pattern.pattern.conditions).toHaveLength(3);
      expect(pattern.action.type).toBe('escalate');
      expect(pattern.action.config.escalationLevel).toBe(2);
      expect(pattern.enabled).toBe(true);
    });

    it('should get patterns with filters', async () => {
      const patterns = await advancedErrorManagementService.getPatterns('demo-org-1', {
        enabled: true,
        actionType: 'escalate',
        limit: 10
      });

      expect(patterns).toBeDefined();
      expect(Array.isArray(patterns)).toBe(true);
      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns.every(p => p.enabled =)).toBe(true);
      expect(patterns.every(p => p.action.type === 'escalate')).toBe(true);
    });
  });

  describe('Performance Monitoring', () => {
    it('should create performance metric with thresholds and status', async () => {
      const metricData = {
        organizationId: 'test-org-1',
        service: 'test-service',
        metricType: 'response_time' as const,
        value: 750,
        unit: 'ms',
        timestamp: new Date().toISOString(),
        dimensions: {
          endpoint: '/api/v1/test',
          method: 'GET',
          statusCode: 200,
          environment: 'production'
        },
        thresholds: {
          warning: 500,
          critical: 1000
        }
      };

      const metric = await advancedErrorManagementService.createPerformanceMetric(metricData);

      expect(metric).toBeDefined();
      expect(metric.service).toBe('test-service');
      expect(metric.metricType).toBe('response_time');
      expect(metric.value).toBe(750);
      expect(metric.status).toBe('warning'); // Between warning and critical
      expect(metric.thresholds.warning).toBe(500);
      expect(metric.thresholds.critical).toBe(1000);
    });

    it('should get performance metrics with filters', async () => {
      const metrics = await advancedErrorManagementService.getPerformanceMetrics('demo-org-1', {
        service: 'api-gateway',
        metricType: 'response_time',
        status: 'normal',
        limit: 10
      });

      expect(metrics).toBeDefined();
      expect(Array.isArray(metrics)).toBe(true);
      expect(metrics.length).toBeGreaterThan(0);
      expect(metrics.every(m => m.service === 'api-gateway')).toBe(true);
      expect(metrics.every(m => m.metricType === 'response_time')).toBe(true);
    });

    it('should determine metric status based on thresholds', async () => {
      // Test normal status
      const normalMetric = await advancedErrorManagementService.createPerformanceMetric({
        organizationId: 'test-org-1',
        service: 'test-service',
        metricType: 'response_time',
        value: 200,
        unit: 'ms',
        timestamp: new Date().toISOString(),
        thresholds: { warning: 500, critical: 1000 }
      });
      expect(normalMetric.status).toBe('normal');

      // Test warning status
      const warningMetric = await advancedErrorManagementService.createPerformanceMetric({
        organizationId: 'test-org-1',
        service: 'test-service',
        metricType: 'response_time',
        value: 750,
        unit: 'ms',
        timestamp: new Date().toISOString(),
        thresholds: { warning: 500, critical: 1000 }
      });
      expect(warningMetric.status).toBe('warning');

      // Test critical status
      const criticalMetric = await advancedErrorManagementService.createPerformanceMetric({
        organizationId: 'test-org-1',
        service: 'test-service',
        metricType: 'response_time',
        value: 1500,
        unit: 'ms',
        timestamp: new Date().toISOString(),
        thresholds: { warning: 500, critical: 1000 }
      });
      expect(criticalMetric.status).toBe('critical');
    });
  });

  describe('Alert Management', () => {
    it('should create alert with notifications and metadata', async () => {
      const alertData = {
        organizationId: 'test-org-1',
        type: 'error' as const,
        severity: 'critical' as const,
        title: 'Test Alert',
        description: 'Test alert description',
        source: {
          service: 'test-service',
          component: 'test-component',
          endpoint: '/api/v1/test'
        },
        condition: {
          metric: 'error_rate',
          threshold: 5,
          operator: 'greater_than',
          duration: 300
        },
        status: 'active' as const,
        assignedTo: 'dev-team',
        escalationLevel: 2,
        notifications: {
          channels: ['slack', 'email', 'pagerduty'],
          sent: false,
          acknowledged: false
        },
        metadata: {
          tags: ['critical', 'production'],
          customFields: {
            affectedServices: ['test-service'],
            estimatedImpact: 'high'
          },
          relatedAlerts: []
        }
      };

      const alert = await advancedErrorManagementService.createAlert(alertData);

      expect(alert).toBeDefined();
      expect(alert.type).toBe('error');
      expect(alert.severity).toBe('critical');
      expect(alert.title).toBe('Test Alert');
      expect(alert.source.service).toBe('test-service');
      expect(alert.notifications.channels).toHaveLength(3);
      expect(alert.metadata.tags).toContain('critical');
    });

    it('should get alerts with filters', async () => {
      const alerts = await advancedErrorManagementService.getAlerts('demo-org-1', {
        type: 'error',
        severity: 'high',
        status: 'active',
        limit: 10
      });

      expect(alerts).toBeDefined();
      expect(Array.isArray(alerts)).toBe(true);
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts.every(a => a.type === 'error')).toBe(true);
      expect(alerts.every(a => a.severity === 'high')).toBe(true);
      expect(alerts.every(a => a.status === 'active')).toBe(true);
    });
  });

  describe('Error Analysis', () => {
    it('should analyze error and match patterns', async () => {
      const errors = await advancedErrorManagementService.getErrors('demo-org-1', { limit: 1 });
      const error = errors[0];

      const analyzedError = await advancedErrorManagementService.analyzeError(error.id);

      expect(analyzedError).toBeDefined();
      expect(analyzedError.metadata.tags).toBeDefined();
      expect(analyzedError.metadata.tags.length).toBeGreaterThan(0);
      expect(analyzedError.updatedAt).toBeDefined();
    });

    it('should generate appropriate tags for different error types', async () => {
      const errors = await advancedErrorManagementService.getErrors('demo-org-1', { limit: 10 });

      errors.forEach(error => {
        expect(error.metadata.tags).toBeDefined();
        expect(error.metadata.tags.length).toBeGreaterThan(0);
        expect(error.metadata.tags).toContain(error.category);
        expect(error.metadata.tags).toContain(error.severity);
        expect(error.metadata.tags).toContain(error.service);
        expect(error.metadata.tags).toContain(error.environment);
      });
    });
  });

  describe('Pattern Matching', () => {
    it('should match patterns based on error type and conditions', async () => {
      const patterns = await advancedErrorManagementService.getPatterns('demo-org-1', { limit: 10 });
      const errors = await advancedErrorManagementService.getErrors('demo-org-1', { limit: 10 });

      const dbPattern = patterns.find(p => p.name === 'Database Connection Errors');
      const dbError = errors.find(e => e.errorType === 'DatabaseConnectionError');

      expect(dbPattern).toBeDefined();
      expect(dbError).toBeDefined();

      if (dbPattern && dbError) {
        expect(dbPattern.pattern.errorType).toBe('DatabaseConnectionError');
        expect(dbError.errorType).toBe('DatabaseConnectionError');
      }
    });

    it('should evaluate pattern conditions correctly', async () => {
      const patterns = await advancedErrorManagementService.getPatterns('demo-org-1', { limit: 10 });
      const dbPattern = patterns.find(p => p.name === 'Database Connection Errors');

      expect(dbPattern).toBeDefined();
      if (dbPattern) {
        expect(dbPattern.pattern.errorType).toBe('DatabaseConnectionError');
        expect(dbPattern.pattern.conditions).toHaveLength(2);
        expect(dbPattern.action.type).toBe('escalate');
        expect(dbPattern.action.config.escalationLevel).toBe(2);
      }
    });
  });

  describe('Processing Methods', () => {
    it('should process new errors', async () => {
      await advancedErrorManagementService.processNewErrors();

      // This should not throw an error
      expect(true).toBe(true);
    });

    it('should collect performance metrics', async () => {
      await advancedErrorManagementService.collectPerformanceMetrics();

      // This should not throw an error
      expect(true).toBe(true);
    });

    it('should process alerts', async () => {
      await advancedErrorManagementService.processAlerts();

      // This should not throw an error
      expect(true).toBe(true);
    });
  });

  describe('Reports Generation', () => {
    it('should generate comprehensive error report', async () => {
      const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const endDate = new Date().toISOString();

      const report = await advancedErrorManagementService.generateErrorReport(
        'demo-org-1',
        'daily',
        startDate,
        endDate,
        'test-user'
      );

      expect(report).toBeDefined();
      expect(report.reportType).toBe('daily');
      expect(report.data.totalErrors).toBeGreaterThanOrEqual(0);
      expect(report.data.byCategory).toBeDefined();
      expect(report.data.bySeverity).toBeDefined();
      expect(report.data.byService).toBeDefined();
      expect(report.data.topErrors).toBeDefined();
      expect(report.data.resolutionStats).toBeDefined();
      expect(report.data.performanceImpact).toBeDefined();
      expect(report.data.businessImpact).toBeDefined();
    });

    it('should generate weekly report with trends', async () => {
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = new Date().toISOString();

      const report = await advancedErrorManagementService.generateErrorReport(
        'demo-org-1',
        'weekly',
        startDate,
        endDate,
        'test-user'
      );

      expect(report).toBeDefined();
      expect(report.reportType).toBe('weekly');
      expect(report.data.topErrors).toBeDefined();
      expect(Array.isArray(report.data.topErrors)).toBe(true);
    });

    it('should calculate performance impact correctly', async () => {
      const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const endDate = new Date().toISOString();

      const report = await advancedErrorManagementService.generateErrorReport(
        'demo-org-1',
        'daily',
        startDate,
        endDate,
        'test-user'
      );

      expect(report.data.performanceImpact.averageResponseTime).toBeGreaterThanOrEqual(0);
      expect(report.data.performanceImpact.availabilityPercentage).toBeGreaterThanOrEqual(0);
      expect(report.data.performanceImpact.throughputImpact).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Statistics', () => {
    it('should get comprehensive statistics', async () => {
      const stats = await advancedErrorManagementService.getStats('demo-org-1');

      expect(stats).toBeDefined();
      expect(stats.totalErrors).toBeGreaterThan(0);
      expect(stats.totalPatterns).toBeGreaterThan(0);
      expect(stats.totalMetrics).toBeGreaterThan(0);
      expect(stats.totalAlerts).toBeGreaterThan(0);
      expect(stats.last24Hours).toBeDefined();
      expect(stats.last7Days).toBeDefined();
      expect(stats.byStatus).toBeDefined();
      expect(stats.byCategory).toBeDefined();
      expect(stats.bySeverity).toBeDefined();
      expect(stats.byService).toBeDefined();
      expect(stats.alertStats).toBeDefined();
      expect(stats.performanceStats).toBeDefined();
    });

    it('should calculate 24-hour statistics correctly', async () => {
      const stats = await advancedErrorManagementService.getStats('demo-org-1');

      expect(stats.last24Hours.newErrors).toBeGreaterThanOrEqual(0);
      expect(stats.last24Hours.newAlerts).toBeGreaterThanOrEqual(0);
      expect(stats.last24Hours.resolvedErrors).toBeGreaterThanOrEqual(0);
      expect(stats.last24Hours.escalatedErrors).toBeGreaterThanOrEqual(0);
    });

    it('should provide alert statistics', async () => {
      const stats = await advancedErrorManagementService.getStats('demo-org-1');

      expect(stats.alertStats).toBeDefined();
      expect(stats.alertStats.active).toBeGreaterThanOrEqual(0);
      expect(stats.alertStats.acknowledged).toBeGreaterThanOrEqual(0);
      expect(stats.alertStats.resolved).toBeGreaterThanOrEqual(0);
      expect(stats.alertStats.suppressed).toBeGreaterThanOrEqual(0);
    });

    it('should provide performance statistics', async () => {
      const stats = await advancedErrorManagementService.getStats('demo-org-1');

      expect(stats.performanceStats).toBeDefined();
      expect(stats.performanceStats.normal).toBeGreaterThanOrEqual(0);
      expect(stats.performanceStats.warning).toBeGreaterThanOrEqual(0);
      expect(stats.performanceStats.critical).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error Categorization', () => {
    it('should categorize database errors correctly', async () => {
      const errors = await advancedErrorManagementService.getErrors('demo-org-1', { limit: 10 });
      const dbError = errors.find(e => e.errorType === 'DatabaseConnectionError');

      expect(dbError).toBeDefined();
      if (dbError) {
        expect(dbError.category).toBe('database');
        expect(dbError.severity).toBe('high');
        expect(dbError.impact.businessImpact).toBe('high');
      }
    });

    it('should categorize validation errors correctly', async () => {
      const errors = await advancedErrorManagementService.getErrors('demo-org-1', { limit: 10 });
      const validationError = errors.find(e => e.errorType === 'ValidationError');

      expect(validationError).toBeDefined();
      if (validationError) {
        expect(validationError.category).toBe('validation');
        expect(validationError.severity).toBe('medium');
        expect(validationError.impact.businessImpact).toBe('low');
      }
    });
  });

  describe('Business Impact Analysis', () => {
    it('should calculate business impact correctly', async () => {
      const errors = await advancedErrorManagementService.getErrors('demo-org-1', { limit: 10 });

      const highImpactErrors = errors.filter(e => e.impact.businessImpact === 'high');
      const criticalErrors = errors.filter(e => e.impact.businessImpact === 'critical');

      expect(highImpactErrors.length).toBeGreaterThan(0);
      expect(criticalErrors.length).toBeGreaterThanOrEqual(0);
    });

    it('should track revenue impact', async () => {
      const errors = await advancedErrorManagementService.getErrors('demo-org-1', { limit: 10 });

      const revenueImpactErrors = errors.filter(e => e.impact.revenueImpact && e.impact.revenueImpact > 0);

      expect(revenueImpactErrors.length).toBeGreaterThan(0);
      revenueImpactErrors.forEach(error => {
        expect(error.impact.revenueImpact).toBeGreaterThan(0);
      });
    });

    it('should track SLA impact', async () => {
      const errors = await advancedErrorManagementService.getErrors('demo-org-1', { limit: 10 });

      const slaImpactErrors = errors.filter(e => e.impact.slaImpact =);

      expect(slaImpactErrors.length).toBeGreaterThan(0);
      slaImpactErrors.forEach(error => {
        expect(error.impact.slaImpact).toBe(true);
      });
    });
  });

  describe('Performance Impact Analysis', () => {
    it('should track performance metrics in errors', async () => {
      const errors = await advancedErrorManagementService.getErrors('demo-org-1', { limit: 10 });

      const performanceErrors = errors.filter(e => e.performance && e.performance.responseTime);

      expect(performanceErrors.length).toBeGreaterThan(0);
      performanceErrors.forEach(error => {
        expect(error.performance.responseTime).toBeGreaterThan(0);
        expect(error.performance.memoryUsage).toBeGreaterThan(0);
        expect(error.performance.cpuUsage).toBeGreaterThan(0);
      });
    });

    it('should track resource usage metrics', async () => {
      const errors = await advancedErrorManagementService.getErrors('demo-org-1', { limit: 10 });

      const resourceErrors = errors.filter(e => e.performance && e.performance.databaseQueries !== undefined);

      expect(resourceErrors.length).toBeGreaterThan(0);
      resourceErrors.forEach(error => {
        expect(error.performance.databaseQueries).toBeGreaterThanOrEqual(0);
        expect(error.performance.cacheHitRate).toBeGreaterThanOrEqual(0);
        expect(error.performance.cacheHitRate).toBeLessThanOrEqual(100);
      });
    });
  });
});
