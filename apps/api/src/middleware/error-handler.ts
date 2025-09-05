import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { errorManagerService, ErrorCode, ErrorSeverity } from '../lib/error-manager.service.js';
import { structuredLogger } from '../lib/structured-logger.js';

// Error Handler Middleware - MEJORA 2
// Middleware centralizado para manejo de errores con códigos estandarizados

interface ErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    severity: ErrorSeverity;
    category: string;
    retryable: boolean;
    retryAfter?: number;
    suggestions?: string[];
    documentation?: string;
    requestId?: string;
    timestamp: string;
  };
  details?: any;
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly severity: ErrorSeverity;
  public readonly retryable: boolean;
  public readonly retryAfter?: number;
  public readonly suggestions?: string[];
  public readonly documentation?: string;

  constructor(
    code: ErrorCode,
    message: string,
    retryable: boolean = false,
    retryAfter?: number,
    suggestions?: string[],
    documentation?: string
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.severity = errorManagerService['getSeverityForCode'](code);
    this.retryable = retryable;
    this.retryAfter = retryAfter;
    this.suggestions = suggestions;
    this.documentation = documentation;
  }
}

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const requestId = req.headers['x-request-id'] as string || 
                   req.headers['x-correlation-id'] as string ||
                   `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const context = {
    requestId,
    userId: req.headers['x-user-id'] as string,
    organizationId: req.headers['x-org'] as string,
    sessionId: req.headers['x-session-id'] as string,
    endpoint: req.path,
    method: req.method,
    userAgent: req.headers['user-agent'],
    ip: req.ip || req.connection.remoteAddress,
    service: 'api-express'
  };

  let errorDetails;
  let statusCode = 500;

  // Manejo de diferentes tipos de errores
  if (error instanceof AppError) {
    // Error de aplicación
    errorDetails = errorManagerService.createError(
      error.code,
      error.message,
      context,
      error
    );
    statusCode = getStatusCodeForErrorCode(error.code);
  } else if (error instanceof ZodError) {
    // Error de validación Zod
    errorDetails = errorManagerService.createError(
      ErrorCode.VALIDATION_ERROR,
      'Validation failed',
      context,
      error
    );
    statusCode = 400;
  } else if (error.name === 'CastError') {
    // Error de casting (MongoDB/Prisma)
    errorDetails = errorManagerService.createError(
      ErrorCode.INVALID_INPUT,
      'Invalid data format',
      context,
      error
    );
    statusCode = 400;
  } else if (error.name === 'ValidationError') {
    // Error de validación de base de datos
    errorDetails = errorManagerService.createError(
      ErrorCode.VALIDATION_ERROR,
      'Database validation failed',
      context,
      error
    );
    statusCode = 400;
  } else if (error.name === 'UnauthorizedError') {
    // Error de autenticación
    errorDetails = errorManagerService.createError(
      ErrorCode.UNAUTHORIZED,
      'Authentication required',
      context,
      error
    );
    statusCode = 401;
  } else if (error.name === 'ForbiddenError') {
    // Error de autorización
    errorDetails = errorManagerService.createError(
      ErrorCode.FORBIDDEN,
      'Access denied',
      context,
      error
    );
    statusCode = 403;
  } else if (error.name === 'NotFoundError') {
    // Error de recurso no encontrado
    errorDetails = errorManagerService.createError(
      ErrorCode.NOT_FOUND,
      'Resource not found',
      context,
      error
    );
    statusCode = 404;
  } else if (error.name === 'ConflictError') {
    // Error de conflicto
    errorDetails = errorManagerService.createError(
      ErrorCode.CONFLICT,
      'Resource conflict',
      context,
      error
    );
    statusCode = 409;
  } else if (error.name === 'RateLimitError') {
    // Error de rate limiting
    errorDetails = errorManagerService.createError(
      ErrorCode.RATE_LIMIT_EXCEEDED,
      'Rate limit exceeded',
      context,
      error
    );
    statusCode = 429;
  } else if (error.name === 'TimeoutError') {
    // Error de timeout
    errorDetails = errorManagerService.createError(
      ErrorCode.TIMEOUT_ERROR,
      'Request timeout',
      context,
      error
    );
    statusCode = 408;
  } else {
    // Error interno del servidor
    errorDetails = errorManagerService.createError(
      ErrorCode.INTERNAL_ERROR,
      'Internal server error',
      context,
      error
    );
    statusCode = 500;
  }

  // Crear respuesta de error
  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      code: errorDetails.code,
      message: errorDetails.message,
      severity: errorDetails.severity,
      category: errorDetails.category,
      retryable: errorDetails.retryable,
      retryAfter: errorDetails.retryAfter,
      suggestions: errorDetails.suggestions,
      documentation: errorDetails.documentation,
      requestId,
      timestamp: new Date().toISOString()
    }
  };

  // Añadir detalles adicionales para errores de validación
  if (error instanceof ZodError) {
    errorResponse.details = {
      validationErrors: error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code
      }))
    };
  }

  // Log del error
  const logLevel = getLogLevelForSeverity(errorDetails.severity);
  structuredLogger[logLevel]('Request error', {
    ...context,
    error: {
      code: errorDetails.code,
      message: errorDetails.message,
      severity: errorDetails.severity,
      category: errorDetails.category,
      retryable: errorDetails.retryable
    },
    statusCode
  });

  // Enviar respuesta
  res.status(statusCode).json(errorResponse);
};

// Middleware para manejar rutas no encontradas
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const requestId = req.headers['x-request-id'] as string || 
                   req.headers['x-correlation-id'] as string ||
                   `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const context = {
    requestId,
    endpoint: req.path,
    method: req.method,
    userAgent: req.headers['user-agent'],
    ip: req.ip || req.connection.remoteAddress,
    service: 'api-express'
  };

  const errorDetails = errorManagerService.createError(
    ErrorCode.NOT_FOUND,
    `Route ${req.method} ${req.path} not found`,
    context
  );

  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      code: errorDetails.code,
      message: errorDetails.message,
      severity: errorDetails.severity,
      category: errorDetails.category,
      retryable: errorDetails.retryable,
      requestId,
      timestamp: new Date().toISOString()
    }
  };

  structuredLogger.warn('Route not found', {
    ...context,
    error: {
      code: errorDetails.code,
      message: errorDetails.message
    }
  });

  res.status(404).json(errorResponse);
};

