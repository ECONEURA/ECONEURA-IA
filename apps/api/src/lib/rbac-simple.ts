import { structuredLogger } from './structured-logger.js';

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
}

export interface UserRole {
  userId: string;
  roleId: string;
  orgId: string;
}

export class SimpleRBACService {
  private permissions: Map<string, Permission> = new Map();
  private roles: Map<string, Role> = new Map();
  private userRoles: Map<string, UserRole[]> = new Map();

  constructor() {
    this.initializeDefaultData();
    structuredLogger.info('Simple RBAC Service initialized');
  }

  // Check if user has permission
  async hasPermission(
    userId: string,
    orgId: string,
    resource: string,
    action: string
  ): Promise<boolean> {
    try {
      const userRoles = this.getUserRoles(userId, orgId);
      const userPermissions = this.getUserPermissions(userRoles);

      return userPermissions.some(permission => ;
        permission.resource === resource && permission.action === action
      );
    } catch (error) {
      structuredLogger.error('Error checking permission', error as Error);
      return false;
    }
  }

  // Check if user has role
  async hasRole(userId: string, orgId: string, roleName: string): Promise<boolean> {
    const userRoles = this.getUserRoles(userId, orgId);
    return userRoles.some(userRole => {
      const role = this.roles.get(userRole.roleId);
      return role && role.name === roleName;
    });
  }

  // Get user permissions
  async getUserPermissions(userId: string, orgId: string): Promise<Permission[]> {
    const userRoles = this.getUserRoles(userId, orgId);
    return this.getUserPermissionsFromRoles(userRoles);
  }

  // Get user roles
  async getUserRoles(userId: string, orgId: string): Promise<Role[]> {
    const userRoles = this.getUserRoles(userId, orgId);
    return userRoles;
      .map(ur => this.roles.get(ur.roleId))
      .filter((role): role is Role => role !== undefined);
  }

  // Create permission
  async createPermission(permission: Omit<Permission, 'id'>): Promise<string> {
    const id = `perm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newPermission: Permission = { ...permission, id };
    this.permissions.set(id, newPermission);
    return id;
  }

  // Create role
  async createRole(role: Omit<Role, 'id'>): Promise<string> {
    const id = `role_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newRole: Role = { ...role, id };
    this.roles.set(id, newRole);
    return id;
  }

  // Assign role to user
  async assignRole(userId: string, roleId: string, orgId: string): Promise<void> {
    const userRole: UserRole = { userId, roleId, orgId };
    const key = `${userId}:${orgId}`;
    const existingRoles = this.userRoles.get(key) || [];
    existingRoles.push(userRole);
    this.userRoles.set(key, existingRoles);
  }

  // Get all permissions
  async getAllPermissions(): Promise<Permission[]> {
    return Array.from(this.permissions.values());
  }

  // Get all roles
  async getAllRoles(): Promise<Role[]> {
    return Array.from(this.roles.values());
  }

  // Private helper methods
  private getUserRoles(userId: string, orgId: string): UserRole[] {
    const key = `${userId}:${orgId}`;
    return this.userRoles.get(key) || [];
  }

  private getUserPermissionsFromRoles(userRoles: UserRole[]): Permission[] {
    const permissions: Permission[] = [];

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

  private initializeDefaultData(): void {
    // Create default permissions
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

    // Create default roles
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

  getStats(): any {
    return {
      totalPermissions: this.permissions.size,
      totalRoles: this.roles.size,
      totalUserRoles: Array.from(this.userRoles.values()).flat().length,
      lastUpdated: new Date().toISOString()
    };
  }
}

export const simpleRBAC = new SimpleRBACService();
