import { Request, Response, NextFunction } from 'express';
export interface RateLimitRequest extends Request {
    organizationId?: string;
    requestId?: string;
}
export declare function rateLimitMiddleware(req: RateLimitRequest, res: Response, next: NextFunction): void;
export declare function rateLimitByEndpoint(req: RateLimitRequest, res: Response, next: NextFunction): void;
export declare function rateLimitByUser(req: RateLimitRequest, res: Response, next: NextFunction): void;
export declare function rateLimitByApiKey(req: RateLimitRequest, res: Response, next: NextFunction): void;
//# sourceMappingURL=rate-limiting.d.ts.map