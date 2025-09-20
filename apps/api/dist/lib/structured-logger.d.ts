export interface LogContext {
    userId?: string;
    requestId?: string;
    sessionId?: string;
    organizationId?: string;
    operation?: string;
    duration?: number;
    [key: string]: unknown;
}
export interface LogEntry {
    timestamp: string;
    level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
    message: string;
    context?: LogContext;
    error?: {
        name: string;
        message: string;
        stack?: string;
    };
    metadata?: Record<string, unknown>;
}
export declare class StructuredLogger {
    private static instance;
    private requestId;
    static getInstance(): StructuredLogger;
    setRequestId(requestId: string): void;
    private formatLogEntry;
    debug(message: string, context?: LogContext, metadata?: Record<string, unknown>): void;
    info(message: string, context?: LogContext, metadata?: Record<string, unknown>): void;
    warn(message: string, context?: LogContext, metadata?: Record<string, unknown>): void;
    error(message: string, error?: Error, context?: LogContext, metadata?: Record<string, unknown>): void;
    fatal(message: string, error?: Error, context?: LogContext, metadata?: Record<string, unknown>): void;
    audit(action: string, context: LogContext, metadata?: Record<string, unknown>): void;
    security(event: string, context: LogContext, metadata?: Record<string, unknown>): void;
    performance(operation: string, duration: number, context?: LogContext, metadata?: Record<string, unknown>): void;
    apiCall(method: string, endpoint: string, statusCode: number, duration: number, context?: LogContext): void;
    database(operation: string, table: string, duration: number, context?: LogContext, metadata?: Record<string, unknown>): void;
    cache(operation: string, key: string, hit: boolean, context?: LogContext, metadata?: Record<string, unknown>): void;
    requestStart(method: string, endpoint: string, context?: LogContext): void;
    requestEnd(method: string, endpoint: string, statusCode: number, duration: number, context?: LogContext): void;
    logError(error: Error, context?: LogContext, metadata?: Record<string, unknown>): void;
    userAction(action: string, userId: string, context?: LogContext, metadata?: Record<string, unknown>): void;
    systemEvent(event: string, context?: LogContext, metadata?: Record<string, unknown>): void;
    metric(name: string, value: number, context?: LogContext, metadata?: Record<string, unknown>): void;
    healthCheck(service: string, status: 'healthy' | 'unhealthy' | 'degraded', context?: LogContext, metadata?: Record<string, unknown>): void;
}
export declare const structuredLogger: StructuredLogger;
//# sourceMappingURL=structured-logger.d.ts.map