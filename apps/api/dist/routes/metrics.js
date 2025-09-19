import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { rbacMiddleware } from '../middleware/rbac.js';
import { getMetricsData, clearMetrics, startSystemMetricsCollection, stopSystemMetricsCollection } from '../middleware/metrics.js';
import { structuredLogger } from '../lib/structured-logger.js';
const router = Router();
router.get('/', authMiddleware, rbacMiddleware('read:metrics'), async (req, res) => {
    await getMetricsData(req, res);
});
router.get('/system', authMiddleware, rbacMiddleware('read:metrics'), async (req, res) => {
    try {
        const { getMetrics } = await import('../middleware/metrics.js');
        const metrics = await getMetrics();
        const systemMetrics = metrics.filter(metric => metric.name.includes('memory_') ||
            metric.name.includes('uptime_') ||
            metric.name.includes('cpu_'));
        res.json({
            success: true,
            data: {
                metrics: systemMetrics,
                timestamp: new Date().toISOString()
            },
            requestId: req.headers['x-request-id'] || `req_${Date.now()}`,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Failed to get system metrics', {
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        res.status(500).json({
            success: false,
            error: 'Failed to get system metrics',
            requestId: req.headers['x-request-id'] || `req_${Date.now()}`,
            timestamp: new Date().toISOString()
        });
    }
});
router.get('/business', authMiddleware, rbacMiddleware('read:metrics'), async (req, res) => {
    try {
        const { getMetrics } = await import('../middleware/metrics.js');
        const metrics = await getMetrics();
        const businessMetrics = metrics.filter(metric => metric.name.includes('users_') ||
            metric.name.includes('contacts_') ||
            metric.name.includes('deals_') ||
            metric.name.includes('orders_') ||
            metric.name.includes('ai_'));
        res.json({
            success: true,
            data: {
                metrics: businessMetrics,
                timestamp: new Date().toISOString()
            },
            requestId: req.headers['x-request-id'] || `req_${Date.now()}`,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Failed to get business metrics', {
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        res.status(500).json({
            success: false,
            error: 'Failed to get business metrics',
            requestId: req.headers['x-request-id'] || `req_${Date.now()}`,
            timestamp: new Date().toISOString()
        });
    }
});
router.get('/performance', authMiddleware, rbacMiddleware('read:metrics'), async (req, res) => {
    try {
        const { getMetrics } = await import('../middleware/metrics.js');
        const metrics = await getMetrics();
        const performanceMetrics = metrics.filter(metric => metric.name.includes('api_request_duration') ||
            metric.name.includes('api_requests_total') ||
            metric.name.includes('db_queries_total') ||
            metric.name.includes('response_time'));
        res.json({
            success: true,
            data: {
                metrics: performanceMetrics,
                timestamp: new Date().toISOString()
            },
            requestId: req.headers['x-request-id'] || `req_${Date.now()}`,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Failed to get performance metrics', {
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        res.status(500).json({
            success: false,
            error: 'Failed to get performance metrics',
            requestId: req.headers['x-request-id'] || `req_${Date.now()}`,
            timestamp: new Date().toISOString()
        });
    }
});
router.get('/errors', authMiddleware, rbacMiddleware('read:metrics'), async (req, res) => {
    try {
        const { getMetrics } = await import('../middleware/metrics.js');
        const metrics = await getMetrics();
        const errorMetrics = metrics.filter(metric => metric.name.includes('errors_total') ||
            metric.name.includes('failures_total') ||
            metric.name.includes('exceptions_total'));
        res.json({
            success: true,
            data: {
                metrics: errorMetrics,
                timestamp: new Date().toISOString()
            },
            requestId: req.headers['x-request-id'] || `req_${Date.now()}`,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Failed to get error metrics', {
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        res.status(500).json({
            success: false,
            error: 'Failed to get error metrics',
            requestId: req.headers['x-request-id'] || `req_${Date.now()}`,
            timestamp: new Date().toISOString()
        });
    }
});
router.post('/clear', authMiddleware, rbacMiddleware('admin:metrics'), async (req, res) => {
    await clearMetrics(req, res);
});
router.post('/system/start', authMiddleware, rbacMiddleware('admin:metrics'), async (req, res) => {
    try {
        const { interval } = req.body;
        const intervalMs = interval || 30000;
        startSystemMetricsCollection(intervalMs);
        structuredLogger.info('System metrics collection started via API', {
            interval: intervalMs,
            startedBy: req.user?.id || 'admin'
        });
        res.json({
            success: true,
            message: 'System metrics collection started',
            data: {
                interval: intervalMs
            },
            requestId: req.headers['x-request-id'] || `req_${Date.now()}`,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Failed to start system metrics collection', {
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        res.status(500).json({
            success: false,
            error: 'Failed to start system metrics collection',
            requestId: req.headers['x-request-id'] || `req_${Date.now()}`,
            timestamp: new Date().toISOString()
        });
    }
});
router.post('/system/stop', authMiddleware, rbacMiddleware('admin:metrics'), async (req, res) => {
    try {
        stopSystemMetricsCollection();
        structuredLogger.info('System metrics collection stopped via API', {
            stoppedBy: req.user?.id || 'admin'
        });
        res.json({
            success: true,
            message: 'System metrics collection stopped',
            requestId: req.headers['x-request-id'] || `req_${Date.now()}`,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Failed to stop system metrics collection', {
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        res.status(500).json({
            success: false,
            error: 'Failed to stop system metrics collection',
            requestId: req.headers['x-request-id'] || `req_${Date.now()}`,
            timestamp: new Date().toISOString()
        });
    }
});
router.get('/health', async (req, res) => {
    try {
        const { getMetrics } = await import('../middleware/metrics.js');
        const metrics = await getMetrics();
        const isHealthy = metrics.length > 0;
        res.status(isHealthy ? 200 : 503).json({
            success: isHealthy,
            status: isHealthy ? 'healthy' : 'unhealthy',
            data: {
                metricsCount: metrics.length,
                timestamp: new Date().toISOString()
            },
            requestId: req.headers['x-request-id'] || `req_${Date.now()}`,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Metrics health check failed', {
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        res.status(503).json({
            success: false,
            status: 'unhealthy',
            error: 'Metrics service unavailable',
            requestId: req.headers['x-request-id'] || `req_${Date.now()}`,
            timestamp: new Date().toISOString()
        });
    }
});
export default router;
//# sourceMappingURL=metrics.js.map