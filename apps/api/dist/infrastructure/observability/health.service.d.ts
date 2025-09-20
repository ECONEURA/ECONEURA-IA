import { HealthIndicatorResult } from '@nestjs/terminus';
export interface HealthCheckConfig {
    name: string;
    timeout: number;
    interval: number;
    retries: number;
    critical: boolean;
}
export interface HealthStatus {
    status: 'healthy' | 'unhealthy' | 'degraded';
    timestamp: string;
    uptime: number;
    version: string;
    environment: string;
    checks: Record<string, HealthIndicatorResult>;
    metrics: {
        memory: {
            used: number;
            total: number;
            percentage: number;
        };
        cpu: {
            usage: number;
            load: number[];
        };
        disk: {
            used: number;
            total: number;
            percentage: number;
        };
    };
}
export declare class HealthService {
    private static instance;
    private healthChecks;
    private lastCheckResults;
    private startTime;
    private constructor();
    static getInstance(): HealthService;
    private initializeHealthChecks;
    checkDatabase(): Promise<HealthIndicatorResult>;
    checkRedis(): Promise<HealthIndicatorResult>;
    checkExternalAPIs(): Promise<HealthIndicatorResult>;
    checkStorage(): Promise<HealthIndicatorResult>;
    checkMemory(): Promise<HealthIndicatorResult>;
    checkDisk(): Promise<HealthIndicatorResult>;
    getHealthStatus(): Promise<HealthStatus>;
    getDatabaseHealth(): Promise<HealthIndicatorResult>;
    getRedisHealth(): Promise<HealthIndicatorResult>;
    getExternalAPIsHealth(): Promise<HealthIndicatorResult>;
    getStorageHealth(): Promise<HealthIndicatorResult>;
    getMemoryHealth(): Promise<HealthIndicatorResult>;
    getDiskHealth(): Promise<HealthIndicatorResult>;
    addHealthCheck(name: string, config: HealthCheckConfig): void;
    removeHealthCheck(name: string): void;
    getHealthCheckConfig(name: string): HealthCheckConfig | undefined;
    getAllHealthCheckConfigs(): Map<string, HealthCheckConfig>;
    startHealthMonitoring(): void;
    getLastCheckResults(): Map<string, HealthIndicatorResult>;
    getLivenessProbe(): Promise<{
        status: string;
        timestamp: string;
    }>;
    getReadinessProbe(): Promise<{
        status: string;
        timestamp: string;
        checks: string[];
    }>;
    getStartupProbe(): Promise<{
        status: string;
        timestamp: string;
        uptime: number;
    }>;
}
export declare const healthService: HealthService;
//# sourceMappingURL=health.service.d.ts.map