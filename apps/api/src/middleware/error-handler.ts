import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  isOperational?: boolean;
}

/**
 * Custom error class for application errors
 */
export class ApiError extends Error implements AppError {
  public statusCode: number;
  public code: string;
  public isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global error handling middleware
 * Handles all errors thrown in the application
 */
export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'Internal server error';
  let details: any = undefined;

  console.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query
  });

  // Handle different error types
  if (error instanceof ApiError) {
    statusCode = error.statusCode;
    code = error.code;
    message = error.message;
  } 
  else if (error instanceof ZodError) {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Request validation failed';
    details = error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code
    }));
  }
  else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        statusCode = 409;
        code = 'DUPLICATE_RESOURCE';
        message = 'Resource already exists';
        details = {
          target: error.meta?.target,
          prismaCode: error.code
        };
        break;
      case 'P2025':
        statusCode = 404;
        code = 'RESOURCE_NOT_FOUND';
        message = 'Resource not found';
        details = {
          cause: error.meta?.cause,
          prismaCode: error.code
        };
        break;
      case 'P2003':
        statusCode = 400;
        code = 'FOREIGN_KEY_CONSTRAINT';
        message = 'Foreign key constraint failed';
        details = {
          field: error.meta?.field_name,
          prismaCode: error.code
        };
        break;
      default:
        statusCode = 500;
        code = 'DATABASE_ERROR';
        message = 'Database operation failed';
        details = {
          prismaCode: error.code,
          meta: error.meta
        };
    }
  }
  else if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    statusCode = 500;
    code = 'DATABASE_UNKNOWN_ERROR';
    message = 'Unknown database error occurred';
  }
  else if (error instanceof Prisma.PrismaClientRustPanicError) {
    statusCode = 500;
    code = 'DATABASE_PANIC_ERROR';
    message = 'Database engine panic occurred';
  }
  else if (error instanceof Prisma.PrismaClientInitializationError) {
    statusCode = 500;
    code = 'DATABASE_INIT_ERROR';
    message = 'Database initialization failed';
  }
  else if (error instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    code = 'DATABASE_VALIDATION_ERROR';
    message = 'Database query validation failed';
  }

  // Create error response
  const errorResponse: any = {
    error: message,
    code,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  };

  // Add details in development mode or for validation errors
  if (details || process.env.NODE_ENV === 'development') {
    errorResponse.details = details;
    
    // Include stack trace in development
    if (process.env.NODE_ENV === 'development') {
      errorResponse.stack = error.stack;
    }
  }

  res.status(statusCode).json(errorResponse);
};

/**
 * 404 handler for unmatched routes
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error = new ApiError(
    `Route ${req.method} ${req.path} not found`,
    404,
    'ROUTE_NOT_FOUND'
  );
  next(error);
};

/**
 * Async wrapper to catch errors in async route handlers
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};