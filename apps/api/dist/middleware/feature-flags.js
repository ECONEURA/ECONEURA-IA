import { configurationManager } from '../lib/configuration.js';
import { logger } from '../lib/logger.js';
export const featureFlagMiddleware = (options = {}) => {
    return (req, res, next) => {
        try {
            const { flags = [], requireAll = false, contextExtractor } = options;
            const context = contextExtractor ? contextExtractor(req) : extractDefaultContext(req);
            req.featureFlagContext = context;
            const flagResults = {};
            for (const flagId of flags) {
                flagResults[flagId] = configurationManager.isFeatureEnabled(flagId, context);
            }
            req.featureFlags = flagResults;
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
            res.setHeader('X-Feature-Flags', JSON.stringify(flagResults));
            res.setHeader('X-Feature-Flags-Count', Object.keys(flagResults).length.toString());
            logger.debug('Feature flags checked', {
                flags,
                results: flagResults,
                context,
            });
            next();
        }
        catch (error) {
            logger.error('Feature flag middleware error', { error: error.message });
            next(error);
        }
    };
};
export const requireFeatureFlag = (flagId, contextExtractor) => {
    return (req, res, next) => {
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
        }
        catch (error) {
            logger.error('Feature flag middleware error', { error: error.message });
            next(error);
        }
    };
};
export const requireAnyFeatureFlag = (flagIds, contextExtractor) => {
    return (req, res, next) => {
        try {
            const context = contextExtractor ? contextExtractor(req) : extractDefaultContext(req);
            req.featureFlagContext = context;
            const flagResults = {};
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
        }
        catch (error) {
            logger.error('Feature flag middleware error', { error: error.message });
            next(error);
        }
    };
};
export const featureFlagInfoMiddleware = (contextExtractor) => {
    return (req, res, next) => {
        try {
            const context = contextExtractor ? contextExtractor(req) : extractDefaultContext(req);
            req.featureFlagContext = context;
            const allFlags = configurationManager.getAllFeatureFlags();
            const enabledFlags = {};
            for (const flag of allFlags) {
                enabledFlags[flag.name] = configurationManager.isFeatureEnabled(flag.id, context);
            }
            req.featureFlags = enabledFlags;
            res.setHeader('X-Feature-Flags-Total', allFlags.length.toString());
            res.setHeader('X-Feature-Flags-Enabled', Object.values(enabledFlags).filter(Boolean).length.toString());
            next();
        }
        catch (error) {
            logger.error('Feature flag info middleware error', { error: error.message });
            next(error);
        }
    };
};
function extractDefaultContext(req) {
    return {
        userId: req.headers['x-user-id'],
        organizationId: req.headers['x-organization-id'],
        userRole: req.headers['x-user-role'],
        userEmail: req.headers['x-user-email'],
        customAttributes: {
            userAgent: req.headers['user-agent'],
            ip: req.ip,
            method: req.method,
            path: req.path,
        },
    };
}
export const isFeatureEnabled = (flagId, context) => {
    return configurationManager.isFeatureEnabled(flagId, context);
};
export const getConfigValue = (key, environment, defaultValue) => {
    return configurationManager.getConfigValue(key, environment, defaultValue);
};
export const getSecret = (key, environment) => {
    return configurationManager.getSecret(key, environment);
};
//# sourceMappingURL=feature-flags.js.map