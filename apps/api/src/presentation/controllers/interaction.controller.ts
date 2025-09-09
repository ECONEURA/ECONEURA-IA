import { Request, Response } from 'express';
import { CreateInteractionUseCase } from '../../application/use-cases/interaction/create-interaction.use-case.js';
import { UpdateInteractionUseCase } from '../../application/use-cases/interaction/update-interaction.use-case.js';
import { InteractionRepository } from '../../domain/repositories/interaction.repository.js';
import { createErrorResponse } from '../../../shared/utils/error.utils.js';
import { 
  CreateInteractionRequest,
  UpdateInteractionRequest,
  InteractionSearchQuery,
  InteractionFiltersQuery,
  InteractionBulkUpdateRequest,
  InteractionBulkDeleteRequest,
  InteractionResponse,
  InteractionListResponse,
  InteractionStatsResponse,
  InteractionDashboardResponse,
  InteractionSummaryResponse
} from '../dto/interaction.dto.js';

// ============================================================================
// INTERACTION CONTROLLER
// ============================================================================

export class InteractionController {
  constructor(
    private readonly createInteractionUseCase: CreateInteractionUseCase,
    private readonly updateInteractionUseCase: UpdateInteractionUseCase,
    private readonly interactionRepository: InteractionRepository
  ) {}

  // ========================================================================
  // CREATE INTERACTION
  // ========================================================================

  async createInteraction(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;
      const userId = req.user?.id;

      if (!organizationId || !userId) {
        res.status(401).json(createErrorResponse(new Error('Unauthorized')));
        return;
      }

      const request: CreateInteractionRequest = {
        ...req.body,
        organizationId,
        userId
      };

      const result = await this.createInteractionUseCase.execute(request);

      const response: InteractionResponse = {
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
    } catch (error) {
      res.status(400).json(createErrorResponse(error));
    }
  }

  // ========================================================================
  // CREATE SCHEDULED INTERACTION
  // ========================================================================

  async createScheduledInteraction(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;
      const userId = req.user?.id;

      if (!organizationId || !userId) {
        res.status(401).json(createErrorResponse(new Error('Unauthorized')));
        return;
      }

      const result = await this.createInteractionUseCase.createScheduledInteraction(
        organizationId,
        req.body.contactId,
        userId,
        req.body.type,
        req.body.subject,
        req.body.scheduledAt,
        req.body.companyId
      );

      const response: InteractionResponse = {
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
    } catch (error) {
      res.status(400).json(createErrorResponse(error));
    }
  }

  // ========================================================================
  // CREATE TASK
  // ========================================================================

  async createTask(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;
      const userId = req.user?.id;

      if (!organizationId || !userId) {
        res.status(401).json(createErrorResponse(new Error('Unauthorized')));
        return;
      }

      const result = await this.createInteractionUseCase.createTask(
        organizationId,
        req.body.contactId,
        userId,
        req.body.subject,
        req.body.description,
        req.body.priority,
        req.body.companyId
      );

      const response: InteractionResponse = {
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
    } catch (error) {
      res.status(400).json(createErrorResponse(error));
    }
  }

  // ========================================================================
  // CREATE NOTE
  // ========================================================================

  async createNote(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;
      const userId = req.user?.id;

      if (!organizationId || !userId) {
        res.status(401).json(createErrorResponse(new Error('Unauthorized')));
        return;
      }

      const result = await this.createInteractionUseCase.createNote(
        organizationId,
        req.body.contactId,
        userId,
        req.body.subject,
        req.body.description,
        req.body.companyId
      );

      const response: InteractionResponse = {
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
    } catch (error) {
      res.status(400).json(createErrorResponse(error));
    }
  }

  // ========================================================================
  // CREATE FOLLOW-UP
  // ========================================================================

  async createFollowUp(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;
      const userId = req.user?.id;

      if (!organizationId || !userId) {
        res.status(401).json(createErrorResponse(new Error('Unauthorized')));
        return;
      }

      const result = await this.createInteractionUseCase.createFollowUp(
        organizationId,
        req.body.contactId,
        userId,
        req.body.subject,
        req.body.nextActionDate,
        req.body.companyId
      );

      const response: InteractionResponse = {
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
    } catch (error) {
      res.status(400).json(createErrorResponse(error));
    }
  }

  // ========================================================================
  // UPDATE INTERACTION
  // ========================================================================

  async updateInteraction(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;
      const userId = req.user?.id;

      if (!organizationId || !userId) {
        res.status(401).json(createErrorResponse(new Error('Unauthorized')));
        return;
      }

      const request: UpdateInteractionRequest = {
        id: req.params.id,
        organizationId,
        userId,
        updates: req.body
      };

      const result = await this.updateInteractionUseCase.execute(request);

      const response: InteractionResponse = {
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
    } catch (error) {
      res.status(400).json(createErrorResponse(error));
    }
  }

  // ========================================================================
  // GET INTERACTION BY ID
  // ========================================================================

