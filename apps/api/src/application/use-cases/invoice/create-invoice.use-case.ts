import { Invoice } from '../../../domain/entities/invoice.entity.js';
import { InvoiceRepository } from '../../../domain/repositories/invoice.repository.js';
import { BaseUseCase, BaseRequest, BaseResponse } from '../base.use-case.js';
import { Money } from '../../../domain/value-objects/money.vo.js';

// ============================================================================
// CREATE INVOICE USE CASE
// ============================================================================

export interface CreateInvoiceRequest extends BaseRequest {
  invoiceNumber: string;
  type: 'invoice' | 'credit_note' | 'debit_note' | 'proforma' | 'quote' | 'receipt';
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled' | 'refunded' | 'partially_paid';
  paymentStatus: 'pending' | 'paid' | 'partial' | 'overdue' | 'cancelled';
  companyId: string;
  contactId?: string;
  issueDate: Date;
  dueDate: Date;
  paidDate?: Date;
  items: Array<{
    productId?: string;
    description: string;
    quantity: number;
    unitPrice: {
      amount: number;
      currency: string;
    };
    totalPrice: {
      amount: number;
      currency: string;
    };
    taxRate?: number;
    taxAmount?: {
      amount: number;
      currency: string;
    };
    discountRate?: number;
    discountAmount?: {
      amount: number;
      currency: string;
    };
    notes?: string;
  }>;
  paymentMethod?: 'cash' | 'credit_card' | 'bank_transfer' | 'check' | 'paypal' | 'stripe' | 'other';
  reference?: string;
  notes?: string;
  settings: {
    currency: string;
    taxInclusive: boolean;
    defaultTaxRate: number;
    paymentTerms: number;
    lateFeeRate?: number;
    lateFeeAmount?: {
      amount: number;
      currency: string;
    };
    notes?: string;
    footer?: string;
    customFields: Record<string, any>;
    tags: string[];
  };
  attachments?: string[];
}

export interface CreateInvoiceResponse extends BaseResponse {
  data: {
    invoice: Invoice;
  };
}

export class CreateInvoiceUseCase extends BaseUseCase<CreateInvoiceRequest, CreateInvoiceResponse> {
  constructor(
    private readonly invoiceRepository: InvoiceRepository
  ) {
    super();
  }

  async execute(request: CreateInvoiceRequest): Promise<CreateInvoiceResponse> {
    // ========================================================================
    // VALIDATION
    // ========================================================================

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

    // ========================================================================
    // BUSINESS LOGIC VALIDATION
    // ========================================================================

    // Check if invoice number already exists
    const existingInvoice = await this.invoiceRepository.findByInvoiceNumber(request.invoiceNumber, request.organizationId);
    if (existingInvoice) {
      throw new Error(`Invoice with number '${request.invoiceNumber}' already exists`);
    }

    // ========================================================================
    // CREATE INVOICE
    // ========================================================================

    const invoice = Invoice.create({
      organizationId: { value: request.organizationId },
      invoiceNumber: { value: request.invoiceNumber },
      type: { value: request.type },
      status: { value: request.status },
      paymentStatus: { value: request.paymentStatus },
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
      paymentMethod: request.paymentMethod ? { value: request.paymentMethod } : undefined,
      reference: request.reference,
      notes: request.notes,
      settings: {
        currency: request.settings.currency,
        taxInclusive: request.settings.taxInclusive,
        defaultTaxRate: request.settings.defaultTaxRate,
        paymentTerms: request.settings.paymentTerms,
        lateFeeRate: request.settings.lateFeeRate,
        lateFeeAmount: request.settings.lateFeeAmount ? Money.create(
          request.settings.lateFeeAmount.amount,
          request.settings.lateFeeAmount.currency
        ) : undefined,
        notes: request.settings.notes,
        footer: request.settings.footer,
        customFields: request.settings.customFields,
        tags: request.settings.tags,
      },
      attachments: request.attachments,
      isActive: true,
    });

    // ========================================================================
    // VALIDATE INVOICE
    // ========================================================================

    if (!invoice.validate()) {
      throw new Error('Invalid invoice data');
    }

    // ========================================================================
    // SAVE INVOICE
    // ========================================================================

    const savedInvoice = await this.invoiceRepository.save(invoice);

    // ========================================================================
    // RETURN RESPONSE
    // ========================================================================

    return this.createSuccessResponse({
      invoice: savedInvoice,
    }, 'Invoice created successfully');
  }
}
