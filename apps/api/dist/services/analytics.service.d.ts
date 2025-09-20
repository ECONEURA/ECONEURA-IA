export interface AnalyticsData {
    metrics: Record<string, number>;
    trends: Record<string, string>;
    timestamp: Date;
}
export declare class AnalyticsService {
    getAnalytics(): Promise<AnalyticsData>;
}
export declare const analytics: AnalyticsService;
//# sourceMappingURL=analytics.service.d.ts.map