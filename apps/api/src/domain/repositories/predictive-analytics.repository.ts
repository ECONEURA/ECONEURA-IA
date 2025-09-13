import { PredictiveAnalytics } from '../entities/predictive-analytics.entity.js';
import { BaseRepository, BaseEntity, BaseFilters, BaseSearchOptions, PaginatedResult, BaseStats } from './base.repository.js';

// ============================================================================
// PREDICTIVE ANALYTICS REPOSITORY INTERFACE
// ============================================================================

export interface PredictiveAnalyticsFilters extends BaseFilters {
  type?: string;
  status?: string;
  modelType?: string;
  accuracy?: string;
  isActive?: boolean;
  needsRetraining?: boolean;
  hasPredictions?: boolean;
  minAccuracy?: number;
  maxAccuracy?: number;
  lastPredictionFrom?: Date;
  lastPredictionTo?: Date;
  nextRetrainFrom?: Date;
  nextRetrainTo?: Date;
}

export interface PredictiveAnalyticsSearchOptions extends BaseSearchOptions {
  type?: string;
  status?: string;
  modelType?: string;
  accuracy?: string;
  isActive?: boolean;
  needsRetraining?: boolean;
  hasPredictions?: boolean;
  minAccuracy?: number;
  maxAccuracy?: number;
  lastPredictionFrom?: Date;
  lastPredictionTo?: Date;
  nextRetrainFrom?: Date;
  nextRetrainTo?: Date;
}

export interface PredictiveAnalyticsStats extends BaseStats {
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  byModelType: Record<string, number>;
  byAccuracy: Record<string, number>;
  totalPredictions: number;
  averageAccuracy: number;
  averageConfidence: number;
  activeModels: number;
  pendingTraining: number;
  failedTraining: number;
  needsRetraining: number;
  lastTrainingDate?: Date;
  totalTrainingTime: number;
  averagePredictionTime: number;
}

export interface PredictiveAnalyticsRepository extends BaseRepository<PredictiveAnalytics> {
  // ========================================================================
  // ANALYTICS-SPECIFIC QUERIES
  // ========================================================================

  findByType(type: string, organizationId: string, options?: PredictiveAnalyticsSearchOptions): Promise<PaginatedResult<PredictiveAnalytics>>;
  findByStatus(status: string, organizationId: string, options?: PredictiveAnalyticsSearchOptions): Promise<PaginatedResult<PredictiveAnalytics>>;
  findByModelType(modelType: string, organizationId: string, options?: PredictiveAnalyticsSearchOptions): Promise<PaginatedResult<PredictiveAnalytics>>;
  findByAccuracy(accuracy: string, organizationId: string, options?: PredictiveAnalyticsSearchOptions): Promise<PaginatedResult<PredictiveAnalytics>>;
  findActiveModels(organizationId: string, options?: PredictiveAnalyticsSearchOptions): Promise<PaginatedResult<PredictiveAnalytics>>;
  findNeedsRetraining(organizationId: string, options?: PredictiveAnalyticsSearchOptions): Promise<PaginatedResult<PredictiveAnalytics>>;

  // ========================================================================
  // PREDICTION-BASED QUERIES
  // ========================================================================

  findByPredictionDateRange(organizationId: string, startDate: Date, endDate: Date, options?: PredictiveAnalyticsSearchOptions): Promise<PaginatedResult<PredictiveAnalytics>>;
  findByLastPredictionDate(organizationId: string, days: number, options?: PredictiveAnalyticsSearchOptions): Promise<PaginatedResult<PredictiveAnalytics>>;
  findByPredictionCount(organizationId: string, minCount: number, maxCount?: number, options?: PredictiveAnalyticsSearchOptions): Promise<PaginatedResult<PredictiveAnalytics>>;
  findByConfidenceRange(organizationId: string, minConfidence: number, maxConfidence: number, options?: PredictiveAnalyticsSearchOptions): Promise<PaginatedResult<PredictiveAnalytics>>;

  // ========================================================================
  // TRAINING-BASED QUERIES
  // ========================================================================

  findByTrainingDateRange(organizationId: string, startDate: Date, endDate: Date, options?: PredictiveAnalyticsSearchOptions): Promise<PaginatedResult<PredictiveAnalytics>>;
  findByLastTrainingDate(organizationId: string, days: number, options?: PredictiveAnalyticsSearchOptions): Promise<PaginatedResult<PredictiveAnalytics>>;
  findPendingTraining(organizationId: string, options?: PredictiveAnalyticsSearchOptions): Promise<PaginatedResult<PredictiveAnalytics>>;
  findFailedTraining(organizationId: string, options?: PredictiveAnalyticsSearchOptions): Promise<PaginatedResult<PredictiveAnalytics>>;

  // ========================================================================
  // SEARCH OPERATIONS
  // ========================================================================

  searchByName(name: string, organizationId: string): Promise<PredictiveAnalytics[]>;
  searchByDescription(description: string, organizationId: string): Promise<PredictiveAnalytics[]>;
  searchByModelId(modelId: string, organizationId: string): Promise<PredictiveAnalytics[]>;

  // ========================================================================
  // BULK OPERATIONS
  // ========================================================================

