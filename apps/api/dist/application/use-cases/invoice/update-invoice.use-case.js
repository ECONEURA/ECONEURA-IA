import { BaseUseCase } from '../base.use-case.js';
import { Money } from '../../../domain/value-objects/money.vo.js';
export class UpdateInvoiceUseCase extends BaseUseCase {
    invoiceRepository;
    constructor(invoiceRepository) {
        super();
        this.invoiceRepository = invoiceRepository;
    }
    async execute(request) {
        this.validateId(request.id, 'Invoice ID');
        const existingInvoice = await this.invoiceRepository.findById(request.id);
        if (!existingInvoice) {
            throw new Error(`Invoice with ID '${request.id}' not found`);
        }
        if (request.invoiceNumber && request.invoiceNumber !== existingInvoice.invoiceNumber.value) {
            const existingInvoiceByNumber = await this.invoiceRepository.findByInvoiceNumber(request.invoiceNumber, request.organizationId);
            if (existingInvoiceByNumber && existingInvoiceByNumber.id.value !== request.id) {
                throw new Error(`Invoice with number '${request.invoiceNumber}' already exists`);
            }
        }
        if (request.invoiceNumber !== undefined) {
            existingInvoice.updateInvoiceNumber(request.invoiceNumber);
        }
        if (request.type !== undefined) {
            existingInvoice.updateType(request.type);
        }
        if (request.status !== undefined) {
            existingInvoice.updateStatus(request.status);
        }
        if (request.paymentStatus !== undefined) {
            existingInvoice.updatePaymentStatus(request.paymentStatus);
        }
        if (request.companyId !== undefined) {
            existingInvoice.updateCompanyId(request.companyId);
        }
        if (request.contactId !== undefined) {
            existingInvoice.updateContactId(request.contactId);
        }
        if (request.issueDate !== undefined) {
            existingInvoice.updateIssueDate(request.issueDate);
        }
        if (request.dueDate !== undefined) {
            existingInvoice.updateDueDate(request.dueDate);
        }
        if (request.paidDate !== undefined) {
            existingInvoice.updatePaidDate(request.paidDate);
        }
        if (request.paymentMethod !== undefined) {
            existingInvoice.updatePaymentMethod(request.paymentMethod);
        }
        if (request.reference !== undefined) {
            existingInvoice.updateReference(request.reference);
        }
        if (request.notes !== undefined) {
            existingInvoice.updateNotes(request.notes);
        }
        if (request.items !== undefined) {
            const currentItems = existingInvoice.items;
            currentItems.forEach(item => existingInvoice.removeItem(item.id));
            request.items.forEach(item => {
                const newItem = {
                    id: item.id || this.generateId(),
                    productId: item.productId,
                    description: item.description,
                    quantity: item.quantity,
                    unitPrice: Money.create(item.unitPrice.amount, item.unitPrice.currency),
                    totalPrice: Money.create(item.totalPrice.amount, item.totalPrice.currency),
                    taxRate: item.taxRate,
                    taxAmount: item.taxAmount ? Money.create(item.taxAmount.amount, item.taxAmount.currency) : undefined,
                    discountRate: item.discountRate,
                    discountAmount: item.discountAmount ? Money.create(item.discountAmount.amount, item.discountAmount.currency) : undefined,
                    notes: item.notes,
                };
                existingInvoice.addItem(newItem);
            });
        }
        if (request.settings !== undefined) {
            const currentSettings = existingInvoice.settings;
            const updatedSettings = {
                currency: request.settings.currency || currentSettings.currency,
                taxInclusive: request.settings.taxInclusive !== undefined ? request.settings.taxInclusive : currentSettings.taxInclusive,
                defaultTaxRate: request.settings.defaultTaxRate || currentSettings.defaultTaxRate,
                paymentTerms: request.settings.paymentTerms || currentSettings.paymentTerms,
                lateFeeRate: request.settings.lateFeeRate !== undefined ? request.settings.lateFeeRate : currentSettings.lateFeeRate,
                lateFeeAmount: request.settings.lateFeeAmount ? Money.create(request.settings.lateFeeAmount.amount, request.settings.lateFeeAmount.currency) : currentSettings.lateFeeAmount,
                notes: request.settings.notes || currentSettings.notes,
                footer: request.settings.footer || currentSettings.footer,
                customFields: { ...currentSettings.customFields, ...request.settings.customFields },
                tags: request.settings.tags || currentSettings.tags,
            };
            existingInvoice.updateSettings(updatedSettings);
        }
        if (request.attachments !== undefined) {
            const currentAttachments = existingInvoice.attachments || [];
            currentAttachments.forEach(attachment => existingInvoice.removeAttachment(attachment));
            request.attachments.forEach(attachment => existingInvoice.addAttachment(attachment));
        }
        if (!existingInvoice.validate()) {
            throw new Error('Invalid invoice data after update');
        }
        const updatedInvoice = await this.invoiceRepository.update(existingInvoice);
        return this.createSuccessResponse({
            invoice: updatedInvoice,
        }, 'Invoice updated successfully');
    }
}
//# sourceMappingURL=update-invoice.use-case.js.map