import { z } from 'zod';
export const DealStageSchema = z.enum([
    'LEAD',
    'QUALIFIED',
    'PROPOSAL',
    'NEGOTIATION',
    'CLOSED_WON',
    'CLOSED_LOST',
    'ON_HOLD',
    'CANCELLED'
]);
export const DealStatusSchema = z.enum([
    'ACTIVE',
    'WON',
    'LOST',
    'ON_HOLD',
    'CANCELLED'
]);
export const DealPrioritySchema = z.enum([
    'LOW',
    'MEDIUM',
    'HIGH',
    'URGENT'
]);
export const DealSourceSchema = z.enum([
    'WEBSITE',
    'EMAIL',
    'PHONE',
    'REFERRAL',
    'SOCIAL_MEDIA',
    'ADVERTISING',
    'TRADE_SHOW',
    'PARTNER',
    'OTHER'
]);
export class Deal {
    props;
    constructor(props) {
        this.props = props;
    }
    get id() { return this.props.id; }
    get organizationId() { return this.props.organizationId; }
    get contactId() { return this.props.contactId; }
    get companyId() { return this.props.companyId; }
    get userId() { return this.props.userId; }
    get name() { return this.props.name; }
    get description() { return this.props.description; }
    get stage() { return this.props.stage; }
    get status() { return this.props.status; }
    get priority() { return this.props.priority; }
    get source() { return this.props.source; }
    get value() { return this.props.value; }
    get currency() { return this.props.currency; }
    get probability() { return this.props.probability; }
    get expectedCloseDate() { return this.props.expectedCloseDate; }
    get actualCloseDate() { return this.props.actualCloseDate; }
    get nextStep() { return this.props.nextStep; }
    get nextStepDate() { return this.props.nextStepDate; }
    get tags() { return this.props.tags || []; }
    get customFields() { return this.props.customFields || {}; }
    get attachments() { return this.props.attachments || []; }
    get notes() { return this.props.notes; }
    get competitors() { return this.props.competitors || []; }
    get decisionMakers() { return this.props.decisionMakers || []; }
    get budget() { return this.props.budget; }
    get timeline() { return this.props.timeline; }
    get requirements() { return this.props.requirements || []; }
    get objections() { return this.props.objections || []; }
    get createdAt() { return this.props.createdAt; }
    get updatedAt() { return this.props.updatedAt; }
    updateStage(stage) {
        this.props.stage = stage;
        this.props.updatedAt = new Date();
        if (stage === 'CLOSED_WON') {
            this.props.status = 'WON';
            this.props.actualCloseDate = new Date();
        }
        else if (stage === 'CLOSED_LOST') {
            this.props.status = 'LOST';
            this.props.actualCloseDate = new Date();
        }
        else if (stage === 'ON_HOLD') {
            this.props.status = 'ON_HOLD';
        }
        else if (stage === 'CANCELLED') {
            this.props.status = 'CANCELLED';
        }
        else {
            this.props.status = 'ACTIVE';
        }
    }
    updateStatus(status) {
        this.props.status = status;
        this.props.updatedAt = new Date();
        if (status === 'WON' || status === 'LOST') {
            this.props.actualCloseDate = new Date();
        }
    }
    updatePriority(priority) {
        this.props.priority = priority;
        this.props.updatedAt = new Date();
    }
    updateValue(value, currency) {
        this.props.value = value;
        if (currency) {
            this.props.currency = currency;
        }
        this.props.updatedAt = new Date();
    }
    updateProbability(probability) {
        if (probability < 0 || probability > 100) {
            throw new Error('Probability must be between 0 and 100');
        }
        this.props.probability = probability;
        this.props.updatedAt = new Date();
    }
    setExpectedCloseDate(date) {
        this.props.expectedCloseDate = date;
        this.props.updatedAt = new Date();
    }
    setNextStep(step, date) {
        this.props.nextStep = step;
        this.props.nextStepDate = date;
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
    addCompetitor(competitor) {
        if (!this.props.competitors) {
            this.props.competitors = [];
        }
        if (!this.props.competitors.includes(competitor)) {
            this.props.competitors.push(competitor);
            this.props.updatedAt = new Date();
        }
    }
    removeCompetitor(competitor) {
        if (this.props.competitors) {
            this.props.competitors = this.props.competitors.filter(c => c !== competitor);
            this.props.updatedAt = new Date();
        }
    }
    addDecisionMaker(decisionMaker) {
        if (!this.props.decisionMakers) {
            this.props.decisionMakers = [];
        }
        if (!this.props.decisionMakers.includes(decisionMaker)) {
            this.props.decisionMakers.push(decisionMaker);
            this.props.updatedAt = new Date();
        }
    }
    removeDecisionMaker(decisionMaker) {
        if (this.props.decisionMakers) {
            this.props.decisionMakers = this.props.decisionMakers.filter(d => d !== decisionMaker);
            this.props.updatedAt = new Date();
        }
    }
    addRequirement(requirement) {
        if (!this.props.requirements) {
            this.props.requirements = [];
        }
        if (!this.props.requirements.includes(requirement)) {
            this.props.requirements.push(requirement);
            this.props.updatedAt = new Date();
        }
    }
    removeRequirement(requirement) {
        if (this.props.requirements) {
            this.props.requirements = this.props.requirements.filter(r => r !== requirement);
            this.props.updatedAt = new Date();
        }
    }
    addObjection(objection) {
        if (!this.props.objections) {
            this.props.objections = [];
        }
        if (!this.props.objections.includes(objection)) {
            this.props.objections.push(objection);
            this.props.updatedAt = new Date();
        }
    }
    removeObjection(objection) {
        if (this.props.objections) {
            this.props.objections = this.props.objections.filter(o => o !== objection);
            this.props.updatedAt = new Date();
        }
    }
    validate() {
        return (this.props.id.length > 0 &&
            this.props.organizationId.length > 0 &&
            this.props.contactId.length > 0 &&
            this.props.userId.length > 0 &&
            this.props.name.length > 0 &&
            this.props.name.length <= 200 &&
            (!this.props.description || this.props.description.length <= 1000) &&
            this.props.value >= 0 &&
            this.props.probability >= 0 &&
            this.props.probability <= 100 &&
            (!this.props.nextStep || this.props.nextStep.length <= 500) &&
            (!this.props.notes || this.props.notes.length <= 2000));
    }
    toJSON() {
        return { ...this.props };
    }
    static fromJSON(data) {
        return new Deal(data);
    }
    static create(props) {
        const now = new Date();
        return new Deal({
            ...props,
            id: crypto.randomUUID(),
            createdAt: now,
            updatedAt: now
        });
    }
    static createLead(organizationId, contactId, userId, name, value, currency = 'USD', source = 'WEBSITE', companyId) {
        return Deal.create({
            organizationId,
            contactId,
            companyId,
            userId,
            name,
            stage: 'LEAD',
            status: 'ACTIVE',
            priority: 'MEDIUM',
            source,
            value,
            currency,
            probability: 10
        });
    }
    static createQualified(organizationId, contactId, userId, name, value, currency = 'USD', source = 'WEBSITE', companyId) {
        return Deal.create({
            organizationId,
            contactId,
            companyId,
            userId,
            name,
            stage: 'QUALIFIED',
            status: 'ACTIVE',
            priority: 'MEDIUM',
            source,
            value,
            currency,
            probability: 25
        });
    }
    static createProposal(organizationId, contactId, userId, name, value, currency = 'USD', source = 'WEBSITE', companyId) {
        return Deal.create({
            organizationId,
            contactId,
            companyId,
            userId,
            name,
            stage: 'PROPOSAL',
            status: 'ACTIVE',
            priority: 'HIGH',
            source,
            value,
            currency,
            probability: 50
        });
    }
    static createNegotiation(organizationId, contactId, userId, name, value, currency = 'USD', source = 'WEBSITE', companyId) {
        return Deal.create({
            organizationId,
            contactId,
            companyId,
            userId,
            name,
            stage: 'NEGOTIATION',
            status: 'ACTIVE',
            priority: 'HIGH',
            source,
            value,
            currency,
            probability: 75
        });
    }
    isWon() {
        return this.props.status === 'WON' || this.props.stage === 'CLOSED_WON';
    }
    isLost() {
        return this.props.status === 'LOST' || this.props.stage === 'CLOSED_LOST';
    }
    isActive() {
        return this.props.status === 'ACTIVE';
    }
    isOnHold() {
        return this.props.status === 'ON_HOLD' || this.props.stage === 'ON_HOLD';
    }
    isCancelled() {
        return this.props.status === 'CANCELLED' || this.props.stage === 'CANCELLED';
    }
    isClosed() {
        return this.isWon() || this.isLost() || this.isCancelled();
    }
    getWeightedValue() {
        return this.props.value * (this.props.probability / 100);
    }
    getDaysToClose() {
        if (!this.props.expectedCloseDate) {
            return null;
        }
        const now = new Date();
        const diffTime = this.props.expectedCloseDate.getTime() - now.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    isOverdue() {
        if (!this.props.expectedCloseDate) {
            return false;
        }
        return this.props.expectedCloseDate < new Date() && !this.isClosed();
    }
    getStageProgress() {
        const stageOrder = ['LEAD', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON'];
        const currentIndex = stageOrder.indexOf(this.props.stage);
        return currentIndex >= 0 ? (currentIndex + 1) / stageOrder.length * 100 : 0;
    }
}
//# sourceMappingURL=deal.entity.js.map