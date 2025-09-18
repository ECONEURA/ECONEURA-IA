import { z } from 'zod';
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
    'cost_threshold_reached',
    'budget_warning',
    'invoice_sent',
    'payment_received',
    'dunning_sent',
    'integration_sync'
]);
export const BaseAnalyticsEventSchema = z.object({
    eventType: AnalyticsEventType,
    timestamp: z.string().datetime(),
    orgId: z.string().uuid(),
    userId: z.string().uuid().optional(),
    sessionId: z.string().optional(),
    correlationId: z.string().uuid().optional(),
    source: z.string().default('api'),
    version: z.string().default('1.0.0'),
    environment: z.string().default('production'),
    metadata: z.record(z.unknown()).optional(),
});
export const UserActionEventSchema = BaseAnalyticsEventSchema.extend({
    eventType: z.literal('user_action'),
    action: z.string(),
    resource: z.string().optional(),
    resourceId: z.string().uuid().optional(),
    duration: z.number().optional(),
    success: z.boolean().default(true),
    errorMessage: z.string().optional(),
});
export const AgentEventSchema = BaseAnalyticsEventSchema.extend({
    eventType: z.enum(['agent_started', 'agent_completed', 'agent_failed', 'agent_cancelled']),
    agentId: z.string(),
    agentCategory: z.enum(['ventas', 'marketing', 'operaciones', 'finanzas', 'soporte_qa']),
    executionId: z.string().uuid(),
    duration: z.number().optional(),
    costEur: z.number().min(0).optional(),
    inputTokens: z.number().optional(),
    outputTokens: z.number().optional(),
    provider: z.string().optional(),
    errorMessage: z.string().optional(),
});
export const ApiRequestEventSchema = BaseAnalyticsEventSchema.extend({
    eventType: z.literal('api_request'),
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']),
    path: z.string(),
    statusCode: z.number().int().min(100).max(599),
    duration: z.number().min(0),
    requestSize: z.number().optional(),
    responseSize: z.number().optional(),
    userAgent: z.string().optional(),
    ip: z.string().optional(),
    referer: z.string().optional(),
});
export const PerformanceEventSchema = BaseAnalyticsEventSchema.extend({
    eventType: z.literal('performance_metric'),
    metricName: z.string(),
    metricValue: z.number(),
    metricUnit: z.string().optional(),
    tags: z.record(z.string()).optional(),
});
export const CostEventSchema = BaseAnalyticsEventSchema.extend({
    eventType: z.enum(['cost_threshold_reached', 'budget_warning']),
    currentCost: z.number().min(0),
    budgetLimit: z.number().min(0),
    utilizationPct: z.number().min(0).max(100),
    period: z.enum(['daily', 'weekly', 'monthly']),
    thresholdType: z.enum(['warning', 'critical', 'exceeded']),
});
export const BusinessEventSchema = BaseAnalyticsEventSchema.extend({
    eventType: z.enum(['invoice_sent', 'payment_received', 'dunning_sent', 'integration_sync']),
    entityType: z.string().optional(),
    entityId: z.string().uuid().optional(),
    amount: z.number().optional(),
    currency: z.string().length(3).optional(),
    integration: z.string().optional(),
});
export const AnalyticsEventSchema = z.discriminatedUnion('eventType', [
    UserActionEventSchema,
    AgentEventSchema,
    ApiRequestEventSchema,
    PerformanceEventSchema,
    CostEventSchema,
    BusinessEventSchema,
    BaseAnalyticsEventSchema,
]);
export const AnalyticsEventBatchSchema = z.object({
    events: z.array(AnalyticsEventSchema).min(1).max(100),
    batchId: z.string().uuid().optional(),
    timestamp: z.string().datetime().optional(),
});
export const AnalyticsQuerySchema = z.object({
    eventTypes: z.array(AnalyticsEventType).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    orgId: z.string().uuid().optional(),
    userId: z.string().uuid().optional(),
    source: z.string().optional(),
    limit: z.number().int().min(1).max(1000).default(100),
    offset: z.number().int().min(0).default(0),
    groupBy: z.enum(['hour', 'day', 'week', 'month']).optional(),
    aggregation: z.enum(['count', 'sum', 'avg', 'min', 'max']).optional(),
    metricField: z.string().optional(),
});
export const AnalyticsMetricSchema = z.object({
    name: z.string(),
    value: z.number(),
    unit: z.string().optional(),
    timestamp: z.string().datetime(),
    tags: z.record(z.string()).optional(),
});
export const AnalyticsAggregationSchema = z.object({
    period: z.string(),
    count: z.number().int().min(0),
    sum: z.number().optional(),
    avg: z.number().optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    events: z.array(AnalyticsEventSchema).optional(),
});
export const AnalyticsQueryResponseSchema = z.object({
    success: z.boolean(),
    data: z.array(z.union([AnalyticsEventSchema, AnalyticsAggregationSchema])),
    pagination: z.object({
        limit: z.number().int(),
        offset: z.number().int(),
        total: z.number().int(),
        hasMore: z.boolean(),
    }),
    query: AnalyticsQuerySchema,
    executionTime: z.number().optional(),
});
//# sourceMappingURL=analytics.js.map