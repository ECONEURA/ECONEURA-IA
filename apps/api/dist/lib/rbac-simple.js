import { structuredLogger } from './structured-logger.js';
export class SimpleRBACService {
    permissions = new Map();
    roles = new Map();
    userRoles = new Map();
    constructor() {
        this.initializeDefaultData();
        structuredLogger.info('Simple RBAC Service initialized');
    }
    async hasPermission(userId, orgId, resource, action) {
        try {
            const userRolesArr = this.userRoles.get(`${userId}:${orgId}`) || [];
            const userPermissions = this.getUserPermissionsFromRoles(userRolesArr);
            return userPermissions.some((permission) => permission.resource === resource && permission.action === action);
        }
        catch (error) {
            structuredLogger.error('Error checking permission', error);
            return false;
        }
    }
    async hasRole(userId, orgId, roleName) {
        const userRolesArr = this.userRoles.get(`${userId}:${orgId}`) || [];
        return userRolesArr.some((userRole) => {
            const role = this.roles.get(userRole.roleId);
            return role && role.name === roleName;
        });
    }
    async getUserPermissions(userId, orgId) {
        const userRolesArr = this.userRoles.get(`${userId}:${orgId}`) || [];
        return this.getUserPermissionsFromRoles(userRolesArr);
    }
    async getUserRoles(userId, orgId) {
        const userRolesArr = this.userRoles.get(`${userId}:${orgId}`) || [];
        return userRolesArr
            .map((ur) => this.roles.get(ur.roleId))
            .filter((role) => role !== undefined);
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
        const userRole = { userId, roleId, orgId };
        const key = `${userId}:${orgId}`;
        const existingRoles = this.userRoles.get(key) || [];
        existingRoles.push(userRole);
        this.userRoles.set(key, existingRoles);
    }
    async getAllPermissions() {
        return Array.from(this.permissions.values());
    }
    async getAllRoles() {
        return Array.from(this.roles.values());
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
            totalUserRoles: Array.from(this.userRoles.values()).flat().length,
            lastUpdated: new Date().toISOString()
        };
    }
}
export const simpleRBAC = new SimpleRBACService();
//# sourceMappingURL=rbac-simple.js.map