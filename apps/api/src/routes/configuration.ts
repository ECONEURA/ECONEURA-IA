import { Router } from 'express';

import { configurationService, FeatureFlagSchema, EnvironmentSchema, ConfigValueSchema, FeatureFlagCheckSchema } from '../lib/configuration.service.js';

const router = Router();

// Middleware de validación
const validateFeatureFlag = (req: any, res: any, next: any) => {
  try {
    req.body = FeatureFlagSchema.omit({ id: true, createdAt: true, updatedAt: true }).parse(req.body);
    next();
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Invalid feature flag data',
      details: error
    });
  }
};

const validateEnvironment = (req: any, res: any, next: any) => {
  try {
    req.body = EnvironmentSchema.omit({ createdAt: true, updatedAt: true }).parse(req.body);
    next();
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Invalid environment data',
      details: error
    });
  }
};

const validateConfigValue = (req: any, res: any, next: any) => {
  try {
    req.body = ConfigValueSchema.omit({ createdAt: true, updatedAt: true }).parse(req.body);
    next();
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Invalid config value data',
      details: error
    });
  }
};

const validateFeatureFlagCheck = (req: any, res: any, next: any) => {
  try {
    req.body = FeatureFlagCheckSchema.parse(req.body);
    next();
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Invalid feature flag check data',
      details: error
    });
  }
};

// ==================== FEATURE FLAGS ====================

// GET /v1/config/feature-flags - Obtener todos los feature flags
router.get('/feature-flags', async (req, res) => {
  try {
    const { environment } = req.query;
    const flags = await configurationService.getFeatureFlags(environment as string);
    
    res.json({
      success: true,
      data: flags,
      total: flags.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get feature flags',
      details: error
    });
  }
});

// GET /v1/config/feature-flags/:id - Obtener feature flag específico
router.get('/feature-flags/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const flag = await configurationService.getFeatureFlag(id);
    
    if (!flag) {
      return res.status(404).json({
        success: false,
        error: 'Feature flag not found'
      });
    }
    
    res.json({
      success: true,
      data: flag
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get feature flag',
      details: error
    });
  }
});

// POST /v1/config/feature-flags - Crear nuevo feature flag
router.post('/feature-flags', validateFeatureFlag, async (req, res) => {
  try {
    const flag = await configurationService.createFeatureFlag(req.body);
    
    res.status(201).json({
      success: true,
      data: flag,
      message: 'Feature flag created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create feature flag',
      details: error
    });
  }
});

// PUT /v1/config/feature-flags/:id - Actualizar feature flag
router.put('/feature-flags/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const flag = await configurationService.updateFeatureFlag(id, updates);
    
    if (!flag) {
      return res.status(404).json({
        success: false,
        error: 'Feature flag not found'
      });
    }
    
    res.json({
      success: true,
      data: flag,
      message: 'Feature flag updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update feature flag',
      details: error
    });
  }
});

// DELETE /v1/config/feature-flags/:id - Eliminar feature flag
router.delete('/feature-flags/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await configurationService.deleteFeatureFlag(id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Feature flag not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Feature flag deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete feature flag',
      details: error
    });
  }
});

// POST /v1/config/feature-flags/:name/check - Verificar feature flag
router.post('/feature-flags/:name/check', validateFeatureFlagCheck, async (req, res) => {
  try {
    const { name } = req.params;
    const context = req.body;
    
    const result = await configurationService.checkFeatureFlag(name, context);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to check feature flag',
      details: error
    });
  }
});

// ==================== ENVIRONMENTS ====================

// GET /v1/config/environments - Obtener todos los environments
router.get('/environments', async (req, res) => {
  try {
    const environments = await configurationService.getEnvironments();
    
    res.json({
      success: true,
      data: environments,
      total: environments.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get environments',
      details: error
    });
  }
});

// GET /v1/config/environments/:name - Obtener environment específico
router.get('/environments/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const environment = await configurationService.getEnvironment(name);
    
    if (!environment) {
      return res.status(404).json({
        success: false,
        error: 'Environment not found'
      });
    }
    
    res.json({
      success: true,
      data: environment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get environment',
      details: error
    });
  }
});

// PUT /v1/config/environments/:name - Actualizar environment
router.put('/environments/:name', validateEnvironment, async (req, res) => {
  try {
    const { name } = req.params;
    const updates = req.body;
    
    const environment = await configurationService.updateEnvironment(name, updates);
    
    if (!environment) {
      return res.status(404).json({
        success: false,
        error: 'Environment not found'
      });
    }
    
    res.json({
      success: true,
      data: environment,
      message: 'Environment updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update environment',
      details: error
    });
  }
});

