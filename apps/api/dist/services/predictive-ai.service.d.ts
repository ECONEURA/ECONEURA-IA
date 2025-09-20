export interface DemandPrediction {
    productId: string;
    predictedDemand: number;
    confidence: number;
    seasonality: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    recommendations: string[];
}
export interface InventoryOptimization {
    productId: string;
    currentStock: number;
    optimalStock: number;
    reorderPoint: number;
    safetyStock: number;
    recommendations: string[];
}
export declare class PredictiveAIService {
    private historicalData;
    private models;
    constructor();
    private initializeModels;
    predictDemand(productId: string, days?: number): Promise<DemandPrediction>;
    optimizeInventory(productId: string): Promise<InventoryOptimization>;
    analyzeSeasonality(productId: string): Promise<{
        seasonality: number;
        patterns: string[];
    }>;
    generateRecommendations(productId: string): Promise<string[]>;
    private calculateSeasonality;
    private calculateTrend;
    private generateDemandRecommendations;
    private generateInventoryRecommendations;
    private identifySeasonalPatterns;
    trainModel(productId: string, data: any[]): Promise<void>;
    getModelStatus(): Promise<{
        models: any[];
        overallAccuracy: number;
    }>;
}
export declare const predictiveAI: PredictiveAIService;
//# sourceMappingURL=predictive-ai.service.d.ts.map