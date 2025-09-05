import { z } from 'zod';

// Agent execution policy
export const AgentPolicySchema = z.object({
  maxExecutionTimeMs: z.number().positive(),
  maxRetries: z.number().min(0).max(5),
  retryDelayMs: z.number().positive(),
  requiresApproval: z.boolean(),
  costCategory: z.enum(['low', 'medium', 'high']),
  allowedOrgs: z.array(z.string()).optional(),
});

export type AgentPolicy = z.infer<typeof AgentPolicySchema>;

// Agent execution context
export const AgentContextSchema = z.object({
  orgId: z.string(),
  userId: z.string(),
  correlationId: z.string(),
  idempotencyKey: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type AgentContext = z.infer<typeof AgentContextSchema>;

// Agent execution result
export const AgentResultSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z.string().optional(),
  costEur: z.number().min(0).optional(),
  executionTimeMs: z.number().positive(),
  metadata: z.record(z.unknown()).optional(),
});

export type AgentResult = z.infer<typeof AgentResultSchema>;

// Agent categories
export const AgentCategory = z.enum([
  'ventas',
  'marketing', 
  'operaciones',
  'finanzas',
  'soporte_qa'
]);

export type AgentCategoryType = z.infer<typeof AgentCategory>;

// Base agent descriptor
export const AgentDescriptorSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: AgentCategory,
  version: z.string().default('1.0.0'),
  inputs: z.ZodSchema,
  outputs: z.ZodSchema,
  policy: AgentPolicySchema,
  costHint: z.string(),
  tags: z.array(z.string()).default([]),
  deprecated: z.boolean().default(false),
});

export type AgentDescriptor = z.infer<typeof AgentDescriptorSchema> & {
  inputs: z.ZodSchema;
  outputs: z.ZodSchema;
  run: (inputs: unknown, context: AgentContext) => Promise<AgentResult>;
};

// Agent execution request
export const AgentExecutionRequestSchema = z.object({
  agentId: z.string(),
  inputs: z.unknown(),
  context: AgentContextSchema,
});

export type AgentExecutionRequest = z.infer<typeof AgentExecutionRequestSchema>;

// Agent execution status
export const AgentExecutionStatus = z.enum([
  'pending',
  'running', 
  'completed',
  'failed',
  'cancelled'
]);

export type AgentExecutionStatusType = z.infer<typeof AgentExecutionStatus>;

// Agent execution record
export const AgentExecutionRecordSchema = z.object({
  id: z.string(),
  agentId: z.string(),
  status: AgentExecutionStatus,
  inputs: z.unknown(),
  outputs: z.unknown().optional(),
  context: AgentContextSchema,
  startedAt: z.date(),
  completedAt: z.date().optional(),
  costEur: z.number().min(0).optional(),
  executionTimeMs: z.number().positive().optional(),
  error: z.string().optional(),
  retryCount: z.number().min(0).default(0),
});

export type AgentExecutionRecord = z.infer<typeof AgentExecutionRecordSchema>;