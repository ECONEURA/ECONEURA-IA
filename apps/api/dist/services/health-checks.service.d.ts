export interface HealthStatus {
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: Record<string, string>;
    timestamp: Date;
}
export declare class HealthChecksService {
    getHealthStatus(): Promise<HealthStatus>;
}
export declare const healthChecks: HealthChecksService;
//# sourceMappingURL=health-checks.service.d.ts.map