// Types (legacy)
export * as LegacyTypes from './types/index.ts';

// Schemas - Export all new schemas
export * from './schemas/common.ts';
export * from './schemas/auth.ts';
export * from './schemas/crm.ts';
export * from './schemas/erp.ts';
export * from './schemas/finance.ts';

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
} from './schemas/index.ts';

// Security utilities
export * from './security/index.ts';

// Logging
export * from './logging/index.ts';

// Metrics
export * from './metrics/index.ts';

// AI Router
export { AIRouter, createAIRouter, type RouterDecision, type RouterConfig } from './ai/router.ts';
export { EnhancedAIRouter, type EnhancedAIRequest, type EnhancedRouterDecision, type AIRouterConfig } from './ai/enhanced-router.ts';
export { CostGuardrails, type CostLimits, type CostAlert, type UsageMetrics } from './ai/cost-guardrails.ts';
export { LLMProviderManager, type LLMProvider, type LLMModel, type ProviderHealth } from './ai/providers.ts';

// Environment and configuration
export { env, getEnv } from './env.ts';

// OpenTelemetry
export * from './otel/index.ts';

// Cost metering
// Avoid exporting cost-meter in Next.js build contexts to prevent resolution of @econeura/db
// Consumers in server-only contexts can import it directly from './cost-meter.ts'

// Version info
export const VERSION = '1.0.0';
export const BUILD_TIME = new Date().toISOString();