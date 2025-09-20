import { EventEmitter } from 'events';
import { z } from 'zod';
export interface User {
    id: string;
    email: string;
    username: string;
    passwordHash: string;
    salt: string;
    mfaEnabled: boolean;
    mfaSecret?: string;
    backupCodes: string[];
    roles: string[];
    permissions: string[];
    lastLogin: Date;
    failedLoginAttempts: number;
    lockedUntil?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface MFAMethod {
    id: string;
    userId: string;
    type: 'totp' | 'sms' | 'email' | 'hardware';
    secret?: string;
    phoneNumber?: string;
    email?: string;
    verified: boolean;
    createdAt: Date;
}
export interface APIToken {
    id: string;
    userId: string;
    name: string;
    token: string;
    scopes: string[];
    expiresAt?: Date;
    lastUsed?: Date;
    createdAt: Date;
}
export interface Role {
    id: string;
    name: string;
    description: string;
    permissions: string[];
    orgId: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface Permission {
    id: string;
    name: string;
    description: string;
    resource: string;
    action: string;
    orgId: string;
    createdAt: Date;
}
export interface AuditLog {
    id: string;
    userId?: string;
    action: string;
    resource: string;
    resourceId?: string;
    details: Record<string, any>;
    ipAddress: string;
    userAgent: string;
    timestamp: Date;
    success: boolean;
    errorMessage?: string;
}
export interface SecurityEvent {
    id: string;
    type: 'login_attempt' | 'mfa_attempt' | 'permission_denied' | 'anomaly_detected' | 'threat_detected';
    severity: 'low' | 'medium' | 'high' | 'critical';
    userId?: string;
    ipAddress: string;
    userAgent: string;
    details: Record<string, any>;
    timestamp: Date;
    resolved: boolean;
    resolvedAt?: Date;
    resolvedBy?: string;
}
export interface ThreatIntelligence {
    ipAddress: string;
    reputation: 'good' | 'suspicious' | 'malicious';
    country: string;
    city?: string;
    isp?: string;
    threatTypes: string[];
    lastSeen: Date;
    confidence: number;
}
export interface SSOProvider {
    id: string;
    name: string;
    type: 'oauth2' | 'oidc' | 'saml';
    clientId: string;
    clientSecret: string;
    authorizationUrl: string;
    tokenUrl: string;
    userInfoUrl?: string;
    scopes: string[];
    enabled: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const UserSchema: z.ZodObject<{
    email: z.ZodString;
    username: z.ZodString;
    password: z.ZodString;
    roles: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    permissions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    email?: string;
    username?: string;
    password?: string;
    roles?: string[];
    permissions?: string[];
}, {
    email?: string;
    username?: string;
    password?: string;
    roles?: string[];
    permissions?: string[];
}>;
export declare const MFAMethodSchema: z.ZodObject<{
    type: z.ZodEnum<["totp", "sms", "email", "hardware"]>;
    phoneNumber: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type?: "email" | "sms" | "totp" | "hardware";
    email?: string;
    phoneNumber?: string;
}, {
    type?: "email" | "sms" | "totp" | "hardware";
    email?: string;
    phoneNumber?: string;
}>;
export declare const APITokenSchema: z.ZodObject<{
    name: z.ZodString;
    scopes: z.ZodArray<z.ZodString, "many">;
    expiresIn: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    name?: string;
    scopes?: string[];
    expiresIn?: number;
}, {
    name?: string;
    scopes?: string[];
    expiresIn?: number;
}>;
export declare const RoleSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    permissions: z.ZodArray<z.ZodString, "many">;
    orgId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name?: string;
    orgId?: string;
    description?: string;
    permissions?: string[];
}, {
    name?: string;
    orgId?: string;
    description?: string;
    permissions?: string[];
}>;
export declare const PermissionSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    resource: z.ZodString;
    action: z.ZodString;
    orgId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name?: string;
    action?: string;
    orgId?: string;
    description?: string;
    resource?: string;
}, {
    name?: string;
    action?: string;
    orgId?: string;
    description?: string;
    resource?: string;
}>;
export declare class AdvancedSecuritySystem extends EventEmitter {
    private users;
    private mfaMethods;
    private apiTokens;
    private roles;
    private permissions;
    private auditLogs;
    private securityEvents;
    private threatIntelligence;
    private ssoProviders;
    private failedLoginAttempts;
    private ipReputationCache;
    constructor();
    createUser(data: z.infer<typeof UserSchema>): Promise<User>;
    authenticateUser(email: string, password: string, ipAddress: string, userAgent: string): Promise<{
        user: User;
        token: string;
    } | null>;
    setupMFA(userId: string, method: z.infer<typeof MFAMethodSchema>): Promise<{
        secret?: string;
        qrCode?: string;
    }>;
    verifyMFA(userId: string, code: string, methodType: 'totp' | 'sms' | 'email'): Promise<boolean>;
    createAPIToken(userId: string, data: z.infer<typeof APITokenSchema>): Promise<APIToken>;
    validateAPIToken(token: string): Promise<{
        userId: string;
        scopes: string[];
    } | null>;
    createRole(data: z.infer<typeof RoleSchema>): Promise<Role>;
    createPermission(data: z.infer<typeof PermissionSchema>): Promise<Permission>;
    checkPermission(userId: string, resource: string, action: string): Promise<boolean>;
    logAuditEvent(event: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void>;
    logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp' | 'resolved'>): Promise<void>;
    checkIPReputation(ipAddress: string): Promise<ThreatIntelligence>;
    private hashPassword;
    private generateBackupCodes;
    private generateTOTPSecret;
    private generateTOTPQRCode;
    private generateVerificationCode;
    private verifyTOTPCode;
    private generateJWT;
    private sendSMSVerification;
    private sendEmailVerification;
    private checkBruteForceProtection;
    private recordFailedLogin;
    private analyzeThreatPatterns;
    private setupDefaultRoles;
    private setupDefaultPermissions;
    private initializeSecurity;
    getUsers(): Promise<User[]>;
    getUser(userId: string): Promise<User | null>;
    getMFAMethods(userId: string): Promise<MFAMethod[]>;
    getAPITokens(userId: string): Promise<APIToken[]>;
    getRoles(): Promise<Role[]>;
    getPermissions(): Promise<Permission[]>;
    getAuditLogs(limit?: number): Promise<AuditLog[]>;
    getSecurityEvents(limit?: number): Promise<SecurityEvent[]>;
    getThreatIntelligence(ipAddress?: string): Promise<ThreatIntelligence[]>;
    getSecurityStats(): Promise<{
        totalUsers: number;
        mfaEnabledUsers: number;
        activeAPITokens: number;
        totalRoles: number;
        totalPermissions: number;
        auditLogsCount: number;
        securityEventsCount: number;
        threatIntelligenceCount: number;
    }>;
}
export declare const advancedSecuritySystem: AdvancedSecuritySystem;
//# sourceMappingURL=advanced-security.d.ts.map