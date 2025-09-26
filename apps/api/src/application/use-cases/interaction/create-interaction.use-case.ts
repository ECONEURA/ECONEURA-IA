import { Interaction, InteractionType, InteractionPriority, OrganizationId, ContactId, UserId, CompanyId } from '../../../domain/entities/interaction.entity.js';
import { InteractionRepository } from '../../../domain/repositories/interaction.repository.js';
import { UserDomainService } from '../../../domain/services/user.domain.service.js';
import { createValidationError, createNotFoundError, createConflictError } from '../../../shared/utils/error.utils.js';

// ============================================================================
// CREATE INTERACTION USE CASE
// ============================================================================

export interface CreateInteractionRequest {
  organizationId: OrganizationId;
  contactId: ContactId;
  userId: UserId;
  type: InteractionType;
  subject: string;
  description?: string;
  priority?: InteractionPriority;
  companyId?: CompanyId;
  scheduledAt?: Date;
  nextAction?: string;
  nextActionDate?: Date;
  tags?: string[];
  customFields?: Record<string, any>;
  attachments?: string[];
}

export interface CreateInteractionResponse {
  success: true;
  data: {
    interaction: Interaction;
  };
}

export class CreateInteractionUseCase {
  constructor(
    private readonly interactionRepository: InteractionRepository,
    private readonly userDomainService: UserDomainService
  ) {}

  async execute(request: CreateInteractionRequest): Promise<CreateInteractionResponse> {
    // ========================================================================
    // VALIDATION
    // ========================================================================

    // Validate required fields
    if (!request.organizationId) {
      throw createValidationError('Organization ID is required', 'organizationId');
    }
    if (!request.contactId) {
      throw createValidationError('Contact ID is required', 'contactId');
    }
    if (!request.userId) {
      throw createValidationError('User ID is required', 'userId');
    }
    if (!request.type) {
      throw createValidationError('Interaction type is required', 'type');
    }
    if (!request.subject || request.subject.trim().length === 0) {
      throw createValidationError('Subject is required', 'subject');
    }

    // Validate subject length
    if (request.subject.length > 200) {
      throw createValidationError('Subject cannot exceed 200 characters', 'subject');
    }

    // Validate description length
    if (request.description && request.description.length > 1000) {
      throw createValidationError('Description cannot exceed 1000 characters', 'description');
    }

    // Validate next action length
    if (request.nextAction && request.nextAction.length > 500) {
      throw createValidationError('Next action cannot exceed 500 characters', 'nextAction');
    }

    // Validate tags
    if (request.tags && request.tags.length > 10) {
      throw createValidationError('Cannot have more than 10 tags', 'tags');
    }

    // Validate attachments
    if (request.attachments && request.attachments.length > 5) {
      throw createValidationError('Cannot have more than 5 attachments', 'attachments');
    }

    // ========================================================================
    // BUSINESS LOGIC VALIDATION
    // ========================================================================

    // Check if user exists and has access to organization
    const user = await this.userDomainService.findById(request.userId);
    if (!user) {
      throw createNotFoundError('User', request.userId);
    }

    if (user.organizationId !== request.organizationId) {
      throw createConflictError('User', 'User does not belong to the specified organization');
    }

    // Check if user is active
    if (user.status !== 'ACTIVE') {
      throw createConflictError('User', 'User is not active');
    }

    // ========================================================================
    // CREATE INTERACTION
    // ========================================================================

    const interaction = Interaction.create({
      organizationId: request.organizationId,
      contactId: request.contactId,
      userId: request.userId,
      type: request.type,
      status: request.scheduledAt ? 'SCHEDULED' : 'IN_PROGRESS',
      priority: request.priority || 'MEDIUM',
      subject: request.subject.trim(),
      description: request.description?.trim(),
      companyId: request.companyId,
      scheduledAt: request.scheduledAt,
      nextAction: request.nextAction?.trim(),
      nextActionDate: request.nextActionDate,
      tags: request.tags || [],
      customFields: request.customFields || {},
      attachments: request.attachments || []
    });

    // ========================================================================
    // VALIDATE INTERACTION
    // ========================================================================

    if (!interaction.validate()) {
      throw createValidationError('Invalid interaction data');
    }

    // ========================================================================
    // SAVE INTERACTION
    // ========================================================================

    const savedInteraction = await this.interactionRepository.save(interaction);

    // ========================================================================
    // RETURN RESPONSE
    // ========================================================================

    return {
      success: true,
      data: {
        interaction: savedInteraction
      }
    };
  }

  // ========================================================================
  // FACTORY METHODS
  // ========================================================================

  async createScheduledInteraction(
    organizationId: OrganizationId,
    contactId: ContactId,
    userId: UserId,
    type: InteractionType,
    subject: string,
    scheduledAt: Date,
    companyId?: CompanyId
  ): Promise<CreateInteractionResponse> {
    return this.execute({
      organizationId,
      contactId,
      userId,
      type,
      subject,
      scheduledAt,
      companyId
    });
  }

  async createTask(
    organizationId: OrganizationId,
    contactId: ContactId,
    userId: UserId,
    subject: string,
    description?: string,
    priority: InteractionPriority = 'MEDIUM',
    companyId?: CompanyId
  ): Promise<CreateInteractionResponse> {
    return this.execute({
      organizationId,
      contactId,
      userId,
      type: 'TASK',
      subject,
      description,
      priority,
      companyId
    });
  }

  async createNote(
    organizationId: OrganizationId,
    contactId: ContactId,
    userId: UserId,
    subject: string,
    description: string,
    companyId?: CompanyId
  ): Promise<CreateInteractionResponse> {
    return this.execute({
      organizationId,
      contactId,
      userId,
      type: 'NOTE',
      subject,
      description,
      companyId
    });
  }

  async createFollowUp(
    organizationId: OrganizationId,
    contactId: ContactId,
    userId: UserId,
    subject: string,
    nextActionDate: Date,
    companyId?: CompanyId
  ): Promise<CreateInteractionResponse> {
    return this.execute({
      organizationId,
      contactId,
      userId,
      type: 'FOLLOW_UP',
      subject,
      scheduledAt: nextActionDate,
      companyId
    });
  }
}
