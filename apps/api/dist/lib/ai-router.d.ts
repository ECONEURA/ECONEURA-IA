export interface AIRequest {
    prompt: string;
    type: 'chat' | 'image' | 'tts';
    options?: Record<string, any>;
}
export interface AIResponse {
    content: string;
    usage?: {
        tokens: number;
        cost: number;
    };
}
export declare class AIRouter {
    process(request: AIRequest): Promise<AIResponse>;
}
export declare const aiRouter: AIRouter;
//# sourceMappingURL=ai-router.d.ts.map