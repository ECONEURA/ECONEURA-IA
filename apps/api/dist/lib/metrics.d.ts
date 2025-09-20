export declare class MetricsService {
    private healthCheckCounter;
    private healthCheckDuration;
    private metricsInitialized;
    constructor();
    private initializeMetrics;
    incrementHealthCheck(type: string, status?: string): void;
    recordHealthCheckDuration(type: string, durationMs: number, status?: string): void;
    getMetrics(): Promise<string>;
    getPrometheusMetrics(): Promise<string>;
    getMetricsSummary(): Record<string, unknown>;
    getAllMetrics(): Record<string, unknown>;
    exportPrometheus(): Promise<string>;
    getMetricsStats(): Record<string, unknown>;
    recordHttpRequest(route: string, method: string, statusCode: number, durationMs: number, org?: string): void;
    increment(name: string, valueOrLabels?: number | Record<string, string>, maybeLabels?: Record<string, string>): void;
    recordRateLimit(route: string, org?: string): void;
    recordSystemMetrics(): void;
    cleanup(): void;
    getMetricsContentType(): Promise<string>;
    clearMetrics(): void;
}
export declare const metrics: MetricsService;
//# sourceMappingURL=metrics.d.ts.map