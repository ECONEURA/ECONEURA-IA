import { z } from 'zod';
export interface DashboardWidget {
    id: string;
    type: 'chart' | 'metric' | 'table' | 'gauge' | 'map' | 'heatmap' | 'trend';
    title: string;
    description?: string;
    dataSource: string;
    configuration: {
        chartType?: 'line' | 'bar' | 'pie' | 'area' | 'scatter' | 'doughnut';
        metrics: string[];
        dimensions?: string[];
        filters?: Record<string, any>;
        timeRange?: string;
        refreshInterval?: number;
        colors?: string[];
        showLegend?: boolean;
        showDataLabels?: boolean;
        yAxisLabel?: string;
        xAxisLabel?: string;
    };
    position: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    isVisible: boolean;
    isEditable: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface Dashboard {
    id: string;
    name: string;
    description: string;
    widgets: DashboardWidget[];
    layout: {
        columns: number;
        rows: number;
        responsive: boolean;
        theme: 'light' | 'dark' | 'auto';
    };
    filters: DashboardFilter[];
    permissions: {
        isPublic: boolean;
        allowedUsers: string[];
        allowedRoles: string[];
    };
    organizationId: string;
    tags: string[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface DashboardFilter {
    id: string;
    field: string;
    label: string;
    type: 'select' | 'multiselect' | 'date' | 'daterange' | 'number' | 'text';
    options?: string[];
    defaultValue?: any;
    isRequired: boolean;
    validation?: {
        min?: number;
        max?: number;
        pattern?: string;
    };
}
export interface AnalyticsData {
    metrics: {
        totalUsers: number;
        activeUsers: number;
        totalSessions: number;
        averageSessionDuration: number;
        bounceRate: number;
        conversionRate: number;
        revenue: number;
        costPerAcquisition: number;
        returnOnInvestment: number;
    };
    trends: {
        users: Array<{
            date: string;
            value: number;
        }>;
        sessions: Array<{
            date: string;
            value: number;
        }>;
        revenue: Array<{
            date: string;
            value: number;
        }>;
        conversions: Array<{
            date: string;
            value: number;
        }>;
    };
    topPages: Array<{
        page: string;
        views: number;
        uniqueViews: number;
        bounceRate: number;
        avgTimeOnPage: number;
    }>;
    trafficSources: Array<{
        source: string;
        visits: number;
        percentage: number;
        conversionRate: number;
    }>;
    deviceBreakdown: Array<{
        device: string;
        percentage: number;
        sessions: number;
    }>;
    geographicData: Array<{
        country: string;
        region: string;
        visits: number;
        percentage: number;
    }>;
    realTimeData: {
        activeUsers: number;
        currentSessions: number;
        topPages: Array<{
            page: string;
            activeUsers: number;
        }>;
        topReferrers: Array<{
            referrer: string;
            visits: number;
        }>;
    };
}
export interface Report {
    id: string;
    name: string;
    description: string;
    type: 'analytics' | 'performance' | 'business' | 'custom';
    data: AnalyticsData;
    filters: Record<string, any>;
    timeRange: {
        start: Date;
        end: Date;
    };
    organizationId: string;
    isScheduled: boolean;
    schedule?: {
        frequency: 'daily' | 'weekly' | 'monthly';
        time: string;
        recipients: string[];
    };
    createdAt: Date;
    updatedAt: Date;
}
export interface Alert {
    id: string;
    name: string;
    description: string;
    metric: string;
    condition: {
        operator: 'greater_than' | 'less_than' | 'equals' | 'not_equals' | 'contains';
        value: number | string;
        threshold: number;
    };
    isActive: boolean;
    severity: 'low' | 'medium' | 'high' | 'critical';
    recipients: string[];
    organizationId: string;
    lastTriggered?: Date;
    triggerCount: number;
    createdAt: Date;
    updatedAt: Date;
}
declare const CreateDashboardSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    layout: z.ZodObject<{
        columns: z.ZodDefault<z.ZodNumber>;
        rows: z.ZodDefault<z.ZodNumber>;
        responsive: z.ZodDefault<z.ZodBoolean>;
        theme: z.ZodDefault<z.ZodEnum<["light", "dark", "auto"]>>;
    }, "strip", z.ZodTypeAny, {
        columns?: number;
        rows?: number;
        responsive?: boolean;
        theme?: "auto" | "light" | "dark";
    }, {
        columns?: number;
        rows?: number;
        responsive?: boolean;
        theme?: "auto" | "light" | "dark";
    }>;
    filters: z.ZodDefault<z.ZodArray<z.ZodObject<{
        field: z.ZodString;
        label: z.ZodString;
        type: z.ZodEnum<["select", "multiselect", "date", "daterange", "number", "text"]>;
        options: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        defaultValue: z.ZodOptional<z.ZodAny>;
        isRequired: z.ZodDefault<z.ZodBoolean>;
        validation: z.ZodOptional<z.ZodObject<{
            min: z.ZodOptional<z.ZodNumber>;
            max: z.ZodOptional<z.ZodNumber>;
            pattern: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            pattern?: string;
            max?: number;
            min?: number;
        }, {
            pattern?: string;
            max?: number;
            min?: number;
        }>>;
    }, "strip", z.ZodTypeAny, {
        options?: string[];
        validation?: {
            pattern?: string;
            max?: number;
            min?: number;
        };
        type?: "number" | "select" | "date" | "text" | "multiselect" | "daterange";
        field?: string;
        label?: string;
        defaultValue?: any;
        isRequired?: boolean;
    }, {
        options?: string[];
        validation?: {
            pattern?: string;
            max?: number;
            min?: number;
        };
        type?: "number" | "select" | "date" | "text" | "multiselect" | "daterange";
        field?: string;
        label?: string;
        defaultValue?: any;
        isRequired?: boolean;
    }>, "many">>;
    permissions: z.ZodObject<{
        isPublic: z.ZodDefault<z.ZodBoolean>;
        allowedUsers: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        allowedRoles: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        isPublic?: boolean;
        allowedUsers?: string[];
        allowedRoles?: string[];
    }, {
        isPublic?: boolean;
        allowedUsers?: string[];
        allowedRoles?: string[];
    }>;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    name?: string;
    filters?: {
        options?: string[];
        validation?: {
            pattern?: string;
            max?: number;
            min?: number;
        };
        type?: "number" | "select" | "date" | "text" | "multiselect" | "daterange";
        field?: string;
        label?: string;
        defaultValue?: any;
        isRequired?: boolean;
    }[];
    tags?: string[];
    description?: string;
    permissions?: {
        isPublic?: boolean;
        allowedUsers?: string[];
        allowedRoles?: string[];
    };
    layout?: {
        columns?: number;
        rows?: number;
        responsive?: boolean;
        theme?: "auto" | "light" | "dark";
    };
}, {
    name?: string;
    filters?: {
        options?: string[];
        validation?: {
            pattern?: string;
            max?: number;
            min?: number;
        };
        type?: "number" | "select" | "date" | "text" | "multiselect" | "daterange";
        field?: string;
        label?: string;
        defaultValue?: any;
        isRequired?: boolean;
    }[];
    tags?: string[];
    description?: string;
    permissions?: {
        isPublic?: boolean;
        allowedUsers?: string[];
        allowedRoles?: string[];
    };
    layout?: {
        columns?: number;
        rows?: number;
        responsive?: boolean;
        theme?: "auto" | "light" | "dark";
    };
}>;
declare const CreateWidgetSchema: z.ZodObject<{
    type: z.ZodEnum<["chart", "metric", "table", "gauge", "map", "heatmap", "trend"]>;
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    dataSource: z.ZodString;
    configuration: z.ZodObject<{
        chartType: z.ZodOptional<z.ZodEnum<["line", "bar", "pie", "area", "scatter", "doughnut"]>>;
        metrics: z.ZodArray<z.ZodString, "many">;
        dimensions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        filters: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        timeRange: z.ZodOptional<z.ZodString>;
        refreshInterval: z.ZodOptional<z.ZodNumber>;
        colors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        showLegend: z.ZodOptional<z.ZodBoolean>;
        showDataLabels: z.ZodOptional<z.ZodBoolean>;
        yAxisLabel: z.ZodOptional<z.ZodString>;
        xAxisLabel: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        metrics?: string[];
        filters?: Record<string, any>;
        timeRange?: string;
        refreshInterval?: number;
        dimensions?: string[];
        chartType?: "area" | "line" | "bar" | "pie" | "scatter" | "doughnut";
        colors?: string[];
        showLegend?: boolean;
        showDataLabels?: boolean;
        yAxisLabel?: string;
        xAxisLabel?: string;
    }, {
        metrics?: string[];
        filters?: Record<string, any>;
        timeRange?: string;
        refreshInterval?: number;
        dimensions?: string[];
        chartType?: "area" | "line" | "bar" | "pie" | "scatter" | "doughnut";
        colors?: string[];
        showLegend?: boolean;
        showDataLabels?: boolean;
        yAxisLabel?: string;
        xAxisLabel?: string;
    }>;
    position: z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
        width: z.ZodNumber;
        height: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        width?: number;
        height?: number;
        x?: number;
        y?: number;
    }, {
        width?: number;
        height?: number;
        x?: number;
        y?: number;
    }>;
    isVisible: z.ZodDefault<z.ZodBoolean>;
    isEditable: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    type?: "map" | "table" | "metric" | "trend" | "gauge" | "chart" | "heatmap";
    title?: string;
    description?: string;
    position?: {
        width?: number;
        height?: number;
        x?: number;
        y?: number;
    };
    dataSource?: string;
    isVisible?: boolean;
    configuration?: {
        metrics?: string[];
        filters?: Record<string, any>;
        timeRange?: string;
        refreshInterval?: number;
        dimensions?: string[];
        chartType?: "area" | "line" | "bar" | "pie" | "scatter" | "doughnut";
        colors?: string[];
        showLegend?: boolean;
        showDataLabels?: boolean;
        yAxisLabel?: string;
        xAxisLabel?: string;
    };
    isEditable?: boolean;
}, {
    type?: "map" | "table" | "metric" | "trend" | "gauge" | "chart" | "heatmap";
    title?: string;
    description?: string;
    position?: {
        width?: number;
        height?: number;
        x?: number;
        y?: number;
    };
    dataSource?: string;
    isVisible?: boolean;
    configuration?: {
        metrics?: string[];
        filters?: Record<string, any>;
        timeRange?: string;
        refreshInterval?: number;
        dimensions?: string[];
        chartType?: "area" | "line" | "bar" | "pie" | "scatter" | "doughnut";
        colors?: string[];
        showLegend?: boolean;
        showDataLabels?: boolean;
        yAxisLabel?: string;
        xAxisLabel?: string;
    };
    isEditable?: boolean;
}>;
declare const CreateAlertSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    metric: z.ZodString;
    condition: z.ZodObject<{
        operator: z.ZodEnum<["greater_than", "less_than", "equals", "not_equals", "contains"]>;
        value: z.ZodUnion<[z.ZodNumber, z.ZodString]>;
        threshold: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        value?: string | number;
        threshold?: number;
        operator?: "greater_than" | "less_than" | "equals" | "not_equals" | "contains";
    }, {
        value?: string | number;
        threshold?: number;
        operator?: "greater_than" | "less_than" | "equals" | "not_equals" | "contains";
    }>;
    severity: z.ZodEnum<["low", "medium", "high", "critical"]>;
    recipients: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    metric?: string;
    name?: string;
    severity?: "critical" | "low" | "medium" | "high";
    description?: string;
    recipients?: string[];
    condition?: {
        value?: string | number;
        threshold?: number;
        operator?: "greater_than" | "less_than" | "equals" | "not_equals" | "contains";
    };
}, {
    metric?: string;
    name?: string;
    severity?: "critical" | "low" | "medium" | "high";
    description?: string;
    recipients?: string[];
    condition?: {
        value?: string | number;
        threshold?: number;
        operator?: "greater_than" | "less_than" | "equals" | "not_equals" | "contains";
    };
}>;
export declare class DataAnalyticsDashboardService {
    private dashboards;
    private reports;
    private alerts;
    private demoData;
    constructor();
    createDashboard(data: z.infer<typeof CreateDashboardSchema>, organizationId: string): Promise<Dashboard>;
    getDashboard(dashboardId: string): Promise<Dashboard | null>;
    getDashboards(organizationId: string, filters?: {
        isActive?: boolean;
        tags?: string[];
        isPublic?: boolean;
    }): Promise<Dashboard[]>;
    updateDashboard(dashboardId: string, updates: Partial<Dashboard>): Promise<Dashboard | null>;
    deleteDashboard(dashboardId: string): Promise<boolean>;
    addWidget(dashboardId: string, data: z.infer<typeof CreateWidgetSchema>): Promise<DashboardWidget | null>;
    updateWidget(dashboardId: string, widgetId: string, updates: Partial<DashboardWidget>): Promise<DashboardWidget | null>;
    removeWidget(dashboardId: string, widgetId: string): Promise<boolean>;
    getAnalyticsData(organizationId: string, filters?: {
        timeRange?: string;
        metrics?: string[];
        dimensions?: string[];
    }): Promise<AnalyticsData>;
    getWidgetData(widget: DashboardWidget, organizationId: string): Promise<any>;
    createReport(name: string, description: string, type: Report['type'], organizationId: string, filters?: Record<string, any>): Promise<Report>;
    getReports(organizationId: string): Promise<Report[]>;
    exportReport(reportId: string, format: 'json' | 'csv' | 'pdf'): Promise<string>;
    createAlert(data: z.infer<typeof CreateAlertSchema>, organizationId: string): Promise<Alert>;
    getAlerts(organizationId: string): Promise<Alert[]>;
    checkAlerts(organizationId: string): Promise<Alert[]>;
    private generateId;
    private initializeDemoData;
    private generateTrendData;
    private createDefaultDashboards;
    private filterTrendsByTimeRange;
    private filterMetrics;
    private generateChartData;
    private generateMetricData;
    private generateTableData;
    private generateGaugeData;
    private convertToCSV;
    private convertToPDF;
    private getMetricValue;
    private evaluateCondition;
    getServiceStats(): Promise<{
        dashboards: number;
        reports: number;
        alerts: number;
        activeAlerts: number;
    }>;
}
export declare const dataAnalyticsDashboard: DataAnalyticsDashboardService;
export {};
//# sourceMappingURL=data-analytics-dashboard.service.d.ts.map