// Middleware para manejar errores de async/await
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Función para obtener código de estado HTTP basado en el código de error
function getStatusCodeForErrorCode(code: ErrorCode): number {
  if (code >= 1000 && code < 2000) return 400; // Validation errors
  if (code >= 2000 && code < 3000) return 401; // Authentication errors
  if (code >= 3000 && code < 4000) return 403; // Authorization errors
  if (code >= 4000 && code < 5000) return 404; // Resource errors
  if (code >= 5000 && code < 6000) return 409; // Conflict errors
  if (code >= 6000 && code < 7000) return 500; // Server errors
  if (code >= 7000 && code < 8000) return 422; // Business rule violations
  if (code >= 8000 && code < 9000) return 502; // Integration errors
  
  // Casos especiales
  if (code === ErrorCode.RATE_LIMIT_EXCEEDED) return 429;
  if (code === ErrorCode.TIMEOUT_ERROR) return 408;
  if (code === ErrorCode.SERVICE_UNAVAILABLE) return 503;
  
  return 500;
}

// Función para obtener nivel de log basado en severidad
function getLogLevelForSeverity(severity: ErrorSeverity): 'error' | 'warn' | 'info' {
  switch (severity) {
    case ErrorSeverity.CRITICAL:
    case ErrorSeverity.HIGH:
      return 'error';
    case ErrorSeverity.MEDIUM:
      return 'warn';
    case ErrorSeverity.LOW:
      return 'info';
    default:
      return 'warn';
  }
}

// Función para crear errores de aplicación de forma conveniente
export const createAppError = {
  validation: (message: string, details?: any) => 
    new AppError(ErrorCode.VALIDATION_ERROR, message, false, undefined, ['Check input format'], '/docs/validation'),
  
  unauthorized: (message: string = 'Authentication required') => 
    new AppError(ErrorCode.UNAUTHORIZED, message, false, undefined, ['Check authentication token'], '/docs/authentication'),
  
  forbidden: (message: string = 'Access denied') => 
    new AppError(ErrorCode.FORBIDDEN, message, false, undefined, ['Check user permissions'], '/docs/authorization'),
  
  notFound: (message: string = 'Resource not found') => 
    new AppError(ErrorCode.NOT_FOUND, message, false, undefined, ['Verify resource exists'], '/docs/resources'),
  
  conflict: (message: string = 'Resource conflict') => 
    new AppError(ErrorCode.CONFLICT, message, false, undefined, ['Check for duplicates'], '/docs/conflicts'),
  
  internal: (message: string = 'Internal server error') => 
    new AppError(ErrorCode.INTERNAL_ERROR, message, true, 30, ['Contact support', 'Try again later'], '/docs/server-errors'),
  
  database: (message: string = 'Database error') => 
    new AppError(ErrorCode.DATABASE_ERROR, message, true, 10, ['Check database connection'], '/docs/database'),
  
  external: (message: string = 'External service error') => 
    new AppError(ErrorCode.EXTERNAL_SERVICE_ERROR, message, true, 60, ['Check external service status'], '/docs/integrations'),
  
  rateLimit: (message: string = 'Rate limit exceeded') => 
    new AppError(ErrorCode.RATE_LIMIT_EXCEEDED, message, true, 60, ['Wait before retrying'], '/docs/rate-limiting'),
  
  timeout: (message: string = 'Request timeout') => 
    new AppError(ErrorCode.TIMEOUT_ERROR, message, true, 10, ['Try again with shorter timeout'], '/docs/timeouts'),
  
  business: (message: string = 'Business rule violation') => 
    new AppError(ErrorCode.BUSINESS_RULE_VIOLATION, message, false, undefined, ['Review business rules'], '/docs/business-rules')
};
