import { Router } from 'express';
import { z } from 'zod';

import { performanceOptimizerService } from '../lib/performance-optimizer.service.js';
import { structuredLogger } from '../lib/structured-logger.js';
const performanceRouter = Router();
const UpdateConfigSchema = z.object({
    memoryThreshold: z.coerce.number().int().positive().optional(),
    cpuThreshold: z.coerce.number().int().min(1).max(100).optional(),
    responseTimeThreshold: z.coerce.number().int().positive().optional(),
    errorRateThreshold: z.coerce.number().int().min(1).max(100).optional(),
    gcThreshold: z.coerce.number().int().positive().optional(),
    cacheSizeLimit: z.coerce.number().int().positive().optional(),
    connectionLimit: z.coerce.number().int().positive().optional(),
    enableLazyLoading: z.boolean().optional(),
    enableServicePooling: z.boolean().optional(),
    enableMemoryOptimization: z.boolean().optional()
});
const UpdateServiceHealthSchema = z.object({
    serviceName: z.string().min(1),
    status: z.enum(['healthy', 'degraded', 'unhealthy']),
    memoryUsage: z.coerce.number().int().min(0),
    responseTime: z.coerce.number().int().min(0),
    errorRate: z.coerce.number().min(0).max(100)
});
performanceRouter.get('/metrics', async (req, res) => {
    try {
        const metrics = performanceOptimizerService.getMetrics();
        res.json({
            success: true,
            data: metrics,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error getting performance metrics', { error });
        res.status(500).json({
            success: false,
            error: 'Failed to get performance metrics'
        });
    }
});
performanceRouter.get('/stats', async (req, res) => {
    try {
        const stats = performanceOptimizerService.getPerformanceStats();
        res.json({
            success: true,
            data: stats,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error getting performance stats', { error });
        res.status(500).json({
            success: false,
            error: 'Failed to get performance stats'
        });
    }
});
performanceRouter.get('/health', async (req, res) => {
    try {
        const health = performanceOptimizerService.getServiceHealth();
        res.json({
            success: true,
            data: {
                services: health,
                total: health.length,
                healthy: health.filter(s => s.status === 'healthy').length,
                degraded: health.filter(s => s.status === 'degraded').length,
                unhealthy: health.filter(s => s.status === 'unhealthy').length
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error getting service health', { error });
        res.status(500).json({
            success: false,
            error: 'Failed to get service health'
        });
    }
});
performanceRouter.get('/optimizations', async (req, res) => {
    try {
        const { limit = 50 } = z.object({
            limit: z.coerce.number().int().positive().max(100).default(50)
        }).parse(req.query);
        const history = performanceOptimizerService.getOptimizationHistory();
        const limitedHistory = history.slice(-limit);
        res.json({
            success: true,
            data: {
                optimizations: limitedHistory,
                total: history.length,
                limit
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error getting optimization history', { error });
        res.status(400).json({
            success: false,
            error: 'Invalid request data',
            details: error.errors
        });
    }
});
performanceRouter.get('/recommendations', async (req, res) => {
    try {
        const recommendations = performanceOptimizerService.getRecommendations();
        res.json({
            success: true,
            data: {
                recommendations,
                count: recommendations.length,
                priority: recommendations.length > 3 ? 'high' : recommendations.length > 1 ? 'medium' : 'low'
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error getting recommendations', { error });
        res.status(500).json({
            success: false,
            error: 'Failed to get recommendations'
        });
    }
});
performanceRouter.put('/config', async (req, res) => {
    try {
        const config = UpdateConfigSchema.parse(req.body);
        performanceOptimizerService.updateConfig(config);
        res.json({
            success: true,
            data: {
                message: 'Configuration updated successfully',
                updatedFields: Object.keys(config)
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error updating performance config', { error });
        res.status(400).json({
            success: false,
            error: 'Invalid request data',
            details: error.errors
        });
    }
});
performanceRouter.post('/health/service', async (req, res) => {
    try {
        const { serviceName, status, memoryUsage, responseTime, errorRate } = UpdateServiceHealthSchema.parse(req.body);
        performanceOptimizerService.updateServiceHealth(serviceName, {
            status,
            memoryUsage,
            responseTime,
            errorRate
        });
        res.json({
            success: true,
            data: {
                message: 'Service health updated successfully',
                service: serviceName,
                status
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error updating service health', { error });
        res.status(400).json({
            success: false,
            error: 'Invalid request data',
            details: error.errors
        });
    }
});
performanceRouter.post('/optimize', async (req, res) => {
    try {
        const { type } = z.object({
            type: z.enum(['memory', 'cache', 'connections', 'all']).default('all')
        }).parse(req.body);
        const beforeMetrics = performanceOptimizerService.getMetrics();
        if (type === 'memory' || type === 'all') {
            if (global.gc) {
                global.gc();
            }
        }
        if (type === 'cache' || type === 'all') {
        }
        if (type === 'connections' || type === 'all') {
        }
        const afterMetrics = performanceOptimizerService.getMetrics();
        res.json({
            success: true,
            data: {
                message: `Optimization completed for type: ${type}`,
                before: beforeMetrics,
                after: afterMetrics,
                improvements: {
                    memory: beforeMetrics.memoryUsage.heapUsed - afterMetrics.memoryUsage.heapUsed,
                    cache: beforeMetrics.cache.size - afterMetrics.cache.size
                }
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error forcing optimization', { error });
        res.status(400).json({
            success: false,
            error: 'Invalid request data',
            details: error.errors
        });
    }
});
performanceRouter.get('/health/check', async (req, res) => {
    try {
        const stats = performanceOptimizerService.getPerformanceStats();
        const overallHealth = stats.health.overall;
        const statusCode = overallHealth === 'healthy' ? 200 :
            overallHealth === 'degraded' ? 200 : 503;
        res.status(statusCode).json({
            success: true,
            data: {
                status: overallHealth,
                metrics: stats.current,
                recommendations: stats.health.recommendations,
                lastOptimization: stats.optimizations.recent[0]?.timestamp || null
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error checking performance health', { error });
        res.status(500).json({
            success: false,
            error: 'Performance health check failed'
        });
    }
});
export { performanceRouter };
//# sourceMappingURL=performance.js.map