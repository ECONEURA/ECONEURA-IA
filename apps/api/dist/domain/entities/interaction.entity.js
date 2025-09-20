import { z } from 'zod';
export const InteractionTypeSchema = z.enum([
    'EMAIL',
    'PHONE',
    'MEETING',
    'NOTE',
    'TASK',
    'CALL',
    'DEMO',
    'PROPOSAL',
    'FOLLOW_UP',
    'OTHER'
]);
export const InteractionStatusSchema = z.enum([
    'SCHEDULED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED',
    'RESCHEDULED'
]);
export const InteractionPrioritySchema = z.enum([
    'LOW',
    'MEDIUM',
    'HIGH',
    'URGENT'
]);
export class Interaction {
    props;
    constructor(props) {
        this.props = props;
    }
    get id() { return this.props.id; }
    get organizationId() { return this.props.organizationId; }
    get contactId() { return this.props.contactId; }
    get companyId() { return this.props.companyId; }
    get userId() { return this.props.userId; }
    get type() { return this.props.type; }
    get status() { return this.props.status; }
    get priority() { return this.props.priority; }
    get subject() { return this.props.subject; }
    get description() { return this.props.description; }
    get scheduledAt() { return this.props.scheduledAt; }
    get completedAt() { return this.props.completedAt; }
    get duration() { return this.props.duration; }
    get outcome() { return this.props.outcome; }
    get nextAction() { return this.props.nextAction; }
    get nextActionDate() { return this.props.nextActionDate; }
    get tags() { return this.props.tags || []; }
    get customFields() { return this.props.customFields || {}; }
    get attachments() { return this.props.attachments || []; }
    get createdAt() { return this.props.createdAt; }
    get updatedAt() { return this.props.updatedAt; }
    updateStatus(status) {
        this.props.status = status;
        this.props.updatedAt = new Date();
        if (status === 'COMPLETED') {
            this.props.completedAt = new Date();
        }
    }
    updatePriority(priority) {
        this.props.priority = priority;
        this.props.updatedAt = new Date();
    }
    schedule(scheduledAt) {
        this.props.scheduledAt = scheduledAt;
        this.props.status = 'SCHEDULED';
        this.props.updatedAt = new Date();
    }
    complete(outcome, duration) {
        this.props.status = 'COMPLETED';
        this.props.completedAt = new Date();
        this.props.outcome = outcome;
        this.props.duration = duration;
        this.props.updatedAt = new Date();
    }
    setNextAction(action, date) {
        this.props.nextAction = action;
        this.props.nextActionDate = date;
        this.props.updatedAt = new Date();
    }
    addTag(tag) {
        if (!this.props.tags) {
            this.props.tags = [];
        }
        if (!this.props.tags.includes(tag)) {
            this.props.tags.push(tag);
            this.props.updatedAt = new Date();
        }
    }
    removeTag(tag) {
        if (this.props.tags) {
            this.props.tags = this.props.tags.filter(t => t !== tag);
            this.props.updatedAt = new Date();
        }
    }
    setCustomField(key, value) {
        if (!this.props.customFields) {
            this.props.customFields = {};
        }
        this.props.customFields[key] = value;
        this.props.updatedAt = new Date();
    }
    removeCustomField(key) {
        if (this.props.customFields) {
            delete this.props.customFields[key];
            this.props.updatedAt = new Date();
        }
    }
    addAttachment(attachment) {
        if (!this.props.attachments) {
            this.props.attachments = [];
        }
        if (!this.props.attachments.includes(attachment)) {
            this.props.attachments.push(attachment);
            this.props.updatedAt = new Date();
        }
    }
    removeAttachment(attachment) {
        if (this.props.attachments) {
            this.props.attachments = this.props.attachments.filter(a => a !== attachment);
            this.props.updatedAt = new Date();
        }
    }
    validate() {
        return (this.props.id.length > 0 &&
            this.props.organizationId.length > 0 &&
            this.props.contactId.length > 0 &&
            this.props.userId.length > 0 &&
            this.props.subject.length > 0 &&
            this.props.subject.length <= 200 &&
            (!this.props.description || this.props.description.length <= 1000) &&
            (!this.props.outcome || this.props.outcome.length <= 1000) &&
            (!this.props.nextAction || this.props.nextAction.length <= 500));
    }
    toJSON() {
        return { ...this.props };
    }
    static fromJSON(data) {
        return new Interaction(data);
    }
    static create(props) {
        const now = new Date();
        return new Interaction({
            ...props,
            id: crypto.randomUUID(),
            createdAt: now,
            updatedAt: now
        });
    }
    static createScheduled(organizationId, contactId, userId, type, subject, scheduledAt, companyId) {
        return Interaction.create({
            organizationId,
            contactId,
            companyId,
            userId,
            type,
            status: 'SCHEDULED',
            priority: 'MEDIUM',
            subject,
            scheduledAt
        });
    }
    static createTask(organizationId, contactId, userId, subject, description, priority = 'MEDIUM', companyId) {
        return Interaction.create({
            organizationId,
            contactId,
            companyId,
            userId,
            type: 'TASK',
            status: 'IN_PROGRESS',
            priority,
            subject,
            description
        });
    }
    static createNote(organizationId, contactId, userId, subject, description, companyId) {
        return Interaction.create({
            organizationId,
            contactId,
            companyId,
            userId,
            type: 'NOTE',
            status: 'COMPLETED',
            priority: 'LOW',
            subject,
            description,
            completedAt: new Date()
        });
    }
    static createFollowUp(organizationId, contactId, userId, subject, nextActionDate, companyId) {
        return Interaction.create({
            organizationId,
            contactId,
            companyId,
            userId,
            type: 'FOLLOW_UP',
            status: 'SCHEDULED',
            priority: 'MEDIUM',
            subject,
            scheduledAt: nextActionDate
        });
    }
}
//# sourceMappingURL=interaction.entity.js.map