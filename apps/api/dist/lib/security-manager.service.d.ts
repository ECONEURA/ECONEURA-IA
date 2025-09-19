interface SecurityConfig {
    jwt: {
        secret: string;
        refreshSecret: string;
        accessTokenExpiry: number;
        refreshTokenExpiry: number;
        issuer: string;
        audience: string;
    };
    rateLimiting: {
        windowMs: number;
        maxRequests: number;
        skipSuccessfulRequests: boolean;
        skipFailedRequests: boolean;
        keyGenerator: (req: any) => string;
    };
    csrf: {
        enabled: boolean;
        secret: string;
        tokenLength: number;
        cookieName: string;
        headerName: string;
    };
    sanitization: {
        enabled: boolean;
        allowedTags: string[];
        allowedAttributes: Record<string, string[]>;
        maxLength: number;
    };
    encryption: {
        algorithm: string;
        keyLength: number;
        ivLength: number;
    };
    session: {
        secret: string;
        maxAge: number;
        secure: boolean;
        httpOnly: boolean;
        sameSite: 'strict' | 'lax' | 'none';
    };
}
interface SecurityEvent {
    id: string;
    type: 'authentication' | 'authorization' | 'rate_limit' | 'csrf' | 'xss' | 'injection' | 'brute_force' | 'suspicious_activity';
    severity: 'low' | 'medium' | 'high' | 'critical';
    source: {
        ip: string;
        userAgent: string;
        userId?: string;
        organizationId?: string;
    };
    details: {
        endpoint?: string;
        method?: string;
        payload?: any;
        reason: string;
        metadata?: Record<string, any>;
    };
    timestamp: string;
    blocked: boolean;
    action: 'logged' | 'blocked' | 'rate_limited' | 'redirected';
}
interface SecurityStats {
    total: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    bySource: Record<string, number>;
    last24Hours: number;
    lastHour: number;
    blocked: number;
    rateLimited: number;
}
declare class SecurityManagerService {
    private config;
    private securityEvents;
    private rateLimitStore;
    private blockedIPs;
    private suspiciousIPs;
    private securityStats;
    constructor();
    private initializeConfig;
    private initializeStats;
    private startCleanupInterval;
    private startSecurityMonitoring;
    generateTokens(payload: any): {
        accessToken: string;
        refreshToken: string;
    };
    verifyToken(token: string, type?: 'access' | 'refresh'): any;
    private signJWT;
    private verifyJWT;
    checkRateLimit(key: string, maxRequests?: number): {
        allowed: boolean;
        remaining: number;
        resetTime: number;
    };
    generateCSRFToken(): string;
    verifyCSRFToken(token: string, sessionToken: string): boolean;
    sanitizeInput(input: string): string;
    encrypt(text: string): {
        encrypted: string;
        iv: string;
        tag: string;
    };
    decrypt(encrypted: string, iv: string, tag: string): string;
    recordSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): void;
    isIPBlocked(ip: string): boolean;
    blockIP(ip: string, reason: string): void;
    unblockIP(ip: string): void;
    private analyzeSecurityThreats;
    private updateBlockedIPs;
    private cleanupOldData;
    private updateSecurityStats;
    private getLogLevelForSeverity;
    getSecurityStats(): SecurityStats;
    getSecurityEvents(limit?: number): SecurityEvent[];
    getBlockedIPs(): string[];
    getConfig(): SecurityConfig;
    updateConfig(newConfig: Partial<SecurityConfig>): void;
}
export declare const securityManagerService: SecurityManagerService;
export {};
//# sourceMappingURL=security-manager.service.d.ts.map