  async getInteractionById(req: Request, res: Response): Promise<void> {
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

      const response: InteractionResponse = {
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
    } catch (error) {
      res.status(400).json(createErrorResponse(error));
    }
  }

  // ========================================================================
  // GET INTERACTIONS BY ORGANIZATION
  // ========================================================================

  async getInteractionsByOrganization(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;

      if (!organizationId) {
        res.status(401).json(createErrorResponse(new Error('Unauthorized')));
        return;
      }

      const query: InteractionSearchQuery = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
        sortBy: (req.query.sortBy as any) || 'createdAt',
        sortOrder: (req.query.sortOrder as any) || 'desc',
        search: req.query.search as string,
        type: req.query.type as any,
        status: req.query.status as any,
        priority: req.query.priority as any,
        contactId: req.query.contactId as string,
        companyId: req.query.companyId as string,
        userId: req.query.userId as string,
        scheduledFrom: req.query.scheduledFrom ? new Date(req.query.scheduledFrom as string) : undefined,
        scheduledTo: req.query.scheduledTo ? new Date(req.query.scheduledTo as string) : undefined,
        completedFrom: req.query.completedFrom ? new Date(req.query.completedFrom as string) : undefined,
        completedTo: req.query.completedTo ? new Date(req.query.completedTo as string) : undefined,
        tags: req.query.tags as string,
        hasOutcome: req.query.hasOutcome ? req.query.hasOutcome === 'true' : undefined,
        hasNextAction: req.query.hasNextAction ? req.query.hasNextAction === 'true' : undefined,
        overdue: req.query.overdue ? req.query.overdue === 'true' : undefined,
        upcoming: req.query.upcoming ? req.query.upcoming === 'true' : undefined
      };

      const result = await this.interactionRepository.findByOrganizationId(organizationId, query);

      const response: InteractionListResponse = {
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
    } catch (error) {
      res.status(400).json(createErrorResponse(error));
    }
  }

  // ========================================================================
  // GET INTERACTIONS BY CONTACT
  // ========================================================================

  async getInteractionsByContact(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;

      if (!organizationId) {
        res.status(401).json(createErrorResponse(new Error('Unauthorized')));
        return;
      }

      const query: InteractionSearchQuery = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
        sortBy: (req.query.sortBy as any) || 'createdAt',
        sortOrder: (req.query.sortOrder as any) || 'desc'
      };

      const result = await this.interactionRepository.findByContactId(req.params.contactId, query);

      const response: InteractionListResponse = {
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
    } catch (error) {
      res.status(400).json(createErrorResponse(error));
    }
  }

  // ========================================================================
  // GET INTERACTIONS BY COMPANY
  // ========================================================================

  async getInteractionsByCompany(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;

      if (!organizationId) {
        res.status(401).json(createErrorResponse(new Error('Unauthorized')));
        return;
      }

      const query: InteractionSearchQuery = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
        sortBy: (req.query.sortBy as any) || 'createdAt',
        sortOrder: (req.query.sortOrder as any) || 'desc'
      };

      const result = await this.interactionRepository.findByCompanyId(req.params.companyId, query);

      const response: InteractionListResponse = {
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
    } catch (error) {
      res.status(400).json(createErrorResponse(error));
    }
  }

  // ========================================================================
  // GET INTERACTION STATS
  // ========================================================================

  async getInteractionStats(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;

      if (!organizationId) {
        res.status(401).json(createErrorResponse(new Error('Unauthorized')));
        return;
      }

      const filters: InteractionFiltersQuery = {
        type: req.query.type as any,
        status: req.query.status as any,
        priority: req.query.priority as any,
        contactId: req.query.contactId as string,
        companyId: req.query.companyId as string,
        userId: req.query.userId as string,
        scheduledFrom: req.query.scheduledFrom ? new Date(req.query.scheduledFrom as string) : undefined,
        scheduledTo: req.query.scheduledTo ? new Date(req.query.scheduledTo as string) : undefined,
        completedFrom: req.query.completedFrom ? new Date(req.query.completedFrom as string) : undefined,
        completedTo: req.query.completedTo ? new Date(req.query.completedTo as string) : undefined,
        tags: req.query.tags as string,
        hasOutcome: req.query.hasOutcome ? req.query.hasOutcome === 'true' : undefined,
        hasNextAction: req.query.hasNextAction ? req.query.hasNextAction === 'true' : undefined,
        overdue: req.query.overdue ? req.query.overdue === 'true' : undefined,
        upcoming: req.query.upcoming ? req.query.upcoming === 'true' : undefined
      };

      const stats = await this.interactionRepository.getStats(organizationId, filters);

      const response: InteractionStatsResponse = {
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

      const dashboardData = await this.interactionRepository.getDashboardData(organizationId, userId);

      const response: InteractionDashboardResponse = {
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
    } catch (error) {
      res.status(400).json(createErrorResponse(error));
    }
  }

  // ========================================================================
  // DELETE INTERACTION
  // ========================================================================

  async deleteInteraction(req: Request, res: Response): Promise<void> {
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
    } catch (error) {
      res.status(400).json(createErrorResponse(error));
    }
  }
}
