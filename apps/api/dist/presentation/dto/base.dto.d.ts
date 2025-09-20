import { z } from 'zod';
export declare const UUIDSchema: z.ZodString;
export declare const OrganizationIdSchema: z.ZodString;
export declare const NameSchema: z.ZodEffects<z.ZodString, string, string>;
export declare const DescriptionSchema: z.ZodEffects<z.ZodOptional<z.ZodString>, string, string>;
export declare const ShortDescriptionSchema: z.ZodEffects<z.ZodOptional<z.ZodString>, string, string>;
export declare const EmailSchema: z.ZodEffects<z.ZodString, string, string>;
export declare const PhoneSchema: z.ZodOptional<z.ZodString>;
export declare const WebsiteSchema: z.ZodOptional<z.ZodString>;
export declare const TagsSchema: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
export declare const CustomFieldsSchema: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodAny>>;
export declare const NotesSchema: z.ZodDefault<z.ZodString>;
export declare const PaginationQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    sortBy: z.ZodDefault<z.ZodString>;
    sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}, {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}>;
export declare const SearchQuerySchema: z.ZodObject<{
    search: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    search?: string;
}, {
    search?: string;
}>;
export declare const BaseSearchQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    sortBy: z.ZodDefault<z.ZodString>;
    sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
} & {
    search: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}, {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}>;
export declare const IdParamSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id?: string;
}, {
    id?: string;
}>;
export declare const OrganizationIdParamSchema: z.ZodObject<{
    organizationId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    organizationId?: string;
}, {
    organizationId?: string;
}>;
export declare const BaseResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    data: z.ZodAny;
    message: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    message?: string;
    success?: boolean;
    data?: any;
}, {
    message?: string;
    success?: boolean;
    data?: any;
}>;
export declare const PaginationResponseSchema: z.ZodObject<{
    page: z.ZodNumber;
    limit: z.ZodNumber;
    total: z.ZodNumber;
    totalPages: z.ZodNumber;
    hasNext: z.ZodBoolean;
    hasPrev: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    hasNext?: boolean;
    hasPrev?: boolean;
}, {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    hasNext?: boolean;
    hasPrev?: boolean;
}>;
export declare const ListResponseSchema: z.ZodObject<{
    data: z.ZodArray<z.ZodAny, "many">;
    pagination: z.ZodObject<{
        page: z.ZodNumber;
        limit: z.ZodNumber;
        total: z.ZodNumber;
        totalPages: z.ZodNumber;
        hasNext: z.ZodBoolean;
        hasPrev: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        page?: number;
        limit?: number;
        total?: number;
        totalPages?: number;
        hasNext?: boolean;
        hasPrev?: boolean;
    }, {
        page?: number;
        limit?: number;
        total?: number;
        totalPages?: number;
        hasNext?: boolean;
        hasPrev?: boolean;
    }>;
}, "strip", z.ZodTypeAny, {
    data?: any[];
    pagination?: {
        page?: number;
        limit?: number;
        total?: number;
        totalPages?: number;
        hasNext?: boolean;
        hasPrev?: boolean;
    };
}, {
    data?: any[];
    pagination?: {
        page?: number;
        limit?: number;
        total?: number;
        totalPages?: number;
        hasNext?: boolean;
        hasPrev?: boolean;
    };
}>;
export declare const BaseStatsSchema: z.ZodObject<{
    total: z.ZodNumber;
    active: z.ZodNumber;
    inactive: z.ZodNumber;
    createdThisMonth: z.ZodNumber;
    createdThisYear: z.ZodNumber;
    updatedThisMonth: z.ZodNumber;
    updatedThisYear: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    active?: number;
    inactive?: number;
    total?: number;
    createdThisMonth?: number;
    createdThisYear?: number;
    updatedThisMonth?: number;
    updatedThisYear?: number;
}, {
    active?: number;
    inactive?: number;
    total?: number;
    createdThisMonth?: number;
    createdThisYear?: number;
    updatedThisMonth?: number;
    updatedThisYear?: number;
}>;
export declare const BulkUpdateSchema: z.ZodObject<{
    ids: z.ZodArray<z.ZodString, "many">;
    updates: z.ZodRecord<z.ZodString, z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    updates?: Record<string, any>;
    ids?: string[];
}, {
    updates?: Record<string, any>;
    ids?: string[];
}>;
export declare const BulkDeleteSchema: z.ZodObject<{
    ids: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    ids?: string[];
}, {
    ids?: string[];
}>;
export declare const DateRangeSchema: z.ZodEffects<z.ZodObject<{
    startDate: z.ZodOptional<z.ZodDate>;
    endDate: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    startDate?: Date;
    endDate?: Date;
}, {
    startDate?: Date;
    endDate?: Date;
}>, {
    startDate?: Date;
    endDate?: Date;
}, {
    startDate?: Date;
    endDate?: Date;
}>;
export declare const MoneySchema: z.ZodObject<{
    amount: z.ZodNumber;
    currency: z.ZodString;
}, "strip", z.ZodTypeAny, {
    amount?: number;
    currency?: string;
}, {
    amount?: number;
    currency?: string;
}>;
export declare const AddressSchema: z.ZodObject<{
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
}>;
export type BaseSearchQuery = z.infer<typeof BaseSearchQuerySchema>;
export type IdParam = z.infer<typeof IdParamSchema>;
export type OrganizationIdParam = z.infer<typeof OrganizationIdParamSchema>;
export type BaseResponse = z.infer<typeof BaseResponseSchema>;
export type ListResponse<T> = {
    data: T[];
    pagination: z.infer<typeof PaginationResponseSchema>;
};
export type BaseStats = z.infer<typeof BaseStatsSchema>;
export type BulkUpdate = z.infer<typeof BulkUpdateSchema>;
export type BulkDelete = z.infer<typeof BulkDeleteSchema>;
export type DateRange = z.infer<typeof DateRangeSchema>;
export type Money = z.infer<typeof MoneySchema>;
export type Address = z.infer<typeof AddressSchema>;
//# sourceMappingURL=base.dto.d.ts.map