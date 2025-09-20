import { Interaction } from '../../../domain/entities/interaction.entity.js';
import { createValidationError, createNotFoundError, createConflictError } from '../../../shared/utils/error.utils.js';
export class CreateInteractionUseCase {
    interactionRepository;
    userDomainService;
    constructor(interactionRepository, userDomainService) {
        this.interactionRepository = interactionRepository;
        this.userDomainService = userDomainService;
    }
    async execute(request) {
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
        if (request.subject.length > 200) {
            throw createValidationError('Subject cannot exceed 200 characters', 'subject');
        }
        if (request.description && request.description.length > 1000) {
            throw createValidationError('Description cannot exceed 1000 characters', 'description');
        }
        if (request.nextAction && request.nextAction.length > 500) {
            throw createValidationError('Next action cannot exceed 500 characters', 'nextAction');
        }
        if (request.tags && request.tags.length > 10) {
            throw createValidationError('Cannot have more than 10 tags', 'tags');
        }
        if (request.attachments && request.attachments.length > 5) {
            throw createValidationError('Cannot have more than 5 attachments', 'attachments');
        }
        const user = await this.userDomainService.findById(request.userId);
        if (!user) {
            throw createNotFoundError('User', request.userId);
        }
        if (user.organizationId !== request.organizationId) {
            throw createConflictError('User', 'User does not belong to the specified organization');
        }
        if (user.status !== 'ACTIVE') {
            throw createConflictError('User', 'User is not active');
        }
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
        if (!interaction.validate()) {
            throw createValidationError('Invalid interaction data');
        }
        const savedInteraction = await this.interactionRepository.save(interaction);
        return {
            success: true,
            data: {
                interaction: savedInteraction
            }
        };
    }
    async createScheduledInteraction(organizationId, contactId, userId, type, subject, scheduledAt, companyId) {
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
    async createTask(organizationId, contactId, userId, subject, description, priority = 'MEDIUM', companyId) {
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
    async createNote(organizationId, contactId, userId, subject, description, companyId) {
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
    async createFollowUp(organizationId, contactId, userId, subject, nextActionDate, companyId) {
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
//# sourceMappingURL=create-interaction.use-case.js.map