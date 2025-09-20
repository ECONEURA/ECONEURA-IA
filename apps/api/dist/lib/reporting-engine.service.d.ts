import { FinOpsReport, CostForecast, FinOpsMetrics } from './finops-types.js';
export declare class ReportingEngineService {
    private reports;
    private costTrends;
    private costForecasts;
    private costAnomalies;
    constructor();
    private initializeSampleData;
    private generateSampleTrends;
    private generateSampleRecommendations;
    private generateSampleBudgetStatus;
    private generateSampleAnomalies;
    private generateSampleForecasts;
    private startPeriodicReporting;
    generateReport(name: string, type: 'executive' | 'technical' | 'compliance' | 'optimization' | 'trends' | 'custom', organizationId: string, period: {
        start: Date;
        end: Date;
    }, format?: 'pdf' | 'excel' | 'json' | 'csv', generatedBy?: string): Promise<FinOpsReport>;
    private generateReportData;
    private getPeriodType;
    private completeReportGeneration;
    private generateDailyReport;
    private generateWeeklyReport;
    private generateMonthlyReport;
    getReport(reportId: string): FinOpsReport | null;
    getReports(filters?: {
        organizationId?: string;
        type?: string;
        status?: 'generating' | 'completed' | 'failed';
        startDate?: Date;
        endDate?: Date;
    }): FinOpsReport[];
    generateCostForecast(organizationId: string, period: {
        start: Date;
        end: Date;
    }, model?: 'linear' | 'exponential' | 'seasonal' | 'arima'): Promise<CostForecast[]>;
    getCostForecasts(organizationId?: string): CostForecast[];
    generateFinOpsMetrics(organizationId: string): Promise<FinOpsMetrics>;
    getReportingStats(): {
        totalReports: number;
        reportsByType: Record<string, number>;
        reportsByStatus: Record<string, number>;
        reportsByFormat: Record<string, number>;
        averageReportSize: number;
        totalReportSize: number;
    };
}
//# sourceMappingURL=reporting-engine.service.d.ts.map