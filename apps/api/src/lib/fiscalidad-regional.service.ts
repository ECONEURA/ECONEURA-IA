import { structuredLogger } from './structured-logger.js';

// Fiscalidad Regional UE Service - PR-41
// Sistema de gestión de impuestos y regulaciones fiscales de la Unión Europea

interface TaxRegion {
  id: string;
  organizationId: string;
  countryCode: string; // ISO 3166-1 alpha-2 (ES, FR, DE, IT, etc.)
  countryName: string;
  regionCode?: string; // Para regiones específicas (ES-MD, FR-75, etc.)
  regionName?: string;

  // Configuración fiscal
  taxConfiguration: {
    vatRate: number; // IVA estándar
    reducedVatRates: Array<{
      rate: number;
      description: string;
      categories: string[];
    }>;
    withholdingTaxRate: number; // Retención IRPF
    corporateTaxRate: number; // Impuesto de sociedades
    socialSecurityRate: number; // Seguridad social
  };

  // Regulaciones específicas
  regulations: {
    vatRegistrationThreshold: number; // Umbral registro IVA
    quarterlyReporting: boolean;
    monthlyReporting: boolean;
    annualReporting: boolean;
    digitalServicesTax: boolean; // DST para servicios digitales
    reverseCharge: boolean; // Inversión del sujeto pasivo
    vatMoss: boolean; // Mini One Stop Shop
  };

  // Fechas importantes
  importantDates: {
    vatReturnDeadline: string; // Día del mes para declaración IVA
    corporateTaxDeadline: string; // Fecha límite impuesto sociedades
    payrollTaxDeadline: string; // Fecha límite nóminas
    annualReportDeadline: string; // Fecha límite memoria anual
  };

  // Compliance
  compliance: {
    isActive: boolean;
    lastAuditDate?: string;
    nextAuditDate?: string;
    complianceScore: number; // 0-100
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

  // Información de la transacción
  transaction: {
    invoiceNumber: string;
    invoiceDate: string;
    dueDate: string;
    customerSupplierId: string;
    customerSupplierName: string;
    customerSupplierVatNumber?: string;
    customerSupplierCountry: string;
  };

  // Detalles fiscales
  taxDetails: {
    netAmount: number;
    vatRate: number;
    vatAmount: number;
    totalAmount: number;
    currency: string;
    vatCode: string; // Código de IVA (S1, S2, etc.)
    exemptionReason?: string;
    reverseCharge?: boolean;
  };

  // Clasificación
  classification: {
    category: string;
    subcategory?: string;
    productServiceCode?: string; // Código de producto/servicio
    isDigitalService: boolean;
    isB2B: boolean;
    isB2C: boolean;
  };

  // Estado
  status: 'draft' | 'confirmed' | 'reported' | 'paid' | 'cancelled';
  reportingPeriod: string; // YYYY-MM
  reportedAt?: string;

  createdAt: string;
  updatedAt: string;
}

interface VATReturn {
  id: string;
  organizationId: string;
  regionId: string;
  period: string; // YYYY-MM
  status: 'draft' | 'submitted' | 'accepted' | 'rejected' | 'amended';

  // Resumen de la declaración
  summary: {
    totalSales: number;
    totalPurchases: number;
    vatOnSales: number;
    vatOnPurchases: number;
    vatToPay: number; // IVA a pagar (puede ser negativo)
    vatToRefund: number; // IVA a devolver
    netVatPosition: number; // Posición neta de IVA
  };

  // Desglose por tipos de IVA
  vatBreakdown: Array<{
    vatRate: number;
    salesNet: number;
    salesVat: number;
    purchasesNet: number;
    purchasesVat: number;
  }>;

  // Transacciones incluidas
  transactions: string[]; // IDs de transacciones

  // Información de presentación
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

  // Información del retenido
  payee: {
    id: string;
    name: string;
    taxId: string;
    country: string;
    isCompany: boolean;
  };

