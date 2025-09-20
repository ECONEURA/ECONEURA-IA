export interface PerformanceMetrics {
    responseTime: number;
    memoryUsage: number;
    cpuUsage: number;
    cacheHitRate: number;
    dbQueryTime: number;
    apiLatency: number;
}
export interface OptimizationConfig {
    enableQueryOptimization: boolean;
    enableCaching: boolean;
    enableCompression: boolean;
    enableLazyLoading: boolean;
    enableBundleOptimization: boolean;
    cacheTTL: number;
    maxCacheSize: number;
    compressionThreshold: number;
}
export declare class PerformanceOptimizer {
    private config;
    private metrics;
    private queryCache;
    private compressionCache;
    constructor(config?: Partial<OptimizationConfig>);
    optimizeQuery<T>(queryKey: string, queryFn: () => Promise<T>, ttl?: number): Promise<T>;
    optimizeResponse(data: any, contentType?: string): Promise<{
        data: any;
        headers: Record<string, string>;
    }>;
    optimizeBundleLoading(bundleName: string, loadFn: () => Promise<any>): Promise<any>;
    getMetrics(): PerformanceMetrics;
    clearCaches(): void;
    getCacheStats(): {
        queryCacheSize: number;
        compressionCacheSize: number;
        hitRate: number;
        missRate: number;
    };
    private cacheQueryResult;
    private evictOldestCacheEntry;
    private compressData;
    private startMetricsCollection;
    private startCacheCleanup;
    private calculateAverageResponseTime;
    private calculateCacheHitRate;
    private calculateAverageQueryTime;
    private calculateAverageAPILatency;
}
export declare const performanceOptimizer: PerformanceOptimizer;
export declare const performanceMetrics: {
    queryCacheHits: any;
    queryCacheMisses: any;
    queryExecutionTime: any;
    queryErrors: any;
    responseOptimizationTime: any;
    bundleCacheHits: any;
    bundleCacheMisses: any;
    bundleLoadTime: any;
    bundleLoadErrors: any;
    cacheEvictions: any;
    memoryUsage: any;
    cpuUsage: any;
    cacheHitRate: any;
};
//# sourceMappingURL=performance-optimizer.d.ts.map