import { z } from 'zod';
import { BaseEntity, BaseEntityProps } from './base.entity.js';
import { Money } from '../value-objects/money.vo.js';

// ============================================================================
// PREDICTIVE ANALYTICS ENTITY
// ============================================================================

export interface PredictiveAnalyticsId {
  value: string;
}

export interface AnalyticsType {
  value: 'sales_forecast' | 'demand_prediction' | 'churn_prediction' | 'revenue_forecast' | 'inventory_optimization' | 'customer_lifetime_value' | 'market_trend' | 'risk_assessment';
}

export interface AnalyticsStatus {
  value: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
}

export interface AnalyticsModel {
  value: 'linear_regression' | 'decision_tree' | 'random_forest' | 'neural_network' | 'time_series' | 'clustering' | 'classification' | 'deep_learning';
}

export interface AnalyticsAccuracy {
  value: 'low' | 'medium' | 'high' | 'very_high';
}

export interface PredictionData {
  id: string;
  timestamp: Date;
  inputData: Record<string, any>;
  predictedValue: number | string | boolean;
  confidence: number;
  probability?: number;
  metadata: Record<string, any>;
}

export interface AnalyticsSettings {
  modelType: AnalyticsModel;
  trainingPeriod: number; // days
  predictionHorizon: number; // days
  confidenceThreshold: number; // 0-1
  autoRetrain: boolean;
  retrainFrequency: number; // days
  dataSource: string[];
  features: string[];
  targetVariable: string;
  validationMethod: 'cross_validation' | 'holdout' | 'time_series_split';
  hyperparameters: Record<string, any>;
  customFields: Record<string, any>;
  tags: string[];
  notes: string;
}

export interface AnalyticsMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  mae: number; // Mean Absolute Error
  mse: number; // Mean Squared Error
  rmse: number; // Root Mean Squared Error
  r2Score: number;
  lastTrainingDate: Date;
  trainingDuration: number; // seconds
  dataPoints: number;
  modelVersion: string;
}

export interface PredictiveAnalyticsProps extends BaseEntityProps {
  name: string;
  type: AnalyticsType;
  status: AnalyticsStatus;
  organizationId: string;
  modelId?: string;
  description?: string;
  settings: AnalyticsSettings;
  metrics?: AnalyticsMetrics;
  predictions: PredictionData[];
  lastPredictionDate?: Date;
  nextRetrainDate?: Date;
  isActive: boolean;
}

export class PredictiveAnalytics extends BaseEntity {
  private constructor(private props: PredictiveAnalyticsProps) {
    super(props);
  }

  // ========================================================================
  // FACTORY METHODS
  // ========================================================================

  static create(props: Omit<PredictiveAnalyticsProps, 'id' | 'createdAt' | 'updatedAt'>): PredictiveAnalytics {
    const now = new Date();
    return new PredictiveAnalytics({
      ...props,
      id: { value: crypto.randomUUID() },
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromJSON(data: PredictiveAnalyticsProps): PredictiveAnalytics {
    return new PredictiveAnalytics(data);
  }

  // ========================================================================
  // GETTERS
  // ========================================================================

  get name(): string { return this.props.name; }
  get type(): AnalyticsType { return this.props.type; }
  get status(): AnalyticsStatus { return this.props.status; }
  get organizationId(): string { return this.props.organizationId; }
  get modelId(): string | undefined { return this.props.modelId; }
  get description(): string | undefined { return this.props.description; }
  get settings(): AnalyticsSettings { return this.props.settings; }
  get metrics(): AnalyticsMetrics | undefined { return this.props.metrics; }
  get predictions(): PredictionData[] { return this.props.predictions; }
  get lastPredictionDate(): Date | undefined { return this.props.lastPredictionDate; }
  get nextRetrainDate(): Date | undefined { return this.props.nextRetrainDate; }

  // ========================================================================
  // BUSINESS METHODS
  // ========================================================================

  updateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('Name cannot be empty');
    }
    this.props.name = name.trim();
    this.updateTimestamp();
  }

  updateType(type: AnalyticsType): void {
    this.props.type = type;
    this.updateTimestamp();
  }

  updateStatus(status: AnalyticsStatus): void {
    this.props.status = status;
    this.updateTimestamp();
  }

  updateModelId(modelId: string): void {
    this.props.modelId = modelId;
    this.updateTimestamp();
  }

  updateDescription(description: string): void {
    this.props.description = description;
    this.updateTimestamp();
  }

  updateSettings(settings: AnalyticsSettings): void {
    this.props.settings = settings;
    this.updateTimestamp();
  }

  updateMetrics(metrics: AnalyticsMetrics): void {
    this.props.metrics = metrics;
    this.updateTimestamp();
  }

  addPrediction(prediction: PredictionData): void {
    this.props.predictions.push(prediction);
    this.props.lastPredictionDate = new Date();
    this.updateTimestamp();
  }

  removePrediction(predictionId: string): void {
    this.props.predictions = this.props.predictions.filter(prediction => prediction.id !== predictionId);
    this.updateTimestamp();
  }

  updatePrediction(predictionId: string, updates: Partial<PredictionData>): void {
    const predictionIndex = this.props.predictions.findIndex(prediction => prediction.id === predictionId);
    if (predictionIndex !== -1) {
      this.props.predictions[predictionIndex] = { ...this.props.predictions[predictionIndex], ...updates };
      this.updateTimestamp();
    }
  }

  updateNextRetrainDate(): void {
    if (this.props.settings.autoRetrain) {
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + this.props.settings.retrainFrequency);
      this.props.nextRetrainDate = nextDate;
      this.updateTimestamp();
    }
  }

