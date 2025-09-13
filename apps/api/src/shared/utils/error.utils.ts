// ============================================================================
// ERROR UTILITIES
// ============================================================================

// ========================================================================
// ERROR TYPES
// ========================================================================

export enum ErrorType {
  VALIDATION = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND_ERROR',
  CONFLICT = 'CONFLICT_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED_ERROR',
  FORBIDDEN = 'FORBIDDEN_ERROR',
  INTERNAL = 'INTERNAL_ERROR',
  EXTERNAL = 'EXTERNAL_ERROR',
  TIMEOUT = 'TIMEOUT_ERROR',
  RATE_LIMIT = 'RATE_LIMIT_ERROR',
  BUSINESS = 'BUSINESS_ERROR'
}

export enum ErrorCode {
  // Validation errors (1000-1999)
  INVALID_INPUT = 1001,
  MISSING_REQUIRED_FIELD = 1002,
  INVALID_FORMAT = 1003,
  INVALID_RANGE = 1004,
  INVALID_ENUM = 1005,
  
  // Not found errors (2000-2999)
  ENTITY_NOT_FOUND = 2001,
  USER_NOT_FOUND = 2002,
  ORGANIZATION_NOT_FOUND = 2003,
  COMPANY_NOT_FOUND = 2004,
  CONTACT_NOT_FOUND = 2005,
  
  // Conflict errors (3000-3999)
  DUPLICATE_ENTITY = 3001,
  DUPLICATE_EMAIL = 3002,
  DUPLICATE_NAME = 3003,
  DUPLICATE_SLUG = 3004,
  
  // Authorization errors (4000-4999)
  UNAUTHORIZED_ACCESS = 4001,
  INVALID_TOKEN = 4002,
  EXPIRED_TOKEN = 4003,
  INSUFFICIENT_PERMISSIONS = 4004,
  
  // Business logic errors (5000-5999)
  BUSINESS_RULE_VIOLATION = 5001,
  QUOTA_EXCEEDED = 5002,
  INVALID_OPERATION = 5003,
  DEPENDENCY_CONFLICT = 5004,
  
  // External service errors (6000-6999)
  EXTERNAL_API_ERROR = 6001,
  DATABASE_ERROR = 6002,
  CACHE_ERROR = 6003,
  EMAIL_SERVICE_ERROR = 6004,
  
  // System errors (7000-7999)
  INTERNAL_SERVER_ERROR = 7001,
  SERVICE_UNAVAILABLE = 7002,
  TIMEOUT_ERROR = 7003,
  RATE_LIMIT_EXCEEDED = 7004
}

// ========================================================================
// ERROR INTERFACES
// ========================================================================

export interface BaseError {
  type: ErrorType;
  code: ErrorCode;
  message: string;
  details?: any;
  timestamp: Date;
  requestId?: string;
  userId?: string;
  organizationId?: string;
}

export interface ValidationError extends BaseError {
  type: ErrorType.VALIDATION;
  field?: string;
  value?: any;
  errors?: string[];
}

export interface NotFoundError extends BaseError {
  type: ErrorType.NOT_FOUND;
  entity: string;
  id?: string;
}

export interface ConflictError extends BaseError {
  type: ErrorType.CONFLICT;
  entity: string;
  field?: string;
  value?: any;
}

export interface BusinessError extends BaseError {
  type: ErrorType.BUSINESS;
  rule: string;
  context?: any;
}

export interface ExternalError extends BaseError {
  type: ErrorType.EXTERNAL;
  service: string;
  endpoint?: string;
  statusCode?: number;
}

// ========================================================================
// ERROR CLASSES
// ========================================================================

export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly code: ErrorCode;
  public readonly details?: any;
  public readonly timestamp: Date;
  public readonly requestId?: string;
  public readonly userId?: string;
  public readonly organizationId?: string;

  constructor(
    type: ErrorType,
    code: ErrorCode,
    message: string,
    details?: any,
    requestId?: string,
    userId?: string,
    organizationId?: string
  ) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.code = code;
    this.details = details;
    this.timestamp = new Date();
    this.requestId = requestId;
    this.userId = userId;
    this.organizationId = organizationId;
  }
}

export class ValidationAppError extends AppError {
  public readonly field?: string;
  public readonly value?: any;
  public readonly errors?: string[];

  constructor(
    message: string,
    field?: string,
    value?: any,
    errors?: string[],
    requestId?: string,
    userId?: string,
    organizationId?: string
  ) {
    super(ErrorType.VALIDATION, ErrorCode.INVALID_INPUT, message, undefined, requestId, userId, organizationId);
    this.field = field;
    this.value = value;
    this.errors = errors;
  }
}

