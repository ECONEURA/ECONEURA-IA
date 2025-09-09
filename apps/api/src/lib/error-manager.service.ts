import { structuredLogger } from './structured-logger.js';

// Error Manager Service - MEJORA 2
// Sistema centralizado de gestión de errores con códigos estandarizados y retry policies

export enum ErrorCode {
  // Errores de validación (1000-1999)
  VALIDATION_ERROR = 1000,
  INVALID_INPUT = 1001,
  MISSING_REQUIRED_FIELD = 1002,
  INVALID_FORMAT = 1003,
  OUT_OF_RANGE = 1004,

  // Errores de autenticación (2000-2999)
  UNAUTHORIZED = 2000,
  INVALID_TOKEN = 2001,
  TOKEN_EXPIRED = 2002,
  INSUFFICIENT_PERMISSIONS = 2003,
  INVALID_CREDENTIALS = 2004,

  // Errores de autorización (3000-3999)
  FORBIDDEN = 3000,
  ACCESS_DENIED = 3001,
  RESOURCE_NOT_ACCESSIBLE = 3002,
  RATE_LIMIT_EXCEEDED = 3003,

  // Errores de recursos (4000-4999)
  NOT_FOUND = 4000,
  RESOURCE_NOT_FOUND = 4001,
  USER_NOT_FOUND = 4002,
  ORGANIZATION_NOT_FOUND = 4003,
  SERVICE_NOT_FOUND = 4004,

  // Errores de conflicto (5000-5999)
  CONFLICT = 5000,
  DUPLICATE_RESOURCE = 5001,
  RESOURCE_ALREADY_EXISTS = 5002,
  CONCURRENT_MODIFICATION = 5003,

  // Errores de servidor (6000-6999)
  INTERNAL_ERROR = 6000,
  DATABASE_ERROR = 6001,
  EXTERNAL_SERVICE_ERROR = 6002,
  TIMEOUT_ERROR = 6003,
  SERVICE_UNAVAILABLE = 6004,

  // Errores de negocio (7000-7999)
  BUSINESS_RULE_VIOLATION = 7000,
  INSUFFICIENT_FUNDS = 7001,
  QUOTA_EXCEEDED = 7002,
  OPERATION_NOT_ALLOWED = 7003,

  // Errores de integración (8000-8999)
  INTEGRATION_ERROR = 8000,
  API_ERROR = 8001,
  WEBHOOK_ERROR = 8002,
  THIRD_PARTY_ERROR = 8003
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ErrorCategory {
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  RESOURCE = 'resource',
  CONFLICT = 'conflict',
  SERVER = 'server',
  BUSINESS = 'business',
  INTEGRATION = 'integration'
}

interface ErrorContext {
  userId?: string;
  organizationId?: string;
  requestId?: string;
  sessionId?: string;
  endpoint?: string;
  method?: string;
  userAgent?: string;
  ip?: string;
  timestamp: string;
  service?: string;
  operation?: string;
  metadata?: Record<string, any>;
}

interface ErrorDetails {
  code: ErrorCode;
  message: string;
  severity: ErrorSeverity;
  category: ErrorCategory;
  context: ErrorContext;
  stack?: string;
  cause?: Error;
  retryable: boolean;
  retryAfter?: number; // seconds
  suggestions?: string[];
  documentation?: string;
}

interface RetryPolicy {
  maxRetries: number;
  baseDelay: number; // ms
  maxDelay: number; // ms
  backoffMultiplier: number;
  retryableErrors: ErrorCode[];
}

interface ErrorStats {
  total: number;
  byCode: Record<ErrorCode, number>;
  bySeverity: Record<ErrorSeverity, number>;
  byCategory: Record<ErrorCategory, number>;
  byService: Record<string, number>;
  last24Hours: number;
  lastHour: number;
  retrySuccessRate: number;
}

class ErrorManagerService {
  private errorHistory: ErrorDetails[] = [];
  private retryPolicies: Map<ErrorCode, RetryPolicy> = new Map();
  private errorStats: ErrorStats;
  private circuitBreakers: Map<string, {
    failures: number;
    lastFailure: number;
    state: 'closed' | 'open' | 'half-open';
    threshold: number;
    timeout: number;
  }> = new Map();

  constructor() {
    this.initializeRetryPolicies();
    this.initializeErrorStats();
    this.startCleanupInterval();

    structuredLogger.info('Error Manager Service initialized', {
      retryPolicies: this.retryPolicies.size,
      circuitBreakers: this.circuitBreakers.size
    });
  }

