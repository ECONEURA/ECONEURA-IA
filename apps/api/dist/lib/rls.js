import { logger } from './logger.js';
export class RowLevelSecurity {
    rules = new Map();
    context = null;
    constructor() {
        logger.info('Row Level Security system initialized');
        this.initializeDefaultRules();
    }
    setContext(context) {
        this.context = context;
        logger.debug('RLS context set', {
            organizationId: context.organizationId,
            userId: context.userId,
            role: context.role,
            requestId: context.requestId,
        });
    }
    getContext() {
        return this.context;
    }
    clearContext() {
        this.context = null;
        logger.debug('RLS context cleared');
    }
    createRule(ruleData) {
        const id = `rls_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const rule = {
            ...ruleData,
            id,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.rules.set(id, rule);
        logger.info('RLS rule created', {
            ruleId: id,
            table: ruleData.table,
            organizationId: ruleData.organizationId,
        });
        return id;
    }
    updateRule(ruleId, updates) {
        const rule = this.rules.get(ruleId);
        if (!rule)
            return false;
        const updatedRule = {
            ...rule,
            ...updates,
            updatedAt: new Date(),
        };
        this.rules.set(ruleId, updatedRule);
        logger.info('RLS rule updated', { ruleId, updates });
        return true;
    }
    deleteRule(ruleId) {
        const deleted = this.rules.delete(ruleId);
        if (deleted) {
            logger.info('RLS rule deleted', { ruleId });
        }
        return deleted;
    }
    getRulesByOrganization(organizationId) {
        return Array.from(this.rules.values()).filter(rule => rule.organizationId === organizationId && rule.isActive);
    }
    getRulesByTable(table) {
        return Array.from(this.rules.values()).filter(rule => rule.table === table && rule.isActive);
    }
    applyRLSFilters(table, baseQuery = {}) {
        if (!this.context) {
            logger.warn('No RLS context available, applying default filters');
            return this.applyDefaultFilters(table, baseQuery);
        }
        const rules = this.getRulesByTable(table);
        let filteredQuery = { ...baseQuery };
        for (const rule of rules) {
            if (this.evaluateRule(rule)) {
                filteredQuery = this.applyRuleCondition(rule, filteredQuery);
            }
        }
        filteredQuery = this.applyDefaultFilters(table, filteredQuery);
        logger.debug('RLS filters applied', {
            table,
            organizationId: this.context.organizationId,
            userId: this.context.userId,
            originalQuery: baseQuery,
            filteredQuery,
        });
        return filteredQuery;
    }
    evaluateRule(rule) {
        if (!this.context)
            return false;
        if (rule.organizationId !== this.context.organizationId) {
            return false;
        }
        return true;
    }
    applyRuleCondition(rule, query) {
        const condition = this.parseRuleCondition(rule.condition);
        return {
            ...query,
            ...condition,
        };
    }
    parseRuleCondition(condition) {
        const conditions = {};
        if (condition.includes('organization_id')) {
            conditions.organizationId = this.context?.organizationId;
        }
        if (condition.includes('user_id') && this.context?.userId) {
            conditions.userId = this.context.userId;
        }
        if (condition.includes('tenant_id') && this.context?.tenantId) {
            conditions.tenantId = this.context.tenantId;
        }
        return conditions;
    }
    applyDefaultFilters(table, query) {
        if (!this.context) {
            return query;
        }
        const defaultFilters = {
            organizationId: this.context.organizationId,
        };
        switch (table) {
            case 'users':
                if (this.context.userId) {
                    defaultFilters.id = this.context.userId;
                }
                break;
            case 'organizations':
                defaultFilters.id = this.context.organizationId;
                break;
            case 'budgets':
            case 'costs':
            case 'alerts':
                defaultFilters.organizationId = this.context.organizationId;
                break;
            default:
                defaultFilters.organizationId = this.context.organizationId;
        }
        return {
            ...query,
            ...defaultFilters,
        };
    }
    checkAccess(resource, action) {
        if (!this.context) {
            logger.warn('No RLS context available for access check');
            return false;
        }
        const hasPermission = this.hasPermission(resource, action);
        logger.debug('Access check', {
            resource,
            action,
            organizationId: this.context.organizationId,
            userId: this.context.userId,
            role: this.context.role,
            hasPermission,
        });
        return hasPermission;
    }
    hasPermission(resource, action) {
        if (!this.context)
            return false;
        const rolePermissions = this.getRolePermissions(this.context.role);
        const requiredPermission = `${resource}:${action}`;
        return rolePermissions.includes(requiredPermission) ||
            rolePermissions.includes('*:*') ||
            (this.context.permissions && this.context.permissions.includes(requiredPermission)) || false;
    }
    getRolePermissions(role) {
        const permissions = {
            'admin': [
                '*:*',
            ],
            'manager': [
                'organizations:read',
                'organizations:write',
                'users:read',
                'users:write',
                'budgets:read',
                'budgets:write',
                'costs:read',
                'alerts:read',
                'alerts:write',
            ],
            'user': [
                'organizations:read',
                'users:read',
                'budgets:read',
                'costs:read',
                'alerts:read',
            ],
            'viewer': [
                'organizations:read',
                'budgets:read',
                'costs:read',
            ],
        };
        return permissions[role || 'user'] || permissions['user'];
    }
    sanitizeInput(data, table) {
        if (!this.context) {
            logger.warn('No RLS context available for input sanitization');
            return data;
        }
        const sanitized = { ...data };
        sanitized.organizationId = this.context.organizationId;
        switch (table) {
            case 'users':
                if (this.context.userId) {
                    sanitized.createdBy = this.context.userId;
                    sanitized.updatedBy = this.context.userId;
                }
                break;
            case 'budgets':
            case 'costs':
            case 'alerts':
                sanitized.organizationId = this.context.organizationId;
                if (this.context.userId) {
                    sanitized.createdBy = this.context.userId;
                    sanitized.updatedBy = this.context.userId;
                }
                break;
        }
        logger.debug('Input sanitized', {
            table,
            organizationId: this.context.organizationId,
            originalData: data,
            sanitizedData: sanitized,
        });
        return sanitized;
    }
    validateOutput(data, table) {
        if (!this.context) {
            logger.warn('No RLS context available for output validation');
            return false;
        }
        if (data.organizationId && data.organizationId !== this.context.organizationId) {
            logger.warn('Data validation failed: organization mismatch', {
                expected: this.context.organizationId,
                actual: data.organizationId,
                table,
            });
            return false;
        }
        return true;
    }
    initializeDefaultRules() {
        const defaultRules = [
            {
                name: 'Organization Isolation',
                table: 'organizations',
                condition: 'organization_id = :org_id',
                organizationId: 'default',
                isActive: true,
            },
            {
                name: 'User Organization Access',
                table: 'users',
                condition: 'organization_id = :org_id',
                organizationId: 'default',
                isActive: true,
            },
            {
                name: 'Budget Organization Access',
                table: 'budgets',
                condition: 'organization_id = :org_id',
                organizationId: 'default',
                isActive: true,
            },
            {
                name: 'Cost Organization Access',
                table: 'costs',
                condition: 'organization_id = :org_id',
                organizationId: 'default',
                isActive: true,
            },
            {
                name: 'Alert Organization Access',
                table: 'alerts',
                condition: 'organization_id = :org_id',
                organizationId: 'default',
                isActive: true,
            },
        ];
        for (const ruleData of defaultRules) {
            this.createRule(ruleData);
        }
    }
    getStats() {
        return {
            totalRules: this.rules.size,
            activeRules: Array.from(this.rules.values()).filter(rule => rule.isActive).length,
            contextActive: this.context !== null,
        };
    }
}
export const rlsSystem = new RowLevelSecurity();
//# sourceMappingURL=rls.js.map