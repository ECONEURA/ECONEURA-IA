export interface CacheConfig {
    type: 'memory' | 'redis';
    ttl: number;
    maxSize?: number;
    redisUrl?: string;
}
export interface CacheItem<T = any> {
    value: T;
    timestamp: number;
    ttl: number;
    accessCount: number;
    lastAccessed: number;
}
export declare class IntelligentCache {
    private memoryCache;
    private config;
    private stats;
    constructor(config: CacheConfig);
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T, ttl?: number): Promise<void>;
    delete(key: string): Promise<void>;
    clear(): Promise<void>;
    warmup(patterns: Array<{
        key: string;
        value: any;
        ttl?: number;
    }>): Promise<void>;
    getStats(): {
        size: number;
        maxSize: number;
        hitRate: number;
        hits: number;
        misses: number;
        sets: number;
        deletes: number;
        warmupItems: number;
    };
    private evictLeastUsed;
}
export declare class AICache extends IntelligentCache {
    constructor(config: CacheConfig);
    getAIResponse(prompt: string, model: string): Promise<any | null>;
    setAIResponse(prompt: string, model: string, response: any, ttl?: number): Promise<void>;
    warmupAI(): Promise<void>;
    private hashPrompt;
}
export declare class SearchCache extends IntelligentCache {
    constructor(config: CacheConfig);
    getSearchResults(query: string, filters?: any): Promise<any | null>;
    setSearchResults(query: string, results: any, filters?: any, ttl?: number): Promise<void>;
    warmupSearch(): Promise<void>;
    private hashQuery;
}
export declare class CacheManager {
    private aiCache;
    private searchCache;
    private warmupInterval;
    constructor();
    getAICache(): AICache;
    getSearchCache(): SearchCache;
    warmupAll(): Promise<void>;
    startPeriodicWarmup(intervalMinutes?: number): void;
    stopPeriodicWarmup(): void;
    getStats(): {
        ai: {
            size: number;
            maxSize: number;
            hitRate: number;
            hits: number;
            misses: number;
            sets: number;
            deletes: number;
            warmupItems: number;
        };
        search: {
            size: number;
            maxSize: number;
            hitRate: number;
            hits: number;
            misses: number;
            sets: number;
            deletes: number;
            warmupItems: number;
        };
    };
}
//# sourceMappingURL=cache.d.ts.map