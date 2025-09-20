import { Request, Response, NextFunction } from 'express';
export interface RateLimitConfig {
    windowMs: number;
    maxRequests: number;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
    keyGenerator?: (req: Request) => string;
    onLimitReached?: (req: Request, res: Response) => void;
    message?: string;
    standardHeaders?: boolean;
    legacyHeaders?: boolean;
}
export interface RateLimitInfo {
    limit: number;
    remaining: number;
    reset: number;
    retryAfter?: number;
}
export declare class RateLimiter {
    private static instance;
    private limits;
    private cleanupInterval;
    constructor();
    static getInstance(): RateLimiter;
    private cleanup;
    private getKey;
    private getLimitInfo;
    checkLimit(key: string, limit: number, windowMs: number): RateLimitInfo;
    destroy(): void;
}
export declare class RateLimitMiddleware {
    static create(config: RateLimitConfig): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
    static readonly configs: {
        auth: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
        api: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
        read: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
        write: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
        sensitive: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
        upload: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
        webhook: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
        search: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
        reports: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
        gdpr: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
        rls: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
        sepa: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
    };
    static createTieredRateLimit(tier: 'free' | 'premium' | 'enterprise'): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
    static createOrganizationRateLimit(organizationId: string, maxRequests?: number): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
}
//# sourceMappingURL=rate-limiter.d.ts.map