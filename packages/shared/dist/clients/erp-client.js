import { BaseClient } from './base-client.js';
export class ERPClient extends BaseClient {
    async listProducts(page = 1, pageSize = 20) {
        return this.get('/v1/erp/products', { params: { page, pageSize } });
    }
    async getProduct(id) {
        return this.get(`/v1/erp/products/${id}`);
    }
    async createProduct(data) {
        return this.post('/v1/erp/products', data);
    }
    async updateProduct(id, data) {
        return this.patch(`/v1/erp/products/${id}`, data);
    }
    async deleteProduct(id) {
        return this.delete(`/v1/erp/products/${id}`);
    }
    async listInventoryMovements(page = 1, pageSize = 20) {
        return this.get('/v1/erp/inventory/movements', { params: { page, pageSize } });
    }
    async getInventoryMovement(id) {
        return this.get(`/v1/erp/inventory/movements/${id}`);
    }
    async createInventoryMovement(data) {
        return this.post('/v1/erp/inventory/movements', data);
    }
    async listSuppliers(page = 1, pageSize = 20) {
        return this.get('/v1/erp/suppliers', { params: { page, pageSize } });
    }
    async getSupplier(id) {
        return this.get(`/v1/erp/suppliers/${id}`);
    }
    async createSupplier(data) {
        return this.post('/v1/erp/suppliers', data);
    }
    async updateSupplier(id, data) {
        return this.patch(`/v1/erp/suppliers/${id}`, data);
    }
    async deleteSupplier(id) {
        return this.delete(`/v1/erp/suppliers/${id}`);
    }
    async listCustomers(page = 1, pageSize = 20) {
        return this.get('/v1/erp/customers', { params: { page, pageSize } });
    }
    async getCustomer(id) {
        return this.get(`/v1/erp/customers/${id}`);
    }
    async createCustomer(data) {
        return this.post('/v1/erp/customers', data);
    }
    async updateCustomer(id, data) {
        return this.patch(`/v1/erp/customers/${id}`, data);
    }
    async deleteCustomer(id) {
        return this.delete(`/v1/erp/customers/${id}`);
    }
    async listInvoices(page = 1, pageSize = 20) {
        return this.get('/v1/erp/invoices', { params: { page, pageSize } });
    }
    async getInvoice(id) {
        return this.get(`/v1/erp/invoices/${id}`);
    }
    async createInvoice(data) {
        return this.post('/v1/erp/invoices', data);
    }
    async updateInvoice(id, data) {
        return this.patch(`/v1/erp/invoices/${id}`, data);
    }
    async deleteInvoice(id) {
        return this.delete(`/v1/erp/invoices/${id}`);
    }
    async getInventoryReport() {
        return this.get('/v1/erp/reports/inventory');
    }
    async getSalesReport(startDate, endDate) {
        return this.get('/v1/erp/reports/sales', {
            params: { startDate, endDate }
        });
    }
}
//# sourceMappingURL=erp-client.js.map