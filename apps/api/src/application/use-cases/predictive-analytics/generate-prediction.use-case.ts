import { PredictiveAnalytics } from '../../../domain/entities/predictive-analytics.entity.js';
import { PredictiveAnalyticsRepository } from '../../../domain/repositories/predictive-analytics.repository.js';
import { BaseUseCase, BaseRequest, BaseResponse } from '../base.use-case.js';

// ============================================================================
// GENERATE PREDICTION USE CASE
// ============================================================================

export interface GeneratePredictionRequest extends BaseRequest {
  id: string;
  inputData: Record<string, any>;
  confidence?: number;
}

export interface GeneratePredictionResponse extends BaseResponse {
  data: {
    prediction: {
      id: string;
      timestamp: Date;
      inputData: Record<string, any>;
      predictedValue: number | string | boolean;
      confidence: number;
      probability?: number;
      metadata: Record<string, any>;
    };
    predictiveAnalytics: PredictiveAnalytics;
  };
}

export class GeneratePredictionUseCase extends BaseUseCase<GeneratePredictionRequest, GeneratePredictionResponse> {
  constructor(
    private readonly predictiveAnalyticsRepository: PredictiveAnalyticsRepository
  ) {
    super();
  }

  async execute(request: GeneratePredictionRequest): Promise<GeneratePredictionResponse> {
    // ========================================================================
    // VALIDATION
    // ========================================================================

    this.validateId(request.id, 'Predictive Analytics ID');

    if (!request.inputData || Object.keys(request.inputData).length === 0) {
      throw new Error('Input data is required');
    }

    if (request.confidence !== undefined && (request.confidence < 0 || request.confidence > 1)) {
      throw new Error('Confidence must be between 0 and 1');
    }

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

    // Check if model is ready for prediction
    if (!existingPredictiveAnalytics.isReadyForPrediction()) {
      throw new Error('Model is not ready for prediction. Please ensure the model is trained and has sufficient accuracy.');
    }

    // Validate input data against expected features
    const expectedFeatures = existingPredictiveAnalytics.settings.features;
    const inputFeatures = Object.keys(request.inputData);

    const missingFeatures = expectedFeatures.filter(feature => !inputFeatures.includes(feature));
    if (missingFeatures.length > 0) {
      throw new Error(`Missing required features: ${missingFeatures.join(', ')}`);
    }

    // ========================================================================
    // GENERATE PREDICTION
    // ========================================================================

    const prediction = existingPredictiveAnalytics.generatePrediction(request.inputData, request.confidence);

    // ========================================================================
    // VALIDATE UPDATED PREDICTIVE ANALYTICS
    // ========================================================================

    if (!existingPredictiveAnalytics.validate()) {
      throw new Error('Invalid predictive analytics data after prediction');
    }

    // ========================================================================
    // SAVE UPDATED PREDICTIVE ANALYTICS
    // ========================================================================

    const updatedPredictiveAnalytics = await this.predictiveAnalyticsRepository.update(existingPredictiveAnalytics);

    // ========================================================================
    // RETURN RESPONSE
    // ========================================================================

    return this.createSuccessResponse({
      prediction: {
        id: prediction.id,
        timestamp: prediction.timestamp,
        inputData: prediction.inputData,
        predictedValue: prediction.predictedValue,
        confidence: prediction.confidence,
        probability: prediction.probability,
        metadata: prediction.metadata
      },
      predictiveAnalytics: updatedPredictiveAnalytics
    }, 'Prediction generated successfully');
  }
}
