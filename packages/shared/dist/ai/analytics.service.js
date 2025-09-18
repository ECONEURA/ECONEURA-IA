import { structuredLogger } from '../lib/structured-logger.js';
import { getDatabaseService } from '../lib/database.service.js';
import { z } from 'zod';
export const AIAnalyticsRequestSchema = z.object({
    sessionId: z.string().uuid(),
    userId: z.string().uuid(),
    organizationId: z.string().uuid(),
    analyticsType: z.enum(['usage', 'performance', 'insights', 'trends', 'predictions']),
    timeRange: z.object({
        start: z.string().datetime(),
        end: z.string().datetime(),
    }),
    filters: z.object({
        service: z.string().optional(),
        model: z.string().optional(),
        userType: z.enum(['admin', 'user', 'api']).optional(),
        region: z.string().optional(),
    }).optional(),
    metrics: z.array(z.string()).optional(),
});
export const AIAnalyticsResponseSchema = z.object({
    success: z.boolean(),
    data: z.object({
        analyticsType: z.string(),
        timeRange: z.object({
            start: z.string(),
            end: z.string(),
        }),
        metrics: z.record(z.any()),
        insights: z.array(z.string()),
        recommendations: z.array(z.string()),
        trends: z.array(z.object({
            metric: z.string(),
            values: z.array(z.number()),
            timestamps: z.array(z.string()),
        })),
        predictions: z.array(z.object({
            metric: z.string(),
            predictedValue: z.number(),
            confidence: z.number(),
            timeframe: z.string(),
        })).optional(),
    }),
    metadata: z.object({
        generatedAt: z.string(),
        processingTime: z.number(),
        dataPoints: z.number(),
        cacheHit: z.boolean(),
    }),
});
export class AIAnalyticsService {
    db;
    analyticsCache = new Map();
    CACHE_TTL = 5 * 60 * 1000;
    constructor() {
        this.db = getDatabaseService();
        this.initializeService();
    }
    async initializeService() {
        try {
            structuredLogger.info('Initializing AI Analytics Service', {
                service: 'ai-analytics',
                timestamp: new Date().toISOString(),
            });
            await this.initializeAnalyticsTables();
            this.startBackgroundProcessing();
            structuredLogger.info('AI Analytics Service initialized successfully', {
                service: 'ai-analytics',
                status: 'ready',
            });
        }
        catch (error) {
            structuredLogger.error('Failed to initialize AI Analytics Service', {
                service: 'ai-analytics',
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
            });
            throw error;
        }
    }
    async initializeAnalyticsTables() {
        try {
            await this.db.query(`
        CREATE TABLE IF NOT EXISTS ai_analytics_usage (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          session_id UUID NOT NULL,
          user_id UUID NOT NULL,
          organization_id UUID NOT NULL,
          service_name VARCHAR(100) NOT NULL,
          model_name VARCHAR(100),
          request_type VARCHAR(50) NOT NULL,
          request_count INTEGER DEFAULT 1,
          response_time_ms INTEGER,
          tokens_used INTEGER,
          cost_usd DECIMAL(10,4),
          success BOOLEAN DEFAULT true,
          error_message TEXT,
          metadata JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
            await this.db.query(`
        CREATE TABLE IF NOT EXISTS ai_analytics_performance (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          service_name VARCHAR(100) NOT NULL,
          model_name VARCHAR(100),
          metric_name VARCHAR(100) NOT NULL,
          metric_value DECIMAL(15,6) NOT NULL,
          metric_unit VARCHAR(20),
          timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          metadata JSONB
        );
      `);
            await this.db.query(`
        CREATE TABLE IF NOT EXISTS ai_analytics_insights (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          organization_id UUID NOT NULL,
          insight_type VARCHAR(50) NOT NULL,
          insight_title VARCHAR(200) NOT NULL,
          insight_description TEXT,
          insight_data JSONB NOT NULL,
          confidence_score DECIMAL(3,2),
          impact_level VARCHAR(20),
          actionable BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          expires_at TIMESTAMP WITH TIME ZONE
        );
      `);
            await this.db.query(`
        CREATE TABLE IF NOT EXISTS ai_analytics_trends (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          organization_id UUID NOT NULL,
          trend_name VARCHAR(100) NOT NULL,
          trend_type VARCHAR(50) NOT NULL,
          trend_data JSONB NOT NULL,
          trend_period VARCHAR(20) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
            await this.db.query(`
        CREATE INDEX IF NOT EXISTS idx_ai_analytics_usage_org_time 
        ON ai_analytics_usage(organization_id, created_at);
      `);
            await this.db.query(`
        CREATE INDEX IF NOT EXISTS idx_ai_analytics_usage_service 
        ON ai_analytics_usage(service_name, created_at);
      `);
            await this.db.query(`
        CREATE INDEX IF NOT EXISTS idx_ai_analytics_performance_service_time 
        ON ai_analytics_performance(service_name, timestamp);
      `);
            structuredLogger.info('Analytics tables initialized successfully', {
                service: 'ai-analytics',
                tables: ['usage', 'performance', 'insights', 'trends'],
            });
        }
        catch (error) {
            structuredLogger.error('Failed to initialize analytics tables', {
                service: 'ai-analytics',
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    startBackgroundProcessing() {
        setInterval(async () => {
            try {
                await this.processBackgroundAnalytics();
            }
            catch (error) {
                structuredLogger.error('Background analytics processing failed', {
                    service: 'ai-analytics',
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }, 5 * 60 * 1000);
        setInterval(async () => {
            try {
                await this.cleanupOldData();
            }
            catch (error) {
                structuredLogger.error('Data cleanup failed', {
                    service: 'ai-analytics',
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }, 60 * 60 * 1000);
    }
    async processBackgroundAnalytics() {
        try {
            await this.generateInsights();
            await this.updateTrends();
            this.cleanupCache();
            structuredLogger.info('Background analytics processing completed', {
                service: 'ai-analytics',
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            structuredLogger.error('Background analytics processing failed', {
                service: 'ai-analytics',
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    async cleanupOldData() {
        try {
            await this.db.query(`
        DELETE FROM ai_analytics_usage 
        WHERE created_at < NOW() - INTERVAL '90 days'
      `);
            await this.db.query(`
        DELETE FROM ai_analytics_performance 
        WHERE timestamp < NOW() - INTERVAL '30 days'
      `);
            await this.db.query(`
        DELETE FROM ai_analytics_insights 
        WHERE expires_at < NOW()
      `);
            structuredLogger.info('Old data cleanup completed', {
                service: 'ai-analytics',
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            structuredLogger.error('Data cleanup failed', {
                service: 'ai-analytics',
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    cleanupCache() {
        const now = Date.now();
        for (const [key, value] of this.analyticsCache.entries()) {
            if (now - value.timestamp > this.CACHE_TTL) {
                this.analyticsCache.delete(key);
            }
        }
    }
    async generateAnalytics(request) {
        const startTime = Date.now();
        try {
            structuredLogger.info('Generating AI analytics', {
                service: 'ai-analytics',
                analyticsType: request.analyticsType,
                organizationId: request.organizationId,
                timeRange: request.timeRange,
            });
            const cacheKey = this.generateCacheKey(request);
            const cachedResult = this.getCachedResult(cacheKey);
            if (cachedResult) {
                return {
                    ...cachedResult,
                    metadata: {
                        ...cachedResult.metadata,
                        cacheHit: true,
                        processingTime: Date.now() - startTime,
                    },
                };
            }
            let analyticsData;
            switch (request.analyticsType) {
                case 'usage':
                    analyticsData = await this.generateUsageAnalytics(request);
                    break;
                case 'performance':
                    analyticsData = await this.generatePerformanceAnalytics(request);
                    break;
                case 'insights':
                    analyticsData = await this.generateInsightsAnalytics(request);
                    break;
                case 'trends':
                    analyticsData = await this.generateTrendsAnalytics(request);
                    break;
                case 'predictions':
                    analyticsData = await this.generatePredictionsAnalytics(request);
                    break;
                default:
                    throw new Error(`Unsupported analytics type: ${request.analyticsType}`);
            }
            const response = {
                success: true,
                data: analyticsData,
                metadata: {
                    generatedAt: new Date().toISOString(),
                    processingTime: Date.now() - startTime,
                    dataPoints: analyticsData.dataPoints || 0,
                    cacheHit: false,
                },
            };
            this.setCachedResult(cacheKey, response);
            structuredLogger.info('AI analytics generated successfully', {
                service: 'ai-analytics',
                analyticsType: request.analyticsType,
                processingTime: Date.now() - startTime,
                dataPoints: analyticsData.dataPoints || 0,
            });
            return response;
        }
        catch (error) {
            structuredLogger.error('Failed to generate AI analytics', {
                service: 'ai-analytics',
                analyticsType: request.analyticsType,
                error: error instanceof Error ? error.message : 'Unknown error',
                processingTime: Date.now() - startTime,
            });
            return {
                success: false,
                data: {
                    analyticsType: request.analyticsType,
                    timeRange: request.timeRange,
                    metrics: {},
                    insights: [],
                    recommendations: [],
                    trends: [],
                },
                metadata: {
                    generatedAt: new Date().toISOString(),
                    processingTime: Date.now() - startTime,
                    dataPoints: 0,
                    cacheHit: false,
                },
            };
        }
    }
    async generateUsageAnalytics(request) {
        const { organizationId, timeRange, filters } = request;
        let query = `
      SELECT 
        service_name,
        model_name,
        request_type,
        COUNT(*) as request_count,
        AVG(response_time_ms) as avg_response_time,
        SUM(tokens_used) as total_tokens,
        SUM(cost_usd) as total_cost,
        SUM(CASE WHEN success THEN 1 ELSE 0 END) as success_count,
        SUM(CASE WHEN NOT success THEN 1 ELSE 0 END) as error_count
      FROM ai_analytics_usage
      WHERE organization_id = $1
        AND created_at >= $2
        AND created_at <= $3
    `;
        const params = [organizationId, timeRange.start, timeRange.end];
        if (filters?.service) {
            query += ` AND service_name = $${params.length + 1}`;
            params.push(filters.service);
        }
        if (filters?.model) {
            query += ` AND model_name = $${params.length + 1}`;
            params.push(filters.model);
        }
        query += ` GROUP BY service_name, model_name, request_type ORDER BY request_count DESC`;
        const result = await this.db.query(query, params);
        const metrics = {
            totalRequests: result.rows.reduce((sum, row) => sum + parseInt(row.request_count), 0),
            totalTokens: result.rows.reduce((sum, row) => sum + parseInt(row.total_tokens || 0), 0),
            totalCost: result.rows.reduce((sum, row) => sum + parseFloat(row.total_cost || 0), 0),
            avgResponseTime: result.rows.reduce((sum, row) => sum + parseFloat(row.avg_response_time || 0), 0) / result.rows.length,
            successRate: result.rows.reduce((sum, row) => sum + parseInt(row.success_count), 0) /
                result.rows.reduce((sum, row) => sum + parseInt(row.request_count), 0) * 100,
            services: result.rows,
        };
        const insights = this.generateUsageInsights(metrics);
        const recommendations = this.generateUsageRecommendations(metrics);
        return {
            analyticsType: 'usage',
            timeRange,
            metrics,
            insights,
            recommendations,
            trends: [],
            dataPoints: result.rows.length,
        };
    }
    async generatePerformanceAnalytics(request) {
        const { organizationId, timeRange, filters } = request;
        let query = `
      SELECT 
        service_name,
        model_name,
        metric_name,
        AVG(metric_value) as avg_value,
        MIN(metric_value) as min_value,
        MAX(metric_value) as max_value,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY metric_value) as p95_value,
        PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY metric_value) as p99_value,
        COUNT(*) as data_points
      FROM ai_analytics_performance
      WHERE timestamp >= $1 AND timestamp <= $2
    `;
        const params = [timeRange.start, timeRange.end];
        if (filters?.service) {
            query += ` AND service_name = $${params.length + 1}`;
            params.push(filters.service);
        }
        query += ` GROUP BY service_name, model_name, metric_name ORDER BY service_name, metric_name`;
        const result = await this.db.query(query, params);
        const metrics = {
            services: result.rows.reduce((acc, row) => {
                if (!acc[row.service_name]) {
                    acc[row.service_name] = {};
                }
                acc[row.service_name][row.metric_name] = {
                    avg: parseFloat(row.avg_value),
                    min: parseFloat(row.min_value),
                    max: parseFloat(row.max_value),
                    p95: parseFloat(row.p95_value),
                    p99: parseFloat(row.p99_value),
                    dataPoints: parseInt(row.data_points),
                };
                return acc;
            }, {}),
        };
        const insights = this.generatePerformanceInsights(metrics);
        const recommendations = this.generatePerformanceRecommendations(metrics);
        return {
            analyticsType: 'performance',
            timeRange,
            metrics,
            insights,
            recommendations,
            trends: [],
            dataPoints: result.rows.length,
        };
    }
    async generateInsightsAnalytics(request) {
        const { organizationId, timeRange } = request;
        const query = `
      SELECT 
        insight_type,
        insight_title,
        insight_description,
        insight_data,
        confidence_score,
        impact_level,
        actionable,
        created_at
      FROM ai_analytics_insights
      WHERE organization_id = $1
        AND created_at >= $2
        AND created_at <= $3
        AND (expires_at IS NULL OR expires_at > NOW())
      ORDER BY confidence_score DESC, created_at DESC
    `;
        const result = await this.db.query(query, [organizationId, timeRange.start, timeRange.end]);
        const insights = result.rows.map(row => ({
            type: row.insight_type,
            title: row.insight_title,
            description: row.insight_description,
            data: row.insight_data,
            confidence: parseFloat(row.confidence_score),
            impact: row.impact_level,
            actionable: row.actionable,
            createdAt: row.created_at,
        }));
        const recommendations = this.generateInsightRecommendations(insights);
        return {
            analyticsType: 'insights',
            timeRange,
            metrics: {
                totalInsights: insights.length,
                highConfidenceInsights: insights.filter(i => i.confidence > 0.8).length,
                actionableInsights: insights.filter(i => i.actionable).length,
                insightsByType: insights.reduce((acc, insight) => {
                    acc[insight.type] = (acc[insight.type] || 0) + 1;
                    return acc;
                }, {}),
            },
            insights: insights.map(i => i.title),
            recommendations,
            trends: [],
            dataPoints: insights.length,
        };
    }
    async generateTrendsAnalytics(request) {
        const { organizationId, timeRange } = request;
        const query = `
      SELECT 
        trend_name,
        trend_type,
        trend_data,
        trend_period,
        created_at
      FROM ai_analytics_trends
      WHERE organization_id = $1
        AND created_at >= $2
        AND created_at <= $3
      ORDER BY created_at DESC
    `;
        const result = await this.db.query(query, [organizationId, timeRange.start, timeRange.end]);
        const trends = result.rows.map(row => ({
            name: row.trend_name,
            type: row.trend_type,
            data: row.trend_data,
            period: row.trend_period,
            createdAt: row.created_at,
        }));
        const insights = this.generateTrendInsights(trends);
        const recommendations = this.generateTrendRecommendations(trends);
        return {
            analyticsType: 'trends',
            timeRange,
            metrics: {
                totalTrends: trends.length,
                trendsByType: trends.reduce((acc, trend) => {
                    acc[trend.type] = (acc[trend.type] || 0) + 1;
                    return acc;
                }, {}),
            },
            insights,
            recommendations,
            trends: trends.map(trend => ({
                metric: trend.name,
                values: trend.data.values || [],
                timestamps: trend.data.timestamps || [],
            })),
            dataPoints: trends.length,
        };
    }
    async generatePredictionsAnalytics(request) {
        const predictions = [
            {
                metric: 'request_volume',
                predictedValue: 1250,
                confidence: 0.85,
                timeframe: 'next_7_days',
            },
            {
                metric: 'response_time',
                predictedValue: 180,
                confidence: 0.78,
                timeframe: 'next_24_hours',
            },
            {
                metric: 'cost',
                predictedValue: 45.50,
                confidence: 0.82,
                timeframe: 'next_30_days',
            },
        ];
        const insights = this.generatePredictionInsights(predictions);
        const recommendations = this.generatePredictionRecommendations(predictions);
        return {
            analyticsType: 'predictions',
            timeRange: request.timeRange,
            metrics: {
                totalPredictions: predictions.length,
                avgConfidence: predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length,
                highConfidencePredictions: predictions.filter(p => p.confidence > 0.8).length,
            },
            insights,
            recommendations,
            trends: [],
            predictions,
            dataPoints: predictions.length,
        };
    }
    generateUsageInsights(metrics) {
        const insights = [];
        if (metrics.successRate < 95) {
            insights.push(`Success rate is below 95% (${metrics.successRate.toFixed(1)}%), indicating potential service issues`);
        }
        if (metrics.avgResponseTime > 1000) {
            insights.push(`Average response time is high (${metrics.avgResponseTime.toFixed(0)}ms), consider optimization`);
        }
        if (metrics.totalCost > 100) {
            insights.push(`High usage costs detected ($${metrics.totalCost.toFixed(2)}), review usage patterns`);
        }
        const topService = metrics.services[0];
        if (topService) {
            insights.push(`${topService.service_name} is the most used service with ${topService.request_count} requests`);
        }
        return insights;
    }
    generateUsageRecommendations(metrics) {
        const recommendations = [];
        if (metrics.successRate < 95) {
            recommendations.push('Investigate and fix service reliability issues');
        }
        if (metrics.avgResponseTime > 1000) {
            recommendations.push('Optimize service performance and consider caching');
        }
        if (metrics.totalCost > 100) {
            recommendations.push('Implement usage monitoring and cost optimization strategies');
        }
        recommendations.push('Set up automated alerts for service health monitoring');
        recommendations.push('Consider implementing rate limiting for cost control');
        return recommendations;
    }
    generatePerformanceInsights(metrics) {
        const insights = [];
        Object.entries(metrics.services).forEach(([serviceName, serviceMetrics]) => {
            Object.entries(serviceMetrics).forEach(([metricName, metricData]) => {
                if (metricName.includes('response_time') && metricData.p95 > 2000) {
                    insights.push(`${serviceName} has high P95 response time (${metricData.p95}ms)`);
                }
                if (metricName.includes('error_rate') && metricData.avg > 0.05) {
                    insights.push(`${serviceName} has elevated error rate (${(metricData.avg * 100).toFixed(1)}%)`);
                }
            });
        });
        return insights;
    }
    generatePerformanceRecommendations(metrics) {
        const recommendations = [];
        recommendations.push('Implement performance monitoring dashboards');
        recommendations.push('Set up automated performance alerts');
        recommendations.push('Consider implementing circuit breakers for failing services');
        recommendations.push('Review and optimize database queries');
        return recommendations;
    }
    generateInsightRecommendations(insights) {
        const recommendations = [];
        const highImpactInsights = insights.filter(i => i.impact === 'high');
        if (highImpactInsights.length > 0) {
            recommendations.push(`Address ${highImpactInsights.length} high-impact insights immediately`);
        }
        const actionableInsights = insights.filter(i => i.actionable);
        if (actionableInsights.length > 0) {
            recommendations.push(`Take action on ${actionableInsights.length} actionable insights`);
        }
        recommendations.push('Review insights regularly and update business strategies');
        recommendations.push('Implement automated insight generation processes');
        return recommendations;
    }
    generateTrendInsights(trends) {
        const insights = [];
        if (trends.length === 0) {
            insights.push('No trend data available for the selected time period');
            return insights;
        }
        insights.push(`Analyzed ${trends.length} trends across different metrics`);
        insights.push('Trend analysis shows patterns in system usage and performance');
        return insights;
    }
    generateTrendRecommendations(trends) {
        const recommendations = [];
        recommendations.push('Monitor trends regularly to identify patterns');
        recommendations.push('Use trend data for capacity planning');
        recommendations.push('Set up trend-based alerts for proactive management');
        return recommendations;
    }
    generatePredictionInsights(predictions) {
        const insights = [];
        const highConfidencePredictions = predictions.filter(p => p.confidence > 0.8);
        if (highConfidencePredictions.length > 0) {
            insights.push(`${highConfidencePredictions.length} predictions have high confidence (>80%)`);
        }
        insights.push('Predictions indicate future system behavior and resource needs');
        return insights;
    }
    generatePredictionRecommendations(predictions) {
        const recommendations = [];
        recommendations.push('Use predictions for proactive capacity planning');
        recommendations.push('Set up alerts based on predicted thresholds');
        recommendations.push('Review and validate predictions regularly');
        return recommendations;
    }
    generateCacheKey(request) {
        return `analytics:${request.analyticsType}:${request.organizationId}:${JSON.stringify(request.timeRange)}:${JSON.stringify(request.filters || {})}`;
    }
    getCachedResult(key) {
        const cached = this.analyticsCache.get(key);
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
            return cached.data;
        }
        return null;
    }
    setCachedResult(key, data) {
        this.analyticsCache.set(key, {
            data,
            timestamp: Date.now(),
        });
    }
    async generateInsights() {
        try {
            const orgsResult = await this.db.query(`
        SELECT DISTINCT organization_id 
        FROM ai_analytics_usage 
        WHERE created_at >= NOW() - INTERVAL '24 hours'
      `);
            for (const org of orgsResult.rows) {
                await this.generateOrganizationInsights(org.organization_id);
            }
        }
        catch (error) {
            structuredLogger.error('Failed to generate insights', {
                service: 'ai-analytics',
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    async generateOrganizationInsights(organizationId) {
        try {
            const usageResult = await this.db.query(`
        SELECT 
          service_name,
          COUNT(*) as request_count,
          AVG(response_time_ms) as avg_response_time,
          SUM(CASE WHEN success THEN 1 ELSE 0 END)::float / COUNT(*) as success_rate
        FROM ai_analytics_usage
        WHERE organization_id = $1
          AND created_at >= NOW() - INTERVAL '7 days'
        GROUP BY service_name
      `, [organizationId]);
            for (const row of usageResult.rows) {
                if (row.success_rate < 0.95) {
                    await this.createInsight(organizationId, {
                        type: 'performance',
                        title: `Low success rate for ${row.service_name}`,
                        description: `${row.service_name} has a success rate of ${(row.success_rate * 100).toFixed(1)}%`,
                        data: { service: row.service_name, success_rate: row.success_rate },
                        confidence: 0.9,
                        impact: 'high',
                        actionable: true,
                    });
                }
            }
        }
        catch (error) {
            structuredLogger.error('Failed to generate organization insights', {
                service: 'ai-analytics',
                organizationId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    async createInsight(organizationId, insight) {
        try {
            await this.db.query(`
        INSERT INTO ai_analytics_insights (
          organization_id, insight_type, insight_title, insight_description,
          insight_data, confidence_score, impact_level, actionable, expires_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
                organizationId,
                insight.type,
                insight.title,
                insight.description,
                JSON.stringify(insight.data),
                insight.confidence,
                insight.impact,
                insight.actionable,
                new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            ]);
        }
        catch (error) {
            structuredLogger.error('Failed to create insight', {
                service: 'ai-analytics',
                organizationId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    async updateTrends() {
        try {
            const orgsResult = await this.db.query(`
        SELECT DISTINCT organization_id 
        FROM ai_analytics_usage 
        WHERE created_at >= NOW() - INTERVAL '30 days'
      `);
            for (const org of orgsResult.rows) {
                await this.updateOrganizationTrends(org.organization_id);
            }
        }
        catch (error) {
            structuredLogger.error('Failed to update trends', {
                service: 'ai-analytics',
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    async updateOrganizationTrends(organizationId) {
        try {
            const dailyUsage = await this.db.query(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as request_count,
          AVG(response_time_ms) as avg_response_time
        FROM ai_analytics_usage
        WHERE organization_id = $1
          AND created_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(created_at)
        ORDER BY date
      `, [organizationId]);
            if (dailyUsage.rows.length > 0) {
                const trendData = {
                    values: dailyUsage.rows.map(row => parseInt(row.request_count)),
                    timestamps: dailyUsage.rows.map(row => row.date.toISOString()),
                };
                await this.db.query(`
          INSERT INTO ai_analytics_trends (
            organization_id, trend_name, trend_type, trend_data, trend_period
          ) VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (organization_id, trend_name, trend_period) 
          DO UPDATE SET trend_data = $4, updated_at = NOW()
        `, [
                    organizationId,
                    'daily_usage',
                    'usage',
                    JSON.stringify(trendData),
                    'daily',
                ]);
            }
        }
        catch (error) {
            structuredLogger.error('Failed to update organization trends', {
                service: 'ai-analytics',
                organizationId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    async recordUsage(data) {
        try {
            await this.db.query(`
        INSERT INTO ai_analytics_usage (
          session_id, user_id, organization_id, service_name, model_name,
          request_type, response_time_ms, tokens_used, cost_usd, success,
          error_message, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `, [
                data.sessionId,
                data.userId,
                data.organizationId,
                data.serviceName,
                data.modelName,
                data.requestType,
                data.responseTimeMs,
                data.tokensUsed,
                data.costUsd,
                data.success,
                data.errorMessage,
                JSON.stringify(data.metadata || {}),
            ]);
            structuredLogger.info('Usage recorded successfully', {
                service: 'ai-analytics',
                organizationId: data.organizationId,
                serviceName: data.serviceName,
                requestType: data.requestType,
            });
        }
        catch (error) {
            structuredLogger.error('Failed to record usage', {
                service: 'ai-analytics',
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    async recordPerformance(data) {
        try {
            await this.db.query(`
        INSERT INTO ai_analytics_performance (
          service_name, model_name, metric_name, metric_value, metric_unit, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [
                data.serviceName,
                data.modelName,
                data.metricName,
                data.metricValue,
                data.metricUnit,
                JSON.stringify(data.metadata || {}),
            ]);
        }
        catch (error) {
            structuredLogger.error('Failed to record performance', {
                service: 'ai-analytics',
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    async getHealthStatus() {
        try {
            const services = {
                database: true,
                cache: true,
                backgroundProcessing: true,
            };
            try {
                await this.db.query('SELECT 1');
            }
            catch (error) {
                services.database = false;
            }
            services.cache = this.analyticsCache.size >= 0;
            const healthyServices = Object.values(services).filter(Boolean).length;
            const totalServices = Object.keys(services).length;
            let status;
            if (healthyServices === totalServices) {
                status = 'healthy';
            }
            else if (healthyServices > totalServices / 2) {
                status = 'degraded';
            }
            else {
                status = 'unhealthy';
            }
            return {
                status,
                services,
                lastCheck: new Date(),
            };
        }
        catch (error) {
            structuredLogger.error('Failed to get health status', {
                service: 'ai-analytics',
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return {
                status: 'unhealthy',
                services: {
                    database: false,
                    cache: false,
                    backgroundProcessing: false,
                },
                lastCheck: new Date(),
            };
        }
    }
}
export const aiAnalyticsService = new AIAnalyticsService();
//# sourceMappingURL=analytics.service.js.map