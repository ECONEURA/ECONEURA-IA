export interface MetricThreshold {
    value: number;
    color: string;
    label: string;
    operator: 'greater_than' | 'less_than' | 'equal' | 'between';
}
export interface ExecutiveMetric {
    id: string;
    title: string;
    value: number;
    unit: string;
    trend: 'increasing' | 'decreasing' | 'stable';
    position: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    config: {
        metricId: string;
        thresholds: MetricThreshold[];
    };
    refreshInterval: number;
}
export declare class ExecutiveDashboardService {
    private metrics;
    private logger;
    constructor();
    private initializeMetrics;
    getMetric(id: string): Promise<ExecutiveMetric | null>;
    updateMetric(id: string, value: number): Promise<void>;
}
export declare const executiveDashboardService: ExecutiveDashboardService;
//# sourceMappingURL=executive-dashboard.service.d.ts.map