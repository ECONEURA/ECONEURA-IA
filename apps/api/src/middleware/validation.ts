import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Generic validation middleware factory
 * Validates request body, query params, or route params against Zod schema
 */
export const validate = (schema: ZodSchema, target: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      let dataToValidate;
      
      switch (target) {
        case 'body':
          dataToValidate = req.body;
          break;
        case 'query':
          dataToValidate = req.query;
          break;
        case 'params':
          dataToValidate = req.params;
          break;
        default:
          dataToValidate = req.body;
      }

      const validatedData = schema.parse(dataToValidate);
      
      // Replace the original data with validated/transformed data
      switch (target) {
        case 'body':
          req.body = validatedData;
          break;
        case 'query':
          req.query = validatedData;
          break;
        case 'params':
          req.params = validatedData;
          break;
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
          received: err.received
        }));

        res.status(400).json({
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: formattedErrors
        });
        return;
      }

      console.error('Validation middleware error:', error);
      res.status(500).json({
        error: 'Internal validation error',
        code: 'VALIDATION_INTERNAL_ERROR'
      });
    }
  };
};

/**
 * Pagination validation middleware
 * Ensures consistent pagination parameters across endpoints
 */
export const validatePagination = (req: Request, res: Response, next: NextFunction): void => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = (page - 1) * limit;

  // Validate limits
  if (page < 1) {
    res.status(400).json({
      error: 'Page must be greater than 0',
      code: 'PAGINATION_INVALID_PAGE'
    });
    return;
  }

  if (limit < 1 || limit > 100) {
    res.status(400).json({
      error: 'Limit must be between 1 and 100',
      code: 'PAGINATION_INVALID_LIMIT'
    });
    return;
  }

  // Attach pagination to request for use in controllers
  req.pagination = {
    page,
    limit,
    offset
  };

  next();
};

// Extend Request interface to include pagination
declare global {
  namespace Express {
    interface Request {
      pagination?: {
        page: number;
        limit: number;
        offset: number;
      };
    }
  }
}