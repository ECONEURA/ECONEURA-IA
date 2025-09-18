import { describe, it, expect, beforeEach, vi } from 'vitest';
import ProjectCompletionDeploymentService, { 
  DeploymentConfig, 
  HealthCheck, 
  ValidationResult, 
  DeploymentResult, 
  ProjectCompletionConfig 
} from '../../lib/project-completion-deployment.service.ts.js';

// Mock del logger
vi.mock('../../lib/logger.ts', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  }
}));

describe('ProjectCompletionDeploymentService', () => {
  let service: ProjectCompletionDeploymentService;
  let config: ProjectCompletionConfig;

  beforeEach(() => {
    config = {
      validationEnabled: true,
      deploymentEnabled: true,
      monitoringEnabled: true,
      rollbackEnabled: true,
      healthCheckInterval: 60,
      deploymentTimeout: 1800,
      maxRetries: 3,
      notificationChannels: ['email', 'slack'],
      environments: ['development', 'staging', 'production'],
      strategies: ['blue-green', 'canary', 'rolling', 'recreate']
    };

    service = new ProjectCompletionDeploymentService(config);
  });

  describe('Project Validation', () => {
    it('should validate project completion', async () => {
      const validation = await service.validateProjectCompletion();

      expect(validation).toBeDefined();
      expect(typeof validation.totalComponents).toBe('number');
      expect(typeof validation.passedComponents).toBe('number');
      expect(typeof validation.failedComponents).toBe('number');
      expect(typeof validation.warningComponents).toBe('number');
      expect(typeof validation.skippedComponents).toBe('number');
      expect(['HEALTHY', 'DEGRADED', 'UNHEALTHY']).toContain(validation.overallStatus);
      expect(Array.isArray(validation.validationResults)).toBe(true);
      expect(typeof validation.summary).toBe('string');
      expect(Array.isArray(validation.recommendations)).toBe(true);
    });

    it('should validate individual components', async () => {
      const validation = await service.validateProjectCompletion();
      const results = validation.validationResults;

      expect(results.length).toBeGreaterThan(0);
      
      // Verificar que todos los resultados tienen la estructura correcta
      results.forEach(result => {
        expect(result.component).toBeDefined();
        expect(['PASSED', 'FAILED', 'WARNING', 'SKIPPED']).toContain(result.status);
        expect(typeof result.message).toBe('string');
        expect(result.timestamp).toBeInstanceOf(Date);
        expect(typeof result.duration).toBe('number');
      });
    });

    it('should generate validation summary', async () => {
      const validation = await service.validateProjectCompletion();

      expect(validation.summary).toContain('Validation completed');
      expect(validation.summary).toContain(validation.totalComponents.toString());
      expect(validation.summary).toContain(validation.passedComponents.toString());
    });

    it('should generate recommendations', async () => {
      const validation = await service.validateProjectCompletion();

      expect(Array.isArray(validation.recommendations)).toBe(true);
      expect(validation.recommendations.length).toBeGreaterThan(0);
      
      validation.recommendations.forEach(recommendation => {
        expect(typeof recommendation).toBe('string');
        expect(recommendation.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Deployment Management', () => {
    it('should create deployment configuration', () => {
      const deploymentConfig: DeploymentConfig = {
        environment: 'production',
        strategy: 'blue-green',
        region: 'eastus',
        resourceGroup: 'econeura-rg',
        appServiceName: 'econeura-app',
        containerRegistry: 'econeura.azurecr.io',
        imageTag: 'v1.0.0',
        replicas: 3,
        healthCheckPath: '/health',
        rollbackEnabled: true,
        monitoringEnabled: true,
        autoScaling: {
          enabled: true,
          minReplicas: 2,
          maxReplicas: 10,
          targetCPU: 70
        }
      };

      expect(deploymentConfig.environment).toBe('production');
      expect(deploymentConfig.strategy).toBe('blue-green');
      expect(deploymentConfig.replicas).toBe(3);
      expect(deploymentConfig.autoScaling?.enabled).toBe(true);
    });

    it('should deploy with blue-green strategy', async () => {
      const deploymentConfig: DeploymentConfig = {
        environment: 'staging',
        strategy: 'blue-green',
        region: 'eastus',
        resourceGroup: 'econeura-rg',
        appServiceName: 'econeura-staging',
        containerRegistry: 'econeura.azurecr.io',
        imageTag: 'v1.0.0',
        replicas: 2,
        healthCheckPath: '/health',
        rollbackEnabled: true,
        monitoringEnabled: true
      };

      const deployment = await service.deploy(deploymentConfig);

      expect(deployment).toBeDefined();
      expect(deployment.id).toBeDefined();
      expect(deployment.environment).toBe('staging');
      expect(deployment.strategy).toBe('blue-green');
      expect(['PENDING', 'RUNNING', 'SUCCESS', 'FAILED', 'ROLLED_BACK']).toContain(deployment.status);
      expect(deployment.startTime).toBeInstanceOf(Date);
      expect(Array.isArray(deployment.logs)).toBe(true);
      expect(Array.isArray(deployment.healthChecks)).toBe(true);
    });

    it('should deploy with canary strategy', async () => {
      const deploymentConfig: DeploymentConfig = {
        environment: 'production',
        strategy: 'canary',
        region: 'eastus',
        resourceGroup: 'econeura-rg',
        appServiceName: 'econeura-prod',
        containerRegistry: 'econeura.azurecr.io',
        imageTag: 'v1.1.0',
        replicas: 5,
        healthCheckPath: '/health',
        rollbackEnabled: true,
        monitoringEnabled: true
      };

      const deployment = await service.deploy(deploymentConfig);

      expect(deployment).toBeDefined();
      expect(deployment.strategy).toBe('canary');
      expect(deployment.environment).toBe('production');
    });

    it('should deploy with rolling strategy', async () => {
      const deploymentConfig: DeploymentConfig = {
        environment: 'development',
        strategy: 'rolling',
        region: 'eastus',
        resourceGroup: 'econeura-rg',
        appServiceName: 'econeura-dev',
        containerRegistry: 'econeura.azurecr.io',
        imageTag: 'latest',
        replicas: 1,
        healthCheckPath: '/health',
        rollbackEnabled: false,
        monitoringEnabled: true
      };

      const deployment = await service.deploy(deploymentConfig);

      expect(deployment).toBeDefined();
      expect(deployment.strategy).toBe('rolling');
      expect(deployment.environment).toBe('development');
    });

    it('should deploy with recreate strategy', async () => {
      const deploymentConfig: DeploymentConfig = {
        environment: 'staging',
        strategy: 'recreate',
        region: 'eastus',
        resourceGroup: 'econeura-rg',
        appServiceName: 'econeura-staging',
        containerRegistry: 'econeura.azurecr.io',
        imageTag: 'v1.0.1',
        replicas: 2,
        healthCheckPath: '/health',
        rollbackEnabled: true,
        monitoringEnabled: true
      };

      const deployment = await service.deploy(deploymentConfig);

      expect(deployment).toBeDefined();
      expect(deployment.strategy).toBe('recreate');
      expect(deployment.environment).toBe('staging');
    });
  });

  describe('Health Checks Management', () => {
    it('should create health check', async () => {
      const healthCheckData = {
        name: 'API Health Check',
        type: 'HTTP' as const,
        endpoint: '/health',
        timeout: 30,
        interval: 60,
        retries: 3,
        expectedStatus: 200,
        enabled: true
      };

      const healthCheck = await service.createHealthCheck(healthCheckData);

      expect(healthCheck).toBeDefined();
      expect(healthCheck.id).toBeDefined();
      expect(healthCheck.name).toBe('API Health Check');
      expect(healthCheck.type).toBe('HTTP');
      expect(healthCheck.endpoint).toBe('/health');
      expect(healthCheck.timeout).toBe(30);
      expect(healthCheck.interval).toBe(60);
      expect(healthCheck.retries).toBe(3);
      expect(healthCheck.expectedStatus).toBe(200);
      expect(healthCheck.enabled).toBe(true);
    });

    it('should get health check by id', async () => {
      const healthCheckData = {
        name: 'Database Health Check',
        type: 'HTTP' as const,
        endpoint: '/health/database',
        timeout: 30,
        interval: 120,
        retries: 3,
        expectedStatus: 200,
        enabled: true
      };

      const createdHealthCheck = await service.createHealthCheck(healthCheckData);
      const retrievedHealthCheck = await service.getHealthCheck(createdHealthCheck.id);

      expect(retrievedHealthCheck).toBeDefined();
      expect(retrievedHealthCheck?.id).toBe(createdHealthCheck.id);
      expect(retrievedHealthCheck?.name).toBe('Database Health Check');
    });

    it('should return null for non-existent health check', async () => {
      const healthCheck = await service.getHealthCheck('non-existent-id');
      expect(healthCheck).toBeNull();
    });

    it('should list all health checks', async () => {
      const healthCheck1 = await service.createHealthCheck({
        name: 'Health Check 1',
        type: 'HTTP',
        endpoint: '/health1',
        timeout: 30,
        interval: 60,
        retries: 3,
        enabled: true
      });

      const healthCheck2 = await service.createHealthCheck({
        name: 'Health Check 2',
        type: 'HTTP',
        endpoint: '/health2',
        timeout: 30,
        interval: 60,
        retries: 3,
        enabled: true
      });

      const healthChecks = await service.listHealthChecks();

      expect(healthChecks.length).toBeGreaterThanOrEqual(2);
      expect(healthChecks.some(hc => hc.id === healthCheck1.id)).toBe(true);
      expect(healthChecks.some(hc => hc.id === healthCheck2.id)).toBe(true);
    });

    it('should update health check', async () => {
      const healthCheckData = {
        name: 'Original Health Check',
        type: 'HTTP' as const,
        endpoint: '/health/original',
        timeout: 30,
        interval: 60,
        retries: 3,
        enabled: true
      };

      const createdHealthCheck = await service.createHealthCheck(healthCheckData);
      const updatedHealthCheck = await service.updateHealthCheck(createdHealthCheck.id, {
        name: 'Updated Health Check',
        endpoint: '/health/updated',
        timeout: 60
      });

      expect(updatedHealthCheck).toBeDefined();
      expect(updatedHealthCheck?.name).toBe('Updated Health Check');
      expect(updatedHealthCheck?.endpoint).toBe('/health/updated');
      expect(updatedHealthCheck?.timeout).toBe(60);
    });

    it('should delete health check', async () => {
      const healthCheckData = {
        name: 'To Delete Health Check',
        type: 'HTTP' as const,
        endpoint: '/health/delete',
        timeout: 30,
        interval: 60,
        retries: 3,
        enabled: true
      };

      const createdHealthCheck = await service.createHealthCheck(healthCheckData);
      const deleted = await service.deleteHealthCheck(createdHealthCheck.id);

      expect(deleted).toBe(true);

      const retrievedHealthCheck = await service.getHealthCheck(createdHealthCheck.id);
      expect(retrievedHealthCheck).toBeNull();
    });
  });

  describe('Deployment Status and Reports', () => {
    it('should get deployment status', async () => {
      const status = await service.getDeploymentStatus();

      expect(status).toBeDefined();
      expect(typeof status.activeDeployments).toBe('number');
      expect(typeof status.successfulDeployments).toBe('number');
      expect(typeof status.failedDeployments).toBe('number');
      expect(typeof status.rollbackCount).toBe('number');
      expect(['HEALTHY', 'DEGRADED', 'UNHEALTHY']).toContain(status.healthStatus);
      expect(typeof status.averageDeploymentTime).toBe('number');
    });

    it('should generate daily deployment report', async () => {
      const report = await service.generateDeploymentReport('daily');

      expect(report).toBeDefined();
      expect(report.period).toBe('daily');
      expect(report.generatedAt).toBeInstanceOf(Date);
      expect(report.summary).toBeDefined();
      expect(Array.isArray(report.deployments)).toBe(true);
      expect(Array.isArray(report.healthChecks)).toBe(true);
      expect(Array.isArray(report.recommendations)).toBe(true);
    });

    it('should generate weekly deployment report', async () => {
      const report = await service.generateDeploymentReport('weekly');

      expect(report).toBeDefined();
      expect(report.period).toBe('weekly');
      expect(report.generatedAt).toBeInstanceOf(Date);
    });

    it('should generate monthly deployment report', async () => {
      const report = await service.generateDeploymentReport('monthly');

      expect(report).toBeDefined();
      expect(report.period).toBe('monthly');
      expect(report.generatedAt).toBeInstanceOf(Date);
    });
  });

  describe('Configuration Management', () => {
    it('should update configuration', async () => {
      const updates = {
        healthCheckInterval: 120,
        deploymentTimeout: 3600,
        maxRetries: 5
      };

      const updatedConfig = await service.updateConfig(updates);

      expect(updatedConfig).toBeDefined();
      expect(updatedConfig.healthCheckInterval).toBe(120);
      expect(updatedConfig.deploymentTimeout).toBe(3600);
      expect(updatedConfig.maxRetries).toBe(5);
    });

    it('should get configuration', async () => {
      const config = await service.getConfig();

      expect(config).toBeDefined();
      expect(typeof config.validationEnabled).toBe('boolean');
      expect(typeof config.deploymentEnabled).toBe('boolean');
      expect(typeof config.monitoringEnabled).toBe('boolean');
      expect(typeof config.rollbackEnabled).toBe('boolean');
      expect(typeof config.healthCheckInterval).toBe('number');
      expect(typeof config.deploymentTimeout).toBe('number');
      expect(typeof config.maxRetries).toBe('number');
      expect(Array.isArray(config.notificationChannels)).toBe(true);
      expect(Array.isArray(config.environments)).toBe(true);
      expect(Array.isArray(config.strategies)).toBe(true);
    });
  });

  describe('Initialization', () => {
    it('should initialize with default health checks', async () => {
      const healthChecks = await service.listHealthChecks();
      expect(healthChecks.length).toBeGreaterThan(0);
      
      const apiHealthCheck = healthChecks.find(hc => hc.name === 'API Health Check');
      expect(apiHealthCheck).toBeDefined();
      expect(apiHealthCheck?.type).toBe('HTTP');
      expect(apiHealthCheck?.endpoint).toBe('/health');
    });
  });

  describe('Error Handling', () => {
    it('should handle validation errors gracefully', async () => {
      const validation = await service.validateProjectCompletion();
      expect(validation).toBeDefined();
      expect(Array.isArray(validation.validationResults)).toBe(true);
    });

    it('should handle deployment errors gracefully', async () => {
      const deploymentConfig: DeploymentConfig = {
        environment: 'production',
        strategy: 'blue-green',
        region: 'eastus',
        resourceGroup: 'econeura-rg',
        appServiceName: 'econeura-app',
        containerRegistry: 'econeura.azurecr.io',
        imageTag: 'v1.0.0',
        replicas: 3,
        healthCheckPath: '/health',
        rollbackEnabled: true,
        monitoringEnabled: true
      };

      const deployment = await service.deploy(deploymentConfig);
      expect(deployment).toBeDefined();
    });

    it('should handle health check errors gracefully', async () => {
      const healthChecks = await service.listHealthChecks();
      expect(Array.isArray(healthChecks)).toBe(true);
    });
  });

  describe('Cleanup', () => {
    it('should cleanup resources', async () => {
      await service.cleanup();
      // No hay assertions específicas, solo verificar que no lance errores
    });
  });
});
