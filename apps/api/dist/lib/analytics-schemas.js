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
    'system_event'
]);
export const AnalyticsEventSchema = z.object({
    eventType: AnalyticsEventType,
    timestamp: z.string().datetime(),
    orgId: z.string(),
    userId: z.string().optional(),
    sessionId: z.string().optional(),
    correlationId: z.string().optional(),
    source: z.string().default('api'),
    action: z.string().optional(),
    entity: z.string().optional(),
    entityId: z.string().optional(),
    metadata: z.record(z.any()).optional(),
    duration: z.number().optional(),
    responseTime: z.number().optional(),
    error: z.string().optional(),
    errorCode: z.string().optional(),
    stackTrace: z.string().optional()
});
export const AnalyticsEventBatchSchema = z.object({
    batchId: z.string(),
    timestamp: z.string().datetime(),
    events: z.array(AnalyticsEventSchema)
});
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
//# sourceMappingURL=analytics-schemas.js.map