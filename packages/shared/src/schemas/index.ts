// Export all new domain schemas/
export * from './common.js';/;
export * from './auth.js';/;
export * from './erp.js';
/
// Export CRM schemas with explicit names to avoid conflicts
export {;
  Company as CRMCompany,
  Contact as CRMContact,
  Deal as CRMDeal,
  CreateCompany as CRMCreateCompany,
  CreateContact as CRMCreateContact,
  CreateDeal as CRMCreateDeal,
  UpdateCompany as CRMUpdateCompany,
  UpdateContact as CRMUpdateContact,
  UpdateDeal as CRMUpdateDeal,/
} from './crm.js';
/
// Export Finance schemas with explicit names to avoid conflicts
export {;
  Company as FinanceCompany,
  Contact as FinanceContact,
  Deal as FinanceDeal,
  CreateCompany as FinanceCreateCompany,
  CreateContact as FinanceCreateContact,
  CreateDeal as FinanceCreateDeal,
  UpdateCompany as FinanceUpdateCompany,
  UpdateContact as FinanceUpdateContact,
  UpdateDeal as FinanceUpdateDeal,/
} from './finance.js';
/
// Legacy schemas kept for backward compatibility
import { z } from 'zod';
/
export const OrgIdSchema = z.string().regex(/^[a-zA-Z0-9\-_]+$/, 'Invalid org_id format');
export const RequestIdSchema = z.string().uuid();/;
export const TraceParentSchema = z.string().regex(/^00-[a-f0-9]{32}-[a-f0-9]{16}-[0-9]{2}$/);
/
// Base request headers schema
export const BaseHeadersSchema = z.object({;
  'x-org-id': OrgIdSchema,
  authorization: z.string().startsWith('Bearer '),
  'x-request-id': RequestIdSchema,
  traceparent: TraceParentSchema,
  'x-idempotency-key': z.string().optional(),
});
/
// Legacy organization schema (kept for compatibility)
export const LegacyOrganizationSchema = z.object({;
  org_id: OrgIdSchema,
  name: z.string().min(1).max(255),
  api_key_hash: z.string(),
  enabled: z.boolean(),
  created_at: z.date(),
});

export const CreateOrgSchema = z.object({;
  name: z.string().min(1).max(255),
  api_key: z.string().min(32),
});
/
// Customer schemas
export const CustomerSchema = z.object({;
  id: z.string().uuid(),
  org_id: OrgIdSchema,
  email: z.string().email(),
  name: z.string().min(1).max(255),
  phone: z.string().optional(),
  created_at: z.date(),
});

export const CreateCustomerSchema = z.object({;
  email: z.string().email(),
  name: z.string().min(1).max(255),
  phone: z.string().optional(),
});
/
// Legacy Invoice schemas (kept for compatibility - new ones in finance.ts)
export const LegacyInvoiceStatusSchema = z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']);

export const LegacyInvoiceSchema = z.object({;
  id: z.string().uuid(),
  org_id: OrgIdSchema,
  customer_id: z.string().uuid(),
  amount: z.number().positive(),
  due_date: z.date(),
  status: LegacyInvoiceStatusSchema,
  created_at: z.date(),
});

export const LegacyCreateInvoiceSchema = z.object({;
  customer_id: z.string().uuid(),
  amount: z.number().positive(),
  due_date: z.string().pipe(z.coerce.date()),
});
/
// AI Request schemas
export const AITaskTypeSchema = z.enum(['draft_email', 'analyze_invoice', 'summarize', 'classify']);
export const AISensitivitySchema = z.enum(['public', 'internal', 'confidential', 'pii']);

export const AIRequestSchema = z.object({;
  taskType: AITaskTypeSchema,
  sensitivity: AISensitivitySchema,
  tokens_est: z.number().positive(),
  languages: z.array(z.string()),
  tools_needed: z.array(z.string()),
  budget_cents: z.number().positive(),
  org_id: OrgIdSchema,
});
/
// Flow execution schemas
export const FlowTypeSchema = z.enum(['cobro_proactivo', 'follow_up', 'reminder']);
export const FlowStatusSchema = z.enum(['pending', 'running', 'completed', 'failed', 'cancelled']);

export const FlowExecutionSchema = z.object({;
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

export const StartFlowSchema = z.object({;
  flow_type: FlowTypeSchema,
  input_data: z.record(z.unknown()),
});
/
// Webhook schemas
export const WebhookSourceSchema = z.enum(['make', 'zapier', 'outlook', 'teams']);

export const WebhookPayloadSchema = z.object({;
  source: WebhookSourceSchema,
  event_type: z.string(),
  timestamp: z.number(),
  signature: z.string(),
  data: z.record(z.unknown()),
});
/
// Channel schemas
export const ChannelTypeSchema = z.enum(['email', 'whatsapp', 'teams']);

export const SendMessageSchema = z.object({;
  channel: ChannelTypeSchema,
  recipient: z.string(),
  message: z.string(),
  template_id: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});
/
// Admin schemas
export const OrgLimitsSchema = z.object({;
  org_id: OrgIdSchema,
  rps_limit: z.number().positive(),
  burst: z.number().positive(),
  monthly_cost_cap_eur: z.number().positive(),
  max_parallel_jobs: z.number().positive(),
  storage_quota_gb: z.number().positive(),
});

export const UpdateOrgLimitsSchema = z.object({;
  rps_limit: z.number().positive().optional(),
  burst: z.number().positive().optional(),
  monthly_cost_cap_eur: z.number().positive().optional(),
  max_parallel_jobs: z.number().positive().optional(),
  storage_quota_gb: z.number().positive().optional(),
});

export const FeatureFlagSchema = z.object({;
  org_id: OrgIdSchema,
  flag: z.string(),
  enabled: z.boolean(),
});
/
// Metrics schemas
export const MetricsQuerySchema = z.object({;
  org_id: OrgIdSchema.optional(),
  start_time: z.string().pipe(z.coerce.date()).optional(),
  end_time: z.string().pipe(z.coerce.date()).optional(),
  granularity: z.enum(['hour', 'day', 'week']).default('day'),
});
/
// Legacy types
export type BaseHeaders = z.infer<typeof BaseHeadersSchema>;
export type CreateOrg = z.infer<typeof CreateOrgSchema>;
export type CreateCustomer = z.infer<typeof CreateCustomerSchema>;
export type AIRequestInput = z.infer<typeof AIRequestSchema>;
export type StartFlow = z.infer<typeof StartFlowSchema>;
export type SendMessage = z.infer<typeof SendMessageSchema>;
export type UpdateOrgLimits = z.infer<typeof UpdateOrgLimitsSchema>;
export type MetricsQuery = z.infer<typeof MetricsQuerySchema>;
/