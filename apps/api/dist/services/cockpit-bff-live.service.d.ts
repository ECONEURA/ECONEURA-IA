import { EventEmitter } from 'events';
export interface CockpitEvent {
    id: string;
    type: 'agent_status' | 'metrics_update' | 'system_alert' | 'user_action' | 'department_update';
    department: string;
    data: any;
    timestamp: Date;
    priority: 'low' | 'medium' | 'high' | 'critical';
    source: string;
}
export interface CockpitMetrics {
    department: string;
    timestamp: Date;
    metrics: {
        activeAgents: number;
        totalCost: number;
        totalTokens: number;
        successRate: number;
        responseTime: number;
        errorRate: number;
        uptime: number;
    };
    alerts: Array<{
        type: string;
        message: string;
        severity: 'info' | 'warning' | 'error' | 'critical';
        timestamp: Date;
    }>;
}
export interface CockpitAgentStatus {
    agentId: string;
    department: string;
    status: 'running' | 'paused' | 'stopped' | 'error' | 'maintenance';
    lastActivity: Date;
    metrics: {
        requestsProcessed: number;
        averageResponseTime: number;
        errorCount: number;
        cost: number;
    };
    health: {
        cpu: number;
        memory: number;
        disk: number;
        network: number;
    };
}
export declare class CockpitBFFLiveService extends EventEmitter {
    private eventHistory;
    private metricsHistory;
    private agentStatuses;
    private activeConnections;
    private updateInterval;
    constructor();
    establishSSEConnection(orgId: string, userId: string, response: any, subscriptions?: string[]): string;
    private sendInitialCockpitState;
    initializeWebSocketServer(server: any): void;
    emitCockpitEvent(event: CockpitEvent): void;
    private broadcastSSEEvent;
    private broadcastWebSocketEvent;
    updateMetrics(metrics: CockpitMetrics): void;
    getLatestMetrics(department: string): CockpitMetrics | null;
    getMetricsHistory(department: string, limit?: number): CockpitMetrics[];
    updateAgentStatus(status: CockpitAgentStatus): void;
    getAgentStatus(agentId: string): CockpitAgentStatus | null;
    getDepartmentAgentStatuses(department: string): CockpitAgentStatus[];
    private generateMockUpdates;
    private initializeSampleData;
    cleanup(): void;
}
export declare const cockpitBFFLiveService: CockpitBFFLiveService;
//# sourceMappingURL=cockpit-bff-live.service.d.ts.map