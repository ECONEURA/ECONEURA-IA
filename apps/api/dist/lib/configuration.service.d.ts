import { z } from 'zod';
export declare const FeatureFlagSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    enabled: z.ZodBoolean;
    environment: z.ZodEnum<["development", "staging", "production"]>;
    rolloutPercentage: z.ZodDefault<z.ZodNumber>;
    targetUsers: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    targetOrganizations: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    conditions: z.ZodDefault<z.ZodArray<z.ZodObject<{
        field: z.ZodString;
        operator: z.ZodEnum<["equals", "not_equals", "contains", "starts_with", "ends_with", "greater_than", "less_than"]>;
        value: z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean]>;
    }, "strip", z.ZodTypeAny, {
        value?: string | number | boolean;
        field?: string;
        operator?: "greater_than" | "less_than" | "equals" | "not_equals" | "contains" | "starts_with" | "ends_with";
    }, {
        value?: string | number | boolean;
        field?: string;
        operator?: "greater_than" | "less_than" | "equals" | "not_equals" | "contains" | "starts_with" | "ends_with";
    }>, "many">>;
    createdAt: z.ZodOptional<z.ZodDate>;
    updatedAt: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    name?: string;
    environment?: "development" | "production" | "staging";
    id?: string;
    createdAt?: Date;
    updatedAt?: Date;
    description?: string;
    enabled?: boolean;
    conditions?: {
        value?: string | number | boolean;
        field?: string;
        operator?: "greater_than" | "less_than" | "equals" | "not_equals" | "contains" | "starts_with" | "ends_with";
    }[];
    rolloutPercentage?: number;
    targetUsers?: string[];
    targetOrganizations?: string[];
}, {
    name?: string;
    environment?: "development" | "production" | "staging";
    id?: string;
    createdAt?: Date;
    updatedAt?: Date;
    description?: string;
    enabled?: boolean;
    conditions?: {
        value?: string | number | boolean;
        field?: string;
        operator?: "greater_than" | "less_than" | "equals" | "not_equals" | "contains" | "starts_with" | "ends_with";
    }[];
    rolloutPercentage?: number;
    targetUsers?: string[];
    targetOrganizations?: string[];
}>;
export declare const EnvironmentSchema: z.ZodObject<{
    name: z.ZodEnum<["development", "staging", "production"]>;
    description: z.ZodOptional<z.ZodString>;
    variables: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean]>>>;
    secrets: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    isActive: z.ZodDefault<z.ZodBoolean>;
    createdAt: z.ZodOptional<z.ZodDate>;
    updatedAt: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    name?: "development" | "production" | "staging";
    createdAt?: Date;
    updatedAt?: Date;
    description?: string;
    isActive?: boolean;
    variables?: Record<string, string | number | boolean>;
    secrets?: string[];
}, {
    name?: "development" | "production" | "staging";
    createdAt?: Date;
    updatedAt?: Date;
    description?: string;
    isActive?: boolean;
    variables?: Record<string, string | number | boolean>;
    secrets?: string[];
}>;
export declare const ConfigValueSchema: z.ZodObject<{
    key: z.ZodString;
    value: z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean, z.ZodObject<{}, "strip", z.ZodTypeAny, {}, {}>]>;
    environment: z.ZodOptional<z.ZodEnum<["development", "staging", "production"]>>;
    description: z.ZodOptional<z.ZodString>;
    isSecret: z.ZodDefault<z.ZodBoolean>;
    createdAt: z.ZodOptional<z.ZodDate>;
    updatedAt: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    value?: string | number | boolean | {};
    key?: string;
    environment?: "development" | "production" | "staging";
    createdAt?: Date;
    updatedAt?: Date;
    description?: string;
    isSecret?: boolean;
}, {
    value?: string | number | boolean | {};
    key?: string;
    environment?: "development" | "production" | "staging";
    createdAt?: Date;
    updatedAt?: Date;
    description?: string;
    isSecret?: boolean;
}>;
export declare const FeatureFlagCheckSchema: z.ZodObject<{
    userId: z.ZodOptional<z.ZodString>;
    organizationId: z.ZodOptional<z.ZodString>;
    userRole: z.ZodOptional<z.ZodString>;
    customAttributes: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean]>>>;
}, "strip", z.ZodTypeAny, {
    userId?: string;
    organizationId?: string;
    userRole?: string;
    customAttributes?: Record<string, string | number | boolean>;
}, {
    userId?: string;
    organizationId?: string;
    userRole?: string;
    customAttributes?: Record<string, string | number | boolean>;
}>;
export type FeatureFlag = z.infer<typeof FeatureFlagSchema>;
export type Environment = z.infer<typeof EnvironmentSchema>;
export type ConfigValue = z.infer<typeof ConfigValueSchema>;
export type FeatureFlagCheck = z.infer<typeof FeatureFlagCheckSchema>;
export declare class ConfigurationService {
    private featureFlags;
    private environments;
    private configValues;
    private secrets;
    constructor();
    private initializeDefaultData;
    getFeatureFlags(environment?: string): Promise<FeatureFlag[]>;
    getFeatureFlag(id: string): Promise<FeatureFlag | null>;
    createFeatureFlag(flag: Omit<FeatureFlag, 'id' | 'createdAt' | 'updatedAt'>): Promise<FeatureFlag>;
    updateFeatureFlag(id: string, updates: Partial<FeatureFlag>): Promise<FeatureFlag | null>;
    deleteFeatureFlag(id: string): Promise<boolean>;
    checkFeatureFlag(flagName: string, context: FeatureFlagCheck): Promise<{
        isEnabled: boolean;
        reason?: string;
    }>;
    getEnvironments(): Promise<Environment[]>;
    getEnvironment(name: string): Promise<Environment | null>;
    updateEnvironment(name: string, updates: Partial<Environment>): Promise<Environment | null>;
    getConfigValue(key: string, environment?: string): Promise<ConfigValue | null>;
    setConfigValue(key: string, value: any, environment?: string): Promise<ConfigValue>;
    setSecret(key: string, value: string, environment?: string): Promise<void>;
    getSecret(key: string, environment?: string): Promise<string | null>;
    deleteSecret(key: string, environment?: string): Promise<boolean>;
    getStats(): Promise<{
        totalFeatureFlags: number;
        totalEnvironments: number;
        totalConfigValues: number;
        totalSecrets: number;
        featureFlagsByEnvironment: Record<string, number>;
        configValuesByEnvironment: Record<string, number>;
    }>;
    validateConfiguration(): Promise<{
        isValid: boolean;
        errors: string[];
        warnings: string[];
    }>;
    reloadConfiguration(): Promise<{
        success: boolean;
        message: string;
    }>;
    private hashString;
    private evaluateCondition;
}
export declare const configurationService: ConfigurationService;
//# sourceMappingURL=configuration.service.d.ts.map