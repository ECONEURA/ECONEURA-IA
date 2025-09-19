export interface MetricData {
    timestamp: Date;
    value: number;
    metadata?: Record<string, any>;
}
export interface DimensionData {
    dimension: string;
    value: string | number;
    count: number;
    percentage: number;
}
export interface AnalyticsResult {
    metrics: Record<string, MetricData[]>;
    dimensions: Record<string, DimensionData[]>;
    summary: {
        totalRecords: number;
        timeRange: string;
        lastUpdated: Date;
    };
}
export interface Dashboard {
    id: string;
    name: string;
    description?: string;
    userId: string;
    orgId: string;
    widgets: Widget[];
    createdAt: Date;
    updatedAt: Date;
}
export interface Widget {
    id: string;
    type: 'chart' | 'metric' | 'table' | 'heatmap' | 'funnel';
    title: string;
    query: AnalyticsQuery;
    position: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    config?: Record<string, any>;
}
export interface AnalyticsQuery {
    metrics: string[];
    dimensions?: string[];
    filters?: Filter[];
    timeRange: 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';
    startDate?: string;
    endDate?: string;
    groupBy?: string[];
    orderBy?: Array<{
        field: string;
        direction: 'asc' | 'desc';
    }>;
    limit?: number;
}
export interface Filter {
    field: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'between';
    value: string | number | Array<string | number>;
}
export interface Report {
    id: string;
    name: string;
    description?: string;
    userId: string;
    orgId: string;
    query: AnalyticsQuery;
    schedule?: {
        frequency: 'daily' | 'weekly' | 'monthly';
        time: string;
        recipients: string[];
    };
    createdAt: Date;
    updatedAt: Date;
}
export interface IAnalyticsSystem {
    getMetrics(query: AnalyticsQuery): Promise<AnalyticsResult>;
    getRealTimeMetrics(metrics: string[]): Promise<Record<string, number>>;
    createDashboard(dashboard: Omit<Dashboard, 'id' | 'createdAt' | 'updatedAt'>): Promise<Dashboard>;
    getDashboard(id: string): Promise<Dashboard | null>;
    listDashboards(userId: string, orgId: string): Promise<Dashboard[]>;
    updateDashboard(id: string, updates: Partial<Dashboard>): Promise<Dashboard>;
    deleteDashboard(id: string): Promise<void>;
    createReport(report: Omit<Report, 'id' | 'createdAt' | 'updatedAt'>): Promise<Report>;
    getReport(id: string): Promise<Report | null>;
    listReports(userId: string, orgId: string): Promise<Report[]>;
    updateReport(id: string, updates: Partial<Report>): Promise<Report>;
    deleteReport(id: string): Promise<void>;
    generateReport(id: string): Promise<AnalyticsResult>;
    getSampleData(): Promise<Record<string, any>>;
    getAvailableMetrics(): Promise<string[]>;
    getAvailableDimensions(): Promise<string[]>;
}
export declare class AnalyticsSystemImpl implements IAnalyticsSystem {
    private dashboards;
    private reports;
    private sampleData;
    constructor();
    getMetrics(query: AnalyticsQuery): Promise<AnalyticsResult>;
    getRealTimeMetrics(metrics: string[]): Promise<Record<string, number>>;
    createDashboard(dashboard: Omit<Dashboard, 'id' | 'createdAt' | 'updatedAt'>): Promise<Dashboard>;
    getDashboard(id: string): Promise<Dashboard | null>;
    listDashboards(userId: string, orgId: string): Promise<Dashboard[]>;
    updateDashboard(id: string, updates: Partial<Dashboard>): Promise<Dashboard>;
    deleteDashboard(id: string): Promise<void>;
    createReport(report: Omit<Report, 'id' | 'createdAt' | 'updatedAt'>): Promise<Report>;
    getReport(id: string): Promise<Report | null>;
    listReports(userId: string, orgId: string): Promise<Report[]>;
    updateReport(id: string, updates: Partial<Report>): Promise<Report>;
    deleteReport(id: string): Promise<void>;
    generateReport(id: string): Promise<AnalyticsResult>;
    getSampleData(): Promise<Record<string, any>>;
    getAvailableMetrics(): Promise<string[]>;
    getAvailableDimensions(): Promise<string[]>;
    private initializeSampleData;
    private generateMetricData;
    private generateDimensionData;
    private generateRealTimeValue;
    private getBaseValueForMetric;
    private getTimeInterval;
    private applyFilters;
    private applyOrdering;
    private applyLimit;
    private calculateTotalRecords;
}
export declare const analyticsSystem: AnalyticsSystemImpl;
//# sourceMappingURL=analytics.d.ts.map