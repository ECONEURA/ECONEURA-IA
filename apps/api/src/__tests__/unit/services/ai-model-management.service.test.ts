import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { aiModelManagementService } from '../../../services/ai-model-management.service.js';

// ============================================================================
// AI MODEL MANAGEMENT SERVICE UNIT TESTS - PR-19
// ============================================================================

// Mock de database service
const mockDb = {
  query: vi.fn()
};

vi.mock('@econeura/db', () => ({
  getDatabaseService: () => mockDb
}));

// Mock de structured logger
vi.mock('../../../lib/structured-logger.js', () => ({
  structuredLogger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

describe('AIModelManagementService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.query.mockClear();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Model Management', () => {
    it('should create a new AI model', async () => {
      const modelData = {
        name: 'Customer Classification Model',
        description: 'A model for customer behavior classification',
        type: 'classification' as const,
        algorithm: 'neural_network',
        version: '1.0.0',
        status: 'development' as const,
        performance: {
          accuracy: 0.95,
          precision: 0.92,
          recall: 0.89,
          f1Score: 0.90,
          latency: 45,
          throughput: 1200,
          memoryUsage: 256,
          cpuUsage: 15,
          lastEvaluated: new Date(),
          evaluationCount: 1
        },
        metadata: {
          trainingData: {
            size: 10000,
            features: ['age', 'income', 'purchases'],
            targetColumn: 'segment',
            dataQuality: 0.95,
            lastUpdated: new Date()
          },
          hyperparameters: {
            epochs: 100,
            batchSize: 32,
            learningRate: 0.001
          },
          deployment: {
            environment: 'production',
            replicas: 3,
            resources: {
              cpu: '100m',
              memory: '256Mi'
            },
            scaling: {
              minReplicas: 1,
              maxReplicas: 10,
              targetUtilization: 70
            }
          },
          monitoring: {
            enabled: true,
            alerts: [],
            metrics: ['accuracy', 'latency', 'throughput'],
            thresholds: {
              accuracy: 0.9,
              latency: 100,
              throughput: 1000
            }
          }
        }
      };

      mockDb.query.mockResolvedValueOnce({ rows: [] });

      const model = await aiModelManagementService.createModel(modelData);

      expect(model).toHaveProperty('id');
      expect(model.name).toBe(modelData.name);
      expect(model.type).toBe(modelData.type);
      expect(model.algorithm).toBe(modelData.algorithm);
      expect(model.version).toBe(modelData.version);
      expect(model.status).toBe(modelData.status);
      expect(model.performance).toEqual(modelData.performance);
      expect(model.metadata).toEqual(modelData.metadata);
      expect(model.createdAt).toBeInstanceOf(Date);
      expect(model.updatedAt).toBeInstanceOf(Date);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO ai_models'),
        expect.arrayContaining([
          expect.any(String), // id
          modelData.name,
          modelData.description,
          modelData.type,
          modelData.algorithm,
          modelData.version,
          modelData.status,
          JSON.stringify(modelData.performance),
          JSON.stringify(modelData.metadata),
          expect.any(Date), // createdAt
          expect.any(Date)  // updatedAt
        ])
      );
    });

    it('should get a model by ID', async () => {
      const mockModel = {
        id: 'model_123',
        name: 'Test Model',
        description: 'A test model',
        type: 'classification',
        algorithm: 'neural_network',
        version: '1.0.0',
        status: 'production',
        performance: {
          accuracy: 0.95,
          precision: 0.92,
          recall: 0.89,
          f1Score: 0.90,
          latency: 45,
          throughput: 1200,
          memoryUsage: 256,
          cpuUsage: 15,
          lastEvaluated: new Date(),
          evaluationCount: 1
        },
        metadata: {
          trainingData: {
            size: 10000,
            features: ['feature1'],
            dataQuality: 0.95,
            lastUpdated: new Date()
          },
          hyperparameters: {},
          deployment: {
            environment: 'production',
            replicas: 3,
            resources: { cpu: '100m', memory: '256Mi' },
            scaling: { minReplicas: 1, maxReplicas: 10, targetUtilization: 70 }
          },
          monitoring: {
            enabled: true,
            alerts: [],
            metrics: [],
            thresholds: {}
          }
        },
        created_at: new Date(),
        updated_at: new Date(),
        deployed_at: new Date(),
        archived_at: null
      };

      mockDb.query.mockResolvedValueOnce({ rows: [mockModel] });

      const model = await aiModelManagementService.getModel('model_123');

      expect(model).not.toBeNull();
      expect(model?.id).toBe('model_123');
      expect(model?.name).toBe('Test Model');
      expect(model?.type).toBe('classification');
      expect(model?.algorithm).toBe('neural_network');
      expect(model?.version).toBe('1.0.0');
      expect(model?.status).toBe('production');
      expect(model?.createdAt).toBeInstanceOf(Date);
      expect(model?.updatedAt).toBeInstanceOf(Date);
      expect(model?.deployedAt).toBeInstanceOf(Date);
    });

    it('should return null for non-existent model', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      const model = await aiModelManagementService.getModel('non-existent');

      expect(model).toBeNull();
    });

    it('should list models with pagination and status filter', async () => {
      const mockModels = [
        {
          id: 'model_1',
          name: 'Model 1',
          description: 'First model',
          type: 'classification',
          algorithm: 'neural_network',
          version: '1.0.0',
          status: 'production',
          performance: { accuracy: 0.95, precision: 0.92, recall: 0.89, f1Score: 0.90, latency: 45, throughput: 1200, memoryUsage: 256, cpuUsage: 15, lastEvaluated: new Date(), evaluationCount: 1 },
          metadata: { trainingData: { size: 1000, features: ['feature1'], dataQuality: 0.95, lastUpdated: new Date() }, hyperparameters: {}, deployment: { environment: 'production', replicas: 3, resources: { cpu: '100m', memory: '256Mi' }, scaling: { minReplicas: 1, maxReplicas: 10, targetUtilization: 70 } }, monitoring: { enabled: true, alerts: [], metrics: [], thresholds: {} } },
          created_at: new Date(),
          updated_at: new Date(),
          deployed_at: new Date(),
          archived_at: null
        }
      ];

      mockDb.query.mockResolvedValueOnce({ rows: mockModels });

      const models = await aiModelManagementService.listModels(10, 0, 'production');

      expect(models).toHaveLength(1);
      expect(models[0].id).toBe('model_1');
      expect(models[0].status).toBe('production');

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM ai_models'),
        ['production', 10, 0]
      );
    });

    it('should update model status', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      await aiModelManagementService.updateModelStatus('model_123', 'production');

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE ai_models'),
        ['production', expect.any(Date), expect.any(Date), 'model_123']
      );
    });

    it('should update model performance', async () => {
      const mockModel = {
        id: 'model_123',
        name: 'Test Model',
        description: 'A test model',
        type: 'classification',
        algorithm: 'neural_network',
        version: '1.0.0',
        status: 'production',
        performance: {
          accuracy: 0.95,
          precision: 0.92,
          recall: 0.89,
          f1Score: 0.90,
          latency: 45,
          throughput: 1200,
          memoryUsage: 256,
          cpuUsage: 15,
          lastEvaluated: new Date(),
          evaluationCount: 1
        },
        metadata: {
          trainingData: { size: 1000, features: ['feature1'], dataQuality: 0.95, lastUpdated: new Date() },
          hyperparameters: {},
          deployment: { environment: 'production', replicas: 3, resources: { cpu: '100m', memory: '256Mi' }, scaling: { minReplicas: 1, maxReplicas: 10, targetUtilization: 70 } },
          monitoring: { enabled: true, alerts: [], metrics: [], thresholds: {} }
        },
        created_at: new Date(),
        updated_at: new Date(),
        deployed_at: new Date(),
        archived_at: null
      };

      vi.spyOn(aiModelManagementService, 'getModel').mockResolvedValueOnce(mockModel as any);
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      const performanceUpdate = {
        accuracy: 0.96,
        latency: 40
      };

      await aiModelManagementService.updateModelPerformance('model_123', performanceUpdate);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE ai_models'),
        [expect.stringContaining('"accuracy":0.96'), 'model_123']
      );
    });
  });

  describe('Deployment Management', () => {
    it('should deploy a model to an environment', async () => {
      const mockModel = {
        id: 'model_123',
        name: 'Test Model',
        description: 'A test model',
        type: 'classification',
        algorithm: 'neural_network',
        version: '1.0.0',
        status: 'production',
        performance: { accuracy: 0.95, precision: 0.92, recall: 0.89, f1Score: 0.90, latency: 45, throughput: 1200, memoryUsage: 256, cpuUsage: 15, lastEvaluated: new Date(), evaluationCount: 1 },
        metadata: { trainingData: { size: 1000, features: ['feature1'], dataQuality: 0.95, lastUpdated: new Date() }, hyperparameters: {}, deployment: { environment: 'production', replicas: 3, resources: { cpu: '100m', memory: '256Mi' }, scaling: { minReplicas: 1, maxReplicas: 10, targetUtilization: 70 } }, monitoring: { enabled: true, alerts: [], metrics: [], thresholds: {} } },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      vi.spyOn(aiModelManagementService, 'getModel').mockResolvedValueOnce(mockModel as any);
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      const deploymentConfig = {
        environment: 'production' as const,
        replicas: 3,
        targetReplicas: 3,
        resources: {
          cpu: '200m',
          memory: '512Mi'
        }
      };

      const deployment = await aiModelManagementService.deployModel('model_123', 'production', deploymentConfig);

      expect(deployment).toHaveProperty('id');
      expect(deployment.modelId).toBe('model_123');
      expect(deployment.environment).toBe('production');
      expect(deployment.status).toBe('pending');
      expect(deployment.replicas).toBe(3);
      expect(deployment.targetReplicas).toBe(3);
      expect(deployment.resources).toEqual(deploymentConfig.resources);
      expect(deployment.createdAt).toBeInstanceOf(Date);
      expect(deployment.updatedAt).toBeInstanceOf(Date);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO model_deployments'),
        expect.arrayContaining([
          expect.any(String), // id
          'model_123',
          'production',
          'pending',
          3,
          3,
          JSON.stringify(deploymentConfig.resources),
          '[]', // endpoints
          expect.any(String), // health
          expect.any(Date), // createdAt
          expect.any(Date)  // updatedAt
        ])
      );
    });

    it('should throw error when deploying non-existent model', async () => {
      vi.spyOn(aiModelManagementService, 'getModel').mockResolvedValueOnce(null);

      await expect(aiModelManagementService.deployModel('non-existent', 'production', {}))
        .rejects.toThrow('Model non-existent not found');
    });

    it('should get a deployment by ID', async () => {
      const mockDeployment = {
        id: 'deployment_123',
        model_id: 'model_123',
        environment: 'production',
        status: 'active',
        replicas: 3,
        target_replicas: 3,
        resources: { cpu: '200m', memory: '512Mi' },
        endpoints: [{ id: 'endpoint_1', name: 'prediction', url: 'https://api.example.com/predict', method: 'POST', authentication: 'api_key', rateLimit: { requests: 1000, window: 3600 }, version: '1.0.0', status: 'active', lastHealthCheck: new Date() }],
        health: { status: 'healthy', uptime: 99.9, responseTime: 45, errorRate: 0.01, lastCheck: new Date(), checks: [] },
        created_at: new Date(),
        updated_at: new Date(),
        deployed_at: new Date()
      };

      mockDb.query.mockResolvedValueOnce({ rows: [mockDeployment] });

      const deployment = await aiModelManagementService.getDeployment('deployment_123');

      expect(deployment).not.toBeNull();
      expect(deployment?.id).toBe('deployment_123');
      expect(deployment?.modelId).toBe('model_123');
      expect(deployment?.environment).toBe('production');
      expect(deployment?.status).toBe('active');
      expect(deployment?.replicas).toBe(3);
      expect(deployment?.endpoints).toHaveLength(1);
      expect(deployment?.health.status).toBe('healthy');
    });

    it('should list deployments with pagination', async () => {
      const mockDeployments = [
        {
          id: 'deployment_1',
          model_id: 'model_1',
          environment: 'production',
          status: 'active',
          replicas: 3,
          target_replicas: 3,
          resources: { cpu: '200m', memory: '512Mi' },
          endpoints: [],
          health: { status: 'healthy', uptime: 99.9, responseTime: 45, errorRate: 0.01, lastCheck: new Date(), checks: [] },
          created_at: new Date(),
          updated_at: new Date(),
          deployed_at: new Date()
        }
      ];

      mockDb.query.mockResolvedValueOnce({ rows: mockDeployments });

      const deployments = await aiModelManagementService.listDeployments(10, 0);

      expect(deployments).toHaveLength(1);
      expect(deployments[0].id).toBe('deployment_1');
      expect(deployments[0].status).toBe('active');

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM model_deployments'),
        [10, 0]
      );
    });
  });

  describe('A/B Testing', () => {
    it('should create a new A/B test', async () => {
      const testData = {
        name: 'Model Performance Test',
        description: 'A/B test comparing two model versions',
        modelA: 'model_123',
        modelB: 'model_456',
        trafficSplit: 50
      };

      mockDb.query.mockResolvedValueOnce({ rows: [] });

      const abTest = await aiModelManagementService.createABTest(testData);

      expect(abTest).toHaveProperty('id');
      expect(abTest.name).toBe(testData.name);
      expect(abTest.description).toBe(testData.description);
      expect(abTest.modelA).toBe(testData.modelA);
      expect(abTest.modelB).toBe(testData.modelB);
      expect(abTest.trafficSplit).toBe(testData.trafficSplit);
      expect(abTest.status).toBe('draft');
      expect(abTest.metrics).toHaveProperty('modelA');
      expect(abTest.metrics).toHaveProperty('modelB');
      expect(abTest.metrics).toHaveProperty('statisticalSignificance');
      expect(abTest.createdAt).toBeInstanceOf(Date);
      expect(abTest.updatedAt).toBeInstanceOf(Date);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO model_ab_tests'),
        expect.arrayContaining([
          expect.any(String), // id
          testData.name,
          testData.description,
          testData.modelA,
          testData.modelB,
          testData.trafficSplit,
          'draft',
          expect.any(String), // metrics
          expect.any(Date), // createdAt
          expect.any(Date)  // updatedAt
        ])
      );
    });

    it('should start an A/B test', async () => {
      const mockTest = {
        id: 'abtest_123',
        name: 'Test A/B Test',
        description: 'A test A/B test',
        modelA: 'model_123',
        modelB: 'model_456',
        trafficSplit: 50,
        status: 'draft',
        metrics: {
          modelA: { requests: 0, successRate: 0, avgResponseTime: 0, accuracy: 0, businessMetrics: {} },
          modelB: { requests: 0, successRate: 0, avgResponseTime: 0, accuracy: 0, businessMetrics: {} },
          statisticalSignificance: 0,
          confidence: 0
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      vi.spyOn(aiModelManagementService, 'createABTest').mockResolvedValueOnce(mockTest as any);
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      await aiModelManagementService.startABTest('abtest_123');

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE model_ab_tests'),
        ['running', 'abtest_123']
      );
    });

    it('should throw error when starting non-existent A/B test', async () => {
      vi.spyOn(aiModelManagementService, 'createABTest').mockResolvedValueOnce(null as any);

      await expect(aiModelManagementService.startABTest('non-existent'))
        .rejects.toThrow('A/B test non-existent not found');
    });

    it('should throw error when starting A/B test not in draft status', async () => {
      const mockTest = {
        id: 'abtest_123',
        name: 'Test A/B Test',
        description: 'A test A/B test',
        modelA: 'model_123',
        modelB: 'model_456',
        trafficSplit: 50,
        status: 'running',
        metrics: {
          modelA: { requests: 0, successRate: 0, avgResponseTime: 0, accuracy: 0, businessMetrics: {} },
          modelB: { requests: 0, successRate: 0, avgResponseTime: 0, accuracy: 0, businessMetrics: {} },
          statisticalSignificance: 0,
          confidence: 0
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      vi.spyOn(aiModelManagementService, 'createABTest').mockResolvedValueOnce(mockTest as any);

      await expect(aiModelManagementService.startABTest('abtest_123'))
        .rejects.toThrow('A/B test abtest_123 is not in draft status');
    });
  });

  describe('Rollback Management', () => {
    it('should initiate a model rollback', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      const rollback = await aiModelManagementService.rollbackModel(
        'model_123',
        '2.0.0',
        '1.0.0',
        'Performance degradation detected',
        'user_123'
      );

      expect(rollback).toHaveProperty('id');
      expect(rollback.modelId).toBe('model_123');
      expect(rollback.fromVersion).toBe('2.0.0');
      expect(rollback.toVersion).toBe('1.0.0');
      expect(rollback.reason).toBe('Performance degradation detected');
      expect(rollback.status).toBe('pending');
      expect(rollback.initiatedBy).toBe('user_123');
      expect(rollback.createdAt).toBeInstanceOf(Date);
      expect(rollback.rollbackData).toHaveProperty('deploymentId');
      expect(rollback.rollbackData).toHaveProperty('endpointUrls');
      expect(rollback.rollbackData).toHaveProperty('trafficRedirected');
      expect(rollback.rollbackData).toHaveProperty('dataBackup');

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO model_rollbacks'),
        expect.arrayContaining([
          expect.any(String), // id
          'model_123',
          '2.0.0',
          '1.0.0',
          'Performance degradation detected',
          'pending',
          'user_123',
          expect.any(String), // rollbackData
          expect.any(Date)  // createdAt
        ])
      );
    });
  });

  describe('Health Status', () => {
    it('should return health status', async () => {
      const healthStatus = await aiModelManagementService.getHealthStatus();

      expect(healthStatus).toHaveProperty('status');
      expect(healthStatus).toHaveProperty('models');
      expect(healthStatus).toHaveProperty('deployments');
      expect(healthStatus).toHaveProperty('abTests');
      expect(healthStatus).toHaveProperty('lastCheck');
      expect(healthStatus.lastCheck).toBeInstanceOf(Date);
      expect(['healthy', 'degraded', 'unhealthy']).toContain(healthStatus.status);
    });
  });

  describe('Error Handling', () => {
    it('should throw error when service not initialized', async () => {
      // Reset the service to uninitialized state
      const service = new (aiModelManagementService.constructor as any)();

      await expect(service.createModel({
        name: 'test',
        type: 'classification',
        algorithm: 'neural_network',
        version: '1.0.0',
        performance: { accuracy: 0.95, precision: 0.92, recall: 0.89, f1Score: 0.90, latency: 45, throughput: 1200, memoryUsage: 256, cpuUsage: 15, lastEvaluated: new Date(), evaluationCount: 1 },
        metadata: { trainingData: { size: 1000, features: ['feature1'], dataQuality: 0.95, lastUpdated: new Date() }, hyperparameters: {}, deployment: { environment: 'production', replicas: 3, resources: { cpu: '100m', memory: '256Mi' }, scaling: { minReplicas: 1, maxReplicas: 10, targetUtilization: 70 } }, monitoring: { enabled: true, alerts: [], metrics: [], thresholds: {} } }
      })).rejects.toThrow('AI Model Management Service not initialized');
    });

    it('should handle database errors gracefully', async () => {
      mockDb.query.mockRejectedValueOnce(new Error('Database connection failed'));

      await expect(aiModelManagementService.getModel('model_123'))
        .rejects.toThrow('Database connection failed');
    });
  });

  describe('Data Mapping', () => {
    it('should map database rows to model objects correctly', async () => {
      const mockRow = {
        id: 'model_123',
        name: 'Test Model',
        description: 'A test model',
        type: 'classification',
        algorithm: 'neural_network',
        version: '1.0.0',
        status: 'production',
        performance: { accuracy: 0.95, precision: 0.92, recall: 0.89, f1Score: 0.90, latency: 45, throughput: 1200, memoryUsage: 256, cpuUsage: 15, lastEvaluated: new Date(), evaluationCount: 1 },
        metadata: { trainingData: { size: 1000, features: ['feature1'], dataQuality: 0.95, lastUpdated: new Date() }, hyperparameters: {}, deployment: { environment: 'production', replicas: 3, resources: { cpu: '100m', memory: '256Mi' }, scaling: { minReplicas: 1, maxReplicas: 10, targetUtilization: 70 } }, monitoring: { enabled: true, alerts: [], metrics: [], thresholds: {} } },
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-02'),
        deployed_at: new Date('2024-01-03'),
        archived_at: null
      };

      mockDb.query.mockResolvedValueOnce({ rows: [mockRow] });

      const model = await aiModelManagementService.getModel('model_123');

      expect(model?.id).toBe(mockRow.id);
      expect(model?.name).toBe(mockRow.name);
      expect(model?.type).toBe(mockRow.type);
      expect(model?.algorithm).toBe(mockRow.algorithm);
      expect(model?.version).toBe(mockRow.version);
      expect(model?.status).toBe(mockRow.status);
      expect(model?.performance).toEqual(mockRow.performance);
      expect(model?.metadata).toEqual(mockRow.metadata);
      expect(model?.createdAt).toEqual(mockRow.created_at);
      expect(model?.updatedAt).toEqual(mockRow.updated_at);
      expect(model?.deployedAt).toEqual(mockRow.deployed_at);
      expect(model?.archivedAt).toBeUndefined();
    });

    it('should map database rows to deployment objects correctly', async () => {
      const mockRow = {
        id: 'deployment_123',
        model_id: 'model_123',
        environment: 'production',
        status: 'active',
        replicas: 3,
        target_replicas: 3,
        resources: { cpu: '200m', memory: '512Mi' },
        endpoints: [{ id: 'endpoint_1', name: 'prediction', url: 'https://api.example.com/predict', method: 'POST', authentication: 'api_key', rateLimit: { requests: 1000, window: 3600 }, version: '1.0.0', status: 'active', lastHealthCheck: new Date() }],
        health: { status: 'healthy', uptime: 99.9, responseTime: 45, errorRate: 0.01, lastCheck: new Date(), checks: [] },
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-02'),
        deployed_at: new Date('2024-01-03')
      };

      mockDb.query.mockResolvedValueOnce({ rows: [mockRow] });

      const deployment = await aiModelManagementService.getDeployment('deployment_123');

      expect(deployment?.id).toBe(mockRow.id);
      expect(deployment?.modelId).toBe(mockRow.model_id);
      expect(deployment?.environment).toBe(mockRow.environment);
      expect(deployment?.status).toBe(mockRow.status);
      expect(deployment?.replicas).toBe(mockRow.replicas);
      expect(deployment?.targetReplicas).toBe(mockRow.target_replicas);
      expect(deployment?.resources).toEqual(mockRow.resources);
      expect(deployment?.endpoints).toEqual(mockRow.endpoints);
      expect(deployment?.health).toEqual(mockRow.health);
      expect(deployment?.createdAt).toEqual(mockRow.created_at);
      expect(deployment?.updatedAt).toEqual(mockRow.updated_at);
      expect(deployment?.deployedAt).toEqual(mockRow.deployed_at);
    });
  });
});
