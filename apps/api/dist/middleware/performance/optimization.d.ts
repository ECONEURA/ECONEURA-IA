import { Request, Response, NextFunction } from 'express';
export declare const compressionMiddleware: any;
export declare const responseTimeMiddleware: (req: Request, res: Response, next: NextFunction) => void;
export declare const cacheControlMiddleware: (maxAge?: number) => (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=optimization.d.ts.map