import { describe, it, expect, beforeEach, vi } from 'vitest';
import AutomatedTestingService, {
  TestSuite,
  SecretRotation,
  SecurityChecklist,
  AutomatedTestingConfig
} from '../../lib/automated-testing.service.ts';

// Mock del logger
vi.mock('../../lib/logger.ts', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  }
}));

describe('AutomatedTestingService', () => {
  let service: AutomatedTestingService;
  let config: AutomatedTestingConfig;

  beforeEach(() => {
    config = {
      testSuites: ['default-suite'],
      secretRotationInterval: 90,
      securityCheckInterval: 30,
      maxConcurrentTests: 5,
      timeoutMs: 30000,
      retryAttempts: 3,
      notificationChannels: ['email', 'slack']
    };

    service = new AutomatedTestingService(config);
  });

  describe('Test Suites Management', () => {
    it('should create a test suite', async () => {
      const suiteData = {
        name: 'Test Suite 1',
        description: 'Test suite description',
        tests: [
          {
            id: 'test-1',
            testName: 'Test 1',
            status: 'PASSED' as const,
            message: 'Test passed',
            duration: 100,
            timestamp: new Date()
          }
        ],
        status: 'PASSED' as const
      };

      const suite = await service.createTestSuite(suiteData);

      expect(suite).toBeDefined();
      expect(suite.id).toBeDefined();
      expect(suite.name).toBe('Test Suite 1');
      expect(suite.description).toBe('Test suite description');
      expect(suite.tests).toHaveLength(1);
      expect(suite.startTime).toBeInstanceOf(Date);
    });

    it('should get a test suite by id', async () => {
      const suiteData = {
        name: 'Test Suite 2',
        description: 'Test suite description 2',
        tests: [],
        status: 'PENDING' as const
      };

      const createdSuite = await service.createTestSuite(suiteData);
      const retrievedSuite = await service.getTestSuite(createdSuite.id);

      expect(retrievedSuite).toBeDefined();
      expect(retrievedSuite?.id).toBe(createdSuite.id);
      expect(retrievedSuite?.name).toBe('Test Suite 2');
    });

    it('should return null for non-existent test suite', async () => {
      const suite = await service.getTestSuite('non-existent-id');
      expect(suite).toBeNull();
    });

    it('should list all test suites', async () => {
      const suite1 = await service.createTestSuite({
        name: 'Suite 1',
        description: 'Description 1',
        tests: [],
        status: 'PENDING' as const
      });

      const suite2 = await service.createTestSuite({
        name: 'Suite 2',
        description: 'Description 2',
        tests: [],
        status: 'PENDING' as const
      });

      const suites = await service.listTestSuites();

      expect(suites).toHaveLength(3); // 2 created + 1 default
      expect(suites.some(s => s.id === suite1.id)).toBe(true);
      expect(suites.some(s => s.id === suite2.id)).toBe(true);
    });

    it('should update a test suite', async () => {
      const suiteData = {
        name: 'Original Name',
        description: 'Original description',
        tests: [],
        status: 'PENDING' as const
      };

      const createdSuite = await service.createTestSuite(suiteData);
      const updatedSuite = await service.updateTestSuite(createdSuite.id, {
        name: 'Updated Name',
        description: 'Updated description'
      });

      expect(updatedSuite).toBeDefined();
      expect(updatedSuite?.name).toBe('Updated Name');
      expect(updatedSuite?.description).toBe('Updated description');
    });

    it('should delete a test suite', async () => {
      const suiteData = {
        name: 'To Delete',
        description: 'Will be deleted',
        tests: [],
        status: 'PENDING' as const
      };

      const createdSuite = await service.createTestSuite(suiteData);
      const deleted = await service.deleteTestSuite(createdSuite.id);

      expect(deleted).toBe(true);

      const retrievedSuite = await service.getTestSuite(createdSuite.id);
      expect(retrievedSuite).toBeNull();
    });
  });

  describe('Test Execution', () => {
    it('should execute a test suite', async () => {
      const suiteData = {
        name: 'Executable Suite',
        description: 'Suite for execution',
        tests: [
          {
            id: 'test-1',
            testName: 'API Health Check',
            status: 'PENDING' as const,
            message: '',
            duration: 0,
            timestamp: new Date()
          },
          {
            id: 'test-2',
            testName: 'Secret Rotation Test',
            status: 'PENDING' as const,
            message: '',
            duration: 0,
            timestamp: new Date()
          }
        ],
        status: 'PENDING' as const
      };

      const suite = await service.createTestSuite(suiteData);
      const execution = await service.executeTestSuite(suite.id);

      expect(execution).toBeDefined();
      expect(execution.suiteId).toBe(suite.id);
      expect(execution.status).toBeDefined();
      expect(execution.results).toHaveLength(2);
      expect(execution.startTime).toBeInstanceOf(Date);
      expect(execution.endTime).toBeInstanceOf(Date);
    });

    it('should throw error for non-existent test suite execution', async () => {
      await expect(service.executeTestSuite('non-existent-id')).rejects.toThrow('Test suite not found');
    });
  });

  describe('Secret Rotations', () => {
    it('should create a secret rotation', async () => {
      const rotationData = {
        secretName: 'database-password',
        currentVersion: 'v1.0.0',
        rotationDate: new Date(),
        status: 'PENDING' as const,
        nextRotation: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        metadata: { type: 'database' }
      };

      const rotation = await service.createSecretRotation(rotationData);

      expect(rotation).toBeDefined();
      expect(rotation.id).toBeDefined();
      expect(rotation.secretName).toBe('database-password');
      expect(rotation.currentVersion).toBe('v1.0.0');
      expect(rotation.status).toBe('PENDING');
    });

    it('should get a secret rotation by id', async () => {
      const rotationData = {
        secretName: 'api-key',
        currentVersion: 'v2.0.0',
        rotationDate: new Date(),
        status: 'PENDING' as const,
        nextRotation: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      };

      const createdRotation = await service.createSecretRotation(rotationData);
      const retrievedRotation = await service.getSecretRotation(createdRotation.id);

      expect(retrievedRotation).toBeDefined();
      expect(retrievedRotation?.id).toBe(createdRotation.id);
      expect(retrievedRotation?.secretName).toBe('api-key');
    });

    it('should list all secret rotations', async () => {
      const rotation1 = await service.createSecretRotation({
        secretName: 'secret-1',
        currentVersion: 'v1.0.0',
        rotationDate: new Date(),
        status: 'PENDING' as const,
        nextRotation: new Date()
      });

      const rotation2 = await service.createSecretRotation({
        secretName: 'secret-2',
        currentVersion: 'v2.0.0',
        rotationDate: new Date(),
        status: 'PENDING' as const,
        nextRotation: new Date()
      });

      const rotations = await service.listSecretRotations();

      expect(rotations).toHaveLength(4); // 2 created + 2 default
      expect(rotations.some(r => r.id === rotation1.id)).toBe(true);
      expect(rotations.some(r => r.id === rotation2.id)).toBe(true);
    });

    it('should execute a secret rotation', async () => {
      const rotationData = {
        secretName: 'test-secret',
        currentVersion: 'v1.0.0',
        rotationDate: new Date(),
        status: 'PENDING' as const,
        nextRotation: new Date()
      };

      const rotation = await service.createSecretRotation(rotationData);
      const executedRotation = await service.executeSecretRotation(rotation.id);

      expect(executedRotation).toBeDefined();
      expect(executedRotation.status).toBe('COMPLETED');
      expect(executedRotation.newVersion).toBeDefined();
      expect(executedRotation.lastRotation).toBeInstanceOf(Date);
      expect(executedRotation.nextRotation).toBeInstanceOf(Date);
    });

    it('should schedule secret rotations', async () => {
      const rotations = await service.scheduleSecretRotations();
      expect(Array.isArray(rotations)).toBe(true);
    });
  });

  describe('Security Checklist', () => {
    it('should create a security checklist', async () => {
      const checklistData = {
        name: 'Secret Management Check',
        category: 'SECRETS' as const,
        description: 'Verify secret management',
        status: 'PENDING' as const,
        lastChecked: new Date(),
        nextCheck: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        severity: 'HIGH' as const
      };

      const checklist = await service.createSecurityChecklist(checklistData);

      expect(checklist).toBeDefined();
      expect(checklist.id).toBeDefined();
      expect(checklist.name).toBe('Secret Management Check');
      expect(checklist.category).toBe('SECRETS');
      expect(checklist.severity).toBe('HIGH');
    });

    it('should get a security checklist by id', async () => {
      const checklistData = {
        name: 'Auth Check',
        category: 'AUTHENTICATION' as const,
        description: 'Verify authentication',
        status: 'PENDING' as const,
        lastChecked: new Date(),
        nextCheck: new Date(),
        severity: 'CRITICAL' as const
      };

      const createdChecklist = await service.createSecurityChecklist(checklistData);
      const retrievedChecklist = await service.getSecurityChecklist(createdChecklist.id);

      expect(retrievedChecklist).toBeDefined();
      expect(retrievedChecklist?.id).toBe(createdChecklist.id);
      expect(retrievedChecklist?.name).toBe('Auth Check');
    });

    it('should list all security checklists', async () => {
      const checklist1 = await service.createSecurityChecklist({
        name: 'Check 1',
        category: 'SECRETS' as const,
        description: 'Description 1',
        status: 'PENDING' as const,
        lastChecked: new Date(),
        nextCheck: new Date(),
        severity: 'HIGH' as const
      });

      const checklist2 = await service.createSecurityChecklist({
        name: 'Check 2',
        category: 'AUTHENTICATION' as const,
        description: 'Description 2',
        status: 'PENDING' as const,
        lastChecked: new Date(),
        nextCheck: new Date(),
        severity: 'CRITICAL' as const
      });

      const checklists = await service.listSecurityChecklist();

      expect(checklists).toHaveLength(6); // 2 created + 4 default
      expect(checklists.some(c => c.id === checklist1.id)).toBe(true);
      expect(checklists.some(c => c.id === checklist2.id)).toBe(true);
    });

    it('should execute a security check', async () => {
      const checklistData = {
        name: 'Test Security Check',
        category: 'SECRETS' as const,
        description: 'Test security check',
        status: 'PENDING' as const,
        lastChecked: new Date(),
        nextCheck: new Date(),
        severity: 'HIGH' as const
      };

      const checklist = await service.createSecurityChecklist(checklistData);
      const executedChecklist = await service.executeSecurityCheck(checklist.id);

      expect(executedChecklist).toBeDefined();
      expect(executedChecklist.status).toBeDefined();
      expect(['PASSED', 'FAILED', 'WARNING', 'NOT_APPLICABLE']).toContain(executedChecklist.status);
      expect(executedChecklist.lastChecked).toBeInstanceOf(Date);
      expect(executedChecklist.nextCheck).toBeInstanceOf(Date);
    });

    it('should execute quarterly security audit', async () => {
      const results = await service.executeQuarterlySecurityAudit();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('Statistics and Reports', () => {
    it('should get testing statistics', async () => {
      const statistics = await service.getTestingStatistics();

      expect(statistics).toBeDefined();
      expect(statistics.totalTestSuites).toBeGreaterThanOrEqual(0);
      expect(statistics.totalExecutions).toBeGreaterThanOrEqual(0);
      expect(statistics.successRate).toBeGreaterThanOrEqual(0);
      expect(statistics.averageExecutionTime).toBeGreaterThanOrEqual(0);
      expect(statistics.secretRotationsCompleted).toBeGreaterThanOrEqual(0);
      expect(statistics.securityChecksPassed).toBeGreaterThanOrEqual(0);
    });

    it('should generate daily report', async () => {
      const report = await service.generateTestingReport('daily');

      expect(report).toBeDefined();
      expect(report.period).toBe('daily');
      expect(report.generatedAt).toBeInstanceOf(Date);
      expect(report.summary).toBeDefined();
      expect(Array.isArray(report.testResults)).toBe(true);
      expect(Array.isArray(report.secretRotations)).toBe(true);
      expect(Array.isArray(report.securityChecks)).toBe(true);
      expect(Array.isArray(report.recommendations)).toBe(true);
    });

    it('should generate weekly report', async () => {
      const report = await service.generateTestingReport('weekly');

      expect(report).toBeDefined();
      expect(report.period).toBe('weekly');
      expect(report.generatedAt).toBeInstanceOf(Date);
    });

    it('should generate monthly report', async () => {
      const report = await service.generateTestingReport('monthly');

      expect(report).toBeDefined();
      expect(report.period).toBe('monthly');
      expect(report.generatedAt).toBeInstanceOf(Date);
    });

    it('should generate quarterly report', async () => {
      const report = await service.generateTestingReport('quarterly');

      expect(report).toBeDefined();
      expect(report.period).toBe('quarterly');
      expect(report.generatedAt).toBeInstanceOf(Date);
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent test suite execution', async () => {
      await expect(service.executeTestSuite('non-existent-id')).rejects.toThrow('Test suite not found');
    });

    it('should handle non-existent secret rotation execution', async () => {
      await expect(service.executeSecretRotation('non-existent-id')).rejects.toThrow('Secret rotation not found');
    });

    it('should handle non-existent security check execution', async () => {
      await expect(service.executeSecurityCheck('non-existent-id')).rejects.toThrow('Security checklist not found');
    });
  });

  describe('Initialization', () => {
    it('should initialize with default test suite', async () => {
      const suites = await service.listTestSuites();
      expect(suites.length).toBeGreaterThan(0);

      const defaultSuite = suites.find(s => s.name === 'Default Test Suite');
      expect(defaultSuite).toBeDefined();
      expect(defaultSuite?.tests.length).toBeGreaterThan(0);
    });

    it('should initialize with default secret rotations', async () => {
      const rotations = await service.listSecretRotations();
      expect(rotations.length).toBeGreaterThan(0);
    });

    it('should initialize with default security checklist', async () => {
      const checklists = await service.listSecurityChecklist();
      expect(checklists.length).toBeGreaterThan(0);
    });
  });
});
