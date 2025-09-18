/**
 * PR-55: Fiscalidad Regional UE Service
 * 
 * Sistema de gestión de fiscalidad regional para la Unión Europea
 */

import { structuredLogger } from './structured-logger.js';

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
    deadline: number; // días antes del vencimiento
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

export class FiscalidadRegionalUEService {
  private config: FiscalidadConfig;
  private taxRegions: Map<string, TaxRegion> = new Map();
  private taxRules: Map<string, TaxRule> = new Map();
  private calculations: Map<string, TaxCalculation> = new Map();
  private compliance: Map<string, TaxCompliance> = new Map();
  private stats: FiscalidadStats;
  private isProcessing = false;
  private processingInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<FiscalidadConfig> = {}) {
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

  private initializeEURegions(): void {
    const euRegions = [
      { country: 'ES', region: 'España', taxCode: 'ES-VAT', taxRate: 0.21, taxType: 'VAT' as const },
      { country: 'FR', region: 'Francia', taxCode: 'FR-VAT', taxRate: 0.20, taxType: 'VAT' as const },
      { country: 'DE', region: 'Alemania', taxCode: 'DE-VAT', taxRate: 0.19, taxType: 'VAT' as const },
      { country: 'IT', region: 'Italia', taxCode: 'IT-VAT', taxRate: 0.22, taxType: 'VAT' as const },
      { country: 'PT', region: 'Portugal', taxCode: 'PT-VAT', taxRate: 0.23, taxType: 'VAT' as const },
      { country: 'NL', region: 'Países Bajos', taxCode: 'NL-VAT', taxRate: 0.21, taxType: 'VAT' as const },
      { country: 'BE', region: 'Bélgica', taxCode: 'BE-VAT', taxRate: 0.21, taxType: 'VAT' as const },
      { country: 'AT', region: 'Austria', taxCode: 'AT-VAT', taxRate: 0.20, taxType: 'VAT' as const },
      { country: 'IE', region: 'Irlanda', taxCode: 'IE-VAT', taxRate: 0.23, taxType: 'VAT' as const },
      { country: 'FI', region: 'Finlandia', taxCode: 'FI-VAT', taxRate: 0.24, taxType: 'VAT' as const }
    ];

    for (const region of euRegions) {
      const taxRegion: TaxRegion = {
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

  private initializeTaxRules(): void {
    const rules: TaxRule[] = [
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

  private startPeriodicProcessing(): void {
    if (!this.config.enabled) return;

    this.processingInterval = setInterval(() => {
      this.processComplianceMonitoring();
    }, 24 * 60 * 60 * 1000); // Cada 24 horas

    structuredLogger.info('Periodic fiscalidad processing started', {
      interval: '24 hours',
      requestId: ''
    });
  }

  async processComplianceMonitoring(): Promise<FiscalidadStats> {
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

      // 1. Verificar cumplimiento por región
      const complianceChecks = await this.checkComplianceByRegion();
      
      // 2. Actualizar estadísticas de cálculos
      const calculationStats = await this.updateCalculationStats();
      
      // 3. Generar reportes si es necesario
      if (this.config.reportingEnabled) {
        await this.generateReports();
      }

      // 4. Actualizar estadísticas generales
      this.stats = this.calculateStats(startTime);

      structuredLogger.info('Fiscalidad compliance monitoring completed', {
        complianceChecks: complianceChecks.length,
        calculationStats,
        processingTime: Date.now() - startTime,
        requestId: ''
      });

      return this.stats;

    } catch (error) {
      structuredLogger.error('Fiscalidad compliance monitoring failed', {
        error: error instanceof Error ? error.message : String(error),
        requestId: ''
      });
      throw error;
    } finally {
      this.isProcessing = false;
    }
  }

  private async checkComplianceByRegion(): Promise<TaxCompliance[]> {
    const complianceChecks: TaxCompliance[] = [];

    for (const region of this.taxRegions.values()) {
      const compliance = await this.checkRegionCompliance(region);
      if (compliance) {
        complianceChecks.push(compliance);
        this.compliance.set(compliance.id, compliance);
      }
    }

    return complianceChecks;
  }

  private async checkRegionCompliance(region: TaxRegion): Promise<TaxCompliance | null> {
    const now = new Date();
    const nextQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 1);
    
    const compliance: TaxCompliance = {
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

  private async updateCalculationStats(): Promise<Record<string, number>> {
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

  private async generateReports(): Promise<void> {
    // En un sistema real, esto generaría reportes fiscales
    structuredLogger.info('Generating fiscalidad reports', {
      format: this.config.reporting.format,
      frequency: this.config.reporting.frequency,
      requestId: ''
    });
  }

  private calculateStats(startTime: number): FiscalidadStats {
    const totalRegions = this.taxRegions.size;
    const activeRegions = Array.from(this.taxRegions.values()).filter(
      region => !region.expirationDate || new Date(region.expirationDate) > new Date()
    ).length;

    const totalCalculations = this.calculations.size;
    const compliantCalculations = Array.from(this.calculations.values()).filter(
      calc => calc.complianceStatus === 'compliant'
    ).length;

    const complianceRate = totalCalculations > 0 ? (compliantCalculations / totalCalculations) * 100 : 0;

    const totalTaxCollected = Array.from(this.calculations.values()).reduce(
      (sum, calc) => sum + calc.taxAmount, 0
    );

    const averageTaxRate = totalCalculations > 0 
      ? Array.from(this.calculations.values()).reduce((sum, calc) => sum + calc.taxRate, 0) / totalCalculations 
      : 0;

    const pendingCompliance = Array.from(this.compliance.values()).filter(
      comp => comp.status === 'pending'
    ).length;

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

  /**
   * Calcula impuestos para una transacción
   */
  async calculateTax(transaction: {
    customerId: string;
    customerRegion: string;
    supplierRegion: string;
    amount: number;
    currency: string;
    customerType?: string;
    productType?: string;
  }): Promise<TaxCalculation> {
    const applicableRules = this.getApplicableRules(transaction);
    const taxRate = this.determineTaxRate(transaction, applicableRules);
    const calculationMethod = this.determineCalculationMethod(transaction, applicableRules);

    const taxAmount = calculationMethod === 'exempt' ? 0 : transaction.amount * taxRate;
    const totalAmount = transaction.amount + taxAmount;

    const calculation: TaxCalculation = {
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

  private getApplicableRules(transaction: any): TaxRule[] {
    const applicableRules: TaxRule[] = [];

    for (const rule of this.taxRules.values()) {
      if (this.isRuleApplicable(rule, transaction)) {
        applicableRules.push(rule);
      }
    }

    // Ordenar por prioridad
    return applicableRules.sort((a, b) => a.priority - b.priority);
  }

  private isRuleApplicable(rule: TaxRule, transaction: any): boolean {
    const conditions = rule.conditions;

    // Verificar región
    if (rule.fromRegion !== 'EU' && rule.fromRegion !== transaction.supplierRegion) {
      return false;
    }
    if (rule.toRegion !== 'EU' && rule.toRegion !== transaction.customerRegion) {
      return false;
    }

    // Verificar condiciones
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

  private determineTaxRate(transaction: any, rules: TaxRule[]): number {
    // Si hay regla de exención, tasa 0
    const exemptionRule = rules.find(rule => rule.action.type === 'exempt');
    if (exemptionRule) {
      return 0;
    }

    // Si hay regla de reverse charge, tasa 0 (el cliente paga)
    const reverseChargeRule = rules.find(rule => rule.action.type === 'reverse_charge');
    if (reverseChargeRule) {
      return 0;
    }

    // Obtener tasa estándar de la región
    const region = this.taxRegions.get(`tax_region_${transaction.customerRegion}`);
    return region ? region.taxRate : 0.21; // Default 21%
  }

  private determineCalculationMethod(transaction: any, rules: TaxRule[]): 'standard' | 'reverse_charge' | 'exemption' | 'reduced' {
    if (rules.some(rule => rule.action.type === 'exempt')) {
      return 'exemption';
    }
    if (rules.some(rule => rule.action.type === 'reverse_charge')) {
      return 'reverse_charge';
    }
    return 'standard';
  }

  /**
   * Obtiene regiones fiscales disponibles
   */
  getTaxRegions(): TaxRegion[] {
    return Array.from(this.taxRegions.values());
  }

  /**
   * Obtiene reglas fiscales
   */
  getTaxRules(): TaxRule[] {
    return Array.from(this.taxRules.values());
  }

  /**
   * Obtiene cálculos fiscales
   */
  getTaxCalculations(limit: number = 100): TaxCalculation[] {
    return Array.from(this.calculations.values()).slice(-limit);
  }

  /**
   * Obtiene estado de cumplimiento
   */
  getComplianceStatus(): TaxCompliance[] {
    return Array.from(this.compliance.values());
  }

  /**
   * Obtiene estadísticas del servicio
   */
  getStats(): FiscalidadStats {
    return this.stats;
  }

  /**
   * Actualiza la configuración
   */
  updateConfig(newConfig: Partial<FiscalidadConfig>): void {
    this.config = { ...this.config, ...newConfig };
    structuredLogger.info('Fiscalidad configuration updated', {
      config: this.config,
      requestId: ''
    });
  }

  /**
   * Detiene el servicio
   */
  stop(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    structuredLogger.info('Fiscalidad Regional UE service stopped', { requestId: '' });
  }
}

export const fiscalidadRegionalUEService = new FiscalidadRegionalUEService();
