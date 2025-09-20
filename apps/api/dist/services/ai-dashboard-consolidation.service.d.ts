export interface DashboardMetrics {
    department: string;
    timeframe: string;
    includePredictions: boolean;
    includeOptimizations: boolean;
    includeSecurity: boolean;
}
export interface RealTimeMetrics {
    department: string;
    agentId?: string;
}
export interface AgentStatus {
    agentId: string;
    department: string;
    status: 'active' | 'paused' | 'error' | 'maintenance';
    lastActivity: Date;
    metrics: {
        tokens: number;
        cost: number;
        latency: number;
        calls: number;
    };
}
export interface ConsolidatedDashboardData {
    department: string;
    timestamp: Date;
    agents: AgentStatus[];
    kpis: {
        totalCost: number;
        totalTokens: number;
        averageLatency: number;
        successRate: number;
        activeAgents: number;
        errorRate: number;
    };
    predictions?: {
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
    optimizations?: {
        activeRules: number;
        savings: number;
        recommendations: string[];
    };
    security?: {
        complianceScore: number;
        activePolicies: number;
        incidents: number;
        lastAudit: Date;
    };
    performance?: {
        optimizationScore: number;
        activeOptimizations: number;
        performanceGains: number;
    };
    timeline: Array<{
        timestamp: Date;
        type: 'success' | 'warning' | 'error' | 'info';
        message: string;
        agentId?: string;
    }>;
}
export declare class AIDashboardConsolidationService {
    private static instance;
    private realTimeConnections;
    private metricsCache;
    private cacheTimeout;
    static getInstance(): AIDashboardConsolidationService;
    getDashboardMetrics(input: DashboardMetrics): Promise<ConsolidatedDashboardData>;
    getRealTimeMetrics(input: RealTimeMetrics): Promise<ConsolidatedDashboardData>;
    updateAgentStatus(agentStatus: AgentStatus): Promise<void>;
    registerRealTimeConnection(department: string, ws: WebSocket): void;
    private generateConsolidatedData;
    private generateRealTimeData;
    private getCostMetrics;
    private getPredictionMetrics;
    private getOptimizationMetrics;
    private getSecurityMetrics;
    private getPerformanceMetrics;
    private getTimelineEvents;
    private getAgentStatuses;
    private getTimeframeMs;
    private notifyRealTimeConnections;
}
export declare const aiDashboardConsolidationService: AIDashboardConsolidationService;
//# sourceMappingURL=ai-dashboard-consolidation.service.d.ts.map