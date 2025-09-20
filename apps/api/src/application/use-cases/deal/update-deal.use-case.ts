import { Deal, DealId, DealStage, DealStatus, DealPriority, OrganizationId, UserId } from '../../../domain/entities/deal.entity.js';
import { DealRepository } from '../../../domain/repositories/deal.repository.js';
import { UserDomainService } from '../../../domain/services/user.domain.service.js';
import { createValidationError, createNotFoundError, createConflictError } from '../../../shared/utils/error.utils.js';

// ============================================================================
// UPDATE DEAL USE CASE
// ============================================================================

export interface UpdateDealRequest {
  id: DealId;
  organizationId: OrganizationId;
  userId: UserId;
  updates: {
    name?: string;
    description?: string;
    stage?: DealStage;
    status?: DealStatus;
    priority?: DealPriority;
    value?: number;
    currency?: string;
    probability?: number;
    expectedCloseDate?: Date;
    nextStep?: string;
    nextStepDate?: Date;
    tags?: string[];
    customFields?: Record<string, any>;
    attachments?: string[];
    notes?: string;
    competitors?: string[];
    decisionMakers?: string[];
    budget?: number;
    timeline?: string;
    requirements?: string[];
    objections?: string[];
  };
}

export interface UpdateDealResponse {
  success: true;
  data: {
    deal: Deal;
  };
}

export class UpdateDealUseCase {
  constructor(
    private readonly dealRepository: DealRepository,
    private readonly userDomainService: UserDomainService
  ) {}

