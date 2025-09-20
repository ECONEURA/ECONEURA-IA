import { logger } from './logger.js';
export class InMemoryConfigurationManager {
    featureFlags = new Map();
    environmentConfigs = new Map();
    configValues = new Map();
    secrets = new Map();
    constructor() {
        this.initializeDefaultEnvironments();
        this.initializeDefaultFeatureFlags();
        logger.info('Configuration Manager initialized');
    }
    getFeatureFlag(flagId) {
        return this.featureFlags.get(flagId);
    }
    isFeatureEnabled(flagId, context) {
        const flag = this.featureFlags.get(flagId);
        if (!flag) {
            return false;
        }
        if (!flag.enabled) {
            return false;
        }
        if (flag.expiresAt && new Date() > flag.expiresAt) {
            return false;
        }
        if (flag.rolloutPercentage < 100) {
            const hash = this.hashContext(context);
            const percentage = hash % 100;
            if (percentage >= flag.rolloutPercentage) {
                return false;
            }
        }
        if (flag.conditions.length > 0) {
            return this.evaluateConditions(flag.conditions, context);
        }
        if (flag.targetUsers.length > 0 && context?.userId) {
            if (!flag.targetUsers.includes(context.userId)) {
                return false;
            }
        }
        if (flag.targetOrganizations.length > 0 && context?.organizationId) {
            if (!flag.targetOrganizations.includes(context.organizationId)) {
                return false;
            }
        }
        return true;
    }
    getAllFeatureFlags() {
        return Array.from(this.featureFlags.values());
    }
    getFeatureFlagsByEnvironment(environment) {
        return Array.from(this.featureFlags.values()).filter(flag => flag.environment === environment);
    }
    createFeatureFlag(flag) {
        const id = `flag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date();
        const featureFlag = {
            ...flag,
            id,
            createdAt: now,
            updatedAt: now,
        };
        this.featureFlags.set(id, featureFlag);
        logger.info('Feature flag created', {
            flagId: id,
            flagName: flag.name,
            environment: flag.environment,
            enabled: flag.enabled,
        });
        return id;
    }
    updateFeatureFlag(flagId, updates) {
        const flag = this.featureFlags.get(flagId);
        if (!flag) {
            return false;
        }
        const updatedFlag = {
            ...flag,
            ...updates,
            updatedAt: new Date(),
        };
        this.featureFlags.set(flagId, updatedFlag);
        logger.info('Feature flag updated', {
            flagId,
            flagName: updatedFlag.name,
            enabled: updatedFlag.enabled,
        });
        return true;
    }
    deleteFeatureFlag(flagId) {
        const deleted = this.featureFlags.delete(flagId);
        if (deleted) {
            logger.info('Feature flag deleted', { flagId });
        }
        return deleted;
    }
    getEnvironmentConfig(environment) {
        return this.environmentConfigs.get(environment);
    }
    setEnvironmentConfig(environment, config) {
        const existing = this.environmentConfigs.get(environment);
        const now = new Date();
        const environmentConfig = {
            name: environment,
            description: config.description || `Configuration for ${environment} environment`,
            variables: config.variables || {},
            secrets: config.secrets || {},
            featureFlags: config.featureFlags || [],
            overrides: config.overrides || {},
            createdAt: existing?.createdAt || now,
            updatedAt: now,
        };
        this.environmentConfigs.set(environment, environmentConfig);
        logger.info('Environment config updated', {
            environment,
            variablesCount: Object.keys(environmentConfig.variables).length,
            secretsCount: Object.keys(environmentConfig.secrets).length,
        });
        return true;
    }
    getConfigValue(key, environment = 'default', defaultValue) {
        const envConfig = this.environmentConfigs.get(environment);
        if (envConfig?.overrides[key] !== undefined) {
            return envConfig.overrides[key];
        }
        if (envConfig?.variables[key] !== undefined) {
            return envConfig.variables[key];
        }
        const envConfigValues = this.configValues.get(environment);
        if (envConfigValues?.has(key)) {
            return envConfigValues.get(key);
        }
        if (environment !== 'default') {
            return this.getConfigValue(key, 'default', defaultValue);
        }
        return defaultValue;
    }
    setConfigValue(key, value, environment = 'default') {
        if (!this.configValues.has(environment)) {
            this.configValues.set(environment, new Map());
        }
        this.configValues.get(environment).set(key, value);
        logger.debug('Config value set', {
            key,
            environment,
            valueType: typeof value,
        });
        return true;
    }
    getSecret(key, environment = 'default') {
        const envConfig = this.environmentConfigs.get(environment);
        if (envConfig?.secrets[key]) {
            return envConfig.secrets[key];
        }
        const envSecrets = this.secrets.get(environment);
        if (envSecrets?.has(key)) {
            return envSecrets.get(key);
        }
        if (environment !== 'default') {
            return this.getSecret(key, 'default');
        }
        return undefined;
    }
    setSecret(key, value, environment = 'default') {
        if (!this.secrets.has(environment)) {
            this.secrets.set(environment, new Map());
        }
        this.secrets.get(environment).set(key, value);
        logger.debug('Secret set', {
            key,
            environment,
            valueLength: value.length,
        });
        return true;
    }
    validateConfiguration() {
        try {
            for (const flag of this.featureFlags.values()) {
                if (!flag.name || !flag.environment) {
                    logger.error('Invalid feature flag', { flagId: flag.id });
                    return false;
                }
            }
            for (const config of this.environmentConfigs.values()) {
                if (!config.name) {
                    logger.error('Invalid environment config', { environment: config.name });
                    return false;
                }
            }
            logger.info('Configuration validation passed');
            return true;
        }
        catch (error) {
            logger.error('Configuration validation failed', { error: error.message });
            return false;
        }
    }
    reloadConfiguration() {
        logger.info('Reloading configuration');
        this.validateConfiguration();
    }
    getStats() {
        const environments = Array.from(this.environmentConfigs.keys());
        const totalConfigValues = Array.from(this.configValues.values())
            .reduce((sum, envValues) => sum + envValues.size, 0);
        const totalSecrets = Array.from(this.secrets.values())
            .reduce((sum, envSecrets) => sum + envSecrets.size, 0);
        return {
            totalFeatureFlags: this.featureFlags.size,
            enabledFeatureFlags: Array.from(this.featureFlags.values()).filter(f => f.enabled).length,
            environments,
            totalConfigValues,
            totalSecrets,
        };
    }
    initializeDefaultEnvironments() {
        const defaultEnvironments = [
            {
                name: 'development',
                description: 'Development environment',
                variables: {
                    logLevel: 'debug',
                    enableDebugMode: true,
                    apiTimeout: 30000,
                    cacheEnabled: true,
                    cacheTTL: 300,
                },
                secrets: {
                    databaseUrl: 'postgresql://dev:dev@localhost:5432/dev_db',
                    redisUrl: 'redis://localhost:6379',
                },
                featureFlags: [],
                overrides: {},
            },
            {
                name: 'staging',
                description: 'Staging environment',
                variables: {
                    logLevel: 'info',
                    enableDebugMode: false,
                    apiTimeout: 30000,
                    cacheEnabled: true,
                    cacheTTL: 600,
                },
                secrets: {
                    databaseUrl: 'postgresql://staging:staging@staging-db:5432/staging_db',
                    redisUrl: 'redis://staging-redis:6379',
                },
                featureFlags: [],
                overrides: {},
            },
            {
                name: 'production',
                description: 'Production environment',
                variables: {
                    logLevel: 'warn',
                    enableDebugMode: false,
                    apiTimeout: 60000,
                    cacheEnabled: true,
                    cacheTTL: 1800,
                },
                secrets: {
                    databaseUrl: 'postgresql://prod:prod@prod-db:5432/prod_db',
                    redisUrl: 'redis://prod-redis:6379',
                },
                featureFlags: [],
                overrides: {},
            },
        ];
        for (const env of defaultEnvironments) {
            this.setEnvironmentConfig(env.name, env);
        }
    }
    initializeDefaultFeatureFlags() {
        const defaultFlags = [
            {
                name: 'advanced_analytics',
                description: 'Enable advanced analytics features',
                enabled: true,
                environment: 'development',
                rolloutPercentage: 100,
                targetUsers: [],
                targetOrganizations: [],
                conditions: [],
            },
            {
                name: 'beta_features',
                description: 'Enable beta features for testing',
                enabled: true,
                environment: 'development',
                rolloutPercentage: 50,
                targetUsers: [],
                targetOrganizations: [],
                conditions: [],
            },
            {
                name: 'new_ui',
                description: 'Enable new user interface',
                enabled: false,
                environment: 'production',
                rolloutPercentage: 10,
                targetUsers: [],
                targetOrganizations: [],
                conditions: [],
            },
        ];
        for (const flag of defaultFlags) {
            this.createFeatureFlag(flag);
        }
    }
    evaluateConditions(conditions, context) {
        return conditions.every(condition => {
            switch (condition.type) {
                case 'user_id':
                    return context?.userId && this.evaluateCondition(condition, context.userId);
                case 'organization_id':
                    return context?.organizationId && this.evaluateCondition(condition, context.organizationId);
                case 'user_role':
                    return context?.userRole && this.evaluateCondition(condition, context.userRole);
                case 'time_window':
                    return this.evaluateTimeWindow(condition);
                case 'custom':
                    return context?.customAttributes && this.evaluateCustomCondition(condition, context.customAttributes);
                default:
                    return false;
            }
        });
    }
    evaluateCondition(condition, value) {
        switch (condition.operator) {
            case 'equals':
                return value === condition.value;
            case 'contains':
                return String(value).includes(String(condition.value));
            case 'greater_than':
                return Number(value) > Number(condition.value);
            case 'less_than':
                return Number(value) < Number(condition.value);
            case 'in':
                return Array.isArray(condition.value) && condition.value.includes(value);
            case 'not_in':
                return Array.isArray(condition.value) && !condition.value.includes(value);
            default:
                return false;
        }
    }
    evaluateTimeWindow(condition) {
        const now = new Date();
        const startTime = new Date(condition.value.start);
        const endTime = new Date(condition.value.end);
        return now >= startTime && now <= endTime;
    }
    evaluateCustomCondition(condition, attributes) {
        const fieldValue = attributes[condition.field || ''];
        return fieldValue !== undefined && this.evaluateCondition(condition, fieldValue);
    }
    hashContext(context) {
        if (!context) {
            return Math.floor(Math.random() * 100);
        }
        const hashString = `${context.userId || ''}-${context.organizationId || ''}-${context.userRole || ''}`;
        let hash = 0;
        for (let i = 0; i < hashString.length; i++) {
            const char = hashString.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    }
}
export const configurationManager = new InMemoryConfigurationManager();
//# sourceMappingURL=configuration.js.map