import { tenantRLSPoliciesService } from '../services/rls-tenant-policies.service.js';
import { structuredLogger } from '../lib/structured-logger.js';
export function tenantRLSMiddleware(req, res, next) {
    try {
        const organizationId = req.headers['x-organization-id'] ||
            req.headers['x-org-id'] ||
            'default';
        const tenantId = req.headers['x-tenant-id'] ||
            req.headers['x-organization-id'] ||
            organizationId;
        const userId = req.headers['x-user-id'] ||
            req.headers['x-subject'];
        const role = req.headers['x-user-role'] ||
            req.headers['x-role'] ||
            'user';
        const permissions = req.headers['x-permissions'] ?
            req.headers['x-permissions'].split(',') :
            ['read'];
        const sessionId = req.headers['x-session-id'] ||
            req.headers['x-request-id'] ||
            `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const requestId = req.headers['x-request-id'] ||
            `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const rlsContext = {
            userId: userId || 'anonymous',
            organizationId,
            tenantId,
            role,
            permissions,
            sessionId,
            ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
            userAgent: req.headers['user-agent'] || 'unknown',
            timestamp: new Date().toISOString(),
            tenantMetadata: {
                tenantType: req.headers['x-tenant-type'] || 'individual',
                subscriptionLevel: req.headers['x-subscription-level'] || 'basic',
                dataRetentionDays: parseInt(req.headers['x-data-retention-days']) || 365,
                complianceRequirements: req.headers['x-compliance-requirements'] ?
                    req.headers['x-compliance-requirements'].split(',') : []
            }
        };
        tenantRLSPoliciesService.createTenantContext(rlsContext);
        req.rlsContext = rlsContext;
        req.organizationId = organizationId;
        req.tenantId = tenantId;
        req.userId = userId;
        req.role = role;
        req.permissions = permissions;
        req.sessionId = sessionId;
        res.set({
            'X-Tenant-ID': tenantId,
            'X-Organization-ID': organizationId,
            'X-User-ID': userId || 'anonymous',
            'X-User-Role': role,
            'X-Request-ID': requestId
        });
        structuredLogger.info('Tenant RLS context established', {
            organizationId,
            tenantId,
            userId,
            role,
            requestId,
            path: req.path,
            method: req.method,
            ipAddress: rlsContext.ipAddress
        });
        next();
    }
    catch (error) {
        structuredLogger.error('Failed to establish tenant RLS context', {
            error: error.message,
            path: req.path,
            method: req.method,
        });
        next();
    }
}
export function tenantRLSAccessControlMiddleware(resource, action) {
    return async (req, res, next) => {
        try {
            if (!req.rlsContext) {
                structuredLogger.warn('No tenant RLS context available for access control', {
                    resource,
                    action,
                    path: req.path,
                    method: req.method,
                });
                res.status(403).json({
                    error: 'Access denied',
                    message: 'No security context available',
                    code: 'TENANT_RLS_NO_CONTEXT',
                });
                return;
            }
            const operation = {
                type: action.toUpperCase(),
                tableName: resource,
                targetTenantId: req.tenantId
            };
            const accessResult = await tenantRLSPoliciesService.evaluateTenantAccess(req.rlsContext, operation);
            if (!accessResult.allowed) {
                structuredLogger.warn('Access denied by tenant RLS', {
                    resource,
                    action,
                    tenantId: req.tenantId,
                    organizationId: req.organizationId,
                    userId: req.userId,
                    role: req.role,
                    reason: accessResult.reason,
                    path: req.path,
                    method: req.method,
                });
                res.status(403).json({
                    error: 'Access denied',
                    message: accessResult.reason || `Insufficient permissions for ${action} on ${resource}`,
                    code: 'TENANT_RLS_ACCESS_DENIED',
                    details: {
                        tenantId: req.tenantId,
                        resource,
                        action,
                        policiesApplied: accessResult.policiesApplied,
                        rulesEvaluated: accessResult.rulesEvaluated,
                        tenantIsolationEnforced: accessResult.tenantIsolationEnforced
                    }
                });
                return;
            }
            structuredLogger.info('Tenant RLS access granted', {
                resource,
                action,
                tenantId: req.tenantId,
                organizationId: req.organizationId,
                userId: req.userId,
                role: req.role,
                executionTime: accessResult.executionTime,
                policiesApplied: accessResult.policiesApplied.length,
                rulesEvaluated: accessResult.rulesEvaluated.length
            });
            res.set({
                'X-RLS-Policies-Applied': accessResult.policiesApplied.join(','),
                'X-RLS-Rules-Evaluated': accessResult.rulesEvaluated.join(','),
                'X-RLS-Execution-Time': accessResult.executionTime.toString(),
                'X-RLS-Tenant-Isolation': accessResult.tenantIsolationEnforced.toString()
            });
            next();
        }
        catch (error) {
            structuredLogger.error('Tenant RLS access control failed', {
                error: error.message,
                resource,
                action,
                tenantId: req.tenantId,
                path: req.path,
                method: req.method,
            });
            res.status(500).json({
                error: 'Internal server error',
                message: 'Tenant access control system error',
                code: 'TENANT_RLS_SYSTEM_ERROR'
            });
        }
    };
}
export function tenantRLSDataSanitizationMiddleware(table) {
    return (req, res, next) => {
        try {
            if (!req.rlsContext) {
                structuredLogger.warn('No tenant RLS context available for data sanitization', {
                    table,
                    path: req.path,
                    method: req.method,
                });
                next();
                return;
            }
            if (req.body && Object.keys(req.body).length > 0) {
                const sanitizedData = sanitizeTenantData(req.body, req.rlsContext, table);
                req.body = sanitizedData;
                structuredLogger.debug('Tenant input data sanitized', {
                    table,
                    tenantId: req.tenantId,
                    organizationId: req.organizationId,
                    originalData: req.body,
                    sanitizedData,
                });
            }
            if (req.query && Object.keys(req.query).length > 0) {
                const sanitizedQuery = sanitizeTenantData(req.query, req.rlsContext, table);
                req.query = sanitizedQuery;
            }
            next();
        }
        catch (error) {
            structuredLogger.error('Tenant RLS data sanitization failed', {
                error: error.message,
                table,
                tenantId: req.tenantId,
                path: req.path,
                method: req.method,
            });
            res.status(400).json({
                error: 'Bad request',
                message: 'Tenant data sanitization failed',
                code: 'TENANT_RLS_SANITIZATION_ERROR'
            });
        }
    };
}
export function tenantRLSResponseValidationMiddleware(table) {
    return (req, res, next) => {
        const originalSend = res.send;
        res.send = function (data) {
            try {
                if (!req.rlsContext) {
                    return originalSend.call(this, data);
                }
                if (data && typeof data === 'object') {
                    const isValid = validateTenantData(data, req.rlsContext, table);
                    if (!isValid) {
                        structuredLogger.warn('Tenant RLS output validation failed', {
                            table,
                            tenantId: req.tenantId,
                            organizationId: req.organizationId,
                            userId: req.userId,
                            path: req.path,
                            method: req.method,
                        });
                        const filteredData = filterUnauthorizedTenantData(data, req.rlsContext);
                        return originalSend.call(this, filteredData);
                    }
                }
                return originalSend.call(this, data);
            }
            catch (error) {
                structuredLogger.error('Tenant RLS response validation failed', {
                    error: error.message,
                    table,
                    tenantId: req.tenantId,
                    path: req.path,
                    method: req.method,
                });
                return originalSend.call(this, data);
            }
        };
        next();
    };
}
export function tenantRLSCleanupMiddleware(req, res, next) {
    res.on('finish', () => {
        if (req.rlsContext) {
            structuredLogger.debug('Tenant RLS context cleanup', {
                tenantId: req.tenantId,
                organizationId: req.organizationId,
                userId: req.userId,
                sessionId: req.sessionId,
                path: req.path,
                method: req.method,
                statusCode: res.statusCode,
            });
        }
    });
    next();
}
function sanitizeTenantData(data, context, table) {
    const sanitized = { ...data };
    sanitized.tenantId = context.tenantId;
    sanitized.organizationId = context.organizationId;
    switch (table) {
        case 'users':
            if (context.userId) {
                sanitized.createdBy = context.userId;
                sanitized.updatedBy = context.userId;
            }
            break;
        case 'invoices':
        case 'customers':
        case 'products':
            sanitized.tenantId = context.tenantId;
            sanitized.organizationId = context.organizationId;
            if (context.userId) {
                sanitized.createdBy = context.userId;
                sanitized.updatedBy = context.userId;
            }
            break;
        case 'organizations':
            sanitized.id = context.organizationId;
            break;
        default:
            sanitized.tenantId = context.tenantId;
            sanitized.organizationId = context.organizationId;
    }
    return sanitized;
}
function validateTenantData(data, context, table) {
    if (data.tenantId && data.tenantId !== context.tenantId) {
        structuredLogger.warn('Tenant data validation failed: tenant mismatch', {
            expected: context.tenantId,
            actual: data.tenantId,
            table,
        });
        return false;
    }
    if (data.organizationId && data.organizationId !== context.organizationId) {
        structuredLogger.warn('Tenant data validation failed: organization mismatch', {
            expected: context.organizationId,
            actual: data.organizationId,
            table,
        });
        return false;
    }
    return true;
}
function filterUnauthorizedTenantData(data, context) {
    if (Array.isArray(data)) {
        return data.filter(item => {
            if (item && typeof item === 'object') {
                return item.tenantId === context.tenantId &&
                    item.organizationId === context.organizationId;
            }
            return true;
        });
    }
    if (data && typeof data === 'object') {
        if (data.tenantId && data.tenantId !== context.tenantId) {
            return {
                error: 'Access denied',
                message: 'Data not accessible from current tenant',
                code: 'TENANT_ACCESS_DENIED'
            };
        }
        if (data.organizationId && data.organizationId !== context.organizationId) {
            return {
                error: 'Access denied',
                message: 'Data not accessible from current organization',
                code: 'ORGANIZATION_ACCESS_DENIED'
            };
        }
    }
    return data;
}
export function tenantIsolationMiddleware(req, res, next) {
    try {
        if (!req.rlsContext) {
            next();
            return;
        }
        const targetTenantId = req.headers['x-target-tenant-id'];
        if (targetTenantId && targetTenantId !== req.tenantId) {
            if (!req.permissions?.includes('cross_tenant_access') && req.role !== 'admin') {
                structuredLogger.warn('Cross-tenant access denied', {
                    currentTenant: req.tenantId,
                    targetTenant: targetTenantId,
                    userId: req.userId,
                    role: req.role,
                    path: req.path,
                    method: req.method,
                });
                res.status(403).json({
                    error: 'Access denied',
                    message: 'Cross-tenant access not permitted',
                    code: 'CROSS_TENANT_ACCESS_DENIED',
                    details: {
                        currentTenant: req.tenantId,
                        targetTenant: targetTenantId
                    }
                });
                return;
            }
        }
        next();
    }
    catch (error) {
        structuredLogger.error('Tenant isolation middleware failed', {
            error: error.message,
            tenantId: req.tenantId,
            path: req.path,
            method: req.method,
        });
        res.status(500).json({
            error: 'Internal server error',
            message: 'Tenant isolation check failed',
            code: 'TENANT_ISOLATION_ERROR'
        });
    }
}
//# sourceMappingURL=rls-tenant.middleware.js.map