export declare enum ErrorCode {
    VALIDATION_ERROR = 1000,
    INVALID_INPUT = 1001,
    MISSING_REQUIRED_FIELD = 1002,
    INVALID_FORMAT = 1003,
    OUT_OF_RANGE = 1004,
    UNAUTHORIZED = 2000,
    INVALID_TOKEN = 2001,
    TOKEN_EXPIRED = 2002,
    INSUFFICIENT_PERMISSIONS = 2003,
    INVALID_CREDENTIALS = 2004,
    FORBIDDEN = 3000,
    ACCESS_DENIED = 3001,
    RESOURCE_NOT_ACCESSIBLE = 3002,
    RATE_LIMIT_EXCEEDED = 3003,
    NOT_FOUND = 4000,
    RESOURCE_NOT_FOUND = 4001,
    USER_NOT_FOUND = 4002,
    ORGANIZATION_NOT_FOUND = 4003,
    SERVICE_NOT_FOUND = 4004,
    CONFLICT = 5000,
    DUPLICATE_RESOURCE = 5001,
    RESOURCE_ALREADY_EXISTS = 5002,
    CONCURRENT_MODIFICATION = 5003,
    INTERNAL_ERROR = 6000,
    DATABASE_ERROR = 6001,
    EXTERNAL_SERVICE_ERROR = 6002,
    TIMEOUT_ERROR = 6003,
    SERVICE_UNAVAILABLE = 6004,
    BUSINESS_RULE_VIOLATION = 7000,
    INSUFFICIENT_FUNDS = 7001,
    QUOTA_EXCEEDED = 7002,
    OPERATION_NOT_ALLOWED = 7003,
    INTEGRATION_ERROR = 8000,
    API_ERROR = 8001,
    WEBHOOK_ERROR = 8002,
    THIRD_PARTY_ERROR = 8003
}
export declare enum ErrorSeverity {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export declare enum ErrorCategory {
    VALIDATION = "validation",
    AUTHENTICATION = "authentication",
    AUTHORIZATION = "authorization",
    RESOURCE = "resource",
    CONFLICT = "conflict",
    SERVER = "server",
    BUSINESS = "business",
    INTEGRATION = "integration"
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
    retryAfter?: number;
    suggestions?: string[];
    documentation?: string;
}
interface RetryPolicy {
    maxRetries: number;
    baseDelay: number;
    maxDelay: number;
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
declare class ErrorManagerService {
    private errorHistory;
    private retryPolicies;
    private errorStats;
    private circuitBreakers;
    constructor();
    private initializeRetryPolicies;
    private initializeErrorStats;
    private startCleanupInterval;
    createError(code: ErrorCode, message: string, context?: Partial<ErrorContext>, cause?: Error): ErrorDetails;
    handleWithRetry<T>(operation: () => Promise<T>, errorCode: ErrorCode, context?: Partial<ErrorContext>): Promise<T>;
    isCircuitOpen(service: string): boolean;
    recordFailure(service: string): void;
    recordSuccess(service: string): void;
    private recordError;
    private getSeverityForCode;
    private getCategoryForCode;
    private isRetryable;
    private getRetryAfter;
    private getSuggestionsForCode;
    private getDocumentationForCode;
    private getLogLevelForSeverity;
    private delay;
    private updateRetrySuccessRate;
    private cleanupErrorHistory;
    private updateErrorStats;
    getErrorStats(): ErrorStats;
    getErrorHistory(limit?: number): ErrorDetails[];
    getCircuitBreakerStatus(): Record<string, any>;
    getRetryPolicies(): Record<ErrorCode, RetryPolicy>;
}
export declare const errorManagerService: ErrorManagerService;
export {};
//# sourceMappingURL=error-manager.service.d.ts.map