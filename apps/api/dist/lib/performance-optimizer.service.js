import { metrics } from '@econeura/shared/src/metrics/index.js';

import { structuredLogger } from './structured-logger.js';
export var CompressionType;
(function (CompressionType) {
    CompressionType["GZIP"] = "gzip";
    CompressionType["BROTLI"] = "brotli";
    CompressionType["DEFLATE"] = "deflate";
    CompressionType["LZ4"] = "lz4";
})(CompressionType || (CompressionType = {}));
export var OptimizationLevel;
(function (OptimizationLevel) {
    OptimizationLevel["FAST"] = "fast";
    OptimizationLevel["BALANCED"] = "balanced";
    OptimizationLevel["MAXIMUM"] = "maximum";
})(OptimizationLevel || (OptimizationLevel = {}));
export class PerformanceOptimizerService {
    static instance;
    config;
    queryCache = new Map();
    responseCache = new Map();
    slowQueries = [];
    isOptimizing = false;
    optimizationInterval = null;
    constructor() {
        this.config = this.getDefaultConfig();
        this.startOptimization();
    }
    static getInstance() {
        if (!PerformanceOptimizerService.instance) {
            PerformanceOptimizerService.instance = new PerformanceOptimizerService();
        }
        return PerformanceOptimizerService.instance;
    }
    getDefaultConfig() {
        return {
            compression: {
                enabled: true,
                type: CompressionType.GZIP,
                level: 6,
                threshold: 1024
            },
            caching: {
                enabled: true,
                ttl: 300,
                maxSize: 100 * 1024 * 1024,
                strategy: 'lru'
            },
            queryOptimization: {
                enabled: true,
                maxQueryTime: 1000,
                slowQueryThreshold: 500,
                batchSize: 100
            },
            responseOptimization: {
                enabled: true,
                minifyJson: true,
                removeNulls: true,
                paginationLimit: 1000
            }
        };
    }
    async optimizeResponse(data, contentType = 'application/json') {
        const startTime = Date.now();
        const originalSize = JSON.stringify(data).length;
        let optimizedData = data;
        let compressed = false;
        let compressionRatio = 1;
        try {
            if (this.config.responseOptimization.enabled) {
                optimizedData = this.optimizeData(data);
            }
            if (this.config.compression.enabled && originalSize > this.config.compression.threshold) {
                const compressedResult = await this.compressData(optimizedData, contentType);
                optimizedData = compressedResult.data;
                compressed = true;
                compressionRatio = compressedResult.ratio;
            }
            const optimizedSize = JSON.stringify(optimizedData).length;
            const processingTime = Date.now() - startTime;
            this.recordResponseOptimizationMetrics(originalSize, optimizedSize, processingTime, compressed);
            structuredLogger.debug('Response optimized', {
                originalSize,
                optimizedSize,
                compressionRatio,
                compressed,
                processingTime
            });
            return {
                data: optimizedData,
                compressed,
                compressionRatio,
                originalSize,
                optimizedSize
            };
        }
        catch (error) {
            structuredLogger.error('Response optimization failed', {
                error: error instanceof Error ? error.message : String(error)
            });
            return {
                data,
                compressed: false,
                compressionRatio: 1,
                originalSize,
                optimizedSize: originalSize
            };
        }
    }
    async optimizeQuery(query, params = []) {
        const startTime = Date.now();
        try {
            const cacheKey = this.generateQueryCacheKey(query, params);
            const cachedResult = this.queryCache.get(cacheKey);
            if (cachedResult && this.isQueryCacheValid(cachedResult)) {
                return {
                    originalQuery: query,
                    optimizedQuery: query,
                    executionTime: 0,
                    optimizationType: 'cache_hit',
                    improvement: 100
                };
            }
            const optimizedQuery = this.optimizeQueryString(query);
            const executionTime = Date.now() - startTime;
            if (executionTime > this.config.queryOptimization.slowQueryThreshold) {
                this.recordSlowQuery(query, executionTime);
            }
            const improvement = this.calculateQueryImprovement(query, optimizedQuery);
            const result = {
                originalQuery: query,
                optimizedQuery,
                executionTime,
                optimizationType: this.getOptimizationType(query, optimizedQuery),
                improvement
            };
            this.queryCache.set(cacheKey, {
                result,
                timestamp: Date.now(),
                ttl: this.config.caching.ttl
            });
            this.recordQueryOptimizationMetrics(executionTime, improvement);
            return result;
        }
        catch (error) {
            structuredLogger.error('Query optimization failed', {
                query,
                error: error instanceof Error ? error.message : String(error)
            });
            return {
                originalQuery: query,
                optimizedQuery: query,
                executionTime: Date.now() - startTime,
                optimizationType: 'error',
                improvement: 0
            };
        }
    }
    optimizeData(data) {
        if (Array.isArray(data)) {
            return data.map(item => this.optimizeData(item));
        }
        if (data && typeof data === 'object') {
            const optimized = {};
            for (const [key, value] of Object.entries(data)) {
                if (this.config.responseOptimization.removeNulls && value === null) {
                    continue;
                }
                optimized[key] = this.optimizeData(value);
            }
            return optimized;
        }
        return data;
    }
    async compressData(data, contentType) {
        const originalData = JSON.stringify(data);
        const originalSize = originalData.length;
        let compressedData;
        let ratio;
        switch (this.config.compression.type) {
            case CompressionType.GZIP:
                compressedData = this.simulateGzipCompression(originalData);
                break;
            case CompressionType.BROTLI:
                compressedData = this.simulateBrotliCompression(originalData);
                break;
            default:
                compressedData = originalData;
        }
        const compressedSize = compressedData.length;
        ratio = originalSize / compressedSize;
        return {
            data: compressedData,
            ratio
        };
    }
    simulateGzipCompression(data) {
        return `GZIP:${data.substring(0, Math.floor(data.length * 0.7))}`;
    }
    simulateBrotliCompression(data) {
        return `BROTLI:${data.substring(0, Math.floor(data.length * 0.6))}`;
    }
    optimizeQueryString(query) {
        let optimized = query;
        optimized = optimized.replace(/\s+/g, ' ').trim();
        if (optimized.includes('SELECT *')) {
            optimized = optimized.replace('SELECT *', 'SELECT id, name, created_at');
        }
        if (optimized.includes('ORDER BY') && !optimized.includes('LIMIT')) {
            optimized += ' LIMIT 1000';
        }
        if ((optimized.match(/JOIN/gi) || []).length > 3) {
            structuredLogger.warn('Complex query detected', { query: optimized });
        }
        return optimized;
    }
    generateQueryCacheKey(query, params) {
        const normalizedQuery = query.replace(/\s+/g, ' ').trim();
        const paramsHash = JSON.stringify(params);
        return `${normalizedQuery}:${paramsHash}`;
    }
    isQueryCacheValid(cachedResult) {
        const now = Date.now();
        return (now - cachedResult.timestamp) < (cachedResult.ttl * 1000);
    }
    calculateQueryImprovement(original, optimized) {
        const originalLength = original.length;
        const optimizedLength = optimized.length;
        if (originalLength === 0)
            return 0;
        return Math.round(((originalLength - optimizedLength) / originalLength) * 100);
    }
    getOptimizationType(original, optimized) {
        if (original === optimized)
            return 'no_change';
        if (optimized.includes('LIMIT'))
            return 'limit_added';
        if (optimized.includes('SELECT') && !original.includes('SELECT *'))
            return 'select_optimized';
        return 'general_optimization';
    }
    recordSlowQuery(query, executionTime) {
        this.slowQueries.push({
            query: query.substring(0, 200),
            time: executionTime,
            timestamp: Date.now()
        });
        if (this.slowQueries.length > 100) {
            this.slowQueries = this.slowQueries.slice(-100);
        }
        structuredLogger.warn('Slow query detected', {
            query: query.substring(0, 200),
            executionTime,
            threshold: this.config.queryOptimization.slowQueryThreshold
        });
        metrics.slowQueries.inc();
    }
    recordResponseOptimizationMetrics(originalSize, optimizedSize, processingTime, compressed) {
        metrics.responseOptimizations.inc();
        metrics.responseOptimizationTime.observe({}, processingTime);
        metrics.compressionRatio.observe({}, originalSize / optimizedSize);
        if (compressed) {
            metrics.compressedResponses.inc();
        }
    }
    recordQueryOptimizationMetrics(executionTime, improvement) {
        metrics.queryOptimizations.inc();
        metrics.queryOptimizationTime.observe({}, executionTime);
        metrics.queryImprovement.observe({}, improvement);
    }
    startOptimization() {
        this.optimizationInterval = setInterval(() => {
            this.performAutomaticOptimizations();
        }, 300000);
        structuredLogger.info('Performance optimizer started', {
            compression: this.config.compression.enabled,
            caching: this.config.caching.enabled,
            queryOptimization: this.config.queryOptimization.enabled
        });
    }
    async performAutomaticOptimizations() {
        try {
            this.cleanupExpiredCache();
            this.analyzeSlowQueries();
            this.optimizeMemoryUsage();
            structuredLogger.debug('Automatic optimizations completed');
        }
        catch (error) {
            structuredLogger.error('Automatic optimization failed', {
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }
    cleanupExpiredCache() {
        const now = Date.now();
        let cleanedCount = 0;
        for (const [key, value] of this.queryCache.entries()) {
            if (!this.isQueryCacheValid(value)) {
                this.queryCache.delete(key);
                cleanedCount++;
            }
        }
        if (cleanedCount > 0) {
            structuredLogger.debug('Cache cleanup completed', { cleanedCount });
        }
    }
    analyzeSlowQueries() {
        if (this.slowQueries.length === 0)
            return;
        const recentSlowQueries = this.slowQueries.filter(q => (Date.now() - q.timestamp) < 3600000);
        if (recentSlowQueries.length > 10) {
            structuredLogger.warn('High number of slow queries detected', {
                count: recentSlowQueries.length,
                threshold: 10
            });
        }
    }
    optimizeMemoryUsage() {
        const memUsage = process.memoryUsage();
        const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
        if (heapUsedMB > 500) {
            if (global.gc) {
                global.gc();
                structuredLogger.info('Garbage collection triggered', {
                    heapUsedBefore: heapUsedMB,
                    heapUsedAfter: process.memoryUsage().heapUsed / 1024 / 1024
                });
            }
        }
    }
    getPerformanceMetrics() {
        const memUsage = process.memoryUsage();
        return {
            responseTime: 0,
            compressionRatio: 0,
            cacheHitRate: 0,
            queryOptimizations: 0,
            slowQueries: this.slowQueries.length,
            memoryUsage: memUsage.heapUsed / 1024 / 1024,
            cpuUsage: 0
        };
    }
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        structuredLogger.info('Performance configuration updated', { config: this.config });
    }
    stop() {
        if (this.optimizationInterval) {
            clearInterval(this.optimizationInterval);
            this.optimizationInterval = null;
        }
        structuredLogger.info('Performance optimizer stopped');
    }
}
export const performanceOptimizerService = PerformanceOptimizerService.getInstance();
//# sourceMappingURL=performance-optimizer.service.js.map