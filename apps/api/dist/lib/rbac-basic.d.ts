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
export declare class BasicRBACService {
    private permissions;
    private roles;
    constructor();
    hasPermission(userId: string, orgId: string, resource: string, action: string): Promise<boolean>;
    hasRole(userId: string, orgId: string, roleName: string): Promise<boolean>;
    getUserPermissions(userId: string, orgId: string): Promise<Permission[]>;
    getUserRoles(userId: string, orgId: string): Promise<Role[]>;
    createPermission(permission: Omit<Permission, 'id'>): Promise<string>;
    createRole(role: Omit<Role, 'id'>): Promise<string>;
    assignRole(userId: string, roleId: string, orgId: string): Promise<void>;
    getAllPermissions(): Promise<Permission[]>;
    getAllRoles(): Promise<Role[]>;
    private initializeDefaultData;
    getStats(): any;
}
export declare const basicRBAC: BasicRBACService;
//# sourceMappingURL=rbac-basic.d.ts.map