import { CICDConfig, CICDIntegration, ValidationConfig, DeploymentConfig, NotificationConfig } from './rls-types.js';
export declare class RLSCICDService {
    private cicdConfigs;
    private integrations;
    constructor();
    private initializeIntegrations;
    createCICDConfig(name: string, description: string, provider: 'github' | 'gitlab' | 'jenkins' | 'azure-devops', repository: string, branch: string, pipeline: string, triggers: string[], validations: ValidationConfig[], deployments: DeploymentConfig[], notifications: NotificationConfig[]): Promise<CICDConfig>;
    createIntegration(name: string, provider: 'github' | 'gitlab' | 'jenkins' | 'azure-devops', repository: string, branch: string, pipeline: string, webhookUrl: string, secret: string, events: string[]): Promise<CICDIntegration>;
    private registerWebhook;
    handleWebhookEvent(integrationId: string, eventType: string, payload: Record<string, unknown>): Promise<void>;
    private handlePushEvent;
    private handlePullRequestEvent;
    private handleReleaseEvent;
    private triggerPolicyValidation;
    private triggerPolicyDeployment;
    generatePipelineConfig(integrationId: string, configType: 'github-actions' | 'gitlab-ci' | 'jenkins' | 'azure-devops'): Promise<string>;
    private generateGitHubActionsConfig;
    private generateGitLabCIConfig;
    private generateJenkinsConfig;
    private generateAzureDevOpsConfig;
    getCICDConfig(configId: string): CICDConfig | null;
    getCICDConfigs(): CICDConfig[];
    updateCICDConfig(configId: string, updates: Partial<CICDConfig>): CICDConfig | null;
    deleteCICDConfig(configId: string): boolean;
    getIntegration(integrationId: string): CICDIntegration | null;
    getIntegrations(): CICDIntegration[];
    getIntegrationsByProvider(provider: string): CICDIntegration[];
    updateIntegration(integrationId: string, updates: Partial<CICDIntegration>): CICDIntegration | null;
    deleteIntegration(integrationId: string): boolean;
    getCICDStats(): {
        totalConfigs: number;
        activeConfigs: number;
        inactiveConfigs: number;
        totalIntegrations: number;
        activeIntegrations: number;
        integrationsByProvider: Record<string, number>;
        lastSyncTimes: Record<string, Date>;
    };
}
//# sourceMappingURL=rls-cicd.service.d.ts.map