import { z } from 'zod';
export declare const AIAnalyticsRequestSchema: z.ZodObject<{
    sessionId: z.ZodString;
    userId: z.ZodString;
    organizationId: z.ZodString;
    analyticsType: z.ZodEnum<["usage", "performance", "insights", "trends", "predictions"]>;
    timeRange: z.ZodObject<{
        start: z.ZodString;
        end: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        start?: string;
        end?: string;
    }, {
        start?: string;
        end?: string;
    }>;
    filters: z.ZodOptional<z.ZodObject<{
        service: z.ZodOptional<z.ZodString>;
        model: z.ZodOptional<z.ZodString>;
        userType: z.ZodOptional<z.ZodEnum<["admin", "user", "api"]>>;
        region: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        model?: string;
        service?: string;
        userType?: "api" | "user" | "admin";
        region?: string;
    }, {
        model?: string;
        service?: string;
        userType?: "api" | "user" | "admin";
        region?: string;
    }>>;
    metrics: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    userId?: string;
    organizationId?: string;
    sessionId?: string;
    analyticsType?: "usage" | "performance" | "insights" | "trends" | "predictions";
    timeRange?: {
        start?: string;
        end?: string;
    };
    filters?: {
        model?: string;
        service?: string;
        userType?: "api" | "user" | "admin";
        region?: string;
    };
    metrics?: string[];
}, {
    userId?: string;
    organizationId?: string;
    sessionId?: string;
    analyticsType?: "usage" | "performance" | "insights" | "trends" | "predictions";
    timeRange?: {
        start?: string;
        end?: string;
    };
    filters?: {
        model?: string;
        service?: string;
        userType?: "api" | "user" | "admin";
        region?: string;
    };
    metrics?: string[];
}>;
export declare const AIAnalyticsResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    data: z.ZodObject<{
        analyticsType: z.ZodString;
        timeRange: z.ZodObject<{
            start: z.ZodString;
            end: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            start?: string;
            end?: string;
        }, {
            start?: string;
            end?: string;
        }>;
        metrics: z.ZodRecord<z.ZodString, z.ZodAny>;
        insights: z.ZodArray<z.ZodString, "many">;
        recommendations: z.ZodArray<z.ZodString, "many">;
        trends: z.ZodArray<z.ZodObject<{
            metric: z.ZodString;
            values: z.ZodArray<z.ZodNumber, "many">;
            timestamps: z.ZodArray<z.ZodString, "many">;
        }, "strip", z.ZodTypeAny, {
            values?: number[];
            metric?: string;
            timestamps?: string[];
        }, {
            values?: number[];
            metric?: string;
            timestamps?: string[];
        }>, "many">;
        predictions: z.ZodOptional<z.ZodArray<z.ZodObject<{
            metric: z.ZodString;
            predictedValue: z.ZodNumber;
            confidence: z.ZodNumber;
            timeframe: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            metric?: string;
            predictedValue?: number;
            confidence?: number;
            timeframe?: string;
        }, {
            metric?: string;
            predictedValue?: number;
            confidence?: number;
            timeframe?: string;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        analyticsType?: string;
        insights?: string[];
        trends?: {
            values?: number[];
            metric?: string;
            timestamps?: string[];
        }[];
        predictions?: {
            metric?: string;
            predictedValue?: number;
            confidence?: number;
            timeframe?: string;
        }[];
        timeRange?: {
            start?: string;
            end?: string;
        };
        metrics?: Record<string, any>;
        recommendations?: string[];
    }, {
        analyticsType?: string;
        insights?: string[];
        trends?: {
            values?: number[];
            metric?: string;
            timestamps?: string[];
        }[];
        predictions?: {
            metric?: string;
            predictedValue?: number;
            confidence?: number;
            timeframe?: string;
        }[];
        timeRange?: {
            start?: string;
            end?: string;
        };
        metrics?: Record<string, any>;
        recommendations?: string[];
    }>;
    metadata: z.ZodObject<{
        generatedAt: z.ZodString;
        processingTime: z.ZodNumber;
        dataPoints: z.ZodNumber;
        cacheHit: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        generatedAt?: string;
        processingTime?: number;
        dataPoints?: number;
        cacheHit?: boolean;
    }, {
        generatedAt?: string;
        processingTime?: number;
        dataPoints?: number;
        cacheHit?: boolean;
    }>;
}, "strip", z.ZodTypeAny, {
    data?: {
        analyticsType?: string;
        insights?: string[];
        trends?: {
            values?: number[];
            metric?: string;
            timestamps?: string[];
        }[];
        predictions?: {
            metric?: string;
            predictedValue?: number;
            confidence?: number;
            timeframe?: string;
        }[];
        timeRange?: {
            start?: string;
            end?: string;
        };
        metrics?: Record<string, any>;
        recommendations?: string[];
    };
    success?: boolean;
    metadata?: {
        generatedAt?: string;
        processingTime?: number;
        dataPoints?: number;
        cacheHit?: boolean;
    };
}, {
    data?: {
        analyticsType?: string;
        insights?: string[];
        trends?: {
            values?: number[];
            metric?: string;
            timestamps?: string[];
        }[];
        predictions?: {
            metric?: string;
            predictedValue?: number;
            confidence?: number;
            timeframe?: string;
        }[];
        timeRange?: {
            start?: string;
            end?: string;
        };
        metrics?: Record<string, any>;
        recommendations?: string[];
    };
    success?: boolean;
    metadata?: {
        generatedAt?: string;
        processingTime?: number;
        dataPoints?: number;
        cacheHit?: boolean;
    };
}>;
export type AIAnalyticsRequest = z.infer<typeof AIAnalyticsRequestSchema>;
export type AIAnalyticsResponse = z.infer<typeof AIAnalyticsResponseSchema>;
export declare class AIAnalyticsService {
    private db;
    private analyticsCache;
    private readonly CACHE_TTL;
    constructor();
    private initializeService;
    private initializeAnalyticsTables;
    private startBackgroundProcessing;
    private processBackgroundAnalytics;
    private cleanupOldData;
    private cleanupCache;
    generateAnalytics(request: AIAnalyticsRequest): Promise<AIAnalyticsResponse>;
    private generateUsageAnalytics;
    private generatePerformanceAnalytics;
    private generateInsightsAnalytics;
    private generateTrendsAnalytics;
    private generatePredictionsAnalytics;
    private generateUsageInsights;
    private generateUsageRecommendations;
    private generatePerformanceInsights;
    private generatePerformanceRecommendations;
    private generateInsightRecommendations;
    private generateTrendInsights;
    private generateTrendRecommendations;
    private generatePredictionInsights;
    private generatePredictionRecommendations;
    private generateCacheKey;
    private getCachedResult;
    private setCachedResult;
    private generateInsights;
    private generateOrganizationInsights;
    private createInsight;
    private updateTrends;
    private updateOrganizationTrends;
    recordUsage(data: {
        sessionId: string;
        userId: string;
        organizationId: string;
        serviceName: string;
        modelName?: string;
        requestType: string;
        responseTimeMs?: number;
        tokensUsed?: number;
        costUsd?: number;
        success: boolean;
        errorMessage?: string;
        metadata?: any;
    }): Promise<void>;
    recordPerformance(data: {
        serviceName: string;
        modelName?: string;
        metricName: string;
        metricValue: number;
        metricUnit?: string;
        metadata?: any;
    }): Promise<void>;
    getHealthStatus(): Promise<{
        status: 'healthy' | 'degraded' | 'unhealthy';
        services: Record<string, boolean>;
        lastCheck: Date;
    }>;
}
export declare const aiAnalyticsService: AIAnalyticsService;
//# sourceMappingURL=analytics.service.d.ts.map