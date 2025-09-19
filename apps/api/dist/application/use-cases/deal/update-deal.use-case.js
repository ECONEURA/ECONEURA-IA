import { Deal } from '../../../domain/entities/deal.entity.js';
import { createValidationError, createNotFoundError, createConflictError } from '../../../shared/utils/error.utils.js';
export class UpdateDealUseCase {
    dealRepository;
    userDomainService;
    constructor(dealRepository, userDomainService) {
        this.dealRepository = dealRepository;
        this.userDomainService = userDomainService;
    }
    async execute(request) {
        if (!request.id) {
            throw createValidationError('Deal ID is required', 'id');
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
        if (request.updates.name !== undefined) {
            if (!request.updates.name || request.updates.name.trim().length === 0) {
                throw createValidationError('Deal name cannot be empty', 'name');
            }
            if (request.updates.name.length > 200) {
                throw createValidationError('Deal name cannot exceed 200 characters', 'name');
            }
        }
        if (request.updates.description !== undefined && request.updates.description && request.updates.description.length > 1000) {
            throw createValidationError('Description cannot exceed 1000 characters', 'description');
        }
        if (request.updates.value !== undefined && request.updates.value < 0) {
            throw createValidationError('Deal value cannot be negative', 'value');
        }
        if (request.updates.probability !== undefined && (request.updates.probability < 0 || request.updates.probability > 100)) {
            throw createValidationError('Probability must be between 0 and 100', 'probability');
        }
        if (request.updates.nextStep !== undefined && request.updates.nextStep && request.updates.nextStep.length > 500) {
            throw createValidationError('Next step cannot exceed 500 characters', 'nextStep');
        }
        if (request.updates.notes !== undefined && request.updates.notes && request.updates.notes.length > 2000) {
            throw createValidationError('Notes cannot exceed 2000 characters', 'notes');
        }
        if (request.updates.tags !== undefined && request.updates.tags && request.updates.tags.length > 10) {
            throw createValidationError('Cannot have more than 10 tags', 'tags');
        }
        if (request.updates.attachments !== undefined && request.updates.attachments && request.updates.attachments.length > 5) {
            throw createValidationError('Cannot have more than 5 attachments', 'attachments');
        }
        if (request.updates.competitors !== undefined && request.updates.competitors && request.updates.competitors.length > 10) {
            throw createValidationError('Cannot have more than 10 competitors', 'competitors');
        }
        if (request.updates.decisionMakers !== undefined && request.updates.decisionMakers && request.updates.decisionMakers.length > 10) {
            throw createValidationError('Cannot have more than 10 decision makers', 'decisionMakers');
        }
        if (request.updates.requirements !== undefined && request.updates.requirements && request.updates.requirements.length > 20) {
            throw createValidationError('Cannot have more than 20 requirements', 'requirements');
        }
        if (request.updates.objections !== undefined && request.updates.objections && request.updates.objections.length > 20) {
            throw createValidationError('Cannot have more than 20 objections', 'objections');
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
        const existingDeal = await this.dealRepository.findById(request.id);
        if (!existingDeal) {
            throw createNotFoundError('Deal', request.id);
        }
        if (existingDeal.organizationId !== request.organizationId) {
            throw createConflictError('Deal', 'Deal does not belong to the specified organization');
        }
        const updatedDeal = new Deal({
            ...existingDeal.toJSON(),
            ...request.updates,
            updatedAt: new Date()
        });
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
        if (request.updates.tags) {
            const existingTags = updatedDeal.tags;
            existingTags.forEach(tag => updatedDeal.removeTag(tag));
            request.updates.tags.forEach(tag => updatedDeal.addTag(tag));
        }
        if (request.updates.customFields) {
            Object.entries(request.updates.customFields).forEach(([key, value]) => {
                updatedDeal.setCustomField(key, value);
            });
        }
        if (request.updates.attachments) {
            const existingAttachments = updatedDeal.attachments;
            existingAttachments.forEach(attachment => updatedDeal.removeAttachment(attachment));
            request.updates.attachments.forEach(attachment => updatedDeal.addAttachment(attachment));
        }
        if (request.updates.competitors) {
            const existingCompetitors = updatedDeal.competitors;
            existingCompetitors.forEach(competitor => updatedDeal.removeCompetitor(competitor));
            request.updates.competitors.forEach(competitor => updatedDeal.addCompetitor(competitor));
        }
        if (request.updates.decisionMakers) {
            const existingDecisionMakers = updatedDeal.decisionMakers;
            existingDecisionMakers.forEach(decisionMaker => updatedDeal.removeDecisionMaker(decisionMaker));
            request.updates.decisionMakers.forEach(decisionMaker => updatedDeal.addDecisionMaker(decisionMaker));
        }
        if (request.updates.requirements) {
            const existingRequirements = updatedDeal.requirements;
            existingRequirements.forEach(requirement => updatedDeal.removeRequirement(requirement));
            request.updates.requirements.forEach(requirement => updatedDeal.addRequirement(requirement));
        }
        if (request.updates.objections) {
            const existingObjections = updatedDeal.objections;
            existingObjections.forEach(objection => updatedDeal.removeObjection(objection));
            request.updates.objections.forEach(objection => updatedDeal.addObjection(objection));
        }
        if (!updatedDeal.validate()) {
            throw createValidationError('Invalid deal data after update');
        }
        const savedDeal = await this.dealRepository.update(updatedDeal);
        return {
            success: true,
            data: {
                deal: savedDeal
            }
        };
    }
    async updateStage(id, organizationId, userId, stage) {
        return this.execute({
            id,
            organizationId,
            userId,
            updates: { stage }
        });
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
    async updateValue(id, organizationId, userId, value, currency) {
        return this.execute({
            id,
            organizationId,
            userId,
            updates: { value, currency }
        });
    }
    async updateProbability(id, organizationId, userId, probability) {
        return this.execute({
            id,
            organizationId,
            userId,
            updates: { probability }
        });
    }
    async setExpectedCloseDate(id, organizationId, userId, expectedCloseDate) {
        return this.execute({
            id,
            organizationId,
            userId,
            updates: { expectedCloseDate }
        });
    }
    async setNextStep(id, organizationId, userId, nextStep, nextStepDate) {
        return this.execute({
            id,
            organizationId,
            userId,
            updates: { nextStep, nextStepDate }
        });
    }
    async addTag(id, organizationId, userId, tag) {
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
    async removeTag(id, organizationId, userId, tag) {
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
    async addCompetitor(id, organizationId, userId, competitor) {
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
    async removeCompetitor(id, organizationId, userId, competitor) {
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
    async addDecisionMaker(id, organizationId, userId, decisionMaker) {
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
    async removeDecisionMaker(id, organizationId, userId, decisionMaker) {
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
//# sourceMappingURL=update-deal.use-case.js.map