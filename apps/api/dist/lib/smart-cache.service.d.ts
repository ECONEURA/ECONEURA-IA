import { CacheConfig, CacheEntry, CacheMetrics, CacheWarmingRequest, CacheWarmingStatus, CacheInvalidationRequest, CacheCompressionRequest, CacheStats } from './warmup-types.js';
export declare class SmartCacheService {
    private caches;
    private cacheEntries;
    private cacheMetrics;
    private warmingStatuses;
    constructor();
    getCacheConfigs(organizationId: string): Promise<CacheConfig[]>;
    getCacheConfig(id: string): Promise<CacheConfig | null>;
    createCacheConfig(config: Omit<CacheConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<CacheConfig>;
    updateCacheConfig(id: string, updates: Partial<CacheConfig>): Promise<CacheConfig | null>;
    deleteCacheConfig(id: string): Promise<boolean>;
    getCacheEntry(cacheId: string, key: string): Promise<CacheEntry | null>;
    setCacheEntry(cacheId: string, key: string, value: any, ttl?: number): Promise<void>;
    deleteCacheEntry(cacheId: string, key: string): Promise<boolean>;
    getCacheMetrics(cacheId: string): Promise<CacheMetrics | null>;
    warmupCache(request: CacheWarmingRequest): Promise<CacheWarmingStatus>;
    getCacheWarmingStatus(warmingId: string): Promise<CacheWarmingStatus | null>;
    invalidateCache(request: CacheInvalidationRequest): Promise<number>;
    compressCache(request: CacheCompressionRequest): Promise<number>;
    getCacheStats(organizationId: string): Promise<CacheStats>;
    private executeCacheWarming;
    private enforceCacheSizeLimit;
    private evictEntries;
    private getLRUEntries;
    private getLFUEntries;
    private getTTLEntries;
    private getRandomEntries;
    private isEntryExpired;
    private calculateEntrySize;
    private calculateTotalCacheSize;
    private simulateCompression;
    private updateCacheMetrics;
    private initializeCacheMetrics;
    private initializeDefaultCaches;
    private generateId;
}
//# sourceMappingURL=smart-cache.service.d.ts.map