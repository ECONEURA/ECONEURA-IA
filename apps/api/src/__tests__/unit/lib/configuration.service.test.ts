import { describe, it, expect, beforeEach } from 'vitest';
import { ConfigurationService, FeatureFlagSchema, EnvironmentSchema, ConfigValueSchema } from '../../../lib/configuration.service.js';

describe('ConfigurationService', () => {
  let service: ConfigurationService;

  beforeEach(() => {
    service = new ConfigurationService();
  });

  describe('Feature Flags', () => {
    it('should initialize with default feature flags', async () => {
      const flags = await service.getFeatureFlags();
      expect(flags).toHaveLength(3);
      expect(flags[0].name).toBe('ai_predictions');
      expect(flags[1].name).toBe('advanced_analytics');
      expect(flags[2].name).toBe('beta_features');
    });

    it('should get feature flags by environment', async () => {
      const flags = await service.getFeatureFlags('development');
      expect(flags).toHaveLength(3);
      expect(flags.every(flag => flag.environment === 'development')).toBe(true);
    });

    it('should create a new feature flag', async () => {
      const newFlag = {
        name: 'test_flag',
        description: 'Test feature flag',
        enabled: true,
        environment: 'development' as const,
        rolloutPercentage: 100,
        targetUsers: [],
        targetOrganizations: [],
        conditions: []
      };

      const created = await service.createFeatureFlag(newFlag);
      expect(created.name).toBe('test_flag');
      expect(created.id).toBeDefined();
      expect(created.createdAt).toBeDefined();
    });

    it('should update a feature flag', async () => {
      const flags = await service.getFeatureFlags();
      const flag = flags[0];

      const updated = await service.updateFeatureFlag(flag.id!, { enabled: false });
      expect(updated?.enabled).toBe(false);
      expect(updated?.updatedAt).toBeDefined();
    });

    it('should delete a feature flag', async () => {
      const flags = await service.getFeatureFlags();
      const flag = flags[0];

      const deleted = await service.deleteFeatureFlag(flag.id!);
      expect(deleted).toBe(true);

      const retrieved = await service.getFeatureFlag(flag.id!);
      expect(retrieved).toBeNull();
    });

    it('should check feature flag with context', async () => {
      const result = await service.checkFeatureFlag('ai_predictions', {
        userId: 'user123',
        organizationId: 'org456'
      });

      expect(result.isEnabled).toBe(true);
    });

    it('should respect rollout percentage', async () => {
      // Crear un flag con 0% rollout
      const flag = await service.createFeatureFlag({
        name: 'zero_rollout',
        description: 'Zero rollout flag',
        enabled: true,
        environment: 'development',
        rolloutPercentage: 0,
        targetUsers: [],
        targetOrganizations: [],
        conditions: []
      });

      const result = await service.checkFeatureFlag('zero_rollout', {
        userId: 'user123'
      });

      expect(result.isEnabled).toBe(false);
      expect(result.reason).toBe('Not in rollout percentage');
    });

    it('should check target users', async () => {
      const flag = await service.createFeatureFlag({
        name: 'targeted_flag',
        description: 'Targeted flag',
        enabled: true,
        environment: 'development',
        rolloutPercentage: 100,
        targetUsers: ['user123'],
        targetOrganizations: [],
        conditions: []
      });

      // Usuario en la lista objetivo
      const result1 = await service.checkFeatureFlag('targeted_flag', {
        userId: 'user123'
      });
      expect(result1.isEnabled).toBe(true);

      // Usuario no en la lista objetivo
      const result2 = await service.checkFeatureFlag('targeted_flag', {
        userId: 'user456'
      });
      expect(result2.isEnabled).toBe(false);
      expect(result2.reason).toBe('User not in target list');
    });

    it('should check target organizations', async () => {
      const flag = await service.createFeatureFlag({
        name: 'org_targeted_flag',
        description: 'Organization targeted flag',
        enabled: true,
        environment: 'development',
        rolloutPercentage: 100,
        targetUsers: [],
        targetOrganizations: ['org123'],
        conditions: []
      });

      // Organización en la lista objetivo
      const result1 = await service.checkFeatureFlag('org_targeted_flag', {
        organizationId: 'org123'
      });
      expect(result1.isEnabled).toBe(true);

      // Organización no en la lista objetivo
      const result2 = await service.checkFeatureFlag('org_targeted_flag', {
        organizationId: 'org456'
      });
      expect(result2.isEnabled).toBe(false);
      expect(result2.reason).toBe('Organization not in target list');
    });

    it('should evaluate conditions', async () => {
      const flag = await service.createFeatureFlag({
        name: 'conditional_flag',
        description: 'Conditional flag',
        enabled: true,
        environment: 'development',
        rolloutPercentage: 100,
        targetUsers: [],
        targetOrganizations: [],
        conditions: [
          {
            field: 'userRole',
            operator: 'equals',
            value: 'admin'
          }
        ]
      });

      // Condición cumplida
      const result1 = await service.checkFeatureFlag('conditional_flag', {
        customAttributes: { userRole: 'admin' }
      });
      expect(result1.isEnabled).toBe(true);

      // Condición no cumplida
      const result2 = await service.checkFeatureFlag('conditional_flag', {
        customAttributes: { userRole: 'user' }
      });
      expect(result2.isEnabled).toBe(false);
      expect(result2.reason).toBe('Condition not met: userRole');
    });
  });

  describe('Environments', () => {
    it('should get all environments', async () => {
      const environments = await service.getEnvironments();
      expect(environments).toHaveLength(3);
      expect(environments.map(e => e.name)).toEqual(['development', 'staging', 'production']);
    });

    it('should get specific environment', async () => {
      const env = await service.getEnvironment('development');
      expect(env?.name).toBe('development');
      expect(env?.variables.logLevel).toBe('debug');
    });

    it('should update environment', async () => {
      const updated = await service.updateEnvironment('development', {
        variables: { logLevel: 'info' }
      });

      expect(updated?.variables.logLevel).toBe('info');
      expect(updated?.updatedAt).toBeDefined();
    });
  });

  describe('Config Values', () => {
    it('should get config value', async () => {
      const config = await service.getConfigValue('logLevel', 'development');
      expect(config?.key).toBe('logLevel');
      expect(config?.value).toBe('info');
    });

    it('should set config value', async () => {
      const config = await service.setConfigValue('testKey', 'testValue', 'development');
      expect(config.key).toBe('testKey');
      expect(config.value).toBe('testValue');
      expect(config.environment).toBe('development');
    });

    it('should get config value without environment', async () => {
      const config = await service.setConfigValue('globalKey', 'globalValue');
      const retrieved = await service.getConfigValue('globalKey');
      expect(retrieved?.value).toBe('globalValue');
    });
  });

  describe('Secrets', () => {
    it('should set and get secret', async () => {
      await service.setSecret('testSecret', 'secretValue', 'development');
      const secret = await service.getSecret('testSecret', 'development');
      expect(secret).toBe('secretValue');
    });

    it('should delete secret', async () => {
      await service.setSecret('tempSecret', 'tempValue');
      const deleted = await service.deleteSecret('tempSecret');
      expect(deleted).toBe(true);

      const secret = await service.getSecret('tempSecret');
      expect(secret).toBeNull();
    });
  });

  describe('Statistics', () => {
    it('should get configuration stats', async () => {
      const stats = await service.getStats();

      expect(stats.totalFeatureFlags).toBeGreaterThan(0);
      expect(stats.totalEnvironments).toBe(3);
      expect(stats.totalConfigValues).toBeGreaterThan(0);
      expect(stats.featureFlagsByEnvironment).toHaveProperty('development');
      expect(stats.configValuesByEnvironment).toHaveProperty('development');
    });
  });

  describe('Validation', () => {
    it('should validate configuration', async () => {
      const validation = await service.validateConfiguration();

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect invalid feature flags', async () => {
      // Crear un flag inválido
      await service.createFeatureFlag({
        name: '', // Nombre vacío
        description: 'Invalid flag',
        enabled: true,
        environment: 'development',
        rolloutPercentage: 150, // Porcentaje inválido
        targetUsers: [],
        targetOrganizations: [],
        conditions: []
      });

      const validation = await service.validateConfiguration();
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Reload', () => {
    it('should reload configuration', async () => {
      const result = await service.reloadConfiguration();

      expect(result.success).toBe(true);
      expect(result.message).toBe('Configuration reloaded successfully');

      // Verificar que los datos se reinicializaron
      const flags = await service.getFeatureFlags();
      expect(flags).toHaveLength(3);
    });
  });

  describe('Schema Validation', () => {
    it('should validate FeatureFlagSchema', () => {
      const validFlag = {
        name: 'test',
        enabled: true,
        environment: 'development' as const,
        rolloutPercentage: 100,
        targetUsers: [],
        targetOrganizations: [],
        conditions: []
      };

      expect(() => FeatureFlagSchema.parse(validFlag)).not.toThrow();
    });

    it('should validate EnvironmentSchema', () => {
      const validEnv = {
        name: 'development' as const,
        variables: { test: 'value' },
        secrets: ['secret1'],
        isActive: true
      };

      expect(() => EnvironmentSchema.parse(validEnv)).not.toThrow();
    });

    it('should validate ConfigValueSchema', () => {
      const validConfig = {
        key: 'test',
        value: 'value',
        environment: 'development' as const,
        isSecret: false
      };

      expect(() => ConfigValueSchema.parse(validConfig)).not.toThrow();
    });
  });
});
