interface User {
    id: string;
    email: string;
    username: string;
    passwordHash: string;
    salt: string;
    roles: string[];
    permissions: string[];
    mfaEnabled: boolean;
    mfaSecret?: string;
    createdAt: Date;
    updatedAt: Date;
}
interface Role {
    id: string;
    name: string;
    description?: string;
    permissions: string[];
    orgId: string;
    createdAt: Date;
}
interface Permission {
    id: string;
    name: string;
    description?: string;
    resource: string;
    action: string;
    orgId: string;
    createdAt: Date;
}
interface AuditLog {
    id: string;
    userId: string;
    action: string;
    resource: string;
    details: any;
    ipAddress?: string;
    userAgent?: string;
    success: boolean;
    timestamp: Date;
}
interface SecurityEvent {
    id: string;
    type: 'login_failed' | 'permission_denied' | 'suspicious_activity' | 'mfa_failed';
    severity: 'low' | 'medium' | 'high' | 'critical';
    userId?: string;
    ipAddress?: string;
    details: any;
    timestamp: Date;
    resolved: boolean;
}
interface ThreatIntelligence {
    ipAddress: string;
    reputation: 'good' | 'suspicious' | 'malicious';
    country: string;
    threatTypes: string[];
    lastSeen: Date;
    confidence: number;
}
export declare class SecuritySystem {
    private users;
    private roles;
    private permissions;
    private auditLogs;
    private securityEvents;
    private threatIntelligence;
    constructor();
    createUser(email: string, username: string, password: string, roles?: string[]): Promise<User>;
    getUsers(): Promise<User[]>;
    getUserById(userId: string): Promise<User | null>;
    authenticateUser(email: string, password: string): Promise<{
        user: User;
        token: string;
    } | null>;
    setupMFA(userId: string, method: 'totp' | 'sms' | 'email'): Promise<{
        secret: string;
        qrCode?: string;
    }>;
    verifyMFA(userId: string, code: string): Promise<boolean>;
    createRole(name: string, description: string, permissions: string[], orgId: string): Promise<Role>;
    getRoles(): Promise<Role[]>;
    createPermission(name: string, description: string, resource: string, action: string, orgId: string): Promise<Permission>;
    getPermissions(): Promise<Permission[]>;
    checkPermission(userId: string, resource: string, action: string): Promise<boolean>;
    logAuditEvent(event: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void>;
    getAuditLogs(limit?: number): Promise<AuditLog[]>;
    logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp' | 'resolved'>): Promise<void>;
    getSecurityEvents(limit?: number): Promise<SecurityEvent[]>;
    checkIPReputation(ipAddress: string): Promise<ThreatIntelligence>;
    getSecurityStats(): Promise<any>;
    private hashPassword;
    private generateTOTPSecret;
    private generateTOTPQRCode;
    private verifyTOTPCode;
    private generateJWT;
    private initializeDefaultData;
}
export declare const securitySystem: SecuritySystem;
export {};
//# sourceMappingURL=security.d.ts.map