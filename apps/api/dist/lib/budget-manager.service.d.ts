import { Budget, BudgetAlert, BudgetStatus } from './finops-types.js';
export declare class BudgetManagerService {
    private budgets;
    private budgetAlerts;
    private budgetNotifications;
    constructor();
    private initializeSampleData;
    private startBudgetMonitoring;
    createBudget(budgetData: Omit<Budget, 'id' | 'createdAt' | 'updatedAt' | 'alerts' | 'notifications'>): Promise<Budget>;
    private validateBudget;
    getBudget(budgetId: string): Budget | null;
    getBudgets(organizationId?: string): Budget[];
    updateBudget(budgetId: string, updates: Partial<Budget>): Promise<Budget | null>;
    deleteBudget(budgetId: string): Promise<boolean>;
    checkBudgetThresholds(): Promise<void>;
    private checkBudgetStatus;
    private simulateCurrentSpending;
    private isPredictedToExceed;
    private createBudgetAlert;
    private determineAlertSeverity;
    private generateAlertMessage;
    private sendBudgetNotifications;
    private shouldSendNotification;
    private sendNotification;
    acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<BudgetAlert | null>;
    resolveAlert(alertId: string, resolvedBy: string): Promise<BudgetAlert | null>;
    getBudgetAlerts(organizationId?: string, budgetId?: string): BudgetAlert[];
    getBudgetStatus(organizationId: string): BudgetStatus[];
    getBudgetStats(organizationId: string): {
        totalBudgets: number;
        activeBudgets: number;
        exceededBudgets: number;
        atRiskBudgets: number;
        totalBudgetAmount: number;
        totalSpent: number;
        averageUtilization: number;
        totalAlerts: number;
        unacknowledgedAlerts: number;
    };
}
//# sourceMappingURL=budget-manager.service.d.ts.map