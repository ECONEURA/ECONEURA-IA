import { logger } from '../lib/logger';

export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
  conditions?: Record<string, any>;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  is_system: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface UserRole {
  user_id: string;
  role_id: string;
  org_id: string;
  granted_by: string;
  granted_at: Date;
  expires_at?: Date;
}

export interface PermissionCheck {
  user_id: string;
  org_id: string;
  resource: string;
  action: string;
  context?: Record<string, any>;
}

export class PermissionsService {
  private roles: Map<string, Role> = new Map();
  private permissions: Map<string, Permission> = new Map();
  private userRoles: Map<string, UserRole[]> = new Map();

  constructor() {
    this.initializeSystemRoles();
    this.initializePermissions();
  }

  // Initialize system roles
  private initializeSystemRoles() {
    const systemRoles: Role[] = [
      {
        id: 'inventory_admin',
        name: 'Administrador de Inventario',
        description: 'Control total sobre inventario, productos y proveedores',
        permissions: [
          'inventory:read',
          'inventory:write',
          'inventory:delete',
          'products:read',
          'products:write',
          'products:delete',
          'suppliers:read',
          'suppliers:write',
          'suppliers:delete',
          'reports:read',
          'reports:write',
          'analytics:read',
          'alerts:read',
          'alerts:write'
        ],
        is_system: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'inventory_manager',
        name: 'Gestor de Inventario',
        description: 'Gestión diaria de inventario y productos',
        permissions: [
          'inventory:read',
          'inventory:write',
          'products:read',
          'products:write',
          'suppliers:read',
          'suppliers:write',
          'reports:read',
          'analytics:read',
          'alerts:read'
        ],
        is_system: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'inventory_viewer',
        name: 'Visualizador de Inventario',
        description: 'Solo lectura de inventario y reportes',
        permissions: [
          'inventory:read',
          'products:read',
          'suppliers:read',
          'reports:read',
          'analytics:read',
          'alerts:read'
        ],
        is_system: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'supplier_manager',
        name: 'Gestor de Proveedores',
        description: 'Gestión de proveedores y relaciones comerciales',
        permissions: [
          'suppliers:read',
          'suppliers:write',
          'suppliers:delete',
          'products:read',
          'reports:read',
          'alerts:read'
        ],
        is_system: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'reports_analyst',
        name: 'Analista de Reportes',
        description: 'Acceso a reportes y analytics',
        permissions: [
          'inventory:read',
          'products:read',
          'suppliers:read',
          'reports:read',
          'reports:write',
          'analytics:read',
          'alerts:read'
        ],
        is_system: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    systemRoles.forEach(role => {
      this.roles.set(role.id, role);
    });
  }

  // Initialize permissions
  private initializePermissions() {
    const permissions: Permission[] = [
      // Inventory permissions
      {
        id: 'inventory:read',
        name: 'Leer Inventario',
        description: 'Ver información del inventario',
        resource: 'inventory',
        action: 'read'
      },
      {
        id: 'inventory:write',
        name: 'Escribir Inventario',
        description: 'Modificar inventario',
        resource: 'inventory',
        action: 'write'
      },
      {
        id: 'inventory:delete',
        name: 'Eliminar Inventario',
        description: 'Eliminar elementos del inventario',
        resource: 'inventory',
        action: 'delete'
      },
      // Products permissions
      {
        id: 'products:read',
        name: 'Leer Productos',
        description: 'Ver información de productos',
        resource: 'products',
        action: 'read'
      },
      {
        id: 'products:write',
        name: 'Escribir Productos',
        description: 'Crear y modificar productos',
        resource: 'products',
        action: 'write'
      },
      {
        id: 'products:delete',
        name: 'Eliminar Productos',
        description: 'Eliminar productos',
        resource: 'products',
        action: 'delete'
      },
      // Suppliers permissions
      {
        id: 'suppliers:read',
        name: 'Leer Proveedores',
        description: 'Ver información de proveedores',
        resource: 'suppliers',
        action: 'read'
      },
      {
        id: 'suppliers:write',
        name: 'Escribir Proveedores',
        description: 'Crear y modificar proveedores',
        resource: 'suppliers',
        action: 'write'
      },
      {
        id: 'suppliers:delete',
        name: 'Eliminar Proveedores',
        description: 'Eliminar proveedores',
        resource: 'suppliers',
        action: 'delete'
      },
      // Reports permissions
      {
        id: 'reports:read',
        name: 'Leer Reportes',
        description: 'Ver reportes',
        resource: 'reports',
        action: 'read'
      },
      {
        id: 'reports:write',
        name: 'Generar Reportes',
        description: 'Generar y exportar reportes',
        resource: 'reports',
        action: 'write'
      },
      // Analytics permissions
      {
        id: 'analytics:read',
        name: 'Leer Analytics',
        description: 'Ver analytics y métricas',
        resource: 'analytics',
        action: 'read'
      },
      // Alerts permissions
      {
        id: 'alerts:read',
        name: 'Leer Alertas',
        description: 'Ver alertas del sistema',
        resource: 'alerts',
        action: 'read'
      },
      {
        id: 'alerts:write',
        name: 'Gestionar Alertas',
        description: 'Configurar y gestionar alertas',
        resource: 'alerts',
        action: 'write'
      }
    ];

    permissions.forEach(permission => {
      this.permissions.set(permission.id, permission);
    });
  }

  // Check if user has permission
  async hasPermission(check: PermissionCheck): Promise<boolean> {
    try {
      const userRoles = this.getUserRoles(check.user_id, check.org_id);
      
      for (const userRole of userRoles) {
        const role = this.roles.get(userRole.role_id);
        if (!role) continue;

        // Check if role has expired
        if (userRole.expires_at && userRole.expires_at < new Date()) {
          continue;
        }

        // Check if role has the required permission
        const permissionId = `${check.resource}:${check.action}`;
        if (role.permissions.includes(permissionId)) {
          // Check conditions if any
          const permission = this.permissions.get(permissionId);
          if (permission && permission.conditions) {
            if (this.evaluateConditions(permission.conditions, check.context)) {
              return true;
            }
          } else {
            return true;
          }
        }
      }

      return false;
    } catch (error) {
      logger.error('Error checking permission:', error);
      return false;
    }
  }

  // Check multiple permissions
  async hasPermissions(checks: PermissionCheck[]): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    
    await Promise.all(
      checks.map(async check => {
        const permissionId = `${check.resource}:${check.action}`;
        results[permissionId] = await this.hasPermission(check);
      })
    );

    return results;
  }

  // Get user roles
  getUserRoles(userId: string, orgId: string): UserRole[] {
    const key = `${userId}:${orgId}`;
    return this.userRoles.get(key) || [];
  }

  // Assign role to user
  assignRole(userId: string, roleId: string, orgId: string, grantedBy: string, expiresAt?: Date): boolean {
    try {
      const role = this.roles.get(roleId);
      if (!role) {
        logger.error(`Role not found: ${roleId}`);
        return false;
      }

      const userRole: UserRole = {
        user_id: userId,
        role_id: roleId,
        org_id: orgId,
        granted_by: grantedBy,
        granted_at: new Date(),
        expires_at: expiresAt
      };

      const key = `${userId}:${orgId}`;
      const existingRoles = this.userRoles.get(key) || [];
      
      // Check if role is already assigned
      const existingRoleIndex = existingRoles.findIndex(ur => ur.role_id === roleId);
      if (existingRoleIndex >= 0) {
        existingRoles[existingRoleIndex] = userRole;
      } else {
        existingRoles.push(userRole);
      }

      this.userRoles.set(key, existingRoles);
      logger.info(`Role ${roleId} assigned to user ${userId} in org ${orgId}`);
      return true;
    } catch (error) {
      logger.error('Error assigning role:', error);
      return false;
    }
  }

  // Remove role from user
  removeRole(userId: string, roleId: string, orgId: string): boolean {
    try {
      const key = `${userId}:${orgId}`;
      const existingRoles = this.userRoles.get(key) || [];
      const filteredRoles = existingRoles.filter(ur => ur.role_id !== roleId);
      
      this.userRoles.set(key, filteredRoles);
      logger.info(`Role ${roleId} removed from user ${userId} in org ${orgId}`);
      return true;
    } catch (error) {
      logger.error('Error removing role:', error);
      return false;
    }
  }

  // Create custom role
  createRole(role: Omit<Role, 'id' | 'created_at' | 'updated_at'>): string {
    try {
      const roleId = `custom_${Date.now()}`;
      const newRole: Role = {
        ...role,
        id: roleId,
        is_system: false,
        created_at: new Date(),
        updated_at: new Date()
      };

      this.roles.set(roleId, newRole);
      logger.info(`Custom role created: ${roleId}`);
      return roleId;
    } catch (error) {
      logger.error('Error creating role:', error);
      throw error;
    }
  }

  // Update role
  updateRole(roleId: string, updates: Partial<Role>): boolean {
    try {
      const role = this.roles.get(roleId);
      if (!role) {
        logger.error(`Role not found: ${roleId}`);
        return false;
      }

      if (role.is_system) {
        logger.error(`Cannot update system role: ${roleId}`);
        return false;
      }

      const updatedRole: Role = {
        ...role,
        ...updates,
        updated_at: new Date()
      };

      this.roles.set(roleId, updatedRole);
      logger.info(`Role updated: ${roleId}`);
      return true;
    } catch (error) {
      logger.error('Error updating role:', error);
      return false;
    }
  }

  // Delete role
  deleteRole(roleId: string): boolean {
    try {
      const role = this.roles.get(roleId);
      if (!role) {
        logger.error(`Role not found: ${roleId}`);
        return false;
      }

      if (role.is_system) {
        logger.error(`Cannot delete system role: ${roleId}`);
        return false;
      }

      // Check if role is assigned to any users
      for (const [key, userRoles] of this.userRoles.entries()) {
        const hasRole = userRoles.some(ur => ur.role_id === roleId);
        if (hasRole) {
          logger.error(`Cannot delete role ${roleId} - still assigned to users`);
          return false;
        }
      }

      this.roles.delete(roleId);
      logger.info(`Role deleted: ${roleId}`);
      return true;
    } catch (error) {
      logger.error('Error deleting role:', error);
      return false;
    }
  }

  // Get all roles
  getAllRoles(): Role[] {
    return Array.from(this.roles.values());
  }

  // Get all permissions
  getAllPermissions(): Permission[] {
    return Array.from(this.permissions.values());
  }

  // Get permissions for a role
  getRolePermissions(roleId: string): Permission[] {
    const role = this.roles.get(roleId);
    if (!role) return [];

    return role.permissions
      .map(permissionId => this.permissions.get(permissionId))
      .filter(Boolean) as Permission[];
  }

  // Get users with a specific role
  getUsersWithRole(roleId: string, orgId: string): string[] {
    const users: string[] = [];
    
    for (const [key, userRoles] of this.userRoles.entries()) {
      const [userId, userOrgId] = key.split(':');
      if (userOrgId === orgId) {
        const hasRole = userRoles.some(ur => ur.role_id === roleId);
        if (hasRole) {
          users.push(userId);
        }
      }
    }

    return users;
  }

  // Evaluate permission conditions
  private evaluateConditions(conditions: Record<string, any>, context?: Record<string, any>): boolean {
    if (!context) return true;

    for (const [key, value] of Object.entries(conditions)) {
      const contextValue = context[key];
      
      if (typeof value === 'function') {
        if (!value(contextValue)) return false;
      } else if (contextValue !== value) {
        return false;
      }
    }

    return true;
  }

  // Get user permissions summary
  getUserPermissionsSummary(userId: string, orgId: string): {
    roles: Role[];
    permissions: Permission[];
    effective_permissions: string[];
  } {
    const userRoles = this.getUserRoles(userId, orgId);
    const roles = userRoles
      .map(ur => this.roles.get(ur.role_id))
      .filter(Boolean) as Role[];

    const permissionIds = new Set<string>();
    roles.forEach(role => {
      role.permissions.forEach(permissionId => {
        permissionIds.add(permissionId);
      });
    });

    const permissions = Array.from(permissionIds)
      .map(permissionId => this.permissions.get(permissionId))
      .filter(Boolean) as Permission[];

    return {
      roles,
      permissions,
      effective_permissions: Array.from(permissionIds)
    };
  }

  // Check if user has any of the specified permissions
  async hasAnyPermission(userId: string, orgId: string, permissions: string[]): Promise<boolean> {
    for (const permission of permissions) {
      const [resource, action] = permission.split(':');
      const hasPermission = await this.hasPermission({
        user_id: userId,
        org_id: orgId,
        resource,
        action
      });
      
      if (hasPermission) return true;
    }
    
    return false;
  }

  // Get role statistics
  getRoleStatistics(orgId: string): {
    total_roles: number;
    system_roles: number;
    custom_roles: number;
    total_users_with_roles: number;
    roles_distribution: Record<string, number>;
  } {
    const roles = Array.from(this.roles.values());
    const systemRoles = roles.filter(r => r.is_system).length;
    const customRoles = roles.filter(r => !r.is_system).length;

    const rolesDistribution: Record<string, number> = {};
    let totalUsersWithRoles = 0;

    for (const [key, userRoles] of this.userRoles.entries()) {
      const [, userOrgId] = key.split(':');
      if (userOrgId === orgId && userRoles.length > 0) {
        totalUsersWithRoles++;
        userRoles.forEach(ur => {
          rolesDistribution[ur.role_id] = (rolesDistribution[ur.role_id] || 0) + 1;
        });
      }
    }

    return {
      total_roles: roles.length,
      system_roles: systemRoles,
      custom_roles: customRoles,
      total_users_with_roles: totalUsersWithRoles,
      roles_distribution: rolesDistribution
    };
  }
}

export const permissionsService = new PermissionsService();

