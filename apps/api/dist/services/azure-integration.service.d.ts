export interface AzureOpenAIConfig {
    endpoint: string;
    apiKey: string;
    apiVersion: string;
    chatDeployment: string;
    imageDeployment?: string;
    speechKey?: string;
    speechRegion?: string;
}
export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}
export interface ChatRequest {
    messages: ChatMessage[];
    maxTokens?: number;
    temperature?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    stop?: string[];
}
export interface ChatResponse {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: Array<{
        index: number;
        message: ChatMessage;
        finishReason: string;
    }>;
    usage: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
}
export interface ImageRequest {
    prompt: string;
    size?: '1024x1024' | '1792x1024' | '1024x1792';
    quality?: 'standard' | 'hd';
    style?: 'vivid' | 'natural';
    n?: number;
}
export interface ImageResponse {
    created: number;
    data: Array<{
        url: string;
        revisedPrompt?: string;
    }>;
}
export interface TTSRequest {
    text: string;
    voice?: string;
    language?: string;
    outputFormat?: 'mp3' | 'wav' | 'ogg';
    rate?: number;
    pitch?: number;
}
export interface TTSResponse {
    audioData: ArrayBuffer;
    contentType: string;
    duration: number;
}
export interface AzureServiceHealth {
    service: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    lastCheck: Date;
    responseTime?: number;
    error?: string;
}
export declare class AzureIntegrationService {
    private config;
    private isInitialized;
    private healthCache;
    private lastHealthCheck;
    constructor();
    private loadConfiguration;
    private initializeService;
    generateChatCompletion(request: ChatRequest): Promise<ChatResponse>;
    private generateDemoChatResponse;
    private generateDemoResponse;
    generateImage(request: ImageRequest): Promise<ImageResponse>;
    private generateDemoImageResponse;
    generateSpeech(request: TTSRequest): Promise<TTSResponse>;
    private generateSSML;
    private escapeXml;
    private estimateAudioDuration;
    private generateDemoSpeechResponse;
    checkServiceHealth(): Promise<Map<string, AzureServiceHealth>>;
    private checkSpecificService;
    private testChatService;
    private testImageService;
    private testSpeechService;
    getConfiguration(): Partial<AzureOpenAIConfig>;
    isConfigured(): boolean;
    getAvailableServices(): string[];
}
export declare const azureIntegration: AzureIntegrationService;
//# sourceMappingURL=azure-integration.service.d.ts.map