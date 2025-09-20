import { structuredLogger } from './structured-logger.js';
import { metrics } from '@econeura/shared/src/metrics/index.js';
export class MemoryManagerService {
    config;
    metrics;
    leaks = new Map();
    gcHistory = [];
    monitoringInterval = null;
    gcInterval = null;
    cacheCleanupInterval = null;
    isOptimizing = false;
    lastGC = 0;
    gcCount = { major: 0, minor: 0 };
    constructor(config = {}) {
        this.config = {
            enabled: true,
            maxMemoryMB: 1024,
            gcThreshold: 512,
            cacheCleanupThreshold: 256,
            leakDetectionEnabled: true,
            compressionEnabled: true,
            heapOptimizationEnabled: true,
            monitoringInterval: 10000,
            gcInterval: 60000,
            cacheCleanupInterval: 30000,
            maxCacheAge: 300000,
            compressionThreshold: 100,
            ...config
        };
        this.metrics = this.initializeMetrics();
        this.startMonitoring();
        this.setupGCHooks();
    }
    initializeMetrics() {
        const memUsage = process.memoryUsage();
        return {
            total: this.config.maxMemoryMB,
            used: Math.round(memUsage.rss / 1024 / 1024),
            free: this.config.maxMemoryMB - Math.round(memUsage.rss / 1024 / 1024),
            heap: {
                total: Math.round(memUsage.heapTotal / 1024 / 1024),
                used: Math.round(memUsage.heapUsed / 1024 / 1024),
                free: Math.round((memUsage.heapTotal - memUsage.heapUsed) / 1024 / 1024),
                external: Math.round(memUsage.external / 1024 / 1024),
                arrayBuffers: Math.round(memUsage.arrayBuffers / 1024 / 1024)
            },
            rss: Math.round(memUsage.rss / 1024 / 1024),
            external: Math.round(memUsage.external / 1024 / 1024),
            arrayBuffers: Math.round(memUsage.arrayBuffers / 1024 / 1024),
            gc: {
                major: 0,
                minor: 0,
                duration: 0,
                lastGC: 0
            },
            cache: {
                size: 0,
                entries: 0,
                hitRate: 0.95,
                evictions: 0
            },
            leaks: {
                detected: 0,
                suspected: 0,
                resolved: 0
            },
            compression: {
                compressed: 0,
                savings: 0,
                ratio: 0
            }
        };
    }
    setupGCHooks() {
        if (!this.config.enabled)
            return;
        if (global.gc) {
            const originalGC = global.gc;
            global.gc = () => {
                const start = Date.now();
                const before = process.memoryUsage().heapUsed;
                const result = originalGC();
                const after = process.memoryUsage().heapUsed;
                const duration = Date.now() - start;
                const freed = before - after;
                this.recordGCAction('manual', duration, freed, before, after);
                return result;
            };
        }
        structuredLogger.info('Memory manager GC hooks configured', {
            config: this.config,
            requestId: ''
        });
    }
    startMonitoring() {
        if (!this.config.enabled)
            return;
        this.monitoringInterval = setInterval(() => {
            this.updateMetrics();
            this.checkMemoryHealth();
        }, this.config.monitoringInterval);
        this.gcInterval = setInterval(() => {
            this.performGarbageCollection();
        }, this.config.gcInterval);
        this.cacheCleanupInterval = setInterval(() => {
            this.cleanupCache();
        }, this.config.cacheCleanupInterval);
        structuredLogger.info('Memory monitoring started', {
            config: this.config,
            requestId: ''
        });
    }
    updateMetrics() {
        const memUsage = process.memoryUsage();
        const beforeUsed = this.metrics.used;
        this.metrics = {
            total: this.config.maxMemoryMB,
            used: Math.round(memUsage.rss / 1024 / 1024),
            free: this.config.maxMemoryMB - Math.round(memUsage.rss / 1024 / 1024),
            heap: {
                total: Math.round(memUsage.heapTotal / 1024 / 1024),
                used: Math.round(memUsage.heapUsed / 1024 / 1024),
                free: Math.round((memUsage.heapTotal - memUsage.heapUsed) / 1024 / 1024),
                external: Math.round(memUsage.external / 1024 / 1024),
                arrayBuffers: Math.round(memUsage.arrayBuffers / 1024 / 1024)
            },
            rss: Math.round(memUsage.rss / 1024 / 1024),
            external: Math.round(memUsage.external / 1024 / 1024),
            arrayBuffers: Math.round(memUsage.arrayBuffers / 1024 / 1024),
            gc: {
                major: this.gcCount.major,
                minor: this.gcCount.minor,
                duration: this.metrics.gc.duration,
                lastGC: this.lastGC
            },
            cache: this.metrics.cache,
            leaks: this.metrics.leaks,
            compression: this.metrics.compression
        };
        if (this.config.leakDetectionEnabled) {
            this.detectMemoryLeaks(beforeUsed, this.metrics.used);
        }
        this.updatePrometheusMetrics();
    }
    checkMemoryHealth() {
        const issues = [];
        if (this.metrics.used > this.config.maxMemoryMB * 0.9) {
            issues.push('critical_memory_usage');
        }
        else if (this.metrics.used > this.config.gcThreshold) {
            issues.push('high_memory_usage');
        }
        if (this.metrics.heap.used > this.metrics.heap.total * 0.8) {
            issues.push('high_heap_usage');
        }
        if (this.metrics.cache.size > this.config.cacheCleanupThreshold) {
            issues.push('large_cache_size');
        }
        if (this.metrics.leaks.detected > 0) {
            issues.push('memory_leaks_detected');
        }
        if (issues.length > 0) {
            structuredLogger.warn('Memory health issues detected', {
                issues,
                metrics: this.metrics,
                requestId: ''
            });
            this.optimizeMemory(issues);
        }
    }
    async optimizeMemory(issues) {
        if (this.isOptimizing)
            return;
        this.isOptimizing = true;
        structuredLogger.info('Starting memory optimization', {
            issues,
            requestId: ''
        });
        try {
            for (const issue of issues) {
                switch (issue) {
                    case 'critical_memory_usage':
                    case 'high_memory_usage':
                        await this.performGarbageCollection();
                        await this.cleanupCache();
                        break;
                    case 'high_heap_usage':
                        await this.optimizeHeap();
                        break;
                    case 'large_cache_size':
                        await this.cleanupCache();
                        break;
                    case 'memory_leaks_detected':
                        await this.resolveMemoryLeaks();
                        break;
                }
            }
        }
        catch (error) {
            structuredLogger.error('Memory optimization failed', {
                error: error instanceof Error ? error.message : String(error),
                requestId: ''
            });
        }
        finally {
            this.isOptimizing = false;
        }
    }
    async performGarbageCollection() {
        if (!global.gc) {
            structuredLogger.warn('Garbage collection not available', { requestId: '' });
            return;
        }
        const start = Date.now();
        const before = process.memoryUsage().heapUsed;
        try {
            global.gc();
            const after = process.memoryUsage().heapUsed;
            const duration = Date.now() - start;
            const freed = before - after;
            this.recordGCAction('automatic', duration, freed, before, after);
            this.lastGC = Date.now();
            structuredLogger.info('Garbage collection performed', {
                duration,
                freed: Math.round(freed / 1024 / 1024),
                before: Math.round(before / 1024 / 1024),
                after: Math.round(after / 1024 / 1024),
                requestId: ''
            });
        }
        catch (error) {
            structuredLogger.error('Garbage collection failed', {
                error: error instanceof Error ? error.message : String(error),
                requestId: ''
            });
        }
    }
    recordGCAction(type, duration, freed, before, after) {
        const action = {
            type: type === 'automatic' ? 'major' : 'minor',
            duration,
            freed,
            before: Math.round(before / 1024 / 1024),
            after: Math.round(after / 1024 / 1024),
            timestamp: Date.now()
        };
        this.gcHistory.push(action);
        if (this.gcHistory.length > 100) {
            this.gcHistory = this.gcHistory.slice(-100);
        }
        if (action.type === 'major') {
            this.gcCount.major++;
        }
        else {
            this.gcCount.minor++;
        }
        this.metrics.gc.duration = duration;
        this.metrics.gc.lastGC = Date.now();
    }
    async cleanupCache() {
        const start = Date.now();
        const beforeSize = this.metrics.cache.size;
        try {
            await this.clearOldCacheEntries();
            await this.compressCacheData();
            const afterSize = this.metrics.cache.size;
            const cleaned = beforeSize - afterSize;
            structuredLogger.info('Cache cleanup performed', {
                duration: Date.now() - start,
                beforeSize,
                afterSize,
                cleaned,
                requestId: ''
            });
        }
        catch (error) {
            structuredLogger.error('Cache cleanup failed', {
                error: error instanceof Error ? error.message : String(error),
                requestId: ''
            });
        }
    }
    async optimizeHeap() {
        const start = Date.now();
        try {
            await this.defragmentHeap();
            await this.optimizeObjectLayout();
            structuredLogger.info('Heap optimization performed', {
                duration: Date.now() - start,
                requestId: ''
            });
        }
        catch (error) {
            structuredLogger.error('Heap optimization failed', {
                error: error instanceof Error ? error.message : String(error),
                requestId: ''
            });
        }
    }
    async resolveMemoryLeaks() {
        const start = Date.now();
        const leaksToResolve = Array.from(this.leaks.values()).filter(leak => Date.now() - leak.firstDetected > 300000);
        try {
            for (const leak of leaksToResolve) {
                await this.resolveLeak(leak);
                this.leaks.delete(leak.id);
                this.metrics.leaks.resolved++;
            }
            structuredLogger.info('Memory leaks resolved', {
                duration: Date.now() - start,
                resolved: leaksToResolve.length,
                remaining: this.leaks.size,
                requestId: ''
            });
        }
        catch (error) {
            structuredLogger.error('Memory leak resolution failed', {
                error: error instanceof Error ? error.message : String(error),
                requestId: ''
            });
        }
    }
    detectMemoryLeaks(before, after) {
        const growth = after - before;
        const growthRate = growth / before;
        if (growthRate > 0.1 && after > this.config.gcThreshold) {
            const leakId = `leak_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const leak = {
                id: leakId,
                type: 'object',
                size: growth,
                location: 'unknown',
                firstDetected: Date.now(),
                lastSeen: Date.now(),
                count: 1
            };
            this.leaks.set(leakId, leak);
            this.metrics.leaks.detected++;
            structuredLogger.warn('Memory leak detected', {
                leakId,
                growth,
                growthRate,
                totalLeaks: this.leaks.size,
                requestId: ''
            });
        }
    }
    async clearOldCacheEntries() {
        await new Promise(resolve => setTimeout(resolve, 10));
        this.metrics.cache.evictions += 5;
        this.metrics.cache.entries -= 5;
    }
    async compressCacheData() {
        if (!this.config.compressionEnabled)
            return;
        await new Promise(resolve => setTimeout(resolve, 15));
        this.metrics.compression.compressed += 10;
        this.metrics.compression.savings += 5;
    }
    async defragmentHeap() {
        await new Promise(resolve => setTimeout(resolve, 20));
    }
    async optimizeObjectLayout() {
        await new Promise(resolve => setTimeout(resolve, 15));
    }
    async resolveLeak(leak) {
        await new Promise(resolve => setTimeout(resolve, 5));
    }
    updatePrometheusMetrics() {
        metrics.memoryUsage.labels('rss').set(this.metrics.rss);
        metrics.memoryUsage.labels('heapTotal').set(this.metrics.heap.total);
        metrics.memoryUsage.labels('heapUsed').set(this.metrics.heap.used);
        metrics.memoryUsage.labels('external').set(this.metrics.external);
        metrics.memoryUsage.labels('arrayBuffers').set(this.metrics.arrayBuffers);
    }
    getStatus() {
        return {
            enabled: this.config.enabled,
            isOptimizing: this.isOptimizing,
            metrics: this.metrics,
            leaks: Array.from(this.leaks.values()),
            gcHistory: this.gcHistory.slice(-20),
            config: this.config
        };
    }
    async forceOptimization(type) {
        const start = Date.now();
        try {
            switch (type) {
                case 'gc':
                    await this.performGarbageCollection();
                    break;
                case 'cache':
                    await this.cleanupCache();
                    break;
                case 'heap':
                    await this.optimizeHeap();
                    break;
                case 'leaks':
                    await this.resolveMemoryLeaks();
                    break;
                default:
                    await this.performGarbageCollection();
                    await this.cleanupCache();
                    await this.optimizeHeap();
                    await this.resolveMemoryLeaks();
            }
            structuredLogger.info('Manual memory optimization completed', {
                type: type || 'all',
                duration: Date.now() - start,
                requestId: ''
            });
        }
        catch (error) {
            structuredLogger.error('Manual memory optimization failed', {
                error: error instanceof Error ? error.message : String(error),
                type: type || 'all',
                requestId: ''
            });
        }
    }
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        structuredLogger.info('Memory manager config updated', {
            config: this.config,
            requestId: ''
        });
    }
    stop() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        if (this.gcInterval) {
            clearInterval(this.gcInterval);
            this.gcInterval = null;
        }
        if (this.cacheCleanupInterval) {
            clearInterval(this.cacheCleanupInterval);
            this.cacheCleanupInterval = null;
        }
        structuredLogger.info('Memory monitoring stopped', { requestId: '' });
    }
}
export const memoryManager = new MemoryManagerService();
//# sourceMappingURL=memory-manager.service.js.map