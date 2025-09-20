export interface Alert {
    id: string;
    name: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    details?: Record<string, any>;
    timestamp: Date;
    resolved: boolean;
    resolvedAt?: Date;
    tags?: string[];
}
export interface AlertRule {
    id: string;
    name: string;
    condition: () => Promise<boolean>;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    cooldown?: number;
    enabled: boolean;
    tags?: string[];
}
export interface AlertChannel {
    id: string;
    name: string;
    type: 'email' | 'slack' | 'webhook' | 'console';
    config: Record<string, any>;
    enabled: boolean;
}
export declare class AlertingSystem {
    private rules;
    private channels;
    private activeAlerts;
    private lastTriggered;
    private intervals;
    constructor();
    registerRule(rule: AlertRule): void;
    registerChannel(channel: AlertChannel): void;
    private startRuleMonitoring;
    private checkRule;
    private triggerAlert;
    private resolveAlert;
    private sendAlertToChannels;
    private sendAlertResolutionToChannels;
    private sendToChannel;
    private sendResolutionToChannel;
    private sendWebhookAlert;
    private sendWebhookResolution;
    private sendEmailAlert;
    private sendEmailResolution;
    private sendSlackAlert;
    private sendSlackResolution;
    private getSeverityColor;
    private recordAlertMetrics;
    private recordAlertResolutionMetrics;
    private getSeverityNumeric;
    getActiveAlerts(): Alert[];
    getRule(ruleId: string): AlertRule | undefined;
    getChannel(channelId: string): AlertChannel | undefined;
    toggleRule(ruleId: string, enabled: boolean): void;
    destroy(): void;
}
export declare const alertingMetrics: {
    alertTriggered: any;
    alertResolved: any;
    alertSeverity: any;
};
export declare const alertingSystem: AlertingSystem;
//# sourceMappingURL=alerting-system.d.ts.map