export interface PerformanceConfig {
    enabled: boolean;
    latencyThreshold: number;
    memoryThreshold: number;
    cpuThreshold: number;
    responseTimeThreshold: number;
    errorRateThreshold: number;
    gcThreshold: number;
    cacheSizeLimit: number;
    connectionLimit: number;
    enableLazyLoading: boolean;
    enableServicePooling: boolean;
    enableMemoryOptimization: boolean;
    enableQueryOptimization: boolean;
    enableResponseCompression: boolean;
    enableCacheOptimization: boolean;
}
export interface PerformanceMetrics {
    memoryUsage: {
        rss: number;
        heapTotal: number;
        heapUsed: number;
        external: number;
        arrayBuffers: number;
    };
    cpuUsage: {
        user: number;
        system: number;
    };
    eventLoop: {
        lag: number;
        utilization: number;
    };
    gc: {
        major: number;
        minor: number;
        duration: number;
    };
    connections: {
        active: number;
        idle: number;
        total: number;
    };
    cache: {
        hitRate: number;
        size: number;
        evictions: number;
    };
    queries: {
        total: number;
        slow: number;
        averageTime: number;
    };
    responses: {
        total: number;
        compressed: number;
        averageSize: number;
    };
}
export interface OptimizationResult {
    type: 'memory' | 'cpu' | 'latency' | 'cache' | 'query' | 'connection';
    action: string;
    impact: 'low' | 'medium' | 'high';
    duration: number;
    before: any;
    after: any;
    success: boolean;
    error?: string;
}
export declare class PerformanceOptimizerV2Service {
    private config;
    private metrics;
    private optimizations;
    private isOptimizing;
    private optimizationInterval;
    constructor(config?: Partial<PerformanceConfig>);
    private initializeMetrics;
    private startMonitoring;
    private updateMetrics;
    private checkAndOptimize;
    private analyzePerformance;
    private optimize;
    private optimizeMemory;
    private optimizeCPU;
    private optimizeLatency;
    private optimizeCache;
    private optimizeQueries;
    private optimizeConnections;
    private clearOldCacheEntries;
    private enableLazyLoading;
    private optimizeServicePools;
    private optimizeEventLoop;
    private enableResponseCompression;
    private optimizeCacheStrategy;
    private optimizeSlowQueries;
    private optimizeConnectionPool;
    private getEventLoopLag;
    private getEventLoopUtilization;
    private getGCMetrics;
    private getConnectionMetrics;
    private getCacheMetrics;
    private getQueryMetrics;
    private getResponseMetrics;
    private updatePrometheusMetrics;
    getStatus(): {
        enabled: boolean;
        isOptimizing: boolean;
        metrics: PerformanceMetrics;
        optimizations: OptimizationResult[];
        config: PerformanceConfig;
    };
    forceOptimization(type?: string): Promise<OptimizationResult[]>;
    updateConfig(newConfig: Partial<PerformanceConfig>): void;
    stop(): void;
}
export declare const performanceOptimizerV2: PerformanceOptimizerV2Service;
//# sourceMappingURL=performance-optimizer-v2.service.d.ts.map