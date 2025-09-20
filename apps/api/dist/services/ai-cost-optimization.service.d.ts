import { z } from 'zod';
declare const CostOptimizationRuleSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodString;
    type: z.ZodEnum<["model_switch", "provider_switch", "request_batching", "cache_optimization", "budget_alert", "auto_scaling"]>;
    condition: z.ZodObject<{
        metric: z.ZodEnum<["cost_per_request", "daily_cost", "monthly_cost", "cost_efficiency", "token_usage"]>;
        operator: z.ZodEnum<["gt", "lt", "eq", "gte", "lte"]>;
        threshold: z.ZodNumber;
        duration: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        duration?: number;
        metric?: "cost_per_request" | "daily_cost" | "monthly_cost" | "cost_efficiency" | "token_usage";
        threshold?: number;
        operator?: "gt" | "lt" | "gte" | "lte" | "eq";
    }, {
        duration?: number;
        metric?: "cost_per_request" | "daily_cost" | "monthly_cost" | "cost_efficiency" | "token_usage";
        threshold?: number;
        operator?: "gt" | "lt" | "gte" | "lte" | "eq";
    }>;
    action: z.ZodObject<{
        type: z.ZodEnum<["switch_to_cheaper_model", "switch_to_cheaper_provider", "enable_batching", "enable_caching", "send_alert", "scale_down"]>;
        parameters: z.ZodRecord<z.ZodString, z.ZodAny>;
        priority: z.ZodEnum<["low", "medium", "high", "critical"]>;
    }, "strip", z.ZodTypeAny, {
        type?: "send_alert" | "switch_to_cheaper_model" | "switch_to_cheaper_provider" | "enable_batching" | "enable_caching" | "scale_down";
        priority?: "critical" | "low" | "medium" | "high";
        parameters?: Record<string, any>;
    }, {
        type?: "send_alert" | "switch_to_cheaper_model" | "switch_to_cheaper_provider" | "enable_batching" | "enable_caching" | "scale_down";
        priority?: "critical" | "low" | "medium" | "high";
        parameters?: Record<string, any>;
    }>;
    isActive: z.ZodBoolean;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    type?: "auto_scaling" | "budget_alert" | "model_switch" | "provider_switch" | "request_batching" | "cache_optimization";
    name?: string;
    id?: string;
    action?: {
        type?: "send_alert" | "switch_to_cheaper_model" | "switch_to_cheaper_provider" | "enable_batching" | "enable_caching" | "scale_down";
        priority?: "critical" | "low" | "medium" | "high";
        parameters?: Record<string, any>;
    };
    createdAt?: Date;
    updatedAt?: Date;
    description?: string;
    isActive?: boolean;
    condition?: {
        duration?: number;
        metric?: "cost_per_request" | "daily_cost" | "monthly_cost" | "cost_efficiency" | "token_usage";
        threshold?: number;
        operator?: "gt" | "lt" | "gte" | "lte" | "eq";
    };
}, {
    type?: "auto_scaling" | "budget_alert" | "model_switch" | "provider_switch" | "request_batching" | "cache_optimization";
    name?: string;
    id?: string;
    action?: {
        type?: "send_alert" | "switch_to_cheaper_model" | "switch_to_cheaper_provider" | "enable_batching" | "enable_caching" | "scale_down";
        priority?: "critical" | "low" | "medium" | "high";
        parameters?: Record<string, any>;
    };
    createdAt?: Date;
    updatedAt?: Date;
    description?: string;
    isActive?: boolean;
    condition?: {
        duration?: number;
        metric?: "cost_per_request" | "daily_cost" | "monthly_cost" | "cost_efficiency" | "token_usage";
        threshold?: number;
        operator?: "gt" | "lt" | "gte" | "lte" | "eq";
    };
}>;
declare const CostAnalysisSchema: z.ZodObject<{
    id: z.ZodString;
    organizationId: z.ZodString;
    analysisType: z.ZodEnum<["daily", "weekly", "monthly", "custom"]>;
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
        totalCost: z.ZodNumber;
        totalRequests: z.ZodNumber;
        averageCostPerRequest: z.ZodNumber;
        costEfficiency: z.ZodNumber;
        topModels: z.ZodArray<z.ZodObject<{
            model: z.ZodString;
            cost: z.ZodNumber;
            requests: z.ZodNumber;
            efficiency: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            model?: string;
            cost?: number;
            efficiency?: number;
            requests?: number;
        }, {
            model?: string;
            cost?: number;
            efficiency?: number;
            requests?: number;
        }>, "many">;
        topProviders: z.ZodArray<z.ZodObject<{
            provider: z.ZodString;
            cost: z.ZodNumber;
            requests: z.ZodNumber;
            efficiency: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            provider?: string;
            cost?: number;
            efficiency?: number;
            requests?: number;
        }, {
            provider?: string;
            cost?: number;
            efficiency?: number;
            requests?: number;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        totalCost?: number;
        totalRequests?: number;
        topModels?: {
            model?: string;
            cost?: number;
            efficiency?: number;
            requests?: number;
        }[];
        averageCostPerRequest?: number;
        costEfficiency?: number;
        topProviders?: {
            provider?: string;
            cost?: number;
            efficiency?: number;
            requests?: number;
        }[];
    }, {
        totalCost?: number;
        totalRequests?: number;
        topModels?: {
            model?: string;
            cost?: number;
            efficiency?: number;
            requests?: number;
        }[];
        averageCostPerRequest?: number;
        costEfficiency?: number;
        topProviders?: {
            provider?: string;
            cost?: number;
            efficiency?: number;
            requests?: number;
        }[];
    }>;
    recommendations: z.ZodArray<z.ZodObject<{
        type: z.ZodString;
        impact: z.ZodNumber;
        description: z.ZodString;
        implementation: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type?: string;
        impact?: number;
        description?: string;
        implementation?: string;
    }, {
        type?: string;
        impact?: number;
        description?: string;
        implementation?: string;
    }>, "many">;
    generatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    organizationId?: string;
    period?: {
        end?: Date;
        start?: Date;
    };
    id?: string;
    summary?: {
        totalCost?: number;
        totalRequests?: number;
        topModels?: {
            model?: string;
            cost?: number;
            efficiency?: number;
            requests?: number;
        }[];
        averageCostPerRequest?: number;
        costEfficiency?: number;
        topProviders?: {
            provider?: string;
            cost?: number;
            efficiency?: number;
            requests?: number;
        }[];
    };
    recommendations?: {
        type?: string;
        impact?: number;
        description?: string;
        implementation?: string;
    }[];
    generatedAt?: Date;
    analysisType?: "custom" | "monthly" | "daily" | "weekly";
}, {
    organizationId?: string;
    period?: {
        end?: Date;
        start?: Date;
    };
    id?: string;
    summary?: {
        totalCost?: number;
        totalRequests?: number;
        topModels?: {
            model?: string;
            cost?: number;
            efficiency?: number;
            requests?: number;
        }[];
        averageCostPerRequest?: number;
        costEfficiency?: number;
        topProviders?: {
            provider?: string;
            cost?: number;
            efficiency?: number;
            requests?: number;
        }[];
    };
    recommendations?: {
        type?: string;
        impact?: number;
        description?: string;
        implementation?: string;
    }[];
    generatedAt?: Date;
    analysisType?: "custom" | "monthly" | "daily" | "weekly";
}>;
declare const CostAlertSchema: z.ZodObject<{
    id: z.ZodString;
    organizationId: z.ZodString;
    type: z.ZodEnum<["budget_warning", "budget_exceeded", "cost_spike", "inefficiency_detected", "optimization_opportunity"]>;
    severity: z.ZodEnum<["low", "medium", "high", "critical"]>;
    status: z.ZodEnum<["active", "acknowledged", "resolved"]>;
    message: z.ZodString;
    currentValue: z.ZodNumber;
    threshold: z.ZodNumber;
    metadata: z.ZodRecord<z.ZodString, z.ZodAny>;
    triggeredAt: z.ZodDate;
    resolvedAt: z.ZodOptional<z.ZodDate>;
    createdAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    message?: string;
    type?: "budget_warning" | "budget_exceeded" | "optimization_opportunity" | "cost_spike" | "inefficiency_detected";
    status?: "acknowledged" | "active" | "resolved";
    organizationId?: string;
    metadata?: Record<string, any>;
    id?: string;
    severity?: "critical" | "low" | "medium" | "high";
    createdAt?: Date;
    threshold?: number;
    currentValue?: number;
    resolvedAt?: Date;
    triggeredAt?: Date;
}, {
    message?: string;
    type?: "budget_warning" | "budget_exceeded" | "optimization_opportunity" | "cost_spike" | "inefficiency_detected";
    status?: "acknowledged" | "active" | "resolved";
    organizationId?: string;
    metadata?: Record<string, any>;
    id?: string;
    severity?: "critical" | "low" | "medium" | "high";
    createdAt?: Date;
    threshold?: number;
    currentValue?: number;
    resolvedAt?: Date;
    triggeredAt?: Date;
}>;
export type CostOptimizationRule = z.infer<typeof CostOptimizationRuleSchema>;
export type CostAnalysis = z.infer<typeof CostAnalysisSchema>;
export type CostAlert = z.infer<typeof CostAlertSchema>;
export interface CostOptimizationRequest {
    organizationId: string;
    currentCost: number;
    currentUsage: {
        requests: number;
        tokens: number;
        models: string[];
        providers: string[];
    };
    budget: {
        daily: number;
        monthly: number;
        perRequest: number;
    };
}
export interface CostOptimizationResponse {
    optimized: boolean;
    actions: Array<{
        type: string;
        parameters: Record<string, any>;
        impact: number;
        description: string;
        estimatedSavings: number;
    }>;
    recommendations: string[];
    metrics: {
        before: number;
        after: number;
        savings: number;
        efficiency: number;
    };
}
export interface CostTrend {
    period: string;
    cost: number;
    requests: number;
    efficiency: number;
    topModel: string;
    topProvider: string;
}
export declare class AICostOptimizationService {
    private db;
    private rulesCache;
    private alertsCache;
    private costHistory;
    private readonly MODEL_COSTS;
    constructor();
    private initializeService;
    private createTables;
    private loadOptimizationRules;
    private initializeDefaultRules;
    private startCostMonitoring;
    createOptimizationRule(rule: Omit<CostOptimizationRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<CostOptimizationRule>;
    getOptimizationRules(): Promise<CostOptimizationRule[]>;
    generateCostAnalysis(organizationId: string, analysisType: CostAnalysis['analysisType'], period: {
        start: Date;
        end: Date;
    }): Promise<CostAnalysis>;
    private getCostMetrics;
    private calculateCostEfficiency;
    private getTopModels;
    private getTopProviders;
    private generateRecommendations;
    optimizeCosts(request: CostOptimizationRequest): Promise<CostOptimizationResponse>;
    private analyzeCurrentUsage;
    createCostAlert(alert: Omit<CostAlert, 'id' | 'triggeredAt' | 'createdAt'>): Promise<CostAlert>;
    getCostAlerts(organizationId?: string): Promise<CostAlert[]>;
    getCostTrends(organizationId: string, days?: number): Promise<CostTrend[]>;
    private analyzeCostTrends;
    private evaluateOptimizationRules;
    private evaluateRule;
    private executeOptimizationAction;
    private generateCostInsights;
    private getActiveOrganizations;
    getHealthStatus(): Promise<{
        status: 'healthy' | 'degraded' | 'unhealthy';
        services: Record<string, boolean>;
        lastCheck: Date;
    }>;
    private checkDatabaseHealth;
}
export declare const aiCostOptimizationService: AICostOptimizationService;
export {};
//# sourceMappingURL=ai-cost-optimization.service.d.ts.map