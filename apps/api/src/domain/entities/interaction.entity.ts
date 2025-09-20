import { z } from 'zod';

// ============================================================================
// INTERACTION ENTITY
// ============================================================================

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

export type InteractionType = z.infer<typeof InteractionTypeSchema>;
export type InteractionStatus = z.infer<typeof InteractionStatusSchema>;
export type InteractionPriority = z.infer<typeof InteractionPrioritySchema>;

// ============================================================================
// INTERACTION ID TYPES
// ============================================================================

export type InteractionId = string;
export type OrganizationId = string;
export type ContactId = string;
export type CompanyId = string;
export type UserId = string;

// ============================================================================
// INTERACTION PROPS INTERFACE
// ============================================================================

export interface InteractionProps {
  id: InteractionId;
  organizationId: OrganizationId;
  contactId: ContactId;
  companyId?: CompanyId;
  userId: UserId;
  type: InteractionType;
  status: InteractionStatus;
  priority: InteractionPriority;
  subject: string;
  description?: string;
  scheduledAt?: Date;
  completedAt?: Date;
  duration?: number; // en minutos
  outcome?: string;
  nextAction?: string;
  nextActionDate?: Date;
  tags?: string[];
  customFields?: Record<string, any>;
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// INTERACTION ENTITY CLASS
// ============================================================================

export class Interaction {
  private props: InteractionProps;

  constructor(props: InteractionProps) {
    this.props = props;
  }

  // ========================================================================
  // GETTERS
  // ========================================================================

  get id(): InteractionId { return this.props.id; }
  get organizationId(): OrganizationId { return this.props.organizationId; }
  get contactId(): ContactId { return this.props.contactId; }
  get companyId(): CompanyId | undefined { return this.props.companyId; }
  get userId(): UserId { return this.props.userId; }
  get type(): InteractionType { return this.props.type; }
  get status(): InteractionStatus { return this.props.status; }
  get priority(): InteractionPriority { return this.props.priority; }
  get subject(): string { return this.props.subject; }
  get description(): string | undefined { return this.props.description; }
  get scheduledAt(): Date | undefined { return this.props.scheduledAt; }
  get completedAt(): Date | undefined { return this.props.completedAt; }
  get duration(): number | undefined { return this.props.duration; }
  get outcome(): string | undefined { return this.props.outcome; }
  get nextAction(): string | undefined { return this.props.nextAction; }
  get nextActionDate(): Date | undefined { return this.props.nextActionDate; }
  get tags(): string[] { return this.props.tags || []; }
  get customFields(): Record<string, any> { return this.props.customFields || {}; }
  get attachments(): string[] { return this.props.attachments || []; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  // ========================================================================
  // BUSINESS METHODS
  // ========================================================================

  updateStatus(status: InteractionStatus): void {
    this.props.status = status;
    this.props.updatedAt = new Date();
    
    if (status === 'COMPLETED') {
      this.props.completedAt = new Date();
    }
  }

  updatePriority(priority: InteractionPriority): void {
    this.props.priority = priority;
    this.props.updatedAt = new Date();
  }

  schedule(scheduledAt: Date): void {
    this.props.scheduledAt = scheduledAt;
    this.props.status = 'SCHEDULED';
    this.props.updatedAt = new Date();
  }

  complete(outcome?: string, duration?: number): void {
    this.props.status = 'COMPLETED';
    this.props.completedAt = new Date();
    this.props.outcome = outcome;
    this.props.duration = duration;
    this.props.updatedAt = new Date();
  }

  setNextAction(action: string, date?: Date): void {
    this.props.nextAction = action;
    this.props.nextActionDate = date;
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

  // ========================================================================
  // VALIDATION METHODS
  // ========================================================================

  validate(): boolean {
    return (
      this.props.id.length > 0 &&
      this.props.organizationId.length > 0 &&
      this.props.contactId.length > 0 &&
      this.props.userId.length > 0 &&
      this.props.subject.length > 0 &&
      this.props.subject.length <= 200 &&
      (!this.props.description || this.props.description.length <= 1000) &&
      (!this.props.outcome || this.props.outcome.length <= 1000) &&
      (!this.props.nextAction || this.props.nextAction.length <= 500)
    );
  }

  // ========================================================================
  // UTILITY METHODS
  // ========================================================================

  toJSON(): InteractionProps {
    return { ...this.props };
  }

  static fromJSON(data: InteractionProps): Interaction {
    return new Interaction(data);
  }

  // ========================================================================
  // FACTORY METHODS
  // ========================================================================

  static create(props: Omit<InteractionProps, 'id' | 'createdAt' | 'updatedAt'>): Interaction {
    const now = new Date();
    return new Interaction({
      ...props,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now
    });
  }

  static createScheduled(
    organizationId: OrganizationId,
    contactId: ContactId,
    userId: UserId,
    type: InteractionType,
    subject: string,
    scheduledAt: Date,
    companyId?: CompanyId
  ): Interaction {
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

  static createTask(
    organizationId: OrganizationId,
    contactId: ContactId,
    userId: UserId,
    subject: string,
    description?: string,
    priority: InteractionPriority = 'MEDIUM',
    companyId?: CompanyId
  ): Interaction {
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

  static createNote(
    organizationId: OrganizationId,
    contactId: ContactId,
    userId: UserId,
    subject: string,
    description: string,
    companyId?: CompanyId
  ): Interaction {
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

  static createFollowUp(
    organizationId: OrganizationId,
    contactId: ContactId,
    userId: UserId,
    subject: string,
    nextActionDate: Date,
    companyId?: CompanyId
  ): Interaction {
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
