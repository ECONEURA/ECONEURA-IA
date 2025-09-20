import { RLSPolicy, PolicyDeployment, DeploymentConfig } from './rls-types.js';
export declare class RLSPolicyDeployerService {
    private deployments;
    private deploymentConfigs;
    constructor();
    private initializeDeploymentConfigs;
    deployPolicy(policy: RLSPolicy, environment: string, strategy: 'blue-green' | 'canary' | 'rolling' | 'feature-flag', deployedBy: string, options?: Record<string, unknown>): Promise<PolicyDeployment>;
    private executeDeployment;
    private executeBlueGreenDeployment;
    private executeCanaryDeployment;
    private executeRollingDeployment;
    private executeFeatureFlagDeployment;
    private simulateDeploymentStep;
    private checkHealthMetrics;
    rollbackDeployment(deploymentId: string, rollbackBy: string, reason?: string): Promise<PolicyDeployment | null>;
    private executeRollback;
    private logDeploymentAudit;
    getDeployment(deploymentId: string): PolicyDeployment | null;
    getDeployments(policyId?: string): PolicyDeployment[];
    getDeploymentsByEnvironment(environment: string): PolicyDeployment[];
    getDeploymentsByStrategy(strategy: string): PolicyDeployment[];
    getDeploymentConfigs(): DeploymentConfig[];
    getDeploymentConfig(configId: string): DeploymentConfig | null;
    updateDeploymentConfig(configId: string, updates: Partial<DeploymentConfig>): DeploymentConfig | null;
    getDeploymentStats(): {
        totalDeployments: number;
        pendingDeployments: number;
        deployingDeployments: number;
        deployedDeployments: number;
        failedDeployments: number;
        rollbackDeployments: number;
        averageDeploymentTime: number;
        deploymentsByStrategy: Record<string, number>;
        deploymentsByEnvironment: Record<string, number>;
    };
    getDeploymentHealth(deploymentId: string): {
        deploymentId: string;
        healthScore: number;
        status: 'healthy' | 'degraded' | 'unhealthy';
        metrics: Record<string, number>;
        lastChecked: Date;
    };
}
//# sourceMappingURL=rls-policy-deployer.service.d.ts.map