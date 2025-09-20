import { rlsSystem } from '../lib/rls.js';
import { logger } from '../lib/logger.js';
export function rlsMiddleware(req, res, next) {
    try {
        const organizationId = req.headers['x-organization-id'] ||
            req.headers['x-tenant-id'] ||
            'default';
        const userId = req.headers['x-user-id'] ||
            req.headers['x-subject'];
        const role = req.headers['x-user-role'] ||
            req.headers['x-role'] ||
            'user';
        const permissions = req.headers['x-permissions'] ?
            req.headers['x-permissions'].split(',') :
            undefined;
        const tenantId = req.headers['x-tenant-id'] ||
            organizationId;
        const requestId = req.headers['x-request-id'] ||
            `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const rlsContext = {
            organizationId,
            userId,
            role,
            permissions,
            tenantId,
            requestId,
        };
        rlsSystem.setContext(rlsContext);
        req.rlsContext = rlsContext;
        req.organizationId = organizationId;
        req.userId = userId;
        req.role = role;
        req.permissions = permissions;
        req.tenantId = tenantId;
        logger.debug('RLS context established', {
            organizationId,
            userId,
            role,
            requestId,
            path: req.path,
            method: req.method,
        });
        next();
    }
    catch (error) {
        logger.error('Failed to establish RLS context', {
            error: error.message,
            path: req.path,
            method: req.method,
        });
        next();
    }
}
export function rlsAccessControlMiddleware(resource, action) {
    return (req, res, next) => {
        try {
            const hasAccess = rlsSystem.checkAccess(resource, action);
            if (!hasAccess) {
                logger.warn('Access denied by RLS', {
                    resource,
                    action,
                    organizationId: req.organizationId,
                    userId: req.userId,
                    role: req.role,
                    path: req.path,
                    method: req.method,
                });
                res.status(403).json({
                    error: 'Access denied',
                    message: `Insufficient permissions for ${action} on ${resource}`,
                    code: 'RLS_ACCESS_DENIED',
                });
                return;
            }
            logger.debug('RLS access granted', {
                resource,
                action,
                organizationId: req.organizationId,
                userId: req.userId,
                role: req.role,
            });
            next();
        }
        catch (error) {
            logger.error('RLS access control failed', {
                error: error.message,
                resource,
                action,
                path: req.path,
                method: req.method,
            });
            res.status(500).json({
                error: 'Internal server error',
                message: 'Access control system error',
            });
        }
    };
}
export function rlsDataSanitizationMiddleware(table) {
    return (req, res, next) => {
        try {
            if (req.body && Object.keys(req.body).length > 0) {
                const sanitizedData = rlsSystem.sanitizeInput(req.body, table);
                req.body = sanitizedData;
                logger.debug('Input data sanitized', {
                    table,
                    organizationId: req.organizationId,
                    originalData: req.body,
                    sanitizedData,
                });
            }
            if (req.query && Object.keys(req.query).length > 0) {
                const sanitizedQuery = rlsSystem.sanitizeInput(req.query, table);
                req.query = sanitizedQuery;
            }
            next();
        }
        catch (error) {
            logger.error('RLS data sanitization failed', {
                error: error.message,
                table,
                path: req.path,
                method: req.method,
            });
            res.status(400).json({
                error: 'Bad request',
                message: 'Data sanitization failed',
            });
        }
    };
}
export function rlsResponseValidationMiddleware(table) {
    return (req, res, next) => {
        const originalSend = res.send;
        res.send = function (data) {
            try {
                if (data && typeof data === 'object') {
                    const isValid = rlsSystem.validateOutput(data, table);
                    if (!isValid) {
                        logger.warn('RLS output validation failed', {
                            table,
                            organizationId: req.organizationId,
                            userId: req.userId,
                            path: req.path,
                            method: req.method,
                        });
                        const filteredData = filterUnauthorizedData(data, req.organizationId || 'default');
                        return originalSend.call(this, filteredData);
                    }
                }
                return originalSend.call(this, data);
            }
            catch (error) {
                logger.error('RLS response validation failed', {
                    error: error.message,
                    table,
                    path: req.path,
                    method: req.method,
                });
                return originalSend.call(this, data);
            }
        };
        next();
    };
}
function filterUnauthorizedData(data, organizationId) {
    if (Array.isArray(data)) {
        return data.filter(item => {
            if (item && typeof item === 'object') {
                return item.organizationId === organizationId;
            }
            return true;
        });
    }
    if (data && typeof data === 'object') {
        if (data.organizationId && data.organizationId !== organizationId) {
            return { error: 'Access denied', message: 'Data not accessible' };
        }
    }
    return data;
}
export function rlsCleanupMiddleware(req, res, next) {
    res.on('finish', () => {
        rlsSystem.clearContext();
        logger.debug('RLS context cleared', {
            organizationId: req.organizationId,
            userId: req.userId,
            path: req.path,
            method: req.method,
            statusCode: res.statusCode,
        });
    });
    next();
}
//# sourceMappingURL=rls.js.map