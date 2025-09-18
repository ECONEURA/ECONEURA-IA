import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

// ============================================================================
// ERROR MIDDLEWARE
// ============================================================================

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

export const errorHandler = (
  error: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log error
  console.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    headers: req.headers,
    body: req.body,
    timestamp: new Date()
  });

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code
      })),
      timestamp: new Date(),
      requestId: req.headers['x-request-id'] as string
    });
    return;
  }

  // Handle custom API errors
  if (error.statusCode) {
    res.status(error.statusCode).json({
      success: false,
      error: error.message,
      code: error.code,
      details: error.details,
      timestamp: new Date(),
      requestId: req.headers['x-request-id'] as string
    });
    return;
  }

  // Handle default errors
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    timestamp: new Date(),
    requestId: req.headers['x-request-id'] as string
  });
};

export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date(),
    requestId: req.headers['x-request-id'] as string
  });
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
