import { Request, Response, NextFunction } from 'express';
export interface OptimizedResponse extends Response {
    optimizedData?: any;
    optimizationHeaders?: Record<string, string>;
}
export declare function responseOptimizerMiddleware(req: Request, res: OptimizedResponse, next: NextFunction): void;
export declare function performanceHeadersMiddleware(req: Request, res: Response, next: NextFunction): void;
export declare function compressionMiddleware(req: Request, res: Response, next: NextFunction): void;
export declare const responseOptimizationMetrics: {
    responseOptimizations: any;
    responseOptimizationTime: any;
    textResponseOptimizations: any;
    responseTime: any;
};
//# sourceMappingURL=response-optimizer.d.ts.map