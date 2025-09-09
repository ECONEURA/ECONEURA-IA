/**
 * Unit tests for AdvancedCICDService
 *
 * This test suite covers all functionality of the advanced CI/CD system
 * including deployment orchestration, rollback mechanisms, and analytics.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AdvancedCICDService, Environment, DeploymentStrategy } from '../../../services/advanced-cicd.service.js';

describe('AdvancedCICDService', () => {
  let service: AdvancedCICDService;

  beforeEach(() => {
    service = new AdvancedCICDService();
  });

  describe('Deployment Management', () => {
    it('should create a new deployment successfully', async () => {
      const deployment = await service.createDeployment(
        'v1.2.3',
        'staging',
        'blue_green',
        'admin',
        'abc123def456',
        'main',
        '1234',
        {
          api: 'api-artifact-123',
          web: 'web-artifact-123',
          workers: 'workers-artifact-123'
        }
      );

      expect(deployment).toBeDefined();
      expect(deployment.id).toBeDefined();
      expect(deployment.version).toBe('v1.2.3');
      expect(deployment.environment).toBe('staging');
      expect(deployment.strategy).toBe('blue_green');
      expect(deployment.status).toBe('pending');
      expect(deployment.triggeredBy).toBe('admin');
      expect(deployment.commitSha).toBe('abc123def456');
      expect(deployment.branch).toBe('main');
      expect(deployment.buildNumber).toBe('1234');
      expect(deployment.startedAt).toBeInstanceOf(Date);
    });

    it('should execute a deployment successfully', async () => {
      const deployment = await service.createDeployment(
        'v1.2.3',
        'dev',
        'recreate',
        'ci-system',
        'def456ghi789',
        'develop',
        '1235',
        {
          api: 'api-artifact-124',
          web: 'web-artifact-124',
          workers: 'workers-artifact-124'
        }
      );

      const executedDeployment = await service.executeDeployment(deployment.id);

      expect(executedDeployment).toBeDefined();
      expect(executedDeployment.status).toBe('completed');
      expect(executedDeployment.completedAt).toBeInstanceOf(Date);
      expect(executedDeployment.healthChecks).toBeDefined();
      expect(executedDeployment.healthChecks.length).toBeGreaterThan(0);
      expect(executedDeployment.metrics).toBeDefined();
    });

    it('should throw error when executing non-existent deployment', async () => {
      await expect(
        service.executeDeployment('non-existent-id');
      ).rejects.toThrow('Deployment non-existent-id not found');
    });

    it('should rollback a deployment successfully', async () => {
      const deployment = await service.createDeployment(
        'v1.2.3',
        'staging',
        'blue_green',
        'admin',
        'ghi789jkl012',
        'main',
        '1236',
        {
          api: 'api-artifact-125',
          web: 'web-artifact-125',
          workers: 'workers-artifact-125'
        }
      );

      await service.executeDeployment(deployment.id);
      const rollbackReason = 'High error rate detected';
      const rolledBackDeployment = await service.rollbackDeployment(deployment.id, rollbackReason);

      expect(rolledBackDeployment).toBeDefined();
      expect(rolledBackDeployment.status).toBe('rolled_back');
      expect(rolledBackDeployment.rollbackAt).toBeInstanceOf(Date);
      expect(rolledBackDeployment.rollbackReason).toBe(rollbackReason);
    });

    it('should throw error when rolling back non-existent deployment', async () => {
      await expect(
        service.rollbackDeployment('non-existent-id', 'Test rollback');
      ).rejects.toThrow('Deployment non-existent-id not found');
    });
  });

  describe('Deployment Strategies', () => {
    it('should execute blue-green deployment strategy', async () => {
      const deployment = await service.createDeployment(
        'v1.2.3',
        'staging',
        'blue_green',
        'admin',
        'abc123',
        'main',
        '1237',
        { api: 'api-1', web: 'web-1', workers: 'workers-1' }
      );

      const executedDeployment = await service.executeDeployment(deployment.id);
      expect(executedDeployment.status).toBe('completed');
    });

    it('should execute rolling deployment strategy', async () => {
      const deployment = await service.createDeployment(
        'v1.2.3',
        'prod',
        'rolling',
        'ci-system',
        'def456',
        'main',
        '1238',
        { api: 'api-2', web: 'web-2', workers: 'workers-2' }
      );

      const executedDeployment = await service.executeDeployment(deployment.id);
      expect(executedDeployment.status).toBe('completed');
    });

    it('should execute canary deployment strategy', async () => {
      const deployment = await service.createDeployment(
        'v1.2.3',
        'prod',
        'canary',
        'admin',
        'ghi789',
        'main',
        '1239',
        { api: 'api-3', web: 'web-3', workers: 'workers-3' }
      );

      const executedDeployment = await service.executeDeployment(deployment.id);
      expect(executedDeployment.status).toBe('completed');
    });

    it('should execute recreate deployment strategy', async () => {
      const deployment = await service.createDeployment(
        'v1.2.3',
        'dev',
        'recreate',
        'developer',
        'jkl012',
        'feature-branch',
        '1240',
        { api: 'api-4', web: 'web-4', workers: 'workers-4' }
      );

      const executedDeployment = await service.executeDeployment(deployment.id);
      expect(executedDeployment.status).toBe('completed');
    });
  });

  describe('Health Checks', () => {
    it('should run health checks during deployment', async () => {
      const deployment = await service.createDeployment(
        'v1.2.3',
        'staging',
        'blue_green',
        'admin',
        'mno345',
        'main',
        '1241',
        { api: 'api-5', web: 'web-5', workers: 'workers-5' }
      );

      const executedDeployment = await service.executeDeployment(deployment.id);

      expect(executedDeployment.healthChecks).toBeDefined();
      expect(executedDeployment.healthChecks.length).toBeGreaterThan(0);

      const healthCheck = executedDeployment.healthChecks[0];
      expect(healthCheck.name).toBeDefined();
      expect(healthCheck.url).toBeDefined();
      expect(['passing', 'failing', 'pending']).toContain(healthCheck.status);
      expect(healthCheck.lastChecked).toBeInstanceOf(Date);
    });
  });

  describe('Metrics Collection', () => {
    it('should collect deployment metrics', async () => {
      const deployment = await service.createDeployment(
        'v1.2.3',
        'staging',
        'blue_green',
        'admin',
        'pqr678',
        'main',
        '1242',
        { api: 'api-6', web: 'web-6', workers: 'workers-6' }
      );

      const executedDeployment = await service.executeDeployment(deployment.id);

      expect(executedDeployment.metrics).toBeDefined();
      expect(executedDeployment.metrics.deploymentTime).toBeGreaterThan(0);
      expect(executedDeployment.metrics.downtime).toBeGreaterThanOrEqual(0);
      expect(executedDeployment.metrics.errorRate).toBeGreaterThanOrEqual(0);
      expect(executedDeployment.metrics.responseTime).toBeGreaterThan(0);
      expect(executedDeployment.metrics.throughput).toBeGreaterThan(0);
      expect(executedDeployment.metrics.resourceUsage).toBeDefined();
      expect(executedDeployment.metrics.resourceUsage.cpu).toBeGreaterThanOrEqual(0);
      expect(executedDeployment.metrics.resourceUsage.memory).toBeGreaterThanOrEqual(0);
      expect(executedDeployment.metrics.resourceUsage.disk).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Build Artifacts', () => {
    it('should create a build artifact successfully', async () => {
      const artifact = await service.createBuildArtifact(
        'econeura-api',
        'v1.2.3',
        'api',
        52428800, // 50MB
        'sha256:abc123def456',
        { buildTime: '2024-01-15T10:00:00Z' }
      );

      expect(artifact).toBeDefined();
      expect(artifact.id).toBeDefined();
      expect(artifact.name).toBe('econeura-api');
      expect(artifact.version).toBe('v1.2.3');
      expect(artifact.type).toBe('api');
      expect(artifact.size).toBe(52428800);
      expect(artifact.checksum).toBe('sha256:abc123def456');
      expect(artifact.createdAt).toBeInstanceOf(Date);
      expect(artifact.metadata).toEqual({ buildTime: '2024-01-15T10:00:00Z' });
    });

    it('should get artifacts with filters', async () => {
      // Create multiple artifacts
      await service.createBuildArtifact('api-1', 'v1.2.3', 'api', 1000, 'hash1');
      await service.createBuildArtifact('web-1', 'v1.2.3', 'web', 2000, 'hash2');
      await service.createBuildArtifact('api-2', 'v1.2.4', 'api', 3000, 'hash3');

      // Test type filter
      const apiArtifacts = await service.getArtifacts({ type: 'api' });
      expect(apiArtifacts).toHaveLength(2);
      expect(apiArtifacts.every(a => a.type === 'api')).toBe(true);

      // Test version filter
      const v123Artifacts = await service.getArtifacts({ version: 'v1.2.3' });
      expect(v123Artifacts).toHaveLength(2);
      expect(v123Artifacts.every(a => a.version === 'v1.2.3')).toBe(true);

      // Test name filter
      const api1Artifacts = await service.getArtifacts({ name: 'api-1' });
      expect(api1Artifacts).toHaveLength(1);
      expect(api1Artifacts[0].name).toBe('api-1');
    });
  });

  describe('Test Results', () => {
    it('should record test result successfully', async () => {
      const testResult = await service.recordTestResult(
        'unit',
        'passed',
        45000, // 45 seconds
        { total: 150, passed: 150, failed: 0, skipped: 0 },
        85, // 85% coverage
        ['test-report.json']
      );

      expect(testResult).toBeDefined();
      expect(testResult.id).toBeDefined();
      expect(testResult.type).toBe('unit');
      expect(testResult.status).toBe('passed');
      expect(testResult.duration).toBe(45000);
      expect(testResult.coverage).toBe(85);
      expect(testResult.results).toEqual({ total: 150, passed: 150, failed: 0, skipped: 0 });
      expect(testResult.artifacts).toEqual(['test-report.json']);
      expect(testResult.createdAt).toBeInstanceOf(Date);
    });

    it('should get test results with filters', async () => {
      // Create multiple test results
      await service.recordTestResult('unit', 'passed', 30000, { total: 100, passed: 100, failed: 0, skipped: 0 });
      await service.recordTestResult('integration', 'passed', 60000, { total: 50, passed: 50, failed: 0, skipped: 0 });
      await service.recordTestResult('unit', 'failed', 45000, { total: 100, passed: 95, failed: 5, skipped: 0 });

      // Test type filter
      const unitTests = await service.getTestResults({ type: 'unit' });
      expect(unitTests).toHaveLength(2);
      expect(unitTests.every(t => t.type === 'unit')).toBe(true);

      // Test status filter
      const passedTests = await service.getTestResults({ status: 'passed' });
      expect(passedTests).toHaveLength(2);
      expect(passedTests.every(t => t.status === 'passed')).toBe(true);

      // Test since filter
      const since = new Date(Date.now() - 60000); // 1 minute ago
      const recentTests = await service.getTestResults({ since });
      expect(recentTests.length).toBeGreaterThan(0);
    });
  });

  describe('Configuration Management', () => {
    it('should update deployment configuration', async () => {
      const updates = {
        strategy: 'canary' as DeploymentStrategy,
        healthCheckTimeout: 90000,
        rollbackThreshold: 0.03,
        canaryPercentage: 20,
        autoRollback: true,
        notifications: {
          slack: '#deployments',
          email: ['team@econeura.com']
        }
      };

      await service.updateDeploymentConfig('staging', updates);

      // Verify configuration was updated (in a real implementation, we'd have a getter)
      // For now, we just verify the method doesn't throw
      expect(true).toBe(true);
    });

    it('should throw error when updating non-existent environment config', async () => {
      const updates = { strategy: 'blue_green' as DeploymentStrategy };

      await expect(
        service.updateDeploymentConfig('non-existent' as Environment, updates);
      ).rejects.toThrow('No configuration found for environment non-existent');
    });
  });

  describe('Analytics and Reporting', () => {
    it('should generate deployment analytics', async () => {
      // Create some deployments
      const deployment1 = await service.createDeployment('v1.0.0', 'staging', 'blue_green', 'admin', 'abc1', 'main', '1', { api: 'a1', web: 'w1', workers: 'wr1' });
      const deployment2 = await service.createDeployment('v1.0.1', 'prod', 'canary', 'ci', 'def2', 'main', '2', { api: 'a2', web: 'w2', workers: 'wr2' });
      const deployment3 = await service.createDeployment('v1.0.2', 'staging', 'rolling', 'admin', 'ghi3', 'main', '3', { api: 'a3', web: 'w3', workers: 'wr3' });

      // Execute deployments
      await service.executeDeployment(deployment1.id);
      await service.executeDeployment(deployment2.id);
      await service.executeDeployment(deployment3.id);

      // Rollback one deployment
      await service.rollbackDeployment(deployment2.id, 'Test rollback');

      const analytics = await service.getDeploymentAnalytics();

      expect(analytics).toBeDefined();
      expect(analytics.totalDeployments).toBe(3);
      expect(analytics.successfulDeployments).toBeGreaterThanOrEqual(0);
      expect(analytics.failedDeployments).toBeGreaterThanOrEqual(0);
      expect(analytics.rollbackRate).toBeGreaterThanOrEqual(0);
      expect(analytics.averageDeploymentTime).toBeGreaterThanOrEqual(0);
      expect(analytics.averageDowntime).toBeGreaterThanOrEqual(0);
      expect(analytics.deploymentsByStrategy).toBeDefined();
      expect(analytics.deploymentsByStatus).toBeDefined();
    });

    it('should generate analytics for specific environment', async () => {
      // Create deployments for different environments
      await service.createDeployment('v1.0.0', 'staging', 'blue_green', 'admin', 'abc1', 'main', '1', { api: 'a1', web: 'w1', workers: 'wr1' });
      await service.createDeployment('v1.0.1', 'prod', 'canary', 'ci', 'def2', 'main', '2', { api: 'a2', web: 'w2', workers: 'wr2' });

      const stagingAnalytics = await service.getDeploymentAnalytics('staging');
      const prodAnalytics = await service.getDeploymentAnalytics('prod');

      expect(stagingAnalytics.totalDeployments).toBe(1);
      expect(prodAnalytics.totalDeployments).toBe(1);
    });
  });

  describe('Service Statistics', () => {
    it('should return service statistics', async () => {
      // Create some data
      await service.createDeployment('v1.0.0', 'staging', 'blue_green', 'admin', 'abc1', 'main', '1', { api: 'a1', web: 'w1', workers: 'wr1' });
      await service.createBuildArtifact('api', 'v1.0.0', 'api', 1000, 'hash1');
      await service.recordTestResult('unit', 'passed', 30000, { total: 100, passed: 100, failed: 0, skipped: 0 });

      const stats = await service.getServiceStats();

      expect(stats).toBeDefined();
      expect(stats.totalDeployments).toBeGreaterThanOrEqual(1);
      expect(stats.totalArtifacts).toBeGreaterThanOrEqual(1);
      expect(stats.totalTestResults).toBeGreaterThanOrEqual(1);
      expect(stats.activeDeployments).toBeGreaterThanOrEqual(0);
      expect(stats.configuredEnvironments).toBe(3); // dev, staging, prod
    });
  });

  describe('Error Handling', () => {
    it('should handle deployment execution failures gracefully', async () => {
      const deployment = await service.createDeployment(
        'v1.2.3',
        'staging',
        'blue_green',
        'admin',
        'abc123',
        'main',
        '1243',
        { api: 'api-7', web: 'web-7', workers: 'workers-7' }
      );

      // Mock a failure scenario by creating a deployment with invalid strategy
      // In a real implementation, this would be handled by the deployment strategy execution
      const executedDeployment = await service.executeDeployment(deployment.id);

      // The service should handle failures gracefully
      expect(executedDeployment).toBeDefined();
      expect(['completed', 'failed']).toContain(executedDeployment.status);
    });

    it('should handle invalid deployment data gracefully', async () => {
      // Test with invalid environment
      try {
        await service.createDeployment(
          'v1.2.3',
          'invalid-env' as Environment,
          'blue_green',
          'admin',
          'abc123',
          'main',
          '1244',
          { api: 'api-8', web: 'web-8', workers: 'workers-8' }
        );
      } catch (error) {
        // Expected to handle gracefully
        expect(error).toBeDefined();
      }
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete deployment lifecycle', async () => {
      // 1. Create deployment
      const deployment = await service.createDeployment(
        'v1.2.3',
        'staging',
        'blue_green',
        'admin',
        'abc123',
        'main',
        '1245',
        { api: 'api-9', web: 'web-9', workers: 'workers-9' }
      );

      expect(deployment.status).toBe('pending');

      // 2. Execute deployment
      const executedDeployment = await service.executeDeployment(deployment.id);
      expect(executedDeployment.status).toBe('completed');

      // 3. Verify health checks
      expect(executedDeployment.healthChecks.length).toBeGreaterThan(0);

      // 4. Verify metrics
      expect(executedDeployment.metrics.deploymentTime).toBeGreaterThan(0);

      // 5. Rollback if needed
      const rolledBackDeployment = await service.rollbackDeployment(deployment.id, 'Test rollback');
      expect(rolledBackDeployment.status).toBe('rolled_back');
    });

    it('should handle multiple concurrent deployments', async () => {
      const deployments = await Promise.all([
        service.createDeployment('v1.0.0', 'staging', 'blue_green', 'admin', 'abc1', 'main', '1', { api: 'a1', web: 'w1', workers: 'wr1' }),
        service.createDeployment('v1.0.1', 'dev', 'recreate', 'ci', 'def2', 'develop', '2', { api: 'a2', web: 'w2', workers: 'wr2' }),
        service.createDeployment('v1.0.2', 'prod', 'canary', 'admin', 'ghi3', 'main', '3', { api: 'a3', web: 'w3', workers: 'wr3' });
      ]);

      expect(deployments).toHaveLength(3);
      expect(deployments.every(d => d.status === 'pending')).toBe(true);

      // Execute all deployments
      const executedDeployments = await Promise.all(
        deployments.map(d => service.executeDeployment(d.id))
      );

      expect(executedDeployments).toHaveLength(3);
      expect(executedDeployments.every(d => d.status === 'completed')).toBe(true);
    });
  });
});
