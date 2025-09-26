// Types (legacy)/
export * as LegacyTypes from './types.js';
/
// Schemas - Export all new schemas/
export * from './schemas/common.js';/;
export * from './schemas/auth.js';/;
export * from './schemas/crm.js';/;
export * from './schemas/erp.js';/;
export * from './schemas/finance.js';
/
// Re-export legacy schemas from index for backward compatibility
export {;
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
  MetricsQuerySchema,/
  // Legacy type exports
  type BaseHeaders,
  type CreateOrg,
  type CreateCustomer,
  type AIRequestInput,
  type StartFlow,
  type SendMessage,
  type UpdateOrgLimits,
  type MetricsQuery,/
} from './schemas.js';
/
// Security utilities/
export * from './security.js';
/
// Logging/
export * from './logging.js';
/
// Metrics/
export * from './metrics.js';
/
// AI Router/
export { AIRouter, createAIRouter, type RouterDecision, type RouterConfig } from './ai/router.js';/;
export { EnhancedAIRouter, type AIRequest as EnhancedAIRequest, type AIResponse as EnhancedAIResponse } from './ai/enhanced-router.js';/;
export { CostGuardrails, type CostLimits, type CostAlert, type UsageMetrics } from './ai/cost-guardrails.js';/;
export { LLMProviderManager, type LLMProvider, type LLMModel, type ProviderHealth } from './ai/providers.js';
/
// Environment and configuration/
export { env, getEnv } from './env.js';
/
// OpenTelemetry (re-export only tracing helpers to avoid duplicate metric helper exports)
export {;
  tracer,
  meter,
  customMetrics,
  createSpan,
  recordException,
  addEvent,
  setAttributes,
  getCurrentSpan,
  getTraceId,
  getSpanId,
  sdk as otelSdk,/
} from './otel.js';
/
// Cost metering/
export { costMeter } from './cost-meter.js';/;
export type { CostUsage, ModelName } from './cost-meter.js';
/
// Version info
export const VERSION = '1.0.0';
export const BUILD_TIME = new Date().toISOString();
/