import { BaseEntity } from './base.js';
export interface Invoice extends BaseEntity {
    number: string;
    customerId: string;
    date: Date;
    dueDate: Date;
    subtotal: number;
    tax: number;
    total: number;
    status: InvoiceStatus;
    items: InvoiceItem[];
}
export type InvoiceStatus = 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled';
export interface InvoiceItem {
    productId: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    tax: number;
    total: number;
}
//# sourceMappingURL=invoice.d.ts.map