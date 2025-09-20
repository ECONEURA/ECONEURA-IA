import { createErrorResponse } from '../../../shared/utils/error.utils.js';
export class InteractionController {
    createInteractionUseCase;
    updateInteractionUseCase;
    interactionRepository;
    constructor(createInteractionUseCase, updateInteractionUseCase, interactionRepository) {
        this.createInteractionUseCase = createInteractionUseCase;
        this.updateInteractionUseCase = updateInteractionUseCase;
        this.interactionRepository = interactionRepository;
    }
    async createInteraction(req, res) {
        try {
            const organizationId = req.user?.organizationId;
            const userId = req.user?.id;
            if (!organizationId || !userId) {
                res.status(401).json(createErrorResponse(new Error('Unauthorized')));
                return;
            }
            const request = {
                ...req.body,
                organizationId,
                userId
            };
            const result = await this.createInteractionUseCase.execute(request);
            const response = {
                id: result.data.interaction.id,
                organizationId: result.data.interaction.organizationId,
                contactId: result.data.interaction.contactId,
                companyId: result.data.interaction.companyId,
                userId: result.data.interaction.userId,
                type: result.data.interaction.type,
                status: result.data.interaction.status,
                priority: result.data.interaction.priority,
                subject: result.data.interaction.subject,
                description: result.data.interaction.description,
                scheduledAt: result.data.interaction.scheduledAt,
                completedAt: result.data.interaction.completedAt,
                duration: result.data.interaction.duration,
                outcome: result.data.interaction.outcome,
                nextAction: result.data.interaction.nextAction,
                nextActionDate: result.data.interaction.nextActionDate,
                tags: result.data.interaction.tags,
                customFields: result.data.interaction.customFields,
                attachments: result.data.interaction.attachments,
                createdAt: result.data.interaction.createdAt,
                updatedAt: result.data.interaction.updatedAt
            };
            res.status(201).json({
                success: true,
                data: { interaction: response }
            });
        }
        catch (error) {
            res.status(400).json(createErrorResponse(error));
        }
    }
    async createScheduledInteraction(req, res) {
        try {
            const organizationId = req.user?.organizationId;
            const userId = req.user?.id;
            if (!organizationId || !userId) {
                res.status(401).json(createErrorResponse(new Error('Unauthorized')));
                return;
            }
            const result = await this.createInteractionUseCase.createScheduledInteraction(organizationId, req.body.contactId, userId, req.body.type, req.body.subject, req.body.scheduledAt, req.body.companyId);
            const response = {
                id: result.data.interaction.id,
                organizationId: result.data.interaction.organizationId,
                contactId: result.data.interaction.contactId,
                companyId: result.data.interaction.companyId,
                userId: result.data.interaction.userId,
                type: result.data.interaction.type,
                status: result.data.interaction.status,
                priority: result.data.interaction.priority,
                subject: result.data.interaction.subject,
                description: result.data.interaction.description,
                scheduledAt: result.data.interaction.scheduledAt,
                completedAt: result.data.interaction.completedAt,
                duration: result.data.interaction.duration,
                outcome: result.data.interaction.outcome,
                nextAction: result.data.interaction.nextAction,
                nextActionDate: result.data.interaction.nextActionDate,
                tags: result.data.interaction.tags,
                customFields: result.data.interaction.customFields,
                attachments: result.data.interaction.attachments,
                createdAt: result.data.interaction.createdAt,
                updatedAt: result.data.interaction.updatedAt
            };
            res.status(201).json({
                success: true,
                data: { interaction: response }
            });
        }
        catch (error) {
            res.status(400).json(createErrorResponse(error));
        }
    }
    async createTask(req, res) {
        try {
            const organizationId = req.user?.organizationId;
            const userId = req.user?.id;
            if (!organizationId || !userId) {
                res.status(401).json(createErrorResponse(new Error('Unauthorized')));
                return;
            }
            const result = await this.createInteractionUseCase.createTask(organizationId, req.body.contactId, userId, req.body.subject, req.body.description, req.body.priority, req.body.companyId);
            const response = {
                id: result.data.interaction.id,
                organizationId: result.data.interaction.organizationId,
                contactId: result.data.interaction.contactId,
                companyId: result.data.interaction.companyId,
                userId: result.data.interaction.userId,
                type: result.data.interaction.type,
                status: result.data.interaction.status,
                priority: result.data.interaction.priority,
                subject: result.data.interaction.subject,
                description: result.data.interaction.description,
                scheduledAt: result.data.interaction.scheduledAt,
                completedAt: result.data.interaction.completedAt,
                duration: result.data.interaction.duration,
                outcome: result.data.interaction.outcome,
                nextAction: result.data.interaction.nextAction,
                nextActionDate: result.data.interaction.nextActionDate,
                tags: result.data.interaction.tags,
                customFields: result.data.interaction.customFields,
                attachments: result.data.interaction.attachments,
                createdAt: result.data.interaction.createdAt,
                updatedAt: result.data.interaction.updatedAt
            };
            res.status(201).json({
                success: true,
                data: { interaction: response }
            });
        }
        catch (error) {
            res.status(400).json(createErrorResponse(error));
        }
    }
    async createNote(req, res) {
        try {
            const organizationId = req.user?.organizationId;
            const userId = req.user?.id;
            if (!organizationId || !userId) {
                res.status(401).json(createErrorResponse(new Error('Unauthorized')));
                return;
            }
            const result = await this.createInteractionUseCase.createNote(organizationId, req.body.contactId, userId, req.body.subject, req.body.description, req.body.companyId);
            const response = {
                id: result.data.interaction.id,
                organizationId: result.data.interaction.organizationId,
                contactId: result.data.interaction.contactId,
                companyId: result.data.interaction.companyId,
                userId: result.data.interaction.userId,
                type: result.data.interaction.type,
                status: result.data.interaction.status,
                priority: result.data.interaction.priority,
                subject: result.data.interaction.subject,
                description: result.data.interaction.description,
                scheduledAt: result.data.interaction.scheduledAt,
                completedAt: result.data.interaction.completedAt,
                duration: result.data.interaction.duration,
                outcome: result.data.interaction.outcome,
                nextAction: result.data.interaction.nextAction,
                nextActionDate: result.data.interaction.nextActionDate,
                tags: result.data.interaction.tags,
                customFields: result.data.interaction.customFields,
                attachments: result.data.interaction.attachments,
                createdAt: result.data.interaction.createdAt,
                updatedAt: result.data.interaction.updatedAt
            };
            res.status(201).json({
                success: true,
                data: { interaction: response }
            });
        }
        catch (error) {
            res.status(400).json(createErrorResponse(error));
        }
    }
    async createFollowUp(req, res) {
        try {
            const organizationId = req.user?.organizationId;
            const userId = req.user?.id;
            if (!organizationId || !userId) {
                res.status(401).json(createErrorResponse(new Error('Unauthorized')));
                return;
            }
            const result = await this.createInteractionUseCase.createFollowUp(organizationId, req.body.contactId, userId, req.body.subject, req.body.nextActionDate, req.body.companyId);
            const response = {
                id: result.data.interaction.id,
                organizationId: result.data.interaction.organizationId,
                contactId: result.data.interaction.contactId,
                companyId: result.data.interaction.companyId,
                userId: result.data.interaction.userId,
                type: result.data.interaction.type,
                status: result.data.interaction.status,
                priority: result.data.interaction.priority,
                subject: result.data.interaction.subject,
                description: result.data.interaction.description,
                scheduledAt: result.data.interaction.scheduledAt,
                completedAt: result.data.interaction.completedAt,
                duration: result.data.interaction.duration,
                outcome: result.data.interaction.outcome,
                nextAction: result.data.interaction.nextAction,
                nextActionDate: result.data.interaction.nextActionDate,
                tags: result.data.interaction.tags,
                customFields: result.data.interaction.customFields,
                attachments: result.data.interaction.attachments,
                createdAt: result.data.interaction.createdAt,
                updatedAt: result.data.interaction.updatedAt
            };
            res.status(201).json({
                success: true,
                data: { interaction: response }
            });
        }
        catch (error) {
            res.status(400).json(createErrorResponse(error));
        }
    }
    async updateInteraction(req, res) {
        try {
            const organizationId = req.user?.organizationId;
            const userId = req.user?.id;
            if (!organizationId || !userId) {
                res.status(401).json(createErrorResponse(new Error('Unauthorized')));
                return;
            }
            const request = {
                id: req.params.id,
                organizationId,
                userId,
                updates: req.body
            };
            const result = await this.updateInteractionUseCase.execute(request);
            const response = {
                id: result.data.interaction.id,
                organizationId: result.data.interaction.organizationId,
                contactId: result.data.interaction.contactId,
                companyId: result.data.interaction.companyId,
                userId: result.data.interaction.userId,
                type: result.data.interaction.type,
                status: result.data.interaction.status,
                priority: result.data.interaction.priority,
                subject: result.data.interaction.subject,
                description: result.data.interaction.description,
                scheduledAt: result.data.interaction.scheduledAt,
                completedAt: result.data.interaction.completedAt,
                duration: result.data.interaction.duration,
                outcome: result.data.interaction.outcome,
                nextAction: result.data.interaction.nextAction,
                nextActionDate: result.data.interaction.nextActionDate,
                tags: result.data.interaction.tags,
                customFields: result.data.interaction.customFields,
                attachments: result.data.interaction.attachments,
                createdAt: result.data.interaction.createdAt,
                updatedAt: result.data.interaction.updatedAt
            };
            res.status(200).json({
                success: true,
                data: { interaction: response }
            });
        }
        catch (error) {
            res.status(400).json(createErrorResponse(error));
        }
    }
    async getInteractionById(req, res) {
        try {
            const organizationId = req.user?.organizationId;
            if (!organizationId) {
                res.status(401).json(createErrorResponse(new Error('Unauthorized')));
                return;
            }
            const interaction = await this.interactionRepository.findById(req.params.id);
            if (!interaction) {
                res.status(404).json(createErrorResponse(new Error('Interaction not found')));
                return;
            }
            if (interaction.organizationId !== organizationId) {
                res.status(403).json(createErrorResponse(new Error('Forbidden')));
                return;
            }
            const response = {
                id: interaction.id,
                organizationId: interaction.organizationId,
                contactId: interaction.contactId,
                companyId: interaction.companyId,
                userId: interaction.userId,
                type: interaction.type,
                status: interaction.status,
                priority: interaction.priority,
                subject: interaction.subject,
                description: interaction.description,
                scheduledAt: interaction.scheduledAt,
                completedAt: interaction.completedAt,
                duration: interaction.duration,
                outcome: interaction.outcome,
                nextAction: interaction.nextAction,
                nextActionDate: interaction.nextActionDate,
                tags: interaction.tags,
                customFields: interaction.customFields,
                attachments: interaction.attachments,
                createdAt: interaction.createdAt,
                updatedAt: interaction.updatedAt
            };
            res.status(200).json({
                success: true,
                data: { interaction: response }
            });
        }
        catch (error) {
            res.status(400).json(createErrorResponse(error));
        }
    }
    async getInteractionsByOrganization(req, res) {
        try {
            const organizationId = req.user?.organizationId;
            if (!organizationId) {
                res.status(401).json(createErrorResponse(new Error('Unauthorized')));
                return;
            }
            const query = {
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 20,
                sortBy: req.query.sortBy || 'createdAt',
                sortOrder: req.query.sortOrder || 'desc',
                search: req.query.search,
                type: req.query.type,
                status: req.query.status,
                priority: req.query.priority,
                contactId: req.query.contactId,
                companyId: req.query.companyId,
                userId: req.query.userId,
                scheduledFrom: req.query.scheduledFrom ? new Date(req.query.scheduledFrom) : undefined,
                scheduledTo: req.query.scheduledTo ? new Date(req.query.scheduledTo) : undefined,
                completedFrom: req.query.completedFrom ? new Date(req.query.completedFrom) : undefined,
                completedTo: req.query.completedTo ? new Date(req.query.completedTo) : undefined,
                tags: req.query.tags,
                hasOutcome: req.query.hasOutcome ? req.query.hasOutcome === 'true' : undefined,
                hasNextAction: req.query.hasNextAction ? req.query.hasNextAction === 'true' : undefined,
                overdue: req.query.overdue ? req.query.overdue === 'true' : undefined,
                upcoming: req.query.upcoming ? req.query.upcoming === 'true' : undefined
            };
            const result = await this.interactionRepository.findByOrganizationId(organizationId, query);
            const response = {
                data: result.data.map(interaction => ({
                    id: interaction.id,
                    organizationId: interaction.organizationId,
                    contactId: interaction.contactId,
                    companyId: interaction.companyId,
                    userId: interaction.userId,
                    type: interaction.type,
                    status: interaction.status,
                    priority: interaction.priority,
                    subject: interaction.subject,
                    description: interaction.description,
                    scheduledAt: interaction.scheduledAt,
                    completedAt: interaction.completedAt,
                    duration: interaction.duration,
                    outcome: interaction.outcome,
                    nextAction: interaction.nextAction,
                    nextActionDate: interaction.nextActionDate,
                    tags: interaction.tags,
                    customFields: interaction.customFields,
                    attachments: interaction.attachments,
                    createdAt: interaction.createdAt,
                    updatedAt: interaction.updatedAt
                })),
                pagination: result.pagination
            };
            res.status(200).json({
                success: true,
                data: response
            });
        }
        catch (error) {
            res.status(400).json(createErrorResponse(error));
        }
    }
    async getInteractionsByContact(req, res) {
        try {
            const organizationId = req.user?.organizationId;
            if (!organizationId) {
                res.status(401).json(createErrorResponse(new Error('Unauthorized')));
                return;
            }
            const query = {
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 20,
                sortBy: req.query.sortBy || 'createdAt',
                sortOrder: req.query.sortOrder || 'desc'
            };
            const result = await this.interactionRepository.findByContactId(req.params.contactId, query);
            const response = {
                data: result.data.map(interaction => ({
                    id: interaction.id,
                    organizationId: interaction.organizationId,
                    contactId: interaction.contactId,
                    companyId: interaction.companyId,
                    userId: interaction.userId,
                    type: interaction.type,
                    status: interaction.status,
                    priority: interaction.priority,
                    subject: interaction.subject,
                    description: interaction.description,
                    scheduledAt: interaction.scheduledAt,
                    completedAt: interaction.completedAt,
                    duration: interaction.duration,
                    outcome: interaction.outcome,
                    nextAction: interaction.nextAction,
                    nextActionDate: interaction.nextActionDate,
                    tags: interaction.tags,
                    customFields: interaction.customFields,
                    attachments: interaction.attachments,
                    createdAt: interaction.createdAt,
                    updatedAt: interaction.updatedAt
                })),
                pagination: result.pagination
            };
            res.status(200).json({
                success: true,
                data: response
            });
        }
        catch (error) {
            res.status(400).json(createErrorResponse(error));
        }
    }
    async getInteractionsByCompany(req, res) {
        try {
            const organizationId = req.user?.organizationId;
            if (!organizationId) {
                res.status(401).json(createErrorResponse(new Error('Unauthorized')));
                return;
            }
            const query = {
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 20,
                sortBy: req.query.sortBy || 'createdAt',
                sortOrder: req.query.sortOrder || 'desc'
            };
            const result = await this.interactionRepository.findByCompanyId(req.params.companyId, query);
            const response = {
                data: result.data.map(interaction => ({
                    id: interaction.id,
                    organizationId: interaction.organizationId,
                    contactId: interaction.contactId,
                    companyId: interaction.companyId,
                    userId: interaction.userId,
                    type: interaction.type,
                    status: interaction.status,
                    priority: interaction.priority,
                    subject: interaction.subject,
                    description: interaction.description,
                    scheduledAt: interaction.scheduledAt,
                    completedAt: interaction.completedAt,
                    duration: interaction.duration,
                    outcome: interaction.outcome,
                    nextAction: interaction.nextAction,
                    nextActionDate: interaction.nextActionDate,
                    tags: interaction.tags,
                    customFields: interaction.customFields,
                    attachments: interaction.attachments,
                    createdAt: interaction.createdAt,
                    updatedAt: interaction.updatedAt
                })),
                pagination: result.pagination
            };
            res.status(200).json({
                success: true,
                data: response
            });
        }
        catch (error) {
            res.status(400).json(createErrorResponse(error));
        }
    }
    async getInteractionStats(req, res) {
        try {
            const organizationId = req.user?.organizationId;
            if (!organizationId) {
                res.status(401).json(createErrorResponse(new Error('Unauthorized')));
                return;
            }
            const filters = {
                type: req.query.type,
                status: req.query.status,
                priority: req.query.priority,
                contactId: req.query.contactId,
                companyId: req.query.companyId,
                userId: req.query.userId,
                scheduledFrom: req.query.scheduledFrom ? new Date(req.query.scheduledFrom) : undefined,
                scheduledTo: req.query.scheduledTo ? new Date(req.query.scheduledTo) : undefined,
                completedFrom: req.query.completedFrom ? new Date(req.query.completedFrom) : undefined,
                completedTo: req.query.completedTo ? new Date(req.query.completedTo) : undefined,
                tags: req.query.tags,
                hasOutcome: req.query.hasOutcome ? req.query.hasOutcome === 'true' : undefined,
                hasNextAction: req.query.hasNextAction ? req.query.hasNextAction === 'true' : undefined,
                overdue: req.query.overdue ? req.query.overdue === 'true' : undefined,
                upcoming: req.query.upcoming ? req.query.upcoming === 'true' : undefined
            };
            const stats = await this.interactionRepository.getStats(organizationId, filters);
            const response = {
                total: stats.total,
                byType: stats.byType,
                byStatus: stats.byStatus,
                byPriority: stats.byPriority,
                completed: stats.completed,
                pending: stats.pending,
                overdue: stats.overdue,
                upcoming: stats.upcoming,
                averageDuration: stats.averageDuration,
                completionRate: stats.completionRate
            };
            res.status(200).json({
                success: true,
                data: { stats: response }
            });
        }
        catch (error) {
            res.status(400).json(createErrorResponse(error));
        }
    }
    async getDashboardData(req, res) {
        try {
            const organizationId = req.user?.organizationId;
            const userId = req.user?.id;
            if (!organizationId) {
                res.status(401).json(createErrorResponse(new Error('Unauthorized')));
                return;
            }
            const dashboardData = await this.interactionRepository.getDashboardData(organizationId, userId);
            const response = {
                todayTasks: dashboardData.todayTasks,
                overdueTasks: dashboardData.overdueTasks,
                upcomingTasks: dashboardData.upcomingTasks,
                completedToday: dashboardData.completedToday,
                recentInteractions: dashboardData.recentInteractions.map(interaction => ({
                    id: interaction.id,
                    organizationId: interaction.organizationId,
                    contactId: interaction.contactId,
                    companyId: interaction.companyId,
                    userId: interaction.userId,
                    type: interaction.type,
                    status: interaction.status,
                    priority: interaction.priority,
                    subject: interaction.subject,
                    description: interaction.description,
                    scheduledAt: interaction.scheduledAt,
                    completedAt: interaction.completedAt,
                    duration: interaction.duration,
                    outcome: interaction.outcome,
                    nextAction: interaction.nextAction,
                    nextActionDate: interaction.nextActionDate,
                    tags: interaction.tags,
                    customFields: interaction.customFields,
                    attachments: interaction.attachments,
                    createdAt: interaction.createdAt,
                    updatedAt: interaction.updatedAt
                })),
                upcomingInteractions: dashboardData.upcomingInteractions.map(interaction => ({
                    id: interaction.id,
                    organizationId: interaction.organizationId,
                    contactId: interaction.contactId,
                    companyId: interaction.companyId,
                    userId: interaction.userId,
                    type: interaction.type,
                    status: interaction.status,
                    priority: interaction.priority,
                    subject: interaction.subject,
                    description: interaction.description,
                    scheduledAt: interaction.scheduledAt,
                    completedAt: interaction.completedAt,
                    duration: interaction.duration,
                    outcome: interaction.outcome,
                    nextAction: interaction.nextAction,
                    nextActionDate: interaction.nextActionDate,
                    tags: interaction.tags,
                    customFields: interaction.customFields,
                    attachments: interaction.attachments,
                    createdAt: interaction.createdAt,
                    updatedAt: interaction.updatedAt
                })),
                overdueInteractions: dashboardData.overdueInteractions.map(interaction => ({
                    id: interaction.id,
                    organizationId: interaction.organizationId,
                    contactId: interaction.contactId,
                    companyId: interaction.companyId,
                    userId: interaction.userId,
                    type: interaction.type,
                    status: interaction.status,
                    priority: interaction.priority,
                    subject: interaction.subject,
                    description: interaction.description,
                    scheduledAt: interaction.scheduledAt,
                    completedAt: interaction.completedAt,
                    duration: interaction.duration,
                    outcome: interaction.outcome,
                    nextAction: interaction.nextAction,
                    nextActionDate: interaction.nextActionDate,
                    tags: interaction.tags,
                    customFields: interaction.customFields,
                    attachments: interaction.attachments,
                    createdAt: interaction.createdAt,
                    updatedAt: interaction.updatedAt
                }))
            };
            res.status(200).json({
                success: true,
                data: { dashboard: response }
            });
        }
        catch (error) {
            res.status(400).json(createErrorResponse(error));
        }
    }
    async deleteInteraction(req, res) {
        try {
            const organizationId = req.user?.organizationId;
            if (!organizationId) {
                res.status(401).json(createErrorResponse(new Error('Unauthorized')));
                return;
            }
            const interaction = await this.interactionRepository.findById(req.params.id);
            if (!interaction) {
                res.status(404).json(createErrorResponse(new Error('Interaction not found')));
                return;
            }
            if (interaction.organizationId !== organizationId) {
                res.status(403).json(createErrorResponse(new Error('Forbidden')));
                return;
            }
            await this.interactionRepository.delete(req.params.id);
            res.status(204).send();
        }
        catch (error) {
            res.status(400).json(createErrorResponse(error));
        }
    }
}
//# sourceMappingURL=interaction.controller.js.map