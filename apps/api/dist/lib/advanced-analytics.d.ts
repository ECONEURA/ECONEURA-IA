export interface AnalyticsEvent {
    id: string;
    eventType: string;
    action: string;
    entityType: string;
    entityId: string;
    userId: string;
    orgId: string;
    metadata: Record<string, any>;
    timestamp: string;
    sessionId?: string;
    correlationId?: string;
}
export interface AnalyticsMetric {
    name: string;
    value: number;
    labels: Record<string, string>;
    timestamp: string;
}
export interface AnalyticsDashboard {
    totalEvents: number;
    uniqueUsers: number;
    topActions: Array<{
        action: string;
        count: number;
    }>;
    topEntities: Array<{
        entityType: string;
        count: number;
    }>;
    eventsByHour: Array<{
        hour: string;
        count: number;
    }>;
    userActivity: Array<{
        userId: string;
        events: number;
        lastActivity: string;
    }>;
    conversionFunnel: Array<{
        stage: string;
        users: number;
        conversion: number;
    }>;
}
export interface BusinessIntelligence {
    revenue: {
        total: number;
        monthly: number;
        growth: number;
        bySource: Array<{
            source: string;
            amount: number;
        }>;
    };
    customers: {
        total: number;
        new: number;
        churn: number;
        lifetimeValue: number;
    };
    operations: {
        dealsClosed: number;
        avgDealSize: number;
        salesCycle: number;
        winRate: number;
    };
    performance: {
        responseTime: number;
        uptime: number;
        errorRate: number;
        userSatisfaction: number;
    };
}
export declare class AdvancedAnalyticsService {
    private events;
    private metrics;
    private dashboards;
    constructor();
    trackEvent(eventData: Omit<AnalyticsEvent, 'id' | 'timestamp'>): Promise<string>;
    recordMetric(metricData: Omit<AnalyticsMetric, 'timestamp'>): Promise<void>;
    getDashboard(orgId: string, timeRange?: string): Promise<AnalyticsDashboard>;
    getBusinessIntelligence(orgId: string): Promise<BusinessIntelligence>;
    getEventAnalytics(orgId: string, filters?: {
        eventType?: string;
        action?: string;
        entityType?: string;
        userId?: string;
        timeRange?: string;
    }): Promise<AnalyticsEvent[]>;
    exportAnalytics(orgId: string, format?: 'json' | 'csv'): Promise<string>;
    private getTimeFilter;
    private getTopActions;
    private getTopEntities;
    private getEventsByHour;
    private getUserActivity;
    private getConversionFunnel;
    private initializeDemoData;
    getStats(): any;
}
export declare const advancedAnalytics: AdvancedAnalyticsService;
//# sourceMappingURL=advanced-analytics.d.ts.map