import { z } from 'zod';

// Event types for analytics
export const AnalyticsEventType = z.enum([
  'user_login',
  'user_logout',
  'user_action',
  'page_view',
  'button_click',
  'company_created',
  'company_updated',
  'contact_created',
  'contact_updated',
  'deal_created',
  'deal_updated',
  'deal_stage_changed',
  'agent_started',
  'agent_completed',
  'agent_failed',
  'agent_cancelled',
  'api_request',
  'error_occurred',
  'performance_metric',
  'system_event'
]);

// Analytics event schema
export const AnalyticsEventSchema = z.object({
  eventType: AnalyticsEventType,
  timestamp: z.string().datetime(),
  orgId: z.string(),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  correlationId: z.string().optional(),
  source: z.string().default('api'),

  // Event-specific data
  action: z.string().optional(),
  entity: z.string().optional(),
  entityId: z.string().optional(),
  metadata: z.record(z.any()).optional(),

  // Performance data
  duration: z.number().optional(),
  responseTime: z.number().optional(),

  // Error data
  error: z.string().optional(),
  errorCode: z.string().optional(),
  stackTrace: z.string().optional()
});

// Batch of events
export const AnalyticsEventBatchSchema = z.object({
  batchId: z.string(),
  timestamp: z.string().datetime(),
  events: z.array(AnalyticsEventSchema)
});

// Query schema
export const AnalyticsQuerySchema = z.object({
  orgId: z.string(),
  eventTypes: z.array(AnalyticsEventType).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  userId: z.string().optional(),
  source: z.string().optional(),
  limit: z.number().min(1).max(1000).default(100),
  offset: z.number().min(0).default(0)
});

// Query response schema
export const AnalyticsQueryResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(AnalyticsEventSchema),
  pagination: z.object({
    limit: z.number(),
    offset: z.number(),
    total: z.number(),
    hasMore: z.boolean()
  }),
  query: AnalyticsQuerySchema,
  executionTime: z.number()
});

// Types
export type AnalyticsEvent = z.infer<typeof AnalyticsEventSchema>;
export type AnalyticsEventBatch = z.infer<typeof AnalyticsEventBatchSchema>;
export type AnalyticsQuery = z.infer<typeof AnalyticsQuerySchema>;
export type AnalyticsQueryResponse = z.infer<typeof AnalyticsQueryResponseSchema>;
