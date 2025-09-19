export interface PerformanceMetric {
    id: string;
    name: string;
    type: 'counter' | 'gauge' | 'histogram' | 'summary';
    value: number;
    labels: Record<string, string>;
    timestamp: Date;
    metadata?: Record<string, any>;
}
export interface PerformanceAlert {
    id: string;
    name: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    condition: {
        metric: string;
        operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
        threshold: number;
        timeWindow: number;
    };
    enabled: boolean;
    actions: {
        type: 'email' | 'webhook' | 'slack' | 'pagerduty';
        config: Record<string, any>;
    }[];
    createdAt: Date;
    updatedAt: Date;
}
export interface PerformanceDashboard {
    id: string;
    name: string;
    description: string;
    widgets: {
        id: string;
        type: 'chart' | 'gauge' | 'table' | 'alert';
        title: string;
        config: Record<string, any>;
        position: {
            x: number;
            y: number;
            width: number;
            height: number;
        };
    }[];
    isPublic: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface PerformanceReport {
    id: string;
    name: string;
    type: 'daily' | 'weekly' | 'monthly' | 'custom';
    metrics: string[];
    filters: Record<string, any>;
    schedule?: {
        enabled: boolean;
        cron: string;
        timezone: string;
    };
    recipients: string[];
    format: 'pdf' | 'html' | 'json' | 'csv';
    createdAt: Date;
    updatedAt: Date;
}
export interface PerformanceBaseline {
    id: string;
    metric: string;
    baseline: {
        mean: number;
        stdDev: number;
        percentiles: {
            p50: number;
            p90: number;
            p95: number;
            p99: number;
        };
    };
    seasonality?: {
        type: 'daily' | 'weekly' | 'monthly';
        pattern: number[];
    };
    calculatedAt: Date;
    validUntil: Date;
}
export interface PerformanceAnomaly {
    id: string;
    metric: string;
    type: 'spike' | 'drop' | 'trend' | 'seasonal';
    severity: 'low' | 'medium' | 'high' | 'critical';
    value: number;
    expectedValue: number;
    deviation: number;
    confidence: number;
    detectedAt: Date;
    resolvedAt?: Date;
    description: string;
}
export declare class AdvancedPerformanceMonitoringService {
    private metrics;
    private alerts;
    private dashboards;
    private reports;
    private baselines;
    private anomalies;
    private alertCheckInterval;
    private baselineCalculationInterval;
    private anomalyDetectionInterval;
    constructor();
    private initializeService;
    private startAlertChecking;
    private startBaselineCalculation;
    private startAnomalyDetection;
    recordMetric(metric: Omit<PerformanceMetric, 'id' | 'timestamp'>): Promise<PerformanceMetric>;
    private recordPrometheusMetric;
    getMetrics(filters?: {
        name?: string;
        type?: string;
        startTime?: Date;
        endTime?: Date;
        limit?: number;
    }): Promise<PerformanceMetric[]>;
    createAlert(alert: Omit<PerformanceAlert, 'id' | 'createdAt' | 'updatedAt'>): Promise<PerformanceAlert>;
    getAlerts(): Promise<PerformanceAlert[]>;
    updateAlert(id: string, updates: Partial<PerformanceAlert>): Promise<PerformanceAlert | null>;
    deleteAlert(id: string): Promise<boolean>;
    private checkAlerts;
    private triggerAlert;
    private executeAlertAction;
    createDashboard(dashboard: Omit<PerformanceDashboard, 'id' | 'createdAt' | 'updatedAt'>): Promise<PerformanceDashboard>;
    getDashboards(): Promise<PerformanceDashboard[]>;
    updateDashboard(id: string, updates: Partial<PerformanceDashboard>): Promise<PerformanceDashboard | null>;
    createReport(report: Omit<PerformanceReport, 'id' | 'createdAt' | 'updatedAt'>): Promise<PerformanceReport>;
    getReports(): Promise<PerformanceReport[]>;
    generateReport(reportId: string): Promise<{
        content: string;
        format: string;
    }>;
    private generateReportSummary;
    private calculatePercentile;
    private generateCSVReport;
    private generateHTMLReport;
    calculateBaselines(): Promise<void>;
    getBaselines(): Promise<PerformanceBaseline[]>;
    detectAnomalies(): Promise<void>;
    getAnomalies(filters?: {
        severity?: string;
        type?: string;
        resolved?: boolean;
        limit?: number;
    }): Promise<PerformanceAnomaly[]>;
    resolveAnomaly(id: string): Promise<boolean>;
    getStatistics(): Promise<{
        totalMetrics: number;
        totalAlerts: number;
        totalDashboards: number;
        totalReports: number;
        totalBaselines: number;
        totalAnomalies: number;
        activeAlerts: number;
        unresolvedAnomalies: number;
        metricsByType: Record<string, number>;
        alertsBySeverity: Record<string, number>;
        anomaliesByType: Record<string, number>;
    }>;
    private initializeDemoData;
    cleanup(): Promise<void>;
}
export declare const advancedPerformanceMonitoringService: AdvancedPerformanceMonitoringService;
//# sourceMappingURL=advanced-performance-monitoring.service.d.ts.map