import { Router } from 'express';
import { z } from 'zod';
import { 
  AnalyticsEventSchema,
  AnalyticsEventBatchSchema,
  AnalyticsQuerySchema,
  AnalyticsQueryResponseSchema,
  AnalyticsEvent,
  AnalyticsEventBatch,
  AnalyticsQuery
} from '@econeura/shared/src/schemas/analytics';
import { structuredLogger } from '../lib/structured-logger.js';
import { randomUUID } from 'crypto';

const router = Router();

// In-memory analytics store (replace with proper database in production)
const analyticsStore = new Map<string, AnalyticsEvent>();
const eventsByOrg = new Map<string, Set<string>>();

// Helper to add event to org index
function addEventToOrgIndex(event: AnalyticsEvent): void {
  if (!eventsByOrg.has(event.orgId)) {
    eventsByOrg.set(event.orgId, new Set());
  }
  eventsByOrg.get(event.orgId)!.add(event.correlationId || randomUUID());
}

// Helper to get events for org
function getEventsForOrg(orgId: string): AnalyticsEvent[] {
  const eventIds = eventsByOrg.get(orgId);
  if (!eventIds) return [];
  
  return Array.from(eventIds)
    .map(id => Array.from(analyticsStore.values()).find(e => 
      (e.correlationId === id || e.orgId === orgId) && e.orgId === orgId
    ))
    .filter(Boolean) as AnalyticsEvent[];
}

// POST /v1/analytics/events - Track single event
router.post('/events', async (req, res) => {
  try {
    const orgId = req.headers['x-org-id'] as string || 'org-demo';
    const userId = req.headers['x-user-id'] as string;
    const correlationId = req.headers['x-correlation-id'] as string || randomUUID();

    // Parse and validate event data
    const eventData = {
      ...req.body,
      orgId,
      userId,
      correlationId,
      timestamp: req.body.timestamp || new Date().toISOString(),
      source: req.body.source || 'api'
    };

    const event = AnalyticsEventSchema.parse(eventData);

    // Store event
    const eventId = randomUUID();
    analyticsStore.set(eventId, event);
    addEventToOrgIndex(event);

    // Add FinOps headers
    const costEur = 0.001; // Minimal cost for analytics
    res.set({
      'X-Est-Cost-EUR': costEur.toFixed(4),
      'X-Budget-Pct': '0.1',
      'X-Latency-ms': '15',
      'X-Route': 'local',
      'X-Correlation-Id': correlationId
    });

    structuredLogger.info('Analytics event tracked', {
      orgId,
      userId,
      eventType: event.eventType,
      correlationId,
      eventId
    });

    res.status(201).json({
      success: true,
      data: {
        eventId,
        eventType: event.eventType,
        timestamp: event.timestamp,
        correlationId
      },
      message: 'Event tracked successfully'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }

    structuredLogger.error('Failed to track analytics event', error as Error, {
      orgId: req.headers['x-org-id'],
      body: req.body
    });

    res.status(500).json({
      success: false,
      error: 'Failed to track event',
      message: (error as Error).message
    });
  }
});

// POST /v1/analytics/events/batch - Track multiple events
router.post('/events/batch', async (req, res) => {
  try {
    const orgId = req.headers['x-org-id'] as string || 'org-demo';
    const userId = req.headers['x-user-id'] as string;
    const correlationId = req.headers['x-correlation-id'] as string || randomUUID();

    // Parse batch data
    const batchData: AnalyticsEventBatch = {
      ...req.body,
      batchId: req.body.batchId || randomUUID(),
      timestamp: req.body.timestamp || new Date().toISOString()
    };

    const batch = AnalyticsEventBatchSchema.parse(batchData);

    // Process each event in batch
    const processedEvents: string[] = [];
    const errors: any[] = [];

    for (const eventData of batch.events) {
      try {
        const event = AnalyticsEventSchema.parse({
          ...eventData,
          orgId,
          userId: eventData.userId || userId,
          correlationId: eventData.correlationId || correlationId
        });

        const eventId = randomUUID();
        analyticsStore.set(eventId, event);
        addEventToOrgIndex(event);
        processedEvents.push(eventId);
      } catch (error) {
        errors.push({
          event: eventData,
          error: error instanceof z.ZodError ? error.errors : (error as Error).message
        });
      }
    }

    // Add FinOps headers
    const costEur = 0.001 * batch.events.length;
    res.set({
      'X-Est-Cost-EUR': costEur.toFixed(4),
      'X-Budget-Pct': '0.2',
      'X-Latency-ms': '45',
      'X-Route': 'local',
      'X-Correlation-Id': correlationId
    });

    structuredLogger.info('Analytics batch processed', {
      orgId,
      batchId: batch.batchId,
      totalEvents: batch.events.length,
      processedCount: processedEvents.length,
      errorCount: errors.length,
      correlationId
    });

    res.status(201).json({
      success: true,
      data: {
        batchId: batch.batchId,
        totalEvents: batch.events.length,
        processedEvents: processedEvents.length,
        errors: errors.length,
        eventIds: processedEvents
      },
      errors: errors.length > 0 ? errors : undefined,
      message: `Processed ${processedEvents.length}/${batch.events.length} events`
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }

    structuredLogger.error('Failed to process analytics batch', error as Error, {
      orgId: req.headers['x-org-id'],
      body: req.body
    });

    res.status(500).json({
      success: false,
      error: 'Failed to process batch',
      message: (error as Error).message
    });
  }
});

// GET /v1/analytics/events - Query events
router.get('/events', async (req, res) => {
  try {
    const orgId = req.headers['x-org-id'] as string || 'org-demo';
    const correlationId = req.headers['x-correlation-id'] as string || randomUUID();

    // Parse query parameters
    const query = AnalyticsQuerySchema.parse({
      ...req.query,
      orgId
    });

    // Get events for organization
    let events = getEventsForOrg(orgId);

    // Apply filters
    if (query.eventTypes && query.eventTypes.length > 0) {
      events = events.filter(event => query.eventTypes!.includes(event.eventType));
    }

    if (query.startDate) {
      const startDate = new Date(query.startDate);
      events = events.filter(event => new Date(event.timestamp) >= startDate);
    }

    if (query.endDate) {
      const endDate = new Date(query.endDate);
      events = events.filter(event => new Date(event.timestamp) <= endDate);
    }

    if (query.userId) {
      events = events.filter(event => event.userId === query.userId);
    }

    if (query.source) {
      events = events.filter(event => event.source === query.source);
    }

    // Sort by timestamp (most recent first)
    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Apply pagination
    const total = events.length;
    const paginatedEvents = events.slice(query.offset, query.offset + query.limit);

    // Add FinOps headers
    const costEur = 0.002;
    res.set({
      'X-Est-Cost-EUR': costEur.toFixed(4),
      'X-Budget-Pct': '0.3',
      'X-Latency-ms': '85',
      'X-Route': 'local',
      'X-Correlation-Id': correlationId
    });

    const response = {
      success: true,
      data: paginatedEvents,
      pagination: {
        limit: query.limit,
        offset: query.offset,
        total,
        hasMore: query.offset + query.limit < total
      },
      query,
      executionTime: 85 // milliseconds
    };

    structuredLogger.info('Analytics events queried', {
      orgId,
      query,
      resultCount: paginatedEvents.length,
      total,
      correlationId
    });

    res.json(response);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        details: error.errors
      });
    }

    structuredLogger.error('Failed to query analytics events', error as Error, {
      orgId: req.headers['x-org-id'],
      query: req.query
    });

    res.status(500).json({
      success: false,
      error: 'Failed to query events',
      message: (error as Error).message
    });
  }
});

