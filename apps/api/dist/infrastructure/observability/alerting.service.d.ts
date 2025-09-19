export interface AlertRule {
    id: string;
    name: string;
    description: string;
    condition: AlertCondition;
    severity: AlertSeverity;
    enabled: boolean;
    cooldown: number;
    lastTriggered?: Date;
    notificationChannels: string[];
    tags: Record<string, string>;
}
export interface AlertCondition {
    metric: string;
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'ne';
    threshold: number;
    duration: number;
    aggregation?: 'avg' | 'sum' | 'min' | 'max' | 'count';
}
export interface Alert {
    id: string;
    ruleId: string;
    name: string;
    description: string;
    severity: AlertSeverity;
    status: AlertStatus;
    triggeredAt: Date;
    resolvedAt?: Date;
    value: number;
    threshold: number;
    message: string;
    tags: Record<string, string>;
    metadata: Record<string, any>;
}
export interface NotificationChannel {
    id: string;
    name: string;
    type: 'email' | 'slack' | 'webhook' | 'sms';
    config: Record<string, any>;
    enabled: boolean;
}
export type AlertSeverity = 'critical' | 'warning' | 'info';
export type AlertStatus = 'firing' | 'resolved' | 'acknowledged';
export declare class AlertingService {
    private static instance;
    private alertRules;
    private activeAlerts;
    private notificationChannels;
    private logger;
    private metrics;
    private constructor();
    static getInstance(): AlertingService;
    private initializeDefaultRules;
    private initializeNotificationChannels;
    addAlertRule(rule: AlertRule): void;
    removeAlertRule(ruleId: string): void;
    updateAlertRule(ruleId: string, updates: Partial<AlertRule>): void;
    getAlertRule(ruleId: string): AlertRule | undefined;
    getAllAlertRules(): AlertRule[];
    addNotificationChannel(channel: NotificationChannel): void;
    removeNotificationChannel(channelId: string): void;
    getNotificationChannel(channelId: string): NotificationChannel | undefined;
    getAllNotificationChannels(): NotificationChannel[];
    evaluateAlertRules(): Promise<void>;
    private evaluateRule;
    private getMetricValue;
    private triggerAlert;
    private sendNotifications;
    private sendNotification;
    private formatAlertMessage;
    private getSeverityEmoji;
    private sendEmailNotification;
    private sendSlackNotification;
    private sendWebhookNotification;
    private sendSMSNotification;
    getActiveAlerts(): Alert[];
    getAllAlerts(): Alert[];
    acknowledgeAlert(alertId: string): void;
    startAlertMonitoring(): void;
    getAlertingStatus(): {
        rulesCount: number;
        activeAlertsCount: number;
        channelsCount: number;
        enabledRulesCount: number;
    };
}
export declare const alertingService: AlertingService;
//# sourceMappingURL=alerting.service.d.ts.map