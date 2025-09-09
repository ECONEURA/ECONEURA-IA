import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AdvancedDeploymentAutomationService } from '../../lib/advanced-deployment-automation.service.ts';

// Mock logger
vi.mock('../../lib/logger.ts', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  }
}));

describe('AdvancedDeploymentAutomationService', () => {
  let service: AdvancedDeploymentAutomationService;

  beforeEach(() => {
    service = new AdvancedDeploymentAutomationService();
  });

  afterEach(() => {
    // Clean up if needed
  });

  describe('Service Initialization', () => {
    it('should initialize service successfully', () => {
      expect(service).toBeDefined();
    });
  });

  describe('Strategy Management', () => {
    it('should create a deployment strategy', async () => {
      const strategyData = {
        name: 'Blue-Green Production',
        type: 'blue-green' as const,
        description: 'Blue-green deployment for production',
        config: {
          healthCheckPath: '/health',
          healthCheckTimeout: 30,
          rollbackThreshold: 5
        },
        isActive: true
      };

      const strategy = await service.createStrategy(strategyData);

      expect(strategy).toBeDefined();
      expect(strategy.id).toBeDefined();
      expect(strategy.name).toBe('Blue-Green Production');
      expect(strategy.type).toBe('blue-green');
      expect(strategy.isActive).toBe(true);
      expect(strategy.createdAt).toBeInstanceOf(Date);
    });

    it('should get all strategies', async () => {
      const strategies = await service.getStrategies();
      expect(Array.isArray(strategies)).toBe(true);
    });

    it('should update a strategy', async () => {
      const strategyData = {
        name: 'Test Strategy',
        type: 'canary' as const,
        description: 'Test strategy',
        config: {
          canaryPercentage: 20
        },
        isActive: true
      };

      const strategy = await service.createStrategy(strategyData);
      const updated = await service.updateStrategy(strategy.id, { isActive: false });

      expect(updated).toBeDefined();
      expect(updated?.isActive).toBe(false);
      expect(updated?.updatedAt).toBeInstanceOf(Date);
    });

    it('should delete a strategy', async () => {
      const strategyData = {
        name: 'Test Strategy',
        type: 'rolling' as const,
        description: 'Test strategy',
        config: {},
        isActive: true
      };

      const strategy = await service.createStrategy(strategyData);
      const deleted = await service.deleteStrategy(strategy.id);

      expect(deleted).toBe(true);
    });
  });

  describe('Environment Management', () => {
    it('should create a deployment environment', async () => {
      const environmentData = {
        name: 'Test Environment',
        type: 'staging' as const,
        description: 'Test environment',
        config: {
          resourceGroup: 'test-rg',
          subscriptionId: 'test-sub',
          location: 'West Europe',
          sslEnabled: true,
          autoScaling: true,
          minInstances: 2,
          maxInstances: 5,
          cpuThreshold: 70,
          memoryThreshold: 80
        },
        secrets: {
          keyVaultName: 'test-kv',
          connectionStrings: {
            database: 'postgresql://test:test@localhost:5432/test'
          },
          environmentVariables: {
            NODE_ENV: 'staging'
          }
        },
        isActive: true
      };

      const environment = await service.createEnvironment(environmentData);

      expect(environment).toBeDefined();
      expect(environment.id).toBeDefined();
      expect(environment.name).toBe('Test Environment');
      expect(environment.type).toBe('staging');
      expect(environment.isActive).toBe(true);
      expect(environment.createdAt).toBeInstanceOf(Date);
    });

    it('should get all environments', async () => {
      const environments = await service.getEnvironments();
      expect(Array.isArray(environments)).toBe(true);
    });

    it('should update an environment', async () => {
      const environmentData = {
        name: 'Test Environment',
        type: 'development' as const,
        description: 'Test environment',
        config: {
          resourceGroup: 'test-rg',
          subscriptionId: 'test-sub',
          location: 'West Europe',
          sslEnabled: false,
          autoScaling: false,
          minInstances: 1,
          maxInstances: 2,
          cpuThreshold: 80,
          memoryThreshold: 90
        },
        secrets: {
          keyVaultName: 'test-kv',
          connectionStrings: {},
          environmentVariables: {}
        },
        isActive: true
      };

      const environment = await service.createEnvironment(environmentData);
      const updated = await service.updateEnvironment(environment.id, { isActive: false });

      expect(updated).toBeDefined();
      expect(updated?.isActive).toBe(false);
      expect(updated?.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('Pipeline Management', () => {
    it('should create a deployment pipeline', async () => {
      const pipelineData = {
        name: 'Test Pipeline',
        description: 'Test pipeline',
        source: {
          repository: 'test/repo',
          branch: 'main',
          trigger: 'push' as const
        },
        stages: [
          {
            id: 'build-stage',
            name: 'Build',
            environment: 'development',
            strategy: 'rolling',
            dependencies: [],
            conditions: {
              branch: 'main'
            },
            steps: [
              {
                id: 'build-step',
                name: 'Build Application',
                type: 'build' as const,
                config: {
                  buildCommand: 'npm run build'
                }
              }
            ]
          }
        ],
        isActive: true
      };

      const pipeline = await service.createPipeline(pipelineData);

      expect(pipeline).toBeDefined();
      expect(pipeline.id).toBeDefined();
      expect(pipeline.name).toBe('Test Pipeline');
      expect(pipeline.stages).toHaveLength(1);
      expect(pipeline.createdAt).toBeInstanceOf(Date);
    });

    it('should get all pipelines', async () => {
      const pipelines = await service.getPipelines();
      expect(Array.isArray(pipelines)).toBe(true);
    });

    it('should update a pipeline', async () => {
      const pipelineData = {
        name: 'Test Pipeline',
        description: 'Test pipeline',
        source: {
          repository: 'test/repo',
          branch: 'main',
          trigger: 'push' as const
        },
        stages: [],
        isActive: true
      };

      const pipeline = await service.createPipeline(pipelineData);
      const updated = await service.updatePipeline(pipeline.id, { isActive: false });

      expect(updated).toBeDefined();
      expect(updated?.isActive).toBe(false);
      expect(updated?.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('Job Management', () => {
    it('should create a deployment job', async () => {
      const jobData = {
        pipelineId: 'test-pipeline',
        stageId: 'test-stage',
        environmentId: 'test-env',
        strategyId: 'test-strategy',
        status: 'pending' as const,
        trigger: {
          type: 'manual' as const,
          triggeredBy: 'test-user',
          triggeredAt: new Date()
        },
        progress: {
          currentStep: 0,
          totalSteps: 3,
          currentStepName: 'Initializing',
          percentage: 0
        },
        artifacts: {},
        metrics: {
          startTime: new Date(),
          resourceUsage: {
            cpu: 0,
            memory: 0,
            disk: 0
          },
          deploymentMetrics: {
            instancesDeployed: 0,
            instancesHealthy: 0,
            instancesUnhealthy: 0,
            rollbackTriggered: false
          }
        },
        logs: []
      };

      const job = await service.createJob(jobData);

      expect(job).toBeDefined();
      expect(job.id).toBeDefined();
      expect(job.pipelineId).toBe('test-pipeline');
      expect(job.status).toBe('pending');
      expect(job.createdAt).toBeInstanceOf(Date);
    });

    it('should get jobs with filters', async () => {
      const jobs = await service.getJobs({ status: 'pending' });
      expect(Array.isArray(jobs)).toBe(true);
    });

    it('should update job status', async () => {
      const jobData = {
        pipelineId: 'test-pipeline',
        stageId: 'test-stage',
        environmentId: 'test-env',
        strategyId: 'test-strategy',
        status: 'pending' as const,
        trigger: {
          type: 'manual' as const,
          triggeredBy: 'test-user',
          triggeredAt: new Date()
        },
        progress: {
          currentStep: 0,
          totalSteps: 3,
          currentStepName: 'Initializing',
          percentage: 0
        },
        artifacts: {},
        metrics: {
          startTime: new Date(),
          resourceUsage: {
            cpu: 0,
            memory: 0,
            disk: 0
          },
          deploymentMetrics: {
            instancesDeployed: 0,
            instancesHealthy: 0,
            instancesUnhealthy: 0,
            rollbackTriggered: false
          }
        },
        logs: []
      };

      const job = await service.createJob(jobData);
      const updated = await service.updateJobStatus(job.id, 'running');

      expect(updated).toBeDefined();
      expect(updated?.status).toBe('running');
      expect(updated?.updatedAt).toBeInstanceOf(Date);
    });

    it('should add job log', async () => {
      const jobData = {
        pipelineId: 'test-pipeline',
        stageId: 'test-stage',
        environmentId: 'test-env',
        strategyId: 'test-strategy',
        status: 'running' as const,
        trigger: {
          type: 'manual' as const,
          triggeredBy: 'test-user',
          triggeredAt: new Date()
        },
        progress: {
          currentStep: 1,
          totalSteps: 3,
          currentStepName: 'Building',
          percentage: 33
        },
        artifacts: {},
        metrics: {
          startTime: new Date(),
          resourceUsage: {
            cpu: 0,
            memory: 0,
            disk: 0
          },
          deploymentMetrics: {
            instancesDeployed: 0,
            instancesHealthy: 0,
            instancesUnhealthy: 0,
            rollbackTriggered: false
          }
        },
        logs: []
      };

      const job = await service.createJob(jobData);
      const success = await service.addJobLog(job.id, {
        step: 'build',
        level: 'info',
        message: 'Build started'
      });

      expect(success).toBe(true);
    });
  });

  describe('Approval Management', () => {
    it('should create an approval', async () => {
      const approvalData = {
        jobId: 'test-job',
        stageId: 'test-stage',
        approver: 'test-approver',
        status: 'pending' as const,
        requestedAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      };

      const approval = await service.createApproval(approvalData);

      expect(approval).toBeDefined();
      expect(approval.id).toBeDefined();
      expect(approval.jobId).toBe('test-job');
      expect(approval.status).toBe('pending');
    });

    it('should get approvals', async () => {
      const approvals = await service.getApprovals();
      expect(Array.isArray(approvals)).toBe(true);
    });

    it('should respond to approval', async () => {
      const approvalData = {
        jobId: 'test-job',
        stageId: 'test-stage',
        approver: 'test-approver',
        status: 'pending' as const,
        requestedAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      };

      const approval = await service.createApproval(approvalData);
      const responded = await service.respondToApproval(approval.id, 'approved', 'Looks good', 'approver@test.com');

      expect(responded).toBeDefined();
      expect(responded?.status).toBe('approved');
      expect(responded?.comments).toBe('Looks good');
      expect(responded?.respondedAt).toBeInstanceOf(Date);
    });
  });

  describe('Notification Management', () => {
    it('should create a notification', async () => {
      const notificationData = {
        jobId: 'test-job',
        type: 'completed' as const,
        channels: ['email', 'slack'] as const,
        recipients: ['admin@test.com'],
        template: 'deployment-completed',
        data: {
          jobId: 'test-job',
          status: 'completed'
        },
        sent: false
      };

      const notification = await service.createNotification(notificationData);

      expect(notification).toBeDefined();
      expect(notification.id).toBeDefined();
      expect(notification.jobId).toBe('test-job');
      expect(notification.type).toBe('completed');
      expect(notification.sent).toBe(false);
    });

    it('should get notifications', async () => {
      const notifications = await service.getNotifications();
      expect(Array.isArray(notifications)).toBe(true);
    });

    it('should mark notification as sent', async () => {
      const notificationData = {
        jobId: 'test-job',
        type: 'started' as const,
        channels: ['email'] as const,
        recipients: ['admin@test.com'],
        template: 'deployment-started',
        data: {},
        sent: false
      };

      const notification = await service.createNotification(notificationData);
      const success = await service.markNotificationSent(notification.id);

      expect(success).toBe(true);
    });
  });

  describe('Health Check Management', () => {
    it('should create a health check', async () => {
      const healthCheckData = {
        jobId: 'test-job',
        name: 'API Health Check',
        type: 'http' as const,
        config: {
          url: 'https://api.test.com/health',
          method: 'GET',
          expectedStatus: 200,
          timeout: 30,
          retries: 3,
          interval: 10
        },
        results: {
          status: 'pending' as const,
          lastCheck: new Date(),
          attempts: 0
        }
      };

      const healthCheck = await service.createHealthCheck(healthCheckData);

      expect(healthCheck).toBeDefined();
      expect(healthCheck.id).toBeDefined();
      expect(healthCheck.jobId).toBe('test-job');
      expect(healthCheck.name).toBe('API Health Check');
    });

    it('should get health checks', async () => {
      const healthChecks = await service.getHealthChecks();
      expect(Array.isArray(healthChecks)).toBe(true);
    });

    it('should update health check result', async () => {
      const healthCheckData = {
        jobId: 'test-job',
        name: 'API Health Check',
        type: 'http' as const,
        config: {
          url: 'https://api.test.com/health',
          timeout: 30,
          retries: 3,
          interval: 10
        },
        results: {
          status: 'pending' as const,
          lastCheck: new Date(),
          attempts: 0
        }
      };

      const healthCheck = await service.createHealthCheck(healthCheckData);
      const success = await service.updateHealthCheckResult(healthCheck.id, {
        status: 'passed',
        responseTime: 150
      });

      expect(success).toBe(true);
    });
  });

  describe('Rollback Management', () => {
    it('should create a rollback', async () => {
      const rollbackData = {
        jobId: 'test-job',
        reason: 'Deployment failed health checks',
        triggeredBy: 'system',
        triggeredAt: new Date(),
        targetVersion: 'v1.0.0',
        status: 'pending' as const,
        progress: {
          currentStep: 0,
          totalSteps: 3,
          percentage: 0
        }
      };

      const rollback = await service.createRollback(rollbackData);

      expect(rollback).toBeDefined();
      expect(rollback.id).toBeDefined();
      expect(rollback.jobId).toBe('test-job');
      expect(rollback.status).toBe('pending');
    });

    it('should get rollbacks', async () => {
      const rollbacks = await service.getRollbacks();
      expect(Array.isArray(rollbacks)).toBe(true);
    });

    it('should update rollback status', async () => {
      const rollbackData = {
        jobId: 'test-job',
        reason: 'Deployment failed',
        triggeredBy: 'admin',
        triggeredAt: new Date(),
        targetVersion: 'v1.0.0',
        status: 'pending' as const,
        progress: {
          currentStep: 0,
          totalSteps: 3,
          percentage: 0
        }
      };

      const rollback = await service.createRollback(rollbackData);
      const updated = await service.updateRollbackStatus(rollback.id, 'in_progress', {
        currentStep: 1,
        percentage: 33
      });

      expect(updated).toBeDefined();
      expect(updated?.status).toBe('in_progress');
      expect(updated?.progress.percentage).toBe(33);
    });
  });

  describe('Deployment Execution', () => {
    it('should execute deployment', async () => {
      // Create required dependencies first
      const strategy = await service.createStrategy({
        name: 'Test Strategy',
        type: 'rolling',
        description: 'Test strategy',
        config: {},
        isActive: true
      });

      const environment = await service.createEnvironment({
        name: 'Test Environment',
        type: 'staging',
        description: 'Test environment',
        config: {
          resourceGroup: 'test-rg',
          subscriptionId: 'test-sub',
          location: 'West Europe',
          sslEnabled: true,
          autoScaling: true,
          minInstances: 2,
          maxInstances: 5,
          cpuThreshold: 70,
          memoryThreshold: 80
        },
        secrets: {
          keyVaultName: 'test-kv',
          connectionStrings: {},
          environmentVariables: {}
        },
        isActive: true
      });

      const pipeline = await service.createPipeline({
        name: 'Test Pipeline',
        description: 'Test pipeline',
        source: {
          repository: 'test/repo',
          branch: 'main',
          trigger: 'push'
        },
        stages: [
          {
            id: 'test-stage',
            name: 'Test Stage',
            environment: environment.id,
            strategy: strategy.id,
            dependencies: [],
            conditions: {},
            steps: [
              {
                id: 'test-step',
                name: 'Test Step',
                type: 'build',
                config: {}
              }
            ]
          }
        ],
        isActive: true
      });

      const job = await service.executeDeployment(pipeline.id, environment.id, {
        type: 'manual',
        triggeredBy: 'test-user'
      });

      expect(job).toBeDefined();
      expect(job.pipelineId).toBe(pipeline.id);
      expect(job.environmentId).toBe(environment.id);
      expect(job.status).toBe('pending');
    });
  });

  describe('Statistics', () => {
    it('should get statistics', async () => {
      const statistics = await service.getStatistics();

      expect(statistics).toBeDefined();
      expect(typeof statistics.totalStrategies).toBe('number');
      expect(typeof statistics.totalEnvironments).toBe('number');
      expect(typeof statistics.totalPipelines).toBe('number');
      expect(typeof statistics.totalJobs).toBe('number');
      expect(typeof statistics.activeJobs).toBe('number');
      expect(typeof statistics.completedJobs).toBe('number');
      expect(typeof statistics.failedJobs).toBe('number');
      expect(typeof statistics.pendingApprovals).toBe('number');
      expect(typeof statistics.totalNotifications).toBe('number');
      expect(typeof statistics.sentNotifications).toBe('number');
      expect(typeof statistics.totalHealthChecks).toBe('number');
      expect(typeof statistics.passedHealthChecks).toBe('number');
      expect(typeof statistics.totalRollbacks).toBe('number');
      expect(typeof statistics.completedRollbacks).toBe('number');
      expect(typeof statistics.jobsByStatus).toBe('object');
      expect(typeof statistics.jobsByEnvironment).toBe('object');
      expect(typeof statistics.averageDeploymentTime).toBe('number');
    });
  });

  describe('Edge Cases', () => {
    it('should handle non-existent strategy update', async () => {
      const result = await service.updateStrategy('non-existent-id', { isActive: false });
      expect(result).toBeNull();
    });

    it('should handle non-existent strategy deletion', async () => {
      const result = await service.deleteStrategy('non-existent-id');
      expect(result).toBe(false);
    });

    it('should handle non-existent environment update', async () => {
      const result = await service.updateEnvironment('non-existent-id', { isActive: false });
      expect(result).toBeNull();
    });

    it('should handle non-existent pipeline update', async () => {
      const result = await service.updatePipeline('non-existent-id', { isActive: false });
      expect(result).toBeNull();
    });

    it('should handle non-existent job status update', async () => {
      const result = await service.updateJobStatus('non-existent-id', 'running');
      expect(result).toBeNull();
    });

    it('should handle non-existent approval response', async () => {
      const result = await service.respondToApproval('non-existent-id', 'approved');
      expect(result).toBeNull();
    });

    it('should handle non-existent notification mark as sent', async () => {
      const result = await service.markNotificationSent('non-existent-id');
      expect(result).toBe(false);
    });

    it('should handle non-existent health check result update', async () => {
      const result = await service.updateHealthCheckResult('non-existent-id', { status: 'passed' });
      expect(result).toBe(false);
    });

    it('should handle non-existent rollback status update', async () => {
      const result = await service.updateRollbackStatus('non-existent-id', 'completed');
      expect(result).toBeNull();
    });
  });
});
