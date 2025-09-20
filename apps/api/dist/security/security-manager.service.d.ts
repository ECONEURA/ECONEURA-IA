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
}
export interface UserSession {
    userId: string;
    organizationId: string;
    roles: string[];
    permissions: string[];
    mfaVerified: boolean;
    lastActivity: Date;
    ipAddress: string;
    userAgent: string;
    sessionId: string;
}
export interface SecurityEvent {
    type: 'login' | 'logout' | 'mfa_attempt' | 'mfa_success' | 'mfa_failure' | 'permission_denied' | 'suspicious_activity' | 'csrf_attack' | 'rate_limit_exceeded' | 'input_sanitization' | 'threat_detected';
    userId?: string;
    organizationId?: string;
    ipAddress: string;
    userAgent: string;
    details: any;
    severity: 'low' | 'medium' | 'high' | 'critical';
    timestamp: Date;
}
export interface MFASecret {
    secret: string;
    qrCode: string;
    backupCodes: string[];
    createdAt: Date;
}
export interface ThreatDetection {
    ipAddress: string;
    threatLevel: 'low' | 'medium' | 'high' | 'critical';
    attackTypes: string[];
    attempts: number;
    firstSeen: Date;
    lastSeen: Date;
    blocked: boolean;
}
export declare class SecurityManagerService {
    private static instance;
    private config;
    private activeSessions;
    private securityEvents;
    private threatDatabase;
    private failedAttempts;
    private isMonitoring;
    private monitoringInterval;
    private constructor();
    static getInstance(): SecurityManagerService;
    private getDefaultConfig;
    generateJWT(payload: any): string;
    verifyJWT(token: string): any;
    generateRefreshToken(payload: any): string;
    generateMFASecret(userId: string): MFASecret;
    verifyMFACode(secret: string, code: string, userId: string): boolean;
    generateCSRFToken(): string;
    verifyCSRFToken(token: string, sessionToken: string): boolean;
    sanitizeInput(input: string): string;
    detectThreat(ipAddress: string, userAgent: string, requestData: any): ThreatDetection | null;
    checkPermission(userId: string, permission: string, resource?: string): boolean;
    recordSecurityEvent(event: SecurityEvent): void;
    getSecurityStats(): {
        activeSessions: number;
        securityEvents: number;
        threatsDetected: number;
        blockedIPs: number;
        mfaEnabled: boolean;
        csrfEnabled: boolean;
        rateLimitEnabled: boolean;
        inputSanitizationEnabled: boolean;
        threatDetectionEnabled: boolean;
    };
    private generateRandomString;
    private generateQRCode;
    private generateBackupCodes;
    private validateTOTPCode;
    private analyzeThreatLevel;
    private identifyAttackTypes;
    private escalateThreatLevel;
    private startMonitoring;
    private performSecurityMonitoring;
    private cleanupExpiredSessions;
    private cleanupFailedAttempts;
    private analyzeThreats;
    updateConfig(newConfig: Partial<SecurityConfig>): void;
    stop(): void;
}
export declare const securityManagerService: SecurityManagerService;
//# sourceMappingURL=security-manager.service.d.ts.map