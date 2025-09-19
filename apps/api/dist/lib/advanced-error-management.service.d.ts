interface ErrorEvent {
    id: string;
    organizationId: string;
    service: string;
    environment: 'development' | 'staging' | 'production';
    errorType: string;
    errorMessage: string;
    stackTrace?: string;
    context: {
        userId?: string;
        sessionId?: string;
        requestId?: string;
        endpoint?: string;
        method?: string;
        userAgent?: string;
        ipAddress?: string;
        timestamp: string;
    };
    severity: 'low' | 'medium' | 'high' | 'critical';
    category: 'application' | 'database' | 'network' | 'authentication' | 'authorization' | 'validation' | 'external' | 'system';
    impact: {
        affectedUsers: number;
        businessImpact: 'low' | 'medium' | 'high' | 'critical';
        revenueImpact?: number;
        slaImpact?: boolean;
    };
    performance: {
        responseTime?: number;
        memoryUsage?: number;
        cpuUsage?: number;
        databaseQueries?: number;
        cacheHitRate?: number;
    };
    resolution: {
        status: 'open' | 'investigating' | 'resolved' | 'closed';
        assignedTo?: string;
        priority: 'low' | 'medium' | 'high' | 'critical';
        estimatedResolution?: string;
        actualResolution?: string;
        resolutionNotes?: string;
    };
    metadata: {
        tags: string[];
        customFields: Record<string, any>;
        relatedErrors: string[];
        escalationLevel: number;
    };
    createdAt: string;
    updatedAt: string;
}
interface ErrorPattern {
    id: string;
    organizationId: string;
    name: string;
    description: string;
    pattern: {
        errorType?: string;
        errorMessage?: string;
        service?: string;
        category?: string;
        conditions: Array<{
            field: string;
            operator: 'equals' | 'contains' | 'regex' | 'starts_with' | 'ends_with' | 'greater_than' | 'less_than';
            value: string | number;
        }>;
    };
    action: {
        type: 'alert' | 'escalate' | 'auto_resolve' | 'create_ticket' | 'notify_team';
        config: {
            alertChannels?: string[];
            escalationLevel?: number;
            notificationTemplate?: string;
            autoResolveAfter?: number;
            ticketPriority?: string;
        };
    };
    statistics: {
        matches: number;
        falsePositives: number;
        accuracy: number;
        lastMatch: string;
        averageResolutionTime: number;
    };
    enabled: boolean;
    createdAt: string;
    updatedAt: string;
}
interface PerformanceMetric {
    id: string;
    organizationId: string;
    service: string;
    metricType: 'response_time' | 'throughput' | 'error_rate' | 'availability' | 'resource_usage';
    value: number;
    unit: string;
    timestamp: string;
    dimensions: {
        endpoint?: string;
        method?: string;
        statusCode?: number;
        environment?: string;
        region?: string;
    };
    thresholds: {
        warning: number;
        critical: number;
    };
    status: 'normal' | 'warning' | 'critical';
    createdAt: string;
}
interface Alert {
    id: string;
    organizationId: string;
    type: 'error' | 'performance' | 'availability' | 'security';
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    source: {
        service: string;
        component?: string;
        endpoint?: string;
    };
    condition: {
        metric?: string;
        threshold?: number;
        operator?: string;
        duration?: number;
    };
    status: 'active' | 'acknowledged' | 'resolved' | 'suppressed';
    assignedTo?: string;
    escalationLevel: number;
    notifications: {
        channels: string[];
        sent: boolean;
        sentAt?: string;
        acknowledged: boolean;
        acknowledgedAt?: string;
        acknowledgedBy?: string;
    };
    metadata: {
        tags: string[];
        customFields: Record<string, any>;
        relatedAlerts: string[];
    };
    createdAt: string;
    updatedAt: string;
    resolvedAt?: string;
}
interface ErrorReport {
    id: string;
    organizationId: string;
    reportType: 'daily' | 'weekly' | 'monthly' | 'ad_hoc';
    period: {
        startDate: string;
        endDate: string;
    };
    data: {
        totalErrors: number;
        byCategory: Record<string, number>;
        bySeverity: Record<string, number>;
        byService: Record<string, number>;
        topErrors: Array<{
            errorType: string;
            count: number;
            percentage: number;
            trend: 'increasing' | 'decreasing' | 'stable';
        }>;
        resolutionStats: {
            averageResolutionTime: number;
            resolutionRate: number;
            escalationRate: number;
            autoResolutionRate: number;
        };
        performanceImpact: {
            averageResponseTime: number;
            availabilityPercentage: number;
            throughputImpact: number;
        };
        businessImpact: {
            affectedUsers: number;
            revenueImpact: number;
            slaBreaches: number;
        };
    };
    generatedBy: string;
    createdAt: string;
}
declare class AdvancedErrorManagementService {
    private errors;
    private patterns;
    private metrics;
    private alerts;
    constructor();
    init(): void;
    private createDemoData;
    private generateTagsForDemoErrors;
    private startErrorProcessing;
    private startPerformanceMonitoring;
    private startAlertProcessing;
    createError(errorData: Omit<ErrorEvent, 'id' | 'createdAt' | 'updatedAt'>): Promise<ErrorEvent>;
    getErrors(organizationId: string, filters?: {
        service?: string;
        severity?: string;
        category?: string;
        status?: string;
        startDate?: string;
        endDate?: string;
        limit?: number;
    }): Promise<ErrorEvent[]>;
    createPattern(patternData: Omit<ErrorPattern, 'id' | 'createdAt' | 'updatedAt'>): Promise<ErrorPattern>;
    getPatterns(organizationId: string, filters?: {
        enabled?: boolean;
        actionType?: string;
        limit?: number;
    }): Promise<ErrorPattern[]>;
    createPerformanceMetric(metricData: Omit<PerformanceMetric, 'id' | 'createdAt'>): Promise<PerformanceMetric>;
    getPerformanceMetrics(organizationId: string, filters?: {
        service?: string;
        metricType?: string;
        status?: string;
        startDate?: string;
        endDate?: string;
        limit?: number;
    }): Promise<PerformanceMetric[]>;
    createAlert(alertData: Omit<Alert, 'id' | 'createdAt' | 'updatedAt'>): Promise<Alert>;
    getAlerts(organizationId: string, filters?: {
        type?: string;
        severity?: string;
        status?: string;
        startDate?: string;
        endDate?: string;
        limit?: number;
    }): Promise<Alert[]>;
    analyzeError(errorId: string): Promise<ErrorEvent>;
    private matchesPattern;
    private evaluateCondition;
    private getNestedValue;
    private executePatternAction;
    private generateTags;
    processNewErrors(): Promise<void>;
    collectPerformanceMetrics(): Promise<void>;
    processAlerts(): Promise<void>;
    generateErrorReport(organizationId: string, reportType: string, startDate: string, endDate: string, generatedBy: string): Promise<ErrorReport>;
    private calculateAverageResolutionTime;
    getStats(organizationId: string): Promise<{
        totalErrors: number;
        totalPatterns: number;
        totalMetrics: number;
        totalAlerts: number;
        last24Hours: {
            newErrors: number;
            newAlerts: number;
            resolvedErrors: number;
            escalatedErrors: number;
        };
        last7Days: {
            newErrors: number;
            newAlerts: number;
        };
        byStatus: Record<string, number>;
        byCategory: Record<string, number>;
        bySeverity: Record<string, number>;
        byService: Record<string, number>;
        alertStats: {
            active: number;
            acknowledged: number;
            resolved: number;
            suppressed: number;
        };
        performanceStats: {
            normal: number;
            warning: number;
            critical: number;
        };
    }>;
}
export declare const advancedErrorManagementService: AdvancedErrorManagementService;
export {};
//# sourceMappingURL=advanced-error-management.service.d.ts.map