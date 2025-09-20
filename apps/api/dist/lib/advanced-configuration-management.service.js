import { z } from 'zod';
import { logger } from './logger.js';
export const AdvancedConfigSchema = z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    category: z.enum(['system', 'feature', 'integration', 'security', 'performance', 'monitoring']),
    type: z.enum(['string', 'number', 'boolean', 'object', 'array', 'json']),
    value: z.any(),
    defaultValue: z.any(),
    environment: z.enum(['development', 'staging', 'production', 'all']),
    isSecret: z.boolean().default(false),
    isRequired: z.boolean().default(false),
    validation: z.object({
        min: z.number().optional(),
        max: z.number().optional(),
        pattern: z.string().optional(),
        enum: z.array(z.any()).optional(),
        custom: z.string().optional()
    }).optional(),
    dependencies: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    version: z.string().default('1.0.0'),
    isActive: z.boolean().default(true),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
    createdBy: z.string().optional(),
    updatedBy: z.string().optional()
});
export const ConfigTemplateSchema = z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    category: z.enum(['system', 'feature', 'integration', 'security', 'performance', 'monitoring']),
    template: z.record(z.string(), z.any()),
    variables: z.array(z.object({
        name: z.string(),
        type: z.enum(['string', 'number', 'boolean', 'object', 'array']),
        required: z.boolean().default(false),
        defaultValue: z.any().optional(),
        description: z.string().optional()
    })).default([]),
    isActive: z.boolean().default(true),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional()
});
export const ConfigDeploymentSchema = z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    environment: z.enum(['development', 'staging', 'production']),
    configs: z.array(z.string()),
    deploymentStrategy: z.enum(['immediate', 'gradual', 'canary', 'blue_green']),
    rolloutPercentage: z.number().min(0).max(100).default(100),
    schedule: z.object({
        enabled: z.boolean().default(false),
        cron: z.string().optional(),
        timezone: z.string().default('UTC')
    }).optional(),
    rollbackConfig: z.object({
        enabled: z.boolean().default(true),
        autoRollback: z.boolean().default(false),
        rollbackConditions: z.array(z.string()).default([])
    }).optional(),
    status: z.enum(['pending', 'in_progress', 'completed', 'failed', 'rolled_back']).default('pending'),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
    deployedAt: z.date().optional(),
    deployedBy: z.string().optional()
});
export const ConfigAuditSchema = z.object({
    id: z.string().uuid().optional(),
    configId: z.string(),
    action: z.enum(['create', 'update', 'delete', 'deploy', 'rollback']),
    oldValue: z.any().optional(),
    newValue: z.any().optional(),
    environment: z.enum(['development', 'staging', 'production']),
    userId: z.string(),
    timestamp: z.date(),
    reason: z.string().optional(),
    metadata: z.record(z.string(), z.any()).optional()
});
export class AdvancedConfigurationManagementService {
    configs = new Map();
    templates = new Map();
    deployments = new Map();
    auditLog = [];
    configCache = new Map();
    validationRules = new Map();
    constructor() {
        this.initializeDefaultData();
        this.initializeValidationRules();
    }
    initializeDefaultData() {
        const defaultConfigs = [
            {
                id: 'config_1',
                name: 'api_rate_limit',
                description: 'API rate limiting configuration',
                category: 'performance',
                type: 'number',
                value: 1000,
                defaultValue: 1000,
                environment: 'all',
                isSecret: false,
                isRequired: true,
                validation: {
                    min: 1,
                    max: 10000
                },
                dependencies: [],
                tags: ['api', 'performance', 'rate-limiting'],
                version: '1.0.0',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                createdBy: 'system',
                updatedBy: 'system'
            },
            {
                id: 'config_2',
                name: 'cache_ttl',
                description: 'Cache time-to-live in seconds',
                category: 'performance',
                type: 'number',
                value: 3600,
                defaultValue: 3600,
                environment: 'all',
                isSecret: false,
                isRequired: true,
                validation: {
                    min: 60,
                    max: 86400
                },
                dependencies: [],
                tags: ['cache', 'performance'],
                version: '1.0.0',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                createdBy: 'system',
                updatedBy: 'system'
            },
            {
                id: 'config_3',
                name: 'database_pool_size',
                description: 'Database connection pool size',
                category: 'system',
                type: 'number',
                value: 10,
                defaultValue: 10,
                environment: 'production',
                isSecret: false,
                isRequired: true,
                validation: {
                    min: 1,
                    max: 100
                },
                dependencies: ['database_url'],
                tags: ['database', 'system'],
                version: '1.0.0',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                createdBy: 'system',
                updatedBy: 'system'
            },
            {
                id: 'config_4',
                name: 'ai_model_endpoint',
                description: 'AI model endpoint URL',
                category: 'integration',
                type: 'string',
                value: 'https://api.openai.com/v1',
                defaultValue: 'https://api.openai.com/v1',
                environment: 'all',
                isSecret: false,
                isRequired: true,
                validation: {
                    pattern: '^https?://.*'
                },
                dependencies: [],
                tags: ['ai', 'integration', 'endpoint'],
                version: '1.0.0',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                createdBy: 'system',
                updatedBy: 'system'
            },
            {
                id: 'config_5',
                name: 'security_headers',
                description: 'Security headers configuration',
                category: 'security',
                type: 'object',
                value: {
                    'X-Frame-Options': 'DENY',
                    'X-Content-Type-Options': 'nosniff',
                    'X-XSS-Protection': '1; mode=block'
                },
                defaultValue: {
                    'X-Frame-Options': 'DENY',
                    'X-Content-Type-Options': 'nosniff',
                    'X-XSS-Protection': '1; mode=block'
                },
                environment: 'all',
                isSecret: false,
                isRequired: true,
                dependencies: [],
                tags: ['security', 'headers'],
                version: '1.0.0',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                createdBy: 'system',
                updatedBy: 'system'
            }
        ];
        defaultConfigs.forEach(config => {
            this.configs.set(config.id, config);
        });
        const defaultTemplates = [
            {
                id: 'template_1',
                name: 'api_configuration',
                description: 'Standard API configuration template',
                category: 'system',
                template: {
                    rate_limit: '{{rate_limit}}',
                    timeout: '{{timeout}}',
                    retries: '{{retries}}',
                    cache_enabled: '{{cache_enabled}}'
                },
                variables: [
                    {
                        name: 'rate_limit',
                        type: 'number',
                        required: true,
                        defaultValue: 1000,
                        description: 'Maximum requests per minute'
                    },
                    {
                        name: 'timeout',
                        type: 'number',
                        required: true,
                        defaultValue: 30000,
                        description: 'Request timeout in milliseconds'
                    },
                    {
                        name: 'retries',
                        type: 'number',
                        required: false,
                        defaultValue: 3,
                        description: 'Number of retry attempts'
                    },
                    {
                        name: 'cache_enabled',
                        type: 'boolean',
                        required: false,
                        defaultValue: true,
                        description: 'Enable caching'
                    }
                ],
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ];
        defaultTemplates.forEach(template => {
            this.templates.set(template.id, template);
        });
    }
    initializeValidationRules() {
        this.validationRules.set('email', (value) => {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        });
        this.validationRules.set('url', (value) => {
            try {
                new URL(value);
                return true;
            }
            catch {
                return false;
            }
        });
        this.validationRules.set('uuid', (value) => {
            return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
        });
        this.validationRules.set('json', (value) => {
            try {
                JSON.parse(typeof value === 'string' ? value : JSON.stringify(value));
                return true;
            }
            catch {
                return false;
            }
        });
    }
    async getConfigs(filters) {
        let configs = Array.from(this.configs.values());
        if (filters) {
            if (filters.category) {
                configs = configs.filter(c => c.category === filters.category);
            }
            if (filters.environment) {
                configs = configs.filter(c => c.environment === filters.environment || c.environment === 'all');
            }
            if (filters.isActive !== undefined) {
                configs = configs.filter(c => c.isActive === filters.isActive);
            }
            if (filters.tags && filters.tags.length > 0) {
                configs = configs.filter(c => filters.tags.some(tag => c.tags.includes(tag)));
            }
        }
        return configs;
    }
    async getConfig(id) {
        return this.configs.get(id) || null;
    }
    async getConfigByName(name, environment) {
        const configs = Array.from(this.configs.values());
        return configs.find(c => c.name === name &&
            (c.environment === environment || c.environment === 'all')) || null;
    }
    async createConfig(config) {
        const validation = await this.validateConfig(config);
        if (!validation.isValid) {
            throw new Error(`Configuration validation failed: ${validation.errors.join(', ')}`);
        }
        const newConfig = {
            ...config,
            id: `config_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        this.configs.set(newConfig.id, newConfig);
        this.auditLog.push({
            id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            configId: newConfig.id,
            action: 'create',
            newValue: newConfig.value,
            environment: newConfig.environment,
            userId: newConfig.createdBy || 'system',
            timestamp: new Date(),
            reason: 'Configuration created',
            metadata: { category: newConfig.category, type: newConfig.type }
        });
        logger.info('Configuration created', {
            configId: newConfig.id,
            name: newConfig.name,
            category: newConfig.category,
            environment: newConfig.environment
        });
        return newConfig;
    }
    async updateConfig(id, updates, userId) {
        const existing = this.configs.get(id);
        if (!existing)
            return null;
        const updatedConfig = { ...existing, ...updates };
        const validation = await this.validateConfig(updatedConfig);
        if (!validation.isValid) {
            throw new Error(`Configuration validation failed: ${validation.errors.join(', ')}`);
        }
        const updated = {
            ...existing,
            ...updates,
            updatedAt: new Date(),
            updatedBy: userId
        };
        this.configs.set(id, updated);
        this.auditLog.push({
            id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            configId: id,
            action: 'update',
            oldValue: existing.value,
            newValue: updated.value,
            environment: updated.environment,
            userId,
            timestamp: new Date(),
            reason: updates.reason || 'Configuration updated',
            metadata: {
                changedFields: Object.keys(updates),
                category: updated.category,
                type: updated.type
            }
        });
        this.configCache.delete(id);
        logger.info('Configuration updated', {
            configId: id,
            name: updated.name,
            changedFields: Object.keys(updates),
            userId
        });
        return updated;
    }
    async deleteConfig(id, userId) {
        const existing = this.configs.get(id);
        if (!existing)
            return false;
        this.configs.delete(id);
        this.auditLog.push({
            id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            configId: id,
            action: 'delete',
            oldValue: existing.value,
            environment: existing.environment,
            userId,
            timestamp: new Date(),
            reason: 'Configuration deleted',
            metadata: {
                name: existing.name,
                category: existing.category,
                type: existing.type
            }
        });
        this.configCache.delete(id);
        logger.info('Configuration deleted', {
            configId: id,
            name: existing.name,
            userId
        });
        return true;
    }
    async validateConfig(config) {
        const errors = [];
        const warnings = [];
        if (!config.name || config.name.length === 0) {
            errors.push('Configuration name is required');
        }
        if (config.type && config.value !== undefined) {
            switch (config.type) {
                case 'string':
                    if (typeof config.value !== 'string') {
                        errors.push('Value must be a string');
                    }
                    break;
                case 'number':
                    if (typeof config.value !== 'number') {
                        errors.push('Value must be a number');
                    }
                    break;
                case 'boolean':
                    if (typeof config.value !== 'boolean') {
                        errors.push('Value must be a boolean');
                    }
                    break;
                case 'object':
                    if (typeof config.value !== 'object' || Array.isArray(config.value)) {
                        errors.push('Value must be an object');
                    }
                    break;
                case 'array':
                    if (!Array.isArray(config.value)) {
                        errors.push('Value must be an array');
                    }
                    break;
            }
        }
        if (config.validation) {
            const validation = config.validation;
            if (validation.min !== undefined && typeof config.value === 'number' && config.value < validation.min) {
                errors.push(`Value must be at least ${validation.min}`);
            }
            if (validation.max !== undefined && typeof config.value === 'number' && config.value > validation.max) {
                errors.push(`Value must be at most ${validation.max}`);
            }
            if (validation.pattern && typeof config.value === 'string') {
                const regex = new RegExp(validation.pattern);
                if (!regex.test(config.value)) {
                    errors.push(`Value does not match required pattern: ${validation.pattern}`);
                }
            }
            if (validation.enum && !validation.enum.includes(config.value)) {
                errors.push(`Value must be one of: ${validation.enum.join(', ')}`);
            }
            if (validation.custom) {
                const customValidator = this.validationRules.get(validation.custom);
                if (customValidator && !customValidator(config.value)) {
                    errors.push(`Value failed custom validation: ${validation.custom}`);
                }
            }
        }
        if (config.dependencies && config.dependencies.length > 0) {
            for (const depId of config.dependencies) {
                const depConfig = this.configs.get(depId);
                if (!depConfig) {
                    errors.push(`Dependency configuration not found: ${depId}`);
                }
                else if (!depConfig.isActive) {
                    warnings.push(`Dependency configuration is inactive: ${depId}`);
                }
            }
        }
        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }
    async getTemplates() {
        return Array.from(this.templates.values());
    }
    async getTemplate(id) {
        return this.templates.get(id) || null;
    }
    async createTemplate(template) {
        const newTemplate = {
            ...template,
            id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        this.templates.set(newTemplate.id, newTemplate);
        return newTemplate;
    }
    async generateConfigFromTemplate(templateId, variables) {
        const template = this.templates.get(templateId);
        if (!template) {
            throw new Error(`Template not found: ${templateId}`);
        }
        const configs = [];
        for (const [key, value] of Object.entries(template.template)) {
            let processedValue = value;
            if (typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}')) {
                const varName = value.slice(2, -2);
                processedValue = variables[varName] || template.variables.find(v => v.name === varName)?.defaultValue;
            }
            const config = {
                id: `config_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                name: key,
                description: `Generated from template: ${template.name}`,
                category: template.category,
                type: typeof processedValue === 'string' ? 'string' :
                    typeof processedValue === 'number' ? 'number' :
                        typeof processedValue === 'boolean' ? 'boolean' : 'object',
                value: processedValue,
                defaultValue: processedValue,
                environment: 'all',
                isSecret: false,
                isRequired: false,
                dependencies: [],
                tags: ['template-generated'],
                version: '1.0.0',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                createdBy: 'template-system',
                updatedBy: 'template-system'
            };
            configs.push(config);
        }
        return configs;
    }
    async createDeployment(deployment) {
        const newDeployment = {
            ...deployment,
            id: `deployment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            status: 'pending',
            createdAt: new Date(),
            updatedAt: new Date()
        };
        this.deployments.set(newDeployment.id, newDeployment);
        return newDeployment;
    }
    async executeDeployment(deploymentId, userId) {
        const deployment = this.deployments.get(deploymentId);
        if (!deployment) {
            return { success: false, message: 'Deployment not found' };
        }
        try {
            deployment.status = 'in_progress';
            deployment.updatedAt = new Date();
            deployment.deployedBy = userId;
            await new Promise(resolve => setTimeout(resolve, 1000));
            deployment.status = 'completed';
            deployment.deployedAt = new Date();
            deployment.updatedAt = new Date();
            this.auditLog.push({
                id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                configId: deploymentId,
                action: 'deploy',
                environment: deployment.environment,
                userId,
                timestamp: new Date(),
                reason: 'Configuration deployed',
                metadata: {
                    deploymentName: deployment.name,
                    configsCount: deployment.configs.length,
                    strategy: deployment.deploymentStrategy
                }
            });
            logger.info('Configuration deployment completed', {
                deploymentId,
                deploymentName: deployment.name,
                environment: deployment.environment,
                userId
            });
            return { success: true, message: 'Deployment completed successfully' };
        }
        catch (error) {
            deployment.status = 'failed';
            deployment.updatedAt = new Date();
            logger.error('Configuration deployment failed', {
                deploymentId,
                deploymentName: deployment.name,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return { success: false, message: `Deployment failed: ${error}` };
        }
    }
    async getAuditLog(filters) {
        let audit = [...this.auditLog];
        if (filters) {
            if (filters.configId) {
                audit = audit.filter(a => a.configId === filters.configId);
            }
            if (filters.action) {
                audit = audit.filter(a => a.action === filters.action);
            }
            if (filters.userId) {
                audit = audit.filter(a => a.userId === filters.userId);
            }
            if (filters.startDate) {
                audit = audit.filter(a => a.timestamp >= filters.startDate);
            }
            if (filters.endDate) {
                audit = audit.filter(a => a.timestamp <= filters.endDate);
            }
        }
        return audit.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }
    async getMetrics() {
        const configs = Array.from(this.configs.values());
        const deployments = Array.from(this.deployments.values());
        const configsByCategory = {};
        const configsByEnvironment = {};
        configs.forEach(config => {
            configsByCategory[config.category] = (configsByCategory[config.category] || 0) + 1;
            configsByEnvironment[config.environment] = (configsByEnvironment[config.environment] || 0) + 1;
        });
        const recentChanges = this.auditLog.filter(a => {
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            return a.timestamp >= oneDayAgo;
        }).length;
        const successfulDeployments = deployments.filter(d => d.status === 'completed').length;
        const totalDeployments = deployments.length;
        const deploymentSuccessRate = totalDeployments > 0 ? (successfulDeployments / totalDeployments) * 100 : 0;
        return {
            totalConfigs: configs.length,
            configsByCategory,
            configsByEnvironment,
            activeConfigs: configs.filter(c => c.isActive).length,
            inactiveConfigs: configs.filter(c => !c.isActive).length,
            secretConfigs: configs.filter(c => c.isSecret).length,
            recentChanges,
            deploymentSuccessRate
        };
    }
    async getConfigValue(name, environment) {
        const cacheKey = `${name}_${environment || 'default'}`;
        if (this.configCache.has(cacheKey)) {
            return this.configCache.get(cacheKey);
        }
        const config = await this.getConfigByName(name, environment);
        if (config && config.isActive) {
            this.configCache.set(cacheKey, config.value);
            return config.value;
        }
        return null;
    }
    async clearCache() {
        this.configCache.clear();
        logger.info('Configuration cache cleared');
    }
    async exportConfigs(environment) {
        const configs = await this.getConfigs({ environment, isActive: true });
        const exportData = {};
        configs.forEach(config => {
            exportData[config.name] = config.value;
        });
        return exportData;
    }
    async importConfigs(configs, environment, userId) {
        const errors = [];
        let imported = 0;
        for (const [name, value] of Object.entries(configs)) {
            try {
                await this.createConfig({
                    name,
                    description: `Imported configuration: ${name}`,
                    category: 'system',
                    type: typeof value === 'string' ? 'string' :
                        typeof value === 'number' ? 'number' :
                            typeof value === 'boolean' ? 'boolean' : 'object',
                    value,
                    defaultValue: value,
                    environment: environment,
                    isSecret: false,
                    isRequired: false,
                    dependencies: [],
                    tags: ['imported'],
                    version: '1.0.0',
                    isActive: true,
                    createdBy: userId,
                    updatedBy: userId
                });
                imported++;
            }
            catch (error) {
                errors.push(`Failed to import ${name}: ${error}`);
            }
        }
        return { success: errors.length === 0, imported, errors };
    }
}
export const advancedConfigurationManagementService = new AdvancedConfigurationManagementService();
//# sourceMappingURL=advanced-configuration-management.service.js.map