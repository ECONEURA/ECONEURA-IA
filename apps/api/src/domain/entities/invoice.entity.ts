import { Money } from '../value-objects/money.vo.js';

import { BaseEntity, BaseEntityProps } from './base.entity.js';


// ============================================================================
// INVOICE ENTITY
// ============================================================================

export interface InvoiceId {
  value: string;
}

export interface InvoiceNumber {
  value: string;
}

export interface InvoiceType {
  value: 'invoice' | 'credit_note' | 'debit_note' | 'proforma' | 'quote' | 'receipt';
}

export interface InvoiceStatus {
  value: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled' | 'refunded' | 'partially_paid';
}

export interface InvoicePaymentStatus {
  value: 'pending' | 'paid' | 'partial' | 'overdue' | 'cancelled';
}

export interface InvoicePaymentMethod {
  value: 'cash' | 'credit_card' | 'bank_transfer' | 'check' | 'paypal' | 'stripe' | 'other';
}

export interface InvoiceItem {
  id: string;
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: Money;
  totalPrice: Money;
  taxRate?: number;
  taxAmount?: Money;
  discountRate?: number;
  discountAmount?: Money;
  notes?: string;
}

export interface InvoiceSettings {
  currency: string;
  taxInclusive: boolean;
  defaultTaxRate: number;
  paymentTerms: number; // days
  lateFeeRate?: number;
  lateFeeAmount?: Money;
  notes?: string;
  footer?: string;
  customFields: Record<string, any>;
  tags: string[];
}

export interface InvoiceProps extends BaseEntityProps {
  invoiceNumber: InvoiceNumber;
  type: InvoiceType;
  status: InvoiceStatus;
  paymentStatus: InvoicePaymentStatus;
  companyId: string;
  contactId?: string;
  issueDate: Date;
  dueDate: Date;
  paidDate?: Date;
  subtotal: Money;
  taxAmount: Money;
  discountAmount: Money;
  totalAmount: Money;
  paidAmount: Money;
  balanceAmount: Money;
  items: InvoiceItem[];
  paymentMethod?: InvoicePaymentMethod;
  reference?: string;
  notes?: string;
  settings: InvoiceSettings;
  attachments?: string[];
}

export class Invoice extends BaseEntity {
  private constructor(private props: InvoiceProps) {
    super(props);
  }

  // ========================================================================
  // FACTORY METHODS
  // ========================================================================

