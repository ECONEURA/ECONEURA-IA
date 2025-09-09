import { z } from 'zod';

// Schemas de validación
export const FeatureFlagSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  enabled: z.boolean(),
  environment: z.enum(['development', 'staging', 'production']),
  rolloutPercentage: z.number().min(0).max(100).default(100),
  targetUsers: z.array(z.string()).default([]),
  targetOrganizations: z.array(z.string()).default([]),
  conditions: z.array(z.object({
    field: z.string(),
    operator: z.enum(['equals', 'not_equals', 'contains', 'starts_with', 'ends_with', 'greater_than', 'less_than']),
    value: z.union([z.string(), z.number(), z.boolean()])
  })).default([]),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
});

export const EnvironmentSchema = z.object({
  name: z.enum(['development', 'staging', 'production']),
  description: z.string().max(500).optional(),
  variables: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).default({}),
  secrets: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
});

export const ConfigValueSchema = z.object({
  key: z.string().min(1).max(100),
  value: z.union([z.string(), z.number(), z.boolean(), z.object({})]),
  environment: z.enum(['development', 'staging', 'production']).optional(),
  description: z.string().max(500).optional(),
  isSecret: z.boolean().default(false),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
});

export const FeatureFlagCheckSchema = z.object({
  userId: z.string().optional(),
  organizationId: z.string().optional(),
  userRole: z.string().optional(),
  customAttributes: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional()
});

// Tipos
export type FeatureFlag = z.infer<typeof FeatureFlagSchema>;
export type Environment = z.infer<typeof EnvironmentSchema>;
export type ConfigValue = z.infer<typeof ConfigValueSchema>;
export type FeatureFlagCheck = z.infer<typeof FeatureFlagCheckSchema>;

// Servicio de configuración
export class ConfigurationService {
  private featureFlags: Map<string, FeatureFlag> = new Map();
  private environments: Map<string, Environment> = new Map();
  private configValues: Map<string, ConfigValue> = new Map();
  private secrets: Map<string, string> = new Map();

  constructor() {
    this.initializeDefaultData();
  }

  // Inicializar datos por defecto
  private initializeDefaultData() {
    // Feature flags por defecto
    const defaultFlags: FeatureFlag[] = [
      {
        id: 'flag_1',
        name: 'ai_predictions',
        description: 'Enable AI predictions for demand forecasting',
        enabled: true,
        environment: 'development',
        rolloutPercentage: 100,
        targetUsers: [],
        targetOrganizations: [],
        conditions: []
      },
      {
        id: 'flag_2',
        name: 'advanced_analytics',
        description: 'Enable advanced analytics dashboard',
        enabled: false,
        environment: 'development',
        rolloutPercentage: 50,
        targetUsers: [],
        targetOrganizations: [],
        conditions: []
      },
      {
        id: 'flag_3',
        name: 'beta_features',
        description: 'Enable beta features for testing',
        enabled: true,
        environment: 'development',
        rolloutPercentage: 25,
        targetUsers: [],
        targetOrganizations: [],
        conditions: []
      }
    ];

    defaultFlags.forEach(flag => {
      this.featureFlags.set(flag.id!, flag);
    });

    // Environments por defecto
    const defaultEnvironments: Environment[] = [
      {
        name: 'development',
        description: 'Development environment',
        variables: {
          logLevel: 'debug',
          apiTimeout: 30000,
          cacheEnabled: true,
          debugMode: true
        },
        secrets: ['database_url', 'api_key'],
        isActive: true
      },
      {
        name: 'staging',
        description: 'Staging environment',
        variables: {
          logLevel: 'info',
          apiTimeout: 15000,
          cacheEnabled: true,
          debugMode: false
        },
        secrets: ['database_url', 'api_key'],
        isActive: true
      },
      {
        name: 'production',
        description: 'Production environment',
        variables: {
          logLevel: 'warn',
          apiTimeout: 10000,
          cacheEnabled: true,
          debugMode: false
        },
        secrets: ['database_url', 'api_key'],
        isActive: true
      }
    ];

    defaultEnvironments.forEach(env => {
      this.environments.set(env.name, env);
    });

    // Config values por defecto
    const defaultConfigs: ConfigValue[] = [
      {
        key: 'logLevel',
        value: 'info',
        environment: 'development',
        description: 'Logging level for the application',
        isSecret: false
      },
      {
        key: 'apiTimeout',
        value: 30000,
        environment: 'development',
        description: 'API timeout in milliseconds',
        isSecret: false
      },
      {
        key: 'cacheEnabled',
        value: true,
        environment: 'development',
        description: 'Enable caching',
        isSecret: false
      }
    ];

    defaultConfigs.forEach(config => {
      const key = `${config.key}_${config.environment}`;
      this.configValues.set(key, config);
    });
  }

