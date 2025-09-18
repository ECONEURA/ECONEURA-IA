import { BaseClient } from './base-client.js';
export class FinanceClient extends BaseClient {
    async listAccounts(page = 1, pageSize = 20) {
        return this.get('/v1/finance/accounts', { params: { page, pageSize } });
    }
    async getAccount(id) {
        return this.get(`/v1/finance/accounts/${id}`);
    }
    async createAccount(data) {
        return this.post('/v1/finance/accounts', data);
    }
    async updateAccount(id, data) {
        return this.patch(`/v1/finance/accounts/${id}`, data);
    }
    async deleteAccount(id) {
        return this.delete(`/v1/finance/accounts/${id}`);
    }
    async getAccountBalance(id) {
        return this.get(`/v1/finance/accounts/${id}/balance`);
    }
    async listTransactions(page = 1, pageSize = 20) {
        return this.get('/v1/finance/transactions', { params: { page, pageSize } });
    }
    async getTransaction(id) {
        return this.get(`/v1/finance/transactions/${id}`);
    }
    async createTransaction(data) {
        return this.post('/v1/finance/transactions', data);
    }
    async updateTransaction(id, data) {
        return this.patch(`/v1/finance/transactions/${id}`, data);
    }
    async deleteTransaction(id) {
        return this.delete(`/v1/finance/transactions/${id}`);
    }
    async getTransactionsByAccount(accountId, page = 1, pageSize = 20) {
        return this.get(`/v1/finance/accounts/${accountId}/transactions`, { params: { page, pageSize } });
    }
    async listBudgets(page = 1, pageSize = 20) {
        return this.get('/v1/finance/budgets', { params: { page, pageSize } });
    }
    async getBudget(id) {
        return this.get(`/v1/finance/budgets/${id}`);
    }
    async createBudget(data) {
        return this.post('/v1/finance/budgets', data);
    }
    async updateBudget(id, data) {
        return this.patch(`/v1/finance/budgets/${id}`, data);
    }
    async deleteBudget(id) {
        return this.delete(`/v1/finance/budgets/${id}`);
    }
    async getActiveBudgets() {
        return this.get('/v1/finance/budgets/active');
    }
    async listTaxRates() {
        return this.get('/v1/finance/tax-rates');
    }
    async getTaxRate(id) {
        return this.get(`/v1/finance/tax-rates/${id}`);
    }
    async createTaxRate(data) {
        return this.post('/v1/finance/tax-rates', data);
    }
    async updateTaxRate(id, data) {
        return this.patch(`/v1/finance/tax-rates/${id}`, data);
    }
    async deleteTaxRate(id) {
        return this.delete(`/v1/finance/tax-rates/${id}`);
    }
    async listPaymentTerms() {
        return this.get('/v1/finance/payment-terms');
    }
    async getPaymentTerm(id) {
        return this.get(`/v1/finance/payment-terms/${id}`);
    }
    async createPaymentTerm(data) {
        return this.post('/v1/finance/payment-terms', data);
    }
    async updatePaymentTerm(id, data) {
        return this.patch(`/v1/finance/payment-terms/${id}`, data);
    }
    async deletePaymentTerm(id) {
        return this.delete(`/v1/finance/payment-terms/${id}`);
    }
    async generateFinancialReport(type, startDate, endDate) {
        return this.post('/v1/finance/reports/generate', {
            type,
            start_date: startDate,
            end_date: endDate
        });
    }
    async getFinancialReport(id) {
        return this.get(`/v1/finance/reports/${id}`);
    }
    async listFinancialReports(page = 1, pageSize = 20) {
        return this.get('/v1/finance/reports', { params: { page, pageSize } });
    }
    async getFinancialSummary() {
        return this.get('/v1/finance/analytics/summary');
    }
    async getBudgetAnalysis() {
        return this.get('/v1/finance/analytics/budget');
    }
}
//# sourceMappingURL=finance-client.js.map