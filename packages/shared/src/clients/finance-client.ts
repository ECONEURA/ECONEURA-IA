import { BaseClient } from './base-client';
import type {
  Invoice,
  Payment,
  Expense,
  CreateInvoiceInput,
  UpdateInvoiceInput,
  CreatePaymentInput,
  CreateExpenseInput,
  UpdateExpenseInput,
  PaginatedResponse
} from '../types';

export class FinanceClient extends BaseClient {
  // Invoices
  async listInvoices(page = 1, pageSize = 20): Promise<PaginatedResponse<Invoice>> {
    return this.get('/finance/invoices', { params: { page, pageSize } });
  }

  async getInvoice(id: string): Promise<Invoice> {
    return this.get(`/finance/invoices/${id}`);
  }

  async createInvoice(data: CreateInvoiceInput): Promise<Invoice> {
    return this.post('/finance/invoices', data);
  }

  async updateInvoice(id: string, data: UpdateInvoiceInput): Promise<Invoice> {
    return this.patch(`/finance/invoices/${id}`, data);
  }

  async deleteInvoice(id: string): Promise<void> {
    return this.delete(`/finance/invoices/${id}`);
  }

  // Payments
  async listPayments(page = 1, pageSize = 20): Promise<PaginatedResponse<Payment>> {
    return this.get('/finance/payments', { params: { page, pageSize } });
  }

  async getPayment(id: string): Promise<Payment> {
    return this.get(`/finance/payments/${id}`);
  }

  async createPayment(data: CreatePaymentInput): Promise<Payment> {
    return this.post('/finance/payments', data);
  }

  // Expenses
  async listExpenses(page = 1, pageSize = 20): Promise<PaginatedResponse<Expense>> {
    return this.get('/finance/expenses', { params: { page, pageSize } });
  }

  async getExpense(id: string): Promise<Expense> {
    return this.get(`/finance/expenses/${id}`);
  }

  async createExpense(data: CreateExpenseInput): Promise<Expense> {
    return this.post('/finance/expenses', data);
  }

  async updateExpense(id: string, data: UpdateExpenseInput): Promise<Expense> {
    return this.patch(`/finance/expenses/${id}`, data);
  }

  async deleteExpense(id: string): Promise<void> {
    return this.delete(`/finance/expenses/${id}`);
  }
}
