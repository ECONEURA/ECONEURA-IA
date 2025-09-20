export interface CostEntry {
    id: string;
    timestamp: Date;
    service: string;
    operation: string;
    resource: string;
    amount: number;
    currency: string;
    organizationId: string;
    userId?: string;
    requestId?: string;
    metadata?: Record<string, any>;
}
export interface Budget {
    id: string;
    organizationId: string;
    name: string;
    amount: number;
    currency: string;
    period: 'daily' | 'weekly' | 'monthly' | 'yearly';
    startDate: Date;
    endDate?: Date;
    categories: string[];
    alertThreshold: number;
    criticalThreshold: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface BudgetAlert {
    id: string;
    budgetId: string;
    organizationId: string;
    type: 'threshold' | 'critical' | 'exceeded';
    currentAmount: number;
    budgetAmount: number;
    percentage: number;
    timestamp: Date;
    message: string;
    acknowledged: boolean;
    acknowledgedBy?: string;
    acknowledgedAt?: Date;
}
export interface BudgetNotification {
    id: string;
    alertId: string;
    type: 'email' | 'slack' | 'webhook' | 'sms';
    recipient: string;
    message: string;
    status: 'pending' | 'sent' | 'failed';
    timestamp: Date;
    retryCount: number;
    maxRetries: number;
}
export interface CostMetrics {
    totalCost: number;
    costByService: Record<string, number>;
    costByOperation: Record<string, number>;
    costByOrganization: Record<string, number>;
    costByPeriod: Record<string, number>;
    averageCost: number;
    costTrend: 'increasing' | 'decreasing' | 'stable';
    topExpenses: CostEntry[];
}
export declare class FinOpsSystem {
    private costs;
    private budgets;
    private budgetAlerts;
    private costHistory;
    private alertThresholds;
    constructor();
    trackCost(costData: Omit<CostEntry, 'id' | 'timestamp'>): string;
    createBudget(budgetData: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>): string;
    updateBudget(budgetId: string, updates: Partial<Budget>): boolean;
    deleteBudget(budgetId: string): boolean;
    getBudget(budgetId: string): Budget | undefined;
    getBudgetsByOrganization(organizationId: string): Budget[];
    private evaluateBudgets;
    private calculateCurrentBudgetSpend;
    private getBudgetStartDate;
    private getBudgetEndDate;
    private createBudgetAlert;
    private hasActiveAlert;
    acknowledgeAlert(alertId: string, acknowledgedBy: string): boolean;
    getActiveAlerts(organizationId?: string): BudgetAlert[];
    getCostMetrics(organizationId?: string, period?: string): CostMetrics;
    private groupCostsBy;
    private groupCostsByPeriod;
    private getPeriodCutoffDate;
    private calculateCostTrend;
    private getTopExpenses;
    generateFinOpsHeaders(organizationId: string, operation: string): Record<string, string>;
    private initializeDefaultBudgets;
    getStats(): any;
    getCurrentBudgetSpend(budgetId: string): number;
    getBudgetUsagePercentage(budgetId: string): number;
    getBudgetsNearLimit(threshold?: number): Budget[];
    getOrganizationCost(organizationId: string, period?: string): number;
    sendBudgetAlertNotification(alert: BudgetAlert): void;
    clearOldData(daysToKeep?: number): void;
}
export declare const finOpsSystem: FinOpsSystem;
//# sourceMappingURL=finops.d.ts.map