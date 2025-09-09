/**
 * MEJORA 1: Sistema de Error Handling Centralizado y Robusto
 *
 * Sistema avanzado de manejo de errores con categorización,
 * logging estructurado, métricas y recuperación automática.
 */

import { structuredLogger } from './structured-logger.js';
import { metrics } from '@econeura/shared/src/metrics/index.js';

export enum ErrorCategory {
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  DATABASE = 'database',
  EXTERNAL_API = 'external_api',
  BUSINESS_LOGIC = 'business_logic',
  SYSTEM = 'system',
  NETWORK = 'network',
  TIMEOUT = 'timeout',
  RATE_LIMIT = 'rate_limit'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface ErrorContext {
  requestId?: string;
  userId?: string;
  organizationId?: string;
  endpoint?: string;
  method?: string;
  userAgent?: string;
  ip?: string;
  timestamp?: string;
  metadata?: Record<string, any>;
}

export interface ErrorDetails {
  code: string;
  message: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  context: ErrorContext;
  stack?: string;
  cause?: Error;
  retryable: boolean;
  retryAfter?: number;
  suggestions?: string[];
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    category: ErrorCategory;
    severity: ErrorSeverity;
    requestId: string;
    timestamp: string;
    suggestions?: string[];
  };
  metadata?: Record<string, any>;
}

export class ErrorHandlerService {
  private static instance: ErrorHandlerService;
  private errorPatterns: Map<string, ErrorDetails> = new Map();
  private retryStrategies: Map<string, RetryStrategy> = new Map();
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();

  private constructor() {
    this.initializeErrorPatterns();
    this.initializeRetryStrategies();
    this.initializeCircuitBreakers();
  }

  public static getInstance(): ErrorHandlerService {
    if (!ErrorHandlerService.instance) {
      ErrorHandlerService.instance = new ErrorHandlerService();
    }
    return ErrorHandlerService.instance;
  }

  private initializeErrorPatterns(): void {
    // Patrones de error comunes con configuraciones específicas
    this.errorPatterns.set('VALIDATION_ERROR', {
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      category: ErrorCategory.VALIDATION,
      severity: ErrorSeverity.LOW,
      context: {},
      retryable: false,
      suggestions: ['Check input parameters', 'Verify data format']
    });

    this.errorPatterns.set('AUTHENTICATION_ERROR', {
      code: 'AUTHENTICATION_ERROR',
      message: 'Authentication failed',
      category: ErrorCategory.AUTHENTICATION,
      severity: ErrorSeverity.MEDIUM,
      context: {},
      retryable: false,
      suggestions: ['Check credentials', 'Verify token validity']
    });

    this.errorPatterns.set('DATABASE_CONNECTION_ERROR', {
      code: 'DATABASE_CONNECTION_ERROR',
      message: 'Database connection failed',
      category: ErrorCategory.DATABASE,
      severity: ErrorSeverity.HIGH,
      context: {},
      retryable: true,
      retryAfter: 5000,
      suggestions: ['Check database connectivity', 'Verify connection pool']
    });

    this.errorPatterns.set('EXTERNAL_API_ERROR', {
      code: 'EXTERNAL_API_ERROR',
      message: 'External API call failed',
      category: ErrorCategory.EXTERNAL_API,
      severity: ErrorSeverity.MEDIUM,
      context: {},
      retryable: true,
      retryAfter: 2000,
      suggestions: ['Check external service status', 'Verify API credentials']
    });

    this.errorPatterns.set('RATE_LIMIT_ERROR', {
      code: 'RATE_LIMIT_ERROR',
      message: 'Rate limit exceeded',
      category: ErrorCategory.RATE_LIMIT,
      severity: ErrorSeverity.MEDIUM,
      context: {},
      retryable: true,
      retryAfter: 60000,
      suggestions: ['Wait before retrying', 'Consider upgrading rate limits']
    });
  }

  private initializeRetryStrategies(): void {
    this.retryStrategies.set('exponential_backoff', {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2,
      jitter: true
    });

    this.retryStrategies.set('linear_backoff', {
      maxRetries: 5,
      baseDelay: 2000,
      maxDelay: 10000,
      backoffMultiplier: 1,
      jitter: false
    });

    this.retryStrategies.set('immediate_retry', {
      maxRetries: 2,
      baseDelay: 100,
      maxDelay: 1000,
      backoffMultiplier: 1,
      jitter: false
    });
  }

