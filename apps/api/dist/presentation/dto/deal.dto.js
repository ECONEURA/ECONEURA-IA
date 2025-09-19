import { z } from 'zod';
import { UUIDSchema, NameSchema, DescriptionSchema, TagsSchema, CustomFieldsSchema } from '../../../shared/utils/validation.utils.js';
export const DealStageSchema = z.enum([
    'LEAD',
    'QUALIFIED',
    'PROPOSAL',
    'NEGOTIATION',
    'CLOSED_WON',
    'CLOSED_LOST',
    'ON_HOLD',
    'CANCELLED'
]);
export const DealStatusSchema = z.enum([
    'ACTIVE',
    'WON',
    'LOST',
    'ON_HOLD',
    'CANCELLED'
]);
export const DealPrioritySchema = z.enum([
    'LOW',
    'MEDIUM',
    'HIGH',
    'URGENT'
]);
export const DealSourceSchema = z.enum([
    'WEBSITE',
    'EMAIL',
    'PHONE',
    'REFERRAL',
    'SOCIAL_MEDIA',
    'ADVERTISING',
    'TRADE_SHOW',
    'PARTNER',
    'OTHER'
]);
export const CreateDealSchema = z.object({
    contactId: UUIDSchema,
    name: NameSchema,
    description: DescriptionSchema.optional(),
    stage: DealStageSchema.default('LEAD'),
    priority: DealPrioritySchema.default('MEDIUM'),
    source: DealSourceSchema.default('WEBSITE'),
    value: z.number().min(0, 'Deal value cannot be negative'),
    currency: z.string().length(3, 'Currency must be 3 characters').default('USD'),
    probability: z.number().min(0, 'Probability cannot be negative').max(100, 'Probability cannot exceed 100').optional(),
    companyId: UUIDSchema.optional(),
    expectedCloseDate: z.coerce.date().optional(),
    nextStep: z.string().max(500, 'Next step cannot exceed 500 characters').optional(),
    nextStepDate: z.coerce.date().optional(),
    tags: TagsSchema,
    customFields: CustomFieldsSchema,
    attachments: z.array(z.string().url('Invalid attachment URL')).max(5, 'Cannot have more than 5 attachments').optional(),
    notes: z.string().max(2000, 'Notes cannot exceed 2000 characters').optional(),
    competitors: z.array(z.string().max(100, 'Competitor name cannot exceed 100 characters')).max(10, 'Cannot have more than 10 competitors').optional(),
    decisionMakers: z.array(z.string().max(100, 'Decision maker name cannot exceed 100 characters')).max(10, 'Cannot have more than 10 decision makers').optional(),
    budget: z.number().min(0, 'Budget cannot be negative').optional(),
    timeline: z.string().max(200, 'Timeline cannot exceed 200 characters').optional(),
    requirements: z.array(z.string().max(500, 'Requirement cannot exceed 500 characters')).max(20, 'Cannot have more than 20 requirements').optional(),
    objections: z.array(z.string().max(500, 'Objection cannot exceed 500 characters')).max(20, 'Cannot have more than 20 objections').optional()
});
export const CreateLeadSchema = z.object({
    contactId: UUIDSchema,
    name: NameSchema,
    value: z.number().min(0, 'Deal value cannot be negative'),
    currency: z.string().length(3, 'Currency must be 3 characters').default('USD'),
    source: DealSourceSchema.default('WEBSITE'),
    companyId: UUIDSchema.optional(),
    description: DescriptionSchema.optional()
});
export const CreateQualifiedSchema = z.object({
    contactId: UUIDSchema,
    name: NameSchema,
    value: z.number().min(0, 'Deal value cannot be negative'),
    currency: z.string().length(3, 'Currency must be 3 characters').default('USD'),
    source: DealSourceSchema.default('WEBSITE'),
    companyId: UUIDSchema.optional(),
    description: DescriptionSchema.optional()
});
export const CreateProposalSchema = z.object({
    contactId: UUIDSchema,
    name: NameSchema,
    value: z.number().min(0, 'Deal value cannot be negative'),
    currency: z.string().length(3, 'Currency must be 3 characters').default('USD'),
    source: DealSourceSchema.default('WEBSITE'),
    companyId: UUIDSchema.optional(),
    description: DescriptionSchema.optional()
});
export const CreateNegotiationSchema = z.object({
    contactId: UUIDSchema,
    name: NameSchema,
    value: z.number().min(0, 'Deal value cannot be negative'),
    currency: z.string().length(3, 'Currency must be 3 characters').default('USD'),
    source: DealSourceSchema.default('WEBSITE'),
    companyId: UUIDSchema.optional(),
    description: DescriptionSchema.optional()
});
export const UpdateDealSchema = z.object({
    name: NameSchema.optional(),
    description: DescriptionSchema.optional(),
    stage: DealStageSchema.optional(),
    status: DealStatusSchema.optional(),
    priority: DealPrioritySchema.optional(),
    value: z.number().min(0, 'Deal value cannot be negative').optional(),
    currency: z.string().length(3, 'Currency must be 3 characters').optional(),
    probability: z.number().min(0, 'Probability cannot be negative').max(100, 'Probability cannot exceed 100').optional(),
    expectedCloseDate: z.coerce.date().optional(),
    nextStep: z.string().max(500, 'Next step cannot exceed 500 characters').optional(),
    nextStepDate: z.coerce.date().optional(),
    tags: TagsSchema,
    customFields: CustomFieldsSchema,
    attachments: z.array(z.string().url('Invalid attachment URL')).max(5, 'Cannot have more than 5 attachments').optional(),
    notes: z.string().max(2000, 'Notes cannot exceed 2000 characters').optional(),
    competitors: z.array(z.string().max(100, 'Competitor name cannot exceed 100 characters')).max(10, 'Cannot have more than 10 competitors').optional(),
    decisionMakers: z.array(z.string().max(100, 'Decision maker name cannot exceed 100 characters')).max(10, 'Cannot have more than 10 decision makers').optional(),
    budget: z.number().min(0, 'Budget cannot be negative').optional(),
    timeline: z.string().max(200, 'Timeline cannot exceed 200 characters').optional(),
    requirements: z.array(z.string().max(500, 'Requirement cannot exceed 500 characters')).max(20, 'Cannot have more than 20 requirements').optional(),
    objections: z.array(z.string().max(500, 'Objection cannot exceed 500 characters')).max(20, 'Cannot have more than 20 objections').optional()
});
export const UpdateStageSchema = z.object({
    stage: DealStageSchema
});
export const UpdateStatusSchema = z.object({
    status: DealStatusSchema
});
export const UpdatePrioritySchema = z.object({
    priority: DealPrioritySchema
});
export const UpdateValueSchema = z.object({
    value: z.number().min(0, 'Deal value cannot be negative'),
    currency: z.string().length(3, 'Currency must be 3 characters').optional()
});
export const UpdateProbabilitySchema = z.object({
    probability: z.number().min(0, 'Probability cannot be negative').max(100, 'Probability cannot exceed 100')
});
export const SetExpectedCloseDateSchema = z.object({
    expectedCloseDate: z.coerce.date()
});
export const SetNextStepSchema = z.object({
    nextStep: z.string().min(1, 'Next step is required').max(500, 'Next step cannot exceed 500 characters'),
    nextStepDate: z.coerce.date().optional()
});
export const AddTagSchema = z.object({
    tag: z.string().min(1, 'Tag cannot be empty').max(50, 'Tag cannot exceed 50 characters')
});
export const RemoveTagSchema = z.object({
    tag: z.string().min(1, 'Tag cannot be empty').max(50, 'Tag cannot exceed 50 characters')
});
export const AddCompetitorSchema = z.object({
    competitor: z.string().min(1, 'Competitor name cannot be empty').max(100, 'Competitor name cannot exceed 100 characters')
});
export const RemoveCompetitorSchema = z.object({
    competitor: z.string().min(1, 'Competitor name cannot be empty').max(100, 'Competitor name cannot exceed 100 characters')
});
export const AddDecisionMakerSchema = z.object({
    decisionMaker: z.string().min(1, 'Decision maker name cannot be empty').max(100, 'Decision maker name cannot exceed 100 characters')
});
export const RemoveDecisionMakerSchema = z.object({
    decisionMaker: z.string().min(1, 'Decision maker name cannot be empty').max(100, 'Decision maker name cannot exceed 100 characters')
});
export const SetCustomFieldSchema = z.object({
    key: z.string().min(1, 'Key cannot be empty').max(100, 'Key cannot exceed 100 characters'),
    value: z.any()
});
export const RemoveCustomFieldSchema = z.object({
    key: z.string().min(1, 'Key cannot be empty').max(100, 'Key cannot exceed 100 characters')
});
export const DealIdParamSchema = z.object({
    id: UUIDSchema
});
export const DealOrganizationIdParamSchema = z.object({
    organizationId: UUIDSchema
});
export const DealContactIdParamSchema = z.object({
    contactId: UUIDSchema
});
export const DealCompanyIdParamSchema = z.object({
    companyId: UUIDSchema
});
export const DealUserIdParamSchema = z.object({
    userId: UUIDSchema
});
export const DealSearchQuerySchema = z.object({
    page: z.coerce.number().int().min(1, 'Page must be at least 1').default(1),
    limit: z.coerce.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(20),
    sortBy: z.enum(['createdAt', 'updatedAt', 'expectedCloseDate', 'actualCloseDate', 'name', 'value', 'probability', 'priority']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
    search: z.string().max(200, 'Search term cannot exceed 200 characters').optional(),
    stage: DealStageSchema.optional(),
    status: DealStatusSchema.optional(),
    priority: DealPrioritySchema.optional(),
    source: DealSourceSchema.optional(),
    contactId: UUIDSchema.optional(),
    companyId: UUIDSchema.optional(),
    userId: UUIDSchema.optional(),
    valueFrom: z.coerce.number().min(0, 'Value from cannot be negative').optional(),
    valueTo: z.coerce.number().min(0, 'Value to cannot be negative').optional(),
    probabilityFrom: z.coerce.number().min(0, 'Probability from cannot be negative').max(100, 'Probability from cannot exceed 100').optional(),
    probabilityTo: z.coerce.number().min(0, 'Probability to cannot be negative').max(100, 'Probability to cannot exceed 100').optional(),
    expectedCloseFrom: z.coerce.date().optional(),
    expectedCloseTo: z.coerce.date().optional(),
    actualCloseFrom: z.coerce.date().optional(),
    actualCloseTo: z.coerce.date().optional(),
    tags: z.string().optional(),
    hasNextStep: z.coerce.boolean().optional(),
    overdue: z.coerce.boolean().optional(),
    won: z.coerce.boolean().optional(),
    lost: z.coerce.boolean().optional(),
    active: z.coerce.boolean().optional()
});
export const DealFiltersQuerySchema = z.object({
    stage: DealStageSchema.optional(),
    status: DealStatusSchema.optional(),
    priority: DealPrioritySchema.optional(),
    source: DealSourceSchema.optional(),
    contactId: UUIDSchema.optional(),
    companyId: UUIDSchema.optional(),
    userId: UUIDSchema.optional(),
    valueFrom: z.coerce.number().min(0, 'Value from cannot be negative').optional(),
    valueTo: z.coerce.number().min(0, 'Value to cannot be negative').optional(),
    probabilityFrom: z.coerce.number().min(0, 'Probability from cannot be negative').max(100, 'Probability from cannot exceed 100').optional(),
    probabilityTo: z.coerce.number().min(0, 'Probability to cannot be negative').max(100, 'Probability to cannot exceed 100').optional(),
    expectedCloseFrom: z.coerce.date().optional(),
    expectedCloseTo: z.coerce.date().optional(),
    actualCloseFrom: z.coerce.date().optional(),
    actualCloseTo: z.coerce.date().optional(),
    tags: z.string().optional(),
    hasNextStep: z.coerce.boolean().optional(),
    overdue: z.coerce.boolean().optional(),
    won: z.coerce.boolean().optional(),
    lost: z.coerce.boolean().optional(),
    active: z.coerce.boolean().optional()
});
export const DealBulkUpdateSchema = z.object({
    ids: z.array(UUIDSchema).min(1, 'At least one ID is required').max(100, 'Cannot update more than 100 deals at once'),
    updates: UpdateDealSchema
});
export const DealBulkDeleteSchema = z.object({
    ids: z.array(UUIDSchema).min(1, 'At least one ID is required').max(100, 'Cannot delete more than 100 deals at once')
});
export const DealStageParamSchema = z.object({
    stage: DealStageSchema
});
export const DealStatusParamSchema = z.object({
    status: DealStatusSchema
});
export const DealPriorityParamSchema = z.object({
    priority: DealPrioritySchema
});
export const DealSourceParamSchema = z.object({
    source: DealSourceSchema
});
export const DealValueRangeQuerySchema = z.object({
    minValue: z.coerce.number().min(0, 'Minimum value cannot be negative').optional(),
    maxValue: z.coerce.number().min(0, 'Maximum value cannot be negative').optional()
});
export const DealProbabilityRangeQuerySchema = z.object({
    minProbability: z.coerce.number().min(0, 'Minimum probability cannot be negative').max(100, 'Minimum probability cannot exceed 100').optional(),
    maxProbability: z.coerce.number().min(0, 'Maximum probability cannot be negative').max(100, 'Maximum probability cannot exceed 100').optional()
});
export const DealExpectedCloseQuerySchema = z.object({
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional()
});
export const DealClosedInPeriodQuerySchema = z.object({
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional()
});
export const DealResponseSchema = z.object({
    id: UUIDSchema,
    organizationId: UUIDSchema,
    contactId: UUIDSchema,
    companyId: UUIDSchema.optional(),
    userId: UUIDSchema,
    name: z.string(),
    description: z.string().optional(),
    stage: DealStageSchema,
    status: DealStatusSchema,
    priority: DealPrioritySchema,
    source: DealSourceSchema,
    value: z.number(),
    currency: z.string(),
    probability: z.number(),
    expectedCloseDate: z.date().optional(),
    actualCloseDate: z.date().optional(),
    nextStep: z.string().optional(),
    nextStepDate: z.date().optional(),
    tags: z.array(z.string()),
    customFields: z.record(z.any()),
    attachments: z.array(z.string()),
    notes: z.string().optional(),
    competitors: z.array(z.string()),
    decisionMakers: z.array(z.string()),
    budget: z.number().optional(),
    timeline: z.string().optional(),
    requirements: z.array(z.string()),
    objections: z.array(z.string()),
    createdAt: z.date(),
    updatedAt: z.date()
});
export const DealListResponseSchema = z.object({
    data: z.array(DealResponseSchema),
    pagination: z.object({
        page: z.number(),
        limit: z.number(),
        total: z.number(),
        totalPages: z.number(),
        hasNext: z.boolean(),
        hasPrev: z.boolean()
    })
});
export const DealStatsResponseSchema = z.object({
    total: z.number(),
    byStage: z.record(DealStageSchema, z.number()),
    byStatus: z.record(DealStatusSchema, z.number()),
    byPriority: z.record(DealPrioritySchema, z.number()),
    bySource: z.record(DealSourceSchema, z.number()),
    totalValue: z.number(),
    weightedValue: z.number(),
    wonValue: z.number(),
    lostValue: z.number(),
    activeValue: z.number(),
    averageDealSize: z.number(),
    averageSalesCycle: z.number(),
    winRate: z.number(),
    conversionRate: z.number(),
    overdueCount: z.number(),
    expectedThisMonth: z.number(),
    expectedThisQuarter: z.number()
});
export const DealPipelineResponseSchema = z.object({
    byStage: z.record(DealStageSchema, z.object({
        count: z.number(),
        value: z.number(),
        weightedValue: z.number()
    })),
    totalValue: z.number(),
    totalWeightedValue: z.number(),
    averageDealSize: z.number(),
    averageSalesCycle: z.number()
});
export const DealSalesForecastResponseSchema = z.object({
    monthly: z.array(z.object({
        month: z.string(),
        value: z.number(),
        weightedValue: z.number(),
        count: z.number()
    })),
    quarterly: z.array(z.object({
        quarter: z.string(),
        value: z.number(),
        weightedValue: z.number(),
        count: z.number()
    })),
    yearly: z.array(z.object({
        year: z.string(),
        value: z.number(),
        weightedValue: z.number(),
        count: z.number()
    }))
});
export const DealConversionRatesResponseSchema = z.object({
    byStage: z.record(DealStageSchema, z.object({
        entered: z.number(),
        converted: z.number(),
        rate: z.number()
    })),
    overall: z.object({
        entered: z.number(),
        won: z.number(),
        rate: z.number()
    })
});
export const DealDashboardResponseSchema = z.object({
    totalDeals: z.number(),
    activeDeals: z.number(),
    wonDeals: z.number(),
    lostDeals: z.number(),
    overdueDeals: z.number(),
    expectedThisMonth: z.number(),
    totalValue: z.number(),
    weightedValue: z.number(),
    recentDeals: z.array(DealResponseSchema),
    upcomingDeals: z.array(DealResponseSchema),
    overdueDeals: z.array(DealResponseSchema),
    topDeals: z.array(DealResponseSchema)
});
export const DealSummaryResponseSchema = z.object({
    totalDeals: z.number(),
    wonDeals: z.number(),
    lostDeals: z.number(),
    totalValue: z.number(),
    wonValue: z.number(),
    lastDeal: DealResponseSchema.nullable(),
    averageDealSize: z.number(),
    averageSalesCycle: z.number()
});
//# sourceMappingURL=deal.dto.js.map