export interface LogContext {
    userId?: string;
    organizationId?: string;
    requestId?: string;
    sessionId?: string;
    action?: string;
    resource?: string;
    ip?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
    method?: string;
    statusCode?: number;
    duration?: number;
    category?: 'CRM' | 'ERP' | 'AI' | 'AUTH' | 'WEBHOOK' | 'SYSTEM';
    error?: Error | Record<string, any>;
    performanceMetric?: string;
}
export interface BusinessLogEvent {
    event: string;
    category: 'CRM' | 'ERP' | 'AI' | 'AUTH' | 'WEBHOOK' | 'SYSTEM';
    severity: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
    context: LogContext;
    data?: any;
    error?: Error;
}
export declare class EconeuraLogger {
    private logger;
    private telemetryClient?;
    private environment;
    constructor();
    private setupWinstonLogger;
    private setupApplicationInsights;
    debug(message: string, context?: LogContext): void;
    info(message: string, context?: LogContext): void;
    warn(message: string, context?: LogContext, error?: Error): void;
    error(message: string, error?: Error, context?: LogContext): void;
    critical(message: string, error?: Error, context?: LogContext): void;
    logBusinessEvent(event: BusinessLogEvent): void;
    trackPerformance(name: string, duration: number, context?: LogContext): void;
    trackDependency(type: string, name: string, data: string, duration: number, success: boolean, context?: LogContext): void;
    trackMetric(name: string, value: number, properties?: Record<string, any>): void;
    trackUserActivity(userId: string, activity: string, properties?: Record<string, any>): void;
    logSecurityEvent(event: string, severity: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL', context: LogContext): void;
    private enrichContext;
    private serializeError;
    flush(): Promise<void>;
}
export declare const logger: EconeuraLogger;
export declare const requestLogger: (req: any, res: any, next: any) => void;
export default logger;
//# sourceMappingURL=logger.d.ts.map