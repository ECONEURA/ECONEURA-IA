import { PredictiveAnalytics } from '../../../domain/entities/predictive-analytics.entity.js';
import { PredictiveAnalyticsRepository } from '../../../domain/repositories/predictive-analytics.repository.js';
import { BaseUseCase, BaseRequest, BaseResponse } from '../base.use-case.js';
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
export declare class CreatePredictiveAnalyticsUseCase extends BaseUseCase<CreatePredictiveAnalyticsRequest, CreatePredictiveAnalyticsResponse> {
    private readonly predictiveAnalyticsRepository;
    constructor(predictiveAnalyticsRepository: PredictiveAnalyticsRepository);
    execute(request: CreatePredictiveAnalyticsRequest): Promise<CreatePredictiveAnalyticsResponse>;
}
//# sourceMappingURL=create-predictive-analytics.use-case.d.ts.map