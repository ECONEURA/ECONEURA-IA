import { Request, Response, NextFunction } from 'express';
export declare const rateLimitOrg: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>;
export declare const standardRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const budgetGuard: (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
export declare const endpointRateLimit: (maxRequests: number, windowMs?: number) => import("express-rate-limit").RateLimitRequestHandler;
export declare const userRateLimit: (maxRequests: number, windowMs?: number) => import("express-rate-limit").RateLimitRequestHandler;
//# sourceMappingURL=rate-limit-org.d.ts.map