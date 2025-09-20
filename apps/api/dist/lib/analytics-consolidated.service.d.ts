import { AnalyticsMetric, StatisticalAnalysis, CreateMetricRequest, UpdateMetricRequest, AnalyticsConfig } from './analytics-types.js';
export interface PerformanceConfig {
    enabled: boolean;
    latencyThreshold: number;
    memoryThreshold: number;
    cpuThreshold: number;
    responseTimeThreshold: number;
    errorRateThreshold: number;
    gcThreshold: number;
    cacheSizeLimit: number;
    connectionLimit: number;
    enableLazyLoading: boolean;
    enableServicePooling: boolean;
    enableMemoryOptimization: boolean;
    enableQueryOptimization: boolean;
    enableResponseCompression: boolean;
    enableCacheOptimization: boolean;
}
export interface PerformanceMetrics {
    memoryUsage: {
        rss: number;
        heapTotal: number;
        heapUsed: number;
        external: number;
        arrayBuffers: number;
    };
    cpuUsage: {
        user: number;
        system: number;
    };
    eventLoop: {
        lag: number;
        utilization: number;
    };
    gc: {
        major: number;
        minor: number;
        duration: number;
    };
    connections: {
        active: number;
        idle: number;
        total: number;
    };
    cache: {
        hitRate: number;
        size: number;
        evictions: number;
    };
    queries: {
        total: number;
        slow: number;
        averageTime: number;
    };
    responses: {
        total: number;
        compressed: number;
        averageSize: number;
    };
}
export interface OptimizationResult {
    type: 'memory' | 'cpu' | 'latency' | 'cache' | 'query' | 'connection';
    action: string;
    impact: 'low' | 'medium' | 'high';
    duration: number;
    before: any;
    after: any;
    success: boolean;
    error?: string;
}
export interface BIDashboard {
    id: string;
    name: string;
    description: string;
    widgets: BIWidget[];
    layout: BILayout;
    filters: BIFilter[];
    organizationId: string;
    isPublic: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface BIWidget {
    id: string;
    type: 'chart' | 'table' | 'metric' | 'kpi' | 'map' | 'gauge';
    title: string;
    dataSource: string;
    configuration: any;
    position: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
}
export interface BILayout {
    columns: number;
    rows: number;
    responsive: boolean;
}
export interface BIFilter {
    id: string;
    field: string;
    operator: string;
    value: any;
    label: string;
}
export declare class AnalyticsConsolidatedService {
    private config;
    private performanceConfig;
    private metrics;
    private trends;
    private anomalies;
    private performanceMetrics;
    private optimizations;
    private isOptimizing;
    private optimizationInterval;
    private biDashboards;
    constructor(analyticsConfig?: Partial<AnalyticsConfig>, performanceConfig?: Partial<PerformanceConfig>);
    createMetric(request: CreateMetricRequest, organizationId: string): Promise<AnalyticsMetric>;
    updateMetric(metricId: string, request: UpdateMetricRequest): Promise<AnalyticsMetric | null>;
    getMetric(metricId: string): Promise<AnalyticsMetric | null>;
    getMetrics(organizationId: string, filters?: {
        type?: string;
        category?: string;
        status?: string;
        tags?: string[];
    }): Promise<AnalyticsMetric[]>;
    deleteMetric(metricId: string): Promise<boolean>;
    recordMetric(metricId: string, value: number, metadata?: Record<string, any>): Promise<void>;
    private processRealTimeData;
    private initializePerformanceMetrics;
    private startPerformanceMonitoring;
    private updatePerformanceMetrics;
    private checkAndOptimize;
    private analyzePerformance;
    private optimize;
    createBIDashboard(dashboard: Omit<BIDashboard, 'id' | 'createdAt' | 'updatedAt'>): Promise<BIDashboard>;
    getBIDashboard(dashboardId: string): Promise<BIDashboard | null>;
    getBIDashboards(organizationId: string): Promise<BIDashboard[]>;
    updateBIDashboard(dashboardId: string, updates: Partial<BIDashboard>): Promise<BIDashboard | null>;
    deleteBIDashboard(dashboardId: string): Promise<boolean>;
    performStatisticalAnalysis(metricId: string, dataPoints: number[]): Promise<StatisticalAnalysis>;
    private generateId;
    private calculateMedian;
    private calculateMode;
    private calculateVariance;
    private calculateSkewness;
    private calculateKurtosis;
    private calculatePercentile;
    private optimizeMemory;
    private optimizeCPU;
    private optimizeLatency;
    private optimizeCache;
    private optimizeQueries;
    private optimizeConnections;
    private clearOldCacheEntries;
    private enableLazyLoading;
    private optimizeServicePools;
    private optimizeEventLoop;
    private enableResponseCompression;
    private optimizeCacheStrategy;
    private optimizeSlowQueries;
    private optimizeConnectionPool;
    private getEventLoopLag;
    private getEventLoopUtilization;
    private getGCMetrics;
    private getConnectionMetrics;
    private getCacheMetrics;
    private getQueryMetrics;
    private getResponseMetrics;
    private updatePrometheusMetrics;
    private updateTrendAnalysis;
    private detectAnomalies;
    private updateForecasts;
    getServiceStats(): Promise<{
        analytics: {
            totalMetrics: number;
            totalTrends: number;
            totalAnomalies: number;
            config: AnalyticsConfig;
        };
        performance: {
            metrics: PerformanceMetrics;
            optimizations: OptimizationResult[];
            config: PerformanceConfig;
        };
        bi: {
            totalDashboards: number;
        };
    }>;
    forceOptimization(type?: string): Promise<OptimizationResult[]>;
    updateConfig(analyticsConfig?: Partial<AnalyticsConfig>, performanceConfig?: Partial<PerformanceConfig>): void;
    stop(): void;
}
export declare const analyticsConsolidated: AnalyticsConsolidatedService;
//# sourceMappingURL=analytics-consolidated.service.d.ts.map