export class NotFoundAppError extends AppError {
  public readonly entity: string;
  public readonly id?: string;

  constructor(
    entity: string,
    id?: string,
    requestId?: string,
    userId?: string,
    organizationId?: string
  ) {
    super(ErrorType.NOT_FOUND, ErrorCode.ENTITY_NOT_FOUND, `${entity} not found`, undefined, requestId, userId, organizationId);
    this.entity = entity;
    this.id = id;
  }
}

export class ConflictAppError extends AppError {
  public readonly entity: string;
  public readonly field?: string;
  public readonly value?: any;

  constructor(
    entity: string,
    message: string,
    field?: string,
    value?: any,
    requestId?: string,
    userId?: string,
    organizationId?: string
  ) {
    super(ErrorType.CONFLICT, ErrorCode.DUPLICATE_ENTITY, message, undefined, requestId, userId, organizationId);
    this.entity = entity;
    this.field = field;
    this.value = value;
  }
}

export class BusinessAppError extends AppError {
  public readonly rule: string;
  public readonly context?: any;

  constructor(
    rule: string,
    message: string,
    context?: any,
    requestId?: string,
    userId?: string,
    organizationId?: string
  ) {
    super(ErrorType.BUSINESS, ErrorCode.BUSINESS_RULE_VIOLATION, message, undefined, requestId, userId, organizationId);
    this.rule = rule;
    this.context = context;
  }
}

export class ExternalAppError extends AppError {
  public readonly service: string;
  public readonly endpoint?: string;
  public readonly statusCode?: number;

  constructor(
    service: string,
    message: string,
    endpoint?: string,
    statusCode?: number,
    requestId?: string,
    userId?: string,
    organizationId?: string
  ) {
    super(ErrorType.EXTERNAL, ErrorCode.EXTERNAL_API_ERROR, message, undefined, requestId, userId, organizationId);
    this.service = service;
    this.endpoint = endpoint;
    this.statusCode = statusCode;
  }
}

// ========================================================================
// ERROR FACTORY FUNCTIONS
// ========================================================================

export const createValidationError = (
  message: string,
  field?: string,
  value?: any,
  errors?: string[],
  requestId?: string,
  userId?: string,
  organizationId?: string
): ValidationAppError => {
  return new ValidationAppError(message, field, value, errors, requestId, userId, organizationId);
};

export const createNotFoundError = (
  entity: string,
  id?: string,
  requestId?: string,
  userId?: string,
  organizationId?: string
): NotFoundAppError => {
  return new NotFoundAppError(entity, id, requestId, userId, organizationId);
};

export const createConflictError = (
  entity: string,
  message: string,
  field?: string,
  value?: any,
  requestId?: string,
  userId?: string,
  organizationId?: string
): ConflictAppError => {
  return new ConflictAppError(entity, message, field, value, requestId, userId, organizationId);
};

export const createBusinessError = (
  rule: string,
  message: string,
  context?: any,
  requestId?: string,
  userId?: string,
  organizationId?: string
): BusinessAppError => {
  return new BusinessAppError(rule, message, context, requestId, userId, organizationId);
};

export const createExternalError = (
  service: string,
  message: string,
  endpoint?: string,
  statusCode?: number,
  requestId?: string,
  userId?: string,
  organizationId?: string
): ExternalAppError => {
  return new ExternalAppError(service, message, endpoint, statusCode, requestId, userId, organizationId);
};

// ========================================================================
// ERROR HANDLING UTILITIES
// ========================================================================

export const isAppError = (error: any): error is AppError => {
  return error instanceof AppError;
};

export const isValidationError = (error: any): error is ValidationAppError => {
  return error instanceof ValidationAppError;
};

export const isNotFoundError = (error: any): error is NotFoundAppError => {
  return error instanceof NotFoundAppError;
};

export const isConflictError = (error: any): error is ConflictAppError => {
  return error instanceof ConflictAppError;
};

export const isBusinessError = (error: any): error is BusinessAppError => {
  return error instanceof BusinessAppError;
};

export const isExternalError = (error: any): error is ExternalAppError => {
  return error instanceof ExternalAppError;
};

export const getErrorType = (error: any): ErrorType => {
  if (isAppError(error)) {
    return error.type;
  }
  return ErrorType.INTERNAL;
};

export const getErrorCode = (error: any): ErrorCode => {
  if (isAppError(error)) {
    return error.code;
  }
  return ErrorCode.INTERNAL_SERVER_ERROR;
};

