import { structuredLogger } from './structured-logger.js';
export class GranularRBACService {
    permissions = new Map();
    roles = new Map();
    userRoles = new Map();
    constructor() {
        this.initializeDefaultPermissions();
        this.initializeDefaultRoles();
        structuredLogger.info('Granular RBAC Service initialized');
    }
    async hasPermission(userId, orgId, resource, action, context) {
        try {
            const userRoles = this.getUserRoles(userId, orgId);
            const userPermissions = this.getUserPermissionsFromRoles(userRoles);
            const hasDirectPermission = userPermissions.some(permission => permission.resource === resource && permission.action === action);
            if (hasDirectPermission) {
                return true;
            }
            const hasWildcardPermission = userPermissions.some(permission => (permission.resource === '*' || permission.resource === resource) &&
                (permission.action === '*' || permission.action === action));
            if (hasWildcardPermission) {
                return true;
            }
            const hasConditionalPermission = userPermissions.some(permission => {
                if (permission.resource !== resource || permission.action !== action) {
                    return false;
                }
                if (!permission.conditions || !context) {
                    return true;
                }
                return this.evaluateConditions(permission.conditions, context);
            });
            return hasConditionalPermission;
        }
        catch (error) {
            structuredLogger.error('Error checking permission', error, {
                userId,
                orgId,
                resource,
                action
            });
            return false;
        }
    }
    async hasRole(userId, orgId, roleName) {
        const userRoles = this.getUserRoles(userId, orgId);
        return userRoles.some(userRole => {
            const role = this.roles.get(userRole.roleId);
            return role && role.name === roleName;
        });
    }
    async getUserPermissions(userId, orgId) {
        const userRoles = this.getUserRoles(userId, orgId);
        return this.getUserPermissionsFromRoles(userRoles);
    }
    async createPermission(permission) {
        const id = `perm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newPermission = {
            ...permission,
            id
        };
        this.permissions.set(id, newPermission);
        structuredLogger.info('Permission created', {
            permissionId: id,
            name: permission.name,
            resource: permission.resource,
            action: permission.action
        });
        return id;
    }
    async createRole(role) {
        const id = `role_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date().toISOString();
        const newRole = {
            ...role,
            id,
            createdAt: now,
            updatedAt: now
        };
        this.roles.set(id, newRole);
        structuredLogger.info('Role created', {
            roleId: id,
            name: role.name,
            permissionsCount: role.permissions.length
        });
        return id;
    }
    async assignRole(userId, roleId, orgId, assignedBy, expiresAt) {
        const userRole = {
            userId,
            roleId,
            orgId,
            assignedBy,
            assignedAt: new Date().toISOString(),
            expiresAt
        };
        const key = `${userId}:${orgId}`;
        const existingRoles = this.userRoles.get(key) || [];
        const existingRole = existingRoles.find(ur => ur.roleId === roleId);
        if (existingRole) {
            throw new Error('Role already assigned to user');
        }
        existingRoles.push(userRole);
        this.userRoles.set(key, existingRoles);
        structuredLogger.info('Role assigned to user', {
            userId,
            roleId,
            orgId,
            assignedBy
        });
    }
    async removeRole(userId, roleId, orgId) {
        const key = `${userId}:${orgId}`;
        const existingRoles = this.userRoles.get(key) || [];
        const filteredRoles = existingRoles.filter(ur => ur.roleId !== roleId);
        this.userRoles.set(key, filteredRoles);
        structuredLogger.info('Role removed from user', {
            userId,
            roleId,
            orgId
        });
    }
    async getAllPermissions() {
        return Array.from(this.permissions.values());
    }
    async getAllRoles() {
        return Array.from(this.roles.values());
    }
    async getUserRoles(userId, orgId) {
        const key = `${userId}:${orgId}`;
        const userRoles = this.userRoles.get(key) || [];
        return userRoles
            .filter(ur => !ur.expiresAt || new Date(ur.expiresAt) > new Date())
            .map(ur => this.roles.get(ur.roleId))
            .filter((role) => role !== undefined);
    }
    async getRBACContext(userId, orgId) {
        const userRoles = await this.getUserRoles(userId, orgId);
        const permissions = this.getUserPermissionsFromRoles(userRoles);
        return {
            userId,
            orgId,
            roles: userRoles.map(role => role.name),
            permissions: permissions.map(perm => `${perm.resource}:${perm.action}`),
            metadata: {
                rolesCount: userRoles.length,
                permissionsCount: permissions.length,
                lastUpdated: new Date().toISOString()
            }
        };
    }
    getUserPermissionsFromRoles(userRoles) {
        const permissions = [];
        for (const userRole of userRoles) {
            const role = this.roles.get(userRole.roleId);
            if (role) {
                for (const permissionId of role.permissions) {
                    const permission = this.permissions.get(permissionId);
                    if (permission) {
                        permissions.push(permission);
                    }
                }
            }
        }
        return permissions;
    }
    evaluateConditions(conditions, context) {
        for (const [key, expectedValue] of Object.entries(conditions)) {
            const actualValue = context[key];
            if (actualValue !== expectedValue) {
                return false;
            }
        }
        return true;
    }
    initializeDefaultPermissions() {
        const defaultPermissions = [
            { name: 'analytics:read', resource: 'analytics', action: 'read' },
            { name: 'analytics:write', resource: 'analytics', action: 'write' },
            { name: 'analytics:export', resource: 'analytics', action: 'export' },
            { name: 'security:read', resource: 'security', action: 'read' },
            { name: 'security:write', resource: 'security', action: 'write' },
            { name: 'security:admin', resource: 'security', action: 'admin' },
            { name: 'finops:read', resource: 'finops', action: 'read' },
            { name: 'finops:write', resource: 'finops', action: 'write' },
            { name: 'finops:admin', resource: 'finops', action: 'admin' },
            { name: 'gdpr:read', resource: 'gdpr', action: 'read' },
            { name: 'gdpr:export', resource: 'gdpr', action: 'export' },
            { name: 'gdpr:erase', resource: 'gdpr', action: 'erase' },
            { name: 'sepa:read', resource: 'sepa', action: 'read' },
            { name: 'sepa:write', resource: 'sepa', action: 'write' },
            { name: 'admin:all', resource: '*', action: '*' },
            { name: 'user:manage', resource: 'user', action: '*' },
            { name: 'role:manage', resource: 'role', action: '*' }
        ];
        defaultPermissions.forEach(async (permission) => {
            await this.createPermission(permission);
        });
    }
    initializeDefaultRoles() {
        const defaultRoles = [
            {
                name: 'admin',
                description: 'System administrator with full access',
                permissions: ['admin:all'],
                isSystem: true
            },
            {
                name: 'analyst',
                description: 'Data analyst with read access to analytics',
                permissions: ['analytics:read', 'analytics:export'],
                isSystem: true
            },
            {
                name: 'security_officer',
                description: 'Security officer with security management access',
                permissions: ['security:read', 'security:write', 'security:admin'],
                isSystem: true
            },
            {
                name: 'finance_manager',
                description: 'Finance manager with FinOps access',
                permissions: ['finops:read', 'finops:write', 'finops:admin'],
                isSystem: true
            },
            {
                name: 'compliance_officer',
                description: 'Compliance officer with GDPR access',
                permissions: ['gdpr:read', 'gdpr:export', 'gdpr:erase'],
                isSystem: true
            },
            {
                name: 'user',
                description: 'Regular user with basic access',
                permissions: ['analytics:read'],
                isSystem: true
            }
        ];
        defaultRoles.forEach(async (role) => {
            await this.createRole(role);
        });
    }
    getStats() {
        return {
            totalPermissions: this.permissions.size,
            totalRoles: this.roles.size,
            totalUserRoles: Array.from(this.userRoles.values()).flat().length,
            lastUpdated: new Date().toISOString()
        };
    }
}
export const granularRBAC = new GranularRBACService();
//# sourceMappingURL=rbac-granular.js.map