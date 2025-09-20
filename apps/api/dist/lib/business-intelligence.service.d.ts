import { BusinessIntelligence, KPI, RiskFactor, Opportunity, CompetitiveAnalysis, ROIAnalysis, CreateKPIRequest, BIConfig } from './analytics-types.js';
export declare class BusinessIntelligenceService {
    private config;
    private kpis;
    private businessIntelligence;
    private riskFactors;
    private opportunities;
    private competitiveAnalyses;
    private roiAnalyses;
    constructor(config?: Partial<BIConfig>);
    createKPI(request: CreateKPIRequest, organizationId: string): Promise<KPI>;
    updateKPI(kpiId: string, updates: Partial<CreateKPIRequest>): Promise<KPI | null>;
    getKPI(kpiId: string): Promise<KPI | null>;
    getKPIs(organizationId: string, filters?: {
        type?: string;
        category?: string;
        owner?: string;
        isActive?: boolean;
    }): Promise<KPI[]>;
    deleteKPI(kpiId: string): Promise<boolean>;
    updateKPIValue(kpiId: string, value: number): Promise<KPI | null>;
    private initializeBusinessIntelligence;
    private updateBusinessIntelligence;
    private determineKPIStatus;
    private generateInsights;
    private generateRecommendations;
    getBusinessIntelligence(kpiId: string): Promise<BusinessIntelligence | null>;
    getAllBusinessIntelligence(organizationId: string): Promise<BusinessIntelligence[]>;
    private assessRisks;
    getRiskFactors(kpiId: string): Promise<RiskFactor[]>;
    getAllRiskFactors(organizationId: string): Promise<RiskFactor[]>;
    updateRiskStatus(riskId: string, status: RiskFactor['status']): Promise<RiskFactor | null>;
    private identifyOpportunities;
    getOpportunities(kpiId: string): Promise<Opportunity[]>;
    getAllOpportunities(organizationId: string): Promise<Opportunity[]>;
    performCompetitiveAnalysis(organizationId: string, competitors: string[]): Promise<CompetitiveAnalysis[]>;
    private generateCompetitorValue;
    private generateMarketAverage;
    private determinePosition;
    private generateCompetitiveRecommendations;
    getCompetitiveAnalyses(organizationId: string): Promise<CompetitiveAnalysis[]>;
    performROIAnalysis(organizationId: string, initiatives: Array<{
        name: string;
        investment: number;
        expectedReturns: number;
        timeframe: string;
    }>): Promise<ROIAnalysis[]>;
    private calculateNPV;
    private calculateIRR;
    private assessROIRisk;
    getROIAnalyses(organizationId: string): Promise<ROIAnalysis[]>;
    performBenchmarking(organizationId: string): Promise<{
        kpis: Array<{
            kpi: KPI;
            benchmark: number;
            performance: 'above' | 'at' | 'below';
            gap: number;
        }>;
        overallScore: number;
        recommendations: string[];
    }>;
    private generateBenchmark;
    private generateBenchmarkRecommendations;
    generateStrategicInsights(organizationId: string): Promise<{
        summary: string;
        keyFindings: string[];
        recommendations: string[];
        risks: string[];
        opportunities: string[];
        nextSteps: string[];
    }>;
    private generateExecutiveSummary;
    private extractKeyFindings;
    private generateStrategicRecommendations;
    private summarizeRisks;
    private summarizeOpportunities;
    private generateNextSteps;
    private generateId;
    getServiceStats(): Promise<{
        totalKPIs: number;
        totalBusinessIntelligence: number;
        totalRisks: number;
        totalOpportunities: number;
        config: BIConfig;
    }>;
}
//# sourceMappingURL=business-intelligence.service.d.ts.map