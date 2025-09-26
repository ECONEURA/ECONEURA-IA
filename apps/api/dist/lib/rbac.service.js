import { getDatabaseService } from '@econeura/db';
import { eq, and, inArray } from 'drizzle-orm';
import { organizations, roles, permissions, rolePermissions, userRoles } from '@econeura/db/schema';

import { structuredLogger } from './structured-logger.js';
export class RBACService {
    config;
    db;
    permissionCache = new Map();
    roleCache = new Map();
    constructor(config) {
        this.config = {
            enableInheritance: true,
            enableCustomRoles: true,
            enablePermissionOverrides: true,
            enableAuditLogging: true,
            cachePermissions: true,
            cacheTTL: 300000,
            ...config
        };
        this.db = getDatabaseService();
        this.initializeSystemRoles();
        this.startCacheCleanup();
    }
    async createPermission(permissionData) {
        try {
            const db = this.db.getDatabase();
            const newPermission = await db.insert(permissions).values({
                name: permissionData.name,
                resource: permissionData.resource,
                action: permissionData.action,
                description: permissionData.description,
                category: permissionData.category,
                organizationId: permissionData.organizationId,
                createdAt: new Date(),
                updatedAt: new Date()
            }).returning();
            this.clearPermissionCache(permissionData.organizationId);
            structuredLogger.info('Permission created', {
                permissionId: newPermission[0].id,
                name: permissionData.name,
                resource: permissionData.resource,
                action: permissionData.action,
                organizationId: permissionData.organizationId
            });
            return newPermission[0];
        }
        catch (error) {
            structuredLogger.error('Failed to create permission', error);
            throw error;
        }
    }
    async getPermissions(organizationId) {
        try {
            if (this.config.cachePermissions) {
                const cached = this.permissionCache.get(organizationId);
                if (cached && (Date.now() - cached.timestamp) < this.config.cacheTTL) {
                    return cached.permissions;
                }
            }
            const db = this.db.getDatabase();
            const permissionsResult = await db.select()
                .from(permissions)
                .where(eq(permissions.organizationId, organizationId));
            const permissionsList = permissionsResult;
            if (this.config.cachePermissions) {
                this.permissionCache.set(organizationId, {
                    permissions: permissionsList,
                    timestamp: Date.now()
                });
            }
            return permissionsList;
        }
        catch (error) {
            structuredLogger.error('Failed to get permissions', error);
            throw error;
        }
    }
    async getPermissionById(permissionId) {
        try {
            const db = this.db.getDatabase();
            const permission = await db.select()
                .from(permissions)
                .where(eq(permissions.id, permissionId))
                .limit(1);
            return permission.length > 0 ? permission[0] : null;
        }
        catch (error) {
            structuredLogger.error('Failed to get permission by ID', error);
            throw error;
        }
    }
    async createRole(roleData) {
        try {
            const db = this.db.getDatabase();
            const newRole = await db.insert(roles).values({
                name: roleData.name,
                description: roleData.description,
                organizationId: roleData.organizationId,
                isSystem: false,
                createdAt: new Date(),
                updatedAt: new Date()
            }).returning();
            if (roleData.permissions.length > 0) {
                const rolePermissionValues = roleData.permissions.map(permissionId => ({
                    roleId: newRole[0].id,
                    permissionId,
                    createdAt: new Date()
                }));
                await db.insert(rolePermissions).values(rolePermissionValues);
            }
            this.clearRoleCache(roleData.organizationId);
            structuredLogger.info('Role created', {
                roleId: newRole[0].id,
                name: roleData.name,
                organizationId: roleData.organizationId,
                permissionsCount: roleData.permissions.length,
                createdBy: roleData.createdBy
            });
            return await this.getRoleById(newRole[0].id);
        }
        catch (error) {
            structuredLogger.error('Failed to create role', error);
            throw error;
        }
    }
    async getRoles(organizationId) {
        try {
            const db = this.db.getDatabase();
            const rolesResult = await db.select()
                .from(roles)
                .where(eq(roles.organizationId, organizationId));
            const rolesList = [];
            for (const role of rolesResult) {
                const roleWithPermissions = await this.getRoleById(role.id);
                if (roleWithPermissions) {
                    rolesList.push(roleWithPermissions);
                }
            }
            return rolesList;
        }
        catch (error) {
            structuredLogger.error('Failed to get roles', error);
            throw error;
        }
    }
    async getRoleById(roleId) {
        try {
            if (this.config.cachePermissions) {
                const cached = this.roleCache.get(roleId);
                if (cached && (Date.now() - cached.timestamp) < this.config.cacheTTL) {
                    return cached.role;
                }
            }
            const db = this.db.getDatabase();
            const roleResult = await db.select()
                .from(roles)
                .where(eq(roles.id, roleId))
                .limit(1);
            if (roleResult.length === 0) {
                return null;
            }
            const role = roleResult[0];
            const permissionsResult = await db.select({
                permission: permissions
            })
                .from(rolePermissions)
                .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
                .where(eq(rolePermissions.roleId, roleId));
            const rolePermissions = permissionsResult.map(rp => rp.permission);
            const roleWithPermissions = {
                ...role,
                permissions: rolePermissions
            };
            if (this.config.cachePermissions) {
                this.roleCache.set(roleId, {
                    role: roleWithPermissions,
                    timestamp: Date.now()
                });
            }
            return roleWithPermissions;
        }
        catch (error) {
            structuredLogger.error('Failed to get role by ID', error);
            throw error;
        }
    }
    async updateRole(roleId, updates) {
        try {
            const db = this.db.getDatabase();
            if (updates.name || updates.description) {
                await db.update(roles)
                    .set({
                    ...(updates.name && { name: updates.name }),
                    ...(updates.description && { description: updates.description }),
                    updatedAt: new Date()
                })
                    .where(eq(roles.id, roleId));
            }
            if (updates.permissions) {
                await db.delete(rolePermissions)
                    .where(eq(rolePermissions.roleId, roleId));
                if (updates.permissions.length > 0) {
                    const rolePermissionValues = updates.permissions.map(permissionId => ({
                        roleId,
                        permissionId,
                        createdAt: new Date()
                    }));
                    await db.insert(rolePermissions).values(rolePermissionValues);
                }
            }
            this.clearRoleCache(roleId);
            structuredLogger.info('Role updated', {
                roleId,
                updates
            });
            return await this.getRoleById(roleId);
        }
        catch (error) {
            structuredLogger.error('Failed to update role', error);
            throw error;
        }
    }
    async deleteRole(roleId) {
        try {
            const db = this.db.getDatabase();
            const role = await db.select()
                .from(roles)
                .where(eq(roles.id, roleId))
                .limit(1);
            if (role.length === 0) {
                throw new Error('Role not found');
            }
            if (role[0].isSystem) {
                throw new Error('Cannot delete system role');
            }
            const userRolesResult = await db.select()
                .from(userRoles)
                .where(eq(userRoles.roleId, roleId))
                .limit(1);
            if (userRolesResult.length > 0) {
                throw new Error('Cannot delete role that is assigned to users');
            }
            await db.delete(rolePermissions)
                .where(eq(rolePermissions.roleId, roleId));
            await db.delete(roles)
                .where(eq(roles.id, roleId));
            this.clearRoleCache(roleId);
            structuredLogger.info('Role deleted', { roleId });
        }
        catch (error) {
            structuredLogger.error('Failed to delete role', error);
            throw error;
        }
    }
    async assignRoleToUser(userId, roleId, organizationId, assignedBy) {
        try {
            const db = this.db.getDatabase();
            const existingAssignment = await db.select()
                .from(userRoles)
                .where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, roleId), eq(userRoles.organizationId, organizationId)))
                .limit(1);
            if (existingAssignment.length > 0) {
                throw new Error('User already has this role');
            }
            await db.insert(userRoles).values({
                userId,
                roleId,
                organizationId,
                assignedAt: new Date(),
                assignedBy
            });
            this.clearUserPermissionCache(userId);
            structuredLogger.info('Role assigned to user', {
                userId,
                roleId,
                organizationId,
                assignedBy
            });
        }
        catch (error) {
            structuredLogger.error('Failed to assign role to user', error);
            throw error;
        }
    }
    async removeRoleFromUser(userId, roleId, organizationId) {
        try {
            const db = this.db.getDatabase();
            await db.delete(userRoles)
                .where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, roleId), eq(userRoles.organizationId, organizationId)));
            this.clearUserPermissionCache(userId);
            structuredLogger.info('Role removed from user', {
                userId,
                roleId,
                organizationId
            });
        }
        catch (error) {
            structuredLogger.error('Failed to remove role from user', error);
            throw error;
        }
    }
    async getUserRoles(userId, organizationId) {
        try {
            const db = this.db.getDatabase();
            const userRolesResult = await db.select({
                role: roles
            })
                .from(userRoles)
                .innerJoin(roles, eq(userRoles.roleId, roles.id))
                .where(and(eq(userRoles.userId, userId), eq(userRoles.organizationId, organizationId)));
            const rolesList = [];
            for (const userRole of userRolesResult) {
                const roleWithPermissions = await this.getRoleById(userRole.role.id);
                if (roleWithPermissions) {
                    rolesList.push(roleWithPermissions);
                }
            }
            return rolesList;
        }
        catch (error) {
            structuredLogger.error('Failed to get user roles', error);
            throw error;
        }
    }
    async hasPermission(userId, organizationId, permission) {
        try {
            const userPermissions = await this.getUserPermissions(userId, organizationId);
            return userPermissions.some(p => p.name === permission);
        }
        catch (error) {
            structuredLogger.error('Failed to check permission', error);
            return false;
        }
    }
    async hasAnyPermission(userId, organizationId, permissions) {
        try {
            const userPermissions = await this.getUserPermissions(userId, organizationId);
            return permissions.some(permission => userPermissions.some(p => p.name === permission));
        }
        catch (error) {
            structuredLogger.error('Failed to check any permission', error);
            return false;
        }
    }
    async hasAllPermissions(userId, organizationId, permissions) {
        try {
            const userPermissions = await this.getUserPermissions(userId, organizationId);
            return permissions.every(permission => userPermissions.some(p => p.name === permission));
        }
        catch (error) {
            structuredLogger.error('Failed to check all permissions', error);
            return false;
        }
    }
    async getUserPermissions(userId, organizationId) {
        try {
            const db = this.db.getDatabase();
            const userRolesResult = await db.select({
                roleId: userRoles.roleId
            })
                .from(userRoles)
                .where(and(eq(userRoles.userId, userId), eq(userRoles.organizationId, organizationId)));
            if (userRolesResult.length === 0) {
                return [];
            }
            const roleIds = userRolesResult.map(ur => ur.roleId);
            const permissionsResult = await db.select({
                permission: permissions
            })
                .from(rolePermissions)
                .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
                .where(inArray(rolePermissions.roleId, roleIds));
            const uniquePermissions = new Map();
            permissionsResult.forEach(rp => {
                const permission = rp.permission;
                uniquePermissions.set(permission.id, permission);
            });
            return Array.from(uniquePermissions.values());
        }
        catch (error) {
            structuredLogger.error('Failed to get user permissions', error);
            throw error;
        }
    }
    async initializeSystemRoles() {
        try {
            const db = this.db.getDatabase();
            const existingRoles = await db.select()
                .from(roles)
                .where(eq(roles.isSystem, true))
                .limit(1);
            if (existingRoles.length > 0) {
                return;
            }
            const systemPermissions = [
                { name: 'users:read', resource: 'users', action: 'read', description: 'Read users', category: 'users' },
                { name: 'users:write', resource: 'users', action: 'write', description: 'Create and update users', category: 'users' },
                { name: 'users:delete', resource: 'users', action: 'delete', description: 'Delete users', category: 'users' },
                { name: 'organizations:read', resource: 'organizations', action: 'read', description: 'Read organizations', category: 'organizations' },
                { name: 'organizations:write', resource: 'organizations', action: 'write', description: 'Create and update organizations', category: 'organizations' },
                { name: 'organizations:delete', resource: 'organizations', action: 'delete', description: 'Delete organizations', category: 'organizations' },
                { name: 'companies:read', resource: 'companies', action: 'read', description: 'Read companies', category: 'companies' },
                { name: 'companies:write', resource: 'companies', action: 'write', description: 'Create and update companies', category: 'companies' },
                { name: 'companies:delete', resource: 'companies', action: 'delete', description: 'Delete companies', category: 'companies' },
                { name: 'contacts:read', resource: 'contacts', action: 'read', description: 'Read contacts', category: 'contacts' },
                { name: 'contacts:write', resource: 'contacts', action: 'write', description: 'Create and update contacts', category: 'contacts' },
                { name: 'contacts:delete', resource: 'contacts', action: 'delete', description: 'Delete contacts', category: 'contacts' },
                { name: 'products:read', resource: 'products', action: 'read', description: 'Read products', category: 'products' },
                { name: 'products:write', resource: 'products', action: 'write', description: 'Create and update products', category: 'products' },
                { name: 'products:delete', resource: 'products', action: 'delete', description: 'Delete products', category: 'products' },
                { name: 'invoices:read', resource: 'invoices', action: 'read', description: 'Read invoices', category: 'invoices' },
                { name: 'invoices:write', resource: 'invoices', action: 'write', description: 'Create and update invoices', category: 'invoices' },
                { name: 'invoices:delete', resource: 'invoices', action: 'delete', description: 'Delete invoices', category: 'invoices' },
                { name: 'analytics:read', resource: 'analytics', action: 'read', description: 'Read analytics', category: 'analytics' },
                { name: 'analytics:write', resource: 'analytics', action: 'write', description: 'Create and update analytics', category: 'analytics' },
                { name: 'ai:read', resource: 'ai', action: 'read', description: 'Read AI services', category: 'ai' },
                { name: 'ai:write', resource: 'ai', action: 'write', description: 'Use AI services', category: 'ai' },
                { name: 'settings:read', resource: 'settings', action: 'read', description: 'Read settings', category: 'settings' },
                { name: 'settings:write', resource: 'settings', action: 'write', description: 'Update settings', category: 'settings' }
            ];
            const organizationsResult = await db.select().from(organizations);
            for (const org of organizationsResult) {
                for (const permissionData of systemPermissions) {
                    await db.insert(permissions).values({
                        ...permissionData,
                        organizationId: org.id,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    });
                }
            }
            structuredLogger.info('System permissions initialized', {
                permissionsCount: systemPermissions.length,
                organizationsCount: organizationsResult.length
            });
        }
        catch (error) {
            structuredLogger.error('Failed to initialize system roles', error);
        }
    }
    startCacheCleanup() {
        if (!this.config.cachePermissions)
            return;
        setInterval(() => {
            const now = Date.now();
            for (const [key, value] of this.permissionCache.entries()) {
                if (now - value.timestamp > this.config.cacheTTL) {
                    this.permissionCache.delete(key);
                }
            }
            for (const [key, value] of this.roleCache.entries()) {
                if (now - value.timestamp > this.config.cacheTTL) {
                    this.roleCache.delete(key);
                }
            }
        }, 60000);
    }
    clearPermissionCache(organizationId) {
        this.permissionCache.delete(organizationId);
    }
    clearRoleCache(roleId) {
        this.roleCache.delete(roleId);
    }
    clearUserPermissionCache(userId) {
        this.permissionCache.clear();
        this.roleCache.clear();
    }
}
export const rbacService = new RBACService();
//# sourceMappingURL=rbac.service.js.map