import { z } from 'zod';
export interface SecurityConfig {
    jwt: {
        secret: string;
        expiresIn: string;
        refreshExpiresIn: string;
        algorithm: string;
    };
    mfa: {
        enabled: boolean;
        issuer: string;
        window: number;
        backupCodes: number;
        methods: string[];
    };
    csrf: {
        enabled: boolean;
        secret: string;
        tokenLength: number;
        cookieName: string;
    };
    rateLimit: {
        enabled: boolean;
        windowMs: number;
        maxRequests: number;
        skipSuccessfulRequests: boolean;
    };
    inputSanitization: {
        enabled: boolean;
        maxLength: number;
        allowedTags: string[];
        blockedPatterns: string[];
    };
    threatDetection: {
        enabled: boolean;
        suspiciousPatterns: string[];
        maxFailedAttempts: number;
        lockoutDuration: number;
    };
    compliance: {
        gdpr: boolean;
        sox: boolean;
        pciDss: boolean;
        hipaa: boolean;
        iso27001: boolean;
    };
    encryption: {
        algorithm: string;
        keyLength: number;
        ivLength: number;
    };
}
export interface SecurityEvent {
    id: string;
    type: 'authentication' | 'authorization' | 'data_access' | 'data_modification' | 'security_violation' | 'compliance_breach' | 'threat_detected';
    severity: 'low' | 'medium' | 'high' | 'critical';
    userId?: string;
    sessionId?: string;
    ipAddress: string;
    userAgent: string;
    resource: string;
    action: string;
    result: 'success' | 'failure' | 'blocked';
    details: Record<string, any>;
    timestamp: Date;
    riskScore: number;
    complianceFlags: string[];
}
export interface SecurityMetrics {
    authentication: {
        totalLogins: number;
        successfulLogins: number;
        failedLogins: number;
        mfaCompletions: number;
        mfaFailures: number;
    };
    authorization: {
        permissionChecks: number;
        deniedAccess: number;
        roleAssignments: number;
        permissionGrants: number;
    };
    threats: {
        detectedThreats: number;
        blockedIPs: number;
        suspiciousActivities: number;
        csrfAttacks: number;
    };
    compliance: {
        complianceChecks: number;
        violations: number;
        remediations: number;
        auditLogs: number;
    };
    performance: {
        avgResponseTime: number;
        p95ResponseTime: number;
        errorRate: number;
        throughput: number;
    };
}
declare const MFASetupSchema: z.ZodObject<{
    userId: z.ZodString;
    method: z.ZodEnum<["totp", "sms", "email"]>;
    phoneNumber: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    userId?: string;
    method?: "email" | "sms" | "totp";
    email?: string;
    phoneNumber?: string;
}, {
    userId?: string;
    method?: "email" | "sms" | "totp";
    email?: string;
    phoneNumber?: string;
}>;
declare const MFACodeSchema: z.ZodObject<{
    userId: z.ZodString;
    code: z.ZodString;
    method: z.ZodEnum<["totp", "sms", "email", "backup"]>;
}, "strip", z.ZodTypeAny, {
    code?: string;
    userId?: string;
    method?: "email" | "sms" | "totp" | "backup";
}, {
    code?: string;
    userId?: string;
    method?: "email" | "sms" | "totp" | "backup";
}>;
declare const RBACPermissionSchema: z.ZodObject<{
    userId: z.ZodString;
    resource: z.ZodString;
    action: z.ZodString;
    context: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    userId?: string;
    context?: Record<string, any>;
    action?: string;
    resource?: string;
}, {
    userId?: string;
    context?: Record<string, any>;
    action?: string;
    resource?: string;
}>;
declare const CSRFTokenSchema: z.ZodObject<{
    sessionId: z.ZodString;
    token: z.ZodString;
}, "strip", z.ZodTypeAny, {
    sessionId?: string;
    token?: string;
}, {
    sessionId?: string;
    token?: string;
}>;
declare const SanitizeInputSchema: z.ZodObject<{
    input: z.ZodString;
    type: z.ZodOptional<z.ZodEnum<["html", "sql", "xss", "general"]>>;
}, "strip", z.ZodTypeAny, {
    type?: "xss" | "html" | "general" | "sql";
    input?: string;
}, {
    type?: "xss" | "html" | "general" | "sql";
    input?: string;
}>;
declare const ThreatDetectionSchema: z.ZodObject<{
    ipAddress: z.ZodString;
    userAgent: z.ZodString;
    request: z.ZodRecord<z.ZodString, z.ZodAny>;
    riskFactors: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    userAgent?: string;
    ipAddress?: string;
    request?: Record<string, any>;
    riskFactors?: string[];
}, {
    userAgent?: string;
    ipAddress?: string;
    request?: Record<string, any>;
    riskFactors?: string[];
}>;
export declare class AdvancedSecurityFrameworkService {
    private config;
    private securityEvents;
    private metrics;
    private blockedIPs;
    private suspiciousActivities;
    private mfaSessions;
    private csrfTokens;
    constructor();
    private getDefaultConfig;
    private getDefaultMetrics;
    private initializeMetrics;
    initializeMFA(data: z.infer<typeof MFASetupSchema>): Promise<{
        qrCode: string;
        backupCodes: string[];
    }>;
    verifyMFACode(data: z.infer<typeof MFACodeSchema>): Promise<{
        valid: boolean;
        sessionToken?: string;
    }>;
    createMFASession(userId: string, sessionData: any): Promise<string>;
    checkPermission(data: z.infer<typeof RBACPermissionSchema>): Promise<{
        allowed: boolean;
        reason?: string;
    }>;
    assignRole(userId: string, role: string, assignedBy: string): Promise<{
        success: boolean;
    }>;
    generateCSRFToken(sessionId: string): Promise<string>;
    verifyCSRFToken(data: z.infer<typeof CSRFTokenSchema>): Promise<{
        valid: boolean;
    }>;
    sanitizeInput(data: z.infer<typeof SanitizeInputSchema>): Promise<{
        sanitized: string;
        threats: string[];
    }>;
    detectThreats(data: z.infer<typeof ThreatDetectionSchema>): Promise<{
        threats: string[];
        riskScore: number;
        blocked: boolean;
    }>;
    checkCompliance(organizationId: string, complianceType: string): Promise<{
        compliant: boolean;
        violations: string[];
        score: number;
    }>;
    getSecurityMetrics(): Promise<SecurityMetrics>;
    getHealthStatus(): Promise<{
        status: string;
        services: Record<string, boolean>;
        lastCheck: string;
    }>;
    private logSecurityEvent;
    private generateSecret;
    private generateBackupCode;
    private generateSessionToken;
    private generateSessionId;
    private generateEventId;
    private generateRandomToken;
    private verifyTOTPCode;
    private generateTOTPCode;
    private getUserRoles;
    private checkRolePermission;
    private sanitizeHTML;
    private isBotTraffic;
    private isSuspiciousIP;
    private calculateAverageResponseTime;
    private calculateP95ResponseTime;
    private calculateErrorRate;
    private calculateThroughput;
}
export declare const advancedSecurityFramework: AdvancedSecurityFrameworkService;
export {};
//# sourceMappingURL=advanced-security-framework.service.d.ts.map