  private initializeCircuitBreakers(): void {
    this.circuitBreakers.set('database', {
      failureThreshold: 5,
      recoveryTimeout: 30000,
      state: 'CLOSED',
      failureCount: 0,
      lastFailureTime: 0
    });

    this.circuitBreakers.set('external_api', {
      failureThreshold: 3,
      recoveryTimeout: 60000,
      state: 'CLOSED',
      failureCount: 0,
      lastFailureTime: 0
    });
  }

  /**
   * Maneja un error de forma centralizada
   */
  public handleError(error: Error, context: ErrorContext = {}): ErrorResponse {
    const errorDetails = this.categorizeError(error, context);
    const response = this.createErrorResponse(errorDetails);

    // Log estructurado
    this.logError(errorDetails);

    // Métricas
    this.recordErrorMetrics(errorDetails);

    // Circuit breaker
    this.updateCircuitBreaker(errorDetails);

    return response;
  }

  private categorizeError(error: Error, context: ErrorContext): ErrorDetails {
    const errorMessage = error.message.toLowerCase();
    const errorName = error.name.toLowerCase();

    // Detectar tipo de error basado en mensaje y nombre
    if (errorMessage.includes('validation') || errorMessage.includes('invalid')) {
      return this.createErrorDetails('VALIDATION_ERROR', error, context);
    }

    if (errorMessage.includes('unauthorized') || errorMessage.includes('authentication')) {
      return this.createErrorDetails('AUTHENTICATION_ERROR', error, context);
    }

    if (errorMessage.includes('database') || errorMessage.includes('connection')) {
      return this.createErrorDetails('DATABASE_CONNECTION_ERROR', error, context);
    }

    if (errorMessage.includes('api') || errorMessage.includes('http')) {
      return this.createErrorDetails('EXTERNAL_API_ERROR', error, context);
    }

    if (errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
      return this.createErrorDetails('RATE_LIMIT_ERROR', error, context);
    }

    // Error genérico del sistema
    return {
      code: 'SYSTEM_ERROR',
      message: error.message,
      category: ErrorCategory.SYSTEM,
      severity: ErrorSeverity.MEDIUM,
      context: { ...context, timestamp: new Date().toISOString() },
      stack: error.stack,
      retryable: true,
      retryAfter: 5000,
      suggestions: ['Contact support if issue persists']
    };
  }

  private createErrorDetails(patternKey: string, error: Error, context: ErrorContext): ErrorDetails {
    const pattern = this.errorPatterns.get(patternKey);
    if (!pattern) {
      throw new Error(`Unknown error pattern: ${patternKey}`);
    }

    return {
      ...pattern,
      message: error.message || pattern.message,
      context: { ...pattern.context, ...context, timestamp: new Date().toISOString() },
      stack: error.stack,
      cause: error
    };
  }

  private createErrorResponse(errorDetails: ErrorDetails): ErrorResponse {
    return {
      success: false,
      error: {
        code: errorDetails.code,
        message: errorDetails.message,
        category: errorDetails.category,
        severity: errorDetails.severity,
        requestId: errorDetails.context.requestId || 'unknown',
        timestamp: errorDetails.context.timestamp || new Date().toISOString(),
        suggestions: errorDetails.suggestions
      },
      metadata: {
        retryable: errorDetails.retryable,
        retryAfter: errorDetails.retryAfter,
        endpoint: errorDetails.context.endpoint,
        method: errorDetails.context.method
      }
    };
  }

  private logError(errorDetails: ErrorDetails): void {
    const logLevel = this.getLogLevel(errorDetails.severity);

    structuredLogger[logLevel]('Error handled by centralized error handler', {
      code: errorDetails.code,
      message: errorDetails.message,
      category: errorDetails.category,
      severity: errorDetails.severity,
      requestId: errorDetails.context.requestId,
      userId: errorDetails.context.userId,
      organizationId: errorDetails.context.organizationId,
      endpoint: errorDetails.context.endpoint,
      method: errorDetails.context.method,
      retryable: errorDetails.retryable,
      retryAfter: errorDetails.retryAfter,
      stack: errorDetails.stack,
      metadata: errorDetails.context.metadata
    });
  }

