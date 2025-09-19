export interface Invoice {
    id: string;
    number: string;
    amount: number;
    status: 'draft' | 'sent' | 'paid';
    orgId: string;
}
export declare class InvoicesService {
    private invoices;
    create(data: Omit<Invoice, 'id' | 'number'>): Promise<Invoice>;
    list(orgId: string): Promise<Invoice[]>;
}
export declare const invoicesService: InvoicesService;
//# sourceMappingURL=invoices.service.d.ts.map