export * from './common.js';
export * from './auth.js';
export * from './erp.js';
import { z } from 'zod';
export const OrgIdSchema = z.string().regex(/^[a-zA-Z0-9\-_]+$/, 'Invalid org_id format');
export const RequestIdSchema = z.string().uuid();
export const TraceParentSchema = z.string().regex(/^00-[a-f0-9]{32}-[a-f0-9]{16}-[0-9]{2}$/);
export const BaseHeadersSchema = z.object({
    'x-org-id': OrgIdSchema,
    authorization: z.string().startsWith('Bearer '),
    'x-request-id': RequestIdSchema,
    traceparent: TraceParentSchema,
    'x-idempotency-key': z.string().optional(),
});
export const LegacyOrganizationSchema = z.object({
    org_id: OrgIdSchema,
    name: z.string().min(1).max(255),
    api_key_hash: z.string(),
    enabled: z.boolean(),
    created_at: z.date(),
});
export const CreateOrgSchema = z.object({
    name: z.string().min(1).max(255),
    api_key: z.string().min(32),
});
export const CustomerSchema = z.object({
    id: z.string().uuid(),
    org_id: OrgIdSchema,
    email: z.string().email(),
    name: z.string().min(1).max(255),
    phone: z.string().optional(),
    created_at: z.date(),
});
export const CreateCustomerSchema = z.object({
    email: z.string().email(),
    name: z.string().min(1).max(255),
    phone: z.string().optional(),
});
export const LegacyInvoiceStatusSchema = z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']);
export const LegacyInvoiceSchema = z.object({
    id: z.string().uuid(),
    org_id: OrgIdSchema,
    customer_id: z.string().uuid(),
    amount: z.number().positive(),
    due_date: z.date(),
    status: LegacyInvoiceStatusSchema,
    created_at: z.date(),
});
export const LegacyCreateInvoiceSchema = z.object({
    customer_id: z.string().uuid(),
    amount: z.number().positive(),
    due_date: z.string().pipe(z.coerce.date()),
});
export const AITaskTypeSchema = z.enum(['draft_email', 'analyze_invoice', 'summarize', 'classify']);
export const AISensitivitySchema = z.enum(['public', 'internal', 'confidential', 'pii']);
export const AIRequestSchema = z.object({
    taskType: AITaskTypeSchema,
    sensitivity: AISensitivitySchema,
    tokens_est: z.number().positive(),
    languages: z.array(z.string()),
    tools_needed: z.array(z.string()),
    budget_cents: z.number().positive(),
    org_id: OrgIdSchema,
});
export const FlowTypeSchema = z.enum(['cobro_proactivo', 'follow_up', 'reminder']);
export const FlowStatusSchema = z.enum(['pending', 'running', 'completed', 'failed', 'cancelled']);
export const FlowExecutionSchema = z.object({
    id: z.string().uuid(),
    org_id: OrgIdSchema,
    flow_type: FlowTypeSchema,
    status: FlowStatusSchema,
    input_data: z.record(z.unknown()),
    steps_completed: z.array(z.string()),
    created_at: z.date(),
    updated_at: z.date(),
    corr_id: z.string().uuid(),
});
export const StartFlowSchema = z.object({
    flow_type: FlowTypeSchema,
    input_data: z.record(z.unknown()),
});
export const WebhookSourceSchema = z.enum(['make', 'zapier', 'outlook', 'teams']);
export const WebhookPayloadSchema = z.object({
    source: WebhookSourceSchema,
    event_type: z.string(),
    timestamp: z.number(),
    signature: z.string(),
    data: z.record(z.unknown()),
});
export const ChannelTypeSchema = z.enum(['email', 'whatsapp', 'teams']);
export const SendMessageSchema = z.object({
    channel: ChannelTypeSchema,
    recipient: z.string(),
    message: z.string(),
    template_id: z.string().optional(),
    metadata: z.record(z.unknown()).optional(),
});
export const OrgLimitsSchema = z.object({
    org_id: OrgIdSchema,
    rps_limit: z.number().positive(),
    burst: z.number().positive(),
    monthly_cost_cap_eur: z.number().positive(),
    max_parallel_jobs: z.number().positive(),
    storage_quota_gb: z.number().positive(),
});
export const UpdateOrgLimitsSchema = z.object({
    rps_limit: z.number().positive().optional(),
    burst: z.number().positive().optional(),
    monthly_cost_cap_eur: z.number().positive().optional(),
    max_parallel_jobs: z.number().positive().optional(),
    storage_quota_gb: z.number().positive().optional(),
});
export const FeatureFlagSchema = z.object({
    org_id: OrgIdSchema,
    flag: z.string(),
    enabled: z.boolean(),
});
export const MetricsQuerySchema = z.object({
    org_id: OrgIdSchema.optional(),
    start_time: z.string().pipe(z.coerce.date()).optional(),
    end_time: z.string().pipe(z.coerce.date()).optional(),
    granularity: z.enum(['hour', 'day', 'week']).default('day'),
});
//# sourceMappingURL=index.js.map