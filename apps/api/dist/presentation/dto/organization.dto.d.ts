import { z } from 'zod';
export declare const CreateOrganizationRequestSchema: z.ZodObject<{
    name: z.ZodString;
    slug: z.ZodEffects<z.ZodString, string, string>;
    description: z.ZodOptional<z.ZodString>;
    website: z.ZodOptional<z.ZodString>;
    logo: z.ZodOptional<z.ZodString>;
    settings: z.ZodOptional<z.ZodObject<{
        timezone: z.ZodDefault<z.ZodString>;
        currency: z.ZodDefault<z.ZodString>;
        language: z.ZodDefault<z.ZodString>;
        dateFormat: z.ZodDefault<z.ZodString>;
        notifications: z.ZodDefault<z.ZodObject<{
            email: z.ZodDefault<z.ZodBoolean>;
            push: z.ZodDefault<z.ZodBoolean>;
            sms: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            push?: boolean;
            email?: boolean;
            sms?: boolean;
        }, {
            push?: boolean;
            email?: boolean;
            sms?: boolean;
        }>>;
        features: z.ZodDefault<z.ZodObject<{
            ai: z.ZodDefault<z.ZodBoolean>;
            analytics: z.ZodDefault<z.ZodBoolean>;
            integrations: z.ZodDefault<z.ZodBoolean>;
            customFields: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            ai?: boolean;
            analytics?: boolean;
            integrations?: boolean;
            customFields?: boolean;
        }, {
            ai?: boolean;
            analytics?: boolean;
            integrations?: boolean;
            customFields?: boolean;
        }>>;
        limits: z.ZodDefault<z.ZodObject<{
            users: z.ZodDefault<z.ZodNumber>;
            companies: z.ZodDefault<z.ZodNumber>;
            contacts: z.ZodDefault<z.ZodNumber>;
            products: z.ZodDefault<z.ZodNumber>;
            invoices: z.ZodDefault<z.ZodNumber>;
            storage: z.ZodDefault<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            users?: number;
            companies?: number;
            contacts?: number;
            invoices?: number;
            products?: number;
            storage?: number;
        }, {
            users?: number;
            companies?: number;
            contacts?: number;
            invoices?: number;
            products?: number;
            storage?: number;
        }>>;
    }, "strip", z.ZodTypeAny, {
        language?: string;
        features?: {
            ai?: boolean;
            analytics?: boolean;
            integrations?: boolean;
            customFields?: boolean;
        };
        currency?: string;
        notifications?: {
            push?: boolean;
            email?: boolean;
            sms?: boolean;
        };
        timezone?: string;
        dateFormat?: string;
        limits?: {
            users?: number;
            companies?: number;
            contacts?: number;
            invoices?: number;
            products?: number;
            storage?: number;
        };
    }, {
        language?: string;
        features?: {
            ai?: boolean;
            analytics?: boolean;
            integrations?: boolean;
            customFields?: boolean;
        };
        currency?: string;
        notifications?: {
            push?: boolean;
            email?: boolean;
            sms?: boolean;
        };
        timezone?: string;
        dateFormat?: string;
        limits?: {
            users?: number;
            companies?: number;
            contacts?: number;
            invoices?: number;
            products?: number;
            storage?: number;
        };
    }>>;
    subscriptionTier: z.ZodDefault<z.ZodEnum<["free", "basic", "pro", "enterprise"]>>;
    billingEmail: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name?: string;
    website?: string;
    description?: string;
    slug?: string;
    settings?: {
        language?: string;
        features?: {
            ai?: boolean;
            analytics?: boolean;
            integrations?: boolean;
            customFields?: boolean;
        };
        currency?: string;
        notifications?: {
            push?: boolean;
            email?: boolean;
            sms?: boolean;
        };
        timezone?: string;
        dateFormat?: string;
        limits?: {
            users?: number;
            companies?: number;
            contacts?: number;
            invoices?: number;
            products?: number;
            storage?: number;
        };
    };
    logo?: string;
    subscriptionTier?: "free" | "enterprise" | "basic" | "pro";
    billingEmail?: string;
}, {
    name?: string;
    website?: string;
    description?: string;
    slug?: string;
    settings?: {
        language?: string;
        features?: {
            ai?: boolean;
            analytics?: boolean;
            integrations?: boolean;
            customFields?: boolean;
        };
        currency?: string;
        notifications?: {
            push?: boolean;
            email?: boolean;
            sms?: boolean;
        };
        timezone?: string;
        dateFormat?: string;
        limits?: {
            users?: number;
            companies?: number;
            contacts?: number;
            invoices?: number;
            products?: number;
            storage?: number;
        };
    };
    logo?: string;
    subscriptionTier?: "free" | "enterprise" | "basic" | "pro";
    billingEmail?: string;
}>;
export declare const UpdateOrganizationRequestSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    website: z.ZodOptional<z.ZodString>;
    logo: z.ZodOptional<z.ZodString>;
    settings: z.ZodOptional<z.ZodObject<{
        timezone: z.ZodOptional<z.ZodString>;
        currency: z.ZodOptional<z.ZodString>;
        language: z.ZodOptional<z.ZodString>;
        dateFormat: z.ZodOptional<z.ZodString>;
        notifications: z.ZodOptional<z.ZodObject<{
            email: z.ZodOptional<z.ZodBoolean>;
            push: z.ZodOptional<z.ZodBoolean>;
            sms: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            push?: boolean;
            email?: boolean;
            sms?: boolean;
        }, {
            push?: boolean;
            email?: boolean;
            sms?: boolean;
        }>>;
        features: z.ZodOptional<z.ZodObject<{
            ai: z.ZodOptional<z.ZodBoolean>;
            analytics: z.ZodOptional<z.ZodBoolean>;
            integrations: z.ZodOptional<z.ZodBoolean>;
            customFields: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            ai?: boolean;
            analytics?: boolean;
            integrations?: boolean;
            customFields?: boolean;
        }, {
            ai?: boolean;
            analytics?: boolean;
            integrations?: boolean;
            customFields?: boolean;
        }>>;
        limits: z.ZodOptional<z.ZodObject<{
            users: z.ZodOptional<z.ZodNumber>;
            companies: z.ZodOptional<z.ZodNumber>;
            contacts: z.ZodOptional<z.ZodNumber>;
            products: z.ZodOptional<z.ZodNumber>;
            invoices: z.ZodOptional<z.ZodNumber>;
            storage: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            users?: number;
            companies?: number;
            contacts?: number;
            invoices?: number;
            products?: number;
            storage?: number;
        }, {
            users?: number;
            companies?: number;
            contacts?: number;
            invoices?: number;
            products?: number;
            storage?: number;
        }>>;
    }, "strip", z.ZodTypeAny, {
        language?: string;
        features?: {
            ai?: boolean;
            analytics?: boolean;
            integrations?: boolean;
            customFields?: boolean;
        };
        currency?: string;
        notifications?: {
            push?: boolean;
            email?: boolean;
            sms?: boolean;
        };
        timezone?: string;
        dateFormat?: string;
        limits?: {
            users?: number;
            companies?: number;
            contacts?: number;
            invoices?: number;
            products?: number;
            storage?: number;
        };
    }, {
        language?: string;
        features?: {
            ai?: boolean;
            analytics?: boolean;
            integrations?: boolean;
            customFields?: boolean;
        };
        currency?: string;
        notifications?: {
            push?: boolean;
            email?: boolean;
            sms?: boolean;
        };
        timezone?: string;
        dateFormat?: string;
        limits?: {
            users?: number;
            companies?: number;
            contacts?: number;
            invoices?: number;
            products?: number;
            storage?: number;
        };
    }>>;
    subscriptionTier: z.ZodOptional<z.ZodEnum<["free", "basic", "pro", "enterprise"]>>;
    status: z.ZodOptional<z.ZodEnum<["active", "inactive", "suspended", "trial"]>>;
    billingEmail: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status?: "active" | "inactive" | "suspended" | "trial";
    name?: string;
    website?: string;
    description?: string;
    settings?: {
        language?: string;
        features?: {
            ai?: boolean;
            analytics?: boolean;
            integrations?: boolean;
            customFields?: boolean;
        };
        currency?: string;
        notifications?: {
            push?: boolean;
            email?: boolean;
            sms?: boolean;
        };
        timezone?: string;
        dateFormat?: string;
        limits?: {
            users?: number;
            companies?: number;
            contacts?: number;
            invoices?: number;
            products?: number;
            storage?: number;
        };
    };
    logo?: string;
    subscriptionTier?: "free" | "enterprise" | "basic" | "pro";
    billingEmail?: string;
}, {
    status?: "active" | "inactive" | "suspended" | "trial";
    name?: string;
    website?: string;
    description?: string;
    settings?: {
        language?: string;
        features?: {
            ai?: boolean;
            analytics?: boolean;
            integrations?: boolean;
            customFields?: boolean;
        };
        currency?: string;
        notifications?: {
            push?: boolean;
            email?: boolean;
            sms?: boolean;
        };
        timezone?: string;
        dateFormat?: string;
        limits?: {
            users?: number;
            companies?: number;
            contacts?: number;
            invoices?: number;
            products?: number;
            storage?: number;
        };
    };
    logo?: string;
    subscriptionTier?: "free" | "enterprise" | "basic" | "pro";
    billingEmail?: string;
}>;
export declare const DeleteOrganizationRequestSchema: z.ZodObject<{
    organizationId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    organizationId?: string;
}, {
    organizationId?: string;
}>;
export declare const GetOrganizationRequestSchema: z.ZodObject<{
    organizationId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    organizationId?: string;
}, {
    organizationId?: string;
}>;
export declare const SearchOrganizationsRequestSchema: z.ZodObject<{
    query: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["active", "inactive", "suspended", "trial"]>>;
    subscriptionTier: z.ZodOptional<z.ZodEnum<["free", "basic", "pro", "enterprise"]>>;
    isTrial: z.ZodOptional<z.ZodBoolean>;
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    sortBy: z.ZodDefault<z.ZodEnum<["name", "slug", "createdAt", "trialEndsAt"]>>;
    sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    query?: string;
    status?: "active" | "inactive" | "suspended" | "trial";
    page?: number;
    limit?: number;
    subscriptionTier?: "free" | "enterprise" | "basic" | "pro";
    sortBy?: "name" | "createdAt" | "slug" | "trialEndsAt";
    sortOrder?: "asc" | "desc";
    isTrial?: boolean;
}, {
    query?: string;
    status?: "active" | "inactive" | "suspended" | "trial";
    page?: number;
    limit?: number;
    subscriptionTier?: "free" | "enterprise" | "basic" | "pro";
    sortBy?: "name" | "createdAt" | "slug" | "trialEndsAt";
    sortOrder?: "asc" | "desc";
    isTrial?: boolean;
}>;
export declare const OrganizationResponseSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    slug: z.ZodString;
    description: z.ZodNullable<z.ZodString>;
    website: z.ZodNullable<z.ZodString>;
    logo: z.ZodNullable<z.ZodString>;
    settings: z.ZodObject<{
        timezone: z.ZodString;
        currency: z.ZodString;
        language: z.ZodString;
        dateFormat: z.ZodString;
        notifications: z.ZodObject<{
            email: z.ZodBoolean;
            push: z.ZodBoolean;
            sms: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            push?: boolean;
            email?: boolean;
            sms?: boolean;
        }, {
            push?: boolean;
            email?: boolean;
            sms?: boolean;
        }>;
        features: z.ZodObject<{
            ai: z.ZodBoolean;
            analytics: z.ZodBoolean;
            integrations: z.ZodBoolean;
            customFields: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            ai?: boolean;
            analytics?: boolean;
            integrations?: boolean;
            customFields?: boolean;
        }, {
            ai?: boolean;
            analytics?: boolean;
            integrations?: boolean;
            customFields?: boolean;
        }>;
        limits: z.ZodObject<{
            users: z.ZodNumber;
            companies: z.ZodNumber;
            contacts: z.ZodNumber;
            products: z.ZodNumber;
            invoices: z.ZodNumber;
            storage: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            users?: number;
            companies?: number;
            contacts?: number;
            invoices?: number;
            products?: number;
            storage?: number;
        }, {
            users?: number;
            companies?: number;
            contacts?: number;
            invoices?: number;
            products?: number;
            storage?: number;
        }>;
    }, "strip", z.ZodTypeAny, {
        language?: string;
        features?: {
            ai?: boolean;
            analytics?: boolean;
            integrations?: boolean;
            customFields?: boolean;
        };
        currency?: string;
        notifications?: {
            push?: boolean;
            email?: boolean;
            sms?: boolean;
        };
        timezone?: string;
        dateFormat?: string;
        limits?: {
            users?: number;
            companies?: number;
            contacts?: number;
            invoices?: number;
            products?: number;
            storage?: number;
        };
    }, {
        language?: string;
        features?: {
            ai?: boolean;
            analytics?: boolean;
            integrations?: boolean;
            customFields?: boolean;
        };
        currency?: string;
        notifications?: {
            push?: boolean;
            email?: boolean;
            sms?: boolean;
        };
        timezone?: string;
        dateFormat?: string;
        limits?: {
            users?: number;
            companies?: number;
            contacts?: number;
            invoices?: number;
            products?: number;
            storage?: number;
        };
    }>;
    subscriptionTier: z.ZodEnum<["free", "basic", "pro", "enterprise"]>;
    status: z.ZodEnum<["active", "inactive", "suspended", "trial"]>;
    trialEndsAt: z.ZodNullable<z.ZodDate>;
    billingEmail: z.ZodNullable<z.ZodString>;
    isActive: z.ZodBoolean;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    status?: "active" | "inactive" | "suspended" | "trial";
    name?: string;
    id?: string;
    website?: string;
    createdAt?: Date;
    updatedAt?: Date;
    description?: string;
    isActive?: boolean;
    slug?: string;
    settings?: {
        language?: string;
        features?: {
            ai?: boolean;
            analytics?: boolean;
            integrations?: boolean;
            customFields?: boolean;
        };
        currency?: string;
        notifications?: {
            push?: boolean;
            email?: boolean;
            sms?: boolean;
        };
        timezone?: string;
        dateFormat?: string;
        limits?: {
            users?: number;
            companies?: number;
            contacts?: number;
            invoices?: number;
            products?: number;
            storage?: number;
        };
    };
    logo?: string;
    subscriptionTier?: "free" | "enterprise" | "basic" | "pro";
    trialEndsAt?: Date;
    billingEmail?: string;
}, {
    status?: "active" | "inactive" | "suspended" | "trial";
    name?: string;
    id?: string;
    website?: string;
    createdAt?: Date;
    updatedAt?: Date;
    description?: string;
    isActive?: boolean;
    slug?: string;
    settings?: {
        language?: string;
        features?: {
            ai?: boolean;
            analytics?: boolean;
            integrations?: boolean;
            customFields?: boolean;
        };
        currency?: string;
        notifications?: {
            push?: boolean;
            email?: boolean;
            sms?: boolean;
        };
        timezone?: string;
        dateFormat?: string;
        limits?: {
            users?: number;
            companies?: number;
            contacts?: number;
            invoices?: number;
            products?: number;
            storage?: number;
        };
    };
    logo?: string;
    subscriptionTier?: "free" | "enterprise" | "basic" | "pro";
    trialEndsAt?: Date;
    billingEmail?: string;
}>;
export declare const OrganizationListResponseSchema: z.ZodObject<{
    organizations: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        slug: z.ZodString;
        description: z.ZodNullable<z.ZodString>;
        website: z.ZodNullable<z.ZodString>;
        logo: z.ZodNullable<z.ZodString>;
        settings: z.ZodObject<{
            timezone: z.ZodString;
            currency: z.ZodString;
            language: z.ZodString;
            dateFormat: z.ZodString;
            notifications: z.ZodObject<{
                email: z.ZodBoolean;
                push: z.ZodBoolean;
                sms: z.ZodBoolean;
            }, "strip", z.ZodTypeAny, {
                push?: boolean;
                email?: boolean;
                sms?: boolean;
            }, {
                push?: boolean;
                email?: boolean;
                sms?: boolean;
            }>;
            features: z.ZodObject<{
                ai: z.ZodBoolean;
                analytics: z.ZodBoolean;
                integrations: z.ZodBoolean;
                customFields: z.ZodBoolean;
            }, "strip", z.ZodTypeAny, {
                ai?: boolean;
                analytics?: boolean;
                integrations?: boolean;
                customFields?: boolean;
            }, {
                ai?: boolean;
                analytics?: boolean;
                integrations?: boolean;
                customFields?: boolean;
            }>;
            limits: z.ZodObject<{
                users: z.ZodNumber;
                companies: z.ZodNumber;
                contacts: z.ZodNumber;
                products: z.ZodNumber;
                invoices: z.ZodNumber;
                storage: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                users?: number;
                companies?: number;
                contacts?: number;
                invoices?: number;
                products?: number;
                storage?: number;
            }, {
                users?: number;
                companies?: number;
                contacts?: number;
                invoices?: number;
                products?: number;
                storage?: number;
            }>;
        }, "strip", z.ZodTypeAny, {
            language?: string;
            features?: {
                ai?: boolean;
                analytics?: boolean;
                integrations?: boolean;
                customFields?: boolean;
            };
            currency?: string;
            notifications?: {
                push?: boolean;
                email?: boolean;
                sms?: boolean;
            };
            timezone?: string;
            dateFormat?: string;
            limits?: {
                users?: number;
                companies?: number;
                contacts?: number;
                invoices?: number;
                products?: number;
                storage?: number;
            };
        }, {
            language?: string;
            features?: {
                ai?: boolean;
                analytics?: boolean;
                integrations?: boolean;
                customFields?: boolean;
            };
            currency?: string;
            notifications?: {
                push?: boolean;
                email?: boolean;
                sms?: boolean;
            };
            timezone?: string;
            dateFormat?: string;
            limits?: {
                users?: number;
                companies?: number;
                contacts?: number;
                invoices?: number;
                products?: number;
                storage?: number;
            };
        }>;
        subscriptionTier: z.ZodEnum<["free", "basic", "pro", "enterprise"]>;
        status: z.ZodEnum<["active", "inactive", "suspended", "trial"]>;
        trialEndsAt: z.ZodNullable<z.ZodDate>;
        billingEmail: z.ZodNullable<z.ZodString>;
        isActive: z.ZodBoolean;
        createdAt: z.ZodDate;
        updatedAt: z.ZodDate;
    }, "strip", z.ZodTypeAny, {
        status?: "active" | "inactive" | "suspended" | "trial";
        name?: string;
        id?: string;
        website?: string;
        createdAt?: Date;
        updatedAt?: Date;
        description?: string;
        isActive?: boolean;
        slug?: string;
        settings?: {
            language?: string;
            features?: {
                ai?: boolean;
                analytics?: boolean;
                integrations?: boolean;
                customFields?: boolean;
            };
            currency?: string;
            notifications?: {
                push?: boolean;
                email?: boolean;
                sms?: boolean;
            };
            timezone?: string;
            dateFormat?: string;
            limits?: {
                users?: number;
                companies?: number;
                contacts?: number;
                invoices?: number;
                products?: number;
                storage?: number;
            };
        };
        logo?: string;
        subscriptionTier?: "free" | "enterprise" | "basic" | "pro";
        trialEndsAt?: Date;
        billingEmail?: string;
    }, {
        status?: "active" | "inactive" | "suspended" | "trial";
        name?: string;
        id?: string;
        website?: string;
        createdAt?: Date;
        updatedAt?: Date;
        description?: string;
        isActive?: boolean;
        slug?: string;
        settings?: {
            language?: string;
            features?: {
                ai?: boolean;
                analytics?: boolean;
                integrations?: boolean;
                customFields?: boolean;
            };
            currency?: string;
            notifications?: {
                push?: boolean;
                email?: boolean;
                sms?: boolean;
            };
            timezone?: string;
            dateFormat?: string;
            limits?: {
                users?: number;
                companies?: number;
                contacts?: number;
                invoices?: number;
                products?: number;
                storage?: number;
            };
        };
        logo?: string;
        subscriptionTier?: "free" | "enterprise" | "basic" | "pro";
        trialEndsAt?: Date;
        billingEmail?: string;
    }>, "many">;
    total: z.ZodNumber;
    page: z.ZodNumber;
    limit: z.ZodNumber;
    totalPages: z.ZodNumber;
    hasNext: z.ZodBoolean;
    hasPrevious: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    page?: number;
    limit?: number;
    total?: number;
    organizations?: {
        status?: "active" | "inactive" | "suspended" | "trial";
        name?: string;
        id?: string;
        website?: string;
        createdAt?: Date;
        updatedAt?: Date;
        description?: string;
        isActive?: boolean;
        slug?: string;
        settings?: {
            language?: string;
            features?: {
                ai?: boolean;
                analytics?: boolean;
                integrations?: boolean;
                customFields?: boolean;
            };
            currency?: string;
            notifications?: {
                push?: boolean;
                email?: boolean;
                sms?: boolean;
            };
            timezone?: string;
            dateFormat?: string;
            limits?: {
                users?: number;
                companies?: number;
                contacts?: number;
                invoices?: number;
                products?: number;
                storage?: number;
            };
        };
        logo?: string;
        subscriptionTier?: "free" | "enterprise" | "basic" | "pro";
        trialEndsAt?: Date;
        billingEmail?: string;
    }[];
    totalPages?: number;
    hasNext?: boolean;
    hasPrevious?: boolean;
}, {
    page?: number;
    limit?: number;
    total?: number;
    organizations?: {
        status?: "active" | "inactive" | "suspended" | "trial";
        name?: string;
        id?: string;
        website?: string;
        createdAt?: Date;
        updatedAt?: Date;
        description?: string;
        isActive?: boolean;
        slug?: string;
        settings?: {
            language?: string;
            features?: {
                ai?: boolean;
                analytics?: boolean;
                integrations?: boolean;
                customFields?: boolean;
            };
            currency?: string;
            notifications?: {
                push?: boolean;
                email?: boolean;
                sms?: boolean;
            };
            timezone?: string;
            dateFormat?: string;
            limits?: {
                users?: number;
                companies?: number;
                contacts?: number;
                invoices?: number;
                products?: number;
                storage?: number;
            };
        };
        logo?: string;
        subscriptionTier?: "free" | "enterprise" | "basic" | "pro";
        trialEndsAt?: Date;
        billingEmail?: string;
    }[];
    totalPages?: number;
    hasNext?: boolean;
    hasPrevious?: boolean;
}>;
export declare const OrganizationStatsResponseSchema: z.ZodObject<{
    total: z.ZodNumber;
    byStatus: z.ZodRecord<z.ZodString, z.ZodNumber>;
    bySubscriptionTier: z.ZodRecord<z.ZodString, z.ZodNumber>;
    active: z.ZodNumber;
    inactive: z.ZodNumber;
    trial: z.ZodNumber;
    trialExpired: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    active?: number;
    inactive?: number;
    total?: number;
    trial?: number;
    byStatus?: Record<string, number>;
    bySubscriptionTier?: Record<string, number>;
    trialExpired?: number;
}, {
    active?: number;
    inactive?: number;
    total?: number;
    trial?: number;
    byStatus?: Record<string, number>;
    bySubscriptionTier?: Record<string, number>;
    trialExpired?: number;
}>;
export type CreateOrganizationRequest = z.infer<typeof CreateOrganizationRequestSchema>;
export type UpdateOrganizationRequest = z.infer<typeof UpdateOrganizationRequestSchema>;
export type DeleteOrganizationRequest = z.infer<typeof DeleteOrganizationRequestSchema>;
export type GetOrganizationRequest = z.infer<typeof GetOrganizationRequestSchema>;
export type SearchOrganizationsRequest = z.infer<typeof SearchOrganizationsRequestSchema>;
export type OrganizationResponse = z.infer<typeof OrganizationResponseSchema>;
export type OrganizationListResponse = z.infer<typeof OrganizationListResponseSchema>;
export type OrganizationStatsResponse = z.infer<typeof OrganizationStatsResponseSchema>;
export declare const validateCreateOrganizationRequest: (data: unknown) => CreateOrganizationRequest;
export declare const validateUpdateOrganizationRequest: (data: unknown) => UpdateOrganizationRequest;
export declare const validateDeleteOrganizationRequest: (data: unknown) => DeleteOrganizationRequest;
export declare const validateGetOrganizationRequest: (data: unknown) => GetOrganizationRequest;
export declare const validateSearchOrganizationsRequest: (data: unknown) => SearchOrganizationsRequest;
export declare const transformOrganizationToResponse: (organization: any) => OrganizationResponse;
export declare const transformOrganizationListToResponse: (organizationList: any) => OrganizationListResponse;
export declare const transformOrganizationStatsToResponse: (stats: any) => OrganizationStatsResponse;
//# sourceMappingURL=organization.dto.d.ts.map