import { Request, Response } from 'express';

import { CreateDealUseCase } from '../../application/use-cases/deal/create-deal.use-case.js';
import { UpdateDealUseCase } from '../../application/use-cases/deal/update-deal.use-case.js';
import { DealRepository } from '../../domain/repositories/deal.repository.js';
import { createErrorResponse } from '../../../shared/utils/error.utils.js';
import { 
  CreateDealRequest,
  UpdateDealRequest,
  DealSearchQuery,
  DealFiltersQuery,
  DealResponse,
  DealListResponse,
  DealStatsResponse,
  DealPipelineResponse,
  DealSalesForecastResponse,
  DealConversionRatesResponse,
  DealDashboardResponse
} from '../dto/deal.dto.js';

// ============================================================================
// DEAL CONTROLLER
// ============================================================================

export class DealController {
  constructor(
    private readonly createDealUseCase: CreateDealUseCase,
    private readonly updateDealUseCase: UpdateDealUseCase,
    private readonly dealRepository: DealRepository
  ) {}

  // ========================================================================
  // CREATE DEAL
  // ========================================================================

  async createDeal(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;
      const userId = req.user?.id;

      if (!organizationId || !userId) {
        res.status(401).json(createErrorResponse(new Error('Unauthorized')));
        return;
      }

      const request: CreateDealRequest = {
        ...req.body,
        organizationId,
        userId
      };

      const result = await this.createDealUseCase.execute(request);

      const response: DealResponse = {
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
    } catch (error) {
      res.status(400).json(createErrorResponse(error));
    }
  }

  // ========================================================================
  // CREATE LEAD
  // ========================================================================

  async createLead(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;
      const userId = req.user?.id;

      if (!organizationId || !userId) {
        res.status(401).json(createErrorResponse(new Error('Unauthorized')));
        return;
      }

      const result = await this.createDealUseCase.createLead(
        organizationId,
        req.body.contactId,
        userId,
        req.body.name,
        req.body.value,
        req.body.currency,
        req.body.source,
        req.body.companyId
      );

      const response: DealResponse = {
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
    } catch (error) {
      res.status(400).json(createErrorResponse(error));
    }
  }

  // ========================================================================
  // CREATE QUALIFIED
  // ========================================================================

  async createQualified(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;
      const userId = req.user?.id;

      if (!organizationId || !userId) {
        res.status(401).json(createErrorResponse(new Error('Unauthorized')));
        return;
      }

      const result = await this.createDealUseCase.createQualified(
        organizationId,
        req.body.contactId,
        userId,
        req.body.name,
        req.body.value,
        req.body.currency,
        req.body.source,
        req.body.companyId
      );

      const response: DealResponse = {
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
    } catch (error) {
      res.status(400).json(createErrorResponse(error));
    }
  }

  // ========================================================================
  // CREATE PROPOSAL
  // ========================================================================

  async createProposal(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;
      const userId = req.user?.id;

      if (!organizationId || !userId) {
        res.status(401).json(createErrorResponse(new Error('Unauthorized')));
        return;
      }

      const result = await this.createDealUseCase.createProposal(
        organizationId,
        req.body.contactId,
        userId,
        req.body.name,
        req.body.value,
        req.body.currency,
        req.body.source,
        req.body.companyId
      );

      const response: DealResponse = {
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
    } catch (error) {
      res.status(400).json(createErrorResponse(error));
    }
  }

  // ========================================================================
  // CREATE NEGOTIATION
  // ========================================================================

  async createNegotiation(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;
      const userId = req.user?.id;

      if (!organizationId || !userId) {
        res.status(401).json(createErrorResponse(new Error('Unauthorized')));
        return;
      }

      const result = await this.createDealUseCase.createNegotiation(
        organizationId,
        req.body.contactId,
        userId,
        req.body.name,
        req.body.value,
        req.body.currency,
        req.body.source,
        req.body.companyId
      );

      const response: DealResponse = {
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
    } catch (error) {
      res.status(400).json(createErrorResponse(error));
    }
  }

  // ========================================================================
  // UPDATE DEAL
  // ========================================================================

  async updateDeal(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;
      const userId = req.user?.id;

      if (!organizationId || !userId) {
        res.status(401).json(createErrorResponse(new Error('Unauthorized')));
        return;
      }

      const request: UpdateDealRequest = {
        id: req.params.id,
        organizationId,
        userId,
        updates: req.body
      };

      const result = await this.updateDealUseCase.execute(request);

      const response: DealResponse = {
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
    } catch (error) {
      res.status(400).json(createErrorResponse(error));
    }
  }

