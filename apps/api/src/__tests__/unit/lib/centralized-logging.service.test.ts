import { describe, it, expect, beforeEach, vi } from 'vitest';
import CentralizedLoggingService, { 
  LogEntry, 
  LogQuery, 
  LogAggregation, 
  LogAlertRule, 
  LogRetentionPolicy, 
  CentralizedLoggingConfig 
} from '../../lib/centralized-logging.service.ts.js';

// Mock del logger
vi.mock('../../lib/logger.ts', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  }
}));

describe('CentralizedLoggingService', () => {
  let service: CentralizedLoggingService;
  let config: CentralizedLoggingConfig;

  beforeEach(() => {
    config = {
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

    service = new CentralizedLoggingService(config);
  });

  describe('Log Management', () => {
    it('should write log entry', async () => {
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
      expect(logEntry.context).toEqual({ test: 'value' });
      expect(logEntry.userId).toBe('user-123');
      expect(logEntry.organizationId).toBe('org-456');
    });

    it('should search logs with filters', async () => {
      // Escribir algunos logs de prueba
      await service.writeLog({
        level: 'INFO',
        message: 'Info message',
        service: 'service-1',
        environment: 'test'
      });

      await service.writeLog({
        level: 'ERROR',
        message: 'Error message',
        service: 'service-2',
        environment: 'test'
      });

      await service.writeLog({
        level: 'WARN',
        message: 'Warning message',
        service: 'service-1',
        environment: 'production'
      });

      // Buscar por nivel
      const errorLogs = await service.searchLogs({ level: 'ERROR' });
      expect(errorLogs.logs.length).toBe(1);
      expect(errorLogs.logs[0].level).toBe('ERROR');

      // Buscar por servicio
      const service1Logs = await service.searchLogs({ service: 'service-1' });
      expect(service1Logs.logs.length).toBe(2);

      // Buscar por ambiente
      const testLogs = await service.searchLogs({ environment: 'test' });
      expect(testLogs.logs.length).toBe(2);

      // Buscar por mensaje
      const errorMessageLogs = await service.searchLogs({ message: 'Error' });
      expect(errorMessageLogs.logs.length).toBe(1);
    });

    it('should aggregate logs', async () => {
      // Escribir logs de prueba
      await service.writeLog({
        level: 'INFO',
        message: 'Info message 1',
        service: 'service-1',
        environment: 'test'
      });

      await service.writeLog({
        level: 'ERROR',
        message: 'Error message 1',
        service: 'service-2',
        environment: 'test'
      });

      await service.writeLog({
        level: 'INFO',
        message: 'Info message 2',
        service: 'service-1',
        environment: 'production'
      });

      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      const aggregation: LogAggregation = {
        groupBy: ['level', 'service', 'environment'],
        timeRange: {
          start: oneHourAgo,
          end: now
        }
      };

      const result = await service.aggregateLogs(aggregation);

      expect(result).toBeDefined();
      expect(result.level).toBeDefined();
      expect(result.service).toBeDefined();
      expect(result.environment).toBeDefined();
    });
  });

  describe('Alert Rules Management', () => {
    it('should create alert rule', async () => {
      const ruleData = {
        name: 'Test Alert Rule',
        description: 'Test alert rule description',
        pattern: 'ERROR|FATAL',
        level: 'ERROR' as const,
        threshold: 5,
        window: 300,
        enabled: true,
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
      expect(rule.pattern).toBe('ERROR|FATAL');
      expect(rule.level).toBe('ERROR');
      expect(rule.threshold).toBe(5);
      expect(rule.window).toBe(300);
      expect(rule.enabled).toBe(true);
    });

    it('should get alert rule by id', async () => {
      const ruleData = {
        name: 'Test Alert Rule 2',
        description: 'Test alert rule description 2',
        pattern: 'database.*error',
        threshold: 3,
        window: 60,
        enabled: true,
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
        pattern: 'pattern1',
        threshold: 1,
        window: 60,
        enabled: true,
        actions: []
      });

      const rule2 = await service.createAlertRule({
        name: 'Rule 2',
        description: 'Description 2',
        pattern: 'pattern2',
        threshold: 2,
        window: 120,
        enabled: true,
        actions: []
      });

      const rules = await service.listAlertRules();

      expect(rules).toHaveLength(4); // 2 created + 2 default
      expect(rules.some(r => r.id === rule1.id)).toBe(true);
      expect(rules.some(r => r.id === rule2.id)).toBe(true);
    });

    it('should update alert rule', async () => {
      const ruleData = {
        name: 'Original Rule',
        description: 'Original description',
        pattern: 'original-pattern',
        threshold: 5,
        window: 300,
        enabled: true,
        actions: []
      };

      const createdRule = await service.createAlertRule(ruleData);
      const updatedRule = await service.updateAlertRule(createdRule.id, {
        name: 'Updated Rule',
        description: 'Updated description',
        threshold: 10
      });

      expect(updatedRule).toBeDefined();
      expect(updatedRule?.name).toBe('Updated Rule');
      expect(updatedRule?.description).toBe('Updated description');
      expect(updatedRule?.threshold).toBe(10);
    });

    it('should delete alert rule', async () => {
      const ruleData = {
        name: 'To Delete Rule',
        description: 'Will be deleted',
        pattern: 'delete-pattern',
        threshold: 1,
        window: 60,
        enabled: true,
        actions: []
      };

      const createdRule = await service.createAlertRule(ruleData);
      const deleted = await service.deleteAlertRule(createdRule.id);

      expect(deleted).toBe(true);

      const retrievedRule = await service.getAlertRule(createdRule.id);
      expect(retrievedRule).toBeNull();
    });
  });

  describe('Retention Policies Management', () => {
    it('should create retention policy', async () => {
      const policyData = {
        name: 'Test Retention Policy',
        description: 'Test retention policy description',
        service: 'test-service',
        retentionDays: 30,
        enabled: true,
        compressionEnabled: true,
        archiveEnabled: false
      };

      const policy = await service.createRetentionPolicy(policyData);

      expect(policy).toBeDefined();
      expect(policy.id).toBeDefined();
      expect(policy.name).toBe('Test Retention Policy');
      expect(policy.description).toBe('Test retention policy description');
      expect(policy.service).toBe('test-service');
      expect(policy.retentionDays).toBe(30);
      expect(policy.enabled).toBe(true);
      expect(policy.compressionEnabled).toBe(true);
      expect(policy.archiveEnabled).toBe(false);
    });

    it('should get retention policy by id', async () => {
      const policyData = {
        name: 'Test Retention Policy 2',
        description: 'Test retention policy description 2',
        environment: 'test',
        retentionDays: 60,
        enabled: true
      };

      const createdPolicy = await service.createRetentionPolicy(policyData);
      const retrievedPolicy = await service.getRetentionPolicy(createdPolicy.id);

      expect(retrievedPolicy).toBeDefined();
      expect(retrievedPolicy?.id).toBe(createdPolicy.id);
      expect(retrievedPolicy?.name).toBe('Test Retention Policy 2');
    });

    it('should return null for non-existent retention policy', async () => {
      const policy = await service.getRetentionPolicy('non-existent-id');
      expect(policy).toBeNull();
    });

    it('should list all retention policies', async () => {
      const policy1 = await service.createRetentionPolicy({
        name: 'Policy 1',
        description: 'Description 1',
        retentionDays: 30,
        enabled: true
      });

      const policy2 = await service.createRetentionPolicy({
        name: 'Policy 2',
        description: 'Description 2',
        retentionDays: 60,
        enabled: true
      });

      const policies = await service.listRetentionPolicies();

      expect(policies).toHaveLength(4); // 2 created + 2 default
      expect(policies.some(p => p.id === policy1.id)).toBe(true);
      expect(policies.some(p => p.id === policy2.id)).toBe(true);
    });

    it('should update retention policy', async () => {
      const policyData = {
        name: 'Original Policy',
        description: 'Original description',
        retentionDays: 30,
        enabled: true
      };

      const createdPolicy = await service.createRetentionPolicy(policyData);
      const updatedPolicy = await service.updateRetentionPolicy(createdPolicy.id, {
        name: 'Updated Policy',
        description: 'Updated description',
        retentionDays: 60
      });

      expect(updatedPolicy).toBeDefined();
      expect(updatedPolicy?.name).toBe('Updated Policy');
      expect(updatedPolicy?.description).toBe('Updated description');
      expect(updatedPolicy?.retentionDays).toBe(60);
    });

    it('should delete retention policy', async () => {
      const policyData = {
        name: 'To Delete Policy',
        description: 'Will be deleted',
        retentionDays: 30,
        enabled: true
      };

      const createdPolicy = await service.createRetentionPolicy(policyData);
      const deleted = await service.deleteRetentionPolicy(createdPolicy.id);

      expect(deleted).toBe(true);

      const retrievedPolicy = await service.getRetentionPolicy(createdPolicy.id);
      expect(retrievedPolicy).toBeNull();
    });

    it('should apply retention policies', async () => {
      const result = await service.applyRetentionPolicies();

      expect(result).toBeDefined();
      expect(typeof result.deleted).toBe('number');
      expect(typeof result.archived).toBe('number');
      expect(typeof result.compressed).toBe('number');
    });
  });

  describe('Statistics and Reports', () => {
    it('should get log statistics', async () => {
      // Escribir algunos logs de prueba
      await service.writeLog({
        level: 'INFO',
        message: 'Info message',
        service: 'service-1',
        environment: 'test'
      });

      await service.writeLog({
        level: 'ERROR',
        message: 'Error message',
        service: 'service-2',
        environment: 'test'
      });

      const statistics = await service.getLogStatistics();

      expect(statistics).toBeDefined();
      expect(typeof statistics.totalLogs).toBe('number');
      expect(typeof statistics.logsByLevel).toBe('object');
      expect(typeof statistics.logsByService).toBe('object');
      expect(typeof statistics.logsByEnvironment).toBe('object');
      expect(typeof statistics.averageLogSize).toBe('number');
      expect(typeof statistics.errorRate).toBe('number');
      expect(Array.isArray(statistics.topErrors)).toBe(true);
      expect(Array.isArray(statistics.logVolume)).toBe(true);
    });

    it('should generate hourly report', async () => {
      const report = await service.generateLogReport('hourly');

      expect(report).toBeDefined();
      expect(report.period).toBe('hourly');
      expect(report.generatedAt).toBeInstanceOf(Date);
      expect(report.summary).toBeDefined();
      expect(Array.isArray(report.topErrors)).toBe(true);
      expect(typeof report.serviceBreakdown).toBe('object');
      expect(typeof report.levelBreakdown).toBe('object');
      expect(Array.isArray(report.recommendations)).toBe(true);
    });

    it('should generate daily report', async () => {
      const report = await service.generateLogReport('daily');

      expect(report).toBeDefined();
      expect(report.period).toBe('daily');
      expect(report.generatedAt).toBeInstanceOf(Date);
    });

    it('should generate weekly report', async () => {
      const report = await service.generateLogReport('weekly');

      expect(report).toBeDefined();
      expect(report.period).toBe('weekly');
      expect(report.generatedAt).toBeInstanceOf(Date);
    });

    it('should generate monthly report', async () => {
      const report = await service.generateLogReport('monthly');

      expect(report).toBeDefined();
      expect(report.period).toBe('monthly');
      expect(report.generatedAt).toBeInstanceOf(Date);
    });
  });

  describe('Configuration Management', () => {
    it('should update configuration', async () => {
      const updates = {
        logLevel: 'debug',
        batchSize: 50,
        flushInterval: 10
      };

      const updatedConfig = await service.updateConfig(updates);

      expect(updatedConfig).toBeDefined();
      expect(updatedConfig.logLevel).toBe('debug');
      expect(updatedConfig.batchSize).toBe(50);
      expect(updatedConfig.flushInterval).toBe(10);
    });

    it('should get configuration', async () => {
      const config = await service.getConfig();

      expect(config).toBeDefined();
      expect(typeof config.elasticsearchEnabled).toBe('boolean');
      expect(typeof config.applicationInsightsEnabled).toBe('boolean');
      expect(typeof config.fileLoggingEnabled).toBe('boolean');
      expect(typeof config.consoleLoggingEnabled).toBe('boolean');
      expect(typeof config.logLevel).toBe('string');
      expect(typeof config.maxLogSize).toBe('number');
      expect(typeof config.maxLogFiles).toBe('number');
      expect(typeof config.retentionDays).toBe('number');
      expect(typeof config.compressionEnabled).toBe('boolean');
      expect(typeof config.archiveEnabled).toBe('boolean');
      expect(typeof config.alertingEnabled).toBe('boolean');
      expect(typeof config.realTimeProcessing).toBe('boolean');
      expect(typeof config.batchSize).toBe('number');
      expect(typeof config.flushInterval).toBe('number');
    });
  });

  describe('Initialization', () => {
    it('should initialize with default alert rules', async () => {
      const rules = await service.listAlertRules();
      expect(rules.length).toBeGreaterThan(0);
      
      const highErrorRateRule = rules.find(r => r.name === 'High Error Rate');
      expect(highErrorRateRule).toBeDefined();
      expect(highErrorRateRule?.pattern).toBe('ERROR|FATAL');
    });

    it('should initialize with default retention policies', async () => {
      const policies = await service.listRetentionPolicies();
      expect(policies.length).toBeGreaterThan(0);
      
      const defaultPolicy = policies.find(p => p.name === 'Default Retention Policy');
      expect(defaultPolicy).toBeDefined();
      expect(defaultPolicy?.retentionDays).toBe(30);
    });
  });

  describe('Error Handling', () => {
    it('should handle log writing errors gracefully', async () => {
      // Los métodos están diseñados para manejar errores internamente
      const logEntry = await service.writeLog({
        level: 'INFO',
        message: 'Test message',
        service: 'test-service',
        environment: 'test'
      });

      expect(logEntry).toBeDefined();
    });

    it('should handle search errors gracefully', async () => {
      const result = await service.searchLogs({});
      expect(Array.isArray(result.logs)).toBe(true);
    });

    it('should handle aggregation errors gracefully', async () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      const aggregation: LogAggregation = {
        groupBy: ['level'],
        timeRange: {
          start: oneHourAgo,
          end: now
        }
      };

      const result = await service.aggregateLogs(aggregation);
      expect(result).toBeDefined();
    });
  });

  describe('Cleanup', () => {
    it('should cleanup resources', async () => {
      await service.cleanup();
      // No hay assertions específicas, solo verificar que no lance errores
    });
  });
});
