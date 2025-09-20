import { Router } from 'express';
import { validateRequest } from '../middleware/validation.middleware.js';
import { z } from 'zod';
export const createContactRoutes = (contactController) => {
    const router = Router();
    router.post('/', validateRequest({
        body: z.object({
            organizationId: z.string().uuid(),
            companyId: z.string().uuid().optional(),
            firstName: z.string().min(1).max(100),
            lastName: z.string().min(1).max(100),
            middleName: z.string().max(100).optional(),
            title: z.string().max(100).optional(),
            department: z.string().max(100).optional(),
            type: z.enum(['primary', 'secondary', 'decision_maker', 'influencer', 'user', 'technical', 'financial', 'procurement']),
            status: z.enum(['active', 'inactive', 'unsubscribed', 'bounced', 'spam', 'deleted']),
            source: z.enum(['website', 'referral', 'cold_call', 'email', 'social_media', 'event', 'trade_show', 'webinar', 'content', 'advertising', 'other']),
            priority: z.enum(['low', 'medium', 'high', 'urgent']),
            email: z.string().email().optional(),
            phone: z.string().regex(/^[\+]?[1-9][\d]{0,15}$/).optional(),
            mobile: z.string().regex(/^[\+]?[1-9][\d]{0,15}$/).optional(),
            fax: z.string().regex(/^[\+]?[1-9][\d]{0,15}$/).optional(),
            website: z.string().url().optional(),
            address: z.object({
                street: z.string().min(1),
                city: z.string().min(1),
                state: z.string().optional(),
                postalCode: z.string().min(1),
                country: z.string().min(1),
                countryCode: z.string().length(2)
            }).optional(),
            birthday: z.coerce.date().optional(),
            anniversary: z.coerce.date().optional(),
            gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
            maritalStatus: z.enum(['single', 'married', 'divorced', 'widowed', 'separated']).optional(),
            children: z.number().int().min(0).max(20).optional(),
            education: z.string().max(200).optional(),
            profession: z.string().max(100).optional(),
            industry: z.string().max(100).optional(),
            experience: z.number().int().min(0).max(50).optional(),
            salary: z.object({
                amount: z.number().min(0),
                currency: z.string().length(3)
            }).optional(),
            socialMedia: z.object({
                linkedin: z.string().url().optional(),
                twitter: z.string().url().optional(),
                facebook: z.string().url().optional(),
                instagram: z.string().url().optional(),
                youtube: z.string().url().optional(),
                tiktok: z.string().url().optional(),
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
                    language: z.string().length(2).optional(),
                    timezone: z.string().optional(),
                    currency: z.string().length(3).optional(),
                    dateFormat: z.string().optional(),
                    timeFormat: z.string().optional()
                }).optional(),
                customFields: z.record(z.any()).optional(),
                tags: z.array(z.string()).optional(),
                notes: z.string().optional(),
                internalNotes: z.string().optional()
            }).optional(),
            assignedUserId: z.string().uuid().optional(),
            nextFollowUpDate: z.coerce.date().optional(),
            leadScore: z.number().int().min(0).max(100).optional(),
            engagementScore: z.number().int().min(0).max(100).optional()
        })
    }), contactController.createContact.bind(contactController));
    router.put('/:contactId', validateRequest({
        params: z.object({
            contactId: z.string().uuid()
        }),
        body: z.object({
            companyId: z.string().uuid().optional(),
            firstName: z.string().min(1).max(100).optional(),
            lastName: z.string().min(1).max(100).optional(),
            middleName: z.string().max(100).optional(),
            title: z.string().max(100).optional(),
            department: z.string().max(100).optional(),
            type: z.enum(['primary', 'secondary', 'decision_maker', 'influencer', 'user', 'technical', 'financial', 'procurement']).optional(),
            status: z.enum(['active', 'inactive', 'unsubscribed', 'bounced', 'spam', 'deleted']).optional(),
            source: z.enum(['website', 'referral', 'cold_call', 'email', 'social_media', 'event', 'trade_show', 'webinar', 'content', 'advertising', 'other']).optional(),
            priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
            email: z.string().email().optional(),
            phone: z.string().regex(/^[\+]?[1-9][\d]{0,15}$/).optional(),
            mobile: z.string().regex(/^[\+]?[1-9][\d]{0,15}$/).optional(),
            fax: z.string().regex(/^[\+]?[1-9][\d]{0,15}$/).optional(),
            website: z.string().url().optional(),
            address: z.object({
                street: z.string().min(1),
                city: z.string().min(1),
                state: z.string().optional(),
                postalCode: z.string().min(1),
                country: z.string().min(1),
                countryCode: z.string().length(2)
            }).optional(),
            birthday: z.coerce.date().optional(),
            anniversary: z.coerce.date().optional(),
            gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
            maritalStatus: z.enum(['single', 'married', 'divorced', 'widowed', 'separated']).optional(),
            children: z.number().int().min(0).max(20).optional(),
            education: z.string().max(200).optional(),
            profession: z.string().max(100).optional(),
            industry: z.string().max(100).optional(),
            experience: z.number().int().min(0).max(50).optional(),
            salary: z.object({
                amount: z.number().min(0),
                currency: z.string().length(3)
            }).optional(),
            socialMedia: z.object({
                linkedin: z.string().url().optional(),
                twitter: z.string().url().optional(),
                facebook: z.string().url().optional(),
                instagram: z.string().url().optional(),
                youtube: z.string().url().optional(),
                tiktok: z.string().url().optional(),
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
                    language: z.string().length(2).optional(),
                    timezone: z.string().optional(),
                    currency: z.string().length(3).optional(),
                    dateFormat: z.string().optional(),
                    timeFormat: z.string().optional()
                }).optional(),
                customFields: z.record(z.any()).optional(),
                tags: z.array(z.string()).optional(),
                notes: z.string().optional(),
                internalNotes: z.string().optional()
            }).optional(),
            assignedUserId: z.string().uuid().optional(),
            nextFollowUpDate: z.coerce.date().optional(),
            leadScore: z.number().int().min(0).max(100).optional(),
            engagementScore: z.number().int().min(0).max(100).optional()
        })
    }), contactController.updateContact.bind(contactController));
    router.delete('/:contactId', validateRequest({
        params: z.object({
            contactId: z.string().uuid()
        })
    }), contactController.deleteContact.bind(contactController));
    router.get('/:contactId', validateRequest({
        params: z.object({
            contactId: z.string().uuid()
        })
    }), contactController.getContactById.bind(contactController));
    router.get('/organization/:organizationId', validateRequest({
        params: z.object({
            organizationId: z.string().uuid()
        })
    }), contactController.getContactsByOrganization.bind(contactController));
    router.get('/company/:companyId', validateRequest({
        params: z.object({
            companyId: z.string().uuid()
        })
    }), contactController.getContactsByCompany.bind(contactController));
    router.get('/organization/:organizationId/search', validateRequest({
        params: z.object({
            organizationId: z.string().uuid()
        }),
        query: z.object({
            query: z.string().optional(),
            type: z.enum(['primary', 'secondary', 'decision_maker', 'influencer', 'user', 'technical', 'financial', 'procurement']).optional(),
            status: z.enum(['active', 'inactive', 'unsubscribed', 'bounced', 'spam', 'deleted']).optional(),
            source: z.enum(['website', 'referral', 'cold_call', 'email', 'social_media', 'event', 'trade_show', 'webinar', 'content', 'advertising', 'other']).optional(),
            priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
            assignedUserId: z.string().uuid().optional(),
            companyId: z.string().uuid().optional(),
            department: z.string().optional(),
            industry: z.string().optional(),
            profession: z.string().optional(),
            isActive: z.boolean().optional(),
            isVerified: z.boolean().optional(),
            isOptedIn: z.boolean().optional(),
            hasCompany: z.boolean().optional(),
            isAssigned: z.boolean().optional(),
            leadScoreMin: z.coerce.number().int().min(0).max(100).optional(),
            leadScoreMax: z.coerce.number().int().min(0).max(100).optional(),
            engagementScoreMin: z.coerce.number().int().min(0).max(100).optional(),
            engagementScoreMax: z.coerce.number().int().min(0).max(100).optional(),
            revenueMin: z.coerce.number().min(0).optional(),
            revenueMax: z.coerce.number().min(0).optional(),
            currency: z.string().length(3).optional(),
            salaryMin: z.coerce.number().min(0).optional(),
            salaryMax: z.coerce.number().min(0).optional(),
            experienceMin: z.coerce.number().int().min(0).optional(),
            experienceMax: z.coerce.number().int().min(0).optional(),
            ageMin: z.coerce.number().int().min(0).optional(),
            ageMax: z.coerce.number().int().min(0).optional(),
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
            page: z.coerce.number().int().min(1).default(1),
            limit: z.coerce.number().int().min(1).max(100).default(20),
            sortBy: z.enum(['firstName', 'lastName', 'type', 'status', 'source', 'priority', 'leadScore', 'engagementScore', 'totalRevenue', 'salary', 'experience', 'lastContactDate', 'nextFollowUpDate', 'createdAt', 'updatedAt']).default('createdAt'),
            sortOrder: z.enum(['asc', 'desc']).default('desc')
        })
    }), contactController.searchContacts.bind(contactController));
    router.get('/organization/:organizationId/stats', validateRequest({
        params: z.object({
            organizationId: z.string().uuid()
        })
    }), contactController.getContactStats.bind(contactController));
    router.get('/organization/:organizationId/type/:type', validateRequest({
        params: z.object({
            organizationId: z.string().uuid(),
            type: z.enum(['primary', 'secondary', 'decision_maker', 'influencer', 'user', 'technical', 'financial', 'procurement'])
        })
    }), contactController.getContactsByType.bind(contactController));
    router.get('/organization/:organizationId/status/:status', validateRequest({
        params: z.object({
            organizationId: z.string().uuid(),
            status: z.enum(['active', 'inactive', 'unsubscribed', 'bounced', 'spam', 'deleted'])
        })
    }), contactController.getContactsByStatus.bind(contactController));
    router.get('/organization/:organizationId/department/:department', validateRequest({
        params: z.object({
            organizationId: z.string().uuid(),
            department: z.string()
        })
    }), contactController.getContactsByDepartment.bind(contactController));
    router.get('/organization/:organizationId/industry/:industry', validateRequest({
        params: z.object({
            organizationId: z.string().uuid(),
            industry: z.string()
        })
    }), contactController.getContactsByIndustry.bind(contactController));
    router.get('/organization/:organizationId/assigned/:userId', validateRequest({
        params: z.object({
            organizationId: z.string().uuid(),
            userId: z.string().uuid()
        })
    }), contactController.getContactsByAssignedUser.bind(contactController));
    router.get('/organization/:organizationId/overdue-follow-up', validateRequest({
        params: z.object({
            organizationId: z.string().uuid()
        })
    }), contactController.getOverdueForFollowUp.bind(contactController));
    router.get('/organization/:organizationId/scheduled-follow-up/:date', validateRequest({
        params: z.object({
            organizationId: z.string().uuid(),
            date: z.coerce.date()
        })
    }), contactController.getScheduledForFollowUp.bind(contactController));
    router.get('/organization/:organizationId/high-score-leads', validateRequest({
        params: z.object({
            organizationId: z.string().uuid()
        }),
        query: z.object({
            minScore: z.coerce.number().int().min(0).max(100).default(70)
        })
    }), contactController.getHighScoreLeads.bind(contactController));
    router.get('/organization/:organizationId/medium-score-leads', validateRequest({
        params: z.object({
            organizationId: z.string().uuid()
        })
    }), contactController.getMediumScoreLeads.bind(contactController));
    router.get('/organization/:organizationId/low-score-leads', validateRequest({
        params: z.object({
            organizationId: z.string().uuid()
        })
    }), contactController.getLowScoreLeads.bind(contactController));
    router.get('/organization/:organizationId/highly-engaged', validateRequest({
        params: z.object({
            organizationId: z.string().uuid()
        }),
        query: z.object({
            minScore: z.coerce.number().int().min(0).max(100).default(70)
        })
    }), contactController.getHighlyEngagedContacts.bind(contactController));
    router.get('/organization/:organizationId/moderately-engaged', validateRequest({
        params: z.object({
            organizationId: z.string().uuid()
        })
    }), contactController.getModeratelyEngagedContacts.bind(contactController));
    router.get('/contacts/organization/:organizationId/low-engaged', validateRequest({
        params: z.object({
            organizationId: z.string().uuid()
        })
    }), contactController.getLowEngagedContacts.bind(contactController));
    router.get('/organization/:organizationId/birthday-today', validateRequest({
        params: z.object({
            organizationId: z.string().uuid()
        })
    }), contactController.getContactsWithBirthdayToday.bind(contactController));
    router.get('/organization/:organizationId/birthday-this-week', validateRequest({
        params: z.object({
            organizationId: z.string().uuid()
        })
    }), contactController.getContactsWithBirthdayThisWeek.bind(contactController));
    router.get('/organization/:organizationId/birthday-this-month', validateRequest({
        params: z.object({
            organizationId: z.string().uuid()
        })
    }), contactController.getContactsWithBirthdayThisMonth.bind(contactController));
    router.get('/organization/:organizationId/anniversary-today', validateRequest({
        params: z.object({
            organizationId: z.string().uuid()
        })
    }), contactController.getContactsWithAnniversaryToday.bind(contactController));
    router.get('/organization/:organizationId/anniversary-this-week', validateRequest({
        params: z.object({
            organizationId: z.string().uuid()
        })
    }), contactController.getContactsWithAnniversaryThisWeek.bind(contactController));
    router.get('/organization/:organizationId/anniversary-this-month', validateRequest({
        params: z.object({
            organizationId: z.string().uuid()
        })
    }), contactController.getContactsWithAnniversaryThisMonth.bind(contactController));
    router.put('/bulk/update', validateRequest({
        body: z.object({
            contactIds: z.array(z.string().uuid()).min(1).max(100),
            updates: z.object({
                companyId: z.string().uuid().optional(),
                firstName: z.string().min(1).max(100).optional(),
                lastName: z.string().min(1).max(100).optional(),
                middleName: z.string().max(100).optional(),
                title: z.string().max(100).optional(),
                department: z.string().max(100).optional(),
                type: z.enum(['primary', 'secondary', 'decision_maker', 'influencer', 'user', 'technical', 'financial', 'procurement']).optional(),
                status: z.enum(['active', 'inactive', 'unsubscribed', 'bounced', 'spam', 'deleted']).optional(),
                source: z.enum(['website', 'referral', 'cold_call', 'email', 'social_media', 'event', 'trade_show', 'webinar', 'content', 'advertising', 'other']).optional(),
                priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
                email: z.string().email().optional(),
                phone: z.string().regex(/^[\+]?[1-9][\d]{0,15}$/).optional(),
                mobile: z.string().regex(/^[\+]?[1-9][\d]{0,15}$/).optional(),
                fax: z.string().regex(/^[\+]?[1-9][\d]{0,15}$/).optional(),
                website: z.string().url().optional(),
                assignedUserId: z.string().uuid().optional(),
                nextFollowUpDate: z.coerce.date().optional(),
                leadScore: z.number().int().min(0).max(100).optional(),
                engagementScore: z.number().int().min(0).max(100).optional(),
                settings: z.object({
                    notifications: z.object({
                        email: z.boolean().optional(),
                        sms: z.boolean().optional(),
                        push: z.boolean().optional(),
                        phone: z.boolean().optional()
                    }).optional(),
                    preferences: z.object({
                        language: z.string().length(2).optional(),
                        timezone: z.string().optional(),
                        currency: z.string().length(3).optional(),
                        dateFormat: z.string().optional(),
                        timeFormat: z.string().optional()
                    }).optional(),
                    customFields: z.record(z.any()).optional(),
                    tags: z.array(z.string()).optional(),
                    notes: z.string().optional(),
                    internalNotes: z.string().optional()
                }).optional()
            })
        })
    }), contactController.bulkUpdateContacts.bind(contactController));
    router.delete('/bulk/delete', validateRequest({
        body: z.object({
            contactIds: z.array(z.string().uuid()).min(1).max(100)
        })
    }), contactController.bulkDeleteContacts.bind(contactController));
    return router;
};
//# sourceMappingURL=contact.routes.js.map