import { describe, it, expect, beforeEach } from 'vitest';
import { fiscalidadRegionalService } from '../../../lib/fiscalidad-regional.service.js';

describe('FiscalidadRegionalService', () => {
  beforeEach(() => {
    // Reset service state before each test
    // Note: In a real implementation, you might want to clear the maps
  });

  describe('Tax Regions Management', () => {
    it('should get tax regions for organization', async () => {
      const regions = await fiscalidadRegionalService.getTaxRegions('demo-org-1');

      expect(regions).toBeDefined();
      expect(Array.isArray(regions)).toBe(true);
      expect(regions.length).toBeGreaterThan(0);

      const spainRegion = regions.find(r => r.countryCode === 'ES');
      expect(spainRegion).toBeDefined();
      expect(spainRegion?.taxConfiguration.vatRate).toBe(21);
      expect(spainRegion?.regulations.reverseCharge).toBe(true);
    });

    it('should get specific tax region by ID', async () => {
      const region = await fiscalidadRegionalService.getTaxRegion('region_es');

      expect(region).toBeDefined();
      expect(region?.countryCode).toBe('ES');
      expect(region?.countryName).toBe('España');
      expect(region?.taxConfiguration.withholdingTaxRate).toBe(19);
    });

    it('should return undefined for non-existent region', async () => {
      const region = await fiscalidadRegionalService.getTaxRegion('non-existent');
      expect(region).toBeUndefined();
    });

    it('should create new tax region', async () => {
      const regionData = {
        organizationId: 'test-org',
        countryCode: 'DE',
        countryName: 'Alemania',
        regionCode: 'DE-BE',
        regionName: 'Berlín',
        taxConfiguration: {
          vatRate: 19,
          reducedVatRates: [
            { rate: 7, description: 'Reducido', categories: ['alimentacion'] }
          ],
          withholdingTaxRate: 0,
          corporateTaxRate: 15,
          socialSecurityRate: 20
        },
        regulations: {
          vatRegistrationThreshold: 22000,
          quarterlyReporting: true,
          monthlyReporting: false,
          annualReporting: true,
          digitalServicesTax: false,
          reverseCharge: true,
          vatMoss: true
        },
        importantDates: {
          vatReturnDeadline: '10',
          corporateTaxDeadline: '2024-05-31',
          payrollTaxDeadline: '10',
          annualReportDeadline: '2024-05-31'
        },
        compliance: {
          isActive: true,
          complianceScore: 90,
          riskLevel: 'low' as const
        }
      };

      const region = await fiscalidadRegionalService.createTaxRegion(regionData);

      expect(region).toBeDefined();
      expect(region.id).toBeDefined();
      expect(region.countryCode).toBe('DE');
      expect(region.taxConfiguration.vatRate).toBe(19);
      expect(region.regulations.reverseCharge).toBe(true);
    });
  });

  describe('VAT Transactions Management', () => {
    it('should get VAT transactions with filters', async () => {
      const transactions = await fiscalidadRegionalService.getVATTransactions('demo-org-1', {
        regionId: 'region_es',
        transactionType: 'sale',
        limit: 10
      });

      expect(transactions).toBeDefined();
      expect(Array.isArray(transactions)).toBe(true);
      expect(transactions.length).toBeGreaterThan(0);

      const transaction = transactions[0];
      expect(transaction.transactionType).toBe('sale');
      expect(transaction.regionId).toBe('region_es');
    });

    it('should create VAT transaction', async () => {
      const transactionData = {
        organizationId: 'test-org',
        regionId: 'region_es',
        transactionType: 'sale' as const,
        transaction: {
          invoiceNumber: 'TEST-001',
          invoiceDate: '2024-09-08',
          dueDate: '2024-10-08',
          customerSupplierId: 'customer_test',
          customerSupplierName: 'Test Customer',
          customerSupplierVatNumber: 'ES87654321X',
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
          category: 'services',
          subcategory: 'consulting',
          productServiceCode: '6202',
          isDigitalService: false,
          isB2B: true,
          isB2C: false
        },
        status: 'draft' as const,
        reportingPeriod: '2024-09'
      };

      const transaction = await fiscalidadRegionalService.createVATTransaction(transactionData);

      expect(transaction).toBeDefined();
      expect(transaction.id).toBeDefined();
      expect(transaction.transactionType).toBe('sale');
      expect(transaction.taxDetails.totalAmount).toBe(1210);
    });

    it('should filter transactions by period', async () => {
      const transactions = await fiscalidadRegionalService.getVATTransactions('demo-org-1', {
        period: '2024-08'
      });

      expect(transactions).toBeDefined();
      expect(Array.isArray(transactions)).toBe(true);

      transactions.forEach(transaction => {
        expect(transaction.reportingPeriod).toBe('2024-08');
      });
    });
  });

  describe('VAT Returns Management', () => {
    it('should get VAT returns', async () => {
      const returns = await fiscalidadRegionalService.getVATReturns('demo-org-1');

      expect(returns).toBeDefined();
      expect(Array.isArray(returns)).toBe(true);
      expect(returns.length).toBeGreaterThan(0);

      const vatReturn = returns[0];
      expect(vatReturn.period).toBeDefined();
      expect(vatReturn.summary).toBeDefined();
      expect(vatReturn.summary.vatToPay).toBeDefined();
    });

    it('should create VAT return', async () => {
      const returnData = {
        organizationId: 'test-org',
        regionId: 'region_es',
        period: '2024-09',
        status: 'draft' as const,
        summary: {
          totalSales: 2000,
          totalPurchases: 500,
          vatOnSales: 420,
          vatOnPurchases: 105,
          vatToPay: 315,
          vatToRefund: 0,
          netVatPosition: 315
        },
        vatBreakdown: [
          {
            vatRate: 21,
            salesNet: 2000,
            salesVat: 420,
            purchasesNet: 500,
            purchasesVat: 105
          }
        ],
        transactions: ['vat_tx_1', 'vat_tx_2']
      };

      const vatReturn = await fiscalidadRegionalService.createVATReturn(returnData);

      expect(vatReturn).toBeDefined();
      expect(vatReturn.id).toBeDefined();
      expect(vatReturn.period).toBe('2024-09');
      expect(vatReturn.summary.vatToPay).toBe(315);
    });
  });

  describe('Withholding Taxes Management', () => {
    it('should get withholding taxes', async () => {
      const withholdings = await fiscalidadRegionalService.getWithholdingTaxes('demo-org-1');

      expect(withholdings).toBeDefined();
      expect(Array.isArray(withholdings)).toBe(true);
      expect(withholdings.length).toBeGreaterThan(0);

      const withholding = withholdings[0];
      expect(withholding.withholding.withholdingType).toBe('irpf');
      expect(withholding.withholding.withholdingRate).toBe(19);
    });

    it('should filter withholdings by period', async () => {
      const withholdings = await fiscalidadRegionalService.getWithholdingTaxes('demo-org-1', {
        period: '2024-08'
      });

      expect(withholdings).toBeDefined();
      expect(Array.isArray(withholdings)).toBe(true);

      withholdings.forEach(withholding => {
        expect(withholding.period).toBe('2024-08');
      });
    });
  });

  describe('VAT Calculation', () => {
    it('should calculate VAT for sale transaction', async () => {
      const calculation = await fiscalidadRegionalService.calculateVAT(
        'region_es',
        1000,
        21,
        'sale'
      );

      expect(calculation).toBeDefined();
      expect(calculation.netAmount).toBe(1000);
      expect(calculation.vatRate).toBe(21);
      expect(calculation.vatAmount).toBe(210);
      expect(calculation.totalAmount).toBe(1210);
    });

    it('should calculate VAT for purchase transaction', async () => {
      const calculation = await fiscalidadRegionalService.calculateVAT(
        'region_es',
        500,
        21,
        'purchase'
      );

      expect(calculation).toBeDefined();
      expect(calculation.netAmount).toBe(500);
      expect(calculation.vatRate).toBe(21);
      expect(calculation.vatAmount).toBe(105);
      expect(calculation.totalAmount).toBe(605);
    });

    it('should throw error for non-existent region', async () => {
      await expect(
        fiscalidadRegionalService.calculateVAT('non-existent', 1000, 21, 'sale');
      ).rejects.toThrow('Tax region not found');
    });
  });

  describe('VAT Number Validation', () => {
    it('should validate Spanish VAT number', async () => {
      const validation = await fiscalidadRegionalService.validateVATNumber('A12345678', 'ES');

      expect(validation).toBeDefined();
      expect(validation.isValid).toBe(true);
      expect(validation.country).toBe('ES');
      expect(validation.format).toContain('^[A-Z]\\d{8}$');
    });

    it('should validate French VAT number', async () => {
      const validation = await fiscalidadRegionalService.validateVATNumber('12345678901', 'FR');

      expect(validation).toBeDefined();
      expect(validation.isValid).toBe(true);
      expect(validation.country).toBe('FR');
    });

    it('should validate German VAT number', async () => {
      const validation = await fiscalidadRegionalService.validateVATNumber('123456789', 'DE');

      expect(validation).toBeDefined();
      expect(validation.isValid).toBe(true);
      expect(validation.country).toBe('DE');
    });

    it('should validate Dutch VAT number', async () => {
      const validation = await fiscalidadRegionalService.validateVATNumber('NL123456789B01', 'NL');

      expect(validation).toBeDefined();
      expect(validation.isValid).toBe(true);
      expect(validation.country).toBe('NL');
    });

    it('should reject invalid VAT number', async () => {
      const validation = await fiscalidadRegionalService.validateVATNumber('INVALID', 'ES');

      expect(validation).toBeDefined();
      expect(validation.isValid).toBe(false);
      expect(validation.country).toBe('ES');
    });

    it('should handle unknown country', async () => {
      const validation = await fiscalidadRegionalService.validateVATNumber('123456', 'XX');

      expect(validation).toBeDefined();
      expect(validation.isValid).toBe(false);
      expect(validation.format).toBe('Unknown country');
      expect(validation.country).toBe('XX');
    });
  });

  describe('Tax Statistics', () => {
    it('should return comprehensive tax statistics', async () => {
      const stats = await fiscalidadRegionalService.getTaxStats('demo-org-1');

      expect(stats).toBeDefined();
      expect(stats.totalRegions).toBeGreaterThan(0);
      expect(stats.activeRegions).toBeGreaterThan(0);
      expect(stats.totalTransactions).toBeGreaterThan(0);
      expect(stats.totalVATReturns).toBeGreaterThan(0);
      expect(stats.totalWithholdings).toBeGreaterThan(0);

      // Financial summary
      expect(stats.financial).toBeDefined();
      expect(stats.financial.totalVATCollected).toBeGreaterThanOrEqual(0);
      expect(stats.financial.totalVATPaid).toBeGreaterThanOrEqual(0);
      expect(stats.financial.totalWithholdingsPaid).toBeGreaterThanOrEqual(0);

      // By region
      expect(stats.byRegion).toBeDefined();
      expect(Array.isArray(stats.byRegion)).toBe(true);
      expect(stats.byRegion.length).toBeGreaterThan(0);

      // Trends
      expect(stats.trends).toBeDefined();
      expect(stats.trends.currentPeriod).toBeDefined();
      expect(stats.trends.lastPeriod).toBeDefined();

      // Compliance
      expect(stats.compliance).toBeDefined();
      expect(stats.compliance.averageScore).toBeGreaterThanOrEqual(0);
      expect(stats.compliance.averageScore).toBeLessThanOrEqual(100);
    });

    it('should include compliance metrics', async () => {
      const stats = await fiscalidadRegionalService.getTaxStats('demo-org-1');

      expect(stats.compliance).toBeDefined();
      expect(stats.compliance.lowRiskRegions).toBeGreaterThanOrEqual(0);
      expect(stats.compliance.mediumRiskRegions).toBeGreaterThanOrEqual(0);
      expect(stats.compliance.highRiskRegions).toBeGreaterThanOrEqual(0);
      expect(stats.compliance.nextAudits).toBeDefined();
      expect(Array.isArray(stats.compliance.nextAudits)).toBe(true);
    });
  });

  describe('Reverse Charge Logic', () => {
    it('should handle reverse charge transactions', async () => {
      const transactionData = {
        organizationId: 'test-org',
        regionId: 'region_es',
        transactionType: 'reverse_charge' as const,
        transaction: {
          invoiceNumber: 'RC-001',
          invoiceDate: '2024-09-08',
          dueDate: '2024-10-08',
          customerSupplierId: 'supplier_rc',
          customerSupplierName: 'Reverse Charge Supplier',
          customerSupplierVatNumber: 'FR12345678901',
          customerSupplierCountry: 'FR'
        },
        taxDetails: {
          netAmount: 1000,
          vatRate: 0, // Reverse charge - no VAT charged
          vatAmount: 0,
          totalAmount: 1000,
          currency: 'EUR',
          vatCode: 'RC',
          reverseCharge: true
        },
        classification: {
          category: 'services',
          subcategory: 'b2b_services',
          productServiceCode: '6202',
          isDigitalService: false,
          isB2B: true,
          isB2C: false
        },
        status: 'confirmed' as const,
        reportingPeriod: '2024-09'
      };

      const transaction = await fiscalidadRegionalService.createVATTransaction(transactionData);

      expect(transaction).toBeDefined();
      expect(transaction.transactionType).toBe('reverse_charge');
      expect(transaction.taxDetails.reverseCharge).toBe(true);
      expect(transaction.taxDetails.vatAmount).toBe(0);
    });
  });

  describe('IGIC Support', () => {
    it('should support IGIC rates for Canary Islands', async () => {
      const canaryRegionData = {
        organizationId: 'test-org',
        countryCode: 'ES',
        countryName: 'España',
        regionCode: 'ES-CN',
        regionName: 'Canarias',
        taxConfiguration: {
          vatRate: 0, // No VAT in Canary Islands
          reducedVatRates: [
            { rate: 0, description: 'IGIC General', categories: ['general'] },
            { rate: 3, description: 'IGIC Reducido', categories: ['alimentacion'] },
            { rate: 6.5, description: 'IGIC Incrementado', categories: ['lujo'] }
          ],
          withholdingTaxRate: 19,
          corporateTaxRate: 25,
          socialSecurityRate: 23.6
        },
        regulations: {
          vatRegistrationThreshold: 0,
          quarterlyReporting: true,
          monthlyReporting: false,
          annualReporting: true,
          digitalServicesTax: false,
          reverseCharge: false,
          vatMoss: false
        },
        importantDates: {
          vatReturnDeadline: '20',
          corporateTaxDeadline: '2024-07-25',
          payrollTaxDeadline: '20',
          annualReportDeadline: '2024-07-25'
        },
        compliance: {
          isActive: true,
          complianceScore: 95,
          riskLevel: 'low' as const
        }
      };

      const region = await fiscalidadRegionalService.createTaxRegion(canaryRegionData);

      expect(region).toBeDefined();
      expect(region.regionCode).toBe('ES-CN');
      expect(region.taxConfiguration.vatRate).toBe(0);
      expect(region.taxConfiguration.reducedVatRates).toHaveLength(3);
      expect(region.regulations.vatMoss).toBe(false);
    });
  });
});
