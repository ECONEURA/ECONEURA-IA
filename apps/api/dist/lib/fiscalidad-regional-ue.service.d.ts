export interface TaxRegion {
    id: string;
    country: string;
    region: string;
    taxCode: string;
    taxRate: number;
    taxType: 'VAT' | 'Sales' | 'Corporate' | 'Income' | 'Property' | 'Excise';
    effectiveDate: string;
    expirationDate?: string;
    description: string;
    organizationId: string;
    metadata?: Record<string, any>;
}
export interface TaxCalculation {
    id: string;
    transactionId: string;
    customerId: string;
    customerRegion: string;
    supplierRegion: string;
    amount: number;
    currency: string;
    taxRate: number;
    taxAmount: number;
    totalAmount: number;
    taxType: string;
    calculationMethod: 'standard' | 'reverse_charge' | 'exemption' | 'reduced';
    applicableRules: string[];
    complianceStatus: 'compliant' | 'non_compliant' | 'pending_review';
    calculatedAt: string;
    validatedAt?: string;
    metadata?: Record<string, any>;
}
export interface TaxRule {
    id: string;
    ruleName: string;
    ruleType: 'threshold' | 'exemption' | 'rate' | 'reverse_charge' | 'compliance';
    fromRegion: string;
    toRegion: string;
    conditions: {
        minAmount?: number;
        maxAmount?: number;
        customerType?: string;
        productType?: string;
        serviceType?: string;
    };
    action: {
        type: 'apply_rate' | 'exempt' | 'reverse_charge' | 'require_documentation';
        value?: number;
        documentation?: string[];
    };
    effectiveDate: string;
    expirationDate?: string;
    priority: number;
    organizationId: string;
}
export interface TaxCompliance {
    id: string;
    organizationId: string;
    region: string;
    complianceType: 'VAT_registration' | 'tax_filing' | 'reporting' | 'audit';
    status: 'compliant' | 'non_compliant' | 'pending' | 'exempt';
    dueDate: string;
    submittedDate?: string;
    documents: string[];
    penalties: number;
    notes: string[];
    lastUpdated: string;
}
export interface FiscalidadConfig {
    enabled: boolean;
    defaultRegion: string;
    autoCalculation: boolean;
    complianceMonitoring: boolean;
    reportingEnabled: boolean;
    auditTrail: boolean;
    regions: {
        [regionCode: string]: {
            enabled: boolean;
            taxRates: Record<string, number>;
            rules: string[];
            compliance: boolean;
        };
    };
    thresholds: {
        vatRegistration: number;
        reverseCharge: number;
        exemption: number;
    };
    reporting: {
        frequency: 'monthly' | 'quarterly' | 'annually';
        format: 'xml' | 'json' | 'csv';
        deadline: number;
    };
}
export interface FiscalidadStats {
    totalRegions: number;
    activeRegions: number;
    totalCalculations: number;
    compliantCalculations: number;
    complianceRate: number;
    totalTaxCollected: number;
    averageTaxRate: number;
    pendingCompliance: number;
    lastRun: string;
}
export declare class FiscalidadRegionalUEService {
    private config;
    private taxRegions;
    private taxRules;
    private calculations;
    private compliance;
    private stats;
    private isProcessing;
    private processingInterval;
    constructor(config?: Partial<FiscalidadConfig>);
    private initializeEURegions;
    private initializeTaxRules;
    private startPeriodicProcessing;
    processComplianceMonitoring(): Promise<FiscalidadStats>;
    private checkComplianceByRegion;
    private checkRegionCompliance;
    private updateCalculationStats;
    private generateReports;
    private calculateStats;
    calculateTax(transaction: {
        customerId: string;
        customerRegion: string;
        supplierRegion: string;
        amount: number;
        currency: string;
        customerType?: string;
        productType?: string;
    }): Promise<TaxCalculation>;
    private getApplicableRules;
    private isRuleApplicable;
    private determineTaxRate;
    private determineCalculationMethod;
    getTaxRegions(): TaxRegion[];
    getTaxRules(): TaxRule[];
    getTaxCalculations(limit?: number): TaxCalculation[];
    getComplianceStatus(): TaxCompliance[];
    getStats(): FiscalidadStats;
    updateConfig(newConfig: Partial<FiscalidadConfig>): void;
    stop(): void;
}
export declare const fiscalidadRegionalUEService: FiscalidadRegionalUEService;
//# sourceMappingURL=fiscalidad-regional-ue.service.d.ts.map