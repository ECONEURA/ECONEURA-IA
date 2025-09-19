interface TaxRegion {
    id: string;
    organizationId: string;
    countryCode: string;
    countryName: string;
    regionCode?: string;
    regionName?: string;
    taxConfiguration: {
        vatRate: number;
        reducedVatRates: Array<{
            rate: number;
            description: string;
            categories: string[];
        }>;
        withholdingTaxRate: number;
        corporateTaxRate: number;
        socialSecurityRate: number;
    };
    regulations: {
        vatRegistrationThreshold: number;
        quarterlyReporting: boolean;
        monthlyReporting: boolean;
        annualReporting: boolean;
        digitalServicesTax: boolean;
        reverseCharge: boolean;
        vatMoss: boolean;
    };
    importantDates: {
        vatReturnDeadline: string;
        corporateTaxDeadline: string;
        payrollTaxDeadline: string;
        annualReportDeadline: string;
    };
    compliance: {
        isActive: boolean;
        lastAuditDate?: string;
        nextAuditDate?: string;
        complianceScore: number;
        riskLevel: 'low' | 'medium' | 'high';
        notes?: string;
    };
    createdAt: string;
    updatedAt: string;
}
interface VATTransaction {
    id: string;
    organizationId: string;
    regionId: string;
    transactionType: 'sale' | 'purchase' | 'import' | 'export' | 'reverse_charge';
    transaction: {
        invoiceNumber: string;
        invoiceDate: string;
        dueDate: string;
        customerSupplierId: string;
        customerSupplierName: string;
        customerSupplierVatNumber?: string;
        customerSupplierCountry: string;
    };
    taxDetails: {
        netAmount: number;
        vatRate: number;
        vatAmount: number;
        totalAmount: number;
        currency: string;
        vatCode: string;
        exemptionReason?: string;
        reverseCharge?: boolean;
    };
    classification: {
        category: string;
        subcategory?: string;
        productServiceCode?: string;
        isDigitalService: boolean;
        isB2B: boolean;
        isB2C: boolean;
    };
    status: 'draft' | 'confirmed' | 'reported' | 'paid' | 'cancelled';
    reportingPeriod: string;
    reportedAt?: string;
    createdAt: string;
    updatedAt: string;
}
interface VATReturn {
    id: string;
    organizationId: string;
    regionId: string;
    period: string;
    status: 'draft' | 'submitted' | 'accepted' | 'rejected' | 'amended';
    summary: {
        totalSales: number;
        totalPurchases: number;
        vatOnSales: number;
        vatOnPurchases: number;
        vatToPay: number;
        vatToRefund: number;
        netVatPosition: number;
    };
    vatBreakdown: Array<{
        vatRate: number;
        salesNet: number;
        salesVat: number;
        purchasesNet: number;
        purchasesVat: number;
    }>;
    transactions: string[];
    submission: {
        submittedAt?: string;
        submittedBy?: string;
        referenceNumber?: string;
        paymentReference?: string;
        paymentDate?: string;
        paymentAmount?: number;
        rejectionReason?: string;
    };
    createdAt: string;
    updatedAt: string;
}
interface WithholdingTax {
    id: string;
    organizationId: string;
    regionId: string;
    transactionId: string;
    payee: {
        id: string;
        name: string;
        taxId: string;
        country: string;
        isCompany: boolean;
    };
    withholding: {
        grossAmount: number;
        withholdingRate: number;
        withholdingAmount: number;
        netAmount: number;
        currency: string;
        withholdingType: 'irpf' | 'corporate' | 'social_security' | 'other';
        reason: string;
    };
    period: string;
    status: 'calculated' | 'paid' | 'reported' | 'cancelled';
    paidAt?: string;
    reportedAt?: string;
    createdAt: string;
    updatedAt: string;
}
declare class FiscalidadRegionalService {
    private taxRegions;
    private vatTransactions;
    private vatReturns;
    private withholdingTaxes;
    private taxReports;
    constructor();
    init(): void;
    private createDemoData;
    getTaxRegions(organizationId: string): Promise<TaxRegion[]>;
    getTaxRegion(regionId: string): Promise<TaxRegion | undefined>;
    createTaxRegion(regionData: Omit<TaxRegion, 'id' | 'createdAt' | 'updatedAt'>): Promise<TaxRegion>;
    getVATTransactions(organizationId: string, filters?: {
        regionId?: string;
        transactionType?: string;
        status?: string;
        period?: string;
        limit?: number;
    }): Promise<VATTransaction[]>;
    createVATTransaction(transactionData: Omit<VATTransaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<VATTransaction>;
    getVATReturns(organizationId: string, filters?: {
        regionId?: string;
        period?: string;
        status?: string;
        limit?: number;
    }): Promise<VATReturn[]>;
    createVATReturn(returnData: Omit<VATReturn, 'id' | 'createdAt' | 'updatedAt'>): Promise<VATReturn>;
    getWithholdingTaxes(organizationId: string, filters?: {
        regionId?: string;
        period?: string;
        status?: string;
        limit?: number;
    }): Promise<WithholdingTax[]>;
    getTaxStats(organizationId: string): Promise<{
        totalRegions: number;
        activeRegions: number;
        totalTransactions: number;
        currentPeriodTransactions: number;
        totalVATReturns: number;
        pendingReturns: number;
        totalWithholdings: number;
        currentPeriodWithholdings: number;
        financial: {
            totalVATCollected: number;
            totalVATPaid: number;
            totalWithholdingsPaid: number;
            netVATPosition: number;
        };
        byRegion: {
            regionId: string;
            country: string;
            regionName: string;
            transactions: number;
            vatReturns: number;
            withholdings: number;
            complianceScore: number;
            riskLevel: "low" | "medium" | "high";
        }[];
        trends: {
            currentPeriod: {
                period: string;
                transactions: number;
                vatCollected: number;
                vatPaid: number;
            };
            lastPeriod: {
                period: string;
                transactions: number;
                vatCollected: number;
                vatPaid: number;
            };
        };
        compliance: {
            averageScore: number;
            highRiskRegions: number;
            mediumRiskRegions: number;
            lowRiskRegions: number;
            nextAudits: {
                regionId: string;
                country: string;
                nextAuditDate: string;
            }[];
        };
    }>;
    calculateVAT(regionId: string, netAmount: number, vatRate: number, transactionType: 'sale' | 'purchase'): Promise<{
        netAmount: number;
        vatRate: number;
        vatAmount: number;
        totalAmount: number;
    }>;
    validateVATNumber(vatNumber: string, countryCode: string): Promise<{
        isValid: boolean;
        format: string;
        country: string;
    }>;
}
export declare const fiscalidadRegionalService: FiscalidadRegionalService;
export {};
//# sourceMappingURL=fiscalidad-regional.service.d.ts.map