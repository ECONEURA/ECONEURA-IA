interface DeploymentEnvironment {
    id: string;
    name: 'blue' | 'green';
    status: 'active' | 'inactive' | 'deploying' | 'failed' | 'rolling_back';
    version: string;
    buildId: string;
    deployedAt: string;
    healthCheckUrl: string;
    metrics: {
        responseTime: number;
        errorRate: number;
        throughput: number;
        cpuUsage: number;
        memoryUsage: number;
        diskUsage: number;
    };
    configuration: {
        replicas: number;
        resources: {
            cpu: string;
            memory: string;
            storage: string;
        };
        environmentVariables: Record<string, string>;
        secrets: string[];
    };
}
interface DeploymentGate {
    id: string;
    name: string;
    description: string;
    type: 'health_check' | 'performance_test' | 'security_scan' | 'smoke_test' | 'integration_test' | 'load_test' | 'custom';
    status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
    priority: number;
    timeout: number;
    retryCount: number;
    maxRetries: number;
    configuration: {
        endpoint?: string;
        expectedResponse?: any;
        threshold?: number;
        script?: string;
        parameters?: Record<string, any>;
    };
    results: {
        startTime: string;
        endTime?: string;
        duration?: number;
        success: boolean;
        message?: string;
        metrics?: Record<string, any>;
        logs?: string[];
    };
    createdAt: string;
    updatedAt: string;
}
interface DeploymentPipeline {
    id: string;
    name: string;
    description: string;
    status: 'idle' | 'running' | 'completed' | 'failed' | 'cancelled';
    currentStage: string;
    stages: {
        name: string;
        status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
        startTime?: string;
        endTime?: string;
        duration?: number;
        gates: string[];
    }[];
    sourceEnvironment: 'blue' | 'green';
    targetEnvironment: 'blue' | 'green';
    version: string;
    buildId: string;
    triggeredBy: {
        userId: string;
        trigger: 'manual' | 'webhook' | 'schedule' | 'api';
        commitHash?: string;
        branch?: string;
    };
    configuration: {
        autoRollback: boolean;
        rollbackThreshold: number;
        canaryPercentage: number;
        maxDeploymentTime: number;
        notificationChannels: string[];
    };
    metrics: {
        totalDuration: number;
        gatesPassed: number;
        gatesFailed: number;
        gatesSkipped: number;
        rollbackTriggered: boolean;
        rollbackReason?: string;
    };
    createdAt: string;
    updatedAt: string;
    completedAt?: string;
}
interface DeploymentRollback {
    id: string;
    deploymentId: string;
    reason: 'manual' | 'automatic' | 'gate_failure' | 'performance_degradation' | 'error_rate_threshold';
    triggeredBy: string;
    fromEnvironment: 'blue' | 'green';
    toEnvironment: 'blue' | 'green';
    fromVersion: string;
    toVersion: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    startTime: string;
    endTime?: string;
    duration?: number;
    success: boolean;
    message?: string;
    logs: string[];
}
declare class BlueGreenDeploymentService {
    private environments;
    private gates;
    private pipelines;
    private validations;
    private metrics;
    private rollbacks;
    constructor();
    init(): void;
    private createDemoData;
    getEnvironments(): Promise<DeploymentEnvironment[]>;
    getEnvironment(environmentId: string): Promise<DeploymentEnvironment | undefined>;
    updateEnvironmentMetrics(environmentId: string, metrics: Partial<DeploymentEnvironment['metrics']>): Promise<DeploymentEnvironment | undefined>;
    getGates(filters?: {
        type?: string;
        status?: string;
        priority?: number;
        limit?: number;
    }): Promise<DeploymentGate[]>;
    createGate(gateData: Omit<DeploymentGate, 'id' | 'createdAt' | 'updatedAt' | 'results'>): Promise<DeploymentGate>;
    executeGate(gateId: string): Promise<DeploymentGate>;
    getPipelines(filters?: {
        status?: string;
        environment?: string;
        limit?: number;
    }): Promise<DeploymentPipeline[]>;
    createPipeline(pipelineData: Omit<DeploymentPipeline, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'currentStage' | 'stages' | 'metrics'>): Promise<DeploymentPipeline>;
    executePipeline(pipelineId: string): Promise<DeploymentPipeline>;
    triggerRollback(pipelineId: string, reason: DeploymentRollback['reason'], triggeredBy: string): Promise<DeploymentRollback>;
    getDeploymentStats(): Promise<{
        totalPipelines: number;
        totalGates: number;
        totalRollbacks: number;
        activeEnvironments: number;
        pipelineStats: {
            completed: number;
            failed: number;
            running: number;
            averageDuration: number;
        };
        gateStats: {
            passed: number;
            failed: number;
            running: number;
            averageExecutionTime: number;
        };
        last24Hours: {
            deployments: number;
            rollbacks: number;
            gateExecutions: number;
        };
        last7Days: {
            deployments: number;
            rollbacks: number;
            gateExecutions: number;
        };
        gateTypes: Record<string, number>;
        rollbackStats: {
            total: number;
            successful: number;
            failed: number;
            byReason: Record<string, number>;
        };
        environmentMetrics: {
            name: "green" | "blue";
            status: "failed" | "active" | "inactive" | "deploying" | "rolling_back";
            version: string;
            metrics: {
                responseTime: number;
                errorRate: number;
                throughput: number;
                cpuUsage: number;
                memoryUsage: number;
                diskUsage: number;
            };
        }[];
    }>;
    private getGateTypeStats;
    private getRollbackReasonStats;
}
export declare const blueGreenDeploymentService: BlueGreenDeploymentService;
export {};
//# sourceMappingURL=blue-green-deployment.service.d.ts.map