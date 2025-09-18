import { z } from 'zod';
import { UUIDSchema, NameSchema, DescriptionSchema, TagsSchema, CustomFieldsSchema } from '../../../shared/utils/validation.utils.js';

// ============================================================================
// INTERACTION DTOs
// ============================================================================

// ========================================================================
// BASIC SCHEMAS
// ========================================================================

export const InteractionTypeSchema = z.enum([
  'EMAIL',
  'PHONE',
  'MEETING',
  'NOTE',
  'TASK',
  'CALL',
  'DEMO',
  'PROPOSAL',
  'FOLLOW_UP',
  'OTHER'
]);

export const InteractionStatusSchema = z.enum([
  'SCHEDULED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'RESCHEDULED'
]);

export const InteractionPrioritySchema = z.enum([
  'LOW',
  'MEDIUM',
  'HIGH',
  'URGENT'
]);

// ========================================================================
// CREATE INTERACTION SCHEMAS
// ========================================================================

export const CreateInteractionSchema = z.object({
  contactId: UUIDSchema,
  type: InteractionTypeSchema,
  subject: NameSchema,
  description: DescriptionSchema.optional(),
  priority: InteractionPrioritySchema.default('MEDIUM'),
  companyId: UUIDSchema.optional(),
  scheduledAt: z.coerce.date().optional(),
  nextAction: z.string().max(500, 'Next action cannot exceed 500 characters').optional(),
  nextActionDate: z.coerce.date().optional(),
  tags: TagsSchema,
  customFields: CustomFieldsSchema,
  attachments: z.array(z.string().url('Invalid attachment URL')).max(5, 'Cannot have more than 5 attachments').optional()
});

export const CreateScheduledInteractionSchema = z.object({
  contactId: UUIDSchema,
  type: InteractionTypeSchema,
  subject: NameSchema,
  scheduledAt: z.coerce.date(),
  companyId: UUIDSchema.optional(),
  description: DescriptionSchema.optional(),
  priority: InteractionPrioritySchema.default('MEDIUM')
});

export const CreateTaskSchema = z.object({
  contactId: UUIDSchema,
  subject: NameSchema,
  description: DescriptionSchema.optional(),
  priority: InteractionPrioritySchema.default('MEDIUM'),
  companyId: UUIDSchema.optional(),
  nextAction: z.string().max(500, 'Next action cannot exceed 500 characters').optional(),
  nextActionDate: z.coerce.date().optional()
});

export const CreateNoteSchema = z.object({
  contactId: UUIDSchema,
  subject: NameSchema,
  description: z.string().min(1, 'Description is required for notes').max(1000, 'Description cannot exceed 1000 characters'),
  companyId: UUIDSchema.optional()
});

export const CreateFollowUpSchema = z.object({
  contactId: UUIDSchema,
  subject: NameSchema,
  nextActionDate: z.coerce.date(),
  companyId: UUIDSchema.optional(),
  description: DescriptionSchema.optional()
});

// ========================================================================
// UPDATE INTERACTION SCHEMAS
// ========================================================================

export const UpdateInteractionSchema = z.object({
  subject: NameSchema.optional(),
  description: DescriptionSchema.optional(),
  status: InteractionStatusSchema.optional(),
  priority: InteractionPrioritySchema.optional(),
  scheduledAt: z.coerce.date().optional(),
  duration: z.number().min(0, 'Duration cannot be negative').optional(),
  outcome: z.string().max(1000, 'Outcome cannot exceed 1000 characters').optional(),
  nextAction: z.string().max(500, 'Next action cannot exceed 500 characters').optional(),
  nextActionDate: z.coerce.date().optional(),
  tags: TagsSchema,
  customFields: CustomFieldsSchema,
  attachments: z.array(z.string().url('Invalid attachment URL')).max(5, 'Cannot have more than 5 attachments').optional()
});

export const UpdateStatusSchema = z.object({
  status: InteractionStatusSchema
});

export const UpdatePrioritySchema = z.object({
  priority: InteractionPrioritySchema
});

export const ScheduleInteractionSchema = z.object({
  scheduledAt: z.coerce.date()
});

export const CompleteInteractionSchema = z.object({
  outcome: z.string().min(1, 'Outcome is required when completing interaction').max(1000, 'Outcome cannot exceed 1000 characters'),
  duration: z.number().min(0, 'Duration cannot be negative').optional()
});

export const SetNextActionSchema = z.object({
  nextAction: z.string().min(1, 'Next action is required').max(500, 'Next action cannot exceed 500 characters'),
  nextActionDate: z.coerce.date().optional()
});

export const AddTagSchema = z.object({
  tag: z.string().min(1, 'Tag cannot be empty').max(50, 'Tag cannot exceed 50 characters')
});

