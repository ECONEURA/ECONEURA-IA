export interface AIModel {
    id: string;
    name: string;
    description: string;
    type: 'classification' | 'regression' | 'clustering' | 'nlp' | 'computer_vision' | 'generative';
    algorithm: string;
    version: string;
    status: 'development' | 'testing' | 'staging' | 'production' | 'archived';
    performance: ModelPerformance;
    metadata: ModelMetadata;
    createdAt: Date;
    updatedAt: Date;
    deployedAt?: Date;
    archivedAt?: Date;
}
export interface ModelPerformance {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    latency: number;
    throughput: number;
    memoryUsage: number;
    cpuUsage: number;
    lastEvaluated: Date;
    evaluationCount: number;
    driftScore?: number;
    dataQuality?: number;
}
export interface ModelMetadata {
    trainingData: {
        size: number;
        features: string[];
        targetColumn?: string;
        dataQuality: number;
        lastUpdated: Date;
    };
    hyperparameters: Record<string, any>;
    architecture?: {
        layers?: number;
        neurons?: number[];
        activation?: string;
        optimizer?: string;
        lossFunction?: string;
    };
    deployment: {
        environment: string;
        replicas: number;
        resources: {
            cpu: string;
            memory: string;
            gpu?: string;
        };
        scaling: {
            minReplicas: number;
            maxReplicas: number;
            targetUtilization: number;
        };
    };
    monitoring: {
        enabled: boolean;
        alerts: AlertConfig[];
        metrics: string[];
        thresholds: Record<string, number>;
    };
}
export interface AlertConfig {
    id: string;
    name: string;
    metric: string;
    condition: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
    threshold: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    enabled: boolean;
    channels: string[];
    cooldown: number;
}
export interface ModelDeployment {
    id: string;
    modelId: string;
    environment: 'development' | 'staging' | 'production';
    status: 'pending' | 'deploying' | 'active' | 'failed' | 'scaling' | 'rolling_back';
    replicas: number;
    targetReplicas: number;
    resources: {
        cpu: string;
        memory: string;
        gpu?: string;
    };
    endpoints: ModelEndpoint[];
    health: DeploymentHealth;
    createdAt: Date;
    updatedAt: Date;
    deployedAt?: Date;
}
export interface ModelEndpoint {
    id: string;
    name: string;
    url: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    authentication: 'none' | 'api_key' | 'jwt' | 'oauth';
    rateLimit: {
        requests: number;
        window: number;
    };
    version: string;
    status: 'active' | 'inactive' | 'maintenance';
    lastHealthCheck: Date;
}
export interface DeploymentHealth {
    status: 'healthy' | 'degraded' | 'unhealthy';
    uptime: number;
    responseTime: number;
    errorRate: number;
    lastCheck: Date;
    checks: HealthCheck[];
}
export interface HealthCheck {
    name: string;
    status: 'pass' | 'fail' | 'warn';
    message: string;
    timestamp: Date;
    duration: number;
}
export interface ModelABTest {
    id: string;
    name: string;
    description: string;
    modelA: string;
    modelB: string;
    trafficSplit: number;
    status: 'draft' | 'running' | 'completed' | 'cancelled';
    metrics: ABTestMetrics;
    startDate?: Date;
    endDate?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface ABTestMetrics {
    modelA: {
        requests: number;
        successRate: number;
        avgResponseTime: number;
        accuracy: number;
        businessMetrics: Record<string, number>;
    };
    modelB: {
        requests: number;
        successRate: number;
        avgResponseTime: number;
        accuracy: number;
        businessMetrics: Record<string, number>;
    };
    statisticalSignificance: number;
    confidence: number;
    winner?: 'A' | 'B' | 'inconclusive';
}
export interface ModelRollback {
    id: string;
    modelId: string;
    fromVersion: string;
    toVersion: string;
    reason: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    initiatedBy: string;
    createdAt: Date;
    completedAt?: Date;
    rollbackData: {
        deploymentId: string;
        endpointUrls: string[];
        trafficRedirected: boolean;
        dataBackup: boolean;
    };
}
export declare class AIModelManagementService {
    private db;
    private models;
    private deployments;
    private abTests;
    private isInitialized;
    constructor();
    private initializeService;
    private createTables;
    private loadActiveModels;
    private loadActiveDeployments;
    createModel(model: Omit<AIModel, 'id' | 'createdAt' | 'updatedAt'>): Promise<AIModel>;
    getModel(modelId: string): Promise<AIModel | null>;
    listModels(limit?: number, offset?: number, status?: string): Promise<AIModel[]>;
    updateModelStatus(modelId: string, status: AIModel['status']): Promise<void>;
    updateModelPerformance(modelId: string, performance: Partial<ModelPerformance>): Promise<void>;
    deployModel(modelId: string, environment: ModelDeployment['environment'], config: Partial<ModelDeployment>): Promise<ModelDeployment>;
    private simulateDeployment;
    getDeployment(deploymentId: string): Promise<ModelDeployment | null>;
    listDeployments(limit?: number, offset?: number): Promise<ModelDeployment[]>;
    createABTest(test: Omit<ModelABTest, 'id' | 'createdAt' | 'updatedAt' | 'metrics'>): Promise<ModelABTest>;
    startABTest(testId: string): Promise<void>;
    rollbackModel(modelId: string, fromVersion: string, toVersion: string, reason: string, initiatedBy: string): Promise<ModelRollback>;
    private simulateRollback;
    private mapRowToModel;
    private mapRowToDeployment;
    getHealthStatus(): Promise<{
        status: 'healthy' | 'degraded' | 'unhealthy';
        models: number;
        deployments: number;
        abTests: number;
        lastCheck: Date;
    }>;
}
export declare const aiModelManagementService: AIModelManagementService;
//# sourceMappingURL=ai-model-management.service.d.ts.map