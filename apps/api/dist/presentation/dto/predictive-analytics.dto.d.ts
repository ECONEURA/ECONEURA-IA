import { z } from 'zod';
export declare const CreatePredictiveAnalyticsRequestSchema: z.ZodObject<{
    organizationId: z.ZodString;
    name: z.ZodEffects<z.ZodString, string, string>;
    type: z.ZodEnum<["sales_forecast", "demand_prediction", "churn_prediction", "revenue_forecast", "inventory_optimization", "customer_lifetime_value", "market_trend", "risk_assessment"]>;
    description: z.ZodOptional<z.ZodEffects<z.ZodOptional<z.ZodString>, string, string>>;
    modelId: z.ZodOptional<z.ZodString>;
    settings: z.ZodObject<{
        modelType: z.ZodEnum<["linear_regression", "decision_tree", "random_forest", "neural_network", "time_series", "clustering", "classification", "deep_learning"]>;
        trainingPeriod: z.ZodNumber;
        predictionHorizon: z.ZodNumber;
        confidenceThreshold: z.ZodDefault<z.ZodNumber>;
        autoRetrain: z.ZodDefault<z.ZodBoolean>;
        retrainFrequency: z.ZodDefault<z.ZodNumber>;
        dataSource: z.ZodArray<z.ZodString, "many">;
        features: z.ZodArray<z.ZodString, "many">;
        targetVariable: z.ZodString;
        validationMethod: z.ZodDefault<z.ZodEnum<["cross_validation", "holdout", "time_series_split"]>>;
        hyperparameters: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodAny>>;
        customFields: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodAny>>;
        tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        notes: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        features?: string[];
        tags?: string[];
        notes?: string;
        customFields?: Record<string, any>;
        modelType?: "linear_regression" | "decision_tree" | "random_forest" | "neural_network" | "time_series" | "clustering" | "classification" | "deep_learning";
        trainingPeriod?: number;
        predictionHorizon?: number;
        confidenceThreshold?: number;
        autoRetrain?: boolean;
        retrainFrequency?: number;
        dataSource?: string[];
        targetVariable?: string;
        validationMethod?: "cross_validation" | "holdout" | "time_series_split";
        hyperparameters?: Record<string, any>;
    }, {
        features?: string[];
        tags?: string[];
        notes?: string;
        customFields?: Record<string, any>;
        modelType?: "linear_regression" | "decision_tree" | "random_forest" | "neural_network" | "time_series" | "clustering" | "classification" | "deep_learning";
        trainingPeriod?: number;
        predictionHorizon?: number;
        confidenceThreshold?: number;
        autoRetrain?: boolean;
        retrainFrequency?: number;
        dataSource?: string[];
        targetVariable?: string;
        validationMethod?: "cross_validation" | "holdout" | "time_series_split";
        hyperparameters?: Record<string, any>;
    }>;
}, "strip", z.ZodTypeAny, {
    type?: "sales_forecast" | "demand_prediction" | "churn_prediction" | "revenue_forecast" | "inventory_optimization" | "customer_lifetime_value" | "market_trend" | "risk_assessment";
    organizationId?: string;
    name?: string;
    description?: string;
    settings?: {
        features?: string[];
        tags?: string[];
        notes?: string;
        customFields?: Record<string, any>;
        modelType?: "linear_regression" | "decision_tree" | "random_forest" | "neural_network" | "time_series" | "clustering" | "classification" | "deep_learning";
        trainingPeriod?: number;
        predictionHorizon?: number;
        confidenceThreshold?: number;
        autoRetrain?: boolean;
        retrainFrequency?: number;
        dataSource?: string[];
        targetVariable?: string;
        validationMethod?: "cross_validation" | "holdout" | "time_series_split";
        hyperparameters?: Record<string, any>;
    };
    modelId?: string;
}, {
    type?: "sales_forecast" | "demand_prediction" | "churn_prediction" | "revenue_forecast" | "inventory_optimization" | "customer_lifetime_value" | "market_trend" | "risk_assessment";
    organizationId?: string;
    name?: string;
    description?: string;
    settings?: {
        features?: string[];
        tags?: string[];
        notes?: string;
        customFields?: Record<string, any>;
        modelType?: "linear_regression" | "decision_tree" | "random_forest" | "neural_network" | "time_series" | "clustering" | "classification" | "deep_learning";
        trainingPeriod?: number;
        predictionHorizon?: number;
        confidenceThreshold?: number;
        autoRetrain?: boolean;
        retrainFrequency?: number;
        dataSource?: string[];
        targetVariable?: string;
        validationMethod?: "cross_validation" | "holdout" | "time_series_split";
        hyperparameters?: Record<string, any>;
    };
    modelId?: string;
}>;
export declare const UpdatePredictiveAnalyticsRequestSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    type: z.ZodOptional<z.ZodEnum<["sales_forecast", "demand_prediction", "churn_prediction", "revenue_forecast", "inventory_optimization", "customer_lifetime_value", "market_trend", "risk_assessment"]>>;
    description: z.ZodOptional<z.ZodEffects<z.ZodOptional<z.ZodString>, string, string>>;
    modelId: z.ZodOptional<z.ZodString>;
    settings: z.ZodOptional<z.ZodObject<{
        modelType: z.ZodOptional<z.ZodEnum<["linear_regression", "decision_tree", "random_forest", "neural_network", "time_series", "clustering", "classification", "deep_learning"]>>;
        trainingPeriod: z.ZodOptional<z.ZodNumber>;
        predictionHorizon: z.ZodOptional<z.ZodNumber>;
        confidenceThreshold: z.ZodOptional<z.ZodNumber>;
        autoRetrain: z.ZodOptional<z.ZodBoolean>;
        retrainFrequency: z.ZodOptional<z.ZodNumber>;
        dataSource: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        features: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        targetVariable: z.ZodOptional<z.ZodString>;
        validationMethod: z.ZodOptional<z.ZodEnum<["cross_validation", "holdout", "time_series_split"]>>;
        hyperparameters: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        customFields: z.ZodOptional<z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodAny>>>;
        tags: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodString, "many">>>;
        notes: z.ZodOptional<z.ZodDefault<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        features?: string[];
        tags?: string[];
        notes?: string;
        customFields?: Record<string, any>;
        modelType?: "linear_regression" | "decision_tree" | "random_forest" | "neural_network" | "time_series" | "clustering" | "classification" | "deep_learning";
        trainingPeriod?: number;
        predictionHorizon?: number;
        confidenceThreshold?: number;
        autoRetrain?: boolean;
        retrainFrequency?: number;
        dataSource?: string[];
        targetVariable?: string;
        validationMethod?: "cross_validation" | "holdout" | "time_series_split";
        hyperparameters?: Record<string, any>;
    }, {
        features?: string[];
        tags?: string[];
        notes?: string;
        customFields?: Record<string, any>;
        modelType?: "linear_regression" | "decision_tree" | "random_forest" | "neural_network" | "time_series" | "clustering" | "classification" | "deep_learning";
        trainingPeriod?: number;
        predictionHorizon?: number;
        confidenceThreshold?: number;
        autoRetrain?: boolean;
        retrainFrequency?: number;
        dataSource?: string[];
        targetVariable?: string;
        validationMethod?: "cross_validation" | "holdout" | "time_series_split";
        hyperparameters?: Record<string, any>;
    }>>;
}, "strip", z.ZodTypeAny, {
    type?: "sales_forecast" | "demand_prediction" | "churn_prediction" | "revenue_forecast" | "inventory_optimization" | "customer_lifetime_value" | "market_trend" | "risk_assessment";
    name?: string;
    description?: string;
    settings?: {
        features?: string[];
        tags?: string[];
        notes?: string;
        customFields?: Record<string, any>;
        modelType?: "linear_regression" | "decision_tree" | "random_forest" | "neural_network" | "time_series" | "clustering" | "classification" | "deep_learning";
        trainingPeriod?: number;
        predictionHorizon?: number;
        confidenceThreshold?: number;
        autoRetrain?: boolean;
        retrainFrequency?: number;
        dataSource?: string[];
        targetVariable?: string;
        validationMethod?: "cross_validation" | "holdout" | "time_series_split";
        hyperparameters?: Record<string, any>;
    };
    modelId?: string;
}, {
    type?: "sales_forecast" | "demand_prediction" | "churn_prediction" | "revenue_forecast" | "inventory_optimization" | "customer_lifetime_value" | "market_trend" | "risk_assessment";
    name?: string;
    description?: string;
    settings?: {
        features?: string[];
        tags?: string[];
        notes?: string;
        customFields?: Record<string, any>;
        modelType?: "linear_regression" | "decision_tree" | "random_forest" | "neural_network" | "time_series" | "clustering" | "classification" | "deep_learning";
        trainingPeriod?: number;
        predictionHorizon?: number;
        confidenceThreshold?: number;
        autoRetrain?: boolean;
        retrainFrequency?: number;
        dataSource?: string[];
        targetVariable?: string;
        validationMethod?: "cross_validation" | "holdout" | "time_series_split";
        hyperparameters?: Record<string, any>;
    };
    modelId?: string;
}>;
export declare const GeneratePredictionRequestSchema: z.ZodObject<{
    id: z.ZodString;
    inputData: any;
    confidence: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    [x: string]: any;
    id?: unknown;
    inputData?: unknown;
    confidence?: unknown;
}, {
    [x: string]: any;
    id?: unknown;
    inputData?: unknown;
    confidence?: unknown;
}>;
export declare const TrainModelRequestSchema: z.ZodObject<{
    id: z.ZodString;
    trainingData: z.ZodOptional<z.ZodArray<z.ZodRecord<z.ZodString, z.ZodAny>, "many">>;
    forceRetrain: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    id?: string;
    trainingData?: Record<string, any>[];
    forceRetrain?: boolean;
}, {
    id?: string;
    trainingData?: Record<string, any>[];
    forceRetrain?: boolean;
}>;
export declare const PredictiveAnalyticsIdParamSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id?: string;
}, {
    id?: string;
}>;
export declare const PredictiveAnalyticsOrganizationIdParamSchema: z.ZodObject<{
    organizationId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    organizationId?: string;
}, {
    organizationId?: string;
}>;
export declare const PredictiveAnalyticsSearchQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    sortBy: z.ZodDefault<z.ZodString>;
    sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
} & {
    search: z.ZodOptional<z.ZodString>;
} & {
    type: z.ZodOptional<z.ZodEnum<["sales_forecast", "demand_prediction", "churn_prediction", "revenue_forecast", "inventory_optimization", "customer_lifetime_value", "market_trend", "risk_assessment"]>>;
    status: z.ZodOptional<z.ZodEnum<["pending", "processing", "completed", "failed", "cancelled"]>>;
    modelType: z.ZodOptional<z.ZodEnum<["linear_regression", "decision_tree", "random_forest", "neural_network", "time_series", "clustering", "classification", "deep_learning"]>>;
    accuracy: z.ZodOptional<z.ZodEnum<["low", "medium", "high", "very_high"]>>;
    isActive: z.ZodOptional<z.ZodBoolean>;
    needsRetraining: z.ZodOptional<z.ZodBoolean>;
    hasPredictions: z.ZodOptional<z.ZodBoolean>;
    minAccuracy: z.ZodOptional<z.ZodNumber>;
    maxAccuracy: z.ZodOptional<z.ZodNumber>;
    lastPredictionFrom: z.ZodOptional<z.ZodDate>;
    lastPredictionTo: z.ZodOptional<z.ZodDate>;
    nextRetrainFrom: z.ZodOptional<z.ZodDate>;
    nextRetrainTo: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    type?: "sales_forecast" | "demand_prediction" | "churn_prediction" | "revenue_forecast" | "inventory_optimization" | "customer_lifetime_value" | "market_trend" | "risk_assessment";
    status?: "pending" | "processing" | "completed" | "failed" | "cancelled";
    page?: number;
    limit?: number;
    isActive?: boolean;
    search?: string;
    modelType?: "linear_regression" | "decision_tree" | "random_forest" | "neural_network" | "time_series" | "clustering" | "classification" | "deep_learning";
    accuracy?: "low" | "medium" | "high" | "very_high";
    needsRetraining?: boolean;
    hasPredictions?: boolean;
    minAccuracy?: number;
    maxAccuracy?: number;
    lastPredictionFrom?: Date;
    lastPredictionTo?: Date;
    nextRetrainFrom?: Date;
    nextRetrainTo?: Date;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}, {
    type?: "sales_forecast" | "demand_prediction" | "churn_prediction" | "revenue_forecast" | "inventory_optimization" | "customer_lifetime_value" | "market_trend" | "risk_assessment";
    status?: "pending" | "processing" | "completed" | "failed" | "cancelled";
    page?: number;
    limit?: number;
    isActive?: boolean;
    search?: string;
    modelType?: "linear_regression" | "decision_tree" | "random_forest" | "neural_network" | "time_series" | "clustering" | "classification" | "deep_learning";
    accuracy?: "low" | "medium" | "high" | "very_high";
    needsRetraining?: boolean;
    hasPredictions?: boolean;
    minAccuracy?: number;
    maxAccuracy?: number;
    lastPredictionFrom?: Date;
    lastPredictionTo?: Date;
    nextRetrainFrom?: Date;
    nextRetrainTo?: Date;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}>;