  // ========================================================================
  // GET DEAL BY ID
  // ========================================================================

  async getDealById(req: Request, res: Response): Promise<void> {
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

      const response: DealResponse = {
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
    } catch (error) {
      res.status(400).json(createErrorResponse(error));
    }
  }

  // ========================================================================
  // GET DEALS BY ORGANIZATION
  // ========================================================================

  async getDealsByOrganization(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;

      if (!organizationId) {
        res.status(401).json(createErrorResponse(new Error('Unauthorized')));
        return;
      }

      const query: DealSearchQuery = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
        sortBy: (req.query.sortBy as any) || 'createdAt',
        sortOrder: (req.query.sortOrder as any) || 'desc',
        search: req.query.search as string,
        stage: req.query.stage as any,
        status: req.query.status as any,
        priority: req.query.priority as any,
        source: req.query.source as any,
        contactId: req.query.contactId as string,
        companyId: req.query.companyId as string,
        userId: req.query.userId as string,
        valueFrom: req.query.valueFrom ? parseFloat(req.query.valueFrom as string) : undefined,
        valueTo: req.query.valueTo ? parseFloat(req.query.valueTo as string) : undefined,
        probabilityFrom: req.query.probabilityFrom ? parseInt(req.query.probabilityFrom as string) : undefined,
        probabilityTo: req.query.probabilityTo ? parseInt(req.query.probabilityTo as string) : undefined,
        expectedCloseFrom: req.query.expectedCloseFrom ? new Date(req.query.expectedCloseFrom as string) : undefined,
        expectedCloseTo: req.query.expectedCloseTo ? new Date(req.query.expectedCloseTo as string) : undefined,
        actualCloseFrom: req.query.actualCloseFrom ? new Date(req.query.actualCloseFrom as string) : undefined,
        actualCloseTo: req.query.actualCloseTo ? new Date(req.query.actualCloseTo as string) : undefined,
        tags: req.query.tags as string,
        hasNextStep: req.query.hasNextStep ? req.query.hasNextStep === 'true' : undefined,
        overdue: req.query.overdue ? req.query.overdue === 'true' : undefined,
        won: req.query.won ? req.query.won === 'true' : undefined,
        lost: req.query.lost ? req.query.lost === 'true' : undefined,
        active: req.query.active ? req.query.active === 'true' : undefined
      };

      const result = await this.dealRepository.findByOrganizationId(organizationId, query);

