export interface MetricData {
    name: string;
    value: number;
    timestamp: number;
    labels?: Record<string, string>;
    type: 'counter' | 'gauge' | 'histogram' | 'summary';
}
export interface AlertRule {
    id: string;
    name: string;
    description: string;
    metric: string;
    condition: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
    threshold: number;
    duration: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    enabled: boolean;
    actions: AlertAction[];
    createdAt: Date;
    updatedAt: Date;
}
export interface AlertAction {
    type: 'email' | 'webhook' | 'slack' | 'sms';
    config: Record<string, any>;
}
export interface Alert {
    id: string;
    ruleId: string;
    status: 'firing' | 'resolved';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    value: number;
    threshold: number;
    startedAt: Date;
    resolvedAt?: Date;
    acknowledgedAt?: Date;
    acknowledgedBy?: string;
}
export interface SystemHealth {
    status: 'healthy' | 'degraded' | 'unhealthy';
    score: number;
    checks: HealthCheck[];
    timestamp: Date;
}
export interface HealthCheck {
    name: string;
    status: 'pass' | 'fail' | 'warn';
    message: string;
    duration: number;
    details?: Record<string, any>;
}
export interface PerformanceMetrics {
    responseTime: {
        p50: number;
        p95: number;
        p99: number;
        average: number;
    };
    throughput: {
        requestsPerSecond: number;
        requestsPerMinute: number;
        requestsPerHour: number;
    };
    errorRate: {
        percentage: number;
        count: number;
        total: number;
    };
    resourceUsage: {
        cpu: number;
        memory: number;
        disk: number;
    };
}
export declare class MonitoringService {
    private metrics;
    private alertRules;
    private activeAlerts;
    private healthChecks;
    private performanceData;
    private alertTimer?;
    private metricsTimer?;
    constructor();
    recordMetric(name: string, value: number, labels?: Record<string, string>, type?: MetricData['type']): void;
    incrementCounter(name: string, labels?: Record<string, string>, value?: number): void;
    setGauge(name: string, value: number, labels?: Record<string, string>): void;
    recordHistogram(name: string, value: number, labels?: Record<string, string>): void;
    getMetrics(name?: string, timeRange?: {
        start: number;
        end: number;
    }): MetricData[];
    createAlertRule(rule: Omit<AlertRule, 'id' | 'createdAt' | 'updatedAt'>): AlertRule;
    getAlertRules(): AlertRule[];
    getActiveAlerts(): Alert[];
    acknowledgeAlert(alertId: string, userId: string): boolean;
    resolveAlert(alertId: string): boolean;
    registerHealthCheck(name: string, check: () => Promise<HealthCheck>): void;
    runHealthChecks(): Promise<SystemHealth>;
    getPerformanceMetrics(): PerformanceMetrics;
    updatePerformanceMetrics(data: Partial<PerformanceMetrics>): void;
    getDashboard(): any;
    exportPrometheusMetrics(): string;
    private initializePerformanceData;
    private initializeDefaultAlertRules;
    private initializeDefaultHealthChecks;
    private evaluateAlertRules;
    private evaluateCondition;
    private executeAlertActions;
    private sendEmailAlert;
    private sendWebhookAlert;
    private sendSlackAlert;
    private sendSMSAlert;
    private getAlertsBySeverity;
    private getRecentMetrics;
    private getMetricTrends;
    private calculateTrend;
    private startMonitoring;
    private cleanupOldMetrics;
    destroy(): void;
}
export declare const monitoringService: MonitoringService;
export declare const metricsMiddleware: (req: any, res: any, next: any) => void;
//# sourceMappingURL=monitoring.service.d.ts.map