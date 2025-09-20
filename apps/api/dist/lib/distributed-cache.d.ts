export interface CacheConfig {
    ttl: number;
    maxSize: number;
    strategy: 'lru' | 'lfu' | 'fifo';
    compression: boolean;
    encryption: boolean;
}
export interface CacheItem<T = any> {
    key: string;
    value: T;
    ttl: number;
    createdAt: Date;
    expiresAt: Date;
    accessCount: number;
    lastAccessed: Date;
    size: number;
}
export interface CacheStats {
    hits: number;
    misses: number;
    evictions: number;
    size: number;
    maxSize: number;
    hitRate: number;
    memoryUsage: number;
}
export declare class DistributedCache {
    private cache;
    private config;
    private stats;
    private cleanupInterval;
    private compressionEnabled;
    private encryptionEnabled;
    constructor(config?: Partial<CacheConfig>);
    set<T>(key: string, value: T, ttl?: number): Promise<void>;
    get<T>(key: string): Promise<T | null>;
    delete(key: string): Promise<boolean>;
    has(key: string): boolean;
    clear(): Promise<void>;
    getStats(): CacheStats;
    getSize(): number;
    getMemoryUsage(): number;
    private evict;
    private evictLRU;
    private evictLFU;
    private evictFIFO;
    private cleanup;
    private updateStats;
    private serialize;
    private deserialize;
    private calculateSize;
    private recordSetMetrics;
    private recordGetMetrics;
    private recordDeleteMetrics;
    private recordClearMetrics;
    destroy(): void;
}
export declare const cacheMetrics: {
    cacheHitsTotal: any;
    cacheMissesTotal: any;
    cacheSetTotal: any;
    cacheDeleteTotal: any;
    cacheClearTotal: any;
    cacheSize: any;
    cacheMemoryUsage: any;
    cacheHitRate: any;
    cacheGetDuration: any;
    cacheSetDuration: any;
    cacheDeleteDuration: any;
    cacheClearDuration: any;
};
export declare const distributedCache: DistributedCache;
//# sourceMappingURL=distributed-cache.d.ts.map