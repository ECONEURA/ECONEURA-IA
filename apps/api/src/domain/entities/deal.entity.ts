import { z } from 'zod';

// ============================================================================
// DEAL ENTITY
// ============================================================================

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

export type DealStage = z.infer<typeof DealStageSchema>;
export type DealStatus = z.infer<typeof DealStatusSchema>;
export type DealPriority = z.infer<typeof DealPrioritySchema>;
export type DealSource = z.infer<typeof DealSourceSchema>;

// ============================================================================
// DEAL ID TYPES
// ============================================================================

export type DealId = string;
export type OrganizationId = string;
export type ContactId = string;
export type CompanyId = string;
export type UserId = string;

// ============================================================================
// DEAL PROPS INTERFACE
// ============================================================================

export interface DealProps {
  id: DealId;
  organizationId: OrganizationId;
  contactId: ContactId;
  companyId?: CompanyId;
  userId: UserId;
  name: string;
  description?: string;
  stage: DealStage;
  status: DealStatus;
  priority: DealPriority;
  source: DealSource;
  value: number;
  currency: string;
  probability: number; // 0-100
  expectedCloseDate?: Date;
  actualCloseDate?: Date;
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
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// DEAL ENTITY CLASS
// ============================================================================

export class Deal {
  private props: DealProps;

  constructor(props: DealProps) {
    this.props = props;
  }

  // ========================================================================
  // GETTERS
  // ========================================================================

