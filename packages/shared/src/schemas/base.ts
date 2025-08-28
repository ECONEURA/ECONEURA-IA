import { z } from 'zod';

// Identificadores y formatos base
export const OrgIdSchema = z.string().regex(/^[a-zA-Z0-9\-_]+$/, 'Invalid org_id format');
export const RequestIdSchema = z.string().uuid();
export const TraceParentSchema = z.string().regex(/^00-[a-f0-9]{32}-[a-f0-9]{16}-[0-9]{2}$/);

// Headers base para todas las peticiones
export const BaseHeadersSchema = z.object({
  'x-org-id': OrgIdSchema,
  authorization: z.string().startsWith('Bearer '),
  'x-request-id': RequestIdSchema,
  traceparent: TraceParentSchema,
  'x-idempotency-key': z.string().optional(),
});

// Tipos base comunes
export const BaseTimestampsSchema = z.object({
  created_at: z.date(),
  updated_at: z.date(),
});

export const BaseResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  error: z.string().optional(),
});

// Error schema estandarizado según RFC 7807
export const ProblemJsonSchema = z.object({
  type: z.string().url(),
  title: z.string(),
  status: z.number().int().min(400).max(599),
  detail: z.string(),
  instance: z.string(),
  org_id: z.string().optional(),
  validation_errors: z.array(z.unknown()).optional(),
  error_code: z.string().optional(),
});

// Tipos base para paginación y filtrado
export const PaginationParamsSchema = z.object({
  page: z.number().int().min(1).default(1),
  per_page: z.number().int().min(1).max(100).default(20),
  sort_by: z.string().optional(),
  sort_order: z.enum(['asc', 'desc']).default('asc'),
});

export type OrgId = z.infer<typeof OrgIdSchema>;
export type RequestId = z.infer<typeof RequestIdSchema>;
export type BaseHeaders = z.infer<typeof BaseHeadersSchema>;
export type BaseTimestamps = z.infer<typeof BaseTimestampsSchema>;
export type BaseResponse = z.infer<typeof BaseResponseSchema>;
export type ProblemJson = z.infer<typeof ProblemJsonSchema>;
export type PaginationParams = z.infer<typeof PaginationParamsSchema>;
