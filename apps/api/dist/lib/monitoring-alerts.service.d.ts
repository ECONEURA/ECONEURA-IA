export declare enum AlertSeverity {
    INFO = "info",
    WARNING = "warning",
    ERROR = "error",
    CRITICAL = "critical"
}
export declare enum AlertStatus {
    ACTIVE = "active",
    ACKNOWLEDGED = "acknowledged",
    RESOLVED = "resolved",
    SUPPRESSED = "suppressed"
}
export declare enum NotificationChannel {
    EMAIL = "email",
    SMS = "sms",
    SLACK = "slack",
    WEBHOOK = "webhook",
    IN_APP = "in_app"
}
export interface AlertRule {
    id: string;
    name: string;
    description: string;
    metric: string;
    condition: AlertCondition;
    severity: AlertSeverity;
    enabled: boolean;
    cooldown: number;
    escalation: EscalationPolicy;
    tags: string[];
    organizationId: string;
}
export interface AlertCondition {
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'ne';
    threshold: number;
    duration: number;
    aggregation: 'avg' | 'sum' | 'min' | 'max' | 'count';
}
export interface EscalationPolicy {
    levels: EscalationLevel[];
    maxEscalations: number;
    escalationDelay: number;
}
export interface EscalationLevel {
    level: number;
    delay: number;
    channels: NotificationChannel[];
    recipients: string[];
    message: string;
}
export interface Alert {
    id: string;
    ruleId: string;
    title: string;
    message: string;
    severity: AlertSeverity;
    status: AlertStatus;
    triggeredAt: Date;
    acknowledgedAt?: Date;
    resolvedAt?: Date;
    acknowledgedBy?: string;
    resolvedBy?: string;
    metadata: Record<string, any>;
    organizationId: string;
}
export interface NotificationConfig {
    channels: NotificationChannel[];
    recipients: Record<NotificationChannel, string[]>;
    templates: Record<AlertSeverity, string>;
    rateLimit: {
        maxPerHour: number;
        maxPerDay: number;
    };
}
export interface MonitoringStats {
    totalAlerts: number;
    activeAlerts: number;
    alertsBySeverity: Record<AlertSeverity, number>;
    alertsByStatus: Record<AlertStatus, number>;
    averageResolutionTime: number;
    escalationRate: number;
    falsePositiveRate: number;
}
export declare class MonitoringAlertsService {
    private static instance;
    private alertRules;
    private activeAlerts;
    private alertHistory;
    private notificationConfig;
    private metricsBuffer;
    private isMonitoring;
    private monitoringInterval;
    private constructor();
    static getInstance(): MonitoringAlertsService;
    private initializeDefaultRules;
    private initializeNotificationConfig;
    private startMonitoring;
    recordMetric(metricName: string, value: number, timestamp?: number): void;
    private checkAlertRules;
    private evaluateRule;
    private aggregateValues;
    private evaluateCondition;
    private triggerAlert;
    private resolveAlert;
    private sendNotifications;
    private sendNotification;
    private sendEmail;
    private sendSlack;
    private sendSMS;
    private sendWebhook;
    private sendInApp;
    private sendResolutionNotification;
    getMonitoringStats(): MonitoringStats;
    stop(): void;
}
export declare const monitoringAlertsService: MonitoringAlertsService;
//# sourceMappingURL=monitoring-alerts.service.d.ts.map