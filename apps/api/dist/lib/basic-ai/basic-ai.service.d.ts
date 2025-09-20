export interface AIResponse {
    id: string;
    type: 'text' | 'analysis' | 'prediction' | 'search';
    content: string;
    confidence: number;
    metadata: {
        model: string;
        timestamp: Date;
        processingTime: number;
        tokens?: number;
    };
    suggestions?: string[];
}
export interface AIContext {
    userId: string;
    organizationId: string;
    sessionId: string;
    previousMessages?: AIResponse[];
    userPreferences?: {
        language: string;
        responseStyle: 'formal' | 'casual' | 'technical';
        maxLength: number;
    };
}
export interface AIRequest {
    prompt: string;
    context: AIContext;
    options?: {
        maxTokens?: number;
        temperature?: number;
        includeAnalysis?: boolean;
        includeSuggestions?: boolean;
    };
}
export declare class BasicAIService {
    private db;
    private sessionCache;
    constructor();
    private initializeService;
    private checkAIServicesHealth;
    generateResponse(request: AIRequest): Promise<AIResponse>;
    private determineResponseType;
    private generateTextResponse;
    private generateAnalysisResponse;
    private generatePredictionResponse;
    private generateSearchResponse;
    private generateSuggestions;
    private generateAnalysisRecommendations;
    private generateAnalysisSuggestions;
    private generatePredictionSuggestions;
    private generateSearchSuggestions;
    private updateSessionCache;
    private saveAIInteraction;
    createSession(userId: string, organizationId: string): Promise<string>;
    getSessionHistory(sessionId: string): Promise<AIResponse[]>;
    clearSession(sessionId: string): Promise<void>;
    getHealthStatus(): Promise<{
        status: 'healthy' | 'degraded' | 'unhealthy';
        services: Record<string, boolean>;
        lastCheck: Date;
    }>;
}
export declare const basicAIService: BasicAIService;
//# sourceMappingURL=basic-ai.service.d.ts.map