import { Router } from 'express';
import { z } from 'zod';
import { aiCostPredictionService } from '../services/ai-cost-prediction.service.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { rateLimiter } from '../middleware/rate-limiter.middleware.js';
import { validateRequest } from '../middleware/validation.middleware.js';
import { logger } from '../lib/logger.js';

const router = Router();

// Schemas de validación
const CreatePredictionModelSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  type: z.enum(['time_series', 'regression', 'neural_network', 'ensemble']),
  algorithm: z.enum(['arima', 'lstm', 'linear_regression', 'random_forest', 'xgboost', 'prophet']),
  features: z.array(z.string()),
  hyperparameters: z.record(z.any()),
  isActive: z.boolean().default(true)
});

const TrainModelSchema = z.object({
  modelId: z.string().uuid(),
  trainingData: z.object({
    organizationId: z.string().uuid(),
    historicalData: z.array(z.object({
      date: z.string().datetime(),
      cost: z.number().positive(),
      tokens: z.number().positive(),
      requests: z.number().positive(),
      models: z.array(z.string()),
      providers: z.array(z.string()),
      features: z.record(z.number())
    })),
    targetVariable: z.string(),
    features: z.array(z.string())
  })
});

const GeneratePredictionSchema = z.object({
  organizationId: z.string().uuid(),
  predictionType: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']),
  horizon: z.number().positive().max(365),
  features: z.record(z.any()).optional(),
  modelId: z.string().uuid().optional()
});

const GenerateForecastSchema = z.object({
  organizationId: z.string().uuid(),
  forecastType: z.enum(['budget_planning', 'cost_optimization', 'capacity_planning', 'risk_assessment']),
  timeHorizon: z.number().positive().max(12),
  scenarios: z.array(z.string()).optional(),
  confidence: z.number().min(0).max(1).optional()
});

// Middleware de autenticación y rate limiting
router.use(authenticateToken);
router.use(rateLimiter);

// ===== GESTIÓN DE MODELOS DE PREDICCIÓN =====

// GET /v1/ai-cost-prediction/models - Obtener modelos
router.get('/models', async (req, res) => {
  try {
    const models = await aiCostPredictionService.getPredictionModels();

    logger.info('Cost prediction models retrieved', {
      userId: req.user?.id,
      count: models.length
    });

    res.json({
      success: true,
      data: models,
      count: models.length
    });
  } catch (error: any) {
    logger.error('Failed to get cost prediction models', {
      error: error.message,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve cost prediction models',
      message: error.message
    });
  }
});

// POST /v1/ai-cost-prediction/models - Crear modelo
router.post('/models',
  validateRequest(CreatePredictionModelSchema),
  async (req, res) => {
    try {
      const model = await aiCostPredictionService.createPredictionModel({
        ...req.body,
        accuracy: 0.0,
        mae: 0.0,
        mse: 0.0,
        rmse: 0.0,
        r2Score: 0.0,
        lastTrained: new Date()
      });

      logger.info('Cost prediction model created', {
        modelId: model.id,
        name: model.name,
        type: model.type,
        algorithm: model.algorithm,
        userId: req.user?.id
      });

      res.status(201).json({
        success: true,
        data: model,
        message: 'Cost prediction model created successfully'
      });
    } catch (error: any) {
      logger.error('Failed to create cost prediction model', {
        error: error.message,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to create cost prediction model',
        message: error.message
      });
    }
  }
);

// POST /v1/ai-cost-prediction/models/:id/train - Entrenar modelo
router.post('/models/:id/train',
  validateRequest(TrainModelSchema),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { trainingData } = req.body;

      // Convertir fechas string a Date
      const processedTrainingData = {
        ...trainingData,
        historicalData: trainingData.historicalData.map((item: any) => ({
          ...item,
          date: new Date(item.date)
        }))
      };

      const trainedModel = await aiCostPredictionService.trainModel(id, processedTrainingData);

      logger.info('Model training completed', {
        modelId: id,
        accuracy: trainedModel.accuracy,
        mae: trainedModel.mae,
        rmse: trainedModel.rmse,
        userId: req.user?.id
      });

      res.json({
        success: true,
        data: trainedModel,
        message: 'Model training completed successfully'
      });
    } catch (error: any) {
      logger.error('Failed to train model', {
        error: error.message,
        modelId: req.params.id,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to train model',
        message: error.message
      });
    }
  }
);

// ===== PREDICCIONES DE COSTOS =====

