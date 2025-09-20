export interface FeatureFlag {
    id: string;
    name: string;
    description: string;
    enabled: boolean;
    environment: string;
    rolloutPercentage: number;
    targetUsers: string[];
    targetOrganizations: string[];
    conditions: FeatureFlagCondition[];
    createdAt: Date;
    updatedAt: Date;
    expiresAt?: Date;
}
export interface FeatureFlagCondition {
    type: 'user_id' | 'organization_id' | 'user_role' | 'time_window' | 'custom';
    operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
    value: any;
    field?: string;
}
export interface EnvironmentConfig {
    name: string;
    description: string;
    variables: Record<string, any>;
    secrets: Record<string, string>;
    featureFlags: string[];
    overrides: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
export interface ConfigurationManager {
    getFeatureFlag(flagId: string): FeatureFlag | undefined;
    isFeatureEnabled(flagId: string, context?: FeatureFlagContext): boolean;
    getAllFeatureFlags(): FeatureFlag[];
    getFeatureFlagsByEnvironment(environment: string): FeatureFlag[];
    createFeatureFlag(flag: Omit<FeatureFlag, 'id' | 'createdAt' | 'updatedAt'>): string;
    updateFeatureFlag(flagId: string, updates: Partial<FeatureFlag>): boolean;
    deleteFeatureFlag(flagId: string): boolean;
    getEnvironmentConfig(environment: string): EnvironmentConfig | undefined;
    setEnvironmentConfig(environment: string, config: Partial<EnvironmentConfig>): boolean;
    getConfigValue(key: string, environment?: string, defaultValue?: any): any;
    setConfigValue(key: string, value: any, environment?: string): boolean;
    getSecret(key: string, environment?: string): string | undefined;
    setSecret(key: string, value: string, environment?: string): boolean;
    validateConfiguration(): boolean;
    reloadConfiguration(): void;
}
export interface FeatureFlagContext {
    userId?: string;
    organizationId?: string;
    userRole?: string;
    userEmail?: string;
    customAttributes?: Record<string, any>;
}
export interface ConfigurationStats {
    totalFeatureFlags: number;
    enabledFeatureFlags: number;
    environments: string[];
    totalConfigValues: number;
    totalSecrets: number;
}
export declare class InMemoryConfigurationManager implements ConfigurationManager {
    private featureFlags;
    private environmentConfigs;
    private configValues;
    private secrets;
    constructor();
    getFeatureFlag(flagId: string): FeatureFlag | undefined;
    isFeatureEnabled(flagId: string, context?: FeatureFlagContext): boolean;
    getAllFeatureFlags(): FeatureFlag[];
    getFeatureFlagsByEnvironment(environment: string): FeatureFlag[];
    createFeatureFlag(flag: Omit<FeatureFlag, 'id' | 'createdAt' | 'updatedAt'>): string;
    updateFeatureFlag(flagId: string, updates: Partial<FeatureFlag>): boolean;
    deleteFeatureFlag(flagId: string): boolean;
    getEnvironmentConfig(environment: string): EnvironmentConfig | undefined;
    setEnvironmentConfig(environment: string, config: Partial<EnvironmentConfig>): boolean;
    getConfigValue(key: string, environment?: string, defaultValue?: any): any;
    setConfigValue(key: string, value: any, environment?: string): boolean;
    getSecret(key: string, environment?: string): string | undefined;
    setSecret(key: string, value: string, environment?: string): boolean;
    validateConfiguration(): boolean;
    reloadConfiguration(): void;
    getStats(): ConfigurationStats;
    private initializeDefaultEnvironments;
    private initializeDefaultFeatureFlags;
    private evaluateConditions;
    private evaluateCondition;
    private evaluateTimeWindow;
    private evaluateCustomCondition;
    private hashContext;
}
export declare const configurationManager: InMemoryConfigurationManager;
//# sourceMappingURL=configuration.d.ts.map