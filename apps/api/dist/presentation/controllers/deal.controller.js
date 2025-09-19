import { createErrorResponse } from '../../../shared/utils/error.utils.js';
export class DealController {
    createDealUseCase;
    updateDealUseCase;
    dealRepository;
    constructor(createDealUseCase, updateDealUseCase, dealRepository) {
        this.createDealUseCase = createDealUseCase;
        this.updateDealUseCase = updateDealUseCase;
        this.dealRepository = dealRepository;
    }
    async createDeal(req, res) {
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
            const result = await this.createDealUseCase.execute(request);
            const response = {
                id: result.data.deal.id,
                organizationId: result.data.deal.organizationId,
                contactId: result.data.deal.contactId,
                companyId: result.data.deal.companyId,
                userId: result.data.deal.userId,
                name: result.data.deal.name,
                description: result.data.deal.description,
                stage: result.data.deal.stage,
                status: result.data.deal.status,
                priority: result.data.deal.priority,
                source: result.data.deal.source,
                value: result.data.deal.value,
                currency: result.data.deal.currency,
                probability: result.data.deal.probability,
                expectedCloseDate: result.data.deal.expectedCloseDate,
                actualCloseDate: result.data.deal.actualCloseDate,
                nextStep: result.data.deal.nextStep,
                nextStepDate: result.data.deal.nextStepDate,
                tags: result.data.deal.tags,
                customFields: result.data.deal.customFields,
                attachments: result.data.deal.attachments,
                notes: result.data.deal.notes,
                competitors: result.data.deal.competitors,
                decisionMakers: result.data.deal.decisionMakers,
                budget: result.data.deal.budget,
                timeline: result.data.deal.timeline,
                requirements: result.data.deal.requirements,
                objections: result.data.deal.objections,
                createdAt: result.data.deal.createdAt,
                updatedAt: result.data.deal.updatedAt
            };
            res.status(201).json({
                success: true,
                data: { deal: response }
            });
        }
        catch (error) {
            res.status(400).json(createErrorResponse(error));
        }
    }
    async createLead(req, res) {
        try {
            const organizationId = req.user?.organizationId;
            const userId = req.user?.id;
            if (!organizationId || !userId) {
                res.status(401).json(createErrorResponse(new Error('Unauthorized')));
                return;
            }
            const result = await this.createDealUseCase.createLead(organizationId, req.body.contactId, userId, req.body.name, req.body.value, req.body.currency, req.body.source, req.body.companyId);
            const response = {
                id: result.data.deal.id,
                organizationId: result.data.deal.organizationId,
                contactId: result.data.deal.contactId,
                companyId: result.data.deal.companyId,
                userId: result.data.deal.userId,
                name: result.data.deal.name,
                description: result.data.deal.description,
                stage: result.data.deal.stage,
                status: result.data.deal.status,
                priority: result.data.deal.priority,
                source: result.data.deal.source,
                value: result.data.deal.value,
                currency: result.data.deal.currency,
                probability: result.data.deal.probability,
                expectedCloseDate: result.data.deal.expectedCloseDate,
                actualCloseDate: result.data.deal.actualCloseDate,
                nextStep: result.data.deal.nextStep,
                nextStepDate: result.data.deal.nextStepDate,
                tags: result.data.deal.tags,
                customFields: result.data.deal.customFields,
                attachments: result.data.deal.attachments,
                notes: result.data.deal.notes,
                competitors: result.data.deal.competitors,
                decisionMakers: result.data.deal.decisionMakers,
                budget: result.data.deal.budget,
                timeline: result.data.deal.timeline,
                requirements: result.data.deal.requirements,
                objections: result.data.deal.objections,
                createdAt: result.data.deal.createdAt,
                updatedAt: result.data.deal.updatedAt
            };
            res.status(201).json({
                success: true,
                data: { deal: response }
            });
        }
        catch (error) {
            res.status(400).json(createErrorResponse(error));
        }
    }
    async createQualified(req, res) {
        try {
            const organizationId = req.user?.organizationId;
            const userId = req.user?.id;
            if (!organizationId || !userId) {
                res.status(401).json(createErrorResponse(new Error('Unauthorized')));
                return;
            }
            const result = await this.createDealUseCase.createQualified(organizationId, req.body.contactId, userId, req.body.name, req.body.value, req.body.currency, req.body.source, req.body.companyId);
            const response = {
                id: result.data.deal.id,
                organizationId: result.data.deal.organizationId,
                contactId: result.data.deal.contactId,
                companyId: result.data.deal.companyId,
                userId: result.data.deal.userId,
                name: result.data.deal.name,
                description: result.data.deal.description,
                stage: result.data.deal.stage,
                status: result.data.deal.status,
                priority: result.data.deal.priority,
                source: result.data.deal.source,
                value: result.data.deal.value,
                currency: result.data.deal.currency,
                probability: result.data.deal.probability,
                expectedCloseDate: result.data.deal.expectedCloseDate,
                actualCloseDate: result.data.deal.actualCloseDate,
                nextStep: result.data.deal.nextStep,
                nextStepDate: result.data.deal.nextStepDate,
                tags: result.data.deal.tags,
                customFields: result.data.deal.customFields,
                attachments: result.data.deal.attachments,
                notes: result.data.deal.notes,
                competitors: result.data.deal.competitors,
                decisionMakers: result.data.deal.decisionMakers,
                budget: result.data.deal.budget,
                timeline: result.data.deal.timeline,
                requirements: result.data.deal.requirements,
                objections: result.data.deal.objections,
                createdAt: result.data.deal.createdAt,
                updatedAt: result.data.deal.updatedAt
            };
            res.status(201).json({
                success: true,
                data: { deal: response }
            });
        }
        catch (error) {
            res.status(400).json(createErrorResponse(error));
        }
    }
    async createProposal(req, res) {
        try {
            const organizationId = req.user?.organizationId;
            const userId = req.user?.id;
            if (!organizationId || !userId) {
                res.status(401).json(createErrorResponse(new Error('Unauthorized')));
                return;
            }
            const result = await this.createDealUseCase.createProposal(organizationId, req.body.contactId, userId, req.body.name, req.body.value, req.body.currency, req.body.source, req.body.companyId);
            const response = {
                id: result.data.deal.id,
                organizationId: result.data.deal.organizationId,
                contactId: result.data.deal.contactId,
                companyId: result.data.deal.companyId,
                userId: result.data.deal.userId,
                name: result.data.deal.name,
                description: result.data.deal.description,
                stage: result.data.deal.stage,
                status: result.data.deal.status,
                priority: result.data.deal.priority,
                source: result.data.deal.source,
                value: result.data.deal.value,
                currency: result.data.deal.currency,
                probability: result.data.deal.probability,
                expectedCloseDate: result.data.deal.expectedCloseDate,
                actualCloseDate: result.data.deal.actualCloseDate,
                nextStep: result.data.deal.nextStep,
                nextStepDate: result.data.deal.nextStepDate,
                tags: result.data.deal.tags,
                customFields: result.data.deal.customFields,
                attachments: result.data.deal.attachments,
                notes: result.data.deal.notes,
                competitors: result.data.deal.competitors,
                decisionMakers: result.data.deal.decisionMakers,
                budget: result.data.deal.budget,
                timeline: result.data.deal.timeline,
                requirements: result.data.deal.requirements,
                objections: result.data.deal.objections,
                createdAt: result.data.deal.createdAt,
                updatedAt: result.data.deal.updatedAt
            };
            res.status(201).json({
                success: true,
                data: { deal: response }
            });
        }
        catch (error) {
            res.status(400).json(createErrorResponse(error));
        }
    }
    async createNegotiation(req, res) {
        try {
            const organizationId = req.user?.organizationId;
            const userId = req.user?.id;
            if (!organizationId || !userId) {
                res.status(401).json(createErrorResponse(new Error('Unauthorized')));
                return;
            }
            const result = await this.createDealUseCase.createNegotiation(organizationId, req.body.contactId, userId, req.body.name, req.body.value, req.body.currency, req.body.source, req.body.companyId);
            const response = {
                id: result.data.deal.id,
                organizationId: result.data.deal.organizationId,
                contactId: result.data.deal.contactId,
                companyId: result.data.deal.companyId,
                userId: result.data.deal.userId,
                name: result.data.deal.name,
                description: result.data.deal.description,
                stage: result.data.deal.stage,
                status: result.data.deal.status,
                priority: result.data.deal.priority,
                source: result.data.deal.source,
                value: result.data.deal.value,
                currency: result.data.deal.currency,
                probability: result.data.deal.probability,
                expectedCloseDate: result.data.deal.expectedCloseDate,
                actualCloseDate: result.data.deal.actualCloseDate,
                nextStep: result.data.deal.nextStep,
                nextStepDate: result.data.deal.nextStepDate,
                tags: result.data.deal.tags,
                customFields: result.data.deal.customFields,
                attachments: result.data.deal.attachments,
                notes: result.data.deal.notes,
                competitors: result.data.deal.competitors,
                decisionMakers: result.data.deal.decisionMakers,
                budget: result.data.deal.budget,
                timeline: result.data.deal.timeline,
                requirements: result.data.deal.requirements,
                objections: result.data.deal.objections,
                createdAt: result.data.deal.createdAt,
                updatedAt: result.data.deal.updatedAt
            };
            res.status(201).json({
                success: true,
                data: { deal: response }
            });
        }
        catch (error) {
            res.status(400).json(createErrorResponse(error));
        }
    }
    async updateDeal(req, res) {
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
            const result = await this.updateDealUseCase.execute(request);
            const response = {
                id: result.data.deal.id,
                organizationId: result.data.deal.organizationId,
                contactId: result.data.deal.contactId,
                companyId: result.data.deal.companyId,
                userId: result.data.deal.userId,
                name: result.data.deal.name,
                description: result.data.deal.description,
                stage: result.data.deal.stage,
                status: result.data.deal.status,
                priority: result.data.deal.priority,
                source: result.data.deal.source,
                value: result.data.deal.value,
                currency: result.data.deal.currency,
                probability: result.data.deal.probability,
                expectedCloseDate: result.data.deal.expectedCloseDate,
                actualCloseDate: result.data.deal.actualCloseDate,
                nextStep: result.data.deal.nextStep,
                nextStepDate: result.data.deal.nextStepDate,
                tags: result.data.deal.tags,
                customFields: result.data.deal.customFields,
                attachments: result.data.deal.attachments,
                notes: result.data.deal.notes,
                competitors: result.data.deal.competitors,
                decisionMakers: result.data.deal.decisionMakers,
                budget: result.data.deal.budget,
                timeline: result.data.deal.timeline,
                requirements: result.data.deal.requirements,
                objections: result.data.deal.objections,
                createdAt: result.data.deal.createdAt,
                updatedAt: result.data.deal.updatedAt
            };
            res.status(200).json({
                success: true,
                data: { deal: response }
            });
        }
        catch (error) {
            res.status(400).json(createErrorResponse(error));
        }
    }
    async getDealById(req, res) {
        try {
            const organizationId = req.user?.organizationId;
            if (!organizationId) {
                res.status(401).json(createErrorResponse(new Error('Unauthorized')));
                return;
            }
            const deal = await this.dealRepository.findById(req.params.id);
            if (!deal) {
                res.status(404).json(createErrorResponse(new Error('Deal not found')));
                return;
            }
            if (deal.organizationId !== organizationId) {
                res.status(403).json(createErrorResponse(new Error('Forbidden')));
                return;
            }
            const response = {
                id: deal.id,
                organizationId: deal.organizationId,
                contactId: deal.contactId,
                companyId: deal.companyId,
                userId: deal.userId,
                name: deal.name,
                description: deal.description,
                stage: deal.stage,
                status: deal.status,
                priority: deal.priority,
                source: deal.source,
                value: deal.value,
                currency: deal.currency,
                probability: deal.probability,
                expectedCloseDate: deal.expectedCloseDate,
                actualCloseDate: deal.actualCloseDate,
                nextStep: deal.nextStep,
                nextStepDate: deal.nextStepDate,
                tags: deal.tags,
                customFields: deal.customFields,
                attachments: deal.attachments,
                notes: deal.notes,
                competitors: deal.competitors,
                decisionMakers: deal.decisionMakers,
                budget: deal.budget,
                timeline: deal.timeline,
                requirements: deal.requirements,
                objections: deal.objections,
                createdAt: deal.createdAt,
                updatedAt: deal.updatedAt
            };
            res.status(200).json({
                success: true,
                data: { deal: response }
            });
        }
        catch (error) {
            res.status(400).json(createErrorResponse(error));
        }
    }
    async getDealsByOrganization(req, res) {
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
                stage: req.query.stage,
                status: req.query.status,
                priority: req.query.priority,
                source: req.query.source,
                contactId: req.query.contactId,
                companyId: req.query.companyId,
                userId: req.query.userId,
                valueFrom: req.query.valueFrom ? parseFloat(req.query.valueFrom) : undefined,
                valueTo: req.query.valueTo ? parseFloat(req.query.valueTo) : undefined,
                probabilityFrom: req.query.probabilityFrom ? parseInt(req.query.probabilityFrom) : undefined,
                probabilityTo: req.query.probabilityTo ? parseInt(req.query.probabilityTo) : undefined,
                expectedCloseFrom: req.query.expectedCloseFrom ? new Date(req.query.expectedCloseFrom) : undefined,
                expectedCloseTo: req.query.expectedCloseTo ? new Date(req.query.expectedCloseTo) : undefined,
                actualCloseFrom: req.query.actualCloseFrom ? new Date(req.query.actualCloseFrom) : undefined,
                actualCloseTo: req.query.actualCloseTo ? new Date(req.query.actualCloseTo) : undefined,
                tags: req.query.tags,
                hasNextStep: req.query.hasNextStep ? req.query.hasNextStep === 'true' : undefined,
                overdue: req.query.overdue ? req.query.overdue === 'true' : undefined,
                won: req.query.won ? req.query.won === 'true' : undefined,
                lost: req.query.lost ? req.query.lost === 'true' : undefined,
                active: req.query.active ? req.query.active === 'true' : undefined
            };
            const result = await this.dealRepository.findByOrganizationId(organizationId, query);
            const response = {
                data: result.data.map(deal => ({
                    id: deal.id,
                    organizationId: deal.organizationId,
                    contactId: deal.contactId,
                    companyId: deal.companyId,
                    userId: deal.userId,
                    name: deal.name,
                    description: deal.description,
                    stage: deal.stage,
                    status: deal.status,
                    priority: deal.priority,
                    source: deal.source,
                    value: deal.value,
                    currency: deal.currency,
                    probability: deal.probability,
                    expectedCloseDate: deal.expectedCloseDate,
                    actualCloseDate: deal.actualCloseDate,
                    nextStep: deal.nextStep,
                    nextStepDate: deal.nextStepDate,
                    tags: deal.tags,
                    customFields: deal.customFields,
                    attachments: deal.attachments,
                    notes: deal.notes,
                    competitors: deal.competitors,
                    decisionMakers: deal.decisionMakers,
                    budget: deal.budget,
                    timeline: deal.timeline,
                    requirements: deal.requirements,
                    objections: deal.objections,
                    createdAt: deal.createdAt,
                    updatedAt: deal.updatedAt
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
    async getDealsByContact(req, res) {
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
            const result = await this.dealRepository.findByContactId(req.params.contactId, query);
            const response = {
                data: result.data.map(deal => ({
                    id: deal.id,
                    organizationId: deal.organizationId,
                    contactId: deal.contactId,
                    companyId: deal.companyId,
                    userId: deal.userId,
                    name: deal.name,
                    description: deal.description,
                    stage: deal.stage,
                    status: deal.status,
                    priority: deal.priority,
                    source: deal.source,
                    value: deal.value,
                    currency: deal.currency,
                    probability: deal.probability,
                    expectedCloseDate: deal.expectedCloseDate,
                    actualCloseDate: deal.actualCloseDate,
                    nextStep: deal.nextStep,
                    nextStepDate: deal.nextStepDate,
                    tags: deal.tags,
                    customFields: deal.customFields,
                    attachments: deal.attachments,
                    notes: deal.notes,
                    competitors: deal.competitors,
                    decisionMakers: deal.decisionMakers,
                    budget: deal.budget,
                    timeline: deal.timeline,
                    requirements: deal.requirements,
                    objections: deal.objections,
                    createdAt: deal.createdAt,
                    updatedAt: deal.updatedAt
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
    async getDealsByCompany(req, res) {
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
            const result = await this.dealRepository.findByCompanyId(req.params.companyId, query);
            const response = {
                data: result.data.map(deal => ({
                    id: deal.id,
                    organizationId: deal.organizationId,
                    contactId: deal.contactId,
                    companyId: deal.companyId,
                    userId: deal.userId,
                    name: deal.name,
                    description: deal.description,
                    stage: deal.stage,
                    status: deal.status,
                    priority: deal.priority,
                    source: deal.source,
                    value: deal.value,
                    currency: deal.currency,
                    probability: deal.probability,
                    expectedCloseDate: deal.expectedCloseDate,
                    actualCloseDate: deal.actualCloseDate,
                    nextStep: deal.nextStep,
                    nextStepDate: deal.nextStepDate,
                    tags: deal.tags,
                    customFields: deal.customFields,
                    attachments: deal.attachments,
                    notes: deal.notes,
                    competitors: deal.competitors,
                    decisionMakers: deal.decisionMakers,
                    budget: deal.budget,
                    timeline: deal.timeline,
                    requirements: deal.requirements,
                    objections: deal.objections,
                    createdAt: deal.createdAt,
                    updatedAt: deal.updatedAt
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
    async getDealStats(req, res) {
        try {
            const organizationId = req.user?.organizationId;
            if (!organizationId) {
                res.status(401).json(createErrorResponse(new Error('Unauthorized')));
                return;
            }
            const filters = {
                stage: req.query.stage,
                status: req.query.status,
                priority: req.query.priority,
                source: req.query.source,
                contactId: req.query.contactId,
                companyId: req.query.companyId,
                userId: req.query.userId,
                valueFrom: req.query.valueFrom ? parseFloat(req.query.valueFrom) : undefined,
                valueTo: req.query.valueTo ? parseFloat(req.query.valueTo) : undefined,
                probabilityFrom: req.query.probabilityFrom ? parseInt(req.query.probabilityFrom) : undefined,
                probabilityTo: req.query.probabilityTo ? parseInt(req.query.probabilityTo) : undefined,
                expectedCloseFrom: req.query.expectedCloseFrom ? new Date(req.query.expectedCloseFrom) : undefined,
                expectedCloseTo: req.query.expectedCloseTo ? new Date(req.query.expectedCloseTo) : undefined,
                actualCloseFrom: req.query.actualCloseFrom ? new Date(req.query.actualCloseFrom) : undefined,
                actualCloseTo: req.query.actualCloseTo ? new Date(req.query.actualCloseTo) : undefined,
                tags: req.query.tags,
                hasNextStep: req.query.hasNextStep ? req.query.hasNextStep === 'true' : undefined,
                overdue: req.query.overdue ? req.query.overdue === 'true' : undefined,
                won: req.query.won ? req.query.won === 'true' : undefined,
                lost: req.query.lost ? req.query.lost === 'true' : undefined,
                active: req.query.active ? req.query.active === 'true' : undefined
            };
            const stats = await this.dealRepository.getStats(organizationId, filters);
            const response = {
                total: stats.total,
                byStage: stats.byStage,
                byStatus: stats.byStatus,
                byPriority: stats.byPriority,
                bySource: stats.bySource,
                totalValue: stats.totalValue,
                weightedValue: stats.weightedValue,
                wonValue: stats.wonValue,
                lostValue: stats.lostValue,
                activeValue: stats.activeValue,
                averageDealSize: stats.averageDealSize,
                averageSalesCycle: stats.averageSalesCycle,
                winRate: stats.winRate,
                conversionRate: stats.conversionRate,
                overdueCount: stats.overdueCount,
                expectedThisMonth: stats.expectedThisMonth,
                expectedThisQuarter: stats.expectedThisQuarter
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
    async getPipelineData(req, res) {
        try {
            const organizationId = req.user?.organizationId;
            const userId = req.user?.id;
            if (!organizationId) {
                res.status(401).json(createErrorResponse(new Error('Unauthorized')));
                return;
            }
            const pipelineData = await this.dealRepository.getPipelineData(organizationId, userId);
            const response = {
                byStage: pipelineData.byStage,
                totalValue: pipelineData.totalValue,
                totalWeightedValue: pipelineData.totalWeightedValue,
                averageDealSize: pipelineData.averageDealSize,
                averageSalesCycle: pipelineData.averageSalesCycle
            };
            res.status(200).json({
                success: true,
                data: { pipeline: response }
            });
        }
        catch (error) {
            res.status(400).json(createErrorResponse(error));
        }
    }
    async getSalesForecast(req, res) {
        try {
            const organizationId = req.user?.organizationId;
            const userId = req.user?.id;
            if (!organizationId) {
                res.status(401).json(createErrorResponse(new Error('Unauthorized')));
                return;
            }
            const months = req.query.months ? parseInt(req.query.months) : 12;
            const salesForecast = await this.dealRepository.getSalesForecast(organizationId, userId, months);
            const response = {
                monthly: salesForecast.monthly,
                quarterly: salesForecast.quarterly,
                yearly: salesForecast.yearly
            };
            res.status(200).json({
                success: true,
                data: { forecast: response }
            });
        }
        catch (error) {
            res.status(400).json(createErrorResponse(error));
        }
    }
    async getConversionRates(req, res) {
        try {
            const organizationId = req.user?.organizationId;
            const userId = req.user?.id;
            if (!organizationId) {
                res.status(401).json(createErrorResponse(new Error('Unauthorized')));
                return;
            }
            const from = req.query.from ? new Date(req.query.from) : undefined;
            const to = req.query.to ? new Date(req.query.to) : undefined;
            const conversionRates = await this.dealRepository.getConversionRates(organizationId, userId, from, to);
            const response = {
                byStage: conversionRates.byStage,
                overall: conversionRates.overall
            };
            res.status(200).json({
                success: true,
                data: { conversionRates: response }
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
            const dashboardData = await this.dealRepository.getDashboardData(organizationId, userId);
            const response = {
                totalDeals: dashboardData.totalDeals,
                activeDeals: dashboardData.activeDeals,
                wonDeals: dashboardData.wonDeals,
                lostDeals: dashboardData.lostDeals,
                overdueDeals: dashboardData.overdueDeals,
                expectedThisMonth: dashboardData.expectedThisMonth,
                totalValue: dashboardData.totalValue,
                weightedValue: dashboardData.weightedValue,
                recentDeals: dashboardData.recentDeals.map(deal => ({
                    id: deal.id,
                    organizationId: deal.organizationId,
                    contactId: deal.contactId,
                    companyId: deal.companyId,
                    userId: deal.userId,
                    name: deal.name,
                    description: deal.description,
                    stage: deal.stage,
                    status: deal.status,
                    priority: deal.priority,
                    source: deal.source,
                    value: deal.value,
                    currency: deal.currency,
                    probability: deal.probability,
                    expectedCloseDate: deal.expectedCloseDate,
                    actualCloseDate: deal.actualCloseDate,
                    nextStep: deal.nextStep,
                    nextStepDate: deal.nextStepDate,
                    tags: deal.tags,
                    customFields: deal.customFields,
                    attachments: deal.attachments,
                    notes: deal.notes,
                    competitors: deal.competitors,
                    decisionMakers: deal.decisionMakers,
                    budget: deal.budget,
                    timeline: deal.timeline,
                    requirements: deal.requirements,
                    objections: deal.objections,
                    createdAt: deal.createdAt,
                    updatedAt: deal.updatedAt
                })),
                upcomingDeals: dashboardData.upcomingDeals.map(deal => ({
                    id: deal.id,
                    organizationId: deal.organizationId,
                    contactId: deal.contactId,
                    companyId: deal.companyId,
                    userId: deal.userId,
                    name: deal.name,
                    description: deal.description,
                    stage: deal.stage,
                    status: deal.status,
                    priority: deal.priority,
                    source: deal.source,
                    value: deal.value,
                    currency: deal.currency,
                    probability: deal.probability,
                    expectedCloseDate: deal.expectedCloseDate,
                    actualCloseDate: deal.actualCloseDate,
                    nextStep: deal.nextStep,
                    nextStepDate: deal.nextStepDate,
                    tags: deal.tags,
                    customFields: deal.customFields,
                    attachments: deal.attachments,
                    notes: deal.notes,
                    competitors: deal.competitors,
                    decisionMakers: deal.decisionMakers,
                    budget: deal.budget,
                    timeline: deal.timeline,
                    requirements: deal.requirements,
                    objections: deal.objections,
                    createdAt: deal.createdAt,
                    updatedAt: deal.updatedAt
                })),
                overdueDeals: dashboardData.overdueDeals.map(deal => ({
                    id: deal.id,
                    organizationId: deal.organizationId,
                    contactId: deal.contactId,
                    companyId: deal.companyId,
                    userId: deal.userId,
                    name: deal.name,
                    description: deal.description,
                    stage: deal.stage,
                    status: deal.status,
                    priority: deal.priority,
                    source: deal.source,
                    value: deal.value,
                    currency: deal.currency,
                    probability: deal.probability,
                    expectedCloseDate: deal.expectedCloseDate,
                    actualCloseDate: deal.actualCloseDate,
                    nextStep: deal.nextStep,
                    nextStepDate: deal.nextStepDate,
                    tags: deal.tags,
                    customFields: deal.customFields,
                    attachments: deal.attachments,
                    notes: deal.notes,
                    competitors: deal.competitors,
                    decisionMakers: deal.decisionMakers,
                    budget: deal.budget,
                    timeline: deal.timeline,
                    requirements: deal.requirements,
                    objections: deal.objections,
                    createdAt: deal.createdAt,
                    updatedAt: deal.updatedAt
                })),
                topDeals: dashboardData.topDeals.map(deal => ({
                    id: deal.id,
                    organizationId: deal.organizationId,
                    contactId: deal.contactId,
                    companyId: deal.companyId,
                    userId: deal.userId,
                    name: deal.name,
                    description: deal.description,
                    stage: deal.stage,
                    status: deal.status,
                    priority: deal.priority,
                    source: deal.source,
                    value: deal.value,
                    currency: deal.currency,
                    probability: deal.probability,
                    expectedCloseDate: deal.expectedCloseDate,
                    actualCloseDate: deal.actualCloseDate,
                    nextStep: deal.nextStep,
                    nextStepDate: deal.nextStepDate,
                    tags: deal.tags,
                    customFields: deal.customFields,
                    attachments: deal.attachments,
                    notes: deal.notes,
                    competitors: deal.competitors,
                    decisionMakers: deal.decisionMakers,
                    budget: deal.budget,
                    timeline: deal.timeline,
                    requirements: deal.requirements,
                    objections: deal.objections,
                    createdAt: deal.createdAt,
                    updatedAt: deal.updatedAt
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
    async deleteDeal(req, res) {
        try {
            const organizationId = req.user?.organizationId;
            if (!organizationId) {
                res.status(401).json(createErrorResponse(new Error('Unauthorized')));
                return;
            }
            const deal = await this.dealRepository.findById(req.params.id);
            if (!deal) {
                res.status(404).json(createErrorResponse(new Error('Deal not found')));
                return;
            }
            if (deal.organizationId !== organizationId) {
                res.status(403).json(createErrorResponse(new Error('Forbidden')));
                return;
            }
            await this.dealRepository.delete(req.params.id);
            res.status(204).send();
        }
        catch (error) {
            res.status(400).json(createErrorResponse(error));
        }
    }
}
//# sourceMappingURL=deal.controller.js.map