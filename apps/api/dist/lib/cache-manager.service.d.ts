export declare enum CacheLevel {
    MEMORY = "memory",
    REDIS = "redis",
    DATABASE = "database"
}
export declare enum CacheStrategy {
    LRU = "lru",
    LFU = "lfu",
    TTL = "ttl",
    WRITE_THROUGH = "write_through",
    WRITE_BACK = "write_back"
}
export interface CacheConfig {
    level: CacheLevel;
    strategy: CacheStrategy;
    ttl: number;
    maxSize: number;
    compression: boolean;
    encryption: boolean;
    namespace: string;
}
export interface CacheEntry<T = any> {
    key: string;
    value: T;
    timestamp: number;
    ttl: number;
    accessCount: number;
    lastAccessed: number;
    compressed: boolean;
    encrypted: boolean;
    metadata?: Record<string, any>;
}
export interface CacheStats {
    hits: number;
    misses: number;
    hitRate: number;
    totalSize: number;
    entryCount: number;
    evictions: number;
    compressionRatio: number;
    averageAccessTime: number;
}
export declare class CacheManagerService {
    private static instance;
    private memoryCache;
    private configs;
    private stats;
    private compressionEnabled;
    private encryptionEnabled;
    private constructor();
    static getInstance(): CacheManagerService;
    private initializeDefaultConfigs;
    get<T>(key: string, namespace?: string): Promise<T | null>;
    set<T>(key: string, value: T, namespace?: string, customTtl?: number): Promise<boolean>;
    delete(key: string, namespace?: string): Promise<boolean>;
    invalidateNamespace(namespace: string): Promise<number>;
    invalidatePattern(pattern: string, namespace?: string): Promise<number>;
    getStats(namespace?: string): CacheStats | Record<string, CacheStats>;
    cleanup(): Promise<number>;
    private buildKey;
    private isExpired;
    private evictEntries;
    private compress;
    private decompress;
    private recordHit;
    private recordMiss;
    private recordSet;
    private recordEviction;
    private getOrCreateStats;
    private createEmptyStats;
    private getDefaultConfig;
    private startCleanupInterval;
    private startStatsCollection;
    private updateStats;
}
export declare const cacheManagerService: CacheManagerService;
//# sourceMappingURL=cache-manager.service.d.ts.map