  async execute(request: UpdateDealRequest): Promise<UpdateDealResponse> {
    // ========================================================================
    // VALIDATION
    // ========================================================================

    // Validate required fields
    if (!request.id) {
      throw createValidationError('Deal ID is required', 'id');
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

    // Validate name length
    if (request.updates.name !== undefined) {
      if (!request.updates.name || request.updates.name.trim().length === 0) {
        throw createValidationError('Deal name cannot be empty', 'name');
      }
      if (request.updates.name.length > 200) {
        throw createValidationError('Deal name cannot exceed 200 characters', 'name');
      }
    }

    // Validate description length
    if (request.updates.description !== undefined && request.updates.description && request.updates.description.length > 1000) {
      throw createValidationError('Description cannot exceed 1000 characters', 'description');
    }

    // Validate value
    if (request.updates.value !== undefined && request.updates.value < 0) {
      throw createValidationError('Deal value cannot be negative', 'value');
    }

    // Validate probability
    if (request.updates.probability !== undefined && (request.updates.probability < 0 || request.updates.probability > 100)) {
      throw createValidationError('Probability must be between 0 and 100', 'probability');
    }

    // Validate next step length
    if (request.updates.nextStep !== undefined && request.updates.nextStep && request.updates.nextStep.length > 500) {
      throw createValidationError('Next step cannot exceed 500 characters', 'nextStep');
    }

    // Validate notes length
    if (request.updates.notes !== undefined && request.updates.notes && request.updates.notes.length > 2000) {
      throw createValidationError('Notes cannot exceed 2000 characters', 'notes');
    }

    // Validate tags
    if (request.updates.tags !== undefined && request.updates.tags && request.updates.tags.length > 10) {
      throw createValidationError('Cannot have more than 10 tags', 'tags');
    }

    // Validate attachments
    if (request.updates.attachments !== undefined && request.updates.attachments && request.updates.attachments.length > 5) {
      throw createValidationError('Cannot have more than 5 attachments', 'attachments');
    }

    // Validate competitors
    if (request.updates.competitors !== undefined && request.updates.competitors && request.updates.competitors.length > 10) {
      throw createValidationError('Cannot have more than 10 competitors', 'competitors');
    }

    // Validate decision makers
    if (request.updates.decisionMakers !== undefined && request.updates.decisionMakers && request.updates.decisionMakers.length > 10) {
      throw createValidationError('Cannot have more than 10 decision makers', 'decisionMakers');
    }

    // Validate requirements
    if (request.updates.requirements !== undefined && request.updates.requirements && request.updates.requirements.length > 20) {
      throw createValidationError('Cannot have more than 20 requirements', 'requirements');
    }

    // Validate objections
    if (request.updates.objections !== undefined && request.updates.objections && request.updates.objections.length > 20) {
      throw createValidationError('Cannot have more than 20 objections', 'objections');
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
    // FIND DEAL
    // ========================================================================

    const existingDeal = await this.dealRepository.findById(request.id);
    if (!existingDeal) {
      throw createNotFoundError('Deal', request.id);
    }

    // Check if deal belongs to organization
    if (existingDeal.organizationId !== request.organizationId) {
      throw createConflictError('Deal', 'Deal does not belong to the specified organization');
    }

    // ========================================================================
    // UPDATE DEAL
    // ========================================================================

    const updatedDeal = new Deal({
      ...existingDeal.toJSON(),
      ...request.updates,
      updatedAt: new Date()
    });

    // Apply specific business logic based on updates
    if (request.updates.stage) {
      updatedDeal.updateStage(request.updates.stage);
    }

    if (request.updates.status) {
      updatedDeal.updateStatus(request.updates.status);
    }

    if (request.updates.priority) {
      updatedDeal.updatePriority(request.updates.priority);
    }

    if (request.updates.value !== undefined) {
      updatedDeal.updateValue(request.updates.value, request.updates.currency);
    }

    if (request.updates.probability !== undefined) {
      updatedDeal.updateProbability(request.updates.probability);
    }

    if (request.updates.expectedCloseDate) {
      updatedDeal.setExpectedCloseDate(request.updates.expectedCloseDate);
    }

    if (request.updates.nextStep) {
      updatedDeal.setNextStep(request.updates.nextStep, request.updates.nextStepDate);
    }

    // Update tags
    if (request.updates.tags) {
      // Clear existing tags and add new ones
      const existingTags = updatedDeal.tags;
      existingTags.forEach(tag => updatedDeal.removeTag(tag));
      request.updates.tags.forEach(tag => updatedDeal.addTag(tag));
    }

    // Update custom fields
    if (request.updates.customFields) {
      Object.entries(request.updates.customFields).forEach(([key, value]) => {
        updatedDeal.setCustomField(key, value);
      });
    }

    // Update attachments
    if (request.updates.attachments) {
      // Clear existing attachments and add new ones
      const existingAttachments = updatedDeal.attachments;
      existingAttachments.forEach(attachment => updatedDeal.removeAttachment(attachment));
      request.updates.attachments.forEach(attachment => updatedDeal.addAttachment(attachment));
    }

    // Update competitors
    if (request.updates.competitors) {
      // Clear existing competitors and add new ones
      const existingCompetitors = updatedDeal.competitors;
      existingCompetitors.forEach(competitor => updatedDeal.removeCompetitor(competitor));
      request.updates.competitors.forEach(competitor => updatedDeal.addCompetitor(competitor));
    }

    // Update decision makers
    if (request.updates.decisionMakers) {
      // Clear existing decision makers and add new ones
      const existingDecisionMakers = updatedDeal.decisionMakers;
      existingDecisionMakers.forEach(decisionMaker => updatedDeal.removeDecisionMaker(decisionMaker));
      request.updates.decisionMakers.forEach(decisionMaker => updatedDeal.addDecisionMaker(decisionMaker));
    }

    // Update requirements
    if (request.updates.requirements) {
      // Clear existing requirements and add new ones
      const existingRequirements = updatedDeal.requirements;
      existingRequirements.forEach(requirement => updatedDeal.removeRequirement(requirement));
      request.updates.requirements.forEach(requirement => updatedDeal.addRequirement(requirement));
    }

    // Update objections
    if (request.updates.objections) {
      // Clear existing objections and add new ones
      const existingObjections = updatedDeal.objections;
      existingObjections.forEach(objection => updatedDeal.removeObjection(objection));
      request.updates.objections.forEach(objection => updatedDeal.addObjection(objection));
    }

    // ========================================================================
    // VALIDATE UPDATED DEAL
    // ========================================================================

    if (!updatedDeal.validate()) {
      throw createValidationError('Invalid deal data after update');
    }

    // ========================================================================
    // SAVE UPDATED DEAL
    // ========================================================================

    const savedDeal = await this.dealRepository.update(updatedDeal);

    // ========================================================================
    // RETURN RESPONSE
    // ========================================================================

    return {
      success: true,
      data: {
        deal: savedDeal
      }
    };
  }

  // ========================================================================
  // SPECIFIC UPDATE METHODS
  // ========================================================================

  async updateStage(
    id: DealId,
    organizationId: OrganizationId,
    userId: UserId,
    stage: DealStage
  ): Promise<UpdateDealResponse> {
    return this.execute({
      id,
      organizationId,
      userId,
      updates: { stage }
    });
  }

  async updateStatus(
    id: DealId,
    organizationId: OrganizationId,
    userId: UserId,
    status: DealStatus
  ): Promise<UpdateDealResponse> {
    return this.execute({
      id,
      organizationId,
      userId,
      updates: { status }
    });
  }

  async updatePriority(
    id: DealId,
    organizationId: OrganizationId,
    userId: UserId,
    priority: DealPriority
  ): Promise<UpdateDealResponse> {
    return this.execute({
      id,
      organizationId,
      userId,
      updates: { priority }
    });
  }

  async updateValue(
    id: DealId,
    organizationId: OrganizationId,
    userId: UserId,
    value: number,
    currency?: string
  ): Promise<UpdateDealResponse> {
    return this.execute({
      id,
      organizationId,
      userId,
      updates: { value, currency }
    });
  }

  async updateProbability(
    id: DealId,
    organizationId: OrganizationId,
    userId: UserId,
    probability: number
  ): Promise<UpdateDealResponse> {
    return this.execute({
      id,
      organizationId,
      userId,
      updates: { probability }
    });
  }

  async setExpectedCloseDate(
    id: DealId,
    organizationId: OrganizationId,
    userId: UserId,
    expectedCloseDate: Date
  ): Promise<UpdateDealResponse> {
    return this.execute({
      id,
      organizationId,
      userId,
      updates: { expectedCloseDate }
    });
  }

  async setNextStep(
    id: DealId,
    organizationId: OrganizationId,
    userId: UserId,
    nextStep: string,
    nextStepDate?: Date
  ): Promise<UpdateDealResponse> {
    return this.execute({
      id,
      organizationId,
      userId,
      updates: { nextStep, nextStepDate }
    });
  }

  async addTag(
    id: DealId,
    organizationId: OrganizationId,
    userId: UserId,
    tag: string
  ): Promise<UpdateDealResponse> {
    const existingDeal = await this.dealRepository.findById(id);
    if (!existingDeal) {
      throw createNotFoundError('Deal', id);
    }

    const currentTags = existingDeal.tags;
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
    id: DealId,
    organizationId: OrganizationId,
    userId: UserId,
    tag: string
  ): Promise<UpdateDealResponse> {
    const existingDeal = await this.dealRepository.findById(id);
    if (!existingDeal) {
      throw createNotFoundError('Deal', id);
    }

    const currentTags = existingDeal.tags.filter(t => t !== tag);

    return this.execute({
      id,
      organizationId,
      userId,
      updates: { tags: currentTags }
    });
  }

  async addCompetitor(
    id: DealId,
    organizationId: OrganizationId,
    userId: UserId,
    competitor: string
  ): Promise<UpdateDealResponse> {
    const existingDeal = await this.dealRepository.findById(id);
    if (!existingDeal) {
      throw createNotFoundError('Deal', id);
    }

    const currentCompetitors = existingDeal.competitors;
    if (!currentCompetitors.includes(competitor)) {
      currentCompetitors.push(competitor);
    }

    return this.execute({
      id,
      organizationId,
      userId,
      updates: { competitors: currentCompetitors }
    });
  }

  async removeCompetitor(
    id: DealId,
    organizationId: OrganizationId,
    userId: UserId,
    competitor: string
  ): Promise<UpdateDealResponse> {
    const existingDeal = await this.dealRepository.findById(id);
    if (!existingDeal) {
      throw createNotFoundError('Deal', id);
    }

    const currentCompetitors = existingDeal.competitors.filter(c => c !== competitor);

    return this.execute({
      id,
      organizationId,
      userId,
      updates: { competitors: currentCompetitors }
    });
  }

  async addDecisionMaker(
    id: DealId,
    organizationId: OrganizationId,
    userId: UserId,
    decisionMaker: string
  ): Promise<UpdateDealResponse> {
    const existingDeal = await this.dealRepository.findById(id);
    if (!existingDeal) {
      throw createNotFoundError('Deal', id);
    }

    const currentDecisionMakers = existingDeal.decisionMakers;
    if (!currentDecisionMakers.includes(decisionMaker)) {
      currentDecisionMakers.push(decisionMaker);
    }

    return this.execute({
      id,
      organizationId,
      userId,
      updates: { decisionMakers: currentDecisionMakers }
    });
  }

  async removeDecisionMaker(
    id: DealId,
    organizationId: OrganizationId,
    userId: UserId,
    decisionMaker: string
  ): Promise<UpdateDealResponse> {
    const existingDeal = await this.dealRepository.findById(id);
    if (!existingDeal) {
      throw createNotFoundError('Deal', id);
    }

    const currentDecisionMakers = existingDeal.decisionMakers.filter(d => d !== decisionMaker);

    return this.execute({
      id,
      organizationId,
      userId,
      updates: { decisionMakers: currentDecisionMakers }
    });
  }
}
