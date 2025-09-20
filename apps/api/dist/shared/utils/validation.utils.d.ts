import { z } from 'zod';
export declare const UUIDSchema: z.ZodString;
export declare const EmailSchema: z.ZodString;
export declare const PhoneSchema: z.ZodString;
export declare const WebsiteSchema: z.ZodString;
export declare const CurrencySchema: z.ZodString;
export declare const LanguageSchema: z.ZodString;
export declare const CountryCodeSchema: z.ZodString;
export declare const NameSchema: z.ZodString;
export declare const DescriptionSchema: z.ZodOptional<z.ZodString>;
export declare const NotesSchema: z.ZodOptional<z.ZodString>;
export declare const TagsSchema: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
export declare const CustomFieldsSchema: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
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
export declare const PaginationSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    page?: number;
    limit?: number;
}, {
    page?: number;
    limit?: number;
}>;
export declare const SortSchema: z.ZodObject<{
    sortBy: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}, {
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}>;
export declare const DateRangeSchema: z.ZodObject<{
    from: z.ZodOptional<z.ZodDate>;
    to: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    from?: Date;
    to?: Date;
}, {
    from?: Date;
    to?: Date;
}>;
export declare const DateSchema: z.ZodDate;
export declare const SocialMediaSchema: z.ZodObject<{
    linkedin: z.ZodOptional<z.ZodString>;
    twitter: z.ZodOptional<z.ZodString>;
    facebook: z.ZodOptional<z.ZodString>;
    instagram: z.ZodOptional<z.ZodString>;
    youtube: z.ZodOptional<z.ZodString>;
    tiktok: z.ZodOptional<z.ZodString>;
    other: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    other?: Record<string, string>;
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
    youtube?: string;
    tiktok?: string;
}, {
    other?: Record<string, string>;
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
    youtube?: string;
    tiktok?: string;
}>;
export declare const NotificationPreferencesSchema: z.ZodObject<{
    email: z.ZodOptional<z.ZodBoolean>;
    sms: z.ZodOptional<z.ZodBoolean>;
    push: z.ZodOptional<z.ZodBoolean>;
    phone: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    push?: boolean;
    email?: boolean;
    phone?: boolean;
    sms?: boolean;
}, {
    push?: boolean;
    email?: boolean;
    phone?: boolean;
    sms?: boolean;
}>;
export declare const UserPreferencesSchema: z.ZodObject<{
    language: z.ZodOptional<z.ZodString>;
    timezone: z.ZodOptional<z.ZodString>;
    currency: z.ZodOptional<z.ZodString>;
    dateFormat: z.ZodOptional<z.ZodString>;
    timeFormat: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    language?: string;
    currency?: string;
    timezone?: string;
    dateFormat?: string;
    timeFormat?: string;
}, {
    language?: string;
    currency?: string;
    timezone?: string;
    dateFormat?: string;
    timeFormat?: string;
}>;
export declare const validateUUID: (value: string) => boolean;
export declare const validateEmail: (value: string) => boolean;
export declare const validatePhone: (value: string) => boolean;
export declare const validateWebsite: (value: string) => boolean;
export declare const validateCurrency: (value: string) => boolean;
export declare const validateLanguage: (value: string) => boolean;
export declare const validateCountryCode: (value: string) => boolean;
export declare const validateName: (value: string) => boolean;
export declare const validateDescription: (value: string) => boolean;
export declare const validateNotes: (value: string) => boolean;
export declare const validateTags: (value: string[]) => boolean;
export declare const validateCustomFields: (value: Record<string, any>) => boolean;
export declare const validateAddress: (value: any) => boolean;
export declare const validateMoney: (value: any) => boolean;
export declare const validatePagination: (value: any) => boolean;
export declare const validateSort: (value: any) => boolean;
export declare const validateDateRange: (value: any) => boolean;
export declare const validateDate: (value: any) => boolean;
export declare const validateSocialMedia: (value: any) => boolean;
export declare const validateNotificationPreferences: (value: any) => boolean;
export declare const validateUserPreferences: (value: any) => boolean;
export interface ValidationError {
    field: string;
    message: string;
    value?: any;
}
export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
}
export declare const createValidationError: (field: string, message: string, value?: any) => ValidationError;
export declare const createValidationResult: (isValid: boolean, errors: ValidationError[]) => ValidationResult;
export declare const validateField: (field: string, value: any, validator: (value: any) => boolean, message: string) => ValidationError | null;
export declare const validateRequired: (field: string, value: any) => ValidationError | null;
export declare const validateMinLength: (field: string, value: string, minLength: number) => ValidationError | null;
export declare const validateMaxLength: (field: string, value: string, maxLength: number) => ValidationError | null;
export declare const validateMin: (field: string, value: number, min: number) => ValidationError | null;
export declare const validateMax: (field: string, value: number, max: number) => ValidationError | null;
export declare const validateRange: (field: string, value: number, min: number, max: number) => ValidationError | null;
export declare const validateEnum: (field: string, value: any, allowedValues: any[]) => ValidationError | null;
export declare const validateArray: (field: string, value: any[], minLength?: number, maxLength?: number) => ValidationError | null;
export declare const validateObject: (field: string, value: any) => ValidationError | null;
export declare const validateBoolean: (field: string, value: any) => ValidationError | null;
export declare const validateNumber: (field: string, value: any) => ValidationError | null;
export declare const validateString: (field: string, value: any) => ValidationError | null;
export declare const validateBulk: (validators: (() => ValidationError | null)[]) => ValidationResult;
export declare const validateFields: (fieldValidators: Record<string, (() => ValidationError | null)[]>) => ValidationResult;
export declare const validateConditional: (condition: boolean, validator: () => ValidationError | null) => ValidationError | null;
export declare const validateIf: (value: any, validator: (value: any) => ValidationError | null) => ValidationError | null;
export declare const sanitizeString: (value: string) => string;
export declare const sanitizeEmail: (value: string) => string;
export declare const sanitizePhone: (value: string) => string;
export declare const sanitizeWebsite: (value: string) => string;
export declare const sanitizeTags: (tags: string[]) => string[];
export declare const sanitizeCustomFields: (fields: Record<string, any>) => Record<string, any>;
//# sourceMappingURL=validation.utils.d.ts.map