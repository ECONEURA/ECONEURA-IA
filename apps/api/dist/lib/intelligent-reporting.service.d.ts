import { Report, ReportData, ReportGeneration, CreateReportRequest } from './analytics-types.js';
export declare class IntelligentReportingService {
    private reports;
    private reportGenerations;
    private scheduledReports;
    constructor();
    createReport(request: CreateReportRequest, organizationId: string, createdBy: string): Promise<Report>;
    updateReport(reportId: string, updates: Partial<CreateReportRequest>): Promise<Report | null>;
    getReport(reportId: string): Promise<Report | null>;
    getReports(organizationId: string, filters?: {
        type?: string;
        createdBy?: string;
        isActive?: boolean;
        isPublic?: boolean;
    }): Promise<Report[]>;
    deleteReport(reportId: string): Promise<boolean>;
    generateReport(reportId: string, generatedBy: string, parameters?: Record<string, any>): Promise<ReportGeneration>;
    private processReportGeneration;
    private collectReportData;
    private applyReportFilters;
    private getFilterValue;
    private evaluateFilter;
    private generateReportInsights;
    private createVisualizations;
    private createReportContent;
    private extractKeyFindings;
    private generateRecommendations;
    private exportReport;
    private scheduleReport;
    private calculateScheduleInterval;
    private updateReportSchedule;
    private cancelReportSchedule;
    private initializeScheduledReports;
    getReportTemplates(): Promise<Array<{
        id: string;
        name: string;
        description: string;
        type: Report['type'];
        template: string;
        sampleData: ReportData[];
    }>>;
    private generateSampleData;
    private getSampleMetrics;
    getReportGeneration(generationId: string): Promise<ReportGeneration | null>;
    getReportGenerations(reportId: string): Promise<ReportGeneration[]>;
    getReportAnalytics(organizationId: string): Promise<{
        totalReports: number;
        totalGenerations: number;
        successfulGenerations: number;
        failedGenerations: number;
        averageGenerationTime: number;
        mostPopularFormat: string;
        scheduledReports: number;
    }>;
    private generateId;
    getServiceStats(): Promise<{
        totalReports: number;
        totalGenerations: number;
        scheduledReports: number;
        activeSchedules: number;
    }>;
}
//# sourceMappingURL=intelligent-reporting.service.d.ts.map