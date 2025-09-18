import { BaseClient, PaginatedResponse } from './base-client.js';

// Finance Types
export interface Account {
  id: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  code: string;
  parent_id?: string;
  balance: number;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  account_id: string;
  description: string;
  amount: number;
  type: 'debit' | 'credit';
  reference?: string;
  date: string;
  category?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface Budget {
  id: string;
  name: string;
  account_id: string;
  period: 'monthly' | 'quarterly' | 'yearly';
  amount: number;
  currency: string;
  start_date: string;
  end_date: string;
  spent_amount: number;
  remaining_amount: number;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface TaxRate {
  id: string;
  name: string;
  rate: number;
  type: 'percentage' | 'fixed';
  country: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaymentTerm {
  id: string;
  name: string;
  days: number;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FinancialReport {
  id: string;
  type: 'balance_sheet' | 'income_statement' | 'cash_flow' | 'trial_balance';
  period_start: string;
  period_end: string;
  data: any;
  generated_at: string;
  created_at: string;
}

// Input Types
export interface CreateAccountInput {
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  code: string;
  parent_id?: string;
  balance?: number;
  currency: string;
  is_active?: boolean;
}

export interface UpdateAccountInput {
  name?: string;
  type?: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  code?: string;
  parent_id?: string;
  balance?: number;
  currency?: string;
  is_active?: boolean;
}

export interface CreateTransactionInput {
  account_id: string;
  description: string;
  amount: number;
  type: 'debit' | 'credit';
  reference?: string;
  date: string;
  category?: string;
  tags?: string[];
}

export interface UpdateTransactionInput {
  account_id?: string;
  description?: string;
  amount?: number;
  type?: 'debit' | 'credit';
  reference?: string;
  date?: string;
  category?: string;
  tags?: string[];
}

export interface CreateBudgetInput {
  name: string;
  account_id: string;
  period: 'monthly' | 'quarterly' | 'yearly';
  amount: number;
  currency: string;
  start_date: string;
  end_date: string;
}

export interface UpdateBudgetInput {
  name?: string;
  account_id?: string;
  period?: 'monthly' | 'quarterly' | 'yearly';
  amount?: number;
  currency?: string;
  start_date?: string;
  end_date?: string;
  status?: 'active' | 'completed' | 'cancelled';
}

export interface CreateTaxRateInput {
  name: string;
  rate: number;
  type: 'percentage' | 'fixed';
  country: string;
  is_active?: boolean;
}

export interface UpdateTaxRateInput {
  name?: string;
  rate?: number;
  type?: 'percentage' | 'fixed';
  country?: string;
  is_active?: boolean;
}

export interface CreatePaymentTermInput {
  name: string;
  days: number;
  description?: string;
  is_active?: boolean;
}

export interface UpdatePaymentTermInput {
  name?: string;
  days?: number;
  description?: string;
  is_active?: boolean;
}

export class FinanceClient extends BaseClient {
  // Accounts
  async listAccounts(page = 1, pageSize = 20): Promise<PaginatedResponse<Account>> {
    return this.get('/v1/finance/accounts', { params: { page, pageSize } });
  }

  async getAccount(id: string): Promise<Account> {
    return this.get(`/v1/finance/accounts/${id}`);
  }

  async createAccount(data: CreateAccountInput): Promise<Account> {
    return this.post('/v1/finance/accounts', data);
  }

  async updateAccount(id: string, data: UpdateAccountInput): Promise<Account> {
    return this.patch(`/v1/finance/accounts/${id}`, data);
  }

  async deleteAccount(id: string): Promise<void> {
    return this.delete(`/v1/finance/accounts/${id}`);
  }

  async getAccountBalance(id: string): Promise<{ balance: number; currency: string }> {
    return this.get(`/v1/finance/accounts/${id}/balance`);
  }

  // Transactions
  async listTransactions(page = 1, pageSize = 20): Promise<PaginatedResponse<Transaction>> {
    return this.get('/v1/finance/transactions', { params: { page, pageSize } });
  }

  async getTransaction(id: string): Promise<Transaction> {
    return this.get(`/v1/finance/transactions/${id}`);
  }

  async createTransaction(data: CreateTransactionInput): Promise<Transaction> {
    return this.post('/v1/finance/transactions', data);
  }

  async updateTransaction(id: string, data: UpdateTransactionInput): Promise<Transaction> {
    return this.patch(`/v1/finance/transactions/${id}`, data);
  }

  async deleteTransaction(id: string): Promise<void> {
    return this.delete(`/v1/finance/transactions/${id}`);
  }

  async getTransactionsByAccount(accountId: string, page = 1, pageSize = 20): Promise<PaginatedResponse<Transaction>> {
    return this.get(`/v1/finance/accounts/${accountId}/transactions`, { params: { page, pageSize } });
  }

  // Budgets
  async listBudgets(page = 1, pageSize = 20): Promise<PaginatedResponse<Budget>> {
    return this.get('/v1/finance/budgets', { params: { page, pageSize } });
  }

  async getBudget(id: string): Promise<Budget> {
    return this.get(`/v1/finance/budgets/${id}`);
  }

  async createBudget(data: CreateBudgetInput): Promise<Budget> {
    return this.post('/v1/finance/budgets', data);
  }

  async updateBudget(id: string, data: UpdateBudgetInput): Promise<Budget> {
    return this.patch(`/v1/finance/budgets/${id}`, data);
  }

  async deleteBudget(id: string): Promise<void> {
    return this.delete(`/v1/finance/budgets/${id}`);
  }

  async getActiveBudgets(): Promise<Budget[]> {
    return this.get('/v1/finance/budgets/active');
  }

  // Tax Rates
  async listTaxRates(): Promise<TaxRate[]> {
    return this.get('/v1/finance/tax-rates');
  }

  async getTaxRate(id: string): Promise<TaxRate> {
    return this.get(`/v1/finance/tax-rates/${id}`);
  }

  async createTaxRate(data: CreateTaxRateInput): Promise<TaxRate> {
    return this.post('/v1/finance/tax-rates', data);
  }

  async updateTaxRate(id: string, data: UpdateTaxRateInput): Promise<TaxRate> {
    return this.patch(`/v1/finance/tax-rates/${id}`, data);
  }

  async deleteTaxRate(id: string): Promise<void> {
    return this.delete(`/v1/finance/tax-rates/${id}`);
  }

  // Payment Terms
  async listPaymentTerms(): Promise<PaymentTerm[]> {
    return this.get('/v1/finance/payment-terms');
  }

  async getPaymentTerm(id: string): Promise<PaymentTerm> {
    return this.get(`/v1/finance/payment-terms/${id}`);
  }

  async createPaymentTerm(data: CreatePaymentTermInput): Promise<PaymentTerm> {
    return this.post('/v1/finance/payment-terms', data);
  }

  async updatePaymentTerm(id: string, data: UpdatePaymentTermInput): Promise<PaymentTerm> {
    return this.patch(`/v1/finance/payment-terms/${id}`, data);
  }

  async deletePaymentTerm(id: string): Promise<void> {
    return this.delete(`/v1/finance/payment-terms/${id}`);
  }

  // Reports
  async generateFinancialReport(
    type: 'balance_sheet' | 'income_statement' | 'cash_flow' | 'trial_balance',
    startDate: string,
    endDate: string
  ): Promise<FinancialReport> {
    return this.post('/v1/finance/reports/generate', {
      type,
      start_date: startDate,
      end_date: endDate
    });
  }

  async getFinancialReport(id: string): Promise<FinancialReport> {
    return this.get(`/v1/finance/reports/${id}`);
  }

  async listFinancialReports(page = 1, pageSize = 20): Promise<PaginatedResponse<FinancialReport>> {
    return this.get('/v1/finance/reports', { params: { page, pageSize } });
  }

  // Analytics
  async getFinancialSummary(): Promise<{
    total_assets: number;
    total_liabilities: number;
    total_equity: number;
    net_income: number;
    cash_flow: number;
  }> {
    return this.get('/v1/finance/analytics/summary');
  }

  async getBudgetAnalysis(): Promise<{
    total_budgeted: number;
    total_spent: number;
    remaining_budget: number;
    budget_utilization: number;
    over_budget_count: number;
  }> {
    return this.get('/v1/finance/analytics/budget');
  }
}
