export interface HealthCheck {
    name: string;
    status: 'healthy' | 'unhealthy' | 'degraded';
    message?: string;
    details?: Record<string, unknown>;
    responseTime?: number;
    lastChecked: Date;
}
export interface ServiceHealth {
    name: string;
    status: 'up' | 'down' | 'degraded';
    checks: HealthCheck[];
    overallStatus: 'healthy' | 'unhealthy' | 'degraded';
    lastChecked: Date;
    uptime: number;
    version?: string;
}
export interface SystemHealth {
    status: 'healthy' | 'unhealthy' | 'degraded';
    services: ServiceHealth[];
    timestamp: Date;
    uptime: number;
    version: string;
    environment: string;
    metrics: {
        totalRequests: number;
        errorRate: number;
        averageResponseTime: number;
        activeConnections: number;
        memoryUsage: number;
        cpuUsage: number;
    };
}
export declare class HealthMonitor {
    private static instance;
    private services;
    private checks;
    private startTime;
    private metrics;
    static getInstance(): HealthMonitor;
    constructor();
    private initializeDefaultChecks;
    private startPeriodicHealthChecks;
    addCheck(name: string, checkFunction: () => Promise<HealthCheck>): void;
    removeCheck(name: string): void;
    runCheck(name: string): Promise<HealthCheck | null>;
    runAllChecks(): Promise<HealthCheck[]>;
    private updateServiceHealth;
    getServiceHealth(serviceName: string): ServiceHealth | null;
    getAllServicesHealth(): ServiceHealth[];
    getSystemHealth(): SystemHealth;
    recordRequest(responseTime: number, isError?: boolean): void;
    setActiveConnections(count: number): void;
    getLivenessProbe(): Promise<{
        status: string;
        timestamp: string;
    }>;
    getReadinessProbe(): Promise<{
        status: string;
        timestamp: string;
        checks: HealthCheck[];
    }>;
    getHealthCheck(): Promise<SystemHealth>;
    getDetailedHealth(): Promise<{
        system: SystemHealth;
        services: ServiceHealth[];
        checks: HealthCheck[];
        metrics: {
            cache: Record<string, any>;
            performance: {
                responseTime: {
                    min: number;
                    max: number;
                    avg: number;
                    p95: number;
                    p99: number;
                };
                throughput: number;
                errorRate: number;
            };
        };
    }>;
    private calculatePercentile;
    private alertThresholds;
    checkAlertConditions(): Array<{
        type: string;
        message: string;
        severity: 'warning' | 'critical';
    }>;
}
export declare const healthMonitor: HealthMonitor;
//# sourceMappingURL=health-monitor.d.ts.map