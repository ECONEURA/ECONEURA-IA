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
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
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
  createdAt: string;
  updatedAt: string;
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

export class WebConfigurationSystem {
  private featureFlags: Map<string, FeatureFlag> = new Map();
  private environmentConfigs: Map<string, EnvironmentConfig> = new Map();
  private configValues: Map<string, Map<string, any>> = new Map();
  private secrets: Map<string, Map<string, string>> = new Map();

  constructor() {
    this.initializeDefaultEnvironments();
    this.initializeDefaultFeatureFlags();
    
  }

  getFeatureFlag(flagId: string): FeatureFlag | undefined {
    return this.featureFlags.get(flagId);
  }

  isFeatureEnabled(flagId: string, context?: FeatureFlagContext): boolean {
    const flag = this.featureFlags.get(flagId);
    if (!flag) {
      return false;
    }

    // Verificar si el flag está habilitado globalmente
    if (!flag.enabled) {
      return false;
    }

    // Verificar fecha de expiración
    if (flag.expiresAt && new Date() > new Date(flag.expiresAt)) {
      return false;
    }

    // Verificar rollout percentage
    if (flag.rolloutPercentage < 100) {
      const hash = this.hashContext(context);
      const percentage = hash % 100;
      if (percentage >= flag.rolloutPercentage) {
        return false;
      }
    }

    // Verificar condiciones
    if (flag.conditions.length > 0) {
      return this.evaluateConditions(flag.conditions, context);
    }

    // Verificar target users
    if (flag.targetUsers.length > 0 && context?.userId) {
      if (!flag.targetUsers.includes(context.userId)) {
        return false;
      }
    }

    // Verificar target organizations
    if (flag.targetOrganizations.length > 0 && context?.organizationId) {
      if (!flag.targetOrganizations.includes(context.organizationId)) {
        return false;
      }
    }

    return true;
  }

  getAllFeatureFlags(): FeatureFlag[] {
    return Array.from(this.featureFlags.values());
  }

  getFeatureFlagsByEnvironment(environment: string): FeatureFlag[] {
    return Array.from(this.featureFlags.values()).filter(flag => flag.environment === environment);
  }

  createFeatureFlag(flag: Omit<FeatureFlag, 'id' | 'createdAt' | 'updatedAt'>): string {
    const id = `flag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    const featureFlag: FeatureFlag = {
      ...flag,
      id,
      createdAt: now,
      updatedAt: now,
    };

    this.featureFlags.set(id, featureFlag);

    console.log('Feature flag created in web system', {
      flagId: id,
      flagName: flag.name,
      environment: flag.environment,
      enabled: flag.enabled,
    });

    return id;
  }

  updateFeatureFlag(flagId: string, updates: Partial<FeatureFlag>): boolean {
    const flag = this.featureFlags.get(flagId);
    if (!flag) {
      return false;
    }

    const updatedFlag: FeatureFlag = {
      ...flag,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.featureFlags.set(flagId, updatedFlag);

    console.log('Feature flag updated in web system', {
      flagId,
      flagName: updatedFlag.name,
      enabled: updatedFlag.enabled,
    });

    return true;
  }

  deleteFeatureFlag(flagId: string): boolean {
    const deleted = this.featureFlags.delete(flagId);
    if (deleted) {
      
    }
    return deleted;
  }

  getEnvironmentConfig(environment: string): EnvironmentConfig | undefined {
    return this.environmentConfigs.get(environment);
  }

  setEnvironmentConfig(environment: string, config: Partial<EnvironmentConfig>): boolean {
    const existing = this.environmentConfigs.get(environment);
    const now = new Date().toISOString();

    const environmentConfig: EnvironmentConfig = {
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

    console.log('Environment config updated in web system', {
      environment,
      variablesCount: Object.keys(environmentConfig.variables).length,
      secretsCount: Object.keys(environmentConfig.secrets).length,
    });

    return true;
  }

  getConfigValue(key: string, environment: string = 'default', defaultValue?: any): any {
    // Buscar en overrides del environment
    const envConfig = this.environmentConfigs.get(environment);
    if (envConfig?.overrides[key] !== undefined) {
      return envConfig.overrides[key];
    }

    // Buscar en variables del environment
    if (envConfig?.variables[key] !== undefined) {
      return envConfig.variables[key];
    }

    // Buscar en config values específicos
    const envConfigValues = this.configValues.get(environment);
    if (envConfigValues?.has(key)) {
      return envConfigValues.get(key);
    }

    // Buscar en environment por defecto
    if (environment !== 'default') {
      return this.getConfigValue(key, 'default', defaultValue);
    }

    return defaultValue;
  }

  setConfigValue(key: string, value: any, environment: string = 'default'): boolean {
    if (!this.configValues.has(environment)) {
      this.configValues.set(environment, new Map());
    }

    this.configValues.get(environment)!.set(key, value);

    console.log('Config value set in web system', {
      key,
      environment,
      valueType: typeof value,
    });

    return true;
  }

  getSecret(key: string, environment: string = 'default'): string | undefined {
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

  setSecret(key: string, value: string, environment: string = 'default'): boolean {
    if (!this.secrets.has(environment)) {
      this.secrets.set(environment, new Map());
    }

    this.secrets.get(environment)!.set(key, value);

    console.log('Secret set in web system', {
      key,
      environment,
      valueLength: value.length,
    });

    return true;
  }

  validateConfiguration(): boolean {
    try {
      // Validar feature flags
      for (const flag of this.featureFlags.values()) {
        if (!flag.name || !flag.environment) {
          console.error('Invalid feature flag', { flagId: flag.id });
          return false;
        }
      }

      // Validar environment configs
      for (const config of this.environmentConfigs.values()) {
        if (!config.name) {
          console.error('Invalid environment config', { environment: config.name });
          return false;
        }
      }

      
      return true;
    } catch (error) {
      console.error('Configuration validation failed in web system', { error: (error as Error).message });
      return false;
    }
  }

  reloadConfiguration(): void {
    
    this.validateConfiguration();
  }

  getStats(): ConfigurationStats {
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

  private initializeDefaultEnvironments(): void {
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

  private initializeDefaultFeatureFlags(): void {
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

  private evaluateConditions(conditions: FeatureFlagCondition[], context?: FeatureFlagContext): boolean {
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

  private evaluateCondition(condition: FeatureFlagCondition, value: any): boolean {
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

  private evaluateTimeWindow(condition: FeatureFlagCondition): boolean {
    const now = new Date();
    const startTime = new Date(condition.value.start);
    const endTime = new Date(condition.value.end);
    return now >= startTime && now <= endTime;
  }

  private evaluateCustomCondition(condition: FeatureFlagCondition, attributes: Record<string, any>): boolean {
    const fieldValue = attributes[condition.field || ''];
    return fieldValue !== undefined && this.evaluateCondition(condition, fieldValue);
  }

  private hashContext(context?: FeatureFlagContext): number {
    if (!context) {
      return Math.floor(Math.random() * 100);
    }

    const hashString = `${context.userId || ''}-${context.organizationId || ''}-${context.userRole || ''}`;
    let hash = 0;
    for (let i = 0; i < hashString.length; i++) {
      const char = hashString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}

// Instancia global
export const webConfigurationSystem = new WebConfigurationSystem();