export const RemoveTagSchema = z.object({
  tag: z.string().min(1, 'Tag cannot be empty').max(50, 'Tag cannot exceed 50 characters')
});

export const SetCustomFieldSchema = z.object({
  key: z.string().min(1, 'Key cannot be empty').max(100, 'Key cannot exceed 100 characters'),
  value: z.any()
});

export const RemoveCustomFieldSchema = z.object({
  key: z.string().min(1, 'Key cannot be empty').max(100, 'Key cannot exceed 100 characters')
});

// ========================================================================
// PARAMETER SCHEMAS
// ========================================================================

export const InteractionIdParamSchema = z.object({
  id: UUIDSchema
});

export const InteractionOrganizationIdParamSchema = z.object({
  organizationId: UUIDSchema
});

export const InteractionContactIdParamSchema = z.object({
  contactId: UUIDSchema
});

export const InteractionCompanyIdParamSchema = z.object({
  companyId: UUIDSchema
});

export const InteractionUserIdParamSchema = z.object({
  userId: UUIDSchema
});

// ========================================================================
// QUERY SCHEMAS
// ========================================================================

export const InteractionSearchQuerySchema = z.object({
  page: z.coerce.number().int().min(1, 'Page must be at least 1').default(1),
  limit: z.coerce.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(20),
  sortBy: z.enum(['createdAt', 'updatedAt', 'scheduledAt', 'completedAt', 'subject', 'priority']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().max(200, 'Search term cannot exceed 200 characters').optional(),
  type: InteractionTypeSchema.optional(),
  status: InteractionStatusSchema.optional(),
  priority: InteractionPrioritySchema.optional(),
  contactId: UUIDSchema.optional(),
  companyId: UUIDSchema.optional(),
  userId: UUIDSchema.optional(),
  scheduledFrom: z.coerce.date().optional(),
  scheduledTo: z.coerce.date().optional(),
  completedFrom: z.coerce.date().optional(),
  completedTo: z.coerce.date().optional(),
  tags: z.string().optional(),
  hasOutcome: z.coerce.boolean().optional(),
  hasNextAction: z.coerce.boolean().optional(),
  overdue: z.coerce.boolean().optional(),
  upcoming: z.coerce.boolean().optional()
});

export const InteractionFiltersQuerySchema = z.object({
  type: InteractionTypeSchema.optional(),
  status: InteractionStatusSchema.optional(),
  priority: InteractionPrioritySchema.optional(),
  contactId: UUIDSchema.optional(),
  companyId: UUIDSchema.optional(),
  userId: UUIDSchema.optional(),
  scheduledFrom: z.coerce.date().optional(),
  scheduledTo: z.coerce.date().optional(),
  completedFrom: z.coerce.date().optional(),
  completedTo: z.coerce.date().optional(),
  tags: z.string().optional(),
  hasOutcome: z.coerce.boolean().optional(),
  hasNextAction: z.coerce.boolean().optional(),
  overdue: z.coerce.boolean().optional(),
  upcoming: z.coerce.boolean().optional()
});

// ========================================================================
// BULK OPERATION SCHEMAS
// ========================================================================

export const InteractionBulkUpdateSchema = z.object({
  ids: z.array(UUIDSchema).min(1, 'At least one ID is required').max(100, 'Cannot update more than 100 interactions at once'),
  updates: UpdateInteractionSchema
});

export const InteractionBulkDeleteSchema = z.object({
  ids: z.array(UUIDSchema).min(1, 'At least one ID is required').max(100, 'Cannot delete more than 100 interactions at once')
});

// ========================================================================
// TYPE-SPECIFIC QUERY SCHEMAS
// ========================================================================

export const InteractionTypeParamSchema = z.object({
  type: InteractionTypeSchema
});

export const InteractionStatusParamSchema = z.object({
  status: InteractionStatusSchema
});

export const InteractionPriorityParamSchema = z.object({
  priority: InteractionPrioritySchema
});

export const InteractionScheduledQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional()
});

export const InteractionUpcomingQuerySchema = z.object({
  days: z.coerce.number().int().min(1, 'Days must be at least 1').max(365, 'Days cannot exceed 365').default(7)
});

// ========================================================================
// RESPONSE SCHEMAS
// ========================================================================

