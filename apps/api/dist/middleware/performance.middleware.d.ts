import { Request, Response, NextFunction } from 'express';
export declare const performanceMiddleware: (req: Request, res: Response, next: NextFunction) => void;
export declare const cacheMiddleware: (req: Request, res: Response, next: NextFunction) => void;
export declare const compressionMiddleware: (req: Request, res: Response, next: NextFunction) => void;
export declare const advancedRateLimitMiddleware: (req: Request, res: Response, next: NextFunction) => void;
export declare const resourceMonitoringMiddleware: (req: Request, res: Response, next: NextFunction) => void;
export declare const cacheCleanupMiddleware: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=performance.middleware.d.ts.map