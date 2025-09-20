import { z } from 'zod';
declare const DeploymentConfigSchema: z.ZodObject<{
    environment: z.ZodEnum<["development", "staging", "production"]>;
    strategy: z.ZodEnum<["blue-green", "canary", "rolling", "recreate"]>;
    region: z.ZodString;
    resourceGroup: z.ZodString;
    appServiceName: z.ZodString;
    containerRegistry: z.ZodString;
    imageTag: z.ZodString;
    replicas: z.ZodNumber;
    healthCheckPath: z.ZodString;
    rollbackEnabled: z.ZodBoolean;
    monitoringEnabled: z.ZodBoolean;
    autoScaling: z.ZodObject<{
        enabled: z.ZodBoolean;
        minReplicas: z.ZodNumber;
        maxReplicas: z.ZodNumber;
        targetCPU: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        enabled?: boolean;
        minReplicas?: number;
        maxReplicas?: number;
        targetCPU?: number;
    }, {
        enabled?: boolean;
        minReplicas?: number;
        maxReplicas?: number;
        targetCPU?: number;
    }>;
}, "strip", z.ZodTypeAny, {
    strategy?: "blue-green" | "canary" | "rolling" | "recreate";
    environment?: "development" | "production" | "staging";
    region?: string;
    resourceGroup?: string;
    appServiceName?: string;
    containerRegistry?: string;
    imageTag?: string;
    replicas?: number;
    healthCheckPath?: string;
    rollbackEnabled?: boolean;
    monitoringEnabled?: boolean;
    autoScaling?: {
        enabled?: boolean;
        minReplicas?: number;
        maxReplicas?: number;
        targetCPU?: number;
    };
}, {
    strategy?: "blue-green" | "canary" | "rolling" | "recreate";
    environment?: "development" | "production" | "staging";
    region?: string;
    resourceGroup?: string;
    appServiceName?: string;
    containerRegistry?: string;
    imageTag?: string;
    replicas?: number;
    healthCheckPath?: string;
    rollbackEnabled?: boolean;
    monitoringEnabled?: boolean;
    autoScaling?: {
        enabled?: boolean;
        minReplicas?: number;
        maxReplicas?: number;
        targetCPU?: number;
    };
}>;
declare const HealthCheckSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    type: z.ZodEnum<["HTTP", "TCP", "GRPC", "CUSTOM"]>;
    endpoint: z.ZodString;
    timeout: z.ZodNumber;
    interval: z.ZodNumber;
    retries: z.ZodNumber;
    expectedStatus: z.ZodOptional<z.ZodNumber>;
    expectedResponse: z.ZodOptional<z.ZodString>;
    enabled: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    type?: "HTTP" | "TCP" | "GRPC" | "CUSTOM";
    endpoint?: string;
    timeout?: number;
    name?: string;
    id?: string;
    enabled?: boolean;
    retries?: number;
    interval?: number;
    expectedResponse?: string;
    expectedStatus?: number;
}, {
    type?: "HTTP" | "TCP" | "GRPC" | "CUSTOM";
    endpoint?: string;
    timeout?: number;
    name?: string;
    id?: string;
    enabled?: boolean;
    retries?: number;
    interval?: number;
    expectedResponse?: string;
    expectedStatus?: number;
}>;
declare const ValidationResultSchema: z.ZodObject<{
    component: z.ZodString;
    status: z.ZodEnum<["PASSED", "FAILED", "WARNING", "SKIPPED"]>;
    message: z.ZodString;
    details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    timestamp: z.ZodDate;
    duration: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    message?: string;
    status?: "PASSED" | "FAILED" | "WARNING" | "SKIPPED";
    duration?: number;
    timestamp?: Date;
    details?: Record<string, any>;
    component?: string;
}, {
    message?: string;
    status?: "PASSED" | "FAILED" | "WARNING" | "SKIPPED";
    duration?: number;
    timestamp?: Date;
    details?: Record<string, any>;
    component?: string;
}>;
declare const DeploymentResultSchema: z.ZodObject<{
    id: z.ZodString;
    environment: z.ZodString;
    strategy: z.ZodString;
    status: z.ZodEnum<["PENDING", "RUNNING", "SUCCESS", "FAILED", "ROLLED_BACK"]>;
    startTime: z.ZodDate;
    endTime: z.ZodOptional<z.ZodDate>;
    duration: z.ZodOptional<z.ZodNumber>;
    url: z.ZodOptional<z.ZodString>;
    logs: z.ZodArray<z.ZodString, "many">;
    healthChecks: z.ZodArray<z.ZodObject<{
        component: z.ZodString;
        status: z.ZodEnum<["PASSED", "FAILED", "WARNING", "SKIPPED"]>;
        message: z.ZodString;
        details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        timestamp: z.ZodDate;
        duration: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        message?: string;
        status?: "PASSED" | "FAILED" | "WARNING" | "SKIPPED";
        duration?: number;
        timestamp?: Date;
        details?: Record<string, any>;
        component?: string;
    }, {
        message?: string;
        status?: "PASSED" | "FAILED" | "WARNING" | "SKIPPED";
        duration?: number;
        timestamp?: Date;
        details?: Record<string, any>;
        component?: string;
    }>, "many">;
    rollbackReason: z.ZodOptional<z.ZodString>;
    metrics: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    status?: "FAILED" | "RUNNING" | "PENDING" | "SUCCESS" | "ROLLED_BACK";
    duration?: number;
    strategy?: string;
    metrics?: Record<string, any>;
    url?: string;
    environment?: string;
    id?: string;
    logs?: string[];
    startTime?: Date;
    endTime?: Date;
    healthChecks?: {
        message?: string;
        status?: "PASSED" | "FAILED" | "WARNING" | "SKIPPED";
        duration?: number;
        timestamp?: Date;
        details?: Record<string, any>;
        component?: string;
    }[];
    rollbackReason?: string;
}, {
    status?: "FAILED" | "RUNNING" | "PENDING" | "SUCCESS" | "ROLLED_BACK";
    duration?: number;
    strategy?: string;
    metrics?: Record<string, any>;
    url?: string;
    environment?: string;
    id?: string;
    logs?: string[];
    startTime?: Date;
    endTime?: Date;
    healthChecks?: {
        message?: string;
        status?: "PASSED" | "FAILED" | "WARNING" | "SKIPPED";
        duration?: number;
        timestamp?: Date;
        details?: Record<string, any>;
        component?: string;
    }[];
    rollbackReason?: string;
}>;
export type DeploymentConfig = z.infer<typeof DeploymentConfigSchema>;
export type HealthCheck = z.infer<typeof HealthCheckSchema>;
export type ValidationResult = z.infer<typeof ValidationResultSchema>;
export type DeploymentResult = z.infer<typeof DeploymentResultSchema>;
export interface ProjectCompletionConfig {
    validationEnabled: boolean;
    deploymentEnabled: boolean;
    monitoringEnabled: boolean;
    rollbackEnabled: boolean;
    healthCheckInterval: number;
    deploymentTimeout: number;
    maxRetries: number;
    notificationChannels: string[];
    environments: string[];
    strategies: string[];
}
export interface SystemValidation {
    totalComponents: number;
    passedComponents: number;
    failedComponents: number;
    warningComponents: number;
    skippedComponents: number;
    overallStatus: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
    validationResults: ValidationResult[];
    summary: string;
    recommendations: string[];
}
export interface DeploymentStatus {
    activeDeployments: number;
    successfulDeployments: number;
    failedDeployments: number;
    lastDeployment: Date | null;
    averageDeploymentTime: number;
    rollbackCount: number;
    healthStatus: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
}
export declare class ProjectCompletionDeploymentService {
    private config;
    private deployments;
    private healthChecks;
    private validations;
    constructor(config: ProjectCompletionConfig);
    validateProjectCompletion(): Promise<SystemValidation>;
    private validateComponent;
    private validateAPIServer;
    private validateDatabase;
    private validateAuthentication;
    private validateAIServices;
    private validateMetricsMonitoring;
    private validateLoggingSystem;
    private validateConfigurationManagement;
    private validateBackupRecovery;
    private validateTestingSystem;
    private validateDocumentationSystem;
    private validateDeploymentAutomation;
    private validateSecurityFramework;
    private validatePerformanceMonitoring;
    private validateCentralizedLogging;
    private validateMetricsAlerts;
    private generateValidationSummary;
    private generateRecommendations;
    deploy(config: DeploymentConfig): Promise<DeploymentResult>;
    private executeDeployment;
    private runPreDeploymentChecks;
    private buildAndPushContainer;
    private executeDeploymentStrategy;
    private executeBlueGreenDeployment;
    private executeCanaryDeployment;
    private executeRollingDeployment;
    private executeRecreateDeployment;
    private runHealthChecks;
    private executeHealthCheck;
    private runPostDeploymentValidation;
    private rollbackDeployment;
    createHealthCheck(healthCheck: Omit<HealthCheck, 'id'>): Promise<HealthCheck>;
    getHealthCheck(healthCheckId: string): Promise<HealthCheck | null>;
    listHealthChecks(): Promise<HealthCheck[]>;
    updateHealthCheck(healthCheckId: string, updates: Partial<HealthCheck>): Promise<HealthCheck | null>;
    deleteHealthCheck(healthCheckId: string): Promise<boolean>;
    getDeploymentStatus(): Promise<DeploymentStatus>;
    generateDeploymentReport(period: 'daily' | 'weekly' | 'monthly'): Promise<{
        period: string;
        generatedAt: Date;
        summary: any;
        deployments: DeploymentResult[];
        healthChecks: ValidationResult[];
        recommendations: string[];
    }>;
    private getPeriodMs;
    private generateDeploymentRecommendations;
    private startHealthMonitoring;
    private runHealthMonitoring;
    updateConfig(updates: Partial<ProjectCompletionConfig>): Promise<ProjectCompletionConfig>;
    getConfig(): Promise<ProjectCompletionConfig>;
    private initializeDefaultHealthChecks;
    cleanup(): Promise<void>;
}
export default ProjectCompletionDeploymentService;
//# sourceMappingURL=project-completion-deployment.service.d.ts.map