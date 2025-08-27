import pino from 'pino';
class EcoNeuraLogger {
    logger;
    constructor() {
        this.logger = pino({
            level: process.env.LOG_LEVEL || 'info',
            formatters: {
                level: (label) => ({ level: label }),
                log: (object) => ({
                    ts: new Date().toISOString(),
                    ...object,
                }),
            },
            redact: {
                paths: ['password', 'api_key', 'secret', 'token', 'authorization'],
                censor: '[REDACTED]',
            },
            serializers: {
                err: pino.stdSerializers.err,
                error: pino.stdSerializers.err,
            },
        });
    }
    info(msg, context) {
        this.logger.info(context, msg);
    }
    warn(msg, context) {
        this.logger.warn(context, msg);
    }
    error(msg, error, context) {
        this.logger.error({ err: error, ...context }, msg);
    }
    debug(msg, context) {
        this.logger.debug(context, msg);
    }
    logAIRequest(msg, data) {
        this.logger.info({
            ...data,
            msg,
            type: 'ai_request',
        });
    }
    logFlowExecution(msg, data) {
        this.logger.info({
            ...data,
            msg,
            type: 'flow_execution',
        });
    }
    logWebhookReceived(msg, data) {
        this.logger.info({
            ...data,
            msg,
            type: 'webhook',
        });
    }
    logAPIRequest(msg, context) {
        this.logger.info({
            ...context,
            msg,
            type: 'api_request',
        });
    }
    logSecurityEvent(msg, context) {
        this.logger.warn({
            ...context,
            msg,
            type: 'security_event',
        });
    }
    logFinOpsEvent(msg, context) {
        this.logger.info({
            ...context,
            msg,
            type: 'finops_event',
        });
    }
    child(context) {
        const childLogger = new EcoNeuraLogger();
        childLogger.logger = this.logger.child(context);
        return childLogger;
    }
}
// Singleton instance
export const logger = new EcoNeuraLogger();
// Request context middleware helper
export function createRequestLogger(corr_id, x_request_id, org_id) {
    return logger.child({
        corr_id,
        x_request_id,
        org_id,
    });
}
// Utility function to extract trace ID from traceparent header
export function extractTraceId(traceparent) {
    if (!traceparent)
        return undefined;
    const match = traceparent.match(/^00-([a-f0-9]{32})-[a-f0-9]{16}-[0-9]{2}$/);
    return match ? match[1] : undefined;
}
// Log formatting for structured data
export function formatLogData(data) {
    const formatted = {};
    for (const [key, value] of Object.entries(data)) {
        if (value === null || value === undefined) {
            continue;
        }
        if (typeof value === 'object' && !Array.isArray(value)) {
            formatted[key] = JSON.stringify(value);
        }
        else {
            formatted[key] = value;
        }
    }
    return formatted;
}
