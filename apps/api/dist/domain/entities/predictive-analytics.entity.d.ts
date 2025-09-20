import { BaseEntity, BaseEntityProps } from './base.entity.js';
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
}
export interface AnalyticsMetrics {
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
export declare class PredictiveAnalytics extends BaseEntity {
    private props;
    private constructor();
    static create(props: Omit<PredictiveAnalyticsProps, 'id' | 'createdAt' | 'updatedAt'>): PredictiveAnalytics;
    static fromJSON(data: PredictiveAnalyticsProps): PredictiveAnalytics;
    get name(): string;
    get type(): AnalyticsType;
    get status(): AnalyticsStatus;
    get organizationId(): string;
    get modelId(): string | undefined;
    get description(): string | undefined;
    get settings(): AnalyticsSettings;
    get metrics(): AnalyticsMetrics | undefined;
    get predictions(): PredictionData[];
    get lastPredictionDate(): Date | undefined;
    get nextRetrainDate(): Date | undefined;
    updateName(name: string): void;
    updateType(type: AnalyticsType): void;
    updateStatus(status: AnalyticsStatus): void;
    updateModelId(modelId: string): void;
    updateDescription(description: string): void;
    updateSettings(settings: AnalyticsSettings): void;
    updateMetrics(metrics: AnalyticsMetrics): void;
    addPrediction(prediction: PredictionData): void;
    removePrediction(predictionId: string): void;
    updatePrediction(predictionId: string, updates: Partial<PredictionData>): void;
    updateNextRetrainDate(): void;
    generatePrediction(inputData: Record<string, any>, confidence?: number): PredictionData;
    batchPredict(inputDataArray: Record<string, any>[]): PredictionData[];
    startTraining(): void;
    completeTraining(metrics: AnalyticsMetrics): void;
    failTraining(error: string): void;
    retrainModel(): void;
    private calculatePrediction;
    private calculateConfidence;
    validate(): boolean;
    toJSON(): PredictiveAnalyticsProps;
    clone(): PredictiveAnalytics;
    isReadyForPrediction(): boolean;
    needsRetraining(): boolean;
    getPredictionAccuracy(): number;
    getLatestPrediction(): PredictionData | undefined;
    getPredictionsByDateRange(startDate: Date, endDate: Date): PredictionData[];
    getAverageConfidence(): number;
    static createSalesForecast(props: Omit<PredictiveAnalyticsProps, 'id' | 'type' | 'createdAt' | 'updatedAt'>): PredictiveAnalytics;
    static createDemandPrediction(props: Omit<PredictiveAnalyticsProps, 'id' | 'type' | 'createdAt' | 'updatedAt'>): PredictiveAnalytics;
    static createChurnPrediction(props: Omit<PredictiveAnalyticsProps, 'id' | 'type' | 'createdAt' | 'updatedAt'>): PredictiveAnalytics;
    static createRevenueForecast(props: Omit<PredictiveAnalyticsProps, 'id' | 'type' | 'createdAt' | 'updatedAt'>): PredictiveAnalytics;
    static createInventoryOptimization(props: Omit<PredictiveAnalyticsProps, 'id' | 'type' | 'createdAt' | 'updatedAt'>): PredictiveAnalytics;
    static createCustomerLifetimeValue(props: Omit<PredictiveAnalyticsProps, 'id' | 'type' | 'createdAt' | 'updatedAt'>): PredictiveAnalytics;
    static createMarketTrend(props: Omit<PredictiveAnalyticsProps, 'id' | 'type' | 'createdAt' | 'updatedAt'>): PredictiveAnalytics;
    static createRiskAssessment(props: Omit<PredictiveAnalyticsProps, 'id' | 'type' | 'createdAt' | 'updatedAt'>): PredictiveAnalytics;
}
export type { PredictiveAnalyticsId, AnalyticsType, AnalyticsStatus, AnalyticsModel, AnalyticsAccuracy, PredictionData, AnalyticsSettings, AnalyticsMetrics };
//# sourceMappingURL=predictive-analytics.entity.d.ts.map