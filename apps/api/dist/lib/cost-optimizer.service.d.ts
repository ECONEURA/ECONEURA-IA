import { OptimizationRecommendation, CostOptimization } from './finops-types.js';
export declare class CostOptimizerService {
    private recommendations;
    private optimizations;
    private resourceUtilizations;
    constructor();
    private initializeSampleData;
    private startOptimizationAnalysis;
    analyzeOptimizationOpportunities(): Promise<OptimizationRecommendation[]>;
    private analyzeResourceUtilization;
    private analyzeCostPatterns;
    private analyzeStorageOptimization;
    private getRecommendedInstanceType;
    getRecommendations(filters?: {
        status?: 'pending' | 'approved' | 'implemented' | 'rejected';
        type?: string;
        priority?: 'low' | 'medium' | 'high' | 'urgent';
        effort?: 'low' | 'medium' | 'high';
        impact?: 'low' | 'medium' | 'high';
    }): OptimizationRecommendation[];
    getRecommendation(recommendationId: string): OptimizationRecommendation | null;
    approveRecommendation(recommendationId: string, approvedBy: string): Promise<OptimizationRecommendation | null>;
    rejectRecommendation(recommendationId: string, rejectedBy: string, reason: string): Promise<OptimizationRecommendation | null>;
    implementRecommendation(recommendationId: string, implementedBy: string): Promise<CostOptimization | null>;
    private completeOptimization;
    getOptimizations(filters?: {
        status?: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
        type?: 'automatic' | 'manual' | 'scheduled';
    }): CostOptimization[];
    getOptimization(optimizationId: string): CostOptimization | null;
    getOptimizationStats(): {
        totalRecommendations: number;
        pendingRecommendations: number;
        approvedRecommendations: number;
        implementedRecommendations: number;
        rejectedRecommendations: number;
        totalPotentialSavings: number;
        totalActualSavings: number;
        totalOptimizations: number;
        completedOptimizations: number;
        runningOptimizations: number;
        averageSavings: number;
    };
}
//# sourceMappingURL=cost-optimizer.service.d.ts.map