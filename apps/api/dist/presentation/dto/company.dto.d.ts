import { z } from 'zod';
export declare const CreateCompanyRequestSchema: z.ZodObject<{
    organizationId: z.ZodString;
    name: z.ZodString;
    legalName: z.ZodOptional<z.ZodString>;
    type: z.ZodEnum<["customer", "supplier", "partner", "prospect", "competitor"]>;
    status: z.ZodEnum<["active", "inactive", "suspended", "prospect", "lead"]>;
    size: z.ZodEnum<["startup", "small", "medium", "large", "enterprise"]>;
    industry: z.ZodString;
    source: z.ZodEnum<["website", "referral", "cold_call", "email", "social_media", "event", "other"]>;
    website: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodObject<{
        street: z.ZodString;
        city: z.ZodString;
        state: z.ZodOptional<z.ZodString>;
        postalCode: z.ZodString;
        country: z.ZodString;
        countryCode: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        street?: string;
        city?: string;
        state?: string;
        country?: string;
        postalCode?: string;
        countryCode?: string;
    }, {
        street?: string;
        city?: string;
        state?: string;
        country?: string;
        postalCode?: string;
        countryCode?: string;
    }>>;
    billingAddress: z.ZodOptional<z.ZodObject<{
        street: z.ZodString;
        city: z.ZodString;
        state: z.ZodOptional<z.ZodString>;
        postalCode: z.ZodString;
        country: z.ZodString;
        countryCode: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        street?: string;
        city?: string;
        state?: string;
        country?: string;
        postalCode?: string;
        countryCode?: string;
    }, {
        street?: string;
        city?: string;
        state?: string;
        country?: string;
        postalCode?: string;
        countryCode?: string;
    }>>;
    shippingAddress: z.ZodOptional<z.ZodObject<{
        street: z.ZodString;
        city: z.ZodString;
        state: z.ZodOptional<z.ZodString>;
        postalCode: z.ZodString;
        country: z.ZodString;
        countryCode: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        street?: string;
        city?: string;
        state?: string;
        country?: string;
        postalCode?: string;
        countryCode?: string;
    }, {
        street?: string;
        city?: string;
        state?: string;
        country?: string;
        postalCode?: string;
        countryCode?: string;
    }>>;
    taxId: z.ZodOptional<z.ZodString>;
    vatNumber: z.ZodOptional<z.ZodString>;
    registrationNumber: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    annualRevenue: z.ZodOptional<z.ZodObject<{
        amount: z.ZodNumber;
        currency: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        amount?: number;
        currency?: string;
    }, {
        amount?: number;
        currency?: string;
    }>>;
    employeeCount: z.ZodOptional<z.ZodNumber>;
    foundedYear: z.ZodOptional<z.ZodNumber>;
    parentCompanyId: z.ZodOptional<z.ZodString>;
    assignedUserId: z.ZodOptional<z.ZodString>;
    nextFollowUpDate: z.ZodOptional<z.ZodDate>;
    leadScore: z.ZodOptional<z.ZodNumber>;
    settings: z.ZodOptional<z.ZodObject<{
        notifications: z.ZodOptional<z.ZodObject<{
            email: z.ZodOptional<z.ZodBoolean>;
            sms: z.ZodOptional<z.ZodBoolean>;
            push: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            push?: boolean;
            email?: boolean;
            sms?: boolean;
        }, {
            push?: boolean;
            email?: boolean;
            sms?: boolean;
        }>>;
        preferences: z.ZodOptional<z.ZodObject<{
            language: z.ZodOptional<z.ZodString>;
            timezone: z.ZodOptional<z.ZodString>;
            currency: z.ZodOptional<z.ZodString>;
            dateFormat: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            language?: string;
            currency?: string;
            timezone?: string;
            dateFormat?: string;
        }, {
            language?: string;
            currency?: string;
            timezone?: string;
            dateFormat?: string;
        }>>;
        customFields: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        notes: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        tags?: string[];
        notes?: string;
        notifications?: {
            push?: boolean;
            email?: boolean;
            sms?: boolean;
        };
        customFields?: Record<string, any>;
        preferences?: {
            language?: string;
            currency?: string;
            timezone?: string;
            dateFormat?: string;
        };
    }, {
        tags?: string[];
        notes?: string;
        notifications?: {
            push?: boolean;
            email?: boolean;
            sms?: boolean;
        };
        customFields?: Record<string, any>;
        preferences?: {
            language?: string;
            currency?: string;
            timezone?: string;
            dateFormat?: string;
        };
    }>>;
}, "strip", z.ZodTypeAny, {
    type?: "prospect" | "customer" | "supplier" | "partner" | "competitor";
    status?: "lead" | "active" | "inactive" | "prospect" | "suspended";
    organizationId?: string;
    name?: string;
    source?: "event" | "email" | "website" | "other" | "referral" | "cold_call" | "social_media";
    size?: "medium" | "enterprise" | "startup" | "small" | "large";
    email?: string;
    phone?: string;
    website?: string;
    industry?: string;
    address?: {
        street?: string;
        city?: string;
        state?: string;
        country?: string;
        postalCode?: string;
        countryCode?: string;
    };
    description?: string;
    settings?: {
        tags?: string[];
        notes?: string;
        notifications?: {
            push?: boolean;
            email?: boolean;
            sms?: boolean;
        };
        customFields?: Record<string, any>;
        preferences?: {
            language?: string;
            currency?: string;
            timezone?: string;
            dateFormat?: string;
        };
    };
    legalName?: string;
    billingAddress?: {
        street?: string;
        city?: string;
        state?: string;
        country?: string;
        postalCode?: string;
        countryCode?: string;
    };
    shippingAddress?: {
        street?: string;
        city?: string;
        state?: string;
        country?: string;
        postalCode?: string;
        countryCode?: string;
    };
    taxId?: string;
    vatNumber?: string;
    registrationNumber?: string;
    annualRevenue?: {
        amount?: number;
        currency?: string;
    };
    employeeCount?: number;
    foundedYear?: number;
    parentCompanyId?: string;
    assignedUserId?: string;
    nextFollowUpDate?: Date;
    leadScore?: number;
}, {
    type?: "prospect" | "customer" | "supplier" | "partner" | "competitor";
    status?: "lead" | "active" | "inactive" | "prospect" | "suspended";
    organizationId?: string;
    name?: string;
    source?: "event" | "email" | "website" | "other" | "referral" | "cold_call" | "social_media";
    size?: "medium" | "enterprise" | "startup" | "small" | "large";
    email?: string;
    phone?: string;
    website?: string;
    industry?: string;
    address?: {
        street?: string;
        city?: string;
        state?: string;
        country?: string;
        postalCode?: string;
        countryCode?: string;
    };
    description?: string;
    settings?: {
        tags?: string[];
        notes?: string;
        notifications?: {
            push?: boolean;
            email?: boolean;
            sms?: boolean;
        };
        customFields?: Record<string, any>;
        preferences?: {
            language?: string;
            currency?: string;
            timezone?: string;
            dateFormat?: string;
        };
    };
    legalName?: string;
    billingAddress?: {
        street?: string;
        city?: string;
        state?: string;
        country?: string;
        postalCode?: string;
        countryCode?: string;
    };
    shippingAddress?: {
        street?: string;
        city?: string;
        state?: string;
        country?: string;
        postalCode?: string;
        countryCode?: string;
    };
    taxId?: string;
    vatNumber?: string;
    registrationNumber?: string;
    annualRevenue?: {
        amount?: number;
        currency?: string;
    };
    employeeCount?: number;
    foundedYear?: number;
    parentCompanyId?: string;
    assignedUserId?: string;
    nextFollowUpDate?: Date;
    leadScore?: number;
}>;
export declare const UpdateCompanyRequestSchema: z.ZodObject<Omit<{
    organizationId: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    legalName: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    type: z.ZodOptional<z.ZodEnum<["customer", "supplier", "partner", "prospect", "competitor"]>>;
    status: z.ZodOptional<z.ZodEnum<["active", "inactive", "suspended", "prospect", "lead"]>>;
    size: z.ZodOptional<z.ZodEnum<["startup", "small", "medium", "large", "enterprise"]>>;
    industry: z.ZodOptional<z.ZodString>;
    source: z.ZodOptional<z.ZodEnum<["website", "referral", "cold_call", "email", "social_media", "event", "other"]>>;
    website: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    email: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    phone: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    address: z.ZodOptional<z.ZodOptional<z.ZodObject<{
        street: z.ZodString;
        city: z.ZodString;
        state: z.ZodOptional<z.ZodString>;
        postalCode: z.ZodString;
        country: z.ZodString;
        countryCode: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        street?: string;
        city?: string;
        state?: string;
        country?: string;
        postalCode?: string;
        countryCode?: string;
    }, {
        street?: string;
        city?: string;
        state?: string;
        country?: string;
        postalCode?: string;
        countryCode?: string;
    }>>>;
    billingAddress: z.ZodOptional<z.ZodOptional<z.ZodObject<{
        street: z.ZodString;
        city: z.ZodString;
        state: z.ZodOptional<z.ZodString>;
        postalCode: z.ZodString;
        country: z.ZodString;
        countryCode: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        street?: string;
        city?: string;
        state?: string;
        country?: string;
        postalCode?: string;
        countryCode?: string;
    }, {
        street?: string;
        city?: string;
        state?: string;
        country?: string;
        postalCode?: string;
        countryCode?: string;
    }>>>;
    shippingAddress: z.ZodOptional<z.ZodOptional<z.ZodObject<{
        street: z.ZodString;
        city: z.ZodString;
        state: z.ZodOptional<z.ZodString>;
        postalCode: z.ZodString;
        country: z.ZodString;
        countryCode: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        street?: string;
        city?: string;
        state?: string;
        country?: string;
        postalCode?: string;
        countryCode?: string;
    }, {
        street?: string;
        city?: string;
        state?: string;
        country?: string;
        postalCode?: string;
        countryCode?: string;
    }>>>;
    taxId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    vatNumber: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    registrationNumber: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    annualRevenue: z.ZodOptional<z.ZodOptional<z.ZodObject<{
        amount: z.ZodNumber;
        currency: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        amount?: number;
        currency?: string;
    }, {
        amount?: number;
        currency?: string;
    }>>>;
    employeeCount: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    foundedYear: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    parentCompanyId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    assignedUserId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    nextFollowUpDate: z.ZodOptional<z.ZodOptional<z.ZodDate>>;
    leadScore: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    settings: z.ZodOptional<z.ZodOptional<z.ZodObject<{
        notifications: z.ZodOptional<z.ZodObject<{
            email: z.ZodOptional<z.ZodBoolean>;
            sms: z.ZodOptional<z.ZodBoolean>;
            push: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            push?: boolean;
            email?: boolean;
            sms?: boolean;
        }, {
            push?: boolean;
            email?: boolean;
            sms?: boolean;
        }>>;
        preferences: z.ZodOptional<z.ZodObject<{
            language: z.ZodOptional<z.ZodString>;
            timezone: z.ZodOptional<z.ZodString>;
            currency: z.ZodOptional<z.ZodString>;
            dateFormat: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            language?: string;
            currency?: string;
            timezone?: string;
            dateFormat?: string;
        }, {
            language?: string;
            currency?: string;
            timezone?: string;
            dateFormat?: string;
        }>>;
        customFields: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        notes: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        tags?: string[];
        notes?: string;
        notifications?: {
            push?: boolean;
            email?: boolean;
            sms?: boolean;
        };
        customFields?: Record<string, any>;
        preferences?: {
            language?: string;
            currency?: string;
            timezone?: string;
            dateFormat?: string;
        };
    }, {
        tags?: string[];
        notes?: string;
        notifications?: {
            push?: boolean;
            email?: boolean;
            sms?: boolean;
        };
        customFields?: Record<string, any>;
        preferences?: {
            language?: string;
            currency?: string;
            timezone?: string;
            dateFormat?: string;
        };
    }>>>;
}, "organizationId">, "strip", z.ZodTypeAny, {
    type?: "prospect" | "customer" | "supplier" | "partner" | "competitor";
    status?: "lead" | "active" | "inactive" | "prospect" | "suspended";
    name?: string;
    source?: "event" | "email" | "website" | "other" | "referral" | "cold_call" | "social_media";
    size?: "medium" | "enterprise" | "startup" | "small" | "large";
    email?: string;
    phone?: string;
    website?: string;
    industry?: string;
    address?: {
        street?: string;
        city?: string;
        state?: string;
        country?: string;
        postalCode?: string;
        countryCode?: string;
    };
    description?: string;
    settings?: {
        tags?: string[];
        notes?: string;
        notifications?: {
            push?: boolean;
            email?: boolean;
            sms?: boolean;
        };
        customFields?: Record<string, any>;
        preferences?: {
            language?: string;
            currency?: string;
            timezone?: string;
            dateFormat?: string;
        };
    };
    legalName?: string;
    billingAddress?: {
        street?: string;
        city?: string;
        state?: string;
        country?: string;
        postalCode?: string;
        countryCode?: string;
    };
    shippingAddress?: {
        street?: string;
        city?: string;
        state?: string;
        country?: string;
        postalCode?: string;
        countryCode?: string;
    };
    taxId?: string;
    vatNumber?: string;
    registrationNumber?: string;
    annualRevenue?: {
        amount?: number;
        currency?: string;
    };
    employeeCount?: number;
    foundedYear?: number;
    parentCompanyId?: string;
    assignedUserId?: string;
    nextFollowUpDate?: Date;
    leadScore?: number;
}, {
    type?: "prospect" | "customer" | "supplier" | "partner" | "competitor";
    status?: "lead" | "active" | "inactive" | "prospect" | "suspended";
    name?: string;
    source?: "event" | "email" | "website" | "other" | "referral" | "cold_call" | "social_media";
    size?: "medium" | "enterprise" | "startup" | "small" | "large";
    email?: string;
    phone?: string;
    website?: string;
    industry?: string;
    address?: {
        street?: string;
        city?: string;
        state?: string;
        country?: string;
        postalCode?: string;
        countryCode?: string;
    };
    description?: string;
    settings?: {
        tags?: string[];
        notes?: string;
        notifications?: {
            push?: boolean;
            email?: boolean;
            sms?: boolean;
        };
        customFields?: Record<string, any>;
        preferences?: {
            language?: string;
            currency?: string;
            timezone?: string;
            dateFormat?: string;
        };
    };
    legalName?: string;
    billingAddress?: {
        street?: string;
        city?: string;
        state?: string;
        country?: string;
        postalCode?: string;
        countryCode?: string;
    };
    shippingAddress?: {
        street?: string;
        city?: string;
        state?: string;
        country?: string;
        postalCode?: string;
        countryCode?: string;
    };
    taxId?: string;
    vatNumber?: string;
    registrationNumber?: string;
    annualRevenue?: {
        amount?: number;
        currency?: string;
    };
    employeeCount?: number;
    foundedYear?: number;
    parentCompanyId?: string;
    assignedUserId?: string;
    nextFollowUpDate?: Date;
    leadScore?: number;
}>;
export declare const DeleteCompanyRequestSchema: z.ZodObject<{
    companyId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    companyId?: string;
}, {
    companyId?: string;
}>;
export declare const GetCompanyRequestSchema: z.ZodObject<{
    companyId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    companyId?: string;
}, {
    companyId?: string;
}>;
export declare const SearchCompaniesRequestSchema: z.ZodObject<{
    organizationId: z.ZodString;
    query: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodEnum<["customer", "supplier", "partner", "prospect", "competitor"]>>;
    status: z.ZodOptional<z.ZodEnum<["active", "inactive", "suspended", "prospect", "lead"]>>;
    size: z.ZodOptional<z.ZodEnum<["startup", "small", "medium", "large", "enterprise"]>>;
    industry: z.ZodOptional<z.ZodString>;
    source: z.ZodOptional<z.ZodEnum<["website", "referral", "cold_call", "email", "social_media", "event", "other"]>>;
    assignedUserId: z.ZodOptional<z.ZodString>;
    parentCompanyId: z.ZodOptional<z.ZodString>;
    isActive: z.ZodOptional<z.ZodBoolean>;
    hasParentCompany: z.ZodOptional<z.ZodBoolean>;
    isAssigned: z.ZodOptional<z.ZodBoolean>;
    leadScoreMin: z.ZodOptional<z.ZodNumber>;
    leadScoreMax: z.ZodOptional<z.ZodNumber>;
    revenueMin: z.ZodOptional<z.ZodNumber>;
    revenueMax: z.ZodOptional<z.ZodNumber>;
    currency: z.ZodOptional<z.ZodString>;
    employeeCountMin: z.ZodOptional<z.ZodNumber>;
    employeeCountMax: z.ZodOptional<z.ZodNumber>;
    foundedYearMin: z.ZodOptional<z.ZodNumber>;
    foundedYearMax: z.ZodOptional<z.ZodNumber>;
    lastContactAfter: z.ZodOptional<z.ZodDate>;
    lastContactBefore: z.ZodOptional<z.ZodDate>;
    nextFollowUpAfter: z.ZodOptional<z.ZodDate>;
    nextFollowUpBefore: z.ZodOptional<z.ZodDate>;
    createdAfter: z.ZodOptional<z.ZodDate>;
    createdBefore: z.ZodOptional<z.ZodDate>;
    updatedAfter: z.ZodOptional<z.ZodDate>;
    updatedBefore: z.ZodOptional<z.ZodDate>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    sortBy: z.ZodDefault<z.ZodEnum<["name", "type", "status", "size", "industry", "source", "leadScore", "annualRevenue", "employeeCount", "foundedYear", "lastContactDate", "nextFollowUpDate", "createdAt", "updatedAt"]>>;
    sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    query?: string;
    type?: "prospect" | "customer" | "supplier" | "partner" | "competitor";
    status?: "lead" | "active" | "inactive" | "prospect" | "suspended";
    organizationId?: string;
    page?: number;
    limit?: number;
    source?: "event" | "email" | "website" | "other" | "referral" | "cold_call" | "social_media";
    size?: "medium" | "enterprise" | "startup" | "small" | "large";
    industry?: string;
    tags?: string[];
    currency?: string;
    isActive?: boolean;
    parentCompanyId?: string;
    assignedUserId?: string;
    sortBy?: "type" | "status" | "name" | "source" | "size" | "industry" | "createdAt" | "updatedAt" | "annualRevenue" | "employeeCount" | "foundedYear" | "lastContactDate" | "nextFollowUpDate" | "leadScore";
    sortOrder?: "asc" | "desc";
    hasParentCompany?: boolean;
    isAssigned?: boolean;
    leadScoreMin?: number;
    leadScoreMax?: number;
    revenueMin?: number;
    revenueMax?: number;
    employeeCountMin?: number;
    employeeCountMax?: number;
    foundedYearMin?: number;
    foundedYearMax?: number;
    lastContactAfter?: Date;
    lastContactBefore?: Date;
    nextFollowUpAfter?: Date;
    nextFollowUpBefore?: Date;
    createdAfter?: Date;
    createdBefore?: Date;
    updatedAfter?: Date;
    updatedBefore?: Date;
}, {
    query?: string;
    type?: "prospect" | "customer" | "supplier" | "partner" | "competitor";
    status?: "lead" | "active" | "inactive" | "prospect" | "suspended";
    organizationId?: string;
    page?: number;
    limit?: number;
    source?: "event" | "email" | "website" | "other" | "referral" | "cold_call" | "social_media";
    size?: "medium" | "enterprise" | "startup" | "small" | "large";
    industry?: string;
    tags?: string[];
    currency?: string;
    isActive?: boolean;
    parentCompanyId?: string;
    assignedUserId?: string;
    sortBy?: "type" | "status" | "name" | "source" | "size" | "industry" | "createdAt" | "updatedAt" | "annualRevenue" | "employeeCount" | "foundedYear" | "lastContactDate" | "nextFollowUpDate" | "leadScore";
    sortOrder?: "asc" | "desc";
    hasParentCompany?: boolean;
    isAssigned?: boolean;
    leadScoreMin?: number;
    leadScoreMax?: number;
    revenueMin?: number;
    revenueMax?: number;
    employeeCountMin?: number;
    employeeCountMax?: number;
    foundedYearMin?: number;
    foundedYearMax?: number;
    lastContactAfter?: Date;
    lastContactBefore?: Date;
    nextFollowUpAfter?: Date;
    nextFollowUpBefore?: Date;
    createdAfter?: Date;
    createdBefore?: Date;
    updatedAfter?: Date;
    updatedBefore?: Date;
}>;
export declare const BulkUpdateCompaniesRequestSchema: z.ZodObject<{
    companyIds: z.ZodArray<z.ZodString, "many">;
    updates: z.ZodObject<Omit<{
        organizationId: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        legalName: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        type: z.ZodOptional<z.ZodEnum<["customer", "supplier", "partner", "prospect", "competitor"]>>;
        status: z.ZodOptional<z.ZodEnum<["active", "inactive", "suspended", "prospect", "lead"]>>;
        size: z.ZodOptional<z.ZodEnum<["startup", "small", "medium", "large", "enterprise"]>>;
        industry: z.ZodOptional<z.ZodString>;
        source: z.ZodOptional<z.ZodEnum<["website", "referral", "cold_call", "email", "social_media", "event", "other"]>>;
        website: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        email: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        phone: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        address: z.ZodOptional<z.ZodOptional<z.ZodObject<{
            street: z.ZodString;
            city: z.ZodString;
            state: z.ZodOptional<z.ZodString>;
            postalCode: z.ZodString;
            country: z.ZodString;
            countryCode: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            street?: string;
            city?: string;
            state?: string;
            country?: string;
            postalCode?: string;
            countryCode?: string;
        }, {
            street?: string;
            city?: string;
            state?: string;
            country?: string;
            postalCode?: string;
            countryCode?: string;
        }>>>;
        billingAddress: z.ZodOptional<z.ZodOptional<z.ZodObject<{
            street: z.ZodString;
            city: z.ZodString;
            state: z.ZodOptional<z.ZodString>;
            postalCode: z.ZodString;
            country: z.ZodString;
            countryCode: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            street?: string;
            city?: string;
            state?: string;
            country?: string;
            postalCode?: string;
            countryCode?: string;
        }, {
            street?: string;
            city?: string;
            state?: string;
            country?: string;
            postalCode?: string;
            countryCode?: string;
        }>>>;
        shippingAddress: z.ZodOptional<z.ZodOptional<z.ZodObject<{
            street: z.ZodString;
            city: z.ZodString;
            state: z.ZodOptional<z.ZodString>;
            postalCode: z.ZodString;
            country: z.ZodString;
            countryCode: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            street?: string;
            city?: string;
            state?: string;
            country?: string;
            postalCode?: string;
            countryCode?: string;
        }, {
            street?: string;
            city?: string;
            state?: string;
            country?: string;
            postalCode?: string;
            countryCode?: string;
        }>>>;
        taxId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        vatNumber: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        registrationNumber: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        annualRevenue: z.ZodOptional<z.ZodOptional<z.ZodObject<{
            amount: z.ZodNumber;
            currency: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            amount?: number;
            currency?: string;
        }, {
            amount?: number;
            currency?: string;
        }>>>;
        employeeCount: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
        foundedYear: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
        parentCompanyId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        assignedUserId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        nextFollowUpDate: z.ZodOptional<z.ZodOptional<z.ZodDate>>;
        leadScore: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
        settings: z.ZodOptional<z.ZodOptional<z.ZodObject<{
            notifications: z.ZodOptional<z.ZodObject<{
                email: z.ZodOptional<z.ZodBoolean>;
                sms: z.ZodOptional<z.ZodBoolean>;
                push: z.ZodOptional<z.ZodBoolean>;
            }, "strip", z.ZodTypeAny, {
                push?: boolean;
                email?: boolean;
                sms?: boolean;
            }, {
                push?: boolean;
                email?: boolean;
                sms?: boolean;
            }>>;
            preferences: z.ZodOptional<z.ZodObject<{
                language: z.ZodOptional<z.ZodString>;
                timezone: z.ZodOptional<z.ZodString>;
                currency: z.ZodOptional<z.ZodString>;
                dateFormat: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                language?: string;
                currency?: string;
                timezone?: string;
                dateFormat?: string;
            }, {
                language?: string;
                currency?: string;
                timezone?: string;
                dateFormat?: string;
            }>>;
            customFields: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
            tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            notes: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            tags?: string[];
            notes?: string;
            notifications?: {
                push?: boolean;
                email?: boolean;
                sms?: boolean;
            };
            customFields?: Record<string, any>;
            preferences?: {
                language?: string;
                currency?: string;
                timezone?: string;
                dateFormat?: string;
            };
        }, {
            tags?: string[];
            notes?: string;
            notifications?: {
                push?: boolean;
                email?: boolean;
                sms?: boolean;
            };
            customFields?: Record<string, any>;
            preferences?: {
                language?: string;
                currency?: string;
                timezone?: string;
                dateFormat?: string;
            };
        }>>>;
    }, "organizationId">, "strip", z.ZodTypeAny, {
        type?: "prospect" | "customer" | "supplier" | "partner" | "competitor";
        status?: "lead" | "active" | "inactive" | "prospect" | "suspended";
        name?: string;
        source?: "event" | "email" | "website" | "other" | "referral" | "cold_call" | "social_media";
        size?: "medium" | "enterprise" | "startup" | "small" | "large";
        email?: string;
        phone?: string;
        website?: string;
        industry?: string;
        address?: {
            street?: string;
            city?: string;
            state?: string;
            country?: string;
            postalCode?: string;
            countryCode?: string;
        };
        description?: string;
        settings?: {
            tags?: string[];
            notes?: string;
            notifications?: {
                push?: boolean;
                email?: boolean;
                sms?: boolean;
            };
            customFields?: Record<string, any>;
            preferences?: {
                language?: string;
                currency?: string;
                timezone?: string;
                dateFormat?: string;
            };
        };
        legalName?: string;
        billingAddress?: {
            street?: string;
            city?: string;
            state?: string;
            country?: string;
            postalCode?: string;
            countryCode?: string;
        };
        shippingAddress?: {
            street?: string;
            city?: string;
            state?: string;
            country?: string;
            postalCode?: string;
            countryCode?: string;
        };
        taxId?: string;
        vatNumber?: string;
        registrationNumber?: string;
        annualRevenue?: {
            amount?: number;
            currency?: string;
        };
        employeeCount?: number;
        foundedYear?: number;
        parentCompanyId?: string;
        assignedUserId?: string;
        nextFollowUpDate?: Date;
        leadScore?: number;
    }, {
        type?: "prospect" | "customer" | "supplier" | "partner" | "competitor";
        status?: "lead" | "active" | "inactive" | "prospect" | "suspended";
        name?: string;
        source?: "event" | "email" | "website" | "other" | "referral" | "cold_call" | "social_media";
        size?: "medium" | "enterprise" | "startup" | "small" | "large";
        email?: string;
        phone?: string;
        website?: string;
        industry?: string;
        address?: {
            street?: string;
            city?: string;
            state?: string;
            country?: string;
            postalCode?: string;
            countryCode?: string;
        };
        description?: string;
        settings?: {
            tags?: string[];
            notes?: string;
            notifications?: {
                push?: boolean;
                email?: boolean;
                sms?: boolean;
            };
            customFields?: Record<string, any>;
            preferences?: {
                language?: string;
                currency?: string;
                timezone?: string;
                dateFormat?: string;
            };
        };
        legalName?: string;
        billingAddress?: {
            street?: string;
            city?: string;
            state?: string;
            country?: string;
            postalCode?: string;
            countryCode?: string;
        };
        shippingAddress?: {
            street?: string;
            city?: string;
            state?: string;
            country?: string;
            postalCode?: string;
            countryCode?: string;
        };
        taxId?: string;
        vatNumber?: string;
        registrationNumber?: string;
        annualRevenue?: {
            amount?: number;
            currency?: string;
        };
        employeeCount?: number;
        foundedYear?: number;
        parentCompanyId?: string;
        assignedUserId?: string;
        nextFollowUpDate?: Date;
        leadScore?: number;
    }>;
}, "strip", z.ZodTypeAny, {
    updates?: {
        type?: "prospect" | "customer" | "supplier" | "partner" | "competitor";
        status?: "lead" | "active" | "inactive" | "prospect" | "suspended";
        name?: string;
        source?: "event" | "email" | "website" | "other" | "referral" | "cold_call" | "social_media";
        size?: "medium" | "enterprise" | "startup" | "small" | "large";
        email?: string;
        phone?: string;
        website?: string;
        industry?: string;
        address?: {
            street?: string;
            city?: string;
            state?: string;
            country?: string;
            postalCode?: string;
            countryCode?: string;
        };
        description?: string;
        settings?: {
            tags?: string[];
            notes?: string;
            notifications?: {
                push?: boolean;
                email?: boolean;
                sms?: boolean;
            };
            customFields?: Record<string, any>;
            preferences?: {
                language?: string;
                currency?: string;
                timezone?: string;
                dateFormat?: string;
            };
        };
        legalName?: string;
        billingAddress?: {
            street?: string;
            city?: string;
            state?: string;
            country?: string;
            postalCode?: string;
            countryCode?: string;
        };
        shippingAddress?: {
            street?: string;
            city?: string;
            state?: string;
            country?: string;
            postalCode?: string;
            countryCode?: string;
        };
        taxId?: string;
        vatNumber?: string;
        registrationNumber?: string;
        annualRevenue?: {
            amount?: number;
            currency?: string;
        };
        employeeCount?: number;
        foundedYear?: number;
        parentCompanyId?: string;
        assignedUserId?: string;
        nextFollowUpDate?: Date;
        leadScore?: number;
    };
    companyIds?: string[];
}, {
    updates?: {
        type?: "prospect" | "customer" | "supplier" | "partner" | "competitor";
        status?: "lead" | "active" | "inactive" | "prospect" | "suspended";
        name?: string;
        source?: "event" | "email" | "website" | "other" | "referral" | "cold_call" | "social_media";
        size?: "medium" | "enterprise" | "startup" | "small" | "large";
        email?: string;
        phone?: string;
        website?: string;
        industry?: string;
        address?: {
            street?: string;
            city?: string;
            state?: string;
            country?: string;
            postalCode?: string;
            countryCode?: string;
        };
        description?: string;
        settings?: {
            tags?: string[];
            notes?: string;
            notifications?: {
                push?: boolean;
                email?: boolean;
                sms?: boolean;
            };
            customFields?: Record<string, any>;
            preferences?: {
                language?: string;
                currency?: string;
                timezone?: string;
                dateFormat?: string;
            };
        };
        legalName?: string;
        billingAddress?: {
            street?: string;
            city?: string;
            state?: string;
            country?: string;
            postalCode?: string;
            countryCode?: string;
        };
        shippingAddress?: {
            street?: string;
            city?: string;
            state?: string;
            country?: string;
            postalCode?: string;
            countryCode?: string;
        };
        taxId?: string;
        vatNumber?: string;
        registrationNumber?: string;
        annualRevenue?: {
            amount?: number;
            currency?: string;
        };
        employeeCount?: number;
        foundedYear?: number;
        parentCompanyId?: string;
        assignedUserId?: string;
        nextFollowUpDate?: Date;
        leadScore?: number;
    };
    companyIds?: string[];
}>;
export declare const BulkDeleteCompaniesRequestSchema: z.ZodObject<{
    companyIds: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    companyIds?: string[];
}, {
    companyIds?: string[];
}>;
export declare const CompanyResponseSchema: z.ZodObject<{
    id: z.ZodString;
    organizationId: z.ZodString;
    name: z.ZodString;
    legalName: z.ZodNullable<z.ZodString>;
    type: z.ZodEnum<["customer", "supplier", "partner", "prospect", "competitor"]>;
    status: z.ZodEnum<["active", "inactive", "suspended", "prospect", "lead"]>;
    size: z.ZodEnum<["startup", "small", "medium", "large", "enterprise"]>;
    industry: z.ZodString;
    source: z.ZodEnum<["website", "referral", "cold_call", "email", "social_media", "event", "other"]>;
    website: z.ZodNullable<z.ZodString>;
    email: z.ZodNullable<z.ZodString>;
    phone: z.ZodNullable<z.ZodString>;
    address: z.ZodNullable<z.ZodObject<{
        street: z.ZodString;
        city: z.ZodString;
        state: z.ZodNullable<z.ZodString>;
        postalCode: z.ZodString;
        country: z.ZodString;
        countryCode: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        street?: string;
        city?: string;
        state?: string;
        country?: string;
        postalCode?: string;
        countryCode?: string;
    }, {
        street?: string;
        city?: string;
        state?: string;
        country?: string;
        postalCode?: string;
        countryCode?: string;
    }>>;
    billingAddress: z.ZodNullable<z.ZodObject<{
        street: z.ZodString;
        city: z.ZodString;
        state: z.ZodNullable<z.ZodString>;
        postalCode: z.ZodString;
        country: z.ZodString;
        countryCode: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        street?: string;
        city?: string;
        state?: string;
        country?: string;
        postalCode?: string;
        countryCode?: string;
    }, {
        street?: string;
        city?: string;
        state?: string;
        country?: string;
        postalCode?: string;
        countryCode?: string;
    }>>;
    shippingAddress: z.ZodNullable<z.ZodObject<{
        street: z.ZodString;
        city: z.ZodString;
        state: z.ZodNullable<z.ZodString>;
        postalCode: z.ZodString;
        country: z.ZodString;
        countryCode: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        street?: string;
        city?: string;
        state?: string;
        country?: string;
        postalCode?: string;
        countryCode?: string;
    }, {
        street?: string;
        city?: string;
        state?: string;
        country?: string;
        postalCode?: string;
        countryCode?: string;
    }>>;
    taxId: z.ZodNullable<z.ZodString>;
    vatNumber: z.ZodNullable<z.ZodString>;
    registrationNumber: z.ZodNullable<z.ZodString>;
    description: z.ZodNullable<z.ZodString>;
    settings: z.ZodObject<{
        notifications: z.ZodObject<{
            email: z.ZodBoolean;
            sms: z.ZodBoolean;
            push: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            push?: boolean;
            email?: boolean;
            sms?: boolean;
        }, {
            push?: boolean;
            email?: boolean;
            sms?: boolean;
        }>;
        preferences: z.ZodObject<{
            language: z.ZodString;
            timezone: z.ZodString;
            currency: z.ZodString;
            dateFormat: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            language?: string;
            currency?: string;
            timezone?: string;
            dateFormat?: string;
        }, {
            language?: string;
            currency?: string;
            timezone?: string;
            dateFormat?: string;
        }>;
        customFields: z.ZodRecord<z.ZodString, z.ZodAny>;
        tags: z.ZodArray<z.ZodString, "many">;
        notes: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        tags?: string[];
        notes?: string;
        notifications?: {
            push?: boolean;
            email?: boolean;
            sms?: boolean;
        };
        customFields?: Record<string, any>;
        preferences?: {
            language?: string;
            currency?: string;
            timezone?: string;
            dateFormat?: string;
        };
    }, {
        tags?: string[];
        notes?: string;
        notifications?: {
            push?: boolean;
            email?: boolean;
            sms?: boolean;
        };
        customFields?: Record<string, any>;
        preferences?: {
            language?: string;
            currency?: string;
            timezone?: string;
            dateFormat?: string;
        };
    }>;
    annualRevenue: z.ZodNullable<z.ZodObject<{
        amount: z.ZodNumber;
        currency: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        amount?: number;
        currency?: string;
    }, {
        amount?: number;
        currency?: string;
    }>>;
    employeeCount: z.ZodNullable<z.ZodNumber>;
    foundedYear: z.ZodNullable<z.ZodNumber>;
    parentCompanyId: z.ZodNullable<z.ZodString>;
    assignedUserId: z.ZodNullable<z.ZodString>;
    lastContactDate: z.ZodNullable<z.ZodDate>;
    nextFollowUpDate: z.ZodNullable<z.ZodDate>;
    leadScore: z.ZodNullable<z.ZodNumber>;
    leadScoreLevel: z.ZodEnum<["low", "medium", "high"]>;
    isActive: z.ZodBoolean;
    isCustomer: z.ZodBoolean;
    isSupplier: z.ZodBoolean;
    isPartner: z.ZodBoolean;
    isProspect: z.ZodBoolean;
    isLead: z.ZodBoolean;
    isAssigned: z.ZodBoolean;
    hasParentCompany: z.ZodBoolean;
    isOverdueForFollowUp: z.ZodBoolean;
    daysSinceLastContact: z.ZodNumber;
    daysUntilFollowUp: z.ZodNumber;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    type?: "prospect" | "customer" | "supplier" | "partner" | "competitor";
    status?: "lead" | "active" | "inactive" | "prospect" | "suspended";
    organizationId?: string;
    name?: string;
    id?: string;
    source?: "event" | "email" | "website" | "other" | "referral" | "cold_call" | "social_media";
    size?: "medium" | "enterprise" | "startup" | "small" | "large";
    email?: string;
    phone?: string;
    website?: string;
    industry?: string;
    address?: {
        street?: string;
        city?: string;
        state?: string;
        country?: string;
        postalCode?: string;
        countryCode?: string;
    };
    createdAt?: Date;
    updatedAt?: Date;
    description?: string;
    isActive?: boolean;
    settings?: {
        tags?: string[];
        notes?: string;
        notifications?: {
            push?: boolean;
            email?: boolean;
            sms?: boolean;
        };
        customFields?: Record<string, any>;
        preferences?: {
            language?: string;
            currency?: string;
            timezone?: string;
            dateFormat?: string;
        };
    };
    legalName?: string;
    billingAddress?: {
        street?: string;
        city?: string;
        state?: string;
        country?: string;
        postalCode?: string;
        countryCode?: string;
    };
    shippingAddress?: {
        street?: string;
        city?: string;
        state?: string;
        country?: string;
        postalCode?: string;
        countryCode?: string;
    };
    taxId?: string;
    vatNumber?: string;
    registrationNumber?: string;
    annualRevenue?: {
        amount?: number;
        currency?: string;
    };
    employeeCount?: number;
    foundedYear?: number;
    parentCompanyId?: string;
    assignedUserId?: string;
    lastContactDate?: Date;
    nextFollowUpDate?: Date;
    leadScore?: number;
    hasParentCompany?: boolean;
    isAssigned?: boolean;
    leadScoreLevel?: "low" | "medium" | "high";
    isCustomer?: boolean;
    isSupplier?: boolean;
    isPartner?: boolean;
    isProspect?: boolean;
    isLead?: boolean;
    isOverdueForFollowUp?: boolean;
    daysSinceLastContact?: number;
    daysUntilFollowUp?: number;
}, {
    type?: "prospect" | "customer" | "supplier" | "partner" | "competitor";
    status?: "lead" | "active" | "inactive" | "prospect" | "suspended";
    organizationId?: string;
    name?: string;
    id?: string;
    source?: "event" | "email" | "website" | "other" | "referral" | "cold_call" | "social_media";
    size?: "medium" | "enterprise" | "startup" | "small" | "large";
    email?: string;
    phone?: string;
    website?: string;
    industry?: string;
    address?: {
        street?: string;
        city?: string;
        state?: string;
        country?: string;
        postalCode?: string;
        countryCode?: string;
    };
    createdAt?: Date;
    updatedAt?: Date;
    description?: string;
    isActive?: boolean;
    settings?: {
        tags?: string[];
        notes?: string;
        notifications?: {
            push?: boolean;
            email?: boolean;
            sms?: boolean;
        };
        customFields?: Record<string, any>;
        preferences?: {
            language?: string;
            currency?: string;
            timezone?: string;
            dateFormat?: string;
        };
    };
    legalName?: string;
    billingAddress?: {
        street?: string;
        city?: string;
        state?: string;
        country?: string;
        postalCode?: string;
        countryCode?: string;
    };
    shippingAddress?: {
        street?: string;
        city?: string;
        state?: string;
        country?: string;
        postalCode?: string;
        countryCode?: string;
    };
    taxId?: string;
    vatNumber?: string;
    registrationNumber?: string;
    annualRevenue?: {
        amount?: number;
        currency?: string;
    };
    employeeCount?: number;
    foundedYear?: number;
    parentCompanyId?: string;
    assignedUserId?: string;
    lastContactDate?: Date;
    nextFollowUpDate?: Date;
    leadScore?: number;
    hasParentCompany?: boolean;
    isAssigned?: boolean;
    leadScoreLevel?: "low" | "medium" | "high";
    isCustomer?: boolean;
    isSupplier?: boolean;
    isPartner?: boolean;
    isProspect?: boolean;
    isLead?: boolean;
    isOverdueForFollowUp?: boolean;
    daysSinceLastContact?: number;
    daysUntilFollowUp?: number;
}>;
export declare const CompanyListResponseSchema: z.ZodObject<{
    companies: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        organizationId: z.ZodString;
        name: z.ZodString;
        legalName: z.ZodNullable<z.ZodString>;
        type: z.ZodEnum<["customer", "supplier", "partner", "prospect", "competitor"]>;
        status: z.ZodEnum<["active", "inactive", "suspended", "prospect", "lead"]>;
        size: z.ZodEnum<["startup", "small", "medium", "large", "enterprise"]>;
        industry: z.ZodString;
        source: z.ZodEnum<["website", "referral", "cold_call", "email", "social_media", "event", "other"]>;
        website: z.ZodNullable<z.ZodString>;
        email: z.ZodNullable<z.ZodString>;
        phone: z.ZodNullable<z.ZodString>;
        address: z.ZodNullable<z.ZodObject<{
            street: z.ZodString;
            city: z.ZodString;
            state: z.ZodNullable<z.ZodString>;
            postalCode: z.ZodString;
            country: z.ZodString;
            countryCode: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            street?: string;
            city?: string;
            state?: string;
            country?: string;
            postalCode?: string;
            countryCode?: string;
        }, {
            street?: string;
            city?: string;
            state?: string;
            country?: string;
            postalCode?: string;
            countryCode?: string;
        }>>;
        billingAddress: z.ZodNullable<z.ZodObject<{
            street: z.ZodString;
            city: z.ZodString;
            state: z.ZodNullable<z.ZodString>;
            postalCode: z.ZodString;
            country: z.ZodString;
            countryCode: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            street?: string;
            city?: string;
            state?: string;
            country?: string;
            postalCode?: string;
            countryCode?: string;
        }, {
            street?: string;
            city?: string;
            state?: string;
            country?: string;
            postalCode?: string;
            countryCode?: string;
        }>>;
        shippingAddress: z.ZodNullable<z.ZodObject<{
            street: z.ZodString;
            city: z.ZodString;
            state: z.ZodNullable<z.ZodString>;
            postalCode: z.ZodString;
            country: z.ZodString;
            countryCode: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            street?: string;
            city?: string;
            state?: string;
            country?: string;
            postalCode?: string;
            countryCode?: string;
        }, {
            street?: string;
            city?: string;
            state?: string;
            country?: string;
            postalCode?: string;
            countryCode?: string;
        }>>;
        taxId: z.ZodNullable<z.ZodString>;
        vatNumber: z.ZodNullable<z.ZodString>;
        registrationNumber: z.ZodNullable<z.ZodString>;
        description: z.ZodNullable<z.ZodString>;
        settings: z.ZodObject<{
            notifications: z.ZodObject<{
                email: z.ZodBoolean;
                sms: z.ZodBoolean;
                push: z.ZodBoolean;
            }, "strip", z.ZodTypeAny, {
                push?: boolean;
                email?: boolean;
                sms?: boolean;
            }, {
                push?: boolean;
                email?: boolean;
                sms?: boolean;
            }>;
            preferences: z.ZodObject<{
                language: z.ZodString;
                timezone: z.ZodString;
                currency: z.ZodString;
                dateFormat: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                language?: string;
                currency?: string;
                timezone?: string;
                dateFormat?: string;
            }, {
                language?: string;
                currency?: string;
                timezone?: string;
                dateFormat?: string;
            }>;
            customFields: z.ZodRecord<z.ZodString, z.ZodAny>;
            tags: z.ZodArray<z.ZodString, "many">;
            notes: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            tags?: string[];
            notes?: string;
            notifications?: {
                push?: boolean;
                email?: boolean;
                sms?: boolean;
            };
            customFields?: Record<string, any>;
            preferences?: {
                language?: string;
                currency?: string;
                timezone?: string;
                dateFormat?: string;
            };
        }, {
            tags?: string[];
            notes?: string;
            notifications?: {
                push?: boolean;
                email?: boolean;
                sms?: boolean;
            };
            customFields?: Record<string, any>;
            preferences?: {
                language?: string;
                currency?: string;
                timezone?: string;
                dateFormat?: string;
            };
        }>;
        annualRevenue: z.ZodNullable<z.ZodObject<{
            amount: z.ZodNumber;
            currency: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            amount?: number;
            currency?: string;
        }, {
            amount?: number;
            currency?: string;
        }>>;
        employeeCount: z.ZodNullable<z.ZodNumber>;
        foundedYear: z.ZodNullable<z.ZodNumber>;
        parentCompanyId: z.ZodNullable<z.ZodString>;
        assignedUserId: z.ZodNullable<z.ZodString>;
        lastContactDate: z.ZodNullable<z.ZodDate>;
        nextFollowUpDate: z.ZodNullable<z.ZodDate>;
        leadScore: z.ZodNullable<z.ZodNumber>;
        leadScoreLevel: z.ZodEnum<["low", "medium", "high"]>;
        isActive: z.ZodBoolean;
        isCustomer: z.ZodBoolean;
        isSupplier: z.ZodBoolean;
        isPartner: z.ZodBoolean;
        isProspect: z.ZodBoolean;
        isLead: z.ZodBoolean;
        isAssigned: z.ZodBoolean;
        hasParentCompany: z.ZodBoolean;
        isOverdueForFollowUp: z.ZodBoolean;
        daysSinceLastContact: z.ZodNumber;
        daysUntilFollowUp: z.ZodNumber;
        createdAt: z.ZodDate;
        updatedAt: z.ZodDate;
    }, "strip", z.ZodTypeAny, {
        type?: "prospect" | "customer" | "supplier" | "partner" | "competitor";
        status?: "lead" | "active" | "inactive" | "prospect" | "suspended";
        organizationId?: string;
        name?: string;
        id?: string;
        source?: "event" | "email" | "website" | "other" | "referral" | "cold_call" | "social_media";
        size?: "medium" | "enterprise" | "startup" | "small" | "large";
        email?: string;
        phone?: string;
        website?: string;
        industry?: string;
        address?: {
            street?: string;
            city?: string;
            state?: string;
            country?: string;
            postalCode?: string;
            countryCode?: string;
        };
        createdAt?: Date;
        updatedAt?: Date;
        description?: string;
        isActive?: boolean;
        settings?: {
            tags?: string[];
            notes?: string;
            notifications?: {
                push?: boolean;
                email?: boolean;
                sms?: boolean;
            };
            customFields?: Record<string, any>;
            preferences?: {
                language?: string;
                currency?: string;
                timezone?: string;
                dateFormat?: string;
            };
        };
        legalName?: string;
        billingAddress?: {
            street?: string;
            city?: string;
            state?: string;
            country?: string;
            postalCode?: string;
            countryCode?: string;
        };
        shippingAddress?: {
            street?: string;
            city?: string;
            state?: string;
            country?: string;
            postalCode?: string;
            countryCode?: string;
        };
        taxId?: string;
        vatNumber?: string;
        registrationNumber?: string;
        annualRevenue?: {
            amount?: number;
            currency?: string;
        };
        employeeCount?: number;
        foundedYear?: number;
        parentCompanyId?: string;
        assignedUserId?: string;
        lastContactDate?: Date;
        nextFollowUpDate?: Date;
        leadScore?: number;
        hasParentCompany?: boolean;
        isAssigned?: boolean;
        leadScoreLevel?: "low" | "medium" | "high";
        isCustomer?: boolean;
        isSupplier?: boolean;
        isPartner?: boolean;
        isProspect?: boolean;
        isLead?: boolean;
        isOverdueForFollowUp?: boolean;
        daysSinceLastContact?: number;
        daysUntilFollowUp?: number;
    }, {
        type?: "prospect" | "customer" | "supplier" | "partner" | "competitor";
        status?: "lead" | "active" | "inactive" | "prospect" | "suspended";
        organizationId?: string;
        name?: string;
        id?: string;
        source?: "event" | "email" | "website" | "other" | "referral" | "cold_call" | "social_media";
        size?: "medium" | "enterprise" | "startup" | "small" | "large";
        email?: string;
        phone?: string;
        website?: string;
        industry?: string;
        address?: {
            street?: string;
            city?: string;
            state?: string;
            country?: string;
            postalCode?: string;
            countryCode?: string;
        };
        createdAt?: Date;
        updatedAt?: Date;
        description?: string;
        isActive?: boolean;
        settings?: {
            tags?: string[];
            notes?: string;
            notifications?: {
                push?: boolean;
                email?: boolean;
                sms?: boolean;
            };
            customFields?: Record<string, any>;
            preferences?: {
                language?: string;
                currency?: string;
                timezone?: string;
                dateFormat?: string;
            };
        };
        legalName?: string;
        billingAddress?: {
            street?: string;
            city?: string;
            state?: string;
            country?: string;
            postalCode?: string;
            countryCode?: string;
        };
        shippingAddress?: {
            street?: string;
            city?: string;
            state?: string;
            country?: string;
            postalCode?: string;
            countryCode?: string;
        };
        taxId?: string;
        vatNumber?: string;
        registrationNumber?: string;
        annualRevenue?: {
            amount?: number;
            currency?: string;
        };
        employeeCount?: number;
        foundedYear?: number;
        parentCompanyId?: string;
        assignedUserId?: string;
        lastContactDate?: Date;
        nextFollowUpDate?: Date;
        leadScore?: number;
        hasParentCompany?: boolean;
        isAssigned?: boolean;
        leadScoreLevel?: "low" | "medium" | "high";
        isCustomer?: boolean;
        isSupplier?: boolean;
        isPartner?: boolean;
        isProspect?: boolean;
        isLead?: boolean;
        isOverdueForFollowUp?: boolean;
        daysSinceLastContact?: number;
        daysUntilFollowUp?: number;
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
    companies?: {
        type?: "prospect" | "customer" | "supplier" | "partner" | "competitor";
        status?: "lead" | "active" | "inactive" | "prospect" | "suspended";
        organizationId?: string;
        name?: string;
        id?: string;
        source?: "event" | "email" | "website" | "other" | "referral" | "cold_call" | "social_media";
        size?: "medium" | "enterprise" | "startup" | "small" | "large";
        email?: string;
        phone?: string;
        website?: string;
        industry?: string;
        address?: {
            street?: string;
            city?: string;
            state?: string;
            country?: string;
            postalCode?: string;
            countryCode?: string;
        };
        createdAt?: Date;
        updatedAt?: Date;
        description?: string;
        isActive?: boolean;
        settings?: {
            tags?: string[];
            notes?: string;
            notifications?: {
                push?: boolean;
                email?: boolean;
                sms?: boolean;
            };
            customFields?: Record<string, any>;
            preferences?: {
                language?: string;
                currency?: string;
                timezone?: string;
                dateFormat?: string;
            };
        };
        legalName?: string;
        billingAddress?: {
            street?: string;
            city?: string;
            state?: string;
            country?: string;
            postalCode?: string;
            countryCode?: string;
        };
        shippingAddress?: {
            street?: string;
            city?: string;
            state?: string;
            country?: string;
            postalCode?: string;
            countryCode?: string;
        };
        taxId?: string;
        vatNumber?: string;
        registrationNumber?: string;
        annualRevenue?: {
            amount?: number;
            currency?: string;
        };
        employeeCount?: number;
        foundedYear?: number;
        parentCompanyId?: string;
        assignedUserId?: string;
        lastContactDate?: Date;
        nextFollowUpDate?: Date;
        leadScore?: number;
        hasParentCompany?: boolean;
        isAssigned?: boolean;
        leadScoreLevel?: "low" | "medium" | "high";
        isCustomer?: boolean;
        isSupplier?: boolean;
        isPartner?: boolean;
        isProspect?: boolean;
        isLead?: boolean;
        isOverdueForFollowUp?: boolean;
        daysSinceLastContact?: number;
        daysUntilFollowUp?: number;
    }[];
    totalPages?: number;
    hasNext?: boolean;
    hasPrevious?: boolean;
}, {
    page?: number;
    limit?: number;
    total?: number;
    companies?: {
        type?: "prospect" | "customer" | "supplier" | "partner" | "competitor";
        status?: "lead" | "active" | "inactive" | "prospect" | "suspended";
        organizationId?: string;
        name?: string;
        id?: string;
        source?: "event" | "email" | "website" | "other" | "referral" | "cold_call" | "social_media";
        size?: "medium" | "enterprise" | "startup" | "small" | "large";
        email?: string;
        phone?: string;
        website?: string;
        industry?: string;
        address?: {
            street?: string;
            city?: string;
            state?: string;
            country?: string;
            postalCode?: string;
            countryCode?: string;
        };
        createdAt?: Date;
        updatedAt?: Date;
        description?: string;
        isActive?: boolean;
        settings?: {
            tags?: string[];
            notes?: string;
            notifications?: {
                push?: boolean;
                email?: boolean;
                sms?: boolean;
            };
            customFields?: Record<string, any>;
            preferences?: {
                language?: string;
                currency?: string;
                timezone?: string;
                dateFormat?: string;
            };
        };
        legalName?: string;
        billingAddress?: {
            street?: string;
            city?: string;
            state?: string;
            country?: string;
            postalCode?: string;
            countryCode?: string;
        };
        shippingAddress?: {
            street?: string;
            city?: string;
            state?: string;
            country?: string;
            postalCode?: string;
            countryCode?: string;
        };
        taxId?: string;
        vatNumber?: string;
        registrationNumber?: string;
        annualRevenue?: {
            amount?: number;
            currency?: string;
        };
        employeeCount?: number;
        foundedYear?: number;
        parentCompanyId?: string;
        assignedUserId?: string;
        lastContactDate?: Date;
        nextFollowUpDate?: Date;
        leadScore?: number;
        hasParentCompany?: boolean;
        isAssigned?: boolean;
        leadScoreLevel?: "low" | "medium" | "high";
        isCustomer?: boolean;
        isSupplier?: boolean;
        isPartner?: boolean;
        isProspect?: boolean;
        isLead?: boolean;
        isOverdueForFollowUp?: boolean;
        daysSinceLastContact?: number;
        daysUntilFollowUp?: number;
    }[];
    totalPages?: number;
    hasNext?: boolean;
    hasPrevious?: boolean;
}>;
export declare const CompanyStatsResponseSchema: z.ZodObject<{
    total: z.ZodNumber;
    byType: z.ZodRecord<z.ZodString, z.ZodNumber>;
    byStatus: z.ZodRecord<z.ZodString, z.ZodNumber>;
    bySize: z.ZodRecord<z.ZodString, z.ZodNumber>;
    byIndustry: z.ZodRecord<z.ZodString, z.ZodNumber>;
    bySource: z.ZodRecord<z.ZodString, z.ZodNumber>;
    active: z.ZodNumber;
    inactive: z.ZodNumber;
    customers: z.ZodNumber;
    suppliers: z.ZodNumber;
    partners: z.ZodNumber;
    prospects: z.ZodNumber;
    leads: z.ZodNumber;
    competitors: z.ZodNumber;
    assigned: z.ZodNumber;
    unassigned: z.ZodNumber;
    withParentCompany: z.ZodNumber;
    overdueForFollowUp: z.ZodNumber;
    highScoreLeads: z.ZodNumber;
    mediumScoreLeads: z.ZodNumber;
    lowScoreLeads: z.ZodNumber;
    averageLeadScore: z.ZodNumber;
    totalAnnualRevenue: z.ZodNumber;
    averageAnnualRevenue: z.ZodNumber;
    totalEmployees: z.ZodNumber;
    averageEmployees: z.ZodNumber;
    companiesByYear: z.ZodRecord<z.ZodString, z.ZodNumber>;
    companiesByMonth: z.ZodRecord<z.ZodString, z.ZodNumber>;
    topIndustries: z.ZodArray<z.ZodObject<{
        industry: z.ZodString;
        count: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        count?: number;
        industry?: string;
    }, {
        count?: number;
        industry?: string;
    }>, "many">;
    topSources: z.ZodArray<z.ZodObject<{
        source: z.ZodString;
        count: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        source?: string;
        count?: number;
    }, {
        source?: string;
        count?: number;
    }>, "many">;
    topAssignedUsers: z.ZodArray<z.ZodObject<{
        userId: z.ZodString;
        count: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        userId?: string;
        count?: number;
    }, {
        userId?: string;
        count?: number;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    active?: number;
    inactive?: number;
    total?: number;
    suppliers?: number;
    byStatus?: Record<string, number>;
    competitors?: number;
    assigned?: number;
    customers?: number;
    byType?: Record<string, number>;
    bySize?: Record<string, number>;
    byIndustry?: Record<string, number>;
    bySource?: Record<string, number>;
    partners?: number;
    prospects?: number;
    leads?: number;
    unassigned?: number;
    withParentCompany?: number;
    overdueForFollowUp?: number;
    highScoreLeads?: number;
    mediumScoreLeads?: number;
    lowScoreLeads?: number;
    averageLeadScore?: number;
    totalAnnualRevenue?: number;
    averageAnnualRevenue?: number;
    totalEmployees?: number;
    averageEmployees?: number;
    companiesByYear?: Record<string, number>;
    companiesByMonth?: Record<string, number>;
    topIndustries?: {
        count?: number;
        industry?: string;
    }[];
    topSources?: {
        source?: string;
        count?: number;
    }[];
    topAssignedUsers?: {
        userId?: string;
        count?: number;
    }[];
}, {
    active?: number;
    inactive?: number;
    total?: number;
    suppliers?: number;
    byStatus?: Record<string, number>;
    competitors?: number;
    assigned?: number;
    customers?: number;
    byType?: Record<string, number>;
    bySize?: Record<string, number>;
    byIndustry?: Record<string, number>;
    bySource?: Record<string, number>;
    partners?: number;
    prospects?: number;
    leads?: number;
    unassigned?: number;
    withParentCompany?: number;
    overdueForFollowUp?: number;
    highScoreLeads?: number;
    mediumScoreLeads?: number;
    lowScoreLeads?: number;
    averageLeadScore?: number;
    totalAnnualRevenue?: number;
    averageAnnualRevenue?: number;
    totalEmployees?: number;
    averageEmployees?: number;
    companiesByYear?: Record<string, number>;
    companiesByMonth?: Record<string, number>;
    topIndustries?: {
        count?: number;
        industry?: string;
    }[];
    topSources?: {
        source?: string;
        count?: number;
    }[];
    topAssignedUsers?: {
        userId?: string;
        count?: number;
    }[];
}>;
export type CreateCompanyRequest = z.infer<typeof CreateCompanyRequestSchema>;
export type UpdateCompanyRequest = z.infer<typeof UpdateCompanyRequestSchema>;
export type DeleteCompanyRequest = z.infer<typeof DeleteCompanyRequestSchema>;
export type GetCompanyRequest = z.infer<typeof GetCompanyRequestSchema>;
export type SearchCompaniesRequest = z.infer<typeof SearchCompaniesRequestSchema>;
export type BulkUpdateCompaniesRequest = z.infer<typeof BulkUpdateCompaniesRequestSchema>;
export type BulkDeleteCompaniesRequest = z.infer<typeof BulkDeleteCompaniesRequestSchema>;
export type CompanyResponse = z.infer<typeof CompanyResponseSchema>;
export type CompanyListResponse = z.infer<typeof CompanyListResponseSchema>;
export type CompanyStatsResponse = z.infer<typeof CompanyStatsResponseSchema>;
export declare const validateCreateCompanyRequest: (data: unknown) => CreateCompanyRequest;
export declare const validateUpdateCompanyRequest: (data: unknown) => UpdateCompanyRequest;
export declare const validateDeleteCompanyRequest: (data: unknown) => DeleteCompanyRequest;
export declare const validateGetCompanyRequest: (data: unknown) => GetCompanyRequest;
export declare const validateSearchCompaniesRequest: (data: unknown) => SearchCompaniesRequest;
export declare const validateBulkUpdateCompaniesRequest: (data: unknown) => BulkUpdateCompaniesRequest;
export declare const validateBulkDeleteCompaniesRequest: (data: unknown) => BulkDeleteCompaniesRequest;
export declare const transformCompanyToResponse: (company: any) => CompanyResponse;
export declare const transformCompanyListToResponse: (companyList: any) => CompanyListResponse;
export declare const transformCompanyStatsToResponse: (stats: any) => CompanyStatsResponse;
//# sourceMappingURL=company.dto.d.ts.map