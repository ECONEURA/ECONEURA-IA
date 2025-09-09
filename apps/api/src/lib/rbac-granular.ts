import { structuredLogger } from './structured-logger.js';

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  conditions?: Record<string, any>;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserRole {
  userId: string;
  roleId: string;
  orgId: string;
  assignedBy: string;
  assignedAt: string;
  expiresAt?: string;
}

export interface RBACContext {
  userId: string;
  orgId: string;
  roles: string[];
  permissions: string[];
  metadata?: Record<string, any>;
}

export class GranularRBACService {
  private permissions: Map<string, Permission> = new Map();
  private roles: Map<string, Role> = new Map();
  private userRoles: Map<string, UserRole[]> = new Map();

  constructor() {
    this.initializeDefaultPermissions();
    this.initializeDefaultRoles();
    structuredLogger.info('Granular RBAC Service initialized');
  }

  // Check if user has permission
  async hasPermission(
    userId: string,
    orgId: string,
    resource: string,
    action: string,
    context?: Record<string, any>
  ): Promise<boolean> {
    try {
      const userRoles = this.getUserRoles(userId, orgId);
      const userPermissions = this.getUserPermissionsFromRoles(userRoles);

      // Check direct permission
      const hasDirectPermission = userPermissions.some(permission =>
        permission.resource === resource && permission.action === action
      );

      if (hasDirectPermission) {
        return true;
      }

      // Check wildcard permissions
      const hasWildcardPermission = userPermissions.some(permission =>
        (permission.resource === '*' || permission.resource === resource) &&
        (permission.action === '*' || permission.action === action)
      );

      if (hasWildcardPermission) {
        return true;
      }

      // Check conditional permissions
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
    } catch (error) {
      structuredLogger.error('Error checking permission', error as Error, {
        userId,
        orgId,
        resource,
        action
      });
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

  // Create permission
  async createPermission(permission: Omit<Permission, 'id'>): Promise<string> {
    const id = `perm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newPermission: Permission = {
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

  // Create role
  async createRole(role: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const id = `role_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const newRole: Role = {
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

  // Assign role to user
  async assignRole(
    userId: string,
    roleId: string,
    orgId: string,
    assignedBy: string,
    expiresAt?: string
  ): Promise<void> {
    const userRole: UserRole = {
      userId,
      roleId,
      orgId,
      assignedBy,
      assignedAt: new Date().toISOString(),
      expiresAt
    };

    const key = `${userId}:${orgId}`;
    const existingRoles = this.userRoles.get(key) || [];

    // Check if role already assigned
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

  // Remove role from user
  async removeRole(userId: string, roleId: string, orgId: string): Promise<void> {
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

  // Get all permissions
  async getAllPermissions(): Promise<Permission[]> {
    return Array.from(this.permissions.values());
  }

  // Get all roles
  async getAllRoles(): Promise<Role[]> {
    return Array.from(this.roles.values());
  }

  // Get user roles
  async getUserRoles(userId: string, orgId: string): Promise<Role[]> {
    const key = `${userId}:${orgId}`;
    const userRoles = this.userRoles.get(key) || [];

    return userRoles;
      .filter(ur => !ur.expiresAt || new Date(ur.expiresAt) > new Date())
      .map(ur => this.roles.get(ur.roleId))
      .filter((role): role is Role => role !== undefined);
  }

  // Get RBAC context
  async getRBACContext(userId: string, orgId: string): Promise<RBACContext> {
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

  private evaluateConditions(conditions: Record<string, any>, context: Record<string, any>): boolean {
    for (const [key, expectedValue] of Object.entries(conditions)) {
      const actualValue = context[key];

      if (actualValue !== expectedValue) {
        return false;
      }
    }

    return true;
  }

  private initializeDefaultPermissions(): void {
    const defaultPermissions: Omit<Permission, 'id'>[] = [
      // Analytics permissions
      { name: 'analytics:read', resource: 'analytics', action: 'read' },
      { name: 'analytics:write', resource: 'analytics', action: 'write' },
      { name: 'analytics:export', resource: 'analytics', action: 'export' },

      // Security permissions
      { name: 'security:read', resource: 'security', action: 'read' },
      { name: 'security:write', resource: 'security', action: 'write' },
      { name: 'security:admin', resource: 'security', action: 'admin' },

      // FinOps permissions
      { name: 'finops:read', resource: 'finops', action: 'read' },
      { name: 'finops:write', resource: 'finops', action: 'write' },
      { name: 'finops:admin', resource: 'finops', action: 'admin' },

      // GDPR permissions
      { name: 'gdpr:read', resource: 'gdpr', action: 'read' },
      { name: 'gdpr:export', resource: 'gdpr', action: 'export' },
      { name: 'gdpr:erase', resource: 'gdpr', action: 'erase' },

      // SEPA permissions
      { name: 'sepa:read', resource: 'sepa', action: 'read' },
      { name: 'sepa:write', resource: 'sepa', action: 'write' },

      // Admin permissions
      { name: 'admin:all', resource: '*', action: '*' },
      { name: 'user:manage', resource: 'user', action: '*' },
      { name: 'role:manage', resource: 'role', action: '*' }
    ];

    defaultPermissions.forEach(async (permission) => {
      await this.createPermission(permission);
    });
  }

  private initializeDefaultRoles(): void {
    const defaultRoles: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>[] = [
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

  // Get RBAC stats
  getStats(): any {
    return {
      totalPermissions: this.permissions.size,
      totalRoles: this.roles.size,
      totalUserRoles: Array.from(this.userRoles.values()).flat().length,
      lastUpdated: new Date().toISOString()
    };
  }
}

export const granularRBAC = new GranularRBACService();
