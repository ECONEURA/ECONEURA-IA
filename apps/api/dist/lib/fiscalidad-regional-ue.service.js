import { structuredLogger } from './structured-logger.js';
export class FiscalidadRegionalUEService {
    config;
    taxRegions = new Map();
    taxRules = new Map();
    calculations = new Map();
    compliance = new Map();
    stats;
    isProcessing = false;
    processingInterval = null;
    constructor(config = {}) {
        this.config = {
            enabled: true,
            defaultRegion: 'ES',
            autoCalculation: true,
            complianceMonitoring: true,
            reportingEnabled: true,
            auditTrail: true,
            regions: {},
            thresholds: {
                vatRegistration: 85000,
                reverseCharge: 0,
                exemption: 0
            },
            reporting: {
                frequency: 'quarterly',
                format: 'xml',
                deadline: 7
            },
            ...config
        };
        this.stats = {
            totalRegions: 0,
            activeRegions: 0,
            totalCalculations: 0,
            compliantCalculations: 0,
            complianceRate: 0,
            totalTaxCollected: 0,
            averageTaxRate: 0,
            pendingCompliance: 0,
            lastRun: new Date().toISOString()
        };
        this.initializeEURegions();
        this.startPeriodicProcessing();
        structuredLogger.info('Fiscalidad Regional UE service initialized', {
            config: this.config,
            requestId: ''
        });
    }
    initializeEURegions() {
        const euRegions = [
            { country: 'ES', region: 'España', taxCode: 'ES-VAT', taxRate: 0.21, taxType: 'VAT' },
            { country: 'FR', region: 'Francia', taxCode: 'FR-VAT', taxRate: 0.20, taxType: 'VAT' },
            { country: 'DE', region: 'Alemania', taxCode: 'DE-VAT', taxRate: 0.19, taxType: 'VAT' },
            { country: 'IT', region: 'Italia', taxCode: 'IT-VAT', taxRate: 0.22, taxType: 'VAT' },
            { country: 'PT', region: 'Portugal', taxCode: 'PT-VAT', taxRate: 0.23, taxType: 'VAT' },
            { country: 'NL', region: 'Países Bajos', taxCode: 'NL-VAT', taxRate: 0.21, taxType: 'VAT' },
            { country: 'BE', region: 'Bélgica', taxCode: 'BE-VAT', taxRate: 0.21, taxType: 'VAT' },
            { country: 'AT', region: 'Austria', taxCode: 'AT-VAT', taxRate: 0.20, taxType: 'VAT' },
            { country: 'IE', region: 'Irlanda', taxCode: 'IE-VAT', taxRate: 0.23, taxType: 'VAT' },
            { country: 'FI', region: 'Finlandia', taxCode: 'FI-VAT', taxRate: 0.24, taxType: 'VAT' }
        ];
        for (const region of euRegions) {
            const taxRegion = {
                id: `tax_region_${region.country}`,
                country: region.country,
                region: region.region,
                taxCode: region.taxCode,
                taxRate: region.taxRate,
                taxType: region.taxType,
                effectiveDate: new Date().toISOString(),
                description: `Región fiscal ${region.region} (${region.country})`,
                organizationId: 'default'
            };
            this.taxRegions.set(taxRegion.id, taxRegion);
        }
        this.initializeTaxRules();
    }
    initializeTaxRules() {
        const rules = [
            {
                id: 'rule_reverse_charge_b2b',
                ruleName: 'Reverse Charge B2B EU',
                ruleType: 'reverse_charge',
                fromRegion: 'EU',
                toRegion: 'EU',
                conditions: {
                    customerType: 'business',
                    minAmount: 0
                },
                action: {
                    type: 'reverse_charge'
                },
                effectiveDate: new Date().toISOString(),
                priority: 1,
                organizationId: 'default'
            },
            {
                id: 'rule_vat_exemption_export',
                ruleName: 'VAT Exemption Export',
                ruleType: 'exemption',
                fromRegion: 'EU',
                toRegion: 'NON-EU',
                conditions: {
                    minAmount: 0
                },
                action: {
                    type: 'exempt'
                },
                effectiveDate: new Date().toISOString(),
                priority: 2,
                organizationId: 'default'
            },
            {
                id: 'rule_vat_registration_threshold',
                ruleName: 'VAT Registration Threshold',
                ruleType: 'threshold',
                fromRegion: 'EU',
                toRegion: 'EU',
                conditions: {
                    minAmount: 85000
                },
                action: {
                    type: 'require_documentation',
                    documentation: ['VAT_certificate', 'business_registration']
                },
                effectiveDate: new Date().toISOString(),
                priority: 3,
                organizationId: 'default'
            }
        ];
        for (const rule of rules) {
            this.taxRules.set(rule.id, rule);
        }
    }
    startPeriodicProcessing() {
        if (!this.config.enabled)
            return;
        this.processingInterval = setInterval(() => {
            this.processComplianceMonitoring();
        }, 24 * 60 * 60 * 1000);
        structuredLogger.info('Periodic fiscalidad processing started', {
            interval: '24 hours',
            requestId: ''
        });
    }
    async processComplianceMonitoring() {
        if (this.isProcessing) {
            return this.stats;
        }
        this.isProcessing = true;
        const startTime = Date.now();
        try {
            structuredLogger.info('Starting fiscalidad compliance monitoring', {
                totalRegions: this.taxRegions.size,
                requestId: ''
            });
            const complianceChecks = await this.checkComplianceByRegion();
            const calculationStats = await this.updateCalculationStats();
            if (this.config.reportingEnabled) {
                await this.generateReports();
            }
            this.stats = this.calculateStats(startTime);
            structuredLogger.info('Fiscalidad compliance monitoring completed', {
                complianceChecks: complianceChecks.length,
                calculationStats,
                processingTime: Date.now() - startTime,
                requestId: ''
            });
            return this.stats;
        }
        catch (error) {
            structuredLogger.error('Fiscalidad compliance monitoring failed', {
                error: error instanceof Error ? error.message : String(error),
                requestId: ''
            });
            throw error;
        }
        finally {
            this.isProcessing = false;
        }
    }
    async checkComplianceByRegion() {
        const complianceChecks = [];
        for (const region of this.taxRegions.values()) {
            const compliance = await this.checkRegionCompliance(region);
            if (compliance) {
                complianceChecks.push(compliance);
                this.compliance.set(compliance.id, compliance);
            }
        }
        return complianceChecks;
    }
    async checkRegionCompliance(region) {
        const now = new Date();
        const nextQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 1);
        const compliance = {
            id: `compliance_${region.country}_${Date.now()}`,
            organizationId: 'default',
            region: region.country,
            complianceType: 'tax_filing',
            status: 'pending',
            dueDate: nextQuarter.toISOString(),
            documents: ['VAT_return', 'sales_report', 'purchase_report'],
            penalties: 0,
            notes: [`Compliance check for ${region.region}`],
            lastUpdated: new Date().toISOString()
        };
        return compliance;
    }
    async updateCalculationStats() {
        const stats = {
            totalCalculations: this.calculations.size,
            compliantCalculations: 0,
            totalTaxCollected: 0,
            averageTaxRate: 0
        };
        for (const calculation of this.calculations.values()) {
            if (calculation.complianceStatus === 'compliant') {
                stats.compliantCalculations++;
            }
            stats.totalTaxCollected += calculation.taxAmount;
        }
        if (stats.totalCalculations > 0) {
            stats.averageTaxRate = stats.totalTaxCollected / stats.totalCalculations;
        }
        return stats;
    }
    async generateReports() {
        structuredLogger.info('Generating fiscalidad reports', {
            format: this.config.reporting.format,
            frequency: this.config.reporting.frequency,
            requestId: ''
        });
    }
    calculateStats(startTime) {
        const totalRegions = this.taxRegions.size;
        const activeRegions = Array.from(this.taxRegions.values()).filter(region => !region.expirationDate || new Date(region.expirationDate) > new Date()).length;
        const totalCalculations = this.calculations.size;
        const compliantCalculations = Array.from(this.calculations.values()).filter(calc => calc.complianceStatus === 'compliant').length;
        const complianceRate = totalCalculations > 0 ? (compliantCalculations / totalCalculations) * 100 : 0;
        const totalTaxCollected = Array.from(this.calculations.values()).reduce((sum, calc) => sum + calc.taxAmount, 0);
        const averageTaxRate = totalCalculations > 0
            ? Array.from(this.calculations.values()).reduce((sum, calc) => sum + calc.taxRate, 0) / totalCalculations
            : 0;
        const pendingCompliance = Array.from(this.compliance.values()).filter(comp => comp.status === 'pending').length;
        return {
            totalRegions,
            activeRegions,
            totalCalculations,
            compliantCalculations,
            complianceRate,
            totalTaxCollected,
            averageTaxRate,
            pendingCompliance,
            lastRun: new Date().toISOString()
        };
    }
    async calculateTax(transaction) {
        const applicableRules = this.getApplicableRules(transaction);
        const taxRate = this.determineTaxRate(transaction, applicableRules);
        const calculationMethod = this.determineCalculationMethod(transaction, applicableRules);
        const taxAmount = calculationMethod === 'exempt' ? 0 : transaction.amount * taxRate;
        const totalAmount = transaction.amount + taxAmount;
        const calculation = {
            id: `tax_calc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            transactionId: `txn_${Date.now()}`,
            customerId: transaction.customerId,
            customerRegion: transaction.customerRegion,
            supplierRegion: transaction.supplierRegion,
            amount: transaction.amount,
            currency: transaction.currency,
            taxRate,
            taxAmount,
            totalAmount,
            taxType: 'VAT',
            calculationMethod,
            applicableRules: applicableRules.map(rule => rule.id),
            complianceStatus: 'compliant',
            calculatedAt: new Date().toISOString(),
            metadata: {
                rules: applicableRules.map(rule => ({
                    id: rule.id,
                    name: rule.ruleName,
                    type: rule.ruleType
                }))
            }
        };
        this.calculations.set(calculation.id, calculation);
        structuredLogger.info('Tax calculation completed', {
            calculationId: calculation.id,
            customerRegion: transaction.customerRegion,
            supplierRegion: transaction.supplierRegion,
            amount: transaction.amount,
            taxRate,
            taxAmount,
            calculationMethod,
            requestId: ''
        });
        return calculation;
    }
    getApplicableRules(transaction) {
        const applicableRules = [];
        for (const rule of this.taxRules.values()) {
            if (this.isRuleApplicable(rule, transaction)) {
                applicableRules.push(rule);
            }
        }
        return applicableRules.sort((a, b) => a.priority - b.priority);
    }
    isRuleApplicable(rule, transaction) {
        const conditions = rule.conditions;
        if (rule.fromRegion !== 'EU' && rule.fromRegion !== transaction.supplierRegion) {
            return false;
        }
        if (rule.toRegion !== 'EU' && rule.toRegion !== transaction.customerRegion) {
            return false;
        }
        if (conditions.minAmount && transaction.amount < conditions.minAmount) {
            return false;
        }
        if (conditions.maxAmount && transaction.amount > conditions.maxAmount) {
            return false;
        }
        if (conditions.customerType && transaction.customerType !== conditions.customerType) {
            return false;
        }
        if (conditions.productType && transaction.productType !== conditions.productType) {
            return false;
        }
        return true;
    }
    determineTaxRate(transaction, rules) {
        const exemptionRule = rules.find(rule => rule.action.type === 'exempt');
        if (exemptionRule) {
            return 0;
        }
        const reverseChargeRule = rules.find(rule => rule.action.type === 'reverse_charge');
        if (reverseChargeRule) {
            return 0;
        }
        const region = this.taxRegions.get(`tax_region_${transaction.customerRegion}`);
        return region ? region.taxRate : 0.21;
    }
    determineCalculationMethod(transaction, rules) {
        if (rules.some(rule => rule.action.type === 'exempt')) {
            return 'exemption';
        }
        if (rules.some(rule => rule.action.type === 'reverse_charge')) {
            return 'reverse_charge';
        }
        return 'standard';
    }
    getTaxRegions() {
        return Array.from(this.taxRegions.values());
    }
    getTaxRules() {
        return Array.from(this.taxRules.values());
    }
    getTaxCalculations(limit = 100) {
        return Array.from(this.calculations.values()).slice(-limit);
    }
    getComplianceStatus() {
        return Array.from(this.compliance.values());
    }
    getStats() {
        return this.stats;
    }
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        structuredLogger.info('Fiscalidad configuration updated', {
            config: this.config,
            requestId: ''
        });
    }
    stop() {
        if (this.processingInterval) {
            clearInterval(this.processingInterval);
            this.processingInterval = null;
        }
        structuredLogger.info('Fiscalidad Regional UE service stopped', { requestId: '' });
    }
}
export const fiscalidadRegionalUEService = new FiscalidadRegionalUEService();
//# sourceMappingURL=fiscalidad-regional-ue.service.js.map