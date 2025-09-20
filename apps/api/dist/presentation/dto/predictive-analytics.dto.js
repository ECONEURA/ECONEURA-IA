import { z } from 'zod';
import { UUIDSchema, OrganizationIdSchema, NameSchema, DescriptionSchema, NotesSchema, TagsSchema, CustomFieldsSchema, BaseSearchQuerySchema, IdParamSchema, OrganizationIdParamSchema, ListResponseSchema, BaseStatsSchema, BulkDeleteSchema, DateRangeSchema } from './base.dto.js';
export const CreatePredictiveAnalyticsRequestSchema = z.object({
    organizationId: OrganizationIdSchema,
    name: NameSchema,
    type: z.enum(['sales_forecast', 'demand_prediction', 'churn_prediction', 'revenue_forecast', 'inventory_optimization', 'customer_lifetime_value', 'market_trend', 'risk_assessment'], {
        errorMap: () => ({ message: 'Type must be one of: sales_forecast, demand_prediction, churn_prediction, revenue_forecast, inventory_optimization, customer_lifetime_value, market_trend, risk_assessment' })
    }),
    description: DescriptionSchema.optional(),
    modelId: UUIDSchema.optional(),
    settings: z.object({
        modelType: z.enum(['linear_regression', 'decision_tree', 'random_forest', 'neural_network', 'time_series', 'clustering', 'classification', 'deep_learning'], {
            errorMap: () => ({ message: 'Model type must be one of: linear_regression, decision_tree, random_forest, neural_network, time_series, clustering, classification, deep_learning' })
        }),
        trainingPeriod: z.number().int().min(1, 'Training period must be at least 1 day').max(3650, 'Training period cannot exceed 10 years'),
        predictionHorizon: z.number().int().min(1, 'Prediction horizon must be at least 1 day').max(365, 'Prediction horizon cannot exceed 1 year'),
        confidenceThreshold: z.number().min(0, 'Confidence threshold must be non-negative').max(1, 'Confidence threshold cannot exceed 1').default(0.8),
        autoRetrain: z.boolean().default(false),
        retrainFrequency: z.number().int().min(1, 'Retrain frequency must be at least 1 day').max(365, 'Retrain frequency cannot exceed 1 year').default(30),
        dataSource: z.array(z.string().min(1, 'Data source cannot be empty')).min(1, 'At least one data source is required'),
        features: z.array(z.string().min(1, 'Feature name cannot be empty')).min(1, 'At least one feature is required'),
        targetVariable: z.string().min(1, 'Target variable is required').max(100, 'Target variable cannot exceed 100 characters'),
        validationMethod: z.enum(['cross_validation', 'holdout', 'time_series_split'], {
            errorMap: () => ({ message: 'Validation method must be one of: cross_validation, holdout, time_series_split' })
        }).default('cross_validation'),
        hyperparameters: z.record(z.any()).default({}),
        customFields: CustomFieldsSchema,
        tags: TagsSchema,
        notes: NotesSchema
    })
});
export const UpdatePredictiveAnalyticsRequestSchema = z.object({
    name: NameSchema.optional(),
    type: z.enum(['sales_forecast', 'demand_prediction', 'churn_prediction', 'revenue_forecast', 'inventory_optimization', 'customer_lifetime_value', 'market_trend', 'risk_assessment']).optional(),
    description: DescriptionSchema.optional(),
    modelId: UUIDSchema.optional(),
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
        customFields: CustomFieldsSchema.optional(),
        tags: TagsSchema.optional(),
        notes: NotesSchema.optional()
    }).optional()
});
export const GeneratePredictionRequestSchema = z.object({
    id: UUIDSchema,
    inputData: z.record(z.any()).min(1, 'Input data is required'),
    confidence: z.number().min(0, 'Confidence must be non-negative').max(1, 'Confidence cannot exceed 1').optional()
});
export const TrainModelRequestSchema = z.object({
    id: UUIDSchema,
    trainingData: z.array(z.record(z.any())).optional(),
    forceRetrain: z.boolean().default(false)
});
export const PredictiveAnalyticsIdParamSchema = IdParamSchema;
export const PredictiveAnalyticsOrganizationIdParamSchema = OrganizationIdParamSchema;
export const PredictiveAnalyticsSearchQuerySchema = BaseSearchQuerySchema.extend({
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
});
export const PredictiveAnalyticsBulkUpdateSchema = z.object({
    ids: z.array(UUIDSchema).min(1, 'At least one predictive analytics ID is required'),
    updates: z.object({
        status: z.enum(['pending', 'processing', 'completed', 'failed', 'cancelled']).optional(),
        autoRetrain: z.boolean().optional(),
        retrainFrequency: z.number().int().min(1).max(365).optional(),
        tags: z.array(z.string()).optional()
    })
});
export const PredictiveAnalyticsBulkDeleteSchema = BulkDeleteSchema;
export const PredictionDataResponseSchema = z.object({
    id: z.string(),
    timestamp: z.date(),
    inputData: z.record(z.any()),
    predictedValue: z.union([z.number(), z.string(), z.boolean()]),
    confidence: z.number(),
    probability: z.number().optional(),
    metadata: z.record(z.any())
});
export const AnalyticsMetricsResponseSchema = z.object({
    accuracy: z.number(),
    precision: z.number(),
    recall: z.number(),
    f1Score: z.number(),
    mae: z.number(),
    mse: z.number(),
    rmse: z.number(),
    r2Score: z.number(),
    lastTrainingDate: z.date(),
    trainingDuration: z.number(),
    dataPoints: z.number(),
    modelVersion: z.string()
});
export const PredictiveAnalyticsResponseSchema = z.object({
    id: z.string().uuid(),
    organizationId: z.string().uuid(),
    name: z.string(),
    type: z.enum(['sales_forecast', 'demand_prediction', 'churn_prediction', 'revenue_forecast', 'inventory_optimization', 'customer_lifetime_value', 'market_trend', 'risk_assessment']),
    status: z.enum(['pending', 'processing', 'completed', 'failed', 'cancelled']),
    modelId: z.string().uuid().optional(),
    description: z.string().optional(),
    settings: z.object({
        modelType: z.enum(['linear_regression', 'decision_tree', 'random_forest', 'neural_network', 'time_series', 'clustering', 'classification', 'deep_learning']),
        trainingPeriod: z.number(),
        predictionHorizon: z.number(),
        confidenceThreshold: z.number(),
        autoRetrain: z.boolean(),
        retrainFrequency: z.number(),
        dataSource: z.array(z.string()),
        features: z.array(z.string()),
        targetVariable: z.string(),
        validationMethod: z.enum(['cross_validation', 'holdout', 'time_series_split']),
        hyperparameters: z.record(z.any()),
        customFields: z.record(z.any()),
        tags: z.array(z.string()),
        notes: z.string()
    }),
    metrics: AnalyticsMetricsResponseSchema.optional(),
    predictions: z.array(PredictionDataResponseSchema),
    lastPredictionDate: z.date().optional(),
    nextRetrainDate: z.date().optional(),
    isActive: z.boolean(),
    createdAt: z.date(),
    updatedAt: z.date()
});
export const PredictiveAnalyticsListResponseSchema = ListResponseSchema.extend({
    data: z.array(PredictiveAnalyticsResponseSchema)
});
export const PredictiveAnalyticsStatsResponseSchema = BaseStatsSchema.extend({
    byType: z.record(z.number()),
    byStatus: z.record(z.number()),
    byModelType: z.record(z.number()),
    byAccuracy: z.record(z.number()),
    totalPredictions: z.number(),
    averageAccuracy: z.number(),
    averageConfidence: z.number(),
    activeModels: z.number(),
    pendingTraining: z.number(),
    failedTraining: z.number(),
    needsRetraining: z.number(),
    lastTrainingDate: z.date().optional(),
    totalTrainingTime: z.number(),
    averagePredictionTime: z.number()
});
export const BatchPredictionRequestSchema = z.object({
    id: UUIDSchema,
    inputDataArray: z.array(z.record(z.any())).min(1, 'At least one input data record is required'),
    confidence: z.number().min(0).max(1).optional()
});
export const BatchTrainingRequestSchema = z.object({
    ids: z.array(UUIDSchema).min(1, 'At least one predictive analytics ID is required'),
    trainingData: z.array(z.record(z.any())).optional(),
    forceRetrain: z.boolean().default(false)
});
export const AnalyticsReportRequestSchema = z.object({
    organizationId: OrganizationIdSchema,
    filters: z.object({
        type: z.enum(['sales_forecast', 'demand_prediction', 'churn_prediction', 'revenue_forecast', 'inventory_optimization', 'customer_lifetime_value', 'market_trend', 'risk_assessment']).optional(),
        status: z.enum(['pending', 'processing', 'completed', 'failed', 'cancelled']).optional(),
        modelType: z.enum(['linear_regression', 'decision_tree', 'random_forest', 'neural_network', 'time_series', 'clustering', 'classification', 'deep_learning']).optional(),
        accuracy: z.enum(['low', 'medium', 'high', 'very_high']).optional(),
        isActive: z.boolean().optional(),
        needsRetraining: z.boolean().optional(),
        hasPredictions: z.boolean().optional(),
        dateRange: DateRangeSchema.optional()
    }).optional()
});
export const PredictionReportRequestSchema = z.object({
    organizationId: OrganizationIdSchema,
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    filters: z.object({
        type: z.enum(['sales_forecast', 'demand_prediction', 'churn_prediction', 'revenue_forecast', 'inventory_optimization', 'customer_lifetime_value', 'market_trend', 'risk_assessment']).optional(),
        modelType: z.enum(['linear_regression', 'decision_tree', 'random_forest', 'neural_network', 'time_series', 'clustering', 'classification', 'deep_learning']).optional(),
        minConfidence: z.number().min(0).max(1).optional(),
        maxConfidence: z.number().min(0).max(1).optional()
    }).optional()
});
export const ModelPerformanceReportRequestSchema = z.object({
    organizationId: OrganizationIdSchema
});
export const TrainingReportRequestSchema = z.object({
    organizationId: OrganizationIdSchema,
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    filters: z.object({
        type: z.enum(['sales_forecast', 'demand_prediction', 'churn_prediction', 'revenue_forecast', 'inventory_optimization', 'customer_lifetime_value', 'market_trend', 'risk_assessment']).optional(),
        modelType: z.enum(['linear_regression', 'decision_tree', 'random_forest', 'neural_network', 'time_series', 'clustering', 'classification', 'deep_learning']).optional(),
        status: z.enum(['pending', 'processing', 'completed', 'failed', 'cancelled']).optional()
    }).optional()
});
//# sourceMappingURL=predictive-analytics.dto.js.map