export interface ObservabilityMetrics {
    logs: number;
    traces: number;
    metrics: number;
    alerts: number;
    errors: number;
    warnings: number;
    performance: {
        avgResponseTime: number;
        p95ResponseTime: number;
        p99ResponseTime: number;
        throughput: number;
        errorRate: number;
    };
    system: {
        cpuUsage: number;
        memoryUsage: number;
        diskUsage: number;
        networkLatency: number;
    };
}
export interface LogEntry {
    id: string;
    timestamp: Date;
    level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
    message: string;
    service: string;
    userId?: string;
    requestId?: string;
    traceId?: string;
    spanId?: string;
    metadata: Record<string, any>;
}
export interface TraceSpan {
    id: string;
    traceId: string;
    parentId?: string;
    operationName: string;
    service: string;
    startTime: Date;
    endTime?: Date;
    duration?: number;
    tags: Record<string, any>;
    logs: Array<{
        timestamp: Date;
        fields: Record<string, any>;
    }>;
    status: 'started' | 'finished' | 'error';
}
export interface AlertRule {
    id: string;
    name: string;
    description: string;
    enabled: boolean;
    conditions: AlertCondition[];
    actions: AlertAction[];
    severity: 'low' | 'medium' | 'high' | 'critical';
    lastTriggered?: Date;
    cooldownMinutes: number;
}
export interface AlertCondition {
    metric: string;
    operator: 'gt' | 'lt' | 'eq' | 'ne' | 'gte' | 'lte';
    threshold: number;
    timeWindow: number;
}
export interface AlertAction {
    type: 'email' | 'sms' | 'webhook' | 'slack' | 'pagerduty';
    target: string;
    template?: string;
}
export interface Alert {
    id: string;
    ruleId: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    status: 'firing' | 'resolved' | 'acknowledged';
    triggeredAt: Date;
    resolvedAt?: Date;
    acknowledgedAt?: Date;
    acknowledgedBy?: string;
    metadata: Record<string, any>;
}
export interface Dashboard {
    id: string;
    name: string;
    description?: string;
    widgets: DashboardWidget[];
    refreshInterval: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface DashboardWidget {
    id: string;
    type: 'metric' | 'chart' | 'table' | 'alert' | 'log';
    title: string;
    position: {
        x: number;
        y: number;
        w: number;
        h: number;
    };
    config: Record<string, any>;
}
export interface PerformanceAnalysis {
    service: string;
    timeRange: string;
    metrics: {
        avgResponseTime: number;
        p95ResponseTime: number;
        p99ResponseTime: number;
        throughput: number;
        errorRate: number;
        availability: number;
    };
    trends: {
        responseTime: 'improving' | 'degrading' | 'stable';
        throughput: 'increasing' | 'decreasing' | 'stable';
        errorRate: 'improving' | 'degrading' | 'stable';
    };
    recommendations: string[];
}
export declare class AdvancedObservabilityService {
    private logs;
    private traces;
    private alerts;
    private alertRules;
    private dashboards;
    private metrics;
    constructor();
    getMetrics(): Promise<ObservabilityMetrics>;
    getPerformanceAnalysis(service: string, timeRange: string): Promise<PerformanceAnalysis>;
    getLogs(filters?: {
        level?: string;
        service?: string;
        startTime?: Date;
        endTime?: Date;
        limit?: number;
    }): Promise<LogEntry[]>;
    createLog(logData: Omit<LogEntry, 'id' | 'timestamp'>): Promise<LogEntry>;
    getTraces(filters?: {
        service?: string;
        operationName?: string;
        startTime?: Date;
        endTime?: Date;
        limit?: number;
    }): Promise<TraceSpan[]>;
    createTrace(traceData: Omit<TraceSpan, 'id' | 'startTime'>): Promise<TraceSpan>;
    getAlertRules(): Promise<AlertRule[]>;
    createAlertRule(ruleData: Omit<AlertRule, 'id'>): Promise<AlertRule>;
    getAlerts(filters?: {
        status?: string;
        severity?: string;
        limit?: number;
    }): Promise<Alert[]>;
    getDashboards(): Promise<Dashboard[]>;
    createDashboard(dashboardData: Omit<Dashboard, 'id' | 'createdAt' | 'updatedAt'>): Promise<Dashboard>;
    private initializeDemoData;
    private startMonitoring;
    private updateMetrics;
    private evaluateAlerts;
    private triggerAlert;
}
export declare const advancedObservability: AdvancedObservabilityService;
//# sourceMappingURL=advanced-observability.service.d.ts.map