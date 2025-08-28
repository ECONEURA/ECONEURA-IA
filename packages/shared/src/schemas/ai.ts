import { z } from 'zod';
import { OrgIdSchema, BaseTimestampsSchema } from './base';

// Tipos de IA soportados
export const AITaskTypeSchema = z.enum([
  'draft_email',
  'analyze_invoice', 
  'summarize',
  'classify',
  'chat',
  'code',
]);

// Configuración base de IA
export const AIConfigSchema = z.object({
  model: z.string().optional(),
  max_tokens: z.number().int().positive().max(8192).optional(),
  temperature: z.number().min(0).max(2).optional(),
  stream: z.boolean().default(false),
  prefer_edge: z.boolean().default(true),
  sensitivity: z.enum(['public', 'internal', 'confidential', 'pii']).default('internal'),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
});

// Request para generación de texto
export const AIRequestSchema = AIConfigSchema.extend({
  content: z.string().min(1).max(50000),
  task_type: AITaskTypeSchema.default('summarize'),
  tools: z.array(z.string()).optional(),
  max_cost_eur: z.number().positive().max(10).optional(),
  languages: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// Chat completions compatible con OpenAI
export const ChatMessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant', 'function']),
  content: z.string(),
  name: z.string().optional(),
  function_call: z.record(z.string(), z.unknown()).optional(),
});

export const ChatCompletionSchema = AIConfigSchema.extend({
  messages: z.array(ChatMessageSchema),
  tools: z.array(z.object({
    type: z.string(),
    function: z.object({
      name: z.string(),
      description: z.string(),
      parameters: z.record(z.string(), z.unknown()),
    }),
  })).optional(),
});

// Límites y costes
export const AICostLimitsSchema = z.object({
  org_id: OrgIdSchema,
  daily_limit_eur: z.number().positive().max(1000),
  monthly_limit_eur: z.number().positive().max(10000),
  per_request_limit_eur: z.number().positive().max(50),
  warning_thresholds: z.object({
    daily: z.number().min(0).max(100),
    monthly: z.number().min(0).max(100),
  }),
  emergency_stop: z.object({
    enabled: z.boolean(),
    threshold_eur: z.number().positive().max(20000),
  }),
}).merge(BaseTimestampsSchema);

// Tipos exportados
export type AITaskType = z.infer<typeof AITaskTypeSchema>;
export type AIConfig = z.infer<typeof AIConfigSchema>;
export type AIRequest = z.infer<typeof AIRequestSchema>;
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type ChatCompletion = z.infer<typeof ChatCompletionSchema>;
export type AICostLimits = z.infer<typeof AICostLimitsSchema>;
