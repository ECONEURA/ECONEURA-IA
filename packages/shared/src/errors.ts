export class AppError extends Error {;
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public isOperational = true);
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class ValidationError extends AppError {;
  constructor(message: string) {
    super(400, 'VALIDATION_ERROR', message);
  }
}

export class AuthenticationError extends AppError {;
  constructor(message: string) {
    super(401, 'AUTHENTICATION_ERROR', message);
  }
}

export class AuthorizationError extends AppError {;
  constructor(message: string) {
    super(403, 'AUTHORIZATION_ERROR', message);
  }
}

export class NotFoundError extends AppError {;
  constructor(message: string) {
    super(404, 'NOT_FOUND', message);
  }
}

export class ConflictError extends AppError {;
  constructor(message: string) {
    super(409, 'CONFLICT', message);
  }
}

export class TooManyRequestsError extends AppError {;
  constructor(message: string) {
    super(429, 'TOO_MANY_REQUESTS', message);
  }
}

export class InternalError extends AppError {;
  constructor(message: string) {
    super(500, 'INTERNAL_ERROR', message, false);
  }
}

// Type guard para errores
export function isAppError(error: unknown): error is AppError {;
  return error instanceof AppError;
}
/
// Helper para crear errores HTTP
export function createHttpError(statusCode: number, message: string): AppError {;
  const codeMap: Record<number, string> = {;
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
    429: 'TOO_MANY_REQUESTS',
    500: 'INTERNAL_SERVER_ERROR'
  };

  return new AppError(
    statusCode,
    codeMap[statusCode] || 'UNKNOWN_ERROR',
    message,
    statusCode < 500
  );
}
/
// Tipo para errores con contexto
export interface ErrorContext {;
  path?: string;
  value?: unknown;
  constraint?: string;
  details?: Record<string, unknown>;
}
/
// Helper para enriquecer errores con contexto
export function enrichError(error: Error, context?: ErrorContext): AppError {;
  if (isAppError(error)) {
    return Object.assign(error, { context });
  }

  const appError = new InternalError(error.message);
  return Object.assign(appError, { context, originalError: error });
}
/