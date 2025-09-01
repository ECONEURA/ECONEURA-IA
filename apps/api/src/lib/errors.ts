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
  // logger.error espera (message: string, context?: LogContext)
  // Registrar mensaje principal y contexto adicional en debug para evitar firmas inconsistentes
  logger.error('Error occurred: ' + error.message);
  if ((logger as any).debug) {
    (logger as any).debug('Error context', {
      error: {
        name: error.name,
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? (error as any).stack : undefined,
        code: error instanceof AppError ? error.code : 'INTERNAL_ERROR'
      },
      request: {
        method: (req as any).method,
        url: (req as any).url,
        params: (req as any).params,
        query: (req as any).query,
        requestId: (req as any).headers?.['x-request-id'],
        orgId: (req as any).headers?.['x-org-id']
      }
    });
  }

  // Incrementar métricas de error
  // recordError may not exist on current MetricsService; fallback to increment
  try {
    (metrics as any).recordError(
      error instanceof AppError ? error.code : 'INTERNAL_ERROR',
      (req as any).method,
      (req as any).route?.path || (req as any).path || (req as any).url
    );
  } catch (e) {
    try {
      (metrics as any).increment((error instanceof AppError ? error.code : 'INTERNAL_ERROR'), { method: (req as any).method });
    } catch (e) {
      // no-op
    }
  }

  // Manejar errores específicos
  if (error instanceof ZodError) {
  return (res as any).status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Invalid request data',
      errors: error.errors
    });
  }

  if (error instanceof AppError) {
  return (res as any).status(error.statusCode).json({
      code: error.code,
      message: error.message
    });
  }

  // Error genérico para producción
  const isDev = process.env.NODE_ENV === 'development';
  
  return (res as any).status(500).json({
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