  private initializeRetryPolicies(): void {
    // Política para errores de red/servicio
    this.retryPolicies.set(ErrorCode.EXTERNAL_SERVICE_ERROR, {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2,
      retryableErrors: [ErrorCode.EXTERNAL_SERVICE_ERROR, ErrorCode.TIMEOUT_ERROR, ErrorCode.SERVICE_UNAVAILABLE]
    });

    // Política para errores de base de datos
    this.retryPolicies.set(ErrorCode.DATABASE_ERROR, {
      maxRetries: 2,
      baseDelay: 500,
      maxDelay: 5000,
      backoffMultiplier: 1.5,
      retryableErrors: [ErrorCode.DATABASE_ERROR, ErrorCode.TIMEOUT_ERROR]
    });

    // Política para errores de integración
    this.retryPolicies.set(ErrorCode.INTEGRATION_ERROR, {
      maxRetries: 2,
      baseDelay: 2000,
      maxDelay: 15000,
      backoffMultiplier: 2,
      retryableErrors: [ErrorCode.INTEGRATION_ERROR, ErrorCode.API_ERROR, ErrorCode.WEBHOOK_ERROR]
    });

    // Política para errores de rate limiting
    this.retryPolicies.set(ErrorCode.RATE_LIMIT_EXCEEDED, {
      maxRetries: 1,
      baseDelay: 5000,
      maxDelay: 30000,
      backoffMultiplier: 1,
      retryableErrors: [ErrorCode.RATE_LIMIT_EXCEEDED]
    });
  }

  private initializeErrorStats(): void {
    this.errorStats = {
      total: 0,
      byCode: {} as Record<ErrorCode, number>,
      bySeverity: {
        [ErrorSeverity.LOW]: 0,
        [ErrorSeverity.MEDIUM]: 0,
        [ErrorSeverity.HIGH]: 0,
        [ErrorSeverity.CRITICAL]: 0
      },
      byCategory: {
        [ErrorCategory.VALIDATION]: 0,
        [ErrorCategory.AUTHENTICATION]: 0,
        [ErrorCategory.AUTHORIZATION]: 0,
        [ErrorCategory.RESOURCE]: 0,
        [ErrorCategory.CONFLICT]: 0,
        [ErrorCategory.SERVER]: 0,
        [ErrorCategory.BUSINESS]: 0,
        [ErrorCategory.INTEGRATION]: 0
      },
      byService: {},
      last24Hours: 0,
      lastHour: 0,
      retrySuccessRate: 0
    };
  }

  private startCleanupInterval(): void {
    // Limpiar historial de errores cada hora
    setInterval(() => {
      this.cleanupErrorHistory();
      this.updateErrorStats();
    }, 60 * 60 * 1000);
  }

  // Método principal para crear errores
  createError(
    code: ErrorCode,
    message: string,
    context: Partial<ErrorContext> = {},
    cause?: Error
  ): ErrorDetails {
    const errorDetails: ErrorDetails = {
      code,
      message,
      severity: this.getSeverityForCode(code),
      category: this.getCategoryForCode(code),
      context: {
        ...context,
        timestamp: new Date().toISOString()
      },
      stack: cause?.stack,
      cause,
      retryable: this.isRetryable(code),
      retryAfter: this.getRetryAfter(code),
      suggestions: this.getSuggestionsForCode(code),
      documentation: this.getDocumentationForCode(code)
    };

    this.recordError(errorDetails);
    return errorDetails;
  }

  // Método para manejar errores con retry automático
  async handleWithRetry<T>(
    operation: () => Promise<T>,
    errorCode: ErrorCode,
    context: Partial<ErrorContext> = {}
  ): Promise<T> {
    const policy = this.retryPolicies.get(errorCode);
    if (!policy) {
      throw this.createError(errorCode, 'No retry policy found', context);
    }

    let lastError: ErrorDetails | null = null;

    for (let attempt = 0; attempt <= policy.maxRetries; attempt++) {
      try {
        const result = await operation();

        // Si es un reintento exitoso, actualizar estadísticas
        if (attempt > 0) {
          this.updateRetrySuccessRate(true);
        }

        return result;
      } catch (error) {
        lastError = this.createError(
          errorCode,
          error instanceof Error ? error.message : 'Unknown error',
          context,
          error instanceof Error ? error : undefined
        );

        // Si no es el último intento y el error es retryable
        if (attempt < policy.maxRetries && lastError.retryable) {
          const delay = Math.min(
            policy.baseDelay * Math.pow(policy.backoffMultiplier, attempt),
            policy.maxDelay
          );

          await this.delay(delay);
          continue;
        }

        // Actualizar estadísticas de fallo
        this.updateRetrySuccessRate(false);
        break;
      }
    }

    throw lastError;
  }

