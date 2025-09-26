import { Router } from 'express';
import { z } from 'zod';

import { advancedConfigurationManagementService } from '../lib/advanced-configuration-management.service.js';
import { logger } from '../lib/logger.js';

const router = Router();

// Schemas de validación para las rutas
const CreateConfigSchema = z.object({
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
  createdBy: z.string().optional(),
  updatedBy: z.string().optional()
});

const UpdateConfigSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  category: z.enum(['system', 'feature', 'integration', 'security', 'performance', 'monitoring']).optional(),
  type: z.enum(['string', 'number', 'boolean', 'object', 'array', 'json']).optional(),
  value: z.any().optional(),
  defaultValue: z.any().optional(),
  environment: z.enum(['development', 'staging', 'production', 'all']).optional(),
  isSecret: z.boolean().optional(),
  isRequired: z.boolean().optional(),
  validation: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    pattern: z.string().optional(),
    enum: z.array(z.any()).optional(),
    custom: z.string().optional()
  }).optional(),
  dependencies: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  version: z.string().optional(),
  isActive: z.boolean().optional(),
  updatedBy: z.string().optional(),
  reason: z.string().optional()
});

const CreateTemplateSchema = z.object({
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
  isActive: z.boolean().default(true)
});

const CreateDeploymentSchema = z.object({
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
  }).optional()
});

const GenerateFromTemplateSchema = z.object({
  templateId: z.string(),
  variables: z.record(z.string(), z.any())
});

const ExportConfigsSchema = z.object({
  environment: z.enum(['development', 'staging', 'production']).optional()
});

const ImportConfigsSchema = z.object({
  configs: z.record(z.string(), z.any()),
  environment: z.enum(['development', 'staging', 'production']),
  userId: z.string()
});

