export interface PerformanceMetrics {
    responseTime: number;
    memoryUsage: number;
    cpuUsage: number;
    cacheHitRate: number;
    connectionPoolUsage: number;
    queryExecutionTime: number;
    compressionRatio: number;
    throughput: number;
}
export interface CacheConfig {
    defaultTTL: number;
    maxSize: number;
    compressionEnabled: boolean;
    lazyLoading: boolean;
    preloadPatterns: string[];
    evictionPolicy: 'LRU' | 'LFU' | 'TTL';
}
export interface OptimizationRule {
    id: string;
    name: string;
    condition: (metrics: PerformanceMetrics) => boolean;
    action: () => Promise<void>;
    priority: number;
    enabled: boolean;
}
export declare class PerformanceOptimizerV3Service {
    private static instance;
    private metrics;
    private cacheConfig;
    private optimizationRules;
    private performanceHistory;
    private isOptimizing;
    private db;
    constructor();
    static getInstance(): PerformanceOptimizerV3Service;
    private initializeMetrics;
    private initializeCacheConfig;
    private initializeOptimizationRules;
    private startPerformanceMonitoring;
    private collectMetrics;
    private getCPUUsage;
    private getAverageResponseTime;
    private getCacheHitRate;
    private getConnectionPoolUsage;
    private getAverageQueryTime;
    private getCompressionRatio;
    private getThroughput;
    private evaluateOptimizationRules;
    private optimizeMemoryUsage;
    private optimizeResponseTime;
    private optimizeCacheStrategy;
    private optimizeConnectionPool;
    private optimizeDatabaseQueries;
    private clearOldCacheEntries;
    private optimizeDatabaseConnections;
    private enableResponseCompression;
    private enableLazyLoading;
    private adjustCacheTTL;
    private preloadFrequentData;
    private optimizeCacheEviction;
    private adjustConnectionPoolSize;
    private closeIdleConnections;
    private optimizeConnectionTimeout;
    private enableQueryCaching;
    private optimizeSlowQueries;
    private addDatabaseIndexes;
    getPerformanceMetrics(): Promise<PerformanceMetrics>;
    getPerformanceHistory(): Promise<PerformanceMetrics[]>;
    getOptimizationRules(): Promise<OptimizationRule[]>;
    updateOptimizationRule(ruleId: string, updates: Partial<OptimizationRule>): Promise<boolean>;
    forceOptimization(): Promise<void>;
    getHealthStatus(): Promise<{
        status: string;
        metrics: PerformanceMetrics;
        recommendations: string[];
    }>;
}
export declare const performanceOptimizerV3: PerformanceOptimizerV3Service;
//# sourceMappingURL=performance-optimizer-v3.service.d.ts.map