  // ========================================================================
  // PREDICTION METHODS
  // ========================================================================

  generatePrediction(inputData: Record<string, any>, confidence?: number): PredictionData {
    const prediction: PredictionData = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      inputData,
      predictedValue: this.calculatePrediction(inputData),
      confidence: confidence || this.calculateConfidence(inputData),
      metadata: {
        modelVersion: this.props.metrics?.modelVersion || '1.0.0',
        predictionType: this.props.type.value,
        inputFeatures: Object.keys(inputData),
        processingTime: Date.now()
      }
    };

    this.addPrediction(prediction);
    return prediction;
  }

  batchPredict(inputDataArray: Record<string, any>[]): PredictionData[] {
    const predictions: PredictionData[] = [];
    
    for (const inputData of inputDataArray) {
      const prediction = this.generatePrediction(inputData);
      predictions.push(prediction);
    }

    return predictions;
  }

  // ========================================================================
  // MODEL MANAGEMENT
  // ========================================================================

  startTraining(): void {
    this.props.status = { value: 'processing' };
    this.updateTimestamp();
  }

  completeTraining(metrics: AnalyticsMetrics): void {
    this.props.status = { value: 'completed' };
    this.props.metrics = metrics;
    this.updateNextRetrainDate();
    this.updateTimestamp();
  }

  failTraining(error: string): void {
    this.props.status = { value: 'failed' };
    this.updateTimestamp();
  }

  retrainModel(): void {
    this.props.status = { value: 'processing' };
    this.updateTimestamp();
  }

  // ========================================================================
  // PRIVATE METHODS
  // ========================================================================

  private calculatePrediction(inputData: Record<string, any>): number | string | boolean {
    // This would integrate with actual ML models
    // For now, return a mock prediction based on the type
    switch (this.props.type.value) {
      case 'sales_forecast':
        return Math.random() * 10000;
      case 'demand_prediction':
        return Math.floor(Math.random() * 1000);
      case 'churn_prediction':
        return Math.random() > 0.5;
      case 'revenue_forecast':
        return Math.random() * 50000;
      case 'inventory_optimization':
        return Math.floor(Math.random() * 500);
      case 'customer_lifetime_value':
        return Math.random() * 5000;
      case 'market_trend':
        return Math.random() > 0.5 ? 'up' : 'down';
      case 'risk_assessment':
        return Math.random() * 10;
      default:
        return 0;
    }
  }

  private calculateConfidence(inputData: Record<string, any>): number {
    // Mock confidence calculation
    // In real implementation, this would be based on model uncertainty
    const baseConfidence = this.props.metrics?.accuracy || 0.8;
    const dataQuality = Object.keys(inputData).length / 10; // Normalize by expected features
    return Math.min(baseConfidence * dataQuality, 1.0);
  }

  // ========================================================================
  // VALIDATION METHODS
  // ========================================================================

  validate(): boolean {
    if (!this.validateBase()) {
      return false;
    }

    if (!this.props.name || this.props.name.trim().length === 0) {
      return false;
    }

    if (!this.props.organizationId || this.props.organizationId.trim().length === 0) {
      return false;
    }

    if (this.props.settings.confidenceThreshold < 0 || this.props.settings.confidenceThreshold > 1) {
      return false;
    }

    if (this.props.settings.trainingPeriod <= 0) {
      return false;
    }

    if (this.props.settings.predictionHorizon <= 0) {
      return false;
    }

    return true;
  }

  // ========================================================================
  // UTILITY METHODS
  // ========================================================================

  toJSON(): PredictiveAnalyticsProps {
    return { ...this.props };
  }

  clone(): PredictiveAnalytics {
    return PredictiveAnalytics.fromJSON(this.toJSON());
  }

  // ========================================================================
  // BUSINESS LOGIC METHODS
  // ========================================================================

  isReadyForPrediction(): boolean {
    return this.props.status.value === 'completed' && 
           this.props.metrics !== undefined &&
           this.props.metrics.accuracy >= this.props.settings.confidenceThreshold;
  }

  needsRetraining(): boolean {
    if (!this.props.settings.autoRetrain || !this.props.nextRetrainDate) {
      return false;
    }
    return new Date() >= this.props.nextRetrainDate;
  }

  getPredictionAccuracy(): number {
    return this.props.metrics?.accuracy || 0;
  }

  getLatestPrediction(): PredictionData | undefined {
    if (this.props.predictions.length === 0) {
      return undefined;
    }
    return this.props.predictions[this.props.predictions.length - 1];
  }

  getPredictionsByDateRange(startDate: Date, endDate: Date): PredictionData[] {
    return this.props.predictions.filter(prediction => 
      prediction.timestamp >= startDate && prediction.timestamp <= endDate
    );
  }

  getAverageConfidence(): number {
    if (this.props.predictions.length === 0) {
      return 0;
    }
    const totalConfidence = this.props.predictions.reduce((sum, prediction) => sum + prediction.confidence, 0);
    return totalConfidence / this.props.predictions.length;
  }

  // ========================================================================
  // FACTORY METHODS FOR SPECIFIC ANALYTICS TYPES
  // ========================================================================

  static createSalesForecast(props: Omit<PredictiveAnalyticsProps, 'id' | 'type' | 'createdAt' | 'updatedAt'>): PredictiveAnalytics {
    return PredictiveAnalytics.create({
      ...props,
      type: { value: 'sales_forecast' },
    });
  }

  static createDemandPrediction(props: Omit<PredictiveAnalyticsProps, 'id' | 'type' | 'createdAt' | 'updatedAt'>): PredictiveAnalytics {
    return PredictiveAnalytics.create({
      ...props,
      type: { value: 'demand_prediction' },
    });
  }

  static createChurnPrediction(props: Omit<PredictiveAnalyticsProps, 'id' | 'type' | 'createdAt' | 'updatedAt'>): PredictiveAnalytics {
    return PredictiveAnalytics.create({
      ...props,
      type: { value: 'churn_prediction' },
    });
  }

  static createRevenueForecast(props: Omit<PredictiveAnalyticsProps, 'id' | 'type' | 'createdAt' | 'updatedAt'>): PredictiveAnalytics {
    return PredictiveAnalytics.create({
      ...props,
      type: { value: 'revenue_forecast' },
    });
  }

  static createInventoryOptimization(props: Omit<PredictiveAnalyticsProps, 'id' | 'type' | 'createdAt' | 'updatedAt'>): PredictiveAnalytics {
    return PredictiveAnalytics.create({
      ...props,
      type: { value: 'inventory_optimization' },
    });
  }

  static createCustomerLifetimeValue(props: Omit<PredictiveAnalyticsProps, 'id' | 'type' | 'createdAt' | 'updatedAt'>): PredictiveAnalytics {
    return PredictiveAnalytics.create({
      ...props,
      type: { value: 'customer_lifetime_value' },
    });
  }

  static createMarketTrend(props: Omit<PredictiveAnalyticsProps, 'id' | 'type' | 'createdAt' | 'updatedAt'>): PredictiveAnalytics {
    return PredictiveAnalytics.create({
      ...props,
      type: { value: 'market_trend' },
    });
  }

  static createRiskAssessment(props: Omit<PredictiveAnalyticsProps, 'id' | 'type' | 'createdAt' | 'updatedAt'>): PredictiveAnalytics {
    return PredictiveAnalytics.create({
      ...props,
      type: { value: 'risk_assessment' },
    });
  }
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type { PredictiveAnalyticsId, AnalyticsType, AnalyticsStatus, AnalyticsModel, AnalyticsAccuracy, PredictionData, AnalyticsSettings, AnalyticsMetrics };