export declare const PredictiveAnalyticsBulkUpdateSchema: z.ZodObject<{
    ids: z.ZodArray<z.ZodString, "many">;
    updates: z.ZodObject<{
        status: z.ZodOptional<z.ZodEnum<["pending", "processing", "completed", "failed", "cancelled"]>>;
        autoRetrain: z.ZodOptional<z.ZodBoolean>;
        retrainFrequency: z.ZodOptional<z.ZodNumber>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        status?: "pending" | "processing" | "completed" | "failed" | "cancelled";
        tags?: string[];
        autoRetrain?: boolean;
        retrainFrequency?: number;
    }, {
        status?: "pending" | "processing" | "completed" | "failed" | "cancelled";
        tags?: string[];
        autoRetrain?: boolean;
        retrainFrequency?: number;
    }>;
}, "strip", z.ZodTypeAny, {
    updates?: {
        status?: "pending" | "processing" | "completed" | "failed" | "cancelled";
        tags?: string[];
        autoRetrain?: boolean;
        retrainFrequency?: number;
    };
    ids?: string[];
}, {
    updates?: {
        status?: "pending" | "processing" | "completed" | "failed" | "cancelled";
        tags?: string[];
        autoRetrain?: boolean;
        retrainFrequency?: number;
    };
    ids?: string[];
}>;
export declare const PredictiveAnalyticsBulkDeleteSchema: z.ZodObject<{
    ids: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    ids?: string[];
}, {
    ids?: string[];
}>;
export declare const PredictionDataResponseSchema: z.ZodObject<{
    id: z.ZodString;
    timestamp: z.ZodDate;
    inputData: z.ZodRecord<z.ZodString, z.ZodAny>;
    predictedValue: z.ZodUnion<[z.ZodNumber, z.ZodString, z.ZodBoolean]>;
    confidence: z.ZodNumber;
    probability: z.ZodOptional<z.ZodNumber>;
    metadata: z.ZodRecord<z.ZodString, z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    timestamp?: Date;
    metadata?: Record<string, any>;
    id?: string;
    probability?: number;
    confidence?: number;
    inputData?: Record<string, any>;
    predictedValue?: string | number | boolean;
}, {
    timestamp?: Date;
    metadata?: Record<string, any>;
    id?: string;
    probability?: number;
    confidence?: number;
    inputData?: Record<string, any>;
    predictedValue?: string | number | boolean;
}>;
export declare const AnalyticsMetricsResponseSchema: z.ZodObject<{
    accuracy: z.ZodNumber;
    precision: z.ZodNumber;
    recall: z.ZodNumber;
    f1Score: z.ZodNumber;
    mae: z.ZodNumber;
    mse: z.ZodNumber;
    rmse: z.ZodNumber;
    r2Score: z.ZodNumber;
    lastTrainingDate: z.ZodDate;
    trainingDuration: z.ZodNumber;
    dataPoints: z.ZodNumber;
    modelVersion: z.ZodString;
}, "strip", z.ZodTypeAny, {
    modelVersion?: string;
    accuracy?: number;
    dataPoints?: number;
    precision?: number;
    recall?: number;
    f1Score?: number;
    mae?: number;
    mse?: number;
    rmse?: number;
    r2Score?: number;
    lastTrainingDate?: Date;
    trainingDuration?: number;
}, {
    modelVersion?: string;
    accuracy?: number;
    dataPoints?: number;
    precision?: number;
    recall?: number;
    f1Score?: number;
    mae?: number;
    mse?: number;
    rmse?: number;
    r2Score?: number;
    lastTrainingDate?: Date;
    trainingDuration?: number;
}>;
export declare const PredictiveAnalyticsResponseSchema: z.ZodObject<{
    id: z.ZodString;
    organizationId: z.ZodString;
    name: z.ZodString;
    type: z.ZodEnum<["sales_forecast", "demand_prediction", "churn_prediction", "revenue_forecast", "inventory_optimization", "customer_lifetime_value", "market_trend", "risk_assessment"]>;
    status: z.ZodEnum<["pending", "processing", "completed", "failed", "cancelled"]>;
    modelId: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    settings: z.ZodObject<{
        modelType: z.ZodEnum<["linear_regression", "decision_tree", "random_forest", "neural_network", "time_series", "clustering", "classification", "deep_learning"]>;
        trainingPeriod: z.ZodNumber;
        predictionHorizon: z.ZodNumber;
        confidenceThreshold: z.ZodNumber;
        autoRetrain: z.ZodBoolean;
        retrainFrequency: z.ZodNumber;
        dataSource: z.ZodArray<z.ZodString, "many">;
        features: z.ZodArray<z.ZodString, "many">;
        targetVariable: z.ZodString;
        validationMethod: z.ZodEnum<["cross_validation", "holdout", "time_series_split"]>;
        hyperparameters: z.ZodRecord<z.ZodString, z.ZodAny>;
        customFields: z.ZodRecord<z.ZodString, z.ZodAny>;
        tags: z.ZodArray<z.ZodString, "many">;
        notes: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        features?: string[];
        tags?: string[];
        notes?: string;
        customFields?: Record<string, any>;
        modelType?: "linear_regression" | "decision_tree" | "random_forest" | "neural_network" | "time_series" | "clustering" | "classification" | "deep_learning";
        trainingPeriod?: number;
        predictionHorizon?: number;
        confidenceThreshold?: number;
        autoRetrain?: boolean;
        retrainFrequency?: number;
        dataSource?: string[];
        targetVariable?: string;
        validationMethod?: "cross_validation" | "holdout" | "time_series_split";
        hyperparameters?: Record<string, any>;
    }, {
        features?: string[];
        tags?: string[];
        notes?: string;
        customFields?: Record<string, any>;
        modelType?: "linear_regression" | "decision_tree" | "random_forest" | "neural_network" | "time_series" | "clustering" | "classification" | "deep_learning";
        trainingPeriod?: number;
        predictionHorizon?: number;
        confidenceThreshold?: number;
        autoRetrain?: boolean;
        retrainFrequency?: number;
        dataSource?: string[];
        targetVariable?: string;
        validationMethod?: "cross_validation" | "holdout" | "time_series_split";
        hyperparameters?: Record<string, any>;
    }>;
    metrics: z.ZodOptional<z.ZodObject<{
        accuracy: z.ZodNumber;
        precision: z.ZodNumber;
        recall: z.ZodNumber;
        f1Score: z.ZodNumber;
        mae: z.ZodNumber;
        mse: z.ZodNumber;
        rmse: z.ZodNumber;
        r2Score: z.ZodNumber;
        lastTrainingDate: z.ZodDate;
        trainingDuration: z.ZodNumber;
        dataPoints: z.ZodNumber;
        modelVersion: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        modelVersion?: string;
        accuracy?: number;
        dataPoints?: number;
        precision?: number;
        recall?: number;
        f1Score?: number;
        mae?: number;
        mse?: number;
        rmse?: number;
        r2Score?: number;
        lastTrainingDate?: Date;
        trainingDuration?: number;
    }, {
        modelVersion?: string;
        accuracy?: number;
        dataPoints?: number;
        precision?: number;
        recall?: number;
        f1Score?: number;
        mae?: number;
        mse?: number;
        rmse?: number;
        r2Score?: number;
        lastTrainingDate?: Date;
        trainingDuration?: number;
    }>>;
    predictions: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        timestamp: z.ZodDate;
        inputData: z.ZodRecord<z.ZodString, z.ZodAny>;
        predictedValue: z.ZodUnion<[z.ZodNumber, z.ZodString, z.ZodBoolean]>;
        confidence: z.ZodNumber;
        probability: z.ZodOptional<z.ZodNumber>;
        metadata: z.ZodRecord<z.ZodString, z.ZodAny>;
    }, "strip", z.ZodTypeAny, {
        timestamp?: Date;
        metadata?: Record<string, any>;
        id?: string;
        probability?: number;
        confidence?: number;
        inputData?: Record<string, any>;
        predictedValue?: string | number | boolean;
    }, {
        timestamp?: Date;
        metadata?: Record<string, any>;
        id?: string;
        probability?: number;
        confidence?: number;
        inputData?: Record<string, any>;
        predictedValue?: string | number | boolean;
    }>, "many">;
    lastPredictionDate: z.ZodOptional<z.ZodDate>;
    nextRetrainDate: z.ZodOptional<z.ZodDate>;
    isActive: z.ZodBoolean;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    type?: "sales_forecast" | "demand_prediction" | "churn_prediction" | "revenue_forecast" | "inventory_optimization" | "customer_lifetime_value" | "market_trend" | "risk_assessment";
    status?: "pending" | "processing" | "completed" | "failed" | "cancelled";
    organizationId?: string;
    name?: string;
    metrics?: {
        modelVersion?: string;
        accuracy?: number;
        dataPoints?: number;
        precision?: number;
        recall?: number;
        f1Score?: number;
        mae?: number;
        mse?: number;
        rmse?: number;
        r2Score?: number;
        lastTrainingDate?: Date;
        trainingDuration?: number;
    };
    id?: string;
    createdAt?: Date;
    updatedAt?: Date;
    description?: string;
    isActive?: boolean;
    settings?: {
        features?: string[];
        tags?: string[];
        notes?: string;
        customFields?: Record<string, any>;
        modelType?: "linear_regression" | "decision_tree" | "random_forest" | "neural_network" | "time_series" | "clustering" | "classification" | "deep_learning";
        trainingPeriod?: number;
        predictionHorizon?: number;
        confidenceThreshold?: number;
        autoRetrain?: boolean;
        retrainFrequency?: number;
        dataSource?: string[];
        targetVariable?: string;
        validationMethod?: "cross_validation" | "holdout" | "time_series_split";
        hyperparameters?: Record<string, any>;
    };
    modelId?: string;
    predictions?: {
        timestamp?: Date;
        metadata?: Record<string, any>;
        id?: string;
        probability?: number;
        confidence?: number;
        inputData?: Record<string, any>;
        predictedValue?: string | number | boolean;
    }[];
    lastPredictionDate?: Date;
    nextRetrainDate?: Date;
}, {
    type?: "sales_forecast" | "demand_prediction" | "churn_prediction" | "revenue_forecast" | "inventory_optimization" | "customer_lifetime_value" | "market_trend" | "risk_assessment";
    status?: "pending" | "processing" | "completed" | "failed" | "cancelled";
    organizationId?: string;
    name?: string;
    metrics?: {
        modelVersion?: string;
        accuracy?: number;
        dataPoints?: number;
        precision?: number;
        recall?: number;
        f1Score?: number;
        mae?: number;
        mse?: number;
        rmse?: number;
        r2Score?: number;
        lastTrainingDate?: Date;
        trainingDuration?: number;
    };
    id?: string;
    createdAt?: Date;
    updatedAt?: Date;
    description?: string;
    isActive?: boolean;
    settings?: {
        features?: string[];
        tags?: string[];
        notes?: string;
        customFields?: Record<string, any>;
        modelType?: "linear_regression" | "decision_tree" | "random_forest" | "neural_network" | "time_series" | "clustering" | "classification" | "deep_learning";
        trainingPeriod?: number;
        predictionHorizon?: number;
        confidenceThreshold?: number;
        autoRetrain?: boolean;
        retrainFrequency?: number;
        dataSource?: string[];
        targetVariable?: string;
        validationMethod?: "cross_validation" | "holdout" | "time_series_split";
        hyperparameters?: Record<string, any>;
    };
    modelId?: string;
    predictions?: {
        timestamp?: Date;
        metadata?: Record<string, any>;
        id?: string;
        probability?: number;
        confidence?: number;
        inputData?: Record<string, any>;
        predictedValue?: string | number | boolean;
    }[];
    lastPredictionDate?: Date;
    nextRetrainDate?: Date;
}>;
export declare const PredictiveAnalyticsListResponseSchema: z.ZodObject<{
    pagination: z.ZodObject<{
        page: z.ZodNumber;
        limit: z.ZodNumber;
        total: z.ZodNumber;
        totalPages: z.ZodNumber;
        hasNext: z.ZodBoolean;
        hasPrev: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        page?: number;
        limit?: number;
        total?: number;
        totalPages?: number;
        hasNext?: boolean;
        hasPrev?: boolean;
    }, {
        page?: number;
        limit?: number;
        total?: number;
        totalPages?: number;
        hasNext?: boolean;
        hasPrev?: boolean;
    }>;
} & {
    data: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        organizationId: z.ZodString;
        name: z.ZodString;
        type: z.ZodEnum<["sales_forecast", "demand_prediction", "churn_prediction", "revenue_forecast", "inventory_optimization", "customer_lifetime_value", "market_trend", "risk_assessment"]>;
        status: z.ZodEnum<["pending", "processing", "completed", "failed", "cancelled"]>;
        modelId: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        settings: z.ZodObject<{
            modelType: z.ZodEnum<["linear_regression", "decision_tree", "random_forest", "neural_network", "time_series", "clustering", "classification", "deep_learning"]>;
            trainingPeriod: z.ZodNumber;
            predictionHorizon: z.ZodNumber;
            confidenceThreshold: z.ZodNumber;
            autoRetrain: z.ZodBoolean;
            retrainFrequency: z.ZodNumber;
            dataSource: z.ZodArray<z.ZodString, "many">;
            features: z.ZodArray<z.ZodString, "many">;
            targetVariable: z.ZodString;
            validationMethod: z.ZodEnum<["cross_validation", "holdout", "time_series_split"]>;
            hyperparameters: z.ZodRecord<z.ZodString, z.ZodAny>;
            customFields: z.ZodRecord<z.ZodString, z.ZodAny>;
            tags: z.ZodArray<z.ZodString, "many">;
            notes: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            features?: string[];
            tags?: string[];
            notes?: string;
            customFields?: Record<string, any>;
            modelType?: "linear_regression" | "decision_tree" | "random_forest" | "neural_network" | "time_series" | "clustering" | "classification" | "deep_learning";
            trainingPeriod?: number;
            predictionHorizon?: number;
            confidenceThreshold?: number;
            autoRetrain?: boolean;
            retrainFrequency?: number;
            dataSource?: string[];
            targetVariable?: string;
            validationMethod?: "cross_validation" | "holdout" | "time_series_split";
            hyperparameters?: Record<string, any>;
        }, {
            features?: string[];
            tags?: string[];
            notes?: string;
            customFields?: Record<string, any>;
            modelType?: "linear_regression" | "decision_tree" | "random_forest" | "neural_network" | "time_series" | "clustering" | "classification" | "deep_learning";
            trainingPeriod?: number;
            predictionHorizon?: number;
            confidenceThreshold?: number;
            autoRetrain?: boolean;
            retrainFrequency?: number;
            dataSource?: string[];
            targetVariable?: string;
            validationMethod?: "cross_validation" | "holdout" | "time_series_split";
            hyperparameters?: Record<string, any>;
        }>;
        metrics: z.ZodOptional<z.ZodObject<{
            accuracy: z.ZodNumber;
            precision: z.ZodNumber;
            recall: z.ZodNumber;
            f1Score: z.ZodNumber;
            mae: z.ZodNumber;
            mse: z.ZodNumber;
            rmse: z.ZodNumber;
            r2Score: z.ZodNumber;
            lastTrainingDate: z.ZodDate;
            trainingDuration: z.ZodNumber;
            dataPoints: z.ZodNumber;
            modelVersion: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            modelVersion?: string;
            accuracy?: number;
            dataPoints?: number;
            precision?: number;
            recall?: number;
            f1Score?: number;
            mae?: number;
            mse?: number;
            rmse?: number;
            r2Score?: number;
            lastTrainingDate?: Date;
            trainingDuration?: number;
        }, {
            modelVersion?: string;
            accuracy?: number;
            dataPoints?: number;
            precision?: number;
            recall?: number;
            f1Score?: number;
            mae?: number;
            mse?: number;
            rmse?: number;
            r2Score?: number;
            lastTrainingDate?: Date;
            trainingDuration?: number;
        }>>;
        predictions: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            timestamp: z.ZodDate;
            inputData: z.ZodRecord<z.ZodString, z.ZodAny>;
            predictedValue: z.ZodUnion<[z.ZodNumber, z.ZodString, z.ZodBoolean]>;
            confidence: z.ZodNumber;
            probability: z.ZodOptional<z.ZodNumber>;
            metadata: z.ZodRecord<z.ZodString, z.ZodAny>;
        }, "strip", z.ZodTypeAny, {
            timestamp?: Date;
            metadata?: Record<string, any>;
            id?: string;
            probability?: number;
            confidence?: number;
            inputData?: Record<string, any>;
            predictedValue?: string | number | boolean;
        }, {
            timestamp?: Date;
            metadata?: Record<string, any>;
            id?: string;
            probability?: number;
            confidence?: number;
            inputData?: Record<string, any>;
            predictedValue?: string | number | boolean;
        }>, "many">;
        lastPredictionDate: z.ZodOptional<z.ZodDate>;
        nextRetrainDate: z.ZodOptional<z.ZodDate>;
        isActive: z.ZodBoolean;
        createdAt: z.ZodDate;
        updatedAt: z.ZodDate;
    }, "strip", z.ZodTypeAny, {
        type?: "sales_forecast" | "demand_prediction" | "churn_prediction" | "revenue_forecast" | "inventory_optimization" | "customer_lifetime_value" | "market_trend" | "risk_assessment";
        status?: "pending" | "processing" | "completed" | "failed" | "cancelled";
        organizationId?: string;
        name?: string;
        metrics?: {
            modelVersion?: string;
            accuracy?: number;
            dataPoints?: number;
            precision?: number;
            recall?: number;
            f1Score?: number;
            mae?: number;
            mse?: number;
            rmse?: number;
            r2Score?: number;
            lastTrainingDate?: Date;
            trainingDuration?: number;
        };
        id?: string;
        createdAt?: Date;
        updatedAt?: Date;
        description?: string;
        isActive?: boolean;
        settings?: {
            features?: string[];
            tags?: string[];
            notes?: string;
            customFields?: Record<string, any>;
            modelType?: "linear_regression" | "decision_tree" | "random_forest" | "neural_network" | "time_series" | "clustering" | "classification" | "deep_learning";
            trainingPeriod?: number;
            predictionHorizon?: number;
            confidenceThreshold?: number;
            autoRetrain?: boolean;
            retrainFrequency?: number;
            dataSource?: string[];
            targetVariable?: string;
            validationMethod?: "cross_validation" | "holdout" | "time_series_split";
            hyperparameters?: Record<string, any>;
        };
        modelId?: string;
        predictions?: {
            timestamp?: Date;
            metadata?: Record<string, any>;
            id?: string;
            probability?: number;
            confidence?: number;
            inputData?: Record<string, any>;
            predictedValue?: string | number | boolean;
        }[];
        lastPredictionDate?: Date;
        nextRetrainDate?: Date;
    }, {
        type?: "sales_forecast" | "demand_prediction" | "churn_prediction" | "revenue_forecast" | "inventory_optimization" | "customer_lifetime_value" | "market_trend" | "risk_assessment";
        status?: "pending" | "processing" | "completed" | "failed" | "cancelled";
        organizationId?: string;
        name?: string;
        metrics?: {
            modelVersion?: string;
            accuracy?: number;
            dataPoints?: number;
            precision?: number;
            recall?: number;
            f1Score?: number;
            mae?: number;
            mse?: number;
            rmse?: number;
            r2Score?: number;
            lastTrainingDate?: Date;
            trainingDuration?: number;
        };
        id?: string;
        createdAt?: Date;
        updatedAt?: Date;
        description?: string;
        isActive?: boolean;
        settings?: {
            features?: string[];
            tags?: string[];
            notes?: string;
            customFields?: Record<string, any>;
            modelType?: "linear_regression" | "decision_tree" | "random_forest" | "neural_network" | "time_series" | "clustering" | "classification" | "deep_learning";
            trainingPeriod?: number;
            predictionHorizon?: number;
            confidenceThreshold?: number;
            autoRetrain?: boolean;
            retrainFrequency?: number;
            dataSource?: string[];
            targetVariable?: string;
            validationMethod?: "cross_validation" | "holdout" | "time_series_split";
            hyperparameters?: Record<string, any>;
        };
        modelId?: string;
        predictions?: {
            timestamp?: Date;
            metadata?: Record<string, any>;
            id?: string;
            probability?: number;
            confidence?: number;
            inputData?: Record<string, any>;
            predictedValue?: string | number | boolean;
        }[];
        lastPredictionDate?: Date;
        nextRetrainDate?: Date;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    data?: {
        type?: "sales_forecast" | "demand_prediction" | "churn_prediction" | "revenue_forecast" | "inventory_optimization" | "customer_lifetime_value" | "market_trend" | "risk_assessment";
        status?: "pending" | "processing" | "completed" | "failed" | "cancelled";
        organizationId?: string;
        name?: string;
        metrics?: {
            modelVersion?: string;
            accuracy?: number;
            dataPoints?: number;
            precision?: number;
            recall?: number;
            f1Score?: number;
            mae?: number;
            mse?: number;
            rmse?: number;
            r2Score?: number;
            lastTrainingDate?: Date;
            trainingDuration?: number;
        };
        id?: string;
        createdAt?: Date;
        updatedAt?: Date;
        description?: string;
        isActive?: boolean;
        settings?: {
            features?: string[];
            tags?: string[];
            notes?: string;
            customFields?: Record<string, any>;
            modelType?: "linear_regression" | "decision_tree" | "random_forest" | "neural_network" | "time_series" | "clustering" | "classification" | "deep_learning";
            trainingPeriod?: number;
            predictionHorizon?: number;
            confidenceThreshold?: number;
            autoRetrain?: boolean;
            retrainFrequency?: number;
            dataSource?: string[];
            targetVariable?: string;
            validationMethod?: "cross_validation" | "holdout" | "time_series_split";
            hyperparameters?: Record<string, any>;
        };
        modelId?: string;
        predictions?: {
            timestamp?: Date;
            metadata?: Record<string, any>;
            id?: string;
            probability?: number;
            confidence?: number;
            inputData?: Record<string, any>;
            predictedValue?: string | number | boolean;
        }[];
        lastPredictionDate?: Date;
        nextRetrainDate?: Date;
    }[];
    pagination?: {
        page?: number;
        limit?: number;
        total?: number;
        totalPages?: number;
        hasNext?: boolean;
        hasPrev?: boolean;
    };
}, {
    data?: {
        type?: "sales_forecast" | "demand_prediction" | "churn_prediction" | "revenue_forecast" | "inventory_optimization" | "customer_lifetime_value" | "market_trend" | "risk_assessment";
        status?: "pending" | "processing" | "completed" | "failed" | "cancelled";
        organizationId?: string;
        name?: string;
        metrics?: {
            modelVersion?: string;
            accuracy?: number;
            dataPoints?: number;
            precision?: number;
            recall?: number;
            f1Score?: number;
            mae?: number;
            mse?: number;
            rmse?: number;
            r2Score?: number;
            lastTrainingDate?: Date;
            trainingDuration?: number;
        };
        id?: string;
        createdAt?: Date;
        updatedAt?: Date;
        description?: string;
        isActive?: boolean;
        settings?: {
            features?: string[];
            tags?: string[];
            notes?: string;
            customFields?: Record<string, any>;
            modelType?: "linear_regression" | "decision_tree" | "random_forest" | "neural_network" | "time_series" | "clustering" | "classification" | "deep_learning";
            trainingPeriod?: number;
            predictionHorizon?: number;
            confidenceThreshold?: number;
            autoRetrain?: boolean;
            retrainFrequency?: number;
            dataSource?: string[];
            targetVariable?: string;
            validationMethod?: "cross_validation" | "holdout" | "time_series_split";
            hyperparameters?: Record<string, any>;
        };
        modelId?: string;
        predictions?: {
            timestamp?: Date;
            metadata?: Record<string, any>;
            id?: string;
            probability?: number;
            confidence?: number;
            inputData?: Record<string, any>;
            predictedValue?: string | number | boolean;
        }[];
        lastPredictionDate?: Date;
        nextRetrainDate?: Date;
    }[];
    pagination?: {
        page?: number;
        limit?: number;
        total?: number;
        totalPages?: number;
        hasNext?: boolean;
        hasPrev?: boolean;
    };
}>;
export declare const PredictiveAnalyticsStatsResponseSchema: z.ZodObject<{
    total: z.ZodNumber;
    active: z.ZodNumber;
    inactive: z.ZodNumber;
    createdThisMonth: z.ZodNumber;
    createdThisYear: z.ZodNumber;
    updatedThisMonth: z.ZodNumber;
    updatedThisYear: z.ZodNumber;
} & {
    byType: z.ZodRecord<z.ZodString, z.ZodNumber>;
    byStatus: z.ZodRecord<z.ZodString, z.ZodNumber>;
    byModelType: z.ZodRecord<z.ZodString, z.ZodNumber>;
    byAccuracy: z.ZodRecord<z.ZodString, z.ZodNumber>;
    totalPredictions: z.ZodNumber;
    averageAccuracy: z.ZodNumber;
    averageConfidence: z.ZodNumber;
    activeModels: z.ZodNumber;
    pendingTraining: z.ZodNumber;
    failedTraining: z.ZodNumber;
    needsRetraining: z.ZodNumber;
    lastTrainingDate: z.ZodOptional<z.ZodDate>;
    totalTrainingTime: z.ZodNumber;
    averagePredictionTime: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    active?: number;
    inactive?: number;
    total?: number;
    needsRetraining?: number;
    byStatus?: Record<string, number>;
    averageAccuracy?: number;
    createdThisMonth?: number;
    createdThisYear?: number;
    updatedThisMonth?: number;
    updatedThisYear?: number;
    byType?: Record<string, number>;
    lastTrainingDate?: Date;
    byModelType?: Record<string, number>;
    byAccuracy?: Record<string, number>;
    totalPredictions?: number;
    averageConfidence?: number;
    activeModels?: number;
    pendingTraining?: number;
    failedTraining?: number;
    totalTrainingTime?: number;
    averagePredictionTime?: number;
}, {
    active?: number;
    inactive?: number;
    total?: number;
    needsRetraining?: number;
    byStatus?: Record<string, number>;
    averageAccuracy?: number;
    createdThisMonth?: number;
    createdThisYear?: number;
    updatedThisMonth?: number;
    updatedThisYear?: number;
    byType?: Record<string, number>;
    lastTrainingDate?: Date;
    byModelType?: Record<string, number>;
    byAccuracy?: Record<string, number>;
    totalPredictions?: number;
    averageConfidence?: number;
    activeModels?: number;
    pendingTraining?: number;
    failedTraining?: number;
    totalTrainingTime?: number;
    averagePredictionTime?: number;
}>;
export declare const BatchPredictionRequestSchema: z.ZodObject<{
    id: z.ZodString;
    inputDataArray: z.ZodArray<z.ZodRecord<z.ZodString, z.ZodAny>, "many">;
    confidence: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    id?: string;
    confidence?: number;
    inputDataArray?: Record<string, any>[];
}, {
    id?: string;
    confidence?: number;
    inputDataArray?: Record<string, any>[];
}>;
export declare const BatchTrainingRequestSchema: z.ZodObject<{
    ids: z.ZodArray<z.ZodString, "many">;
    trainingData: z.ZodOptional<z.ZodArray<z.ZodRecord<z.ZodString, z.ZodAny>, "many">>;
    forceRetrain: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    trainingData?: Record<string, any>[];
    ids?: string[];
    forceRetrain?: boolean;
}, {
    trainingData?: Record<string, any>[];
    ids?: string[];
    forceRetrain?: boolean;
}>;
export declare const AnalyticsReportRequestSchema: z.ZodObject<{
    organizationId: z.ZodString;
    filters: z.ZodOptional<z.ZodObject<{
        type: z.ZodOptional<z.ZodEnum<["sales_forecast", "demand_prediction", "churn_prediction", "revenue_forecast", "inventory_optimization", "customer_lifetime_value", "market_trend", "risk_assessment"]>>;
        status: z.ZodOptional<z.ZodEnum<["pending", "processing", "completed", "failed", "cancelled"]>>;
        modelType: z.ZodOptional<z.ZodEnum<["linear_regression", "decision_tree", "random_forest", "neural_network", "time_series", "clustering", "classification", "deep_learning"]>>;
        accuracy: z.ZodOptional<z.ZodEnum<["low", "medium", "high", "very_high"]>>;
        isActive: z.ZodOptional<z.ZodBoolean>;
        needsRetraining: z.ZodOptional<z.ZodBoolean>;
        hasPredictions: z.ZodOptional<z.ZodBoolean>;
        dateRange: z.ZodOptional<z.ZodEffects<z.ZodObject<{
            startDate: z.ZodOptional<z.ZodDate>;
            endDate: z.ZodOptional<z.ZodDate>;
        }, "strip", z.ZodTypeAny, {
            startDate?: Date;
            endDate?: Date;
        }, {
            startDate?: Date;
            endDate?: Date;
        }>, {
            startDate?: Date;
            endDate?: Date;
        }, {
            startDate?: Date;
            endDate?: Date;
        }>>;
    }, "strip", z.ZodTypeAny, {
        type?: "sales_forecast" | "demand_prediction" | "churn_prediction" | "revenue_forecast" | "inventory_optimization" | "customer_lifetime_value" | "market_trend" | "risk_assessment";
        status?: "pending" | "processing" | "completed" | "failed" | "cancelled";
        isActive?: boolean;
        modelType?: "linear_regression" | "decision_tree" | "random_forest" | "neural_network" | "time_series" | "clustering" | "classification" | "deep_learning";
        accuracy?: "low" | "medium" | "high" | "very_high";
        needsRetraining?: boolean;
        hasPredictions?: boolean;
        dateRange?: {
            startDate?: Date;
            endDate?: Date;
        };
    }, {
        type?: "sales_forecast" | "demand_prediction" | "churn_prediction" | "revenue_forecast" | "inventory_optimization" | "customer_lifetime_value" | "market_trend" | "risk_assessment";
        status?: "pending" | "processing" | "completed" | "failed" | "cancelled";
        isActive?: boolean;
        modelType?: "linear_regression" | "decision_tree" | "random_forest" | "neural_network" | "time_series" | "clustering" | "classification" | "deep_learning";
        accuracy?: "low" | "medium" | "high" | "very_high";
        needsRetraining?: boolean;
        hasPredictions?: boolean;
        dateRange?: {
            startDate?: Date;
            endDate?: Date;
        };
    }>>;
}, "strip", z.ZodTypeAny, {
    organizationId?: string;
    filters?: {
        type?: "sales_forecast" | "demand_prediction" | "churn_prediction" | "revenue_forecast" | "inventory_optimization" | "customer_lifetime_value" | "market_trend" | "risk_assessment";
        status?: "pending" | "processing" | "completed" | "failed" | "cancelled";
        isActive?: boolean;
        modelType?: "linear_regression" | "decision_tree" | "random_forest" | "neural_network" | "time_series" | "clustering" | "classification" | "deep_learning";
        accuracy?: "low" | "medium" | "high" | "very_high";
        needsRetraining?: boolean;
        hasPredictions?: boolean;
        dateRange?: {
            startDate?: Date;
            endDate?: Date;
        };
    };
}, {
    organizationId?: string;
    filters?: {
        type?: "sales_forecast" | "demand_prediction" | "churn_prediction" | "revenue_forecast" | "inventory_optimization" | "customer_lifetime_value" | "market_trend" | "risk_assessment";
        status?: "pending" | "processing" | "completed" | "failed" | "cancelled";
        isActive?: boolean;
        modelType?: "linear_regression" | "decision_tree" | "random_forest" | "neural_network" | "time_series" | "clustering" | "classification" | "deep_learning";
        accuracy?: "low" | "medium" | "high" | "very_high";
        needsRetraining?: boolean;
        hasPredictions?: boolean;
        dateRange?: {
            startDate?: Date;
            endDate?: Date;
        };
    };
}>;
export declare const PredictionReportRequestSchema: z.ZodObject<{
    organizationId: z.ZodString;
    startDate: z.ZodDate;
    endDate: z.ZodDate;
    filters: z.ZodOptional<z.ZodObject<{
        type: z.ZodOptional<z.ZodEnum<["sales_forecast", "demand_prediction", "churn_prediction", "revenue_forecast", "inventory_optimization", "customer_lifetime_value", "market_trend", "risk_assessment"]>>;
        modelType: z.ZodOptional<z.ZodEnum<["linear_regression", "decision_tree", "random_forest", "neural_network", "time_series", "clustering", "classification", "deep_learning"]>>;
        minConfidence: z.ZodOptional<z.ZodNumber>;
        maxConfidence: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        type?: "sales_forecast" | "demand_prediction" | "churn_prediction" | "revenue_forecast" | "inventory_optimization" | "customer_lifetime_value" | "market_trend" | "risk_assessment";
        modelType?: "linear_regression" | "decision_tree" | "random_forest" | "neural_network" | "time_series" | "clustering" | "classification" | "deep_learning";
        minConfidence?: number;
        maxConfidence?: number;
    }, {
        type?: "sales_forecast" | "demand_prediction" | "churn_prediction" | "revenue_forecast" | "inventory_optimization" | "customer_lifetime_value" | "market_trend" | "risk_assessment";
        modelType?: "linear_regression" | "decision_tree" | "random_forest" | "neural_network" | "time_series" | "clustering" | "classification" | "deep_learning";
        minConfidence?: number;
        maxConfidence?: number;
    }>>;
}, "strip", z.ZodTypeAny, {
    organizationId?: string;
    filters?: {
        type?: "sales_forecast" | "demand_prediction" | "churn_prediction" | "revenue_forecast" | "inventory_optimization" | "customer_lifetime_value" | "market_trend" | "risk_assessment";
        modelType?: "linear_regression" | "decision_tree" | "random_forest" | "neural_network" | "time_series" | "clustering" | "classification" | "deep_learning";
        minConfidence?: number;
        maxConfidence?: number;
    };
    startDate?: Date;
    endDate?: Date;
}, {
    organizationId?: string;
    filters?: {
        type?: "sales_forecast" | "demand_prediction" | "churn_prediction" | "revenue_forecast" | "inventory_optimization" | "customer_lifetime_value" | "market_trend" | "risk_assessment";
        modelType?: "linear_regression" | "decision_tree" | "random_forest" | "neural_network" | "time_series" | "clustering" | "classification" | "deep_learning";
        minConfidence?: number;
        maxConfidence?: number;
    };
    startDate?: Date;
    endDate?: Date;
}>;
export declare const ModelPerformanceReportRequestSchema: z.ZodObject<{
    organizationId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    organizationId?: string;
}, {
    organizationId?: string;
}>;
export declare const TrainingReportRequestSchema: z.ZodObject<{
    organizationId: z.ZodString;
    startDate: z.ZodDate;
    endDate: z.ZodDate;
    filters: z.ZodOptional<z.ZodObject<{
        type: z.ZodOptional<z.ZodEnum<["sales_forecast", "demand_prediction", "churn_prediction", "revenue_forecast", "inventory_optimization", "customer_lifetime_value", "market_trend", "risk_assessment"]>>;
        modelType: z.ZodOptional<z.ZodEnum<["linear_regression", "decision_tree", "random_forest", "neural_network", "time_series", "clustering", "classification", "deep_learning"]>>;
        status: z.ZodOptional<z.ZodEnum<["pending", "processing", "completed", "failed", "cancelled"]>>;
    }, "strip", z.ZodTypeAny, {
        type?: "sales_forecast" | "demand_prediction" | "churn_prediction" | "revenue_forecast" | "inventory_optimization" | "customer_lifetime_value" | "market_trend" | "risk_assessment";
        status?: "pending" | "processing" | "completed" | "failed" | "cancelled";
        modelType?: "linear_regression" | "decision_tree" | "random_forest" | "neural_network" | "time_series" | "clustering" | "classification" | "deep_learning";
    }, {
        type?: "sales_forecast" | "demand_prediction" | "churn_prediction" | "revenue_forecast" | "inventory_optimization" | "customer_lifetime_value" | "market_trend" | "risk_assessment";
        status?: "pending" | "processing" | "completed" | "failed" | "cancelled";
        modelType?: "linear_regression" | "decision_tree" | "random_forest" | "neural_network" | "time_series" | "clustering" | "classification" | "deep_learning";
    }>>;
}, "strip", z.ZodTypeAny, {
    organizationId?: string;
    filters?: {
        type?: "sales_forecast" | "demand_prediction" | "churn_prediction" | "revenue_forecast" | "inventory_optimization" | "customer_lifetime_value" | "market_trend" | "risk_assessment";
        status?: "pending" | "processing" | "completed" | "failed" | "cancelled";
        modelType?: "linear_regression" | "decision_tree" | "random_forest" | "neural_network" | "time_series" | "clustering" | "classification" | "deep_learning";
    };
    startDate?: Date;
    endDate?: Date;
}, {
    organizationId?: string;
    filters?: {
        type?: "sales_forecast" | "demand_prediction" | "churn_prediction" | "revenue_forecast" | "inventory_optimization" | "customer_lifetime_value" | "market_trend" | "risk_assessment";
        status?: "pending" | "processing" | "completed" | "failed" | "cancelled";
        modelType?: "linear_regression" | "decision_tree" | "random_forest" | "neural_network" | "time_series" | "clustering" | "classification" | "deep_learning";
    };
    startDate?: Date;
    endDate?: Date;
}>;
export type CreatePredictiveAnalyticsRequest = z.infer<typeof CreatePredictiveAnalyticsRequestSchema>;
export type UpdatePredictiveAnalyticsRequest = z.infer<typeof UpdatePredictiveAnalyticsRequestSchema>;
export type GeneratePredictionRequest = z.infer<typeof GeneratePredictionRequestSchema>;
export type TrainModelRequest = z.infer<typeof TrainModelRequestSchema>;
export type PredictiveAnalyticsIdParam = z.infer<typeof PredictiveAnalyticsIdParamSchema>;
export type PredictiveAnalyticsOrganizationIdParam = z.infer<typeof PredictiveAnalyticsOrganizationIdParamSchema>;
export type PredictiveAnalyticsSearchQuery = z.infer<typeof PredictiveAnalyticsSearchQuerySchema>;
export type PredictiveAnalyticsBulkUpdate = z.infer<typeof PredictiveAnalyticsBulkUpdateSchema>;
export type PredictiveAnalyticsBulkDelete = z.infer<typeof PredictiveAnalyticsBulkDeleteSchema>;
export type PredictiveAnalyticsResponse = z.infer<typeof PredictiveAnalyticsResponseSchema>;
export type PredictiveAnalyticsListResponse = z.infer<typeof PredictiveAnalyticsListResponseSchema>;
export type PredictiveAnalyticsStatsResponse = z.infer<typeof PredictiveAnalyticsStatsResponseSchema>;
export type PredictionDataResponse = z.infer<typeof PredictionDataResponseSchema>;
export type AnalyticsMetricsResponse = z.infer<typeof AnalyticsMetricsResponseSchema>;
export type BatchPredictionRequest = z.infer<typeof BatchPredictionRequestSchema>;
export type BatchTrainingRequest = z.infer<typeof BatchTrainingRequestSchema>;
export type AnalyticsReportRequest = z.infer<typeof AnalyticsReportRequestSchema>;
export type PredictionReportRequest = z.infer<typeof PredictionReportRequestSchema>;
export type ModelPerformanceReportRequest = z.infer<typeof ModelPerformanceReportRequestSchema>;
export type TrainingReportRequest = z.infer<typeof TrainingReportRequestSchema>;
//# sourceMappingURL=predictive-analytics.dto.d.ts.map