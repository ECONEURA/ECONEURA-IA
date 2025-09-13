import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// ============================================================================
// VALIDATION MIDDLEWARE
// ============================================================================

export interface ValidationSchema {
  body?: z.ZodSchema;
  query?: z.ZodSchema;
  params?: z.ZodSchema;
  headers?: z.ZodSchema;
}

export const validateRequest = (schema: ValidationSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (schema.body) {
        req.body = schema.body.parse(req.body);
      }
      if (schema.query) {
        req.query = schema.query.parse(req.query);
      }
      if (schema.params) {
        req.params = schema.params.parse(req.params);
      }
      if (schema.headers) {
        req.headers = schema.headers.parse(req.headers);
      }
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code
          })),
          timestamp: new Date()
        });
        return;
      }
      next(error);
    }
  };
};
