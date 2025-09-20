export interface CockpitAgentRequest {
    agentId: string;
    department: string;
    action: 'run' | 'pause' | 'stop' | 'status';
    parameters?: Record<string, any>;
}
export interface CockpitMetricsRequest {
    department: string;
    timeframe: string;
    includeDetails: boolean;
}
export interface CockpitChatRequest {
    department: string;
    message: string;
    context?: {
        agentId?: string;
        previousMessages?: string[];
        includeMetrics?: boolean;
    };
}
export interface CockpitAgentResponse {
    agentId: string;
    department: string;
    status: 'active' | 'paused' | 'stopped' | 'error';
    message: string;
    metrics: {
        tokens: number;
        cost: number;
        latency: number;
        calls: number;
    };
    timestamp: Date;
}
export interface CockpitMetricsResponse {
    department: string;
    timeframe: string;
    summary: {
        totalCost: number;
        totalTokens: number;
        averageLatency: number;
        successRate: number;
        activeAgents: number;
        errorRate: number;
    };
    details?: {
        costBreakdown: Array<{
            agentId: string;
            cost: number;
            tokens: number;
            calls: number;
        }>;
        performanceMetrics: Array<{
            agentId: string;
            latency: number;
            successRate: number;
            errorRate: number;
        }>;
        predictions: {
            costForecast: {
                optimistic: number;
                base: number;
                pessimistic: number;
            };
            usageForecast: {
                tokens: number;
                calls: number;
            };
            confidence: number;
        };
        optimizations: {
            activeRules: number;
            savings: number;
            recommendations: string[];
        };
        security: {
            complianceScore: number;
            activePolicies: number;
            incidents: number;
            lastAudit: Date;
        };
    };
    timestamp: Date;
}
export interface CockpitChatResponse {
    department: string;
    message: string;
    response: string;
    context: {
        agentId?: string;
        metrics?: {
            tokens: number;
            cost: number;
            latency: number;
        };
        suggestions: string[];
    };
    timestamp: Date;
}
export declare class CockpitIntegrationService {
    private static instance;
    private agentStates;
    private chatHistory;
    static getInstance(): CockpitIntegrationService;
    executeAgentAction(request: CockpitAgentRequest): Promise<CockpitAgentResponse>;
    getCockpitMetrics(request: CockpitMetricsRequest): Promise<CockpitMetricsResponse>;
    processCockpitChat(request: CockpitChatRequest): Promise<CockpitChatResponse>;
    getAgentStatus(agentId: string): Promise<CockpitAgentResponse | null>;
    getChatHistory(department: string, agentId?: string): Promise<Array<{
        role: 'user' | 'assistant';
        message: string;
        timestamp: Date;
    }>>;
    private processAgentAction;
    private generateCockpitMetrics;
    private generateChatResponse;
    private getCostData;
    private getPredictionData;
    private getOptimizationData;
    private getSecurityData;
    private generateCostBreakdown;
    private generatePerformanceMetrics;
    private generateSuggestions;
    private getDepartmentAgents;
    private getActiveAgentsCount;
    private getTimeframeMs;
}
export declare const cockpitIntegrationService: CockpitIntegrationService;
//# sourceMappingURL=cockpit-integration.service.d.ts.map