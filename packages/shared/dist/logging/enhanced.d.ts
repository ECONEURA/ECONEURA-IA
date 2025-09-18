import { Logger } from 'pino';
import { LogContext } from './index.js';
export interface EnhancedLogContext extends LogContext {
    service?: string;
    version?: string;
    environment?: string;
    startup_phase?: string;
    component?: string;
}
export declare class EnhancedEcoNeuraLogger {
    private logger;
    private service;
    private version;
    private environment;
    constructor(service?: string, version?: string);
    info(msg: string, context?: EnhancedLogContext): void;
    warn(msg: string, context?: EnhancedLogContext): void;
    error(msg: string, error?: Error, context?: EnhancedLogContext): void;
    debug(msg: string, context?: EnhancedLogContext): void;
    logStartup(msg: string, context: {
        phase: string;
        config?: any;
        duration_ms?: number;
    }): void;
    logShutdown(msg: string, context: {
        reason?: string;
        duration_ms?: number;
    }): void;
    logDatabaseConnection(msg: string, context: {
        status: 'connecting' | 'connected' | 'disconnected' | 'error';
        latency_ms?: number;
    }): void;
    logRedisConnection(msg: string, context: {
        status: 'connecting' | 'connected' | 'disconnected' | 'error';
        latency_ms?: number;
    }): void;
    logQueueEvent(msg: string, context: {
        queue_name: string;
        event: 'job_added' | 'job_completed' | 'job_failed' | 'queue_started' | 'queue_stopped';
        job_id?: string;
        duration_ms?: number;
    }): void;
    logEnvValidation(msg: string, context: {
        status: 'success' | 'warning' | 'error';
        missing_vars?: string[];
        warnings?: string[];
    }): void;
    logHealthCheck(msg: string, context: {
        endpoint: string;
        status: 'healthy' | 'unhealthy' | 'degraded';
        latency_ms?: number;
        dependencies?: Record<string, 'up' | 'down'>;
    }): void;
    child(context: EnhancedLogContext): EnhancedEcoNeuraLogger;
    private enrichContext;
    private sanitizeConfig;
    get pinoLogger(): Logger;
}
export declare const apiLogger: EnhancedEcoNeuraLogger;
export declare const workerLogger: EnhancedEcoNeuraLogger;
export declare const webLogger: EnhancedEcoNeuraLogger;
export default EnhancedEcoNeuraLogger;
//# sourceMappingURL=enhanced.d.ts.map