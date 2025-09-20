export interface CacheConfig {
    defaultTTL: number;
    maxSize: number;
    cleanupInterval: number;
    enableMetrics: boolean;
}
export interface CacheMetrics {
    hits: number;
    misses: number;
    sets: number;
    deletes: number;
    size: number;
    hitRate: number;
    memoryUsage: number;
}
export interface CacheEntry<T = any> {
    value: T;
    expiresAt: number;
    createdAt: number;
    accessCount: number;
    lastAccessed: number;
}
export declare class CacheService {
    private cache;
    private metrics;
    private config;
    private cleanupTimer?;
    constructor(config?: Partial<CacheConfig>);
    get<T>(key: string): T | null;
    set<T>(key: string, value: T, ttl?: number): void;
    delete(key: string): boolean;
    has(key: string): boolean;
    clear(): void;
    mget<T>(keys: string[]): Record<string, T | null>;
    mset<T>(entries: Record<string, T>, ttl?: number): void;
    getOrSet<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T>;
    invalidatePattern(pattern: string): number;
    getMetrics(): CacheMetrics;
    getStats(): any;
    setTTLPattern(pattern: string, ttl: number): void;
    export(): Record<string, any>;
    import(data: Record<string, any>): void;
    private evictLRU;
    private updateHitRate;
    private updateMetrics;
    private estimateMemoryUsage;
    private startCleanupTimer;
    private cleanup;
    destroy(): void;
}
export declare const cacheService: CacheService;
export declare const cacheMiddleware: (ttl?: number) => (req: any, res: any, next: any) => any;
export declare function Cached(ttl?: number, keyGenerator?: (...args: any[]) => string): (target: any, propertyName: string, descriptor: PropertyDescriptor) => void;
//# sourceMappingURL=cache.service.d.ts.map