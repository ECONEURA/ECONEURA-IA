interface AIServiceConfig {
    endpoint: string;
    apiKey: string;
    apiVersion: string;
}
interface CompletionRequest {
    prompt: string;
    maxTokens?: number;
    temperature?: number;
    model?: string;
    orgId: string;
}
export declare class AzureOpenAIService {
    private client;
    private defaultModel;
    constructor(config?: AIServiceConfig);
    getHealth(): Promise<{
        status: string;
        latency: number;
    }>;
    complete(request: CompletionRequest): Promise<string>;
    private checkQuota;
    private calculateMetrics;
    private calculateCost;
    private recordMetrics;
    private handleError;
}
export {};
//# sourceMappingURL=ai.d.ts.map