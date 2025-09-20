import { z } from 'zod';
export declare const AdvancedConfigSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    category: z.ZodEnum<["system", "feature", "integration", "security", "performance", "monitoring"]>;
    type: z.ZodEnum<["string", "number", "boolean", "object", "array", "json"]>;
    value: z.ZodAny;
    defaultValue: z.ZodAny;
    environment: z.ZodEnum<["development", "staging", "production", "all"]>;
    isSecret: z.ZodDefault<z.ZodBoolean>;
    isRequired: z.ZodDefault<z.ZodBoolean>;
    validation: z.ZodOptional<z.ZodObject<{
        min: z.ZodOptional<z.ZodNumber>;
        max: z.ZodOptional<z.ZodNumber>;
        pattern: z.ZodOptional<z.ZodString>;
        enum: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
        custom: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        custom?: string;
        pattern?: string;
        max?: number;
        enum?: any[];
        min?: number;
    }, {
        custom?: string;
        pattern?: string;
        max?: number;
        enum?: any[];
        min?: number;
    }>>;
    dependencies: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    version: z.ZodDefault<z.ZodString>;
    isActive: z.ZodDefault<z.ZodBoolean>;
    createdAt: z.ZodOptional<z.ZodDate>;
    updatedAt: z.ZodOptional<z.ZodDate>;
    createdBy: z.ZodOptional<z.ZodString>;
    updatedBy: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    value?: any;
    validation?: {
        custom?: string;
        pattern?: string;
        max?: number;
        enum?: any[];
        min?: number;
    };
    type?: "string" | "number" | "boolean" | "object" | "json" | "array";
    version?: string;
    name?: string;
    environment?: "development" | "production" | "staging" | "all";
    id?: string;
    tags?: string[];
    createdAt?: Date;
    updatedAt?: Date;
    description?: string;
    category?: "security" | "system" | "performance" | "monitoring" | "feature" | "integration";
    isActive?: boolean;
    createdBy?: string;
    updatedBy?: string;
    defaultValue?: any;
    dependencies?: string[];
    isSecret?: boolean;
    isRequired?: boolean;
}, {
    value?: any;
    validation?: {
        custom?: string;
        pattern?: string;
        max?: number;
        enum?: any[];
        min?: number;
    };
    type?: "string" | "number" | "boolean" | "object" | "json" | "array";
    version?: string;
    name?: string;
    environment?: "development" | "production" | "staging" | "all";
    id?: string;
    tags?: string[];
    createdAt?: Date;
    updatedAt?: Date;
    description?: string;
    category?: "security" | "system" | "performance" | "monitoring" | "feature" | "integration";
    isActive?: boolean;
    createdBy?: string;
    updatedBy?: string;
    defaultValue?: any;
    dependencies?: string[];
    isSecret?: boolean;
    isRequired?: boolean;
}>;
export declare const ConfigTemplateSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    category: z.ZodEnum<["system", "feature", "integration", "security", "performance", "monitoring"]>;
    template: z.ZodRecord<z.ZodString, z.ZodAny>;
    variables: z.ZodDefault<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        type: z.ZodEnum<["string", "number", "boolean", "object", "array"]>;
        required: z.ZodDefault<z.ZodBoolean>;
        defaultValue: z.ZodOptional<z.ZodAny>;
        description: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type?: "string" | "number" | "boolean" | "object" | "array";
        name?: string;
        description?: string;
        defaultValue?: any;
        required?: boolean;
    }, {
        type?: "string" | "number" | "boolean" | "object" | "array";
        name?: string;
        description?: string;
        defaultValue?: any;
        required?: boolean;
    }>, "many">>;
    isActive: z.ZodDefault<z.ZodBoolean>;
    createdAt: z.ZodOptional<z.ZodDate>;
    updatedAt: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    name?: string;
    id?: string;
    createdAt?: Date;
    updatedAt?: Date;
    description?: string;
    category?: "security" | "system" | "performance" | "monitoring" | "feature" | "integration";
    isActive?: boolean;
    template?: Record<string, any>;
    variables?: {
        type?: "string" | "number" | "boolean" | "object" | "array";
        name?: string;
        description?: string;
        defaultValue?: any;
        required?: boolean;
    }[];
}, {
    name?: string;
    id?: string;
    createdAt?: Date;
    updatedAt?: Date;
    description?: string;
    category?: "security" | "system" | "performance" | "monitoring" | "feature" | "integration";
    isActive?: boolean;
    template?: Record<string, any>;
    variables?: {
        type?: "string" | "number" | "boolean" | "object" | "array";
        name?: string;
        description?: string;
        defaultValue?: any;
        required?: boolean;
    }[];
}>;
export declare const ConfigDeploymentSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    environment: z.ZodEnum<["development", "staging", "production"]>;
    configs: z.ZodArray<z.ZodString, "many">;
    deploymentStrategy: z.ZodEnum<["immediate", "gradual", "canary", "blue_green"]>;
    rolloutPercentage: z.ZodDefault<z.ZodNumber>;
    schedule: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        cron: z.ZodOptional<z.ZodString>;
        timezone: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        enabled?: boolean;
        timezone?: string;
        cron?: string;
    }, {
        enabled?: boolean;
        timezone?: string;
        cron?: string;
    }>>;
    rollbackConfig: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        autoRollback: z.ZodDefault<z.ZodBoolean>;
        rollbackConditions: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        enabled?: boolean;
        autoRollback?: boolean;
        rollbackConditions?: string[];
    }, {
        enabled?: boolean;
        autoRollback?: boolean;
        rollbackConditions?: string[];
    }>>;
    status: z.ZodDefault<z.ZodEnum<["pending", "in_progress", "completed", "failed", "rolled_back"]>>;
    createdAt: z.ZodOptional<z.ZodDate>;
    updatedAt: z.ZodOptional<z.ZodDate>;
    deployedAt: z.ZodOptional<z.ZodDate>;
    deployedBy: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status?: "pending" | "completed" | "failed" | "in_progress" | "rolled_back";
    name?: string;
    environment?: "development" | "production" | "staging";
    id?: string;
    createdAt?: Date;
    updatedAt?: Date;
    description?: string;
    rolloutPercentage?: number;
    configs?: string[];
    deploymentStrategy?: "canary" | "immediate" | "gradual" | "blue_green";
    schedule?: {
        enabled?: boolean;
        timezone?: string;
        cron?: string;
    };
    rollbackConfig?: {
        enabled?: boolean;
        autoRollback?: boolean;
        rollbackConditions?: string[];
    };
    deployedAt?: Date;
    deployedBy?: string;
}, {
    status?: "pending" | "completed" | "failed" | "in_progress" | "rolled_back";
    name?: string;
    environment?: "development" | "production" | "staging";
    id?: string;
    createdAt?: Date;
    updatedAt?: Date;
    description?: string;
    rolloutPercentage?: number;
    configs?: string[];
    deploymentStrategy?: "canary" | "immediate" | "gradual" | "blue_green";
    schedule?: {
        enabled?: boolean;
        timezone?: string;
        cron?: string;
    };
    rollbackConfig?: {
        enabled?: boolean;
        autoRollback?: boolean;
        rollbackConditions?: string[];
    };
    deployedAt?: Date;
    deployedBy?: string;
}>;
export declare const ConfigAuditSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    configId: z.ZodString;
    action: z.ZodEnum<["create", "update", "delete", "deploy", "rollback"]>;
    oldValue: z.ZodOptional<z.ZodAny>;
    newValue: z.ZodOptional<z.ZodAny>;
    environment: z.ZodEnum<["development", "staging", "production"]>;
    userId: z.ZodString;
    timestamp: z.ZodDate;
    reason: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    userId?: string;
    timestamp?: Date;
    reason?: string;
    metadata?: Record<string, any>;
    environment?: "development" | "production" | "staging";
    id?: string;
    action?: "create" | "update" | "delete" | "deploy" | "rollback";
    oldValue?: any;
    newValue?: any;
    configId?: string;
}, {
    userId?: string;
    timestamp?: Date;
    reason?: string;
    metadata?: Record<string, any>;
    environment?: "development" | "production" | "staging";
    id?: string;
    action?: "create" | "update" | "delete" | "deploy" | "rollback";
    oldValue?: any;
    newValue?: any;
    configId?: string;
}>;
export type AdvancedConfig = z.infer<typeof AdvancedConfigSchema>;
export type ConfigTemplate = z.infer<typeof ConfigTemplateSchema>;
export type ConfigDeployment = z.infer<typeof ConfigDeploymentSchema>;
export type ConfigAudit = z.infer<typeof ConfigAuditSchema>;
export interface ConfigValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}
export interface ConfigDependency {
    configId: string;
    dependencyType: 'required' | 'optional' | 'conflict';
    condition: string;
}
export interface ConfigMetrics {
    totalConfigs: number;
    configsByCategory: Record<string, number>;
    configsByEnvironment: Record<string, number>;
    activeConfigs: number;
    inactiveConfigs: number;
    secretConfigs: number;
    recentChanges: number;
    deploymentSuccessRate: number;
}
export declare class AdvancedConfigurationManagementService {
    private configs;
    private templates;
    private deployments;
    private auditLog;
    private configCache;
    private validationRules;
    constructor();
    private initializeDefaultData;
    private initializeValidationRules;
    getConfigs(filters?: {
        category?: string;
        environment?: string;
        isActive?: boolean;
        tags?: string[];
    }): Promise<AdvancedConfig[]>;
    getConfig(id: string): Promise<AdvancedConfig | null>;
    getConfigByName(name: string, environment?: string): Promise<AdvancedConfig | null>;
    createConfig(config: Omit<AdvancedConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<AdvancedConfig>;
    updateConfig(id: string, updates: Partial<AdvancedConfig>, userId: string): Promise<AdvancedConfig | null>;
    deleteConfig(id: string, userId: string): Promise<boolean>;
    validateConfig(config: Partial<AdvancedConfig>): Promise<ConfigValidationResult>;
    getTemplates(): Promise<ConfigTemplate[]>;
    getTemplate(id: string): Promise<ConfigTemplate | null>;
    createTemplate(template: Omit<ConfigTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<ConfigTemplate>;
    generateConfigFromTemplate(templateId: string, variables: Record<string, any>): Promise<AdvancedConfig[]>;
    createDeployment(deployment: Omit<ConfigDeployment, 'id' | 'createdAt' | 'updatedAt'>): Promise<ConfigDeployment>;
    executeDeployment(deploymentId: string, userId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getAuditLog(filters?: {
        configId?: string;
        action?: string;
        userId?: string;
        startDate?: Date;
        endDate?: Date;
    }): Promise<ConfigAudit[]>;
    getMetrics(): Promise<ConfigMetrics>;
    getConfigValue(name: string, environment?: string): Promise<any>;
    clearCache(): Promise<void>;
    exportConfigs(environment?: string): Promise<Record<string, any>>;
    importConfigs(configs: Record<string, any>, environment: string, userId: string): Promise<{
        success: boolean;
        imported: number;
        errors: string[];
    }>;
}
export declare const advancedConfigurationManagementService: AdvancedConfigurationManagementService;
//# sourceMappingURL=advanced-configuration-management.service.d.ts.map