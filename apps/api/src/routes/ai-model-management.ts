import { Router } from 'express';
import { z } from 'zod';
import { aiModelManagementService } from '../services/ai-model-management.service.js';
import { structuredLogger } from '../lib/structured-logger.js';
import { authenticateToken } from '../middleware/auth.js';
import { rateLimiter } from '../middleware/rate-limiter.js';

// ============================================================================
// AI MODEL MANAGEMENT ROUTES - PR-19
// ============================================================================

const router = Router();

// Aplicar middleware de autenticación y rate limiting
router.use(authenticateToken);
router.use(rateLimiter);

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const ModelPerformanceSchema = z.object({
  accuracy: z.number().min(0).max(1),
  precision: z.number().min(0).max(1),
  recall: z.number().min(0).max(1),
  f1Score: z.number().min(0).max(1),
  latency: z.number().positive(),
  throughput: z.number().positive(),
  memoryUsage: z.number().positive(),
  cpuUsage: z.number().min(0).max(100),
  lastEvaluated: z.date().optional(),
  evaluationCount: z.number().nonnegative().optional(),
  driftScore: z.number().min(0).max(1).optional(),
  dataQuality: z.number().min(0).max(1).optional()
});

const ModelMetadataSchema = z.object({
  trainingData: z.object({
    size: z.number().positive(),
    features: z.array(z.string()),
    targetColumn: z.string().optional(),
    dataQuality: z.number().min(0).max(1),
    lastUpdated: z.date()
  }),
  hyperparameters: z.record(z.any()),
  architecture: z.object({
    layers: z.number().positive().optional(),
    neurons: z.array(z.number().positive()).optional(),
    activation: z.string().optional(),
    optimizer: z.string().optional(),
    lossFunction: z.string().optional()
  }).optional(),
  deployment: z.object({
    environment: z.string(),
    replicas: z.number().positive(),
    resources: z.object({
      cpu: z.string(),
      memory: z.string(),
      gpu: z.string().optional()
    }),
    scaling: z.object({
      minReplicas: z.number().positive(),
      maxReplicas: z.number().positive(),
      targetUtilization: z.number().min(0).max(100)
    })
  }),
  monitoring: z.object({
    enabled: z.boolean(),
    alerts: z.array(z.object({
      id: z.string(),
      name: z.string(),
      metric: z.string(),
      condition: z.enum(['gt', 'lt', 'eq', 'gte', 'lte']),
      threshold: z.number(),
      severity: z.enum(['low', 'medium', 'high', 'critical']),
      enabled: z.boolean(),
      channels: z.array(z.string()),
      cooldown: z.number().positive()
    })),
    metrics: z.array(z.string()),
    thresholds: z.record(z.number())
  })
});

const ModelSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  type: z.enum(['classification', 'regression', 'clustering', 'nlp', 'computer_vision', 'generative']),
  algorithm: z.string().min(1),
  version: z.string().min(1),
  status: z.enum(['development', 'testing', 'staging', 'production', 'archived']).optional(),
  performance: ModelPerformanceSchema,
  metadata: ModelMetadataSchema
});

const DeploymentConfigSchema = z.object({
  environment: z.enum(['development', 'staging', 'production']),
  replicas: z.number().positive().optional(),
  targetReplicas: z.number().positive().optional(),
  resources: z.object({
    cpu: z.string(),
    memory: z.string(),
    gpu: z.string().optional()
  }).optional(),
  endpoints: z.array(z.object({
    name: z.string(),
    url: z.string().url(),
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE']),
    authentication: z.enum(['none', 'api_key', 'jwt', 'oauth']),
    rateLimit: z.object({
      requests: z.number().positive(),
      window: z.number().positive()
    }),
    version: z.string()
  })).optional()
});

const ABTestSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  modelA: z.string().min(1),
  modelB: z.string().min(1),
  trafficSplit: z.number().min(0).max(100)
});

const RollbackSchema = z.object({
  fromVersion: z.string().min(1),
  toVersion: z.string().min(1),
  reason: z.string().min(1).max(500)
});

// ============================================================================
// MODEL ENDPOINTS
// ============================================================================

