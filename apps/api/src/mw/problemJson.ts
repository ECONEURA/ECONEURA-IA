import type { Request, Response, NextFunction } from 'express';
import { logger } from '@econeura/shared/logging';

export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  org_id?: string;
  [key: string]: unknown;
}

export class ApiError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly title: string;
  public readonly type: string;
  public readonly details?: Record<string, unknown>;

  constructor(
    status: number,
    code: string,
    title: string,
    message?: string,
    details?: Record<string, unknown>
  ) {
    super(message || title);
    this.status = status;
    this.code = code;
    this.title = title;
    this.type = `https://econeura.dev/errors/${code}`;
    this.details = details;
    
    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  static badRequest(message: string, details?: Record<string, unknown>): ApiError {
    return new ApiError(400, 'bad_request', 'Bad Request', message, details);
  }

  static unauthorized(message = 'Authentication required'): ApiError {
    return new ApiError(401, 'unauthorized', 'Unauthorized', message);
  }

  static forbidden(message = 'Access forbidden'): ApiError {
    return new ApiError(403, 'forbidden', 'Forbidden', message);
  }

  static notFound(resource = 'Resource'): ApiError {
    return new ApiError(404, 'not_found', 'Not Found', `${resource} not found`);
  }

  static conflict(message: string, details?: Record<string, unknown>): ApiError {
    return new ApiError(409, 'conflict', 'Conflict', message, details);
  }

  static unprocessableEntity(message: string, details?: Record<string, unknown>): ApiError {
    return new ApiError(422, 'unprocessable_entity', 'Unprocessable Entity', message, details);
  }

  static tooManyRequests(message = 'Rate limit exceeded'): ApiError {
    return new ApiError(429, 'too_many_requests', 'Too Many Requests', message);
  }

  static internalServerError(message = 'Internal server error'): ApiError {
    return new ApiError(500, 'internal_server_error', 'Internal Server Error', message);
  }

  static serviceUnavailable(message = 'Service temporarily unavailable'): ApiError {
    return new ApiError(503, 'service_unavailable', 'Service Unavailable', message);
  }
}

export function problemJson(err: any, req: Request, res: Response, next: NextFunction): void {
  // Skip if response already sent
  if (res.headersSent) {
    return next(err);
  }

  const orgId = req.header('x-org-id');
  const corrId = res.locals.corr_id || req.header('x-request-id') || 'n/a';

  let problem: ProblemDetails;

  if (err instanceof ApiError) {
    // Custom API error
    problem = {
      type: err.type,
      title: err.title,
      status: err.status,
      detail: err.message,
      instance: `corr:${corrId}`,
      org_id: orgId || 'n/a',
      ...err.details,
    };

    // Log based on severity
    if (err.status >= 500) {
      logger.error('Server error', err, {
        corr_id: corrId,
        org_id: orgId,
        route: req.route?.path || req.path,
        method: req.method,
      });
    } else if (err.status >= 400) {
      logger.warn('Client error', {
        corr_id: corrId,
        org_id: orgId,
        route: req.route?.path || req.path,
        method: req.method,
        status: err.status,
        error_code: err.code,
        message: err.message,
      });
    }

  } else if (err.name === 'ValidationError' || err.name === 'ZodError') {
    // Validation errors (from Zod or other validators)
    const validationDetails = err.errors || err.issues || [];
    
    problem = {
      type: 'https://econeura.dev/errors/validation_error',
      title: 'Validation Error',
      status: 422,
      detail: 'Request validation failed',
      instance: `corr:${corrId}`,
      org_id: orgId || 'n/a',
      validation_errors: validationDetails,
    };

    logger.warn('Validation error', {
      corr_id: corrId,
      org_id: orgId,
      route: req.route?.path || req.path,
      method: req.method,
      validation_errors: validationDetails,
    });

  } else if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
    // Network/connection errors
    problem = {
      type: 'https://econeura.dev/errors/service_unavailable',
      title: 'Service Unavailable',
      status: 503,
      detail: 'External service temporarily unavailable',
      instance: `corr:${corrId}`,
      org_id: orgId || 'n/a',
    };

    logger.error('Service connection error', err, {
      corr_id: corrId,
      org_id: orgId,
      route: req.route?.path || req.path,
    });

  } else if (err.code === 'EBADCSRFTOKEN') {
    // CSRF token errors
    problem = {
      type: 'https://econeura.dev/errors/invalid_csrf_token',
      title: 'Invalid CSRF Token',
      status: 403,
      detail: 'CSRF token validation failed',
      instance: `corr:${corrId}`,
      org_id: orgId || 'n/a',
    };

    logger.logSecurityEvent('CSRF token validation failed', {
      event_type: 'auth_failure',
      org_id: orgId,
      ip_address: req.ip,
      x_request_id: corrId,
    });

  } else {
    // Unknown/unexpected errors
    const status = parseInt(err?.status) || err?.statusCode || 500;
    
    problem = {
      type: err?.code ? 
        `https://econeura.dev/errors/${err.code}` : 
        'https://econeura.dev/errors/internal_error',
      title: err?.title || (status >= 500 ? 'Internal Server Error' : 'Client Error'),
      status,
      detail: err?.message || 'An unexpected error occurred',
      instance: `corr:${corrId}`,
      org_id: orgId || 'n/a',
    };

    // Always log unknown errors
    logger.error('Unhandled error', err, {
      corr_id: corrId,
      org_id: orgId,
      route: req.route?.path || req.path,
      method: req.method,
      user_agent: req.get('user-agent'),
    });
  }

  // Set security headers
  res.setHeader('Content-Type', 'application/problem+json');
  res.setHeader('Cache-Control', 'no-store');
  
  // Send problem response
  res.status(problem.status || 500).json(problem);
}

// Async error wrapper for route handlers
export function asyncHandler<T extends Request = Request, U extends Response = Response>(
  fn: (req: T, res: U, next: NextFunction) => Promise<any>
) {
  return (req: T, res: U, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// 404 handler for unmatched routes
export function notFoundHandler(req: Request, res: Response, next: NextFunction): void {
  const error = ApiError.notFound(`Route ${req.method} ${req.path}`);
  next(error);
}

// Development error handler with stack traces
export function developmentErrorHandler(err: any, req: Request, res: Response, next: NextFunction): void {
  if (process.env.NODE_ENV === 'development') {
    // Add stack trace in development
    const originalHandler = problemJson;
    originalHandler(err, req, res, (handledErr) => {
      if (handledErr && res.headersSent === false) {
        const problem = res.locals.problem || {};
        problem.stack = err?.stack;
        res.json(problem);
      } else if (handledErr) {
        next(handledErr);
      }
    });
  } else {
    problemJson(err, req, res, next);
  }
}