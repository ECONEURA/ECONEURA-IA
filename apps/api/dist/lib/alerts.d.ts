interface AlertRule {
    id: string;
    name: string;
    description: string;
    metric: string;
    condition: 'threshold' | 'anomaly' | 'trend';
    threshold?: number;
    operator: 'gt' | 'lt' | 'gte' | 'lte' | 'eq' | 'ne';
    window: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    enabled: boolean;
    labels?: Record<string, string>;
    cooldown: number;
}
interface Alert {
    id: string;
    ruleId: string;
    name: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    status: 'active' | 'resolved' | 'acknowledged';
    metric: string;
    value: number;
    threshold: number;
    timestamp: string;
    resolvedAt?: string;
    acknowledgedAt?: string;
    acknowledgedBy?: string;
    labels?: Record<string, string>;
    context?: Record<string, any>;
}
declare class IntelligentAlertSystem {
    private rules;
    private alerts;
    private notifications;
    private alertHistory;
    private readonly MAX_ALERTS;
    private readonly MAX_NOTIFICATIONS;
    constructor();
    private initializeDefaultRules;
    addRule(rule: AlertRule): void;
    private validateRule;
    removeRule(ruleId: string): boolean;
    getRule(ruleId: string): AlertRule | undefined;
    getAllRules(): AlertRule[];
    evaluateMetrics(metrics: any): Alert[];
    private getMetricValue;
    private evaluateCondition;
    private evaluateThreshold;
    private evaluateAnomaly;
    private evaluateTrend;
    private shouldCreateAlert;
    private createAlert;
    private createNotification;
    private processNotification;
    private sendNotification;
    getAlert(alertId: string): Alert | undefined;
    getActiveAlerts(): Alert[];
    getAlertsBySeverity(severity: string): Alert[];
    acknowledgeAlert(alertId: string, acknowledgedBy: string): boolean;
    resolveAlert(alertId: string): boolean;
    getAlertStats(): any;
    getNotificationStats(): any;
    private cleanupOldAlerts;
    evaluateMetricsRealtime(metrics: any): Alert[];
    updateRule(ruleId: string, updates: Partial<AlertRule>): boolean;
}
export declare const alertSystem: IntelligentAlertSystem;
export {};
//# sourceMappingURL=alerts.d.ts.map