  private getLogLevel(severity: ErrorSeverity): 'info' | 'warn' | 'error' {
    switch (severity) {
      case ErrorSeverity.LOW:
        return 'info';
      case ErrorSeverity.MEDIUM:
        return 'warn';
      case ErrorSeverity.HIGH:
      case ErrorSeverity.CRITICAL:
        return 'error';
      default:
        return 'error';
    }
  }

  private recordErrorMetrics(errorDetails: ErrorDetails): void {
    // Incrementar contador de errores por categoría
    metrics.errorCounter.inc({
      category: errorDetails.category,
      severity: errorDetails.severity,
      organization_id: errorDetails.context.organizationId || 'unknown'
    });

    // Registrar tiempo de respuesta si está disponible
    if (errorDetails.context.metadata?.responseTime) {
      metrics.errorResponseTime.observe({
        category: errorDetails.category,
        severity: errorDetails.severity
      }, errorDetails.context.metadata.responseTime);
    }
  }

  private updateCircuitBreaker(errorDetails: ErrorDetails): void {
    const serviceKey = this.getServiceKey(errorDetails);
    const circuitBreaker = this.circuitBreakers.get(serviceKey);

    if (!circuitBreaker) return;

    if (errorDetails.severity === ErrorSeverity.HIGH || errorDetails.severity === ErrorSeverity.CRITICAL) {
      circuitBreaker.failureCount++;
      circuitBreaker.lastFailureTime = Date.now();

      if (circuitBreaker.failureCount >= circuitBreaker.failureThreshold) {
        circuitBreaker.state = 'OPEN';
        structuredLogger.warn('Circuit breaker opened', {
          service: serviceKey,
          failureCount: circuitBreaker.failureCount,
          threshold: circuitBreaker.failureThreshold
        });
      }
    }
  }

  private getServiceKey(errorDetails: ErrorDetails): string {
    switch (errorDetails.category) {
      case ErrorCategory.DATABASE:
        return 'database';
      case ErrorCategory.EXTERNAL_API:
        return 'external_api';
      default:
        return 'default';
    }
  }

  /**
   * Verifica si un servicio está disponible (circuit breaker)
   */
  public isServiceAvailable(serviceKey: string): boolean {
    const circuitBreaker = this.circuitBreakers.get(serviceKey);
    if (!circuitBreaker) return true;

    if (circuitBreaker.state === 'OPEN') {
      const timeSinceLastFailure = Date.now() - circuitBreaker.lastFailureTime;
      if (timeSinceLastFailure > circuitBreaker.recoveryTimeout) {
        circuitBreaker.state = 'HALF_OPEN';
        circuitBreaker.failureCount = 0;
        structuredLogger.info('Circuit breaker moved to half-open', { service: serviceKey });
        return true;
      }
      return false;
    }

    return true;
  }

  /**
   * Registra un éxito para el circuit breaker
   */
  public recordSuccess(serviceKey: string): void {
    const circuitBreaker = this.circuitBreakers.get(serviceKey);
    if (!circuitBreaker) return;

    if (circuitBreaker.state === 'HALF_OPEN') {
      circuitBreaker.state = 'CLOSED';
      circuitBreaker.failureCount = 0;
      structuredLogger.info('Circuit breaker closed after successful operation', { service: serviceKey });
    }
  }

  /**
   * Obtiene estadísticas de errores
   */
  public getErrorStats(): {
    totalErrors: number;
    errorsByCategory: Record<string, number>;
    errorsBySeverity: Record<string, number>;
    circuitBreakerStates: Record<string, string>;
  } {
    const errorsByCategory: Record<string, number> = {};
    const errorsBySeverity: Record<string, number> = {};
    const circuitBreakerStates: Record<string, string> = {};

    // En un sistema real, esto vendría de las métricas
    for (const [key, circuitBreaker] of this.circuitBreakers) {
      circuitBreakerStates[key] = circuitBreaker.state;
    }

    return {
      totalErrors: 0, // Se obtendría de las métricas
      errorsByCategory,
      errorsBySeverity,
      circuitBreakerStates
    };
  }
}

// Interfaces para retry strategies y circuit breakers
interface RetryStrategy {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitter: boolean;
}

interface CircuitBreaker {
  failureThreshold: number;
  recoveryTimeout: number;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failureCount: number;
  lastFailureTime: number;
}

export const errorHandlerService = ErrorHandlerService.getInstance();
