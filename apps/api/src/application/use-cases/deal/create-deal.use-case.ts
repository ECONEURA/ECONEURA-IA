import { Deal, DealStage, DealPriority, DealSource, DealId, OrganizationId, ContactId, UserId, CompanyId } from '../../../domain/entities/deal.entity.js';
import { DealRepository } from '../../../domain/repositories/deal.repository.js';
import { UserDomainService } from '../../../domain/services/user.domain.service.js';
import { createValidationError, createNotFoundError, createConflictError } from '../../../shared/utils/error.utils.js';

// ============================================================================
// CREATE DEAL USE CASE
// ============================================================================

export interface CreateDealRequest {
  organizationId: OrganizationId;
  contactId: ContactId;
  userId: UserId;
  name: string;
  description?: string;
  stage?: DealStage;
  priority?: DealPriority;
  source?: DealSource;
  value: number;
  currency?: string;
  probability?: number;
  companyId?: CompanyId;
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
}

export interface CreateDealResponse {
  success: true;
  data: {
    deal: Deal;
  };
}

export class CreateDealUseCase {
  constructor(
    private readonly dealRepository: DealRepository,
    private readonly userDomainService: UserDomainService
  ) {}

  async execute(request: CreateDealRequest): Promise<CreateDealResponse> {
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
    if (!request.name || request.name.trim().length === 0) {
      throw createValidationError('Deal name is required', 'name');
    }
    if (request.value === undefined || request.value === null) {
      throw createValidationError('Deal value is required', 'value');
    }

    // Validate name length
    if (request.name.length > 200) {
      throw createValidationError('Deal name cannot exceed 200 characters', 'name');
    }

    // Validate description length
    if (request.description && request.description.length > 1000) {
      throw createValidationError('Description cannot exceed 1000 characters', 'description');
    }

    // Validate value
    if (request.value < 0) {
      throw createValidationError('Deal value cannot be negative', 'value');
    }

    // Validate probability
    if (request.probability !== undefined && (request.probability < 0 || request.probability > 100)) {
      throw createValidationError('Probability must be between 0 and 100', 'probability');
    }

    // Validate next step length
    if (request.nextStep && request.nextStep.length > 500) {
      throw createValidationError('Next step cannot exceed 500 characters', 'nextStep');
    }

    // Validate notes length
    if (request.notes && request.notes.length > 2000) {
      throw createValidationError('Notes cannot exceed 2000 characters', 'notes');
    }

    // Validate tags
    if (request.tags && request.tags.length > 10) {
      throw createValidationError('Cannot have more than 10 tags', 'tags');
    }

    // Validate attachments
    if (request.attachments && request.attachments.length > 5) {
      throw createValidationError('Cannot have more than 5 attachments', 'attachments');
    }

    // Validate competitors
    if (request.competitors && request.competitors.length > 10) {
      throw createValidationError('Cannot have more than 10 competitors', 'competitors');
    }

    // Validate decision makers
    if (request.decisionMakers && request.decisionMakers.length > 10) {
      throw createValidationError('Cannot have more than 10 decision makers', 'decisionMakers');
    }

    // Validate requirements
    if (request.requirements && request.requirements.length > 20) {
      throw createValidationError('Cannot have more than 20 requirements', 'requirements');
    }

    // Validate objections
    if (request.objections && request.objections.length > 20) {
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

    // Check if deal with same name already exists for this contact
    const existingDeal = await this.dealRepository.existsByContactAndName(
      request.contactId,
      request.name,
      request.organizationId
    );
    if (existingDeal) {
      throw createConflictError('Deal', 'A deal with this name already exists for this contact');
    }

    // ========================================================================
    // CREATE DEAL
    // ========================================================================

    const deal = Deal.create({
      organizationId: request.organizationId,
      contactId: request.contactId,
      userId: request.userId,
      name: request.name.trim(),
      description: request.description?.trim(),
      stage: request.stage || 'LEAD',
      status: 'ACTIVE',
      priority: request.priority || 'MEDIUM',
      source: request.source || 'WEBSITE',
      value: request.value,
      currency: request.currency || 'USD',
      probability: request.probability || this.getDefaultProbability(request.stage || 'LEAD'),
      companyId: request.companyId,
      expectedCloseDate: request.expectedCloseDate,
      nextStep: request.nextStep?.trim(),
      nextStepDate: request.nextStepDate,
      tags: request.tags || [],
      customFields: request.customFields || {},
      attachments: request.attachments || [],
      notes: request.notes?.trim(),
      competitors: request.competitors || [],
      decisionMakers: request.decisionMakers || [],
      budget: request.budget,
      timeline: request.timeline?.trim(),
      requirements: request.requirements || [],
      objections: request.objections || []
    });

    // ========================================================================
    // VALIDATE DEAL
    // ========================================================================

    if (!deal.validate()) {
      throw createValidationError('Invalid deal data');
    }

    // ========================================================================
    // SAVE DEAL
    // ========================================================================

    const savedDeal = await this.dealRepository.save(deal);

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
  // FACTORY METHODS
  // ========================================================================

  async createLead(
    organizationId: OrganizationId,
    contactId: ContactId,
    userId: UserId,
    name: string,
    value: number,
    currency: string = 'USD',
    source: DealSource = 'WEBSITE',
    companyId?: CompanyId
  ): Promise<CreateDealResponse> {
    return this.execute({
      organizationId,
      contactId,
      userId,
      name,
      value,
      currency,
      source,
      stage: 'LEAD',
      companyId
    });
  }

  async createQualified(
    organizationId: OrganizationId,
    contactId: ContactId,
    userId: UserId,
    name: string,
    value: number,
    currency: string = 'USD',
    source: DealSource = 'WEBSITE',
    companyId?: CompanyId
  ): Promise<CreateDealResponse> {
    return this.execute({
      organizationId,
      contactId,
      userId,
      name,
      value,
      currency,
      source,
      stage: 'QUALIFIED',
      companyId
    });
  }

  async createProposal(
    organizationId: OrganizationId,
    contactId: ContactId,
    userId: UserId,
    name: string,
    value: number,
    currency: string = 'USD',
    source: DealSource = 'WEBSITE',
    companyId?: CompanyId
  ): Promise<CreateDealResponse> {
    return this.execute({
      organizationId,
      contactId,
      userId,
      name,
      value,
      currency,
      source,
      stage: 'PROPOSAL',
      companyId
    });
  }

  async createNegotiation(
    organizationId: OrganizationId,
    contactId: ContactId,
    userId: UserId,
    name: string,
    value: number,
    currency: string = 'USD',
    source: DealSource = 'WEBSITE',
    companyId?: CompanyId
  ): Promise<CreateDealResponse> {
    return this.execute({
      organizationId,
      contactId,
      userId,
      name,
      value,
      currency,
      source,
      stage: 'NEGOTIATION',
      companyId
    });
  }

  // ========================================================================
  // UTILITY METHODS
  // ========================================================================

  private getDefaultProbability(stage: DealStage): number {
    switch (stage) {
      case 'LEAD':
        return 10;
      case 'QUALIFIED':
        return 25;
      case 'PROPOSAL':
        return 50;
      case 'NEGOTIATION':
        return 75;
      case 'CLOSED_WON':
        return 100;
      case 'CLOSED_LOST':
        return 0;
      case 'ON_HOLD':
        return 0;
      case 'CANCELLED':
        return 0;
      default:
        return 10;
    }
  }
}
