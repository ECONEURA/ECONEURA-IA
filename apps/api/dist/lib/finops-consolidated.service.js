import { logger } from './logger.js';
export class FinOpsConsolidatedService {
    costs = new Map();
    costEntries = new Map();
    budgets = new Map();
    budgetAlerts = new Map();
    costHistory = [];
    costTrends = [];
    costAllocations = [];
    resourceUtilizations = [];
    costAnomalies = [];
    optimizationRecommendations = [];
    finOpsReports = [];
    costCenters = [];
    costOptimizations = [];
    finOpsAlerts = [];
    finOpsDashboards = [];
    finOpsSettings = new Map();
    finOpsUsers = new Map();
    alertThresholds = {
        warning: 0.8,
        critical: 0.95,
    };
    constructor() {
        logger.info('FinOps Consolidated Service initialized');
        this.initializeDefaultData();
        this.startMonitoring();
    }
    async recordCost(costData) {
        try {
            const cost = {
                id: `cost_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                timestamp: new Date(),
                ...costData
            };
            this.costs.set(cost.id, cost);
            const costEntry = {
                id: cost.id,
                timestamp: cost.timestamp,
                service: cost.service,
                operation: cost.subcategory,
                resource: cost.resource,
                amount: cost.amount,
                currency: cost.currency,
                organizationId: cost.organizationId,
                userId: cost.userId || undefined,
                metadata: cost.metadata
            };
            this.costEntries.set(costEntry.id, costEntry);
            this.costHistory.push(costEntry);
            await this.updateCostTrends(cost);
            await this.checkForAnomalies(cost);
            this.evaluateBudgets(cost.organizationId);
            logger.info('Cost recorded', {
                costId: cost.id,
                service: cost.service,
                amount: cost.amount,
                organizationId: cost.organizationId,
            });
            return cost;
        }
        catch (error) {
            logger.error('Failed to record cost', {
                error: error.message,
                service: costData.service,
                amount: costData.amount
            });
            throw error;
        }
    }
    trackCost(costData) {
        const id = `cost_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const costEntry = {
            ...costData,
            id,
            timestamp: new Date(),
        };
        this.costEntries.set(id, costEntry);
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
    getCosts(filters) {
        let filteredCosts = Array.from(this.costs.values());
        if (filters) {
            if (filters.organizationId) {
                filteredCosts = filteredCosts.filter(c => c.organizationId === filters.organizationId);
            }
            if (filters.service) {
                filteredCosts = filteredCosts.filter(c => c.service === filters.service);
            }
            if (filters.category) {
                filteredCosts = filteredCosts.filter(c => c.category === filters.category);
            }
            if (filters.startDate) {
                filteredCosts = filteredCosts.filter(c => c.timestamp >= filters.startDate);
            }
            if (filters.endDate) {
                filteredCosts = filteredCosts.filter(c => c.timestamp <= filters.endDate);
            }
            if (filters.userId) {
                filteredCosts = filteredCosts.filter(c => c.userId === filters.userId);
            }
            if (filters.projectId) {
                filteredCosts = filteredCosts.filter(c => c.projectId === filters.projectId);
            }
            if (filters.departmentId) {
                filteredCosts = filteredCosts.filter(c => c.departmentId === filters.departmentId);
            }
        }
        return filteredCosts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }
    getCostById(costId) {
        return this.costs.get(costId) || null;
    }
    async createBudget(budgetData) {
        try {
            const budget = {
                id: `budget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                createdAt: new Date(),
                updatedAt: new Date(),
                alerts: [],
                notifications: [],
                ...budgetData
            };
            this.validateBudget(budget);
            this.budgets.set(budget.id, budget);
            logger.info('Budget created', {
                budgetId: budget.id,
                name: budget.name,
                amount: budget.amount,
                organizationId: budget.organizationId
            });
            return budget;
        }
        catch (error) {
            logger.error('Failed to create budget', {
                error: error.message,
                organizationId: budgetData.organizationId,
                amount: budgetData.amount
            });
            throw error;
        }
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
        this.validateBudget(updatedBudget);
        this.budgets.set(budgetId, updatedBudget);
        logger.info('Budget updated', { budgetId, updates });
        return true;
    }
    deleteBudget(budgetId) {
        const deleted = this.budgets.delete(budgetId);
        if (deleted) {
            for (const [alertId, alert] of this.budgetAlerts) {
                if (alert.budgetId === budgetId) {
                    this.budgetAlerts.delete(alertId);
                }
            }
            logger.info('Budget deleted', { budgetId });
        }
        return deleted;
    }
    getBudget(budgetId) {
        return this.budgets.get(budgetId);
    }
    getBudgetsByOrganization(organizationId) {
        return Array.from(this.budgets.values()).filter(budget => budget.organizationId === organizationId && budget.status === 'active');
    }
    evaluateBudgets(organizationId) {
        const organizationBudgets = this.getBudgetsByOrganization(organizationId);
        for (const budget of organizationBudgets) {
            const currentAmount = this.calculateCurrentBudgetSpend(budget);
            const percentage = (currentAmount / budget.amount) * 100;
            if (percentage >= 100 && !this.hasActiveAlert(budget.id, 'exceeded')) {
                this.createBudgetAlert(budget, 'exceeded', currentAmount, percentage);
            }
            else if (percentage >= budget.threshold && !this.hasActiveAlert(budget.id, 'threshold')) {
                this.createBudgetAlert(budget, 'threshold', currentAmount, percentage);
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
            (budget.categories.includes(cost.service) || budget.categories.includes('all')))
            .reduce((total, cost) => total + cost.amount, 0);
    }
    getBudgetStartDate(budget, currentDate) {
        switch (budget.period) {
            case 'monthly': {
                return new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            }
            case 'quarterly': {
                const quarter = Math.floor(currentDate.getMonth() / 3);
                return new Date(currentDate.getFullYear(), quarter * 3, 1);
            }
            case 'yearly': {
                return new Date(currentDate.getFullYear(), 0, 1);
            }
            case 'custom': {
                return budget.startDate;
            }
            default: {
                return budget.startDate;
            }
        }
    }
    getBudgetEndDate(budget, currentDate) {
        const startDate = this.getBudgetStartDate(budget, currentDate);
        switch (budget.period) {
            case 'monthly':
                return new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0, 23, 59, 59, 999);
            case 'quarterly':
                return new Date(startDate.getFullYear(), startDate.getMonth() + 3, 0, 23, 59, 59, 999);
            case 'yearly':
                return new Date(startDate.getFullYear(), 11, 31, 23, 59, 59, 999);
            case 'custom':
                return budget.endDate;
            default:
                return budget.endDate;
        }
    }
    createBudgetAlert(budget, type, currentAmount, percentage) {
        const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const messages = {
            threshold: `Budget ${budget.name} has reached ${percentage.toFixed(1)}% of its limit`,
            exceeded: `Budget ${budget.name} has been exceeded by ${(percentage - 100).toFixed(1)}%`,
            predicted_exceeded: `Budget ${budget.name} is predicted to exceed its limit`,
            anomaly: `Unusual spending pattern detected for budget ${budget.name}`,
        };
        const alert = {
            id: alertId,
            budgetId: budget.id,
            type,
            severity: this.determineAlertSeverity(type, percentage),
            message: messages[type],
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
        this.budgetAlerts.set(alertId, alert);
        budget.alerts.push(alert);
        logger.warn('Budget alert created', {
            alertId,
            budgetId: budget.id,
            type,
            percentage,
            message: alert.message,
        });
    }
    determineAlertSeverity(type, percentage) {
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
        return organizationId ? alerts.filter(alert => {
            const budget = this.budgets.get(alert.budgetId);
            return budget?.organizationId === organizationId;
        }) : alerts;
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
            const key = String(cost[field] || 'unknown');
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
        if (olderCosts.length === 0)
            return 'stable';
        const recentAvg = recentCosts.reduce((sum, cost) => (sum || 0) + (cost || 0), 0) / recentCosts.length;
        const olderAvg = olderCosts.reduce((sum, cost) => (sum || 0) + (cost || 0), 0) / olderCosts.length;
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
    async updateCostTrends(cost) {
        const existingTrend = this.costTrends.find(trend => trend.date.toDateString() === cost.timestamp.toDateString() &&
            trend.service === cost.service &&
            trend.organizationId === cost.organizationId);
        if (existingTrend) {
            existingTrend.amount += cost.amount;
        }
        else {
            const trend = {
                date: new Date(cost.timestamp.getFullYear(), cost.timestamp.getMonth(), cost.timestamp.getDate()),
                amount: cost.amount,
                service: cost.service,
                category: cost.category,
                organizationId: cost.organizationId,
                trend: 'stable',
                changePercentage: 0,
                metadata: {}
            };
            this.costTrends.push(trend);
        }
    }
    async checkForAnomalies(cost) {
        const historicalCosts = this.costHistory.filter(c => c.service === cost.service &&
            c.organizationId === cost.organizationId &&
            c.timestamp < cost.timestamp);
        if (historicalCosts.length < 7)
            return;
        const averageCost = historicalCosts.reduce((sum, c) => sum + c.amount, 0) / historicalCosts.length;
        const standardDeviation = Math.sqrt(historicalCosts.reduce((sum, c) => sum + Math.pow(c.amount - averageCost, 2), 0) / historicalCosts.length);
        const threshold = averageCost + (2 * standardDeviation);
        if (cost.amount > threshold) {
            const anomaly = {
                id: `anomaly_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                type: 'spike',
                severity: cost.amount > averageCost + (3 * standardDeviation) ? 'critical' : 'high',
                description: `Cost spike detected for ${cost.service}: ${cost.amount} (avg: ${averageCost.toFixed(2)})`,
                detectedAt: new Date(),
                period: {
                    start: cost.timestamp,
                    end: cost.timestamp
                },
                affectedServices: [cost.service],
                affectedResources: [cost.resource],
                impact: {
                    costIncrease: cost.amount - averageCost,
                    percentageIncrease: ((cost.amount - averageCost) / averageCost) * 100
                },
                status: 'detected',
                metadata: {
                    averageCost,
                    standardDeviation,
                    threshold
                }
            };
            this.costAnomalies.push(anomaly);
            logger.warn('Cost anomaly detected', {
                service: cost.service,
                amount: cost.amount,
                averageCost,
                severity: anomaly.severity
            });
        }
    }
    getCostAnomalies(organizationId) {
        let filteredAnomalies = [...this.costAnomalies];
        if (organizationId) {
            const orgCosts = this.getCosts({ organizationId });
            const orgServices = new Set(orgCosts.map(c => c.service));
            filteredAnomalies = filteredAnomalies.filter(anomaly => anomaly.affectedServices.some(service => orgServices.has(service)));
        }
        return filteredAnomalies.sort((a, b) => b.detectedAt.getTime() - a.detectedAt.getTime());
    }
    async allocateCost(costId, allocations) {
        try {
            const cost = this.getCostById(costId);
            if (!cost) {
                throw new Error(`Cost ${costId} not found`);
            }
            const totalPercentage = allocations.reduce((sum, alloc) => sum + alloc.percentage, 0);
            if (totalPercentage !== 100) {
                throw new Error('Total allocation percentage must be 100%');
            }
            const costAllocations = [];
            for (const allocation of allocations) {
                const costAllocation = {
                    id: `allocation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    costId,
                    organizationId: allocation.organizationId,
                    departmentId: allocation.departmentId || undefined,
                    projectId: allocation.projectId || undefined,
                    userId: allocation.userId || undefined,
                    percentage: allocation.percentage,
                    amount: (cost.amount * allocation.percentage) / 100,
                    method: allocation.method,
                    tags: cost.tags,
                    createdAt: new Date(),
                    createdBy: 'system',
                    metadata: {}
                };
                costAllocations.push(costAllocation);
                this.costAllocations.push(costAllocation);
            }
            logger.info('Cost allocated', {
                costId,
                totalAmount: cost.amount
            });
            return costAllocations;
        }
        catch (error) {
            logger.error('Failed to allocate cost', {
                error: error.message,
                costId
            });
            throw error;
        }
    }
    getCostAllocations(costId) {
        if (costId) {
            return this.costAllocations.filter(a => a.costId === costId);
        }
        return [...this.costAllocations];
    }
    async recordResourceUtilization(utilization) {
        try {
            const resourceUtil = {
                id: `util_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                timestamp: new Date(),
                ...utilization
            };
            this.resourceUtilizations.push(resourceUtil);
            logger.info('Resource utilization recorded', {
                service: resourceUtil.service,
                efficiency: resourceUtil.efficiency
            });
            return resourceUtil;
        }
        catch (error) {
            logger.error('Failed to record resource utilization', {
                error: error.message,
                service: utilization.service
            });
            throw error;
        }
    }
    getResourceUtilizations(filters) {
        let filteredUtilizations = [...this.resourceUtilizations];
        if (filters) {
            if (filters.organizationId) {
                filteredUtilizations = filteredUtilizations.filter(u => u.organizationId === filters.organizationId);
            }
            if (filters.service) {
                filteredUtilizations = filteredUtilizations.filter(u => u.service === filters.service);
            }
            if (filters.resourceType) {
                filteredUtilizations = filteredUtilizations.filter(u => u.resourceType === filters.resourceType);
            }
            if (filters.startDate) {
                filteredUtilizations = filteredUtilizations.filter(u => u.timestamp >= filters.startDate);
            }
            if (filters.endDate) {
                filteredUtilizations = filteredUtilizations.filter(u => u.timestamp <= filters.endDate);
            }
        }
        return filteredUtilizations.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }
    async generateOptimizationRecommendations(organizationId) {
        try {
            const recommendations = [];
            const costs = this.getCosts({ organizationId });
            const utilizations = this.getResourceUtilizations({ organizationId });
            const underutilizedResources = utilizations.filter(u => u.efficiency < 30);
            for (const resource of underutilizedResources) {
                recommendations.push({
                    id: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'right_sizing',
                    title: `Right-size ${resource.resourceId}`,
                    description: `Resource ${resource.resourceId} is only ${resource.efficiency}% utilized`,
                    potentialSavings: resource.cost * 0.3,
                    confidence: 85,
                    effort: 'medium',
                    impact: 'medium',
                    resources: [resource.resourceId],
                    implementation: 'Consider downsizing to a smaller instance type',
                    estimatedSavings: {
                        monthly: resource.cost * 0.3,
                        yearly: resource.cost * 0.3 * 12,
                        percentage: 30
                    },
                    status: 'pending',
                    priority: 'medium',
                    createdAt: new Date(),
                    metadata: {
                        currentUtilization: resource.efficiency,
                        currentCost: resource.cost
                    },
                    tags: ['right-sizing', 'cost-optimization']
                });
            }
            const storageCosts = costs.filter(c => c.category === 'storage');
            if (storageCosts.length > 0) {
                const totalStorageCost = storageCosts.reduce((sum, c) => sum + c.amount, 0);
                recommendations.push({
                    id: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'storage_optimization',
                    title: 'Optimize Storage Classes',
                    description: 'Consider moving infrequently accessed data to cheaper storage classes',
                    potentialSavings: totalStorageCost * 0.2,
                    confidence: 75,
                    effort: 'low',
                    impact: 'medium',
                    resources: storageCosts.map(c => c.resource),
                    implementation: 'Implement lifecycle policies to automatically move data to cheaper storage classes',
                    estimatedSavings: {
                        monthly: totalStorageCost * 0.2,
                        yearly: totalStorageCost * 0.2 * 12,
                        percentage: 20
                    },
                    status: 'pending',
                    priority: 'low',
                    createdAt: new Date(),
                    metadata: {
                        totalStorageCost,
                        affectedResources: storageCosts.length
                    },
                    tags: ['storage', 'lifecycle', 'cost-optimization']
                });
            }
            this.optimizationRecommendations.push(...recommendations);
            logger.info('Optimization recommendations generated', {
                organizationId
            });
            return recommendations;
        }
        catch (error) {
            logger.error('Failed to generate optimization recommendations', {
                error: error.message,
                organizationId
            });
            throw error;
        }
    }
    getOptimizationRecommendations(organizationId) {
        let filteredRecommendations = [...this.optimizationRecommendations];
        if (organizationId) {
            const orgCosts = this.getCosts({ organizationId });
            const orgResources = new Set(orgCosts.map(c => c.resource));
            filteredRecommendations = filteredRecommendations.filter(rec => rec.resources.some(resource => orgResources.has(resource)));
        }
        return filteredRecommendations.sort((a, b) => b.potentialSavings - a.potentialSavings);
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
    validateBudget(budget) {
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
    initializeDefaultData() {
        const defaultBudgets = [
            {
                organizationId: 'demo-org-1',
                name: 'AI Operations Budget',
                description: 'Monthly budget for AI operations',
                amount: 1000,
                currency: 'USD',
                period: 'monthly',
                startDate: new Date(),
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                threshold: 80,
                status: 'active',
                categories: ['ai', 'openai', 'azure-openai'],
                tags: ['ai', 'operations'],
                createdBy: 'system',
                lastModifiedBy: 'system',
                metadata: {}
            },
            {
                organizationId: 'demo-org-1',
                name: 'Search Operations Budget',
                description: 'Monthly budget for search operations',
                amount: 500,
                currency: 'USD',
                period: 'monthly',
                startDate: new Date(),
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                threshold: 80,
                status: 'active',
                categories: ['search', 'bing', 'google'],
                tags: ['search', 'operations'],
                createdBy: 'system',
                lastModifiedBy: 'system',
                metadata: {}
            }
        ];
        for (const budgetData of defaultBudgets) {
            this.createBudget(budgetData);
        }
    }
    startMonitoring() {
        setInterval(() => {
            this.checkAllBudgets();
        }, 60 * 60 * 1000);
    }
    checkAllBudgets() {
        const allBudgets = Array.from(this.budgets.values());
        const organizationIds = new Set(allBudgets.map(b => b.organizationId));
        for (const orgId of organizationIds) {
            this.evaluateBudgets(orgId);
        }
    }
    getStats() {
        return {
            totalCosts: this.costs.size,
            totalCostEntries: this.costEntries.size,
            totalBudgets: this.budgets.size,
            activeAlerts: this.getActiveAlerts().length,
            costHistorySize: this.costHistory.length,
            costAnomalies: this.costAnomalies.length,
            optimizationRecommendations: this.optimizationRecommendations.length,
        };
    }
    clearOldData(daysToKeep = 90) {
        const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
        this.costHistory = this.costHistory.filter(cost => cost.timestamp >= cutoffDate);
        for (const [alertId, alert] of this.budgetAlerts) {
            if (alert.triggeredAt < cutoffDate) {
                this.budgetAlerts.delete(alertId);
            }
        }
        logger.info('FinOps old data cleared', { daysToKeep, cutoffDate: cutoffDate.toISOString() });
    }
}
export const finOpsConsolidatedService = new FinOpsConsolidatedService();
//# sourceMappingURL=finops-consolidated.service.js.map