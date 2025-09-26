import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

import { logger } from './logger.js';
import { metrics } from './metrics.js';

function headerToString(h?: string | string[] | undefined): string | undefined {
  if (!h) return undefined;
  return Array.isArray(h) ? h[0] : h;
}

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
  try {
    const safeLogger = logger as unknown as { debug?: (...args: unknown[]) => void };
    const hasDebug = safeLogger && typeof safeLogger.debug === 'function';
    if (hasDebug) {
      const stack = process.env.NODE_ENV === 'development' && error && typeof (error as unknown as Record<string, unknown>)['stack'] === 'string'
        ? String((error as unknown as Record<string, unknown>)['stack'])
        : undefined;
      const r = req as Request & { originalUrl?: string; path?: string };
      safeLogger.debug?.('Error context', {
        error: { name: error.name, message: error.message, stack, code: error instanceof AppError ? error.code : 'INTERNAL_ERROR' },
        request: {
          method: req.method,
          url: r.originalUrl || r.path || req.url,
          params: req.params,
          query: req.query,
          requestId: headerToString(req.headers?.['x-request-id']),
          orgId: headerToString(req.headers?.['x-org-id'])
        }
      });
    }
  } catch {}

  // Incrementar métricas de error
  // recordError may not exist on current MetricsService; fallback to increment
  try {
    // Prefer recordError if available, otherwise fallback to increment
    const m = metrics as unknown as { recordError?: (code: string, method: string, route?: string) => void; increment?: (key: string, labels?: Record<string, unknown>) => void };
    const recordError = m.recordError;
    const increment = m.increment;
    const rr = req as Request & { route?: { path?: string }; path?: string };
    const routePath = rr.route?.path || rr.path || req.url;
    if (typeof recordError === 'function') {
      recordError(error instanceof AppError ? error.code : 'INTERNAL_ERROR', req.method, routePath);
    } else if (typeof increment === 'function') {
      increment(error instanceof AppError ? error.code : 'INTERNAL_ERROR', { method: req.method });
    }
  } catch (e) {}

  // Manejar errores específicos
  if (error instanceof ZodError) {
    return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Invalid request data', errors: error.errors });
  }

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ code: error.code, message: error.message });
  }

  // Error genérico para producción
  const isDev = process.env.NODE_ENV === 'development';

  return res.status(500).json({ code: 'INTERNAL_ERROR', message: isDev ? error.message : 'An unexpected error occurred', ...(isDev && { stack: error.stack }) });
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
