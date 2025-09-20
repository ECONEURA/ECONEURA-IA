import { structuredLogger } from './structured-logger.js';
class FiscalidadRegionalService {
    taxRegions = new Map();
    vatTransactions = new Map();
    vatReturns = new Map();
    withholdingTaxes = new Map();
    taxReports = new Map();
    constructor() {
        this.init();
    }
    init() {
        this.createDemoData();
        structuredLogger.info('Fiscalidad Regional UE Service initialized');
    }
    createDemoData() {
        const now = new Date();
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const spainRegion = {
            id: 'region_es',
            organizationId: 'demo-org-1',
            countryCode: 'ES',
            countryName: 'España',
            regionCode: 'ES-MD',
            regionName: 'Madrid',
            taxConfiguration: {
                vatRate: 21,
                reducedVatRates: [
                    { rate: 10, description: 'Reducido', categories: ['alimentacion', 'transporte'] },
                    { rate: 4, description: 'Superreducido', categories: ['medicamentos', 'libros'] }
                ],
                withholdingTaxRate: 19,
                corporateTaxRate: 25,
                socialSecurityRate: 23.6
            },
            regulations: {
                vatRegistrationThreshold: 85000,
                quarterlyReporting: true,
                monthlyReporting: false,
                annualReporting: true,
                digitalServicesTax: false,
                reverseCharge: true,
                vatMoss: true
            },
            importantDates: {
                vatReturnDeadline: '20',
                corporateTaxDeadline: '2024-07-25',
                payrollTaxDeadline: '20',
                annualReportDeadline: '2024-07-25'
            },
            compliance: {
                isActive: true,
                lastAuditDate: '2024-06-15',
                nextAuditDate: '2024-12-15',
                complianceScore: 95,
                riskLevel: 'low',
                notes: 'Cumplimiento excelente'
            },
            createdAt: oneMonthAgo.toISOString(),
            updatedAt: oneMonthAgo.toISOString()
        };
        const franceRegion = {
            id: 'region_fr',
            organizationId: 'demo-org-1',
            countryCode: 'FR',
            countryName: 'Francia',
            regionCode: 'FR-75',
            regionName: 'París',
            taxConfiguration: {
                vatRate: 20,
                reducedVatRates: [
                    { rate: 10, description: 'Reducido', categories: ['alimentacion', 'transporte'] },
                    { rate: 5.5, description: 'Superreducido', categories: ['medicamentos', 'libros'] }
                ],
                withholdingTaxRate: 0,
                corporateTaxRate: 25,
                socialSecurityRate: 45
            },
            regulations: {
                vatRegistrationThreshold: 82800,
                quarterlyReporting: true,
                monthlyReporting: false,
                annualReporting: true,
                digitalServicesTax: true,
                reverseCharge: true,
                vatMoss: true
            },
            importantDates: {
                vatReturnDeadline: '24',
                corporateTaxDeadline: '2024-05-15',
                payrollTaxDeadline: '15',
                annualReportDeadline: '2024-05-15'
            },
            compliance: {
                isActive: true,
                lastAuditDate: '2024-05-20',
                nextAuditDate: '2024-11-20',
                complianceScore: 88,
                riskLevel: 'low',
                notes: 'Cumplimiento bueno'
            },
            createdAt: oneMonthAgo.toISOString(),
            updatedAt: oneMonthAgo.toISOString()
        };
        this.taxRegions.set(spainRegion.id, spainRegion);
        this.taxRegions.set(franceRegion.id, franceRegion);
        const vatTransaction1 = {
            id: 'vat_tx_1',
            organizationId: 'demo-org-1',
            regionId: 'region_es',
            transactionType: 'sale',
            transaction: {
                invoiceNumber: 'INV-2024-001',
                invoiceDate: '2024-08-15',
                dueDate: '2024-09-15',
                customerSupplierId: 'customer_1',
                customerSupplierName: 'TechCorp Solutions',
                customerSupplierVatNumber: 'ES12345678Z',
                customerSupplierCountry: 'ES'
            },
            taxDetails: {
                netAmount: 1000,
                vatRate: 21,
                vatAmount: 210,
                totalAmount: 1210,
                currency: 'EUR',
                vatCode: 'S1',
                reverseCharge: false
            },
            classification: {
                category: 'software',
                subcategory: 'licenses',
                productServiceCode: '8514',
                isDigitalService: false,
                isB2B: true,
                isB2C: false
            },
            status: 'confirmed',
            reportingPeriod: '2024-08',
            reportedAt: '2024-09-20',
            createdAt: '2024-08-15',
            updatedAt: '2024-09-20'
        };
        const vatTransaction2 = {
            id: 'vat_tx_2',
            organizationId: 'demo-org-1',
            regionId: 'region_fr',
            transactionType: 'purchase',
            transaction: {
                invoiceNumber: 'FR-2024-002',
                invoiceDate: '2024-08-20',
                dueDate: '2024-09-20',
                customerSupplierId: 'supplier_1',
                customerSupplierName: 'French Services SARL',
                customerSupplierVatNumber: 'FR12345678901',
                customerSupplierCountry: 'FR'
            },
            taxDetails: {
                netAmount: 500,
                vatRate: 20,
                vatAmount: 100,
                totalAmount: 600,
                currency: 'EUR',
                vatCode: 'S1',
                reverseCharge: false
            },
            classification: {
                category: 'consulting',
                subcategory: 'it_consulting',
                productServiceCode: '6202',
                isDigitalService: false,
                isB2B: true,
                isB2C: false
            },
            status: 'confirmed',
            reportingPeriod: '2024-08',
            reportedAt: '2024-09-24',
            createdAt: '2024-08-20',
            updatedAt: '2024-09-24'
        };
        this.vatTransactions.set(vatTransaction1.id, vatTransaction1);
        this.vatTransactions.set(vatTransaction2.id, vatTransaction2);
        const vatReturn1 = {
            id: 'vat_return_1',
            organizationId: 'demo-org-1',
            regionId: 'region_es',
            period: '2024-08',
            status: 'submitted',
            summary: {
                totalSales: 1000,
                totalPurchases: 0,
                vatOnSales: 210,
                vatOnPurchases: 0,
                vatToPay: 210,
                vatToRefund: 0,
                netVatPosition: 210
            },
            vatBreakdown: [
                {
                    vatRate: 21,
                    salesNet: 1000,
                    salesVat: 210,
                    purchasesNet: 0,
                    purchasesVat: 0
                }
            ],
            transactions: ['vat_tx_1'],
            submission: {
                submittedAt: '2024-09-20',
                submittedBy: 'admin@demo.com',
                referenceNumber: 'ES-2024-08-001',
                paymentReference: 'PAY-2024-08-001',
                paymentDate: '2024-09-20',
                paymentAmount: 210
            },
            createdAt: '2024-09-01',
            updatedAt: '2024-09-20'
        };
        this.vatReturns.set(vatReturn1.id, vatReturn1);
        const withholding1 = {
            id: 'withholding_1',
            organizationId: 'demo-org-1',
            regionId: 'region_es',
            transactionId: 'vat_tx_1',
            payee: {
                id: 'customer_1',
                name: 'TechCorp Solutions',
                taxId: 'ES12345678Z',
                country: 'ES',
                isCompany: true
            },
            withholding: {
                grossAmount: 1210,
                withholdingRate: 19,
                withholdingAmount: 229.9,
                netAmount: 980.1,
                currency: 'EUR',
                withholdingType: 'irpf',
                reason: 'Servicios profesionales'
            },
            period: '2024-08',
            status: 'paid',
            paidAt: '2024-09-20',
            reportedAt: '2024-09-20',
            createdAt: '2024-08-15',
            updatedAt: '2024-09-20'
        };
        this.withholdingTaxes.set(withholding1.id, withholding1);
    }
    async getTaxRegions(organizationId) {
        return Array.from(this.taxRegions.values())
            .filter(r => r.organizationId === organizationId)
            .sort((a, b) => a.countryName.localeCompare(b.countryName));
    }
    async getTaxRegion(regionId) {
        return this.taxRegions.get(regionId);
    }
    async createTaxRegion(regionData) {
        const now = new Date().toISOString();
        const region = {
            id: `region_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            ...regionData,
            createdAt: now,
            updatedAt: now
        };
        this.taxRegions.set(region.id, region);
        structuredLogger.info('Tax region created', {
            regionId: region.id,
            organizationId: region.organizationId,
            country: region.countryCode
        });
        return region;
    }
    async getVATTransactions(organizationId, filters = {}) {
        let transactions = Array.from(this.vatTransactions.values())
            .filter(t => t.organizationId === organizationId);
        if (filters.regionId) {
            transactions = transactions.filter(t => t.regionId === filters.regionId);
        }
        if (filters.transactionType) {
            transactions = transactions.filter(t => t.transactionType === filters.transactionType);
        }
        if (filters.status) {
            transactions = transactions.filter(t => t.status === filters.status);
        }
        if (filters.period) {
            transactions = transactions.filter(t => t.reportingPeriod === filters.period);
        }
        if (filters.limit) {
            transactions = transactions.slice(0, filters.limit);
        }
        return transactions.sort((a, b) => new Date(b.transaction.invoiceDate).getTime() - new Date(a.transaction.invoiceDate).getTime());
    }
    async createVATTransaction(transactionData) {
        const now = new Date().toISOString();
        const transaction = {
            id: `vat_tx_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            ...transactionData,
            createdAt: now,
            updatedAt: now
        };
        this.vatTransactions.set(transaction.id, transaction);
        structuredLogger.info('VAT transaction created', {
            transactionId: transaction.id,
            organizationId: transaction.organizationId,
            type: transaction.transactionType,
            amount: transaction.taxDetails.totalAmount
        });
        return transaction;
    }
    async getVATReturns(organizationId, filters = {}) {
        let returns = Array.from(this.vatReturns.values())
            .filter(r => r.organizationId === organizationId);
        if (filters.regionId) {
            returns = returns.filter(r => r.regionId === filters.regionId);
        }
        if (filters.period) {
            returns = returns.filter(r => r.period === filters.period);
        }
        if (filters.status) {
            returns = returns.filter(r => r.status === filters.status);
        }
        if (filters.limit) {
            returns = returns.slice(0, filters.limit);
        }
        return returns.sort((a, b) => b.period.localeCompare(a.period));
    }
    async createVATReturn(returnData) {
        const now = new Date().toISOString();
        const vatReturn = {
            id: `vat_return_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            ...returnData,
            createdAt: now,
            updatedAt: now
        };
        this.vatReturns.set(vatReturn.id, vatReturn);
        structuredLogger.info('VAT return created', {
            returnId: vatReturn.id,
            organizationId: vatReturn.organizationId,
            period: vatReturn.period,
            vatToPay: vatReturn.summary.vatToPay
        });
        return vatReturn;
    }
    async getWithholdingTaxes(organizationId, filters = {}) {
        let withholdings = Array.from(this.withholdingTaxes.values())
            .filter(w => w.organizationId === organizationId);
        if (filters.regionId) {
            withholdings = withholdings.filter(w => w.regionId === filters.regionId);
        }
        if (filters.period) {
            withholdings = withholdings.filter(w => w.period === filters.period);
        }
        if (filters.status) {
            withholdings = withholdings.filter(w => w.status === filters.status);
        }
        if (filters.limit) {
            withholdings = withholdings.slice(0, filters.limit);
        }
        return withholdings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    async getTaxStats(organizationId) {
        const regions = Array.from(this.taxRegions.values()).filter(r => r.organizationId === organizationId);
        const transactions = Array.from(this.vatTransactions.values()).filter(t => t.organizationId === organizationId);
        const returns = Array.from(this.vatReturns.values()).filter(r => r.organizationId === organizationId);
        const withholdings = Array.from(this.withholdingTaxes.values()).filter(w => w.organizationId === organizationId);
        const now = new Date();
        const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastPeriod = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;
        return {
            totalRegions: regions.length,
            activeRegions: regions.filter(r => r.compliance.isActive).length,
            totalTransactions: transactions.length,
            currentPeriodTransactions: transactions.filter(t => t.reportingPeriod === currentPeriod).length,
            totalVATReturns: returns.length,
            pendingReturns: returns.filter(r => r.status === 'draft').length,
            totalWithholdings: withholdings.length,
            currentPeriodWithholdings: withholdings.filter(w => w.period === currentPeriod).length,
            financial: {
                totalVATCollected: transactions
                    .filter(t => t.transactionType === 'sale')
                    .reduce((sum, t) => sum + t.taxDetails.vatAmount, 0),
                totalVATPaid: transactions
                    .filter(t => t.transactionType === 'purchase')
                    .reduce((sum, t) => sum + t.taxDetails.vatAmount, 0),
                totalWithholdingsPaid: withholdings
                    .filter(w => w.status === 'paid')
                    .reduce((sum, w) => sum + w.withholding.withholdingAmount, 0),
                netVATPosition: returns
                    .filter(r => r.status === 'submitted')
                    .reduce((sum, r) => sum + r.summary.netVatPosition, 0)
            },
            byRegion: regions.map(region => {
                const regionTransactions = transactions.filter(t => t.regionId === region.id);
                const regionReturns = returns.filter(r => r.regionId === region.id);
                const regionWithholdings = withholdings.filter(w => w.regionId === region.id);
                return {
                    regionId: region.id,
                    country: region.countryCode,
                    regionName: region.regionName || region.countryName,
                    transactions: regionTransactions.length,
                    vatReturns: regionReturns.length,
                    withholdings: regionWithholdings.length,
                    complianceScore: region.compliance.complianceScore,
                    riskLevel: region.compliance.riskLevel
                };
            }),
            trends: {
                currentPeriod: {
                    period: currentPeriod,
                    transactions: transactions.filter(t => t.reportingPeriod === currentPeriod).length,
                    vatCollected: transactions
                        .filter(t => t.transactionType === 'sale' && t.reportingPeriod === currentPeriod)
                        .reduce((sum, t) => sum + t.taxDetails.vatAmount, 0),
                    vatPaid: transactions
                        .filter(t => t.transactionType === 'purchase' && t.reportingPeriod === currentPeriod)
                        .reduce((sum, t) => sum + t.taxDetails.vatAmount, 0)
                },
                lastPeriod: {
                    period: lastPeriod,
                    transactions: transactions.filter(t => t.reportingPeriod === lastPeriod).length,
                    vatCollected: transactions
                        .filter(t => t.transactionType === 'sale' && t.reportingPeriod === lastPeriod)
                        .reduce((sum, t) => sum + t.taxDetails.vatAmount, 0),
                    vatPaid: transactions
                        .filter(t => t.transactionType === 'purchase' && t.reportingPeriod === lastPeriod)
                        .reduce((sum, t) => sum + t.taxDetails.vatAmount, 0)
                }
            },
            compliance: {
                averageScore: regions.length > 0 ?
                    regions.reduce((sum, r) => sum + r.compliance.complianceScore, 0) / regions.length : 0,
                highRiskRegions: regions.filter(r => r.compliance.riskLevel === 'high').length,
                mediumRiskRegions: regions.filter(r => r.compliance.riskLevel === 'medium').length,
                lowRiskRegions: regions.filter(r => r.compliance.riskLevel === 'low').length,
                nextAudits: regions
                    .filter(r => r.compliance.nextAuditDate)
                    .sort((a, b) => new Date(a.compliance.nextAuditDate).getTime() - new Date(b.compliance.nextAuditDate).getTime())
                    .slice(0, 3)
                    .map(r => ({
                    regionId: r.id,
                    country: r.countryCode,
                    nextAuditDate: r.compliance.nextAuditDate
                }))
            }
        };
    }
    async calculateVAT(regionId, netAmount, vatRate, transactionType) {
        const region = this.taxRegions.get(regionId);
        if (!region) {
            throw new Error('Tax region not found');
        }
        const vatAmount = netAmount * (vatRate / 100);
        const totalAmount = netAmount + vatAmount;
        return {
            netAmount,
            vatRate,
            vatAmount: Math.round(vatAmount * 100) / 100,
            totalAmount: Math.round(totalAmount * 100) / 100
        };
    }
    async validateVATNumber(vatNumber, countryCode) {
        const vatPatterns = {
            'ES': /^[A-Z]\d{8}$/,
            'FR': /^\d{2}\s?\d{9}$/,
            'DE': /^\d{9}$/,
            'IT': /^\d{11}$/,
            'NL': /^NL\d{9}B\d{2}$/,
            'BE': /^\d{10}$/,
            'PT': /^\d{9}$/,
            'AT': /^ATU\d{8}$/,
            'IE': /^\d[A-Z]\d{5}[A-Z]$/,
            'FI': /^\d{8}$/,
            'LU': /^\d{8}$/,
            'SE': /^\d{12}$/,
            'DK': /^\d{8}$/,
            'PL': /^\d{10}$/,
            'CZ': /^\d{8,10}$/,
            'HU': /^\d{8}$/,
            'SK': /^\d{10}$/,
            'SI': /^\d{8}$/,
            'HR': /^\d{11}$/,
            'RO': /^RO\d{2,10}$/,
            'BG': /^\d{9,10}$/,
            'CY': /^\d{8}[A-Z]$/,
            'MT': /^\d{8}$/,
            'EE': /^\d{9}$/,
            'LV': /^\d{11}$/,
            'LT': /^\d{9,12}$/
        };
        const pattern = vatPatterns[countryCode];
        if (!pattern) {
            return {
                isValid: false,
                format: 'Unknown country',
                country: countryCode
            };
        }
        const isValid = pattern.test(vatNumber);
        return {
            isValid,
            format: pattern.toString(),
            country: countryCode
        };
    }
}
export const fiscalidadRegionalService = new FiscalidadRegionalService();
//# sourceMappingURL=fiscalidad-regional.service.js.map