export const getErrorMessage = (error: any): string => {
  if (isAppError(error)) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

export const getErrorDetails = (error: any): any => {
  if (isAppError(error)) {
    return error.details;
  }
  return undefined;
};

// ========================================================================
// ERROR LOGGING UTILITIES
// ========================================================================

export const logError = (error: any, context?: any): void => {
  const errorInfo = {
    type: getErrorType(error),
    code: getErrorCode(error),
    message: getErrorMessage(error),
    details: getErrorDetails(error),
    context,
    timestamp: new Date().toISOString(),
    stack: error.stack
  };

  // Log based on error type
  switch (errorInfo.type) {
    case ErrorType.VALIDATION:
      console.warn('Validation Error:', errorInfo);
      break;
    case ErrorType.NOT_FOUND:
      console.warn('Not Found Error:', errorInfo);
      break;
    case ErrorType.CONFLICT:
      console.warn('Conflict Error:', errorInfo);
      break;
    case ErrorType.UNAUTHORIZED:
    case ErrorType.FORBIDDEN:
      console.warn('Authorization Error:', errorInfo);
      break;
    case ErrorType.BUSINESS:
      console.warn('Business Error:', errorInfo);
      break;
    case ErrorType.EXTERNAL:
      console.error('External Service Error:', errorInfo);
      break;
    case ErrorType.INTERNAL:
    default:
      console.error('Internal Error:', errorInfo);
      break;
  }
};

// ========================================================================
// ERROR RESPONSE UTILITIES
// ========================================================================

export interface ErrorResponse {
  success: false;
  error: {
    type: ErrorType;
    code: ErrorCode;
    message: string;
    details?: any;
    timestamp: string;
    requestId?: string;
  };
}

export const createErrorResponse = (error: any, requestId?: string): ErrorResponse => {
  return {
    success: false,
    error: {
      type: getErrorType(error),
      code: getErrorCode(error),
      message: getErrorMessage(error),
      details: getErrorDetails(error),
      timestamp: new Date().toISOString(),
      requestId
    }
  };
};

// ========================================================================
// ERROR RECOVERY UTILITIES
// ========================================================================

export const isRecoverableError = (error: any): boolean => {
  if (isAppError(error)) {
    switch (error.type) {
      case ErrorType.EXTERNAL:
      case ErrorType.TIMEOUT:
      case ErrorType.RATE_LIMIT:
        return true;
      default:
        return false;
    }
  }
  return false;
};

export const getRetryDelay = (error: any, attempt: number): number => {
  if (isAppError(error)) {
    switch (error.type) {
      case ErrorType.RATE_LIMIT:
        return Math.min(1000 * Math.pow(2, attempt), 30000); // Exponential backoff, max 30s
      case ErrorType.TIMEOUT:
        return Math.min(1000 * attempt, 10000); // Linear backoff, max 10s
      case ErrorType.EXTERNAL:
        return Math.min(500 * Math.pow(2, attempt), 5000); // Exponential backoff, max 5s
      default:
        return 0;
    }
  }
  return 0;
};

// ========================================================================
// ERROR AGGREGATION UTILITIES
// ========================================================================

export const aggregateErrors = (errors: any[]): AppError => {
  if (errors.length === 0) {
    return new AppError(ErrorType.INTERNAL, ErrorCode.INTERNAL_SERVER_ERROR, 'No errors to aggregate');
  }

  if (errors.length === 1) {
    return errors[0] instanceof AppError ? errors[0] : new AppError(ErrorType.INTERNAL, ErrorCode.INTERNAL_SERVER_ERROR, errors[0].message);
  }

  const messages = errors.map(error => getErrorMessage(error));
  const aggregatedMessage = `Multiple errors occurred: ${messages.join('; ')}`;
  
  return new AppError(ErrorType.INTERNAL, ErrorCode.INTERNAL_SERVER_ERROR, aggregatedMessage, { errors });
};

// ========================================================================
// ERROR CONTEXT UTILITIES
// ========================================================================

export const addErrorContext = (error: any, context: any): AppError => {
  if (isAppError(error)) {
    return new AppError(
      error.type,
      error.code,
      error.message,
      { ...error.details, context },
      error.requestId,
      error.userId,
      error.organizationId
    );
  }
  
  return new AppError(ErrorType.INTERNAL, ErrorCode.INTERNAL_SERVER_ERROR, getErrorMessage(error), { context });
};

export const addRequestContext = (error: any, requestId: string, userId?: string, organizationId?: string): AppError => {
  if (isAppError(error)) {
    return new AppError(
      error.type,
      error.code,
      error.message,
      error.details,
      requestId,
      userId,
      organizationId
    );
  }
  
  return new AppError(ErrorType.INTERNAL, ErrorCode.INTERNAL_SERVER_ERROR, getErrorMessage(error), undefined, requestId, userId, organizationId);
};
