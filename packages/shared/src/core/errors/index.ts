/**
 * Base error class for all application errors
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error class
 */
export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', 400, context);
  }
}

/**
 * Authentication error class
 */
export class AuthenticationError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'AUTHENTICATION_ERROR', 401, context);
  }
}

/**
 * Authorization error class
 */
export class AuthorizationError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'AUTHORIZATION_ERROR', 403, context);
  }
}

/**
 * Not found error class
 */
export class NotFoundError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'NOT_FOUND', 404, context);
  }
}

/**
 * Conflict error class
 */
export class ConflictError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'CONFLICT', 409, context);
  }
}

/**
 * Rate limit error class
 */
export class RateLimitError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'RATE_LIMIT', 429, context);
  }
}

/**
 * Integration error class
 */
export class IntegrationError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'INTEGRATION_ERROR', 502, context);
  }
}

/**
 * Database error class
 */
export class DatabaseError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'DATABASE_ERROR', 503, context);
  }
}

/**
 * AI error class
 */
export class AIError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'AI_ERROR', 503, context);
  }
}

/**
 * Timeout error class
 */
export class TimeoutError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'TIMEOUT', 504, context);
  }
}

/**
 * Error factory to create error instances from error-like objects
 */
export function createError(error: Error | AppError | unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError(error.message, 'INTERNAL_ERROR', 500);
  }

  return new AppError('An unexpected error occurred', 'INTERNAL_ERROR', 500);
}
