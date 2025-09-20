import { logger } from './logger.js';
export class StructuredLogger {
    static instance;
    requestId = '';
    static getInstance() {
        if (!StructuredLogger.instance) {
            StructuredLogger.instance = new StructuredLogger();
        }
        return StructuredLogger.instance;
    }
    setRequestId(requestId) {
        this.requestId = requestId;
    }
    formatLogEntry(level, message, context, error, metadata) {
        const entry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            context: {
                ...context,
                requestId: context?.requestId || this.requestId
            }
        };
        if (error) {
            entry.error = {
                name: error.name,
                message: error.message,
                stack: error.stack
            };
        }
        if (metadata) {
            entry.metadata = metadata;
        }
        return entry;
    }
    debug(message, context, metadata) {
        const entry = this.formatLogEntry('debug', message, context, undefined, metadata);
        logger.debug(JSON.stringify(entry));
    }
    info(message, context, metadata) {
        const entry = this.formatLogEntry('info', message, context, undefined, metadata);
        logger.info(JSON.stringify(entry));
    }
    warn(message, context, metadata) {
        const entry = this.formatLogEntry('warn', message, context, undefined, metadata);
        logger.warn(JSON.stringify(entry));
    }
    error(message, error, context, metadata) {
        const entry = this.formatLogEntry('error', message, context, error, metadata);
        logger.error(JSON.stringify(entry));
    }
    fatal(message, error, context, metadata) {
        const entry = this.formatLogEntry('fatal', message, context, error, metadata);
        logger.error(JSON.stringify(entry));
    }
    audit(action, context, metadata) {
        this.info(`AUDIT: ${action}`, { ...context, operation: 'audit' }, metadata);
    }
    security(event, context, metadata) {
        this.warn(`SECURITY: ${event}`, { ...context, operation: 'security' }, metadata);
    }
    performance(operation, duration, context, metadata) {
        this.info(`PERFORMANCE: ${operation}`, { ...context, operation, duration }, metadata);
    }
    apiCall(method, endpoint, statusCode, duration, context) {
        const level = statusCode >= 400 ? 'warn' : 'info';
        const message = `API: ${method} ${endpoint} - ${statusCode}`;
        this[level](message, { ...context, operation: 'api_call' }, {
            method,
            endpoint,
            statusCode,
            duration
        });
    }
    database(operation, table, duration, context, metadata) {
        this.info(`DATABASE: ${operation} on ${table}`, { ...context, operation: 'database' }, {
            table,
            duration,
            ...metadata
        });
    }
    cache(operation, key, hit, context, metadata) {
        this.debug(`CACHE: ${operation} ${key} - ${hit ? 'HIT' : 'MISS'}`, { ...context, operation: 'cache' }, {
            key,
            hit,
            ...metadata
        });
    }
    requestStart(method, endpoint, context) {
        this.info(`REQUEST START: ${method} ${endpoint}`, { ...context, operation: 'request_start' });
    }
    requestEnd(method, endpoint, statusCode, duration, context) {
        const level = statusCode >= 400 ? 'warn' : 'info';
        this[level](`REQUEST END: ${method} ${endpoint} - ${statusCode}`, { ...context, operation: 'request_end' }, {
            statusCode,
            duration
        });
    }
    logError(error, context, metadata) {
        this.error(`ERROR: ${error.message}`, error, context, metadata);
    }
    userAction(action, userId, context, metadata) {
        this.info(`USER ACTION: ${action}`, { ...context, userId, operation: 'user_action' }, metadata);
    }
    systemEvent(event, context, metadata) {
        this.info(`SYSTEM EVENT: ${event}`, { ...context, operation: 'system_event' }, metadata);
    }
    metric(name, value, context, metadata) {
        this.info(`METRIC: ${name} = ${value}`, { ...context, operation: 'metric' }, {
            metricName: name,
            metricValue: value,
            ...metadata
        });
    }
    healthCheck(service, status, context, metadata) {
        const level = status === 'healthy' ? 'info' : 'warn';
        this[level](`HEALTH CHECK: ${service} is ${status}`, { ...context, operation: 'health_check' }, {
            service,
            status,
            ...metadata
        });
    }
}
export const structuredLogger = StructuredLogger.getInstance();
//# sourceMappingURL=structured-logger.js.map