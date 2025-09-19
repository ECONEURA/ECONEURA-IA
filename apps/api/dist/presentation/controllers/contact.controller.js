import { CreateContactUseCase } from '../../application/use-cases/contact/create-contact.use-case.js';
import { UpdateContactUseCase } from '../../application/use-cases/contact/update-contact.use-case.js';
import { validateCreateContactRequest, validateUpdateContactRequest, validateDeleteContactRequest, validateGetContactRequest, validateSearchContactsRequest, validateBulkUpdateContactsRequest, validateBulkDeleteContactsRequest, transformContactToResponse, transformContactListToResponse, transformContactStatsToResponse } from '../dto/contact.dto.js';
export class ContactController {
    contactRepository;
    createContactUseCase;
    updateContactUseCase;
    constructor(contactRepository) {
        this.contactRepository = contactRepository;
        this.createContactUseCase = new CreateContactUseCase(contactRepository);
        this.updateContactUseCase = new UpdateContactUseCase(contactRepository);
    }
    async createContact(req, res, next) {
        try {
            const requestData = validateCreateContactRequest(req.body);
            const createdBy = req.user?.id || req.headers['x-user-id'];
            if (!createdBy) {
                res.status(401).json({
                    success: false,
                    error: 'User ID is required',
                    timestamp: new Date()
                });
                return;
            }
            const result = await this.createContactUseCase.execute({
                ...requestData,
                createdBy
            });
            if (!result.success) {
                res.status(400).json({
                    success: false,
                    error: result.error,
                    timestamp: new Date()
                });
                return;
            }
            const response = {
                success: true,
                data: transformContactToResponse(result.contact),
                message: 'Contact created successfully',
                timestamp: new Date(),
                requestId: req.headers['x-request-id']
            };
            res.status(201).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    async updateContact(req, res, next) {
        try {
            const contactId = req.params.contactId;
            const requestData = validateUpdateContactRequest(req.body);
            const updatedBy = req.user?.id || req.headers['x-user-id'];
            if (!updatedBy) {
                res.status(401).json({
                    success: false,
                    error: 'User ID is required',
                    timestamp: new Date()
                });
                return;
            }
            const result = await this.updateContactUseCase.execute({
                contactId,
                ...requestData,
                updatedBy
            });
            if (!result.success) {
                res.status(400).json({
                    success: false,
                    error: result.error,
                    timestamp: new Date()
                });
                return;
            }
            const response = {
                success: true,
                data: transformContactToResponse(result.contact),
                message: 'Contact updated successfully',
                timestamp: new Date(),
                requestId: req.headers['x-request-id']
            };
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    async deleteContact(req, res, next) {
        try {
            const requestData = validateDeleteContactRequest({ contactId: req.params.contactId });
            const contact = await this.contactRepository.findById(requestData.contactId);
            if (!contact) {
                res.status(404).json({
                    success: false,
                    error: 'Contact not found',
                    timestamp: new Date()
                });
                return;
            }
            await this.contactRepository.delete(requestData.contactId);
            const response = {
                success: true,
                message: 'Contact deleted successfully',
                timestamp: new Date(),
                requestId: req.headers['x-request-id']
            };
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    async getContactById(req, res, next) {
        try {
            const requestData = validateGetContactRequest({ contactId: req.params.contactId });
            const contact = await this.contactRepository.findById(requestData.contactId);
            if (!contact) {
                res.status(404).json({
                    success: false,
                    error: 'Contact not found',
                    timestamp: new Date()
                });
                return;
            }
            const response = {
                success: true,
                data: transformContactToResponse(contact),
                timestamp: new Date(),
                requestId: req.headers['x-request-id']
            };
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    async getContactsByOrganization(req, res, next) {
        try {
            const organizationId = req.params.organizationId;
            const contacts = await this.contactRepository.findByOrganizationId(organizationId);
            const response = {
                success: true,
                data: contacts.map(transformContactToResponse),
                timestamp: new Date(),
                requestId: req.headers['x-request-id']
            };
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    async getContactsByCompany(req, res, next) {
        try {
            const companyId = req.params.companyId;
            const contacts = await this.contactRepository.findByCompanyId(companyId);
            const response = {
                success: true,
                data: contacts.map(transformContactToResponse),
                timestamp: new Date(),
                requestId: req.headers['x-request-id']
            };
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    async searchContacts(req, res, next) {
        try {
            const requestData = validateSearchContactsRequest({
                ...req.query,
                organizationId: req.params.organizationId
            });
            const result = await this.contactRepository.findPaginated(requestData.organizationId, requestData.page, requestData.limit, {
                type: requestData.type,
                status: requestData.status,
                source: requestData.source,
                priority: requestData.priority,
                assignedUserId: requestData.assignedUserId,
                companyId: requestData.companyId,
                department: requestData.department,
                industry: requestData.industry,
                profession: requestData.profession,
                isActive: requestData.isActive,
                isVerified: requestData.isVerified,
                isOptedIn: requestData.isOptedIn,
                hasCompany: requestData.hasCompany,
                isAssigned: requestData.isAssigned,
                leadScoreMin: requestData.leadScoreMin,
                leadScoreMax: requestData.leadScoreMax,
                engagementScoreMin: requestData.engagementScoreMin,
                engagementScoreMax: requestData.engagementScoreMax,
                revenueMin: requestData.revenueMin,
                revenueMax: requestData.revenueMax,
                currency: requestData.currency,
                salaryMin: requestData.salaryMin,
                salaryMax: requestData.salaryMax,
                experienceMin: requestData.experienceMin,
                experienceMax: requestData.experienceMax,
                ageMin: requestData.ageMin,
                ageMax: requestData.ageMax,
                lastContactAfter: requestData.lastContactAfter,
                lastContactBefore: requestData.lastContactBefore,
                nextFollowUpAfter: requestData.nextFollowUpAfter,
                nextFollowUpBefore: requestData.nextFollowUpBefore,
                lastEmailOpenAfter: requestData.lastEmailOpenAfter,
                lastEmailOpenBefore: requestData.lastEmailOpenBefore,
                lastEmailClickAfter: requestData.lastEmailClickAfter,
                lastEmailClickBefore: requestData.lastEmailClickBefore,
                lastWebsiteVisitAfter: requestData.lastWebsiteVisitAfter,
                lastWebsiteVisitBefore: requestData.lastWebsiteVisitBefore,
                lastSocialMediaInteractionAfter: requestData.lastSocialMediaInteractionAfter,
                lastSocialMediaInteractionBefore: requestData.lastSocialMediaInteractionBefore,
                createdAfter: requestData.createdAfter,
                createdBefore: requestData.createdBefore,
                updatedAfter: requestData.updatedAfter,
                updatedBefore: requestData.updatedBefore,
                birthdayAfter: requestData.birthdayAfter,
                birthdayBefore: requestData.birthdayBefore,
                anniversaryAfter: requestData.anniversaryAfter,
                anniversaryBefore: requestData.anniversaryBefore,
                tags: requestData.tags
            });
            const response = {
                success: true,
                data: transformContactListToResponse(result),
                timestamp: new Date(),
                requestId: req.headers['x-request-id']
            };
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    async getContactStats(req, res, next) {
        try {
            const organizationId = req.params.organizationId;
            const contacts = await this.contactRepository.findByOrganizationId(organizationId);
            const stats = this.calculateContactStats(contacts);
            const response = {
                success: true,
                data: transformContactStatsToResponse(stats),
                timestamp: new Date(),
                requestId: req.headers['x-request-id']
            };
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    async getContactsByType(req, res, next) {
        try {
            const organizationId = req.params.organizationId;
            const type = req.params.type;
            const contacts = await this.contactRepository.findByOrganizationAndType(organizationId, type);
            const response = {
                success: true,
                data: contacts.map(transformContactToResponse),
                timestamp: new Date(),
                requestId: req.headers['x-request-id']
            };
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    async getContactsByStatus(req, res, next) {
        try {
            const organizationId = req.params.organizationId;
            const status = req.params.status;
            const contacts = await this.contactRepository.findByOrganizationAndStatus(organizationId, status);
            const response = {
                success: true,
                data: contacts.map(transformContactToResponse),
                timestamp: new Date(),
                requestId: req.headers['x-request-id']
            };
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    async getContactsByDepartment(req, res, next) {
        try {
            const organizationId = req.params.organizationId;
            const department = req.params.department;
            const contacts = await this.contactRepository.findByOrganizationAndDepartment(organizationId, department);
            const response = {
                success: true,
                data: contacts.map(transformContactToResponse),
                timestamp: new Date(),
                requestId: req.headers['x-request-id']
            };
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    async getContactsByIndustry(req, res, next) {
        try {
            const organizationId = req.params.organizationId;
            const industry = req.params.industry;
            const contacts = await this.contactRepository.findByOrganizationAndIndustry(organizationId, industry);
            const response = {
                success: true,
                data: contacts.map(transformContactToResponse),
                timestamp: new Date(),
                requestId: req.headers['x-request-id']
            };
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    async getContactsByAssignedUser(req, res, next) {
        try {
            const organizationId = req.params.organizationId;
            const userId = req.params.userId;
            const contacts = await this.contactRepository.findByOrganizationAndAssignedUser(organizationId, userId);
            const response = {
                success: true,
                data: contacts.map(transformContactToResponse),
                timestamp: new Date(),
                requestId: req.headers['x-request-id']
            };
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    async getOverdueForFollowUp(req, res, next) {
        try {
            const organizationId = req.params.organizationId;
            const contacts = await this.contactRepository.findOverdueForFollowUp(organizationId);
            const response = {
                success: true,
                data: contacts.map(transformContactToResponse),
                timestamp: new Date(),
                requestId: req.headers['x-request-id']
            };
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    async getScheduledForFollowUp(req, res, next) {
        try {
            const organizationId = req.params.organizationId;
            const date = new Date(req.params.date);
            const contacts = await this.contactRepository.findScheduledForFollowUp(organizationId, date);
            const response = {
                success: true,
                data: contacts.map(transformContactToResponse),
                timestamp: new Date(),
                requestId: req.headers['x-request-id']
            };
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    async getHighScoreLeads(req, res, next) {
        try {
            const organizationId = req.params.organizationId;
            const minScore = parseInt(req.query.minScore) || 70;
            const contacts = await this.contactRepository.findHighScoreLeads(organizationId, minScore);
            const response = {
                success: true,
                data: contacts.map(transformContactToResponse),
                timestamp: new Date(),
                requestId: req.headers['x-request-id']
            };
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    async getMediumScoreLeads(req, res, next) {
        try {
            const organizationId = req.params.organizationId;
            const contacts = await this.contactRepository.findMediumScoreLeads(organizationId);
            const response = {
                success: true,
                data: contacts.map(transformContactToResponse),
                timestamp: new Date(),
                requestId: req.headers['x-request-id']
            };
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    async getLowScoreLeads(req, res, next) {
        try {
            const organizationId = req.params.organizationId;
            const contacts = await this.contactRepository.findLowScoreLeads(organizationId);
            const response = {
                success: true,
                data: contacts.map(transformContactToResponse),
                timestamp: new Date(),
                requestId: req.headers['x-request-id']
            };
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    async getHighlyEngagedContacts(req, res, next) {
        try {
            const organizationId = req.params.organizationId;
            const minScore = parseInt(req.query.minScore) || 70;
            const contacts = await this.contactRepository.findHighlyEngagedContacts(organizationId, minScore);
            const response = {
                success: true,
                data: contacts.map(transformContactToResponse),
                timestamp: new Date(),
                requestId: req.headers['x-request-id']
            };
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    async getModeratelyEngagedContacts(req, res, next) {
        try {
            const organizationId = req.params.organizationId;
            const contacts = await this.contactRepository.findModeratelyEngagedContacts(organizationId);
            const response = {
                success: true,
                data: contacts.map(transformContactToResponse),
                timestamp: new Date(),
                requestId: req.headers['x-request-id']
            };
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    async getLowEngagedContacts(req, res, next) {
        try {
            const organizationId = req.params.organizationId;
            const contacts = await this.contactRepository.findLowEngagedContacts(organizationId);
            const response = {
                success: true,
                data: contacts.map(transformContactToResponse),
                timestamp: new Date(),
                requestId: req.headers['x-request-id']
            };
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    async getContactsWithBirthdayToday(req, res, next) {
        try {
            const organizationId = req.params.organizationId;
            const contacts = await this.contactRepository.findContactsWithBirthdayToday(organizationId);
            const response = {
                success: true,
                data: contacts.map(transformContactToResponse),
                timestamp: new Date(),
                requestId: req.headers['x-request-id']
            };
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    async getContactsWithBirthdayThisWeek(req, res, next) {
        try {
            const organizationId = req.params.organizationId;
            const contacts = await this.contactRepository.findContactsWithBirthdayThisWeek(organizationId);
            const response = {
                success: true,
                data: contacts.map(transformContactToResponse),
                timestamp: new Date(),
                requestId: req.headers['x-request-id']
            };
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    async getContactsWithBirthdayThisMonth(req, res, next) {
        try {
            const organizationId = req.params.organizationId;
            const contacts = await this.contactRepository.findContactsWithBirthdayThisMonth(organizationId);
            const response = {
                success: true,
                data: contacts.map(transformContactToResponse),
                timestamp: new Date(),
                requestId: req.headers['x-request-id']
            };
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    async getContactsWithAnniversaryToday(req, res, next) {
        try {
            const organizationId = req.params.organizationId;
            const contacts = await this.contactRepository.findContactsWithAnniversaryToday(organizationId);
            const response = {
                success: true,
                data: contacts.map(transformContactToResponse),
                timestamp: new Date(),
                requestId: req.headers['x-request-id']
            };
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    async getContactsWithAnniversaryThisWeek(req, res, next) {
        try {
            const organizationId = req.params.organizationId;
            const contacts = await this.contactRepository.findContactsWithAnniversaryThisWeek(organizationId);
            const response = {
                success: true,
                data: contacts.map(transformContactToResponse),
                timestamp: new Date(),
                requestId: req.headers['x-request-id']
            };
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    async getContactsWithAnniversaryThisMonth(req, res, next) {
        try {
            const organizationId = req.params.organizationId;
            const contacts = await this.contactRepository.findContactsWithAnniversaryThisMonth(organizationId);
            const response = {
                success: true,
                data: contacts.map(transformContactToResponse),
                timestamp: new Date(),
                requestId: req.headers['x-request-id']
            };
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    async bulkUpdateContacts(req, res, next) {
        try {
            const requestData = validateBulkUpdateContactsRequest(req.body);
            const updatedBy = req.user?.id || req.headers['x-user-id'];
            if (!updatedBy) {
                res.status(401).json({
                    success: false,
                    error: 'User ID is required',
                    timestamp: new Date()
                });
                return;
            }
            const results = [];
            let successCount = 0;
            let errorCount = 0;
            for (const contactId of requestData.contactIds) {
                try {
                    const result = await this.updateContactUseCase.execute({
                        contactId,
                        ...requestData.updates,
                        updatedBy
                    });
                    if (result.success) {
                        successCount++;
                        results.push({ contactId, success: true, contact: result.contact });
                    }
                    else {
                        errorCount++;
                        results.push({ contactId, success: false, error: result.error });
                    }
                }
                catch (error) {
                    errorCount++;
                    results.push({
                        contactId,
                        success: false,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    });
                }
            }
            const response = {
                success: errorCount === 0,
                data: {
                    total: requestData.contactIds.length,
                    successful: successCount,
                    failed: errorCount,
                    results
                },
                message: `Bulk update completed: ${successCount} successful, ${errorCount} failed`,
                timestamp: new Date(),
                requestId: req.headers['x-request-id']
            };
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    async bulkDeleteContacts(req, res, next) {
        try {
            const requestData = validateBulkDeleteContactsRequest(req.body);
            const results = [];
            let successCount = 0;
            let errorCount = 0;
            for (const contactId of requestData.contactIds) {
                try {
                    const contact = await this.contactRepository.findById(contactId);
                    if (!contact) {
                        errorCount++;
                        results.push({ contactId, success: false, error: 'Contact not found' });
                        continue;
                    }
                    await this.contactRepository.delete(contactId);
                    successCount++;
                    results.push({ contactId, success: true });
                }
                catch (error) {
                    errorCount++;
                    results.push({
                        contactId,
                        success: false,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    });
                }
            }
            const response = {
                success: errorCount === 0,
                data: {
                    total: requestData.contactIds.length,
                    successful: successCount,
                    failed: errorCount,
                    results
                },
                message: `Bulk delete completed: ${successCount} successful, ${errorCount} failed`,
                timestamp: new Date(),
                requestId: req.headers['x-request-id']
            };
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    calculateContactStats(contacts) {
        const stats = {
            total: contacts.length,
            byType: {},
            byStatus: {},
            bySource: {},
            byPriority: {},
            byDepartment: {},
            byIndustry: {},
            byProfession: {},
            active: 0,
            inactive: 0,
            primary: 0,
            decisionMakers: 0,
            influencers: 0,
            technical: 0,
            financial: 0,
            procurement: 0,
            verified: 0,
            unverified: 0,
            optedIn: 0,
            optedOut: 0,
            assigned: 0,
            unassigned: 0,
            withCompany: 0,
            withoutCompany: 0,
            overdueForFollowUp: 0,
            highScoreLeads: 0,
            mediumScoreLeads: 0,
            lowScoreLeads: 0,
            highlyEngaged: 0,
            moderatelyEngaged: 0,
            lowEngaged: 0,
            averageLeadScore: 0,
            averageEngagementScore: 0,
            totalRevenue: 0,
            averageRevenue: 0,
            totalSalary: 0,
            averageSalary: 0,
            totalExperience: 0,
            averageExperience: 0,
            totalInteractions: 0,
            averageInteractions: 0,
            totalEmailsSent: 0,
            totalEmailsOpened: 0,
            totalEmailsClicked: 0,
            totalCallsMade: 0,
            totalMeetingsScheduled: 0,
            totalMeetingsAttended: 0,
            totalDealsWon: 0,
            totalDealsLost: 0,
            averageEmailOpenRate: 0,
            averageEmailClickRate: 0,
            averageMeetingAttendanceRate: 0,
            averageDealWinRate: 0,
            contactsByYear: {},
            contactsByMonth: {},
            topDepartments: [],
            topIndustries: [],
            topProfessions: [],
            topSources: [],
            topAssignedUsers: [],
            topCompanies: [],
            contactsWithBirthdayToday: 0,
            contactsWithBirthdayThisWeek: 0,
            contactsWithBirthdayThisMonth: 0,
            contactsWithAnniversaryToday: 0,
            contactsWithAnniversaryThisWeek: 0,
            contactsWithAnniversaryThisMonth: 0
        };
        let totalLeadScore = 0;
        let leadScoreCount = 0;
        let totalEngagementScore = 0;
        let engagementScoreCount = 0;
        let totalRevenue = 0;
        let revenueCount = 0;
        let totalSalary = 0;
        let salaryCount = 0;
        let totalExperience = 0;
        let experienceCount = 0;
        let totalInteractions = 0;
        let totalEmailsSent = 0;
        let totalEmailsOpened = 0;
        let totalEmailsClicked = 0;
        let totalCallsMade = 0;
        let totalMeetingsScheduled = 0;
        let totalMeetingsAttended = 0;
        let totalDealsWon = 0;
        let totalDealsLost = 0;
        const today = new Date();
        const thisWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        const thisMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        for (const contact of contacts) {
            stats.byType[contact.type] = (stats.byType[contact.type] || 0) + 1;
            stats.byStatus[contact.status] = (stats.byStatus[contact.status] || 0) + 1;
            stats.bySource[contact.source] = (stats.bySource[contact.source] || 0) + 1;
            stats.byPriority[contact.priority] = (stats.byPriority[contact.priority] || 0) + 1;
            if (contact.department) {
                stats.byDepartment[contact.department] = (stats.byDepartment[contact.department] || 0) + 1;
            }
            if (contact.industry) {
                stats.byIndustry[contact.industry] = (stats.byIndustry[contact.industry] || 0) + 1;
            }
            if (contact.profession) {
                stats.byProfession[contact.profession] = (stats.byProfession[contact.profession] || 0) + 1;
            }
            if (contact.isActive) {
                stats.active++;
            }
            else {
                stats.inactive++;
            }
            if (contact.type === 'primary')
                stats.primary++;
            if (contact.type === 'decision_maker')
                stats.decisionMakers++;
            if (contact.type === 'influencer')
                stats.influencers++;
            if (contact.type === 'technical')
                stats.technical++;
            if (contact.type === 'financial')
                stats.financial++;
            if (contact.type === 'procurement')
                stats.procurement++;
            if (contact.isVerified) {
                stats.verified++;
            }
            else {
                stats.unverified++;
            }
            if (contact.isOptedIn) {
                stats.optedIn++;
            }
            else {
                stats.optedOut++;
            }
            if (contact.assignedUserId) {
                stats.assigned++;
            }
            else {
                stats.unassigned++;
            }
            if (contact.companyId) {
                stats.withCompany++;
            }
            else {
                stats.withoutCompany++;
            }
            if (contact.isOverdueForFollowUp) {
                stats.overdueForFollowUp++;
            }
            if (contact.leadScore !== null && contact.leadScore !== undefined) {
                totalLeadScore += contact.leadScore;
                leadScoreCount++;
                if (contact.leadScore >= 70)
                    stats.highScoreLeads++;
                else if (contact.leadScore >= 30)
                    stats.mediumScoreLeads++;
                else
                    stats.lowScoreLeads++;
            }
            if (contact.engagementScore !== null && contact.engagementScore !== undefined) {
                totalEngagementScore += contact.engagementScore;
                engagementScoreCount++;
                if (contact.engagementScore >= 70)
                    stats.highlyEngaged++;
                else if (contact.engagementScore >= 30)
                    stats.moderatelyEngaged++;
                else
                    stats.lowEngaged++;
            }
            if (contact.totalRevenue) {
                totalRevenue += contact.totalRevenue.amount;
                revenueCount++;
            }
            if (contact.salary) {
                totalSalary += contact.salary.amount;
                salaryCount++;
            }
            if (contact.experience !== null && contact.experience !== undefined) {
                totalExperience += contact.experience;
                experienceCount++;
            }
            totalInteractions += contact.totalInteractions || 0;
            totalEmailsSent += contact.totalEmailsSent || 0;
            totalEmailsOpened += contact.totalEmailsOpened || 0;
            totalEmailsClicked += contact.totalEmailsClicked || 0;
            totalCallsMade += contact.totalCallsMade || 0;
            totalMeetingsScheduled += contact.totalMeetingsScheduled || 0;
            totalMeetingsAttended += contact.totalMeetingsAttended || 0;
            totalDealsWon += contact.totalDealsWon || 0;
            totalDealsLost += contact.totalDealsLost || 0;
            const year = new Date(contact.createdAt).getFullYear().toString();
            stats.contactsByYear[year] = (stats.contactsByYear[year] || 0) + 1;
            const month = new Date(contact.createdAt).toISOString().substring(0, 7);
            stats.contactsByMonth[month] = (stats.contactsByMonth[month] || 0) + 1;
            if (contact.birthday) {
                const birthday = new Date(contact.birthday);
                if (this.isToday(birthday))
                    stats.contactsWithBirthdayToday++;
                if (this.isThisWeek(birthday))
                    stats.contactsWithBirthdayThisWeek++;
                if (this.isThisMonth(birthday))
                    stats.contactsWithBirthdayThisMonth++;
            }
            if (contact.anniversary) {
                const anniversary = new Date(contact.anniversary);
                if (this.isToday(anniversary))
                    stats.contactsWithAnniversaryToday++;
                if (this.isThisWeek(anniversary))
                    stats.contactsWithAnniversaryThisWeek++;
                if (this.isThisMonth(anniversary))
                    stats.contactsWithAnniversaryThisMonth++;
            }
        }
        stats.averageLeadScore = leadScoreCount > 0 ? totalLeadScore / leadScoreCount : 0;
        stats.averageEngagementScore = engagementScoreCount > 0 ? totalEngagementScore / engagementScoreCount : 0;
        stats.totalRevenue = totalRevenue;
        stats.averageRevenue = revenueCount > 0 ? totalRevenue / revenueCount : 0;
        stats.totalSalary = totalSalary;
        stats.averageSalary = salaryCount > 0 ? totalSalary / salaryCount : 0;
        stats.totalExperience = totalExperience;
        stats.averageExperience = experienceCount > 0 ? totalExperience / experienceCount : 0;
        stats.totalInteractions = totalInteractions;
        stats.averageInteractions = contacts.length > 0 ? totalInteractions / contacts.length : 0;
        stats.totalEmailsSent = totalEmailsSent;
        stats.totalEmailsOpened = totalEmailsOpened;
        stats.totalEmailsClicked = totalEmailsClicked;
        stats.totalCallsMade = totalCallsMade;
        stats.totalMeetingsScheduled = totalMeetingsScheduled;
        stats.totalMeetingsAttended = totalMeetingsAttended;
        stats.totalDealsWon = totalDealsWon;
        stats.totalDealsLost = totalDealsLost;
        stats.averageEmailOpenRate = totalEmailsSent > 0 ? (totalEmailsOpened / totalEmailsSent) * 100 : 0;
        stats.averageEmailClickRate = totalEmailsSent > 0 ? (totalEmailsClicked / totalEmailsSent) * 100 : 0;
        stats.averageMeetingAttendanceRate = totalMeetingsScheduled > 0 ? (totalMeetingsAttended / totalMeetingsScheduled) * 100 : 0;
        stats.averageDealWinRate = (totalDealsWon + totalDealsLost) > 0 ? (totalDealsWon / (totalDealsWon + totalDealsLost)) * 100 : 0;
        stats.topDepartments = Object.entries(stats.byDepartment)
            .map(([department, count]) => ({ department, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
        stats.topIndustries = Object.entries(stats.byIndustry)
            .map(([industry, count]) => ({ industry, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
        stats.topProfessions = Object.entries(stats.byProfession)
            .map(([profession, count]) => ({ profession, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
        stats.topSources = Object.entries(stats.bySource)
            .map(([source, count]) => ({ source, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
        const userCounts = {};
        for (const contact of contacts) {
            if (contact.assignedUserId) {
                userCounts[contact.assignedUserId] = (userCounts[contact.assignedUserId] || 0) + 1;
            }
        }
        stats.topAssignedUsers = Object.entries(userCounts)
            .map(([userId, count]) => ({ userId, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
        const companyCounts = {};
        for (const contact of contacts) {
            if (contact.companyId) {
                companyCounts[contact.companyId] = (companyCounts[contact.companyId] || 0) + 1;
            }
        }
        stats.topCompanies = Object.entries(companyCounts)
            .map(([companyId, count]) => ({ companyId, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
        return stats;
    }
    isToday(date) {
        const today = new Date();
        return date.getMonth() === today.getMonth() && date.getDate() === today.getDate();
    }
    isThisWeek(date) {
        const today = new Date();
        const weekStart = new Date(today.getTime() - today.getDay() * 24 * 60 * 60 * 1000);
        const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
        return date >= weekStart && date < weekEnd;
    }
    isThisMonth(date) {
        const today = new Date();
        return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
    }
}
//# sourceMappingURL=contact.controller.js.map