  // Feature Flags
  async getFeatureFlags(environment?: string): Promise<FeatureFlag[]> {
    let flags = Array.from(this.featureFlags.values());

    if (environment) {
      flags = flags.filter(flag => flag.environment === environment);
    }

    return flags;
  }

  async getFeatureFlag(id: string): Promise<FeatureFlag | null> {
    return this.featureFlags.get(id) || null;
  }

  async createFeatureFlag(flag: Omit<FeatureFlag, 'id' | 'createdAt' | 'updatedAt'>): Promise<FeatureFlag> {
    const newFlag: FeatureFlag = {
      ...flag,
      id: `flag_${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.featureFlags.set(newFlag.id!, newFlag);
    return newFlag;
  }

  async updateFeatureFlag(id: string, updates: Partial<FeatureFlag>): Promise<FeatureFlag | null> {
    const existing = this.featureFlags.get(id);
    if (!existing) return null;

    const updated: FeatureFlag = {
      ...existing,
      ...updates,
      updatedAt: new Date()
    };

    this.featureFlags.set(id, updated);
    return updated;
  }

  async deleteFeatureFlag(id: string): Promise<boolean> {
    return this.featureFlags.delete(id);
  }

  async checkFeatureFlag(flagName: string, context: FeatureFlagCheck): Promise<{ isEnabled: boolean; reason?: string }> {
    const flag = Array.from(this.featureFlags.values()).find(f => f.name === flagName);

    if (!flag) {
      return { isEnabled: false, reason: 'Feature flag not found' };
    }

    if (!flag.enabled) {
      return { isEnabled: false, reason: 'Feature flag disabled' };
    }

    // Verificar rollout percentage
    if (flag.rolloutPercentage < 100) {
      const hash = this.hashString(`${context.userId || 'anonymous'}_${flagName}`);
      const percentage = (hash % 100) + 1;

      if (percentage > flag.rolloutPercentage) {
        return { isEnabled: false, reason: 'Not in rollout percentage' };
      }
    }

    // Verificar usuarios objetivo
    if (flag.targetUsers.length > 0 && context.userId) {
      if (!flag.targetUsers.includes(context.userId)) {
        return { isEnabled: false, reason: 'User not in target list' };
      }
    }

    // Verificar organizaciones objetivo
    if (flag.targetOrganizations.length > 0 && context.organizationId) {
      if (!flag.targetOrganizations.includes(context.organizationId)) {
        return { isEnabled: false, reason: 'Organization not in target list' };
      }
    }

    // Verificar condiciones
    if (flag.conditions.length > 0 && context.customAttributes) {
      for (const condition of flag.conditions) {
        const value = context.customAttributes[condition.field];

        if (!this.evaluateCondition(value, condition.operator, condition.value)) {
          return { isEnabled: false, reason: `Condition not met: ${condition.field}` };
        }
      }
    }

    return { isEnabled: true };
  }

  // Environments
  async getEnvironments(): Promise<Environment[]> {
    return Array.from(this.environments.values());
  }

  async getEnvironment(name: string): Promise<Environment | null> {
    return this.environments.get(name) || null;
  }

  async updateEnvironment(name: string, updates: Partial<Environment>): Promise<Environment | null> {
    const existing = this.environments.get(name);
    if (!existing) return null;

    const updated: Environment = {
      ...existing,
      ...updates,
      updatedAt: new Date()
    };

    this.environments.set(name, updated);
    return updated;
  }

  // Config Values
  async getConfigValue(key: string, environment?: string): Promise<ConfigValue | null> {
    const searchKey = environment ? `${key}_${environment}` : key;

    // Buscar por key específica primero
    let config = this.configValues.get(searchKey);

    // Si no se encuentra y hay environment, buscar sin environment
    if (!config && environment) {
      config = this.configValues.get(key);
    }

    return config || null;
  }

  async setConfigValue(key: string, value: any, environment?: string): Promise<ConfigValue> {
    const configKey = environment ? `${key}_${environment}` : key;

    const config: ConfigValue = {
      key,
      value,
      environment,
      isSecret: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.configValues.set(configKey, config);
    return config;
  }

  // Secrets
  async setSecret(key: string, value: string, environment?: string): Promise<void> {
    const secretKey = environment ? `${key}_${environment}` : key;
    this.secrets.set(secretKey, value);
  }

  async getSecret(key: string, environment?: string): Promise<string | null> {
    const secretKey = environment ? `${key}_${environment}` : key;
    return this.secrets.get(secretKey) || null;
  }

  async deleteSecret(key: string, environment?: string): Promise<boolean> {
    const secretKey = environment ? `${key}_${environment}` : key;
    return this.secrets.delete(secretKey);
  }

  // Estadísticas
  async getStats(): Promise<{
    totalFeatureFlags: number;
    totalEnvironments: number;
    totalConfigValues: number;
    totalSecrets: number;
    featureFlagsByEnvironment: Record<string, number>;
    configValuesByEnvironment: Record<string, number>;
  }> {
    const featureFlagsByEnvironment: Record<string, number> = {};
    const configValuesByEnvironment: Record<string, number> = {};

    // Contar feature flags por environment
    for (const flag of this.featureFlags.values()) {
      featureFlagsByEnvironment[flag.environment] = (featureFlagsByEnvironment[flag.environment] || 0) + 1;
    }

    // Contar config values por environment
    for (const config of this.configValues.values()) {
      const env = config.environment || 'default';
      configValuesByEnvironment[env] = (configValuesByEnvironment[env] || 0) + 1;
    }

    return {
      totalFeatureFlags: this.featureFlags.size,
      totalEnvironments: this.environments.size,
      totalConfigValues: this.configValues.size,
      totalSecrets: this.secrets.size,
      featureFlagsByEnvironment,
      configValuesByEnvironment
    };
  }

  // Validación
  async validateConfiguration(): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validar feature flags
    for (const flag of this.featureFlags.values()) {
      if (!flag.name || flag.name.length === 0) {
        errors.push(`Feature flag ${flag.id} has empty name`);
      }

      if (flag.rolloutPercentage < 0 || flag.rolloutPercentage > 100) {
        errors.push(`Feature flag ${flag.name} has invalid rollout percentage`);
      }
    }

    // Validar environments
    for (const env of this.environments.values()) {
      if (!env.name || env.name.length === 0) {
        errors.push(`Environment ${env.name} has empty name`);
      }
    }

    // Validar config values
    for (const config of this.configValues.values()) {
      if (!config.key || config.key.length === 0) {
        errors.push(`Config value has empty key`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Recargar configuración
  async reloadConfiguration(): Promise<{ success: boolean; message: string }> {
    try {
      // Limpiar datos existentes
      this.featureFlags.clear();
      this.environments.clear();
      this.configValues.clear();
      this.secrets.clear();

      // Reinicializar con datos por defecto
      this.initializeDefaultData();

      return {
        success: true,
        message: 'Configuration reloaded successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to reload configuration: ${error}`
      };
    }
  }

  // Utilidades privadas
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private evaluateCondition(value: any, operator: string, expectedValue: any): boolean {
    switch (operator) {
      case 'equals':
        return value === expectedValue;
      case 'not_equals':
        return value !== expectedValue;
      case 'contains':
        return typeof value === 'string' && value.includes(expectedValue);
      case 'starts_with':
        return typeof value === 'string' && value.startsWith(expectedValue);
      case 'ends_with':
        return typeof value === 'string' && value.endsWith(expectedValue);
      case 'greater_than':
        return typeof value === 'number' && value > expectedValue;
      case 'less_than':
        return typeof value === 'number' && value < expectedValue;
      default:
        return false;
    }
  }
}

// Instancia singleton
export const configurationService = new ConfigurationService();
