import { describe, it, expect } from 'vitest';

describe('AdvancedMetricsAlertsService - Simple Test', () => {
  it('should import the service successfully', async () => {
    // Test simple para verificar que el servicio se puede importar
    const { default: AdvancedMetricsAlertsService } = await import('../../lib/advanced-metrics-alerts.service.ts');
    
    expect(AdvancedMetricsAlertsService).toBeDefined();
    expect(typeof AdvancedMetricsAlertsService).toBe('function');
  });

  it('should create service instance', async () => {
    const { default: AdvancedMetricsAlertsService } = await import('../../lib/advanced-metrics-alerts.service.ts');
    
    const config = {
      prometheusEnabled: true,
      alertingEnabled: true,
      defaultCooldown: 300,
      maxAlertsPerRule: 100,
      retentionDays: 30,
      notificationChannels: ['email', 'slack'],
      slaMonitoring: true,
      trendAnalysis: true
    };

    const service = new AdvancedMetricsAlertsService(config);
    
    expect(service).toBeDefined();
    expect(typeof service.collectMetrics).toBe('function');
    expect(typeof service.getMetrics).toBe('function');
    expect(typeof service.createAlertRule).toBe('function');
    expect(typeof service.listAlertRules).toBe('function');
    expect(typeof service.getAlerts).toBe('function');
    expect(typeof service.createSLA).toBe('function');
    expect(typeof service.listSLAs).toBe('function');
    expect(typeof service.getMetricsStatistics).toBe('function');
    expect(typeof service.generateMetricsReport).toBe('function');
  });

  it('should collect metrics', async () => {
    const { default: AdvancedMetricsAlertsService } = await import('../../lib/advanced-metrics-alerts.service.ts');
    
    const config = {
      prometheusEnabled: true,
      alertingEnabled: true,
      defaultCooldown: 300,
      maxAlertsPerRule: 100,
      retentionDays: 30,
      notificationChannels: ['email', 'slack'],
      slaMonitoring: true,
      trendAnalysis: true
    };

    const service = new AdvancedMetricsAlertsService(config);
    const metrics = await service.collectMetrics();
    
    expect(Array.isArray(metrics)).toBe(true);
    expect(metrics.length).toBeGreaterThan(0);
  });

  it('should list alert rules', async () => {
    const { default: AdvancedMetricsAlertsService } = await import('../../lib/advanced-metrics-alerts.service.ts');
    
    const config = {
      prometheusEnabled: true,
      alertingEnabled: true,
      defaultCooldown: 300,
      maxAlertsPerRule: 100,
      retentionDays: 30,
      notificationChannels: ['email', 'slack'],
      slaMonitoring: true,
      trendAnalysis: true
    };

    const service = new AdvancedMetricsAlertsService(config);
    const rules = await service.listAlertRules();
    
    expect(Array.isArray(rules)).toBe(true);
    expect(rules.length).toBeGreaterThan(0);
  });

  it('should list SLAs', async () => {
    const { default: AdvancedMetricsAlertsService } = await import('../../lib/advanced-metrics-alerts.service.ts');
    
    const config = {
      prometheusEnabled: true,
      alertingEnabled: true,
      defaultCooldown: 300,
      maxAlertsPerRule: 100,
      retentionDays: 30,
      notificationChannels: ['email', 'slack'],
      slaMonitoring: true,
      trendAnalysis: true
    };

    const service = new AdvancedMetricsAlertsService(config);
    const slas = await service.listSLAs();
    
    expect(Array.isArray(slas)).toBe(true);
    expect(slas.length).toBeGreaterThan(0);
  });

  it('should get metrics statistics', async () => {
    const { default: AdvancedMetricsAlertsService } = await import('../../lib/advanced-metrics-alerts.service.ts');
    
    const config = {
      prometheusEnabled: true,
      alertingEnabled: true,
      defaultCooldown: 300,
      maxAlertsPerRule: 100,
      retentionDays: 30,
      notificationChannels: ['email', 'slack'],
      slaMonitoring: true,
      trendAnalysis: true
    };

    const service = new AdvancedMetricsAlertsService(config);
    const statistics = await service.getMetricsStatistics();
    
    expect(statistics).toBeDefined();
    expect(typeof statistics.totalMetrics).toBe('number');
    expect(typeof statistics.totalAlerts).toBe('number');
    expect(typeof statistics.totalRules).toBe('number');
    expect(typeof statistics.totalSLAs).toBe('number');
  });
});
