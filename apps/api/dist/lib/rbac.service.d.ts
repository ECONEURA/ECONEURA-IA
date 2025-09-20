interface Permission {
    id: string;
    name: string;
    resource: string;
    action: string;
    description: string;
    category: string;
}
interface Role {
    id: string;
    name: string;
    description: string;
    organizationId: string;
    isSystem: boolean;
    permissions: Permission[];
    createdAt: Date;
    updatedAt: Date;
}
interface RBACConfig {
    enableInheritance: boolean;
    enableCustomRoles: boolean;
    enablePermissionOverrides: boolean;
    enableAuditLogging: boolean;
    cachePermissions: boolean;
    cacheTTL: number;
}
export declare class RBACService {
    private config;
    private db;
    private permissionCache;
    private roleCache;
    constructor(config?: Partial<RBACConfig>);
    createPermission(permissionData: {
        name: string;
        resource: string;
        action: string;
        description: string;
        category: string;
        organizationId: string;
    }): Promise<Permission>;
    getPermissions(organizationId: string): Promise<Permission[]>;
    getPermissionById(permissionId: string): Promise<Permission | null>;
    createRole(roleData: {
        name: string;
        description: string;
        organizationId: string;
        permissions: string[];
        createdBy: string;
    }): Promise<Role>;
    getRoles(organizationId: string): Promise<Role[]>;
    getRoleById(roleId: string): Promise<Role | null>;
    updateRole(roleId: string, updates: {
        name?: string;
        description?: string;
        permissions?: string[];
    }): Promise<Role>;
    deleteRole(roleId: string): Promise<void>;
    assignRoleToUser(userId: string, roleId: string, organizationId: string, assignedBy: string): Promise<void>;
    removeRoleFromUser(userId: string, roleId: string, organizationId: string): Promise<void>;
    getUserRoles(userId: string, organizationId: string): Promise<Role[]>;
    hasPermission(userId: string, organizationId: string, permission: string): Promise<boolean>;
    hasAnyPermission(userId: string, organizationId: string, permissions: string[]): Promise<boolean>;
    hasAllPermissions(userId: string, organizationId: string, permissions: string[]): Promise<boolean>;
    getUserPermissions(userId: string, organizationId: string): Promise<Permission[]>;
    private initializeSystemRoles;
    private startCacheCleanup;
    private clearPermissionCache;
    private clearRoleCache;
    private clearUserPermissionCache;
}
export declare const rbacService: RBACService;
export {};
//# sourceMappingURL=rbac.service.d.ts.map