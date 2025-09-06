import { Invoice } from '../../../domain/entities/invoice.entity.js';
import { InvoiceRepository } from '../../../domain/repositories/invoice.repository.js';
import { BaseUseCase, BaseRequest, BaseResponse } from '../base.use-case.js';
import { Money } from '../../../domain/value-objects/money.vo.js';

// ============================================================================
// UPDATE INVOICE USE CASE
// ============================================================================

export interface UpdateInvoiceRequest extends BaseRequest {
  id: string;
  invoiceNumber?: string;
  type?: 'invoice' | 'credit_note' | 'debit_note' | 'proforma' | 'quote' | 'receipt';
  status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled' | 'refunded' | 'partially_paid';
  paymentStatus?: 'pending' | 'paid' | 'partial' | 'overdue' | 'cancelled';
  companyId?: string;
  contactId?: string;
  issueDate?: Date;
  dueDate?: Date;
  paidDate?: Date;
  items?: Array<{
    id?: string;
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
  settings?: {
    currency?: string;
    taxInclusive?: boolean;
    defaultTaxRate?: number;
    paymentTerms?: number;
    lateFeeRate?: number;
    lateFeeAmount?: {
      amount: number;
      currency: string;
    };
    notes?: string;
    footer?: string;
    customFields?: Record<string, any>;
    tags?: string[];
  };
  attachments?: string[];
}

export interface UpdateInvoiceResponse extends BaseResponse {
  data: {
    invoice: Invoice;
  };
}

export class UpdateInvoiceUseCase extends BaseUseCase<UpdateInvoiceRequest, UpdateInvoiceResponse> {
  constructor(
    private readonly invoiceRepository: InvoiceRepository
  ) {
    super();
  }

  async execute(request: UpdateInvoiceRequest): Promise<UpdateInvoiceResponse> {
    // ========================================================================
    // VALIDATION
    // ========================================================================

    this.validateId(request.id, 'Invoice ID');

    // ========================================================================
    // FIND EXISTING INVOICE
    // ========================================================================

    const existingInvoice = await this.invoiceRepository.findById(request.id);
    if (!existingInvoice) {
      throw new Error(`Invoice with ID '${request.id}' not found`);
    }

    // ========================================================================
    // BUSINESS LOGIC VALIDATION
    // ========================================================================

    // Check if invoice number already exists (if being updated)
    if (request.invoiceNumber && request.invoiceNumber !== existingInvoice.invoiceNumber.value) {
      const existingInvoiceByNumber = await this.invoiceRepository.findByInvoiceNumber(request.invoiceNumber, request.organizationId);
      if (existingInvoiceByNumber && existingInvoiceByNumber.id.value !== request.id) {
        throw new Error(`Invoice with number '${request.invoiceNumber}' already exists`);
      }
    }

    // ========================================================================
    // UPDATE INVOICE
    // ========================================================================

    // Update basic fields
    if (request.invoiceNumber !== undefined) {
      existingInvoice.updateInvoiceNumber(request.invoiceNumber);
    }

    if (request.type !== undefined) {
      existingInvoice.updateType({ value: request.type });
    }

    if (request.status !== undefined) {
      existingInvoice.updateStatus({ value: request.status });
    }

    if (request.paymentStatus !== undefined) {
      existingInvoice.updatePaymentStatus({ value: request.paymentStatus });
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
      existingInvoice.updatePaymentMethod({ value: request.paymentMethod });
    }

    if (request.reference !== undefined) {
      existingInvoice.updateReference(request.reference);
    }

    if (request.notes !== undefined) {
      existingInvoice.updateNotes(request.notes);
    }

    // Update items
    if (request.items !== undefined) {
      // Remove all existing items and add new ones
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

    // Update settings
    if (request.settings !== undefined) {
      const currentSettings = existingInvoice.settings;
      const updatedSettings = {
        currency: request.settings.currency || currentSettings.currency,
        taxInclusive: request.settings.taxInclusive !== undefined ? request.settings.taxInclusive : currentSettings.taxInclusive,
        defaultTaxRate: request.settings.defaultTaxRate || currentSettings.defaultTaxRate,
        paymentTerms: request.settings.paymentTerms || currentSettings.paymentTerms,
        lateFeeRate: request.settings.lateFeeRate !== undefined ? request.settings.lateFeeRate : currentSettings.lateFeeRate,
        lateFeeAmount: request.settings.lateFeeAmount ? Money.create(
          request.settings.lateFeeAmount.amount,
          request.settings.lateFeeAmount.currency
        ) : currentSettings.lateFeeAmount,
        notes: request.settings.notes || currentSettings.notes,
        footer: request.settings.footer || currentSettings.footer,
        customFields: { ...currentSettings.customFields, ...request.settings.customFields },
        tags: request.settings.tags || currentSettings.tags,
      };
      existingInvoice.updateSettings(updatedSettings);
    }

    // Update attachments
    if (request.attachments !== undefined) {
      // Remove all existing attachments and add new ones
      const currentAttachments = existingInvoice.attachments || [];
      currentAttachments.forEach(attachment => existingInvoice.removeAttachment(attachment));
      request.attachments.forEach(attachment => existingInvoice.addAttachment(attachment));
    }

    // ========================================================================
    // VALIDATE UPDATED INVOICE
    // ========================================================================

    if (!existingInvoice.validate()) {
      throw new Error('Invalid invoice data after update');
    }

    // ========================================================================
    // SAVE UPDATED INVOICE
    // ========================================================================

    const updatedInvoice = await this.invoiceRepository.update(existingInvoice);

    // ========================================================================
    // RETURN RESPONSE
    // ========================================================================

    return this.createSuccessResponse({
      invoice: updatedInvoice,
    }, 'Invoice updated successfully');
  }
}
