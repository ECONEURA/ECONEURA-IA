export interface RateLimitConfig {
    windowMs: number;
    maxRequests: number;
    strategy: 'token-bucket' | 'sliding-window' | 'fixed-window';
    burstSize?: number;
    refillRate?: number;
}
export interface OrganizationRateLimit {
    organizationId: string;
    config: RateLimitConfig;
    createdAt: Date;
    updatedAt: Date;
}
export interface RateLimitState {
    tokens: number;
    lastRefill: number;
    requestCount: number;
    windowStart: number;
}
export declare class IntelligentRateLimiter {
    private organizations;
    private states;
    private defaultConfig;
    constructor();
    private initializeDefaultOrganizations;
    addOrganization(organizationId: string, config: Partial<RateLimitConfig>): void;
    removeOrganization(organizationId: string): boolean;
    updateOrganization(organizationId: string, config: Partial<RateLimitConfig>): boolean;
    getEffectiveConfig(organizationId: string): RateLimitConfig;
    hasOrganization(organizationId: string): boolean;
    isAllowed(organizationId: string, requestId: string): {
        allowed: boolean;
        remaining: number;
        resetTime: number;
        retryAfter?: number;
    };
    private isAllowedWithConfig;
    private tokenBucketStrategy;
    private slidingWindowStrategy;
    private fixedWindowStrategy;
    getOrganizationStats(organizationId: string): {
        config: RateLimitConfig;
        state: RateLimitState;
        stats: any;
    } | null;
    getAllOrganizations(): OrganizationRateLimit[];
    resetOrganization(organizationId: string): boolean;
    getGlobalStats(): any;
}
export declare const rateLimiter: IntelligentRateLimiter;
//# sourceMappingURL=rate-limiting.d.ts.map