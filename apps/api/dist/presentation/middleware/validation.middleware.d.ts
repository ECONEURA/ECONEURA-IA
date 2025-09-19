import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
export interface ValidationSchema {
    body?: z.ZodSchema;
    query?: z.ZodSchema;
    params?: z.ZodSchema;
    headers?: z.ZodSchema;
}
export declare const validateRequest: (schema: ValidationSchema) => (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=validation.middleware.d.ts.map