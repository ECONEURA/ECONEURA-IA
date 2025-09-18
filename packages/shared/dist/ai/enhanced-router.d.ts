import { z } from 'zod';
declare const AIRequestSchema: z.ZodObject<{
    orgId: z.ZodString;
    prompt: z.ZodString;
    model: z.ZodOptional<z.ZodString>;
    maxTokens: z.ZodOptional<z.ZodNumber>;
    temperature: z.ZodOptional<z.ZodNumber>;
    maxCostEUR: z.ZodOptional<z.ZodNumber>;
    providerHint: z.ZodOptional<z.ZodEnum<["mistral", "azure-openai"]>>;
    language: z.ZodOptional<z.ZodString>;
    sensitivity: z.ZodOptional<z.ZodEnum<["low", "medium", "high"]>>;
}, "strip", z.ZodTypeAny, {
    orgId?: string;
    model?: string;
    prompt?: string;
    maxTokens?: number;
    temperature?: number;
    maxCostEUR?: number;
    providerHint?: "mistral" | "azure-openai";
    language?: string;
    sensitivity?: "medium" | "low" | "high";
}, {
    orgId?: string;
    model?: string;
    prompt?: string;
    maxTokens?: number;
    temperature?: number;
    maxCostEUR?: number;
    providerHint?: "mistral" | "azure-openai";
    language?: string;
    sensitivity?: "medium" | "low" | "high";
}>;
declare const AIResponseSchema: z.ZodObject<{
    content: z.ZodString;
    model: z.ZodString;
    provider: z.ZodString;
    tokens: z.ZodObject<{
        input: z.ZodNumber;
        output: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        input?: number;
        output?: number;
    }, {
        input?: number;
        output?: number;
    }>;
    costEUR: z.ZodNumber;
    latencyMs: z.ZodNumber;
    fallbackUsed: z.ZodBoolean;
    requestId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    model?: string;
    tokens?: {
        input?: number;
        output?: number;
    };
    content?: string;
    provider?: string;
    costEUR?: number;
    latencyMs?: number;
    fallbackUsed?: boolean;
    requestId?: string;
}, {
    model?: string;
    tokens?: {
        input?: number;
        output?: number;
    };
    content?: string;
    provider?: string;
    costEUR?: number;
    latencyMs?: number;
    fallbackUsed?: boolean;
    requestId?: string;
}>;
export type AIRequest = z.infer<typeof AIRequestSchema>;
export type AIResponse = z.infer<typeof AIResponseSchema>;
export interface RouterDecision {
    provider: string;
    model: string;
    maxRetries: number;
    timeoutMs: number;
    fallbackProvider?: string;
}
export declare class EnhancedAIRouter {
    private costGuardrails;
    private providerManager;
    private config;
    private activeRequests;
    private tracer;
    private meter;
    constructor(config?: {});
    routeRequest(request: AIRequest): Promise<AIResponse>;
    private makeRoutingDecision;
    private executeWithFallback;
    private executeRequest;
    private recordRequestCompletion;
    private handleCostAlert;
    private setupDefaultCostLimits;
    private generateRequestId;
    private estimateTokens;
    private classifyError;
    getProviderHealth(): Promise<Record<string, any>>;
    getCostUsage(orgId: string): Promise<{
        currentMonthly: number;
        limit: number;
        usagePercent: number;
    }>;
}
export declare function createEnhancedAIRouter(config?: Partial<{
    costGuardrailsEnabled: boolean;
    telemetryEnabled: boolean;
    defaultMaxCostEUR: number;
    emergencyStopEnabled: boolean;
    healthCheckInterval: number;
}>): EnhancedAIRouter;
export {};
//# sourceMappingURL=enhanced-router.d.ts.map