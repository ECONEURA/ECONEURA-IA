export interface WarmupConfig {
    enabled: boolean;
    timeout: number;
    retries: number;
    services: string[];
    endpoints: string[];
    cacheWarmup: boolean;
    dbWarmup: boolean;
    aiWarmup: boolean;
}
export interface WarmupResult {
    service: string;
    status: 'success' | 'error' | 'timeout';
    duration: number;
    error?: string;
    metrics?: Record<string, any>;
}
export declare class WarmupSystemService {
    private config;
    private results;
    private isWarmingUp;
    private warmupStartTime;
    constructor(config?: Partial<WarmupConfig>);
    startWarmup(): Promise<Map<string, WarmupResult>>;
    private warmupDatabase;
    private warmupCache;
    private warmupAIRouter;
    private warmupAnalytics;
    private warmupSecurity;
    private warmupFinOps;
    private warmupHealthMonitor;
    private warmupEndpoints;
    private preloadDatabaseSchemas;
    private preloadCacheData;
    private preloadAIModels;
    private preloadAnalyticsData;
    private preloadSecurityPolicies;
    private preloadFinOpsData;
    private preloadHealthMonitors;
    private preloadCriticalEndpoints;
    getWarmupStatus(): {
        isWarmingUp: boolean;
        results: Record<string, WarmupResult>;
        totalDuration: number;
        successRate: number;
    };
    restartWarmup(): Promise<Map<string, WarmupResult>>;
}
export declare const warmupSystem: WarmupSystemService;
//# sourceMappingURL=warmup-system.service.d.ts.map