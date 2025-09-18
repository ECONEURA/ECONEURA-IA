export interface LLMProvider {
    id: string;
    name: string;
    type: 'edge' | 'cloud';
    enabled: boolean;
    healthEndpoint?: string;
    models: LLMModel[];
    rateLimits: RateLimits;
    costPerToken: CostStructure;
    capabilities: ProviderCapabilities;
    config: ProviderConfig;
    execute?: (req: any) => Promise<any>;
}
export interface LLMModel {
    id: string;
    name: string;
    contextWindow: number;
    inputCostPer1KTokens: number;
    outputCostPer1KTokens: number;
    maxOutputTokens: number;
    capabilities: string[];
}
export interface RateLimits {
    requestsPerMinute: number;
    requestsPerDay: number;
    tokensPerMinute: number;
    tokensPerDay: number;
}
export interface CostStructure {
    inputTokensPer1K: number;
    outputTokensPer1K: number;
    imageAnalysis?: number;
    functionCalling?: number;
}
export interface ProviderCapabilities {
    functionCalling: boolean;
    imageAnalysis: boolean;
    codeInterpreter: boolean;
    streaming: boolean;
    embeddings: boolean;
    languages: string[];
    maxConcurrent: number;
}
export interface ProviderConfig {
    baseUrl: string;
    apiKey?: string;
    region?: string;
    timeout: number;
    retryAttempts: number;
    headers?: Record<string, string>;
}
export interface ProviderHealth {
    providerId: string;
    status: 'healthy' | 'degraded' | 'down';
    latency: number;
    errorRate: number;
    lastCheck: Date;
    details?: {
        responseTime: number;
        availability: number;
        concurrentRequests: number;
    };
}
export declare class LLMProviderManager {
    private providers;
    private healthStatus;
    private requestCounters;
    constructor();
    private initializeDefaultProviders;
    addProvider(provider: LLMProvider): void;
    getProvider(providerId: string): LLMProvider | undefined;
    getAllProviders(): LLMProvider[];
    getEnabledProviders(): LLMProvider[];
    getProvidersByType(type: 'edge' | 'cloud'): LLMProvider[];
    getProvidersWithCapability(capability: keyof ProviderCapabilities): LLMProvider[];
    getBestProvider(requirements: {
        capabilities?: string[];
        languages?: string[];
        maxCost?: number;
        preferEdge?: boolean;
        excludeProviders?: string[];
    }): LLMProvider | null;
    checkRateLimit(providerId: string, tokensRequested: number): {
        allowed: boolean;
        reason?: string;
        resetTime?: number;
    };
    getProviderHealth(providerId: string): ProviderHealth | undefined;
    getAllProviderHealth(): ProviderHealth[];
    private startHealthMonitoring;
    private checkAllProviderHealth;
    private checkProviderHealth;
    estimateCost(providerId: string, modelId: string, inputTokens: number, outputTokens: number, extras?: {
        images?: number;
        functionCalls?: number;
    }): number;
}
//# sourceMappingURL=providers.d.ts.map