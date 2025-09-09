import { Router } from 'express';
import { aiAnalyticsService, AIAnalyticsRequestSchema } from '../services/ai-analytics.service.js';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { z } from 'zod';

const router = Router();

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const generateAnalyticsSchema = AIAnalyticsRequestSchema;

const recordUsageSchema = z.object({
  sessionId: z.string().uuid(),
  userId: z.string().uuid(),
  organizationId: z.string().uuid(),
  serviceName: z.string().min(1).max(100),
  modelName: z.string().max(100).optional(),
  requestType: z.string().min(1).max(50),
  responseTimeMs: z.number().int().positive().optional(),
  tokensUsed: z.number().int().nonnegative().optional(),
  costUsd: z.number().nonnegative().optional(),
  success: z.boolean(),
  errorMessage: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

const recordPerformanceSchema = z.object({
  serviceName: z.string().min(1).max(100),
  modelName: z.string().max(100).optional(),
  metricName: z.string().min(1).max(100),
  metricValue: z.number(),
  metricUnit: z.string().max(20).optional(),
  metadata: z.record(z.any()).optional(),
});

// ============================================================================
// ANALYTICS ENDPOINTS
// ============================================================================

/**
 * @swagger
 * /v1/ai-analytics/generate:
 *   post:
 *     summary: Generate AI analytics
 *     description: Generate comprehensive analytics for AI services including usage, performance, insights, trends, and predictions
 *     tags: [AI Analytics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *               - userId
 *               - organizationId
 *               - analyticsType
 *               - timeRange
 *             properties:
 *               sessionId:
 *                 type: string
 *                 format: uuid
 *                 description: Session ID for the analytics request
 *               userId:
 *                 type: string
 *                 format: uuid
 *                 description: User ID requesting analytics
 *               organizationId:
 *                 type: string
 *                 format: uuid
 *                 description: Organization ID for analytics scope
 *               analyticsType:
 *                 type: string
 *                 enum: [usage, performance, insights, trends, predictions]
 *                 description: Type of analytics to generate
 *               timeRange:
 *                 type: object
 *                 properties:
 *                   start:
 *                     type: string
 *                     format: date-time
 *                   end:
 *                     type: string
 *                     format: date-time
 *               filters:
 *                 type: object
 *                 properties:
 *                   service:
 *                     type: string
 *                   model:
 *                     type: string
 *                   userType:
 *                     type: string
 *                     enum: [admin, user, api]
 *                   region:
 *                     type: string
 *               metrics:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Analytics generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     analyticsType:
 *                       type: string
 *                     timeRange:
 *                       type: object
 *                     metrics:
 *                       type: object
 *                     insights:
 *                       type: array
 *                       items:
 *                         type: string
 *                     recommendations:
 *                       type: array
 *                       items:
 *                         type: string
 *                     trends:
 *                       type: array
 *                     predictions:
 *                       type: array
 *                 metadata:
 *                   type: object
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/generate', authMiddleware, validate(generateAnalyticsSchema), async (req, res) => {
  try {
    const analyticsRequest = req.body;

    const result = await aiAnalyticsService.generateAnalytics(analyticsRequest);

    res.status(200).json(result);
  } catch (error) {
    console.error('Error generating analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate analytics',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @swagger
 * /v1/ai-analytics/usage:
 *   post:
 *     summary: Record usage analytics
 *     description: Record usage data for AI services
 *     tags: [AI Analytics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *               - userId
 *               - organizationId
 *               - serviceName
 *               - requestType
 *               - success
 *             properties:
 *               sessionId:
 *                 type: string
 *                 format: uuid
 *               userId:
 *                 type: string
 *                 format: uuid
 *               organizationId:
 *                 type: string
 *                 format: uuid
 *               serviceName:
 *                 type: string
 *               modelName:
 *                 type: string
 *               requestType:
 *                 type: string
 *               responseTimeMs:
 *                 type: integer
 *               tokensUsed:
 *                 type: integer
 *               costUsd:
 *                 type: number
 *               success:
 *                 type: boolean
 *               errorMessage:
 *                 type: string
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: Usage recorded successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/usage', authMiddleware, validate(recordUsageSchema), async (req, res) => {
  try {
    const usageData = req.body;

    await aiAnalyticsService.recordUsage(usageData);

    res.status(200).json({
      success: true,
      message: 'Usage recorded successfully',
    });
  } catch (error) {
    console.error('Error recording usage:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record usage',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @swagger
 * /v1/ai-analytics/performance:
 *   post:
 *     summary: Record performance metrics
 *     description: Record performance metrics for AI services
 *     tags: [AI Analytics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - serviceName
 *               - metricName
 *               - metricValue
 *             properties:
 *               serviceName:
 *                 type: string
 *               modelName:
 *                 type: string
 *               metricName:
 *                 type: string
 *               metricValue:
 *                 type: number
 *               metricUnit:
 *                 type: string
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: Performance metrics recorded successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/performance', authMiddleware, validate(recordPerformanceSchema), async (req, res) => {
  try {
    const performanceData = req.body;

    await aiAnalyticsService.recordPerformance(performanceData);

    res.status(200).json({
      success: true,
      message: 'Performance metrics recorded successfully',
    });
  } catch (error) {
    console.error('Error recording performance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record performance metrics',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @swagger
 * /v1/ai-analytics/insights:
 *   get:
 *     summary: Get AI insights
 *     description: Get generated insights for an organization
 *     tags: [AI Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Organization ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Maximum number of insights to return
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by insight type
 *       - in: query
 *         name: impact
 *         schema:
 *           type: string
 *           enum: [low, medium, high, critical]
 *         description: Filter by impact level
 *     responses:
 *       200:
 *         description: Insights retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       type:
 *                         type: string
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *                       confidence:
 *                         type: number
 *                       impact:
 *                         type: string
 *                       actionable:
 *                         type: boolean
 *                       createdAt:
 *                         type: string
 *       400:
 *         description: Invalid request parameters
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/insights', authMiddleware, async (req, res) => {
  try {
    const { organizationId, limit = 50, type, impact } = req.query;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        error: 'organizationId is required',
      });
    }

    let query = `
      SELECT
        id, insight_type, insight_title, insight_description,
        insight_data, confidence_score, impact_level, actionable, created_at
      FROM ai_analytics_insights
      WHERE organization_id = $1
        AND (expires_at IS NULL OR expires_at > NOW())
    `;

    const params: any[] = [organizationId];

    if (type) {
      query += ` AND insight_type = $${params.length + 1}`;
      params.push(type);
    }

    if (impact) {
      query += ` AND impact_level = $${params.length + 1}`;
      params.push(impact);
    }

    query += ` ORDER BY confidence_score DESC, created_at DESC LIMIT $${params.length + 1}`;
    params.push(parseInt(limit as string));

    const result = await aiAnalyticsService['db'].query(query, params);

    const insights = result.rows.map(row => ({
      id: row.id,
      type: row.insight_type,
      title: row.insight_title,
      description: row.insight_description,
      data: row.insight_data,
      confidence: parseFloat(row.confidence_score),
      impact: row.impact_level,
      actionable: row.actionable,
      createdAt: row.created_at,
    }));

    res.status(200).json({
      success: true,
      data: insights,
    });
  } catch (error) {
    console.error('Error getting insights:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get insights',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @swagger
 * /v1/ai-analytics/trends:
 *   get:
 *     summary: Get AI trends
 *     description: Get trend data for an organization
 *     tags: [AI Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Organization ID
 *       - in: query
 *         name: trendType
 *         schema:
 *           type: string
 *         description: Filter by trend type
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly]
 *         description: Filter by trend period
 *     responses:
 *       200:
 *         description: Trends retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       type:
 *                         type: string
 *                       data:
 *                         type: object
 *                       period:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *       400:
 *         description: Invalid request parameters
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/trends', authMiddleware, async (req, res) => {
  try {
    const { organizationId, trendType, period } = req.query;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        error: 'organizationId is required',
      });
    }

    let query = `
      SELECT
        id, trend_name, trend_type, trend_data, trend_period, created_at
      FROM ai_analytics_trends
      WHERE organization_id = $1
    `;

    const params: any[] = [organizationId];

    if (trendType) {
      query += ` AND trend_type = $${params.length + 1}`;
      params.push(trendType);
    }

    if (period) {
      query += ` AND trend_period = $${params.length + 1}`;
      params.push(period);
    }

    query += ` ORDER BY created_at DESC`;

    const result = await aiAnalyticsService['db'].query(query, params);

    const trends = result.rows.map(row => ({
      id: row.id,
      name: row.trend_name,
      type: row.trend_type,
      data: row.trend_data,
      period: row.trend_period,
      createdAt: row.created_at,
    }));

    res.status(200).json({
      success: true,
      data: trends,
    });
  } catch (error) {
    console.error('Error getting trends:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get trends',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @swagger
 * /v1/ai-analytics/metrics:
 *   get:
 *     summary: Get AI metrics summary
 *     description: Get summary metrics for AI services
 *     tags: [AI Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Organization ID
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [1h, 24h, 7d, 30d]
 *           default: 24h
 *         description: Time range for metrics
 *     responses:
 *       200:
 *         description: Metrics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalRequests:
 *                       type: integer
 *                     totalTokens:
 *                       type: integer
 *                     totalCost:
 *                       type: number
 *                     avgResponseTime:
 *                       type: number
 *                     successRate:
 *                       type: number
 *                     topServices:
 *                       type: array
 *       400:
 *         description: Invalid request parameters
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/metrics', authMiddleware, async (req, res) => {
  try {
    const { organizationId, timeRange = '24h' } = req.query;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        error: 'organizationId is required',
      });
    }

    // Calculate time range
    let interval: string;
    switch (timeRange) {
      case '1h':
        interval = "1 hour";
        break;
      case '24h':
        interval = "24 hours";
        break;
      case '7d':
        interval = "7 days";
        break;
      case '30d':
        interval = "30 days";
        break;
      default:
        interval = "24 hours";
    }

    const query = `
      SELECT
        COUNT(*) as total_requests,
        SUM(tokens_used) as total_tokens,
        SUM(cost_usd) as total_cost,
        AVG(response_time_ms) as avg_response_time,
        SUM(CASE WHEN success THEN 1 ELSE 0 END)::float / COUNT(*) as success_rate
      FROM ai_analytics_usage
      WHERE organization_id = $1
        AND created_at >= NOW() - INTERVAL '${interval}'
    `;

    const result = await aiAnalyticsService['db'].query(query, [organizationId]);
    const row = result.rows[0];

    const topServicesQuery = `
      SELECT
        service_name,
        COUNT(*) as request_count,
        AVG(response_time_ms) as avg_response_time
      FROM ai_analytics_usage
      WHERE organization_id = $1
        AND created_at >= NOW() - INTERVAL '${interval}'
      GROUP BY service_name
      ORDER BY request_count DESC
      LIMIT 5
    `;

    const topServicesResult = await aiAnalyticsService['db'].query(topServicesQuery, [organizationId]);

    const metrics = {
      totalRequests: parseInt(row.total_requests) || 0,
      totalTokens: parseInt(row.total_tokens) || 0,
      totalCost: parseFloat(row.total_cost) || 0,
      avgResponseTime: parseFloat(row.avg_response_time) || 0,
      successRate: parseFloat(row.success_rate) || 0,
      topServices: topServicesResult.rows.map(service => ({
        name: service.service_name,
        requestCount: parseInt(service.request_count),
        avgResponseTime: parseFloat(service.avg_response_time),
      })),
    };

    res.status(200).json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    console.error('Error getting metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get metrics',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @swagger
 * /v1/ai-analytics/health:
 *   get:
 *     summary: Get AI analytics service health
 *     description: Get health status of the AI analytics service
 *     tags: [AI Analytics]
 *     responses:
 *       200:
 *         description: Health status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       enum: [healthy, degraded, unhealthy]
 *                     services:
 *                       type: object
 *                     lastCheck:
 *                       type: string
 *                       format: date-time
 *       500:
 *         description: Internal server error
 */
router.get('/health', async (req, res) => {
  try {
    const healthStatus = await aiAnalyticsService.getHealthStatus();

    res.status(200).json({
      success: true,
      data: healthStatus,
    });
  } catch (error) {
    console.error('Error getting health status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get health status',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export { router as aiAnalyticsRoutes };
