import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
export interface ValidationSchema {
    body?: z.ZodSchema;
    params?: z.ZodSchema;
    query?: z.ZodSchema;
    headers?: z.ZodSchema;
}
export declare const validateRequest: (schema: ValidationSchema) => (req: Request, res: Response, next: NextFunction) => void;
export declare const authenticate: (req: Request, res: Response, next: NextFunction) => void;
export declare const authorize: (requiredPermissions?: string[]) => (req: Request, res: Response, next: NextFunction) => void;
export declare const errorHandler: (error: Error, req: Request, res: Response, next: NextFunction) => void;
export declare const notFoundHandler: (req: Request, res: Response) => void;
export declare const asyncHandler: (fn: Function) => (req: Request, res: Response, next: NextFunction) => void;
export declare const requestLogger: (req: Request, res: Response, next: NextFunction) => void;
export declare const rateLimit: (maxRequests?: number, windowMs?: number) => (req: Request, res: Response, next: NextFunction) => void;
export declare const corsHandler: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=base.middleware.d.ts.map