// ==================== CONFIG VALUES ====================

// GET /v1/config/values/:key - Obtener config value
router.get('/values/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { environment, defaultValue } = req.query;
    
    let config = await configurationService.getConfigValue(key, environment as string);
    
    // Si no se encuentra y hay valor por defecto, usarlo
    if (!config && defaultValue) {
      config = {
        key,
        value: defaultValue,
        environment: environment as string,
        isSecret: false
      };
    }
    
    if (!config) {
      return res.status(404).json({
        success: false,
        error: 'Config value not found'
      });
    }
    
    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get config value',
      details: error
    });
  }
});

// PUT /v1/config/values/:key - Establecer config value
router.put('/values/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { value, environment } = req.body;
    
    const config = await configurationService.setConfigValue(key, value, environment);
    
    res.json({
      success: true,
      data: config,
      message: 'Config value set successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to set config value',
      details: error
    });
  }
});

// ==================== SECRETS ====================

// GET /v1/config/secrets/:key - Verificar si secreto existe
router.get('/secrets/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { environment } = req.query;
    
    const secret = await configurationService.getSecret(key, environment as string);
    
    if (!secret) {
      return res.status(404).json({
        success: false,
        error: 'Secret not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        key,
        exists: true,
        environment: environment || 'default'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to check secret',
      details: error
    });
  }
});

// PUT /v1/config/secrets/:key - Establecer secreto
router.put('/secrets/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { value, environment } = req.body;
    
    if (!value) {
      return res.status(400).json({
        success: false,
        error: 'Secret value is required'
      });
    }
    
    await configurationService.setSecret(key, value, environment);
    
    res.json({
      success: true,
      message: 'Secret set successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to set secret',
      details: error
    });
  }
});

// DELETE /v1/config/secrets/:key - Eliminar secreto
router.delete('/secrets/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { environment } = req.query;
    
    const deleted = await configurationService.deleteSecret(key, environment as string);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Secret not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Secret deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete secret',
      details: error
    });
  }
});

// ==================== STATISTICS ====================

// GET /v1/config/stats - Obtener estadísticas de configuración
router.get('/stats', async (req, res) => {
  try {
    const stats = await configurationService.getStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get configuration stats',
      details: error
    });
  }
});

// ==================== VALIDATION ====================

// GET /v1/config/validate - Validar configuración
router.get('/validate', async (req, res) => {
  try {
    const validation = await configurationService.validateConfiguration();
    
    res.json({
      success: true,
      data: validation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to validate configuration',
      details: error
    });
  }
});

// ==================== RELOAD ====================

// POST /v1/config/reload - Recargar configuración
router.post('/reload', async (req, res) => {
  try {
    const result = await configurationService.reloadConfiguration();
    
    res.json({
      success: result.success,
      message: result.message
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to reload configuration',
      details: error
    });
  }
});

// ==================== BETA FEATURES ====================

// GET /v1/config/beta-features - Obtener features beta (requiere feature flag)
router.get('/beta-features', async (req, res) => {
  try {
    // Verificar feature flag beta_features
    const betaCheck = await configurationService.checkFeatureFlag('beta_features', {
      userId: req.headers['x-user-id'] as string,
      organizationId: req.headers['x-organization-id'] as string
    });
    
    if (!betaCheck.isEnabled) {
      return res.status(403).json({
        success: false,
        error: 'Beta features not enabled',
        reason: betaCheck.reason
      });
    }
    
    const betaFeatures = [
      {
        name: 'ai_chat',
        description: 'AI-powered chat interface',
        status: 'beta',
        enabled: true
      },
      {
        name: 'advanced_analytics',
        description: 'Advanced analytics dashboard',
        status: 'beta',
        enabled: true
      },
      {
        name: 'predictive_insights',
        description: 'Predictive business insights',
        status: 'beta',
        enabled: false
      }
    ];
    
    res.json({
      success: true,
      data: betaFeatures
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get beta features',
      details: error
    });
  }
});

// ==================== HEALTH CHECK ====================

// GET /v1/config/health - Health check
router.get('/health', async (req, res) => {
  try {
    const stats = await configurationService.getStats();
    const validation = await configurationService.validateConfiguration();
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      stats,
      validation: {
        isValid: validation.isValid,
        errorCount: validation.errors.length,
        warningCount: validation.warnings.length
      }
    };
    
    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Configuration service unhealthy',
      details: error
    });
  }
});

export default router;
