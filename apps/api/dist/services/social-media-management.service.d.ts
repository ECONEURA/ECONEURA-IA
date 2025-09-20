import { z } from 'zod';
export declare const SocialPlatformSchema: z.ZodEnum<["facebook", "twitter", "instagram", "linkedin", "youtube", "tiktok", "pinterest", "snapchat", "telegram", "discord"]>;
export declare const PostTypeSchema: z.ZodEnum<["text", "image", "video", "carousel", "story", "reel", "live", "poll", "event", "link"]>;
export declare const PostStatusSchema: z.ZodEnum<["draft", "scheduled", "published", "failed", "deleted"]>;
export declare const EngagementTypeSchema: z.ZodEnum<["like", "comment", "share", "retweet", "save", "view", "click", "mention"]>;
export declare const SocialAccountSchema: z.ZodObject<{
    id: z.ZodString;
    organizationId: z.ZodString;
    platform: z.ZodEnum<["facebook", "twitter", "instagram", "linkedin", "youtube", "tiktok", "pinterest", "snapchat", "telegram", "discord"]>;
    username: z.ZodString;
    displayName: z.ZodString;
    profileUrl: z.ZodString;
    avatarUrl: z.ZodOptional<z.ZodString>;
    bio: z.ZodOptional<z.ZodString>;
    followersCount: z.ZodDefault<z.ZodNumber>;
    followingCount: z.ZodDefault<z.ZodNumber>;
    postsCount: z.ZodDefault<z.ZodNumber>;
    isVerified: z.ZodDefault<z.ZodBoolean>;
    isActive: z.ZodDefault<z.ZodBoolean>;
    accessToken: z.ZodOptional<z.ZodString>;
    refreshToken: z.ZodOptional<z.ZodString>;
    tokenExpiresAt: z.ZodOptional<z.ZodDate>;
    permissions: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodAny>>;
    lastSyncAt: z.ZodOptional<z.ZodDate>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    organizationId?: string;
    metadata?: Record<string, any>;
    id?: string;
    createdAt?: Date;
    updatedAt?: Date;
    isActive?: boolean;
    username?: string;
    permissions?: string[];
    isVerified?: boolean;
    accessToken?: string;
    platform?: "linkedin" | "twitter" | "facebook" | "instagram" | "youtube" | "tiktok" | "pinterest" | "snapchat" | "telegram" | "discord";
    displayName?: string;
    refreshToken?: string;
    profileUrl?: string;
    avatarUrl?: string;
    bio?: string;
    followersCount?: number;
    followingCount?: number;
    postsCount?: number;
    tokenExpiresAt?: Date;
    lastSyncAt?: Date;
}, {
    organizationId?: string;
    metadata?: Record<string, any>;
    id?: string;
    createdAt?: Date;
    updatedAt?: Date;
    isActive?: boolean;
    username?: string;
    permissions?: string[];
    isVerified?: boolean;
    accessToken?: string;
    platform?: "linkedin" | "twitter" | "facebook" | "instagram" | "youtube" | "tiktok" | "pinterest" | "snapchat" | "telegram" | "discord";
    displayName?: string;
    refreshToken?: string;
    profileUrl?: string;
    avatarUrl?: string;
    bio?: string;
    followersCount?: number;
    followingCount?: number;
    postsCount?: number;
    tokenExpiresAt?: Date;
    lastSyncAt?: Date;
}>;
export declare const SocialPostSchema: z.ZodObject<{
    id: z.ZodString;
    organizationId: z.ZodString;
    accountId: z.ZodString;
    platform: z.ZodEnum<["facebook", "twitter", "instagram", "linkedin", "youtube", "tiktok", "pinterest", "snapchat", "telegram", "discord"]>;
    type: z.ZodEnum<["text", "image", "video", "carousel", "story", "reel", "live", "poll", "event", "link"]>;
    status: z.ZodEnum<["draft", "scheduled", "published", "failed", "deleted"]>;
    content: z.ZodString;
    mediaUrls: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    hashtags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    mentions: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    scheduledAt: z.ZodOptional<z.ZodDate>;
    publishedAt: z.ZodOptional<z.ZodDate>;
    platformPostId: z.ZodOptional<z.ZodString>;
    platformPostUrl: z.ZodOptional<z.ZodString>;
    engagement: z.ZodOptional<z.ZodObject<{
        likes: z.ZodDefault<z.ZodNumber>;
        comments: z.ZodDefault<z.ZodNumber>;
        shares: z.ZodDefault<z.ZodNumber>;
        views: z.ZodDefault<z.ZodNumber>;
        clicks: z.ZodDefault<z.ZodNumber>;
        saves: z.ZodDefault<z.ZodNumber>;
        reach: z.ZodDefault<z.ZodNumber>;
        impressions: z.ZodDefault<z.ZodNumber>;
        engagementRate: z.ZodDefault<z.ZodNumber>;
        clickThroughRate: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        views?: number;
        comments?: number;
        shares?: number;
        likes?: number;
        clicks?: number;
        saves?: number;
        reach?: number;
        impressions?: number;
        engagementRate?: number;
        clickThroughRate?: number;
    }, {
        views?: number;
        comments?: number;
        shares?: number;
        likes?: number;
        clicks?: number;
        saves?: number;
        reach?: number;
        impressions?: number;
        engagementRate?: number;
        clickThroughRate?: number;
    }>>;
    analytics: z.ZodOptional<z.ZodObject<{
        demographics: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        topLocations: z.ZodDefault<z.ZodArray<z.ZodObject<{
            location: z.ZodString;
            count: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            count?: number;
            location?: string;
        }, {
            count?: number;
            location?: string;
        }>, "many">>;
        topHashtags: z.ZodDefault<z.ZodArray<z.ZodObject<{
            hashtag: z.ZodString;
            count: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            count?: number;
            hashtag?: string;
        }, {
            count?: number;
            hashtag?: string;
        }>, "many">>;
        sentiment: z.ZodOptional<z.ZodObject<{
            positive: z.ZodDefault<z.ZodNumber>;
            negative: z.ZodDefault<z.ZodNumber>;
            neutral: z.ZodDefault<z.ZodNumber>;
            score: z.ZodDefault<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            score?: number;
            positive?: number;
            negative?: number;
            neutral?: number;
        }, {
            score?: number;
            positive?: number;
            negative?: number;
            neutral?: number;
        }>>;
        bestTimeToPost: z.ZodDefault<z.ZodArray<z.ZodObject<{
            hour: z.ZodNumber;
            day: z.ZodString;
            engagement: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            day?: string;
            hour?: number;
            engagement?: number;
        }, {
            day?: string;
            hour?: number;
            engagement?: number;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        sentiment?: {
            score?: number;
            positive?: number;
            negative?: number;
            neutral?: number;
        };
        demographics?: Record<string, any>;
        topLocations?: {
            count?: number;
            location?: string;
        }[];
        topHashtags?: {
            count?: number;
            hashtag?: string;
        }[];
        bestTimeToPost?: {
            day?: string;
            hour?: number;
            engagement?: number;
        }[];
    }, {
        sentiment?: {
            score?: number;
            positive?: number;
            negative?: number;
            neutral?: number;
        };
        demographics?: Record<string, any>;
        topLocations?: {
            count?: number;
            location?: string;
        }[];
        topHashtags?: {
            count?: number;
            hashtag?: string;
        }[];
        bestTimeToPost?: {
            day?: string;
            hour?: number;
            engagement?: number;
        }[];
    }>>;
    aiGenerated: z.ZodDefault<z.ZodBoolean>;
    aiPrompt: z.ZodOptional<z.ZodString>;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    campaignId: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
    createdBy: z.ZodString;
    updatedBy: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type?: "live" | "text" | "link" | "event" | "video" | "image" | "carousel" | "story" | "reel" | "poll";
    status?: "failed" | "draft" | "scheduled" | "deleted" | "published";
    organizationId?: string;
    id?: string;
    tags?: string[];
    createdAt?: Date;
    updatedAt?: Date;
    content?: string;
    scheduledAt?: Date;
    accountId?: string;
    analytics?: {
        sentiment?: {
            score?: number;
            positive?: number;
            negative?: number;
            neutral?: number;
        };
        demographics?: Record<string, any>;
        topLocations?: {
            count?: number;
            location?: string;
        }[];
        topHashtags?: {
            count?: number;
            hashtag?: string;
        }[];
        bestTimeToPost?: {
            day?: string;
            hour?: number;
            engagement?: number;
        }[];
    };
    createdBy?: string;
    updatedBy?: string;
    platform?: "linkedin" | "twitter" | "facebook" | "instagram" | "youtube" | "tiktok" | "pinterest" | "snapchat" | "telegram" | "discord";
    campaignId?: string;
    engagement?: {
        views?: number;
        comments?: number;
        shares?: number;
        likes?: number;
        clicks?: number;
        saves?: number;
        reach?: number;
        impressions?: number;
        engagementRate?: number;
        clickThroughRate?: number;
    };
    publishedAt?: Date;
    mediaUrls?: string[];
    hashtags?: string[];
    mentions?: string[];
    platformPostId?: string;
    platformPostUrl?: string;
    aiGenerated?: boolean;
    aiPrompt?: string;
}, {
    type?: "live" | "text" | "link" | "event" | "video" | "image" | "carousel" | "story" | "reel" | "poll";
    status?: "failed" | "draft" | "scheduled" | "deleted" | "published";
    organizationId?: string;
    id?: string;
    tags?: string[];
    createdAt?: Date;
    updatedAt?: Date;
    content?: string;
    scheduledAt?: Date;
    accountId?: string;
    analytics?: {
        sentiment?: {
            score?: number;
            positive?: number;
            negative?: number;
            neutral?: number;
        };
        demographics?: Record<string, any>;
        topLocations?: {
            count?: number;
            location?: string;
        }[];
        topHashtags?: {
            count?: number;
            hashtag?: string;
        }[];
        bestTimeToPost?: {
            day?: string;
            hour?: number;
            engagement?: number;
        }[];
    };
    createdBy?: string;
    updatedBy?: string;
    platform?: "linkedin" | "twitter" | "facebook" | "instagram" | "youtube" | "tiktok" | "pinterest" | "snapchat" | "telegram" | "discord";
    campaignId?: string;
    engagement?: {
        views?: number;
        comments?: number;
        shares?: number;
        likes?: number;
        clicks?: number;
        saves?: number;
        reach?: number;
        impressions?: number;
        engagementRate?: number;
        clickThroughRate?: number;
    };
    publishedAt?: Date;
    mediaUrls?: string[];
    hashtags?: string[];
    mentions?: string[];
    platformPostId?: string;
    platformPostUrl?: string;
    aiGenerated?: boolean;
    aiPrompt?: string;
}>;
export declare const SocialMentionSchema: z.ZodObject<{
    id: z.ZodString;
    organizationId: z.ZodString;
    platform: z.ZodEnum<["facebook", "twitter", "instagram", "linkedin", "youtube", "tiktok", "pinterest", "snapchat", "telegram", "discord"]>;
    postId: z.ZodOptional<z.ZodString>;
    authorId: z.ZodString;
    authorUsername: z.ZodString;
    authorDisplayName: z.ZodString;
    authorAvatarUrl: z.ZodOptional<z.ZodString>;
    content: z.ZodString;
    mediaUrls: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    hashtags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    mentions: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    url: z.ZodString;
    publishedAt: z.ZodDate;
    sentiment: z.ZodOptional<z.ZodObject<{
        positive: z.ZodDefault<z.ZodNumber>;
        negative: z.ZodDefault<z.ZodNumber>;
        neutral: z.ZodDefault<z.ZodNumber>;
        score: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        score?: number;
        positive?: number;
        negative?: number;
        neutral?: number;
    }, {
        score?: number;
        positive?: number;
        negative?: number;
        neutral?: number;
    }>>;
    isRelevant: z.ZodDefault<z.ZodBoolean>;
    isResponded: z.ZodDefault<z.ZodBoolean>;
    responseId: z.ZodOptional<z.ZodString>;
    priority: z.ZodDefault<z.ZodEnum<["low", "medium", "high", "urgent"]>>;
    category: z.ZodDefault<z.ZodEnum<["complaint", "question", "praise", "suggestion", "other"]>>;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodAny>>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    organizationId?: string;
    metadata?: Record<string, any>;
    url?: string;
    id?: string;
    tags?: string[];
    createdAt?: Date;
    updatedAt?: Date;
    content?: string;
    category?: "other" | "suggestion" | "question" | "complaint" | "praise";
    priority?: "low" | "medium" | "high" | "urgent";
    sentiment?: {
        score?: number;
        positive?: number;
        negative?: number;
        neutral?: number;
    };
    platform?: "linkedin" | "twitter" | "facebook" | "instagram" | "youtube" | "tiktok" | "pinterest" | "snapchat" | "telegram" | "discord";
    responseId?: string;
    publishedAt?: Date;
    authorId?: string;
    mediaUrls?: string[];
    hashtags?: string[];
    mentions?: string[];
    postId?: string;
    authorUsername?: string;
    authorDisplayName?: string;
    authorAvatarUrl?: string;
    isRelevant?: boolean;
    isResponded?: boolean;
}, {
    organizationId?: string;
    metadata?: Record<string, any>;
    url?: string;
    id?: string;
    tags?: string[];
    createdAt?: Date;
    updatedAt?: Date;
    content?: string;
    category?: "other" | "suggestion" | "question" | "complaint" | "praise";
    priority?: "low" | "medium" | "high" | "urgent";
    sentiment?: {
        score?: number;
        positive?: number;
        negative?: number;
        neutral?: number;
    };
    platform?: "linkedin" | "twitter" | "facebook" | "instagram" | "youtube" | "tiktok" | "pinterest" | "snapchat" | "telegram" | "discord";
    responseId?: string;
    publishedAt?: Date;
    authorId?: string;
    mediaUrls?: string[];
    hashtags?: string[];
    mentions?: string[];
    postId?: string;
    authorUsername?: string;
    authorDisplayName?: string;
    authorAvatarUrl?: string;
    isRelevant?: boolean;
    isResponded?: boolean;
}>;
export declare const SocialCampaignSchema: z.ZodObject<{
    id: z.ZodString;
    organizationId: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    platforms: z.ZodDefault<z.ZodArray<z.ZodEnum<["facebook", "twitter", "instagram", "linkedin", "youtube", "tiktok", "pinterest", "snapchat", "telegram", "discord"]>, "many">>;
    accounts: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    posts: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    startDate: z.ZodDate;
    endDate: z.ZodOptional<z.ZodDate>;
    budget: z.ZodOptional<z.ZodNumber>;
    objectives: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    targetAudience: z.ZodOptional<z.ZodObject<{
        demographics: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        interests: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        locations: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        languages: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        languages?: string[];
        demographics?: Record<string, any>;
        interests?: string[];
        locations?: string[];
    }, {
        languages?: string[];
        demographics?: Record<string, any>;
        interests?: string[];
        locations?: string[];
    }>>;
    metrics: z.ZodOptional<z.ZodObject<{
        reach: z.ZodDefault<z.ZodNumber>;
        impressions: z.ZodDefault<z.ZodNumber>;
        engagement: z.ZodDefault<z.ZodNumber>;
        clicks: z.ZodDefault<z.ZodNumber>;
        conversions: z.ZodDefault<z.ZodNumber>;
        cost: z.ZodDefault<z.ZodNumber>;
        roi: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        cost?: number;
        conversions?: number;
        engagement?: number;
        clicks?: number;
        reach?: number;
        impressions?: number;
        roi?: number;
    }, {
        cost?: number;
        conversions?: number;
        engagement?: number;
        clicks?: number;
        reach?: number;
        impressions?: number;
        roi?: number;
    }>>;
    status: z.ZodDefault<z.ZodEnum<["draft", "active", "paused", "completed", "cancelled"]>>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
    createdBy: z.ZodString;
    updatedBy: z.ZodString;
}, "strip", z.ZodTypeAny, {
    status?: "completed" | "cancelled" | "active" | "draft" | "paused";
    organizationId?: string;
    name?: string;
    metrics?: {
        cost?: number;
        conversions?: number;
        engagement?: number;
        clicks?: number;
        reach?: number;
        impressions?: number;
        roi?: number;
    };
    id?: string;
    createdAt?: Date;
    updatedAt?: Date;
    description?: string;
    startDate?: Date;
    endDate?: Date;
    createdBy?: string;
    updatedBy?: string;
    budget?: number;
    objectives?: string[];
    platforms?: ("linkedin" | "twitter" | "facebook" | "instagram" | "youtube" | "tiktok" | "pinterest" | "snapchat" | "telegram" | "discord")[];
    accounts?: string[];
    targetAudience?: {
        languages?: string[];
        demographics?: Record<string, any>;
        interests?: string[];
        locations?: string[];
    };
    posts?: string[];
}, {
    status?: "completed" | "cancelled" | "active" | "draft" | "paused";
    organizationId?: string;
    name?: string;
    metrics?: {
        cost?: number;
        conversions?: number;
        engagement?: number;
        clicks?: number;
        reach?: number;
        impressions?: number;
        roi?: number;
    };
    id?: string;
    createdAt?: Date;
    updatedAt?: Date;
    description?: string;
    startDate?: Date;
    endDate?: Date;
    createdBy?: string;
    updatedBy?: string;
    budget?: number;
    objectives?: string[];
    platforms?: ("linkedin" | "twitter" | "facebook" | "instagram" | "youtube" | "tiktok" | "pinterest" | "snapchat" | "telegram" | "discord")[];
    accounts?: string[];
    targetAudience?: {
        languages?: string[];
        demographics?: Record<string, any>;
        interests?: string[];
        locations?: string[];
    };
    posts?: string[];
}>;
export declare const SocialSearchSchema: z.ZodObject<{
    query: z.ZodOptional<z.ZodString>;
    filters: z.ZodOptional<z.ZodObject<{
        platforms: z.ZodOptional<z.ZodArray<z.ZodEnum<["facebook", "twitter", "instagram", "linkedin", "youtube", "tiktok", "pinterest", "snapchat", "telegram", "discord"]>, "many">>;
        types: z.ZodOptional<z.ZodArray<z.ZodEnum<["text", "image", "video", "carousel", "story", "reel", "live", "poll", "event", "link"]>, "many">>;
        status: z.ZodOptional<z.ZodArray<z.ZodEnum<["draft", "scheduled", "published", "failed", "deleted"]>, "many">>;
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
        accounts: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        status?: ("failed" | "draft" | "scheduled" | "deleted" | "published")[];
        tags?: string[];
        types?: ("live" | "text" | "link" | "event" | "video" | "image" | "carousel" | "story" | "reel" | "poll")[];
        platforms?: ("linkedin" | "twitter" | "facebook" | "instagram" | "youtube" | "tiktok" | "pinterest" | "snapchat" | "telegram" | "discord")[];
        accounts?: string[];
        dateRange?: {
            from?: Date;
            to?: Date;
        };
    }, {
        status?: ("failed" | "draft" | "scheduled" | "deleted" | "published")[];
        tags?: string[];
        types?: ("live" | "text" | "link" | "event" | "video" | "image" | "carousel" | "story" | "reel" | "poll")[];
        platforms?: ("linkedin" | "twitter" | "facebook" | "instagram" | "youtube" | "tiktok" | "pinterest" | "snapchat" | "telegram" | "discord")[];
        accounts?: string[];
        dateRange?: {
            from?: Date;
            to?: Date;
        };
    }>>;
    sort: z.ZodOptional<z.ZodObject<{
        field: z.ZodEnum<["createdAt", "publishedAt", "engagement", "reach", "impressions"]>;
        direction: z.ZodEnum<["asc", "desc"]>;
    }, "strip", z.ZodTypeAny, {
        field?: "createdAt" | "engagement" | "publishedAt" | "reach" | "impressions";
        direction?: "asc" | "desc";
    }, {
        field?: "createdAt" | "engagement" | "publishedAt" | "reach" | "impressions";
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
        field?: "createdAt" | "engagement" | "publishedAt" | "reach" | "impressions";
        direction?: "asc" | "desc";
    };
    filters?: {
        status?: ("failed" | "draft" | "scheduled" | "deleted" | "published")[];
        tags?: string[];
        types?: ("live" | "text" | "link" | "event" | "video" | "image" | "carousel" | "story" | "reel" | "poll")[];
        platforms?: ("linkedin" | "twitter" | "facebook" | "instagram" | "youtube" | "tiktok" | "pinterest" | "snapchat" | "telegram" | "discord")[];
        accounts?: string[];
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
        field?: "createdAt" | "engagement" | "publishedAt" | "reach" | "impressions";
        direction?: "asc" | "desc";
    };
    filters?: {
        status?: ("failed" | "draft" | "scheduled" | "deleted" | "published")[];
        tags?: string[];
        types?: ("live" | "text" | "link" | "event" | "video" | "image" | "carousel" | "story" | "reel" | "poll")[];
        platforms?: ("linkedin" | "twitter" | "facebook" | "instagram" | "youtube" | "tiktok" | "pinterest" | "snapchat" | "telegram" | "discord")[];
        accounts?: string[];
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
export type SocialPlatform = z.infer<typeof SocialPlatformSchema>;
export type PostType = z.infer<typeof PostTypeSchema>;
export type PostStatus = z.infer<typeof PostStatusSchema>;
export type EngagementType = z.infer<typeof EngagementTypeSchema>;
export type SocialAccount = z.infer<typeof SocialAccountSchema>;
export type SocialPost = z.infer<typeof SocialPostSchema>;
export type SocialMention = z.infer<typeof SocialMentionSchema>;
export type SocialCampaign = z.infer<typeof SocialCampaignSchema>;
export type SocialSearch = z.infer<typeof SocialSearchSchema>;
export declare class SocialMediaManagementService {
    private db;
    private accounts;
    private posts;
    private mentions;
    private campaigns;
    private searchCache;
    private readonly CACHE_TTL;
    constructor();
    private initializeService;
    private initializeSocialMediaTables;
    private loadExistingData;
    private startBackgroundProcessing;
    createAccount(organizationId: string, accountData: Omit<SocialAccount, 'id' | 'createdAt' | 'updatedAt'>): Promise<SocialAccount>;
    getAccount(accountId: string, organizationId: string): Promise<SocialAccount | null>;
    createPost(organizationId: string, postData: Omit<SocialPost, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>, createdBy: string): Promise<SocialPost>;
    getPost(postId: string, organizationId: string): Promise<SocialPost | null>;
    searchPosts(organizationId: string, searchParams: SocialSearch): Promise<{
        posts: SocialPost[];
        total: number;
        page: number;
        limit: number;
    }>;
    private processScheduledPosts;
    private syncAccountData;
    private updateAnalytics;
    private monitorMentions;
    private generateId;
    getSocialMediaStatistics(organizationId: string): Promise<{
        totalAccounts: number;
        accountsByPlatform: Record<string, number>;
        totalPosts: number;
        postsByPlatform: Record<string, number>;
        postsByStatus: Record<string, number>;
        totalMentions: number;
        mentionsByPlatform: Record<string, number>;
        totalCampaigns: number;
        campaignsByStatus: Record<string, number>;
        averageEngagementRate: number;
        topPerformingPosts: SocialPost[];
    }>;
}
export declare const socialMediaManagementService: SocialMediaManagementService;
//# sourceMappingURL=social-media-management.service.d.ts.map