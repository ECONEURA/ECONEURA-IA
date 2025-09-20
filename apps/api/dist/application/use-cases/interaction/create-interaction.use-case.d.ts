import { Interaction, InteractionType, InteractionPriority, OrganizationId, ContactId, UserId, CompanyId } from '../../../domain/entities/interaction.entity.js';
import { InteractionRepository } from '../../../domain/repositories/interaction.repository.js';
import { UserDomainService } from '../../../domain/services/user.domain.service.js';
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
export declare class CreateInteractionUseCase {
    private readonly interactionRepository;
    private readonly userDomainService;
    constructor(interactionRepository: InteractionRepository, userDomainService: UserDomainService);
    execute(request: CreateInteractionRequest): Promise<CreateInteractionResponse>;
    createScheduledInteraction(organizationId: OrganizationId, contactId: ContactId, userId: UserId, type: InteractionType, subject: string, scheduledAt: Date, companyId?: CompanyId): Promise<CreateInteractionResponse>;
    createTask(organizationId: OrganizationId, contactId: ContactId, userId: UserId, subject: string, description?: string, priority?: InteractionPriority, companyId?: CompanyId): Promise<CreateInteractionResponse>;
    createNote(organizationId: OrganizationId, contactId: ContactId, userId: UserId, subject: string, description: string, companyId?: CompanyId): Promise<CreateInteractionResponse>;
    createFollowUp(organizationId: OrganizationId, contactId: ContactId, userId: UserId, subject: string, nextActionDate: Date, companyId?: CompanyId): Promise<CreateInteractionResponse>;
}
//# sourceMappingURL=create-interaction.use-case.d.ts.map