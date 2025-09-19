import { z } from 'zod';
declare const MetricSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    type: z.ZodEnum<["COUNTER", "GAUGE", "HISTOGRAM", "SUMMARY"]>;
    description: z.ZodString;
    labels: z.ZodArray<z.ZodString, "many">;
    value: z.ZodNumber;
    timestamp: z.ZodDate;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    value?: number;
    type?: "COUNTER" | "GAUGE" | "HISTOGRAM" | "SUMMARY";
    timestamp?: Date;
    name?: string;
    metadata?: Record<string, any>;
    id?: string;
    labels?: string[];
    description?: string;
}, {
    value?: number;
    type?: "COUNTER" | "GAUGE" | "HISTOGRAM" | "SUMMARY";
    timestamp?: Date;
    name?: string;
    metadata?: Record<string, any>;
    id?: string;
    labels?: string[];
    description?: string;
}>;
declare const AlertRuleSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodString;
    metric: z.ZodString;
    condition: z.ZodObject<{
        operator: z.ZodEnum<["gt", "lt", "gte", "lte", "eq", "ne"]>;
        threshold: z.ZodNumber;
        window: z.ZodNumber;
        aggregation: z.ZodEnum<["avg", "sum", "min", "max", "count"]>;
    }, "strip", z.ZodTypeAny, {
        threshold?: number;
        operator?: "gt" | "lt" | "gte" | "lte" | "eq" | "ne";
        window?: number;
        aggregation?: "count" | "max" | "avg" | "sum" | "min";
    }, {
        threshold?: number;
        operator?: "gt" | "lt" | "gte" | "lte" | "eq" | "ne";
        window?: number;
        aggregation?: "count" | "max" | "avg" | "sum" | "min";
    }>;
    severity: z.ZodEnum<["LOW", "MEDIUM", "HIGH", "CRITICAL"]>;
    enabled: z.ZodBoolean;
    cooldown: z.ZodNumber;
    labels: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    actions: z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<["EMAIL", "SLACK", "WEBHOOK", "SMS"]>;
        config: z.ZodRecord<z.ZodString, z.ZodAny>;
    }, "strip", z.ZodTypeAny, {
        type?: "EMAIL" | "SLACK" | "WEBHOOK" | "SMS";
        config?: Record<string, any>;
    }, {
        type?: "EMAIL" | "SLACK" | "WEBHOOK" | "SMS";
        config?: Record<string, any>;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    metric?: string;
    name?: string;
    id?: string;
    severity?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    labels?: Record<string, string>;
    description?: string;
    actions?: {
        type?: "EMAIL" | "SLACK" | "WEBHOOK" | "SMS";
        config?: Record<string, any>;
    }[];
    enabled?: boolean;
    condition?: {
        threshold?: number;
        operator?: "gt" | "lt" | "gte" | "lte" | "eq" | "ne";
        window?: number;
        aggregation?: "count" | "max" | "avg" | "sum" | "min";
    };
    cooldown?: number;
}, {
    metric?: string;
    name?: string;
    id?: string;
    severity?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    labels?: Record<string, string>;
    description?: string;
    actions?: {
        type?: "EMAIL" | "SLACK" | "WEBHOOK" | "SMS";
        config?: Record<string, any>;
    }[];
    enabled?: boolean;
    condition?: {
        threshold?: number;
        operator?: "gt" | "lt" | "gte" | "lte" | "eq" | "ne";
        window?: number;
        aggregation?: "count" | "max" | "avg" | "sum" | "min";
    };
    cooldown?: number;
}>;
declare const AlertSchema: z.ZodObject<{
    id: z.ZodString;
    ruleId: z.ZodString;
    name: z.ZodString;
    description: z.ZodString;
    severity: z.ZodEnum<["LOW", "MEDIUM", "HIGH", "CRITICAL"]>;
    status: z.ZodEnum<["ACTIVE", "RESOLVED", "ACKNOWLEDGED", "SUPPRESSED"]>;
    metric: z.ZodString;
    value: z.ZodNumber;
    threshold: z.ZodNumber;
    timestamp: z.ZodDate;
    resolvedAt: z.ZodOptional<z.ZodDate>;
    acknowledgedAt: z.ZodOptional<z.ZodDate>;
    acknowledgedBy: z.ZodOptional<z.ZodString>;
    labels: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    context: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    value?: number;
    status?: "ACTIVE" | "RESOLVED" | "ACKNOWLEDGED" | "SUPPRESSED";
    metric?: string;
    context?: Record<string, any>;
    timestamp?: Date;
    name?: string;
    id?: string;
    severity?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    labels?: Record<string, string>;
    description?: string;
    threshold?: number;
    acknowledgedBy?: string;
    ruleId?: string;
    acknowledgedAt?: Date;
    resolvedAt?: Date;
}, {
    value?: number;
    status?: "ACTIVE" | "RESOLVED" | "ACKNOWLEDGED" | "SUPPRESSED";
    metric?: string;
    context?: Record<string, any>;
    timestamp?: Date;
    name?: string;
    id?: string;
    severity?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    labels?: Record<string, string>;
    description?: string;
    threshold?: number;
    acknowledgedBy?: string;
    ruleId?: string;
    acknowledgedAt?: Date;
    resolvedAt?: Date;
}>;
declare const SLASchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodString;
    metric: z.ZodString;
    target: z.ZodNumber;
    window: z.ZodNumber;
    enabled: z.ZodBoolean;
    alertThreshold: z.ZodOptional<z.ZodNumber>;
    labels: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    metric?: string;
    name?: string;
    id?: string;
    labels?: Record<string, string>;
    description?: string;
    alertThreshold?: number;
    enabled?: boolean;
    window?: number;
    target?: number;
}, {
    metric?: string;
    name?: string;
    id?: string;
    labels?: Record<string, string>;
    description?: string;
    alertThreshold?: number;
    enabled?: boolean;
    window?: number;
    target?: number;
}>;
declare const MetricTrendSchema: z.ZodObject<{
    id: z.ZodString;
    metric: z.ZodString;
    period: z.ZodEnum<["1h", "6h", "24h", "7d", "30d"]>;
    trend: z.ZodEnum<["INCREASING", "DECREASING", "STABLE", "VOLATILE"]>;
    changePercent: z.ZodNumber;
    confidence: z.ZodNumber;
    prediction: z.ZodOptional<z.ZodObject<{
        nextValue: z.ZodNumber;
        nextTimestamp: z.ZodDate;
        confidence: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        confidence?: number;
        nextValue?: number;
        nextTimestamp?: Date;
    }, {
        confidence?: number;
        nextValue?: number;
        nextTimestamp?: Date;
    }>>;
}, "strip", z.ZodTypeAny, {
    metric?: string;
    prediction?: {
        confidence?: number;
        nextValue?: number;
        nextTimestamp?: Date;
    };
    period?: "24h" | "1h" | "7d" | "30d" | "6h";
    id?: string;
    trend?: "INCREASING" | "DECREASING" | "STABLE" | "VOLATILE";
    confidence?: number;
    changePercent?: number;
}, {
    metric?: string;
    prediction?: {
        confidence?: number;
        nextValue?: number;
        nextTimestamp?: Date;
    };
    period?: "24h" | "1h" | "7d" | "30d" | "6h";
    id?: string;
    trend?: "INCREASING" | "DECREASING" | "STABLE" | "VOLATILE";
    confidence?: number;
    changePercent?: number;
}>;
export type Metric = z.infer<typeof MetricSchema>;
export type AlertRule = z.infer<typeof AlertRuleSchema>;
export type Alert = z.infer<typeof AlertSchema>;
export type SLA = z.infer<typeof SLASchema>;
export type MetricTrend = z.infer<typeof MetricTrendSchema>;
export interface MetricsAlertsConfig {
    prometheusEnabled: boolean;
    alertingEnabled: boolean;
    defaultCooldown: number;
    maxAlertsPerRule: number;
    retentionDays: number;
    notificationChannels: string[];
    slaMonitoring: boolean;
    trendAnalysis: boolean;
}
export interface MetricCollection {
    id: string;
    name: string;
    metrics: Metric[];
    startTime: Date;
    endTime: Date;
    duration: number;
    status: 'RUNNING' | 'COMPLETED' | 'FAILED';
}
export declare class AdvancedMetricsAlertsService {
    private config;
    private metrics;
    private alertRules;
    private alerts;
    private slas;
    private trends;
    private collections;
    constructor(config: MetricsAlertsConfig);
    collectMetrics(): Promise<Metric[]>;
    private collectCustomMetrics;
    getMetrics(filter?: {
        name?: string;
        type?: string;
        timeRange?: {
            start: Date;
            end: Date;
        };
    }): Promise<Metric[]>;
    getMetricByName(name: string): Promise<Metric[]>;
    getMetricTrends(metricName: string, period: string): Promise<MetricTrend[]>;
    private calculateTrend;
    private calculateChangePercent;
    private calculateVolatility;
    private predictNextValue;
    private getPeriodMs;
    createAlertRule(rule: Omit<AlertRule, 'id'>): Promise<AlertRule>;
    getAlertRule(ruleId: string): Promise<AlertRule | null>;
    listAlertRules(): Promise<AlertRule[]>;
    updateAlertRule(ruleId: string, updates: Partial<AlertRule>): Promise<AlertRule | null>;
    deleteAlertRule(ruleId: string): Promise<boolean>;
    evaluateAlertRules(): Promise<Alert[]>;
    private evaluateRule;
    private aggregateMetrics;
    private evaluateCondition;
    getAlerts(filter?: {
        status?: string;
        severity?: string;
        ruleId?: string;
    }): Promise<Alert[]>;
    acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<Alert | null>;
    resolveAlert(alertId: string): Promise<Alert | null>;
    private sendAlertNotifications;
    private sendNotification;
    createSLA(sla: Omit<SLA, 'id'>): Promise<SLA>;
    getSLA(slaId: string): Promise<SLA | null>;
    listSLAs(): Promise<SLA[]>;
    calculateSLACompliance(slaId: string, timeRange?: {
        start: Date;
        end: Date;
    }): Promise<{
        sla: SLA;
        compliance: number;
        violations: number;
        totalMeasurements: number;
        status: 'COMPLIANT' | 'VIOLATED' | 'WARNING';
    }>;
    getMetricsStatistics(): Promise<{
        totalMetrics: number;
        metricsByType: Record<string, number>;
        totalAlerts: number;
        activeAlerts: number;
        totalRules: number;
        enabledRules: number;
        totalSLAs: number;
        averageCompliance: number;
        lastCollection: Date | null;
    }>;
    generateMetricsReport(period: 'hourly' | 'daily' | 'weekly' | 'monthly'): Promise<{
        period: string;
        generatedAt: Date;
        summary: any;
        topMetrics: Metric[];
        alertSummary: any;
        slaSummary: any;
        recommendations: string[];
    }>;
    private generateRecommendations;
    private startMetricCollection;
    private initializeDefaultRules;
    private initializeDefaultSLAs;
}
export default AdvancedMetricsAlertsService;
//# sourceMappingURL=advanced-metrics-alerts.service.d.ts.map