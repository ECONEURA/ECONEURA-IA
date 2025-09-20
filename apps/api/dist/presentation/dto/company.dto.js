import { z } from 'zod';
export const CreateCompanyRequestSchema = z.object({
    organizationId: z.string().uuid('Invalid organization ID format'),
    name: z.string().min(1, 'Company name is required').max(200, 'Company name cannot exceed 200 characters'),
    legalName: z.string().max(200, 'Legal name cannot exceed 200 characters').optional(),
    type: z.enum(['customer', 'supplier', 'partner', 'prospect', 'competitor'], {
        errorMap: () => ({ message: 'Type must be one of: customer, supplier, partner, prospect, competitor' })
    }),
    status: z.enum(['active', 'inactive', 'suspended', 'prospect', 'lead'], {
        errorMap: () => ({ message: 'Status must be one of: active, inactive, suspended, prospect, lead' })
    }),
    size: z.enum(['startup', 'small', 'medium', 'large', 'enterprise'], {
        errorMap: () => ({ message: 'Size must be one of: startup, small, medium, large, enterprise' })
    }),
    industry: z.string().min(1, 'Industry is required').max(100, 'Industry cannot exceed 100 characters'),
    source: z.enum(['website', 'referral', 'cold_call', 'email', 'social_media', 'event', 'other'], {
        errorMap: () => ({ message: 'Source must be one of: website, referral, cold_call, email, social_media, event, other' })
    }),
    website: z.string().url('Invalid website URL').optional(),
    email: z.string().email('Invalid email format').optional(),
    phone: z.string().regex(/^[\+]?[1-9][\d]{0,15}$/, 'Invalid phone number format').optional(),
    address: z.object({
        street: z.string().min(1, 'Street is required'),
        city: z.string().min(1, 'City is required'),
        state: z.string().optional(),
        postalCode: z.string().min(1, 'Postal code is required'),
        country: z.string().min(1, 'Country is required'),
        countryCode: z.string().length(2, 'Country code must be 2 characters')
    }).optional(),
    billingAddress: z.object({
        street: z.string().min(1, 'Street is required'),
        city: z.string().min(1, 'City is required'),
        state: z.string().optional(),
        postalCode: z.string().min(1, 'Postal code is required'),
        country: z.string().min(1, 'Country is required'),
        countryCode: z.string().length(2, 'Country code must be 2 characters')
    }).optional(),
    shippingAddress: z.object({
        street: z.string().min(1, 'Street is required'),
        city: z.string().min(1, 'City is required'),
        state: z.string().optional(),
        postalCode: z.string().min(1, 'Postal code is required'),
        country: z.string().min(1, 'Country is required'),
        countryCode: z.string().length(2, 'Country code must be 2 characters')
    }).optional(),
    taxId: z.string().min(5, 'Tax ID must be at least 5 characters').max(20, 'Tax ID cannot exceed 20 characters').optional(),
    vatNumber: z.string().min(8, 'VAT number must be at least 8 characters').max(15, 'VAT number cannot exceed 15 characters').optional(),
    registrationNumber: z.string().max(50, 'Registration number cannot exceed 50 characters').optional(),
    description: z.string().max(1000, 'Description cannot exceed 1000 characters').optional(),
    annualRevenue: z.object({
        amount: z.number().min(0, 'Annual revenue cannot be negative'),
        currency: z.string().length(3, 'Currency must be a 3-letter code')
    }).optional(),
    employeeCount: z.number().int().min(0, 'Employee count cannot be negative').max(1000000, 'Employee count cannot exceed 1,000,000').optional(),
    foundedYear: z.number().int().min(1800, 'Founded year must be at least 1800').max(new Date().getFullYear(), 'Founded year cannot be in the future').optional(),
    parentCompanyId: z.string().uuid('Invalid parent company ID format').optional(),
    assignedUserId: z.string().uuid('Invalid assigned user ID format').optional(),
    nextFollowUpDate: z.coerce.date().optional(),
    leadScore: z.number().int().min(0, 'Lead score must be at least 0').max(100, 'Lead score cannot exceed 100').optional(),
    settings: z.object({
        notifications: z.object({
            email: z.boolean().optional(),
            sms: z.boolean().optional(),
            push: z.boolean().optional()
        }).optional(),
        preferences: z.object({
            language: z.string().length(2, 'Language must be a 2-letter code').optional(),
            timezone: z.string().optional(),
            currency: z.string().length(3, 'Currency must be a 3-letter code').optional(),
            dateFormat: z.string().optional()
        }).optional(),
        customFields: z.record(z.any()).optional(),
        tags: z.array(z.string()).optional(),
        notes: z.string().optional()
    }).optional()
});
export const UpdateCompanyRequestSchema = CreateCompanyRequestSchema.partial().omit({ organizationId: true });
export const DeleteCompanyRequestSchema = z.object({
    companyId: z.string().uuid('Invalid company ID format')
});
export const GetCompanyRequestSchema = z.object({
    companyId: z.string().uuid('Invalid company ID format')
});
export const SearchCompaniesRequestSchema = z.object({
    organizationId: z.string().uuid('Invalid organization ID format'),
    query: z.string().optional(),
    type: z.enum(['customer', 'supplier', 'partner', 'prospect', 'competitor']).optional(),
    status: z.enum(['active', 'inactive', 'suspended', 'prospect', 'lead']).optional(),
    size: z.enum(['startup', 'small', 'medium', 'large', 'enterprise']).optional(),
    industry: z.string().optional(),
    source: z.enum(['website', 'referral', 'cold_call', 'email', 'social_media', 'event', 'other']).optional(),
    assignedUserId: z.string().uuid('Invalid assigned user ID format').optional(),
    parentCompanyId: z.string().uuid('Invalid parent company ID format').optional(),
    isActive: z.boolean().optional(),
    hasParentCompany: z.boolean().optional(),
    isAssigned: z.boolean().optional(),
    leadScoreMin: z.number().int().min(0).max(100).optional(),
    leadScoreMax: z.number().int().min(0).max(100).optional(),
    revenueMin: z.number().min(0).optional(),
    revenueMax: z.number().min(0).optional(),
    currency: z.string().length(3).optional(),
    employeeCountMin: z.number().int().min(0).optional(),
    employeeCountMax: z.number().int().min(0).optional(),
    foundedYearMin: z.number().int().min(1800).optional(),
    foundedYearMax: z.number().int().min(1800).optional(),
    lastContactAfter: z.coerce.date().optional(),
    lastContactBefore: z.coerce.date().optional(),
    nextFollowUpAfter: z.coerce.date().optional(),
    nextFollowUpBefore: z.coerce.date().optional(),
    createdAfter: z.coerce.date().optional(),
    createdBefore: z.coerce.date().optional(),
    updatedAfter: z.coerce.date().optional(),
    updatedBefore: z.coerce.date().optional(),
    tags: z.array(z.string()).optional(),
    page: z.coerce.number().int().min(1, 'Page must be at least 1').default(1),
    limit: z.coerce.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(20),
    sortBy: z.enum(['name', 'type', 'status', 'size', 'industry', 'source', 'leadScore', 'annualRevenue', 'employeeCount', 'foundedYear', 'lastContactDate', 'nextFollowUpDate', 'createdAt', 'updatedAt']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc')
});
export const BulkUpdateCompaniesRequestSchema = z.object({
    companyIds: z.array(z.string().uuid('Invalid company ID format')).min(1, 'At least one company ID is required').max(100, 'Cannot update more than 100 companies at once'),
    updates: UpdateCompanyRequestSchema
});
export const BulkDeleteCompaniesRequestSchema = z.object({
    companyIds: z.array(z.string().uuid('Invalid company ID format')).min(1, 'At least one company ID is required').max(100, 'Cannot delete more than 100 companies at once')
});
export const CompanyResponseSchema = z.object({
    id: z.string().uuid(),
    organizationId: z.string().uuid(),
    name: z.string(),
    legalName: z.string().nullable(),
    type: z.enum(['customer', 'supplier', 'partner', 'prospect', 'competitor']),
    status: z.enum(['active', 'inactive', 'suspended', 'prospect', 'lead']),
    size: z.enum(['startup', 'small', 'medium', 'large', 'enterprise']),
    industry: z.string(),
    source: z.enum(['website', 'referral', 'cold_call', 'email', 'social_media', 'event', 'other']),
    website: z.string().nullable(),
    email: z.string().nullable(),
    phone: z.string().nullable(),
    address: z.object({
        street: z.string(),
        city: z.string(),
        state: z.string().nullable(),
        postalCode: z.string(),
        country: z.string(),
        countryCode: z.string()
    }).nullable(),
    billingAddress: z.object({
        street: z.string(),
        city: z.string(),
        state: z.string().nullable(),
        postalCode: z.string(),
        country: z.string(),
        countryCode: z.string()
    }).nullable(),
    shippingAddress: z.object({
        street: z.string(),
        city: z.string(),
        state: z.string().nullable(),
        postalCode: z.string(),
        country: z.string(),
        countryCode: z.string()
    }).nullable(),
    taxId: z.string().nullable(),
    vatNumber: z.string().nullable(),
    registrationNumber: z.string().nullable(),
    description: z.string().nullable(),
    settings: z.object({
        notifications: z.object({
            email: z.boolean(),
            sms: z.boolean(),
            push: z.boolean()
        }),
        preferences: z.object({
            language: z.string(),
            timezone: z.string(),
            currency: z.string(),
            dateFormat: z.string()
        }),
        customFields: z.record(z.any()),
        tags: z.array(z.string()),
        notes: z.string()
    }),
    annualRevenue: z.object({
        amount: z.number(),
        currency: z.string()
    }).nullable(),
    employeeCount: z.number().int().nullable(),
    foundedYear: z.number().int().nullable(),
    parentCompanyId: z.string().uuid().nullable(),
    assignedUserId: z.string().uuid().nullable(),
    lastContactDate: z.date().nullable(),
    nextFollowUpDate: z.date().nullable(),
    leadScore: z.number().int().nullable(),
    leadScoreLevel: z.enum(['low', 'medium', 'high']),
    isActive: z.boolean(),
    isCustomer: z.boolean(),
    isSupplier: z.boolean(),
    isPartner: z.boolean(),
    isProspect: z.boolean(),
    isLead: z.boolean(),
    isAssigned: z.boolean(),
    hasParentCompany: z.boolean(),
    isOverdueForFollowUp: z.boolean(),
    daysSinceLastContact: z.number().int(),
    daysUntilFollowUp: z.number().int(),
    createdAt: z.date(),
    updatedAt: z.date()
});
export const CompanyListResponseSchema = z.object({
    companies: z.array(CompanyResponseSchema),
    total: z.number().int().min(0),
    page: z.number().int().min(1),
    limit: z.number().int().min(1),
    totalPages: z.number().int().min(0),
    hasNext: z.boolean(),
    hasPrevious: z.boolean()
});
export const CompanyStatsResponseSchema = z.object({
    total: z.number().int().min(0),
    byType: z.record(z.string(), z.number().int().min(0)),
    byStatus: z.record(z.string(), z.number().int().min(0)),
    bySize: z.record(z.string(), z.number().int().min(0)),
    byIndustry: z.record(z.string(), z.number().int().min(0)),
    bySource: z.record(z.string(), z.number().int().min(0)),
    active: z.number().int().min(0),
    inactive: z.number().int().min(0),
    customers: z.number().int().min(0),
    suppliers: z.number().int().min(0),
    partners: z.number().int().min(0),
    prospects: z.number().int().min(0),
    leads: z.number().int().min(0),
    competitors: z.number().int().min(0),
    assigned: z.number().int().min(0),
    unassigned: z.number().int().min(0),
    withParentCompany: z.number().int().min(0),
    overdueForFollowUp: z.number().int().min(0),
    highScoreLeads: z.number().int().min(0),
    mediumScoreLeads: z.number().int().min(0),
    lowScoreLeads: z.number().int().min(0),
    averageLeadScore: z.number(),
    totalAnnualRevenue: z.number(),
    averageAnnualRevenue: z.number(),
    totalEmployees: z.number().int().min(0),
    averageEmployees: z.number(),
    companiesByYear: z.record(z.string(), z.number().int().min(0)),
    companiesByMonth: z.record(z.string(), z.number().int().min(0)),
    topIndustries: z.array(z.object({
        industry: z.string(),
        count: z.number().int().min(0)
    })),
    topSources: z.array(z.object({
        source: z.string(),
        count: z.number().int().min(0)
    })),
    topAssignedUsers: z.array(z.object({
        userId: z.string(),
        count: z.number().int().min(0)
    }))
});
export const validateCreateCompanyRequest = (data) => {
    return CreateCompanyRequestSchema.parse(data);
};
export const validateUpdateCompanyRequest = (data) => {
    return UpdateCompanyRequestSchema.parse(data);
};
export const validateDeleteCompanyRequest = (data) => {
    return DeleteCompanyRequestSchema.parse(data);
};
export const validateGetCompanyRequest = (data) => {
    return GetCompanyRequestSchema.parse(data);
};
export const validateSearchCompaniesRequest = (data) => {
    return SearchCompaniesRequestSchema.parse(data);
};
export const validateBulkUpdateCompaniesRequest = (data) => {
    return BulkUpdateCompaniesRequestSchema.parse(data);
};
export const validateBulkDeleteCompaniesRequest = (data) => {
    return BulkDeleteCompaniesRequestSchema.parse(data);
};
export const transformCompanyToResponse = (company) => {
    return {
        id: company.id,
        organizationId: company.organizationId,
        name: company.name,
        legalName: company.legalName,
        type: company.type,
        status: company.status,
        size: company.size,
        industry: company.industry,
        source: company.source,
        website: company.website,
        email: company.email,
        phone: company.phone,
        address: company.address,
        billingAddress: company.billingAddress,
        shippingAddress: company.shippingAddress,
        taxId: company.taxId,
        vatNumber: company.vatNumber,
        registrationNumber: company.registrationNumber,
        description: company.description,
        settings: company.settings,
        annualRevenue: company.annualRevenue,
        employeeCount: company.employeeCount,
        foundedYear: company.foundedYear,
        parentCompanyId: company.parentCompanyId,
        assignedUserId: company.assignedUserId,
        lastContactDate: company.lastContactDate,
        nextFollowUpDate: company.nextFollowUpDate,
        leadScore: company.leadScore,
        leadScoreLevel: company.leadScoreLevel,
        isActive: company.isActive,
        isCustomer: company.isCustomer,
        isSupplier: company.isSupplier,
        isPartner: company.isPartner,
        isProspect: company.isProspect,
        isLead: company.isLead,
        isAssigned: company.isAssigned,
        hasParentCompany: company.hasParentCompany,
        isOverdueForFollowUp: company.isOverdueForFollowUp,
        daysSinceLastContact: company.daysSinceLastContact,
        daysUntilFollowUp: company.daysUntilFollowUp,
        createdAt: company.createdAt,
        updatedAt: company.updatedAt
    };
};
export const transformCompanyListToResponse = (companyList) => {
    return {
        companies: companyList.companies.map(transformCompanyToResponse),
        total: companyList.total,
        page: companyList.page,
        limit: companyList.limit,
        totalPages: companyList.totalPages,
        hasNext: companyList.hasNext,
        hasPrevious: companyList.hasPrevious
    };
};
export const transformCompanyStatsToResponse = (stats) => {
    return {
        total: stats.total,
        byType: stats.byType,
        byStatus: stats.byStatus,
        bySize: stats.bySize,
        byIndustry: stats.byIndustry,
        bySource: stats.bySource,
        active: stats.active,
        inactive: stats.inactive,
        customers: stats.customers,
        suppliers: stats.suppliers,
        partners: stats.partners,
        prospects: stats.prospects,
        leads: stats.leads,
        competitors: stats.competitors,
        assigned: stats.assigned,
        unassigned: stats.unassigned,
        withParentCompany: stats.withParentCompany,
        overdueForFollowUp: stats.overdueForFollowUp,
        highScoreLeads: stats.highScoreLeads,
        mediumScoreLeads: stats.mediumScoreLeads,
        lowScoreLeads: stats.lowScoreLeads,
        averageLeadScore: stats.averageLeadScore,
        totalAnnualRevenue: stats.totalAnnualRevenue,
        averageAnnualRevenue: stats.averageAnnualRevenue,
        totalEmployees: stats.totalEmployees,
        averageEmployees: stats.averageEmployees,
        companiesByYear: stats.companiesByYear,
        companiesByMonth: stats.companiesByMonth,
        topIndustries: stats.topIndustries,
        topSources: stats.topSources,
        topAssignedUsers: stats.topAssignedUsers
    };
};
//# sourceMappingURL=company.dto.js.map