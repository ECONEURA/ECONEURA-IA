import { Request, Response, NextFunction } from 'express';
import {
  AppError,
  AuthenticationError,
  AuthorizationError,
  ResourceNotFoundError,
  RateLimitError,
  generateTraceId,
  isAppError,
  isZodError,
  isDatabaseError,
  isExternalServiceError,
  mapZodErrorToAppError,
  mapDatabaseErrorToAppError,
  mapExternalServiceErrorToAppError,
  ERROR_CODES,
  ErrorResponse,
} from '@econeura/shared/errors';

// ============================================================================
// ERROR HANDLER MIDDLEWARE
// ============================================================================

export interface ErrorHandlerConfig {
  includeStack: boolean;
  logErrors: boolean;
  logLevel: 'error' | 'warn' | 'info';
  sanitizeErrors: boolean;
  rateLimitWindow: number;
  rateLimitMax: number;
}

const defaultConfig: ErrorHandlerConfig = {
  includeStack: process.env.NODE_ENV !== 'production',
  logErrors: true,
  logLevel: 'error',
  sanitizeErrors: process.env.NODE_ENV === 'production',
  rateLimitWindow: 60000, // 1 minute
  rateLimitMax: 100,
};

export function createErrorHandler(config: Partial<ErrorHandlerConfig> = {}) {
  const finalConfig = { ...defaultConfig, ...config };

  return (error: unknown, req: Request, res: Response, next: NextFunction): void => {
    try {
      // Generate trace ID if not present
      const traceId = req.headers['x-correlation-id'] as string || generateTraceId();
      
      // Add trace ID to response headers
      res.setHeader('X-Correlation-ID', traceId);

      // Map error to AppError
      const appError = mapErrorToAppError(error, traceId, req);

      // Log error if configured
      if (finalConfig.logErrors) {
        logError(appError, req, finalConfig.logLevel);
      }

      // Sanitize error for production
      const sanitizedError = finalConfig.sanitizeErrors 
        ? sanitizeError(appError, finalConfig.includeStack)
        : appError;

      // Create error response
      const errorResponse: ErrorResponse = {
        success: false,
        error: sanitizedError.toJSON(),
        requestId: req.headers['x-request-id'] as string,
        correlationId: traceId,
      };

      // Add path and method to error details
      errorResponse.error.path = req.path;
      errorResponse.error.method = req.method;

      // Send error response
      res.status(appError.statusCode).json(errorResponse);

    } catch (handlerError) {
      // Fallback error handler
      console.error('Error handler failed:', handlerError);
      
      res.status(500).json({
        success: false,
  error: {
          code: ERROR_CODES.INTERNAL_SERVER_ERROR,
          message: 'Internal server error',
          timestamp: new Date().toISOString(),
          statusCode: 500,
          path: req.path,
          method: req.method,
        },
        correlationId: req.headers['x-correlation-id'] as string || generateTraceId(),
      });
    }
  };
}

// ============================================================================
// ERROR MAPPING
// ============================================================================

function mapErrorToAppError(error: unknown, traceId: string, req: Request): AppError {
  // Already an AppError
  if (isAppError(error)) {
    return error;
  }

  // Zod validation error
  if (isZodError(error)) {
    return mapZodErrorToAppError(error, traceId);
  }

  // Database error
  if (isDatabaseError(error)) {
    return mapDatabaseErrorToAppError(error, req.method, traceId);
  }

  // External service error
  if (isExternalServiceError(error)) {
    return mapExternalServiceErrorToAppError(error, 'unknown', traceId);
  }

  // Express error with status
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as any).status;
    if (status === 401) {
      return new AuthenticationError(ERROR_CODES.AUTH_REQUIRED, undefined, traceId);
    }
    if (status === 403) {
      return new AuthorizationError(undefined, traceId);
    }
    if (status === 404) {
      return new ResourceNotFoundError('Resource', traceId);
    }
    if (status === 429) {
      return new RateLimitError(undefined, undefined, traceId);
    }
  }

  // Generic error
  const errorMessage = error instanceof Error ? error.message : String(error);
  return new AppError(
    ERROR_CODES.INTERNAL_SERVER_ERROR,
    errorMessage,
    { originalError: errorMessage },
    traceId
  );
}

