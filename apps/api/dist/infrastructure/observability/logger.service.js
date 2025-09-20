import { createLogger, format, transports } from 'winston';
export class LoggerService {
    logger;
    serviceName;
    constructor(serviceName = 'econeura-api') {
        this.serviceName = serviceName;
        this.logger = this.createLogger();
    }
    createLogger() {
        const logFormat = format.combine(format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }), format.errors({ stack: true }), format.json(), format.printf(({ timestamp, level, message, service, ...meta }) => {
            return JSON.stringify({
                timestamp,
                level,
                service: service || this.serviceName,
                message,
                ...meta
            });
        }));
        const consoleFormat = format.combine(format.colorize(), format.timestamp({ format: 'HH:mm:ss.SSS' }), format.printf(({ timestamp, level, message, service, ...meta }) => {
            const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
            return `${timestamp} [${level}] ${service || this.serviceName}: ${message}${metaStr}`;
        }));
        return createLogger({
            level: process.env.LOG_LEVEL || 'info',
            format: logFormat,
            defaultMeta: { service: this.serviceName },
            transports: [
                new transports.Console({
                    format: process.env.NODE_ENV === 'production' ? logFormat : consoleFormat
                }),
                new transports.File({
                    filename: 'logs/error.log',
                    level: 'error',
                    maxsize: 5242880,
                    maxFiles: 5
                }),
                new transports.File({
                    filename: 'logs/combined.log',
                    maxsize: 5242880,
                    maxFiles: 5
                })
            ],
            exceptionHandlers: [
                new transports.File({ filename: 'logs/exceptions.log' })
            ],
            rejectionHandlers: [
                new transports.File({ filename: 'logs/rejections.log' })
            ]
        });
    }
    error(message, context) {
        this.logger.error(message, this.buildLogContext(context));
    }
    warn(message, context) {
        this.logger.warn(message, this.buildLogContext(context));
    }
    info(message, context) {
        this.logger.info(message, this.buildLogContext(context));
    }
    debug(message, context) {
        this.logger.debug(message, this.buildLogContext(context));
    }
    verbose(message, context) {
        this.logger.verbose(message, this.buildLogContext(context));
    }
    logRequest(req, res, duration) {
        const context = {
            requestId: req.headers['x-request-id'],
            userId: req.user?.id,
            organizationId: req.user?.organizationId,
            service: this.serviceName,
            operation: `${req.method} ${req.path}`,
            duration,
            statusCode: res.statusCode,
            metadata: {
                method: req.method,
                url: req.url,
                userAgent: req.headers['user-agent'],
                ip: req.ip,
                body: this.sanitizeBody(req.body),
                query: req.query,
                params: req.params
            }
        };
        if (res.statusCode >= 400) {
            this.error(`Request failed: ${req.method} ${req.path}`, context);
        }
        else {
            this.info(`Request completed: ${req.method} ${req.path}`, context);
        }
    }
    logError(error, context) {
        this.error(error.message, {
            ...context,
            error,
            stack: error.stack
        });
    }
    logPerformance(operation, duration, context) {
        const level = duration > 1000 ? 'warn' : 'info';
        this.logger.log(level, `Performance: ${operation}`, {
            ...this.buildLogContext(context),
            operation,
            duration,
            performance: {
                operation,
                duration,
                threshold: 1000,
                exceeded: duration > 1000
            }
        });
    }
    logSecurity(event, context) {
        this.warn(`Security event: ${event}`, {
            ...context,
            security: {
                event,
                timestamp: new Date().toISOString(),
                severity: 'medium'
            }
        });
    }
    logBusiness(operation, context) {
        this.info(`Business operation: ${operation}`, {
            ...context,
            business: {
                operation,
                timestamp: new Date().toISOString()
            }
        });
    }
    buildLogContext(context) {
        if (!context)
            return {};
        const logContext = {};
        if (context.requestId)
            logContext.requestId = context.requestId;
        if (context.userId)
            logContext.userId = context.userId;
        if (context.organizationId)
            logContext.organizationId = context.organizationId;
        if (context.service)
            logContext.service = context.service;
        if (context.operation)
            logContext.operation = context.operation;
        if (context.duration !== undefined)
            logContext.duration = context.duration;
        if (context.statusCode)
            logContext.statusCode = context.statusCode;
        if (context.error)
            logContext.error = context.error;
        if (context.metadata)
            logContext.metadata = context.metadata;
        return logContext;
    }
    sanitizeBody(body) {
        if (!body)
            return body;
        const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
        const sanitized = { ...body };
        for (const field of sensitiveFields) {
            if (sanitized[field]) {
                sanitized[field] = '[REDACTED]';
            }
        }
        return sanitized;
    }
    child(context) {
        const childLogger = new LoggerService(this.serviceName);
        childLogger.logger = this.logger.child(context);
        return childLogger;
    }
    setLevel(level) {
        this.logger.level = level;
    }
    getLevel() {
        return this.logger.level;
    }
    isLevelEnabled(level) {
        return this.logger.isLevelEnabled(level);
    }
    logMetric(name, value, tags) {
        this.info(`Metric: ${name}`, {
            metric: {
                name,
                value,
                tags: tags || {},
                timestamp: new Date().toISOString()
            }
        });
    }
    logCounter(name, increment = 1, tags) {
        this.info(`Counter: ${name}`, {
            counter: {
                name,
                increment,
                tags: tags || {},
                timestamp: new Date().toISOString()
            }
        });
    }
    logGauge(name, value, tags) {
        this.info(`Gauge: ${name}`, {
            gauge: {
                name,
                value,
                tags: tags || {},
                timestamp: new Date().toISOString()
            }
        });
    }
}
export const logger = new LoggerService();
//# sourceMappingURL=logger.service.js.map