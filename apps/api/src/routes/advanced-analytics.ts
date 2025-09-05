import { Router } from 'express';
import { z } from 'zod';
import { advancedAnalytics } from '../lib/advanced-analytics.js';
import { structuredLogger } from '../lib/structured-logger.js';

const router = Router();

// Validation schemas
const TrackEventSchema = z.object({
  eventType: z.string().min(1),
  action: z.string().min(1),
  entityType: z.string().min(1),
  entityId: z.string().min(1),
  userId: z.string().min(1),
  orgId: z.string().min(1),
  metadata: z.record(z.any()).default({}),
  sessionId: z.string().optional(),
  correlationId: z.string().optional()
});

const RecordMetricSchema = z.object({
  name: z.string().min(1),
  value: z.number(),
  labels: z.record(z.string()).default({})
});

const EventAnalyticsQuerySchema = z.object({
  eventType: z.string().optional(),
  action: z.string().optional(),
  entityType: z.string().optional(),
  userId: z.string().optional(),
  timeRange: z.enum(['1h', '24h', '7d', '30d']).optional()
});

// Track analytics event
router.post('/events', async (req, res) => {
  try {
    const eventData = TrackEventSchema.parse(req.body);
    const eventId = await advancedAnalytics.trackEvent(eventData);
    
    structuredLogger.info('Analytics event tracked via API', {
      eventId,
      eventType: eventData.eventType,
      action: eventData.action,
      orgId: eventData.orgId
    });
    
    res.status(201).json({
      success: true,
      eventId,
      message: 'Event tracked successfully'
    });
  } catch (error) {
    structuredLogger.error('Failed to track analytics event', error as Error);
    res.status(400).json({
      success: false,
      error: 'Invalid event data',
      details: (error as Error).message
    });
  }
});

// Record metric
router.post('/metrics', async (req, res) => {
  try {
    const metricData = RecordMetricSchema.parse(req.body);
    await advancedAnalytics.recordMetric(metricData);
    
    structuredLogger.info('Analytics metric recorded via API', {
      name: metricData.name,
      value: metricData.value
    });
    
    res.status(201).json({
      success: true,
      message: 'Metric recorded successfully'
    });
  } catch (error) {
    structuredLogger.error('Failed to record analytics metric', error as Error);
    res.status(400).json({
      success: false,
      error: 'Invalid metric data',
      details: (error as Error).message
    });
  }
});

// Get analytics dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const orgId = req.headers['x-org-id'] as string || 'demo-org';
    const timeRange = (req.query.timeRange as string) || '24h';
    
    const dashboard = await advancedAnalytics.getDashboard(orgId, timeRange);
    
    res.json({
      success: true,
      data: dashboard,
      meta: {
        orgId,
        timeRange,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    structuredLogger.error('Failed to get analytics dashboard', error as Error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate dashboard'
    });
  }
});

// Get business intelligence
router.get('/business-intelligence', async (req, res) => {
  try {
    const orgId = req.headers['x-org-id'] as string || 'demo-org';
    const bi = await advancedAnalytics.getBusinessIntelligence(orgId);
    
    res.json({
      success: true,
      data: bi,
      meta: {
        orgId,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    structuredLogger.error('Failed to get business intelligence', error as Error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate business intelligence'
    });
  }
});

// Get event analytics
router.get('/events', async (req, res) => {
  try {
    const orgId = req.headers['x-org-id'] as string || 'demo-org';
    const filters = EventAnalyticsQuerySchema.parse(req.query);
    
    const events = await advancedAnalytics.getEventAnalytics(orgId, filters);
    
    res.json({
      success: true,
      data: events,
      meta: {
        orgId,
        filters,
        count: events.length,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    structuredLogger.error('Failed to get event analytics', error as Error);
    res.status(400).json({
      success: false,
      error: 'Invalid query parameters',
      details: (error as Error).message
    });
  }
});

// Export analytics data
router.get('/export', async (req, res) => {
  try {
    const orgId = req.headers['x-org-id'] as string || 'demo-org';
    const format = (req.query.format as 'json' | 'csv') || 'json';
    
    const data = await advancedAnalytics.exportAnalytics(orgId, format);
    
    const contentType = format === 'csv' ? 'text/csv' : 'application/json';
    const filename = `analytics-export-${orgId}-${new Date().toISOString().split('T')[0]}.${format}`;
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(data);
  } catch (error) {
    structuredLogger.error('Failed to export analytics data', error as Error);
    res.status(500).json({
      success: false,
      error: 'Failed to export data'
    });
  }
});

// Get analytics stats
router.get('/stats', async (req, res) => {
  try {
    const stats = advancedAnalytics.getStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    structuredLogger.error('Failed to get analytics stats', error as Error);
    res.status(500).json({
      success: false,
      error: 'Failed to get stats'
    });
  }
});

// Real-time analytics (SSE)
router.get('/realtime', async (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  const orgId = req.headers['x-org-id'] as string || 'demo-org';
  
  const sendEvent = (data: any) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // Send initial dashboard
  try {
    const dashboard = await advancedAnalytics.getDashboard(orgId, '1h');
    sendEvent({
      type: 'dashboard',
      data: dashboard,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to send initial dashboard', error as Error);
  }

  // Send periodic updates
  const interval = setInterval(async () => {
    try {
      const dashboard = await advancedAnalytics.getDashboard(orgId, '1h');
      sendEvent({
        type: 'dashboard_update',
        data: dashboard,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      structuredLogger.error('Failed to send dashboard update', error as Error);
    }
  }, 30000); // Update every 30 seconds

  req.on('close', () => {
    clearInterval(interval);
    structuredLogger.info('Analytics real-time connection closed', { orgId });
  });

  structuredLogger.info('Analytics real-time connection established', { orgId });
});

export default router;
