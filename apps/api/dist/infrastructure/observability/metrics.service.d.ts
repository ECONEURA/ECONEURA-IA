import { Counter, Histogram, Gauge, Summary } from 'prom-client';
import { Request, Response } from 'express';
export interface MetricLabels {
    method?: string;
    route?: string;
    status_code?: string;
    service?: string;
    operation?: string;
    organization_id?: string;
    user_id?: string;
    error_type?: string;
    [key: string]: string | undefined;
}
export declare class MetricsService {
    private static instance;
    private metrics;
    private constructor();
    static getInstance(): MetricsService;
    private initializeMetrics;
    private startDefaultMetrics;
    recordHttpRequest(req: Request, res: Response, duration: number): void;
    recordBusinessOperation(operation: string, organizationId: string, duration: number, status?: string): void;
    recordUserLogin(organizationId: string, status?: string): void;
    updateUserCount(organizationId: string, status: string, role: string, count: number): void;
    updateOrganizationCount(subscriptionTier: string, status: string, count: number): void;
    recordError(errorType: string, service: string, operation: string): void;
    updateMemoryUsage(type: string, usage: number): void;
    updateCpuUsage(type: string, usage: number): void;
    recordDatabaseQuery(operation: string, table: string, duration: number): void;
    updateDatabaseConnections(state: string, count: number): void;
    recordCacheOperation(operation: string, status: string): void;
    updateCacheHitRatio(cacheType: string, ratio: number): void;
    recordExternalApiRequest(service: string, endpoint: string, statusCode: number, duration: number): void;
    createCounter(name: string, help: string, labelNames?: string[]): Counter;
    createHistogram(name: string, help: string, labelNames?: string[], buckets?: number[]): Histogram;
    createGauge(name: string, help: string, labelNames?: string[]): Gauge;
    createSummary(name: string, help: string, labelNames?: string[]): Summary;
    getMetrics(): Promise<string>;
    getMetricsAsJSON(): Promise<any>;
    resetMetrics(): void;
    getMetricsHealth(): {
        status: string;
        metrics: number;
    };
}
export declare const metrics: MetricsService;
//# sourceMappingURL=metrics.service.d.ts.map