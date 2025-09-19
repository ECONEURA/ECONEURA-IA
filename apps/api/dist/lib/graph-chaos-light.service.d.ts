interface GraphTokenRotationConfig {
    enabled: boolean;
    rotationIntervalMs: number;
    failureRate: number;
    latencyMs: {
        min: number;
        max: number;
    };
    errorTypes: string[];
    simulationMode: boolean;
}
interface GraphToken {
    accessToken: string;
    refreshToken: string;
    expiresAt: string;
    tokenType: string;
    scope: string;
    issuedAt: string;
}
interface GraphChaosEvent {
    id: string;
    type: 'token_rotation' | 'token_expiry' | 'api_failure' | 'latency_injection';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    timestamp: string;
    metadata: {
        endpoint?: string;
        method?: string;
        statusCode?: number;
        latency?: number;
        tokenId?: string;
        errorMessage?: string;
    };
}
declare class GraphChaosLightService {
    private config;
    private tokens;
    private chaosEvents;
    private rotationInterval?;
    private isRunning;
    constructor();
    private initializeDemoTokens;
    private startTokenRotation;
    private stopTokenRotation;
    private performTokenRotation;
    private addChaosEvent;
    simulateGraphApiCall(endpoint: string, method?: string): Promise<{
        success: boolean;
        statusCode: number;
        latency: number;
        error?: string;
        tokenUsed?: string;
    }>;
    getTokens(): GraphToken[];
    getChaosEvents(): GraphChaosEvent[];
    getChaosStats(): {
        totalEvents: number;
        eventsByType: Record<string, number>;
        eventsBySeverity: Record<string, number>;
        averageLatency: number;
        failureRate: number;
    };
    updateConfig(newConfig: Partial<GraphTokenRotationConfig>): void;
    reset(): void;
    destroy(): void;
}
export declare const graphChaosLightService: GraphChaosLightService;
export {};
//# sourceMappingURL=graph-chaos-light.service.d.ts.map