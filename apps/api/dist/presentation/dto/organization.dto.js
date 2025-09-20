import { z } from 'zod';
export const CreateOrganizationRequestSchema = z.object({
    name: z.string().min(2, 'Organization name must be at least 2 characters').max(100, 'Organization name cannot exceed 100 characters'),
    slug: z.string()
        .min(3, 'Slug must be at least 3 characters')
        .max(50, 'Slug cannot exceed 50 characters')
        .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens')
        .refine(slug => !slug.startsWith('-') && !slug.endsWith('-'), 'Slug cannot start or end with a hyphen'),
    description: z.string().max(500, 'Description cannot exceed 500 characters').optional(),
    website: z.string().url('Invalid website URL').optional(),
    logo: z.string().url('Invalid logo URL').optional(),
    settings: z.object({
        timezone: z.string().default('UTC'),
        currency: z.string().length(3, 'Currency must be a 3-letter code').default('EUR'),
        language: z.string().length(2, 'Language must be a 2-letter code').default('en'),
        dateFormat: z.string().default('DD/MM/YYYY'),
        notifications: z.object({
            email: z.boolean().default(true),
            push: z.boolean().default(false),
            sms: z.boolean().default(false)
        }).default({}),
        features: z.object({
            ai: z.boolean().default(false),
            analytics: z.boolean().default(false),
            integrations: z.boolean().default(false),
            customFields: z.boolean().default(false)
        }).default({}),
        limits: z.object({
            users: z.number().int().min(1, 'User limit must be at least 1').default(5),
            companies: z.number().int().min(0, 'Company limit cannot be negative').default(100),
            contacts: z.number().int().min(0, 'Contact limit cannot be negative').default(500),
            products: z.number().int().min(0, 'Product limit cannot be negative').default(200),
            invoices: z.number().int().min(0, 'Invoice limit cannot be negative').default(1000),
            storage: z.number().int().min(0, 'Storage limit cannot be negative').default(1000)
        }).default({})
    }).optional(),
    subscriptionTier: z.enum(['free', 'basic', 'pro', 'enterprise'], {
        errorMap: () => ({ message: 'Subscription tier must be one of: free, basic, pro, enterprise' })
    }).default('free'),
    billingEmail: z.string().email('Invalid billing email').optional()
});
export const UpdateOrganizationRequestSchema = z.object({
    name: z.string().min(2, 'Organization name must be at least 2 characters').max(100, 'Organization name cannot exceed 100 characters').optional(),
    description: z.string().max(500, 'Description cannot exceed 500 characters').optional(),
    website: z.string().url('Invalid website URL').optional(),
    logo: z.string().url('Invalid logo URL').optional(),
    settings: z.object({
        timezone: z.string().optional(),
        currency: z.string().length(3, 'Currency must be a 3-letter code').optional(),
        language: z.string().length(2, 'Language must be a 2-letter code').optional(),
        dateFormat: z.string().optional(),
        notifications: z.object({
            email: z.boolean().optional(),
            push: z.boolean().optional(),
            sms: z.boolean().optional()
        }).optional(),
        features: z.object({
            ai: z.boolean().optional(),
            analytics: z.boolean().optional(),
            integrations: z.boolean().optional(),
            customFields: z.boolean().optional()
        }).optional(),
        limits: z.object({
            users: z.number().int().min(1, 'User limit must be at least 1').optional(),
            companies: z.number().int().min(0, 'Company limit cannot be negative').optional(),
            contacts: z.number().int().min(0, 'Contact limit cannot be negative').optional(),
            products: z.number().int().min(0, 'Product limit cannot be negative').optional(),
            invoices: z.number().int().min(0, 'Invoice limit cannot be negative').optional(),
            storage: z.number().int().min(0, 'Storage limit cannot be negative').optional()
        }).optional()
    }).optional(),
    subscriptionTier: z.enum(['free', 'basic', 'pro', 'enterprise'], {
        errorMap: () => ({ message: 'Subscription tier must be one of: free, basic, pro, enterprise' })
    }).optional(),
    status: z.enum(['active', 'inactive', 'suspended', 'trial'], {
        errorMap: () => ({ message: 'Status must be one of: active, inactive, suspended, trial' })
    }).optional(),
    billingEmail: z.string().email('Invalid billing email').optional()
});
export const DeleteOrganizationRequestSchema = z.object({
    organizationId: z.string().uuid('Invalid organization ID format')
});
export const GetOrganizationRequestSchema = z.object({
    organizationId: z.string().uuid('Invalid organization ID format')
});
export const SearchOrganizationsRequestSchema = z.object({
    query: z.string().optional(),
    status: z.enum(['active', 'inactive', 'suspended', 'trial']).optional(),
    subscriptionTier: z.enum(['free', 'basic', 'pro', 'enterprise']).optional(),
    isTrial: z.boolean().optional(),
    page: z.coerce.number().int().min(1, 'Page must be at least 1').default(1),
    limit: z.coerce.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(20),
    sortBy: z.enum(['name', 'slug', 'createdAt', 'trialEndsAt']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc')
});
export const OrganizationResponseSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    slug: z.string(),
    description: z.string().nullable(),
    website: z.string().nullable(),
    logo: z.string().nullable(),
    settings: z.object({
        timezone: z.string(),
        currency: z.string(),
        language: z.string(),
        dateFormat: z.string(),
        notifications: z.object({
            email: z.boolean(),
            push: z.boolean(),
            sms: z.boolean()
        }),
        features: z.object({
            ai: z.boolean(),
            analytics: z.boolean(),
            integrations: z.boolean(),
            customFields: z.boolean()
        }),
        limits: z.object({
            users: z.number().int(),
            companies: z.number().int(),
            contacts: z.number().int(),
            products: z.number().int(),
            invoices: z.number().int(),
            storage: z.number().int()
        })
    }),
    subscriptionTier: z.enum(['free', 'basic', 'pro', 'enterprise']),
    status: z.enum(['active', 'inactive', 'suspended', 'trial']),
    trialEndsAt: z.date().nullable(),
    billingEmail: z.string().nullable(),
    isActive: z.boolean(),
    createdAt: z.date(),
    updatedAt: z.date()
});
export const OrganizationListResponseSchema = z.object({
    organizations: z.array(OrganizationResponseSchema),
    total: z.number().int().min(0),
    page: z.number().int().min(1),
    limit: z.number().int().min(1),
    totalPages: z.number().int().min(0),
    hasNext: z.boolean(),
    hasPrevious: z.boolean()
});
export const OrganizationStatsResponseSchema = z.object({
    total: z.number().int().min(0),
    byStatus: z.record(z.string(), z.number().int().min(0)),
    bySubscriptionTier: z.record(z.string(), z.number().int().min(0)),
    active: z.number().int().min(0),
    inactive: z.number().int().min(0),
    trial: z.number().int().min(0),
    trialExpired: z.number().int().min(0)
});
export const validateCreateOrganizationRequest = (data) => {
    return CreateOrganizationRequestSchema.parse(data);
};
export const validateUpdateOrganizationRequest = (data) => {
    return UpdateOrganizationRequestSchema.parse(data);
};
export const validateDeleteOrganizationRequest = (data) => {
    return DeleteOrganizationRequestSchema.parse(data);
};
export const validateGetOrganizationRequest = (data) => {
    return GetOrganizationRequestSchema.parse(data);
};
export const validateSearchOrganizationsRequest = (data) => {
    return SearchOrganizationsRequestSchema.parse(data);
};
export const transformOrganizationToResponse = (organization) => {
    return {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        description: organization.description,
        website: organization.website,
        logo: organization.logo,
        settings: organization.settings,
        subscriptionTier: organization.subscriptionTier,
        status: organization.status,
        trialEndsAt: organization.trialEndsAt,
        billingEmail: organization.billingEmail,
        isActive: organization.isActive,
        createdAt: organization.createdAt,
        updatedAt: organization.updatedAt
    };
};
export const transformOrganizationListToResponse = (organizationList) => {
    return {
        organizations: organizationList.organizations.map(transformOrganizationToResponse),
        total: organizationList.total,
        page: organizationList.page,
        limit: organizationList.limit,
        totalPages: organizationList.totalPages,
        hasNext: organizationList.hasNext,
        hasPrevious: organizationList.hasPrevious
    };
};
export const transformOrganizationStatsToResponse = (stats) => {
    return {
        total: stats.total,
        byStatus: stats.byStatus,
        bySubscriptionTier: stats.bySubscriptionTier,
        active: stats.active,
        inactive: stats.inactive,
        trial: stats.trial,
        trialExpired: stats.trialExpired
    };
};
//# sourceMappingURL=organization.dto.js.map