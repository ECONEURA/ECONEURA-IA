import { structuredLogger } from '../lib/structured-logger.js';
import { metrics } from '@econeura/shared/src/metrics/index.js';
export class RBACService {
    static instance;
    roles = new Map();
    permissions = new Map();
    userRoles = new Map();
    accessPolicies = new Map();
    auditLogs = [];
    isMonitoring = false;
    monitoringInterval = null;
    constructor() {
        this.initializeDefaultRoles();
        this.initializeDefaultPermissions();
        this.startMonitoring();
    }
    static getInstance() {
        if (!RBACService.instance) {
            RBACService.instance = new RBACService();
        }
        return RBACService.instance;
    }
    initializeDefaultRoles() {
        const defaultRoles = [
            {
                id: 'admin',
                name: 'Administrator',
                description: 'Full system access with all permissions',
                permissions: ['*'],
                inheritedRoles: [],
                organizationId: 'system',
                isSystem: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 'manager',
                name: 'Manager',
                description: 'Management level access with most permissions',
                permissions: [
                    'users:read', 'users:update',
                    'companies:read', 'companies:create', 'companies:update',
                    'contacts:read', 'contacts:create', 'contacts:update',
                    'deals:read', 'deals:create', 'deals:update',
                    'invoices:read', 'invoices:create', 'invoices:update',
                    'reports:read', 'reports:create'
                ],
                inheritedRoles: [],
                organizationId: 'system',
                isSystem: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 'sales',
                name: 'Sales Representative',
                description: 'Sales focused access with CRM permissions',
                permissions: [
                    'companies:read', 'companies:create', 'companies:update',
                    'contacts:read', 'contacts:create', 'contacts:update',
                    'deals:read', 'deals:create', 'deals:update',
                    'products:read',
                    'reports:read'
                ],
                inheritedRoles: [],
                organizationId: 'system',
                isSystem: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 'accounting',
                name: 'Accounting',
                description: 'Financial and accounting focused access',
                permissions: [
                    'companies:read',
                    'invoices:read', 'invoices:create', 'invoices:update',
                    'payments:read', 'payments:create', 'payments:update',
                    'reports:read', 'reports:create',
                    'financial:read', 'financial:create', 'financial:update'
                ],
                inheritedRoles: [],
                organizationId: 'system',
                isSystem: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 'support',
                name: 'Support',
                description: 'Customer support access with limited permissions',
                permissions: [
                    'companies:read',
                    'contacts:read', 'contacts:update',
                    'tickets:read', 'tickets:create', 'tickets:update',
                    'products:read'
                ],
                inheritedRoles: [],
                organizationId: 'system',
                isSystem: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 'viewer',
                name: 'Viewer',
                description: 'Read-only access to most resources',
                permissions: [
                    'companies:read',
                    'contacts:read',
                    'deals:read',
                    'invoices:read',
                    'products:read',
                    'reports:read'
                ],
                inheritedRoles: [],
                organizationId: 'system',
                isSystem: true,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ];
        for (const role of defaultRoles) {
            this.roles.set(role.id, role);
        }
        structuredLogger.info('Default roles initialized', {
            rolesCount: defaultRoles.length
        });
    }
    initializeDefaultPermissions() {
        const defaultPermissions = [
            { id: 'users:read', name: 'Read Users', resource: 'users', action: 'read', description: 'View user information', category: 'users' },
            { id: 'users:create', name: 'Create Users', resource: 'users', action: 'create', description: 'Create new users', category: 'users' },
            { id: 'users:update', name: 'Update Users', resource: 'users', action: 'update', description: 'Modify user information', category: 'users' },
            { id: 'users:delete', name: 'Delete Users', resource: 'users', action: 'delete', description: 'Remove users', category: 'users' },
            { id: 'companies:read', name: 'Read Companies', resource: 'companies', action: 'read', description: 'View company information', category: 'companies' },
            { id: 'companies:create', name: 'Create Companies', resource: 'companies', action: 'create', description: 'Create new companies', category: 'companies' },
            { id: 'companies:update', name: 'Update Companies', resource: 'companies', action: 'update', description: 'Modify company information', category: 'companies' },
            { id: 'companies:delete', name: 'Delete Companies', resource: 'companies', action: 'delete', description: 'Remove companies', category: 'companies' },
            { id: 'contacts:read', name: 'Read Contacts', resource: 'contacts', action: 'read', description: 'View contact information', category: 'contacts' },
            { id: 'contacts:create', name: 'Create Contacts', resource: 'contacts', action: 'create', description: 'Create new contacts', category: 'contacts' },
            { id: 'contacts:update', name: 'Update Contacts', resource: 'contacts', action: 'update', description: 'Modify contact information', category: 'contacts' },
            { id: 'contacts:delete', name: 'Delete Contacts', resource: 'contacts', action: 'delete', description: 'Remove contacts', category: 'contacts' },
            { id: 'deals:read', name: 'Read Deals', resource: 'deals', action: 'read', description: 'View deal information', category: 'deals' },
            { id: 'deals:create', name: 'Create Deals', resource: 'deals', action: 'create', description: 'Create new deals', category: 'deals' },
            { id: 'deals:update', name: 'Update Deals', resource: 'deals', action: 'update', description: 'Modify deal information', category: 'deals' },
            { id: 'deals:delete', name: 'Delete Deals', resource: 'deals', action: 'delete', description: 'Remove deals', category: 'deals' },
            { id: 'invoices:read', name: 'Read Invoices', resource: 'invoices', action: 'read', description: 'View invoice information', category: 'invoices' },
            { id: 'invoices:create', name: 'Create Invoices', resource: 'invoices', action: 'create', description: 'Create new invoices', category: 'invoices' },
            { id: 'invoices:update', name: 'Update Invoices', resource: 'invoices', action: 'update', description: 'Modify invoice information', category: 'invoices' },
            { id: 'invoices:delete', name: 'Delete Invoices', resource: 'invoices', action: 'delete', description: 'Remove invoices', category: 'invoices' },
            { id: 'products:read', name: 'Read Products', resource: 'products', action: 'read', description: 'View product information', category: 'products' },
            { id: 'products:create', name: 'Create Products', resource: 'products', action: 'create', description: 'Create new products', category: 'products' },
            { id: 'products:update', name: 'Update Products', resource: 'products', action: 'update', description: 'Modify product information', category: 'products' },
            { id: 'products:delete', name: 'Delete Products', resource: 'products', action: 'delete', description: 'Remove products', category: 'products' },
            { id: 'reports:read', name: 'Read Reports', resource: 'reports', action: 'read', description: 'View reports', category: 'reports' },
            { id: 'reports:create', name: 'Create Reports', resource: 'reports', action: 'create', description: 'Create new reports', category: 'reports' },
            { id: 'reports:export', name: 'Export Reports', resource: 'reports', action: 'export', description: 'Export reports', category: 'reports' },
            { id: 'financial:read', name: 'Read Financial Data', resource: 'financial', action: 'read', description: 'View financial information', category: 'financial' },
            { id: 'financial:create', name: 'Create Financial Records', resource: 'financial', action: 'create', description: 'Create financial records', category: 'financial' },
            { id: 'financial:update', name: 'Update Financial Records', resource: 'financial', action: 'update', description: 'Modify financial records', category: 'financial' },
            { id: 'payments:read', name: 'Read Payments', resource: 'payments', action: 'read', description: 'View payment information', category: 'payments' },
            { id: 'payments:create', name: 'Create Payments', resource: 'payments', action: 'create', description: 'Create new payments', category: 'payments' },
            { id: 'payments:update', name: 'Update Payments', resource: 'payments', action: 'update', description: 'Modify payment information', category: 'payments' },
            { id: 'tickets:read', name: 'Read Tickets', resource: 'tickets', action: 'read', description: 'View support tickets', category: 'tickets' },
            { id: 'tickets:create', name: 'Create Tickets', resource: 'tickets', action: 'create', description: 'Create new tickets', category: 'tickets' },
            { id: 'tickets:update', name: 'Update Tickets', resource: 'tickets', action: 'update', description: 'Modify ticket information', category: 'tickets' },
            { id: 'system:admin', name: 'System Administration', resource: 'system', action: 'admin', description: 'Full system administration', category: 'system' },
            { id: 'system:config', name: 'System Configuration', resource: 'system', action: 'config', description: 'Configure system settings', category: 'system' },
            { id: 'system:monitor', name: 'System Monitoring', resource: 'system', action: 'monitor', description: 'Monitor system health', category: 'system' }
        ];
        for (const permission of defaultPermissions) {
            this.permissions.set(permission.id, permission);
        }
        structuredLogger.info('Default permissions initialized', {
            permissionsCount: defaultPermissions.length
        });
    }
    async checkPermission(userId, permission, resource, organizationId) {
        try {
            const startTime = Date.now();
            const userRoles = this.getUserRoles(userId, organizationId);
            if (userRoles.length === 0) {
                return this.createAccessDecision(false, 'No roles assigned', [], [], startTime);
            }
            const hasDirectPermission = this.checkDirectPermission(userRoles, permission);
            if (hasDirectPermission.allowed) {
                return this.createAccessDecision(true, 'Direct permission granted', hasDirectPermission.matchedRules, [], startTime);
            }
            const policyDecision = await this.evaluateAccessPolicies(userId, permission, resource, organizationId);
            if (policyDecision.allowed) {
                return this.createAccessDecision(true, 'Policy permission granted', [], policyDecision.evaluatedPolicies, startTime);
            }
            const inheritedPermission = this.checkInheritedPermission(userRoles, permission);
            if (inheritedPermission.allowed) {
                return this.createAccessDecision(true, 'Inherited permission granted', inheritedPermission.matchedRules, [], startTime);
            }
            const decision = this.createAccessDecision(false, 'Permission denied', [], [], startTime);
            this.recordAuditLog({
                userId,
                organizationId: organizationId || 'unknown',
                action: permission,
                resource: resource || 'unknown',
                result: 'denied',
                reason: decision.reason,
                ipAddress: '127.0.0.1',
                userAgent: 'RBACService',
                timestamp: new Date(),
                metadata: { userRoles: userRoles.map(ur => ur.roleId) }
            });
            metrics.securityPermissionChecks.inc({
                userId,
                permission,
                result: 'denied'
            });
            return decision;
        }
        catch (error) {
            structuredLogger.error('Permission check error', {
                userId,
                permission,
                error: error instanceof Error ? error.message : String(error)
            });
            return this.createAccessDecision(false, 'Error checking permission', [], [], Date.now());
        }
    }
    async assignRole(userId, roleId, organizationId, assignedBy, expiresAt) {
        try {
            const role = this.roles.get(roleId);
            if (!role) {
                throw new Error('Role not found');
            }
            const userRole = {
                userId,
                roleId,
                organizationId,
                assignedBy,
                assignedAt: new Date(),
                expiresAt,
                isActive: true
            };
            const userRoles = this.userRoles.get(userId) || [];
            userRoles.push(userRole);
            this.userRoles.set(userId, userRoles);
            structuredLogger.info('Role assigned to user', {
                userId,
                roleId,
                roleName: role.name,
                organizationId,
                assignedBy,
                expiresAt
            });
            metrics.securityRolesAssigned.inc({
                userId,
                roleId,
                organizationId
            });
            return true;
        }
        catch (error) {
            structuredLogger.error('Failed to assign role', {
                userId,
                roleId,
                organizationId,
                error: error instanceof Error ? error.message : String(error)
            });
            return false;
        }
    }
    async revokeRole(userId, roleId, organizationId, revokedBy) {
        try {
            const userRoles = this.userRoles.get(userId) || [];
            const roleIndex = userRoles.findIndex(ur => ur.roleId === roleId && ur.organizationId === organizationId && ur.isActive);
            if (roleIndex === -1) {
                throw new Error('User role not found');
            }
            userRoles[roleIndex].isActive = false;
            this.userRoles.set(userId, userRoles);
            structuredLogger.info('Role revoked from user', {
                userId,
                roleId,
                organizationId,
                revokedBy
            });
            metrics.securityRolesRevoked.inc({
                userId,
                roleId,
                organizationId
            });
            return true;
        }
        catch (error) {
            structuredLogger.error('Failed to revoke role', {
                userId,
                roleId,
                organizationId,
                error: error instanceof Error ? error.message : String(error)
            });
            return false;
        }
    }
    async createRole(role) {
        try {
            const newRole = {
                ...role,
                id: this.generateRoleId(),
                createdAt: new Date(),
                updatedAt: new Date()
            };
            this.roles.set(newRole.id, newRole);
            structuredLogger.info('Role created', {
                roleId: newRole.id,
                roleName: newRole.name,
                organizationId: newRole.organizationId,
                permissionsCount: newRole.permissions.length
            });
            metrics.securityRolesCreated.inc({
                organizationId: newRole.organizationId
            });
            return newRole;
        }
        catch (error) {
            structuredLogger.error('Failed to create role', {
                roleName: role.name,
                error: error instanceof Error ? error.message : String(error)
            });
            throw new Error('Failed to create role');
        }
    }
    async createAccessPolicy(policy) {
        try {
            const newPolicy = {
                ...policy,
                id: this.generatePolicyId(),
                createdAt: new Date(),
                updatedAt: new Date()
            };
            const organizationPolicies = this.accessPolicies.get(newPolicy.organizationId) || [];
            organizationPolicies.push(newPolicy);
            this.accessPolicies.set(newPolicy.organizationId, organizationPolicies);
            structuredLogger.info('Access policy created', {
                policyId: newPolicy.id,
                policyName: newPolicy.name,
                organizationId: newPolicy.organizationId,
                rulesCount: newPolicy.rules.length
            });
            metrics.securityAccessPoliciesCreated.inc({
                organizationId: newPolicy.organizationId
            });
            return newPolicy;
        }
        catch (error) {
            structuredLogger.error('Failed to create access policy', {
                policyName: policy.name,
                error: error instanceof Error ? error.message : String(error)
            });
            throw new Error('Failed to create access policy');
        }
    }
    getUserRoles(userId, organizationId) {
        const userRoles = this.userRoles.get(userId) || [];
        const now = new Date();
        return userRoles.filter(ur => {
            if (!ur.isActive)
                return false;
            if (organizationId && ur.organizationId !== organizationId)
                return false;
            if (ur.expiresAt && ur.expiresAt < now)
                return false;
            return true;
        });
    }
    getUserPermissions(userId, organizationId) {
        const userRoles = this.getUserRoles(userId, organizationId);
        const permissions = new Set();
        for (const userRole of userRoles) {
            const role = this.roles.get(userRole.roleId);
            if (role) {
                for (const permission of role.permissions) {
                    if (permission === '*') {
                        return ['*'];
                    }
                    permissions.add(permission);
                }
                for (const inheritedRoleId of role.inheritedRoles) {
                    const inheritedRole = this.roles.get(inheritedRoleId);
                    if (inheritedRole) {
                        for (const permission of inheritedRole.permissions) {
                            permissions.add(permission);
                        }
                    }
                }
            }
        }
        return Array.from(permissions);
    }
    getRBACStats() {
        const totalRoles = this.roles.size;
        const totalPermissions = this.permissions.size;
        const totalUsers = this.userRoles.size;
        const totalPolicies = Array.from(this.accessPolicies.values()).reduce((sum, policies) => sum + policies.length, 0);
        const auditLogs = this.auditLogs.length;
        const systemRoles = Array.from(this.roles.values()).filter(r => r.isSystem).length;
        const customRoles = totalRoles - systemRoles;
        return {
            totalRoles,
            totalPermissions,
            totalUsers,
            totalPolicies,
            auditLogs,
            systemRoles,
            customRoles
        };
    }
    checkDirectPermission(userRoles, permission) {
        const matchedRules = [];
        for (const userRole of userRoles) {
            const role = this.roles.get(userRole.roleId);
            if (role) {
                if (role.permissions.includes('*') || role.permissions.includes(permission)) {
                    matchedRules.push(role.id);
                    return { allowed: true, matchedRules };
                }
            }
        }
        return { allowed: false, matchedRules };
    }
    checkInheritedPermission(userRoles, permission) {
        const matchedRules = [];
        for (const userRole of userRoles) {
            const role = this.roles.get(userRole.roleId);
            if (role) {
                for (const inheritedRoleId of role.inheritedRoles) {
                    const inheritedRole = this.roles.get(inheritedRoleId);
                    if (inheritedRole && inheritedRole.permissions.includes(permission)) {
                        matchedRules.push(inheritedRoleId);
                        return { allowed: true, matchedRules };
                    }
                }
            }
        }
        return { allowed: false, matchedRules };
    }
    async evaluateAccessPolicies(userId, permission, resource, organizationId) {
        const evaluatedPolicies = [];
        if (!organizationId) {
            return { allowed: false, evaluatedPolicies };
        }
        const policies = this.accessPolicies.get(organizationId) || [];
        for (const policy of policies) {
            if (!policy.isActive)
                continue;
            evaluatedPolicies.push(policy.id);
            for (const rule of policy.rules) {
                if (rule.resource === resource && rule.actions.includes(permission)) {
                    if (rule.effect === 'allow') {
                        return { allowed: true, evaluatedPolicies };
                    }
                    else if (rule.effect === 'deny') {
                        return { allowed: false, evaluatedPolicies };
                    }
                }
            }
        }
        return { allowed: false, evaluatedPolicies };
    }
    createAccessDecision(allowed, reason, matchedRules, evaluatedPolicies, startTime) {
        return {
            allowed,
            reason,
            matchedRules,
            evaluatedPolicies,
            timestamp: new Date()
        };
    }
    recordAuditLog(log) {
        this.auditLogs.push(log);
        if (this.auditLogs.length > 10000) {
            this.auditLogs = this.auditLogs.slice(-10000);
        }
        structuredLogger.info('RBAC audit log recorded', {
            userId: log.userId,
            action: log.action,
            resource: log.resource,
            result: log.result
        });
        metrics.securityAuditLogs.inc({
            action: log.action,
            result: log.result
        });
    }
    generateRoleId() {
        return `role_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generatePolicyId() {
        return `policy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    startMonitoring() {
        if (this.isMonitoring)
            return;
        this.isMonitoring = true;
        this.monitoringInterval = setInterval(() => {
            this.performRBACMonitoring();
        }, 300000);
        structuredLogger.info('RBAC monitoring started');
    }
    performRBACMonitoring() {
        try {
            this.cleanupExpiredRoles();
            this.cleanupOldAuditLogs();
            structuredLogger.debug('RBAC monitoring completed', {
                totalRoles: this.roles.size,
                totalUsers: this.userRoles.size,
                auditLogs: this.auditLogs.length
            });
        }
        catch (error) {
            structuredLogger.error('RBAC monitoring failed', {
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }
    cleanupExpiredRoles() {
        const now = new Date();
        let cleanedCount = 0;
        for (const [userId, userRoles] of this.userRoles.entries()) {
            const activeRoles = userRoles.filter(ur => {
                if (!ur.isActive)
                    return false;
                if (ur.expiresAt && ur.expiresAt < now) {
                    cleanedCount++;
                    return false;
                }
                return true;
            });
            this.userRoles.set(userId, activeRoles);
        }
        if (cleanedCount > 0) {
            structuredLogger.info('Expired roles cleaned up', {
                count: cleanedCount
            });
        }
    }
    cleanupOldAuditLogs() {
        const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const initialCount = this.auditLogs.length;
        this.auditLogs = this.auditLogs.filter(log => log.timestamp > cutoffDate);
        const cleanedCount = initialCount - this.auditLogs.length;
        if (cleanedCount > 0) {
            structuredLogger.info('Old audit logs cleaned up', {
                count: cleanedCount
            });
        }
    }
    stop() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        this.isMonitoring = false;
        structuredLogger.info('RBAC service stopped');
    }
}
export const rbacService = RBACService.getInstance();
//# sourceMappingURL=rbac.service.js.map