export interface CacheOptions {
    ttl?: number;
    maxSize?: number;
    strategy?: 'lru' | 'lfu' | 'fifo';
    serialize?: boolean;
    compress?: boolean;
}
export interface CacheStats {
    hits: number;
    misses: number;
    sets: number;
    deletes: number;
    evictions: number;
    hitRate: number;
    size: number;
    maxSize: number;
    memoryUsage: number;
}
export interface CacheItem {
    value: any;
    timestamp: number;
    accessCount: number;
    lastAccessed: number;
}
export declare class AdvancedCache {
    private cache;
    private options;
    private stats;
    constructor(options?: CacheOptions);
    private cleanup;
    set(key: string, value: any): void;
    get(key: string): any | undefined;
    delete(key: string): boolean;
    private evict;
    private findLRU;
    private findLFU;
    private updateStats;
    getStats(): CacheStats;
    clear(): void;
    has(key: string): boolean;
    keys(): IterableIterator<string>;
    size(): number;
}
export declare const advancedCache: AdvancedCache;
//# sourceMappingURL=advanced-cache.d.ts.map