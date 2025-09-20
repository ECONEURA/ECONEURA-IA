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
export declare class GranularRBACService {
    private permissions;
    private roles;
    private userRoles;
    constructor();
    hasPermission(userId: string, orgId: string, resource: string, action: string, context?: Record<string, any>): Promise<boolean>;
    hasRole(userId: string, orgId: string, roleName: string): Promise<boolean>;
    getUserPermissions(userId: string, orgId: string): Promise<Permission[]>;
    createPermission(permission: Omit<Permission, 'id'>): Promise<string>;
    createRole(role: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>): Promise<string>;
    assignRole(userId: string, roleId: string, orgId: string, assignedBy: string, expiresAt?: string): Promise<void>;
    removeRole(userId: string, roleId: string, orgId: string): Promise<void>;
    getAllPermissions(): Promise<Permission[]>;
    getAllRoles(): Promise<Role[]>;
    getUserRoles(userId: string, orgId: string): Promise<Role[]>;
    getRBACContext(userId: string, orgId: string): Promise<RBACContext>;
    private getUserPermissionsFromRoles;
    private evaluateConditions;
    private initializeDefaultPermissions;
    private initializeDefaultRoles;
    getStats(): any;
}
export declare const granularRBAC: GranularRBACService;
//# sourceMappingURL=rbac-granular.d.ts.map