      const response: DealListResponse = {
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
    } catch (error) {
      res.status(400).json(createErrorResponse(error));
    }
  }

  // ========================================================================
  // GET DEALS BY CONTACT
  // ========================================================================

  async getDealsByContact(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;

      if (!organizationId) {
        res.status(401).json(createErrorResponse(new Error('Unauthorized')));
        return;
      }

      const query: DealSearchQuery = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
        sortBy: (req.query.sortBy as any) || 'createdAt',
        sortOrder: (req.query.sortOrder as any) || 'desc'
      };

      const result = await this.dealRepository.findByContactId(req.params.contactId, query);

      const response: DealListResponse = {
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
    } catch (error) {
      res.status(400).json(createErrorResponse(error));
    }
  }

  // ========================================================================
  // GET DEALS BY COMPANY
  // ========================================================================

  async getDealsByCompany(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;

      if (!organizationId) {
        res.status(401).json(createErrorResponse(new Error('Unauthorized')));
        return;
      }

      const query: DealSearchQuery = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
        sortBy: (req.query.sortBy as any) || 'createdAt',
        sortOrder: (req.query.sortOrder as any) || 'desc'
      };

      const result = await this.dealRepository.findByCompanyId(req.params.companyId, query);

      const response: DealListResponse = {
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
    } catch (error) {
      res.status(400).json(createErrorResponse(error));
    }
  }

  // ========================================================================
  // GET DEAL STATS
  // ========================================================================

  async getDealStats(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;

      if (!organizationId) {
        res.status(401).json(createErrorResponse(new Error('Unauthorized')));
        return;
      }

      const filters: DealFiltersQuery = {
        stage: req.query.stage as any,
        status: req.query.status as any,
        priority: req.query.priority as any,
        source: req.query.source as any,
        contactId: req.query.contactId as string,
        companyId: req.query.companyId as string,
        userId: req.query.userId as string,
        valueFrom: req.query.valueFrom ? parseFloat(req.query.valueFrom as string) : undefined,
        valueTo: req.query.valueTo ? parseFloat(req.query.valueTo as string) : undefined,
        probabilityFrom: req.query.probabilityFrom ? parseInt(req.query.probabilityFrom as string) : undefined,
        probabilityTo: req.query.probabilityTo ? parseInt(req.query.probabilityTo as string) : undefined,
        expectedCloseFrom: req.query.expectedCloseFrom ? new Date(req.query.expectedCloseFrom as string) : undefined,
        expectedCloseTo: req.query.expectedCloseTo ? new Date(req.query.expectedCloseTo as string) : undefined,
        actualCloseFrom: req.query.actualCloseFrom ? new Date(req.query.actualCloseFrom as string) : undefined,
        actualCloseTo: req.query.actualCloseTo ? new Date(req.query.actualCloseTo as string) : undefined,
        tags: req.query.tags as string,
        hasNextStep: req.query.hasNextStep ? req.query.hasNextStep === 'true' : undefined,
        overdue: req.query.overdue ? req.query.overdue === 'true' : undefined,
        won: req.query.won ? req.query.won === 'true' : undefined,
        lost: req.query.lost ? req.query.lost === 'true' : undefined,
        active: req.query.active ? req.query.active === 'true' : undefined
      };

      const stats = await this.dealRepository.getStats(organizationId, filters);

      const response: DealStatsResponse = {
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
    } catch (error) {
      res.status(400).json(createErrorResponse(error));
    }
  }

  // ========================================================================
  // GET PIPELINE DATA
  // ========================================================================

  async getPipelineData(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;
      const userId = req.user?.id;

      if (!organizationId) {
        res.status(401).json(createErrorResponse(new Error('Unauthorized')));
        return;
      }

      const pipelineData = await this.dealRepository.getPipelineData(organizationId, userId);

      const response: DealPipelineResponse = {
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
    } catch (error) {
      res.status(400).json(createErrorResponse(error));
    }
  }

  // ========================================================================
  // GET SALES FORECAST
  // ========================================================================

  async getSalesForecast(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;
      const userId = req.user?.id;

      if (!organizationId) {
        res.status(401).json(createErrorResponse(new Error('Unauthorized')));
        return;
      }

      const months = req.query.months ? parseInt(req.query.months as string) : 12;
      const salesForecast = await this.dealRepository.getSalesForecast(organizationId, userId, months);

      const response: DealSalesForecastResponse = {
        monthly: salesForecast.monthly,
        quarterly: salesForecast.quarterly,
        yearly: salesForecast.yearly
      };

      res.status(200).json({
        success: true,
        data: { forecast: response }
      });
    } catch (error) {
      res.status(400).json(createErrorResponse(error));
    }
  }

  // ========================================================================
  // GET CONVERSION RATES
  // ========================================================================

  async getConversionRates(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;
      const userId = req.user?.id;

      if (!organizationId) {
        res.status(401).json(createErrorResponse(new Error('Unauthorized')));
        return;
      }

      const from = req.query.from ? new Date(req.query.from as string) : undefined;
      const to = req.query.to ? new Date(req.query.to as string) : undefined;
      const conversionRates = await this.dealRepository.getConversionRates(organizationId, userId, from, to);

      const response: DealConversionRatesResponse = {
        byStage: conversionRates.byStage,
        overall: conversionRates.overall
      };

      res.status(200).json({
        success: true,
        data: { conversionRates: response }
      });
    } catch (error) {
      res.status(400).json(createErrorResponse(error));
    }
  }

  // ========================================================================
  // GET DASHBOARD DATA
  // ========================================================================

  async getDashboardData(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;
      const userId = req.user?.id;

      if (!organizationId) {
        res.status(401).json(createErrorResponse(new Error('Unauthorized')));
        return;
      }

      const dashboardData = await this.dealRepository.getDashboardData(organizationId, userId);

      const response: DealDashboardResponse = {
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
    } catch (error) {
      res.status(400).json(createErrorResponse(error));
    }
  }

  // ========================================================================
  // DELETE DEAL
  // ========================================================================

  async deleteDeal(req: Request, res: Response): Promise<void> {
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
    } catch (error) {
      res.status(400).json(createErrorResponse(error));
    }
  }
}
