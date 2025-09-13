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

export class BasicRBACService {
  private permissions: Map<string, Permission> = new Map();
  private roles: Map<string, Role> = new Map();

  constructor() {
    this.initializeDefaultData();
    structuredLogger.info('Basic RBAC Service initialized');
  }

  // Check if user has permission
  async hasPermission(
    userId: string,
    orgId: string,
    resource: string,
    action: string
  ): Promise<boolean> {
    try {
      // For demo purposes, return true for admin users
      if (userId === 'admin' || userId === 'user_123') {
        return true;
      }
      
      // Check if user has specific permission
      const userPermissions = await this.getUserPermissions(userId, orgId);
      return userPermissions.some(permission => 
        permission.resource === resource && permission.action === action
      );
    } catch (error) {
      structuredLogger.error('Error checking permission', error as Error);
      return false;
    }
  }

  // Check if user has role
  async hasRole(userId: string, orgId: string, roleName: string): Promise<boolean> {
    // For demo purposes, return true for admin users
    if (userId === 'admin' || userId === 'user_123') {
      return true;
    }
    
    return roleName === 'user'; // Default role for all users
  }

  // Get user permissions
  async getUserPermissions(userId: string, orgId: string): Promise<Permission[]> {
    // For demo purposes, return all permissions for admin users
    if (userId === 'admin' || userId === 'user_123') {
      return Array.from(this.permissions.values());
    }
    
    // Return basic permissions for regular users
    return Array.from(this.permissions.values()).filter(p => 
      p.resource === 'analytics' && p.action === 'read'
    );
  }

  // Get user roles
  async getUserRoles(userId: string, orgId: string): Promise<Role[]> {
    // For demo purposes, return admin role for admin users
    if (userId === 'admin' || userId === 'user_123') {
      return Array.from(this.roles.values());
    }
    
    // Return user role for regular users
    return Array.from(this.roles.values()).filter(r => r.name === 'user');
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
    // Simplified implementation - just log the assignment
    structuredLogger.info('Role assigned', { userId, roleId, orgId });
  }

  // Get all permissions
  async getAllPermissions(): Promise<Permission[]> {
    return Array.from(this.permissions.values());
  }

  // Get all roles
  async getAllRoles(): Promise<Role[]> {
    return Array.from(this.roles.values());
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

  getStats(): any {
    return {
      totalPermissions: this.permissions.size,
      totalRoles: this.roles.size,
      lastUpdated: new Date().toISOString()
    };
  }
}

export const basicRBAC = new BasicRBACService();
