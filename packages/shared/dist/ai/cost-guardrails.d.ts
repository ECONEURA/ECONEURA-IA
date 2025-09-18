export interface CostLimits {
    dailyLimitEUR: number;
    monthlyLimitEUR: number;
    perRequestLimitEUR: number;
    warningThresholds: {
        daily: number;
        monthly: number;
    };
    emergencyStop: {
        enabled: boolean;
        thresholdEUR: number;
    };
}
export interface CostAlert {
    type: 'warning' | 'limit_exceeded' | 'emergency_stop';
    orgId: string;
    currentCost: number;
    limit: number;
    period: 'daily' | 'monthly' | 'request';
    timestamp: Date;
    message: string;
}
export interface UsageMetrics {
    orgId: string;
    provider: string;
    model: string;
    tokensInput: number;
    tokensOutput: number;
    costEUR: number;
    latencyMs: number;
    timestamp: Date;
    success: boolean;
    errorType?: string;
}
export declare class CostGuardrails {
    private dailyCosts;
    private monthlyCosts;
    private costLimits;
    private alertHandlers;
    private usageHistory;
    private readonly MAX_HISTORY_ENTRIES;
    setCostLimits(orgId: string, limits: CostLimits): void;
    getCostLimits(orgId: string): CostLimits;
    validateRequest(orgId: string, estimatedCostEUR: number, provider: string, model: string): Promise<{
        allowed: boolean;
        reason?: string;
        alert?: CostAlert;
    }>;
    recordUsage(metrics: UsageMetrics): void;
    private checkWarningThresholds;
    private triggerAlert;
    onAlert(handler: (alert: CostAlert) => void): void;
    getUsage(orgId: string): {
        daily: number;
        monthly: number;
        limits: CostLimits;
        utilizationDaily: number;
        utilizationMonthly: number;
    };
    getUsageHistory(orgId?: string, limit?: number): UsageMetrics[];
    resetDailyCosts(): void;
    resetMonthlyCosts(): void;
    getAggregateStats(): {
        totalDailyCost: number;
        totalMonthlyCost: number;
        activeOrganizations: number;
        totalRequests24h: number;
        averageLatency: number;
        errorRate: number;
    };
}
//# sourceMappingURL=cost-guardrails.d.ts.map