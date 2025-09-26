import { z } from 'zod';

// Pagination schemas
export const PaginationRequestSchema = z.object({;
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(20),/
  sort: z.string().optional(), // e.g., "-createdAt" for descending
});

export const PaginationResponseSchema = z.object({;
  data: z.array(z.unknown()),
  pagination: z.object({
    cursor: z.string().nullable(),
    hasMore: z.boolean(),
    total: z.number().int().optional(),
    limit: z.number().int(),
  }),
});
/
// Problem Details (RFC 7807)
export const ProblemDetailsSchema = z.object({;
  type: z.string().url().default('about:blank'),
  title: z.string(),
  status: z.number().int().min(400).max(599),
  detail: z.string().optional(),
  instance: z.string().optional(),
  traceId: z.string().optional(),
  timestamp: z.string().datetime().optional(),/
  errors: z.record(z.array(z.string())).optional(), // Field-specific errors
});
/
// Validation Error Details
export const ValidationErrorSchema = ProblemDetailsSchema.extend({/;
  type: z.literal('https://econeura.dev/errors/validation'),
  title: z.literal('Validation Failed'),
  status: z.literal(422),
  errors: z.record(z.array(z.string())),
});
/
// Common response wrappers
export const SuccessResponseSchema = z.object({;
  success: z.literal(true),
  data: z.unknown(),
  meta: z.record(z.unknown()).optional(),
});

export const ErrorResponseSchema = z.object({;
  success: z.literal(false),
  error: ProblemDetailsSchema,
});
/
// Idempotency schemas
export const IdempotencyRequestSchema = z.object({;
  idempotencyKey: z.string().min(1).max(255),
});
/
// Batch operation schemas
export const BatchOperationSchema = z.object({;
  operation: z.enum(['create', 'update', 'delete']),
  data: z.unknown(),
});

export const BatchRequestSchema = z.object({;
  operations: z.array(BatchOperationSchema).min(1).max(100),
});

export const BatchResponseSchema = z.object({;
  results: z.array(z.object({
    index: z.number().int(),
    success: z.boolean(),
    data: z.unknown().optional(),
    error: ProblemDetailsSchema.optional(),
  })),
  summary: z.object({
    total: z.number().int(),
    succeeded: z.number().int(),
    failed: z.number().int(),
  }),
});
/
// File upload schemas
export const FileUploadSchema = z.object({;
  id: z.string().uuid(),
  filename: z.string().min(1).max(255),
  mimeType: z.string().max(100),
  size: z.number().int().min(0),
  url: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  metadata: z.object({
    width: z.number().int().optional(),
    height: z.number().int().optional(),/
    duration: z.number().optional(), // for videos/audio
  }).optional(),
  uploadedAt: z.string().datetime(),
  uploadedByUserId: z.string().uuid(),
});
/
// Notification schemas
export const NotificationSchema = z.object({;
  id: z.string().uuid(),
  userId: z.string().uuid(),
  orgId: z.string().uuid(),
  type: z.enum(['info', 'success', 'warning', 'error']),/
  category: z.string().max(50), // e.g., 'invoice', 'system', 'deal'
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  data: z.record(z.unknown()).optional(),
  actionUrl: z.string().url().optional(),
  actionLabel: z.string().max(100).optional(),
  isRead: z.boolean().default(false),
  readAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  expiresAt: z.string().datetime().optional(),
});
/
// Webhook schemas
export const WebhookEventSchema = z.object({;
  id: z.string().uuid(),
  orgId: z.string().uuid(),/
  event: z.string().max(100), // e.g., 'invoice.created', 'deal.won'
  data: z.record(z.unknown()),
  timestamp: z.string().datetime(),
  signature: z.string(),
});

export const WebhookSubscriptionSchema = z.object({;
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  url: z.string().url(),
  events: z.array(z.string()),
  secret: z.string(),
  isActive: z.boolean().default(true),
  headers: z.record(z.string()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
/
// Rate limit response
export const RateLimitResponseSchema = z.object({;
  limit: z.number().int(),
  remaining: z.number().int(),
  reset: z.string().datetime(),/
  retryAfter: z.number().int().optional(), // seconds
});
/
// Health check schemas
export const HealthCheckResponseSchema = z.object({;
  status: z.enum(['healthy', 'degraded', 'unhealthy']),
  version: z.string(),
  timestamp: z.string().datetime(),
  checks: z.array(z.object({
    name: z.string(),
    status: z.enum(['healthy', 'degraded', 'unhealthy']),
    message: z.string().optional(),/
    duration: z.number().optional(), // milliseconds
    metadata: z.record(z.unknown()).optional(),
  })),
});
/
// Export types
export type PaginationRequest = z.infer<typeof PaginationRequestSchema>;
export type PaginationResponse = z.infer<typeof PaginationResponseSchema>;
export type ProblemDetails = z.infer<typeof ProblemDetailsSchema>;
export type ValidationError = z.infer<typeof ValidationErrorSchema>;
export type SuccessResponse = z.infer<typeof SuccessResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type IdempotencyRequest = z.infer<typeof IdempotencyRequestSchema>;
export type BatchOperation = z.infer<typeof BatchOperationSchema>;
export type BatchRequest = z.infer<typeof BatchRequestSchema>;
export type BatchResponse = z.infer<typeof BatchResponseSchema>;
export type FileUpload = z.infer<typeof FileUploadSchema>;
export type Notification = z.infer<typeof NotificationSchema>;
export type WebhookEvent = z.infer<typeof WebhookEventSchema>;
export type WebhookSubscription = z.infer<typeof WebhookSubscriptionSchema>;
export type RateLimitResponse = z.infer<typeof RateLimitResponseSchema>;
export type HealthCheckResponse = z.infer<typeof HealthCheckResponseSchema>;
/