  // Método para verificar circuit breaker
  isCircuitOpen(service: string): boolean {
    const breaker = this.circuitBreakers.get(service);
    if (!breaker) return false;

    if (breaker.state === 'open') {
      // Verificar si ha pasado el timeout
      if (Date.now() - breaker.lastFailure > breaker.timeout) {
        breaker.state = 'half-open';
        return false;
      }
      return true;
    }

    return false;
  }

  // Método para registrar fallo en circuit breaker
  recordFailure(service: string): void {
    let breaker = this.circuitBreakers.get(service);
    if (!breaker) {
      breaker = {
        failures: 0,
        lastFailure: 0,
        state: 'closed',
        threshold: 5,
        timeout: 60000 // 1 minuto
      };
      this.circuitBreakers.set(service, breaker);
    }

    breaker.failures++;
    breaker.lastFailure = Date.now();

    if (breaker.failures >= breaker.threshold) {
      breaker.state = 'open';
      structuredLogger.warn('Circuit breaker opened', {
        service,
        failures: breaker.failures,
        threshold: breaker.threshold
      });
    }
  }

  // Método para registrar éxito en circuit breaker
  recordSuccess(service: string): void {
    const breaker = this.circuitBreakers.get(service);
    if (breaker && breaker.state === 'half-open') {
      breaker.state = 'closed';
      breaker.failures = 0;
      structuredLogger.info('Circuit breaker closed', { service });
    }
  }

  private recordError(error: ErrorDetails): void {
    this.errorHistory.push(error);

    // Actualizar estadísticas
    this.errorStats.total++;
    this.errorStats.byCode[error.code] = (this.errorStats.byCode[error.code] || 0) + 1;
    this.errorStats.bySeverity[error.severity]++;
    this.errorStats.byCategory[error.category]++;

    if (error.context.service) {
      this.errorStats.byService[error.context.service] =
        (this.errorStats.byService[error.context.service] || 0) + 1;
    }

    // Log del error
    const logLevel = this.getLogLevelForSeverity(error.severity);
    structuredLogger[logLevel]('Error recorded', {
      code: error.code,
      message: error.message,
      severity: error.severity,
      category: error.category,
      context: error.context,
      retryable: error.retryable,
      suggestions: error.suggestions
    });
  }

  private getSeverityForCode(code: ErrorCode): ErrorSeverity {
    if (code >= 1000 && code < 2000) return ErrorSeverity.LOW; // Validation
    if (code >= 2000 && code < 3000) return ErrorSeverity.MEDIUM; // Auth
    if (code >= 3000 && code < 4000) return ErrorSeverity.MEDIUM; // Authorization
    if (code >= 4000 && code < 5000) return ErrorSeverity.LOW; // Resource
    if (code >= 5000 && code < 6000) return ErrorSeverity.MEDIUM; // Conflict
    if (code >= 6000 && code < 7000) return ErrorSeverity.HIGH; // Server
    if (code >= 7000 && code < 8000) return ErrorSeverity.MEDIUM; // Business
    if (code >= 8000 && code < 9000) return ErrorSeverity.HIGH; // Integration
    return ErrorSeverity.MEDIUM;
  }

  private getCategoryForCode(code: ErrorCode): ErrorCategory {
    if (code >= 1000 && code < 2000) return ErrorCategory.VALIDATION;
    if (code >= 2000 && code < 3000) return ErrorCategory.AUTHENTICATION;
    if (code >= 3000 && code < 4000) return ErrorCategory.AUTHORIZATION;
    if (code >= 4000 && code < 5000) return ErrorCategory.RESOURCE;
    if (code >= 5000 && code < 6000) return ErrorCategory.CONFLICT;
    if (code >= 6000 && code < 7000) return ErrorCategory.SERVER;
    if (code >= 7000 && code < 8000) return ErrorCategory.BUSINESS;
    if (code >= 8000 && code < 9000) return ErrorCategory.INTEGRATION;
    return ErrorCategory.SERVER;
  }

  private isRetryable(code: ErrorCode): boolean {
    const retryableCodes = [
      ErrorCode.EXTERNAL_SERVICE_ERROR,
      ErrorCode.DATABASE_ERROR,
      ErrorCode.TIMEOUT_ERROR,
      ErrorCode.SERVICE_UNAVAILABLE,
      ErrorCode.RATE_LIMIT_EXCEEDED,
      ErrorCode.INTEGRATION_ERROR,
      ErrorCode.API_ERROR,
      ErrorCode.WEBHOOK_ERROR
    ];
    return retryableCodes.includes(code);
  }

