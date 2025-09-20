import { Router } from 'express';
import { z } from 'zod';
import { warmupSystem } from '../lib/warmup-system.service.js';
import { structuredLogger } from '../lib/structured-logger.js';
const router = Router();
const WarmupConfigSchema = z.object({
    enabled: z.boolean().optional(),
    timeout: z.number().min(1000).max(60000).optional(),
    retries: z.number().min(1).max(10).optional(),
    services: z.array(z.string()).optional(),
    endpoints: z.array(z.string()).optional(),
    cacheWarmup: z.boolean().optional(),
    dbWarmup: z.boolean().optional(),
    aiWarmup: z.boolean().optional(),
});
router.get('/status', async (req, res) => {
    const traceId = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const spanId = `span_${Math.random().toString(36).substr(2, 9)}`;
    try {
        const status = warmupSystem.getWarmupStatus();
        structuredLogger.info('Warmup status requested', {
            traceId,
            spanId,
            status: {
                isWarmingUp: status.isWarmingUp,
                totalDuration: status.totalDuration,
                successRate: status.successRate
            }
        });
        res.json({
            success: true,
            data: {
                isWarmingUp: status.isWarmingUp,
                results: status.results,
                totalDuration: status.totalDuration,
                successRate: status.successRate,
                timestamp: new Date().toISOString(),
                traceId
            }
        });
    }
    catch (error) {
        structuredLogger.error('Failed to get warmup status', {
            error: error instanceof Error ? error.message : String(error),
            traceId,
            spanId
        });
        res.status(500).json({
            success: false,
            error: 'Failed to get warmup status',
            traceId
        });
    }
});
router.post('/start', async (req, res) => {
    const traceId = createTraceId();
    const spanId = createSpanId();
    try {
        structuredLogger.info('Starting system warmup', { traceId, spanId });
        const results = await warmupSystem.startWarmup();
        const status = warmupSystem.getWarmupStatus();
        structuredLogger.info('System warmup completed', {
            traceId,
            spanId,
            resultsCount: results.size,
            successRate: status.successRate
        });
        res.json({
            success: true,
            data: {
                message: 'System warmup completed',
                results: Object.fromEntries(results),
                totalDuration: status.totalDuration,
                successRate: status.successRate,
                timestamp: new Date().toISOString(),
                traceId
            }
        });
    }
    catch (error) {
        structuredLogger.error('Failed to start warmup', {
            error: error instanceof Error ? error.message : String(error),
            traceId,
            spanId
        });
        res.status(500).json({
            success: false,
            error: 'Failed to start warmup',
            traceId
        });
    }
});
router.post('/restart', async (req, res) => {
    const traceId = createTraceId();
    const spanId = createSpanId();
    try {
        structuredLogger.info('Restarting system warmup', { traceId, spanId });
        const results = await warmupSystem.restartWarmup();
        const status = warmupSystem.getWarmupStatus();
        structuredLogger.info('System warmup restarted', {
            traceId,
            spanId,
            resultsCount: results.size,
            successRate: status.successRate
        });
        res.json({
            success: true,
            data: {
                message: 'System warmup restarted',
                results: Object.fromEntries(results),
                totalDuration: status.totalDuration,
                successRate: status.successRate,
                timestamp: new Date().toISOString(),
                traceId
            }
        });
    }
    catch (error) {
        structuredLogger.error('Failed to restart warmup', {
            error: error instanceof Error ? error.message : String(error),
            traceId,
            spanId
        });
        res.status(500).json({
            success: false,
            error: 'Failed to restart warmup',
            traceId
        });
    }
});
router.get('/results', async (req, res) => {
    const traceId = createTraceId();
    const spanId = createSpanId();
    try {
        const status = warmupSystem.getWarmupStatus();
        const analysis = {
            totalServices: Object.keys(status.results).length,
            successfulServices: Object.values(status.results).filter(r => r.status === 'success').length,
            failedServices: Object.values(status.results).filter(r => r.status === 'error').length,
            timeoutServices: Object.values(status.results).filter(r => r.status === 'timeout').length,
            averageDuration: Object.values(status.results).reduce((acc, r) => acc + r.duration, 0) / Object.keys(status.results).length,
            slowestService: Object.values(status.results).reduce((slowest, current) => current.duration > slowest.duration ? current : slowest, { duration: 0, service: 'none' }),
            fastestService: Object.values(status.results).reduce((fastest, current) => current.duration < fastest.duration ? current : fastest, { duration: Infinity, service: 'none' })
        };
        structuredLogger.info('Warmup results analysis', {
            traceId,
            spanId,
            analysis
        });
        res.json({
            success: true,
            data: {
                results: status.results,
                analysis,
                totalDuration: status.totalDuration,
                successRate: status.successRate,
                timestamp: new Date().toISOString(),
                traceId
            }
        });
    }
    catch (error) {
        structuredLogger.error('Failed to get warmup results', {
            error: error instanceof Error ? error.message : String(error),
            traceId,
            spanId
        });
        res.status(500).json({
            success: false,
            error: 'Failed to get warmup results',
            traceId
        });
    }
});
router.get('/health', async (req, res) => {
    const traceId = createTraceId();
    const spanId = createSpanId();
    try {
        const status = warmupSystem.getWarmupStatus();
        const isHealthy = status.successRate >= 80;
        const healthStatus = {
            status: isHealthy ? 'healthy' : 'degraded',
            warmup: {
                isWarmingUp: status.isWarmingUp,
                successRate: status.successRate,
                totalDuration: status.totalDuration,
                lastWarmup: status.totalDuration > 0 ? new Date().toISOString() : null
            },
            services: Object.fromEntries(Object.entries(status.results).map(([service, result]) => [
                service,
                {
                    status: result.status,
                    duration: result.duration,
                    healthy: result.status === 'success'
                }
            ]))
        };
        structuredLogger.info('Warmup health check', {
            traceId,
            spanId,
            healthStatus: healthStatus.status,
            successRate: status.successRate
        });
        res.status(isHealthy ? 200 : 503).json({
            success: true,
            data: healthStatus,
            timestamp: new Date().toISOString(),
            traceId
        });
    }
    catch (error) {
        structuredLogger.error('Warmup health check failed', {
            error: error instanceof Error ? error.message : String(error),
            traceId,
            spanId
        });
        res.status(500).json({
            success: false,
            error: 'Warmup health check failed',
            traceId
        });
    }
});
router.get('/metrics', async (req, res) => {
    const traceId = createTraceId();
    const spanId = createSpanId();
    try {
        const status = warmupSystem.getWarmupStatus();
        const metrics = {
            warmup: {
                totalRuns: 1,
                averageDuration: status.totalDuration,
                successRate: status.successRate,
                isCurrentlyWarming: status.isWarmingUp
            },
            services: Object.fromEntries(Object.entries(status.results).map(([service, result]) => [
                service,
                {
                    duration: result.duration,
                    status: result.status,
                    error: result.error || null,
                    metrics: result.metrics || {}
                }
            ])),
            performance: {
                totalServices: Object.keys(status.results).length,
                successfulServices: Object.values(status.results).filter(r => r.status === 'success').length,
                averageServiceDuration: Object.values(status.results).reduce((acc, r) => acc + r.duration, 0) / Object.keys(status.results).length
            }
        };
        structuredLogger.info('Warmup metrics requested', {
            traceId,
            spanId,
            metricsCount: Object.keys(metrics.services).length
        });
        res.json({
            success: true,
            data: metrics,
            timestamp: new Date().toISOString(),
            traceId
        });
    }
    catch (error) {
        structuredLogger.error('Failed to get warmup metrics', {
            error: error instanceof Error ? error.message : String(error),
            traceId,
            spanId
        });
        res.status(500).json({
            success: false,
            error: 'Failed to get warmup metrics',
            traceId
        });
    }
});
export default router;
//# sourceMappingURL=warmup.js.map