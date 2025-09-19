import { z } from 'zod';
export declare const ContentTypeSchema: z.ZodEnum<["article", "blog", "page", "product", "news", "event", "faq", "tutorial", "documentation", "landing", "other"]>;
export declare const ContentStatusSchema: z.ZodEnum<["draft", "review", "approved", "published", "archived", "deleted"]>;
export declare const ContentTemplateSchema: z.ZodEnum<["default", "blog", "product", "landing", "news", "custom"]>;
export declare const ContentMetadataSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    excerpt: z.ZodOptional<z.ZodString>;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    categories: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    author: z.ZodString;
    language: z.ZodDefault<z.ZodString>;
    keywords: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    customFields: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodAny>>;
    seo: z.ZodOptional<z.ZodObject<{
        metaTitle: z.ZodOptional<z.ZodString>;
        metaDescription: z.ZodOptional<z.ZodString>;
        metaKeywords: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        canonicalUrl: z.ZodOptional<z.ZodString>;
        ogTitle: z.ZodOptional<z.ZodString>;
        ogDescription: z.ZodOptional<z.ZodString>;
        ogImage: z.ZodOptional<z.ZodString>;
        twitterCard: z.ZodOptional<z.ZodString>;
        structuredData: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        structuredData?: Record<string, any>;
        metaTitle?: string;
        metaDescription?: string;
        metaKeywords?: string[];
        canonicalUrl?: string;
        ogTitle?: string;
        ogDescription?: string;
        ogImage?: string;
        twitterCard?: string;
    }, {
        structuredData?: Record<string, any>;
        metaTitle?: string;
        metaDescription?: string;
        metaKeywords?: string[];
        canonicalUrl?: string;
        ogTitle?: string;
        ogDescription?: string;
        ogImage?: string;
        twitterCard?: string;
    }>>;
    analytics: z.ZodOptional<z.ZodObject<{
        views: z.ZodDefault<z.ZodNumber>;
        uniqueViews: z.ZodDefault<z.ZodNumber>;
        shares: z.ZodDefault<z.ZodNumber>;
        comments: z.ZodDefault<z.ZodNumber>;
        likes: z.ZodDefault<z.ZodNumber>;
        engagement: z.ZodDefault<z.ZodNumber>;
        bounceRate: z.ZodDefault<z.ZodNumber>;
        timeOnPage: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        views?: number;
        comments?: number;
        bounceRate?: number;
        engagement?: number;
        uniqueViews?: number;
        shares?: number;
        likes?: number;
        timeOnPage?: number;
    }, {
        views?: number;
        comments?: number;
        bounceRate?: number;
        engagement?: number;
        uniqueViews?: number;
        shares?: number;
        likes?: number;
        timeOnPage?: number;
    }>>;
}, "strip", z.ZodTypeAny, {
    language?: string;
    title?: string;
    tags?: string[];
    description?: string;
    categories?: string[];
    analytics?: {
        views?: number;
        comments?: number;
        bounceRate?: number;
        engagement?: number;
        uniqueViews?: number;
        shares?: number;
        likes?: number;
        timeOnPage?: number;
    };
    author?: string;
    customFields?: Record<string, any>;
    keywords?: string[];
    seo?: {
        structuredData?: Record<string, any>;
        metaTitle?: string;
        metaDescription?: string;
        metaKeywords?: string[];
        canonicalUrl?: string;
        ogTitle?: string;
        ogDescription?: string;
        ogImage?: string;
        twitterCard?: string;
    };
    excerpt?: string;
}, {
    language?: string;
    title?: string;
    tags?: string[];
    description?: string;
    categories?: string[];
    analytics?: {
        views?: number;
        comments?: number;
        bounceRate?: number;
        engagement?: number;
        uniqueViews?: number;
        shares?: number;
        likes?: number;
        timeOnPage?: number;
    };
    author?: string;
    customFields?: Record<string, any>;
    keywords?: string[];
    seo?: {
        structuredData?: Record<string, any>;
        metaTitle?: string;
        metaDescription?: string;
        metaKeywords?: string[];
        canonicalUrl?: string;
        ogTitle?: string;
        ogDescription?: string;
        ogImage?: string;
        twitterCard?: string;
    };
    excerpt?: string;
}>;
export declare const ContentVersionSchema: z.ZodObject<{
    id: z.ZodString;
    contentId: z.ZodString;
    version: z.ZodString;
    content: z.ZodString;
    htmlContent: z.ZodOptional<z.ZodString>;
    markdownContent: z.ZodOptional<z.ZodString>;
    changes: z.ZodOptional<z.ZodString>;
    createdBy: z.ZodString;
    createdAt: z.ZodDate;
    isActive: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    version?: string;
    id?: string;
    createdAt?: Date;
    content?: string;
    isActive?: boolean;
    changes?: string;
    createdBy?: string;
    contentId?: string;
    htmlContent?: string;
    markdownContent?: string;
}, {
    version?: string;
    id?: string;
    createdAt?: Date;
    content?: string;
    isActive?: boolean;
    changes?: string;
    createdBy?: string;
    contentId?: string;
    htmlContent?: string;
    markdownContent?: string;
}>;
export declare const ContentSchema: z.ZodObject<{
    id: z.ZodString;
    organizationId: z.ZodString;
    title: z.ZodString;
    slug: z.ZodString;
    type: z.ZodEnum<["article", "blog", "page", "product", "news", "event", "faq", "tutorial", "documentation", "landing", "other"]>;
    status: z.ZodEnum<["draft", "review", "approved", "published", "archived", "deleted"]>;
    template: z.ZodEnum<["default", "blog", "product", "landing", "news", "custom"]>;
    metadata: z.ZodObject<{
        title: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        excerpt: z.ZodOptional<z.ZodString>;
        tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        categories: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        author: z.ZodString;
        language: z.ZodDefault<z.ZodString>;
        keywords: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        customFields: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodAny>>;
        seo: z.ZodOptional<z.ZodObject<{
            metaTitle: z.ZodOptional<z.ZodString>;
            metaDescription: z.ZodOptional<z.ZodString>;
            metaKeywords: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            canonicalUrl: z.ZodOptional<z.ZodString>;
            ogTitle: z.ZodOptional<z.ZodString>;
            ogDescription: z.ZodOptional<z.ZodString>;
            ogImage: z.ZodOptional<z.ZodString>;
            twitterCard: z.ZodOptional<z.ZodString>;
            structuredData: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        }, "strip", z.ZodTypeAny, {
            structuredData?: Record<string, any>;
            metaTitle?: string;
            metaDescription?: string;
            metaKeywords?: string[];
            canonicalUrl?: string;
            ogTitle?: string;
            ogDescription?: string;
            ogImage?: string;
            twitterCard?: string;
        }, {
            structuredData?: Record<string, any>;
            metaTitle?: string;
            metaDescription?: string;
            metaKeywords?: string[];
            canonicalUrl?: string;
            ogTitle?: string;
            ogDescription?: string;
            ogImage?: string;
            twitterCard?: string;
        }>>;
        analytics: z.ZodOptional<z.ZodObject<{
            views: z.ZodDefault<z.ZodNumber>;
            uniqueViews: z.ZodDefault<z.ZodNumber>;
            shares: z.ZodDefault<z.ZodNumber>;
            comments: z.ZodDefault<z.ZodNumber>;
            likes: z.ZodDefault<z.ZodNumber>;
            engagement: z.ZodDefault<z.ZodNumber>;
            bounceRate: z.ZodDefault<z.ZodNumber>;
            timeOnPage: z.ZodDefault<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            views?: number;
            comments?: number;
            bounceRate?: number;
            engagement?: number;
            uniqueViews?: number;
            shares?: number;
            likes?: number;
            timeOnPage?: number;
        }, {
            views?: number;
            comments?: number;
            bounceRate?: number;
            engagement?: number;
            uniqueViews?: number;
            shares?: number;
            likes?: number;
            timeOnPage?: number;
        }>>;
    }, "strip", z.ZodTypeAny, {
        language?: string;
        title?: string;
        tags?: string[];
        description?: string;
        categories?: string[];
        analytics?: {
            views?: number;
            comments?: number;
            bounceRate?: number;
            engagement?: number;
            uniqueViews?: number;
            shares?: number;
            likes?: number;
            timeOnPage?: number;
        };
        author?: string;
        customFields?: Record<string, any>;
        keywords?: string[];
        seo?: {
            structuredData?: Record<string, any>;
            metaTitle?: string;
            metaDescription?: string;
            metaKeywords?: string[];
            canonicalUrl?: string;
            ogTitle?: string;
            ogDescription?: string;
            ogImage?: string;
            twitterCard?: string;
        };
        excerpt?: string;
    }, {
        language?: string;
        title?: string;
        tags?: string[];
        description?: string;
        categories?: string[];
        analytics?: {
            views?: number;
            comments?: number;
            bounceRate?: number;
            engagement?: number;
            uniqueViews?: number;
            shares?: number;
            likes?: number;
            timeOnPage?: number;
        };
        author?: string;
        customFields?: Record<string, any>;
        keywords?: string[];
        seo?: {
            structuredData?: Record<string, any>;
            metaTitle?: string;
            metaDescription?: string;
            metaKeywords?: string[];
            canonicalUrl?: string;
            ogTitle?: string;
            ogDescription?: string;
            ogImage?: string;
            twitterCard?: string;
        };
        excerpt?: string;
    }>;
    content: z.ZodString;
    htmlContent: z.ZodOptional<z.ZodString>;
    markdownContent: z.ZodOptional<z.ZodString>;
    featuredImage: z.ZodOptional<z.ZodString>;
    images: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    attachments: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    versions: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        contentId: z.ZodString;
        version: z.ZodString;
        content: z.ZodString;
        htmlContent: z.ZodOptional<z.ZodString>;
        markdownContent: z.ZodOptional<z.ZodString>;
        changes: z.ZodOptional<z.ZodString>;
        createdBy: z.ZodString;
        createdAt: z.ZodDate;
        isActive: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        version?: string;
        id?: string;
        createdAt?: Date;
        content?: string;
        isActive?: boolean;
        changes?: string;
        createdBy?: string;
        contentId?: string;
        htmlContent?: string;
        markdownContent?: string;
    }, {
        version?: string;
        id?: string;
        createdAt?: Date;
        content?: string;
        isActive?: boolean;
        changes?: string;
        createdBy?: string;
        contentId?: string;
        htmlContent?: string;
        markdownContent?: string;
    }>, "many">>;
    currentVersion: z.ZodString;
    publishedAt: z.ZodOptional<z.ZodDate>;
    scheduledAt: z.ZodOptional<z.ZodDate>;
    expiresAt: z.ZodOptional<z.ZodDate>;
    isPublic: z.ZodDefault<z.ZodBoolean>;
    isFeatured: z.ZodDefault<z.ZodBoolean>;
    isSticky: z.ZodDefault<z.ZodBoolean>;
    allowComments: z.ZodDefault<z.ZodBoolean>;
    allowSharing: z.ZodDefault<z.ZodBoolean>;
    workflow: z.ZodOptional<z.ZodObject<{
        currentStep: z.ZodString;
        steps: z.ZodDefault<z.ZodArray<z.ZodObject<{
            step: z.ZodString;
            status: z.ZodEnum<["pending", "in_progress", "completed", "rejected"]>;
            assignedTo: z.ZodOptional<z.ZodString>;
            completedAt: z.ZodOptional<z.ZodDate>;
            comments: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            status?: "pending" | "completed" | "rejected" | "in_progress";
            assignedTo?: string;
            completedAt?: Date;
            step?: string;
            comments?: string;
        }, {
            status?: "pending" | "completed" | "rejected" | "in_progress";
            assignedTo?: string;
            completedAt?: Date;
            step?: string;
            comments?: string;
        }>, "many">>;
        approvedBy: z.ZodOptional<z.ZodString>;
        approvedAt: z.ZodOptional<z.ZodDate>;
    }, "strip", z.ZodTypeAny, {
        approvedBy?: string;
        approvedAt?: Date;
        currentStep?: string;
        steps?: {
            status?: "pending" | "completed" | "rejected" | "in_progress";
            assignedTo?: string;
            completedAt?: Date;
            step?: string;
            comments?: string;
        }[];
    }, {
        approvedBy?: string;
        approvedAt?: Date;
        currentStep?: string;
        steps?: {
            status?: "pending" | "completed" | "rejected" | "in_progress";
            assignedTo?: string;
            completedAt?: Date;
            step?: string;
            comments?: string;
        }[];
    }>>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
    createdBy: z.ZodString;
    updatedBy: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type?: "page" | "event" | "product" | "article" | "other" | "documentation" | "news" | "tutorial" | "faq" | "blog" | "landing";
    status?: "archived" | "draft" | "approved" | "deleted" | "review" | "published";
    organizationId?: string;
    metadata?: {
        language?: string;
        title?: string;
        tags?: string[];
        description?: string;
        categories?: string[];
        analytics?: {
            views?: number;
            comments?: number;
            bounceRate?: number;
            engagement?: number;
            uniqueViews?: number;
            shares?: number;
            likes?: number;
            timeOnPage?: number;
        };
        author?: string;
        customFields?: Record<string, any>;
        keywords?: string[];
        seo?: {
            structuredData?: Record<string, any>;
            metaTitle?: string;
            metaDescription?: string;
            metaKeywords?: string[];
            canonicalUrl?: string;
            ogTitle?: string;
            ogDescription?: string;
            ogImage?: string;
            twitterCard?: string;
        };
        excerpt?: string;
    };
    images?: string[];
    title?: string;
    id?: string;
    createdAt?: Date;
    updatedAt?: Date;
    content?: string;
    scheduledAt?: Date;
    expiresAt?: Date;
    slug?: string;
    createdBy?: string;
    template?: "default" | "custom" | "product" | "news" | "blog" | "landing";
    updatedBy?: string;
    attachments?: string[];
    isPublic?: boolean;
    versions?: {
        version?: string;
        id?: string;
        createdAt?: Date;
        content?: string;
        isActive?: boolean;
        changes?: string;
        createdBy?: string;
        contentId?: string;
        htmlContent?: string;
        markdownContent?: string;
    }[];
    currentVersion?: string;
    workflow?: {
        approvedBy?: string;
        approvedAt?: Date;
        currentStep?: string;
        steps?: {
            status?: "pending" | "completed" | "rejected" | "in_progress";
            assignedTo?: string;
            completedAt?: Date;
            step?: string;
            comments?: string;
        }[];
    };
    htmlContent?: string;
    markdownContent?: string;
    featuredImage?: string;
    publishedAt?: Date;
    isFeatured?: boolean;
    isSticky?: boolean;
    allowComments?: boolean;
    allowSharing?: boolean;
}, {
    type?: "page" | "event" | "product" | "article" | "other" | "documentation" | "news" | "tutorial" | "faq" | "blog" | "landing";
    status?: "archived" | "draft" | "approved" | "deleted" | "review" | "published";
    organizationId?: string;
    metadata?: {
        language?: string;
        title?: string;
        tags?: string[];
        description?: string;
        categories?: string[];
        analytics?: {
            views?: number;
            comments?: number;
            bounceRate?: number;
            engagement?: number;
            uniqueViews?: number;
            shares?: number;
            likes?: number;
            timeOnPage?: number;
        };
        author?: string;
        customFields?: Record<string, any>;
        keywords?: string[];
        seo?: {
            structuredData?: Record<string, any>;
            metaTitle?: string;
            metaDescription?: string;
            metaKeywords?: string[];
            canonicalUrl?: string;
            ogTitle?: string;
            ogDescription?: string;
            ogImage?: string;
            twitterCard?: string;
        };
        excerpt?: string;
    };
    images?: string[];
    title?: string;
    id?: string;
    createdAt?: Date;
    updatedAt?: Date;
    content?: string;
    scheduledAt?: Date;
    expiresAt?: Date;
    slug?: string;
    createdBy?: string;
    template?: "default" | "custom" | "product" | "news" | "blog" | "landing";
    updatedBy?: string;
    attachments?: string[];
    isPublic?: boolean;
    versions?: {
        version?: string;
        id?: string;
        createdAt?: Date;
        content?: string;
        isActive?: boolean;
        changes?: string;
        createdBy?: string;
        contentId?: string;
        htmlContent?: string;
        markdownContent?: string;
    }[];
    currentVersion?: string;
    workflow?: {
        approvedBy?: string;
        approvedAt?: Date;
        currentStep?: string;
        steps?: {
            status?: "pending" | "completed" | "rejected" | "in_progress";
            assignedTo?: string;
            completedAt?: Date;
            step?: string;
            comments?: string;
        }[];
    };
    htmlContent?: string;
    markdownContent?: string;
    featuredImage?: string;
    publishedAt?: Date;
    isFeatured?: boolean;
    isSticky?: boolean;
    allowComments?: boolean;
    allowSharing?: boolean;
}>;
export declare const ContentSearchSchema: z.ZodObject<{
    query: z.ZodOptional<z.ZodString>;
    filters: z.ZodOptional<z.ZodObject<{
        type: z.ZodOptional<z.ZodArray<z.ZodEnum<["article", "blog", "page", "product", "news", "event", "faq", "tutorial", "documentation", "landing", "other"]>, "many">>;
        status: z.ZodOptional<z.ZodArray<z.ZodEnum<["draft", "review", "approved", "published", "archived", "deleted"]>, "many">>;
        author: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        categories: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        template: z.ZodOptional<z.ZodArray<z.ZodEnum<["default", "blog", "product", "landing", "news", "custom"]>, "many">>;
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
        isPublic: z.ZodOptional<z.ZodBoolean>;
        isFeatured: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        type?: ("page" | "event" | "product" | "article" | "other" | "documentation" | "news" | "tutorial" | "faq" | "blog" | "landing")[];
        status?: ("archived" | "draft" | "approved" | "deleted" | "review" | "published")[];
        tags?: string[];
        categories?: string[];
        template?: ("default" | "custom" | "product" | "news" | "blog" | "landing")[];
        author?: string[];
        isPublic?: boolean;
        dateRange?: {
            from?: Date;
            to?: Date;
        };
        isFeatured?: boolean;
    }, {
        type?: ("page" | "event" | "product" | "article" | "other" | "documentation" | "news" | "tutorial" | "faq" | "blog" | "landing")[];
        status?: ("archived" | "draft" | "approved" | "deleted" | "review" | "published")[];
        tags?: string[];
        categories?: string[];
        template?: ("default" | "custom" | "product" | "news" | "blog" | "landing")[];
        author?: string[];
        isPublic?: boolean;
        dateRange?: {
            from?: Date;
            to?: Date;
        };
        isFeatured?: boolean;
    }>>;
    sort: z.ZodOptional<z.ZodObject<{
        field: z.ZodEnum<["title", "createdAt", "updatedAt", "publishedAt", "views", "engagement"]>;
        direction: z.ZodEnum<["asc", "desc"]>;
    }, "strip", z.ZodTypeAny, {
        field?: "title" | "createdAt" | "updatedAt" | "views" | "engagement" | "publishedAt";
        direction?: "asc" | "desc";
    }, {
        field?: "title" | "createdAt" | "updatedAt" | "views" | "engagement" | "publishedAt";
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
        field?: "title" | "createdAt" | "updatedAt" | "views" | "engagement" | "publishedAt";
        direction?: "asc" | "desc";
    };
    filters?: {
        type?: ("page" | "event" | "product" | "article" | "other" | "documentation" | "news" | "tutorial" | "faq" | "blog" | "landing")[];
        status?: ("archived" | "draft" | "approved" | "deleted" | "review" | "published")[];
        tags?: string[];
        categories?: string[];
        template?: ("default" | "custom" | "product" | "news" | "blog" | "landing")[];
        author?: string[];
        isPublic?: boolean;
        dateRange?: {
            from?: Date;
            to?: Date;
        };
        isFeatured?: boolean;
    };
    pagination?: {
        page?: number;
        limit?: number;
    };
}, {
    query?: string;
    sort?: {
        field?: "title" | "createdAt" | "updatedAt" | "views" | "engagement" | "publishedAt";
        direction?: "asc" | "desc";
    };
    filters?: {
        type?: ("page" | "event" | "product" | "article" | "other" | "documentation" | "news" | "tutorial" | "faq" | "blog" | "landing")[];
        status?: ("archived" | "draft" | "approved" | "deleted" | "review" | "published")[];
        tags?: string[];
        categories?: string[];
        template?: ("default" | "custom" | "product" | "news" | "blog" | "landing")[];
        author?: string[];
        isPublic?: boolean;
        dateRange?: {
            from?: Date;
            to?: Date;
        };
        isFeatured?: boolean;
    };
    pagination?: {
        page?: number;
        limit?: number;
    };
}>;
export type ContentType = z.infer<typeof ContentTypeSchema>;
export type ContentStatus = z.infer<typeof ContentStatusSchema>;
export type ContentTemplate = z.infer<typeof ContentTemplateSchema>;
export type ContentMetadata = z.infer<typeof ContentMetadataSchema>;
export type ContentVersion = z.infer<typeof ContentVersionSchema>;
export type Content = z.infer<typeof ContentSchema>;
export type ContentSearch = z.infer<typeof ContentSearchSchema>;
export declare class ContentManagementService {
    private db;
    private contents;
    private contentIndex;
    private searchCache;
    private readonly CACHE_TTL;
    constructor();
    private initializeService;
    private initializeContentTables;
    private loadExistingContent;
    private startBackgroundProcessing;
    createContent(organizationId: string, contentData: Omit<Content, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>, createdBy: string): Promise<Content>;
    getContent(contentId: string, organizationId: string): Promise<Content | null>;
    getContentBySlug(slug: string, organizationId: string): Promise<Content | null>;
    updateContent(contentId: string, organizationId: string, updates: Partial<Content>, updatedBy: string): Promise<Content | null>;
    deleteContent(contentId: string, organizationId: string): Promise<boolean>;
    searchContent(organizationId: string, searchParams: ContentSearch): Promise<{
        contents: Content[];
        total: number;
        page: number;
        limit: number;
    }>;
    createContentVersion(contentId: string, organizationId: string, versionData: Omit<ContentVersion, 'id' | 'createdAt'>): Promise<ContentVersion>;
    publishContent(contentId: string, organizationId: string, publishedBy: string): Promise<boolean>;
    unpublishContent(contentId: string, organizationId: string, unpublishedBy: string): Promise<boolean>;
    private indexContent;
    private removeContentFromIndex;
    private processContentQueue;
    private updateContentAnalytics;
    private publishScheduledContent;
    private generateId;
    getContentStatistics(organizationId: string): Promise<{
        totalContents: number;
        contentsByType: Record<string, number>;
        contentsByStatus: Record<string, number>;
        publishedContents: number;
        draftContents: number;
        totalViews: number;
        totalEngagement: number;
        topContents: Content[];
    }>;
}
export declare const contentManagementService: ContentManagementService;
//# sourceMappingURL=content-management.service.d.ts.map