import { BaseClient, PaginatedResponse } from './base-client.js';
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
export declare class FinanceClient extends BaseClient {
    listAccounts(page?: number, pageSize?: number): Promise<PaginatedResponse<Account>>;
    getAccount(id: string): Promise<Account>;
    createAccount(data: CreateAccountInput): Promise<Account>;
    updateAccount(id: string, data: UpdateAccountInput): Promise<Account>;
    deleteAccount(id: string): Promise<void>;
    getAccountBalance(id: string): Promise<{
        balance: number;
        currency: string;
    }>;
    listTransactions(page?: number, pageSize?: number): Promise<PaginatedResponse<Transaction>>;
    getTransaction(id: string): Promise<Transaction>;
    createTransaction(data: CreateTransactionInput): Promise<Transaction>;
    updateTransaction(id: string, data: UpdateTransactionInput): Promise<Transaction>;
    deleteTransaction(id: string): Promise<void>;
    getTransactionsByAccount(accountId: string, page?: number, pageSize?: number): Promise<PaginatedResponse<Transaction>>;
    listBudgets(page?: number, pageSize?: number): Promise<PaginatedResponse<Budget>>;
    getBudget(id: string): Promise<Budget>;
    createBudget(data: CreateBudgetInput): Promise<Budget>;
    updateBudget(id: string, data: UpdateBudgetInput): Promise<Budget>;
    deleteBudget(id: string): Promise<void>;
    getActiveBudgets(): Promise<Budget[]>;
    listTaxRates(): Promise<TaxRate[]>;
    getTaxRate(id: string): Promise<TaxRate>;
    createTaxRate(data: CreateTaxRateInput): Promise<TaxRate>;
    updateTaxRate(id: string, data: UpdateTaxRateInput): Promise<TaxRate>;
    deleteTaxRate(id: string): Promise<void>;
    listPaymentTerms(): Promise<PaymentTerm[]>;
    getPaymentTerm(id: string): Promise<PaymentTerm>;
    createPaymentTerm(data: CreatePaymentTermInput): Promise<PaymentTerm>;
    updatePaymentTerm(id: string, data: UpdatePaymentTermInput): Promise<PaymentTerm>;
    deletePaymentTerm(id: string): Promise<void>;
    generateFinancialReport(type: 'balance_sheet' | 'income_statement' | 'cash_flow' | 'trial_balance', startDate: string, endDate: string): Promise<FinancialReport>;
    getFinancialReport(id: string): Promise<FinancialReport>;
    listFinancialReports(page?: number, pageSize?: number): Promise<PaginatedResponse<FinancialReport>>;
    getFinancialSummary(): Promise<{
        total_assets: number;
        total_liabilities: number;
        total_equity: number;
        net_income: number;
        cash_flow: number;
    }>;
    getBudgetAnalysis(): Promise<{
        total_budgeted: number;
        total_spent: number;
        remaining_budget: number;
        budget_utilization: number;
        over_budget_count: number;
    }>;
}
//# sourceMappingURL=finance-client.d.ts.map