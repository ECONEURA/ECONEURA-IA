export interface Deal {
    id: string;
    title: string;
    value: number;
    currency: string;
    stage: string;
    probability: number;
    closeDate: string;
    ownerId: string;
    organizationId: string;
    companyId: string;
    contactId: string;
    source: string;
    type: string;
    createdAt: string;
    updatedAt: string;
    metadata?: Record<string, any>;
}
export interface NBARecommendation {
    id: string;
    dealId: string;
    action: string;
    actionType: 'call' | 'email' | 'meeting' | 'proposal' | 'follow_up' | 'negotiation' | 'close';
    priority: 'low' | 'medium' | 'high' | 'critical';
    confidence: number;
    expectedOutcome: string;
    successProbability: number;
    timeToExecute: number;
    explanation: {
        factors: FactorInfluence[];
        reasoning: string;
        alternatives: string[];
        risks: string[];
    };
    context: {
        dealStage: string;
        timeInStage: number;
        lastActivity: string;
        competitorActivity: boolean;
        marketConditions: string;
    };
    createdAt: string;
    expiresAt: string;
}
export interface FactorInfluence {
    factor: string;
    weight: number;
    impact: 'positive' | 'negative' | 'neutral';
    description: string;
    evidence: string[];
}
export interface NBAConfig {
    enabled: boolean;
    modelVersion: string;
    confidenceThreshold: number;
    maxRecommendations: number;
    expirationHours: number;
    factors: {
        dealValue: number;
        stage: number;
        timeInStage: number;
        ownerExperience: number;
        companySize: number;
        industry: number;
        seasonality: number;
        competitorActivity: number;
        lastActivity: number;
        marketConditions: number;
    };
    actions: {
        call: {
            enabled: boolean;
            weight: number;
        };
        email: {
            enabled: boolean;
            weight: number;
        };
        meeting: {
            enabled: boolean;
            weight: number;
        };
        proposal: {
            enabled: boolean;
            weight: number;
        };
        follow_up: {
            enabled: boolean;
            weight: number;
        };
        negotiation: {
            enabled: boolean;
            weight: number;
        };
        close: {
            enabled: boolean;
            weight: number;
        };
    };
}
export interface NBAStats {
    totalDeals: number;
    recommendationsGenerated: number;
    recommendationsExecuted: number;
    successRate: number;
    averageConfidence: number;
    topActions: Record<string, number>;
    topFactors: Record<string, number>;
    lastRun: string;
}
export declare class DealsNBAService {
    private config;
    private deals;
    private recommendations;
    private stats;
    private isProcessing;
    private processingInterval;
    constructor(config?: Partial<NBAConfig>);
    private startPeriodicProcessing;
    processNBARecommendations(): Promise<NBAStats>;
    generateRecommendations(deal: Deal): Promise<NBARecommendation[]>;
    private getPossibleActions;
    createRecommendation(deal: Deal, action: string): Promise<NBARecommendation>;
    private analyzeFactors;
    private calculateConfidence;
    private determinePriority;
    private calculateSuccessProbability;
    private getActionDescription;
    private getExpectedOutcome;
    private getTimeToExecute;
    private generateReasoning;
    private getAlternatives;
    private identifyRisks;
    private getTimeInStage;
    private getLastActivity;
    private getDaysToClose;
    private getMarketConditions;
    private getStageScore;
    private getStageMultiplier;
    getRecommendations(dealId: string): NBARecommendation[];
    executeRecommendation(recommendationId: string, executedBy: string): Promise<void>;
    getStats(): NBAStats;
    updateConfig(newConfig: Partial<NBAConfig>): void;
    stop(): void;
}
export declare const dealsNBAService: DealsNBAService;
//# sourceMappingURL=deals-nba.service.d.ts.map