  private getRetryAfter(code: ErrorCode): number | undefined {
    if (code === ErrorCode.RATE_LIMIT_EXCEEDED) return 60; // 1 minuto
    if (code === ErrorCode.SERVICE_UNAVAILABLE) return 30; // 30 segundos
    if (code === ErrorCode.TIMEOUT_ERROR) return 10; // 10 segundos
    return undefined;
  }

  private getSuggestionsForCode(code: ErrorCode): string[] {
    const suggestions: Record<ErrorCode, string[]> = {
      [ErrorCode.VALIDATION_ERROR]: ['Check input format', 'Verify required fields'],
      [ErrorCode.UNAUTHORIZED]: ['Check authentication token', 'Verify credentials'],
      [ErrorCode.FORBIDDEN]: ['Check user permissions', 'Contact administrator'],
      [ErrorCode.NOT_FOUND]: ['Verify resource exists', 'Check resource ID'],
      [ErrorCode.CONFLICT]: ['Check for duplicates', 'Verify resource state'],
      [ErrorCode.INTERNAL_ERROR]: ['Contact support', 'Try again later'],
      [ErrorCode.DATABASE_ERROR]: ['Check database connection', 'Verify query syntax'],
      [ErrorCode.EXTERNAL_SERVICE_ERROR]: ['Check external service status', 'Try again later'],
      [ErrorCode.RATE_LIMIT_EXCEEDED]: ['Wait before retrying', 'Check rate limits'],
      [ErrorCode.BUSINESS_RULE_VIOLATION]: ['Review business rules', 'Check prerequisites']
    };
    return suggestions[code] || ['Contact support'];
  }

  private getDocumentationForCode(code: ErrorCode): string {
    const docs: Record<ErrorCode, string> = {
      [ErrorCode.VALIDATION_ERROR]: '/docs/validation-errors',
      [ErrorCode.UNAUTHORIZED]: '/docs/authentication',
      [ErrorCode.FORBIDDEN]: '/docs/authorization',
      [ErrorCode.NOT_FOUND]: '/docs/resource-errors',
      [ErrorCode.CONFLICT]: '/docs/conflict-resolution',
      [ErrorCode.INTERNAL_ERROR]: '/docs/server-errors',
      [ErrorCode.DATABASE_ERROR]: '/docs/database-errors',
      [ErrorCode.EXTERNAL_SERVICE_ERROR]: '/docs/integration-errors',
      [ErrorCode.RATE_LIMIT_EXCEEDED]: '/docs/rate-limiting',
      [ErrorCode.BUSINESS_RULE_VIOLATION]: '/docs/business-rules'
    };
    return docs[code] || '/docs/error-codes';
  }

  private getLogLevelForSeverity(severity: ErrorSeverity): 'error' | 'warn' | 'info' {
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

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private updateRetrySuccessRate(success: boolean): void {
    // Simulación de actualización de tasa de éxito
    const currentRate = this.errorStats.retrySuccessRate;
    const newRate = success ?
      Math.min(100, currentRate + 1) :
      Math.max(0, currentRate - 1);
    this.errorStats.retrySuccessRate = newRate;
  }

  private cleanupErrorHistory(): void {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    this.errorHistory = this.errorHistory.filter(
      error => new Date(error.context.timestamp) > oneDayAgo
    );
  }

  private updateErrorStats(): void {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    this.errorStats.lastHour = this.errorHistory.filter(
      error => new Date(error.context.timestamp) > oneHourAgo
    ).length;

    this.errorStats.last24Hours = this.errorHistory.filter(
      error => new Date(error.context.timestamp) > oneDayAgo
    ).length;
  }

  // Métodos públicos para consulta
  getErrorStats(): ErrorStats {
    return { ...this.errorStats };
  }

  getErrorHistory(limit: number = 100): ErrorDetails[] {
    return this.errorHistory.slice(-limit);
  }

  getCircuitBreakerStatus(): Record<string, any> {
    const status: Record<string, any> = {};
    for (const [service, breaker] of this.circuitBreakers) {
      status[service] = {
        state: breaker.state,
        failures: breaker.failures,
        threshold: breaker.threshold,
        lastFailure: breaker.lastFailure
      };
    }
    return status;
  }

  getRetryPolicies(): Record<ErrorCode, RetryPolicy> {
    const policies: Record<ErrorCode, RetryPolicy> = {} as any;
    for (const [code, policy] of this.retryPolicies) {
      policies[code] = policy;
    }
    return policies;
  }
}

export const errorManagerService = new ErrorManagerService();
