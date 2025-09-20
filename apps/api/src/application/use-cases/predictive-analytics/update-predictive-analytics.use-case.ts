import { PredictiveAnalytics } from '../../../domain/entities/predictive-analytics.entity.js';
import { PredictiveAnalyticsRepository } from '../../../domain/repositories/predictive-analytics.repository.js';
import { BaseUseCase, BaseRequest, BaseResponse } from '../base.use-case.js';

// ============================================================================
// UPDATE PREDICTIVE ANALYTICS USE CASE
// ============================================================================

export interface UpdatePredictiveAnalyticsRequest extends BaseRequest {
  id: string;
  name?: string;
  type?: 'sales_forecast' | 'demand_prediction' | 'churn_prediction' | 'revenue_forecast' | 'inventory_optimization' | 'customer_lifetime_value' | 'market_trend' | 'risk_assessment';
  description?: string;
  modelId?: string;
  settings?: {
    modelType?: 'linear_regression' | 'decision_tree' | 'random_forest' | 'neural_network' | 'time_series' | 'clustering' | 'classification' | 'deep_learning';
    trainingPeriod?: number;
    predictionHorizon?: number;
    confidenceThreshold?: number;
    autoRetrain?: boolean;
    retrainFrequency?: number;
    dataSource?: string[];
    features?: string[];
    targetVariable?: string;
    validationMethod?: 'cross_validation' | 'holdout' | 'time_series_split';
    hyperparameters?: Record<string, any>;
    customFields?: Record<string, any>;
    tags?: string[];
    notes?: string;
  };
}

export interface UpdatePredictiveAnalyticsResponse extends BaseResponse {
  data: {
    predictiveAnalytics: PredictiveAnalytics;
  };
}

export class UpdatePredictiveAnalyticsUseCase extends BaseUseCase<UpdatePredictiveAnalyticsRequest, UpdatePredictiveAnalyticsResponse> {
  constructor(
    private readonly predictiveAnalyticsRepository: PredictiveAnalyticsRepository
  ) {
    super();
  }

  async execute(request: UpdatePredictiveAnalyticsRequest): Promise<UpdatePredictiveAnalyticsResponse> {
    // ========================================================================
    // VALIDATION
    // ========================================================================

    this.validateId(request.id, 'Predictive Analytics ID');

    // ========================================================================
    // FIND EXISTING PREDICTIVE ANALYTICS
    // ========================================================================

    const existingPredictiveAnalytics = await this.predictiveAnalyticsRepository.findById(request.id);
    if (!existingPredictiveAnalytics) {
      throw new Error(`Predictive analytics with ID '${request.id}' not found`);
    }

    // ========================================================================
    // BUSINESS LOGIC VALIDATION
    // ========================================================================

    // Check if name change would create duplicate
    if (request.name && request.name !== existingPredictiveAnalytics.name) {
      const existingAnalytics = await this.predictiveAnalyticsRepository.existsByName(request.name, request.organizationId);
      if (existingAnalytics) {
        throw new Error(`Predictive analytics with name '${request.name}' already exists`);
      }
    }

    // Check if model ID change would create duplicate
    if (request.modelId && request.modelId !== existingPredictiveAnalytics.modelId) {
      const existingModel = await this.predictiveAnalyticsRepository.existsByModelId(request.modelId, request.organizationId);
      if (existingModel) {
        throw new Error(`Model with ID '${request.modelId}' is already in use`);
      }
    }

    // ========================================================================
    // UPDATE PREDICTIVE ANALYTICS
    // ========================================================================

    // Update basic fields
    if (request.name !== undefined) {
      existingPredictiveAnalytics.updateName(request.name);
    }

    if (request.type !== undefined) {
      existingPredictiveAnalytics.updateType(request.type);
    }

    if (request.description !== undefined) {
      existingPredictiveAnalytics.updateDescription(request.description);
    }

    if (request.modelId !== undefined) {
      existingPredictiveAnalytics.updateModelId(request.modelId);
    }

    // Update settings
    if (request.settings !== undefined) {
      const currentSettings = existingPredictiveAnalytics.settings;
      const updatedSettings = {
        modelType: request.settings.modelType || currentSettings.modelType.value,
        trainingPeriod: request.settings.trainingPeriod !== undefined ? request.settings.trainingPeriod : currentSettings.trainingPeriod,
        predictionHorizon: request.settings.predictionHorizon !== undefined ? request.settings.predictionHorizon : currentSettings.predictionHorizon,
        confidenceThreshold: request.settings.confidenceThreshold !== undefined ? request.settings.confidenceThreshold : currentSettings.confidenceThreshold,
        autoRetrain: request.settings.autoRetrain !== undefined ? request.settings.autoRetrain : currentSettings.autoRetrain,
        retrainFrequency: request.settings.retrainFrequency !== undefined ? request.settings.retrainFrequency : currentSettings.retrainFrequency,
        dataSource: request.settings.dataSource || currentSettings.dataSource,
        features: request.settings.features || currentSettings.features,
        targetVariable: request.settings.targetVariable || currentSettings.targetVariable,
        validationMethod: request.settings.validationMethod || currentSettings.validationMethod,
        hyperparameters: { ...currentSettings.hyperparameters, ...request.settings.hyperparameters },
        customFields: { ...currentSettings.customFields, ...request.settings.customFields },
        tags: request.settings.tags || currentSettings.tags,
        notes: request.settings.notes || currentSettings.notes,
      };
      existingPredictiveAnalytics.updateSettings(updatedSettings);
    }

    // ========================================================================
    // VALIDATE UPDATED PREDICTIVE ANALYTICS
    // ========================================================================

    if (!existingPredictiveAnalytics.validate()) {
      throw new Error('Invalid predictive analytics data after update');
    }

    // ========================================================================
    // SAVE UPDATED PREDICTIVE ANALYTICS
    // ========================================================================

    const updatedPredictiveAnalytics = await this.predictiveAnalyticsRepository.update(existingPredictiveAnalytics);

    // ========================================================================
    // RETURN RESPONSE
    // ========================================================================

    return this.createSuccessResponse({
      predictiveAnalytics: updatedPredictiveAnalytics,
    }, 'Predictive analytics updated successfully');
  }
}
