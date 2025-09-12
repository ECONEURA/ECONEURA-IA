// Types (legacy)
export * as LegacyTypes from './types/index';

// Schemas - Export all new schemas
export * from './schemas/common';
export * from './schemas/auth';
export * from './schemas/erp';

// Export CRM schemas with explicit names to avoid conflicts
export {
  Company as CRMCompany,
  Contact as CRMContact,
  Deal as CRMDeal,
  CreateCompany as CRMCreateCompany,
  CreateContact as CRMCreateContact,
  CreateDeal as CRMCreateDeal,
  UpdateCompany as CRMUpdateCompany,
  UpdateContact as CRMUpdateContact,
  UpdateDeal as CRMUpdateDeal,
} from './schemas/crm';

// Export Finance schemas with explicit names to avoid conflicts
export {
  Company as FinanceCompany,
  Contact as FinanceContact,
  Deal as FinanceDeal,
  CreateCompany as FinanceCreateCompany,
  CreateContact as FinanceCreateContact,
  CreateDeal as FinanceCreateDeal,
  UpdateCompany as FinanceUpdateCompany,
  UpdateContact as FinanceUpdateContact,
  UpdateDeal as FinanceUpdateDeal,
} from './schemas/finance';

// Re-export legacy schemas from index for backward compatibility
export {
  OrgIdSchema,
  RequestIdSchema,
  TraceParentSchema,
  BaseHeadersSchema,
  CreateOrgSchema,
  CustomerSchema,
  CreateCustomerSchema,
  AITaskTypeSchema,
  AISensitivitySchema,
  AIRequestSchema,
  FlowTypeSchema,
  FlowStatusSchema,
  FlowExecutionSchema,
  StartFlowSchema,
  WebhookSourceSchema,
  WebhookPayloadSchema,
  ChannelTypeSchema,
  SendMessageSchema,
  OrgLimitsSchema,
  UpdateOrgLimitsSchema,
  FeatureFlagSchema,
  MetricsQuerySchema,
  // Legacy type exports
  type BaseHeaders,
  type CreateOrg,
  type CreateCustomer,
  type AIRequestInput,
  type StartFlow,
  type SendMessage,
  type UpdateOrgLimits,
  type MetricsQuery,
} from './schemas/index';

// Security utilities
export * from './security/index';

// Logging
export * from './logging/index';

// Metrics
export * from './metrics/index';

// AI Router
export { AIRouter, createAIRouter, type RouterDecision, type RouterConfig } from './ai/router';
export { EnhancedAIRouter, type AIRequest, type AIResponse } from './ai/enhanced-router';
export { CostGuardrails, type CostLimits, type CostAlert, type UsageMetrics } from './ai/cost-guardrails';
export { LLMProviderManager, type LLMProvider, type LLMModel, type ProviderHealth } from './ai/providers';

// Environment and configuration
export { env, getEnv } from './env';

// OpenTelemetry
export * from './otel/index';

// Cost metering
// Avoid exporting cost-meter in Next.js build contexts to prevent resolution of @econeura/db
// Consumers in server-only contexts can import it directly from './cost-meter.ts'

// Version info
export const VERSION = '1.0.0';
export const BUILD_TIME = new Date().toISOString();