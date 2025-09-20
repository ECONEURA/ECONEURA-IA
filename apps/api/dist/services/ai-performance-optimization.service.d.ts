import { z } from 'zod';
declare const PerformanceMetricSchema: z.ZodObject<{
    id: z.ZodString;
    serviceName: z.ZodString;
    metricType: z.ZodEnum<["latency", "throughput", "accuracy", "cost", "memory", "cpu", "error_rate", "success_rate"]>;
    value: z.ZodNumber;
    unit: z.ZodString;
    timestamp: z.ZodDate;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    value?: number;
    timestamp?: Date;
    serviceName?: string;
    metadata?: Record<string, any>;
    id?: string;
    unit?: string;
    metricType?: "memory" | "error_rate" | "cost" | "accuracy" | "latency" | "throughput" | "cpu" | "success_rate";
}, {
    value?: number;
    timestamp?: Date;
    serviceName?: string;
    metadata?: Record<string, any>;
    id?: string;
    unit?: string;
    metricType?: "memory" | "error_rate" | "cost" | "accuracy" | "latency" | "throughput" | "cpu" | "success_rate";
}>;
declare const OptimizationRuleSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodString;
    condition: z.ZodObject<{
        metric: z.ZodString;
        operator: z.ZodEnum<["gt", "lt", "eq", "gte", "lte"]>;
        threshold: z.ZodNumber;
        duration: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        duration?: number;
        metric?: string;
        threshold?: number;
        operator?: "gt" | "lt" | "gte" | "lte" | "eq";
    }, {
        duration?: number;
        metric?: string;
        threshold?: number;
        operator?: "gt" | "lt" | "gte" | "lte" | "eq";
    }>;
    action: z.ZodObject<{
        type: z.ZodEnum<["scale_up", "scale_down", "cache_clear", "model_switch", "retry", "fallback"]>;
        parameters: z.ZodRecord<z.ZodString, z.ZodAny>;
        priority: z.ZodEnum<["low", "medium", "high", "critical"]>;
    }, "strip", z.ZodTypeAny, {
        type?: "retry" | "model_switch" | "scale_down" | "scale_up" | "cache_clear" | "fallback";
        priority?: "critical" | "low" | "medium" | "high";
        parameters?: Record<string, any>;
    }, {
        type?: "retry" | "model_switch" | "scale_down" | "scale_up" | "cache_clear" | "fallback";
        priority?: "critical" | "low" | "medium" | "high";
        parameters?: Record<string, any>;
    }>;
    isActive: z.ZodBoolean;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    name?: string;
    id?: string;
    action?: {
        type?: "retry" | "model_switch" | "scale_down" | "scale_up" | "cache_clear" | "fallback";
        priority?: "critical" | "low" | "medium" | "high";
        parameters?: Record<string, any>;
    };
    createdAt?: Date;
    updatedAt?: Date;
    description?: string;
    isActive?: boolean;
    condition?: {
        duration?: number;
        metric?: string;
        threshold?: number;
        operator?: "gt" | "lt" | "gte" | "lte" | "eq";
    };
}, {
    name?: string;
    id?: string;
    action?: {
        type?: "retry" | "model_switch" | "scale_down" | "scale_up" | "cache_clear" | "fallback";
        priority?: "critical" | "low" | "medium" | "high";
        parameters?: Record<string, any>;
    };
    createdAt?: Date;
    updatedAt?: Date;
    description?: string;
    isActive?: boolean;
    condition?: {
        duration?: number;
        metric?: string;
        threshold?: number;
        operator?: "gt" | "lt" | "gte" | "lte" | "eq";
    };
}>;
declare const PerformanceAlertSchema: z.ZodObject<{
    id: z.ZodString;
    ruleId: z.ZodString;
    serviceName: z.ZodString;
    metricType: z.ZodString;
    currentValue: z.ZodNumber;
    threshold: z.ZodNumber;
    severity: z.ZodEnum<["low", "medium", "high", "critical"]>;
    status: z.ZodEnum<["active", "acknowledged", "resolved"]>;
    triggeredAt: z.ZodDate;
    resolvedAt: z.ZodOptional<z.ZodDate>;
    message: z.ZodString;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    message?: string;
    status?: "acknowledged" | "active" | "resolved";
    serviceName?: string;
    metadata?: Record<string, any>;
    id?: string;
    severity?: "critical" | "low" | "medium" | "high";
    threshold?: number;
    ruleId?: string;
    currentValue?: number;
    resolvedAt?: Date;
    triggeredAt?: Date;
    metricType?: string;
}, {
    message?: string;
    status?: "acknowledged" | "active" | "resolved";
    serviceName?: string;
    metadata?: Record<string, any>;
    id?: string;
    severity?: "critical" | "low" | "medium" | "high";
    threshold?: number;
    ruleId?: string;
    currentValue?: number;
    resolvedAt?: Date;
    triggeredAt?: Date;
    metricType?: string;
}>;
declare const OptimizationReportSchema: z.ZodObject<{
    id: z.ZodString;
    serviceName: z.ZodString;
    reportType: z.ZodEnum<["daily", "weekly", "monthly", "custom"]>;
    period: z.ZodObject<{
        start: z.ZodDate;
        end: z.ZodDate;
    }, "strip", z.ZodTypeAny, {
        end?: Date;
        start?: Date;
    }, {
        end?: Date;
        start?: Date;
    }>;
    summary: z.ZodObject<{
        totalRequests: z.ZodNumber;
        averageLatency: z.ZodNumber;
        averageThroughput: z.ZodNumber;
        averageAccuracy: z.ZodNumber;
        totalCost: z.ZodNumber;
        errorRate: z.ZodNumber;
        successRate: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        errorRate?: number;
        successRate?: number;
        totalCost?: number;
        averageAccuracy?: number;
        totalRequests?: number;
        averageLatency?: number;
        averageThroughput?: number;
    }, {
        errorRate?: number;
        successRate?: number;
        totalCost?: number;
        averageAccuracy?: number;
        totalRequests?: number;
        averageLatency?: number;
        averageThroughput?: number;
    }>;
    optimizations: z.ZodArray<z.ZodObject<{
        type: z.ZodString;
        impact: z.ZodNumber;
        description: z.ZodString;
        recommendation: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type?: string;
        impact?: number;
        description?: string;
        recommendation?: string;
    }, {
        type?: string;
        impact?: number;
        description?: string;
        recommendation?: string;
    }>, "many">;
    generatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    serviceName?: string;
    period?: {
        end?: Date;
        start?: Date;
    };
    id?: string;
    summary?: {
        errorRate?: number;
        successRate?: number;
        totalCost?: number;
        averageAccuracy?: number;
        totalRequests?: number;
        averageLatency?: number;
        averageThroughput?: number;
    };
    reportType?: "custom" | "monthly" | "daily" | "weekly";
    generatedAt?: Date;
    optimizations?: {
        type?: string;
        impact?: number;
        description?: string;
        recommendation?: string;
    }[];
}, {
    serviceName?: string;
    period?: {
        end?: Date;
        start?: Date;
    };
    id?: string;
    summary?: {
        errorRate?: number;
        successRate?: number;
        totalCost?: number;
        averageAccuracy?: number;
        totalRequests?: number;
        averageLatency?: number;
        averageThroughput?: number;
    };
    reportType?: "custom" | "monthly" | "daily" | "weekly";
    generatedAt?: Date;
    optimizations?: {
        type?: string;
        impact?: number;
        description?: string;
        recommendation?: string;
    }[];
}>;
export type PerformanceMetric = z.infer<typeof PerformanceMetricSchema>;
export type OptimizationRule = z.infer<typeof OptimizationRuleSchema>;
export type PerformanceAlert = z.infer<typeof PerformanceAlertSchema>;
export type OptimizationReport = z.infer<typeof OptimizationReportSchema>;
export interface PerformanceOptimizationRequest {
    serviceName: string;
    metricType: string;
    value: number;
    metadata?: Record<string, any>;
}
export interface PerformanceOptimizationResponse {
    optimized: boolean;
    actions: Array<{
        type: string;
        parameters: Record<string, any>;
        impact: number;
        description: string;
    }>;
    recommendations: string[];
    metrics: {
        before: number;
        after: number;
        improvement: number;
    };
}
export interface AutoScalingConfig {
    minInstances: number;
    maxInstances: number;
    targetUtilization: number;
    scaleUpThreshold: number;
    scaleDownThreshold: number;
    cooldownPeriod: number;
}
export declare class AIPerformanceOptimizationService {
    private db;
    private metricsCache;
    private rulesCache;
    private alertsCache;
    constructor();
    private initializeService;
    private createTables;
    private loadOptimizationRules;
    private initializeDefaultRules;
    private startPerformanceMonitoring;
    private collectSystemMetrics;
    recordPerformanceMetric(metric: Omit<PerformanceMetric, 'id' | 'timestamp'>): Promise<PerformanceMetric>;
    getPerformanceMetrics(serviceName?: string, metricType?: string, limit?: number): Promise<PerformanceMetric[]>;
    createOptimizationRule(rule: Omit<OptimizationRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<OptimizationRule>;
    getOptimizationRules(): Promise<OptimizationRule[]>;
    private evaluateOptimizationRules;
    private evaluateCondition;
    private triggerOptimizationAction;
    private executeOptimizationAction;
    private scaleService;
    private clearCache;
    private switchModel;
    private configureRetry;
    private enableFallback;
    createPerformanceAlert(alert: Omit<PerformanceAlert, 'id' | 'triggeredAt'>): Promise<PerformanceAlert>;
    getPerformanceAlerts(): Promise<PerformanceAlert[]>;
    optimizePerformance(request: PerformanceOptimizationRequest): Promise<PerformanceOptimizationResponse>;
    generateOptimizationReport(serviceName: string, reportType: OptimizationReport['reportType'], period: {
        start: Date;
        end: Date;
    }): Promise<OptimizationReport>;
    private calculateAverage;
    getHealthStatus(): Promise<{
        status: 'healthy' | 'degraded' | 'unhealthy';
        services: Record<string, boolean>;
        lastCheck: Date;
    }>;
    private checkDatabaseHealth;
}
export declare const aiPerformanceOptimizationService: AIPerformanceOptimizationService;
export {};
//# sourceMappingURL=ai-performance-optimization.service.d.ts.map