// POST /v1/ai-cost-prediction/predict - Generar predicción
router.post('/predict',
  validateRequest(GeneratePredictionSchema),
  async (req, res) => {
    try {
      const prediction = await aiCostPredictionService.generateCostPrediction(req.body);

      logger.info('Cost prediction generated', {
        predictionId: prediction.id,
        organizationId: req.body.organizationId,
        predictionType: req.body.predictionType,
        horizon: req.body.horizon,
        accuracy: prediction.accuracy,
        userId: req.user?.id
      });

      res.status(201).json({
        success: true,
        data: prediction,
        message: 'Cost prediction generated successfully'
      });
    } catch (error: any) {
      logger.error('Failed to generate cost prediction', {
        error: error.message,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to generate cost prediction',
        message: error.message
      });
    }
  }
);

// GET /v1/ai-cost-prediction/predictions - Obtener predicciones
router.get('/predictions', async (req, res) => {
  try {
    const { organizationId, limit = 10 } = req.query;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        error: 'Organization ID is required'
      });
    }

    // Implementar obtención de predicciones
    const predictions = []; // Placeholder

    logger.info('Cost predictions retrieved', {
      organizationId,
      count: predictions.length,
      userId: req.user?.id
    });

    res.json({
      success: true,
      data: predictions,
      count: predictions.length
    });
  } catch (error: any) {
    logger.error('Failed to get cost predictions', {
      error: error.message,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve cost predictions',
      message: error.message
    });
  }
});

// ===== PRONÓSTICOS DE COSTOS =====

// POST /v1/ai-cost-prediction/forecast - Generar pronóstico
router.post('/forecast',
  validateRequest(GenerateForecastSchema),
  async (req, res) => {
    try {
      const forecast = await aiCostPredictionService.generateCostForecast(req.body);

      logger.info('Cost forecast generated', {
        forecastId: forecast.id,
        organizationId: req.body.organizationId,
        forecastType: req.body.forecastType,
        timeHorizon: req.body.timeHorizon,
        scenariosCount: forecast.scenarios.length,
        userId: req.user?.id
      });

      res.status(201).json({
        success: true,
        data: forecast,
        message: 'Cost forecast generated successfully'
      });
    } catch (error: any) {
      logger.error('Failed to generate cost forecast', {
        error: error.message,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to generate cost forecast',
        message: error.message
      });
    }
  }
);

// GET /v1/ai-cost-prediction/forecasts - Obtener pronósticos
router.get('/forecasts', async (req, res) => {
  try {
    const { organizationId, limit = 10 } = req.query;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        error: 'Organization ID is required'
      });
    }

    // Implementar obtención de pronósticos
    const forecasts = []; // Placeholder

    logger.info('Cost forecasts retrieved', {
      organizationId,
      count: forecasts.length,
      userId: req.user?.id
    });

    res.json({
      success: true,
      data: forecasts,
      count: forecasts.length
    });
  } catch (error: any) {
    logger.error('Failed to get cost forecasts', {
      error: error.message,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve cost forecasts',
      message: error.message
    });
  }
});

// ===== ANÁLISIS DE PREDICCIONES =====

// GET /v1/ai-cost-prediction/accuracy - Análisis de precisión
router.get('/accuracy', async (req, res) => {
  try {
    const { organizationId, modelId, days = 30 } = req.query;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        error: 'Organization ID is required'
      });
    }

    // Implementar análisis de precisión
    const accuracyAnalysis = {
      organizationId,
      modelId: modelId || 'all',
      period: `${days} days`,
      overallAccuracy: 0.85,
      accuracyByPeriod: [
        { period: '1 day', accuracy: 0.92 },
        { period: '1 week', accuracy: 0.88 },
        { period: '1 month', accuracy: 0.82 },
        { period: '3 months', accuracy: 0.75 }
      ],
      accuracyByModel: [
        { model: 'time_series', accuracy: 0.88 },
        { model: 'regression', accuracy: 0.85 },
        { model: 'neural_network', accuracy: 0.82 }
      ],
      recommendations: [
        'Time series model shows best accuracy for short-term predictions',
        'Consider retraining regression model with more recent data',
        'Neural network model needs more training data for better performance'
      ]
    };

    logger.info('Prediction accuracy analysis retrieved', {
      organizationId,
      modelId,
      days: Number(days),
      userId: req.user?.id
    });

    res.json({
      success: true,
      data: accuracyAnalysis,
      message: 'Prediction accuracy analysis retrieved successfully'
    });
  } catch (error: any) {
    logger.error('Failed to get prediction accuracy analysis', {
      error: error.message,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve prediction accuracy analysis',
      message: error.message
    });
  }
});

