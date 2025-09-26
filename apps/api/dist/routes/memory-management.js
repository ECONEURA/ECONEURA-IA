import { Router } from 'express';
import { z } from 'zod';

import { memoryManager } from '../lib/memory-manager.service.js';
import { structuredLogger } from '../lib/structured-logger.js';
const router = Router();
const MemoryConfigSchema = z.object({
    enabled: z.boolean().optional(),
    maxMemoryMB: z.number().min(256).max(4096).optional(),
    gcThreshold: z.number().min(128).max(2048).optional(),
    cacheCleanupThreshold: z.number().min(64).max(1024).optional(),
    leakDetectionEnabled: z.boolean().optional(),
    compressionEnabled: z.boolean().optional(),
    heapOptimizationEnabled: z.boolean().optional(),
    monitoringInterval: z.number().min(5000).max(60000).optional(),
    gcInterval: z.number().min(30000).max(300000).optional(),
    cacheCleanupInterval: z.number().min(10000).max(120000).optional(),
    maxCacheAge: z.number().min(60000).max(1800000).optional(),
    compressionThreshold: z.number().min(50).max(500).optional(),
});
const OptimizationTypeSchema = z.enum(['gc', 'cache', 'heap', 'leaks']);
router.get('/status', async (req, res) => {
    const traceId = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const spanId = `span_${Math.random().toString(36).substr(2, 9)}`;
    try {
        const status = memoryManager.getStatus();
        structuredLogger.info('Memory status requested', {
            traceId,
            spanId,
            status: {
                enabled: status.enabled,
                isOptimizing: status.isOptimizing,
                memoryUsage: status.metrics.used,
                leaksCount: status.leaks.length
            }
        });
        res.json({
            success: true,
            data: {
                enabled: status.enabled,
                isOptimizing: status.isOptimizing,
                metrics: status.metrics,
                leaks: status.leaks,
                gcHistory: status.gcHistory,
                config: status.config,
                timestamp: new Date().toISOString(),
                traceId
            }
        });
    }
    catch (error) {
        structuredLogger.error('Failed to get memory status', {
            error: error instanceof Error ? error.message : String(error),
            traceId,
            spanId
        });
        res.status(500).json({
            success: false,
            error: 'Failed to get memory status',
            traceId
        });
    }
});
router.get('/metrics', async (req, res) => {
    const traceId = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const spanId = `span_${Math.random().toString(36).substr(2, 9)}`;
    try {
        const status = memoryManager.getStatus();
        const analysis = {
            memory: {
                usage: status.metrics.used,
                total: status.metrics.total,
                free: status.metrics.free,
                utilization: (status.metrics.used / status.metrics.total) * 100,
                status: status.metrics.used > status.config.maxMemoryMB * 0.9 ? 'critical' :
                    status.metrics.used > status.config.gcThreshold ? 'warning' : 'healthy'
            },
            heap: {
                used: status.metrics.heap.used,
                total: status.metrics.heap.total,
                free: status.metrics.heap.free,
                utilization: (status.metrics.heap.used / status.metrics.heap.total) * 100,
                status: status.metrics.heap.used > status.metrics.heap.total * 0.8 ? 'warning' : 'healthy'
            },
            gc: {
                major: status.metrics.gc.major,
                minor: status.metrics.gc.minor,
                lastGC: status.metrics.gc.lastGC,
                duration: status.metrics.gc.duration,
                frequency: status.gcHistory.length > 0 ?
                    status.gcHistory.reduce((acc, gc) => acc + gc.duration, 0) / status.gcHistory.length : 0
            },
            cache: {
                size: status.metrics.cache.size,
                entries: status.metrics.cache.entries,
                hitRate: status.metrics.cache.hitRate,
                evictions: status.metrics.cache.evictions,
                status: status.metrics.cache.size > status.config.cacheCleanupThreshold ? 'warning' : 'healthy'
            },
            leaks: {
                detected: status.metrics.leaks.detected,
                suspected: status.metrics.leaks.suspected,
                resolved: status.metrics.leaks.resolved,
                active: status.leaks.length,
                status: status.leaks.length > 0 ? 'warning' : 'healthy'
            },
            compression: {
                compressed: status.metrics.compression.compressed,
                savings: status.metrics.compression.savings,
                ratio: status.metrics.compression.ratio,
                status: status.metrics.compression.savings > 0 ? 'active' : 'inactive'
            }
        };
        structuredLogger.info('Memory metrics requested', {
            traceId,
            spanId,
            analysis
        });
        res.json({
            success: true,
            data: {
                metrics: status.metrics,
                analysis,
                timestamp: new Date().toISOString(),
                traceId
            }
        });
    }
    catch (error) {
        structuredLogger.error('Failed to get memory metrics', {
            error: error instanceof Error ? error.message : String(error),
            traceId,
            spanId
        });
        res.status(500).json({
            success: false,
            error: 'Failed to get memory metrics',
            traceId
        });
    }
});
router.post('/optimize', async (req, res) => {
    const traceId = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const spanId = `span_${Math.random().toString(36).substr(2, 9)}`;
    try {
        const { type } = req.body;
        if (type && !OptimizationTypeSchema.safeParse(type).success) {
            return res.status(400).json({
                success: false,
                error: 'Invalid optimization type',
                validTypes: ['gc', 'cache', 'heap', 'leaks'],
                traceId
            });
        }
        structuredLogger.info('Manual memory optimization requested', {
            traceId,
            spanId,
            type: type || 'all'
        });
        const startTime = Date.now();
        await memoryManager.forceOptimization(type);
        const duration = Date.now() - startTime;
        const status = memoryManager.getStatus();
        structuredLogger.info('Manual memory optimization completed', {
            traceId,
            spanId,
            type: type || 'all',
            duration,
            memoryAfter: status.metrics.used
        });
        res.json({
            success: true,
            data: {
                type: type || 'all',
                duration,
                memoryBefore: status.metrics.used,
                memoryAfter: status.metrics.used,
                metrics: status.metrics,
                timestamp: new Date().toISOString(),
                traceId
            }
        });
    }
    catch (error) {
        structuredLogger.error('Failed to perform manual memory optimization', {
            error: error instanceof Error ? error.message : String(error),
            traceId,
            spanId
        });
        res.status(500).json({
            success: false,
            error: 'Failed to perform manual memory optimization',
            traceId
        });
    }
});
router.put('/config', async (req, res) => {
    const traceId = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const spanId = `span_${Math.random().toString(36).substr(2, 9)}`;
    try {
        const configData = MemoryConfigSchema.parse(req.body);
        structuredLogger.info('Memory config update requested', {
            traceId,
            spanId,
            config: configData
        });
        memoryManager.updateConfig(configData);
        const newStatus = memoryManager.getStatus();
        structuredLogger.info('Memory config updated', {
            traceId,
            spanId,
            newConfig: newStatus.config
        });
        res.json({
            success: true,
            data: {
                config: newStatus.config,
                message: 'Configuration updated successfully',
                timestamp: new Date().toISOString(),
                traceId
            }
        });
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Invalid configuration data',
                details: error.errors,
                traceId
            });
        }
        structuredLogger.error('Failed to update memory config', {
            error: error instanceof Error ? error.message : String(error),
            traceId,
            spanId
        });
        res.status(500).json({
            success: false,
            error: 'Failed to update memory config',
            traceId
        });
    }
});
router.get('/leaks', async (req, res) => {
    const traceId = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const spanId = `span_${Math.random().toString(36).substr(2, 9)}`;
    try {
        const { type, severity } = req.query;
        const status = memoryManager.getStatus();
        let leaks = status.leaks;
        if (type && typeof type === 'string') {
            leaks = leaks.filter(leak => leak.type === type);
        }
        if (severity && typeof severity === 'string') {
            const sizeThreshold = severity === 'high' ? 100 : severity === 'medium' ? 50 : 10;
            leaks = leaks.filter(leak => leak.size > sizeThreshold);
        }
        const stats = {
            total: status.leaks.length,
            byType: status.leaks.reduce((acc, leak) => {
                acc[leak.type] = (acc[leak.type] || 0) + 1;
                return acc;
            }, {}),
            bySeverity: {
                high: status.leaks.filter(leak => leak.size > 100).length,
                medium: status.leaks.filter(leak => leak.size > 50 && leak.size <= 100).length,
                low: status.leaks.filter(leak => leak.size <= 50).length
            },
            totalSize: status.leaks.reduce((acc, leak) => acc + leak.size, 0),
            averageAge: status.leaks.length > 0 ?
                status.leaks.reduce((acc, leak) => acc + (Date.now() - leak.firstDetected), 0) / status.leaks.length : 0
        };
        structuredLogger.info('Memory leaks requested', {
            traceId,
            spanId,
            filters: { type, severity },
            stats
        });
        res.json({
            success: true,
            data: {
                leaks,
                stats,
                filters: { type, severity },
                timestamp: new Date().toISOString(),
                traceId
            }
        });
    }
    catch (error) {
        structuredLogger.error('Failed to get memory leaks', {
            error: error instanceof Error ? error.message : String(error),
            traceId,
            spanId
        });
        res.status(500).json({
            success: false,
            error: 'Failed to get memory leaks',
            traceId
        });
    }
});
router.get('/gc-history', async (req, res) => {
    const traceId = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const spanId = `span_${Math.random().toString(36).substr(2, 9)}`;
    try {
        const { limit = 50, type } = req.query;
        const status = memoryManager.getStatus();
        let gcHistory = status.gcHistory;
        if (type && typeof type === 'string') {
            gcHistory = gcHistory.filter(gc => gc.type === type);
        }
        const limitNum = parseInt(limit, 10);
        gcHistory = gcHistory.slice(-limitNum);
        const stats = {
            total: status.gcHistory.length,
            byType: status.gcHistory.reduce((acc, gc) => {
                acc[gc.type] = (acc[gc.type] || 0) + 1;
                return acc;
            }, {}),
            averageDuration: status.gcHistory.length > 0 ?
                status.gcHistory.reduce((acc, gc) => acc + gc.duration, 0) / status.gcHistory.length : 0,
            totalFreed: status.gcHistory.reduce((acc, gc) => acc + gc.freed, 0),
            averageFreed: status.gcHistory.length > 0 ?
                status.gcHistory.reduce((acc, gc) => acc + gc.freed, 0) / status.gcHistory.length : 0
        };
        structuredLogger.info('GC history requested', {
            traceId,
            spanId,
            filters: { limit, type },
            stats
        });
        res.json({
            success: true,
            data: {
                gcHistory,
                stats,
                filters: { limit, type },
                timestamp: new Date().toISOString(),
                traceId
            }
        });
    }
    catch (error) {
        structuredLogger.error('Failed to get GC history', {
            error: error instanceof Error ? error.message : String(error),
            traceId,
            spanId
        });
        res.status(500).json({
            success: false,
            error: 'Failed to get GC history',
            traceId
        });
    }
});
router.get('/health', async (req, res) => {
    const traceId = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const spanId = `span_${Math.random().toString(36).substr(2, 9)}`;
    try {
        const status = memoryManager.getStatus();
        const healthChecks = {
            memory: status.metrics.used <= status.config.maxMemoryMB * 0.9,
            heap: status.metrics.heap.used <= status.metrics.heap.total * 0.8,
            cache: status.metrics.cache.size <= status.config.cacheCleanupThreshold,
            leaks: status.leaks.length === 0,
            gc: status.metrics.gc.lastGC > Date.now() - 300000
        };
        const isHealthy = Object.values(healthChecks).every(check => check);
        const healthStatus = isHealthy ? 'healthy' : 'degraded';
        structuredLogger.info('Memory health check', {
            traceId,
            spanId,
            healthStatus,
            healthChecks
        });
        res.status(isHealthy ? 200 : 503).json({
            success: true,
            data: {
                status: healthStatus,
                checks: healthChecks,
                metrics: status.metrics,
                isOptimizing: status.isOptimizing,
                timestamp: new Date().toISOString(),
                traceId
            }
        });
    }
    catch (error) {
        structuredLogger.error('Memory health check failed', {
            error: error instanceof Error ? error.message : String(error),
            traceId,
            spanId
        });
        res.status(500).json({
            success: false,
            error: 'Memory health check failed',
            traceId
        });
    }
});
router.get('/recommendations', async (req, res) => {
    const traceId = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const spanId = `span_${Math.random().toString(36).substr(2, 9)}`;
    try {
        const status = memoryManager.getStatus();
        const recommendations = [];
        if (status.metrics.used > status.config.maxMemoryMB * 0.8) {
            recommendations.push({
                type: 'memory',
                priority: 'high',
                title: 'High Memory Usage',
                description: 'Memory usage is above 80% of maximum. Consider increasing memory limit or optimizing memory usage.',
                action: 'Increase maxMemoryMB or perform garbage collection',
                impact: 'high'
            });
        }
        if (status.metrics.heap.used > status.metrics.heap.total * 0.7) {
            recommendations.push({
                type: 'heap',
                priority: 'medium',
                title: 'High Heap Usage',
                description: 'Heap usage is above 70%. Consider heap optimization.',
                action: 'Enable heap optimization',
                impact: 'medium'
            });
        }
        if (status.metrics.cache.size > status.config.cacheCleanupThreshold * 0.8) {
            recommendations.push({
                type: 'cache',
                priority: 'medium',
                title: 'Large Cache Size',
                description: 'Cache size is approaching cleanup threshold.',
                action: 'Enable cache cleanup or increase threshold',
                impact: 'medium'
            });
        }
        if (status.leaks.length > 0) {
            recommendations.push({
                type: 'leaks',
                priority: 'high',
                title: 'Memory Leaks Detected',
                description: `${status.leaks.length} memory leaks detected.`,
                action: 'Resolve memory leaks',
                impact: 'high'
            });
        }
        if (status.metrics.gc.lastGC < Date.now() - 300000) {
            recommendations.push({
                type: 'gc',
                priority: 'low',
                title: 'Garbage Collection Needed',
                description: 'No garbage collection performed in the last 5 minutes.',
                action: 'Perform garbage collection',
                impact: 'low'
            });
        }
        structuredLogger.info('Memory recommendations requested', {
            traceId,
            spanId,
            recommendationsCount: recommendations.length
        });
        res.json({
            success: true,
            data: {
                recommendations,
                count: recommendations.length,
                timestamp: new Date().toISOString(),
                traceId
            }
        });
    }
    catch (error) {
        structuredLogger.error('Failed to get memory recommendations', {
            error: error instanceof Error ? error.message : String(error),
            traceId,
            spanId
        });
        res.status(500).json({
            success: false,
            error: 'Failed to get memory recommendations',
            traceId
        });
    }
});
export default router;
//# sourceMappingURL=memory-management.js.map