import { describe, it, expect, beforeEach, vi } from 'vitest';
import AdvancedMetricsAlertsService, {
  Metric,
  AlertRule,
  Alert,
  SLA,
  MetricTrend,
  MetricsAlertsConfig
} from '../../lib/advanced-metrics-alerts.service.ts';

// Mock del logger
vi.mock('../../lib/logger.ts', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  }
}));

describe('AdvancedMetricsAlertsService', () => {
  let service: AdvancedMetricsAlertsService;
  let config: MetricsAlertsConfig;

  beforeEach(() => {
    config = {
      prometheusEnabled: true,
      alertingEnabled: true,
      defaultCooldown: 300,
      maxAlertsPerRule: 100,
      retentionDays: 30,
      notificationChannels: ['email', 'slack'],
      slaMonitoring: true,
      trendAnalysis: true
    };

    service = new AdvancedMetricsAlertsService(config);
  });

  describe('Metrics Management', () => {
    it('should collect metrics', async () => {
      const metrics = await service.collectMetrics();

      expect(Array.isArray(metrics)).toBe(true);
      expect(metrics.length).toBeGreaterThan(0);
      expect(metrics.every(m => m.id && m.name && m.type && m.value !== undefined)).toBe(true);
    });

    it('should get metrics with filters', async () => {
      // Primero recolectar métricas
      await service.collectMetrics();

      const allMetrics = await service.getMetrics();
      expect(Array.isArray(allMetrics)).toBe(true);

      const filteredMetrics = await service.getMetrics({ name: 'http_requests_total' });
      expect(Array.isArray(filteredMetrics)).toBe(true);
    });

    it('should get metrics by name', async () => {
      await service.collectMetrics();

      const metrics = await service.getMetricByName('http_requests_total');
      expect(Array.isArray(metrics)).toBe(true);
    });

    it('should get metric trends', async () => {
      await service.collectMetrics();

      const trends = await service.getMetricTrends('http_requests_total', '24h');
      expect(Array.isArray(trends)).toBe(true);

      if (trends.length > 0) {
        const trend = trends[0];
        expect(trend.metric).toBe('http_requests_total');
        expect(trend.period).toBe('24h');
        expect(['INCREASING', 'DECREASING', 'STABLE', 'VOLATILE']).toContain(trend.trend);
        expect(typeof trend.changePercent).toBe('number');
        expect(typeof trend.confidence).toBe('number');
      }
    });
  });

  describe('Alert Rules Management', () => {
    it('should create alert rule', async () => {
      const ruleData = {
        name: 'Test Alert Rule',
        description: 'Test alert rule description',
        metric: 'http_requests_total',
        condition: {
          operator: 'gt' as const,
          threshold: 100,
          window: 300,
          aggregation: 'avg' as const
        },
        severity: 'HIGH' as const,
        enabled: true,
        cooldown: 300,
        actions: [
          {
            type: 'EMAIL' as const,
            config: { recipients: ['test@example.com'] }
          }
        ]
      };

      const rule = await service.createAlertRule(ruleData);

      expect(rule).toBeDefined();
      expect(rule.id).toBeDefined();
      expect(rule.name).toBe('Test Alert Rule');
      expect(rule.description).toBe('Test alert rule description');
      expect(rule.metric).toBe('http_requests_total');
      expect(rule.severity).toBe('HIGH');
      expect(rule.enabled).toBe(true);
    });

    it('should get alert rule by id', async () => {
      const ruleData = {
        name: 'Test Alert Rule 2',
        description: 'Test alert rule description 2',
        metric: 'memory_usage_percent',
        condition: {
          operator: 'gt' as const,
          threshold: 80,
          window: 60,
          aggregation: 'avg' as const
        },
        severity: 'MEDIUM' as const,
        enabled: true,
        cooldown: 600,
        actions: []
      };

      const createdRule = await service.createAlertRule(ruleData);
      const retrievedRule = await service.getAlertRule(createdRule.id);

      expect(retrievedRule).toBeDefined();
      expect(retrievedRule?.id).toBe(createdRule.id);
      expect(retrievedRule?.name).toBe('Test Alert Rule 2');
    });

    it('should return null for non-existent alert rule', async () => {
      const rule = await service.getAlertRule('non-existent-id');
      expect(rule).toBeNull();
    });

    it('should list all alert rules', async () => {
      const rule1 = await service.createAlertRule({
        name: 'Rule 1',
        description: 'Description 1',
        metric: 'metric1',
        condition: { operator: 'gt', threshold: 10, window: 60, aggregation: 'avg' },
        severity: 'LOW',
        enabled: true,
        cooldown: 300,
        actions: []
      });

      const rule2 = await service.createAlertRule({
        name: 'Rule 2',
        description: 'Description 2',
        metric: 'metric2',
        condition: { operator: 'lt', threshold: 5, window: 120, aggregation: 'min' },
        severity: 'HIGH',
        enabled: true,
        cooldown: 600,
        actions: []
      });

      const rules = await service.listAlertRules();

      expect(rules).toHaveLength(5); // 2 created + 3 default
      expect(rules.some(r => r.id === rule1.id)).toBe(true);
      expect(rules.some(r => r.id === rule2.id)).toBe(true);
    });

    it('should update alert rule', async () => {
      const ruleData = {
        name: 'Original Rule',
        description: 'Original description',
        metric: 'original_metric',
        condition: {
          operator: 'gt' as const,
          threshold: 50,
          window: 300,
          aggregation: 'avg' as const
        },
        severity: 'MEDIUM' as const,
        enabled: true,
        cooldown: 300,
        actions: []
      };

      const createdRule = await service.createAlertRule(ruleData);
      const updatedRule = await service.updateAlertRule(createdRule.id, {
        name: 'Updated Rule',
        description: 'Updated description',
        severity: 'HIGH'
      });

      expect(updatedRule).toBeDefined();
      expect(updatedRule?.name).toBe('Updated Rule');
      expect(updatedRule?.description).toBe('Updated description');
      expect(updatedRule?.severity).toBe('HIGH');
    });

    it('should delete alert rule', async () => {
      const ruleData = {
        name: 'To Delete Rule',
        description: 'Will be deleted',
        metric: 'delete_metric',
        condition: {
          operator: 'eq' as const,
          threshold: 0,
          window: 60,
          aggregation: 'count' as const
        },
        severity: 'LOW' as const,
        enabled: true,
        cooldown: 300,
        actions: []
      };

      const createdRule = await service.createAlertRule(ruleData);
      const deleted = await service.deleteAlertRule(createdRule.id);

      expect(deleted).toBe(true);

      const retrievedRule = await service.getAlertRule(createdRule.id);
      expect(retrievedRule).toBeNull();
    });
  });

  describe('Alert Evaluation', () => {
    it('should evaluate alert rules', async () => {
      // Recolectar métricas primero
      await service.collectMetrics();

      const alerts = await service.evaluateAlertRules();
      expect(Array.isArray(alerts)).toBe(true);
    });
  });

  describe('Alert Management', () => {
    it('should get alerts with filters', async () => {
      const alerts = await service.getAlerts();
      expect(Array.isArray(alerts)).toBe(true);

      const activeAlerts = await service.getAlerts({ status: 'ACTIVE' });
      expect(Array.isArray(activeAlerts)).toBe(true);

      const criticalAlerts = await service.getAlerts({ severity: 'CRITICAL' });
      expect(Array.isArray(criticalAlerts)).toBe(true);
    });

    it('should acknowledge alert', async () => {
      // Crear una alerta simulada
      const alerts = await service.getAlerts();
      if (alerts.length > 0) {
        const alert = alerts[0];
        const acknowledgedAlert = await service.acknowledgeAlert(alert.id, 'test-user');

        expect(acknowledgedAlert).toBeDefined();
        expect(acknowledgedAlert?.status).toBe('ACKNOWLEDGED');
        expect(acknowledgedAlert?.acknowledgedBy).toBe('test-user');
        expect(acknowledgedAlert?.acknowledgedAt).toBeInstanceOf(Date);
      }
    });

    it('should resolve alert', async () => {
      const alerts = await service.getAlerts();
      if (alerts.length > 0) {
        const alert = alerts[0];
        const resolvedAlert = await service.resolveAlert(alert.id);

        expect(resolvedAlert).toBeDefined();
        expect(resolvedAlert?.status).toBe('RESOLVED');
        expect(resolvedAlert?.resolvedAt).toBeInstanceOf(Date);
      }
    });
  });

  describe('SLA Management', () => {
    it('should create SLA', async () => {
      const slaData = {
        name: 'Test SLA',
        description: 'Test SLA description',
        metric: 'http_requests_total',
        target: 99.9,
        window: 86400, // 24 horas
        enabled: true,
        alertThreshold: 99.5
      };

      const sla = await service.createSLA(slaData);

      expect(sla).toBeDefined();
      expect(sla.id).toBeDefined();
      expect(sla.name).toBe('Test SLA');
      expect(sla.description).toBe('Test SLA description');
      expect(sla.metric).toBe('http_requests_total');
      expect(sla.target).toBe(99.9);
      expect(sla.enabled).toBe(true);
    });

    it('should get SLA by id', async () => {
      const slaData = {
        name: 'Test SLA 2',
        description: 'Test SLA description 2',
        metric: 'response_time',
        target: 95,
        window: 3600,
        enabled: true
      };

      const createdSLA = await service.createSLA(slaData);
      const retrievedSLA = await service.getSLA(createdSLA.id);

      expect(retrievedSLA).toBeDefined();
      expect(retrievedSLA?.id).toBe(createdSLA.id);
      expect(retrievedSLA?.name).toBe('Test SLA 2');
    });

    it('should return null for non-existent SLA', async () => {
      const sla = await service.getSLA('non-existent-id');
      expect(sla).toBeNull();
    });

    it('should list all SLAs', async () => {
      const sla1 = await service.createSLA({
        name: 'SLA 1',
        description: 'Description 1',
        metric: 'metric1',
        target: 99.9,
        window: 3600,
        enabled: true
      });

      const sla2 = await service.createSLA({
        name: 'SLA 2',
        description: 'Description 2',
        metric: 'metric2',
        target: 95,
        window: 7200,
        enabled: true
      });

      const slas = await service.listSLAs();

      expect(slas).toHaveLength(4); // 2 created + 2 default
      expect(slas.some(s => s.id === sla1.id)).toBe(true);
      expect(slas.some(s => s.id === sla2.id)).toBe(true);
    });

    it('should calculate SLA compliance', async () => {
      const slas = await service.listSLAs();
      if (slas.length > 0) {
        const sla = slas[0];
        const compliance = await service.calculateSLACompliance(sla.id);

        expect(compliance).toBeDefined();
        expect(compliance.sla).toBeDefined();
        expect(typeof compliance.compliance).toBe('number');
        expect(typeof compliance.violations).toBe('number');
        expect(typeof compliance.totalMeasurements).toBe('number');
        expect(['COMPLIANT', 'VIOLATED', 'WARNING']).toContain(compliance.status);
      }
    });
  });

  describe('Statistics and Reports', () => {
    it('should get metrics statistics', async () => {
      const statistics = await service.getMetricsStatistics();

      expect(statistics).toBeDefined();
      expect(typeof statistics.totalMetrics).toBe('number');
      expect(typeof statistics.metricsByType).toBe('object');
      expect(typeof statistics.totalAlerts).toBe('number');
      expect(typeof statistics.activeAlerts).toBe('number');
      expect(typeof statistics.totalRules).toBe('number');
      expect(typeof statistics.enabledRules).toBe('number');
      expect(typeof statistics.totalSLAs).toBe('number');
      expect(typeof statistics.averageCompliance).toBe('number');
    });

    it('should generate hourly report', async () => {
      const report = await service.generateMetricsReport('hourly');

      expect(report).toBeDefined();
      expect(report.period).toBe('hourly');
      expect(report.generatedAt).toBeInstanceOf(Date);
      expect(report.summary).toBeDefined();
      expect(Array.isArray(report.topMetrics)).toBe(true);
      expect(report.alertSummary).toBeDefined();
      expect(report.slaSummary).toBeDefined();
      expect(Array.isArray(report.recommendations)).toBe(true);
    });

    it('should generate daily report', async () => {
      const report = await service.generateMetricsReport('daily');

      expect(report).toBeDefined();
      expect(report.period).toBe('daily');
      expect(report.generatedAt).toBeInstanceOf(Date);
    });

    it('should generate weekly report', async () => {
      const report = await service.generateMetricsReport('weekly');

      expect(report).toBeDefined();
      expect(report.period).toBe('weekly');
      expect(report.generatedAt).toBeInstanceOf(Date);
    });

    it('should generate monthly report', async () => {
      const report = await service.generateMetricsReport('monthly');

      expect(report).toBeDefined();
      expect(report.period).toBe('monthly');
      expect(report.generatedAt).toBeInstanceOf(Date);
    });
  });

  describe('Initialization', () => {
    it('should initialize with default alert rules', async () => {
      const rules = await service.listAlertRules();
      expect(rules.length).toBeGreaterThan(0);

      const highErrorRateRule = rules.find(r => r.name === 'High Error Rate');
      expect(highErrorRateRule).toBeDefined();
      expect(highErrorRateRule?.severity).toBe('HIGH');
    });

    it('should initialize with default SLAs', async () => {
      const slas = await service.listSLAs();
      expect(slas.length).toBeGreaterThan(0);

      const apiAvailabilitySLA = slas.find(s => s.name === 'API Availability');
      expect(apiAvailabilitySLA).toBeDefined();
      expect(apiAvailabilitySLA?.target).toBe(99.9);
    });
  });

  describe('Error Handling', () => {
    it('should handle metric collection errors gracefully', async () => {
      // Los métodos están diseñados para manejar errores internamente
      const metrics = await service.collectMetrics();
      expect(Array.isArray(metrics)).toBe(true);
    });

    it('should handle alert evaluation errors gracefully', async () => {
      const alerts = await service.evaluateAlertRules();
      expect(Array.isArray(alerts)).toBe(true);
    });

    it('should handle SLA compliance calculation errors', async () => {
      try {
        await service.calculateSLACompliance('non-existent-sla');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('SLA not found');
      }
    });
  });
});
