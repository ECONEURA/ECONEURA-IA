import { logger } from '../lib/logger.js';
import { metrics } from '../lib/metrics.js';
import { tracing } from '../lib/tracing.js';
export function observabilityMiddleware(req, res, next) {
    req.requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const path = req.path || req.url || '/';
    const traceContext = tracing.startSpan(`HTTP ${req.method} ${path}`);
    req.traceContext = traceContext;
    req.startTime = Date.now();
    res.setHeader('X-Request-ID', req.requestId || 'unknown');
    res.setHeader('X-Trace-ID', traceContext.traceId);
    res.setHeader('X-Span-ID', traceContext.spanId);
    logger.info(`Request started: ${req.method} ${path}`, {
        requestId: req.requestId,
        traceId: traceContext.traceId,
        spanId: traceContext.spanId,
        method: req.method,
        path,
        userAgent: typeof req.get === 'function' ? req.get('User-Agent') : undefined,
        ip: req.ip,
        query: req.query,
        body: req.method !== 'GET' ? req.body : undefined
    });
    tracing.addTag(traceContext.spanId, 'http.method', req.method);
    tracing.addTag(traceContext.spanId, 'http.path', path);
    tracing.addTag(traceContext.spanId, 'http.user_agent', typeof req.get === 'function' ? (req.get('User-Agent') || 'unknown') : 'unknown');
    if (req.ip)
        tracing.addTag(traceContext.spanId, 'http.ip', req.ip);
    const originalSend = res.send.bind(res);
    res.send = function (data) {
        try {
            const duration = Date.now() - (req.startTime || 0);
            const statusCode = res.statusCode || 200;
            try {
                const m = metrics;
                m.recordHttpRequest?.(req.method, path, statusCode, duration);
            }
            catch { }
            try {
                const rl = logger;
                const tc = traceContext;
                const traceId = tc && typeof tc['traceId'] === 'string' ? String(tc['traceId']) : undefined;
                const spanId = tc && typeof tc['spanId'] === 'string' ? String(tc['spanId']) : undefined;
                rl.request?.(req.method, path, statusCode, duration, {
                    requestId: req.requestId,
                    traceId,
                    spanId,
                    userAgent: typeof req.get === 'function' ? req.get('User-Agent') : undefined,
                    ip: req.ip
                });
            }
            catch { }
            try {
                const tc2 = traceContext;
                const spanId2 = tc2 && typeof tc2['spanId'] === 'string' ? String(tc2['spanId']) : undefined;
                if (spanId2)
                    tracing.endSpan?.(spanId2, { 'http.status_code': statusCode, 'duration_ms': duration, 'error': statusCode >= 400 });
            }
            catch { }
            res.setHeader('X-Response-Time', `${duration}ms`);
            res.setHeader('X-Request-Duration', String(duration));
        }
        catch (e) {
        }
        const safeData = (typeof data === 'string' || Buffer.isBuffer(data) || data === undefined) ? data : JSON.stringify(data);
        return originalSend(safeData);
    };
    next();
}
export function errorObservabilityMiddleware(error, req, res, next) {
    const duration = Date.now() - (req.startTime || 0);
    const statusCode = error.status || 500;
    logger.error(`Request failed: ${req.method} ${req.path}`, {
        requestId: req.requestId,
        traceId: req.traceContext?.traceId,
        spanId: req.traceContext?.spanId,
        method: req.method,
        path: req.path,
        statusCode,
        duration,
        error: error.message,
        stack: error.stack,
        userAgent: req.get('User-Agent'),
        ip: req.ip
    });
    metrics.recordHttpRequest(req.method, req.path, statusCode, duration);
    metrics.increment('errors_total', 1, {
        type: 'http_error',
        status: statusCode.toString(),
        path: req.path
    });
    if (req.traceContext) {
        tracing.endSpan(req.traceContext.spanId, {
            'http.status_code': statusCode,
            'duration_ms': duration,
            'error': true,
            'error.message': error.message
        });
    }
    res.setHeader('X-Request-ID', req.requestId || 'unknown');
    res.setHeader('X-Response-Time', `${duration}ms`);
    res.setHeader('X-Request-Duration', duration.toString());
    next(error);
}
export function healthCheckMiddleware(req, res, next) {
    if (req.path.startsWith('/health')) {
        const startTime = Date.now();
        const traceContext = tracing.startSpan(`Health Check ${req.path}`);
        const originalSendHC = res.send.bind(res);
        res.send = function (data) {
            try {
                const duration = Date.now() - startTime;
                const statusCode = res.statusCode || 200;
                try {
                    const m = metrics;
                    if (typeof m.recordHealthCheck === 'function') {
                        m.recordHealthCheck(req.path, statusCode < 400 ? 'ok' : 'error', duration);
                    }
                    else if (typeof m.recordHealthCheckDuration === 'function') {
                        m.recordHealthCheckDuration(req.path, duration);
                    }
                    else if (typeof m.incrementHealthCheck === 'function') {
                        m.incrementHealthCheck(req.path);
                    }
                }
                catch { }
                try {
                    logger.healthCheck(req.path, statusCode < 400 ? 'ok' : 'error', duration, { traceId: traceContext.traceId, spanId: traceContext.spanId });
                }
                catch { }
                try {
                    tracing.endSpan(traceContext.spanId, { 'health.status': statusCode < 400 ? 'ok' : 'error', 'duration_ms': duration });
                }
                catch { }
            }
            catch { }
            return originalSendHC(data);
        };
    }
    next();
}
export function startCleanupScheduler() {
    setInterval(() => {
        try {
            metrics.cleanup();
            tracing.cleanup();
            logger.info('Observability cleanup completed');
        }
        catch (error) {
            logger.error('Observability cleanup failed', { error: error.message });
        }
    }, 5 * 60 * 1000);
}
export function startSystemMetricsScheduler() {
    setInterval(() => {
        try {
            metrics.recordSystemMetrics();
        }
        catch (error) {
            logger.error('System metrics recording failed', { error: error.message });
        }
    }, 30 * 1000);
}
//# sourceMappingURL=observability.js.map