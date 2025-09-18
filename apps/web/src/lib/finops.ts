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

export class WebFinOpsSystem {
  private costs: Map<string, CostEntry> = new Map();
  private budgets: Map<string, Budget> = new Map();
  private budgetAlerts: Map<string, BudgetAlert> = new Map();
  private costHistory: CostEntry[] = [];

  constructor() {
    
    this.initializeDefaultBudgets();
  }

  // Tracking de costos
  trackCost(costData: Omit<CostEntry, 'id' | 'timestamp'>): string {
    const id = `cost_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const costEntry: CostEntry = {
      ...costData,
      id,
      timestamp: new Date(),
    };

    this.costs.set(id, costEntry);
    this.costHistory.push(costEntry);

    console.log('Cost tracked', {
      costId: id,
      service: costData.service,
      operation: costData.operation,
      amount: costData.amount,
      organizationId: costData.organizationId,
    });

    return id;
  }

  // Gestión de presupuestos
  createBudget(budgetData: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>): string {
    const id = `budget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const budget: Budget = {
      ...budgetData,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.budgets.set(id, budget);
    console.log('Budget created', {
      budgetId: id,
      organizationId: budgetData.organizationId,
      amount: budgetData.amount,
      period: budgetData.period,
    });

    return id;
  }

  updateBudget(budgetId: string, updates: Partial<Budget>): boolean {
    const budget = this.budgets.get(budgetId);
    if (!budget) return false;

    const updatedBudget = {
      ...budget,
      ...updates,
      updatedAt: new Date(),
    };

    this.budgets.set(budgetId, updatedBudget);
    
    return true;
  }

  deleteBudget(budgetId: string): boolean {
    const deleted = this.budgets.delete(budgetId);
    if (deleted) {
      
    }
    return deleted;
  }

  getBudget(budgetId: string): Budget | undefined {
    return this.budgets.get(budgetId);
  }

  getBudgetsByOrganization(organizationId: string): Budget[] {
    return Array.from(this.budgets.values()).filter(
      budget => budget.organizationId === organizationId && budget.isActive
    );
  }

  // Métricas de costos
  getCostMetrics(organizationId?: string, period?: string): CostMetrics {
    let filteredCosts = this.costHistory;

    if (organizationId) {
      filteredCosts = filteredCosts.filter(cost => cost.organizationId === organizationId);
    }

    if (period) {
      const cutoffDate = this.getPeriodCutoffDate(period);
      filteredCosts = filteredCosts.filter(cost => cost.timestamp >= cutoffDate);
    }

    const totalCost = filteredCosts.reduce((sum, cost) => sum + cost.amount, 0);
    const costByService = this.groupCostsBy(filteredCosts, 'service');
    const costByOperation = this.groupCostsBy(filteredCosts, 'operation');
    const costByOrganization = this.groupCostsBy(filteredCosts, 'organizationId');
    const costByPeriod = this.groupCostsByPeriod(filteredCosts);

    const averageCost = filteredCosts.length > 0 ? totalCost / filteredCosts.length : 0;
    const costTrend = this.calculateCostTrend(filteredCosts);
    const topExpenses = this.getTopExpenses(filteredCosts, 10);

    return {
      totalCost,
      costByService,
      costByOperation,
      costByOrganization,
      costByPeriod,
      averageCost,
      costTrend,
      topExpenses,
    };
  }

  private groupCostsBy(costs: CostEntry[], field: keyof CostEntry): Record<string, number> {
    const grouped: Record<string, number> = {};
    
    for (const cost of costs) {
      const key = String(cost[field]);
      grouped[key] = (grouped[key] || 0) + cost.amount;
    }

    return grouped;
  }

  private groupCostsByPeriod(costs: CostEntry[]): Record<string, number> {
    const grouped: Record<string, number> = {};
    
    for (const cost of costs) {
      const date = cost.timestamp.toISOString().split('T')[0];
      grouped[date] = (grouped[date] || 0) + cost.amount;
    }

    return grouped;
  }

  private getPeriodCutoffDate(period: string): Date {
    const now = new Date();
    
    switch (period) {
      case '1h':
        return new Date(now.getTime() - 60 * 60 * 1000);
      case '24h':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      default:
        return new Date(0);
    }
  }

  private calculateCostTrend(costs: CostEntry[]): 'increasing' | 'decreasing' | 'stable' {
    if (costs.length < 2) return 'stable';

    const dailyCosts = this.groupCostsByPeriod(costs);
    const sortedDays = Object.keys(dailyCosts).sort();
    
    if (sortedDays.length < 2) return 'stable';

    const recentCosts = sortedDays.slice(-7).map(day => dailyCosts[day]);
    const olderCosts = sortedDays.slice(-14, -7).map(day => dailyCosts[day]);

    const recentAvg = recentCosts.reduce((sum, cost) => sum + cost, 0) / recentCosts.length;
    const olderAvg = olderCosts.reduce((sum, cost) => sum + cost, 0) / olderCosts.length;

    const change = ((recentAvg - olderAvg) / olderAvg) * 100;

    if (change > 10) return 'increasing';
    if (change < -10) return 'decreasing';
    return 'stable';
  }

  private getTopExpenses(costs: CostEntry[], limit: number): CostEntry[] {
    return costs
      .sort((a, b) => b.amount - a.amount)
      .slice(0, limit);
  }

  // Alertas de presupuesto
  getActiveAlerts(organizationId?: string): BudgetAlert[] {
    const alerts = Array.from(this.budgetAlerts.values()).filter(alert => !alert.acknowledged);
    return organizationId ? alerts.filter(alert => alert.organizationId === organizationId) : alerts;
  }

  acknowledgeAlert(alertId: string, acknowledgedBy: string): boolean {
    const alert = this.budgetAlerts.get(alertId);
    if (!alert) return false;

    alert.acknowledged = true;
    alert.acknowledgedBy = acknowledgedBy;
    alert.acknowledgedAt = new Date();

    
    return true;
  }

  // Headers FinOps
  generateFinOpsHeaders(organizationId: string, operation: string): Record<string, string> {
    const budgets = this.getBudgetsByOrganization(organizationId);
    const relevantBudgets = budgets.filter(budget => 
      budget.categories.includes(operation) || budget.categories.includes('all')
    );

    const headers: Record<string, string> = {
      'X-FinOps-Organization': organizationId,
      'X-FinOps-Operation': operation,
      'X-FinOps-Timestamp': new Date().toISOString(),
    };

    if (relevantBudgets.length > 0) {
      const budgetInfo = relevantBudgets.map(budget => ({
        id: budget.id,
        name: budget.name,
        remaining: Math.max(0, budget.amount - this.getCurrentBudgetSpend(budget)),
        percentage: (this.getCurrentBudgetSpend(budget) / budget.amount) * 100,
      }));

      headers['X-FinOps-Budgets'] = JSON.stringify(budgetInfo);
    }

    return headers;
  }

  private getCurrentBudgetSpend(budget: Budget): number {
    const now = new Date();
    const startDate = this.getBudgetStartDate(budget, now);
    const endDate = this.getBudgetEndDate(budget, now);

    return this.costHistory
      .filter(cost => 
        cost.organizationId === budget.organizationId &&
        cost.timestamp >= startDate &&
        cost.timestamp <= endDate &&
        budget.categories.includes(cost.service)
      )
      .reduce((total, cost) => total + cost.amount, 0);
  }

  private getBudgetStartDate(budget: Budget, currentDate: Date): Date {
    switch (budget.period) {
      case 'daily':
        return new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
      case 'weekly':
        const dayOfWeek = currentDate.getDay();
        const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        return new Date(currentDate.getTime() - daysToSubtract * 24 * 60 * 60 * 1000);
      case 'monthly':
        return new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      case 'yearly':
        return new Date(currentDate.getFullYear(), 0, 1);
      default:
        return budget.startDate;
    }
  }

  private getBudgetEndDate(budget: Budget, currentDate: Date): Date {
    const startDate = this.getBudgetStartDate(budget, currentDate);
    
    switch (budget.period) {
      case 'daily':
        return new Date(startDate.getTime() + 24 * 60 * 60 * 1000 - 1);
      case 'weekly':
        return new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
      case 'monthly':
        return new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0, 23, 59, 59, 999);
      case 'yearly':
        return new Date(startDate.getFullYear(), 11, 31, 23, 59, 59, 999);
      default:
        return budget.endDate || currentDate;
    }
  }

  // Inicialización de presupuestos por defecto
  private initializeDefaultBudgets(): void {
    const defaultBudgets = [
      {
        organizationId: 'demo-org-1',
        name: 'Web Operations Budget',
        amount: 200,
        currency: 'USD',
        period: 'monthly' as const,
        startDate: new Date(),
        categories: ['web', 'api', 'frontend'],
        alertThreshold: 80,
        criticalThreshold: 95,
        isActive: true,
      },
      {
        organizationId: 'premium-org',
        name: 'Premium Web Budget',
        amount: 1000,
        currency: 'USD',
        period: 'monthly' as const,
        startDate: new Date(),
        categories: ['all'],
        alertThreshold: 75,
        criticalThreshold: 90,
        isActive: true,
      },
    ];

    for (const budgetData of defaultBudgets) {
      this.createBudget(budgetData);
    }
  }

  // Métodos de utilidad
  getStats(): any {
    return {
      totalCosts: this.costs.size,
      totalBudgets: this.budgets.size,
      activeAlerts: this.getActiveAlerts().length,
      costHistorySize: this.costHistory.length,
    };
  }
}

export const webFinOpsSystem = new WebFinOpsSystem();
