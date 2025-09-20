import { z } from 'zod';
export interface Prediction {
    id: string;
    modelId: string;
    type: 'forecast' | 'classification' | 'regression' | 'anomaly' | 'recommendation' | 'clustering';
    input: Record<string, any>;
    output: Record<string, any>;
    confidence: number;
    accuracy?: number;
    timestamp: Date;
    organizationId: string;
    createdBy: string;
    metadata?: Record<string, any>;
    tags: string[];
}
export interface CreatePredictionRequest {
    modelId: string;
    type: Prediction['type'];
    input: Record<string, any>;
    metadata?: Record<string, any>;
}
export interface ForecastPoint {
    timestamp: Date;
    value: number;
    confidence: number;
}
export interface Forecast {
    id: string;
    modelId: string;
    series: string;
    horizon: number;
    frequency: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly';
    predictions: ForecastPoint[];
    confidenceInterval: {
        lower: number[];
        upper: number[];
    };
    accuracy: number;
    mape: number;
    rmse: number;
    mae: number;
    timestamp: Date;
    organizationId: string;
    metadata?: Record<string, any>;
}
export interface CreateForecastRequest {
    modelId: string;
    series: string;
    horizon: number;
    frequency: Forecast['frequency'];
    input: {
        baseValue?: number;
        trend?: number;
        seasonality?: number;
        confidenceLevel?: number;
    };
    metadata?: Record<string, any>;
}
export interface AnomalyDetection {
    id: string;
    modelId: string;
    dataPoint: Record<string, any>;
    anomalyScore: number;
    threshold: number;
    isAnomaly: boolean;
    severity: 'low' | 'medium' | 'high' | 'critical';
    explanation: string;
    recommendations: string[];
    timestamp: Date;
    organizationId: string;
    metadata: Record<string, any>;
}
export interface RecommendationItem {
    itemId: string;
    score: number;
    reason: string;
    metadata: Record<string, any>;
}
export interface Recommendation {
    id: string;
    modelId: string;
    userId?: string;
    itemId?: string;
    context: Record<string, any>;
    recommendations: RecommendationItem[];
    confidence: number;
    algorithm: string;
    timestamp: Date;
    organizationId: string;
    metadata: Record<string, any>;
}
export interface AgentDescriptor {
    id: string;
    name: string;
    description: string;
    category: 'sales' | 'marketing' | 'operations' | 'finance' | 'support';
    inputs: z.ZodSchema<any>;
    outputs: z.ZodSchema<any>;
    policy: AgentPolicy;
    costHint: number;
    version: string;
    enabled: boolean;
    maxRetries: number;
    timeoutMs: number;
}
export interface AgentPolicy {
    requiresApproval: boolean;
    maxCostEUR: number;
    allowedProviders: ('mistral' | 'azure-openai')[];
    sensitivityLevel: 'low' | 'medium' | 'high';
    rateLimitPerHour: number;
}
export interface AgentRun {
    id: string;
    agentId: string;
    organizationId: string;
    userId: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
    inputs: Record<string, any>;
    outputs?: Record<string, any>;
    error?: string;
    startedAt: Date;
    completedAt?: Date;
    durationMs?: number;
    costEUR: number;
    provider: 'mistral' | 'azure-openai' | null;
    retryCount: number;
    idempotencyKey?: string;
    correlationId: string;
    metadata: Record<string, any>;
}
export interface AgentTask {
    id: string;
    runId: string;
    agentId: string;
    organizationId: string;
    step: number;
    name: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    inputs: Record<string, any>;
    outputs?: Record<string, any>;
    error?: string;
    startedAt: Date;
    completedAt?: Date;
    durationMs?: number;
    costEUR: number;
}
export interface RunAgentRequest {
    agentId: string;
    inputs: Record<string, any>;
    idempotencyKey?: string;
    maxCostEUR?: number;
    providerHint?: 'mistral' | 'azure-openai';
    priority?: 'low' | 'normal' | 'high';
    metadata?: Record<string, any>;
}
export interface RunAgentResponse {
    runId: string;
    status: AgentRun['status'];
    estimatedDurationMs: number;
    estimatedCostEUR: number;
    queuePosition?: number;
}
export interface GetAgentRunResponse {
    run: AgentRun;
    tasks: AgentTask[];
    logs: AgentLog[];
}
export interface AgentLog {
    id: string;
    runId: string;
    level: 'debug' | 'info' | 'warn' | 'error';
    message: string;
    timestamp: Date;
    metadata?: Record<string, any>;
}
export interface CockpitOverview {
    agents: {
        total: number;
        running: number;
        completed: number;
        failed: number;
        queued: number;
    };
    costs: {
        totalEUR: number;
        todayEUR: number;
        averagePerRun: number;
        budgetUsedPct: number;
    };
    performance: {
        avgDurationMs: number;
        successRate: number;
        p95DurationMs: number;
        throughputPerHour: number;
    };
    providers: {
        mistralUsage: number;
        azureOpenAIUsage: number;
        fallbackRate: number;
    };
    alerts: CockpitAlert[];
    timestamp: Date;
}
export interface CockpitAlert {
    id: string;
    type: 'budget' | 'performance' | 'error' | 'capacity';
    severity: 'info' | 'warning' | 'error' | 'critical';
    message: string;
    timestamp: Date;
    acknowledged: boolean;
}
export interface AgentMetrics {
    agentId: string;
    name: string;
    category: string;
    runs: {
        total: number;
        completed: number;
        failed: number;
        avgDurationMs: number;
        successRate: number;
    };
    costs: {
        totalEUR: number;
        avgCostPerRun: number;
        costTrend: 'up' | 'down' | 'stable';
    };
    performance: {
        p50DurationMs: number;
        p95DurationMs: number;
        p99DurationMs: number;
        throughputPerHour: number;
    };
    lastRun?: Date;
    enabled: boolean;
}
export interface CostMetrics {
    organizationId: string;
    period: 'hour' | 'day' | 'week' | 'month';
    totalCostEUR: number;
    budgetEUR: number;
    budgetUsedPct: number;
    costByProvider: Record<string, number>;
    costByAgent: Record<string, number>;
    costByCategory: Record<string, number>;
    trend: Array<{
        timestamp: Date;
        cost: number;
    }>;
    projectedMonthlyEUR: number;
    alerts: CockpitAlert[];
}
export interface PredictiveAnalyticsConfig {
    forecasting: boolean;
    anomalyDetection: boolean;
    riskPrediction: boolean;
    customerBehaviorPrediction: boolean;
    marketAnalysis: boolean;
    performancePrediction: boolean;
    churnPrediction: boolean;
    demandForecasting: boolean;
}
export declare const CreatePredictionRequestSchema: z.ZodObject<{
    modelId: z.ZodString;
    type: z.ZodEnum<["forecast", "classification", "regression", "anomaly", "recommendation", "clustering"]>;
    input: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    type?: "anomaly" | "clustering" | "classification" | "recommendation" | "forecast" | "regression";
    metadata?: Record<string, unknown>;
    input?: Record<string, unknown>;
    modelId?: string;
}, {
    type?: "anomaly" | "clustering" | "classification" | "recommendation" | "forecast" | "regression";
    metadata?: Record<string, unknown>;
    input?: Record<string, unknown>;
    modelId?: string;
}>;
export declare const CreateForecastRequestSchema: z.ZodObject<{
    modelId: z.ZodString;
    series: z.ZodString;
    horizon: z.ZodNumber;
    frequency: z.ZodEnum<["hourly", "daily", "weekly", "monthly", "yearly"]>;
    input: z.ZodObject<{
        baseValue: z.ZodOptional<z.ZodNumber>;
        trend: z.ZodOptional<z.ZodNumber>;
        seasonality: z.ZodOptional<z.ZodNumber>;
        confidenceLevel: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        trend?: number;
        seasonality?: number;
        baseValue?: number;
        confidenceLevel?: number;
    }, {
        trend?: number;
        seasonality?: number;
        baseValue?: number;
        confidenceLevel?: number;
    }>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    metadata?: Record<string, unknown>;
    input?: {
        trend?: number;
        seasonality?: number;
        baseValue?: number;
        confidenceLevel?: number;
    };
    modelId?: string;
    frequency?: "monthly" | "daily" | "weekly" | "yearly" | "hourly";
    series?: string;
    horizon?: number;
}, {
    metadata?: Record<string, unknown>;
    input?: {
        trend?: number;
        seasonality?: number;
        baseValue?: number;
        confidenceLevel?: number;
    };
    modelId?: string;
    frequency?: "monthly" | "daily" | "weekly" | "yearly" | "hourly";
    series?: string;
    horizon?: number;
}>;
export declare const RunAgentRequestSchema: z.ZodObject<{
    agentId: z.ZodString;
    inputs: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    idempotencyKey: z.ZodOptional<z.ZodString>;
    maxCostEUR: z.ZodOptional<z.ZodNumber>;
    providerHint: z.ZodOptional<z.ZodEnum<["mistral", "azure-openai"]>>;
    priority: z.ZodOptional<z.ZodEnum<["low", "normal", "high"]>>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    metadata?: Record<string, unknown>;
    idempotencyKey?: string;
    priority?: "low" | "high" | "normal";
    agentId?: string;
    maxCostEUR?: number;
    providerHint?: "azure-openai" | "mistral";
    inputs?: Record<string, unknown>;
}, {
    metadata?: Record<string, unknown>;
    idempotencyKey?: string;
    priority?: "low" | "high" | "normal";
    agentId?: string;
    maxCostEUR?: number;
    providerHint?: "azure-openai" | "mistral";
    inputs?: Record<string, unknown>;
}>;
export declare function isPrediction(obj: any): obj is Prediction;
export declare function isForecast(obj: any): obj is Forecast;
export declare function isAgentRun(obj: any): obj is AgentRun;
export type { Prediction, CreatePredictionRequest, ForecastPoint, Forecast, CreateForecastRequest, AnomalyDetection, RecommendationItem, Recommendation, AgentDescriptor, AgentPolicy, AgentRun, AgentTask, RunAgentRequest, RunAgentResponse, GetAgentRunResponse, AgentLog, CockpitOverview, CockpitAlert, AgentMetrics, CostMetrics, PredictiveAnalyticsConfig, };
//# sourceMappingURL=ai-ml-types.d.ts.map