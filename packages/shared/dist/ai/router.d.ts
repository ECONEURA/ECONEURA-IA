import type { AIRequest } from '../types/models/ai.js';
export interface RouterDecision {
    provider: 'mistral-edge' | 'openai-cloud' | 'azure-openai';
    endpoint: string;
    headers: Record<string, string>;
    shouldRedact: boolean;
    maxRetries: number;
    timeoutMs: number;
}
export interface RouterConfig {
    mistralEdgeUrl: string;
    openaiApiKey?: string;
    azureOpenaiEndpoint?: string;
    azureOpenaiKey?: string;
    defaultProvider: 'mistral-edge' | 'openai-cloud' | 'azure-openai';
    costLimitsEnabled: boolean;
}
export declare class AIRouter {
    private config;
    private costTracker;
    constructor(config: RouterConfig);
    routeRequest(request: AIRequest): Promise<RouterDecision>;
    private makeRoutingDecision;
    processRequest(content: string, decision: RouterDecision, request: AIRequest): Promise<{
        processedContent: string;
        tokens?: Record<string, string>;
    }>;
    estimateCostEUR(tokens: number, provider: string): number;
    updateCostTracking(orgId: string, costEUR: number): void;
    private isEdgeHealthy;
    getCurrentCost(orgId: string): number;
    resetMonthlyCosts(): void;
    isWithinBudget(orgId: string, budgetEUR: number): boolean;
    getBudgetUtilization(orgId: string, budgetEUR: number): number;
}
export declare function createAIRouter(config?: Partial<RouterConfig>): AIRouter;
//# sourceMappingURL=router.d.ts.map