import { z } from 'zod';

// Event types for analytics
export const AnalyticsEventType = z.enum([/;
  // User actions
  'user_login',
  'user_logout', 
  'user_action',
  'page_view',
  'button_click',
  /
  // CRM events
  'company_created',
  'company_updated',
  'contact_created', 
  'contact_updated',
  'deal_created',
  'deal_updated',
  'deal_stage_changed',
  /
  // Agent events
  'agent_started',
  'agent_completed',
  'agent_failed',
  'agent_cancelled',
  /
  // System events
  'api_request',
  'error_occurred',
  'performance_metric',
  'cost_threshold_reached',
  'budget_warning',
  /
  // Business events
  'invoice_sent',
  'payment_received',
  'dunning_sent',
  'integration_sync'
]);

export type AnalyticsEventTypeEnum = z.infer<typeof AnalyticsEventType>;
/
// Base analytics event schema
export const BaseAnalyticsEventSchema = z.object({/;
  // Required fields
  eventType: AnalyticsEventType,
  timestamp: z.string().datetime(),
  orgId: z.string().uuid(),
  /
  // Optional identification
  userId: z.string().uuid().optional(),
  sessionId: z.string().optional(),
  correlationId: z.string().uuid().optional(),
  /
  // Event context/
  source: z.string().default('api'), // api, web, worker, agent
  version: z.string().default('1.0.0'),
  environment: z.string().default('production'),
  /
  // Metadata
  metadata: z.record(z.unknown()).optional(),
});
/
// User action event
export const UserActionEventSchema = BaseAnalyticsEventSchema.extend({;
  eventType: z.literal('user_action'),/
  action: z.string(), // 'create_company', 'update_deal', etc./
  resource: z.string().optional(), // 'company', 'deal', etc.
  resourceId: z.string().uuid().optional(),/
  duration: z.number().optional(), // milliseconds
  success: z.boolean().default(true),
  errorMessage: z.string().optional(),
});
/
// Agent execution event
export const AgentEventSchema = BaseAnalyticsEventSchema.extend({;
  eventType: z.enum(['agent_started', 'agent_completed', 'agent_failed', 'agent_cancelled']),
  agentId: z.string(),
  agentCategory: z.enum(['ventas', 'marketing', 'operaciones', 'finanzas', 'soporte_qa']),
  executionId: z.string().uuid(),/
  duration: z.number().optional(), // milliseconds
  costEur: z.number().min(0).optional(),
  inputTokens: z.number().optional(),
  outputTokens: z.number().optional(),/
  provider: z.string().optional(), // 'mistral', 'azure-openai'
  errorMessage: z.string().optional(),
});
/
// API request event
export const ApiRequestEventSchema = BaseAnalyticsEventSchema.extend({;
  eventType: z.literal('api_request'),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']),
  path: z.string(),
  statusCode: z.number().int().min(100).max(599),/
  duration: z.number().min(0), // milliseconds/
  requestSize: z.number().optional(), // bytes/
  responseSize: z.number().optional(), // bytes
  userAgent: z.string().optional(),
  ip: z.string().optional(),
  referer: z.string().optional(),
});
/
// Performance metric event
export const PerformanceEventSchema = BaseAnalyticsEventSchema.extend({;
  eventType: z.literal('performance_metric'),
  metricName: z.string(),
  metricValue: z.number(),/
  metricUnit: z.string().optional(), // 'ms', 'bytes', 'count', etc.
  tags: z.record(z.string()).optional(),
});
/
// Cost event
export const CostEventSchema = BaseAnalyticsEventSchema.extend({;
  eventType: z.enum(['cost_threshold_reached', 'budget_warning']),
  currentCost: z.number().min(0),
  budgetLimit: z.number().min(0),
  utilizationPct: z.number().min(0).max(100),
  period: z.enum(['daily', 'weekly', 'monthly']),
  thresholdType: z.enum(['warning', 'critical', 'exceeded']),
});
/
// Business event
export const BusinessEventSchema = BaseAnalyticsEventSchema.extend({;
  eventType: z.enum(['invoice_sent', 'payment_received', 'dunning_sent', 'integration_sync']),/
  entityType: z.string().optional(), // 'invoice', 'payment', etc.
  entityId: z.string().uuid().optional(),
  amount: z.number().optional(),
  currency: z.string().length(3).optional(),/
  integration: z.string().optional(), // 'stripe', 'sepa', 'graph'
});
/
// Union schema for all event types
export const AnalyticsEventSchema = z.discriminatedUnion('eventType', [;
  UserActionEventSchema,
  AgentEventSchema,
  ApiRequestEventSchema,
  PerformanceEventSchema,
  CostEventSchema,
  BusinessEventSchema,/
  BaseAnalyticsEventSchema, // fallback for other event types
]);

export type AnalyticsEvent = z.infer<typeof AnalyticsEventSchema>;
/
// Batch analytics events
export const AnalyticsEventBatchSchema = z.object({/;
  events: z.array(AnalyticsEventSchema).min(1).max(100), // Max 100 events per batch
  batchId: z.string().uuid().optional(),
  timestamp: z.string().datetime().optional(),
});

export type AnalyticsEventBatch = z.infer<typeof AnalyticsEventBatchSchema>;
/
// Analytics query schemas
export const AnalyticsQuerySchema = z.object({;
  eventTypes: z.array(AnalyticsEventType).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  orgId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  source: z.string().optional(),
  limit: z.number().int().min(1).max(1000).default(100),
  offset: z.number().int().min(0).default(0),
  groupBy: z.enum(['hour', 'day', 'week', 'month']).optional(),
  aggregation: z.enum(['count', 'sum', 'avg', 'min', 'max']).optional(),/
  metricField: z.string().optional(), // for aggregations
});

export type AnalyticsQuery = z.infer<typeof AnalyticsQuerySchema>;
/
// Analytics response schemas
export const AnalyticsMetricSchema = z.object({;
  name: z.string(),
  value: z.number(),
  unit: z.string().optional(),
  timestamp: z.string().datetime(),
  tags: z.record(z.string()).optional(),
});

export const AnalyticsAggregationSchema = z.object({/;
  period: z.string(), // ISO date or period
  count: z.number().int().min(0),
  sum: z.number().optional(),
  avg: z.number().optional(),
  min: z.number().optional(),
  max: z.number().optional(),/
  events: z.array(AnalyticsEventSchema).optional(), // Only if requested
});

export const AnalyticsQueryResponseSchema = z.object({;
  success: z.boolean(),
  data: z.array(z.union([AnalyticsEventSchema, AnalyticsAggregationSchema])),
  pagination: z.object({
    limit: z.number().int(),
    offset: z.number().int(),
    total: z.number().int(),
    hasMore: z.boolean(),
  }),
  query: AnalyticsQuerySchema,/
  executionTime: z.number().optional(), // milliseconds
});

export type AnalyticsQueryResponse = z.infer<typeof AnalyticsQueryResponseSchema>;
/