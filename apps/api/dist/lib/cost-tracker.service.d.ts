import { Cost, CostTrend, CostAllocation, ResourceUtilization, CostAnomaly } from './finops-types.js';
export declare class CostTrackerService {
    private costs;
    private costTrends;
    private costAllocations;
    private resourceUtilizations;
    private costAnomalies;
    constructor();
    private initializeSampleData;
    private generateCostTrends;
    recordCost(costData: Omit<Cost, 'id' | 'timestamp'>): Promise<Cost>;
    private updateCostTrends;
    private checkForAnomalies;
    getCosts(filters?: {
        organizationId?: string;
        service?: string;
        category?: string;
        startDate?: Date;
        endDate?: Date;
        userId?: string;
        projectId?: string;
        departmentId?: string;
    }): Cost[];
    getCostById(costId: string): Cost | null;
    getCostTrends(filters?: {
        organizationId?: string;
        service?: string;
        startDate?: Date;
        endDate?: Date;
    }): CostTrend[];
    getCostsByService(organizationId: string, period?: 'daily' | 'weekly' | 'monthly'): Record<string, number>;
    getCostsByCategory(organizationId: string, period?: 'daily' | 'weekly' | 'monthly'): Record<string, number>;
    getTotalCosts(organizationId: string, period?: {
        start: Date;
        end: Date;
    }): number;
    getCostAnomalies(organizationId?: string): CostAnomaly[];
    allocateCost(costId: string, allocations: Array<{
        organizationId: string;
        departmentId?: string;
        projectId?: string;
        userId?: string;
        percentage: number;
        method: 'equal' | 'usage_based' | 'custom' | 'tag_based';
    }>): Promise<CostAllocation[]>;
    getCostAllocations(costId?: string): CostAllocation[];
    recordResourceUtilization(utilization: Omit<ResourceUtilization, 'id' | 'timestamp'>): Promise<ResourceUtilization>;
    getResourceUtilizations(filters?: {
        organizationId?: string;
        service?: string;
        resourceType?: string;
        startDate?: Date;
        endDate?: Date;
    }): ResourceUtilization[];
    getCostStats(organizationId: string, period?: {
        start: Date;
        end: Date;
    }): {
        totalCosts: number;
        averageDailyCost: number;
        costGrowth: number;
        topServices: Array<{
            service: string;
            amount: number;
            percentage: number;
        }>;
        topCategories: Array<{
            category: string;
            amount: number;
            percentage: number;
        }>;
        anomalies: number;
        efficiency: number;
    };
}
//# sourceMappingURL=cost-tracker.service.d.ts.map