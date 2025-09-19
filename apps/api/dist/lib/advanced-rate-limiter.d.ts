export interface RateLimitConfig {
    windowMs: number;
    maxRequests: number;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
    keyGenerator?: (req: any) => string;
    onLimitReached?: (req: any, res: any) => void;
    standardHeaders?: boolean;
    legacyHeaders?: boolean;
}
export interface RateLimitInfo {
    limit: number;
    remaining: number;
    reset: Date;
    retryAfter?: number;
}
export interface RateLimitRule {
    id: string;
    name: string;
    pattern: string;
    config: RateLimitConfig;
    enabled: boolean;
    priority: number;
}
export interface RateLimitStats {
    totalRequests: number;
    allowedRequests: number;
    blockedRequests: number;
    averageResponseTime: number;
    peakRequestsPerSecond: number;
    currentRequestsPerSecond: number;
}
export declare class AdvancedRateLimiter {
    private rules;
    private requestCounts;
    private stats;
    private cleanupInterval;
    private requestHistory;
    constructor();
    registerRule(rule: RateLimitRule): void;
    unregisterRule(ruleId: string): void;
    checkLimit(req: any, res: any): Promise<{
        allowed: boolean;
        info?: RateLimitInfo;
    }>;
    private findMatchingRule;
    private matchesPattern;
    private generateKey;
    private setRateLimitHeaders;
    private recordRequest;
    private recordMetrics;
    private cleanup;
    getStats(): RateLimitStats;
    getRule(ruleId: string): RateLimitRule | undefined;
    getAllRules(): RateLimitRule[];
    toggleRule(ruleId: string, enabled: boolean): void;
    resetLimit(key: string): void;
    resetAllLimits(): void;
    destroy(): void;
}
export declare const rateLimitMetrics: {
    rateLimitTotal: any;
    rateLimitAllowed: any;
    rateLimitBlocked: any;
    rateLimitDuration: any;
};
export declare const advancedRateLimiter: AdvancedRateLimiter;
//# sourceMappingURL=advanced-rate-limiter.d.ts.map