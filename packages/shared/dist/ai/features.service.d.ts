import { z } from 'zod';
export declare const AdvancedAIRequestSchema: z.ZodObject<{
    sessionId: z.ZodString;
    userId: z.ZodString;
    organizationId: z.ZodString;
    featureType: z.ZodEnum<["multimodal", "reasoning", "code-generation", "document-analysis", "voice-processing", "image-analysis", "nlp-advanced", "automation"]>;
    input: z.ZodObject<{
        text: z.ZodOptional<z.ZodString>;
        images: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        audio: z.ZodOptional<z.ZodString>;
        documents: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        code: z.ZodOptional<z.ZodString>;
        data: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        context: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        preferences: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        code?: string;
        context?: Record<string, any>;
        data?: Record<string, any>;
        text?: string;
        images?: string[];
        audio?: string;
        documents?: string[];
        preferences?: Record<string, any>;
    }, {
        code?: string;
        context?: Record<string, any>;
        data?: Record<string, any>;
        text?: string;
        images?: string[];
        audio?: string;
        documents?: string[];
        preferences?: Record<string, any>;
    }>;
    options: z.ZodOptional<z.ZodObject<{
        model: z.ZodOptional<z.ZodString>;
        temperature: z.ZodOptional<z.ZodNumber>;
        maxTokens: z.ZodOptional<z.ZodNumber>;
        stream: z.ZodOptional<z.ZodBoolean>;
        includeMetadata: z.ZodOptional<z.ZodBoolean>;
        advancedOptions: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        model?: string;
        maxTokens?: number;
        temperature?: number;
        stream?: boolean;
        includeMetadata?: boolean;
        advancedOptions?: Record<string, any>;
    }, {
        model?: string;
        maxTokens?: number;
        temperature?: number;
        stream?: boolean;
        includeMetadata?: boolean;
        advancedOptions?: Record<string, any>;
    }>>;
}, "strip", z.ZodTypeAny, {
    options?: {
        model?: string;
        maxTokens?: number;
        temperature?: number;
        stream?: boolean;
        includeMetadata?: boolean;
        advancedOptions?: Record<string, any>;
    };
    userId?: string;
    organizationId?: string;
    sessionId?: string;
    input?: {
        code?: string;
        context?: Record<string, any>;
        data?: Record<string, any>;
        text?: string;
        images?: string[];
        audio?: string;
        documents?: string[];
        preferences?: Record<string, any>;
    };
    featureType?: "multimodal" | "reasoning" | "code-generation" | "document-analysis" | "voice-processing" | "image-analysis" | "nlp-advanced" | "automation";
}, {
    options?: {
        model?: string;
        maxTokens?: number;
        temperature?: number;
        stream?: boolean;
        includeMetadata?: boolean;
        advancedOptions?: Record<string, any>;
    };
    userId?: string;
    organizationId?: string;
    sessionId?: string;
    input?: {
        code?: string;
        context?: Record<string, any>;
        data?: Record<string, any>;
        text?: string;
        images?: string[];
        audio?: string;
        documents?: string[];
        preferences?: Record<string, any>;
    };
    featureType?: "multimodal" | "reasoning" | "code-generation" | "document-analysis" | "voice-processing" | "image-analysis" | "nlp-advanced" | "automation";
}>;
export declare const AdvancedAIResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    data: z.ZodObject<{
        featureType: z.ZodString;
        output: z.ZodAny;
        metadata: z.ZodObject<{
            model: z.ZodString;
            tokens: z.ZodObject<{
                input: z.ZodNumber;
                output: z.ZodNumber;
                total: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                total?: number;
                input?: number;
                output?: number;
            }, {
                total?: number;
                input?: number;
                output?: number;
            }>;
            processingTime: z.ZodNumber;
            confidence: z.ZodOptional<z.ZodNumber>;
            suggestions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            advancedMetrics: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        }, "strip", z.ZodTypeAny, {
            model?: string;
            tokens?: {
                total?: number;
                input?: number;
                output?: number;
            };
            confidence?: number;
            processingTime?: number;
            suggestions?: string[];
            advancedMetrics?: Record<string, any>;
        }, {
            model?: string;
            tokens?: {
                total?: number;
                input?: number;
                output?: number;
            };
            confidence?: number;
            processingTime?: number;
            suggestions?: string[];
            advancedMetrics?: Record<string, any>;
        }>;
        insights: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        recommendations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        nextSteps: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        metadata?: {
            model?: string;
            tokens?: {
                total?: number;
                input?: number;
                output?: number;
            };
            confidence?: number;
            processingTime?: number;
            suggestions?: string[];
            advancedMetrics?: Record<string, any>;
        };
        output?: any;
        insights?: string[];
        recommendations?: string[];
        featureType?: string;
        nextSteps?: string[];
    }, {
        metadata?: {
            model?: string;
            tokens?: {
                total?: number;
                input?: number;
                output?: number;
            };
            confidence?: number;
            processingTime?: number;
            suggestions?: string[];
            advancedMetrics?: Record<string, any>;
        };
        output?: any;
        insights?: string[];
        recommendations?: string[];
        featureType?: string;
        nextSteps?: string[];
    }>;
    error: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    error?: string;
    data?: {
        metadata?: {
            model?: string;
            tokens?: {
                total?: number;
                input?: number;
                output?: number;
            };
            confidence?: number;
            processingTime?: number;
            suggestions?: string[];
            advancedMetrics?: Record<string, any>;
        };
        output?: any;
        insights?: string[];
        recommendations?: string[];
        featureType?: string;
        nextSteps?: string[];
    };
    success?: boolean;
}, {
    error?: string;
    data?: {
        metadata?: {
            model?: string;
            tokens?: {
                total?: number;
                input?: number;
                output?: number;
            };
            confidence?: number;
            processingTime?: number;
            suggestions?: string[];
            advancedMetrics?: Record<string, any>;
        };
        output?: any;
        insights?: string[];
        recommendations?: string[];
        featureType?: string;
        nextSteps?: string[];
    };
    success?: boolean;
}>;
export type AdvancedAIRequest = z.infer<typeof AdvancedAIRequestSchema>;
export type AdvancedAIResponse = z.infer<typeof AdvancedAIResponseSchema>;
export declare class AdvancedAIFeaturesService {
    private db;
    private featureCache;
    private modelRegistry;
    private readonly CACHE_TTL;
    constructor();
    private initializeService;
    private initializeAdvancedTables;
    private registerAdvancedModels;
    private startBackgroundProcessing;
    processAdvancedFeature(request: AdvancedAIRequest): Promise<AdvancedAIResponse>;
    private processMultimodalRequest;
    private processReasoningRequest;
    private processCodeGenerationRequest;
    private processDocumentAnalysisRequest;
    private processVoiceProcessingRequest;
    private processImageAnalysisRequest;
    private processNLPAdvancedRequest;
    private processAutomationRequest;
    private simulateAdvancedAIResponse;
    private estimateAdvancedTokens;
    private generateCacheKey;
    private getCachedResult;
    private setCachedResult;
    private processAdvancedInsights;
    private generateAdvancedInsights;
    private createAdvancedInsight;
    private cleanupOldData;
    private recordAdvancedRequest;
    getAvailableAdvancedModels(): Promise<any[]>;
    getAdvancedInsights(organizationId: string, limit?: number): Promise<any[]>;
    getHealthStatus(): Promise<{
        status: 'healthy' | 'degraded' | 'unhealthy';
        services: Record<string, boolean>;
        lastCheck: Date;
    }>;
}
export declare const advancedAIFeaturesService: AdvancedAIFeaturesService;
//# sourceMappingURL=features.service.d.ts.map