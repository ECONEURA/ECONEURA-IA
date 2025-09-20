import { Invoice } from '../../../domain/entities/invoice.entity.js';
import { InvoiceRepository } from '../../../domain/repositories/invoice.repository.js';
import { BaseUseCase, BaseRequest, BaseResponse } from '../base.use-case.js';
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
export declare class CreateInvoiceUseCase extends BaseUseCase<CreateInvoiceRequest, CreateInvoiceResponse> {
    private readonly invoiceRepository;
    constructor(invoiceRepository: InvoiceRepository);
    execute(request: CreateInvoiceRequest): Promise<CreateInvoiceResponse>;
}
//# sourceMappingURL=create-invoice.use-case.d.ts.map