  static create(props: Omit<InvoiceProps, 'id' | 'createdAt' | 'updatedAt'>): Invoice {
    const now = new Date();
    return new Invoice({
      ...props,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromJSON(data: InvoiceProps): Invoice {
    return new Invoice(data);
  }

  // ========================================================================
  // GETTERS
  // ========================================================================

  get invoiceNumber(): InvoiceNumber { return this.props.invoiceNumber; }
  get type(): InvoiceType { return this.props.type; }
  get status(): InvoiceStatus { return this.props.status; }
  get paymentStatus(): InvoicePaymentStatus { return this.props.paymentStatus; }
  get companyId(): string { return this.props.companyId; }
  get contactId(): string | undefined { return this.props.contactId; }
  get issueDate(): Date { return this.props.issueDate; }
  get dueDate(): Date { return this.props.dueDate; }
  get paidDate(): Date | undefined { return this.props.paidDate; }
  get subtotal(): Money { return this.props.subtotal; }
  get taxAmount(): Money { return this.props.taxAmount; }
  get discountAmount(): Money { return this.props.discountAmount; }
  get totalAmount(): Money { return this.props.totalAmount; }
  get paidAmount(): Money { return this.props.paidAmount; }
  get balanceAmount(): Money { return this.props.balanceAmount; }
  get items(): InvoiceItem[] { return this.props.items; }
  get paymentMethod(): InvoicePaymentMethod | undefined { return this.props.paymentMethod; }
  get reference(): string | undefined { return this.props.reference; }
  get notes(): string | undefined { return this.props.notes; }
  get settings(): InvoiceSettings { return this.props.settings; }
  get attachments(): string[] | undefined { return this.props.attachments; }

  // ========================================================================
  // BUSINESS METHODS
  // ========================================================================

  updateInvoiceNumber(invoiceNumber: string): void {
    if (!invoiceNumber || invoiceNumber.trim().length === 0) {
      throw new Error('Invoice number cannot be empty');
    }
    this.props.invoiceNumber = invoiceNumber.trim();
    this.updateTimestamp();
  }

  updateType(type: InvoiceType): void {
    this.props.type = type;
    this.updateTimestamp();
  }

  updateStatus(status: InvoiceStatus): void {
    this.props.status = status;
    this.updateTimestamp();
  }

  updatePaymentStatus(paymentStatus: InvoicePaymentStatus): void {
    this.props.paymentStatus = paymentStatus;
    this.updateTimestamp();
  }

  updateCompanyId(companyId: string): void {
    if (!companyId || companyId.trim().length === 0) {
      throw new Error('Company ID cannot be empty');
    }
    this.props.companyId = companyId.trim();
    this.updateTimestamp();
  }

  updateContactId(contactId: string): void {
    this.props.contactId = contactId;
    this.updateTimestamp();
  }

  updateIssueDate(issueDate: Date): void {
    this.props.issueDate = issueDate;
    this.updateTimestamp();
  }

  updateDueDate(dueDate: Date): void {
    this.props.dueDate = dueDate;
    this.updateTimestamp();
  }

  updatePaidDate(paidDate: Date): void {
    this.props.paidDate = paidDate;
    this.updateTimestamp();
  }

  addItem(item: InvoiceItem): void {
    this.props.items.push(item);
    this.recalculateTotals();
    this.updateTimestamp();
  }

  removeItem(itemId: string): void {
    this.props.items = this.props.items.filter(item => item.id !== itemId);
    this.recalculateTotals();
    this.updateTimestamp();
  }

  updateItem(itemId: string, updates: Partial<InvoiceItem>): void {
    const itemIndex = this.props.items.findIndex(item => item.id === itemId);
    if (itemIndex !== -1) {
      this.props.items[itemIndex] = { ...this.props.items[itemIndex], ...updates };
      this.recalculateTotals();
      this.updateTimestamp();
    }
  }

  updatePaymentMethod(paymentMethod: InvoicePaymentMethod): void {
    this.props.paymentMethod = paymentMethod;
    this.updateTimestamp();
  }

  updateReference(reference: string): void {
    this.props.reference = reference;
    this.updateTimestamp();
  }

  updateNotes(notes: string): void {
    this.props.notes = notes;
    this.updateTimestamp();
  }

  updateSettings(settings: InvoiceSettings): void {
    this.props.settings = settings;
    this.updateTimestamp();
  }

  addAttachment(attachmentUrl: string): void {
    if (!this.props.attachments) {
      this.props.attachments = [];
    }
    if (!this.props.attachments.includes(attachmentUrl)) {
      this.props.attachments.push(attachmentUrl);
      this.updateTimestamp();
    }
  }

  removeAttachment(attachmentUrl: string): void {
    if (this.props.attachments) {
      this.props.attachments = this.props.attachments.filter(url => url !== attachmentUrl);
      this.updateTimestamp();
    }
  }

  recordPayment(amount: Money, paymentMethod: InvoicePaymentMethod, paidDate?: Date): void {
    this.props.paidAmount = Money.create(
      this.props.paidAmount.amount + amount.amount,
      this.props.paidAmount.currency
    );
    this.props.paymentMethod = paymentMethod;
    
    if (paidDate) {
      this.props.paidDate = paidDate;
    }

    this.updatePaymentStatus();
    this.updateTimestamp();
  }

  applyDiscount(discountAmount: Money): void {
    this.props.discountAmount = Money.create(
      this.props.discountAmount.amount + discountAmount.amount,
      this.props.discountAmount.currency
    );
    this.recalculateTotals();
    this.updateTimestamp();
  }

  // ========================================================================
  // PRIVATE METHODS
  // ========================================================================

  private recalculateTotals(): void {
    // Calculate subtotal
    const subtotal = this.props.items.reduce((sum, item) => {
      return sum + item.totalPrice.amount;
    }, 0);

    this.props.subtotal = Money.create(subtotal, this.props.settings.currency);

    // Calculate tax amount
    const taxAmount = this.props.items.reduce((sum, item) => {
      return sum + (item.taxAmount?.amount || 0);
    }, 0);

    this.props.taxAmount = Money.create(taxAmount, this.props.settings.currency);

    // Calculate total amount
    const totalAmount = subtotal + taxAmount - this.props.discountAmount.amount;
    this.props.totalAmount = Money.create(totalAmount, this.props.settings.currency);

    // Calculate balance amount
    const balanceAmount = totalAmount - this.props.paidAmount.amount;
    this.props.balanceAmount = Money.create(balanceAmount, this.props.settings.currency);
  }

  private updatePaymentStatus(): void {
    if (this.props.paidAmount.amount >= this.props.totalAmount.amount) {
      this.props.paymentStatus = 'paid';
      this.props.status = 'paid';
    } else if (this.props.paidAmount.amount > 0) {
      this.props.paymentStatus = 'partial';
    } else {
      this.props.paymentStatus = 'pending';
    }
  }

  // ========================================================================
  // VALIDATION METHODS
  // ========================================================================

  validate(): boolean {
    if (!this.validateBase()) {
      return false;
    }

    if (!this.props.invoiceNumber || !this.props.invoiceNumber.value) {
      return false;
    }

    if (!this.props.companyId || this.props.companyId.trim().length === 0) {
      return false;
    }

    if (!this.props.items || this.props.items.length === 0) {
      return false;
    }

    if (this.props.issueDate > this.props.dueDate) {
      return false;
    }

    return true;
  }

  // ========================================================================
  // UTILITY METHODS
  // ========================================================================

  toJSON(): InvoiceProps {
    return { ...this.props };
  }

  clone(): Invoice {
    return Invoice.fromJSON(this.toJSON());
  }

  // ========================================================================
  // BUSINESS LOGIC METHODS
  // ========================================================================

  isOverdue(): boolean {
    const now = new Date();
    return now > this.props.dueDate && this.props.paymentStatus.value !== 'paid';
  }

  isPaid(): boolean {
    return this.props.paymentStatus.value === 'paid';
  }

  isPartiallyPaid(): boolean {
    return this.props.paymentStatus.value === 'partial';
  }

  isPending(): boolean {
    return this.props.paymentStatus.value === 'pending';
  }

  getDaysOverdue(): number {
    if (!this.isOverdue()) {
      return 0;
    }
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - this.props.dueDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getPaymentPercentage(): number {
    if (this.props.totalAmount.amount === 0) {
      return 0;
    }
    return (this.props.paidAmount.amount / this.props.totalAmount.amount) * 100;
  }

  // ========================================================================
  // FACTORY METHODS FOR SPECIFIC INVOICE TYPES
  // ========================================================================

  static createInvoice(props: Omit<InvoiceProps, 'id' | 'type' | 'createdAt' | 'updatedAt'>): Invoice {
    return Invoice.create({
      ...props,
      type: 'invoice',
    });
  }

  static createCreditNote(props: Omit<InvoiceProps, 'id' | 'type' | 'createdAt' | 'updatedAt'>): Invoice {
    return Invoice.create({
      ...props,
      type: 'credit_note',
    });
  }

  static createDebitNote(props: Omit<InvoiceProps, 'id' | 'type' | 'createdAt' | 'updatedAt'>): Invoice {
    return Invoice.create({
      ...props,
      type: 'debit_note',
    });
  }

  static createProforma(props: Omit<InvoiceProps, 'id' | 'type' | 'createdAt' | 'updatedAt'>): Invoice {
    return Invoice.create({
      ...props,
      type: 'proforma',
    });
  }

  static createQuote(props: Omit<InvoiceProps, 'id' | 'type' | 'createdAt' | 'updatedAt'>): Invoice {
    return Invoice.create({
      ...props,
      type: 'quote',
    });
  }

  static createReceipt(props: Omit<InvoiceProps, 'id' | 'type' | 'createdAt' | 'updatedAt'>): Invoice {
    return Invoice.create({
      ...props,
      type: 'receipt',
    });
  }
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type { InvoiceId, InvoiceNumber, InvoiceType, InvoiceStatus, InvoicePaymentStatus, InvoicePaymentMethod, InvoiceItem, InvoiceSettings };