// ============================================================================
// ERROR LOGGING
// ============================================================================

function logError(error: AppError, req: Request, logLevel: 'error' | 'warn' | 'info'): void {
  const logData = {
    timestamp: new Date().toISOString(),
    level: logLevel,
    error: {
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
      traceId: error.traceId,
    },
    request: {
    method: req.method,
      path: req.path,
    userAgent: req.headers['user-agent'],
      ip: req.ip,
      correlationId: req.headers['x-correlation-id'],
    },
    details: error.details,
  };

  // Use appropriate logging method based on level
  switch (logLevel) {
    case 'error':
      console.error('Error occurred:', logData);
      break;
    case 'warn':
      console.warn('Warning occurred:', logData);
      break;
    case 'info':
      console.info('Info occurred:', logData);
      break;
  }
}

// ============================================================================
// ERROR SANITIZATION
// ============================================================================

function sanitizeError(error: AppError, includeStack: boolean): AppError {
  const sanitizedError = new AppError(
    error.code,
    error.message,
    error.details,
    error.traceId
  );

  // Remove stack trace in production
  if (!includeStack) {
    delete (sanitizedError as any).stack;
  }

  // Sanitize sensitive details
  if (sanitizedError.details) {
    sanitizedError.details = sanitizeDetails(sanitizedError.details);
  }

  return sanitizedError;
}

function sanitizeDetails(details: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  const sensitiveKeys = ['password', 'token', 'secret', 'key', 'auth', 'credential'];

  for (const [key, value] of Object.entries(details)) {
    const isSensitive = sensitiveKeys.some(sensitiveKey => 
      key.toLowerCase().includes(sensitiveKey)
    );

    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeDetails(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

// ============================================================================
// NOT FOUND HANDLER
// ============================================================================

export function createNotFoundHandler() {
  return (req: Request, res: Response, next: NextFunction): void => {
    const traceId = req.headers['x-correlation-id'] as string || generateTraceId();
    
    res.setHeader('X-Correlation-ID', traceId);
    
    const error = new ResourceNotFoundError(`Route ${req.path}`, traceId);

  const errorResponse: ErrorResponse = {
    success: false,
      error: error.toJSON(),
      requestId: req.headers['x-request-id'] as string,
      correlationId: traceId,
    };

    errorResponse.error.path = req.path;
    errorResponse.error.method = req.method;

  res.status(404).json(errorResponse);
};
}

// ============================================================================
// ASYNC ERROR WRAPPER
// ============================================================================

export function asyncHandler<T extends any[], R>(
  fn: (...args: T) => Promise<R>
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      // Re-throw the error to be caught by the error handler middleware
      throw error;
    }
  };
}

// ============================================================================
// ERROR BOUNDARY FOR EXPRESS ROUTES
// ============================================================================

export function errorBoundary<T extends any[], R>(
  fn: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      // Log the error
      console.error('Error in route handler:', error);
      
      // Re-throw to be handled by error middleware
      throw error;
    }
  };
}

// ============================================================================
// HEALTH CHECK ERROR HANDLER
// ============================================================================

export function createHealthCheckErrorHandler() {
  return (error: unknown, req: Request, res: Response, next: NextFunction): void => {
    // For health check endpoints, always return 503 for errors
    if (req.path.includes('/health')) {
      res.status(503).json({
        success: false,
        error: {
          code: ERROR_CODES.SERVICE_UNAVAILABLE,
          message: 'Service unavailable',
          timestamp: new Date().toISOString(),
          statusCode: 503,
          path: req.path,
          method: req.method,
        },
        correlationId: req.headers['x-correlation-id'] as string || generateTraceId(),
      });
      return;
    }

    // For other endpoints, use the regular error handler
    next(error);
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  createErrorHandler,
  createNotFoundHandler,
  createHealthCheckErrorHandler,
  asyncHandler,
  errorBoundary,
};
