class StructuredLogger {
    logLevel = process.env.LOG_LEVEL || 'info';
    serviceName = 'api-express';
    version = process.env.npm_package_version || '1.0.0';
    shouldLog(level) {
        const levels = ['error', 'warn', 'info', 'debug'];
        return levels.indexOf(level) <= levels.indexOf(this.logLevel);
    }
    generateTraceId() {
        return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generateSpanId() {
        return `span_${Math.random().toString(36).substr(2, 9)}`;
    }
    formatLog(level, message, context) {
        const allowedLevels = ['error', 'warn', 'info', 'debug'];
        const lvl = (typeof level === 'string' && allowedLevels.includes(level)) ? level : 'info';
        const logEntry = {
            timestamp: new Date().toISOString(),
            level: lvl,
            message,
            context,
            traceId: context?.requestId || this.generateTraceId(),
            spanId: this.generateSpanId()
        };
        return logEntry;
    }
    outputLog(logEntry) {
        const output = {
            ...logEntry,
            service: this.serviceName,
            version: this.version,
            environment: process.env.NODE_ENV || 'development'
        };
        if (process.env.NODE_ENV === 'development') {
            const color = {
                error: '\x1b[31m',
                warn: '\x1b[33m',
                info: '\x1b[36m',
                debug: '\x1b[35m'
            }[logEntry.level] || '\x1b[0m';
            console.log(`${color}[${logEntry.timestamp}] ${logEntry.level.toUpperCase()}: ${logEntry.message}\x1b[0m`);
            if (logEntry.context) {
                console.log(`${color}  Context: ${JSON.stringify(logEntry.context, null, 2)}\x1b[0m`);
            }
        }
        else {
            console.log(JSON.stringify(output));
        }
    }
    error(message, context) {
        if (this.shouldLog('error')) {
            const logEntry = this.formatLog('error', message, context);
            this.outputLog(logEntry);
        }
    }
    warn(message, context) {
        if (this.shouldLog('warn')) {
            const logEntry = this.formatLog('warn', message, context);
            this.outputLog(logEntry);
        }
    }
    info(message, context) {
        if (this.shouldLog('info')) {
            const logEntry = this.formatLog('info', message, context);
            this.outputLog(logEntry);
        }
    }
    debug(message, context) {
        if (this.shouldLog('debug')) {
            const logEntry = this.formatLog('debug', message, context);
            this.outputLog(logEntry);
        }
    }
    request(method, path, statusCode, duration, context) {
        const level = statusCode >= 400 ? 'error' : statusCode >= 300 ? 'warn' : 'info';
        const message = `${method} ${path} - ${statusCode} (${duration}ms)`;
        this[level](message, {
            ...context,
            method,
            endpoint: path,
            statusCode,
            duration
        });
    }
    aiRequest(model, provider, tokens, cost, duration, context) {
        this.info(`AI Request: ${model} (${provider}) | Tokens: ${tokens} | Cost: €${cost.toFixed(4)} | Duration: ${duration}ms`, {
            ...context,
            tokens,
            cost,
            duration,
            aiModel: model,
            aiProvider: provider
        });
    }
    aiError(error, model, context) {
        this.error(`AI Error: ${error} | Model: ${model}`, {
            ...context,
            aiModel: model,
            error
        });
    }
    budgetWarning(org, current, limit, context) {
        const percentage = (current / limit) * 100;
        this.warn(`Budget Warning: ${org} | Current: €${current.toFixed(2)} | Limit: €${limit.toFixed(2)} | Usage: ${percentage.toFixed(1)}%`, {
            ...context,
            org,
            current,
            limit,
            percentage
        });
    }
    healthCheck(service, status, duration, context) {
        const level = status === 'ok' ? 'info' : 'error';
        this[level](`Health Check: ${service} - ${status} (${duration}ms)`, {
            ...context,
            service,
            status,
            duration
        });
    }
    metric(name, value, labels, context) {
        this.debug(`Metric: ${name} = ${value}`, {
            ...context,
            metricName: name,
            metricValue: value,
            metricLabels: labels
        });
    }
    trace(operation, duration, context) {
        this.debug(`Trace: ${operation} - ${duration}ms`, {
            ...context,
            operation,
            duration
        });
    }
    setLogLevel(level) {
        this.logLevel = level;
        this.info(`Log level changed to: ${level}`);
    }
    getStats() {
        return {
            service: this.serviceName,
            version: this.version,
            logLevel: this.logLevel,
            environment: process.env.NODE_ENV || 'development'
        };
    }
    getLogs() {
        return [];
    }
}
export const logger = new StructuredLogger();
//# sourceMappingURL=logger.js.map