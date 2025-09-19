export interface DeploymentStrategy {
    id: string;
    name: string;
    type: 'blue-green' | 'canary' | 'rolling' | 'recreate' | 'ramped';
    description: string;
    config: {
        maxUnavailable?: number;
        maxSurge?: number;
        canaryPercentage?: number;
        rampUpSteps?: number;
        stepDuration?: number;
        healthCheckPath?: string;
        healthCheckTimeout?: number;
        rollbackThreshold?: number;
    };
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface DeploymentEnvironment {
    id: string;
    name: string;
    type: 'development' | 'staging' | 'production' | 'preview';
    description: string;
    config: {
        resourceGroup: string;
        subscriptionId: string;
        location: string;
        domainName?: string;
        sslEnabled: boolean;
        autoScaling: boolean;
        minInstances: number;
        maxInstances: number;
        cpuThreshold: number;
        memoryThreshold: number;
    };
    secrets: {
        keyVaultName: string;
        connectionStrings: Record<string, string>;
        environmentVariables: Record<string, string>;
    };
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface DeploymentPipeline {
    id: string;
    name: string;
    description: string;
    source: {
        repository: string;
        branch: string;
        trigger: 'push' | 'pull_request' | 'schedule' | 'manual';
        paths?: string[];
    };
    stages: {
        id: string;
        name: string;
        environment: string;
        strategy: string;
        dependencies: string[];
        conditions: {
            branch?: string;
            environment?: string;
            approval?: boolean;
            tests?: string[];
        };
        steps: {
            id: string;
            name: string;
            type: 'build' | 'test' | 'deploy' | 'approval' | 'notification';
            config: Record<string, any>;
            timeout?: number;
            retryCount?: number;
        }[];
    }[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface DeploymentJob {
    id: string;
    pipelineId: string;
    stageId: string;
    environmentId: string;
    strategyId: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'rolled_back';
    trigger: {
        type: 'manual' | 'automatic' | 'scheduled';
        triggeredBy: string;
        triggeredAt: Date;
        commitHash?: string;
        pullRequestNumber?: number;
    };
    progress: {
        currentStep: number;
        totalSteps: number;
        currentStepName: string;
        percentage: number;
    };
    artifacts: {
        buildId?: string;
        imageTag?: string;
        packageUrl?: string;
        testResults?: string;
    };
    metrics: {
        startTime: Date;
        endTime?: Date;
        duration?: number;
        resourceUsage: {
            cpu: number;
            memory: number;
            disk: number;
        };
        deploymentMetrics: {
            instancesDeployed: number;
            instancesHealthy: number;
            instancesUnhealthy: number;
            rollbackTriggered: boolean;
        };
    };
    logs: {
        step: string;
        level: 'info' | 'warn' | 'error';
        message: string;
        timestamp: Date;
    }[];
    createdAt: Date;
    updatedAt: Date;
}
export interface DeploymentApproval {
    id: string;
    jobId: string;
    stageId: string;
    approver: string;
    status: 'pending' | 'approved' | 'rejected';
    comments?: string;
    requestedAt: Date;
    respondedAt?: Date;
    expiresAt: Date;
}
export interface DeploymentNotification {
    id: string;
    jobId: string;
    type: 'started' | 'completed' | 'failed' | 'approved' | 'rejected' | 'rolled_back';
    channels: ('email' | 'slack' | 'teams' | 'webhook')[];
    recipients: string[];
    template: string;
    data: Record<string, any>;
    sent: boolean;
    sentAt?: Date;
    createdAt: Date;
}
export interface DeploymentHealthCheck {
    id: string;
    jobId: string;
    name: string;
    type: 'http' | 'tcp' | 'grpc' | 'custom';
    config: {
        url?: string;
        port?: number;
        path?: string;
        method?: string;
        headers?: Record<string, string>;
        body?: string;
        expectedStatus?: number;
        expectedResponse?: string;
        timeout: number;
        retries: number;
        interval: number;
    };
    results: {
        status: 'pending' | 'running' | 'passed' | 'failed';
        lastCheck: Date;
        attempts: number;
        responseTime?: number;
        error?: string;
    };
    createdAt: Date;
}
export interface DeploymentRollback {
    id: string;
    jobId: string;
    reason: string;
    triggeredBy: string;
    triggeredAt: Date;
    targetVersion: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    progress: {
        currentStep: number;
        totalSteps: number;
        percentage: number;
    };
    completedAt?: Date;
}
export declare class AdvancedDeploymentAutomationService {
    private strategies;
    private environments;
    private pipelines;
    private jobs;
    private approvals;
    private notifications;
    private healthChecks;
    private rollbacks;
    constructor();
    private initializeService;
    createStrategy(strategy: Omit<DeploymentStrategy, 'id' | 'createdAt' | 'updatedAt'>): Promise<DeploymentStrategy>;
    getStrategies(): Promise<DeploymentStrategy[]>;
    updateStrategy(id: string, updates: Partial<DeploymentStrategy>): Promise<DeploymentStrategy | null>;
    deleteStrategy(id: string): Promise<boolean>;
    createEnvironment(environment: Omit<DeploymentEnvironment, 'id' | 'createdAt' | 'updatedAt'>): Promise<DeploymentEnvironment>;
    getEnvironments(): Promise<DeploymentEnvironment[]>;
    updateEnvironment(id: string, updates: Partial<DeploymentEnvironment>): Promise<DeploymentEnvironment | null>;
    createPipeline(pipeline: Omit<DeploymentPipeline, 'id' | 'createdAt' | 'updatedAt'>): Promise<DeploymentPipeline>;
    getPipelines(): Promise<DeploymentPipeline[]>;
    updatePipeline(id: string, updates: Partial<DeploymentPipeline>): Promise<DeploymentPipeline | null>;
    createJob(job: Omit<DeploymentJob, 'id' | 'createdAt' | 'updatedAt'>): Promise<DeploymentJob>;
    getJobs(filters?: {
        status?: string;
        environmentId?: string;
        pipelineId?: string;
        limit?: number;
    }): Promise<DeploymentJob[]>;
    updateJobStatus(id: string, status: DeploymentJob['status'], progress?: Partial<DeploymentJob['progress']>): Promise<DeploymentJob | null>;
    addJobLog(id: string, log: Omit<DeploymentJob['logs'][0], 'timestamp'>): Promise<boolean>;
    createApproval(approval: Omit<DeploymentApproval, 'id'>): Promise<DeploymentApproval>;
    getApprovals(jobId?: string): Promise<DeploymentApproval[]>;
    respondToApproval(id: string, status: 'approved' | 'rejected', comments?: string, approver?: string): Promise<DeploymentApproval | null>;
    createNotification(notification: Omit<DeploymentNotification, 'id' | 'createdAt'>): Promise<DeploymentNotification>;
    getNotifications(jobId?: string): Promise<DeploymentNotification[]>;
    markNotificationSent(id: string): Promise<boolean>;
    createHealthCheck(healthCheck: Omit<DeploymentHealthCheck, 'id' | 'createdAt'>): Promise<DeploymentHealthCheck>;
    getHealthChecks(jobId?: string): Promise<DeploymentHealthCheck[]>;
    updateHealthCheckResult(id: string, result: Partial<DeploymentHealthCheck['results']>): Promise<boolean>;
    createRollback(rollback: Omit<DeploymentRollback, 'id'>): Promise<DeploymentRollback>;
    getRollbacks(jobId?: string): Promise<DeploymentRollback[]>;
    updateRollbackStatus(id: string, status: DeploymentRollback['status'], progress?: Partial<DeploymentRollback['progress']>): Promise<DeploymentRollback | null>;
    executeDeployment(pipelineId: string, environmentId: string, trigger: {
        type: 'manual' | 'automatic' | 'scheduled';
        triggeredBy: string;
        commitHash?: string;
        pullRequestNumber?: number;
    }): Promise<DeploymentJob>;
    private executeDeploymentSteps;
    private executeStep;
    private simulateBuildStep;
    private simulateTestStep;
    private simulateDeployStep;
    private simulateBlueGreenDeployment;
    private simulateCanaryDeployment;
    private simulateRollingDeployment;
    private simulateRecreateDeployment;
    private simulateApprovalStep;
    private simulateNotificationStep;
    getStatistics(): Promise<{
        totalStrategies: number;
        totalEnvironments: number;
        totalPipelines: number;
        totalJobs: number;
        activeJobs: number;
        completedJobs: number;
        failedJobs: number;
        pendingApprovals: number;
        totalNotifications: number;
        sentNotifications: number;
        totalHealthChecks: number;
        passedHealthChecks: number;
        totalRollbacks: number;
        completedRollbacks: number;
        jobsByStatus: Record<string, number>;
        jobsByEnvironment: Record<string, number>;
        averageDeploymentTime: number;
    }>;
    private initializeDemoData;
}
export declare const advancedDeploymentAutomationService: AdvancedDeploymentAutomationService;
//# sourceMappingURL=advanced-deployment-automation.service.d.ts.map