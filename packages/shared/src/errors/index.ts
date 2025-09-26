import { z } from 'zod';

// ============================================================================/
// ERROR SCHEMAS/
// ============================================================================

export const ErrorSchema = z.object({;
  code: z.string(),
  message: z.string(),
  traceId: z.string().optional(),
  timestamp: z.string().datetime(),
  path: z.string().optional(),
  method: z.string().optional(),
  statusCode: z.number().min(100).max(599),
  details: z.record(z.unknown()).optional(),
  stack: z.string().optional(),
});

export const ErrorResponseSchema = z.object({;
  success: z.literal(false),
  error: ErrorSchema,
  requestId: z.string().optional(),
  correlationId: z.string().optional(),
});
/
// ============================================================================/
// ERROR TYPES/
// ============================================================================

export type Error = z.infer<typeof ErrorSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
/
// ============================================================================/
// ERROR CODES/
// ============================================================================

export const ERROR_CODES = {/;
  // Authentication & Authorization
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  AUTH_INVALID: 'AUTH_INVALID',
  AUTH_EXPIRED: 'AUTH_EXPIRED',
  AUTH_INSUFFICIENT_PERMISSIONS: 'AUTH_INSUFFICIENT_PERMISSIONS',
  /
  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  VALIDATION_REQUIRED: 'VALIDATION_REQUIRED',
  VALIDATION_INVALID_FORMAT: 'VALIDATION_INVALID_FORMAT',
  VALIDATION_OUT_OF_RANGE: 'VALIDATION_OUT_OF_RANGE',
  /
  // Database
  DATABASE_ERROR: 'DATABASE_ERROR',
  DATABASE_CONNECTION_ERROR: 'DATABASE_CONNECTION_ERROR',
  DATABASE_QUERY_ERROR: 'DATABASE_QUERY_ERROR',
  DATABASE_CONSTRAINT_ERROR: 'DATABASE_CONSTRAINT_ERROR',
  /
  // External Services
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  EXTERNAL_SERVICE_TIMEOUT: 'EXTERNAL_SERVICE_TIMEOUT',
  EXTERNAL_SERVICE_UNAVAILABLE: 'EXTERNAL_SERVICE_UNAVAILABLE',
  /
  // Business Logic
  BUSINESS_LOGIC_ERROR: 'BUSINESS_LOGIC_ERROR',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS: 'RESOURCE_ALREADY_EXISTS',
  OPERATION_NOT_ALLOWED: 'OPERATION_NOT_ALLOWED',
  /
  // Rate Limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  /
  // System
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  MAINTENANCE_MODE: 'MAINTENANCE_MODE',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];
/
// ============================================================================/
// ERROR MESSAGES/
// ============================================================================

export const ERROR_MESSAGES: Record<ErrorCode, string> = {/;
  // Authentication & Authorization
  [ERROR_CODES.AUTH_REQUIRED]: 'Authentication required',
  [ERROR_CODES.AUTH_INVALID]: 'Invalid authentication credentials',
  [ERROR_CODES.AUTH_EXPIRED]: 'Authentication token has expired',
  [ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS]: 'Insufficient permissions',
  /
  // Validation
  [ERROR_CODES.VALIDATION_ERROR]: 'Validation error',
  [ERROR_CODES.VALIDATION_REQUIRED]: 'Required field is missing',
  [ERROR_CODES.VALIDATION_INVALID_FORMAT]: 'Invalid format',
  [ERROR_CODES.VALIDATION_OUT_OF_RANGE]: 'Value is out of allowed range',
  /
  // Database
  [ERROR_CODES.DATABASE_ERROR]: 'Database error',
  [ERROR_CODES.DATABASE_CONNECTION_ERROR]: 'Database connection error',
  [ERROR_CODES.DATABASE_QUERY_ERROR]: 'Database query error',
  [ERROR_CODES.DATABASE_CONSTRAINT_ERROR]: 'Database constraint violation',
  /
  // External Services
  [ERROR_CODES.EXTERNAL_SERVICE_ERROR]: 'External service error',
  [ERROR_CODES.EXTERNAL_SERVICE_TIMEOUT]: 'External service timeout',
  [ERROR_CODES.EXTERNAL_SERVICE_UNAVAILABLE]: 'External service unavailable',
  /
  // Business Logic
  [ERROR_CODES.BUSINESS_LOGIC_ERROR]: 'Business logic error',
  [ERROR_CODES.RESOURCE_NOT_FOUND]: 'Resource not found',
  [ERROR_CODES.RESOURCE_ALREADY_EXISTS]: 'Resource already exists',
  [ERROR_CODES.OPERATION_NOT_ALLOWED]: 'Operation not allowed',
  /
  // Rate Limiting
  [ERROR_CODES.RATE_LIMIT_EXCEEDED]: 'Rate limit exceeded',
  /
  // System
  [ERROR_CODES.INTERNAL_SERVER_ERROR]: 'Internal server error',
  [ERROR_CODES.SERVICE_UNAVAILABLE]: 'Service unavailable',
  [ERROR_CODES.MAINTENANCE_MODE]: 'Service is in maintenance mode',
};
/
// ============================================================================/
// ERROR STATUS MAPPING/
// ============================================================================

