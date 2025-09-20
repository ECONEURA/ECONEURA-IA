import { structuredLogger } from './structured-logger.js';
export class CostTrackerService {
    costs = [];
    costTrends = [];
    costAllocations = [];
    resourceUtilizations = [];
    costAnomalies = [];
    constructor() {
        this.initializeSampleData();
        structuredLogger.info('CostTrackerService initialized', {
            operation: 'cost_tracker_init'
        });
    }
    initializeSampleData() {
        const now = new Date();
        const sampleCosts = [
            {
                id: 'cost_1',
                service: 'compute',
                resource: 'ec2-instance-1',
                organizationId: 'org_1',
                userId: 'user_1',
                amount: 45.50,
                currency: 'USD',
                category: 'compute',
                subcategory: 'ec2',
                timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000),
                period: 'daily',
                metadata: { instanceType: 't3.medium', region: 'us-east-1' },
                tags: ['production', 'web-server'],
                region: 'us-east-1',
                environment: 'production',
                projectId: 'project_1',
                departmentId: 'engineering'
            },
            {
                id: 'cost_2',
                service: 'storage',
                resource: 's3-bucket-1',
                organizationId: 'org_1',
                amount: 12.30,
                currency: 'USD',
                category: 'storage',
                subcategory: 's3',
                timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000),
                period: 'daily',
                metadata: { storageClass: 'standard', size: '100GB' },
                tags: ['production', 'data'],
                region: 'us-east-1',
                environment: 'production',
                projectId: 'project_1',
                departmentId: 'data'
            },
            {
                id: 'cost_3',
                service: 'database',
                resource: 'rds-instance-1',
                organizationId: 'org_1',
                amount: 78.90,
                currency: 'USD',
                category: 'infrastructure',
                subcategory: 'rds',
                timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000),
                period: 'daily',
                metadata: { instanceType: 'db.t3.large', engine: 'postgresql' },
                tags: ['production', 'database'],
                region: 'us-east-1',
                environment: 'production',
                projectId: 'project_1',
                departmentId: 'engineering'
            }
        ];
        this.costs = sampleCosts;
        this.generateCostTrends();
    }
    generateCostTrends() {
        const now = new Date();
        const trends = [];
        for (let i = 29; i >= 0; i--) {
            const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const baseAmount = 100 + Math.random() * 50;
            trends.push({
                date,
                amount: baseAmount,
                service: 'compute',
                category: 'compute',
                organizationId: 'org_1',
                trend: i > 15 ? 'increasing' : 'stable',
                changePercentage: Math.random() * 10 - 5,
                metadata: {}
            });
        }
        this.costTrends = trends;
    }
    async recordCost(costData) {
        try {
            const cost = {
                id: `cost_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                timestamp: new Date(),
                ...costData
            };
            this.costs.push(cost);
            await this.updateCostTrends(cost);
            await this.checkForAnomalies(cost);
            structuredLogger.info('Cost recorded', {
                operation: 'cost_record',
                costId: cost.id,
                service: cost.service,
                amount: cost.amount,
                organizationId: cost.organizationId
            });
            return cost;
        }
        catch (error) {
            structuredLogger.error('Failed to record cost', error, {
                operation: 'cost_record',
                costData
            });
            throw error;
        }
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
        const historicalCosts = this.costs.filter(c => c.service === cost.service &&
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
            structuredLogger.warn('Cost anomaly detected', {
                operation: 'cost_anomaly',
                anomalyId: anomaly.id,
                service: cost.service,
                amount: cost.amount,
                averageCost,
                severity: anomaly.severity
            });
        }
    }
    getCosts(filters) {
        let filteredCosts = [...this.costs];
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
        return this.costs.find(c => c.id === costId) || null;
    }
    getCostTrends(filters) {
        let filteredTrends = [...this.costTrends];
        if (filters) {
            if (filters.organizationId) {
                filteredTrends = filteredTrends.filter(t => t.organizationId === filters.organizationId);
            }
            if (filters.service) {
                filteredTrends = filteredTrends.filter(t => t.service === filters.service);
            }
            if (filters.startDate) {
                filteredTrends = filteredTrends.filter(t => t.date >= filters.startDate);
            }
            if (filters.endDate) {
                filteredTrends = filteredTrends.filter(t => t.date <= filters.endDate);
            }
        }
        return filteredTrends.sort((a, b) => a.date.getTime() - b.date.getTime());
    }
    getCostsByService(organizationId, period = 'daily') {
        const costs = this.getCosts({ organizationId });
        const serviceCosts = {};
        costs.forEach(cost => {
            if (!serviceCosts[cost.service]) {
                serviceCosts[cost.service] = 0;
            }
            serviceCosts[cost.service] += cost.amount;
        });
        return serviceCosts;
    }
    getCostsByCategory(organizationId, period = 'daily') {
        const costs = this.getCosts({ organizationId });
        const categoryCosts = {};
        costs.forEach(cost => {
            if (!categoryCosts[cost.category]) {
                categoryCosts[cost.category] = 0;
            }
            categoryCosts[cost.category] += cost.amount;
        });
        return categoryCosts;
    }
    getTotalCosts(organizationId, period) {
        const costs = this.getCosts({
            organizationId,
            startDate: period?.start,
            endDate: period?.end
        });
        return costs.reduce((total, cost) => total + cost.amount, 0);
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
                    departmentId: allocation.departmentId,
                    projectId: allocation.projectId,
                    userId: allocation.userId,
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
            structuredLogger.info('Cost allocated', {
                operation: 'cost_allocation',
                costId,
                allocations: costAllocations.length,
                totalAmount: cost.amount
            });
            return costAllocations;
        }
        catch (error) {
            structuredLogger.error('Failed to allocate cost', error, {
                operation: 'cost_allocation',
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
            structuredLogger.info('Resource utilization recorded', {
                operation: 'resource_utilization',
                resourceId: resourceUtil.resourceId,
                service: resourceUtil.service,
                efficiency: resourceUtil.efficiency
            });
            return resourceUtil;
        }
        catch (error) {
            structuredLogger.error('Failed to record resource utilization', error, {
                operation: 'resource_utilization',
                utilization
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
    getCostStats(organizationId, period) {
        const costs = this.getCosts({
            organizationId,
            startDate: period?.start,
            endDate: period?.end
        });
        const totalCosts = costs.reduce((sum, cost) => sum + cost.amount, 0);
        const days = period ?
            Math.ceil((period.end.getTime() - period.start.getTime()) / (1000 * 60 * 60 * 24)) :
            30;
        const averageDailyCost = totalCosts / days;
        const previousPeriodCosts = this.getCosts({
            organizationId,
            startDate: new Date((period?.start || new Date()).getTime() - days * 24 * 60 * 60 * 1000),
            endDate: period?.start || new Date()
        });
        const previousTotal = previousPeriodCosts.reduce((sum, cost) => sum + cost.amount, 0);
        const costGrowth = previousTotal > 0 ? ((totalCosts - previousTotal) / previousTotal) * 100 : 0;
        const serviceCosts = this.getCostsByService(organizationId);
        const topServices = Object.entries(serviceCosts)
            .map(([service, amount]) => ({
            service,
            amount,
            percentage: (amount / totalCosts) * 100
        }))
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 5);
        const categoryCosts = this.getCostsByCategory(organizationId);
        const topCategories = Object.entries(categoryCosts)
            .map(([category, amount]) => ({
            category,
            amount,
            percentage: (amount / totalCosts) * 100
        }))
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 5);
        const anomalies = this.getCostAnomalies(organizationId).length;
        const utilizations = this.getResourceUtilizations({ organizationId });
        const efficiency = utilizations.length > 0 ?
            utilizations.reduce((sum, u) => sum + u.efficiency, 0) / utilizations.length : 0;
        return {
            totalCosts,
            averageDailyCost,
            costGrowth,
            topServices,
            topCategories,
            anomalies,
            efficiency
        };
    }
}
//# sourceMappingURL=cost-tracker.service.js.map