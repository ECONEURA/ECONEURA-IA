import { Interaction, InteractionId, InteractionStatus, InteractionPriority, OrganizationId, UserId } from '../../../domain/entities/interaction.entity.js';
import { InteractionRepository } from '../../../domain/repositories/interaction.repository.js';
import { UserDomainService } from '../../../domain/services/user.domain.service.js';
import { createValidationError, createNotFoundError, createConflictError } from '../../../shared/utils/error.utils.js';

// ============================================================================
// UPDATE INTERACTION USE CASE
// ============================================================================

export interface UpdateInteractionRequest {
  id: InteractionId;
  organizationId: OrganizationId;
  userId: UserId;
  updates: {
    subject?: string;
    description?: string;
    status?: InteractionStatus;
    priority?: InteractionPriority;
    scheduledAt?: Date;
    duration?: number;
    outcome?: string;
    nextAction?: string;
    nextActionDate?: Date;
    tags?: string[];
    customFields?: Record<string, any>;
    attachments?: string[];
  };
}

export interface UpdateInteractionResponse {
  success: true;
  data: {
    interaction: Interaction;
  };
}

export class UpdateInteractionUseCase {
  constructor(
    private readonly interactionRepository: InteractionRepository,
    private readonly userDomainService: UserDomainService
  ) {}

