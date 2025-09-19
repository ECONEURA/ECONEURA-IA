import { Invoice } from '../entities/invoice.entity.js';
import { BaseRepository, BaseFilters, BaseSearchOptions, PaginatedResult, BaseStats } from './base.repository.js';
export interface InvoiceFilters extends BaseFilters {
    type?: string;
    status?: string;
    paymentStatus?: string;
    companyId?: string;
    contactId?: string;
    issueDateFrom?: Date;
    issueDateTo?: Date;
    dueDateFrom?: Date;
    dueDateTo?: Date;
    paidDateFrom?: Date;
    paidDateTo?: Date;
    minAmount?: number;
    maxAmount?: number;
    isOverdue?: boolean;
    isPaid?: boolean;
    isPartiallyPaid?: boolean;
    isPending?: boolean;
}
export interface InvoiceSearchOptions extends BaseSearchOptions {
    type?: string;
    status?: string;
    paymentStatus?: string;
    companyId?: string;
    contactId?: string;
    issueDateFrom?: Date;
    issueDateTo?: Date;
    dueDateFrom?: Date;
    dueDateTo?: Date;
    minAmount?: number;
    maxAmount?: number;
}
export interface InvoiceStats extends BaseStats {
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    byPaymentStatus: Record<string, number>;
    totalAmount: number;
    paidAmount: number;
    outstandingAmount: number;
    overdueAmount: number;
    averageAmount: number;
    averagePaymentTime: number;
    overdueCount: number;
    paidCount: number;
    pendingCount: number;
    partiallyPaidCount: number;
}
export interface InvoiceRepository extends BaseRepository<Invoice> {
    findByInvoiceNumber(invoiceNumber: string, organizationId: string): Promise<Invoice | null>;
    findByType(type: string, organizationId: string, options?: InvoiceSearchOptions): Promise<PaginatedResult<Invoice>>;
    findByStatus(status: string, organizationId: string, options?: InvoiceSearchOptions): Promise<PaginatedResult<Invoice>>;
    findByPaymentStatus(paymentStatus: string, organizationId: string, options?: InvoiceSearchOptions): Promise<PaginatedResult<Invoice>>;
    findByCompanyId(companyId: string, organizationId: string, options?: InvoiceSearchOptions): Promise<PaginatedResult<Invoice>>;
    findByContactId(contactId: string, organizationId: string, options?: InvoiceSearchOptions): Promise<PaginatedResult<Invoice>>;
    findByIssueDateRange(organizationId: string, startDate: Date, endDate: Date, options?: InvoiceSearchOptions): Promise<PaginatedResult<Invoice>>;
    findByDueDateRange(organizationId: string, startDate: Date, endDate: Date, options?: InvoiceSearchOptions): Promise<PaginatedResult<Invoice>>;
    findByPaidDateRange(organizationId: string, startDate: Date, endDate: Date, options?: InvoiceSearchOptions): Promise<PaginatedResult<Invoice>>;
    findOverdueInvoices(organizationId: string, options?: InvoiceSearchOptions): Promise<PaginatedResult<Invoice>>;
    findInvoicesDueSoon(organizationId: string, days: number, options?: InvoiceSearchOptions): Promise<PaginatedResult<Invoice>>;
    findByAmountRange(organizationId: string, minAmount: number, maxAmount: number, options?: InvoiceSearchOptions): Promise<PaginatedResult<Invoice>>;
    findHighValueInvoices(organizationId: string, threshold: number, options?: InvoiceSearchOptions): Promise<PaginatedResult<Invoice>>;
    findLowValueInvoices(organizationId: string, threshold: number, options?: InvoiceSearchOptions): Promise<PaginatedResult<Invoice>>;
    findPaidInvoices(organizationId: string, options?: InvoiceSearchOptions): Promise<PaginatedResult<Invoice>>;
    findUnpaidInvoices(organizationId: string, options?: InvoiceSearchOptions): Promise<PaginatedResult<Invoice>>;
    findPartiallyPaidInvoices(organizationId: string, options?: InvoiceSearchOptions): Promise<PaginatedResult<Invoice>>;
    findOverdueInvoices(organizationId: string, options?: InvoiceSearchOptions): Promise<PaginatedResult<Invoice>>;
    searchByInvoiceNumber(invoiceNumber: string, organizationId: string): Promise<Invoice[]>;
    searchByReference(reference: string, organizationId: string): Promise<Invoice[]>;
    searchByCompanyName(companyName: string, organizationId: string): Promise<Invoice[]>;
    searchByContactName(contactName: string, organizationId: string): Promise<Invoice[]>;
    updateStatusMany(ids: string[], status: string): Promise<void>;
    updatePaymentStatusMany(ids: string[], paymentStatus: string): Promise<void>;
    markAsPaidMany(ids: string[], paidDate: Date): Promise<void>;
    markAsOverdueMany(ids: string[]): Promise<void>;
    sendRemindersMany(ids: string[]): Promise<void>;
    getStats(organizationId: string, filters?: InvoiceFilters): Promise<InvoiceStats>;
    getStatsByType(organizationId: string, type: string): Promise<InvoiceStats>;
    getStatsByStatus(organizationId: string, status: string): Promise<InvoiceStats>;
    getStatsByPaymentStatus(organizationId: string, paymentStatus: string): Promise<InvoiceStats>;
    getStatsByCompany(organizationId: string, companyId: string): Promise<InvoiceStats>;
    getStatsByContact(organizationId: string, contactId: string): Promise<InvoiceStats>;
    getRevenueStats(organizationId: string, startDate: Date, endDate: Date): Promise<{
        totalRevenue: number;
        paidRevenue: number;
        outstandingRevenue: number;
        overdueRevenue: number;
        averageInvoiceValue: number;
        averagePaymentTime: number;
        paymentTrends: Array<{
            date: Date;
            amount: number;
            count: number;
        }>;
    }>;
    getPaymentAnalytics(organizationId: string, startDate: Date, endDate: Date): Promise<{
        totalInvoices: number;
        paidInvoices: number;
        overdueInvoices: number;
        averagePaymentTime: number;
        paymentMethodBreakdown: Record<string, number>;
        paymentTrends: Array<{
            date: Date;
            paid: number;
            overdue: number;
        }>;
    }>;
    getOverdueAnalytics(organizationId: string): Promise<{
        totalOverdue: number;
        totalOverdueAmount: number;
        averageOverdueDays: number;
        overdueByAge: Array<{
            ageRange: string;
            count: number;
            amount: number;
        }>;
        overdueByCompany: Array<{
            companyId: string;
            companyName: string;
            count: number;
            amount: number;
        }>;
    }>;
    existsByInvoiceNumber(invoiceNumber: string, organizationId: string): Promise<boolean>;
    getNextInvoiceNumber(organizationId: string, prefix?: string): Promise<string>;
    getInvoiceCount(organizationId: string, filters?: InvoiceFilters): Promise<number>;
    getTotalAmount(organizationId: string, filters?: InvoiceFilters): Promise<number>;
    getPaidAmount(organizationId: string, filters?: InvoiceFilters): Promise<number>;
    getOutstandingAmount(organizationId: string, filters?: InvoiceFilters): Promise<number>;
    getOverdueAmount(organizationId: string, filters?: InvoiceFilters): Promise<number>;
    generateInvoiceReport(organizationId: string, filters?: InvoiceFilters): Promise<{
        summary: InvoiceStats;
        invoices: Invoice[];
        generatedAt: Date;
    }>;
    generatePaymentReport(organizationId: string, startDate: Date, endDate: Date): Promise<{
        summary: {
            totalInvoices: number;
            totalAmount: number;
            paidAmount: number;
            outstandingAmount: number;
            overdueAmount: number;
        };
        payments: Array<{
            invoiceId: string;
            invoiceNumber: string;
            amount: number;
            paidDate: Date;
            paymentMethod: string;
        }>;
        generatedAt: Date;
    }>;
    generateOverdueReport(organizationId: string): Promise<{
        summary: {
            totalOverdue: number;
            totalAmount: number;
            averageDays: number;
        };
        overdueInvoices: Array<{
            invoiceId: string;
            invoiceNumber: string;
            companyName: string;
            amount: number;
            dueDate: Date;
            daysOverdue: number;
        }>;
        generatedAt: Date;
    }>;
}
//# sourceMappingURL=invoice.repository.d.ts.map