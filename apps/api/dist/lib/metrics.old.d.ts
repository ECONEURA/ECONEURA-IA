export declare class MetricsService {
    private metrics;
    private readonly MAX_VALUES_PER_METRIC;
    private healthCheckCounter;
    private healthCheckDuration;
    constructor();
    private initializeDefaultMetrics;
    registerMetric(name: string, type: 'counter' | 'gauge' | 'histogram', description: string): void;
    increment(name: string, value?: number, labels?: Record<string, string>): void;
    gauge(name: string, value: number, labels?: Record<string, string>): void;
    histogram(name: string, value: number, labels?: Record<string, string>): void;
    private addValue;
    recordHttpRequest(method: string, path: string, statusCode: number, duration: number): void;
    recordAIRequest(model: string, provider: string, tokens: number, cost: number, duration: number): void;
    recordHealthCheck(service: string, status: string, duration: number): void;
    recordSystemMetrics(): void;
    recordRateLimit(data: {
        organizationId: string;
        allowed: boolean;
        strategy: string;
        remaining: number;
        requestId: string;
    }): void;
    private getOrganizationStats;
    getMetric(name: string): Metric | undefined;
    getAllMetrics(): Map<string, Metric>;
    getMetricsSummary(): any;
    exportPrometheus(): string;
    cleanup(maxAgeMs?: number): void;
    reset(): void;
    getMetricsStats(): any;
    getPrometheusMetrics(): string;
}
export declare const metrics: any;
//# sourceMappingURL=metrics.old.d.ts.map