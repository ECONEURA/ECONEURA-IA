export interface DashboardWidget {
    id: string;
    title: string;
    type: 'chart' | 'metric' | 'table' | 'gauge';
    position: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    config: {
        min?: number;
        max?: number;
        unit?: string;
        thresholds?: Array<{
            value: number;
            color: string;
        }>;
    };
    dataSource: {
        type: 'metrics' | 'database' | 'api';
        query: string;
        timeRange?: {
            from: Date;
            to: Date;
        };
    };
}
export interface Dashboard {
    id: string;
    name: string;
    description: string;
    widgets: DashboardWidget[];
    layout: 'grid' | 'flex';
    refreshInterval: number;
    permissions: string[];
}
export declare class DashboardService {
    private dashboards;
    private logger;
    constructor();
    private initializeDefaultDashboards;
    getDashboard(id: string): Promise<Dashboard | null>;
    getDashboards(): Promise<Dashboard[]>;
    createDashboard(dashboard: Dashboard): Promise<void>;
    updateDashboard(id: string, updates: Partial<Dashboard>): Promise<void>;
    deleteDashboard(id: string): Promise<void>;
    getWidgetData(dashboardId: string, widgetId: string): Promise<any>;
    private fetchMetricsData;
    private fetchDatabaseData;
    private fetchApiData;
    exportDashboard(id: string): Promise<string>;
    importDashboard(dashboardJson: string): Promise<void>;
}
export declare const dashboardService: DashboardService;
//# sourceMappingURL=dashboard.service.d.ts.map