import { describe, it, expect, beforeEach } from 'vitest';
import {
  AdvancedConfigurationManagementService,
  AdvancedConfig,
  ConfigTemplate,
  ConfigDeployment
} from '../../../lib/advanced-configuration-management.service.js';

describe('AdvancedConfigurationManagementService', () => {
  let service: AdvancedConfigurationManagementService;

  beforeEach(() => {
    service = new AdvancedConfigurationManagementService();
  });

  describe('Service Initialization', () => {
    it('should initialize with default configurations', async () => {
      const configs = await service.getConfigs();
      expect(configs.length).toBeGreaterThan(0);

      const apiRateLimit = configs.find(c => c.name === 'api_rate_limit');
      expect(apiRateLimit).toBeDefined();
      expect(apiRateLimit?.value).toBe(1000);
      expect(apiRateLimit?.category).toBe('performance');
    });

    it('should initialize with default templates', async () => {
      const templates = await service.getTemplates();
      expect(templates.length).toBeGreaterThan(0);

      const apiTemplate = templates.find(t => t.name === 'api_configuration');
      expect(apiTemplate).toBeDefined();
      expect(apiTemplate?.category).toBe('system');
    });
  });

  describe('Configuration Management', () => {
    it('should create a new configuration', async () => {
      const configData = {
        name: 'test_config',
        description: 'Test configuration',
        category: 'system' as const,
        type: 'string' as const,
        value: 'test_value',
        defaultValue: 'test_value',
        environment: 'development' as const,
        isSecret: false,
        isRequired: true,
        dependencies: [],
        tags: ['test'],
        version: '1.0.0',
        isActive: true,
        createdBy: 'test-user'
      };

      const config = await service.createConfig(configData);

      expect(config.id).toBeDefined();
      expect(config.name).toBe('test_config');
      expect(config.value).toBe('test_value');
      expect(config.createdAt).toBeDefined();
    });

    it('should retrieve configuration by ID', async () => {
      const configs = await service.getConfigs();
      const firstConfig = configs[0];

      const retrieved = await service.getConfig(firstConfig.id!);
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(firstConfig.id);
      expect(retrieved?.name).toBe(firstConfig.name);
    });

    it('should retrieve configuration by name', async () => {
      const config = await service.getConfigByName('api_rate_limit');
      expect(config).toBeDefined();
      expect(config?.name).toBe('api_rate_limit');
      expect(config?.value).toBe(1000);
    });

    it('should update configuration', async () => {
      const configs = await service.getConfigs();
      const firstConfig = configs[0];

      // Update with a value that matches the config type
      const updateValue = firstConfig.type === 'string' ? 'updated_value' :
                         firstConfig.type === 'number' ? 42 :
                         firstConfig.type === 'boolean' ? true : 'updated_value';

      const updated = await service.updateConfig(firstConfig.id!, {
        value: updateValue,
        updatedBy: 'test-user'
      }, 'test-user');

      expect(updated).toBeDefined();
      expect(updated?.value).toBe(updateValue);
      expect(updated?.updatedBy).toBe('test-user');
    });

    it('should delete configuration', async () => {
      const configData = {
        name: 'delete_test_config',
        description: 'Config to delete',
        category: 'system' as const,
        type: 'string' as const,
        value: 'delete_value',
        defaultValue: 'delete_value',
        environment: 'development' as const,
        isSecret: false,
        isRequired: false,
        dependencies: [],
        tags: ['test'],
        version: '1.0.0',
        isActive: true,
        createdBy: 'test-user'
      };

      const config = await service.createConfig(configData);
      const deleted = await service.deleteConfig(config.id!, 'test-user');

      expect(deleted).toBe(true);

      const retrieved = await service.getConfig(config.id!);
      expect(retrieved).toBeNull();
    });

    it('should filter configurations by category', async () => {
      const performanceConfigs = await service.getConfigs({ category: 'performance' });
      expect(performanceConfigs.length).toBeGreaterThan(0);
      expect(performanceConfigs.every(c => c.category === 'performance')).toBe(true);
    });

    it('should filter configurations by environment', async () => {
      const devConfigs = await service.getConfigs({ environment: 'development' });
      const allConfigs = await service.getConfigs({ environment: 'all' });

      expect(devConfigs.length).toBeGreaterThan(0);
      expect(allConfigs.length).toBeGreaterThan(0);
    });

    it('should filter configurations by tags', async () => {
      const apiConfigs = await service.getConfigs({ tags: ['api'] });
      expect(apiConfigs.length).toBeGreaterThan(0);
      expect(apiConfigs.every(c => c.tags.includes('api'))).toBe(true);
    });
  });

  describe('Configuration Validation', () => {
    it('should validate configuration successfully', async () => {
      const config = {
        name: 'valid_config',
        description: 'Valid configuration',
        category: 'system' as const,
        type: 'number' as const,
        value: 42,
        defaultValue: 42,
        environment: 'development' as const,
        isSecret: false,
        isRequired: true,
        validation: {
          min: 1,
          max: 100
        },
        dependencies: [],
        tags: ['test'],
        version: '1.0.0',
        isActive: true
      };

      const validation = await service.validateConfig(config);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should fail validation for invalid value type', async () => {
      const config = {
        name: 'invalid_config',
        description: 'Invalid configuration',
        category: 'system' as const,
        type: 'number' as const,
        value: 'not_a_number',
        defaultValue: 'not_a_number',
        environment: 'development' as const,
        isSecret: false,
        isRequired: true,
        dependencies: [],
        tags: ['test'],
        version: '1.0.0',
        isActive: true
      };

      const validation = await service.validateConfig(config);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it('should fail validation for value outside range', async () => {
      const config = {
        name: 'range_config',
        description: 'Range configuration',
        category: 'system' as const,
        type: 'number' as const,
        value: 150,
        defaultValue: 150,
        environment: 'development' as const,
        isSecret: false,
        isRequired: true,
        validation: {
          min: 1,
          max: 100
        },
        dependencies: [],
        tags: ['test'],
        version: '1.0.0',
        isActive: true
      };

      const validation = await service.validateConfig(config);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.includes('at most 100'))).toBe(true);
    });

    it('should validate pattern matching', async () => {
      const config = {
        name: 'pattern_config',
        description: 'Pattern configuration',
        category: 'system' as const,
        type: 'string' as const,
        value: 'invalid-email',
        defaultValue: 'invalid-email',
        environment: 'development' as const,
        isSecret: false,
        isRequired: true,
        validation: {
          pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$'
        },
        dependencies: [],
        tags: ['test'],
        version: '1.0.0',
        isActive: true
      };

      const validation = await service.validateConfig(config);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.includes('pattern'))).toBe(true);
    });
  });

  describe('Template Management', () => {
    it('should create a new template', async () => {
      const templateData = {
        name: 'test_template',
        description: 'Test template',
        category: 'system' as const,
        template: {
          test_key: '{{test_value}}',
          another_key: '{{another_value}}'
        },
        variables: [
          {
            name: 'test_value',
            type: 'string' as const,
            required: true,
            defaultValue: 'default',
            description: 'Test value'
          }
        ],
        isActive: true
      };

      const template = await service.createTemplate(templateData);

      expect(template.id).toBeDefined();
      expect(template.name).toBe('test_template');
      expect(template.template).toEqual(templateData.template);
    });

    it('should generate configurations from template', async () => {
      const templates = await service.getTemplates();
      const apiTemplate = templates.find(t => t.name === 'api_configuration');

      if (apiTemplate) {
        const variables = {
          rate_limit: 2000,
          timeout: 60000,
          retries: 5,
          cache_enabled: false
        };

        const configs = await service.generateConfigFromTemplate(apiTemplate.id!, variables);

        expect(configs.length).toBeGreaterThan(0);
        expect(configs.every(c => c.tags.includes('template-generated'))).toBe(true);
      }
    });
  });

  describe('Deployment Management', () => {
    it('should create a deployment', async () => {
      const deploymentData = {
        name: 'test_deployment',
        description: 'Test deployment',
        environment: 'development' as const,
        configs: ['config_1', 'config_2'],
        deploymentStrategy: 'immediate' as const,
        rolloutPercentage: 100
      };

      const deployment = await service.createDeployment(deploymentData);

      expect(deployment.id).toBeDefined();
      expect(deployment.name).toBe('test_deployment');
      expect(deployment.status).toBe('pending');
      expect(deployment.environment).toBe('development');
      expect(deployment.deploymentStrategy).toBe('immediate');
    });

    it('should execute deployment', async () => {
      const deploymentData = {
        name: 'execution_test_deployment',
        description: 'Deployment to execute',
        environment: 'development' as const,
        configs: ['config_1'],
        deploymentStrategy: 'immediate' as const,
        rolloutPercentage: 100
      };

      const deployment = await service.createDeployment(deploymentData);
      const result = await service.executeDeployment(deployment.id!, 'test-user');

      expect(result.success).toBe(true);
      expect(result.message).toContain('completed successfully');
    });
  });

  describe('Audit and Metrics', () => {
    it('should retrieve audit log', async () => {
      // Create a configuration to generate audit entries
      const configData = {
        name: 'audit_test_config',
        description: 'Config for audit testing',
        category: 'system' as const,
        type: 'string' as const,
        value: 'audit_value',
        defaultValue: 'audit_value',
        environment: 'development' as const,
        isSecret: false,
        isRequired: false,
        dependencies: [],
        tags: ['test'],
        version: '1.0.0',
        isActive: true,
        createdBy: 'test-user'
      };

      await service.createConfig(configData);

      const auditLog = await service.getAuditLog();
      expect(auditLog.length).toBeGreaterThan(0);

      const createAudit = auditLog.find(a => a.action === 'create');
      expect(createAudit).toBeDefined();
      expect(createAudit?.userId).toBe('test-user');
    });

    it('should retrieve metrics', async () => {
      const metrics = await service.getMetrics();

      expect(metrics.totalConfigs).toBeGreaterThan(0);
      expect(metrics.activeConfigs).toBeGreaterThan(0);
      expect(metrics.configsByCategory).toBeDefined();
      expect(metrics.configsByEnvironment).toBeDefined();
    });

    it('should filter audit log by action', async () => {
      const createAudits = await service.getAuditLog({ action: 'create' });
      expect(createAudits.every(a => a.action === 'create')).toBe(true);
    });

    it('should filter audit log by user', async () => {
      const systemAudits = await service.getAuditLog({ userId: 'system' });
      expect(systemAudits.every(a => a.userId === 'system')).toBe(true);
    });
  });

  describe('Cache and Performance', () => {
    it('should cache configuration values', async () => {
      const value1 = await service.getConfigValue('api_rate_limit');
      const value2 = await service.getConfigValue('api_rate_limit');

      expect(value1).toBe(value2);
      expect(value1).toBe(1000);
    });

    it('should clear cache', async () => {
      await service.clearCache();
      // Cache should be cleared without errors
      expect(true).toBe(true);
    });
  });

  describe('Export and Import', () => {
    it('should export configurations', async () => {
      const exported = await service.exportConfigs('development');

      expect(exported).toBeDefined();
      expect(typeof exported).toBe('object');
      expect(Object.keys(exported).length).toBeGreaterThan(0);
    });

    it('should import configurations', async () => {
      const configsToImport = {
        imported_config_1: 'value1',
        imported_config_2: 42,
        imported_config_3: true
      };

      const result = await service.importConfigs(
        configsToImport,
        'development',
        'test-user'
      );

      expect(result.success).toBe(true);
      expect(result.imported).toBe(3);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle import errors gracefully', async () => {
      const invalidConfigs = {
        '': 'empty_name', // Invalid name
        valid_config: 'valid_value'
      };

      const result = await service.importConfigs(
        invalidConfigs,
        'development',
        'test-user'
      );

      expect(result.success).toBe(false);
      expect(result.imported).toBe(1); // Only valid config imported
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle non-existent configuration', async () => {
      const config = await service.getConfig('non_existent_id');
      expect(config).toBeNull();
    });

    it('should handle non-existent template', async () => {
      const template = await service.getTemplate('non_existent_id');
      expect(template).toBeNull();
    });

    it('should handle update of non-existent configuration', async () => {
      const updated = await service.updateConfig('non_existent_id', { value: 'new_value' }, 'test-user');
      expect(updated).toBeNull();
    });

    it('should handle delete of non-existent configuration', async () => {
      const deleted = await service.deleteConfig('non_existent_id', 'test-user');
      expect(deleted).toBe(false);
    });

    it('should handle deployment of non-existent deployment', async () => {
      const result = await service.executeDeployment('non_existent_id', 'test-user');
      expect(result.success).toBe(false);
      expect(result.message).toContain('not found');
    });

    it('should handle configuration with dependencies', async () => {
      const configData = {
        name: 'dependent_config',
        description: 'Config with dependencies',
        category: 'system' as const,
        type: 'string' as const,
        value: 'dependent_value',
        defaultValue: 'dependent_value',
        environment: 'development' as const,
        isSecret: false,
        isRequired: true,
        dependencies: ['config_1'], // Should exist from default data
        tags: ['test'],
        version: '1.0.0',
        isActive: true,
        createdBy: 'test-user'
      };

      const config = await service.createConfig(configData);
      expect(config).toBeDefined();
      expect(config.dependencies).toContain('config_1');
    });

    it('should handle configuration with invalid dependencies', async () => {
      const configData = {
        name: 'invalid_dependent_config',
        description: 'Config with invalid dependencies',
        category: 'system' as const,
        type: 'string' as const,
        value: 'dependent_value',
        defaultValue: 'dependent_value',
        environment: 'development' as const,
        isSecret: false,
        isRequired: true,
        dependencies: ['non_existent_dependency'],
        tags: ['test'],
        version: '1.0.0',
        isActive: true,
        createdBy: 'test-user'
      };

      await expect(service.createConfig(configData)).rejects.toThrow();
    });
  });
});
