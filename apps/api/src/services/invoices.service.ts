export interface Invoice {
  id: string;
  number: string;
  amount: number;
  status: 'draft' | 'sent' | 'paid';
  orgId: string;
}

export class InvoicesService {
  private invoices: Invoice[] = [];
  
  async create(data: Omit<Invoice, 'id' | 'number'>) {
    const invoice: Invoice = {
      id: Date.now().toString(),
      number: `INV-${Date.now()}`,
      ...data,
    };
    this.invoices.push(invoice);
    return invoice;
  }
  
  async list(orgId: string) {
    return this.invoices.filter(i => i.orgId === orgId);
  }
}

export const invoicesService = new InvoicesService();
