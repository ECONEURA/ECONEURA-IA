import { z } from 'zod';
declare const DeploymentStatusSchema: z.ZodEnum<["pending", "in_progress", "completed", "failed", "rolled_back"]>;
declare const EnvironmentSchema: z.ZodEnum<["dev", "staging", "prod"]>;
declare const DeploymentStrategySchema: z.ZodEnum<["blue_green", "rolling", "canary", "recreate"]>;
export type DeploymentStatus = z.infer<typeof DeploymentStatusSchema>;
export type Environment = z.infer<typeof EnvironmentSchema>;
export type DeploymentStrategy = z.infer<typeof DeploymentStrategySchema>;
export interface Deployment {
    id: string;
    version: string;
    environment: Environment;
    strategy: DeploymentStrategy;
    status: DeploymentStatus;
    startedAt: Date;
    completedAt?: Date;
    rollbackAt?: Date;
    triggeredBy: string;
    commitSha: string;
    branch: string;
    buildNumber: string;
    artifacts: {
        api: string;
        web: string;
        workers: string;
    };
    healthChecks: HealthCheck[];
    metrics: DeploymentMetrics;
    rollbackReason?: string;
    metadata: Record<string, any>;
}
export interface HealthCheck {
    name: string;
    url: string;
    status: 'pending' | 'passing' | 'failing';
    lastChecked: Date;
    responseTime?: number;
    error?: string;
}
export interface DeploymentMetrics {
    deploymentTime: number;
    downtime: number;
    errorRate: number;
    responseTime: number;
    throughput: number;
    resourceUsage: {
        cpu: number;
        memory: number;
        disk: number;
    };
}
export interface DeploymentConfig {
    environment: Environment;
    strategy: DeploymentStrategy;
    healthCheckTimeout: number;
    rollbackThreshold: number;
    canaryPercentage?: number;
    autoRollback: boolean;
    notifications: {
        slack?: string;
        teams?: string;
        email?: string[];
    };
}
export interface BuildArtifact {
    id: string;
    name: string;
    version: string;
    type: 'api' | 'web' | 'workers' | 'infrastructure';
    size: number;
    checksum: string;
    createdAt: Date;
    metadata: Record<string, any>;
}
export interface TestResult {
    id: string;
    type: 'unit' | 'integration' | 'e2e' | 'performance' | 'security';
    status: 'passed' | 'failed' | 'skipped';
    duration: number;
    coverage?: number;
    results: {
        total: number;
        passed: number;
        failed: number;
        skipped: number;
    };
    artifacts: string[];
    createdAt: Date;
}
export declare class AdvancedCICDService {
    private deployments;
    private artifacts;
    private testResults;
    private deploymentConfigs;
    constructor();
    createDeployment(version: string, environment: Environment, strategy: DeploymentStrategy, triggeredBy: string, commitSha: string, branch: string, buildNumber: string, artifacts: Deployment['artifacts']): Promise<Deployment>;
    executeDeployment(deploymentId: string): Promise<Deployment>;
    private executeDeploymentStrategy;
    private executeBlueGreenDeployment;
    private executeRollingDeployment;
    private executeCanaryDeployment;
    private executeRecreateDeployment;
    private simulateDeploymentStep;
    private runHealthChecks;
    private collectDeploymentMetrics;
    rollbackDeployment(deploymentId: string, reason: string): Promise<Deployment>;
    private executeRollbackStrategy;
    private rollbackBlueGreen;
    private rollbackRolling;
    private rollbackCanary;
    private rollbackRecreate;
    private sendDeploymentNotification;
    private buildNotificationMessage;
    createBuildArtifact(name: string, version: string, type: BuildArtifact['type'], size: number, checksum: string, metadata?: Record<string, any>): Promise<BuildArtifact>;
    getArtifacts(filters?: {
        type?: BuildArtifact['type'];
        version?: string;
        name?: string;
    }): Promise<BuildArtifact[]>;
    recordTestResult(type: TestResult['type'], status: TestResult['status'], duration: number, results: TestResult['results'], coverage?: number, artifacts?: string[]): Promise<TestResult>;
    getTestResults(filters?: {
        type?: TestResult['type'];
        status?: TestResult['status'];
        since?: Date;
    }): Promise<TestResult[]>;
    private initializeDefaultConfigs;
    updateDeploymentConfig(environment: Environment, config: Partial<DeploymentConfig>): Promise<void>;
    getDeploymentAnalytics(environment?: Environment): Promise<{
        totalDeployments: number;
        successfulDeployments: number;
        failedDeployments: number;
        rollbackRate: number;
        averageDeploymentTime: number;
        averageDowntime: number;
        deploymentsByStrategy: Record<DeploymentStrategy, number>;
        deploymentsByStatus: Record<DeploymentStatus, number>;
    }>;
    private generateId;
    getServiceStats(): Promise<{
        totalDeployments: number;
        totalArtifacts: number;
        totalTestResults: number;
        activeDeployments: number;
        configuredEnvironments: number;
    }>;
}
export {};
//# sourceMappingURL=advanced-cicd.service.d.ts.map