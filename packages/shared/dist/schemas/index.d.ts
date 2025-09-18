export * from './common.js';
export * from './auth.js';
export * from './erp.js';
export { Company as CRMCompany, Contact as CRMContact, Deal as CRMDeal, CreateCompany as CRMCreateCompany, CreateContact as CRMCreateContact, CreateDeal as CRMCreateDeal, UpdateCompany as CRMUpdateCompany, UpdateContact as CRMUpdateContact, UpdateDeal as CRMUpdateDeal, } from './crm.js';
export { Company as FinanceCompany, Contact as FinanceContact, Deal as FinanceDeal, CreateCompany as FinanceCreateCompany, CreateContact as FinanceCreateContact, CreateDeal as FinanceCreateDeal, UpdateCompany as FinanceUpdateCompany, UpdateContact as FinanceUpdateContact, UpdateDeal as FinanceUpdateDeal, } from './finance.js';
import { z } from 'zod';
export declare const OrgIdSchema: z.ZodString;
export declare const RequestIdSchema: z.ZodString;
export declare const TraceParentSchema: z.ZodString;
export declare const BaseHeadersSchema: z.ZodObject<{
    'x-org-id': z.ZodString;
    authorization: z.ZodString;
    'x-request-id': z.ZodString;
    traceparent: z.ZodString;
    'x-idempotency-key': z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    'x-request-id'?: string;
    authorization?: string;
    'x-org-id'?: string;
    traceparent?: string;
    'x-idempotency-key'?: string;
}, {
    'x-request-id'?: string;
    authorization?: string;
    'x-org-id'?: string;
    traceparent?: string;
    'x-idempotency-key'?: string;
}>;
export declare const LegacyOrganizationSchema: z.ZodObject<{
    org_id: z.ZodString;
    name: z.ZodString;
    api_key_hash: z.ZodString;
    enabled: z.ZodBoolean;
    created_at: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    name?: string;
    enabled?: boolean;
    org_id?: string;
    api_key_hash?: string;
    created_at?: Date;
}, {
    name?: string;
    enabled?: boolean;
    org_id?: string;
    api_key_hash?: string;
    created_at?: Date;
}>;
export declare const CreateOrgSchema: z.ZodObject<{
    name: z.ZodString;
    api_key: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name?: string;
    api_key?: string;
}, {
    name?: string;
    api_key?: string;
}>;
export declare const CustomerSchema: z.ZodObject<{
    id: z.ZodString;
    org_id: z.ZodString;
    email: z.ZodString;
    name: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
    created_at: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id?: string;
    name?: string;
    email?: string;
    phone?: string;
    org_id?: string;
    created_at?: Date;
}, {
    id?: string;
    name?: string;
    email?: string;
    phone?: string;
    org_id?: string;
    created_at?: Date;
}>;
export declare const CreateCustomerSchema: z.ZodObject<{
    email: z.ZodString;
    name: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name?: string;
    email?: string;
    phone?: string;
}, {
    name?: string;
    email?: string;
    phone?: string;
}>;
export declare const LegacyInvoiceStatusSchema: z.ZodEnum<["draft", "sent", "paid", "overdue", "cancelled"]>;
export declare const LegacyInvoiceSchema: z.ZodObject<{
    id: z.ZodString;
    org_id: z.ZodString;
    customer_id: z.ZodString;
    amount: z.ZodNumber;
    due_date: z.ZodDate;
    status: z.ZodEnum<["draft", "sent", "paid", "overdue", "cancelled"]>;
    created_at: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    status?: "cancelled" | "draft" | "sent" | "paid" | "overdue";
    id?: string;
    amount?: number;
    org_id?: string;
    created_at?: Date;
    customer_id?: string;
    due_date?: Date;
}, {
    status?: "cancelled" | "draft" | "sent" | "paid" | "overdue";
    id?: string;
    amount?: number;
    org_id?: string;
    created_at?: Date;
    customer_id?: string;
    due_date?: Date;
}>;
export declare const LegacyCreateInvoiceSchema: z.ZodObject<{
    customer_id: z.ZodString;
    amount: z.ZodNumber;
    due_date: z.ZodPipeline<z.ZodString, z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    amount?: number;
    customer_id?: string;
    due_date?: Date;
}, {
    amount?: number;
    customer_id?: string;
    due_date?: string;
}>;
export declare const AITaskTypeSchema: z.ZodEnum<["draft_email", "analyze_invoice", "summarize", "classify"]>;
export declare const AISensitivitySchema: z.ZodEnum<["public", "internal", "confidential", "pii"]>;
export declare const AIRequestSchema: z.ZodObject<{
    taskType: z.ZodEnum<["draft_email", "analyze_invoice", "summarize", "classify"]>;
    sensitivity: z.ZodEnum<["public", "internal", "confidential", "pii"]>;
    tokens_est: z.ZodNumber;
    languages: z.ZodArray<z.ZodString, "many">;
    tools_needed: z.ZodArray<z.ZodString, "many">;
    budget_cents: z.ZodNumber;
    org_id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    languages?: string[];
    sensitivity?: "pii" | "confidential" | "public" | "internal";
    org_id?: string;
    taskType?: "draft_email" | "analyze_invoice" | "summarize" | "classify";
    tokens_est?: number;
    tools_needed?: string[];
    budget_cents?: number;
}, {
    languages?: string[];
    sensitivity?: "pii" | "confidential" | "public" | "internal";
    org_id?: string;
    taskType?: "draft_email" | "analyze_invoice" | "summarize" | "classify";
    tokens_est?: number;
    tools_needed?: string[];
    budget_cents?: number;
}>;
export declare const FlowTypeSchema: z.ZodEnum<["cobro_proactivo", "follow_up", "reminder"]>;
export declare const FlowStatusSchema: z.ZodEnum<["pending", "running", "completed", "failed", "cancelled"]>;
export declare const FlowExecutionSchema: z.ZodObject<{
    id: z.ZodString;
    org_id: z.ZodString;
    flow_type: z.ZodEnum<["cobro_proactivo", "follow_up", "reminder"]>;
    status: z.ZodEnum<["pending", "running", "completed", "failed", "cancelled"]>;
    input_data: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    steps_completed: z.ZodArray<z.ZodString, "many">;
    created_at: z.ZodDate;
    updated_at: z.ZodDate;
    corr_id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    status?: "failed" | "pending" | "completed" | "cancelled" | "running";
    id?: string;
    flow_type?: "cobro_proactivo" | "follow_up" | "reminder";
    org_id?: string;
    created_at?: Date;
    input_data?: Record<string, unknown>;
    steps_completed?: string[];
    updated_at?: Date;
    corr_id?: string;
}, {
    status?: "failed" | "pending" | "completed" | "cancelled" | "running";
    id?: string;
    flow_type?: "cobro_proactivo" | "follow_up" | "reminder";
    org_id?: string;
    created_at?: Date;
    input_data?: Record<string, unknown>;
    steps_completed?: string[];
    updated_at?: Date;
    corr_id?: string;
}>;
export declare const StartFlowSchema: z.ZodObject<{
    flow_type: z.ZodEnum<["cobro_proactivo", "follow_up", "reminder"]>;
    input_data: z.ZodRecord<z.ZodString, z.ZodUnknown>;
}, "strip", z.ZodTypeAny, {
    flow_type?: "cobro_proactivo" | "follow_up" | "reminder";
    input_data?: Record<string, unknown>;
}, {
    flow_type?: "cobro_proactivo" | "follow_up" | "reminder";
    input_data?: Record<string, unknown>;
}>;
export declare const WebhookSourceSchema: z.ZodEnum<["make", "zapier", "outlook", "teams"]>;
export declare const WebhookPayloadSchema: z.ZodObject<{
    source: z.ZodEnum<["make", "zapier", "outlook", "teams"]>;
    event_type: z.ZodString;
    timestamp: z.ZodNumber;
    signature: z.ZodString;
    data: z.ZodRecord<z.ZodString, z.ZodUnknown>;
}, "strip", z.ZodTypeAny, {
    timestamp?: number;
    data?: Record<string, unknown>;
    signature?: string;
    source?: "teams" | "make" | "zapier" | "outlook";
    event_type?: string;
}, {
    timestamp?: number;
    data?: Record<string, unknown>;
    signature?: string;
    source?: "teams" | "make" | "zapier" | "outlook";
    event_type?: string;
}>;
export declare const ChannelTypeSchema: z.ZodEnum<["email", "whatsapp", "teams"]>;
export declare const SendMessageSchema: z.ZodObject<{
    channel: z.ZodEnum<["email", "whatsapp", "teams"]>;
    recipient: z.ZodString;
    message: z.ZodString;
    template_id: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    message?: string;
    metadata?: Record<string, unknown>;
    channel?: "email" | "teams" | "whatsapp";
    recipient?: string;
    template_id?: string;
}, {
    message?: string;
    metadata?: Record<string, unknown>;
    channel?: "email" | "teams" | "whatsapp";
    recipient?: string;
    template_id?: string;
}>;
export declare const OrgLimitsSchema: z.ZodObject<{
    org_id: z.ZodString;
    rps_limit: z.ZodNumber;
    burst: z.ZodNumber;
    monthly_cost_cap_eur: z.ZodNumber;
    max_parallel_jobs: z.ZodNumber;
    storage_quota_gb: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    org_id?: string;
    rps_limit?: number;
    burst?: number;
    monthly_cost_cap_eur?: number;
    max_parallel_jobs?: number;
    storage_quota_gb?: number;
}, {
    org_id?: string;
    rps_limit?: number;
    burst?: number;
    monthly_cost_cap_eur?: number;
    max_parallel_jobs?: number;
    storage_quota_gb?: number;
}>;
export declare const UpdateOrgLimitsSchema: z.ZodObject<{
    rps_limit: z.ZodOptional<z.ZodNumber>;
    burst: z.ZodOptional<z.ZodNumber>;
    monthly_cost_cap_eur: z.ZodOptional<z.ZodNumber>;
    max_parallel_jobs: z.ZodOptional<z.ZodNumber>;
    storage_quota_gb: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    rps_limit?: number;
    burst?: number;
    monthly_cost_cap_eur?: number;
    max_parallel_jobs?: number;
    storage_quota_gb?: number;
}, {
    rps_limit?: number;
    burst?: number;
    monthly_cost_cap_eur?: number;
    max_parallel_jobs?: number;
    storage_quota_gb?: number;
}>;
export declare const FeatureFlagSchema: z.ZodObject<{
    org_id: z.ZodString;
    flag: z.ZodString;
    enabled: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    enabled?: boolean;
    org_id?: string;
    flag?: string;
}, {
    enabled?: boolean;
    org_id?: string;
    flag?: string;
}>;
export declare const MetricsQuerySchema: z.ZodObject<{
    org_id: z.ZodOptional<z.ZodString>;
    start_time: z.ZodOptional<z.ZodPipeline<z.ZodString, z.ZodDate>>;
    end_time: z.ZodOptional<z.ZodPipeline<z.ZodString, z.ZodDate>>;
    granularity: z.ZodDefault<z.ZodEnum<["hour", "day", "week"]>>;
}, "strip", z.ZodTypeAny, {
    org_id?: string;
    start_time?: Date;
    end_time?: Date;
    granularity?: "hour" | "day" | "week";
}, {
    org_id?: string;
    start_time?: string;
    end_time?: string;
    granularity?: "hour" | "day" | "week";
}>;
export type BaseHeaders = z.infer<typeof BaseHeadersSchema>;
export type CreateOrg = z.infer<typeof CreateOrgSchema>;
export type CreateCustomer = z.infer<typeof CreateCustomerSchema>;
export type AIRequestInput = z.infer<typeof AIRequestSchema>;
export type StartFlow = z.infer<typeof StartFlowSchema>;
export type SendMessage = z.infer<typeof SendMessageSchema>;
export type UpdateOrgLimits = z.infer<typeof UpdateOrgLimitsSchema>;
export type MetricsQuery = z.infer<typeof MetricsQuerySchema>;
//# sourceMappingURL=index.d.ts.map