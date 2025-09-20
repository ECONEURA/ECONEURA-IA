import { BaseEntity, BaseEntityProps } from './base.entity.js';
import { Money } from '../value-objects/money.vo.js';
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
    paymentTerms: number;
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
export declare class Invoice extends BaseEntity {
    private props;
    private constructor();
    static create(props: Omit<InvoiceProps, 'id' | 'createdAt' | 'updatedAt'>): Invoice;
    static fromJSON(data: InvoiceProps): Invoice;
    get invoiceNumber(): InvoiceNumber;
    get type(): InvoiceType;
    get status(): InvoiceStatus;
    get paymentStatus(): InvoicePaymentStatus;
    get companyId(): string;
    get contactId(): string | undefined;
    get issueDate(): Date;
    get dueDate(): Date;
    get paidDate(): Date | undefined;
    get subtotal(): Money;
    get taxAmount(): Money;
    get discountAmount(): Money;
    get totalAmount(): Money;
    get paidAmount(): Money;
    get balanceAmount(): Money;
    get items(): InvoiceItem[];
    get paymentMethod(): InvoicePaymentMethod | undefined;
    get reference(): string | undefined;
    get notes(): string | undefined;
    get settings(): InvoiceSettings;
    get attachments(): string[] | undefined;
    updateInvoiceNumber(invoiceNumber: string): void;
    updateType(type: InvoiceType): void;
    updateStatus(status: InvoiceStatus): void;
    updateCompanyId(companyId: string): void;
    updateContactId(contactId: string): void;
    updateIssueDate(issueDate: Date): void;
    updateDueDate(dueDate: Date): void;
    updatePaidDate(paidDate: Date): void;
    addItem(item: InvoiceItem): void;
    removeItem(itemId: string): void;
    updateItem(itemId: string, updates: Partial<InvoiceItem>): void;
    updatePaymentMethod(paymentMethod: InvoicePaymentMethod): void;
    updateReference(reference: string): void;
    updateNotes(notes: string): void;
    updateSettings(settings: InvoiceSettings): void;
    addAttachment(attachmentUrl: string): void;
    removeAttachment(attachmentUrl: string): void;
    recordPayment(amount: Money, paymentMethod: InvoicePaymentMethod, paidDate?: Date): void;
    applyDiscount(discountAmount: Money): void;
    private recalculateTotals;
    validate(): boolean;
    toJSON(): InvoiceProps;
    clone(): Invoice;
    isOverdue(): boolean;
    isPaid(): boolean;
    isPartiallyPaid(): boolean;
    isPending(): boolean;
    getDaysOverdue(): number;
    getPaymentPercentage(): number;
    static createInvoice(props: Omit<InvoiceProps, 'id' | 'type' | 'createdAt' | 'updatedAt'>): Invoice;
    static createCreditNote(props: Omit<InvoiceProps, 'id' | 'type' | 'createdAt' | 'updatedAt'>): Invoice;
    static createDebitNote(props: Omit<InvoiceProps, 'id' | 'type' | 'createdAt' | 'updatedAt'>): Invoice;
    static createProforma(props: Omit<InvoiceProps, 'id' | 'type' | 'createdAt' | 'updatedAt'>): Invoice;
    static createQuote(props: Omit<InvoiceProps, 'id' | 'type' | 'createdAt' | 'updatedAt'>): Invoice;
    static createReceipt(props: Omit<InvoiceProps, 'id' | 'type' | 'createdAt' | 'updatedAt'>): Invoice;
}
export type { InvoiceId, InvoiceNumber, InvoiceType, InvoiceStatus, InvoicePaymentStatus, InvoicePaymentMethod, InvoiceItem, InvoiceSettings };
//# sourceMappingURL=invoice.entity.d.ts.map