  updateStatusMany(ids: string[], status: string): Promise<void>;
  updateSettingsMany(ids: string[], settings: any): Promise<void>;
  retrainModelsMany(ids: string[]): Promise<void>;
  deletePredictionsMany(ids: string[], olderThan: Date): Promise<void>;

  // ========================================================================
  // STATISTICS AND ANALYTICS
  // ========================================================================

  getStats(organizationId: string, filters?: PredictiveAnalyticsFilters): Promise<PredictiveAnalyticsStats>;
  getStatsByType(organizationId: string, type: string): Promise<PredictiveAnalyticsStats>;
  getStatsByStatus(organizationId: string, status: string): Promise<PredictiveAnalyticsStats>;
  getStatsByModelType(organizationId: string, modelType: string): Promise<PredictiveAnalyticsStats>;

  // ========================================================================
  // PREDICTION ANALYTICS
  // ========================================================================

  getPredictionAnalytics(organizationId: string, startDate: Date, endDate: Date): Promise<{
    totalPredictions: number;
    averageConfidence: number;
    byType: Record<string, number>;
    byModel: Array<{
      modelId: string;
      modelName: string;
      predictions: number;
      averageConfidence: number;
      accuracy: number;
    }>;
    trends: Array<{
      date: Date;
      predictions: number;
      averageConfidence: number;
    }>;
    accuracyDistribution: Array<{
      range: string;
      count: number;
      percentage: number;
    }>;
    analysisDate: Date;
  }>;

  getModelPerformanceAnalytics(organizationId: string): Promise<{
    totalModels: number;
    activeModels: number;
    averageAccuracy: number;
    byType: Array<{
      type: string;
      count: number;
      averageAccuracy: number;
      bestAccuracy: number;
      worstAccuracy: number;
    }>;
    byModelType: Array<{
      modelType: string;
      count: number;
      averageAccuracy: number;
      averageTrainingTime: number;
    }>;
    performanceTrends: Array<{
      date: Date;
      averageAccuracy: number;
      modelsTrained: number;
    }>;
    analysisDate: Date;
  }>;

  getTrainingAnalytics(organizationId: string, startDate: Date, endDate: Date): Promise<{
    totalTrainingSessions: number;
    successfulTraining: number;
    failedTraining: number;
    averageTrainingTime: number;
    byType: Array<{
      type: string;
      trainingSessions: number;
      successRate: number;
      averageTime: number;
    }>;
    byModelType: Array<{
      modelType: string;
      trainingSessions: number;
      successRate: number;
      averageTime: number;
    }>;
    trainingTrends: Array<{
      date: Date;
      sessions: number;
      successRate: number;
      averageTime: number;
    }>;
    analysisDate: Date;
  }>;

  // ========================================================================
  // UTILITY METHODS
  // ========================================================================

  existsByName(name: string, organizationId: string): Promise<boolean>;
  existsByModelId(modelId: string, organizationId: string): Promise<boolean>;
  getAnalyticsCount(organizationId: string, filters?: PredictiveAnalyticsFilters): Promise<number>;
  getTotalPredictions(organizationId: string, filters?: PredictiveAnalyticsFilters): Promise<number>;
  getAverageAccuracy(organizationId: string, filters?: PredictiveAnalyticsFilters): Promise<number>;
  getAverageConfidence(organizationId: string, filters?: PredictiveAnalyticsFilters): Promise<number>;
  getActiveModelsCount(organizationId: string, filters?: PredictiveAnalyticsFilters): Promise<number>;
  getNeedsRetrainingCount(organizationId: string, filters?: PredictiveAnalyticsFilters): Promise<number>;

  // ========================================================================
  // REPORTING
  // ========================================================================

  generateAnalyticsReport(organizationId: string, filters?: PredictiveAnalyticsFilters): Promise<{
    summary: PredictiveAnalyticsStats;
    analytics: PredictiveAnalytics[];
    generatedAt: Date;
  }>;

  generatePredictionReport(organizationId: string, startDate: Date, endDate: Date): Promise<{
    summary: {
      totalPredictions: number;
      averageConfidence: number;
      byType: Record<string, number>;
    };
    predictions: Array<{
      id: string;
      name: string;
      type: string;
      predictedValue: any;
      confidence: number;
      timestamp: Date;
      accuracy?: number;
    }>;
    generatedAt: Date;
  }>;

  generateModelPerformanceReport(organizationId: string): Promise<{
    summary: {
      totalModels: number;
      activeModels: number;
      averageAccuracy: number;
      needsRetraining: number;
    };
    models: Array<{
      id: string;
      name: string;
      type: string;
      modelType: string;
      accuracy: number;
      lastTrainingDate: Date;
      predictions: number;
      status: string;
    }>;
    generatedAt: Date;
  }>;

  generateTrainingReport(organizationId: string, startDate: Date, endDate: Date): Promise<{
    summary: {
      totalSessions: number;
      successful: number;
      failed: number;
      averageTime: number;
    };
    trainingSessions: Array<{
      id: string;
      name: string;
      type: string;
      modelType: string;
      status: string;
      trainingDate: Date;
      duration: number;
      accuracy: number;
      errorMessage?: string;
    }>;
    generatedAt: Date;
  }>;
}