export const InteractionResponseSchema = z.object({
  id: UUIDSchema,
  organizationId: UUIDSchema,
  contactId: UUIDSchema,
  companyId: UUIDSchema.optional(),
  userId: UUIDSchema,
  type: InteractionTypeSchema,
  status: InteractionStatusSchema,
  priority: InteractionPrioritySchema,
  subject: z.string(),
  description: z.string().optional(),
  scheduledAt: z.date().optional(),
  completedAt: z.date().optional(),
  duration: z.number().optional(),
  outcome: z.string().optional(),
  nextAction: z.string().optional(),
  nextActionDate: z.date().optional(),
  tags: z.array(z.string()),
  customFields: z.record(z.any()),
  attachments: z.array(z.string()),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const InteractionListResponseSchema = z.object({
  data: z.array(InteractionResponseSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
    hasNext: z.boolean(),
    hasPrev: z.boolean()
  })
});

export const InteractionStatsResponseSchema = z.object({
  total: z.number(),
  byType: z.record(InteractionTypeSchema, z.number()),
  byStatus: z.record(InteractionStatusSchema, z.number()),
  byPriority: z.record(InteractionPrioritySchema, z.number()),
  completed: z.number(),
  pending: z.number(),
  overdue: z.number(),
  upcoming: z.number(),
  averageDuration: z.number().optional(),
  completionRate: z.number().optional()
});

export const InteractionDashboardResponseSchema = z.object({
  todayTasks: z.number(),
  overdueTasks: z.number(),
  upcomingTasks: z.number(),
  completedToday: z.number(),
  recentInteractions: z.array(InteractionResponseSchema),
  upcomingInteractions: z.array(InteractionResponseSchema),
  overdueInteractions: z.array(InteractionResponseSchema)
});

export const InteractionSummaryResponseSchema = z.object({
  totalInteractions: z.number(),
  lastInteraction: InteractionResponseSchema.nullable(),
  nextScheduled: InteractionResponseSchema.nullable(),
  pendingTasks: z.number(),
  completedTasks: z.number(),
  averageResponseTime: z.number().optional()
});

// ========================================================================
// TYPE EXPORTS
// ========================================================================

export type CreateInteractionRequest = z.infer<typeof CreateInteractionSchema>;
export type CreateScheduledInteractionRequest = z.infer<typeof CreateScheduledInteractionSchema>;
export type CreateTaskRequest = z.infer<typeof CreateTaskSchema>;
export type CreateNoteRequest = z.infer<typeof CreateNoteSchema>;
export type CreateFollowUpRequest = z.infer<typeof CreateFollowUpSchema>;

export type UpdateInteractionRequest = z.infer<typeof UpdateInteractionSchema>;
export type UpdateStatusRequest = z.infer<typeof UpdateStatusSchema>;
export type UpdatePriorityRequest = z.infer<typeof UpdatePrioritySchema>;
export type ScheduleInteractionRequest = z.infer<typeof ScheduleInteractionSchema>;
export type CompleteInteractionRequest = z.infer<typeof CompleteInteractionSchema>;
export type SetNextActionRequest = z.infer<typeof SetNextActionSchema>;
export type AddTagRequest = z.infer<typeof AddTagSchema>;
export type RemoveTagRequest = z.infer<typeof RemoveTagSchema>;
export type SetCustomFieldRequest = z.infer<typeof SetCustomFieldSchema>;
export type RemoveCustomFieldRequest = z.infer<typeof RemoveCustomFieldSchema>;

export type InteractionIdParam = z.infer<typeof InteractionIdParamSchema>;
export type InteractionOrganizationIdParam = z.infer<typeof InteractionOrganizationIdParamSchema>;
export type InteractionContactIdParam = z.infer<typeof InteractionContactIdParamSchema>;
export type InteractionCompanyIdParam = z.infer<typeof InteractionCompanyIdParamSchema>;
export type InteractionUserIdParam = z.infer<typeof InteractionUserIdParamSchema>;

export type InteractionSearchQuery = z.infer<typeof InteractionSearchQuerySchema>;
export type InteractionFiltersQuery = z.infer<typeof InteractionFiltersQuerySchema>;

export type InteractionBulkUpdateRequest = z.infer<typeof InteractionBulkUpdateSchema>;
export type InteractionBulkDeleteRequest = z.infer<typeof InteractionBulkDeleteSchema>;

export type InteractionTypeParam = z.infer<typeof InteractionTypeParamSchema>;
export type InteractionStatusParam = z.infer<typeof InteractionStatusParamSchema>;
export type InteractionPriorityParam = z.infer<typeof InteractionPriorityParamSchema>;
export type InteractionScheduledQuery = z.infer<typeof InteractionScheduledQuerySchema>;
export type InteractionUpcomingQuery = z.infer<typeof InteractionUpcomingQuerySchema>;

export type InteractionResponse = z.infer<typeof InteractionResponseSchema>;
export type InteractionListResponse = z.infer<typeof InteractionListResponseSchema>;
export type InteractionStatsResponse = z.infer<typeof InteractionStatsResponseSchema>;
export type InteractionDashboardResponse = z.infer<typeof InteractionDashboardResponseSchema>;
export type InteractionSummaryResponse = z.infer<typeof InteractionSummaryResponseSchema>;
