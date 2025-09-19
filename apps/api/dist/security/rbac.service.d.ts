export interface Role {
    id: string;
    name: string;
    description: string;
    permissions: string[];
    inheritedRoles: string[];
    organizationId: string;
    isSystem: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface Permission {
    id: string;
    name: string;
    resource: string;
    action: string;
    conditions?: string[];
    description: string;
    category: string;
}
export interface UserRole {
    userId: string;
    roleId: string;
    organizationId: string;
    assignedBy: string;
    assignedAt: Date;
    expiresAt?: Date;
    isActive: boolean;
}
export interface AccessPolicy {
    id: string;
    name: string;
    description: string;
    rules: AccessRule[];
    organizationId: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface AccessRule {
    id: string;
    resource: string;
    actions: string[];
    conditions: string[];
    effect: 'allow' | 'deny';
    priority: number;
}
export interface AccessDecision {
    allowed: boolean;
    reason: string;
    matchedRules: string[];
    evaluatedPolicies: string[];
    timestamp: Date;
}
export interface AuditLog {
    id: string;
    userId: string;
    organizationId: string;
    action: string;
    resource: string;
    result: 'allowed' | 'denied';
    reason: string;
    ipAddress: string;
    userAgent: string;
    timestamp: Date;
    metadata: any;
}
export declare class RBACService {
    private static instance;
    private roles;
    private permissions;
    private userRoles;
    private accessPolicies;
    private auditLogs;
    private isMonitoring;
    private monitoringInterval;
    private constructor();
    static getInstance(): RBACService;
    private initializeDefaultRoles;
    private initializeDefaultPermissions;
    checkPermission(userId: string, permission: string, resource?: string, organizationId?: string): Promise<AccessDecision>;
    assignRole(userId: string, roleId: string, organizationId: string, assignedBy: string, expiresAt?: Date): Promise<boolean>;
    revokeRole(userId: string, roleId: string, organizationId: string, revokedBy: string): Promise<boolean>;
    createRole(role: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>): Promise<Role>;
    createAccessPolicy(policy: Omit<AccessPolicy, 'id' | 'createdAt' | 'updatedAt'>): Promise<AccessPolicy>;
    getUserRoles(userId: string, organizationId?: string): UserRole[];
    getUserPermissions(userId: string, organizationId?: string): string[];
    getRBACStats(): {
        totalRoles: number;
        totalPermissions: number;
        totalUsers: number;
        totalPolicies: number;
        auditLogs: number;
        systemRoles: number;
        customRoles: number;
    };
    private checkDirectPermission;
    private checkInheritedPermission;
    private evaluateAccessPolicies;
    private createAccessDecision;
    private recordAuditLog;
    private generateRoleId;
    private generatePolicyId;
    private startMonitoring;
    private performRBACMonitoring;
    private cleanupExpiredRoles;
    private cleanupOldAuditLogs;
    stop(): void;
}
export declare const rbacService: RBACService;
//# sourceMappingURL=rbac.service.d.ts.map