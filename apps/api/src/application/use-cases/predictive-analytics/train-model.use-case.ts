import { PredictiveAnalytics } from '../../../domain/entities/predictive-analytics.entity.js';
import { PredictiveAnalyticsRepository } from '../../../domain/repositories/predictive-analytics.repository.js';
import { BaseUseCase, BaseRequest, BaseResponse } from '../base.use-case.js';

// ============================================================================
// TRAIN MODEL USE CASE
// ============================================================================

export interface TrainModelRequest extends BaseRequest {
  id: string;
  trainingData?: Record<string, any>[];
  forceRetrain?: boolean;
}

export interface TrainModelResponse extends BaseResponse {
  data: {
    predictiveAnalytics: PredictiveAnalytics;
    trainingMetrics: {
      accuracy: number;
      precision: number;
      recall: number;
      f1Score: number;
      mae: number;
      mse: number;
      rmse: number;
      r2Score: number;
      lastTrainingDate: Date;
      trainingDuration: number;
      dataPoints: number;
      modelVersion: string;
    };
  };
}

export class TrainModelUseCase extends BaseUseCase<TrainModelRequest, TrainModelResponse> {
  constructor(
    private readonly predictiveAnalyticsRepository: PredictiveAnalyticsRepository
  ) {
    super();
  }

  async execute(request: TrainModelRequest): Promise<TrainModelResponse> {
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

    // Check if model is already training
    if (existingPredictiveAnalytics.status.value === 'processing') {
      throw new Error('Model is already being trained');
    }

    // Check if retraining is needed
    if (!request.forceRetrain && !existingPredictiveAnalytics.needsRetraining()) {
      throw new Error('Model does not need retraining at this time');
    }

    // ========================================================================
    // START TRAINING
    // ========================================================================

    existingPredictiveAnalytics.startTraining();

    // ========================================================================
    // SIMULATE TRAINING PROCESS
    // ========================================================================

    // In a real implementation, this would:
    // 1. Fetch training data from data sources
    // 2. Preprocess the data
    // 3. Train the model using the specified algorithm
    // 4. Validate the model
    // 5. Calculate metrics

    const startTime = Date.now();
    
    // Simulate training time based on model type
    const trainingTime = this.calculateTrainingTime(existingPredictiveAnalytics.settings.modelType.value);
    
    // Simulate training metrics
    const trainingMetrics = this.generateTrainingMetrics(existingPredictiveAnalytics.type.value);
    
    const endTime = Date.now();
    const actualTrainingTime = (endTime - startTime) / 1000; // Convert to seconds

    // ========================================================================
    // COMPLETE TRAINING
    // ========================================================================

    const metrics = {
      accuracy: trainingMetrics.accuracy,
      precision: trainingMetrics.precision,
      recall: trainingMetrics.recall,
      f1Score: trainingMetrics.f1Score,
      mae: trainingMetrics.mae,
      mse: trainingMetrics.mse,
      rmse: trainingMetrics.rmse,
      r2Score: trainingMetrics.r2Score,
      lastTrainingDate: new Date(),
      trainingDuration: actualTrainingTime,
      dataPoints: request.trainingData?.length || 1000,
      modelVersion: this.generateModelVersion(existingPredictiveAnalytics.metrics?.modelVersion)
    };

    existingPredictiveAnalytics.completeTraining(metrics);

    // ========================================================================
    // VALIDATE UPDATED PREDICTIVE ANALYTICS
    // ========================================================================

    if (!existingPredictiveAnalytics.validate()) {
      throw new Error('Invalid predictive analytics data after training');
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
      trainingMetrics: metrics
    }, 'Model trained successfully');
  }

  // ========================================================================
  // PRIVATE METHODS
  // ========================================================================

  private calculateTrainingTime(modelType: string): number {
    // Simulate different training times based on model complexity
    const trainingTimes: Record<string, number> = {
      'linear_regression': 30,
      'decision_tree': 60,
      'random_forest': 120,
      'neural_network': 300,
      'time_series': 180,
      'clustering': 90,
      'classification': 150,
      'deep_learning': 600
    };
    
    return trainingTimes[modelType] || 60;
  }

  private generateTrainingMetrics(type: string): any {
    // Generate realistic metrics based on analytics type
    const baseMetrics = {
      accuracy: 0.85 + Math.random() * 0.1, // 85-95%
      precision: 0.80 + Math.random() * 0.15, // 80-95%
      recall: 0.75 + Math.random() * 0.20, // 75-95%
      f1Score: 0.80 + Math.random() * 0.15, // 80-95%
      mae: 0.1 + Math.random() * 0.2, // 0.1-0.3
      mse: 0.05 + Math.random() * 0.1, // 0.05-0.15
      rmse: 0.2 + Math.random() * 0.3, // 0.2-0.5
      r2Score: 0.70 + Math.random() * 0.25 // 70-95%
    };

    // Adjust metrics based on type
    switch (type) {
      case 'churn_prediction':
        baseMetrics.accuracy = 0.90 + Math.random() * 0.05; // 90-95%
        baseMetrics.precision = 0.85 + Math.random() * 0.10; // 85-95%
        break;
      case 'sales_forecast':
        baseMetrics.r2Score = 0.75 + Math.random() * 0.20; // 75-95%
        baseMetrics.mae = 0.05 + Math.random() * 0.15; // 0.05-0.20
        break;
      case 'demand_prediction':
        baseMetrics.accuracy = 0.80 + Math.random() * 0.15; // 80-95%
        baseMetrics.mae = 0.1 + Math.random() * 0.25; // 0.1-0.35
        break;
    }

    return baseMetrics;
  }

  private generateModelVersion(currentVersion?: string): string {
    if (!currentVersion) {
      return '1.0.0';
    }
    
    const [major, minor, patch] = currentVersion.split('.').map(Number);
    return `${major}.${minor + 1}.0`;
  }
}
