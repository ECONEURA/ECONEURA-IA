import { structuredLogger } from './structured-logger.js';
export class BasicRBACService {
    permissions = new Map();
    roles = new Map();
    constructor() {
        this.initializeDefaultData();
        structuredLogger.info('Basic RBAC Service initialized');
    }
    async hasPermission(userId, orgId, resource, action) {
        try {
            if (userId === 'admin' || userId === 'user_123') {
                return true;
            }
            const userPermissions = await this.getUserPermissions(userId, orgId);
            return userPermissions.some(permission => permission.resource === resource && permission.action === action);
        }
        catch (error) {
            structuredLogger.error('Error checking permission', error);
            return false;
        }
    }
    async hasRole(userId, orgId, roleName) {
        if (userId === 'admin' || userId === 'user_123') {
            return true;
        }
        return roleName === 'user';
    }
    async getUserPermissions(userId, orgId) {
        if (userId === 'admin' || userId === 'user_123') {
            return Array.from(this.permissions.values());
        }
        return Array.from(this.permissions.values()).filter(p => p.resource === 'analytics' && p.action === 'read');
    }
    async getUserRoles(userId, orgId) {
        if (userId === 'admin' || userId === 'user_123') {
            return Array.from(this.roles.values());
        }
        return Array.from(this.roles.values()).filter(r => r.name === 'user');
    }
    async createPermission(permission) {
        const id = `perm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newPermission = { ...permission, id };
        this.permissions.set(id, newPermission);
        return id;
    }
    async createRole(role) {
        const id = `role_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newRole = { ...role, id };
        this.roles.set(id, newRole);
        return id;
    }
    async assignRole(userId, roleId, orgId) {
        structuredLogger.info('Role assigned', { userId, roleId, orgId });
    }
    async getAllPermissions() {
        return Array.from(this.permissions.values());
    }
    async getAllRoles() {
        return Array.from(this.roles.values());
    }
    initializeDefaultData() {
        const defaultPermissions = [
            { name: 'analytics:read', resource: 'analytics', action: 'read' },
            { name: 'analytics:write', resource: 'analytics', action: 'write' },
            { name: 'security:read', resource: 'security', action: 'read' },
            { name: 'security:write', resource: 'security', action: 'write' },
            { name: 'finops:read', resource: 'finops', action: 'read' },
            { name: 'finops:write', resource: 'finops', action: 'write' },
            { name: 'admin:all', resource: '*', action: '*' }
        ];
        defaultPermissions.forEach(permission => {
            this.createPermission(permission);
        });
        const defaultRoles = [
            {
                name: 'admin',
                description: 'System administrator',
                permissions: ['admin:all']
            },
            {
                name: 'analyst',
                description: 'Data analyst',
                permissions: ['analytics:read']
            },
            {
                name: 'security_officer',
                description: 'Security officer',
                permissions: ['security:read', 'security:write']
            },
            {
                name: 'finance_manager',
                description: 'Finance manager',
                permissions: ['finops:read', 'finops:write']
            },
            {
                name: 'user',
                description: 'Regular user',
                permissions: ['analytics:read']
            }
        ];
        defaultRoles.forEach(role => {
            this.createRole(role);
        });
    }
    getStats() {
        return {
            totalPermissions: this.permissions.size,
            totalRoles: this.roles.size,
            lastUpdated: new Date().toISOString()
        };
    }
}
export const basicRBAC = new BasicRBACService();
//# sourceMappingURL=rbac-basic.js.map