import { structuredLogger } from '../lib/structured-logger.js';
import { getDatabaseService } from '@econeura/db';

// ============================================================================
// AI MODEL MANAGEMENT SERVICE - PR-19
// ============================================================================

export interface AIModel {
  id: string;
  name: string;
  description: string;
  type: 'classification' | 'regression' | 'clustering' | 'nlp' | 'computer_vision' | 'generative';
  algorithm: string;
  version: string;
  status: 'development' | 'testing' | 'staging' | 'production' | 'archived';
  performance: ModelPerformance;
  metadata: ModelMetadata;
  createdAt: Date;
  updatedAt: Date;
  deployedAt?: Date;
  archivedAt?: Date;
}

export interface ModelPerformance {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  latency: number;
  throughput: number;
  memoryUsage: number;
  cpuUsage: number;
  lastEvaluated: Date;
  evaluationCount: number;
  driftScore?: number;
  dataQuality?: number;
}

export interface ModelMetadata {
  trainingData: {
    size: number;
    features: string[];
    targetColumn?: string;
    dataQuality: number;
    lastUpdated: Date;
  };
  hyperparameters: Record<string, any>;
  architecture?: {
    layers?: number;
    neurons?: number[];
    activation?: string;
    optimizer?: string;
    lossFunction?: string;
  };
  deployment: {
    environment: string;
    replicas: number;
    resources: {
      cpu: string;
      memory: string;
      gpu?: string;
    };
    scaling: {
      minReplicas: number;
      maxReplicas: number;
      targetUtilization: number;
    };
  };
  monitoring: {
    enabled: boolean;
    alerts: AlertConfig[];
    metrics: string[];
    thresholds: Record<string, number>;
  };
}

export interface AlertConfig {
  id: string;
  name: string;
  metric: string;
  condition: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  channels: string[];
  cooldown: number;
}

export interface ModelDeployment {
  id: string;
  modelId: string;
  environment: 'development' | 'staging' | 'production';
  status: 'pending' | 'deploying' | 'active' | 'failed' | 'scaling' | 'rolling_back';
  replicas: number;
  targetReplicas: number;
  resources: {
    cpu: string;
    memory: string;
    gpu?: string;
  };
  endpoints: ModelEndpoint[];
  health: DeploymentHealth;
  createdAt: Date;
  updatedAt: Date;
  deployedAt?: Date;
}

export interface ModelEndpoint {
  id: string;
  name: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  authentication: 'none' | 'api_key' | 'jwt' | 'oauth';
  rateLimit: {
    requests: number;
    window: number;
  };
  version: string;
  status: 'active' | 'inactive' | 'maintenance';
  lastHealthCheck: Date;
}

export interface DeploymentHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  responseTime: number;
  errorRate: number;
  lastCheck: Date;
  checks: HealthCheck[];
}

export interface HealthCheck {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
  timestamp: Date;
  duration: number;
}

export interface ModelABTest {
  id: string;
  name: string;
  description: string;
  modelA: string;
  modelB: string;
  trafficSplit: number; // Percentage for model A (0-100)
  status: 'draft' | 'running' | 'completed' | 'cancelled';
  metrics: ABTestMetrics;
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ABTestMetrics {
  modelA: {
    requests: number;
    successRate: number;
    avgResponseTime: number;
    accuracy: number;
    businessMetrics: Record<string, number>;
  };
  modelB: {
    requests: number;
    successRate: number;
    avgResponseTime: number;
    accuracy: number;
    businessMetrics: Record<string, number>;
  };
  statisticalSignificance: number;
  confidence: number;
  winner?: 'A' | 'B' | 'inconclusive';
}

export interface ModelRollback {
  id: string;
  modelId: string;
  fromVersion: string;
  toVersion: string;
  reason: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  initiatedBy: string;
  createdAt: Date;
  completedAt?: Date;
  rollbackData: {
    deploymentId: string;
    endpointUrls: string[];
    trafficRedirected: boolean;
    dataBackup: boolean;
  };
}

export class AIModelManagementService {
  private db: ReturnType<typeof getDatabaseService>;
  private models: Map<string, AIModel> = new Map();
  private deployments: Map<string, ModelDeployment> = new Map();
  private abTests: Map<string, ModelABTest> = new Map();
  private isInitialized: boolean = false;