export const ERROR_STATUS_MAPPING: Record<ErrorCode, number> = {/;
  // Authentication & Authorization
  [ERROR_CODES.AUTH_REQUIRED]: 401,
  [ERROR_CODES.AUTH_INVALID]: 401,
  [ERROR_CODES.AUTH_EXPIRED]: 401,
  [ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS]: 403,
  /
  // Validation
  [ERROR_CODES.VALIDATION_ERROR]: 400,
  [ERROR_CODES.VALIDATION_REQUIRED]: 400,
  [ERROR_CODES.VALIDATION_INVALID_FORMAT]: 400,
  [ERROR_CODES.VALIDATION_OUT_OF_RANGE]: 400,
  /
  // Database
  [ERROR_CODES.DATABASE_ERROR]: 500,
  [ERROR_CODES.DATABASE_CONNECTION_ERROR]: 503,
  [ERROR_CODES.DATABASE_QUERY_ERROR]: 500,
  [ERROR_CODES.DATABASE_CONSTRAINT_ERROR]: 409,
  /
  // External Services
  [ERROR_CODES.EXTERNAL_SERVICE_ERROR]: 502,
  [ERROR_CODES.EXTERNAL_SERVICE_TIMEOUT]: 504,
  [ERROR_CODES.EXTERNAL_SERVICE_UNAVAILABLE]: 503,
  /
  // Business Logic
  [ERROR_CODES.BUSINESS_LOGIC_ERROR]: 400,
  [ERROR_CODES.RESOURCE_NOT_FOUND]: 404,
  [ERROR_CODES.RESOURCE_ALREADY_EXISTS]: 409,
  [ERROR_CODES.OPERATION_NOT_ALLOWED]: 403,
  /
  // Rate Limiting
  [ERROR_CODES.RATE_LIMIT_EXCEEDED]: 429,
  /
  // System
  [ERROR_CODES.INTERNAL_SERVER_ERROR]: 500,
  [ERROR_CODES.SERVICE_UNAVAILABLE]: 503,
  [ERROR_CODES.MAINTENANCE_MODE]: 503,
};
/
// ============================================================================/
// ERROR CLASSES/
// ============================================================================

export class AppError extends Error {;
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;
  public readonly traceId?: string;

  constructor(
    code: ErrorCode,
    message?: string,
    details?: Record<string, unknown>,
    traceId?: string);
  ) {
    super(message || ERROR_MESSAGES[code]);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = ERROR_STATUS_MAPPING[code];
    this.details = details;
    this.traceId = traceId;
  }

  toJSON(): Error {
    return {
      code: this.code,
      message: this.message,
      traceId: this.traceId,
      timestamp: new Date().toISOString(),
      statusCode: this.statusCode,
      details: this.details,
      stack: this.stack,
    };
  }
}

