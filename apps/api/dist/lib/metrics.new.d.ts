export declare class MetricsService {
    private healthCheckCounter;
    private healthCheckDuration;
    private metricsInitialized;
    constructor();
    private initializeMetrics;
    incrementHealthCheck(type: string, status?: string): void;
    recordHealthCheckDuration(type: string, durationMs: number, status?: string): void;
    getMetrics(): Promise<string>;
    getMetricsContentType(): Promise<string>;
    clearMetrics(): void;
}
export declare const metrics: MetricsService;
//# sourceMappingURL=metrics.new.d.ts.map