export declare enum ErrorCategory {
    VALIDATION = "validation",
    AUTHENTICATION = "authentication",
    AUTHORIZATION = "authorization",
    DATABASE = "database",
    EXTERNAL_API = "external_api",
    BUSINESS_LOGIC = "business_logic",
    SYSTEM = "system",
    NETWORK = "network",
    TIMEOUT = "timeout",
    RATE_LIMIT = "rate_limit"
}
export declare enum ErrorSeverity {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
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
export declare class ErrorHandlerService {
    private static instance;
    private errorPatterns;
    private retryStrategies;
    private circuitBreakers;
    private constructor();
    static getInstance(): ErrorHandlerService;
    private initializeErrorPatterns;
    private initializeRetryStrategies;
    private initializeCircuitBreakers;
    handleError(error: Error, context?: ErrorContext): ErrorResponse;
    private categorizeError;
    private createErrorDetails;
    private createErrorResponse;
    private logError;
    private getLogLevel;
    private recordErrorMetrics;
    private updateCircuitBreaker;
    private getServiceKey;
    isServiceAvailable(serviceKey: string): boolean;
    recordSuccess(serviceKey: string): void;
    getErrorStats(): {
        totalErrors: number;
        errorsByCategory: Record<string, number>;
        errorsBySeverity: Record<string, number>;
        circuitBreakerStates: Record<string, string>;
    };
}
export declare const errorHandlerService: ErrorHandlerService;
//# sourceMappingURL=error-handler.service.d.ts.map