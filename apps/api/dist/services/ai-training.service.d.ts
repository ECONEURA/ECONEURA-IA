export interface TrainingDataset {
    id: string;
    name: string;
    description: string;
    type: 'classification' | 'regression' | 'clustering' | 'nlp' | 'computer_vision';
    size: number;
    features: string[];
    targetColumn?: string;
    createdAt: Date;
    updatedAt: Date;
    status: 'uploading' | 'processing' | 'ready' | 'error';
    metadata: {
        source: string;
        format: 'csv' | 'json' | 'parquet' | 'images';
        encoding?: string;
        delimiter?: string;
        hasHeader?: boolean;
    };
}
export interface TrainingJob {
    id: string;
    name: string;
    description: string;
    datasetId: string;
    modelType: 'linear_regression' | 'random_forest' | 'neural_network' | 'xgboost' | 'transformer' | 'cnn' | 'lstm';
    hyperparameters: Record<string, any>;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
    progress: number;
    startedAt?: Date;
    completedAt?: Date;
    estimatedDuration?: number;
    actualDuration?: number;
    metrics?: TrainingMetrics;
    error?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface TrainingMetrics {
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1Score?: number;
    mae?: number;
    mse?: number;
    rmse?: number;
    r2Score?: number;
    loss?: number;
    validationLoss?: number;
    epochs?: number;
    learningRate?: number;
    batchSize?: number;
    confusionMatrix?: number[][];
    featureImportance?: Array<{
        feature: string;
        importance: number;
    }>;
}
export interface ModelVersion {
    id: string;
    modelId: string;
    version: string;
    trainingJobId: string;
    status: 'training' | 'ready' | 'deployed' | 'archived';
    metrics: TrainingMetrics;
    filePath: string;
    fileSize: number;
    createdAt: Date;
    deployedAt?: Date;
    performance: {
        accuracy: number;
        latency: number;
        throughput: number;
        memoryUsage: number;
    };
}
export interface TrainingConfiguration {
    algorithm: string;
    hyperparameters: Record<string, any>;
    validationStrategy: 'holdout' | 'kfold' | 'stratified_kfold';
    validationSplit: number;
    testSplit: number;
    crossValidationFolds?: number;
    earlyStopping?: {
        enabled: boolean;
        patience: number;
        minDelta: number;
    };
    dataAugmentation?: {
        enabled: boolean;
        techniques: string[];
    };
    preprocessing?: {
        normalization: boolean;
        scaling: 'standard' | 'minmax' | 'robust';
        encoding: 'onehot' | 'label' | 'target';
        featureSelection: boolean;
    };
}
export interface TrainingProgress {
    jobId: string;
    currentEpoch?: number;
    totalEpochs?: number;
    currentBatch?: number;
    totalBatches?: number;
    loss: number;
    validationLoss?: number;
    accuracy?: number;
    learningRate: number;
    estimatedTimeRemaining?: number;
    status: string;
    timestamp: Date;
}
export declare class AITrainingService {
    private db;
    private trainingJobs;
    private trainingProgress;
    private isInitialized;
    constructor();
    private initializeService;
    private createTables;
    private loadActiveJobs;
    createDataset(dataset: Omit<TrainingDataset, 'id' | 'createdAt' | 'updatedAt'>): Promise<TrainingDataset>;
    getDataset(datasetId: string): Promise<TrainingDataset | null>;
    listDatasets(limit?: number, offset?: number): Promise<TrainingDataset[]>;
    updateDatasetStatus(datasetId: string, status: TrainingDataset['status']): Promise<void>;
    createTrainingJob(job: Omit<TrainingJob, 'id' | 'createdAt' | 'updatedAt' | 'progress' | 'status'>): Promise<TrainingJob>;
    startTrainingJob(jobId: string): Promise<void>;
    private simulateTraining;
    private updateTrainingProgress;
    private completeTrainingJob;
    private failTrainingJob;
    private createModelVersion;
    getTrainingJob(jobId: string): Promise<TrainingJob | null>;
    listTrainingJobs(limit?: number, offset?: number): Promise<TrainingJob[]>;
    getTrainingProgress(jobId: string): Promise<TrainingProgress | null>;
    getModelVersions(modelId: string): Promise<ModelVersion[]>;
    private mapRowToDataset;
    private mapRowToTrainingJob;
    private mapRowToModelVersion;
    getHealthStatus(): Promise<{
        status: 'healthy' | 'degraded' | 'unhealthy';
        activeJobs: number;
        totalDatasets: number;
        totalModels: number;
        lastCheck: Date;
    }>;
}
export declare const aiTrainingService: AITrainingService;
//# sourceMappingURL=ai-training.service.d.ts.map