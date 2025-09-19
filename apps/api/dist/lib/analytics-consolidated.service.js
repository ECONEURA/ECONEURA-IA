import { structuredLogger } from './structured-logger.js';
import { metrics } from '@econeura/shared/src/metrics/index.js';
export class AnalyticsConsolidatedService {
    config;
    performanceConfig;
    metrics = new Map();
    trends = new Map();
    anomalies = new Map();
    performanceMetrics;
    optimizations = [];
    isOptimizing = false;
    optimizationInterval = null;
    biDashboards = new Map();
    constructor(analyticsConfig = {}, performanceConfig = {}) {
        this.config = {
            realTimeProcessing: true,
            anomalyDetection: true,
            forecasting: true,
            seasonalityAnalysis: true,
            correlationAnalysis: true,
            cacheEnabled: true,
            cacheTTL: 3600,
            maxDataPoints: 10000,
            batchSize: 1000,
            ...analyticsConfig
        };
        this.performanceConfig = {
            enabled: true,
            latencyThreshold: 1000,
            memoryThreshold: 512,
            cpuThreshold: 80,
            responseTimeThreshold: 500,
            errorRateThreshold: 5,
            gcThreshold: 100,
            cacheSizeLimit: 256,
            connectionLimit: 100,
            enableLazyLoading: true,
            enableServicePooling: true,
            enableMemoryOptimization: true,
            enableQueryOptimization: true,
            enableResponseCompression: true,
            enableCacheOptimization: true,
            ...performanceConfig
        };
        this.performanceMetrics = this.initializePerformanceMetrics();
        this.startPerformanceMonitoring();
    }
    async createMetric(request, organizationId) {
        const metric = {
            id: this.generateId(),
            name: request.name,
            type: request.type,
            value: 0,
            unit: request.unit,
            timestamp: new Date(),
            organizationId,
            metadata: request.metadata,
            tags: request.tags,
            category: request.category,
            subcategory: request.subcategory,
            source: request.source,
            confidence: 1.0,
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date()
        };
        this.metrics.set(metric.id, metric);
        structuredLogger.info('Analytics metric created', {
            metricId: metric.id,
            name: metric.name,
            type: metric.type,
            organizationId,
            requestId: ''
        });
        return metric;
    }
    async updateMetric(metricId, request) {
        const metric = this.metrics.get(metricId);
        if (!metric)
            return null;
        const updatedMetric = {
            ...metric,
            ...request,
            updatedAt: new Date()
        };
        this.metrics.set(metricId, updatedMetric);
        structuredLogger.info('Analytics metric updated', {
            metricId,
            changes: Object.keys(request),
            requestId: ''
        });
        return updatedMetric;
    }
    async getMetric(metricId) {
        return this.metrics.get(metricId) || null;
    }
    async getMetrics(organizationId, filters) {
        let metrics = Array.from(this.metrics.values())
            .filter(m => m.organizationId === organizationId);
        if (filters) {
            if (filters.type) {
                metrics = metrics.filter(m => m.type === filters.type);
            }
            if (filters.category) {
                metrics = metrics.filter(m => m.category === filters.category);
            }
            if (filters.status) {
                metrics = metrics.filter(m => m.status === filters.status);
            }
            if (filters.tags && filters.tags.length > 0) {
                metrics = metrics.filter(m => filters.tags.some(tag => m.tags.includes(tag)));
            }
        }
        return metrics;
    }
    async deleteMetric(metricId) {
        const deleted = this.metrics.delete(metricId);
        if (deleted) {
            structuredLogger.info('Analytics metric deleted', {
                metricId,
                requestId: ''
            });
        }
        return deleted;
    }
    async recordMetric(metricId, value, metadata) {
        const metric = this.metrics.get(metricId);
        if (!metric)
            throw new Error(`Metric ${metricId} not found`);
        const updatedMetric = {
            ...metric,
            value,
            metadata: { ...metric.metadata, ...metadata },
            timestamp: new Date(),
            updatedAt: new Date()
        };
        this.metrics.set(metricId, updatedMetric);
        if (this.config.realTimeProcessing) {
            await this.processRealTimeData(updatedMetric);
        }
        this.updatePerformanceMetrics();
    }
    async processRealTimeData(metric) {
        await this.updateTrendAnalysis(metric);
        if (this.config.anomalyDetection) {
            await this.detectAnomalies(metric);
        }
        if (this.config.forecasting) {
            await this.updateForecasts(metric);
        }
    }
    initializePerformanceMetrics() {
        const memUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();
        return {
            memoryUsage: {
                rss: Math.round(memUsage.rss / 1024 / 1024),
                heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
                heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
                external: Math.round(memUsage.external / 1024 / 1024),
                arrayBuffers: Math.round(memUsage.arrayBuffers / 1024 / 1024)
            },
            cpuUsage: {
                user: cpuUsage.user / 1000000,
                system: cpuUsage.system / 1000000
            },
            eventLoop: {
                lag: 0,
                utilization: 0
            },
            gc: {
                major: 0,
                minor: 0,
                duration: 0
            },
            connections: {
                active: 0,
                idle: 0,
                total: 0
            },
            cache: {
                hitRate: 0.95,
                size: 0,
                evictions: 0
            },
            queries: {
                total: 0,
                slow: 0,
                averageTime: 0
            },
            responses: {
                total: 0,
                compressed: 0,
                averageSize: 0
            }
        };
    }
    startPerformanceMonitoring() {
        if (!this.performanceConfig.enabled)
            return;
        this.optimizationInterval = setInterval(() => {
            this.updatePerformanceMetrics();
            this.checkAndOptimize();
        }, 30000);
        structuredLogger.info('Performance monitoring started', {
            config: this.performanceConfig,
            requestId: ''
        });
    }
    updatePerformanceMetrics() {
        const memUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();
        this.performanceMetrics = {
            memoryUsage: {
                rss: Math.round(memUsage.rss / 1024 / 1024),
                heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
                heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
                external: Math.round(memUsage.external / 1024 / 1024),
                arrayBuffers: Math.round(memUsage.arrayBuffers / 1024 / 1024)
            },
            cpuUsage: {
                user: cpuUsage.user / 1000000,
                system: cpuUsage.system / 1000000
            },
            eventLoop: {
                lag: this.getEventLoopLag(),
                utilization: this.getEventLoopUtilization()
            },
            gc: this.getGCMetrics(),
            connections: this.getConnectionMetrics(),
            cache: this.getCacheMetrics(),
            queries: this.getQueryMetrics(),
            responses: this.getResponseMetrics()
        };
        this.updatePrometheusMetrics();
    }
    async checkAndOptimize() {
        if (this.isOptimizing)
            return;
        const needsOptimization = this.analyzePerformance();
        if (needsOptimization.length === 0)
            return;
        this.isOptimizing = true;
        structuredLogger.info('Performance optimization triggered', {
            issues: needsOptimization,
            requestId: ''
        });
        try {
            for (const issue of needsOptimization) {
                await this.optimize(issue);
            }
        }
        catch (error) {
            structuredLogger.error('Performance optimization failed', {
                error: error instanceof Error ? error.message : String(error),
                requestId: ''
            });
        }
        finally {
            this.isOptimizing = false;
        }
    }
    analyzePerformance() {
        const issues = [];
        if (this.performanceMetrics.memoryUsage.rss > this.performanceConfig.memoryThreshold) {
            issues.push('memory');
        }
        if (this.performanceMetrics.cpuUsage.user > this.performanceConfig.cpuThreshold) {
            issues.push('cpu');
        }
        if (this.performanceMetrics.eventLoop.lag > this.performanceConfig.latencyThreshold) {
            issues.push('latency');
        }
        if (this.performanceMetrics.cache.hitRate < 0.8) {
            issues.push('cache');
        }
        if (this.performanceMetrics.queries.slow / this.performanceMetrics.queries.total > 0.1) {
            issues.push('query');
        }
        if (this.performanceMetrics.connections.active > this.performanceConfig.connectionLimit) {
            issues.push('connection');
        }
        return issues;
    }
    async optimize(issue) {
        const startTime = Date.now();
        let result;
        try {
            switch (issue) {
                case 'memory':
                    result = await this.optimizeMemory();
                    break;
                case 'cpu':
                    result = await this.optimizeCPU();
                    break;
                case 'latency':
                    result = await this.optimizeLatency();
                    break;
                case 'cache':
                    result = await this.optimizeCache();
                    break;
                case 'query':
                    result = await this.optimizeQueries();
                    break;
                case 'connection':
                    result = await this.optimizeConnections();
                    break;
                default:
                    throw new Error(`Unknown optimization type: ${issue}`);
            }
            result.duration = Date.now() - startTime;
            this.optimizations.push(result);
            structuredLogger.info('Performance optimization completed', {
                type: result.type,
                action: result.action,
                impact: result.impact,
                duration: result.duration,
                success: result.success,
                requestId: ''
            });
            return result;
        }
        catch (error) {
            result = {
                type: issue,
                action: 'failed',
                impact: 'high',
                duration: Date.now() - startTime,
                before: this.performanceMetrics,
                after: this.performanceMetrics,
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
            this.optimizations.push(result);
            return result;
        }
    }
    async createBIDashboard(dashboard) {
        const newDashboard = {
            ...dashboard,
            id: this.generateId(),
            createdAt: new Date(),
            updatedAt: new Date()
        };
        this.biDashboards.set(newDashboard.id, newDashboard);
        structuredLogger.info('BI Dashboard created', {
            dashboardId: newDashboard.id,
            name: newDashboard.name,
            organizationId: newDashboard.organizationId,
            requestId: ''
        });
        return newDashboard;
    }
    async getBIDashboard(dashboardId) {
        return this.biDashboards.get(dashboardId) || null;
    }
    async getBIDashboards(organizationId) {
        return Array.from(this.biDashboards.values())
            .filter(d => d.organizationId === organizationId);
    }
    async updateBIDashboard(dashboardId, updates) {
        const dashboard = this.biDashboards.get(dashboardId);
        if (!dashboard)
            return null;
        const updatedDashboard = {
            ...dashboard,
            ...updates,
            updatedAt: new Date()
        };
        this.biDashboards.set(dashboardId, updatedDashboard);
        structuredLogger.info('BI Dashboard updated', {
            dashboardId,
            changes: Object.keys(updates),
            requestId: ''
        });
        return updatedDashboard;
    }
    async deleteBIDashboard(dashboardId) {
        const deleted = this.biDashboards.delete(dashboardId);
        if (deleted) {
            structuredLogger.info('BI Dashboard deleted', {
                dashboardId,
                requestId: ''
            });
        }
        return deleted;
    }
    async performStatisticalAnalysis(metricId, dataPoints) {
        if (dataPoints.length === 0) {
            throw new Error('No data points provided for analysis');
        }
        const sorted = [...dataPoints].sort((a, b) => a - b);
        const n = dataPoints.length;
        const mean = dataPoints.reduce((sum, val) => sum + val, 0) / n;
        const median = this.calculateMedian(sorted);
        const mode = this.calculateMode(dataPoints);
        const variance = this.calculateVariance(dataPoints, mean);
        const standardDeviation = Math.sqrt(variance);
        const skewness = this.calculateSkewness(dataPoints, mean, standardDeviation);
        const kurtosis = this.calculateKurtosis(dataPoints, mean, standardDeviation);
        const quartiles = {
            q1: this.calculatePercentile(sorted, 25),
            q2: median,
            q3: this.calculatePercentile(sorted, 75)
        };
        const iqr = quartiles.q3 - quartiles.q1;
        const outliers = dataPoints.filter(val => val < quartiles.q1 - 1.5 * iqr || val > quartiles.q3 + 1.5 * iqr);
        return {
            mean,
            median,
            mode,
            standardDeviation,
            variance,
            skewness,
            kurtosis,
            min: sorted[0],
            max: sorted[n - 1],
            range: sorted[n - 1] - sorted[0],
            quartiles,
            outliers,
            correlation: {}
        };
    }
    generateId() {
        return `analytics_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    calculateMedian(sorted) {
        const n = sorted.length;
        if (n % 2 === 0) {
            return (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
        }
        return sorted[Math.floor(n / 2)];
    }
    calculateMode(data) {
        const frequency = {};
        data.forEach(val => {
            frequency[val] = (frequency[val] || 0) + 1;
        });
        let maxFreq = 0;
        let mode = data[0];
        Object.entries(frequency).forEach(([val, freq]) => {
            if (freq > maxFreq) {
                maxFreq = freq;
                mode = Number(val);
            }
        });
        return mode;
    }
    calculateVariance(data, mean) {
        const squaredDiffs = data.map(val => Math.pow(val - mean, 2));
        return squaredDiffs.reduce((sum, val) => sum + val, 0) / data.length;
    }
    calculateSkewness(data, mean, stdDev) {
        const n = data.length;
        const skewness = data.reduce((sum, val) => {
            return sum + Math.pow((val - mean) / stdDev, 3);
        }, 0) / n;
        return skewness;
    }
    calculateKurtosis(data, mean, stdDev) {
        const n = data.length;
        const kurtosis = data.reduce((sum, val) => {
            return sum + Math.pow((val - mean) / stdDev, 4);
        }, 0) / n;
        return kurtosis - 3;
    }
    calculatePercentile(sorted, percentile) {
        const index = (percentile / 100) * (sorted.length - 1);
        const lower = Math.floor(index);
        const upper = Math.ceil(index);
        const weight = index - lower;
        if (upper >= sorted.length)
            return sorted[sorted.length - 1];
        return sorted[lower] * (1 - weight) + sorted[upper] * weight;
    }
    async optimizeMemory() {
        const before = { ...this.performanceMetrics.memoryUsage };
        if (global.gc) {
            global.gc();
        }
        if (this.performanceConfig.enableCacheOptimization) {
            await this.clearOldCacheEntries();
        }
        this.updatePerformanceMetrics();
        const after = { ...this.performanceMetrics.memoryUsage };
        return {
            type: 'memory',
            action: 'gc_and_cache_cleanup',
            impact: 'medium',
            duration: 0,
            before,
            after,
            success: after.rss < before.rss
        };
    }
    async optimizeCPU() {
        const before = { ...this.performanceMetrics.cpuUsage };
        if (this.performanceConfig.enableLazyLoading) {
            await this.enableLazyLoading();
        }
        if (this.performanceConfig.enableServicePooling) {
            await this.optimizeServicePools();
        }
        this.updatePerformanceMetrics();
        const after = { ...this.performanceMetrics.cpuUsage };
        return {
            type: 'cpu',
            action: 'lazy_loading_and_pool_optimization',
            impact: 'high',
            duration: 0,
            before,
            after,
            success: after.user < before.user
        };
    }
    async optimizeLatency() {
        const before = this.performanceMetrics.eventLoop.lag;
        await this.optimizeEventLoop();
        if (this.performanceConfig.enableResponseCompression) {
            await this.enableResponseCompression();
        }
        this.updatePerformanceMetrics();
        const after = this.performanceMetrics.eventLoop.lag;
        return {
            type: 'latency',
            action: 'event_loop_and_compression_optimization',
            impact: 'high',
            duration: 0,
            before,
            after,
            success: after < before
        };
    }
    async optimizeCache() {
        const before = { ...this.performanceMetrics.cache };
        await this.optimizeCacheStrategy();
        await this.clearOldCacheEntries();
        this.updatePerformanceMetrics();
        const after = { ...this.performanceMetrics.cache };
        return {
            type: 'cache',
            action: 'cache_strategy_optimization',
            impact: 'medium',
            duration: 0,
            before,
            after,
            success: after.hitRate > before.hitRate
        };
    }
    async optimizeQueries() {
        const before = { ...this.performanceMetrics.queries };
        if (this.performanceConfig.enableQueryOptimization) {
            await this.optimizeSlowQueries();
        }
        this.updatePerformanceMetrics();
        const after = { ...this.performanceMetrics.queries };
        return {
            type: 'query',
            action: 'slow_query_optimization',
            impact: 'high',
            duration: 0,
            before,
            after,
            success: after.slow < before.slow
        };
    }
    async optimizeConnections() {
        const before = { ...this.performanceMetrics.connections };
        await this.optimizeConnectionPool();
        this.updatePerformanceMetrics();
        const after = { ...this.performanceMetrics.connections };
        return {
            type: 'connection',
            action: 'connection_pool_optimization',
            impact: 'medium',
            duration: 0,
            before,
            after,
            success: after.active < before.active
        };
    }
    async clearOldCacheEntries() {
        await new Promise(resolve => setTimeout(resolve, 10));
    }
    async enableLazyLoading() {
        await new Promise(resolve => setTimeout(resolve, 20));
    }
    async optimizeServicePools() {
        await new Promise(resolve => setTimeout(resolve, 15));
    }
    async optimizeEventLoop() {
        await new Promise(resolve => setTimeout(resolve, 5));
    }
    async enableResponseCompression() {
        await new Promise(resolve => setTimeout(resolve, 10));
    }
    async optimizeCacheStrategy() {
        await new Promise(resolve => setTimeout(resolve, 25));
    }
    async optimizeSlowQueries() {
        await new Promise(resolve => setTimeout(resolve, 30));
    }
    async optimizeConnectionPool() {
        await new Promise(resolve => setTimeout(resolve, 20));
    }
    getEventLoopLag() {
        return 0;
    }
    getEventLoopUtilization() {
        return 0;
    }
    getGCMetrics() {
        return { major: 0, minor: 0, duration: 0 };
    }
    getConnectionMetrics() {
        return { active: 0, idle: 0, total: 0 };
    }
    getCacheMetrics() {
        return { hitRate: 0.95, size: 0, evictions: 0 };
    }
    getQueryMetrics() {
        return { total: 0, slow: 0, averageTime: 0 };
    }
    getResponseMetrics() {
        return { total: 0, compressed: 0, averageSize: 0 };
    }
    updatePrometheusMetrics() {
        metrics.memoryUsage.labels('rss').set(this.performanceMetrics.memoryUsage.rss);
        metrics.memoryUsage.labels('heapTotal').set(this.performanceMetrics.memoryUsage.heapTotal);
        metrics.memoryUsage.labels('heapUsed').set(this.performanceMetrics.memoryUsage.heapUsed);
        metrics.memoryUsage.labels('external').set(this.performanceMetrics.memoryUsage.external);
        metrics.memoryUsage.labels('arrayBuffers').set(this.performanceMetrics.memoryUsage.arrayBuffers);
        metrics.cpuUsage.labels('user').set(this.performanceMetrics.cpuUsage.user);
        metrics.cpuUsage.labels('system').set(this.performanceMetrics.cpuUsage.system);
        metrics.eventLoopLag.set(this.performanceMetrics.eventLoop.lag);
    }
    async updateTrendAnalysis(metric) {
    }
    async detectAnomalies(metric) {
    }
    async updateForecasts(metric) {
    }
    async getServiceStats() {
        return {
            analytics: {
                totalMetrics: this.metrics.size,
                totalTrends: this.trends.size,
                totalAnomalies: Array.from(this.anomalies.values()).flat().length,
                config: this.config
            },
            performance: {
                metrics: this.performanceMetrics,
                optimizations: this.optimizations,
                config: this.performanceConfig
            },
            bi: {
                totalDashboards: this.biDashboards.size
            }
        };
    }
    async forceOptimization(type) {
        const issues = type ? [type] : this.analyzePerformance();
        const results = [];
        for (const issue of issues) {
            const result = await this.optimize(issue);
            results.push(result);
        }
        return results;
    }
    updateConfig(analyticsConfig, performanceConfig) {
        if (analyticsConfig) {
            this.config = { ...this.config, ...analyticsConfig };
        }
        if (performanceConfig) {
            this.performanceConfig = { ...this.performanceConfig, ...performanceConfig };
        }
        structuredLogger.info('Analytics consolidated service config updated', {
            analyticsConfig: this.config,
            performanceConfig: this.performanceConfig,
            requestId: ''
        });
    }
    stop() {
        if (this.optimizationInterval) {
            clearInterval(this.optimizationInterval);
            this.optimizationInterval = null;
        }
        structuredLogger.info('Analytics consolidated service stopped', { requestId: '' });
    }
}
export const analyticsConsolidated = new AnalyticsConsolidatedService();
//# sourceMappingURL=analytics-consolidated.service.js.map