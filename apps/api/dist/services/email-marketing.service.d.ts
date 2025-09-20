import { z } from 'zod';
export declare const EmailCampaignTypeSchema: z.ZodEnum<["newsletter", "promotional", "transactional", "welcome", "abandoned_cart", "re_engagement", "announcement", "survey", "other"]>;
export declare const EmailCampaignStatusSchema: z.ZodEnum<["draft", "scheduled", "sending", "sent", "paused", "cancelled", "completed"]>;
export declare const EmailTemplateTypeSchema: z.ZodEnum<["html", "text", "responsive", "drag_drop"]>;
export declare const SubscriberStatusSchema: z.ZodEnum<["active", "unsubscribed", "bounced", "complained", "pending"]>;
export declare const EmailSegmentSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    conditions: z.ZodArray<z.ZodObject<{
        field: z.ZodString;
        operator: z.ZodEnum<["equals", "not_equals", "contains", "not_contains", "greater_than", "less_than", "in", "not_in"]>;
        value: z.ZodAny;
        logic: z.ZodOptional<z.ZodEnum<["and", "or"]>>;
    }, "strip", z.ZodTypeAny, {
        value?: any;
        field?: string;
        operator?: "greater_than" | "less_than" | "equals" | "not_equals" | "contains" | "not_contains" | "in" | "not_in";
        logic?: "and" | "or";
    }, {
        value?: any;
        field?: string;
        operator?: "greater_than" | "less_than" | "equals" | "not_equals" | "contains" | "not_contains" | "in" | "not_in";
        logic?: "and" | "or";
    }>, "many">;
    subscriberCount: z.ZodDefault<z.ZodNumber>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    name?: string;
    id?: string;
    createdAt?: Date;
    updatedAt?: Date;
    description?: string;
    conditions?: {
        value?: any;
        field?: string;
        operator?: "greater_than" | "less_than" | "equals" | "not_equals" | "contains" | "not_contains" | "in" | "not_in";
        logic?: "and" | "or";
    }[];
    subscriberCount?: number;
}, {
    name?: string;
    id?: string;
    createdAt?: Date;
    updatedAt?: Date;
    description?: string;
    conditions?: {
        value?: any;
        field?: string;
        operator?: "greater_than" | "less_than" | "equals" | "not_equals" | "contains" | "not_contains" | "in" | "not_in";
        logic?: "and" | "or";
    }[];
    subscriberCount?: number;
}>;
export declare const EmailTemplateSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    type: z.ZodEnum<["html", "text", "responsive", "drag_drop"]>;
    subject: z.ZodString;
    htmlContent: z.ZodString;
    textContent: z.ZodOptional<z.ZodString>;
    previewText: z.ZodOptional<z.ZodString>;
    variables: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    isDefault: z.ZodDefault<z.ZodBoolean>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    type?: "text" | "html" | "responsive" | "drag_drop";
    name?: string;
    id?: string;
    createdAt?: Date;
    updatedAt?: Date;
    subject?: string;
    variables?: string[];
    isDefault?: boolean;
    htmlContent?: string;
    textContent?: string;
    previewText?: string;
}, {
    type?: "text" | "html" | "responsive" | "drag_drop";
    name?: string;
    id?: string;
    createdAt?: Date;
    updatedAt?: Date;
    subject?: string;
    variables?: string[];
    isDefault?: boolean;
    htmlContent?: string;
    textContent?: string;
    previewText?: string;
}>;
export declare const EmailCampaignSchema: z.ZodObject<{
    id: z.ZodString;
    organizationId: z.ZodString;
    name: z.ZodString;
    type: z.ZodEnum<["newsletter", "promotional", "transactional", "welcome", "abandoned_cart", "re_engagement", "announcement", "survey", "other"]>;
    status: z.ZodEnum<["draft", "scheduled", "sending", "sent", "paused", "cancelled", "completed"]>;
    subject: z.ZodString;
    previewText: z.ZodOptional<z.ZodString>;
    htmlContent: z.ZodString;
    textContent: z.ZodOptional<z.ZodString>;
    templateId: z.ZodOptional<z.ZodString>;
    segments: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    recipients: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    scheduledAt: z.ZodOptional<z.ZodDate>;
    sentAt: z.ZodOptional<z.ZodDate>;
    completedAt: z.ZodOptional<z.ZodDate>;
    fromName: z.ZodString;
    fromEmail: z.ZodString;
    replyTo: z.ZodOptional<z.ZodString>;
    trackingEnabled: z.ZodDefault<z.ZodBoolean>;
    analytics: z.ZodOptional<z.ZodObject<{
        sent: z.ZodDefault<z.ZodNumber>;
        delivered: z.ZodDefault<z.ZodNumber>;
        opened: z.ZodDefault<z.ZodNumber>;
        clicked: z.ZodDefault<z.ZodNumber>;
        unsubscribed: z.ZodDefault<z.ZodNumber>;
        bounced: z.ZodDefault<z.ZodNumber>;
        complained: z.ZodDefault<z.ZodNumber>;
        openRate: z.ZodDefault<z.ZodNumber>;
        clickRate: z.ZodDefault<z.ZodNumber>;
        unsubscribeRate: z.ZodDefault<z.ZodNumber>;
        bounceRate: z.ZodDefault<z.ZodNumber>;
        complaintRate: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        bounced?: number;
        sent?: number;
        unsubscribed?: number;
        bounceRate?: number;
        delivered?: number;
        opened?: number;
        complained?: number;
        clicked?: number;
        openRate?: number;
        clickRate?: number;
        unsubscribeRate?: number;
        complaintRate?: number;
    }, {
        bounced?: number;
        sent?: number;
        unsubscribed?: number;
        bounceRate?: number;
        delivered?: number;
        opened?: number;
        complained?: number;
        clicked?: number;
        openRate?: number;
        clickRate?: number;
        unsubscribeRate?: number;
        complaintRate?: number;
    }>>;
    abTest: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        variants: z.ZodDefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            subject: z.ZodString;
            htmlContent: z.ZodString;
            percentage: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            id?: string;
            subject?: string;
            percentage?: number;
            htmlContent?: string;
        }, {
            id?: string;
            subject?: string;
            percentage?: number;
            htmlContent?: string;
        }>, "many">>;
        winner: z.ZodOptional<z.ZodString>;
        testDuration: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        enabled?: boolean;
        variants?: {
            id?: string;
            subject?: string;
            percentage?: number;
            htmlContent?: string;
        }[];
        winner?: string;
        testDuration?: number;
    }, {
        enabled?: boolean;
        variants?: {
            id?: string;
            subject?: string;
            percentage?: number;
            htmlContent?: string;
        }[];
        winner?: string;
        testDuration?: number;
    }>>;
    automation: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        triggers: z.ZodDefault<z.ZodArray<z.ZodObject<{
            type: z.ZodString;
            conditions: z.ZodRecord<z.ZodString, z.ZodAny>;
            delay: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            type?: string;
            delay?: number;
            conditions?: Record<string, any>;
        }, {
            type?: string;
            delay?: number;
            conditions?: Record<string, any>;
        }>, "many">>;
        actions: z.ZodDefault<z.ZodArray<z.ZodObject<{
            type: z.ZodString;
            config: z.ZodRecord<z.ZodString, z.ZodAny>;
        }, "strip", z.ZodTypeAny, {
            type?: string;
            config?: Record<string, any>;
        }, {
            type?: string;
            config?: Record<string, any>;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        actions?: {
            type?: string;
            config?: Record<string, any>;
        }[];
        enabled?: boolean;
        triggers?: {
            type?: string;
            delay?: number;
            conditions?: Record<string, any>;
        }[];
    }, {
        actions?: {
            type?: string;
            config?: Record<string, any>;
        }[];
        enabled?: boolean;
        triggers?: {
            type?: string;
            delay?: number;
            conditions?: Record<string, any>;
        }[];
    }>>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
    createdBy: z.ZodString;
    updatedBy: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type?: "other" | "announcement" | "welcome" | "survey" | "newsletter" | "promotional" | "transactional" | "abandoned_cart" | "re_engagement";
    status?: "completed" | "cancelled" | "draft" | "sent" | "paused" | "scheduled" | "sending";
    organizationId?: string;
    name?: string;
    automation?: {
        actions?: {
            type?: string;
            config?: Record<string, any>;
        }[];
        enabled?: boolean;
        triggers?: {
            type?: string;
            delay?: number;
            conditions?: Record<string, any>;
        }[];
    };
    id?: string;
    createdAt?: Date;
    updatedAt?: Date;
    subject?: string;
    scheduledAt?: Date;
    completedAt?: Date;
    analytics?: {
        bounced?: number;
        sent?: number;
        unsubscribed?: number;
        bounceRate?: number;
        delivered?: number;
        opened?: number;
        complained?: number;
        clicked?: number;
        openRate?: number;
        clickRate?: number;
        unsubscribeRate?: number;
        complaintRate?: number;
    };
    createdBy?: string;
    recipients?: string[];
    updatedBy?: string;
    templateId?: string;
    sentAt?: Date;
    segments?: string[];
    htmlContent?: string;
    textContent?: string;
    previewText?: string;
    fromName?: string;
    fromEmail?: string;
    replyTo?: string;
    trackingEnabled?: boolean;
    abTest?: {
        enabled?: boolean;
        variants?: {
            id?: string;
            subject?: string;
            percentage?: number;
            htmlContent?: string;
        }[];
        winner?: string;
        testDuration?: number;
    };
}, {
    type?: "other" | "announcement" | "welcome" | "survey" | "newsletter" | "promotional" | "transactional" | "abandoned_cart" | "re_engagement";
    status?: "completed" | "cancelled" | "draft" | "sent" | "paused" | "scheduled" | "sending";
    organizationId?: string;
    name?: string;
    automation?: {
        actions?: {
            type?: string;
            config?: Record<string, any>;
        }[];
        enabled?: boolean;
        triggers?: {
            type?: string;
            delay?: number;
            conditions?: Record<string, any>;
        }[];
    };
    id?: string;
    createdAt?: Date;
    updatedAt?: Date;
    subject?: string;
    scheduledAt?: Date;
    completedAt?: Date;
    analytics?: {
        bounced?: number;
        sent?: number;
        unsubscribed?: number;
        bounceRate?: number;
        delivered?: number;
        opened?: number;
        complained?: number;
        clicked?: number;
        openRate?: number;
        clickRate?: number;
        unsubscribeRate?: number;
        complaintRate?: number;
    };
    createdBy?: string;
    recipients?: string[];
    updatedBy?: string;
    templateId?: string;
    sentAt?: Date;
    segments?: string[];
    htmlContent?: string;
    textContent?: string;
    previewText?: string;
    fromName?: string;
    fromEmail?: string;
    replyTo?: string;
    trackingEnabled?: boolean;
    abTest?: {
        enabled?: boolean;
        variants?: {
            id?: string;
            subject?: string;
            percentage?: number;
            htmlContent?: string;
        }[];
        winner?: string;
        testDuration?: number;
    };
}>;
export declare const EmailSubscriberSchema: z.ZodObject<{
    id: z.ZodString;
    organizationId: z.ZodString;
    email: z.ZodString;
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
    status: z.ZodEnum<["active", "unsubscribed", "bounced", "complained", "pending"]>;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    customFields: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodAny>>;
    segments: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    subscribedAt: z.ZodDate;
    unsubscribedAt: z.ZodOptional<z.ZodDate>;
    lastActivityAt: z.ZodOptional<z.ZodDate>;
    source: z.ZodOptional<z.ZodString>;
    ipAddress: z.ZodOptional<z.ZodString>;
    userAgent: z.ZodOptional<z.ZodString>;
    location: z.ZodOptional<z.ZodObject<{
        country: z.ZodOptional<z.ZodString>;
        region: z.ZodOptional<z.ZodString>;
        city: z.ZodOptional<z.ZodString>;
        timezone: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        city?: string;
        country?: string;
        region?: string;
        timezone?: string;
    }, {
        city?: string;
        country?: string;
        region?: string;
        timezone?: string;
    }>>;
    preferences: z.ZodOptional<z.ZodObject<{
        frequency: z.ZodDefault<z.ZodEnum<["daily", "weekly", "monthly", "never"]>>;
        categories: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        format: z.ZodDefault<z.ZodEnum<["html", "text"]>>;
    }, "strip", z.ZodTypeAny, {
        format?: "text" | "html";
        categories?: string[];
        frequency?: "never" | "monthly" | "daily" | "weekly";
    }, {
        format?: "text" | "html";
        categories?: string[];
        frequency?: "never" | "monthly" | "daily" | "weekly";
    }>>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    status?: "pending" | "active" | "bounced" | "unsubscribed" | "complained";
    organizationId?: string;
    id?: string;
    source?: string;
    userAgent?: string;
    location?: {
        city?: string;
        country?: string;
        region?: string;
        timezone?: string;
    };
    email?: string;
    tags?: string[];
    createdAt?: Date;
    updatedAt?: Date;
    firstName?: string;
    lastName?: string;
    ipAddress?: string;
    customFields?: Record<string, any>;
    preferences?: {
        format?: "text" | "html";
        categories?: string[];
        frequency?: "never" | "monthly" | "daily" | "weekly";
    };
    segments?: string[];
    lastActivityAt?: Date;
    subscribedAt?: Date;
    unsubscribedAt?: Date;
}, {
    status?: "pending" | "active" | "bounced" | "unsubscribed" | "complained";
    organizationId?: string;
    id?: string;
    source?: string;
    userAgent?: string;
    location?: {
        city?: string;
        country?: string;
        region?: string;
        timezone?: string;
    };
    email?: string;
    tags?: string[];
    createdAt?: Date;
    updatedAt?: Date;
    firstName?: string;
    lastName?: string;
    ipAddress?: string;
    customFields?: Record<string, any>;
    preferences?: {
        format?: "text" | "html";
        categories?: string[];
        frequency?: "never" | "monthly" | "daily" | "weekly";
    };
    segments?: string[];
    lastActivityAt?: Date;
    subscribedAt?: Date;
    unsubscribedAt?: Date;
}>;
export declare const EmailSearchSchema: z.ZodObject<{
    query: z.ZodOptional<z.ZodString>;
    filters: z.ZodOptional<z.ZodObject<{
        type: z.ZodOptional<z.ZodArray<z.ZodEnum<["newsletter", "promotional", "transactional", "welcome", "abandoned_cart", "re_engagement", "announcement", "survey", "other"]>, "many">>;
        status: z.ZodOptional<z.ZodArray<z.ZodEnum<["draft", "scheduled", "sending", "sent", "paused", "cancelled", "completed"]>, "many">>;
        dateRange: z.ZodOptional<z.ZodObject<{
            from: z.ZodOptional<z.ZodDate>;
            to: z.ZodOptional<z.ZodDate>;
        }, "strip", z.ZodTypeAny, {
            from?: Date;
            to?: Date;
        }, {
            from?: Date;
            to?: Date;
        }>>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        type?: ("other" | "announcement" | "welcome" | "survey" | "newsletter" | "promotional" | "transactional" | "abandoned_cart" | "re_engagement")[];
        status?: ("completed" | "cancelled" | "draft" | "sent" | "paused" | "scheduled" | "sending")[];
        tags?: string[];
        dateRange?: {
            from?: Date;
            to?: Date;
        };
    }, {
        type?: ("other" | "announcement" | "welcome" | "survey" | "newsletter" | "promotional" | "transactional" | "abandoned_cart" | "re_engagement")[];
        status?: ("completed" | "cancelled" | "draft" | "sent" | "paused" | "scheduled" | "sending")[];
        tags?: string[];
        dateRange?: {
            from?: Date;
            to?: Date;
        };
    }>>;
    sort: z.ZodOptional<z.ZodObject<{
        field: z.ZodEnum<["name", "createdAt", "sentAt", "openRate", "clickRate"]>;
        direction: z.ZodEnum<["asc", "desc"]>;
    }, "strip", z.ZodTypeAny, {
        field?: "name" | "createdAt" | "sentAt" | "openRate" | "clickRate";
        direction?: "asc" | "desc";
    }, {
        field?: "name" | "createdAt" | "sentAt" | "openRate" | "clickRate";
        direction?: "asc" | "desc";
    }>>;
    pagination: z.ZodOptional<z.ZodObject<{
        page: z.ZodDefault<z.ZodNumber>;
        limit: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        page?: number;
        limit?: number;
    }, {
        page?: number;
        limit?: number;
    }>>;
}, "strip", z.ZodTypeAny, {
    query?: string;
    sort?: {
        field?: "name" | "createdAt" | "sentAt" | "openRate" | "clickRate";
        direction?: "asc" | "desc";
    };
    filters?: {
        type?: ("other" | "announcement" | "welcome" | "survey" | "newsletter" | "promotional" | "transactional" | "abandoned_cart" | "re_engagement")[];
        status?: ("completed" | "cancelled" | "draft" | "sent" | "paused" | "scheduled" | "sending")[];
        tags?: string[];
        dateRange?: {
            from?: Date;
            to?: Date;
        };
    };
    pagination?: {
        page?: number;
        limit?: number;
    };
}, {
    query?: string;
    sort?: {
        field?: "name" | "createdAt" | "sentAt" | "openRate" | "clickRate";
        direction?: "asc" | "desc";
    };
    filters?: {
        type?: ("other" | "announcement" | "welcome" | "survey" | "newsletter" | "promotional" | "transactional" | "abandoned_cart" | "re_engagement")[];
        status?: ("completed" | "cancelled" | "draft" | "sent" | "paused" | "scheduled" | "sending")[];
        tags?: string[];
        dateRange?: {
            from?: Date;
            to?: Date;
        };
    };
    pagination?: {
        page?: number;
        limit?: number;
    };
}>;
export type EmailCampaignType = z.infer<typeof EmailCampaignTypeSchema>;
export type EmailCampaignStatus = z.infer<typeof EmailCampaignStatusSchema>;
export type EmailTemplateType = z.infer<typeof EmailTemplateTypeSchema>;
export type SubscriberStatus = z.infer<typeof SubscriberStatusSchema>;
export type EmailSegment = z.infer<typeof EmailSegmentSchema>;
export type EmailTemplate = z.infer<typeof EmailTemplateSchema>;
export type EmailCampaign = z.infer<typeof EmailCampaignSchema>;
export type EmailSubscriber = z.infer<typeof EmailSubscriberSchema>;
export type EmailSearch = z.infer<typeof EmailSearchSchema>;
export declare class EmailMarketingService {
    private db;
    private campaigns;
    private subscribers;
    private templates;
    private segments;
    private searchCache;
    private readonly CACHE_TTL;
    constructor();
    private initializeService;
    private initializeEmailMarketingTables;
    private loadExistingData;
    private startBackgroundProcessing;
    createCampaign(organizationId: string, campaignData: Omit<EmailCampaign, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>, createdBy: string): Promise<EmailCampaign>;
    getCampaign(campaignId: string, organizationId: string): Promise<EmailCampaign | null>;
    updateCampaign(campaignId: string, organizationId: string, updates: Partial<EmailCampaign>, updatedBy: string): Promise<EmailCampaign | null>;
    deleteCampaign(campaignId: string, organizationId: string): Promise<boolean>;
    createSubscriber(organizationId: string, subscriberData: Omit<EmailSubscriber, 'id' | 'createdAt' | 'updatedAt'>): Promise<EmailSubscriber>;
    getSubscriber(subscriberId: string, organizationId: string): Promise<EmailSubscriber | null>;
    getSubscriberByEmail(email: string, organizationId: string): Promise<EmailSubscriber | null>;
    searchCampaigns(organizationId: string, searchParams: EmailSearch): Promise<{
        campaigns: EmailCampaign[];
        total: number;
        page: number;
        limit: number;
    }>;
    private processScheduledCampaigns;
    private updateAnalytics;
    private processAutomation;
    private generateId;
    getEmailMarketingStatistics(organizationId: string): Promise<{
        totalCampaigns: number;
        campaignsByType: Record<string, number>;
        campaignsByStatus: Record<string, number>;
        totalSubscribers: number;
        subscribersByStatus: Record<string, number>;
        totalTemplates: number;
        totalSegments: number;
        averageOpenRate: number;
        averageClickRate: number;
        topCampaigns: EmailCampaign[];
    }>;
}
export declare const emailMarketingService: EmailMarketingService;
//# sourceMappingURL=email-marketing.service.d.ts.map