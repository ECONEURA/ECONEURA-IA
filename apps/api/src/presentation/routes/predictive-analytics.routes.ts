import { Router } from 'express';
import { PredictiveAnalyticsController } from '../controllers/predictive-analytics.controller.js';
import { validateRequest, authenticate, authorize } from '../middleware/base.middleware.js';
import { z } from 'zod';

// ============================================================================
// PREDICTIVE ANALYTICS ROUTES
// ============================================================================

export const createPredictiveAnalyticsRoutes = (predictiveAnalyticsController: PredictiveAnalyticsController): Router => {
  const router = Router();

  // ========================================================================
  // PREDICTIVE ANALYTICS MANAGEMENT ROUTES
  // ========================================================================

  // POST /predictive-analytics - Create predictive analytics
  router.post('/',
    authenticate,
    authorize(['analytics:create']),
    validateRequest({
      body: z.object({
        organizationId: z.string().uuid(),
        name: z.string().min(1).max(255),
        type: z.enum(['sales_forecast', 'demand_prediction', 'churn_prediction', 'revenue_forecast', 'inventory_optimization', 'customer_lifetime_value', 'market_trend', 'risk_assessment']),
        description: z.string().max(1000).optional(),
        modelId: z.string().uuid().optional(),
        settings: z.object({
          modelType: z.enum(['linear_regression', 'decision_tree', 'random_forest', 'neural_network', 'time_series', 'clustering', 'classification', 'deep_learning']),
          trainingPeriod: z.number().int().min(1).max(3650),
          predictionHorizon: z.number().int().min(1).max(365),
          confidenceThreshold: z.number().min(0).max(1).default(0.8),
          autoRetrain: z.boolean().default(false),
          retrainFrequency: z.number().int().min(1).max(365).default(30),
          dataSource: z.array(z.string().min(1)).min(1),
          features: z.array(z.string().min(1)).min(1),
          targetVariable: z.string().min(1).max(100),
          validationMethod: z.enum(['cross_validation', 'holdout', 'time_series_split']).default('cross_validation'),
          hyperparameters: z.record(z.any()).default({}),
          customFields: z.record(z.any()).default({}),
          tags: z.array(z.string()).default([]),
          notes: z.string().max(1000).default('')
        })
      })
    }),
    predictiveAnalyticsController.createPredictiveAnalytics.bind(predictiveAnalyticsController)
  );

  // PUT /predictive-analytics/:id - Update predictive analytics
  router.put('/:id',
    authenticate,
    authorize(['analytics:update']),
    validateRequest({
      params: z.object({
        id: z.string().uuid()
      }),
      body: z.object({
        name: z.string().min(1).max(255).optional(),
        type: z.enum(['sales_forecast', 'demand_prediction', 'churn_prediction', 'revenue_forecast', 'inventory_optimization', 'customer_lifetime_value', 'market_trend', 'risk_assessment']).optional(),
        description: z.string().max(1000).optional(),
        modelId: z.string().uuid().optional(),
        settings: z.object({
          modelType: z.enum(['linear_regression', 'decision_tree', 'random_forest', 'neural_network', 'time_series', 'clustering', 'classification', 'deep_learning']).optional(),
          trainingPeriod: z.number().int().min(1).max(3650).optional(),
          predictionHorizon: z.number().int().min(1).max(365).optional(),
          confidenceThreshold: z.number().min(0).max(1).optional(),
          autoRetrain: z.boolean().optional(),
          retrainFrequency: z.number().int().min(1).max(365).optional(),
          dataSource: z.array(z.string().min(1)).optional(),
          features: z.array(z.string().min(1)).optional(),
          targetVariable: z.string().min(1).max(100).optional(),
          validationMethod: z.enum(['cross_validation', 'holdout', 'time_series_split']).optional(),
          hyperparameters: z.record(z.any()).optional(),
          customFields: z.record(z.any()).optional(),
          tags: z.array(z.string()).optional(),
          notes: z.string().max(1000).optional()
        }).optional()
      })
    }),
    predictiveAnalyticsController.updatePredictiveAnalytics.bind(predictiveAnalyticsController)
  );

  // DELETE /predictive-analytics/:id - Delete predictive analytics
  router.delete('/:id',
    authenticate,
    authorize(['analytics:delete']),
    validateRequest({
      params: z.object({
        id: z.string().uuid()
      })
    }),
    predictiveAnalyticsController.deletePredictiveAnalytics.bind(predictiveAnalyticsController)
  );

  // GET /predictive-analytics/:id - Get predictive analytics by ID
  router.get('/:id',
    authenticate,
    authorize(['analytics:read']),
    validateRequest({
      params: z.object({
        id: z.string().uuid()
      })
    }),
    predictiveAnalyticsController.getPredictiveAnalytics.bind(predictiveAnalyticsController)
  );

  // ========================================================================
  // ORGANIZATION-SPECIFIC ROUTES
  // ========================================================================

  // GET /organizations/:organizationId/predictive-analytics - Get predictive analytics by organization
  router.get('/organizations/:organizationId',
    authenticate,
    authorize(['analytics:read']),
    validateRequest({
      params: z.object({
        organizationId: z.string().uuid()
      }),
      query: z.object({
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(20),
        sortBy: z.string().default('createdAt'),
        sortOrder: z.enum(['asc', 'desc']).default('desc'),
        search: z.string().max(200).optional(),
        type: z.enum(['sales_forecast', 'demand_prediction', 'churn_prediction', 'revenue_forecast', 'inventory_optimization', 'customer_lifetime_value', 'market_trend', 'risk_assessment']).optional(),
        status: z.enum(['pending', 'processing', 'completed', 'failed', 'cancelled']).optional(),
        modelType: z.enum(['linear_regression', 'decision_tree', 'random_forest', 'neural_network', 'time_series', 'clustering', 'classification', 'deep_learning']).optional(),
        accuracy: z.enum(['low', 'medium', 'high', 'very_high']).optional(),
        isActive: z.coerce.boolean().optional(),
        needsRetraining: z.coerce.boolean().optional(),
        hasPredictions: z.coerce.boolean().optional(),
        minAccuracy: z.coerce.number().min(0).max(1).optional(),
        maxAccuracy: z.coerce.number().min(0).max(1).optional(),
        lastPredictionFrom: z.coerce.date().optional(),
        lastPredictionTo: z.coerce.date().optional(),
        nextRetrainFrom: z.coerce.date().optional(),
        nextRetrainTo: z.coerce.date().optional()
      })
    }),
    predictiveAnalyticsController.getPredictiveAnalyticsByOrganization.bind(predictiveAnalyticsController)
  );

  // GET /organizations/:organizationId/predictive-analytics/search - Search predictive analytics
  router.get('/organizations/:organizationId/search',
    authenticate,
    authorize(['analytics:read']),
    validateRequest({
      params: z.object({
        organizationId: z.string().uuid()
      }),
      query: z.object({
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(20),
        sortBy: z.string().default('createdAt'),
        sortOrder: z.enum(['asc', 'desc']).default('desc'),
        search: z.string().max(200).optional(),
        type: z.enum(['sales_forecast', 'demand_prediction', 'churn_prediction', 'revenue_forecast', 'inventory_optimization', 'customer_lifetime_value', 'market_trend', 'risk_assessment']).optional(),
        status: z.enum(['pending', 'processing', 'completed', 'failed', 'cancelled']).optional(),
        modelType: z.enum(['linear_regression', 'decision_tree', 'random_forest', 'neural_network', 'time_series', 'clustering', 'classification', 'deep_learning']).optional(),
        accuracy: z.enum(['low', 'medium', 'high', 'very_high']).optional(),
        isActive: z.coerce.boolean().optional(),
        needsRetraining: z.coerce.boolean().optional(),
        hasPredictions: z.coerce.boolean().optional(),
        minAccuracy: z.coerce.number().min(0).max(1).optional(),
        maxAccuracy: z.coerce.number().min(0).max(1).optional(),
        lastPredictionFrom: z.coerce.date().optional(),
        lastPredictionTo: z.coerce.date().optional(),
        nextRetrainFrom: z.coerce.date().optional(),
        nextRetrainTo: z.coerce.date().optional()
      })
    }),
    predictiveAnalyticsController.searchPredictiveAnalytics.bind(predictiveAnalyticsController)
  );

  // GET /organizations/:organizationId/predictive-analytics/stats - Get predictive analytics statistics
  router.get('/organizations/:organizationId/stats',
    authenticate,
    authorize(['analytics:read']),
    validateRequest({
      params: z.object({
        organizationId: z.string().uuid()
      })
    }),
    predictiveAnalyticsController.getPredictiveAnalyticsStats.bind(predictiveAnalyticsController)
  );

  // ========================================================================
  // QUERY ROUTES
  // ========================================================================

  // GET /predictive-analytics/type/:type - Get predictive analytics by type
  router.get('/type/:type',
    authenticate,
    authorize(['analytics:read']),
    validateRequest({
      params: z.object({
        type: z.enum(['sales_forecast', 'demand_prediction', 'churn_prediction', 'revenue_forecast', 'inventory_optimization', 'customer_lifetime_value', 'market_trend', 'risk_assessment'])
      }),
      query: z.object({
        organizationId: z.string().uuid(),
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(20),
        sortBy: z.string().default('createdAt'),
        sortOrder: z.enum(['asc', 'desc']).default('desc')
      })
    }),
    predictiveAnalyticsController.getAnalyticsByType.bind(predictiveAnalyticsController)
  );

  // GET /predictive-analytics/status/:status - Get predictive analytics by status
  router.get('/status/:status',
    authenticate,
    authorize(['analytics:read']),
    validateRequest({
      params: z.object({
        status: z.enum(['pending', 'processing', 'completed', 'failed', 'cancelled'])
      }),
      query: z.object({
        organizationId: z.string().uuid(),
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(20),
        sortBy: z.string().default('createdAt'),
        sortOrder: z.enum(['asc', 'desc']).default('desc')
      })
    }),
    predictiveAnalyticsController.getAnalyticsByStatus.bind(predictiveAnalyticsController)
  );

  // GET /predictive-analytics/active - Get active models
  router.get('/active',
    authenticate,
    authorize(['analytics:read']),
    validateRequest({
      query: z.object({
        organizationId: z.string().uuid(),
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(20),
        sortBy: z.string().default('createdAt'),
        sortOrder: z.enum(['asc', 'desc']).default('desc')
      })
    }),
    predictiveAnalyticsController.getActiveModels.bind(predictiveAnalyticsController)
  );

  // GET /predictive-analytics/needs-retraining - Get models that need retraining
  router.get('/needs-retraining',
    authenticate,
    authorize(['analytics:read']),
    validateRequest({
      query: z.object({
        organizationId: z.string().uuid(),
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(20),
        sortBy: z.string().default('createdAt'),
        sortOrder: z.enum(['asc', 'desc']).default('desc')
      })
    }),
    predictiveAnalyticsController.getNeedsRetraining.bind(predictiveAnalyticsController)
  );

  // ========================================================================
  // PREDICTION OPERATIONS
  // ========================================================================

  // POST /predictive-analytics/predictions - Generate prediction
  router.post('/predictions',
    authenticate,
    authorize(['analytics:execute']),
    validateRequest({
      body: z.object({
        id: z.string().uuid(),
        inputData: z.record(z.any()).min(1),
        confidence: z.number().min(0).max(1).optional()
      })
    }),
    predictiveAnalyticsController.generatePrediction.bind(predictiveAnalyticsController)
  );

  // POST /predictive-analytics/train - Train model
  router.post('/train',
    authenticate,
    authorize(['analytics:train']),
    validateRequest({
      body: z.object({
        id: z.string().uuid(),
        trainingData: z.array(z.record(z.any())).optional(),
        forceRetrain: z.boolean().default(false)
      })
    }),
    predictiveAnalyticsController.trainModel.bind(predictiveAnalyticsController)
  );

  // ========================================================================
  // BULK OPERATIONS
  // ========================================================================

  // PUT /predictive-analytics/bulk-update - Bulk update predictive analytics
  router.put('/bulk-update',
    authenticate,
    authorize(['analytics:update']),
    validateRequest({
      body: z.object({
        ids: z.array(z.string().uuid()).min(1),
        updates: z.object({
          status: z.enum(['pending', 'processing', 'completed', 'failed', 'cancelled']).optional(),
          autoRetrain: z.boolean().optional(),
          retrainFrequency: z.number().int().min(1).max(365).optional(),
          tags: z.array(z.string()).optional()
        })
      })
    }),
    predictiveAnalyticsController.bulkUpdatePredictiveAnalytics.bind(predictiveAnalyticsController)
  );

  // DELETE /predictive-analytics/bulk-delete - Bulk delete predictive analytics
  router.delete('/bulk-delete',
    authenticate,
    authorize(['analytics:delete']),
    validateRequest({
      body: z.object({
        ids: z.array(z.string().uuid()).min(1)
      })
    }),
    predictiveAnalyticsController.bulkDeletePredictiveAnalytics.bind(predictiveAnalyticsController)
  );

  return router;
};
