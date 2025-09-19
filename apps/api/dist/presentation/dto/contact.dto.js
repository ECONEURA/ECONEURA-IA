import { z } from 'zod';
export const CreateContactRequestSchema = z.object({
    organizationId: z.string().uuid('Invalid organization ID format'),
    companyId: z.string().uuid('Invalid company ID format').optional(),
    firstName: z.string().min(1, 'First name is required').max(100, 'First name cannot exceed 100 characters'),
    lastName: z.string().min(1, 'Last name is required').max(100, 'Last name cannot exceed 100 characters'),
    middleName: z.string().max(100, 'Middle name cannot exceed 100 characters').optional(),
    title: z.string().max(100, 'Title cannot exceed 100 characters').optional(),
    department: z.string().max(100, 'Department cannot exceed 100 characters').optional(),
    type: z.enum(['primary', 'secondary', 'decision_maker', 'influencer', 'user', 'technical', 'financial', 'procurement'], {
        errorMap: () => ({ message: 'Type must be one of: primary, secondary, decision_maker, influencer, user, technical, financial, procurement' })
    }),
    status: z.enum(['active', 'inactive', 'unsubscribed', 'bounced', 'spam', 'deleted'], {
        errorMap: () => ({ message: 'Status must be one of: active, inactive, unsubscribed, bounced, spam, deleted' })
    }),
    source: z.enum(['website', 'referral', 'cold_call', 'email', 'social_media', 'event', 'trade_show', 'webinar', 'content', 'advertising', 'other'], {
        errorMap: () => ({ message: 'Source must be one of: website, referral, cold_call, email, social_media, event, trade_show, webinar, content, advertising, other' })
    }),
    priority: z.enum(['low', 'medium', 'high', 'urgent'], {
        errorMap: () => ({ message: 'Priority must be one of: low, medium, high, urgent' })
    }),
    email: z.string().email('Invalid email format').optional(),
    phone: z.string().regex(/^[\+]?[1-9][\d]{0,15}$/, 'Invalid phone number format').optional(),
    mobile: z.string().regex(/^[\+]?[1-9][\d]{0,15}$/, 'Invalid mobile number format').optional(),
    fax: z.string().regex(/^[\+]?[1-9][\d]{0,15}$/, 'Invalid fax number format').optional(),
    website: z.string().url('Invalid website URL').optional(),
    address: z.object({
        street: z.string().min(1, 'Street is required'),
        city: z.string().min(1, 'City is required'),
        state: z.string().optional(),
        postalCode: z.string().min(1, 'Postal code is required'),
        country: z.string().min(1, 'Country is required'),
        countryCode: z.string().length(2, 'Country code must be 2 characters')
    }).optional(),
    birthday: z.coerce.date().optional(),
    anniversary: z.coerce.date().optional(),
    gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
    maritalStatus: z.enum(['single', 'married', 'divorced', 'widowed', 'separated']).optional(),
    children: z.number().int().min(0, 'Children count cannot be negative').max(20, 'Children count cannot exceed 20').optional(),
    education: z.string().max(200, 'Education cannot exceed 200 characters').optional(),
    profession: z.string().max(100, 'Profession cannot exceed 100 characters').optional(),
    industry: z.string().max(100, 'Industry cannot exceed 100 characters').optional(),
    experience: z.number().int().min(0, 'Experience cannot be negative').max(50, 'Experience cannot exceed 50 years').optional(),
    salary: z.object({
        amount: z.number().min(0, 'Salary cannot be negative'),
        currency: z.string().length(3, 'Currency must be a 3-letter code')
    }).optional(),
    socialMedia: z.object({
        linkedin: z.string().url('Invalid LinkedIn URL').optional(),
        twitter: z.string().url('Invalid Twitter URL').optional(),
        facebook: z.string().url('Invalid Facebook URL').optional(),
        instagram: z.string().url('Invalid Instagram URL').optional(),
        youtube: z.string().url('Invalid YouTube URL').optional(),
        tiktok: z.string().url('Invalid TikTok URL').optional(),
        other: z.record(z.string()).optional()
    }).optional(),
    communication: z.object({
        preferredMethod: z.enum(['email', 'phone', 'sms', 'whatsapp', 'linkedin', 'other']).optional(),
        bestTimeToCall: z.string().optional(),
        timeZone: z.string().optional(),
        doNotCall: z.boolean().optional(),
        doNotEmail: z.boolean().optional(),
        doNotSms: z.boolean().optional()
    }).optional(),
    settings: z.object({
        notifications: z.object({
            email: z.boolean().optional(),
            sms: z.boolean().optional(),
            push: z.boolean().optional(),
            phone: z.boolean().optional()
        }).optional(),
        preferences: z.object({
            language: z.string().length(2, 'Language must be a 2-letter code').optional(),
            timezone: z.string().optional(),
            currency: z.string().length(3, 'Currency must be a 3-letter code').optional(),
            dateFormat: z.string().optional(),
            timeFormat: z.string().optional()
        }).optional(),
        customFields: z.record(z.any()).optional(),
        tags: z.array(z.string()).optional(),
        notes: z.string().optional(),
        internalNotes: z.string().optional()
    }).optional(),
    assignedUserId: z.string().uuid('Invalid assigned user ID format').optional(),
    nextFollowUpDate: z.coerce.date().optional(),
    leadScore: z.number().int().min(0, 'Lead score must be at least 0').max(100, 'Lead score cannot exceed 100').optional(),
    engagementScore: z.number().int().min(0, 'Engagement score must be at least 0').max(100, 'Engagement score cannot exceed 100').optional()
});
export const UpdateContactRequestSchema = CreateContactRequestSchema.partial().omit({ organizationId: true });
export const DeleteContactRequestSchema = z.object({
    contactId: z.string().uuid('Invalid contact ID format')
});
export const GetContactRequestSchema = z.object({
    contactId: z.string().uuid('Invalid contact ID format')
});
export const SearchContactsRequestSchema = z.object({
    organizationId: z.string().uuid('Invalid organization ID format'),
    query: z.string().optional(),
    type: z.enum(['primary', 'secondary', 'decision_maker', 'influencer', 'user', 'technical', 'financial', 'procurement']).optional(),
    status: z.enum(['active', 'inactive', 'unsubscribed', 'bounced', 'spam', 'deleted']).optional(),
    source: z.enum(['website', 'referral', 'cold_call', 'email', 'social_media', 'event', 'trade_show', 'webinar', 'content', 'advertising', 'other']).optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    assignedUserId: z.string().uuid('Invalid assigned user ID format').optional(),
    companyId: z.string().uuid('Invalid company ID format').optional(),
    department: z.string().optional(),
    industry: z.string().optional(),
    profession: z.string().optional(),
    isActive: z.boolean().optional(),
    isVerified: z.boolean().optional(),
    isOptedIn: z.boolean().optional(),
    hasCompany: z.boolean().optional(),
    isAssigned: z.boolean().optional(),
    leadScoreMin: z.number().int().min(0).max(100).optional(),
    leadScoreMax: z.number().int().min(0).max(100).optional(),
    engagementScoreMin: z.number().int().min(0).max(100).optional(),
    engagementScoreMax: z.number().int().min(0).max(100).optional(),
    revenueMin: z.number().min(0).optional(),
    revenueMax: z.number().min(0).optional(),
    currency: z.string().length(3).optional(),
    salaryMin: z.number().min(0).optional(),
    salaryMax: z.number().min(0).optional(),
    experienceMin: z.number().int().min(0).optional(),
    experienceMax: z.number().int().min(0).optional(),
    ageMin: z.number().int().min(0).optional(),
    ageMax: z.number().int().min(0).optional(),
    lastContactAfter: z.coerce.date().optional(),
    lastContactBefore: z.coerce.date().optional(),
    nextFollowUpAfter: z.coerce.date().optional(),
    nextFollowUpBefore: z.coerce.date().optional(),
    lastEmailOpenAfter: z.coerce.date().optional(),
    lastEmailOpenBefore: z.coerce.date().optional(),
    lastEmailClickAfter: z.coerce.date().optional(),
    lastEmailClickBefore: z.coerce.date().optional(),
    lastWebsiteVisitAfter: z.coerce.date().optional(),
    lastWebsiteVisitBefore: z.coerce.date().optional(),
    lastSocialMediaInteractionAfter: z.coerce.date().optional(),
    lastSocialMediaInteractionBefore: z.coerce.date().optional(),
    createdAfter: z.coerce.date().optional(),
    createdBefore: z.coerce.date().optional(),
    updatedAfter: z.coerce.date().optional(),
    updatedBefore: z.coerce.date().optional(),
    birthdayAfter: z.coerce.date().optional(),
    birthdayBefore: z.coerce.date().optional(),
    anniversaryAfter: z.coerce.date().optional(),
    anniversaryBefore: z.coerce.date().optional(),
    tags: z.array(z.string()).optional(),
    page: z.coerce.number().int().min(1, 'Page must be at least 1').default(1),
    limit: z.coerce.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(20),
    sortBy: z.enum(['firstName', 'lastName', 'type', 'status', 'source', 'priority', 'leadScore', 'engagementScore', 'totalRevenue', 'salary', 'experience', 'lastContactDate', 'nextFollowUpDate', 'createdAt', 'updatedAt']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc')
});
export const BulkUpdateContactsRequestSchema = z.object({
    contactIds: z.array(z.string().uuid('Invalid contact ID format')).min(1, 'At least one contact ID is required').max(100, 'Cannot update more than 100 contacts at once'),
    updates: UpdateContactRequestSchema
});
export const BulkDeleteContactsRequestSchema = z.object({
    contactIds: z.array(z.string().uuid('Invalid contact ID format')).min(1, 'At least one contact ID is required').max(100, 'Cannot delete more than 100 contacts at once')
});
export const ContactResponseSchema = z.object({
    id: z.string().uuid(),
    organizationId: z.string().uuid(),
    companyId: z.string().uuid().nullable(),
    firstName: z.string(),
    lastName: z.string(),
    middleName: z.string().nullable(),
    title: z.string().nullable(),
    department: z.string().nullable(),
    type: z.enum(['primary', 'secondary', 'decision_maker', 'influencer', 'user', 'technical', 'financial', 'procurement']),
    status: z.enum(['active', 'inactive', 'unsubscribed', 'bounced', 'spam', 'deleted']),
    source: z.enum(['website', 'referral', 'cold_call', 'email', 'social_media', 'event', 'trade_show', 'webinar', 'content', 'advertising', 'other']),
    priority: z.enum(['low', 'medium', 'high', 'urgent']),
    email: z.string().nullable(),
    phone: z.string().nullable(),
    mobile: z.string().nullable(),
    fax: z.string().nullable(),
    website: z.string().nullable(),
    address: z.object({
        street: z.string(),
        city: z.string(),
        state: z.string().nullable(),
        postalCode: z.string(),
        country: z.string(),
        countryCode: z.string()
    }).nullable(),
    birthday: z.date().nullable(),
    anniversary: z.date().nullable(),
    gender: z.string().nullable(),
    maritalStatus: z.string().nullable(),
    children: z.number().int().nullable(),
    education: z.string().nullable(),
    profession: z.string().nullable(),
    industry: z.string().nullable(),
    experience: z.number().int().nullable(),
    salary: z.object({
        amount: z.number(),
        currency: z.string()
    }).nullable(),
    socialMedia: z.record(z.any()),
    communication: z.record(z.any()),
    settings: z.object({
        notifications: z.object({
            email: z.boolean(),
            sms: z.boolean(),
            push: z.boolean(),
            phone: z.boolean()
        }),
        preferences: z.object({
            language: z.string(),
            timezone: z.string(),
            currency: z.string(),
            dateFormat: z.string(),
            timeFormat: z.string()
        }),
        customFields: z.record(z.any()),
        tags: z.array(z.string()),
        notes: z.string(),
        internalNotes: z.string()
    }),
    assignedUserId: z.string().uuid().nullable(),
    lastContactDate: z.date().nullable(),
    nextFollowUpDate: z.date().nullable(),
    leadScore: z.number().int().nullable(),
    engagementScore: z.number().int().nullable(),
    lastEmailOpen: z.date().nullable(),
    lastEmailClick: z.date().nullable(),
    lastWebsiteVisit: z.date().nullable(),
    lastSocialMediaInteraction: z.date().nullable(),
    totalInteractions: z.number().int(),
    totalEmailsSent: z.number().int(),
    totalEmailsOpened: z.number().int(),
    totalEmailsClicked: z.number().int(),
    totalCallsMade: z.number().int(),
    totalMeetingsScheduled: z.number().int(),
    totalMeetingsAttended: z.number().int(),
    totalDealsWon: z.number().int(),
    totalDealsLost: z.number().int(),
    totalRevenue: z.object({
        amount: z.number(),
        currency: z.string()
    }),
    isActive: z.boolean(),
    isVerified: z.boolean(),
    isOptedIn: z.boolean(),
    fullName: z.string(),
    displayName: z.string(),
    leadScoreLevel: z.enum(['low', 'medium', 'high']),
    engagementScoreLevel: z.enum(['low', 'medium', 'high']),
    emailOpenRate: z.number(),
    emailClickRate: z.number(),
    meetingAttendanceRate: z.number(),
    dealWinRate: z.number(),
    averageDealValue: z.object({
        amount: z.number(),
        currency: z.string()
    }),
    isPrimary: z.boolean(),
    isDecisionMaker: z.boolean(),
    isInfluencer: z.boolean(),
    isTechnical: z.boolean(),
    isFinancial: z.boolean(),
    isProcurement: z.boolean(),
    isAssigned: z.boolean(),
    hasCompany: z.boolean(),
    isOverdueForFollowUp: z.boolean(),
    daysSinceLastContact: z.number().int(),
    daysUntilFollowUp: z.number().int(),
    age: z.number().int().nullable(),
    isBirthdayToday: z.boolean(),
    isAnniversaryToday: z.boolean(),
    createdAt: z.date(),
    updatedAt: z.date()
});
export const ContactListResponseSchema = z.object({
    contacts: z.array(ContactResponseSchema),
    total: z.number().int().min(0),
    page: z.number().int().min(1),
    limit: z.number().int().min(1),
    totalPages: z.number().int().min(0),
    hasNext: z.boolean(),
    hasPrevious: z.boolean()
});
export const ContactStatsResponseSchema = z.object({
    total: z.number().int().min(0),
    byType: z.record(z.string(), z.number().int().min(0)),
    byStatus: z.record(z.string(), z.number().int().min(0)),
    bySource: z.record(z.string(), z.number().int().min(0)),
    byPriority: z.record(z.string(), z.number().int().min(0)),
    byDepartment: z.record(z.string(), z.number().int().min(0)),
    byIndustry: z.record(z.string(), z.number().int().min(0)),
    byProfession: z.record(z.string(), z.number().int().min(0)),
    active: z.number().int().min(0),
    inactive: z.number().int().min(0),
    primary: z.number().int().min(0),
    decisionMakers: z.number().int().min(0),
    influencers: z.number().int().min(0),
    technical: z.number().int().min(0),
    financial: z.number().int().min(0),
    procurement: z.number().int().min(0),
    verified: z.number().int().min(0),
    unverified: z.number().int().min(0),
    optedIn: z.number().int().min(0),
    optedOut: z.number().int().min(0),
    assigned: z.number().int().min(0),
    unassigned: z.number().int().min(0),
    withCompany: z.number().int().min(0),
    withoutCompany: z.number().int().min(0),
    overdueForFollowUp: z.number().int().min(0),
    highScoreLeads: z.number().int().min(0),
    mediumScoreLeads: z.number().int().min(0),
    lowScoreLeads: z.number().int().min(0),
    highlyEngaged: z.number().int().min(0),
    moderatelyEngaged: z.number().int().min(0),
    lowEngaged: z.number().int().min(0),
    averageLeadScore: z.number(),
    averageEngagementScore: z.number(),
    totalRevenue: z.number(),
    averageRevenue: z.number(),
    totalSalary: z.number(),
    averageSalary: z.number(),
    totalExperience: z.number().int().min(0),
    averageExperience: z.number(),
    totalInteractions: z.number().int().min(0),
    averageInteractions: z.number(),
    totalEmailsSent: z.number().int().min(0),
    totalEmailsOpened: z.number().int().min(0),
    totalEmailsClicked: z.number().int().min(0),
    totalCallsMade: z.number().int().min(0),
    totalMeetingsScheduled: z.number().int().min(0),
    totalMeetingsAttended: z.number().int().min(0),
    totalDealsWon: z.number().int().min(0),
    totalDealsLost: z.number().int().min(0),
    averageEmailOpenRate: z.number(),
    averageEmailClickRate: z.number(),
    averageMeetingAttendanceRate: z.number(),
    averageDealWinRate: z.number(),
    contactsByYear: z.record(z.string(), z.number().int().min(0)),
    contactsByMonth: z.record(z.string(), z.number().int().min(0)),
    topDepartments: z.array(z.object({
        department: z.string(),
        count: z.number().int().min(0)
    })),
    topIndustries: z.array(z.object({
        industry: z.string(),
        count: z.number().int().min(0)
    })),
    topProfessions: z.array(z.object({
        profession: z.string(),
        count: z.number().int().min(0)
    })),
    topSources: z.array(z.object({
        source: z.string(),
        count: z.number().int().min(0)
    })),
    topAssignedUsers: z.array(z.object({
        userId: z.string(),
        count: z.number().int().min(0)
    })),
    topCompanies: z.array(z.object({
        companyId: z.string(),
        count: z.number().int().min(0)
    })),
    contactsWithBirthdayToday: z.number().int().min(0),
    contactsWithBirthdayThisWeek: z.number().int().min(0),
    contactsWithBirthdayThisMonth: z.number().int().min(0),
    contactsWithAnniversaryToday: z.number().int().min(0),
    contactsWithAnniversaryThisWeek: z.number().int().min(0),
    contactsWithAnniversaryThisMonth: z.number().int().min(0)
});
export const validateCreateContactRequest = (data) => {
    return CreateContactRequestSchema.parse(data);
};
export const validateUpdateContactRequest = (data) => {
    return UpdateContactRequestSchema.parse(data);
};
export const validateDeleteContactRequest = (data) => {
    return DeleteContactRequestSchema.parse(data);
};
export const validateGetContactRequest = (data) => {
    return GetContactRequestSchema.parse(data);
};
export const validateSearchContactsRequest = (data) => {
    return SearchContactsRequestSchema.parse(data);
};
export const validateBulkUpdateContactsRequest = (data) => {
    return BulkUpdateContactsRequestSchema.parse(data);
};
export const validateBulkDeleteContactsRequest = (data) => {
    return BulkDeleteContactsRequestSchema.parse(data);
};
export const transformContactToResponse = (contact) => {
    return {
        id: contact.id,
        organizationId: contact.organizationId,
        companyId: contact.companyId,
        firstName: contact.firstName,
        lastName: contact.lastName,
        middleName: contact.middleName,
        title: contact.title,
        department: contact.department,
        type: contact.type,
        status: contact.status,
        source: contact.source,
        priority: contact.priority,
        email: contact.email,
        phone: contact.phone,
        mobile: contact.mobile,
        fax: contact.fax,
        website: contact.website,
        address: contact.address,
        birthday: contact.birthday,
        anniversary: contact.anniversary,
        gender: contact.gender,
        maritalStatus: contact.maritalStatus,
        children: contact.children,
        education: contact.education,
        profession: contact.profession,
        industry: contact.industry,
        experience: contact.experience,
        salary: contact.salary,
        socialMedia: contact.socialMedia,
        communication: contact.communication,
        settings: contact.settings,
        assignedUserId: contact.assignedUserId,
        lastContactDate: contact.lastContactDate,
        nextFollowUpDate: contact.nextFollowUpDate,
        leadScore: contact.leadScore,
        engagementScore: contact.engagementScore,
        lastEmailOpen: contact.lastEmailOpen,
        lastEmailClick: contact.lastEmailClick,
        lastWebsiteVisit: contact.lastWebsiteVisit,
        lastSocialMediaInteraction: contact.lastSocialMediaInteraction,
        totalInteractions: contact.totalInteractions,
        totalEmailsSent: contact.totalEmailsSent,
        totalEmailsOpened: contact.totalEmailsOpened,
        totalEmailsClicked: contact.totalEmailsClicked,
        totalCallsMade: contact.totalCallsMade,
        totalMeetingsScheduled: contact.totalMeetingsScheduled,
        totalMeetingsAttended: contact.totalMeetingsAttended,
        totalDealsWon: contact.totalDealsWon,
        totalDealsLost: contact.totalDealsLost,
        totalRevenue: contact.totalRevenue,
        isActive: contact.isActive,
        isVerified: contact.isVerified,
        isOptedIn: contact.isOptedIn,
        fullName: contact.fullName,
        displayName: contact.displayName,
        leadScoreLevel: contact.leadScoreLevel,
        engagementScoreLevel: contact.engagementScoreLevel,
        emailOpenRate: contact.emailOpenRate,
        emailClickRate: contact.emailClickRate,
        meetingAttendanceRate: contact.meetingAttendanceRate,
        dealWinRate: contact.dealWinRate,
        averageDealValue: contact.averageDealValue,
        isPrimary: contact.isPrimary,
        isDecisionMaker: contact.isDecisionMaker,
        isInfluencer: contact.isInfluencer,
        isTechnical: contact.isTechnical,
        isFinancial: contact.isFinancial,
        isProcurement: contact.isProcurement,
        isAssigned: contact.isAssigned,
        hasCompany: contact.hasCompany,
        isOverdueForFollowUp: contact.isOverdueForFollowUp,
        daysSinceLastContact: contact.daysSinceLastContact,
        daysUntilFollowUp: contact.daysUntilFollowUp,
        age: contact.age,
        isBirthdayToday: contact.isBirthdayToday,
        isAnniversaryToday: contact.isAnniversaryToday,
        createdAt: contact.createdAt,
        updatedAt: contact.updatedAt
    };
};
export const transformContactListToResponse = (contactList) => {
    return {
        contacts: contactList.contacts.map(transformContactToResponse),
        total: contactList.total,
        page: contactList.page,
        limit: contactList.limit,
        totalPages: contactList.totalPages,
        hasNext: contactList.hasNext,
        hasPrevious: contactList.hasPrevious
    };
};
export const transformContactStatsToResponse = (stats) => {
    return {
        total: stats.total,
        byType: stats.byType,
        byStatus: stats.byStatus,
        bySource: stats.bySource,
        byPriority: stats.byPriority,
        byDepartment: stats.byDepartment,
        byIndustry: stats.byIndustry,
        byProfession: stats.byProfession,
        active: stats.active,
        inactive: stats.inactive,
        primary: stats.primary,
        decisionMakers: stats.decisionMakers,
        influencers: stats.influencers,
        technical: stats.technical,
        financial: stats.financial,
        procurement: stats.procurement,
        verified: stats.verified,
        unverified: stats.unverified,
        optedIn: stats.optedIn,
        optedOut: stats.optedOut,
        assigned: stats.assigned,
        unassigned: stats.unassigned,
        withCompany: stats.withCompany,
        withoutCompany: stats.withoutCompany,
        overdueForFollowUp: stats.overdueForFollowUp,
        highScoreLeads: stats.highScoreLeads,
        mediumScoreLeads: stats.mediumScoreLeads,
        lowScoreLeads: stats.lowScoreLeads,
        highlyEngaged: stats.highlyEngaged,
        moderatelyEngaged: stats.moderatelyEngaged,
        lowEngaged: stats.lowEngaged,
        averageLeadScore: stats.averageLeadScore,
        averageEngagementScore: stats.averageEngagementScore,
        totalRevenue: stats.totalRevenue,
        averageRevenue: stats.averageRevenue,
        totalSalary: stats.totalSalary,
        averageSalary: stats.averageSalary,
        totalExperience: stats.totalExperience,
        averageExperience: stats.averageExperience,
        totalInteractions: stats.totalInteractions,
        averageInteractions: stats.averageInteractions,
        totalEmailsSent: stats.totalEmailsSent,
        totalEmailsOpened: stats.totalEmailsOpened,
        totalEmailsClicked: stats.totalEmailsClicked,
        totalCallsMade: stats.totalCallsMade,
        totalMeetingsScheduled: stats.totalMeetingsScheduled,
        totalMeetingsAttended: stats.totalMeetingsAttended,
        totalDealsWon: stats.totalDealsWon,
        totalDealsLost: stats.totalDealsLost,
        averageEmailOpenRate: stats.averageEmailOpenRate,
        averageEmailClickRate: stats.averageEmailClickRate,
        averageMeetingAttendanceRate: stats.averageMeetingAttendanceRate,
        averageDealWinRate: stats.averageDealWinRate,
        contactsByYear: stats.contactsByYear,
        contactsByMonth: stats.contactsByMonth,
        topDepartments: stats.topDepartments,
        topIndustries: stats.topIndustries,
        topProfessions: stats.topProfessions,
        topSources: stats.topSources,
        topAssignedUsers: stats.topAssignedUsers,
        topCompanies: stats.topCompanies,
        contactsWithBirthdayToday: stats.contactsWithBirthdayToday,
        contactsWithBirthdayThisWeek: stats.contactsWithBirthdayThisWeek,
        contactsWithBirthdayThisMonth: stats.contactsWithBirthdayThisMonth,
        contactsWithAnniversaryToday: stats.contactsWithAnniversaryToday,
        contactsWithAnniversaryThisWeek: stats.contactsWithAnniversaryThisWeek,
        contactsWithAnniversaryThisMonth: stats.contactsWithAnniversaryThisMonth
    };
};
//# sourceMappingURL=contact.dto.js.map