  // Detalles de la retención
  withholding: {
    grossAmount: number;
    withholdingRate: number;
    withholdingAmount: number;
    netAmount: number;
    currency: string;
    withholdingType: 'irpf' | 'corporate' | 'social_security' | 'other';
    reason: string;
  };

  // Período y estado
  period: string; // YYYY-MM
  status: 'calculated' | 'paid' | 'reported' | 'cancelled';
  paidAt?: string;
  reportedAt?: string;

  createdAt: string;
  updatedAt: string;
}

interface TaxReport {
  id: string;
  organizationId: string;
  regionId: string;
  reportType: 'vat_return' | 'withholding_summary' | 'corporate_tax' | 'payroll_tax' | 'annual_summary';
  period: string; // YYYY-MM o YYYY para anuales

  // Contenido del reporte
  content: {
    title: string;
    summary: Record<string, any>;
    details: Record<string, any>;
    attachments: string[];
  };

  // Estado y presentación
  status: 'draft' | 'generated' | 'submitted' | 'accepted' | 'rejected';
  generatedAt?: string;
  submittedAt?: string;
  submittedBy?: string;
  referenceNumber?: string;

  createdAt: string;
  updatedAt: string;
}

class FiscalidadRegionalService {
  private taxRegions: Map<string, TaxRegion> = new Map();
  private vatTransactions: Map<string, VATTransaction> = new Map();
  private vatReturns: Map<string, VATReturn> = new Map();
  private withholdingTaxes: Map<string, WithholdingTax> = new Map();
  private taxReports: Map<string, TaxReport> = new Map();

  constructor() {
    this.init();
  }

  init() {
    this.createDemoData();
    structuredLogger.info('Fiscalidad Regional UE Service initialized');
  }

