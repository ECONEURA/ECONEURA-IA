import { logger } from './logger.js';
export class FinOpsSystem {
    costs = new Map();
    budgets = new Map();
    budgetAlerts = new Map();
    costHistory = [];
    alertThresholds = {
        warning: 0.8,
        critical: 0.95,
    };
    constructor() {
        logger.info('FinOps system initialized');
        this.initializeDefaultBudgets();
    }
    trackCost(costData) {
        const id = `cost_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const costEntry = {
            ...costData,
            id,
            timestamp: new Date(),
        };
        this.costs.set(id, costEntry);
        this.costHistory.push(costEntry);
        this.evaluateBudgets(costData.organizationId);
        logger.info('Cost tracked', {
            costId: id,
            service: costData.service,
            operation: costData.operation,
            amount: costData.amount,
            organizationId: costData.organizationId,
        });
        return id;
    }
    createBudget(budgetData) {
        const id = `budget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const budget = {
            ...budgetData,
            id,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.budgets.set(id, budget);
        logger.info('Budget created', {
            budgetId: id,
            organizationId: budgetData.organizationId,
            amount: budgetData.amount,
            period: budgetData.period,
        });
        return id;
    }
    updateBudget(budgetId, updates) {
        const budget = this.budgets.get(budgetId);
        if (!budget)
            return false;
        const updatedBudget = {
            ...budget,
            ...updates,
            updatedAt: new Date(),
        };
        this.budgets.set(budgetId, updatedBudget);
        logger.info('Budget updated', { budgetId, updates });
        return true;
    }
    deleteBudget(budgetId) {
        const deleted = this.budgets.delete(budgetId);
        if (deleted) {
            logger.info('Budget deleted', { budgetId });
        }
        return deleted;
    }
    getBudget(budgetId) {
        return this.budgets.get(budgetId);
    }
    getBudgetsByOrganization(organizationId) {
        return Array.from(this.budgets.values()).filter(budget => budget.organizationId === organizationId && budget.isActive);
    }
    evaluateBudgets(organizationId) {
        const organizationBudgets = this.getBudgetsByOrganization(organizationId);
        for (const budget of organizationBudgets) {
            const currentAmount = this.calculateCurrentBudgetSpend(budget);
            const percentage = (currentAmount / budget.amount) * 100;
            if (percentage >= budget.criticalThreshold && !this.hasActiveAlert(budget.id, 'critical')) {
                this.createBudgetAlert(budget, 'critical', currentAmount, percentage);
            }
            else if (percentage >= budget.alertThreshold && !this.hasActiveAlert(budget.id, 'threshold')) {
                this.createBudgetAlert(budget, 'threshold', currentAmount, percentage);
            }
            else if (percentage >= 100 && !this.hasActiveAlert(budget.id, 'exceeded')) {
                this.createBudgetAlert(budget, 'exceeded', currentAmount, percentage);
            }
        }
    }
    calculateCurrentBudgetSpend(budget) {
        const now = new Date();
        const startDate = this.getBudgetStartDate(budget, now);
        const endDate = this.getBudgetEndDate(budget, now);
        return this.costHistory
            .filter(cost => cost.organizationId === budget.organizationId &&
            cost.timestamp >= startDate &&
            cost.timestamp <= endDate &&
            budget.categories.includes(cost.service))
            .reduce((total, cost) => total + cost.amount, 0);
    }
    getBudgetStartDate(budget, currentDate) {
        switch (budget.period) {
            case 'daily': {
                return new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
            }
            case 'weekly': {
                const dayOfWeek = currentDate.getDay();
                const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                return new Date(currentDate.getTime() - daysToSubtract * 24 * 60 * 60 * 1000);
            }
            case 'monthly': {
                return new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            }
            case 'yearly': {
                return new Date(currentDate.getFullYear(), 0, 1);
            }
            default: {
                return budget.startDate;
            }
        }
    }
    getBudgetEndDate(budget, currentDate) {
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
    createBudgetAlert(budget, type, currentAmount, percentage) {
        const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const messages = {
            threshold: `Budget ${budget.name} has reached ${percentage.toFixed(1)}% of its limit`,
            critical: `Budget ${budget.name} has reached critical level: ${percentage.toFixed(1)}%`,
            exceeded: `Budget ${budget.name} has been exceeded by ${(percentage - 100).toFixed(1)}%`,
        };
        const alert = {
            id: alertId,
            budgetId: budget.id,
            organizationId: budget.organizationId,
            type,
            currentAmount,
            budgetAmount: budget.amount,
            percentage,
            timestamp: new Date(),
            message: messages[type],
            acknowledged: false,
        };
        this.budgetAlerts.set(alertId, alert);
        logger.warn('Budget alert created', {
            alertId,
            budgetId: budget.id,
            type,
            percentage,
            message: alert.message,
        });
    }
    hasActiveAlert(budgetId, type) {
        return Array.from(this.budgetAlerts.values()).some(alert => alert.budgetId === budgetId && alert.type === type && !alert.acknowledged);
    }
    acknowledgeAlert(alertId, acknowledgedBy) {
        const alert = this.budgetAlerts.get(alertId);
        if (!alert)
            return false;
        alert.acknowledged = true;
        alert.acknowledgedBy = acknowledgedBy;
        alert.acknowledgedAt = new Date();
        logger.info('Budget alert acknowledged', { alertId, acknowledgedBy });
        return true;
    }
    getActiveAlerts(organizationId) {
        const alerts = Array.from(this.budgetAlerts.values()).filter(alert => !alert.acknowledged);
        return organizationId ? alerts.filter(alert => alert.organizationId === organizationId) : alerts;
    }
    getCostMetrics(organizationId, period) {
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
    groupCostsBy(costs, field) {
        const grouped = {};
        for (const cost of costs) {
            const key = String(cost[field]);
            grouped[key] = (grouped[key] || 0) + cost.amount;
        }
        return grouped;
    }
    groupCostsByPeriod(costs) {
        const grouped = {};
        for (const cost of costs) {
            const date = cost.timestamp.toISOString().split('T')[0];
            grouped[date] = (grouped[date] || 0) + cost.amount;
        }
        return grouped;
    }
    getPeriodCutoffDate(period) {
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
    calculateCostTrend(costs) {
        if (costs.length < 2)
            return 'stable';
        const dailyCosts = this.groupCostsByPeriod(costs);
        const sortedDays = Object.keys(dailyCosts).sort();
        if (sortedDays.length < 2)
            return 'stable';
        const recentCosts = sortedDays.slice(-7).map(day => dailyCosts[day]);
        const olderCosts = sortedDays.slice(-14, -7).map(day => dailyCosts[day]);
        const recentAvg = recentCosts.reduce((sum, cost) => sum + cost, 0) / recentCosts.length;
        const olderAvg = olderCosts.reduce((sum, cost) => sum + cost, 0) / olderCosts.length;
        const change = ((recentAvg - olderAvg) / olderAvg) * 100;
        if (change > 10)
            return 'increasing';
        if (change < -10)
            return 'decreasing';
        return 'stable';
    }
    getTopExpenses(costs, limit) {
        return costs
            .sort((a, b) => b.amount - a.amount)
            .slice(0, limit);
    }
    generateFinOpsHeaders(organizationId, operation) {
        const budgets = this.getBudgetsByOrganization(organizationId);
        const relevantBudgets = budgets.filter(budget => budget.categories.includes(operation) || budget.categories.includes('all'));
        const headers = {
            'X-FinOps-Organization': organizationId,
            'X-FinOps-Operation': operation,
            'X-FinOps-Timestamp': new Date().toISOString(),
        };
        if (relevantBudgets.length > 0) {
            const budgetInfo = relevantBudgets.map(budget => ({
                id: budget.id,
                name: budget.name,
                remaining: Math.max(0, budget.amount - this.calculateCurrentBudgetSpend(budget)),
                percentage: (this.calculateCurrentBudgetSpend(budget) / budget.amount) * 100,
            }));
            headers['X-FinOps-Budgets'] = JSON.stringify(budgetInfo);
        }
        return headers;
    }
    initializeDefaultBudgets() {
        const defaultBudgets = [
            {
                organizationId: 'demo-org-1',
                name: 'AI Operations Budget',
                amount: 1000,
                currency: 'USD',
                period: 'monthly',
                startDate: new Date(),
                categories: ['ai', 'openai', 'azure-openai'],
                alertThreshold: 80,
                criticalThreshold: 95,
                isActive: true,
            },
            {
                organizationId: 'demo-org-1',
                name: 'Search Operations Budget',
                amount: 500,
                currency: 'USD',
                period: 'monthly',
                startDate: new Date(),
                categories: ['search', 'bing', 'google'],
                alertThreshold: 80,
                criticalThreshold: 95,
                isActive: true,
            },
            {
                organizationId: 'premium-org',
                name: 'Premium Operations Budget',
                amount: 5000,
                currency: 'USD',
                period: 'monthly',
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
    getStats() {
        return {
            totalCosts: this.costs.size,
            totalBudgets: this.budgets.size,
            activeAlerts: this.getActiveAlerts().length,
            costHistorySize: this.costHistory.length,
        };
    }
    getCurrentBudgetSpend(budgetId) {
        const budget = this.budgets.get(budgetId);
        if (!budget)
            return 0;
        return this.calculateCurrentBudgetSpend(budget);
    }
    getBudgetUsagePercentage(budgetId) {
        const budget = this.budgets.get(budgetId);
        if (!budget)
            return 0;
        const currentSpend = this.calculateCurrentBudgetSpend(budget);
        return (currentSpend / budget.amount) * 100;
    }
    getBudgetsNearLimit(threshold = 80) {
        return Array.from(this.budgets.values()).filter(budget => {
            if (!budget.isActive)
                return false;
            const percentage = this.getBudgetUsagePercentage(budget.id);
            return percentage >= threshold;
        });
    }
    getOrganizationCost(organizationId, period) {
        let filteredCosts = this.costHistory.filter(cost => cost.organizationId === organizationId);
        if (period) {
            const cutoffDate = this.getPeriodCutoffDate(period);
            filteredCosts = filteredCosts.filter(cost => cost.timestamp >= cutoffDate);
        }
        return filteredCosts.reduce((total, cost) => total + cost.amount, 0);
    }
    sendBudgetAlertNotification(alert) {
        const notificationId = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const notification = {
            id: notificationId,
            alertId: alert.id,
            type: 'email',
            recipient: 'admin@organization.com',
            message: `Budget Alert: ${alert.message}`,
            status: 'pending',
            timestamp: new Date(),
            retryCount: 0,
            maxRetries: 3,
        };
        logger.info('Budget alert notification created', {
            notificationId,
            alertId: alert.id,
            type: notification.type,
            recipient: notification.recipient,
        });
    }
    clearOldData(daysToKeep = 90) {
        const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
        this.costHistory = this.costHistory.filter(cost => cost.timestamp >= cutoffDate);
        for (const [alertId, alert] of this.budgetAlerts) {
            if (alert.timestamp < cutoffDate) {
                this.budgetAlerts.delete(alertId);
            }
        }
        logger.info('FinOps old data cleared', { daysToKeep, cutoffDate: cutoffDate.toISOString() });
    }
}
export const finOpsSystem = new FinOpsSystem();
//# sourceMappingURL=finops.js.map