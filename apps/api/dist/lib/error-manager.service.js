import { structuredLogger } from './structured-logger.js';
export var ErrorCode;
(function (ErrorCode) {
    ErrorCode[ErrorCode["VALIDATION_ERROR"] = 1000] = "VALIDATION_ERROR";
    ErrorCode[ErrorCode["INVALID_INPUT"] = 1001] = "INVALID_INPUT";
    ErrorCode[ErrorCode["MISSING_REQUIRED_FIELD"] = 1002] = "MISSING_REQUIRED_FIELD";
    ErrorCode[ErrorCode["INVALID_FORMAT"] = 1003] = "INVALID_FORMAT";
    ErrorCode[ErrorCode["OUT_OF_RANGE"] = 1004] = "OUT_OF_RANGE";
    ErrorCode[ErrorCode["UNAUTHORIZED"] = 2000] = "UNAUTHORIZED";
    ErrorCode[ErrorCode["INVALID_TOKEN"] = 2001] = "INVALID_TOKEN";
    ErrorCode[ErrorCode["TOKEN_EXPIRED"] = 2002] = "TOKEN_EXPIRED";
    ErrorCode[ErrorCode["INSUFFICIENT_PERMISSIONS"] = 2003] = "INSUFFICIENT_PERMISSIONS";
    ErrorCode[ErrorCode["INVALID_CREDENTIALS"] = 2004] = "INVALID_CREDENTIALS";
    ErrorCode[ErrorCode["FORBIDDEN"] = 3000] = "FORBIDDEN";
    ErrorCode[ErrorCode["ACCESS_DENIED"] = 3001] = "ACCESS_DENIED";
    ErrorCode[ErrorCode["RESOURCE_NOT_ACCESSIBLE"] = 3002] = "RESOURCE_NOT_ACCESSIBLE";
    ErrorCode[ErrorCode["RATE_LIMIT_EXCEEDED"] = 3003] = "RATE_LIMIT_EXCEEDED";
    ErrorCode[ErrorCode["NOT_FOUND"] = 4000] = "NOT_FOUND";
    ErrorCode[ErrorCode["RESOURCE_NOT_FOUND"] = 4001] = "RESOURCE_NOT_FOUND";
    ErrorCode[ErrorCode["USER_NOT_FOUND"] = 4002] = "USER_NOT_FOUND";
    ErrorCode[ErrorCode["ORGANIZATION_NOT_FOUND"] = 4003] = "ORGANIZATION_NOT_FOUND";
    ErrorCode[ErrorCode["SERVICE_NOT_FOUND"] = 4004] = "SERVICE_NOT_FOUND";
    ErrorCode[ErrorCode["CONFLICT"] = 5000] = "CONFLICT";
    ErrorCode[ErrorCode["DUPLICATE_RESOURCE"] = 5001] = "DUPLICATE_RESOURCE";
    ErrorCode[ErrorCode["RESOURCE_ALREADY_EXISTS"] = 5002] = "RESOURCE_ALREADY_EXISTS";
    ErrorCode[ErrorCode["CONCURRENT_MODIFICATION"] = 5003] = "CONCURRENT_MODIFICATION";
    ErrorCode[ErrorCode["INTERNAL_ERROR"] = 6000] = "INTERNAL_ERROR";
    ErrorCode[ErrorCode["DATABASE_ERROR"] = 6001] = "DATABASE_ERROR";
    ErrorCode[ErrorCode["EXTERNAL_SERVICE_ERROR"] = 6002] = "EXTERNAL_SERVICE_ERROR";
    ErrorCode[ErrorCode["TIMEOUT_ERROR"] = 6003] = "TIMEOUT_ERROR";
    ErrorCode[ErrorCode["SERVICE_UNAVAILABLE"] = 6004] = "SERVICE_UNAVAILABLE";
    ErrorCode[ErrorCode["BUSINESS_RULE_VIOLATION"] = 7000] = "BUSINESS_RULE_VIOLATION";
    ErrorCode[ErrorCode["INSUFFICIENT_FUNDS"] = 7001] = "INSUFFICIENT_FUNDS";
    ErrorCode[ErrorCode["QUOTA_EXCEEDED"] = 7002] = "QUOTA_EXCEEDED";
    ErrorCode[ErrorCode["OPERATION_NOT_ALLOWED"] = 7003] = "OPERATION_NOT_ALLOWED";
    ErrorCode[ErrorCode["INTEGRATION_ERROR"] = 8000] = "INTEGRATION_ERROR";
    ErrorCode[ErrorCode["API_ERROR"] = 8001] = "API_ERROR";
    ErrorCode[ErrorCode["WEBHOOK_ERROR"] = 8002] = "WEBHOOK_ERROR";
    ErrorCode[ErrorCode["THIRD_PARTY_ERROR"] = 8003] = "THIRD_PARTY_ERROR";
})(ErrorCode || (ErrorCode = {}));
export var ErrorSeverity;
(function (ErrorSeverity) {
    ErrorSeverity["LOW"] = "low";
    ErrorSeverity["MEDIUM"] = "medium";
    ErrorSeverity["HIGH"] = "high";
    ErrorSeverity["CRITICAL"] = "critical";
})(ErrorSeverity || (ErrorSeverity = {}));
export var ErrorCategory;
(function (ErrorCategory) {
    ErrorCategory["VALIDATION"] = "validation";
    ErrorCategory["AUTHENTICATION"] = "authentication";
    ErrorCategory["AUTHORIZATION"] = "authorization";
    ErrorCategory["RESOURCE"] = "resource";
    ErrorCategory["CONFLICT"] = "conflict";
    ErrorCategory["SERVER"] = "server";
    ErrorCategory["BUSINESS"] = "business";
    ErrorCategory["INTEGRATION"] = "integration";
})(ErrorCategory || (ErrorCategory = {}));
class ErrorManagerService {
    errorHistory = [];
    retryPolicies = new Map();
    errorStats;
    circuitBreakers = new Map();
    constructor() {
        this.initializeRetryPolicies();
        this.initializeErrorStats();
        this.startCleanupInterval();
        structuredLogger.info('Error Manager Service initialized', {
            retryPolicies: this.retryPolicies.size,
            circuitBreakers: this.circuitBreakers.size
        });
    }
    initializeRetryPolicies() {
        this.retryPolicies.set(ErrorCode.EXTERNAL_SERVICE_ERROR, {
            maxRetries: 3,
            baseDelay: 1000,
            maxDelay: 10000,
            backoffMultiplier: 2,
            retryableErrors: [ErrorCode.EXTERNAL_SERVICE_ERROR, ErrorCode.TIMEOUT_ERROR, ErrorCode.SERVICE_UNAVAILABLE]
        });
        this.retryPolicies.set(ErrorCode.DATABASE_ERROR, {
            maxRetries: 2,
            baseDelay: 500,
            maxDelay: 5000,
            backoffMultiplier: 1.5,
            retryableErrors: [ErrorCode.DATABASE_ERROR, ErrorCode.TIMEOUT_ERROR]
        });
        this.retryPolicies.set(ErrorCode.INTEGRATION_ERROR, {
            maxRetries: 2,
            baseDelay: 2000,
            maxDelay: 15000,
            backoffMultiplier: 2,
            retryableErrors: [ErrorCode.INTEGRATION_ERROR, ErrorCode.API_ERROR, ErrorCode.WEBHOOK_ERROR]
        });
        this.retryPolicies.set(ErrorCode.RATE_LIMIT_EXCEEDED, {
            maxRetries: 1,
            baseDelay: 5000,
            maxDelay: 30000,
            backoffMultiplier: 1,
            retryableErrors: [ErrorCode.RATE_LIMIT_EXCEEDED]
        });
    }
    initializeErrorStats() {
        this.errorStats = {
            total: 0,
            byCode: {},
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
    startCleanupInterval() {
        setInterval(() => {
            this.cleanupErrorHistory();
            this.updateErrorStats();
        }, 60 * 60 * 1000);
    }
    createError(code, message, context = {}, cause) {
        const errorDetails = {
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
    async handleWithRetry(operation, errorCode, context = {}) {
        const policy = this.retryPolicies.get(errorCode);
        if (!policy) {
            throw this.createError(errorCode, 'No retry policy found', context);
        }
        let lastError = null;
        for (let attempt = 0; attempt <= policy.maxRetries; attempt++) {
            try {
                const result = await operation();
                if (attempt > 0) {
                    this.updateRetrySuccessRate(true);
                }
                return result;
            }
            catch (error) {
                lastError = this.createError(errorCode, error instanceof Error ? error.message : 'Unknown error', context, error instanceof Error ? error : undefined);
                if (attempt < policy.maxRetries && lastError.retryable) {
                    const delay = Math.min(policy.baseDelay * Math.pow(policy.backoffMultiplier, attempt), policy.maxDelay);
                    await this.delay(delay);
                    continue;
                }
                this.updateRetrySuccessRate(false);
                break;
            }
        }
        throw lastError;
    }
    isCircuitOpen(service) {
        const breaker = this.circuitBreakers.get(service);
        if (!breaker)
            return false;
        if (breaker.state === 'open') {
            if (Date.now() - breaker.lastFailure > breaker.timeout) {
                breaker.state = 'half-open';
                return false;
            }
            return true;
        }
        return false;
    }
    recordFailure(service) {
        let breaker = this.circuitBreakers.get(service);
        if (!breaker) {
            breaker = {
                failures: 0,
                lastFailure: 0,
                state: 'closed',
                threshold: 5,
                timeout: 60000
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
    recordSuccess(service) {
        const breaker = this.circuitBreakers.get(service);
        if (breaker && breaker.state === 'half-open') {
            breaker.state = 'closed';
            breaker.failures = 0;
            structuredLogger.info('Circuit breaker closed', { service });
        }
    }
    recordError(error) {
        this.errorHistory.push(error);
        this.errorStats.total++;
        this.errorStats.byCode[error.code] = (this.errorStats.byCode[error.code] || 0) + 1;
        this.errorStats.bySeverity[error.severity]++;
        this.errorStats.byCategory[error.category]++;
        if (error.context.service) {
            this.errorStats.byService[error.context.service] =
                (this.errorStats.byService[error.context.service] || 0) + 1;
        }
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
    getSeverityForCode(code) {
        if (code >= 1000 && code < 2000)
            return ErrorSeverity.LOW;
        if (code >= 2000 && code < 3000)
            return ErrorSeverity.MEDIUM;
        if (code >= 3000 && code < 4000)
            return ErrorSeverity.MEDIUM;
        if (code >= 4000 && code < 5000)
            return ErrorSeverity.LOW;
        if (code >= 5000 && code < 6000)
            return ErrorSeverity.MEDIUM;
        if (code >= 6000 && code < 7000)
            return ErrorSeverity.HIGH;
        if (code >= 7000 && code < 8000)
            return ErrorSeverity.MEDIUM;
        if (code >= 8000 && code < 9000)
            return ErrorSeverity.HIGH;
        return ErrorSeverity.MEDIUM;
    }
    getCategoryForCode(code) {
        if (code >= 1000 && code < 2000)
            return ErrorCategory.VALIDATION;
        if (code >= 2000 && code < 3000)
            return ErrorCategory.AUTHENTICATION;
        if (code >= 3000 && code < 4000)
            return ErrorCategory.AUTHORIZATION;
        if (code >= 4000 && code < 5000)
            return ErrorCategory.RESOURCE;
        if (code >= 5000 && code < 6000)
            return ErrorCategory.CONFLICT;
        if (code >= 6000 && code < 7000)
            return ErrorCategory.SERVER;
        if (code >= 7000 && code < 8000)
            return ErrorCategory.BUSINESS;
        if (code >= 8000 && code < 9000)
            return ErrorCategory.INTEGRATION;
        return ErrorCategory.SERVER;
    }
    isRetryable(code) {
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
    getRetryAfter(code) {
        if (code === ErrorCode.RATE_LIMIT_EXCEEDED)
            return 60;
        if (code === ErrorCode.SERVICE_UNAVAILABLE)
            return 30;
        if (code === ErrorCode.TIMEOUT_ERROR)
            return 10;
        return undefined;
    }
    getSuggestionsForCode(code) {
        const suggestions = {
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
    getDocumentationForCode(code) {
        const docs = {
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
    getLogLevelForSeverity(severity) {
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
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    updateRetrySuccessRate(success) {
        const currentRate = this.errorStats.retrySuccessRate;
        const newRate = success ?
            Math.min(100, currentRate + 1) :
            Math.max(0, currentRate - 1);
        this.errorStats.retrySuccessRate = newRate;
    }
    cleanupErrorHistory() {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        this.errorHistory = this.errorHistory.filter(error => new Date(error.context.timestamp) > oneDayAgo);
    }
    updateErrorStats() {
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        this.errorStats.lastHour = this.errorHistory.filter(error => new Date(error.context.timestamp) > oneHourAgo).length;
        this.errorStats.last24Hours = this.errorHistory.filter(error => new Date(error.context.timestamp) > oneDayAgo).length;
    }
    getErrorStats() {
        return { ...this.errorStats };
    }
    getErrorHistory(limit = 100) {
        return this.errorHistory.slice(-limit);
    }
    getCircuitBreakerStatus() {
        const status = {};
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
    getRetryPolicies() {
        const policies = {};
        for (const [code, policy] of this.retryPolicies) {
            policies[code] = policy;
        }
        return policies;
    }
}
export const errorManagerService = new ErrorManagerService();
//# sourceMappingURL=error-manager.service.js.map