  private createDemoData() {
    const now = new Date();
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Regiones fiscales demo
    const spainRegion: TaxRegion = {
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

    const franceRegion: TaxRegion = {
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
        withholdingTaxRate: 0, // No hay retención en Francia
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

    // Transacciones IVA demo
    const vatTransaction1: VATTransaction = {
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

    const vatTransaction2: VATTransaction = {
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

    // Declaraciones IVA demo
    const vatReturn1: VATReturn = {
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

    // Retenciones demo
    const withholding1: WithholdingTax = {
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

  // Gestión de regiones fiscales
  async getTaxRegions(organizationId: string): Promise<TaxRegion[]> {
    return Array.from(this.taxRegions.values());
      .filter(r => r.organizationId === organizationId)
      .sort((a, b) => a.countryName.localeCompare(b.countryName));
  }

  async getTaxRegion(regionId: string): Promise<TaxRegion | undefined> {
    return this.taxRegions.get(regionId);
  }

  async createTaxRegion(regionData: Omit<TaxRegion, 'id' | 'createdAt' | 'updatedAt'>): Promise<TaxRegion> {
    const now = new Date().toISOString();
    const region: TaxRegion = {
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

  // Gestión de transacciones IVA
  async getVATTransactions(organizationId: string, filters: {
    regionId?: string;
    transactionType?: string;
    status?: string;
    period?: string;
    limit?: number;
  } = {}): Promise<VATTransaction[]> {
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

  async createVATTransaction(transactionData: Omit<VATTransaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<VATTransaction> {
    const now = new Date().toISOString();
    const transaction: VATTransaction = {
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

  // Gestión de declaraciones IVA
  async getVATReturns(organizationId: string, filters: {
    regionId?: string;
    period?: string;
    status?: string;
    limit?: number;
  } = {}): Promise<VATReturn[]> {
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

  async createVATReturn(returnData: Omit<VATReturn, 'id' | 'createdAt' | 'updatedAt'>): Promise<VATReturn> {
    const now = new Date().toISOString();
    const vatReturn: VATReturn = {
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

  // Gestión de retenciones
  async getWithholdingTaxes(organizationId: string, filters: {
    regionId?: string;
    period?: string;
    status?: string;
    limit?: number;
  } = {}): Promise<WithholdingTax[]> {
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

  // Estadísticas fiscales
  async getTaxStats(organizationId: string) {
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

      // Resumen financiero
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

      // Por región
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

      // Tendencias
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

      // Compliance
      compliance: {
        averageScore: regions.length > 0 ?
          regions.reduce((sum, r) => sum + r.compliance.complianceScore, 0) / regions.length : 0,
        highRiskRegions: regions.filter(r => r.compliance.riskLevel === 'high').length,
        mediumRiskRegions: regions.filter(r => r.compliance.riskLevel === 'medium').length,
        lowRiskRegions: regions.filter(r => r.compliance.riskLevel === 'low').length,
        nextAudits: regions
          .filter(r => r.compliance.nextAuditDate)
          .sort((a, b) => new Date(a.compliance.nextAuditDate!).getTime() - new Date(b.compliance.nextAuditDate!).getTime())
          .slice(0, 3)
          .map(r => ({
            regionId: r.id,
            country: r.countryCode,
            nextAuditDate: r.compliance.nextAuditDate
          }))
      }
    };
  }

  // Cálculo de IVA
  async calculateVAT(regionId: string, netAmount: number, vatRate: number, transactionType: 'sale' | 'purchase'): Promise<{
    netAmount: number;
    vatRate: number;
    vatAmount: number;
    totalAmount: number;
  }> {
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

  // Validación de NIF/CIF UE
  async validateVATNumber(vatNumber: string, countryCode: string): Promise<{
    isValid: boolean;
    format: string;
    country: string;
  }> {
    const vatPatterns: Record<string, RegExp> = {
      'ES': /^[A-Z]\d{8}$/, // España: 1 letra + 8 dígitos
      'FR': /^\d{2}\s?\d{9}$/, // Francia: 2 dígitos + 9 dígitos
      'DE': /^\d{9}$/, // Alemania: 9 dígitos
      'IT': /^\d{11}$/, // Italia: 11 dígitos
      'NL': /^NL\d{9}B\d{2}$/, // Países Bajos: NL + 9 dígitos + B + 2 dígitos
      'BE': /^\d{10}$/, // Bélgica: 10 dígitos
      'PT': /^\d{9}$/, // Portugal: 9 dígitos
      'AT': /^ATU\d{8}$/, // Austria: ATU + 8 dígitos
      'IE': /^\d[A-Z]\d{5}[A-Z]$/, // Irlanda: 1 dígito + 1 letra + 5 dígitos + 1 letra
      'FI': /^\d{8}$/, // Finlandia: 8 dígitos
      'LU': /^\d{8}$/, // Luxemburgo: 8 dígitos
      'SE': /^\d{12}$/, // Suecia: 12 dígitos
      'DK': /^\d{8}$/, // Dinamarca: 8 dígitos
      'PL': /^\d{10}$/, // Polonia: 10 dígitos
      'CZ': /^\d{8,10}$/, // República Checa: 8-10 dígitos
      'HU': /^\d{8}$/, // Hungría: 8 dígitos
      'SK': /^\d{10}$/, // Eslovaquia: 10 dígitos
      'SI': /^\d{8}$/, // Eslovenia: 8 dígitos
      'HR': /^\d{11}$/, // Croacia: 11 dígitos
      'RO': /^RO\d{2,10}$/, // Rumanía: RO + 2-10 dígitos
      'BG': /^\d{9,10}$/, // Bulgaria: 9-10 dígitos
      'CY': /^\d{8}[A-Z]$/, // Chipre: 8 dígitos + 1 letra
      'MT': /^\d{8}$/, // Malta: 8 dígitos
      'EE': /^\d{9}$/, // Estonia: 9 dígitos
      'LV': /^\d{11}$/, // Letonia: 11 dígitos
      'LT': /^\d{9,12}$/ // Lituania: 9-12 dígitos
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
