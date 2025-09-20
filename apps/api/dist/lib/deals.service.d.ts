import { type Deal, type CreateDeal, type UpdateDeal, type DealFilter, type MoveDealStage, type DealAnalytics } from '@econeura/shared/src/schemas/crm';
export interface DealSummary {
    total: number;
    totalValue: number;
    averageDealSize: number;
    winRate: number;
    averageSalesCycle: number;
    dealsByStage: Record<string, number>;
    dealsByStatus: Record<string, number>;
    dealsByMonth: Array<{
        month: string;
        count: number;
        value: number;
    }>;
    topPerformers: Array<{
        userId: string;
        name: string;
        dealsCount: number;
        totalValue: number;
        winRate: number;
    }>;
    pipelineHealth: {
        healthy: boolean;
        score: number;
        issues: string[];
    };
}
export interface DealMetrics {
    totalDeals: number;
    openDeals: number;
    closedWon: number;
    closedLost: number;
    totalValue: number;
    averageDealSize: number;
    winRate: number;
    averageSalesCycle: number;
    dealsByStage: Record<string, number>;
    dealsByStatus: Record<string, number>;
    dealsByPriority: Record<string, number>;
    dealsByMonth: Array<{
        month: string;
        count: number;
        value: number;
    }>;
    topPerformers: Array<{
        userId: string;
        name: string;
        dealsCount: number;
        totalValue: number;
        winRate: number;
    }>;
    recentActivity: Array<{
        date: string;
        count: number;
    }>;
    pipelineHealth: {
        healthy: boolean;
        score: number;
        issues: string[];
    };
}
export declare class DealsService {
    private deals;
    private nextId;
    constructor();
    private initializeSampleData;
    createDeal(orgId: string, userId: string, data: CreateDeal): Promise<Deal>;
    getDeals(orgId: string, filters: DealFilter & {
        limit?: number;
        offset?: number;
    }): Promise<{
        deals: Deal[];
        total: number;
    }>;
    getDealById(orgId: string, dealId: string): Promise<Deal | null>;
    updateDeal(orgId: string, dealId: string, userId: string, data: UpdateDeal): Promise<Deal | null>;
    moveDealStage(orgId: string, dealId: string, userId: string, data: MoveDealStage): Promise<Deal | null>;
    deleteDeal(orgId: string, dealId: string, userId: string): Promise<boolean>;
    getDealSummary(orgId: string): Promise<DealSummary>;
    getDealAnalytics(orgId: string): Promise<DealAnalytics>;
    bulkUpdateDeals(orgId: string, userId: string, updates: Array<{
        id: string;
        data: UpdateDeal;
    }>): Promise<{
        updated: number;
        failed: number;
        errors: string[];
    }>;
    getStats(): any;
}
export declare const dealsService: DealsService;
//# sourceMappingURL=deals.service.d.ts.map