/**
 * @route POST /v1/ai-model-management/models
 * @desc Create a new AI model
 * @access Private
 */
router.post('/models', async (req, res) => {
  try {
    const validatedData = ModelSchema.parse(req.body);
    
    structuredLogger.info('AI model creation request received', {
      userId: req.user?.id,
      modelName: validatedData.name,
      modelType: validatedData.type,
      algorithm: validatedData.algorithm,
      version: validatedData.version
    });

    const model = await aiModelManagementService.createModel({
      ...validatedData,
      status: validatedData.status || 'development'
    });

    res.status(201).json({
      success: true,
      data: model,
      metadata: {
        service: 'ai-model-management',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    structuredLogger.error('AI model creation failed', error as Error, {
      userId: req.user?.id
    });

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /v1/ai-model-management/models
 * @desc List all AI models
 * @access Private
 */
router.get('/models', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const status = req.query.status as string;
    
    const models = await aiModelManagementService.listModels(limit, offset, status);

    res.json({
      success: true,
      data: models,
      metadata: {
        count: models.length,
        limit,
        offset,
        status: status || 'all',
        service: 'ai-model-management',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    structuredLogger.error('Failed to list AI models', error as Error);

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /v1/ai-model-management/models/:id
 * @desc Get a specific AI model
 * @access Private
 */
router.get('/models/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const model = await aiModelManagementService.getModel(id);

    if (!model) {
      return res.status(404).json({
        success: false,
        error: 'Model not found'
      });
    }

    res.json({
      success: true,
      data: model,
      metadata: {
        service: 'ai-model-management',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    structuredLogger.error('Failed to get AI model', error as Error);

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route PATCH /v1/ai-model-management/models/:id/status
 * @desc Update model status
 * @access Private
 */
router.patch('/models/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['development', 'testing', 'staging', 'production', 'archived'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status value'
      });
    }

    await aiModelManagementService.updateModelStatus(id, status);

    res.json({
      success: true,
      message: 'Model status updated successfully',
      metadata: {
        modelId: id,
        newStatus: status,
        service: 'ai-model-management',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    structuredLogger.error('Failed to update model status', error as Error);

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route PATCH /v1/ai-model-management/models/:id/performance
 * @desc Update model performance metrics
 * @access Private
 */
router.patch('/models/:id/performance', async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = ModelPerformanceSchema.partial().parse(req.body);
    
    await aiModelManagementService.updateModelPerformance(id, validatedData);

    res.json({
      success: true,
      message: 'Model performance updated successfully',
      metadata: {
        modelId: id,
        updatedMetrics: Object.keys(validatedData),
        service: 'ai-model-management',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    structuredLogger.error('Failed to update model performance', error as Error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// DEPLOYMENT ENDPOINTS
// ============================================================================

/**
 * @route POST /v1/ai-model-management/models/:id/deploy
 * @desc Deploy a model to an environment
 * @access Private
 */
router.post('/models/:id/deploy', async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = DeploymentConfigSchema.parse(req.body);
    
    structuredLogger.info('Model deployment request received', {
      userId: req.user?.id,
      modelId: id,
      environment: validatedData.environment
    });

    const deployment = await aiModelManagementService.deployModel(id, validatedData.environment, validatedData);

    res.status(201).json({
      success: true,
      data: deployment,
      metadata: {
        service: 'ai-model-management',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    structuredLogger.error('Model deployment failed', error as Error, {
      userId: req.user?.id
    });

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /v1/ai-model-management/deployments
 * @desc List all model deployments
 * @access Private
 */
router.get('/deployments', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    
    const deployments = await aiModelManagementService.listDeployments(limit, offset);

    res.json({
      success: true,
      data: deployments,
      metadata: {
        count: deployments.length,
        limit,
        offset,
        service: 'ai-model-management',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    structuredLogger.error('Failed to list model deployments', error as Error);

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /v1/ai-model-management/deployments/:id
 * @desc Get a specific model deployment
 * @access Private
 */
router.get('/deployments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const deployment = await aiModelManagementService.getDeployment(id);

    if (!deployment) {
      return res.status(404).json({
        success: false,
        error: 'Deployment not found'
      });
    }

    res.json({
      success: true,
      data: deployment,
      metadata: {
        service: 'ai-model-management',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    structuredLogger.error('Failed to get model deployment', error as Error);

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// A/B TESTING ENDPOINTS
// ============================================================================

/**
 * @route POST /v1/ai-model-management/ab-tests
 * @desc Create a new A/B test
 * @access Private
 */
router.post('/ab-tests', async (req, res) => {
  try {
    const validatedData = ABTestSchema.parse(req.body);
    
    structuredLogger.info('A/B test creation request received', {
      userId: req.user?.id,
      testName: validatedData.name,
      modelA: validatedData.modelA,
      modelB: validatedData.modelB,
      trafficSplit: validatedData.trafficSplit
    });

    const abTest = await aiModelManagementService.createABTest(validatedData);

    res.status(201).json({
      success: true,
      data: abTest,
      metadata: {
        service: 'ai-model-management',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    structuredLogger.error('A/B test creation failed', error as Error, {
      userId: req.user?.id
    });

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route POST /v1/ai-model-management/ab-tests/:id/start
 * @desc Start an A/B test
 * @access Private
 */
router.post('/ab-tests/:id/start', async (req, res) => {
  try {
    const { id } = req.params;
    
    structuredLogger.info('A/B test start request received', {
      userId: req.user?.id,
      testId: id
    });

    await aiModelManagementService.startABTest(id);

    res.json({
      success: true,
      message: 'A/B test started successfully',
      metadata: {
        testId: id,
        service: 'ai-model-management',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    structuredLogger.error('Failed to start A/B test', error as Error);

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// ROLLBACK ENDPOINTS
// ============================================================================

/**
 * @route POST /v1/ai-model-management/models/:id/rollback
 * @desc Rollback a model to a previous version
 * @access Private
 */
router.post('/models/:id/rollback', async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = RollbackSchema.parse(req.body);
    
    structuredLogger.info('Model rollback request received', {
      userId: req.user?.id,
      modelId: id,
      fromVersion: validatedData.fromVersion,
      toVersion: validatedData.toVersion,
      reason: validatedData.reason
    });

    const rollback = await aiModelManagementService.rollbackModel(
      id,
      validatedData.fromVersion,
      validatedData.toVersion,
      validatedData.reason,
      req.user?.id || 'system'
    );

    res.status(201).json({
      success: true,
      data: rollback,
      metadata: {
        service: 'ai-model-management',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    structuredLogger.error('Model rollback failed', error as Error, {
      userId: req.user?.id
    });

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// HEALTH AND STATUS ENDPOINTS
// ============================================================================

/**
 * @route GET /v1/ai-model-management/health
 * @desc Check health status of AI Model Management
 * @access Private
 */
router.get('/health', async (req, res) => {
  try {
    const healthStatus = await aiModelManagementService.getHealthStatus();
    
    res.json({
      success: true,
      data: healthStatus,
      metadata: {
        service: 'ai-model-management',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    structuredLogger.error('Health check failed', error as Error);

    res.status(500).json({
      success: false,
      error: 'Health check failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /v1/ai-model-management/status
 * @desc Get service status and statistics
 * @access Private
 */
router.get('/status', async (req, res) => {
  try {
    const healthStatus = await aiModelManagementService.getHealthStatus();
    
    res.json({
      success: true,
      data: {
        service: 'AI Model Management',
        version: '1.0.0',
        status: healthStatus.status,
        models: healthStatus.models,
        deployments: healthStatus.deployments,
        abTests: healthStatus.abTests,
        capabilities: [
          'model_management',
          'deployment_management',
          'ab_testing',
          'rollback_management',
          'performance_monitoring',
          'health_monitoring'
        ],
        supportedModelTypes: [
          'classification',
          'regression',
          'clustering',
          'nlp',
          'computer_vision',
          'generative'
        ],
        supportedEnvironments: [
          'development',
          'staging',
          'production'
        ],
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    structuredLogger.error('Status check failed', error as Error);

    res.status(500).json({
      success: false,
      error: 'Status check failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { router as aiModelManagementRoutes };