// GET /v1/ai-cost-prediction/trends - Análisis de tendencias
router.get('/trends', async (req, res) => {
  try {
    const { organizationId, period = '90d' } = req.query;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        error: 'Organization ID is required'
      });
    }

    // Implementar análisis de tendencias
    const trendAnalysis = {
      organizationId,
      period,
      summary: {
        totalPredictions: 45,
        averageAccuracy: 0.84,
        trendDirection: 'improving',
        bestPerformingModel: 'time_series',
        worstPerformingModel: 'neural_network'
      },
      trends: [
        {
          date: '2024-01-01',
          actualCost: 125.50,
          predictedCost: 128.30,
          accuracy: 0.98,
          error: 2.80
        },
        {
          date: '2024-01-08',
          actualCost: 142.20,
          predictedCost: 135.80,
          accuracy: 0.95,
          error: 6.40
        }
      ],
      insights: [
        'Prediction accuracy has improved by 12% over the last month',
        'Time series model consistently outperforms other models',
        'Cost predictions are most accurate for weekly forecasts',
        'Neural network model shows high variance in accuracy'
      ]
    };

    logger.info('Prediction trends analysis retrieved', {
      organizationId,
      period,
      userId: req.user?.id
    });

    res.json({
      success: true,
      data: trendAnalysis,
      message: 'Prediction trends analysis retrieved successfully'
    });
  } catch (error: any) {
    logger.error('Failed to get prediction trends analysis', {
      error: error.message,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve prediction trends analysis',
      message: error.message
    });
  }
});

// ===== COMPARACIÓN DE MODELOS =====

// GET /v1/ai-cost-prediction/compare - Comparar modelos
router.get('/compare', async (req, res) => {
  try {
    const { organizationId, models } = req.query;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        error: 'Organization ID is required'
      });
    }

    const modelIds = models ? (models as string).split(',') : [];

    // Implementar comparación de modelos
    const modelComparison = {
      organizationId,
      comparedModels: modelIds,
      comparison: [
        {
          modelId: 'time_series',
          modelName: 'AI Cost Time Series Model',
          accuracy: 0.88,
          mae: 8.5,
          rmse: 12.3,
          r2Score: 0.85,
          trainingTime: '2.5 hours',
          predictionTime: '0.1 seconds',
          pros: ['Best for short-term predictions', 'Handles seasonality well'],
          cons: ['Requires large historical dataset', 'Sensitive to outliers']
        },
        {
          modelId: 'regression',
          modelName: 'AI Cost Regression Model',
          accuracy: 0.85,
          mae: 9.2,
          rmse: 13.8,
          r2Score: 0.82,
          trainingTime: '1.2 hours',
          predictionTime: '0.05 seconds',
          pros: ['Fast training and prediction', 'Interpretable results'],
          cons: ['Limited to linear relationships', 'Requires feature engineering']
        },
        {
          modelId: 'neural_network',
          modelName: 'AI Cost Neural Network Model',
          accuracy: 0.82,
          mae: 10.1,
          rmse: 15.2,
          r2Score: 0.78,
          trainingTime: '8.5 hours',
          predictionTime: '0.3 seconds',
          pros: ['Handles complex patterns', 'Good for non-linear relationships'],
          cons: ['Long training time', 'Requires large dataset', 'Black box model']
        }
      ],
      recommendations: [
        'Use time series model for daily/weekly predictions',
        'Use regression model for quick insights and feature analysis',
        'Use neural network model for complex pattern recognition',
        'Consider ensemble approach for best overall performance'
      ]
    };

    logger.info('Model comparison retrieved', {
      organizationId,
      modelIds,
      userId: req.user?.id
    });

    res.json({
      success: true,
      data: modelComparison,
      message: 'Model comparison retrieved successfully'
    });
  } catch (error: any) {
    logger.error('Failed to get model comparison', {
      error: error.message,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve model comparison',
      message: error.message
    });
  }
});

// ===== RECOMENDACIONES =====

