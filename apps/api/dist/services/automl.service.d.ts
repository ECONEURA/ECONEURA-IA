export interface MLModel {
    id: string;
    name: string;
    algorithm: 'linear' | 'random_forest' | 'neural_network' | 'xgboost';
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    trained: boolean;
    lastTrained: Date;
    hyperparameters: Record<string, any>;
}
export interface TrainingData {
    features: number[][];
    labels: number[];
    featureNames: string[];
}
export interface PredictionResult {
    prediction: number;
    confidence: number;
    model: string;
    timestamp: Date;
}
export declare class AutoMLService {
    private models;
    private trainingData;
    constructor();
    private initializeDefaultModels;
    trainModel(modelId: string, data: TrainingData, algorithm?: 'linear' | 'random_forest' | 'neural_network' | 'xgboost'): Promise<MLModel>;
    predict(modelId: string, features: number[]): Promise<PredictionResult>;
    evaluateModel(modelId: string, testData: TrainingData): Promise<{
        accuracy: number;
        precision: number;
        recall: number;
        f1Score: number;
        confusionMatrix: number[][];
    }>;
    getModels(): Promise<MLModel[]>;
    getModel(modelId: string): Promise<MLModel | null>;
    deleteModel(modelId: string): Promise<void>;
    retrainModel(modelId: string, newData: TrainingData): Promise<MLModel>;
    private selectBestAlgorithm;
    private optimizeHyperparameters;
    private simulatePrediction;
    getModelPerformance(): Promise<{
        totalModels: number;
        averageAccuracy: number;
        bestModel: MLModel | null;
        worstModel: MLModel | null;
    }>;
    exportModel(modelId: string): Promise<{
        model: MLModel;
        trainingData: TrainingData | null;
    }>;
}
export declare const autoML: AutoMLService;
//# sourceMappingURL=automl.service.d.ts.map