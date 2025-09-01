// Types (legacy)
export * as LegacyTypes from './types';

// Schemas - Export all new schemas
// Types (legacy)
export * as LegacyTypes from './types';

// Schemas - Export all new schemas
export * from './schemas/common';
export * from './schemas/auth';
export * from './schemas/crm';
export * from './schemas/erp';
export * from './schemas/finance';

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
} from './schemas';

// Security utilities
export * from './security';

// Logging
export * from './logging';

// Metrics
export * from './metrics';

// AI Router
export { AIRouter, createAIRouter, type RouterDecision, type RouterConfig } from './ai/router';
export { EnhancedAIRouter, type AIRequest as EnhancedAIRequest, type AIResponse as EnhancedAIResponse } from './ai/enhanced-router';
export { CostGuardrails, type CostLimits, type CostAlert, type UsageMetrics } from './ai/cost-guardrails';
export { LLMProviderManager, type LLMProvider, type LLMModel, type ProviderHealth } from './ai/providers';

// Environment and configuration
export { env, getEnv } from './env';

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
} from './otel';

// Cost metering
export { costMeter } from './cost-meter';
export type { CostUsage, ModelName } from './cost-meter';

// Version info
export const VERSION = '1.0.0';
export const BUILD_TIME = new Date().toISOString();