  async execute(request: UpdateInteractionRequest): Promise<UpdateInteractionResponse> {
    // ========================================================================
    // VALIDATION
    // ========================================================================

    // Validate required fields
    if (!request.id) {
      throw createValidationError('Interaction ID is required', 'id');
    }
    if (!request.organizationId) {
      throw createValidationError('Organization ID is required', 'organizationId');
    }
    if (!request.userId) {
      throw createValidationError('User ID is required', 'userId');
    }

    // Validate updates
    if (!request.updates || Object.keys(request.updates).length === 0) {
      throw createValidationError('At least one update field is required', 'updates');
    }

    // Validate subject length
    if (request.updates.subject !== undefined) {
      if (!request.updates.subject || request.updates.subject.trim().length === 0) {
        throw createValidationError('Subject cannot be empty', 'subject');
      }
      if (request.updates.subject.length > 200) {
        throw createValidationError('Subject cannot exceed 200 characters', 'subject');
      }
    }

    // Validate description length
    if (request.updates.description !== undefined && request.updates.description && request.updates.description.length > 1000) {
      throw createValidationError('Description cannot exceed 1000 characters', 'description');
    }

    // Validate outcome length
    if (request.updates.outcome !== undefined && request.updates.outcome && request.updates.outcome.length > 1000) {
      throw createValidationError('Outcome cannot exceed 1000 characters', 'outcome');
    }

    // Validate next action length
    if (request.updates.nextAction !== undefined && request.updates.nextAction && request.updates.nextAction.length > 500) {
      throw createValidationError('Next action cannot exceed 500 characters', 'nextAction');
    }

    // Validate duration
    if (request.updates.duration !== undefined && request.updates.duration < 0) {
      throw createValidationError('Duration cannot be negative', 'duration');
    }

    // Validate tags
    if (request.updates.tags !== undefined && request.updates.tags && request.updates.tags.length > 10) {
      throw createValidationError('Cannot have more than 10 tags', 'tags');
    }

    // Validate attachments
    if (request.updates.attachments !== undefined && request.updates.attachments && request.updates.attachments.length > 5) {
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
    // FIND INTERACTION
    // ========================================================================

    const existingInteraction = await this.interactionRepository.findById(request.id);
    if (!existingInteraction) {
      throw createNotFoundError('Interaction', request.id);
    }

    // Check if interaction belongs to organization
    if (existingInteraction.organizationId !== request.organizationId) {
      throw createConflictError('Interaction', 'Interaction does not belong to the specified organization');
    }

    // ========================================================================
    // UPDATE INTERACTION
    // ========================================================================

    const updatedInteraction = new Interaction({
      ...existingInteraction.toJSON(),
      ...request.updates,
      updatedAt: new Date()
    });

    // Apply specific business logic based on updates
    if (request.updates.status) {
      updatedInteraction.updateStatus(request.updates.status);
    }

    if (request.updates.priority) {
      updatedInteraction.updatePriority(request.updates.priority);
    }

    if (request.updates.scheduledAt) {
      updatedInteraction.schedule(request.updates.scheduledAt);
    }

    if (request.updates.outcome && request.updates.duration !== undefined) {
      updatedInteraction.complete(request.updates.outcome, request.updates.duration);
    }

    if (request.updates.nextAction) {
      updatedInteraction.setNextAction(request.updates.nextAction, request.updates.nextActionDate);
    }

    // Update tags
    if (request.updates.tags) {
      // Clear existing tags and add new ones
      const existingTags = updatedInteraction.tags;
      existingTags.forEach(tag => updatedInteraction.removeTag(tag));
      request.updates.tags.forEach(tag => updatedInteraction.addTag(tag));
    }

    // Update custom fields
    if (request.updates.customFields) {
      Object.entries(request.updates.customFields).forEach(([key, value]) => {
        updatedInteraction.setCustomField(key, value);
      });
    }

    // Update attachments
    if (request.updates.attachments) {
      // Clear existing attachments and add new ones
      const existingAttachments = updatedInteraction.attachments;
      existingAttachments.forEach(attachment => updatedInteraction.removeAttachment(attachment));
      request.updates.attachments.forEach(attachment => updatedInteraction.addAttachment(attachment));
    }

    // ========================================================================
    // VALIDATE UPDATED INTERACTION
    // ========================================================================

    if (!updatedInteraction.validate()) {
      throw createValidationError('Invalid interaction data after update');
    }

    // ========================================================================
    // SAVE UPDATED INTERACTION
    // ========================================================================

    const savedInteraction = await this.interactionRepository.update(updatedInteraction);

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
  // SPECIFIC UPDATE METHODS
  // ========================================================================

  async updateStatus(
    id: InteractionId,
    organizationId: OrganizationId,
    userId: UserId,
    status: InteractionStatus
  ): Promise<UpdateInteractionResponse> {
    return this.execute({
      id,
      organizationId,
      userId,
      updates: { status }
    });
  }

  async updatePriority(
    id: InteractionId,
    organizationId: OrganizationId,
    userId: UserId,
    priority: InteractionPriority
  ): Promise<UpdateInteractionResponse> {
    return this.execute({
      id,
      organizationId,
      userId,
      updates: { priority }
    });
  }

  async scheduleInteraction(
    id: InteractionId,
    organizationId: OrganizationId,
    userId: UserId,
    scheduledAt: Date
  ): Promise<UpdateInteractionResponse> {
    return this.execute({
      id,
      organizationId,
      userId,
      updates: { scheduledAt }
    });
  }

  async completeInteraction(
    id: InteractionId,
    organizationId: OrganizationId,
    userId: UserId,
    outcome: string,
    duration?: number
  ): Promise<UpdateInteractionResponse> {
    return this.execute({
      id,
      organizationId,
      userId,
      updates: {
        status: 'COMPLETED',
        outcome,
        duration
      }
    });
  }

  async setNextAction(
    id: InteractionId,
    organizationId: OrganizationId,
    userId: UserId,
    nextAction: string,
    nextActionDate?: Date
  ): Promise<UpdateInteractionResponse> {
    return this.execute({
      id,
      organizationId,
      userId,
      updates: {
        nextAction,
        nextActionDate
      }
    });
  }

  async addTag(
    id: InteractionId,
    organizationId: OrganizationId,
    userId: UserId,
    tag: string
  ): Promise<UpdateInteractionResponse> {
    const existingInteraction = await this.interactionRepository.findById(id);
    if (!existingInteraction) {
      throw createNotFoundError('Interaction', id);
    }

    const currentTags = existingInteraction.tags;
    if (!currentTags.includes(tag)) {
      currentTags.push(tag);
    }

    return this.execute({
      id,
      organizationId,
      userId,
      updates: { tags: currentTags }
    });
  }

  async removeTag(
    id: InteractionId,
    organizationId: OrganizationId,
    userId: UserId,
    tag: string
  ): Promise<UpdateInteractionResponse> {
    const existingInteraction = await this.interactionRepository.findById(id);
    if (!existingInteraction) {
      throw createNotFoundError('Interaction', id);
    }

    const currentTags = existingInteraction.tags.filter(t => t !== tag);

    return this.execute({
      id,
      organizationId,
      userId,
      updates: { tags: currentTags }
    });
  }

  async setCustomField(
    id: InteractionId,
    organizationId: OrganizationId,
    userId: UserId,
    key: string,
    value: any
  ): Promise<UpdateInteractionResponse> {
    const existingInteraction = await this.interactionRepository.findById(id);
    if (!existingInteraction) {
      throw createNotFoundError('Interaction', id);
    }

    const currentCustomFields = { ...existingInteraction.customFields };
    currentCustomFields[key] = value;

    return this.execute({
      id,
      organizationId,
      userId,
      updates: { customFields: currentCustomFields }
    });
  }

  async removeCustomField(
    id: InteractionId,
    organizationId: OrganizationId,
    userId: UserId,
    key: string
  ): Promise<UpdateInteractionResponse> {
    const existingInteraction = await this.interactionRepository.findById(id);
    if (!existingInteraction) {
      throw createNotFoundError('Interaction', id);
    }

    const currentCustomFields = { ...existingInteraction.customFields };
    delete currentCustomFields[key];

    return this.execute({
      id,
      organizationId,
      userId,
      updates: { customFields: currentCustomFields }
    });
  }
}
