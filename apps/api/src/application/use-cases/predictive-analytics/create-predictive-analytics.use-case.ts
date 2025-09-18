import { PredictiveAnalytics } from '../../../domain/entities/predictive-analytics.entity.js';
import { PredictiveAnalyticsRepository } from '../../../domain/repositories/predictive-analytics.repository.js';
import { BaseUseCase, BaseRequest, BaseResponse } from '../base.use-case.js';

// ============================================================================
// CREATE PREDICTIVE ANALYTICS USE CASE
// ============================================================================

export interface CreatePredictiveAnalyticsRequest extends BaseRequest {
  name: string;
  type: 'sales_forecast' | 'demand_prediction' | 'churn_prediction' | 'revenue_forecast' | 'inventory_optimization' | 'customer_lifetime_value' | 'market_trend' | 'risk_assessment';
  description?: string;
  modelId?: string;
  settings: {
    modelType: 'linear_regression' | 'decision_tree' | 'random_forest' | 'neural_network' | 'time_series' | 'clustering' | 'classification' | 'deep_learning';
    trainingPeriod: number;
    predictionHorizon: number;
    confidenceThreshold: number;
    autoRetrain: boolean;
    retrainFrequency: number;
    dataSource: string[];
    features: string[];
    targetVariable: string;
    validationMethod: 'cross_validation' | 'holdout' | 'time_series_split';
    hyperparameters: Record<string, any>;
    customFields: Record<string, any>;
    tags: string[];
    notes: string;
  };
}

export interface CreatePredictiveAnalyticsResponse extends BaseResponse {
  data: {
    predictiveAnalytics: PredictiveAnalytics;
  };
}

export class CreatePredictiveAnalyticsUseCase extends BaseUseCase<CreatePredictiveAnalyticsRequest, CreatePredictiveAnalyticsResponse> {
  constructor(
    private readonly predictiveAnalyticsRepository: PredictiveAnalyticsRepository
  ) {
    super();
  }

  async execute(request: CreatePredictiveAnalyticsRequest): Promise<CreatePredictiveAnalyticsResponse> {
    // ========================================================================
    // VALIDATION
    // ========================================================================

    this.validateBaseRequest(request);
    this.validateString(request.name, 'Name');
    this.validateString(request.type, 'Analytics type');
    this.validateString(request.settings.modelType, 'Model type');
    this.validateString(request.settings.targetVariable, 'Target variable');

    if (request.settings.trainingPeriod <= 0) {
      throw new Error('Training period must be greater than 0');
    }

    if (request.settings.predictionHorizon <= 0) {
      throw new Error('Prediction horizon must be greater than 0');
    }

    if (request.settings.confidenceThreshold < 0 || request.settings.confidenceThreshold > 1) {
      throw new Error('Confidence threshold must be between 0 and 1');
    }

    if (request.settings.retrainFrequency <= 0) {
      throw new Error('Retrain frequency must be greater than 0');
    }

    if (!request.settings.features || request.settings.features.length === 0) {
      throw new Error('At least one feature must be specified');
    }

    if (!request.settings.dataSource || request.settings.dataSource.length === 0) {
      throw new Error('At least one data source must be specified');
    }

    // ========================================================================
    // BUSINESS LOGIC VALIDATION
    // ========================================================================

    // Check if analytics with same name already exists
    const existingAnalytics = await this.predictiveAnalyticsRepository.existsByName(request.name, request.organizationId);
    if (existingAnalytics) {
      throw new Error(`Predictive analytics with name '${request.name}' already exists`);
    }

    // Check if model ID is valid (if provided)
    if (request.modelId) {
      const existingModel = await this.predictiveAnalyticsRepository.existsByModelId(request.modelId, request.organizationId);
      if (existingModel) {
        throw new Error(`Model with ID '${request.modelId}' is already in use`);
      }
    }

    // ========================================================================
    // CREATE PREDICTIVE ANALYTICS
    // ========================================================================

    const predictiveAnalytics = PredictiveAnalytics.create({
      organizationId: request.organizationId,
      name: request.name,
      type: request.type,
      status: 'pending',
      modelId: request.modelId,
      description: request.description,
      settings: {
        modelType: request.settings.modelType,
        trainingPeriod: request.settings.trainingPeriod,
        predictionHorizon: request.settings.predictionHorizon,
        confidenceThreshold: request.settings.confidenceThreshold,
        autoRetrain: request.settings.autoRetrain,
        retrainFrequency: request.settings.retrainFrequency,
        dataSource: request.settings.dataSource,
        features: request.settings.features,
        targetVariable: request.settings.targetVariable,
        validationMethod: request.settings.validationMethod,
        hyperparameters: request.settings.hyperparameters,
        customFields: request.settings.customFields,
        tags: request.settings.tags,
        notes: request.settings.notes,
      },
      predictions: [],
      isActive: true,
    });

    // ========================================================================
    // VALIDATE PREDICTIVE ANALYTICS
    // ========================================================================

    if (!predictiveAnalytics.validate()) {
      throw new Error('Invalid predictive analytics data');
    }

    // ========================================================================
    // SAVE PREDICTIVE ANALYTICS
    // ========================================================================

    const savedPredictiveAnalytics = await this.predictiveAnalyticsRepository.save(predictiveAnalytics);

    // ========================================================================
    // RETURN RESPONSE
    // ========================================================================

    return this.createSuccessResponse({
      predictiveAnalytics: savedPredictiveAnalytics,
    }, 'Predictive analytics created successfully');
  }
}
