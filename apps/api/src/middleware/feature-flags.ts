import { Request, Response, NextFunction } from 'express';

import { configurationManager, FeatureFlagContext } from '../lib/configuration.js';
import { logger } from '../lib/logger.js';

export interface FeatureFlagRequest extends Request {
  featureFlags?: {
    [key: string]: boolean;
  };
  featureFlagContext?: FeatureFlagContext;
}

export interface FeatureFlagMiddlewareOptions {
  flags?: string[];
  requireAll?: boolean;
  contextExtractor?: (req: Request) => FeatureFlagContext;
}

/**
 * Middleware para verificar feature flags
 */
export const featureFlagMiddleware = (options: FeatureFlagMiddlewareOptions = {}) => {
  return (req: FeatureFlagRequest, res: Response, next: NextFunction): void => {
    try {
      const { flags = [], requireAll = false, contextExtractor } = options;
      
      // Extraer contexto del request
      const context = contextExtractor ? contextExtractor(req) : extractDefaultContext(req);
      req.featureFlagContext = context;

      // Verificar feature flags
      const flagResults: { [key: string]: boolean } = {};
      
      for (const flagId of flags) {
        flagResults[flagId] = configurationManager.isFeatureEnabled(flagId, context);
      }

      req.featureFlags = flagResults;

      // Si requireAll es true, todos los flags deben estar habilitados
      if (requireAll && flags.length > 0) {
        const allEnabled = flags.every(flagId => flagResults[flagId]);
        if (!allEnabled) {
          logger.info('Feature flag check failed - not all required flags enabled', {
            flags,
            results: flagResults,
            context,
          });
          res.status(403).json({
            error: 'Feature not available',
            message: 'Required feature flags are not enabled',
            flags: flagResults,
          });
        }
      }

      // Agregar headers con información de feature flags
      res.setHeader('X-Feature-Flags', JSON.stringify(flagResults));
      res.setHeader('X-Feature-Flags-Count', Object.keys(flagResults).length.toString());

      logger.debug('Feature flags checked', {
        flags,
        results: flagResults,
        context,
      });

      next();
    } catch (error) {
      logger.error('Feature flag middleware error', { error: (error as Error).message });
      next(error);
    }
  };
};

/**
 * Middleware para verificar un feature flag específico
 */
export const requireFeatureFlag = (flagId: string, contextExtractor?: (req: Request) => FeatureFlagContext) => {
  return (req: FeatureFlagRequest, res: Response, next: NextFunction): void => {
    try {
      const context = contextExtractor ? contextExtractor(req) : extractDefaultContext(req);
      req.featureFlagContext = context;

      const isEnabled = configurationManager.isFeatureEnabled(flagId, context);
      
      if (!isEnabled) {
        logger.info('Feature flag access denied', {
          flagId,
          context,
        });
        res.status(403).json({
          error: 'Feature not available',
          message: `Feature flag '${flagId}' is not enabled`,
          flagId,
        });
      }

      req.featureFlags = { [flagId]: true };
      res.setHeader('X-Feature-Flag', flagId);
      res.setHeader('X-Feature-Flag-Enabled', 'true');

      logger.debug('Feature flag access granted', {
        flagId,
        context,
      });

      next();
    } catch (error) {
      logger.error('Feature flag middleware error', { error: (error as Error).message });
      next(error);
    }
  };
};

/**
 * Middleware para verificar múltiples feature flags (al menos uno debe estar habilitado)
 */
export const requireAnyFeatureFlag = (flagIds: string[], contextExtractor?: (req: Request) => FeatureFlagContext) => {
  return (req: FeatureFlagRequest, res: Response, next: NextFunction): void => {
    try {
      const context = contextExtractor ? contextExtractor(req) : extractDefaultContext(req);
      req.featureFlagContext = context;

      const flagResults: { [key: string]: boolean } = {};
      let anyEnabled = false;

      for (const flagId of flagIds) {
        const isEnabled = configurationManager.isFeatureEnabled(flagId, context);
        flagResults[flagId] = isEnabled;
        if (isEnabled) {
          anyEnabled = true;
        }
      }

      if (!anyEnabled) {
        logger.info('Feature flag access denied - no flags enabled', {
          flagIds,
          results: flagResults,
          context,
        });
        res.status(403).json({
          error: 'Feature not available',
          message: 'None of the required feature flags are enabled',
          flags: flagResults,
        });
      }

      req.featureFlags = flagResults;
      res.setHeader('X-Feature-Flags', JSON.stringify(flagResults));
      res.setHeader('X-Feature-Flags-Enabled', Object.values(flagResults).filter(Boolean).length.toString());

      logger.debug('Feature flags access granted', {
        flagIds,
        results: flagResults,
        context,
      });

      next();
    } catch (error) {
      logger.error('Feature flag middleware error', { error: (error as Error).message });
      next(error);
    }
  };
};

/**
 * Middleware para agregar información de feature flags a todas las respuestas
 */
export const featureFlagInfoMiddleware = (contextExtractor?: (req: Request) => FeatureFlagContext) => {
  return (req: FeatureFlagRequest, res: Response, next: NextFunction) => {
    try {
      const context = contextExtractor ? contextExtractor(req) : extractDefaultContext(req);
      req.featureFlagContext = context;

      // Obtener todos los feature flags habilitados para este contexto
      const allFlags = configurationManager.getAllFeatureFlags();
      const enabledFlags: { [key: string]: boolean } = {};

      for (const flag of allFlags) {
        enabledFlags[flag.name] = configurationManager.isFeatureEnabled(flag.id, context);
      }

      req.featureFlags = enabledFlags;

      // Agregar headers informativos
      res.setHeader('X-Feature-Flags-Total', allFlags.length.toString());
      res.setHeader('X-Feature-Flags-Enabled', Object.values(enabledFlags).filter(Boolean).length.toString());

      next();
    } catch (error) {
      logger.error('Feature flag info middleware error', { error: (error as Error).message });
      next(error);
    }
  };
};

/**
 * Función helper para extraer contexto por defecto del request
 */
function extractDefaultContext(req: Request): FeatureFlagContext {
  return {
    userId: req.headers['x-user-id'] as string,
    organizationId: req.headers['x-organization-id'] as string,
    userRole: req.headers['x-user-role'] as string,
    userEmail: req.headers['x-user-email'] as string,
    customAttributes: {
      userAgent: req.headers['user-agent'],
      ip: req.ip,
      method: req.method,
      path: req.path,
    },
  };
}

/**
 * Función helper para verificar feature flag en código
 */
export const isFeatureEnabled = (flagId: string, context?: FeatureFlagContext): boolean => {
  return configurationManager.isFeatureEnabled(flagId, context);
};

/**
 * Función helper para obtener valor de configuración
 */
export const getConfigValue = (key: string, environment?: string, defaultValue?: any): any => {
  return configurationManager.getConfigValue(key, environment, defaultValue);
};

/**
 * Función helper para obtener secreto
 */
export const getSecret = (key: string, environment?: string): string | undefined => {
  return configurationManager.getSecret(key, environment);
};