  constructor() {
    this.db = getDatabaseService();
    this.initializeService();
  }

  private async initializeService(): Promise<void> {
    try {
      structuredLogger.info('Initializing AI Model Management Service', {
        service: 'AIModelManagementService',
        timestamp: new Date().toISOString()
      });

      // Crear tablas si no existen
      await this.createTables();

      // Cargar modelos y deployments activos
      await this.loadActiveModels();
      await this.loadActiveDeployments();

      this.isInitialized = true;
      structuredLogger.info('AI Model Management Service initialized successfully');
    } catch (error) {
      structuredLogger.error('Failed to initialize AI Model Management Service', error as Error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    try {
      // Tabla de modelos
      await this.db.query(`
        CREATE TABLE IF NOT EXISTS ai_models (
          id VARCHAR PRIMARY KEY,
          name VARCHAR NOT NULL,
          description TEXT,
          type VARCHAR NOT NULL,
          algorithm VARCHAR NOT NULL,
          version VARCHAR NOT NULL,
          status VARCHAR NOT NULL DEFAULT 'development',
          performance JSONB NOT NULL,
          metadata JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          deployed_at TIMESTAMP,
          archived_at TIMESTAMP
        )
      `);

      // Tabla de deployments
      await this.db.query(`
        CREATE TABLE IF NOT EXISTS model_deployments (
          id VARCHAR PRIMARY KEY,
          model_id VARCHAR NOT NULL REFERENCES ai_models(id),
          environment VARCHAR NOT NULL,
          status VARCHAR NOT NULL DEFAULT 'pending',
          replicas INTEGER NOT NULL DEFAULT 1,
          target_replicas INTEGER NOT NULL DEFAULT 1,
          resources JSONB NOT NULL,
          endpoints JSONB NOT NULL,
          health JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          deployed_at TIMESTAMP
        )
      `);

      // Tabla de A/B tests
      await this.db.query(`
        CREATE TABLE IF NOT EXISTS model_ab_tests (
          id VARCHAR PRIMARY KEY,
          name VARCHAR NOT NULL,
          description TEXT,
          model_a VARCHAR NOT NULL REFERENCES ai_models(id),
          model_b VARCHAR NOT NULL REFERENCES ai_models(id),
          traffic_split INTEGER NOT NULL DEFAULT 50,
          status VARCHAR NOT NULL DEFAULT 'draft',
          metrics JSONB NOT NULL,
          start_date TIMESTAMP,
          end_date TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Tabla de rollbacks
      await this.db.query(`
        CREATE TABLE IF NOT EXISTS model_rollbacks (
          id VARCHAR PRIMARY KEY,
          model_id VARCHAR NOT NULL REFERENCES ai_models(id),
          from_version VARCHAR NOT NULL,
          to_version VARCHAR NOT NULL,
          reason TEXT NOT NULL,
          status VARCHAR NOT NULL DEFAULT 'pending',
          initiated_by VARCHAR NOT NULL,
          rollback_data JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          completed_at TIMESTAMP
        )
      `);

      structuredLogger.info('AI Model Management tables created successfully');
    } catch (error) {
      structuredLogger.error('Failed to create AI Model Management tables', error as Error);
      throw error;
    }
  }

  private async loadActiveModels(): Promise<void> {
    try {
      const result = await this.db.query(`
        SELECT * FROM ai_models
        WHERE status IN ('development', 'testing', 'staging', 'production')
      `);

      for (const row of result.rows) {
        this.models.set(row.id, this.mapRowToModel(row));
      }

      structuredLogger.info(`Loaded ${this.models.size} active models`);
    } catch (error) {
      structuredLogger.error('Failed to load active models', error as Error);
    }
  }

  private async loadActiveDeployments(): Promise<void> {
    try {
      const result = await this.db.query(`
        SELECT * FROM model_deployments
        WHERE status IN ('pending', 'deploying', 'active', 'scaling')
      `);

      for (const row of result.rows) {
        this.deployments.set(row.id, this.mapRowToDeployment(row));
      }

      structuredLogger.info(`Loaded ${this.deployments.size} active deployments`);
    } catch (error) {
      structuredLogger.error('Failed to load active deployments', error as Error);
    }
  }

  // ============================================================================
  // MODEL MANAGEMENT
  // ============================================================================

  async createModel(model: Omit<AIModel, 'id' | 'createdAt' | 'updatedAt'>): Promise<AIModel> {
    if (!this.isInitialized) {
      throw new Error('AI Model Management Service not initialized');
    }

    try {
      const id = `model_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date();

      const newModel: AIModel = {
        id,
        ...model,
        createdAt: now,
        updatedAt: now
      };

      await this.db.query(`
        INSERT INTO ai_models (
          id, name, description, type, algorithm, version, status,
          performance, metadata, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
        newModel.id,
        newModel.name,
        newModel.description,
        newModel.type,
        newModel.algorithm,
        newModel.version,
        newModel.status,
        JSON.stringify(newModel.performance),
        JSON.stringify(newModel.metadata),
        newModel.createdAt,
        newModel.updatedAt
      ]);

      this.models.set(newModel.id, newModel);

      structuredLogger.info('AI model created successfully', {
        modelId: newModel.id,
        name: newModel.name,
        type: newModel.type,
        algorithm: newModel.algorithm,
        version: newModel.version
      });

      return newModel;
    } catch (error) {
      structuredLogger.error('Failed to create AI model', error as Error);
      throw error;
    }
  }

  async getModel(modelId: string): Promise<AIModel | null> {
    const model = this.models.get(modelId);
    if (model) return model;

    try {
      const result = await this.db.query(
        'SELECT * FROM ai_models WHERE id = $1',
        [modelId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToModel(result.rows[0]);
    } catch (error) {
      structuredLogger.error('Failed to get AI model', error as Error);
      throw error;
    }
  }

  async listModels(limit: number = 50, offset: number = 0, status?: string): Promise<AIModel[]> {
    try {
      let query = 'SELECT * FROM ai_models';
      const params: any[] = [];

      if (status) {
        query += ' WHERE status = $1';
        params.push(status);
      }

      query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
      params.push(limit, offset);

      const result = await this.db.query(query, params);
      return result.rows.map(row => this.mapRowToModel(row));
    } catch (error) {
      structuredLogger.error('Failed to list AI models', error as Error);
      throw error;
    }
  }

  async updateModelStatus(modelId: string, status: AIModel['status']): Promise<void> {
    try {
      const now = new Date();
      const updateFields = ['status = $1', 'updated_at = $2'];
      const params: any[] = [status, now];

      if (status === 'production') {
        updateFields.push('deployed_at = $3');
        params.push(now);
      } else if (status === 'archived') {
        updateFields.push('archived_at = $3');
        params.push(now);
      }

      params.push(modelId);

      await this.db.query(`
        UPDATE ai_models
        SET ${updateFields.join(', ')}
        WHERE id = $${params.length}
      `, params);

      // Actualizar en memoria
      const model = this.models.get(modelId);
      if (model) {
        model.status = status;
        model.updatedAt = now;
        if (status === 'production') {
          model.deployedAt = now;
        } else if (status === 'archived') {
          model.archivedAt = now;
        }
      }

      structuredLogger.info('Model status updated', {
        modelId,
        status
      });
    } catch (error) {
      structuredLogger.error('Failed to update model status', error as Error);
      throw error;
    }
  }

  async updateModelPerformance(modelId: string, performance: Partial<ModelPerformance>): Promise<void> {
    try {
      const model = await this.getModel(modelId);
      if (!model) {
        throw new Error(`Model ${modelId} not found`);
      }

      const updatedPerformance = {
        ...model.performance,
        ...performance,
        lastEvaluated: new Date(),
        evaluationCount: model.performance.evaluationCount + 1
      };

      await this.db.query(`
        UPDATE ai_models
        SET performance = $1, updated_at = NOW()
        WHERE id = $2
      `, [JSON.stringify(updatedPerformance), modelId]);

      // Actualizar en memoria
      model.performance = updatedPerformance;
      model.updatedAt = new Date();

      structuredLogger.info('Model performance updated', {
        modelId,
        performance: updatedPerformance
      });
    } catch (error) {
      structuredLogger.error('Failed to update model performance', error as Error);
      throw error;
    }
  }

  // ============================================================================
  // DEPLOYMENT MANAGEMENT
  // ============================================================================

  async deployModel(modelId: string, environment: ModelDeployment['environment'], config: Partial<ModelDeployment>): Promise<ModelDeployment> {
    if (!this.isInitialized) {
      throw new Error('AI Model Management Service not initialized');
    }

    try {
      const model = await this.getModel(modelId);
      if (!model) {
        throw new Error(`Model ${modelId} not found`);
      }

      const deploymentId = `deployment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date();

      const deployment: ModelDeployment = {
        id: deploymentId,
        modelId,
        environment,
        status: 'pending',
        replicas: config.replicas || 1,
        targetReplicas: config.targetReplicas || 1,
        resources: config.resources || {
          cpu: '100m',
          memory: '256Mi'
        },
        endpoints: config.endpoints || [],
        health: {
          status: 'healthy',
          uptime: 0,
          responseTime: 0,
          errorRate: 0,
          lastCheck: now,
          checks: []
        },
        createdAt: now,
        updatedAt: now
      };

      await this.db.query(`
        INSERT INTO model_deployments (
          id, model_id, environment, status, replicas, target_replicas,
          resources, endpoints, health, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
        deployment.id,
        deployment.modelId,
        deployment.environment,
        deployment.status,
        deployment.replicas,
        deployment.targetReplicas,
        JSON.stringify(deployment.resources),
        JSON.stringify(deployment.endpoints),
        JSON.stringify(deployment.health),
        deployment.createdAt,
        deployment.updatedAt
      ]);

      this.deployments.set(deployment.id, deployment);

      // Simular deployment
      this.simulateDeployment(deployment.id);

      structuredLogger.info('Model deployment initiated', {
        deploymentId: deployment.id,
        modelId,
        environment
      });

      return deployment;
    } catch (error) {
      structuredLogger.error('Failed to deploy model', error as Error);
      throw error;
    }
  }

  private async simulateDeployment(deploymentId: string): Promise<void> {
    const deployment = this.deployments.get(deploymentId);
    if (!deployment) return;

    try {
      // Simular proceso de deployment
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Actualizar estado a deploying
      deployment.status = 'deploying';
      deployment.updatedAt = new Date();

      await this.db.query(`
        UPDATE model_deployments
        SET status = 'deploying', updated_at = NOW()
        WHERE id = $1
      `, [deploymentId]);

      // Simular más tiempo de deployment
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Completar deployment
      deployment.status = 'active';
      deployment.deployedAt = new Date();
      deployment.updatedAt = new Date();

      // Crear endpoint simulado
      const endpoint: ModelEndpoint = {
        id: `endpoint_${Date.now()}`,
        name: 'prediction',
        url: `https://api.example.com/v1/models/${deployment.modelId}/predict`,
        method: 'POST',
        authentication: 'api_key',
        rateLimit: {
          requests: 1000,
          window: 3600
        },
        version: '1.0.0',
        status: 'active',
        lastHealthCheck: new Date()
      };

      deployment.endpoints = [endpoint];

      await this.db.query(`
        UPDATE model_deployments
        SET status = 'active', deployed_at = NOW(), updated_at = NOW(),
            endpoints = $1
        WHERE id = $2
      `, [JSON.stringify(deployment.endpoints), deploymentId]);

      structuredLogger.info('Model deployment completed', {
        deploymentId,
        status: deployment.status,
        endpoints: deployment.endpoints.length
      });
    } catch (error) {
      // Marcar deployment como fallido
      deployment.status = 'failed';
      deployment.updatedAt = new Date();

      await this.db.query(`
        UPDATE model_deployments
        SET status = 'failed', updated_at = NOW()
        WHERE id = $1
      `, [deploymentId]);

      structuredLogger.error('Model deployment failed', error as Error, {
        deploymentId
      });
    }
  }

  async getDeployment(deploymentId: string): Promise<ModelDeployment | null> {
    const deployment = this.deployments.get(deploymentId);
    if (deployment) return deployment;

    try {
      const result = await this.db.query(
        'SELECT * FROM model_deployments WHERE id = $1',
        [deploymentId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToDeployment(result.rows[0]);
    } catch (error) {
      structuredLogger.error('Failed to get model deployment', error as Error);
      throw error;
    }
  }

  async listDeployments(limit: number = 50, offset: number = 0): Promise<ModelDeployment[]> {
    try {
      const result = await this.db.query(`
        SELECT * FROM model_deployments
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
      `, [limit, offset]);

      return result.rows.map(row => this.mapRowToDeployment(row));
    } catch (error) {
      structuredLogger.error('Failed to list model deployments', error as Error);
      throw error;
    }
  }

  // ============================================================================
  // A/B TESTING
  // ============================================================================

  async createABTest(test: Omit<ModelABTest, 'id' | 'createdAt' | 'updatedAt' | 'metrics'>): Promise<ModelABTest> {
    if (!this.isInitialized) {
      throw new Error('AI Model Management Service not initialized');
    }

    try {
      const id = `abtest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date();

      const newTest: ModelABTest = {
        id,
        ...test,
        metrics: {
          modelA: {
            requests: 0,
            successRate: 0,
            avgResponseTime: 0,
            accuracy: 0,
            businessMetrics: {}
          },
          modelB: {
            requests: 0,
            successRate: 0,
            avgResponseTime: 0,
            accuracy: 0,
            businessMetrics: {}
          },
          statisticalSignificance: 0,
          confidence: 0
        },
        createdAt: now,
        updatedAt: now
      };

      await this.db.query(`
        INSERT INTO model_ab_tests (
          id, name, description, model_a, model_b, traffic_split,
          status, metrics, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        newTest.id,
        newTest.name,
        newTest.description,
        newTest.modelA,
        newTest.modelB,
        newTest.trafficSplit,
        newTest.status,
        JSON.stringify(newTest.metrics),
        newTest.createdAt,
        newTest.updatedAt
      ]);

      this.abTests.set(newTest.id, newTest);

      structuredLogger.info('A/B test created successfully', {
        testId: newTest.id,
        name: newTest.name,
        modelA: newTest.modelA,
        modelB: newTest.modelB,
        trafficSplit: newTest.trafficSplit
      });

      return newTest;
    } catch (error) {
      structuredLogger.error('Failed to create A/B test', error as Error);
      throw error;
    }
  }

  async startABTest(testId: string): Promise<void> {
    try {
      const test = this.abTests.get(testId);
      if (!test) {
        throw new Error(`A/B test ${testId} not found`);
      }

      if (test.status !== 'draft') {
        throw new Error(`A/B test ${testId} is not in draft status`);
      }

      test.status = 'running';
      test.startDate = new Date();
      test.updatedAt = new Date();

      await this.db.query(`
        UPDATE model_ab_tests
        SET status = 'running', start_date = NOW(), updated_at = NOW()
        WHERE id = $1
      `, [testId]);

      structuredLogger.info('A/B test started', {
        testId,
        startDate: test.startDate
      });
    } catch (error) {
      structuredLogger.error('Failed to start A/B test', error as Error);
      throw error;
    }
  }

  // ============================================================================
  // ROLLBACK MANAGEMENT
  // ============================================================================

  async rollbackModel(modelId: string, fromVersion: string, toVersion: string, reason: string, initiatedBy: string): Promise<ModelRollback> {
    if (!this.isInitialized) {
      throw new Error('AI Model Management Service not initialized');
    }

    try {
      const rollbackId = `rollback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date();

      const rollback: ModelRollback = {
        id: rollbackId,
        modelId,
        fromVersion,
        toVersion,
        reason,
        status: 'pending',
        initiatedBy,
        createdAt: now,
        rollbackData: {
          deploymentId: '',
          endpointUrls: [],
          trafficRedirected: false,
          dataBackup: false
        }
      };

      await this.db.query(`
        INSERT INTO model_rollbacks (
          id, model_id, from_version, to_version, reason, status,
          initiated_by, rollback_data, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        rollback.id,
        rollback.modelId,
        rollback.fromVersion,
        rollback.toVersion,
        rollback.reason,
        rollback.status,
        rollback.initiatedBy,
        JSON.stringify(rollback.rollbackData),
        rollback.createdAt
      ]);

      // Simular rollback
      this.simulateRollback(rollback.id);

      structuredLogger.info('Model rollback initiated', {
        rollbackId: rollback.id,
        modelId,
        fromVersion,
        toVersion,
        reason,
        initiatedBy
      });

      return rollback;
    } catch (error) {
      structuredLogger.error('Failed to initiate model rollback', error as Error);
      throw error;
    }
  }

  private async simulateRollback(rollbackId: string): Promise<void> {
    try {
      // Simular proceso de rollback
      await new Promise(resolve => setTimeout(resolve, 1000));

      await this.db.query(`
        UPDATE model_rollbacks
        SET status = 'in_progress', rollback_data = $1
        WHERE id = $2
      `, [
        JSON.stringify({
          deploymentId: 'deployment_123',
          endpointUrls: ['https://api.example.com/v1/models/model_123/predict'],
          trafficRedirected: true,
          dataBackup: true
        }),
        rollbackId
      ]);

      // Simular más tiempo de rollback
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Completar rollback
      await this.db.query(`
        UPDATE model_rollbacks
        SET status = 'completed', completed_at = NOW()
        WHERE id = $1
      `, [rollbackId]);

      structuredLogger.info('Model rollback completed', {
        rollbackId
      });
    } catch (error) {
      // Marcar rollback como fallido
      await this.db.query(`
        UPDATE model_rollbacks
        SET status = 'failed'
        WHERE id = $1
      `, [rollbackId]);

      structuredLogger.error('Model rollback failed', error as Error, {
        rollbackId
      });
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private mapRowToModel(row: any): AIModel {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      type: row.type,
      algorithm: row.algorithm,
      version: row.version,
      status: row.status,
      performance: row.performance,
      metadata: row.metadata,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      deployedAt: row.deployed_at ? new Date(row.deployed_at) : undefined,
      archivedAt: row.archived_at ? new Date(row.archived_at) : undefined
    };
  }

  private mapRowToDeployment(row: any): ModelDeployment {
    return {
      id: row.id,
      modelId: row.model_id,
      environment: row.environment,
      status: row.status,
      replicas: row.replicas,
      targetReplicas: row.target_replicas,
      resources: row.resources,
      endpoints: row.endpoints,
      health: row.health,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      deployedAt: row.deployed_at ? new Date(row.deployed_at) : undefined
    };
  }

  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    models: number;
    deployments: number;
    abTests: number;
    lastCheck: Date;
  }> {
    try {
      const modelsCount = this.models.size;
      const deploymentsCount = this.deployments.size;
      const abTestsCount = this.abTests.size;

      const status = modelsCount > 0 ? 'healthy' : 'degraded';

      return {
        status,
        models: modelsCount,
        deployments: deploymentsCount,
        abTests: abTestsCount,
        lastCheck: new Date()
      };
    } catch (error) {
      structuredLogger.error('Failed to get health status', error as Error);
      return {
        status: 'unhealthy',
        models: 0,
        deployments: 0,
        abTests: 0,
        lastCheck: new Date()
      };
    }
  }
}

// ============================================================================
// EXPORT SINGLETON
// ============================================================================

export const aiModelManagementService = new AIModelManagementService();
