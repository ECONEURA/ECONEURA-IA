export interface CacheStats {
    hits: number;
    misses: number;
    hitRate: number;
    size: number;
    ttl: number;
}
export interface WarmupResult {
    service: string;
    success: boolean;
    duration: number;
    itemsWarmed: number;
    error?: string;
}
export interface CacheItem {
    value: any;
    expires: number;
}
export declare class CacheWarmupService {
    private cache;
    private stats;
    private isWarmingUp;
    constructor();
    private startCleanupInterval;
    private cleanupExpired;
    warmupAll(): Promise<WarmupResult[]>;
    private warmupUserSessions;
    private warmupFinancialData;
    private warmupSystemMetrics;
    private warmupApiEndpoints;
    set(key: string, value: any, ttlSeconds: number): void;
    get(key: string): any | undefined;
    has(key: string): boolean;
    delete(key: string): boolean;
    clear(): void;
    getStats(): CacheStats;
    isWarmingUpStatus(): boolean;
}
export declare const cacheWarmupService: CacheWarmupService;
//# sourceMappingURL=cache-warmup.service.d.ts.map