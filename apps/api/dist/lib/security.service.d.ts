export interface SecurityEvent {
    id: string;
    type: 'AUTH_FAILURE' | 'RATE_LIMIT' | 'SUSPICIOUS_ACTIVITY' | 'DATA_BREACH' | 'UNAUTHORIZED_ACCESS';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    userId?: string;
    organizationId?: string;
    ipAddress: string;
    userAgent: string;
    details: any;
    timestamp: Date;
}
export interface SecurityConfig {
    maxLoginAttempts: number;
    lockoutDuration: number;
    suspiciousActivityThreshold: number;
    dataEncryptionKey: string;
    auditLogRetention: number;
}
export interface AuditLog {
    id: string;
    userId?: string;
    organizationId?: string;
    action: string;
    resource: string;
    ipAddress: string;
    userAgent: string;
    details: any;
    timestamp: Date;
}
export declare class SecurityService {
    private config;
    private blockedIPs;
    private suspiciousIPs;
    constructor();
    recordLoginAttempt(email: string, ipAddress: string, userAgent: string, success: boolean): Promise<void>;
    isIPBlocked(ipAddress: string): Promise<boolean>;
    blockIP(ipAddress: string, reason: string): Promise<void>;
    unblockIP(ipAddress: string): Promise<void>;
    detectSuspiciousActivity(userId: string, organizationId: string, action: string, ipAddress: string, userAgent: string, details: any): Promise<boolean>;
    encryptData(data: string): string;
    decryptData(encryptedData: string): string;
    recordAuditLog(auditLog: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void>;
    recordSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): Promise<void>;
    validateInput(data: any, schema: any): {
        isValid: boolean;
        errors: string[];
    };
    sanitizeInput(input: string): string;
    private getLogLevel;
    private sendSecurityAlert;
    private startSecurityMonitoring;
    private cleanupExpiredBlocks;
    private cleanupOldLogs;
    updateConfig(newConfig: Partial<SecurityConfig>): void;
    getConfig(): SecurityConfig;
}
export declare const securityService: SecurityService;
//# sourceMappingURL=security.service.d.ts.map