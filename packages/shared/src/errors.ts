/**
 * Errores personalizados para el SDK de EcoNeura
 */

// Error base para el SDK
export class EcoNeuraError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'EcoNeuraError';
  }
}

// Error de validación
export class ValidationError extends EcoNeuraError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', 422, details);
    this.name = 'ValidationError';
  }
}

// Error de autenticación
export class AuthenticationError extends EcoNeuraError {
  constructor(message: string = 'Authentication failed') {
    super(message, 'AUTHENTICATION_ERROR', 401);
    this.name = 'AuthenticationError';
  }
}

// Error de autorización
export class AuthorizationError extends EcoNeuraError {
  constructor(message: string = 'Not authorized') {
    super(message, 'AUTHORIZATION_ERROR', 403);
    this.name = 'AuthorizationError';
  }
}

// Error de rate limit
export class RateLimitError extends EcoNeuraError {
  constructor(
    message: string = 'Rate limit exceeded',
    public retryAfter?: number
  ) {
    super(message, 'RATE_LIMIT_ERROR', 429, { retryAfter });
    this.name = 'RateLimitError';
  }
}

// Error de timeout
export class TimeoutError extends EcoNeuraError {
  constructor(message: string = 'Request timed out') {
    super(message, 'TIMEOUT_ERROR', 408);
    this.name = 'TimeoutError';
  }
}

// Error de API
export class ApiError extends EcoNeuraError {
  constructor(message: string, statusCode: number, details?: Record<string, unknown>) {
    super(message, 'API_ERROR', statusCode, details);
    this.name = 'ApiError';
  }
}

// Error de red
export class NetworkError extends EcoNeuraError {
  constructor(message: string = 'Network error occurred') {
    super(message, 'NETWORK_ERROR', 0);
    this.name = 'NetworkError';
  }
}

// Error de configuración
export class ConfigurationError extends EcoNeuraError {
  constructor(message: string) {
    super(message, 'CONFIGURATION_ERROR');
    this.name = 'ConfigurationError';
  }
}

// Función helper para convertir errores de la API a errores del SDK
export function parseApiError(error: any): EcoNeuraError {
  if (error instanceof EcoNeuraError) {
    return error;
  }

  if (error.response) {
    const { status, data } = error.response;
    
    switch (status) {
      case 401:
        return new AuthenticationError(data?.message);
      case 403:
        return new AuthorizationError(data?.message);
      case 422:
        return new ValidationError(data?.message || 'Validation failed', data?.details);
      case 429:
        return new RateLimitError(data?.message, data?.retryAfter);
      default:
        return new ApiError(
          data?.message || 'API error occurred',
          status,
          data?.details
        );
    }
  }

  if (error.code === 'ETIMEDOUT') {
    return new TimeoutError();
  }

  if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
    return new NetworkError(error.message);
  }

  return new EcoNeuraError(
    error.message || 'An unexpected error occurred',
    'UNKNOWN_ERROR'
  );
}
