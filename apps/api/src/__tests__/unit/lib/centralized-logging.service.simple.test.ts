import { describe, it, expect } from 'vitest';

describe('CentralizedLoggingService - Simple Test', () => {
  it('should import the service successfully', async () => {
    // Test simple para verificar que el servicio se puede importar
    const { default: CentralizedLoggingService } = await import('../../lib/centralized-logging.service.ts');

    expect(CentralizedLoggingService).toBeDefined();
    expect(typeof CentralizedLoggingService).toBe('function');
  });

  it('should create service instance', async () => {
    const { default: CentralizedLoggingService } = await import('../../lib/centralized-logging.service.ts');

    const config = {
      elasticsearchEnabled: true,
      applicationInsightsEnabled: true,
      fileLoggingEnabled: true,
      consoleLoggingEnabled: true,
      logLevel: 'info',
      maxLogSize: 10 * 1024 * 1024,
      maxLogFiles: 10,
      retentionDays: 30,
      compressionEnabled: true,
      archiveEnabled: false,
      alertingEnabled: true,
      realTimeProcessing: true,
      batchSize: 100,
      flushInterval: 5
    };

    const service = new CentralizedLoggingService(config);

    expect(service).toBeDefined();
    expect(typeof service.writeLog).toBe('function');
    expect(typeof service.searchLogs).toBe('function');
    expect(typeof service.aggregateLogs).toBe('function');
    expect(typeof service.createAlertRule).toBe('function');
    expect(typeof service.listAlertRules).toBe('function');
    expect(typeof service.createRetentionPolicy).toBe('function');
    expect(typeof service.listRetentionPolicies).toBe('function');
    expect(typeof service.getLogStatistics).toBe('function');
    expect(typeof service.generateLogReport).toBe('function');
  });

  it('should write log entry', async () => {
    const { default: CentralizedLoggingService } = await import('../../lib/centralized-logging.service.ts');

    const config = {
      elasticsearchEnabled: true,
      applicationInsightsEnabled: true,
      fileLoggingEnabled: true,
      consoleLoggingEnabled: true,
      logLevel: 'info',
      maxLogSize: 10 * 1024 * 1024,
      maxLogFiles: 10,
      retentionDays: 30,
      compressionEnabled: true,
      archiveEnabled: false,
      alertingEnabled: true,
      realTimeProcessing: true,
      batchSize: 100,
      flushInterval: 5
    };

    const service = new CentralizedLoggingService(config);

    const logData = {
      level: 'INFO' as const,
      message: 'Test log message',
      service: 'test-service',
      environment: 'test',
      context: { test: 'value' },
      userId: 'user-123',
      organizationId: 'org-456'
    };

    const logEntry = await service.writeLog(logData);

    expect(logEntry).toBeDefined();
    expect(logEntry.id).toBeDefined();
    expect(logEntry.timestamp).toBeInstanceOf(Date);
    expect(logEntry.level).toBe('INFO');
    expect(logEntry.message).toBe('Test log message');
    expect(logEntry.service).toBe('test-service');
    expect(logEntry.environment).toBe('test');
  });

  it('should list alert rules', async () => {
    const { default: CentralizedLoggingService } = await import('../../lib/centralized-logging.service.ts');

    const config = {
      elasticsearchEnabled: true,
      applicationInsightsEnabled: true,
      fileLoggingEnabled: true,
      consoleLoggingEnabled: true,
      logLevel: 'info',
      maxLogSize: 10 * 1024 * 1024,
      maxLogFiles: 10,
      retentionDays: 30,
      compressionEnabled: true,
      archiveEnabled: false,
      alertingEnabled: true,
      realTimeProcessing: true,
      batchSize: 100,
      flushInterval: 5
    };

    const service = new CentralizedLoggingService(config);
    const rules = await service.listAlertRules();

    expect(Array.isArray(rules)).toBe(true);
    expect(rules.length).toBeGreaterThan(0);
  });

  it('should list retention policies', async () => {
    const { default: CentralizedLoggingService } = await import('../../lib/centralized-logging.service.ts');

    const config = {
      elasticsearchEnabled: true,
      applicationInsightsEnabled: true,
      fileLoggingEnabled: true,
      consoleLoggingEnabled: true,
      logLevel: 'info',
      maxLogSize: 10 * 1024 * 1024,
      maxLogFiles: 10,
      retentionDays: 30,
      compressionEnabled: true,
      archiveEnabled: false,
      alertingEnabled: true,
      realTimeProcessing: true,
      batchSize: 100,
      flushInterval: 5
    };

    const service = new CentralizedLoggingService(config);
    const policies = await service.listRetentionPolicies();

    expect(Array.isArray(policies)).toBe(true);
    expect(policies.length).toBeGreaterThan(0);
  });

  it('should get log statistics', async () => {
    const { default: CentralizedLoggingService } = await import('../../lib/centralized-logging.service.ts');

    const config = {
      elasticsearchEnabled: true,
      applicationInsightsEnabled: true,
      fileLoggingEnabled: true,
      consoleLoggingEnabled: true,
      logLevel: 'info',
      maxLogSize: 10 * 1024 * 1024,
      maxLogFiles: 10,
      retentionDays: 30,
      compressionEnabled: true,
      archiveEnabled: false,
      alertingEnabled: true,
      realTimeProcessing: true,
      batchSize: 100,
      flushInterval: 5
    };

    const service = new CentralizedLoggingService(config);
    const statistics = await service.getLogStatistics();

    expect(statistics).toBeDefined();
    expect(typeof statistics.totalLogs).toBe('number');
    expect(typeof statistics.logsByLevel).toBe('object');
    expect(typeof statistics.logsByService).toBe('object');
    expect(typeof statistics.logsByEnvironment).toBe('object');
    expect(typeof statistics.averageLogSize).toBe('number');
    expect(typeof statistics.errorRate).toBe('number');
  });
});
