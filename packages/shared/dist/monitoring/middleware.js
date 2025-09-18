import { httpMetrics, systemMetrics } from './metrics.js';
import { tracingManager } from './tracing.js';
import { logger } from '../logging/index.js';
export function monitorRequest() {
    return (req, res, next) => {
        const startTime = Date.now();
        const route = req.route?.path || 'unknown';
        const method = req.method;
        const span = tracingManager.startSpan('http_request', {
            attributes: {
                'http.method': method,
                'http.route': route,
                'http.url': req.url,
                'http.user_agent': req.get('user-agent') || 'unknown',
            },
        });
        const contentLength = parseInt(req.get('content-length') || '0', 10);
        httpMetrics.requestSizeBytes.observe({ method, route }, contentLength);
        res.on?.('finish', () => {
            const duration = (Date.now() - startTime) / 1000;
            const statusCode = String(res.statusCode ?? 0);
            httpMetrics.requestDuration.observe({ method, route, status_code: statusCode }, duration);
            httpMetrics.requestsTotal.inc({ method, route, status_code: statusCode });
            const cl = res.get?.('content-length');
            const responseLength = typeof cl === 'string' ? parseInt(cl, 10) : 0;
            httpMetrics.responseSizeBytes.observe({ method, route }, responseLength);
            tracingManager.endSpan('http_request', { status: undefined, error: undefined });
            const orgIdVal = req?.org_id;
            logger.logAPIRequest(`${method} ${route} ${statusCode}`, {
                method,
                path: route,
                status_code: Number(statusCode),
                latency_ms: Math.round(duration * 1000),
                org_id: typeof orgIdVal === 'string' ? orgIdVal : undefined,
            });
        });
        next();
    };
}
export function monitorErrors() {
    return (error, req, res, next) => {
        const route = req.route?.path || 'unknown';
        const method = req.method;
        httpMetrics.requestsTotal.inc({
            method,
            route,
            status_code: '500',
        });
        tracingManager.endSpan('http_request', { error });
        logger.error(`${method} ${route} failed`, error, {
            request: {
                url: req.url,
                method: req.method,
                headers: req.headers,
                body: req.body,
            },
        });
        next(error);
    };
}
export function healthCheck() {
    return (req, res) => {
        const memoryUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();
        const uptime = process.uptime();
        Object.entries(memoryUsage).forEach(([type, bytes]) => {
            systemMetrics.memory.set({ type }, bytes);
        });
        systemMetrics.cpuUsage.set((cpuUsage.user + cpuUsage.system) / 1000000);
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime,
            memory: memoryUsage,
            cpu: cpuUsage,
        });
    };
}
//# sourceMappingURL=middleware.js.map