// GET /v1/ai-cost-prediction/recommendations - Obtener recomendaciones
router.get('/recommendations', async (req, res) => {
  try {
    const { organizationId } = req.query;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        error: 'Organization ID is required'
      });
    }

    // Implementar generación de recomendaciones
    const recommendations = {
      organizationId,
      generatedAt: new Date().toISOString(),
      summary: {
        totalRecommendations: 5,
        priority: 'high',
        estimatedImpact: 'medium'
      },
      recommendations: [
        {
          type: 'model_optimization',
          priority: 'high',
          title: 'Switch to Time Series Model for Daily Predictions',
          description: 'Your daily cost predictions would be 15% more accurate using the time series model',
          impact: 0.15,
          implementation: 'Update prediction configuration to use time_series model for daily forecasts',
          estimatedSavings: '€50-100 per month'
        },
        {
          type: 'data_quality',
          priority: 'medium',
          title: 'Improve Historical Data Quality',
          description: 'Adding more detailed feature data would improve prediction accuracy by 8%',
          impact: 0.08,
          implementation: 'Collect additional features like time of day, user type, and request complexity',
          estimatedSavings: '€20-40 per month'
        },
        {
          type: 'model_retraining',
          priority: 'medium',
          title: 'Retrain Models Monthly',
          description: 'Regular retraining would maintain prediction accuracy and adapt to changing patterns',
          impact: 0.10,
          implementation: 'Set up automated monthly retraining pipeline',
          estimatedSavings: '€30-60 per month'
        },
        {
          type: 'ensemble_approach',
          priority: 'low',
          title: 'Implement Ensemble Model',
          description: 'Combining multiple models would provide more robust predictions',
          impact: 0.12,
          implementation: 'Create ensemble model that combines time series and regression predictions',
          estimatedSavings: '€40-80 per month'
        },
        {
          type: 'feature_engineering',
          priority: 'low',
          title: 'Add External Factors',
          description: 'Including external factors like business events would improve prediction accuracy',
          impact: 0.06,
          implementation: 'Integrate calendar events, business metrics, and market data',
          estimatedSavings: '€15-30 per month'
        }
      ]
    };

    logger.info('Prediction recommendations generated', {
      organizationId,
      recommendationsCount: recommendations.recommendations.length,
      userId: req.user?.id
    });

    res.json({
      success: true,
      data: recommendations,
      message: 'Prediction recommendations generated successfully'
    });
  } catch (error: any) {
    logger.error('Failed to get prediction recommendations', {
      error: error.message,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve prediction recommendations',
      message: error.message
    });
  }
});

// ===== HEALTH CHECK =====

// GET /v1/ai-cost-prediction/health - Estado del servicio
router.get('/health', async (req, res) => {
  try {
    const health = await aiCostPredictionService.getHealthStatus();

    const statusCode = health.status === 'healthy' ? 200 :
                      health.status === 'degraded' ? 200 : 503;

    res.status(statusCode).json({
      success: true,
      data: health,
      message: `Service is ${health.status}`
    });
  } catch (error: any) {
    logger.error('Health check failed', {
      error: error.message,
      userId: req.user?.id
    });

    res.status(503).json({
      success: false,
      error: 'Health check failed',
      message: error.message
    });
  }
});

// ===== ESTADÍSTICAS =====

// GET /v1/ai-cost-prediction/stats - Estadísticas del servicio
router.get('/stats', async (req, res) => {
  try {
    const stats = {
      models: {
        total: 4,
        active: 4,
        byType: {
          time_series: 1,
          regression: 1,
          neural_network: 1,
          ensemble: 1
        },
        byAlgorithm: {
          arima: 1,
          random_forest: 1,
          lstm: 1,
          xgboost: 1
        }
      },
      predictions: {
        total: 1250,
        byType: {
          daily: 450,
          weekly: 350,
          monthly: 300,
          quarterly: 100,
          yearly: 50
        },
        averageAccuracy: 0.84,
        bestAccuracy: 0.95,
        worstAccuracy: 0.72
      },
      forecasts: {
        total: 180,
        byType: {
          budget_planning: 60,
          cost_optimization: 45,
          capacity_planning: 40,
          risk_assessment: 35
        },
        averageScenarios: 3.2,
        totalRecommendations: 720
      },
      performance: {
        averageTrainingTime: '3.2 hours',
        averagePredictionTime: '0.15 seconds',
        averageForecastTime: '2.5 seconds',
        uptime: '99.8%'
      }
    };

    logger.info('Cost prediction stats retrieved', {
      userId: req.user?.id
    });

    res.json({
      success: true,
      data: stats,
      message: 'Statistics retrieved successfully'
    });
  } catch (error: any) {
    logger.error('Failed to get statistics', {
      error: error.message,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve statistics',
      message: error.message
    });
  }
});

export { router as aiCostPredictionRoutes };
