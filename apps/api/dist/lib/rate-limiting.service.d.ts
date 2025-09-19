export interface RateLimitConfig {
    windowMs: number;
    maxRequests: number;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
    keyGenerator?: (req: any) => string;
}
export declare class RateLimitingService {
    private limits;
    checkLimit(key: string, config: RateLimitConfig): {
        allowed: boolean;
        remaining: number;
        resetTime: number;
    };
    cleanup(): void;
}
export declare const rateLimitingService: RateLimitingService;
//# sourceMappingURL=rate-limiting.service.d.ts.map