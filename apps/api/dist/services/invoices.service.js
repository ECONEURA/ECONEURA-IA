export class InvoicesService {
    invoices = [];
    async create(data) {
        const invoice = {
            id: Date.now().toString(),
            number: `INV-${Date.now()}`,
            ...data,
        };
        this.invoices.push(invoice);
        return invoice;
    }
    async list(orgId) {
        return this.invoices.filter(i => i.orgId === orgId);
    }
}
export const invoicesService = new InvoicesService();
//# sourceMappingURL=invoices.service.js.map