// Rutas de configuraciones
router.get('/configs', async (req, res) => {
  try {
    const filters = {
      category: req.query.category as string,
      environment: req.query.environment as string,
      isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
      tags: req.query.tags ? (req.query.tags as string).split(',') : undefined
    };

    const configs = await advancedConfigurationManagementService.getConfigs(filters);
    
    logger.info('Configurations retrieved', {
      count: configs.length,
      filters
    });

    res.json({
      success: true,
      data: configs,
      count: configs.length
    });
  } catch (error) {
    logger.error('Failed to retrieve configurations', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve configurations',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/configs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const config = await advancedConfigurationManagementService.getConfig(id);

    if (!config) {
      return res.status(404).json({
        success: false,
        error: 'Configuration not found'
      });
    }

    logger.info('Configuration retrieved', {
      configId: id,
      name: config.name
    });

    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    logger.error('Failed to retrieve configuration', {
      configId: req.params.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve configuration',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/configs/name/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const { environment } = req.query;
    
    const config = await advancedConfigurationManagementService.getConfigByName(
      name, 
      environment as string
    );

    if (!config) {
      return res.status(404).json({
        success: false,
        error: 'Configuration not found'
      });
    }

    logger.info('Configuration retrieved by name', {
      name,
      environment,
      configId: config.id
    });

    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    logger.error('Failed to retrieve configuration by name', {
      name: req.params.name,
      environment: req.query.environment,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve configuration by name',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/configs', async (req, res) => {
  try {
    const configData = CreateConfigSchema.parse(req.body);
    const config = await advancedConfigurationManagementService.createConfig(configData);

    logger.info('Configuration created', {
      configId: config.id,
      name: config.name,
      category: config.category
    });

    res.status(201).json({
      success: true,
      data: config,
      message: 'Configuration created successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }

    logger.error('Failed to create configuration', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).json({
      success: false,
      error: 'Failed to create configuration',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.put('/configs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    const updateData = UpdateConfigSchema.parse(req.body);

    const config = await advancedConfigurationManagementService.updateConfig(
      id, 
      updateData, 
      userId || 'system'
    );

    if (!config) {
      return res.status(404).json({
        success: false,
        error: 'Configuration not found'
      });
    }

    logger.info('Configuration updated', {
      configId: id,
      name: config.name,
      userId: userId || 'system'
    });

    res.json({
      success: true,
      data: config,
      message: 'Configuration updated successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }

    logger.error('Failed to update configuration', {
      configId: req.params.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).json({
      success: false,
      error: 'Failed to update configuration',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.delete('/configs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const success = await advancedConfigurationManagementService.deleteConfig(
      id, 
      userId || 'system'
    );

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Configuration not found'
      });
    }

    logger.info('Configuration deleted', {
      configId: id,
      userId: userId || 'system'
    });

    res.json({
      success: true,
      message: 'Configuration deleted successfully'
    });
  } catch (error) {
    logger.error('Failed to delete configuration', {
      configId: req.params.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).json({
      success: false,
      error: 'Failed to delete configuration',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Rutas de validación
router.post('/configs/:id/validate', async (req, res) => {
  try {
    const { id } = req.params;
    const config = await advancedConfigurationManagementService.getConfig(id);

    if (!config) {
      return res.status(404).json({
        success: false,
        error: 'Configuration not found'
      });
    }

    const validation = await advancedConfigurationManagementService.validateConfig(config);

    logger.info('Configuration validated', {
      configId: id,
      isValid: validation.isValid,
      errorsCount: validation.errors.length,
      warningsCount: validation.warnings.length
    });

    res.json({
      success: true,
      data: validation
    });
  } catch (error) {
    logger.error('Failed to validate configuration', {
      configId: req.params.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).json({
      success: false,
      error: 'Failed to validate configuration',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Rutas de templates
router.get('/templates', async (req, res) => {
  try {
    const templates = await advancedConfigurationManagementService.getTemplates();

    logger.info('Templates retrieved', {
      count: templates.length
    });

    res.json({
      success: true,
      data: templates,
      count: templates.length
    });
  } catch (error) {
    logger.error('Failed to retrieve templates', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve templates',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const template = await advancedConfigurationManagementService.getTemplate(id);

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }

    logger.info('Template retrieved', {
      templateId: id,
      name: template.name
    });

    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    logger.error('Failed to retrieve template', {
      templateId: req.params.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve template',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/templates', async (req, res) => {
  try {
    const templateData = CreateTemplateSchema.parse(req.body);
    const template = await advancedConfigurationManagementService.createTemplate(templateData);

    logger.info('Template created', {
      templateId: template.id,
      name: template.name,
      category: template.category
    });

    res.status(201).json({
      success: true,
      data: template,
      message: 'Template created successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }

    logger.error('Failed to create template', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).json({
      success: false,
      error: 'Failed to create template',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/templates/:id/generate', async (req, res) => {
  try {
    const { id } = req.params;
    const { variables } = GenerateFromTemplateSchema.parse(req.body);

    const configs = await advancedConfigurationManagementService.generateConfigFromTemplate(
      id, 
      variables
    );

    logger.info('Configurations generated from template', {
      templateId: id,
      configsCount: configs.length
    });

    res.json({
      success: true,
      data: configs,
      count: configs.length,
      message: 'Configurations generated successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }

    logger.error('Failed to generate configurations from template', {
      templateId: req.params.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).json({
      success: false,
      error: 'Failed to generate configurations from template',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Rutas de deployments
router.post('/deployments', async (req, res) => {
  try {
    const deploymentData = CreateDeploymentSchema.parse(req.body);
    const deployment = await advancedConfigurationManagementService.createDeployment(deploymentData);

    logger.info('Deployment created', {
      deploymentId: deployment.id,
      name: deployment.name,
      environment: deployment.environment
    });

    res.status(201).json({
      success: true,
      data: deployment,
      message: 'Deployment created successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }

    logger.error('Failed to create deployment', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).json({
      success: false,
      error: 'Failed to create deployment',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/deployments/:id/execute', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const result = await advancedConfigurationManagementService.executeDeployment(
      id, 
      userId || 'system'
    );

    logger.info('Deployment executed', {
      deploymentId: id,
      success: result.success,
      userId: userId || 'system'
    });

    res.json({
      success: result.success,
      message: result.message
    });
  } catch (error) {
    logger.error('Failed to execute deployment', {
      deploymentId: req.params.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).json({
      success: false,
      error: 'Failed to execute deployment',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Rutas de audit y métricas
router.get('/audit', async (req, res) => {
  try {
    const filters = {
      configId: req.query.configId as string,
      action: req.query.action as string,
      userId: req.query.userId as string,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined
    };

    const auditLog = await advancedConfigurationManagementService.getAuditLog(filters);

    logger.info('Audit log retrieved', {
      count: auditLog.length,
      filters
    });

    res.json({
      success: true,
      data: auditLog,
      count: auditLog.length
    });
  } catch (error) {
    logger.error('Failed to retrieve audit log', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve audit log',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/metrics', async (req, res) => {
  try {
    const metrics = await advancedConfigurationManagementService.getMetrics();

    logger.info('Configuration metrics retrieved', {
      totalConfigs: metrics.totalConfigs,
      activeConfigs: metrics.activeConfigs
    });

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    logger.error('Failed to retrieve configuration metrics', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve configuration metrics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Rutas de cache y utilidades
router.get('/configs/name/:name/value', async (req, res) => {
  try {
    const { name } = req.params;
    const { environment } = req.query;

    const value = await advancedConfigurationManagementService.getConfigValue(
      name, 
      environment as string
    );

    if (value === null) {
      return res.status(404).json({
        success: false,
        error: 'Configuration value not found'
      });
    }

    logger.info('Configuration value retrieved', {
      name,
      environment,
      valueType: typeof value
    });

    res.json({
      success: true,
      data: { name, value, environment }
    });
  } catch (error) {
    logger.error('Failed to retrieve configuration value', {
      name: req.params.name,
      environment: req.query.environment,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve configuration value',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.delete('/cache', async (req, res) => {
  try {
    await advancedConfigurationManagementService.clearCache();

    logger.info('Configuration cache cleared');

    res.json({
      success: true,
      message: 'Cache cleared successfully'
    });
  } catch (error) {
    logger.error('Failed to clear configuration cache', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).json({
      success: false,
      error: 'Failed to clear cache',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Rutas de export/import
router.get('/export', async (req, res) => {
  try {
    const { environment } = ExportConfigsSchema.parse(req.query);
    const configs = await advancedConfigurationManagementService.exportConfigs(environment);

    logger.info('Configurations exported', {
      environment,
      configsCount: Object.keys(configs).length
    });

    res.json({
      success: true,
      data: configs,
      environment,
      count: Object.keys(configs).length
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }

    logger.error('Failed to export configurations', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).json({
      success: false,
      error: 'Failed to export configurations',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/import', async (req, res) => {
  try {
    const { configs, environment, userId } = ImportConfigsSchema.parse(req.body);
    const result = await advancedConfigurationManagementService.importConfigs(
      configs, 
      environment, 
      userId
    );

    logger.info('Configurations imported', {
      environment,
      imported: result.imported,
      errors: result.errors.length,
      userId
    });

    res.json({
      success: result.success,
      data: {
        imported: result.imported,
        errors: result.errors
      },
      message: `Imported ${result.imported} configurations successfully`
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }

    logger.error('Failed to import configurations', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).json({
      success: false,
      error: 'Failed to import configurations',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
