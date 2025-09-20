export interface MonitoringMetric {
    id: string;
    name: string;
    value: number;
    unit: string;
    timestamp: Date;
    tags: Record<string, string>;
    source: string;
}
export interface AlertRule {
    id: string;
    name: string;
    description: string;
    metric: string;
    condition: 'greater_than' | 'less_than' | 'equals' | 'not_equals';
    threshold: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    enabled: boolean;
    cooldown: number;
    notificationChannels: string[];
    escalationPolicy?: string;
}
export interface Alert {
    id: string;
    ruleId: string;
    metric: string;
    value: number;
    threshold: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    status: 'active' | 'resolved' | 'acknowledged';
    triggeredAt: Date;
    resolvedAt?: Date;
    acknowledgedAt?: Date;
    acknowledgedBy?: string;
    message: string;
    tags: Record<string, string>;
}
export interface HealthCheck {
    id: string;
    name: string;
    endpoint: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    expectedStatus: number;
    timeout: number;
    interval: number;
    enabled: boolean;
    lastCheck?: Date;
    lastStatus?: 'healthy' | 'unhealthy' | 'unknown';
    lastResponseTime?: number;
    consecutiveFailures: number;
    maxFailures: number;
}
export interface SLAMetric {
    id: string;
    name: string;
    target: number;
    current: number;
    period: 'hourly' | 'daily' | 'weekly' | 'monthly';
    status: 'meeting' | 'warning' | 'breach';
    lastUpdated: Date;
}
export interface NotificationChannel {
    id: string;
    name: string;
    type: 'email' | 'slack' | 'webhook' | 'sms' | 'pagerduty';
    config: Record<string, any>;
    enabled: boolean;
}
export declare class AdvancedMonitoringAlertsService {
    private static instance;
    private metrics;
    private alertRules;
    private activeAlerts;
    private healthChecks;
    private slaMetrics;
    private notificationChannels;
    private db;
    private monitoringInterval;
    private healthCheckInterval;
    constructor();
    static getInstance(): AdvancedMonitoringAlertsService;
    private initializeDefaultAlertRules;
    private initializeDefaultHealthChecks;
    private initializeDefaultSLAMetrics;
    private initializeDefaultNotificationChannels;
    private startMonitoring;
    private startHealthChecks;
    private collectMetrics;
    private getCPUUsage;
    private getMemoryUsage;
    private getAverageResponseTime;
    private getCacheHitRate;
    private getDatabaseConnectionErrors;
    private evaluateAlertRules;
    private evaluateCondition;
    private handleAlertTrigger;
    private sendNotifications;
    private sendNotification;
    private sendEmailNotification;
    private sendSlackNotification;
    private sendPagerDutyNotification;
    private sendWebhookNotification;
    private sendSMSNotification;
    private runHealthChecks;
    private executeHealthCheck;
    private handleHealthCheckFailure;
    getMetrics(metricId?: string): Promise<MonitoringMetric[]>;
    getActiveAlerts(): Promise<Alert[]>;
    getAlertRules(): Promise<AlertRule[]>;
    getHealthChecks(): Promise<HealthCheck[]>;
    getSLAMetrics(): Promise<SLAMetric[]>;
    acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<boolean>;
    resolveAlert(alertId: string): Promise<boolean>;
    getDashboardData(): Promise<{
        metrics: MonitoringMetric[];
        activeAlerts: Alert[];
        healthChecks: HealthCheck[];
        slaMetrics: SLAMetric[];
    }>;
    getHealthStatus(): Promise<{
        status: string;
        details: any;
    }>;
    destroy(): void;
}
export declare const advancedMonitoringAlerts: AdvancedMonitoringAlertsService;
//# sourceMappingURL=advanced-monitoring-alerts.service.d.ts.map