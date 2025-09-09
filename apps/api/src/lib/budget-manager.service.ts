// Budget Manager Service for PR-45
import {
  Budget,
  BudgetAlert,
  BudgetNotification,
  NotificationCondition,
  BudgetStatus
} from './finops-types';
import { structuredLogger } from './structured-logger.js';
import { ErrorHandler } from './error-handler.js';

export class BudgetManagerService {
  private budgets: Budget[] = [];
  private budgetAlerts: BudgetAlert[] = [];
  private budgetNotifications: BudgetNotification[] = [];

  constructor() {
    this.initializeSampleData();
    this.startBudgetMonitoring();
    structuredLogger.info('BudgetManagerService initialized', {
      operation: 'budget_manager_init'
    });
  }

  private initializeSampleData(): void {
    const now = new Date();
    const sampleBudgets: Budget[] = [
      {
        id: 'budget_1',
        name: 'Production Infrastructure',
        description: 'Monthly budget for production infrastructure costs',
        organizationId: 'org_1',
        amount: 5000,
        currency: 'USD',
        period: 'monthly',
        startDate: new Date(now.getFullYear(), now.getMonth(), 1),
        endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0),
        threshold: 80,
        status: 'active',
        categories: ['compute', 'storage', 'database'],
        tags: ['production', 'infrastructure'],
        alerts: [],
        notifications: [],
        createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        createdBy: 'admin',
        lastModifiedBy: 'admin',
        metadata: {}
      },
      {
        id: 'budget_2',
        name: 'Development Environment',
        description: 'Quarterly budget for development and testing environments',
        organizationId: 'org_1',
        amount: 2000,
        currency: 'USD',
        period: 'quarterly',
        startDate: new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1),
        endDate: new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 0),
        threshold: 90,
        status: 'active',
        categories: ['compute', 'storage'],
        tags: ['development', 'testing'],
        alerts: [],
        notifications: [],
        createdAt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
        createdBy: 'admin',
        lastModifiedBy: 'admin',
        metadata: {}
      },
      {
        id: 'budget_3',
        name: 'Data Processing',
        description: 'Annual budget for data processing and analytics',
        organizationId: 'org_1',
        amount: 10000,
        currency: 'USD',
        period: 'yearly',
        startDate: new Date(now.getFullYear(), 0, 1),
        endDate: new Date(now.getFullYear(), 11, 31),
        threshold: 75,
        status: 'active',
        categories: ['data', 'analytics', 'storage'],
        tags: ['data', 'analytics'],
        alerts: [],
        notifications: [],
        createdAt: new Date(now.getFullYear() - 1, 11, 1),
        updatedAt: new Date(now.getFullYear() - 1, 11, 1),
        createdBy: 'admin',
        lastModifiedBy: 'admin',
        metadata: {}
      }
    ];

    this.budgets = sampleBudgets;
  }

  private startBudgetMonitoring(): void {
    // Check budgets every hour
    setInterval(() => {
      this.checkBudgetThresholds();
    }, 60 * 60 * 1000);
  }

  async createBudget(budgetData: Omit<Budget, 'id' | 'createdAt' | 'updatedAt' | 'alerts' | 'notifications'>): Promise<Budget> {
    try {
      const budget: Budget = {
        id: `budget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        alerts: [],
        notifications: [],
        ...budgetData
      };

      // Validate budget data
      this.validateBudget(budget);

      this.budgets.push(budget);

      structuredLogger.info('Budget created', {
        operation: 'budget_create',
        budgetId: budget.id,
        name: budget.name,
        amount: budget.amount,
        organizationId: budget.organizationId
      });

      return budget;
    } catch (error) {
      structuredLogger.error('Failed to create budget', error as Error, {
        operation: 'budget_create',
        budgetData
      });
      throw error;
    }
  }

  private validateBudget(budget: Budget): void {
    if (budget.amount <= 0) {
      throw new Error('Budget amount must be greater than 0');
    }

    if (budget.threshold < 0 || budget.threshold > 100) {
      throw new Error('Budget threshold must be between 0 and 100');
    }

    if (budget.startDate >= budget.endDate) {
      throw new Error('Start date must be before end date');
    }

    if (!budget.organizationId) {
      throw new Error('Organization ID is required');
    }
  }

  getBudget(budgetId: string): Budget | null {
    return this.budgets.find(b => b.id === budgetId) || null;
  }

  getBudgets(organizationId?: string): Budget[] {
    if (organizationId) {
      return this.budgets.filter(b => b.organizationId === organizationId);
    }
    return [...this.budgets];
  }

  async updateBudget(budgetId: string, updates: Partial<Budget>): Promise<Budget | null> {
    try {
      const budgetIndex = this.budgets.findIndex(b => b.id === budgetId);
      if (budgetIndex === -1) {
        throw new Error(`Budget ${budgetId} not found`);
      }

      const updatedBudget = {
        ...this.budgets[budgetIndex],
        ...updates,
        updatedAt: new Date(),
        lastModifiedBy: updates.lastModifiedBy || 'system'
      };

      this.validateBudget(updatedBudget);
      this.budgets[budgetIndex] = updatedBudget;

      structuredLogger.info('Budget updated', {
        operation: 'budget_update',
        budgetId,
        updates: Object.keys(updates)
      });

      return updatedBudget;
    } catch (error) {
      structuredLogger.error('Failed to update budget', error as Error, {
        operation: 'budget_update',
        budgetId,
        updates
      });
      throw error;
    }
  }

  async deleteBudget(budgetId: string): Promise<boolean> {
    try {
      const budgetIndex = this.budgets.findIndex(b => b.id === budgetId);
      if (budgetIndex === -1) {
        return false;
      }

      this.budgets.splice(budgetIndex, 1);

      // Remove associated alerts
      this.budgetAlerts = this.budgetAlerts.filter(a => a.budgetId !== budgetId);

      structuredLogger.info('Budget deleted', {
        operation: 'budget_delete',
        budgetId
      });

      return true;
    } catch (error) {
      structuredLogger.error('Failed to delete budget', error as Error, {
        operation: 'budget_delete',
        budgetId
      });
      throw error;
    }
  }

  async checkBudgetThresholds(): Promise<void> {
    try {
      const now = new Date();
      const activeBudgets = this.budgets.filter(b =>
        b.status === 'active' &&
        b.startDate <= now &&
        b.endDate >= now
      );

      for (const budget of activeBudgets) {
        await this.checkBudgetStatus(budget);
      }
    } catch (error) {
      structuredLogger.error('Failed to check budget thresholds', error as Error, {
        operation: 'budget_threshold_check'
      });
    }
  }

  private async checkBudgetStatus(budget: Budget): Promise<void> {
    try {
      // Simulate current spending (in real implementation, this would come from cost tracker)
      const currentSpending = this.simulateCurrentSpending(budget);
      const percentage = (currentSpending / budget.amount) * 100;

      // Check if threshold is reached
      if (percentage >= budget.threshold && percentage < 100) {
        await this.createBudgetAlert(budget, 'threshold', percentage, currentSpending);
      }

      // Check if budget is exceeded
      if (percentage >= 100) {
        await this.createBudgetAlert(budget, 'exceeded', percentage, currentSpending);
        await this.updateBudget(budget.id, { status: 'exceeded' });
      }

      // Check for predicted exceedance
      if (percentage >= 90 && this.isPredictedToExceed(budget, currentSpending)) {
        await this.createBudgetAlert(budget, 'predicted_exceeded', percentage, currentSpending);
      }
    } catch (error) {
      structuredLogger.error('Failed to check budget status', error as Error, {
        operation: 'budget_status_check',
        budgetId: budget.id
      });
    }
  }

  private simulateCurrentSpending(budget: Budget): number {
    // Simulate current spending based on budget period and time elapsed
    const now = new Date();
    const totalDays = Math.ceil((budget.endDate.getTime() - budget.startDate.getTime()) / (1000 * 60 * 60 * 24));
    const elapsedDays = Math.ceil((now.getTime() - budget.startDate.getTime()) / (1000 * 60 * 60 * 24));

    // Simulate spending with some variance
    const baseSpending = (elapsedDays / totalDays) * budget.amount;
    const variance = (Math.random() - 0.5) * budget.amount * 0.1; // ±10% variance

    return Math.max(0, baseSpending + variance);
  }

  private isPredictedToExceed(budget: Budget, currentSpending: number): boolean {
    const now = new Date();
    const totalDays = Math.ceil((budget.endDate.getTime() - budget.startDate.getTime()) / (1000 * 60 * 60 * 24));
    const elapsedDays = Math.ceil((now.getTime() - budget.startDate.getTime()) / (1000 * 60 * 60 * 24));
    const remainingDays = totalDays - elapsedDays;

    if (remainingDays <= 0) return false;

    const dailySpending = currentSpending / elapsedDays;
    const projectedSpending = currentSpending + (dailySpending * remainingDays);

    return projectedSpending > budget.amount;
  }

  private async createBudgetAlert(
    budget: Budget,
    type: 'threshold' | 'exceeded' | 'predicted_exceeded' | 'anomaly',
    percentage: number,
    currentAmount: number
  ): Promise<BudgetAlert> {
    const alert: BudgetAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      budgetId: budget.id,
      type,
      severity: this.determineAlertSeverity(type, percentage),
      message: this.generateAlertMessage(type, budget.name, percentage, currentAmount, budget.amount),
      currentAmount,
      budgetAmount: budget.amount,
      percentage,
      triggeredAt: new Date(),
      acknowledged: false,
      resolved: false,
      metadata: {
        budgetName: budget.name,
        organizationId: budget.organizationId
      }
    };

    this.budgetAlerts.push(alert);
    budget.alerts.push(alert);

    // Send notifications
    await this.sendBudgetNotifications(budget, alert);

    structuredLogger.warn('Budget alert created', {
      operation: 'budget_alert',
      alertId: alert.id,
      budgetId: budget.id,
      type,
      severity: alert.severity,
      percentage
    });

    return alert;
  }

  private determineAlertSeverity(type: string, percentage: number): 'low' | 'medium' | 'high' | 'critical' {
    switch (type) {
      case 'threshold':
        return percentage >= 95 ? 'high' : percentage >= 85 ? 'medium' : 'low';
      case 'exceeded':
        return 'critical';
      case 'predicted_exceeded':
        return 'high';
      case 'anomaly':
        return 'medium';
      default:
        return 'low';
    }
  }

  private generateAlertMessage(
    type: string,
    budgetName: string,
    percentage: number,
    currentAmount: number,
    budgetAmount: number
  ): string {
    switch (type) {
      case 'threshold':
        return `Budget "${budgetName}" has reached ${percentage.toFixed(1)}% of its limit ($${currentAmount.toFixed(2)} of $${budgetAmount.toFixed(2)})`;
      case 'exceeded':
        return `Budget "${budgetName}" has been exceeded by ${(percentage - 100).toFixed(1)}% ($${currentAmount.toFixed(2)} of $${budgetAmount.toFixed(2)})`;
      case 'predicted_exceeded':
        return `Budget "${budgetName}" is predicted to exceed its limit based on current spending trends (${percentage.toFixed(1)}% used)`;
      case 'anomaly':
        return `Unusual spending pattern detected for budget "${budgetName}" (${percentage.toFixed(1)}% used)`;
      default:
        return `Alert for budget "${budgetName}"`;
    }
  }

  private async sendBudgetNotifications(budget: Budget, alert: BudgetAlert): Promise<void> {
    try {
      const notifications = budget.notifications.filter(n => n.enabled);

      for (const notification of notifications) {
        if (this.shouldSendNotification(notification, alert)) {
          await this.sendNotification(notification, alert);
        }
      }
    } catch (error) {
      structuredLogger.error('Failed to send budget notifications', error as Error, {
        operation: 'budget_notification',
        budgetId: budget.id,
        alertId: alert.id
      });
    }
  }

  private shouldSendNotification(notification: BudgetNotification, alert: BudgetAlert): boolean {
    return notification.conditions.some(condition => {
      switch (condition.type) {
        case 'threshold':
          return alert.type === 'threshold';
        case 'exceeded':
          return alert.type === 'exceeded';
        case 'daily':
          return true; // Send daily notifications
        case 'weekly':
          return new Date().getDay() === 0; // Sunday
        case 'monthly':
          return new Date().getDate() === 1; // First day of month
        default:
          return false;
      }
    });
  }

  private async sendNotification(notification: BudgetNotification, alert: BudgetAlert): Promise<void> {
    // Simulate sending notification
    structuredLogger.info('Budget notification sent', {
      operation: 'budget_notification_send',
      notificationId: notification.id,
      type: notification.type,
      recipients: notification.recipients.length,
      alertId: alert.id
    });

    notification.lastSent = new Date();
  }

  async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<BudgetAlert | null> {
    try {
      const alert = this.budgetAlerts.find(a => a.id === alertId);
      if (!alert) {
        return null;
      }

      alert.acknowledged = true;
      alert.acknowledgedBy = acknowledgedBy;
      alert.acknowledgedAt = new Date();

      structuredLogger.info('Budget alert acknowledged', {
        operation: 'budget_alert_acknowledge',
        alertId,
        acknowledgedBy
      });

      return alert;
    } catch (error) {
      structuredLogger.error('Failed to acknowledge budget alert', error as Error, {
        operation: 'budget_alert_acknowledge',
        alertId
      });
      throw error;
    }
  }

  async resolveAlert(alertId: string, resolvedBy: string): Promise<BudgetAlert | null> {
    try {
      const alert = this.budgetAlerts.find(a => a.id === alertId);
      if (!alert) {
        return null;
      }

      alert.resolved = true;
      alert.resolvedAt = new Date();

      structuredLogger.info('Budget alert resolved', {
        operation: 'budget_alert_resolve',
        alertId,
        resolvedBy
      });

      return alert;
    } catch (error) {
      structuredLogger.error('Failed to resolve budget alert', error as Error, {
        operation: 'budget_alert_resolve',
        alertId
      });
      throw error;
    }
  }

  getBudgetAlerts(organizationId?: string, budgetId?: string): BudgetAlert[] {
    let filteredAlerts = [...this.budgetAlerts];

    if (organizationId) {
      const orgBudgets = this.getBudgets(organizationId);
      const orgBudgetIds = orgBudgets.map(b => b.id);
      filteredAlerts = filteredAlerts.filter(a => orgBudgetIds.includes(a.budgetId));
    }

    if (budgetId) {
      filteredAlerts = filteredAlerts.filter(a => a.budgetId === budgetId);
    }

    return filteredAlerts.sort((a, b) => b.triggeredAt.getTime() - a.triggeredAt.getTime());
  }

  getBudgetStatus(organizationId: string): BudgetStatus[] {
    const budgets = this.getBudgets(organizationId);
    const now = new Date();

    return budgets.map(budget => {
      const currentSpending = this.simulateCurrentSpending(budget);
      const percentage = (currentSpending / budget.amount) * 100;
      const daysRemaining = Math.ceil((budget.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const projectedAmount = this.isPredictedToExceed(budget, currentSpending) ?
        currentSpending + ((currentSpending / Math.ceil((now.getTime() - budget.startDate.getTime()) / (1000 * 60 * 60 * 24))) * daysRemaining) :
        currentSpending;
      const variance = projectedAmount - budget.amount;
      const variancePercentage = (variance / budget.amount) * 100;

      let status: 'on_track' | 'at_risk' | 'exceeded' = 'on_track';
      if (percentage >= 100) {
        status = 'exceeded';
      } else if (percentage >= budget.threshold || this.isPredictedToExceed(budget, currentSpending)) {
        status = 'at_risk';
      }

      return {
        budgetId: budget.id,
        budgetName: budget.name,
        currentAmount: currentSpending,
        budgetAmount: budget.amount,
        percentage,
        status,
        daysRemaining,
        projectedAmount,
        variance,
        variancePercentage
      };
    });
  }

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
  } {
    const budgets = this.getBudgets(organizationId);
    const budgetStatuses = this.getBudgetStatus(organizationId);
    const alerts = this.getBudgetAlerts(organizationId);

    const totalBudgets = budgets.length;
    const activeBudgets = budgets.filter(b => b.status === 'active').length;
    const exceededBudgets = budgetStatuses.filter(s => s.status === 'exceeded').length;
    const atRiskBudgets = budgetStatuses.filter(s => s.status === 'at_risk').length;
    const totalBudgetAmount = budgets.reduce((sum, b) => sum + b.amount, 0);
    const totalSpent = budgetStatuses.reduce((sum, s) => sum + s.currentAmount, 0);
    const averageUtilization = budgetStatuses.length > 0 ?
      budgetStatuses.reduce((sum, s) => sum + s.percentage, 0) / budgetStatuses.length : 0;
    const totalAlerts = alerts.length;
    const unacknowledgedAlerts = alerts.filter(a => !a.acknowledged).length;

    return {
      totalBudgets,
      activeBudgets,
      exceededBudgets,
      atRiskBudgets,
      totalBudgetAmount,
      totalSpent,
      averageUtilization,
      totalAlerts,
      unacknowledgedAlerts
    };
  }
}
