export declare enum CompressionType {
    GZIP = "gzip",
    BROTLI = "brotli",
    DEFLATE = "deflate",
    LZ4 = "lz4"
}
export declare enum OptimizationLevel {
    FAST = "fast",
    BALANCED = "balanced",
    MAXIMUM = "maximum"
}
export interface PerformanceConfig {
    compression: {
        enabled: boolean;
        type: CompressionType;
        level: number;
        threshold: number;
    };
    caching: {
        enabled: boolean;
        ttl: number;
        maxSize: number;
        strategy: 'lru' | 'lfu' | 'ttl';
    };
    queryOptimization: {
        enabled: boolean;
        maxQueryTime: number;
        slowQueryThreshold: number;
        batchSize: number;
    };
    responseOptimization: {
        enabled: boolean;
        minifyJson: boolean;
        removeNulls: boolean;
        paginationLimit: number;
    };
}
export interface PerformanceMetrics {
    responseTime: number;
    compressionRatio: number;
    cacheHitRate: number;
    queryOptimizations: number;
    slowQueries: number;
    memoryUsage: number;
    cpuUsage: number;
}
export interface QueryOptimization {
    originalQuery: string;
    optimizedQuery: string;
    executionTime: number;
    optimizationType: string;
    improvement: number;
}
export declare class PerformanceOptimizerService {
    private static instance;
    private config;
    private queryCache;
    private responseCache;
    private slowQueries;
    private isOptimizing;
    private optimizationInterval;
    private constructor();
    static getInstance(): PerformanceOptimizerService;
    private getDefaultConfig;
    optimizeResponse(data: any, contentType?: string): Promise<{
        data: any;
        compressed: boolean;
        compressionRatio: number;
        originalSize: number;
        optimizedSize: number;
    }>;
    optimizeQuery(query: string, params?: any[]): Promise<QueryOptimization>;
    private optimizeData;
    private compressData;
    private simulateGzipCompression;
    private simulateBrotliCompression;
    private optimizeQueryString;
    private generateQueryCacheKey;
    private isQueryCacheValid;
    private calculateQueryImprovement;
    private getOptimizationType;
    private recordSlowQuery;
    private recordResponseOptimizationMetrics;
    private recordQueryOptimizationMetrics;
    private startOptimization;
    private performAutomaticOptimizations;
    private cleanupExpiredCache;
    private analyzeSlowQueries;
    private optimizeMemoryUsage;
    getPerformanceMetrics(): PerformanceMetrics;
    updateConfig(newConfig: Partial<PerformanceConfig>): void;
    stop(): void;
}
export declare const performanceOptimizerService: PerformanceOptimizerService;
//# sourceMappingURL=performance-optimizer.service.d.ts.map