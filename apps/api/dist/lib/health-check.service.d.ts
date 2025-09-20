import { EventEmitter } from 'events';
export interface HealthCheckConfig {
    name: string;
    type: 'liveness' | 'readiness' | 'startup';
    timeout: number;
    interval: number;
    retries: number;
    critical: boolean;
    dependencies?: string[];
}
export interface HealthCheckResult {
    name: string;
    status: 'healthy' | 'unhealthy' | 'degraded';
    message: string;
    timestamp: string;
    duration: number;
    metadata?: Record<string, any>;
    dependencies?: HealthCheckResult[];
}
export interface SystemHealth {
    overall: 'healthy' | 'unhealthy' | 'degraded';
    checks: HealthCheckResult[];
    timestamp: string;
    uptime: number;
    version: string;
    environment: string;
}
export declare class HealthCheckService extends EventEmitter {
    private checks;
    private results;
    private timers;
    private isRunning;
    private startTime;
    constructor();
    private setupMetrics;
    registerCheck(name: string, config: HealthCheckConfig, checkFunction: () => Promise<{
        status: 'healthy' | 'unhealthy' | 'degraded';
        message: string;
        metadata?: Record<string, any>;
    }>): void;
    start(): Promise<void>;
    stop(): Promise<void>;
    private startCheck;
    private runCheck;
    private updateMetrics;
    getCheckResult(name: string): HealthCheckResult | null;
    getAllResults(): Map<string, HealthCheckResult>;
    getSystemHealth(): SystemHealth;
    runCheckManually(name: string): Promise<HealthCheckResult>;
    runAllChecks(): Promise<HealthCheckResult[]>;
    getLivenessStatus(): {
        status: 'alive' | 'dead';
        message: string;
    };
    getReadinessStatus(): {
        status: 'ready' | 'not_ready';
        message: string;
    };
}
export declare const healthCheckService: HealthCheckService;
//# sourceMappingURL=health-check.service.d.ts.map