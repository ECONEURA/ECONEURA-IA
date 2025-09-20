import { Request, Response } from 'express';
export interface LogContext {
    requestId?: string;
    userId?: string;
    organizationId?: string;
    service?: string;
    operation?: string;
    duration?: number;
    statusCode?: number;
    error?: Error;
    metadata?: Record<string, any>;
}
export interface LogLevel {
    ERROR: 'error';
    WARN: 'warn';
    INFO: 'info';
    DEBUG: 'debug';
    VERBOSE: 'verbose';
}
export declare class LoggerService {
    private logger;
    private serviceName;
    constructor(serviceName?: string);
    private createLogger;
    error(message: string, context?: LogContext): void;
    warn(message: string, context?: LogContext): void;
    info(message: string, context?: LogContext): void;
    debug(message: string, context?: LogContext): void;
    verbose(message: string, context?: LogContext): void;
    logRequest(req: Request, res: Response, duration: number): void;
    logError(error: Error, context?: LogContext): void;
    logPerformance(operation: string, duration: number, context?: LogContext): void;
    logSecurity(event: string, context?: LogContext): void;
    logBusiness(operation: string, context?: LogContext): void;
    private buildLogContext;
    private sanitizeBody;
    child(context: LogContext): LoggerService;
    setLevel(level: string): void;
    getLevel(): string;
    isLevelEnabled(level: string): boolean;
    logMetric(name: string, value: number, tags?: Record<string, string>): void;
    logCounter(name: string, increment?: number, tags?: Record<string, string>): void;
    logGauge(name: string, value: number, tags?: Record<string, string>): void;
}
export declare const logger: LoggerService;
//# sourceMappingURL=logger.service.d.ts.map