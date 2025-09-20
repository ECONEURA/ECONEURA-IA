import { z } from 'zod';
export declare const CreateContactRequestSchema: z.ZodObject<{
    organizationId: z.ZodString;
    companyId: z.ZodOptional<z.ZodString>;
    firstName: z.ZodString;
    lastName: z.ZodString;
    middleName: z.ZodOptional<z.ZodString>;
    title: z.ZodOptional<z.ZodString>;
    department: z.ZodOptional<z.ZodString>;
    type: z.ZodEnum<["primary", "secondary", "decision_maker", "influencer", "user", "technical", "financial", "procurement"]>;
    status: z.ZodEnum<["active", "inactive", "unsubscribed", "bounced", "spam", "deleted"]>;
    source: z.ZodEnum<["website", "referral", "cold_call", "email", "social_media", "event", "trade_show", "webinar", "content", "advertising", "other"]>;
    priority: z.ZodEnum<["low", "medium", "high", "urgent"]>;
    email: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    mobile: z.ZodOptional<z.ZodString>;
    fax: z.ZodOptional<z.ZodString>;
    website: z.ZodOptional<z.ZodString>;
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
    birthday: z.ZodOptional<z.ZodDate>;
    anniversary: z.ZodOptional<z.ZodDate>;
    gender: z.ZodOptional<z.ZodEnum<["male", "female", "other", "prefer_not_to_say"]>>;
    maritalStatus: z.ZodOptional<z.ZodEnum<["single", "married", "divorced", "widowed", "separated"]>>;
    children: z.ZodOptional<z.ZodNumber>;
    education: z.ZodOptional<z.ZodString>;
    profession: z.ZodOptional<z.ZodString>;
    industry: z.ZodOptional<z.ZodString>;
    experience: z.ZodOptional<z.ZodNumber>;
    salary: z.ZodOptional<z.ZodObject<{
        amount: z.ZodNumber;
        currency: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        amount?: number;
        currency?: string;
    }, {
        amount?: number;
        currency?: string;
    }>>;
    socialMedia: z.ZodOptional<z.ZodObject<{
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
    }>>;
    communication: z.ZodOptional<z.ZodObject<{
        preferredMethod: z.ZodOptional<z.ZodEnum<["email", "phone", "sms", "whatsapp", "linkedin", "other"]>>;
        bestTimeToCall: z.ZodOptional<z.ZodString>;
        timeZone: z.ZodOptional<z.ZodString>;
        doNotCall: z.ZodOptional<z.ZodBoolean>;
        doNotEmail: z.ZodOptional<z.ZodBoolean>;
        doNotSms: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        preferredMethod?: "email" | "phone" | "sms" | "other" | "whatsapp" | "linkedin";
        bestTimeToCall?: string;
        timeZone?: string;
        doNotCall?: boolean;
        doNotEmail?: boolean;
        doNotSms?: boolean;
    }, {
        preferredMethod?: "email" | "phone" | "sms" | "other" | "whatsapp" | "linkedin";
        bestTimeToCall?: string;
        timeZone?: string;
        doNotCall?: boolean;
        doNotEmail?: boolean;
        doNotSms?: boolean;
    }>>;
    settings: z.ZodOptional<z.ZodObject<{
        notifications: z.ZodOptional<z.ZodObject<{
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
        }>>;
        preferences: z.ZodOptional<z.ZodObject<{
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
        }>>;
        customFields: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        notes: z.ZodOptional<z.ZodString>;
        internalNotes: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        tags?: string[];
        notes?: string;
        notifications?: {
            push?: boolean;
            email?: boolean;
            phone?: boolean;
            sms?: boolean;
        };
        customFields?: Record<string, any>;
        preferences?: {
            language?: string;
            currency?: string;
            timezone?: string;
            dateFormat?: string;
            timeFormat?: string;
        };
        internalNotes?: string;
    }, {
        tags?: string[];
        notes?: string;
        notifications?: {
            push?: boolean;
            email?: boolean;
            phone?: boolean;
            sms?: boolean;
        };
        customFields?: Record<string, any>;
        preferences?: {
            language?: string;
            currency?: string;
            timezone?: string;
            dateFormat?: string;
            timeFormat?: string;
        };
        internalNotes?: string;
    }>>;
    assignedUserId: z.ZodOptional<z.ZodString>;
    nextFollowUpDate: z.ZodOptional<z.ZodDate>;
    leadScore: z.ZodOptional<z.ZodNumber>;
    engagementScore: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    type?: "user" | "primary" | "technical" | "financial" | "secondary" | "decision_maker" | "influencer" | "procurement";
    status?: "active" | "inactive" | "bounced" | "spam" | "unsubscribed" | "deleted";
    organizationId?: string;
    title?: string;
    source?: "event" | "email" | "website" | "content" | "other" | "referral" | "cold_call" | "social_media" | "trade_show" | "webinar" | "advertising";
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
    firstName?: string;
    lastName?: string;
    department?: string;
    companyId?: string;
    settings?: {
        tags?: string[];
        notes?: string;
        notifications?: {
            push?: boolean;
            email?: boolean;
            phone?: boolean;
            sms?: boolean;
        };
        customFields?: Record<string, any>;
        preferences?: {
            language?: string;
            currency?: string;
            timezone?: string;
            dateFormat?: string;
            timeFormat?: string;
        };
        internalNotes?: string;
    };
    priority?: "low" | "medium" | "high" | "urgent";
    assignedUserId?: string;
    nextFollowUpDate?: Date;
    leadScore?: number;
    middleName?: string;
    mobile?: string;
    fax?: string;
    birthday?: Date;
    anniversary?: Date;
    gender?: "other" | "male" | "female" | "prefer_not_to_say";
    maritalStatus?: "single" | "married" | "divorced" | "widowed" | "separated";
    children?: number;
    education?: string;
    profession?: string;
    experience?: number;
    salary?: {
        amount?: number;
        currency?: string;
    };
    socialMedia?: {
        other?: Record<string, string>;
        linkedin?: string;
        twitter?: string;
        facebook?: string;
        instagram?: string;
        youtube?: string;
        tiktok?: string;
    };
    communication?: {
        preferredMethod?: "email" | "phone" | "sms" | "other" | "whatsapp" | "linkedin";
        bestTimeToCall?: string;
        timeZone?: string;
        doNotCall?: boolean;
        doNotEmail?: boolean;
        doNotSms?: boolean;
    };
    engagementScore?: number;
}, {
    type?: "user" | "primary" | "technical" | "financial" | "secondary" | "decision_maker" | "influencer" | "procurement";
    status?: "active" | "inactive" | "bounced" | "spam" | "unsubscribed" | "deleted";
    organizationId?: string;
    title?: string;
    source?: "event" | "email" | "website" | "content" | "other" | "referral" | "cold_call" | "social_media" | "trade_show" | "webinar" | "advertising";
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
    firstName?: string;
    lastName?: string;
    department?: string;
    companyId?: string;
    settings?: {
        tags?: string[];
        notes?: string;
        notifications?: {
            push?: boolean;
            email?: boolean;
            phone?: boolean;
            sms?: boolean;
        };
        customFields?: Record<string, any>;
        preferences?: {
            language?: string;
            currency?: string;
            timezone?: string;
            dateFormat?: string;
            timeFormat?: string;
        };
        internalNotes?: string;
    };
    priority?: "low" | "medium" | "high" | "urgent";
    assignedUserId?: string;
    nextFollowUpDate?: Date;
    leadScore?: number;
    middleName?: string;
    mobile?: string;
    fax?: string;
    birthday?: Date;
    anniversary?: Date;
    gender?: "other" | "male" | "female" | "prefer_not_to_say";
    maritalStatus?: "single" | "married" | "divorced" | "widowed" | "separated";
    children?: number;
    education?: string;
    profession?: string;
    experience?: number;
    salary?: {
        amount?: number;
        currency?: string;
    };
    socialMedia?: {
        other?: Record<string, string>;
        linkedin?: string;
        twitter?: string;
        facebook?: string;
        instagram?: string;
        youtube?: string;
        tiktok?: string;
    };
    communication?: {
        preferredMethod?: "email" | "phone" | "sms" | "other" | "whatsapp" | "linkedin";
        bestTimeToCall?: string;
        timeZone?: string;
        doNotCall?: boolean;
        doNotEmail?: boolean;
        doNotSms?: boolean;
    };
    engagementScore?: number;
}>;
export declare const UpdateContactRequestSchema: z.ZodObject<Omit<{
    organizationId: z.ZodOptional<z.ZodString>;
    companyId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
    middleName: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    title: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    department: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    type: z.ZodOptional<z.ZodEnum<["primary", "secondary", "decision_maker", "influencer", "user", "technical", "financial", "procurement"]>>;
    status: z.ZodOptional<z.ZodEnum<["active", "inactive", "unsubscribed", "bounced", "spam", "deleted"]>>;
    source: z.ZodOptional<z.ZodEnum<["website", "referral", "cold_call", "email", "social_media", "event", "trade_show", "webinar", "content", "advertising", "other"]>>;
    priority: z.ZodOptional<z.ZodEnum<["low", "medium", "high", "urgent"]>>;
    email: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    phone: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    mobile: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    fax: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    website: z.ZodOptional<z.ZodOptional<z.ZodString>>;
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
    birthday: z.ZodOptional<z.ZodOptional<z.ZodDate>>;
    anniversary: z.ZodOptional<z.ZodOptional<z.ZodDate>>;
    gender: z.ZodOptional<z.ZodOptional<z.ZodEnum<["male", "female", "other", "prefer_not_to_say"]>>>;
    maritalStatus: z.ZodOptional<z.ZodOptional<z.ZodEnum<["single", "married", "divorced", "widowed", "separated"]>>>;
    children: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    education: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    profession: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    industry: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    experience: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    salary: z.ZodOptional<z.ZodOptional<z.ZodObject<{
        amount: z.ZodNumber;
        currency: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        amount?: number;
        currency?: string;
    }, {
        amount?: number;
        currency?: string;
    }>>>;
    socialMedia: z.ZodOptional<z.ZodOptional<z.ZodObject<{
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
    }>>>;
    communication: z.ZodOptional<z.ZodOptional<z.ZodObject<{
        preferredMethod: z.ZodOptional<z.ZodEnum<["email", "phone", "sms", "whatsapp", "linkedin", "other"]>>;
        bestTimeToCall: z.ZodOptional<z.ZodString>;
        timeZone: z.ZodOptional<z.ZodString>;
        doNotCall: z.ZodOptional<z.ZodBoolean>;
        doNotEmail: z.ZodOptional<z.ZodBoolean>;
        doNotSms: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        preferredMethod?: "email" | "phone" | "sms" | "other" | "whatsapp" | "linkedin";
        bestTimeToCall?: string;
        timeZone?: string;
        doNotCall?: boolean;
        doNotEmail?: boolean;
        doNotSms?: boolean;
    }, {
        preferredMethod?: "email" | "phone" | "sms" | "other" | "whatsapp" | "linkedin";
        bestTimeToCall?: string;
        timeZone?: string;
        doNotCall?: boolean;
        doNotEmail?: boolean;
        doNotSms?: boolean;
    }>>>;
    settings: z.ZodOptional<z.ZodOptional<z.ZodObject<{
        notifications: z.ZodOptional<z.ZodObject<{
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
        }>>;
        preferences: z.ZodOptional<z.ZodObject<{
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
        }>>;
        customFields: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        notes: z.ZodOptional<z.ZodString>;
        internalNotes: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        tags?: string[];
        notes?: string;
        notifications?: {
            push?: boolean;
            email?: boolean;
            phone?: boolean;
            sms?: boolean;
        };
        customFields?: Record<string, any>;
        preferences?: {
            language?: string;
            currency?: string;
            timezone?: string;
            dateFormat?: string;
            timeFormat?: string;
        };
        internalNotes?: string;
    }, {
        tags?: string[];
        notes?: string;
        notifications?: {
            push?: boolean;
            email?: boolean;
            phone?: boolean;
            sms?: boolean;
        };
        customFields?: Record<string, any>;
        preferences?: {
            language?: string;
            currency?: string;
            timezone?: string;
            dateFormat?: string;
            timeFormat?: string;
        };
        internalNotes?: string;
    }>>>;
    assignedUserId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    nextFollowUpDate: z.ZodOptional<z.ZodOptional<z.ZodDate>>;
    leadScore: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    engagementScore: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
}, "organizationId">, "strip", z.ZodTypeAny, {
    type?: "user" | "primary" | "technical" | "financial" | "secondary" | "decision_maker" | "influencer" | "procurement";
    status?: "active" | "inactive" | "bounced" | "spam" | "unsubscribed" | "deleted";
    title?: string;
    source?: "event" | "email" | "website" | "content" | "other" | "referral" | "cold_call" | "social_media" | "trade_show" | "webinar" | "advertising";
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
    firstName?: string;
    lastName?: string;
    department?: string;
    companyId?: string;
    settings?: {
        tags?: string[];
        notes?: string;
        notifications?: {
            push?: boolean;
            email?: boolean;
            phone?: boolean;
            sms?: boolean;
        };
        customFields?: Record<string, any>;
        preferences?: {
            language?: string;
            currency?: string;
            timezone?: string;
            dateFormat?: string;
            timeFormat?: string;
        };
        internalNotes?: string;
    };
    priority?: "low" | "medium" | "high" | "urgent";
    assignedUserId?: string;
    nextFollowUpDate?: Date;
    leadScore?: number;
    middleName?: string;
    mobile?: string;
    fax?: string;
    birthday?: Date;
    anniversary?: Date;
    gender?: "other" | "male" | "female" | "prefer_not_to_say";
    maritalStatus?: "single" | "married" | "divorced" | "widowed" | "separated";
    children?: number;
    education?: string;
    profession?: string;
    experience?: number;
    salary?: {
        amount?: number;
        currency?: string;
    };
    socialMedia?: {
        other?: Record<string, string>;
        linkedin?: string;
        twitter?: string;
        facebook?: string;
        instagram?: string;
        youtube?: string;
        tiktok?: string;
    };
    communication?: {
        preferredMethod?: "email" | "phone" | "sms" | "other" | "whatsapp" | "linkedin";
        bestTimeToCall?: string;
        timeZone?: string;
        doNotCall?: boolean;
        doNotEmail?: boolean;
        doNotSms?: boolean;
    };
    engagementScore?: number;
}, {
    type?: "user" | "primary" | "technical" | "financial" | "secondary" | "decision_maker" | "influencer" | "procurement";
    status?: "active" | "inactive" | "bounced" | "spam" | "unsubscribed" | "deleted";
    title?: string;
    source?: "event" | "email" | "website" | "content" | "other" | "referral" | "cold_call" | "social_media" | "trade_show" | "webinar" | "advertising";
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
    firstName?: string;
    lastName?: string;
    department?: string;
    companyId?: string;
    settings?: {
        tags?: string[];
        notes?: string;
        notifications?: {
            push?: boolean;
            email?: boolean;
            phone?: boolean;
            sms?: boolean;
        };
        customFields?: Record<string, any>;
        preferences?: {
            language?: string;
            currency?: string;
            timezone?: string;
            dateFormat?: string;
            timeFormat?: string;
        };
        internalNotes?: string;
    };
    priority?: "low" | "medium" | "high" | "urgent";
    assignedUserId?: string;
    nextFollowUpDate?: Date;
    leadScore?: number;
    middleName?: string;
    mobile?: string;
    fax?: string;
    birthday?: Date;
    anniversary?: Date;
    gender?: "other" | "male" | "female" | "prefer_not_to_say";
    maritalStatus?: "single" | "married" | "divorced" | "widowed" | "separated";
    children?: number;
    education?: string;
    profession?: string;
    experience?: number;
    salary?: {
        amount?: number;
        currency?: string;
    };
    socialMedia?: {
        other?: Record<string, string>;
        linkedin?: string;
        twitter?: string;
        facebook?: string;
        instagram?: string;
        youtube?: string;
        tiktok?: string;
    };
    communication?: {
        preferredMethod?: "email" | "phone" | "sms" | "other" | "whatsapp" | "linkedin";
        bestTimeToCall?: string;
        timeZone?: string;
        doNotCall?: boolean;
        doNotEmail?: boolean;
        doNotSms?: boolean;
    };
    engagementScore?: number;
}>;
export declare const DeleteContactRequestSchema: z.ZodObject<{
    contactId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    contactId?: string;
}, {
    contactId?: string;
}>;
export declare const GetContactRequestSchema: z.ZodObject<{
    contactId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    contactId?: string;
}, {
    contactId?: string;
}>;
export declare const SearchContactsRequestSchema: z.ZodObject<{
    organizationId: z.ZodString;
    query: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodEnum<["primary", "secondary", "decision_maker", "influencer", "user", "technical", "financial", "procurement"]>>;
    status: z.ZodOptional<z.ZodEnum<["active", "inactive", "unsubscribed", "bounced", "spam", "deleted"]>>;
    source: z.ZodOptional<z.ZodEnum<["website", "referral", "cold_call", "email", "social_media", "event", "trade_show", "webinar", "content", "advertising", "other"]>>;
    priority: z.ZodOptional<z.ZodEnum<["low", "medium", "high", "urgent"]>>;
    assignedUserId: z.ZodOptional<z.ZodString>;
    companyId: z.ZodOptional<z.ZodString>;
    department: z.ZodOptional<z.ZodString>;
    industry: z.ZodOptional<z.ZodString>;
    profession: z.ZodOptional<z.ZodString>;
    isActive: z.ZodOptional<z.ZodBoolean>;
    isVerified: z.ZodOptional<z.ZodBoolean>;
    isOptedIn: z.ZodOptional<z.ZodBoolean>;
    hasCompany: z.ZodOptional<z.ZodBoolean>;
    isAssigned: z.ZodOptional<z.ZodBoolean>;
    leadScoreMin: z.ZodOptional<z.ZodNumber>;
    leadScoreMax: z.ZodOptional<z.ZodNumber>;
    engagementScoreMin: z.ZodOptional<z.ZodNumber>;
    engagementScoreMax: z.ZodOptional<z.ZodNumber>;
    revenueMin: z.ZodOptional<z.ZodNumber>;
    revenueMax: z.ZodOptional<z.ZodNumber>;
    currency: z.ZodOptional<z.ZodString>;
    salaryMin: z.ZodOptional<z.ZodNumber>;
    salaryMax: z.ZodOptional<z.ZodNumber>;
    experienceMin: z.ZodOptional<z.ZodNumber>;
    experienceMax: z.ZodOptional<z.ZodNumber>;
    ageMin: z.ZodOptional<z.ZodNumber>;
    ageMax: z.ZodOptional<z.ZodNumber>;
    lastContactAfter: z.ZodOptional<z.ZodDate>;
    lastContactBefore: z.ZodOptional<z.ZodDate>;
    nextFollowUpAfter: z.ZodOptional<z.ZodDate>;
    nextFollowUpBefore: z.ZodOptional<z.ZodDate>;
    lastEmailOpenAfter: z.ZodOptional<z.ZodDate>;
    lastEmailOpenBefore: z.ZodOptional<z.ZodDate>;
    lastEmailClickAfter: z.ZodOptional<z.ZodDate>;
    lastEmailClickBefore: z.ZodOptional<z.ZodDate>;
    lastWebsiteVisitAfter: z.ZodOptional<z.ZodDate>;
    lastWebsiteVisitBefore: z.ZodOptional<z.ZodDate>;
    lastSocialMediaInteractionAfter: z.ZodOptional<z.ZodDate>;
    lastSocialMediaInteractionBefore: z.ZodOptional<z.ZodDate>;
    createdAfter: z.ZodOptional<z.ZodDate>;
    createdBefore: z.ZodOptional<z.ZodDate>;
    updatedAfter: z.ZodOptional<z.ZodDate>;
    updatedBefore: z.ZodOptional<z.ZodDate>;
    birthdayAfter: z.ZodOptional<z.ZodDate>;
    birthdayBefore: z.ZodOptional<z.ZodDate>;
    anniversaryAfter: z.ZodOptional<z.ZodDate>;
    anniversaryBefore: z.ZodOptional<z.ZodDate>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    sortBy: z.ZodDefault<z.ZodEnum<["firstName", "lastName", "type", "status", "source", "priority", "leadScore", "engagementScore", "totalRevenue", "salary", "experience", "lastContactDate", "nextFollowUpDate", "createdAt", "updatedAt"]>>;
    sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    query?: string;
    type?: "user" | "primary" | "technical" | "financial" | "secondary" | "decision_maker" | "influencer" | "procurement";
    status?: "active" | "inactive" | "bounced" | "spam" | "unsubscribed" | "deleted";
    organizationId?: string;
    page?: number;
    limit?: number;
    source?: "event" | "email" | "website" | "content" | "other" | "referral" | "cold_call" | "social_media" | "trade_show" | "webinar" | "advertising";
    industry?: string;
    tags?: string[];
    department?: string;
    companyId?: string;
    currency?: string;
    isActive?: boolean;
    priority?: "low" | "medium" | "high" | "urgent";
    assignedUserId?: string;
    profession?: string;
    isVerified?: boolean;
    isOptedIn?: boolean;
    sortBy?: "type" | "status" | "source" | "createdAt" | "updatedAt" | "firstName" | "lastName" | "priority" | "lastContactDate" | "nextFollowUpDate" | "leadScore" | "experience" | "salary" | "engagementScore" | "totalRevenue";
    sortOrder?: "asc" | "desc";
    isAssigned?: boolean;
    leadScoreMin?: number;
    leadScoreMax?: number;
    revenueMin?: number;
    revenueMax?: number;
    lastContactAfter?: Date;
    lastContactBefore?: Date;
    nextFollowUpAfter?: Date;
    nextFollowUpBefore?: Date;
    createdAfter?: Date;
    createdBefore?: Date;
    updatedAfter?: Date;
    updatedBefore?: Date;
    hasCompany?: boolean;
    engagementScoreMin?: number;
    engagementScoreMax?: number;
    salaryMin?: number;
    salaryMax?: number;
    experienceMin?: number;
    experienceMax?: number;
    ageMin?: number;
    ageMax?: number;
    lastEmailOpenAfter?: Date;
    lastEmailOpenBefore?: Date;
    lastEmailClickAfter?: Date;
    lastEmailClickBefore?: Date;
    lastWebsiteVisitAfter?: Date;
    lastWebsiteVisitBefore?: Date;
    lastSocialMediaInteractionAfter?: Date;
    lastSocialMediaInteractionBefore?: Date;
    birthdayAfter?: Date;
    birthdayBefore?: Date;
    anniversaryAfter?: Date;
    anniversaryBefore?: Date;
}, {
    query?: string;
    type?: "user" | "primary" | "technical" | "financial" | "secondary" | "decision_maker" | "influencer" | "procurement";
    status?: "active" | "inactive" | "bounced" | "spam" | "unsubscribed" | "deleted";
    organizationId?: string;
    page?: number;
    limit?: number;
    source?: "event" | "email" | "website" | "content" | "other" | "referral" | "cold_call" | "social_media" | "trade_show" | "webinar" | "advertising";
    industry?: string;
    tags?: string[];
    department?: string;
    companyId?: string;
    currency?: string;
    isActive?: boolean;
    priority?: "low" | "medium" | "high" | "urgent";
    assignedUserId?: string;
    profession?: string;
    isVerified?: boolean;
    isOptedIn?: boolean;
    sortBy?: "type" | "status" | "source" | "createdAt" | "updatedAt" | "firstName" | "lastName" | "priority" | "lastContactDate" | "nextFollowUpDate" | "leadScore" | "experience" | "salary" | "engagementScore" | "totalRevenue";
    sortOrder?: "asc" | "desc";
    isAssigned?: boolean;
    leadScoreMin?: number;
    leadScoreMax?: number;
    revenueMin?: number;
    revenueMax?: number;
    lastContactAfter?: Date;
    lastContactBefore?: Date;
    nextFollowUpAfter?: Date;
    nextFollowUpBefore?: Date;
    createdAfter?: Date;
    createdBefore?: Date;
    updatedAfter?: Date;
    updatedBefore?: Date;
    hasCompany?: boolean;
    engagementScoreMin?: number;
    engagementScoreMax?: number;
    salaryMin?: number;
    salaryMax?: number;
    experienceMin?: number;
    experienceMax?: number;
    ageMin?: number;
    ageMax?: number;
    lastEmailOpenAfter?: Date;
    lastEmailOpenBefore?: Date;
    lastEmailClickAfter?: Date;
    lastEmailClickBefore?: Date;
    lastWebsiteVisitAfter?: Date;
    lastWebsiteVisitBefore?: Date;
    lastSocialMediaInteractionAfter?: Date;
    lastSocialMediaInteractionBefore?: Date;
    birthdayAfter?: Date;
    birthdayBefore?: Date;
    anniversaryAfter?: Date;
    anniversaryBefore?: Date;
}>;
export declare const BulkUpdateContactsRequestSchema: z.ZodObject<{
    contactIds: z.ZodArray<z.ZodString, "many">;
    updates: z.ZodObject<Omit<{
        organizationId: z.ZodOptional<z.ZodString>;
        companyId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        firstName: z.ZodOptional<z.ZodString>;
        lastName: z.ZodOptional<z.ZodString>;
        middleName: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        title: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        department: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        type: z.ZodOptional<z.ZodEnum<["primary", "secondary", "decision_maker", "influencer", "user", "technical", "financial", "procurement"]>>;
        status: z.ZodOptional<z.ZodEnum<["active", "inactive", "unsubscribed", "bounced", "spam", "deleted"]>>;
        source: z.ZodOptional<z.ZodEnum<["website", "referral", "cold_call", "email", "social_media", "event", "trade_show", "webinar", "content", "advertising", "other"]>>;
        priority: z.ZodOptional<z.ZodEnum<["low", "medium", "high", "urgent"]>>;
        email: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        phone: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        mobile: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        fax: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        website: z.ZodOptional<z.ZodOptional<z.ZodString>>;
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
        birthday: z.ZodOptional<z.ZodOptional<z.ZodDate>>;
        anniversary: z.ZodOptional<z.ZodOptional<z.ZodDate>>;
        gender: z.ZodOptional<z.ZodOptional<z.ZodEnum<["male", "female", "other", "prefer_not_to_say"]>>>;
        maritalStatus: z.ZodOptional<z.ZodOptional<z.ZodEnum<["single", "married", "divorced", "widowed", "separated"]>>>;
        children: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
        education: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        profession: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        industry: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        experience: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
        salary: z.ZodOptional<z.ZodOptional<z.ZodObject<{
            amount: z.ZodNumber;
            currency: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            amount?: number;
            currency?: string;
        }, {
            amount?: number;
            currency?: string;
        }>>>;
        socialMedia: z.ZodOptional<z.ZodOptional<z.ZodObject<{
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
        }>>>;
        communication: z.ZodOptional<z.ZodOptional<z.ZodObject<{
            preferredMethod: z.ZodOptional<z.ZodEnum<["email", "phone", "sms", "whatsapp", "linkedin", "other"]>>;
            bestTimeToCall: z.ZodOptional<z.ZodString>;
            timeZone: z.ZodOptional<z.ZodString>;
            doNotCall: z.ZodOptional<z.ZodBoolean>;
            doNotEmail: z.ZodOptional<z.ZodBoolean>;
            doNotSms: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            preferredMethod?: "email" | "phone" | "sms" | "other" | "whatsapp" | "linkedin";
            bestTimeToCall?: string;
            timeZone?: string;
            doNotCall?: boolean;
            doNotEmail?: boolean;
            doNotSms?: boolean;
        }, {
            preferredMethod?: "email" | "phone" | "sms" | "other" | "whatsapp" | "linkedin";
            bestTimeToCall?: string;
            timeZone?: string;
            doNotCall?: boolean;
            doNotEmail?: boolean;
            doNotSms?: boolean;
        }>>>;
        settings: z.ZodOptional<z.ZodOptional<z.ZodObject<{
            notifications: z.ZodOptional<z.ZodObject<{
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
            }>>;
            preferences: z.ZodOptional<z.ZodObject<{
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
            }>>;
            customFields: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
            tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            notes: z.ZodOptional<z.ZodString>;
            internalNotes: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            tags?: string[];
            notes?: string;
            notifications?: {
                push?: boolean;
                email?: boolean;
                phone?: boolean;
                sms?: boolean;
            };
            customFields?: Record<string, any>;
            preferences?: {
                language?: string;
                currency?: string;
                timezone?: string;
                dateFormat?: string;
                timeFormat?: string;
            };
            internalNotes?: string;
        }, {
            tags?: string[];
            notes?: string;
            notifications?: {
                push?: boolean;
                email?: boolean;
                phone?: boolean;
                sms?: boolean;
            };
            customFields?: Record<string, any>;
            preferences?: {
                language?: string;
                currency?: string;
                timezone?: string;
                dateFormat?: string;
                timeFormat?: string;
            };
            internalNotes?: string;
        }>>>;
        assignedUserId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        nextFollowUpDate: z.ZodOptional<z.ZodOptional<z.ZodDate>>;
        leadScore: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
        engagementScore: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    }, "organizationId">, "strip", z.ZodTypeAny, {
        type?: "user" | "primary" | "technical" | "financial" | "secondary" | "decision_maker" | "influencer" | "procurement";
        status?: "active" | "inactive" | "bounced" | "spam" | "unsubscribed" | "deleted";
        title?: string;
        source?: "event" | "email" | "website" | "content" | "other" | "referral" | "cold_call" | "social_media" | "trade_show" | "webinar" | "advertising";
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
        firstName?: string;
        lastName?: string;
        department?: string;
        companyId?: string;
        settings?: {
            tags?: string[];
            notes?: string;
            notifications?: {
                push?: boolean;
                email?: boolean;
                phone?: boolean;
                sms?: boolean;
            };
            customFields?: Record<string, any>;
            preferences?: {
                language?: string;
                currency?: string;
                timezone?: string;
                dateFormat?: string;
                timeFormat?: string;
            };
            internalNotes?: string;
        };
        priority?: "low" | "medium" | "high" | "urgent";
        assignedUserId?: string;
        nextFollowUpDate?: Date;
        leadScore?: number;
        middleName?: string;
        mobile?: string;
        fax?: string;
        birthday?: Date;
        anniversary?: Date;
        gender?: "other" | "male" | "female" | "prefer_not_to_say";
        maritalStatus?: "single" | "married" | "divorced" | "widowed" | "separated";
        children?: number;
        education?: string;
        profession?: string;
        experience?: number;
        salary?: {
            amount?: number;
            currency?: string;
        };
        socialMedia?: {
            other?: Record<string, string>;
            linkedin?: string;
            twitter?: string;
            facebook?: string;
            instagram?: string;
            youtube?: string;
            tiktok?: string;
        };
        communication?: {
            preferredMethod?: "email" | "phone" | "sms" | "other" | "whatsapp" | "linkedin";
            bestTimeToCall?: string;
            timeZone?: string;
            doNotCall?: boolean;
            doNotEmail?: boolean;
            doNotSms?: boolean;
        };
        engagementScore?: number;
    }, {
        type?: "user" | "primary" | "technical" | "financial" | "secondary" | "decision_maker" | "influencer" | "procurement";
        status?: "active" | "inactive" | "bounced" | "spam" | "unsubscribed" | "deleted";
        title?: string;
        source?: "event" | "email" | "website" | "content" | "other" | "referral" | "cold_call" | "social_media" | "trade_show" | "webinar" | "advertising";
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
        firstName?: string;
        lastName?: string;
        department?: string;
        companyId?: string;
        settings?: {
            tags?: string[];
            notes?: string;
            notifications?: {
                push?: boolean;
                email?: boolean;
                phone?: boolean;
                sms?: boolean;
            };
            customFields?: Record<string, any>;
            preferences?: {
                language?: string;
                currency?: string;
                timezone?: string;
                dateFormat?: string;
                timeFormat?: string;
            };
            internalNotes?: string;
        };
        priority?: "low" | "medium" | "high" | "urgent";
        assignedUserId?: string;
        nextFollowUpDate?: Date;
        leadScore?: number;
        middleName?: string;
        mobile?: string;
        fax?: string;
        birthday?: Date;
        anniversary?: Date;
        gender?: "other" | "male" | "female" | "prefer_not_to_say";
        maritalStatus?: "single" | "married" | "divorced" | "widowed" | "separated";
        children?: number;
        education?: string;
        profession?: string;
        experience?: number;
        salary?: {
            amount?: number;
            currency?: string;
        };
        socialMedia?: {
            other?: Record<string, string>;
            linkedin?: string;
            twitter?: string;
            facebook?: string;
            instagram?: string;
            youtube?: string;
            tiktok?: string;
        };
        communication?: {
            preferredMethod?: "email" | "phone" | "sms" | "other" | "whatsapp" | "linkedin";
            bestTimeToCall?: string;
            timeZone?: string;
            doNotCall?: boolean;
            doNotEmail?: boolean;
            doNotSms?: boolean;
        };
        engagementScore?: number;
    }>;
}, "strip", z.ZodTypeAny, {
    updates?: {
        type?: "user" | "primary" | "technical" | "financial" | "secondary" | "decision_maker" | "influencer" | "procurement";
        status?: "active" | "inactive" | "bounced" | "spam" | "unsubscribed" | "deleted";
        title?: string;
        source?: "event" | "email" | "website" | "content" | "other" | "referral" | "cold_call" | "social_media" | "trade_show" | "webinar" | "advertising";
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
        firstName?: string;
        lastName?: string;
        department?: string;
        companyId?: string;
        settings?: {
            tags?: string[];
            notes?: string;
            notifications?: {
                push?: boolean;
                email?: boolean;
                phone?: boolean;
                sms?: boolean;
            };
            customFields?: Record<string, any>;
            preferences?: {
                language?: string;
                currency?: string;
                timezone?: string;
                dateFormat?: string;
                timeFormat?: string;
            };
            internalNotes?: string;
        };
        priority?: "low" | "medium" | "high" | "urgent";
        assignedUserId?: string;
        nextFollowUpDate?: Date;
        leadScore?: number;
        middleName?: string;
        mobile?: string;
        fax?: string;
        birthday?: Date;
        anniversary?: Date;
        gender?: "other" | "male" | "female" | "prefer_not_to_say";
        maritalStatus?: "single" | "married" | "divorced" | "widowed" | "separated";
        children?: number;
        education?: string;
        profession?: string;
        experience?: number;
        salary?: {
            amount?: number;
            currency?: string;
        };
        socialMedia?: {
            other?: Record<string, string>;
            linkedin?: string;
            twitter?: string;
            facebook?: string;
            instagram?: string;
            youtube?: string;
            tiktok?: string;
        };
        communication?: {
            preferredMethod?: "email" | "phone" | "sms" | "other" | "whatsapp" | "linkedin";
            bestTimeToCall?: string;
            timeZone?: string;
            doNotCall?: boolean;
            doNotEmail?: boolean;
            doNotSms?: boolean;
        };
        engagementScore?: number;
    };
    contactIds?: string[];
}, {
    updates?: {
        type?: "user" | "primary" | "technical" | "financial" | "secondary" | "decision_maker" | "influencer" | "procurement";
        status?: "active" | "inactive" | "bounced" | "spam" | "unsubscribed" | "deleted";
        title?: string;
        source?: "event" | "email" | "website" | "content" | "other" | "referral" | "cold_call" | "social_media" | "trade_show" | "webinar" | "advertising";
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
        firstName?: string;
        lastName?: string;
        department?: string;
        companyId?: string;
        settings?: {
            tags?: string[];
            notes?: string;
            notifications?: {
                push?: boolean;
                email?: boolean;
                phone?: boolean;
                sms?: boolean;
            };
            customFields?: Record<string, any>;
            preferences?: {
                language?: string;
                currency?: string;
                timezone?: string;
                dateFormat?: string;
                timeFormat?: string;
            };
            internalNotes?: string;
        };
        priority?: "low" | "medium" | "high" | "urgent";
        assignedUserId?: string;
        nextFollowUpDate?: Date;
        leadScore?: number;
        middleName?: string;
        mobile?: string;
        fax?: string;
        birthday?: Date;
        anniversary?: Date;
        gender?: "other" | "male" | "female" | "prefer_not_to_say";
        maritalStatus?: "single" | "married" | "divorced" | "widowed" | "separated";
        children?: number;
        education?: string;
        profession?: string;
        experience?: number;
        salary?: {
            amount?: number;
            currency?: string;
        };
        socialMedia?: {
            other?: Record<string, string>;
            linkedin?: string;
            twitter?: string;
            facebook?: string;
            instagram?: string;
            youtube?: string;
            tiktok?: string;
        };
        communication?: {
            preferredMethod?: "email" | "phone" | "sms" | "other" | "whatsapp" | "linkedin";
            bestTimeToCall?: string;
            timeZone?: string;
            doNotCall?: boolean;
            doNotEmail?: boolean;
            doNotSms?: boolean;
        };
        engagementScore?: number;
    };
    contactIds?: string[];
}>;
export declare const BulkDeleteContactsRequestSchema: z.ZodObject<{
    contactIds: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    contactIds?: string[];
}, {
    contactIds?: string[];
}>;
export declare const ContactResponseSchema: z.ZodObject<{
    id: z.ZodString;
    organizationId: z.ZodString;
    companyId: z.ZodNullable<z.ZodString>;
    firstName: z.ZodString;
    lastName: z.ZodString;
    middleName: z.ZodNullable<z.ZodString>;
    title: z.ZodNullable<z.ZodString>;
    department: z.ZodNullable<z.ZodString>;
    type: z.ZodEnum<["primary", "secondary", "decision_maker", "influencer", "user", "technical", "financial", "procurement"]>;
    status: z.ZodEnum<["active", "inactive", "unsubscribed", "bounced", "spam", "deleted"]>;
    source: z.ZodEnum<["website", "referral", "cold_call", "email", "social_media", "event", "trade_show", "webinar", "content", "advertising", "other"]>;
    priority: z.ZodEnum<["low", "medium", "high", "urgent"]>;
    email: z.ZodNullable<z.ZodString>;
    phone: z.ZodNullable<z.ZodString>;
    mobile: z.ZodNullable<z.ZodString>;
    fax: z.ZodNullable<z.ZodString>;
    website: z.ZodNullable<z.ZodString>;
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
    birthday: z.ZodNullable<z.ZodDate>;
    anniversary: z.ZodNullable<z.ZodDate>;
    gender: z.ZodNullable<z.ZodString>;
    maritalStatus: z.ZodNullable<z.ZodString>;
    children: z.ZodNullable<z.ZodNumber>;
    education: z.ZodNullable<z.ZodString>;
    profession: z.ZodNullable<z.ZodString>;
    industry: z.ZodNullable<z.ZodString>;
    experience: z.ZodNullable<z.ZodNumber>;
    salary: z.ZodNullable<z.ZodObject<{
        amount: z.ZodNumber;
        currency: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        amount?: number;
        currency?: string;
    }, {
        amount?: number;
        currency?: string;
    }>>;
    socialMedia: z.ZodRecord<z.ZodString, z.ZodAny>;
    communication: z.ZodRecord<z.ZodString, z.ZodAny>;
    settings: z.ZodObject<{
        notifications: z.ZodObject<{
            email: z.ZodBoolean;
            sms: z.ZodBoolean;
            push: z.ZodBoolean;
            phone: z.ZodBoolean;
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
        preferences: z.ZodObject<{
            language: z.ZodString;
            timezone: z.ZodString;
            currency: z.ZodString;
            dateFormat: z.ZodString;
            timeFormat: z.ZodString;
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
        customFields: z.ZodRecord<z.ZodString, z.ZodAny>;
        tags: z.ZodArray<z.ZodString, "many">;
        notes: z.ZodString;
        internalNotes: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        tags?: string[];
        notes?: string;
        notifications?: {
            push?: boolean;
            email?: boolean;
            phone?: boolean;
            sms?: boolean;
        };
        customFields?: Record<string, any>;
        preferences?: {
            language?: string;
            currency?: string;
            timezone?: string;
            dateFormat?: string;
            timeFormat?: string;
        };
        internalNotes?: string;
    }, {
        tags?: string[];
        notes?: string;
        notifications?: {
            push?: boolean;
            email?: boolean;
            phone?: boolean;
            sms?: boolean;
        };
        customFields?: Record<string, any>;
        preferences?: {
            language?: string;
            currency?: string;
            timezone?: string;
            dateFormat?: string;
            timeFormat?: string;
        };
        internalNotes?: string;
    }>;
    assignedUserId: z.ZodNullable<z.ZodString>;
    lastContactDate: z.ZodNullable<z.ZodDate>;
    nextFollowUpDate: z.ZodNullable<z.ZodDate>;
    leadScore: z.ZodNullable<z.ZodNumber>;
    engagementScore: z.ZodNullable<z.ZodNumber>;
    lastEmailOpen: z.ZodNullable<z.ZodDate>;
    lastEmailClick: z.ZodNullable<z.ZodDate>;
    lastWebsiteVisit: z.ZodNullable<z.ZodDate>;
    lastSocialMediaInteraction: z.ZodNullable<z.ZodDate>;
    totalInteractions: z.ZodNumber;
    totalEmailsSent: z.ZodNumber;
    totalEmailsOpened: z.ZodNumber;
    totalEmailsClicked: z.ZodNumber;
    totalCallsMade: z.ZodNumber;
    totalMeetingsScheduled: z.ZodNumber;
    totalMeetingsAttended: z.ZodNumber;
    totalDealsWon: z.ZodNumber;
    totalDealsLost: z.ZodNumber;
    totalRevenue: z.ZodObject<{
        amount: z.ZodNumber;
        currency: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        amount?: number;
        currency?: string;
    }, {
        amount?: number;
        currency?: string;
    }>;
    isActive: z.ZodBoolean;
    isVerified: z.ZodBoolean;
    isOptedIn: z.ZodBoolean;
    fullName: z.ZodString;
    displayName: z.ZodString;
    leadScoreLevel: z.ZodEnum<["low", "medium", "high"]>;
    engagementScoreLevel: z.ZodEnum<["low", "medium", "high"]>;
    emailOpenRate: z.ZodNumber;
    emailClickRate: z.ZodNumber;
    meetingAttendanceRate: z.ZodNumber;
    dealWinRate: z.ZodNumber;
    averageDealValue: z.ZodObject<{
        amount: z.ZodNumber;
        currency: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        amount?: number;
        currency?: string;
    }, {
        amount?: number;
        currency?: string;
    }>;
    isPrimary: z.ZodBoolean;
    isDecisionMaker: z.ZodBoolean;
    isInfluencer: z.ZodBoolean;
    isTechnical: z.ZodBoolean;
    isFinancial: z.ZodBoolean;
    isProcurement: z.ZodBoolean;
    isAssigned: z.ZodBoolean;
    hasCompany: z.ZodBoolean;
    isOverdueForFollowUp: z.ZodBoolean;
    daysSinceLastContact: z.ZodNumber;
    daysUntilFollowUp: z.ZodNumber;
    age: z.ZodNullable<z.ZodNumber>;
    isBirthdayToday: z.ZodBoolean;
    isAnniversaryToday: z.ZodBoolean;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    type?: "user" | "primary" | "technical" | "financial" | "secondary" | "decision_maker" | "influencer" | "procurement";
    status?: "active" | "inactive" | "bounced" | "spam" | "unsubscribed" | "deleted";
    organizationId?: string;
    title?: string;
    id?: string;
    source?: "event" | "email" | "website" | "content" | "other" | "referral" | "cold_call" | "social_media" | "trade_show" | "webinar" | "advertising";
    age?: number;
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
    firstName?: string;
    lastName?: string;
    department?: string;
    companyId?: string;
    isPrimary?: boolean;
    isActive?: boolean;
    settings?: {
        tags?: string[];
        notes?: string;
        notifications?: {
            push?: boolean;
            email?: boolean;
            phone?: boolean;
            sms?: boolean;
        };
        customFields?: Record<string, any>;
        preferences?: {
            language?: string;
            currency?: string;
            timezone?: string;
            dateFormat?: string;
            timeFormat?: string;
        };
        internalNotes?: string;
    };
    priority?: "low" | "medium" | "high" | "urgent";
    assignedUserId?: string;
    lastContactDate?: Date;
    nextFollowUpDate?: Date;
    leadScore?: number;
    middleName?: string;
    mobile?: string;
    fax?: string;
    birthday?: Date;
    anniversary?: Date;
    gender?: string;
    maritalStatus?: string;
    children?: number;
    education?: string;
    profession?: string;
    experience?: number;
    salary?: {
        amount?: number;
        currency?: string;
    };
    socialMedia?: Record<string, any>;
    communication?: Record<string, any>;
    engagementScore?: number;
    lastEmailOpen?: Date;
    lastEmailClick?: Date;
    lastWebsiteVisit?: Date;
    lastSocialMediaInteraction?: Date;
    totalInteractions?: number;
    totalEmailsSent?: number;
    totalEmailsOpened?: number;
    totalEmailsClicked?: number;
    totalCallsMade?: number;
    totalMeetingsScheduled?: number;
    totalMeetingsAttended?: number;
    totalDealsWon?: number;
    totalDealsLost?: number;
    totalRevenue?: {
        amount?: number;
        currency?: string;
    };
    isVerified?: boolean;
    isOptedIn?: boolean;
    fullName?: string;
    isAssigned?: boolean;
    leadScoreLevel?: "low" | "medium" | "high";
    isOverdueForFollowUp?: boolean;
    daysSinceLastContact?: number;
    daysUntilFollowUp?: number;
    hasCompany?: boolean;
    displayName?: string;
    engagementScoreLevel?: "low" | "medium" | "high";
    emailOpenRate?: number;
    emailClickRate?: number;
    meetingAttendanceRate?: number;
    dealWinRate?: number;
    averageDealValue?: {
        amount?: number;
        currency?: string;
    };
    isDecisionMaker?: boolean;
    isInfluencer?: boolean;
    isTechnical?: boolean;
    isFinancial?: boolean;
    isProcurement?: boolean;
    isBirthdayToday?: boolean;
    isAnniversaryToday?: boolean;
}, {
    type?: "user" | "primary" | "technical" | "financial" | "secondary" | "decision_maker" | "influencer" | "procurement";
    status?: "active" | "inactive" | "bounced" | "spam" | "unsubscribed" | "deleted";
    organizationId?: string;
    title?: string;
    id?: string;
    source?: "event" | "email" | "website" | "content" | "other" | "referral" | "cold_call" | "social_media" | "trade_show" | "webinar" | "advertising";
    age?: number;
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
    firstName?: string;
    lastName?: string;
    department?: string;
    companyId?: string;
    isPrimary?: boolean;
    isActive?: boolean;
    settings?: {
        tags?: string[];
        notes?: string;
        notifications?: {
            push?: boolean;
            email?: boolean;
            phone?: boolean;
            sms?: boolean;
        };
        customFields?: Record<string, any>;
        preferences?: {
            language?: string;
            currency?: string;
            timezone?: string;
            dateFormat?: string;
            timeFormat?: string;
        };
        internalNotes?: string;
    };
    priority?: "low" | "medium" | "high" | "urgent";
    assignedUserId?: string;
    lastContactDate?: Date;
    nextFollowUpDate?: Date;
    leadScore?: number;
    middleName?: string;
    mobile?: string;
    fax?: string;
    birthday?: Date;
    anniversary?: Date;
    gender?: string;
    maritalStatus?: string;
    children?: number;
    education?: string;
    profession?: string;
    experience?: number;
    salary?: {
        amount?: number;
        currency?: string;
    };
    socialMedia?: Record<string, any>;
    communication?: Record<string, any>;
    engagementScore?: number;
    lastEmailOpen?: Date;
    lastEmailClick?: Date;
    lastWebsiteVisit?: Date;
    lastSocialMediaInteraction?: Date;
    totalInteractions?: number;
    totalEmailsSent?: number;
    totalEmailsOpened?: number;
    totalEmailsClicked?: number;
    totalCallsMade?: number;
    totalMeetingsScheduled?: number;
    totalMeetingsAttended?: number;
    totalDealsWon?: number;
    totalDealsLost?: number;
    totalRevenue?: {
        amount?: number;
        currency?: string;
    };
    isVerified?: boolean;
    isOptedIn?: boolean;
    fullName?: string;
    isAssigned?: boolean;
    leadScoreLevel?: "low" | "medium" | "high";
    isOverdueForFollowUp?: boolean;
    daysSinceLastContact?: number;
    daysUntilFollowUp?: number;
    hasCompany?: boolean;
    displayName?: string;
    engagementScoreLevel?: "low" | "medium" | "high";
    emailOpenRate?: number;
    emailClickRate?: number;
    meetingAttendanceRate?: number;
    dealWinRate?: number;
    averageDealValue?: {
        amount?: number;
        currency?: string;
    };
    isDecisionMaker?: boolean;
    isInfluencer?: boolean;
    isTechnical?: boolean;
    isFinancial?: boolean;
    isProcurement?: boolean;
    isBirthdayToday?: boolean;
    isAnniversaryToday?: boolean;
}>;
export declare const ContactListResponseSchema: z.ZodObject<{
    contacts: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        organizationId: z.ZodString;
        companyId: z.ZodNullable<z.ZodString>;
        firstName: z.ZodString;
        lastName: z.ZodString;
        middleName: z.ZodNullable<z.ZodString>;
        title: z.ZodNullable<z.ZodString>;
        department: z.ZodNullable<z.ZodString>;
        type: z.ZodEnum<["primary", "secondary", "decision_maker", "influencer", "user", "technical", "financial", "procurement"]>;
        status: z.ZodEnum<["active", "inactive", "unsubscribed", "bounced", "spam", "deleted"]>;
        source: z.ZodEnum<["website", "referral", "cold_call", "email", "social_media", "event", "trade_show", "webinar", "content", "advertising", "other"]>;
        priority: z.ZodEnum<["low", "medium", "high", "urgent"]>;
        email: z.ZodNullable<z.ZodString>;
        phone: z.ZodNullable<z.ZodString>;
        mobile: z.ZodNullable<z.ZodString>;
        fax: z.ZodNullable<z.ZodString>;
        website: z.ZodNullable<z.ZodString>;
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
        birthday: z.ZodNullable<z.ZodDate>;
        anniversary: z.ZodNullable<z.ZodDate>;
        gender: z.ZodNullable<z.ZodString>;
        maritalStatus: z.ZodNullable<z.ZodString>;
        children: z.ZodNullable<z.ZodNumber>;
        education: z.ZodNullable<z.ZodString>;
        profession: z.ZodNullable<z.ZodString>;
        industry: z.ZodNullable<z.ZodString>;
        experience: z.ZodNullable<z.ZodNumber>;
        salary: z.ZodNullable<z.ZodObject<{
            amount: z.ZodNumber;
            currency: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            amount?: number;
            currency?: string;
        }, {
            amount?: number;
            currency?: string;
        }>>;
        socialMedia: z.ZodRecord<z.ZodString, z.ZodAny>;
        communication: z.ZodRecord<z.ZodString, z.ZodAny>;
        settings: z.ZodObject<{
            notifications: z.ZodObject<{
                email: z.ZodBoolean;
                sms: z.ZodBoolean;
                push: z.ZodBoolean;
                phone: z.ZodBoolean;
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
            preferences: z.ZodObject<{
                language: z.ZodString;
                timezone: z.ZodString;
                currency: z.ZodString;
                dateFormat: z.ZodString;
                timeFormat: z.ZodString;
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
            customFields: z.ZodRecord<z.ZodString, z.ZodAny>;
            tags: z.ZodArray<z.ZodString, "many">;
            notes: z.ZodString;
            internalNotes: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            tags?: string[];
            notes?: string;
            notifications?: {
                push?: boolean;
                email?: boolean;
                phone?: boolean;
                sms?: boolean;
            };
            customFields?: Record<string, any>;
            preferences?: {
                language?: string;
                currency?: string;
                timezone?: string;
                dateFormat?: string;
                timeFormat?: string;
            };
            internalNotes?: string;
        }, {
            tags?: string[];
            notes?: string;
            notifications?: {
                push?: boolean;
                email?: boolean;
                phone?: boolean;
                sms?: boolean;
            };
            customFields?: Record<string, any>;
            preferences?: {
                language?: string;
                currency?: string;
                timezone?: string;
                dateFormat?: string;
                timeFormat?: string;
            };
            internalNotes?: string;
        }>;
        assignedUserId: z.ZodNullable<z.ZodString>;
        lastContactDate: z.ZodNullable<z.ZodDate>;
        nextFollowUpDate: z.ZodNullable<z.ZodDate>;
        leadScore: z.ZodNullable<z.ZodNumber>;
        engagementScore: z.ZodNullable<z.ZodNumber>;
        lastEmailOpen: z.ZodNullable<z.ZodDate>;
        lastEmailClick: z.ZodNullable<z.ZodDate>;
        lastWebsiteVisit: z.ZodNullable<z.ZodDate>;
        lastSocialMediaInteraction: z.ZodNullable<z.ZodDate>;
        totalInteractions: z.ZodNumber;
        totalEmailsSent: z.ZodNumber;
        totalEmailsOpened: z.ZodNumber;
        totalEmailsClicked: z.ZodNumber;
        totalCallsMade: z.ZodNumber;
        totalMeetingsScheduled: z.ZodNumber;
        totalMeetingsAttended: z.ZodNumber;
        totalDealsWon: z.ZodNumber;
        totalDealsLost: z.ZodNumber;
        totalRevenue: z.ZodObject<{
            amount: z.ZodNumber;
            currency: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            amount?: number;
            currency?: string;
        }, {
            amount?: number;
            currency?: string;
        }>;
        isActive: z.ZodBoolean;
        isVerified: z.ZodBoolean;
        isOptedIn: z.ZodBoolean;
        fullName: z.ZodString;
        displayName: z.ZodString;
        leadScoreLevel: z.ZodEnum<["low", "medium", "high"]>;
        engagementScoreLevel: z.ZodEnum<["low", "medium", "high"]>;
        emailOpenRate: z.ZodNumber;
        emailClickRate: z.ZodNumber;
        meetingAttendanceRate: z.ZodNumber;
        dealWinRate: z.ZodNumber;
        averageDealValue: z.ZodObject<{
            amount: z.ZodNumber;
            currency: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            amount?: number;
            currency?: string;
        }, {
            amount?: number;
            currency?: string;
        }>;
        isPrimary: z.ZodBoolean;
        isDecisionMaker: z.ZodBoolean;
        isInfluencer: z.ZodBoolean;
        isTechnical: z.ZodBoolean;
        isFinancial: z.ZodBoolean;
        isProcurement: z.ZodBoolean;
        isAssigned: z.ZodBoolean;
        hasCompany: z.ZodBoolean;
        isOverdueForFollowUp: z.ZodBoolean;
        daysSinceLastContact: z.ZodNumber;
        daysUntilFollowUp: z.ZodNumber;
        age: z.ZodNullable<z.ZodNumber>;
        isBirthdayToday: z.ZodBoolean;
        isAnniversaryToday: z.ZodBoolean;
        createdAt: z.ZodDate;
        updatedAt: z.ZodDate;
    }, "strip", z.ZodTypeAny, {
        type?: "user" | "primary" | "technical" | "financial" | "secondary" | "decision_maker" | "influencer" | "procurement";
        status?: "active" | "inactive" | "bounced" | "spam" | "unsubscribed" | "deleted";
        organizationId?: string;
        title?: string;
        id?: string;
        source?: "event" | "email" | "website" | "content" | "other" | "referral" | "cold_call" | "social_media" | "trade_show" | "webinar" | "advertising";
        age?: number;
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
        firstName?: string;
        lastName?: string;
        department?: string;
        companyId?: string;
        isPrimary?: boolean;
        isActive?: boolean;
        settings?: {
            tags?: string[];
            notes?: string;
            notifications?: {
                push?: boolean;
                email?: boolean;
                phone?: boolean;
                sms?: boolean;
            };
            customFields?: Record<string, any>;
            preferences?: {
                language?: string;
                currency?: string;
                timezone?: string;
                dateFormat?: string;
                timeFormat?: string;
            };
            internalNotes?: string;
        };
        priority?: "low" | "medium" | "high" | "urgent";
        assignedUserId?: string;
        lastContactDate?: Date;
        nextFollowUpDate?: Date;
        leadScore?: number;
        middleName?: string;
        mobile?: string;
        fax?: string;
        birthday?: Date;
        anniversary?: Date;
        gender?: string;
        maritalStatus?: string;
        children?: number;
        education?: string;
        profession?: string;
        experience?: number;
        salary?: {
            amount?: number;
            currency?: string;
        };
        socialMedia?: Record<string, any>;
        communication?: Record<string, any>;
        engagementScore?: number;
        lastEmailOpen?: Date;
        lastEmailClick?: Date;
        lastWebsiteVisit?: Date;
        lastSocialMediaInteraction?: Date;
        totalInteractions?: number;
        totalEmailsSent?: number;
        totalEmailsOpened?: number;
        totalEmailsClicked?: number;
        totalCallsMade?: number;
        totalMeetingsScheduled?: number;
        totalMeetingsAttended?: number;
        totalDealsWon?: number;
        totalDealsLost?: number;
        totalRevenue?: {
            amount?: number;
            currency?: string;
        };
        isVerified?: boolean;
        isOptedIn?: boolean;
        fullName?: string;
        isAssigned?: boolean;
        leadScoreLevel?: "low" | "medium" | "high";
        isOverdueForFollowUp?: boolean;
        daysSinceLastContact?: number;
        daysUntilFollowUp?: number;
        hasCompany?: boolean;
        displayName?: string;
        engagementScoreLevel?: "low" | "medium" | "high";
        emailOpenRate?: number;
        emailClickRate?: number;
        meetingAttendanceRate?: number;
        dealWinRate?: number;
        averageDealValue?: {
            amount?: number;
            currency?: string;
        };
        isDecisionMaker?: boolean;
        isInfluencer?: boolean;
        isTechnical?: boolean;
        isFinancial?: boolean;
        isProcurement?: boolean;
        isBirthdayToday?: boolean;
        isAnniversaryToday?: boolean;
    }, {
        type?: "user" | "primary" | "technical" | "financial" | "secondary" | "decision_maker" | "influencer" | "procurement";
        status?: "active" | "inactive" | "bounced" | "spam" | "unsubscribed" | "deleted";
        organizationId?: string;
        title?: string;
        id?: string;
        source?: "event" | "email" | "website" | "content" | "other" | "referral" | "cold_call" | "social_media" | "trade_show" | "webinar" | "advertising";
        age?: number;
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
        firstName?: string;
        lastName?: string;
        department?: string;
        companyId?: string;
        isPrimary?: boolean;
        isActive?: boolean;
        settings?: {
            tags?: string[];
            notes?: string;
            notifications?: {
                push?: boolean;
                email?: boolean;
                phone?: boolean;
                sms?: boolean;
            };
            customFields?: Record<string, any>;
            preferences?: {
                language?: string;
                currency?: string;
                timezone?: string;
                dateFormat?: string;
                timeFormat?: string;
            };
            internalNotes?: string;
        };
        priority?: "low" | "medium" | "high" | "urgent";
        assignedUserId?: string;
        lastContactDate?: Date;
        nextFollowUpDate?: Date;
        leadScore?: number;
        middleName?: string;
        mobile?: string;
        fax?: string;
        birthday?: Date;
        anniversary?: Date;
        gender?: string;
        maritalStatus?: string;
        children?: number;
        education?: string;
        profession?: string;
        experience?: number;
        salary?: {
            amount?: number;
            currency?: string;
        };
        socialMedia?: Record<string, any>;
        communication?: Record<string, any>;
        engagementScore?: number;
        lastEmailOpen?: Date;
        lastEmailClick?: Date;
        lastWebsiteVisit?: Date;
        lastSocialMediaInteraction?: Date;
        totalInteractions?: number;
        totalEmailsSent?: number;
        totalEmailsOpened?: number;
        totalEmailsClicked?: number;
        totalCallsMade?: number;
        totalMeetingsScheduled?: number;
        totalMeetingsAttended?: number;
        totalDealsWon?: number;
        totalDealsLost?: number;
        totalRevenue?: {
            amount?: number;
            currency?: string;
        };
        isVerified?: boolean;
        isOptedIn?: boolean;
        fullName?: string;
        isAssigned?: boolean;
        leadScoreLevel?: "low" | "medium" | "high";
        isOverdueForFollowUp?: boolean;
        daysSinceLastContact?: number;
        daysUntilFollowUp?: number;
        hasCompany?: boolean;
        displayName?: string;
        engagementScoreLevel?: "low" | "medium" | "high";
        emailOpenRate?: number;
        emailClickRate?: number;
        meetingAttendanceRate?: number;
        dealWinRate?: number;
        averageDealValue?: {
            amount?: number;
            currency?: string;
        };
        isDecisionMaker?: boolean;
        isInfluencer?: boolean;
        isTechnical?: boolean;
        isFinancial?: boolean;
        isProcurement?: boolean;
        isBirthdayToday?: boolean;
        isAnniversaryToday?: boolean;
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
    contacts?: {
        type?: "user" | "primary" | "technical" | "financial" | "secondary" | "decision_maker" | "influencer" | "procurement";
        status?: "active" | "inactive" | "bounced" | "spam" | "unsubscribed" | "deleted";
        organizationId?: string;
        title?: string;
        id?: string;
        source?: "event" | "email" | "website" | "content" | "other" | "referral" | "cold_call" | "social_media" | "trade_show" | "webinar" | "advertising";
        age?: number;
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
        firstName?: string;
        lastName?: string;
        department?: string;
        companyId?: string;
        isPrimary?: boolean;
        isActive?: boolean;
        settings?: {
            tags?: string[];
            notes?: string;
            notifications?: {
                push?: boolean;
                email?: boolean;
                phone?: boolean;
                sms?: boolean;
            };
            customFields?: Record<string, any>;
            preferences?: {
                language?: string;
                currency?: string;
                timezone?: string;
                dateFormat?: string;
                timeFormat?: string;
            };
            internalNotes?: string;
        };
        priority?: "low" | "medium" | "high" | "urgent";
        assignedUserId?: string;
        lastContactDate?: Date;
        nextFollowUpDate?: Date;
        leadScore?: number;
        middleName?: string;
        mobile?: string;
        fax?: string;
        birthday?: Date;
        anniversary?: Date;
        gender?: string;
        maritalStatus?: string;
        children?: number;
        education?: string;
        profession?: string;
        experience?: number;
        salary?: {
            amount?: number;
            currency?: string;
        };
        socialMedia?: Record<string, any>;
        communication?: Record<string, any>;
        engagementScore?: number;
        lastEmailOpen?: Date;
        lastEmailClick?: Date;
        lastWebsiteVisit?: Date;
        lastSocialMediaInteraction?: Date;
        totalInteractions?: number;
        totalEmailsSent?: number;
        totalEmailsOpened?: number;
        totalEmailsClicked?: number;
        totalCallsMade?: number;
        totalMeetingsScheduled?: number;
        totalMeetingsAttended?: number;
        totalDealsWon?: number;
        totalDealsLost?: number;
        totalRevenue?: {
            amount?: number;
            currency?: string;
        };
        isVerified?: boolean;
        isOptedIn?: boolean;
        fullName?: string;
        isAssigned?: boolean;
        leadScoreLevel?: "low" | "medium" | "high";
        isOverdueForFollowUp?: boolean;
        daysSinceLastContact?: number;
        daysUntilFollowUp?: number;
        hasCompany?: boolean;
        displayName?: string;
        engagementScoreLevel?: "low" | "medium" | "high";
        emailOpenRate?: number;
        emailClickRate?: number;
        meetingAttendanceRate?: number;
        dealWinRate?: number;
        averageDealValue?: {
            amount?: number;
            currency?: string;
        };
        isDecisionMaker?: boolean;
        isInfluencer?: boolean;
        isTechnical?: boolean;
        isFinancial?: boolean;
        isProcurement?: boolean;
        isBirthdayToday?: boolean;
        isAnniversaryToday?: boolean;
    }[];
    totalPages?: number;
    hasNext?: boolean;
    hasPrevious?: boolean;
}, {
    page?: number;
    limit?: number;
    total?: number;
    contacts?: {
        type?: "user" | "primary" | "technical" | "financial" | "secondary" | "decision_maker" | "influencer" | "procurement";
        status?: "active" | "inactive" | "bounced" | "spam" | "unsubscribed" | "deleted";
        organizationId?: string;
        title?: string;
        id?: string;
        source?: "event" | "email" | "website" | "content" | "other" | "referral" | "cold_call" | "social_media" | "trade_show" | "webinar" | "advertising";
        age?: number;
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
        firstName?: string;
        lastName?: string;
        department?: string;
        companyId?: string;
        isPrimary?: boolean;
        isActive?: boolean;
        settings?: {
            tags?: string[];
            notes?: string;
            notifications?: {
                push?: boolean;
                email?: boolean;
                phone?: boolean;
                sms?: boolean;
            };
            customFields?: Record<string, any>;
            preferences?: {
                language?: string;
                currency?: string;
                timezone?: string;
                dateFormat?: string;
                timeFormat?: string;
            };
            internalNotes?: string;
        };
        priority?: "low" | "medium" | "high" | "urgent";
        assignedUserId?: string;
        lastContactDate?: Date;
        nextFollowUpDate?: Date;
        leadScore?: number;
        middleName?: string;
        mobile?: string;
        fax?: string;
        birthday?: Date;
        anniversary?: Date;
        gender?: string;
        maritalStatus?: string;
        children?: number;
        education?: string;
        profession?: string;
        experience?: number;
        salary?: {
            amount?: number;
            currency?: string;
        };
        socialMedia?: Record<string, any>;
        communication?: Record<string, any>;
        engagementScore?: number;
        lastEmailOpen?: Date;
        lastEmailClick?: Date;
        lastWebsiteVisit?: Date;
        lastSocialMediaInteraction?: Date;
        totalInteractions?: number;
        totalEmailsSent?: number;
        totalEmailsOpened?: number;
        totalEmailsClicked?: number;
        totalCallsMade?: number;
        totalMeetingsScheduled?: number;
        totalMeetingsAttended?: number;
        totalDealsWon?: number;
        totalDealsLost?: number;
        totalRevenue?: {
            amount?: number;
            currency?: string;
        };
        isVerified?: boolean;
        isOptedIn?: boolean;
        fullName?: string;
        isAssigned?: boolean;
        leadScoreLevel?: "low" | "medium" | "high";
        isOverdueForFollowUp?: boolean;
        daysSinceLastContact?: number;
        daysUntilFollowUp?: number;
        hasCompany?: boolean;
        displayName?: string;
        engagementScoreLevel?: "low" | "medium" | "high";
        emailOpenRate?: number;
        emailClickRate?: number;
        meetingAttendanceRate?: number;
        dealWinRate?: number;
        averageDealValue?: {
            amount?: number;
            currency?: string;
        };
        isDecisionMaker?: boolean;
        isInfluencer?: boolean;
        isTechnical?: boolean;
        isFinancial?: boolean;
        isProcurement?: boolean;
        isBirthdayToday?: boolean;
        isAnniversaryToday?: boolean;
    }[];
    totalPages?: number;
    hasNext?: boolean;
    hasPrevious?: boolean;
}>;
export declare const ContactStatsResponseSchema: z.ZodObject<{
    total: z.ZodNumber;
    byType: z.ZodRecord<z.ZodString, z.ZodNumber>;
    byStatus: z.ZodRecord<z.ZodString, z.ZodNumber>;
    bySource: z.ZodRecord<z.ZodString, z.ZodNumber>;
    byPriority: z.ZodRecord<z.ZodString, z.ZodNumber>;
    byDepartment: z.ZodRecord<z.ZodString, z.ZodNumber>;
    byIndustry: z.ZodRecord<z.ZodString, z.ZodNumber>;
    byProfession: z.ZodRecord<z.ZodString, z.ZodNumber>;
    active: z.ZodNumber;
    inactive: z.ZodNumber;
    primary: z.ZodNumber;
    decisionMakers: z.ZodNumber;
    influencers: z.ZodNumber;
    technical: z.ZodNumber;
    financial: z.ZodNumber;
    procurement: z.ZodNumber;
    verified: z.ZodNumber;
    unverified: z.ZodNumber;
    optedIn: z.ZodNumber;
    optedOut: z.ZodNumber;
    assigned: z.ZodNumber;
    unassigned: z.ZodNumber;
    withCompany: z.ZodNumber;
    withoutCompany: z.ZodNumber;
    overdueForFollowUp: z.ZodNumber;
    highScoreLeads: z.ZodNumber;
    mediumScoreLeads: z.ZodNumber;
    lowScoreLeads: z.ZodNumber;
    highlyEngaged: z.ZodNumber;
    moderatelyEngaged: z.ZodNumber;
    lowEngaged: z.ZodNumber;
    averageLeadScore: z.ZodNumber;
    averageEngagementScore: z.ZodNumber;
    totalRevenue: z.ZodNumber;
    averageRevenue: z.ZodNumber;
    totalSalary: z.ZodNumber;
    averageSalary: z.ZodNumber;
    totalExperience: z.ZodNumber;
    averageExperience: z.ZodNumber;
    totalInteractions: z.ZodNumber;
    averageInteractions: z.ZodNumber;
    totalEmailsSent: z.ZodNumber;
    totalEmailsOpened: z.ZodNumber;
    totalEmailsClicked: z.ZodNumber;
    totalCallsMade: z.ZodNumber;
    totalMeetingsScheduled: z.ZodNumber;
    totalMeetingsAttended: z.ZodNumber;
    totalDealsWon: z.ZodNumber;
    totalDealsLost: z.ZodNumber;
    averageEmailOpenRate: z.ZodNumber;
    averageEmailClickRate: z.ZodNumber;
    averageMeetingAttendanceRate: z.ZodNumber;
    averageDealWinRate: z.ZodNumber;
    contactsByYear: z.ZodRecord<z.ZodString, z.ZodNumber>;
    contactsByMonth: z.ZodRecord<z.ZodString, z.ZodNumber>;
    topDepartments: z.ZodArray<z.ZodObject<{
        department: z.ZodString;
        count: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        count?: number;
        department?: string;
    }, {
        count?: number;
        department?: string;
    }>, "many">;
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
    topProfessions: z.ZodArray<z.ZodObject<{
        profession: z.ZodString;
        count: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        count?: number;
        profession?: string;
    }, {
        count?: number;
        profession?: string;
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
    topCompanies: z.ZodArray<z.ZodObject<{
        companyId: z.ZodString;
        count: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        count?: number;
        companyId?: string;
    }, {
        count?: number;
        companyId?: string;
    }>, "many">;
    contactsWithBirthdayToday: z.ZodNumber;
    contactsWithBirthdayThisWeek: z.ZodNumber;
    contactsWithBirthdayThisMonth: z.ZodNumber;
    contactsWithAnniversaryToday: z.ZodNumber;
    contactsWithAnniversaryThisWeek: z.ZodNumber;
    contactsWithAnniversaryThisMonth: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    active?: number;
    inactive?: number;
    total?: number;
    primary?: number;
    technical?: number;
    financial?: number;
    procurement?: number;
    totalInteractions?: number;
    totalEmailsSent?: number;
    totalEmailsOpened?: number;
    totalEmailsClicked?: number;
    totalCallsMade?: number;
    totalMeetingsScheduled?: number;
    totalMeetingsAttended?: number;
    totalDealsWon?: number;
    totalDealsLost?: number;
    totalRevenue?: number;
    byStatus?: Record<string, number>;
    decisionMakers?: number;
    verified?: number;
    assigned?: number;
    byType?: Record<string, number>;
    byIndustry?: Record<string, number>;
    bySource?: Record<string, number>;
    unassigned?: number;
    overdueForFollowUp?: number;
    highScoreLeads?: number;
    mediumScoreLeads?: number;
    lowScoreLeads?: number;
    averageLeadScore?: number;
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
    byPriority?: Record<string, number>;
    byDepartment?: Record<string, number>;
    byProfession?: Record<string, number>;
    influencers?: number;
    unverified?: number;
    optedIn?: number;
    optedOut?: number;
    withCompany?: number;
    withoutCompany?: number;
    highlyEngaged?: number;
    moderatelyEngaged?: number;
    lowEngaged?: number;
    averageEngagementScore?: number;
    averageRevenue?: number;
    totalSalary?: number;
    averageSalary?: number;
    totalExperience?: number;
    averageExperience?: number;
    averageInteractions?: number;
    averageEmailOpenRate?: number;
    averageEmailClickRate?: number;
    averageMeetingAttendanceRate?: number;
    averageDealWinRate?: number;
    contactsByYear?: Record<string, number>;
    contactsByMonth?: Record<string, number>;
    topDepartments?: {
        count?: number;
        department?: string;
    }[];
    topProfessions?: {
        count?: number;
        profession?: string;
    }[];
    topCompanies?: {
        count?: number;
        companyId?: string;
    }[];
    contactsWithBirthdayToday?: number;
    contactsWithBirthdayThisWeek?: number;
    contactsWithBirthdayThisMonth?: number;
    contactsWithAnniversaryToday?: number;
    contactsWithAnniversaryThisWeek?: number;
    contactsWithAnniversaryThisMonth?: number;
}, {
    active?: number;
    inactive?: number;
    total?: number;
    primary?: number;
    technical?: number;
    financial?: number;
    procurement?: number;
    totalInteractions?: number;
    totalEmailsSent?: number;
    totalEmailsOpened?: number;
    totalEmailsClicked?: number;
    totalCallsMade?: number;
    totalMeetingsScheduled?: number;
    totalMeetingsAttended?: number;
    totalDealsWon?: number;
    totalDealsLost?: number;
    totalRevenue?: number;
    byStatus?: Record<string, number>;
    decisionMakers?: number;
    verified?: number;
    assigned?: number;
    byType?: Record<string, number>;
    byIndustry?: Record<string, number>;
    bySource?: Record<string, number>;
    unassigned?: number;
    overdueForFollowUp?: number;
    highScoreLeads?: number;
    mediumScoreLeads?: number;
    lowScoreLeads?: number;
    averageLeadScore?: number;
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
    byPriority?: Record<string, number>;
    byDepartment?: Record<string, number>;
    byProfession?: Record<string, number>;
    influencers?: number;
    unverified?: number;
    optedIn?: number;
    optedOut?: number;
    withCompany?: number;
    withoutCompany?: number;
    highlyEngaged?: number;
    moderatelyEngaged?: number;
    lowEngaged?: number;
    averageEngagementScore?: number;
    averageRevenue?: number;
    totalSalary?: number;
    averageSalary?: number;
    totalExperience?: number;
    averageExperience?: number;
    averageInteractions?: number;
    averageEmailOpenRate?: number;
    averageEmailClickRate?: number;
    averageMeetingAttendanceRate?: number;
    averageDealWinRate?: number;
    contactsByYear?: Record<string, number>;
    contactsByMonth?: Record<string, number>;
    topDepartments?: {
        count?: number;
        department?: string;
    }[];
    topProfessions?: {
        count?: number;
        profession?: string;
    }[];
    topCompanies?: {
        count?: number;
        companyId?: string;
    }[];
    contactsWithBirthdayToday?: number;
    contactsWithBirthdayThisWeek?: number;
    contactsWithBirthdayThisMonth?: number;
    contactsWithAnniversaryToday?: number;
    contactsWithAnniversaryThisWeek?: number;
    contactsWithAnniversaryThisMonth?: number;
}>;
export type CreateContactRequest = z.infer<typeof CreateContactRequestSchema>;
export type UpdateContactRequest = z.infer<typeof UpdateContactRequestSchema>;
export type DeleteContactRequest = z.infer<typeof DeleteContactRequestSchema>;
export type GetContactRequest = z.infer<typeof GetContactRequestSchema>;
export type SearchContactsRequest = z.infer<typeof SearchContactsRequestSchema>;
export type BulkUpdateContactsRequest = z.infer<typeof BulkUpdateContactsRequestSchema>;
export type BulkDeleteContactsRequest = z.infer<typeof BulkDeleteContactsRequestSchema>;
export type ContactResponse = z.infer<typeof ContactResponseSchema>;
export type ContactListResponse = z.infer<typeof ContactListResponseSchema>;
export type ContactStatsResponse = z.infer<typeof ContactStatsResponseSchema>;
export declare const validateCreateContactRequest: (data: unknown) => CreateContactRequest;
export declare const validateUpdateContactRequest: (data: unknown) => UpdateContactRequest;
export declare const validateDeleteContactRequest: (data: unknown) => DeleteContactRequest;
export declare const validateGetContactRequest: (data: unknown) => GetContactRequest;
export declare const validateSearchContactsRequest: (data: unknown) => SearchContactsRequest;
export declare const validateBulkUpdateContactsRequest: (data: unknown) => BulkUpdateContactsRequest;
export declare const validateBulkDeleteContactsRequest: (data: unknown) => BulkDeleteContactsRequest;
export declare const transformContactToResponse: (contact: any) => ContactResponse;
export declare const transformContactListToResponse: (contactList: any) => ContactListResponse;
export declare const transformContactStatsToResponse: (stats: any) => ContactStatsResponse;
//# sourceMappingURL=contact.dto.d.ts.map