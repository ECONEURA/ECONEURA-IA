import { structuredLogger } from './structured-logger.js';
import { metrics } from '@econeura/shared/src/metrics/index.js';
export var ErrorCategory;
(function (ErrorCategory) {
    ErrorCategory["VALIDATION"] = "validation";
    ErrorCategory["AUTHENTICATION"] = "authentication";
    ErrorCategory["AUTHORIZATION"] = "authorization";
    ErrorCategory["DATABASE"] = "database";
    ErrorCategory["EXTERNAL_API"] = "external_api";
    ErrorCategory["BUSINESS_LOGIC"] = "business_logic";
    ErrorCategory["SYSTEM"] = "system";
    ErrorCategory["NETWORK"] = "network";
    ErrorCategory["TIMEOUT"] = "timeout";
    ErrorCategory["RATE_LIMIT"] = "rate_limit";
})(ErrorCategory || (ErrorCategory = {}));
export var ErrorSeverity;
(function (ErrorSeverity) {
    ErrorSeverity["LOW"] = "low";
    ErrorSeverity["MEDIUM"] = "medium";
    ErrorSeverity["HIGH"] = "high";
    ErrorSeverity["CRITICAL"] = "critical";
})(ErrorSeverity || (ErrorSeverity = {}));
export class ErrorHandlerService {
    static instance;
    errorPatterns = new Map();
    retryStrategies = new Map();
    circuitBreakers = new Map();
    constructor() {
        this.initializeErrorPatterns();
        this.initializeRetryStrategies();
        this.initializeCircuitBreakers();
    }
    static getInstance() {
        if (!ErrorHandlerService.instance) {
            ErrorHandlerService.instance = new ErrorHandlerService();
        }
        return ErrorHandlerService.instance;
    }
    initializeErrorPatterns() {
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
    initializeRetryStrategies() {
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
    initializeCircuitBreakers() {
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
    handleError(error, context = {}) {
        const errorDetails = this.categorizeError(error, context);
        const response = this.createErrorResponse(errorDetails);
        this.logError(errorDetails);
        this.recordErrorMetrics(errorDetails);
        this.updateCircuitBreaker(errorDetails);
        return response;
    }
    categorizeError(error, context) {
        const errorMessage = error.message.toLowerCase();
        const errorName = error.name.toLowerCase();
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
    createErrorDetails(patternKey, error, context) {
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
    createErrorResponse(errorDetails) {
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
    logError(errorDetails) {
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
    getLogLevel(severity) {
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
    recordErrorMetrics(errorDetails) {
        metrics.errorCounter.inc({
            category: errorDetails.category,
            severity: errorDetails.severity,
            organization_id: errorDetails.context.organizationId || 'unknown'
        });
        if (errorDetails.context.metadata?.responseTime) {
            metrics.errorResponseTime.observe({
                category: errorDetails.category,
                severity: errorDetails.severity
            }, errorDetails.context.metadata.responseTime);
        }
    }
    updateCircuitBreaker(errorDetails) {
        const serviceKey = this.getServiceKey(errorDetails);
        const circuitBreaker = this.circuitBreakers.get(serviceKey);
        if (!circuitBreaker)
            return;
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
    getServiceKey(errorDetails) {
        switch (errorDetails.category) {
            case ErrorCategory.DATABASE:
                return 'database';
            case ErrorCategory.EXTERNAL_API:
                return 'external_api';
            default:
                return 'default';
        }
    }
    isServiceAvailable(serviceKey) {
        const circuitBreaker = this.circuitBreakers.get(serviceKey);
        if (!circuitBreaker)
            return true;
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
    recordSuccess(serviceKey) {
        const circuitBreaker = this.circuitBreakers.get(serviceKey);
        if (!circuitBreaker)
            return;
        if (circuitBreaker.state === 'HALF_OPEN') {
            circuitBreaker.state = 'CLOSED';
            circuitBreaker.failureCount = 0;
            structuredLogger.info('Circuit breaker closed after successful operation', { service: serviceKey });
        }
    }
    getErrorStats() {
        const errorsByCategory = {};
        const errorsBySeverity = {};
        const circuitBreakerStates = {};
        for (const [key, circuitBreaker] of this.circuitBreakers) {
            circuitBreakerStates[key] = circuitBreaker.state;
        }
        return {
            totalErrors: 0,
            errorsByCategory,
            errorsBySeverity,
            circuitBreakerStates
        };
    }
}
export const errorHandlerService = ErrorHandlerService.getInstance();
//# sourceMappingURL=error-handler.service.js.map