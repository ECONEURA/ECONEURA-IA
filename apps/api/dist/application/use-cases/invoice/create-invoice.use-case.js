import { Invoice } from '../../../domain/entities/invoice.entity.js';
import { BaseUseCase } from '../base.use-case.js';
import { Money } from '../../../domain/value-objects/money.vo.js';
export class CreateInvoiceUseCase extends BaseUseCase {
    invoiceRepository;
    constructor(invoiceRepository) {
        super();
        this.invoiceRepository = invoiceRepository;
    }
    async execute(request) {
        this.validateBaseRequest(request);
        this.validateId(request.invoiceNumber, 'Invoice number');
        this.validateId(request.companyId, 'Company ID');
        this.validateString(request.type, 'Invoice type');
        this.validateString(request.status, 'Invoice status');
        this.validateString(request.paymentStatus, 'Payment status');
        if (!request.items || request.items.length === 0) {
            throw new Error('Invoice must have at least one item');
        }
        if (request.issueDate > request.dueDate) {
            throw new Error('Issue date cannot be after due date');
        }
        const existingInvoice = await this.invoiceRepository.findByInvoiceNumber(request.invoiceNumber, request.organizationId);
        if (existingInvoice) {
            throw new Error(`Invoice with number '${request.invoiceNumber}' already exists`);
        }
        const invoice = Invoice.create({
            organizationId: request.organizationId,
            invoiceNumber: request.invoiceNumber,
            type: request.type,
            status: request.status,
            paymentStatus: request.paymentStatus,
            companyId: request.companyId,
            contactId: request.contactId,
            issueDate: request.issueDate,
            dueDate: request.dueDate,
            paidDate: request.paidDate,
            subtotal: Money.create(0, request.settings.currency),
            taxAmount: Money.create(0, request.settings.currency),
            discountAmount: Money.create(0, request.settings.currency),
            totalAmount: Money.create(0, request.settings.currency),
            paidAmount: Money.create(0, request.settings.currency),
            balanceAmount: Money.create(0, request.settings.currency),
            items: request.items.map(item => ({
                id: this.generateId(),
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
            })),
            paymentMethod: request.paymentMethod ? request.paymentMethod : undefined,
            reference: request.reference,
            notes: request.notes,
            settings: {
                currency: request.settings.currency,
                taxInclusive: request.settings.taxInclusive,
                defaultTaxRate: request.settings.defaultTaxRate,
                paymentTerms: request.settings.paymentTerms,
                lateFeeRate: request.settings.lateFeeRate,
                lateFeeAmount: request.settings.lateFeeAmount ? Money.create(request.settings.lateFeeAmount.amount, request.settings.lateFeeAmount.currency) : undefined,
                notes: request.settings.notes,
                footer: request.settings.footer,
                customFields: request.settings.customFields,
                tags: request.settings.tags,
            },
            attachments: request.attachments,
            isActive: true,
        });
        if (!invoice.validate()) {
            throw new Error('Invalid invoice data');
        }
        const savedInvoice = await this.invoiceRepository.save(invoice);
        return this.createSuccessResponse({
            invoice: savedInvoice,
        }, 'Invoice created successfully');
    }
}
//# sourceMappingURL=create-invoice.use-case.js.map