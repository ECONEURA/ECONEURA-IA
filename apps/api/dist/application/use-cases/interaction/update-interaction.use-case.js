import { Interaction } from '../../../domain/entities/interaction.entity.js';
import { createValidationError, createNotFoundError, createConflictError } from '../../../shared/utils/error.utils.js';
export class UpdateInteractionUseCase {
    interactionRepository;
    userDomainService;
    constructor(interactionRepository, userDomainService) {
        this.interactionRepository = interactionRepository;
        this.userDomainService = userDomainService;
    }
    async execute(request) {
        if (!request.id) {
            throw createValidationError('Interaction ID is required', 'id');
        }
        if (!request.organizationId) {
            throw createValidationError('Organization ID is required', 'organizationId');
        }
        if (!request.userId) {
            throw createValidationError('User ID is required', 'userId');
        }
        if (!request.updates || Object.keys(request.updates).length === 0) {
            throw createValidationError('At least one update field is required', 'updates');
        }
        if (request.updates.subject !== undefined) {
            if (!request.updates.subject || request.updates.subject.trim().length === 0) {
                throw createValidationError('Subject cannot be empty', 'subject');
            }
            if (request.updates.subject.length > 200) {
                throw createValidationError('Subject cannot exceed 200 characters', 'subject');
            }
        }
        if (request.updates.description !== undefined && request.updates.description && request.updates.description.length > 1000) {
            throw createValidationError('Description cannot exceed 1000 characters', 'description');
        }
        if (request.updates.outcome !== undefined && request.updates.outcome && request.updates.outcome.length > 1000) {
            throw createValidationError('Outcome cannot exceed 1000 characters', 'outcome');
        }
        if (request.updates.nextAction !== undefined && request.updates.nextAction && request.updates.nextAction.length > 500) {
            throw createValidationError('Next action cannot exceed 500 characters', 'nextAction');
        }
        if (request.updates.duration !== undefined && request.updates.duration < 0) {
            throw createValidationError('Duration cannot be negative', 'duration');
        }
        if (request.updates.tags !== undefined && request.updates.tags && request.updates.tags.length > 10) {
            throw createValidationError('Cannot have more than 10 tags', 'tags');
        }
        if (request.updates.attachments !== undefined && request.updates.attachments && request.updates.attachments.length > 5) {
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
        const existingInteraction = await this.interactionRepository.findById(request.id);
        if (!existingInteraction) {
            throw createNotFoundError('Interaction', request.id);
        }
        if (existingInteraction.organizationId !== request.organizationId) {
            throw createConflictError('Interaction', 'Interaction does not belong to the specified organization');
        }
        const updatedInteraction = new Interaction({
            ...existingInteraction.toJSON(),
            ...request.updates,
            updatedAt: new Date()
        });
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
        if (request.updates.tags) {
            const existingTags = updatedInteraction.tags;
            existingTags.forEach(tag => updatedInteraction.removeTag(tag));
            request.updates.tags.forEach(tag => updatedInteraction.addTag(tag));
        }
        if (request.updates.customFields) {
            Object.entries(request.updates.customFields).forEach(([key, value]) => {
                updatedInteraction.setCustomField(key, value);
            });
        }
        if (request.updates.attachments) {
            const existingAttachments = updatedInteraction.attachments;
            existingAttachments.forEach(attachment => updatedInteraction.removeAttachment(attachment));
            request.updates.attachments.forEach(attachment => updatedInteraction.addAttachment(attachment));
        }
        if (!updatedInteraction.validate()) {
            throw createValidationError('Invalid interaction data after update');
        }
        const savedInteraction = await this.interactionRepository.update(updatedInteraction);
        return {
            success: true,
            data: {
                interaction: savedInteraction
            }
        };
    }
    async updateStatus(id, organizationId, userId, status) {
        return this.execute({
            id,
            organizationId,
            userId,
            updates: { status }
        });
    }
    async updatePriority(id, organizationId, userId, priority) {
        return this.execute({
            id,
            organizationId,
            userId,
            updates: { priority }
        });
    }
    async scheduleInteraction(id, organizationId, userId, scheduledAt) {
        return this.execute({
            id,
            organizationId,
            userId,
            updates: { scheduledAt }
        });
    }
    async completeInteraction(id, organizationId, userId, outcome, duration) {
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
    async setNextAction(id, organizationId, userId, nextAction, nextActionDate) {
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
    async addTag(id, organizationId, userId, tag) {
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
    async removeTag(id, organizationId, userId, tag) {
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
    async setCustomField(id, organizationId, userId, key, value) {
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
    async removeCustomField(id, organizationId, userId, key) {
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
//# sourceMappingURL=update-interaction.use-case.js.map