import pino from 'pino';
export class EnhancedEcoNeuraLogger {
    logger;
    service;
    version;
    environment;
    constructor(service = 'unknown', version = '1.0.0') {
        this.service = service;
        this.version = version;
        this.environment = process.env.NODE_ENV || 'development';
        this.logger = pino({
            level: process.env.LOG_LEVEL || 'info',
            formatters: {
                level: (label) => ({ level: label }),
                log: (object) => ({
                    ts: new Date().toISOString(),
                    service: this.service,
                    version: this.version,
                    environment: this.environment,
                    ...object,
                }),
            },
            redact: {
                paths: [
                    'password',
                    'api_key',
                    'secret',
                    'token',
                    'authorization',
                    'jwt_secret',
                    'database_url',
                    'redis_url'
                ],
                censor: '[REDACTED]',
            },
            serializers: {
                err: pino.stdSerializers.err,
                error: pino.stdSerializers.err,
            },
            transport: this.environment === 'development' ? {
                target: 'pino-pretty',
                options: {
                    colorize: true,
                    ignore: 'hostname,pid',
                    translateTime: 'SYS:standard',
                }
            } : undefined,
        });
    }
    info(msg, context) {
        this.logger.info(this.enrichContext(context), msg);
    }
    warn(msg, context) {
        this.logger.warn(this.enrichContext(context), msg);
    }
    error(msg, error, context) {
        this.logger.error({
            err: error,
            ...this.enrichContext(context)
        }, msg);
    }
    debug(msg, context) {
        this.logger.debug(this.enrichContext(context), msg);
    }
    logStartup(msg, context) {
        this.logger.info({
            type: 'service_startup',
            startup_phase: context.phase,
            config: context.config ? this.sanitizeConfig(context.config) : undefined,
            duration_ms: context.duration_ms,
        }, msg);
    }
    logShutdown(msg, context) {
        this.logger.info({
            type: 'service_shutdown',
            reason: context.reason,
            duration_ms: context.duration_ms,
        }, msg);
    }
    logDatabaseConnection(msg, context) {
        this.logger.info({
            type: 'database_connection',
            component: 'database',
            status: context.status,
            latency_ms: context.latency_ms,
        }, msg);
    }
    logRedisConnection(msg, context) {
        this.logger.info({
            type: 'redis_connection',
            component: 'redis',
            status: context.status,
            latency_ms: context.latency_ms,
        }, msg);
    }
    logQueueEvent(msg, context) {
        this.logger.info({
            type: 'queue_event',
            component: 'queue',
            queue_name: context.queue_name,
            event: context.event,
            job_id: context.job_id,
            duration_ms: context.duration_ms,
        }, msg);
    }
    logEnvValidation(msg, context) {
        this.logger.info({
            type: 'env_validation',
            component: 'config',
            status: context.status,
            missing_vars: context.missing_vars,
            warnings: context.warnings,
        }, msg);
    }
    logHealthCheck(msg, context) {
        this.logger.info({
            type: 'health_check',
            component: 'health',
            endpoint: context.endpoint,
            status: context.status,
            latency_ms: context.latency_ms,
            dependencies: context.dependencies,
        }, msg);
    }
    child(context) {
        const childLogger = new EnhancedEcoNeuraLogger(this.service, this.version);
        childLogger.logger = this.logger.child(this.enrichContext(context));
        return childLogger;
    }
    enrichContext(context) {
        return {
            service: this.service,
            version: this.version,
            environment: this.environment,
            ...context,
        };
    }
    sanitizeConfig(config) {
        const sanitized = { ...config };
        const sensitiveKeys = ['password', 'secret', 'key', 'token', 'url'];
        for (const key in sanitized) {
            if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
                sanitized[key] = '[REDACTED]';
            }
        }
        return sanitized;
    }
    get pinoLogger() {
        return this.logger;
    }
}
export const apiLogger = new EnhancedEcoNeuraLogger('api', process.env.npm_package_version || '1.0.0');
export const workerLogger = new EnhancedEcoNeuraLogger('workers', process.env.npm_package_version || '1.0.0');
export const webLogger = new EnhancedEcoNeuraLogger('web', process.env.npm_package_version || '1.0.0');
export default EnhancedEcoNeuraLogger;
//# sourceMappingURL=enhanced.js.map