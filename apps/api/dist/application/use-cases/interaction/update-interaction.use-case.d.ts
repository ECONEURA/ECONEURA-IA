import { Interaction, InteractionId, InteractionStatus, InteractionPriority, OrganizationId, UserId } from '../../../domain/entities/interaction.entity.js';
import { InteractionRepository } from '../../../domain/repositories/interaction.repository.js';
import { UserDomainService } from '../../../domain/services/user.domain.service.js';
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
export declare class UpdateInteractionUseCase {
    private readonly interactionRepository;
    private readonly userDomainService;
    constructor(interactionRepository: InteractionRepository, userDomainService: UserDomainService);
    execute(request: UpdateInteractionRequest): Promise<UpdateInteractionResponse>;
    updateStatus(id: InteractionId, organizationId: OrganizationId, userId: UserId, status: InteractionStatus): Promise<UpdateInteractionResponse>;
    updatePriority(id: InteractionId, organizationId: OrganizationId, userId: UserId, priority: InteractionPriority): Promise<UpdateInteractionResponse>;
    scheduleInteraction(id: InteractionId, organizationId: OrganizationId, userId: UserId, scheduledAt: Date): Promise<UpdateInteractionResponse>;
    completeInteraction(id: InteractionId, organizationId: OrganizationId, userId: UserId, outcome: string, duration?: number): Promise<UpdateInteractionResponse>;
    setNextAction(id: InteractionId, organizationId: OrganizationId, userId: UserId, nextAction: string, nextActionDate?: Date): Promise<UpdateInteractionResponse>;
    addTag(id: InteractionId, organizationId: OrganizationId, userId: UserId, tag: string): Promise<UpdateInteractionResponse>;
    removeTag(id: InteractionId, organizationId: OrganizationId, userId: UserId, tag: string): Promise<UpdateInteractionResponse>;
    setCustomField(id: InteractionId, organizationId: OrganizationId, userId: UserId, key: string, value: any): Promise<UpdateInteractionResponse>;
    removeCustomField(id: InteractionId, organizationId: OrganizationId, userId: UserId, key: string): Promise<UpdateInteractionResponse>;
}
//# sourceMappingURL=update-interaction.use-case.d.ts.map