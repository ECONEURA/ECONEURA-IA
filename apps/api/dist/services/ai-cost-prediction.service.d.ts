import { z } from 'zod';
declare const CostPredictionModelSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodString;
    type: z.ZodEnum<["time_series", "regression", "neural_network", "ensemble"]>;
    algorithm: z.ZodEnum<["arima", "lstm", "linear_regression", "random_forest", "xgboost", "prophet"]>;
    features: z.ZodArray<z.ZodString, "many">;
    hyperparameters: z.ZodRecord<z.ZodString, z.ZodAny>;
    accuracy: z.ZodNumber;
    mae: z.ZodNumber;
    mse: z.ZodNumber;
    rmse: z.ZodNumber;
    r2Score: z.ZodNumber;
    isActive: z.ZodBoolean;
    lastTrained: z.ZodDate;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    type?: "neural_network" | "time_series" | "regression" | "ensemble";
    name?: string;
    features?: string[];
    id?: string;
    createdAt?: Date;
    updatedAt?: Date;
    description?: string;
    isActive?: boolean;
    accuracy?: number;
    hyperparameters?: Record<string, any>;
    algorithm?: "arima" | "linear_regression" | "random_forest" | "xgboost" | "lstm" | "prophet";
    mae?: number;
    mse?: number;
    rmse?: number;
    r2Score?: number;
    lastTrained?: Date;
}, {
    type?: "neural_network" | "time_series" | "regression" | "ensemble";
    name?: string;
    features?: string[];
    id?: string;
    createdAt?: Date;
    updatedAt?: Date;
    description?: string;
    isActive?: boolean;
    accuracy?: number;
    hyperparameters?: Record<string, any>;
    algorithm?: "arima" | "linear_regression" | "random_forest" | "xgboost" | "lstm" | "prophet";
    mae?: number;
    mse?: number;
    rmse?: number;
    r2Score?: number;
    lastTrained?: Date;
}>;
declare const CostPredictionSchema: z.ZodObject<{
    id: z.ZodString;
    organizationId: z.ZodString;
    modelId: z.ZodString;
    predictionType: z.ZodEnum<["daily", "weekly", "monthly", "quarterly", "yearly"]>;
    horizon: z.ZodNumber;
    predictions: z.ZodArray<z.ZodObject<{
        date: z.ZodDate;
        predictedCost: z.ZodNumber;
        confidence: z.ZodNumber;
        lowerBound: z.ZodNumber;
        upperBound: z.ZodNumber;
        factors: z.ZodRecord<z.ZodString, z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        date?: Date;
        confidence?: number;
        factors?: Record<string, number>;
        predictedCost?: number;
        lowerBound?: number;
        upperBound?: number;
    }, {
        date?: Date;
        confidence?: number;
        factors?: Record<string, number>;
        predictedCost?: number;
        lowerBound?: number;
        upperBound?: number;
    }>, "many">;
    accuracy: z.ZodNumber;
    generatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    organizationId?: string;
    id?: string;
    modelId?: string;
    predictions?: {
        date?: Date;
        confidence?: number;
        factors?: Record<string, number>;
        predictedCost?: number;
        lowerBound?: number;
        upperBound?: number;
    }[];
    predictionType?: "monthly" | "daily" | "weekly" | "quarterly" | "yearly";
    accuracy?: number;
    generatedAt?: Date;
    horizon?: number;
}, {
    organizationId?: string;
    id?: string;
    modelId?: string;
    predictions?: {
        date?: Date;
        confidence?: number;
        factors?: Record<string, number>;
        predictedCost?: number;
        lowerBound?: number;
        upperBound?: number;
    }[];
    predictionType?: "monthly" | "daily" | "weekly" | "quarterly" | "yearly";
    accuracy?: number;
    generatedAt?: Date;
    horizon?: number;
}>;
declare const CostForecastSchema: z.ZodObject<{
    id: z.ZodString;
    organizationId: z.ZodString;
    forecastType: z.ZodEnum<["budget_planning", "cost_optimization", "capacity_planning", "risk_assessment"]>;
    timeHorizon: z.ZodNumber;
    scenarios: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        probability: z.ZodNumber;
        predictions: z.ZodArray<z.ZodObject<{
            period: z.ZodString;
            cost: z.ZodNumber;
            confidence: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            period?: string;
            cost?: number;
            confidence?: number;
        }, {
            period?: string;
            cost?: number;
            confidence?: number;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        name?: string;
        probability?: number;
        predictions?: {
            period?: string;
            cost?: number;
            confidence?: number;
        }[];
    }, {
        name?: string;
        probability?: number;
        predictions?: {
            period?: string;
            cost?: number;
            confidence?: number;
        }[];
    }>, "many">;
    recommendations: z.ZodArray<z.ZodString, "many">;
    generatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    organizationId?: string;
    id?: string;
    recommendations?: string[];
    generatedAt?: Date;
    scenarios?: {
        name?: string;
        probability?: number;
        predictions?: {
            period?: string;
            cost?: number;
            confidence?: number;
        }[];
    }[];
    forecastType?: "risk_assessment" | "budget_planning" | "cost_optimization" | "capacity_planning";
    timeHorizon?: number;
}, {
    organizationId?: string;
    id?: string;
    recommendations?: string[];
    generatedAt?: Date;
    scenarios?: {
        name?: string;
        probability?: number;
        predictions?: {
            period?: string;
            cost?: number;
            confidence?: number;
        }[];
    }[];
    forecastType?: "risk_assessment" | "budget_planning" | "cost_optimization" | "capacity_planning";
    timeHorizon?: number;
}>;
export type CostPredictionModel = z.infer<typeof CostPredictionModelSchema>;
export type CostPrediction = z.infer<typeof CostPredictionSchema>;
export type CostForecast = z.infer<typeof CostForecastSchema>;
export interface CostPredictionRequest {
    organizationId: string;
    predictionType: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    horizon: number;
    features?: Record<string, any>;
    modelId?: string;
}
export interface CostForecastRequest {
    organizationId: string;
    forecastType: 'budget_planning' | 'cost_optimization' | 'capacity_planning' | 'risk_assessment';
    timeHorizon: number;
    scenarios?: string[];
    confidence?: number;
}
export interface ModelTrainingData {
    organizationId: string;
    historicalData: Array<{
        date: Date;
        cost: number;
        tokens: number;
        requests: number;
        models: string[];
        providers: string[];
        features: Record<string, number>;
    }>;
    targetVariable: string;
    features: string[];
}
export declare class AICostPredictionService {
    private db;
    private modelsCache;
    private predictionsCache;
    private forecastsCache;
    private readonly DEFAULT_MODELS;
    constructor();
    private initializeService;
    private createTables;
    private loadPredictionModels;
    private initializeDefaultModels;
    private startPredictionMonitoring;
    createPredictionModel(model: Omit<CostPredictionModel, 'id' | 'createdAt' | 'updatedAt'>): Promise<CostPredictionModel>;
    getPredictionModels(): Promise<CostPredictionModel[]>;
    trainModel(modelId: string, trainingData: ModelTrainingData): Promise<CostPredictionModel>;
    private simulateModelTraining;
    generateCostPrediction(request: CostPredictionRequest): Promise<CostPrediction>;
    private selectBestModel;
    private getHistoricalData;
    private generatePredictions;
    private getDaysMultiplier;
    private calculateTrend;
    private calculateSeasonality;
    private simulatePrediction;
    private estimatePredictionAccuracy;
    generateCostForecast(request: CostForecastRequest): Promise<CostForecast>;
    private generateScenarios;
    private generateScenarioPredictions;
    private getPeriodName;
    private generateForecastRecommendations;
    private updateModelAccuracy;
    private getRecentPredictions;
    private calculateActualAccuracy;
    private generateAutomaticPredictions;
    private getActiveOrganizations;
    private getLastPrediction;
    private retrainModelsIfNeeded;
    private getTrainingDataForModel;
    getHealthStatus(): Promise<{
        status: 'healthy' | 'degraded' | 'unhealthy';
        services: Record<string, boolean>;
        lastCheck: Date;
    }>;
    private checkDatabaseHealth;
}
export declare const aiCostPredictionService: AICostPredictionService;
export {};
//# sourceMappingURL=ai-cost-prediction.service.d.ts.map