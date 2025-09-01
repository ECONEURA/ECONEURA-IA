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
export { EnhancedAIRouter, type AIRequest as EnhancedAIRequest, type AIResponse as EnhancedAIResponse } from './ai/enhanced-router.ts';
export { CostGuardrails, type CostLimits, type CostAlert, type UsageMetrics } from './ai/cost-guardrails.ts';
export { LLMProviderManager, type LLMProvider, type LLMModel, type ProviderHealth } from './ai/providers.ts';

// Environment and configuration
export { env, getEnv } from './env.ts';

// OpenTelemetry (re-export only tracing helpers to avoid duplicate metric helper exports)
export {
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
  sdk as otelSdk,
} from './otel/index.ts';

// Cost metering
export { costMeter } from './cost-meter.ts';
export type { CostUsage, ModelName } from './cost-meter.ts';

// Version info
export const VERSION = '1.0.0';
export const BUILD_TIME = new Date().toISOString();