  get id(): DealId { return this.props.id; }
  get organizationId(): OrganizationId { return this.props.organizationId; }
  get contactId(): ContactId { return this.props.contactId; }
  get companyId(): CompanyId | undefined { return this.props.companyId; }
  get userId(): UserId { return this.props.userId; }
  get name(): string { return this.props.name; }
  get description(): string | undefined { return this.props.description; }
  get stage(): DealStage { return this.props.stage; }
  get status(): DealStatus { return this.props.status; }
  get priority(): DealPriority { return this.props.priority; }
  get source(): DealSource { return this.props.source; }
  get value(): number { return this.props.value; }
  get currency(): string { return this.props.currency; }
  get probability(): number { return this.props.probability; }
  get expectedCloseDate(): Date | undefined { return this.props.expectedCloseDate; }
  get actualCloseDate(): Date | undefined { return this.props.actualCloseDate; }
  get nextStep(): string | undefined { return this.props.nextStep; }
  get nextStepDate(): Date | undefined { return this.props.nextStepDate; }
  get tags(): string[] { return this.props.tags || []; }
  get customFields(): Record<string, any> { return this.props.customFields || {}; }
  get attachments(): string[] { return this.props.attachments || []; }
  get notes(): string | undefined { return this.props.notes; }
  get competitors(): string[] { return this.props.competitors || []; }
  get decisionMakers(): string[] { return this.props.decisionMakers || []; }
  get budget(): number | undefined { return this.props.budget; }
  get timeline(): string | undefined { return this.props.timeline; }
  get requirements(): string[] { return this.props.requirements || []; }
  get objections(): string[] { return this.props.objections || []; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  // ========================================================================
  // BUSINESS METHODS
  // ========================================================================

  updateStage(stage: DealStage): void {
    this.props.stage = stage;
    this.props.updatedAt = new Date();
    
    // Update status based on stage
    if (stage === 'CLOSED_WON') {
      this.props.status = 'WON';
      this.props.actualCloseDate = new Date();
    } else if (stage === 'CLOSED_LOST') {
      this.props.status = 'LOST';
      this.props.actualCloseDate = new Date();
    } else if (stage === 'ON_HOLD') {
      this.props.status = 'ON_HOLD';
    } else if (stage === 'CANCELLED') {
      this.props.status = 'CANCELLED';
    } else {
      this.props.status = 'ACTIVE';
    }
  }

  updateStatus(status: DealStatus): void {
    this.props.status = status;
    this.props.updatedAt = new Date();
    
    if (status === 'WON' || status === 'LOST') {
      this.props.actualCloseDate = new Date();
    }
  }

  updatePriority(priority: DealPriority): void {
    this.props.priority = priority;
    this.props.updatedAt = new Date();
  }

  updateValue(value: number, currency?: string): void {
    this.props.value = value;
    if (currency) {
      this.props.currency = currency;
    }
    this.props.updatedAt = new Date();
  }

  updateProbability(probability: number): void {
    if (probability < 0 || probability > 100) {
      throw new Error('Probability must be between 0 and 100');
    }
    this.props.probability = probability;
    this.props.updatedAt = new Date();
  }

  setExpectedCloseDate(date: Date): void {
    this.props.expectedCloseDate = date;
    this.props.updatedAt = new Date();
  }

  setNextStep(step: string, date?: Date): void {
    this.props.nextStep = step;
    this.props.nextStepDate = date;
    this.props.updatedAt = new Date();
  }

  addTag(tag: string): void {
    if (!this.props.tags) {
      this.props.tags = [];
    }
    if (!this.props.tags.includes(tag)) {
      this.props.tags.push(tag);
      this.props.updatedAt = new Date();
    }
  }

  removeTag(tag: string): void {
    if (this.props.tags) {
      this.props.tags = this.props.tags.filter(t => t !== tag);
      this.props.updatedAt = new Date();
    }
  }

  setCustomField(key: string, value: any): void {
    if (!this.props.customFields) {
      this.props.customFields = {};
    }
    this.props.customFields[key] = value;
    this.props.updatedAt = new Date();
  }

  removeCustomField(key: string): void {
    if (this.props.customFields) {
      delete this.props.customFields[key];
      this.props.updatedAt = new Date();
    }
  }

  addAttachment(attachment: string): void {
    if (!this.props.attachments) {
      this.props.attachments = [];
    }
    if (!this.props.attachments.includes(attachment)) {
      this.props.attachments.push(attachment);
      this.props.updatedAt = new Date();
    }
  }

  removeAttachment(attachment: string): void {
    if (this.props.attachments) {
      this.props.attachments = this.props.attachments.filter(a => a !== attachment);
      this.props.updatedAt = new Date();
    }
  }

  addCompetitor(competitor: string): void {
    if (!this.props.competitors) {
      this.props.competitors = [];
    }
    if (!this.props.competitors.includes(competitor)) {
      this.props.competitors.push(competitor);
      this.props.updatedAt = new Date();
    }
  }

  removeCompetitor(competitor: string): void {
    if (this.props.competitors) {
      this.props.competitors = this.props.competitors.filter(c => c !== competitor);
      this.props.updatedAt = new Date();
    }
  }

  addDecisionMaker(decisionMaker: string): void {
    if (!this.props.decisionMakers) {
      this.props.decisionMakers = [];
    }
    if (!this.props.decisionMakers.includes(decisionMaker)) {
      this.props.decisionMakers.push(decisionMaker);
      this.props.updatedAt = new Date();
    }
  }

  removeDecisionMaker(decisionMaker: string): void {
    if (this.props.decisionMakers) {
      this.props.decisionMakers = this.props.decisionMakers.filter(d => d !== decisionMaker);
      this.props.updatedAt = new Date();
    }
  }

  addRequirement(requirement: string): void {
    if (!this.props.requirements) {
      this.props.requirements = [];
    }
    if (!this.props.requirements.includes(requirement)) {
      this.props.requirements.push(requirement);
      this.props.updatedAt = new Date();
    }
  }

  removeRequirement(requirement: string): void {
    if (this.props.requirements) {
      this.props.requirements = this.props.requirements.filter(r => r !== requirement);
      this.props.updatedAt = new Date();
    }
  }

  addObjection(objection: string): void {
    if (!this.props.objections) {
      this.props.objections = [];
    }
    if (!this.props.objections.includes(objection)) {
      this.props.objections.push(objection);
      this.props.updatedAt = new Date();
    }
  }

  removeObjection(objection: string): void {
    if (this.props.objections) {
      this.props.objections = this.props.objections.filter(o => o !== objection);
      this.props.updatedAt = new Date();
    }
  }

  // ========================================================================
  // VALIDATION METHODS
  // ========================================================================

  validate(): boolean {
    return (
      this.props.id.length > 0 &&
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
      (!this.props.notes || this.props.notes.length <= 2000)
    );
  }

  // ========================================================================
  // UTILITY METHODS
  // ========================================================================

  toJSON(): DealProps {
    return { ...this.props };
  }

  static fromJSON(data: DealProps): Deal {
    return new Deal(data);
  }

  // ========================================================================
  // FACTORY METHODS
  // ========================================================================

  static create(props: Omit<DealProps, 'id' | 'createdAt' | 'updatedAt'>): Deal {
    const now = new Date();
    return new Deal({
      ...props,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now
    });
  }

  static createLead(
    organizationId: OrganizationId,
    contactId: ContactId,
    userId: UserId,
    name: string,
    value: number,
    currency: string = 'USD',
    source: DealSource = 'WEBSITE',
    companyId?: CompanyId
  ): Deal {
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

  static createQualified(
    organizationId: OrganizationId,
    contactId: ContactId,
    userId: UserId,
    name: string,
    value: number,
    currency: string = 'USD',
    source: DealSource = 'WEBSITE',
    companyId?: CompanyId
  ): Deal {
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

  static createProposal(
    organizationId: OrganizationId,
    contactId: ContactId,
    userId: UserId,
    name: string,
    value: number,
    currency: string = 'USD',
    source: DealSource = 'WEBSITE',
    companyId?: CompanyId
  ): Deal {
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

  static createNegotiation(
    organizationId: OrganizationId,
    contactId: ContactId,
    userId: UserId,
    name: string,
    value: number,
    currency: string = 'USD',
    source: DealSource = 'WEBSITE',
    companyId?: CompanyId
  ): Deal {
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

  // ========================================================================
  // BUSINESS LOGIC METHODS
  // ========================================================================

  isWon(): boolean {
    return this.props.status === 'WON' || this.props.stage === 'CLOSED_WON';
  }

  isLost(): boolean {
    return this.props.status === 'LOST' || this.props.stage === 'CLOSED_LOST';
  }

  isActive(): boolean {
    return this.props.status === 'ACTIVE';
  }

  isOnHold(): boolean {
    return this.props.status === 'ON_HOLD' || this.props.stage === 'ON_HOLD';
  }

  isCancelled(): boolean {
    return this.props.status === 'CANCELLED' || this.props.stage === 'CANCELLED';
  }

  isClosed(): boolean {
    return this.isWon() || this.isLost() || this.isCancelled();
  }

  getWeightedValue(): number {
    return this.props.value * (this.props.probability / 100);
  }

  getDaysToClose(): number | null {
    if (!this.props.expectedCloseDate) {
      return null;
    }
    const now = new Date();
    const diffTime = this.props.expectedCloseDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  isOverdue(): boolean {
    if (!this.props.expectedCloseDate) {
      return false;
    }
    return this.props.expectedCloseDate < new Date() && !this.isClosed();
  }

  getStageProgress(): number {
    const stageOrder = ['LEAD', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON'];
    const currentIndex = stageOrder.indexOf(this.props.stage);
    return currentIndex >= 0 ? (currentIndex + 1) / stageOrder.length * 100 : 0;
  }
}
