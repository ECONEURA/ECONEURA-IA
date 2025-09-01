import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from './logger';
import { metrics } from './metrics';

// Tipos de error personalizados
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, 'VALIDATION_ERROR', message);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string) {
    super(401, 'AUTHENTICATION_ERROR', message);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string) {
    super(403, 'AUTHORIZATION_ERROR', message);
  }
}

// Middleware de manejo de errores central
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Registrar error
  logger.error({
    msg: 'Error occurred',
    error: {
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      code: error instanceof AppError ? error.code : 'INTERNAL_ERROR'
    },
    request: {
      method: req.method,
      url: req.url,
      params: req.params,
      query: req.query,
      requestId: req.headers['x-request-id'],
      orgId: req.headers['x-org-id']
    }
  });

  // Incrementar métricas de error
  metrics.recordError(
    error instanceof AppError ? error.code : 'INTERNAL_ERROR',
    req.method,
    req.route?.path || req.path
  );

  // Manejar errores específicos
  if (error instanceof ZodError) {
    return res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Invalid request data',
      errors: error.errors
    });
  }

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      code: error.code,
      message: error.message
    });
  }

  // Error genérico para producción
  const isDev = process.env.NODE_ENV === 'development';
  
  return res.status(500).json({
    code: 'INTERNAL_ERROR',
    message: isDev ? error.message : 'An unexpected error occurred',
    ...(isDev && { stack: error.stack })
  });
};

// Middleware para rutas no encontradas
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const error = new AppError(
    404,
    'NOT_FOUND',
    `Route ${req.method} ${req.url} not found`
  );
  
  next(error);
};

// Helper para envolver rutas async
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