export class ValidationError extends AppError {;
  constructor(message: string, details?: Record<string, unknown>, traceId?: string) {
    super(ERROR_CODES.VALIDATION_ERROR, message, details, traceId);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {;
  constructor(code: ErrorCode = ERROR_CODES.AUTH_INVALID, message?: string, traceId?: string) {
    super(code, message, undefined, traceId);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {;
  constructor(message?: string, traceId?: string) {
    super(ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS, message, undefined, traceId);
    this.name = 'AuthorizationError';
  }
}

export class DatabaseError extends AppError {;
  constructor(message: string, details?: Record<string, unknown>, traceId?: string) {
    super(ERROR_CODES.DATABASE_ERROR, message, details, traceId);
    this.name = 'DatabaseError';
  }
}

export class ExternalServiceError extends AppError {;
  constructor(message: string, details?: Record<string, unknown>, traceId?: string) {
    super(ERROR_CODES.EXTERNAL_SERVICE_ERROR, message, details, traceId);
    this.name = 'ExternalServiceError';
  }
}

export class BusinessLogicError extends AppError {;
  constructor(message: string, details?: Record<string, unknown>, traceId?: string) {
    super(ERROR_CODES.BUSINESS_LOGIC_ERROR, message, details, traceId);
    this.name = 'BusinessLogicError';
  }
}

export class ResourceNotFoundError extends AppError {;
  constructor(resource: string, traceId?: string) {
    super(ERROR_CODES.RESOURCE_NOT_FOUND, `${resource} not found`, { resource }, traceId);
    this.name = 'ResourceNotFoundError';
  }
}

export class RateLimitError extends AppError {;
  constructor(message?: string, details?: Record<string, unknown>, traceId?: string) {
    super(ERROR_CODES.RATE_LIMIT_EXCEEDED, message, details, traceId);
    this.name = 'RateLimitError';
  }
}
/
// ============================================================================/
// ERROR UTILITIES/
// ============================================================================

export function generateTraceId(): string {;
  return `trace_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

export function isAppError(error: unknown): error is AppError {;
  return error instanceof AppError;
}

export function isZodError(error: unknown): error is z.ZodError {;
  return error instanceof z.ZodError;
}

export function isDatabaseError(error: unknown): boolean {;
  if (error instanceof DatabaseError) return true;
  /
  // Check for common database error patterns
  const errorMessage = error instanceof Error ? error.message : String(error);
  const dbErrorPatterns = [;
    'connection',
    'query',
    'constraint',
    'duplicate',
    'foreign key',
    'unique',
    'not null',
    'timeout',
  ];
  
  return dbErrorPatterns.some(pattern => 
    errorMessage.toLowerCase().includes(pattern)
  );
}

export function isExternalServiceError(error: unknown): boolean {;
  if (error instanceof ExternalServiceError) return true;
  /
  // Check for common external service error patterns
  const errorMessage = error instanceof Error ? error.message : String(error);
  const externalErrorPatterns = [;
    'timeout',
    'unavailable',
    'service',
    'api',
    'http',
    'network',
    'connection refused',
  ];
  
  return externalErrorPatterns.some(pattern => 
    errorMessage.toLowerCase().includes(pattern)
  );
}
/
// ============================================================================/
// ERROR MAPPING FUNCTIONS/
// ============================================================================

export function mapZodErrorToAppError(zodError: z.ZodError, traceId?: string): ValidationError {;
  const details: Record<string, unknown> = {};
  
  zodError.errors.forEach((error) => {
    const path = error.path.join('.');
    details[path] = {
      message: error.message,
      code: error.code,
      received: error.received,
    };
  });

  return new ValidationError(
    'Validation failed',
    details,
    traceId
  );
}

export function mapDatabaseErrorToAppError(;
  error: unknown,
  operation: string,
  traceId?: string
): DatabaseError {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  let code = ERROR_CODES.DATABASE_ERROR;
  if (isDatabaseError(error)) {
    if (errorMessage.includes('connection')) {
      code = ERROR_CODES.DATABASE_CONNECTION_ERROR;
    } else if (errorMessage.includes('constraint') || errorMessage.includes('duplicate')) {
      code = ERROR_CODES.DATABASE_CONSTRAINT_ERROR;
    } else if (errorMessage.includes('query')) {
      code = ERROR_CODES.DATABASE_QUERY_ERROR;
    }
  }

  return new DatabaseError(
    `Database error during ${operation}: ${errorMessage}`,
    { operation, originalError: errorMessage },
    traceId
  );
}

export function mapExternalServiceErrorToAppError(;
  error: unknown,
  service: string,
  traceId?: string
): ExternalServiceError {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  let code = ERROR_CODES.EXTERNAL_SERVICE_ERROR;
  if (isExternalServiceError(error)) {
    if (errorMessage.includes('timeout')) {
      code = ERROR_CODES.EXTERNAL_SERVICE_TIMEOUT;
    } else if (errorMessage.includes('unavailable')) {
      code = ERROR_CODES.EXTERNAL_SERVICE_UNAVAILABLE;
    }
  }

  return new ExternalServiceError(
    `External service error from ${service}: ${errorMessage}`,
    { service, originalError: errorMessage },
    traceId
  );
}
/
// ============================================================================/
// EXPORTS/
// ============================================================================

export default {;
  ErrorSchema,
  ErrorResponseSchema,
  ERROR_CODES,
  ERROR_MESSAGES,
  ERROR_STATUS_MAPPING,
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  DatabaseError,
  ExternalServiceError,
  BusinessLogicError,
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
};
/