export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}
export interface ChatResponse {
    content: string;
    usage: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    finishReason: string;
    model: string;
    timestamp: Date;
}
export interface ImageGenerationRequest {
    prompt: string;
    size?: '1024x1024' | '1792x1024' | '1024x1792';
    quality?: 'standard' | 'hd';
    style?: 'vivid' | 'natural';
}
export interface ImageGenerationResponse {
    url: string;
    revisedPrompt?: string;
    usage: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    timestamp: Date;
}
export interface TTSRequest {
    text: string;
    voice?: string;
    speed?: number;
    pitch?: number;
}
export interface TTSResponse {
    audioUrl: string;
    duration: number;
    format: string;
    usage: {
        characters: number;
        cost: number;
    };
    timestamp: Date;
}
export interface ContentFilterResult {
    filtered: boolean;
    reason?: string;
    severity?: 'low' | 'medium' | 'high';
}
export declare class AzureOpenAIService {
    private config;
    private isDemoMode;
    constructor();
    chat(messages: ChatMessage[], options?: {
        maxTokens?: number;
        temperature?: number;
        topP?: number;
        frequencyPenalty?: number;
        presencePenalty?: number;
    }): Promise<ChatResponse>;
    generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse>;
    textToSpeech(request: TTSRequest): Promise<TTSResponse>;
    checkContentFilter(messages: ChatMessage[]): Promise<ContentFilterResult>;
    getUsageStats(period?: string): Promise<{
        totalRequests: number;
        totalTokens: number;
        totalCost: number;
        requestsByType: Record<string, number>;
        averageTokensPerRequest: number;
    }>;
    private makeChatRequest;
    private makeImageRequest;
    private makeTTSRequest;
    private generateChatResponse;
    private generateDemoChatResponse;
    private generateDemoImageResponse;
    private generateDemoTTSResponse;
    getModelInfo(): Promise<{
        chatModels: string[];
        imageModels: string[];
        ttsVoices: string[];
        currentConfig: typeof this.config;
        demoMode: boolean;
    }>;
    testConnection(): Promise<{
        connected: boolean;
        latency: number;
        error?: string;
    }>;
    getCostEstimate(messages: ChatMessage[]): Promise<{
        estimatedTokens: number;
        estimatedCost: number;
        currency: string;
    }>;
}
export declare const azureOpenAI: AzureOpenAIService;
//# sourceMappingURL=azure-openai.service.d.ts.map