// GET /v1/analytics/metrics - Get aggregated metrics
router.get('/metrics', async (req, res) => {
  try {
    const orgId = req.headers['x-org-id'] as string || 'org-demo';
    const correlationId = req.headers['x-correlation-id'] as string || randomUUID();

    // Get events for organization
    const events = getEventsForOrg(orgId);

    // Calculate basic metrics
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const eventsLast24h = events.filter(e => new Date(e.timestamp) >= last24h);
    const eventsLast7d = events.filter(e => new Date(e.timestamp) >= last7d);

    // Count by event type
    const eventTypeCount = events.reduce((acc, event) => {
      acc[event.eventType] = (acc[event.eventType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Count by source
    const sourceCount = events.reduce((acc, event) => {
      acc[event.source] = (acc[event.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const metrics = {
      totalEvents: events.length,
      eventsLast24h: eventsLast24h.length,
      eventsLast7d: eventsLast7d.length,
      eventsByType: eventTypeCount,
      eventsBySource: sourceCount,
      avgEventsPerDay: Math.round(eventsLast7d.length / 7),
      timestamp: new Date().toISOString()
    };

    // Add FinOps headers
    const costEur = 0.003;
    res.set({
      'X-Est-Cost-EUR': costEur.toFixed(4),
      'X-Budget-Pct': '0.4',
      'X-Latency-ms': '120',
      'X-Route': 'local',
      'X-Correlation-Id': correlationId
    });

    structuredLogger.info('Analytics metrics calculated', {
      orgId,
      totalEvents: metrics.totalEvents,
      eventsLast24h: metrics.eventsLast24h,
      correlationId
    });

    res.json({
      success: true,
      data: metrics
    });

  } catch (error) {
    structuredLogger.error('Failed to calculate analytics metrics', error as Error, {
      orgId: req.headers['x-org-id']
    });

    res.status(500).json({
      success: false,
      error: 'Failed to calculate metrics',
      message: (error as Error).message
    });
  }
});

// DELETE /v1/analytics/events - Clear events (for testing)
router.delete('/events', async (req, res) => {
  try {
    const orgId = req.headers['x-org-id'] as string || 'org-demo';
    
    // Clear events for organization
    const eventIds = eventsByOrg.get(orgId);
    if (eventIds) {
      for (const eventId of eventIds) {
        // Find and remove events
        for (const [key, event] of analyticsStore.entries()) {
          if (event.orgId === orgId) {
            analyticsStore.delete(key);
          }
        }
      }
      eventsByOrg.delete(orgId);
    }

    structuredLogger.info('Analytics events cleared', {
      orgId,
      clearedCount: eventIds?.size || 0
    });

    res.json({
      success: true,
      message: `Cleared events for organization ${orgId}`,
      clearedCount: eventIds?.size || 0
    });

  } catch (error) {
    structuredLogger.error('Failed to clear analytics events', error as Error, {
      orgId: req.headers['x-org-id']
    });

    res.status(500).json({
      success: false,
      error: 'Failed to clear events',
      message: (error as Error).message
    });
  }
});

export { router as analyticsRouter };