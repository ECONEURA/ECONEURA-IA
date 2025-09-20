export interface MemoryConfig {
    enabled: boolean;
    maxMemoryMB: number;
    gcThreshold: number;
    cacheCleanupThreshold: number;
    leakDetectionEnabled: boolean;
    compressionEnabled: boolean;
    heapOptimizationEnabled: boolean;
    monitoringInterval: number;
    gcInterval: number;
    cacheCleanupInterval: number;
    maxCacheAge: number;
    compressionThreshold: number;
}
export interface MemoryMetrics {
    total: number;
    used: number;
    free: number;
    heap: {
        total: number;
        used: number;
        free: number;
        external: number;
        arrayBuffers: number;
    };
    rss: number;
    external: number;
    arrayBuffers: number;
    gc: {
        major: number;
        minor: number;
        duration: number;
        lastGC: number;
    };
    cache: {
        size: number;
        entries: number;
        hitRate: number;
        evictions: number;
    };
    leaks: {
        detected: number;
        suspected: number;
        resolved: number;
    };
    compression: {
        compressed: number;
        savings: number;
        ratio: number;
    };
}
export interface MemoryLeak {
    id: string;
    type: 'object' | 'array' | 'function' | 'closure' | 'timer' | 'event';
    size: number;
    location: string;
    firstDetected: number;
    lastSeen: number;
    count: number;
    stackTrace?: string;
}
export interface GCAction {
    type: 'minor' | 'major' | 'incremental' | 'full';
    duration: number;
    freed: number;
    before: number;
    after: number;
    timestamp: number;
}
export declare class MemoryManagerService {
    private config;
    private metrics;
    private leaks;
    private gcHistory;
    private monitoringInterval;
    private gcInterval;
    private cacheCleanupInterval;
    private isOptimizing;
    private lastGC;
    private gcCount;
    constructor(config?: Partial<MemoryConfig>);
    private initializeMetrics;
    private setupGCHooks;
    private startMonitoring;
    private updateMetrics;
    private checkMemoryHealth;
    private optimizeMemory;
    private performGarbageCollection;
    private recordGCAction;
    private cleanupCache;
    private optimizeHeap;
    private resolveMemoryLeaks;
    private detectMemoryLeaks;
    private clearOldCacheEntries;
    private compressCacheData;
    private defragmentHeap;
    private optimizeObjectLayout;
    private resolveLeak;
    private updatePrometheusMetrics;
    getStatus(): {
        enabled: boolean;
        isOptimizing: boolean;
        metrics: MemoryMetrics;
        leaks: MemoryLeak[];
        gcHistory: GCAction[];
        config: MemoryConfig;
    };
    forceOptimization(type?: 'gc' | 'cache' | 'heap' | 'leaks'): Promise<void>;
    updateConfig(newConfig: Partial<MemoryConfig>): void;
    stop(): void;
}
export declare const memoryManager: MemoryManagerService;
//# sourceMappingURL=memory-manager.service.d.ts.map