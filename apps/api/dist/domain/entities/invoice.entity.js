import { BaseEntity } from './base.entity.js';
import { Money } from '../value-objects/money.vo.js';
export class Invoice extends BaseEntity {
    props;
    constructor(props) {
        super(props);
        this.props = props;
    }
    static create(props) {
        const now = new Date();
        return new Invoice({
            ...props,
            id: crypto.randomUUID(),
            createdAt: now,
            updatedAt: now,
        });
    }
    static fromJSON(data) {
        return new Invoice(data);
    }
    get invoiceNumber() { return this.props.invoiceNumber; }
    get type() { return this.props.type; }
    get status() { return this.props.status; }
    get paymentStatus() { return this.props.paymentStatus; }
    get companyId() { return this.props.companyId; }
    get contactId() { return this.props.contactId; }
    get issueDate() { return this.props.issueDate; }
    get dueDate() { return this.props.dueDate; }
    get paidDate() { return this.props.paidDate; }
    get subtotal() { return this.props.subtotal; }
    get taxAmount() { return this.props.taxAmount; }
    get discountAmount() { return this.props.discountAmount; }
    get totalAmount() { return this.props.totalAmount; }
    get paidAmount() { return this.props.paidAmount; }
    get balanceAmount() { return this.props.balanceAmount; }
    get items() { return this.props.items; }
    get paymentMethod() { return this.props.paymentMethod; }
    get reference() { return this.props.reference; }
    get notes() { return this.props.notes; }
    get settings() { return this.props.settings; }
    get attachments() { return this.props.attachments; }
    updateInvoiceNumber(invoiceNumber) {
        if (!invoiceNumber || invoiceNumber.trim().length === 0) {
            throw new Error('Invoice number cannot be empty');
        }
        this.props.invoiceNumber = invoiceNumber.trim();
        this.updateTimestamp();
    }
    updateType(type) {
        this.props.type = type;
        this.updateTimestamp();
    }
    updateStatus(status) {
        this.props.status = status;
        this.updateTimestamp();
    }
    updatePaymentStatus(paymentStatus) {
        this.props.paymentStatus = paymentStatus;
        this.updateTimestamp();
    }
    updateCompanyId(companyId) {
        if (!companyId || companyId.trim().length === 0) {
            throw new Error('Company ID cannot be empty');
        }
        this.props.companyId = companyId.trim();
        this.updateTimestamp();
    }
    updateContactId(contactId) {
        this.props.contactId = contactId;
        this.updateTimestamp();
    }
    updateIssueDate(issueDate) {
        this.props.issueDate = issueDate;
        this.updateTimestamp();
    }
    updateDueDate(dueDate) {
        this.props.dueDate = dueDate;
        this.updateTimestamp();
    }
    updatePaidDate(paidDate) {
        this.props.paidDate = paidDate;
        this.updateTimestamp();
    }
    addItem(item) {
        this.props.items.push(item);
        this.recalculateTotals();
        this.updateTimestamp();
    }
    removeItem(itemId) {
        this.props.items = this.props.items.filter(item => item.id !== itemId);
        this.recalculateTotals();
        this.updateTimestamp();
    }
    updateItem(itemId, updates) {
        const itemIndex = this.props.items.findIndex(item => item.id === itemId);
        if (itemIndex !== -1) {
            this.props.items[itemIndex] = { ...this.props.items[itemIndex], ...updates };
            this.recalculateTotals();
            this.updateTimestamp();
        }
    }
    updatePaymentMethod(paymentMethod) {
        this.props.paymentMethod = paymentMethod;
        this.updateTimestamp();
    }
    updateReference(reference) {
        this.props.reference = reference;
        this.updateTimestamp();
    }
    updateNotes(notes) {
        this.props.notes = notes;
        this.updateTimestamp();
    }
    updateSettings(settings) {
        this.props.settings = settings;
        this.updateTimestamp();
    }
    addAttachment(attachmentUrl) {
        if (!this.props.attachments) {
            this.props.attachments = [];
        }
        if (!this.props.attachments.includes(attachmentUrl)) {
            this.props.attachments.push(attachmentUrl);
            this.updateTimestamp();
        }
    }
    removeAttachment(attachmentUrl) {
        if (this.props.attachments) {
            this.props.attachments = this.props.attachments.filter(url => url !== attachmentUrl);
            this.updateTimestamp();
        }
    }
    recordPayment(amount, paymentMethod, paidDate) {
        this.props.paidAmount = Money.create(this.props.paidAmount.amount + amount.amount, this.props.paidAmount.currency);
        this.props.paymentMethod = paymentMethod;
        if (paidDate) {
            this.props.paidDate = paidDate;
        }
        this.updatePaymentStatus();
        this.updateTimestamp();
    }
    applyDiscount(discountAmount) {
        this.props.discountAmount = Money.create(this.props.discountAmount.amount + discountAmount.amount, this.props.discountAmount.currency);
        this.recalculateTotals();
        this.updateTimestamp();
    }
    recalculateTotals() {
        const subtotal = this.props.items.reduce((sum, item) => {
            return sum + item.totalPrice.amount;
        }, 0);
        this.props.subtotal = Money.create(subtotal, this.props.settings.currency);
        const taxAmount = this.props.items.reduce((sum, item) => {
            return sum + (item.taxAmount?.amount || 0);
        }, 0);
        this.props.taxAmount = Money.create(taxAmount, this.props.settings.currency);
        const totalAmount = subtotal + taxAmount - this.props.discountAmount.amount;
        this.props.totalAmount = Money.create(totalAmount, this.props.settings.currency);
        const balanceAmount = totalAmount - this.props.paidAmount.amount;
        this.props.balanceAmount = Money.create(balanceAmount, this.props.settings.currency);
    }
    updatePaymentStatus() {
        if (this.props.paidAmount.amount >= this.props.totalAmount.amount) {
            this.props.paymentStatus = 'paid';
            this.props.status = 'paid';
        }
        else if (this.props.paidAmount.amount > 0) {
            this.props.paymentStatus = 'partial';
        }
        else {
            this.props.paymentStatus = 'pending';
        }
    }
    validate() {
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
    toJSON() {
        return { ...this.props };
    }
    clone() {
        return Invoice.fromJSON(this.toJSON());
    }
    isOverdue() {
        const now = new Date();
        return now > this.props.dueDate && this.props.paymentStatus.value !== 'paid';
    }
    isPaid() {
        return this.props.paymentStatus.value === 'paid';
    }
    isPartiallyPaid() {
        return this.props.paymentStatus.value === 'partial';
    }
    isPending() {
        return this.props.paymentStatus.value === 'pending';
    }
    getDaysOverdue() {
        if (!this.isOverdue()) {
            return 0;
        }
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - this.props.dueDate.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    getPaymentPercentage() {
        if (this.props.totalAmount.amount === 0) {
            return 0;
        }
        return (this.props.paidAmount.amount / this.props.totalAmount.amount) * 100;
    }
    static createInvoice(props) {
        return Invoice.create({
            ...props,
            type: 'invoice',
        });
    }
    static createCreditNote(props) {
        return Invoice.create({
            ...props,
            type: 'credit_note',
        });
    }
    static createDebitNote(props) {
        return Invoice.create({
            ...props,
            type: 'debit_note',
        });
    }
    static createProforma(props) {
        return Invoice.create({
            ...props,
            type: 'proforma',
        });
    }
    static createQuote(props) {
        return Invoice.create({
            ...props,
            type: 'quote',
        });
    }
    static createReceipt(props) {
        return Invoice.create({
            ...props,
            type: 'receipt',
        });
    }
}
//# sourceMappingURL=invoice.entity.js.map