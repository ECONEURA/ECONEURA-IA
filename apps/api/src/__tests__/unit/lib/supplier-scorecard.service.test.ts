import { describe, it, expect, beforeEach, vi } from 'vitest';
import { supplierScorecardService } from '../../../lib/supplier-scorecard.service.js';

// ============================================================================
// SUPPLIER SCORECARD SERVICE UNIT TESTS - PR-69
// ============================================================================

describe('SupplierScorecardService - PR-69', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // Reset service state for isolation
    (supplierScorecardService as any).suppliers = new Map();
    (supplierScorecardService as any).evaluations = new Map();
    (supplierScorecardService as any).performances = new Map();
    (supplierScorecardService as any).comparisons = new Map();
    supplierScorecardService.init(); // Re-initialize with demo data
  });

  describe('Vendor Scorecard Metrics - PR-69', () => {
    it('should create supplier with OTIF, lead time, PPV, and SL metrics', async () => {
      const supplierData = {
        organizationId: 'test-org-1',
        name: 'Test Supplier',
        code: 'TEST001',
        type: 'manufacturer' as const,
        category: 'Electronics',
        status: 'active' as const,
        contactInfo: {
          email: 'test@supplier.com',
          phone: '+34 91 123 4567',
          address: 'Test Address 123',
          city: 'Madrid',
          country: 'Spain'
        },
        businessInfo: {
          taxId: 'B12345678',
          registrationNumber: 'REG-2023-001',
          legalName: 'Test Supplier S.L.',
          currency: 'EUR'
        },
        certifications: ['ISO 9001'],
        paymentTerms: {
          standardDays: 30,
          preferredMethod: 'bank_transfer' as const
        },
        performanceMetrics: {
          onTimeDelivery: 95,
          qualityScore: 9.0,
          costCompetitiveness: 8.5,
          communicationScore: 9.0,
          innovationScore: 8.0,
          sustainabilityScore: 8.5,
          // PR-69: Métricas específicas de vendor scorecard
          otif: 92.5,
          leadTime: 7.2,
          ppv: -2.1,
          sl: 98.3
        },
        riskAssessment: {
          financialRisk: 'low' as const,
          operationalRisk: 'low' as const,
          complianceRisk: 'low' as const,
          overallRisk: 'low' as const,
          riskFactors: []
        }
      };

      const supplier = await supplierScorecardService.createSupplier(supplierData);

      expect(supplier).toBeDefined();
      expect(supplier.performanceMetrics.otif).toBe(92.5);
      expect(supplier.performanceMetrics.leadTime).toBe(7.2);
      expect(supplier.performanceMetrics.ppv).toBe(-2.1);
      expect(supplier.performanceMetrics.sl).toBe(98.3);
    });

    it('should get suppliers with vendor scorecard metrics', async () => {
      const suppliers = await supplierScorecardService.getSuppliers('demo-org-1');

      expect(suppliers).toBeDefined();
      expect(suppliers.length).toBeGreaterThan(0);

      const firstSupplier = suppliers[0];
      expect(firstSupplier.performanceMetrics).toHaveProperty('otif');
      expect(firstSupplier.performanceMetrics).toHaveProperty('leadTime');
      expect(firstSupplier.performanceMetrics).toHaveProperty('ppv');
      expect(firstSupplier.performanceMetrics).toHaveProperty('sl');
    });
  });

  describe('Vendor Scorecard Alerts - PR-69', () => {
    it('should generate OTIF decline alerts', async () => {
      // Create supplier with low OTIF
      const supplierData = {
        organizationId: 'test-org-1',
        name: 'Low OTIF Supplier',
        code: 'LOW001',
        type: 'manufacturer' as const,
        category: 'Electronics',
        status: 'active' as const,
        contactInfo: {
          email: 'low@supplier.com',
          phone: '+34 91 123 4567',
          address: 'Test Address 123',
          city: 'Madrid',
          country: 'Spain'
        },
        businessInfo: {
          taxId: 'B12345678',
          registrationNumber: 'REG-2023-001',
          legalName: 'Low OTIF Supplier S.L.',
          currency: 'EUR'
        },
        certifications: ['ISO 9001'],
        paymentTerms: {
          standardDays: 30,
          preferredMethod: 'bank_transfer' as const
        },
        performanceMetrics: {
          onTimeDelivery: 75, // Low delivery
          qualityScore: 8.0,
          costCompetitiveness: 8.5,
          communicationScore: 9.0,
          innovationScore: 8.0,
          sustainabilityScore: 8.5,
          // PR-69: OTIF below threshold
          otif: 82.5, // Below 90% threshold but above 80% (should be high, not critical)
          leadTime: 8.5,
          ppv: -1.5,
          sl: 96.0
        },
        riskAssessment: {
          financialRisk: 'low' as const,
          operationalRisk: 'low' as const,
          complianceRisk: 'low' as const,
          overallRisk: 'low' as const,
          riskFactors: []
        }
      };

      await supplierScorecardService.createSupplier(supplierData);

      const alerts = await supplierScorecardService.generateVendorScorecardAlerts('test-org-1');

      expect(alerts).toBeDefined();
      expect(alerts.length).toBeGreaterThan(0);

      const otifAlert = alerts.find(a =>
        a.alerts.some(alert => alert.type === 'otif_decline')
      );

      expect(otifAlert).toBeDefined();
      expect(otifAlert?.alerts[0].type).toBe('otif_decline');
      expect(otifAlert?.alerts[0].severity).toBe('high'); // 78.5% is below 85%
      expect(otifAlert?.alerts[0].currentValue).toBe(82.5);
      expect(otifAlert?.alerts[0].targetValue).toBe(90);
    });

    it('should generate lead time increase alerts', async () => {
      // Create supplier with high lead time
      const supplierData = {
        organizationId: 'test-org-2',
        name: 'High Lead Time Supplier',
        code: 'HIGH001',
        type: 'manufacturer' as const,
        category: 'Electronics',
        status: 'active' as const,
        contactInfo: {
          email: 'high@supplier.com',
          phone: '+34 91 123 4567',
          address: 'Test Address 123',
          city: 'Madrid',
          country: 'Spain'
        },
        businessInfo: {
          taxId: 'B12345678',
          registrationNumber: 'REG-2023-001',
          legalName: 'High Lead Time Supplier S.L.',
          currency: 'EUR'
        },
        certifications: ['ISO 9001'],
        paymentTerms: {
          standardDays: 30,
          preferredMethod: 'bank_transfer' as const
        },
        performanceMetrics: {
          onTimeDelivery: 90,
          qualityScore: 8.0,
          costCompetitiveness: 8.5,
          communicationScore: 9.0,
          innovationScore: 8.0,
          sustainabilityScore: 8.5,
          // PR-69: Lead time above threshold
          otif: 92.0,
          leadTime: 14.5, // Above 10 days threshold
          ppv: -1.5,
          sl: 96.0
        },
        riskAssessment: {
          financialRisk: 'low' as const,
          operationalRisk: 'low' as const,
          complianceRisk: 'low' as const,
          overallRisk: 'low' as const,
          riskFactors: []
        }
      };

      await supplierScorecardService.createSupplier(supplierData);

      const alerts = await supplierScorecardService.generateVendorScorecardAlerts('test-org-2');

      expect(alerts).toBeDefined();
      expect(alerts.length).toBeGreaterThan(0);

      const leadTimeAlert = alerts.find(a =>
        a.alerts.some(alert => alert.type === 'lead_time_increase')
      );

      expect(leadTimeAlert).toBeDefined();
      expect(leadTimeAlert?.alerts[0].type).toBe('lead_time_increase');
      expect(leadTimeAlert?.alerts[0].severity).toBe('high'); // 14.5 days is above 12
      expect(leadTimeAlert?.alerts[0].currentValue).toBe(14.5);
      expect(leadTimeAlert?.alerts[0].targetValue).toBe(10);
    });

    it('should generate PPV variance alerts', async () => {
      // Create supplier with high PPV
      const supplierData = {
        organizationId: 'test-org-3',
        name: 'High PPV Supplier',
        code: 'PPV001',
        type: 'manufacturer' as const,
        category: 'Electronics',
        status: 'active' as const,
        contactInfo: {
          email: 'ppv@supplier.com',
          phone: '+34 91 123 4567',
          address: 'Test Address 123',
          city: 'Madrid',
          country: 'Spain'
        },
        businessInfo: {
          taxId: 'B12345678',
          registrationNumber: 'REG-2023-001',
          legalName: 'High PPV Supplier S.L.',
          currency: 'EUR'
        },
        certifications: ['ISO 9001'],
        paymentTerms: {
          standardDays: 30,
          preferredMethod: 'bank_transfer' as const
        },
        performanceMetrics: {
          onTimeDelivery: 90,
          qualityScore: 8.0,
          costCompetitiveness: 8.5,
          communicationScore: 9.0,
          innovationScore: 8.0,
          sustainabilityScore: 8.5,
          // PR-69: PPV above threshold
          otif: 92.0,
          leadTime: 8.5,
          ppv: 8.5, // Above 5% threshold
          sl: 96.0
        },
        riskAssessment: {
          financialRisk: 'low' as const,
          operationalRisk: 'low' as const,
          complianceRisk: 'low' as const,
          overallRisk: 'low' as const,
          riskFactors: []
        }
      };

      await supplierScorecardService.createSupplier(supplierData);

      const alerts = await supplierScorecardService.generateVendorScorecardAlerts('test-org-3');

      expect(alerts).toBeDefined();
      expect(alerts.length).toBeGreaterThan(0);

      const ppvAlert = alerts.find(a =>
        a.alerts.some(alert => alert.type === 'ppv_variance')
      );

      expect(ppvAlert).toBeDefined();
      expect(ppvAlert?.alerts[0].type).toBe('ppv_variance');
      expect(ppvAlert?.alerts[0].severity).toBe('high'); // 8.5% is above 7%
      expect(ppvAlert?.alerts[0].currentValue).toBe(8.5);
      expect(ppvAlert?.alerts[0].targetValue).toBe(5);
    });

    it('should generate service level decline alerts', async () => {
      // Create supplier with low service level
      const supplierData = {
        organizationId: 'test-org-4',
        name: 'Low SL Supplier',
        code: 'SL001',
        type: 'manufacturer' as const,
        category: 'Electronics',
        status: 'active' as const,
        contactInfo: {
          email: 'sl@supplier.com',
          phone: '+34 91 123 4567',
          address: 'Test Address 123',
          city: 'Madrid',
          country: 'Spain'
        },
        businessInfo: {
          taxId: 'B12345678',
          registrationNumber: 'REG-2023-001',
          legalName: 'Low SL Supplier S.L.',
          currency: 'EUR'
        },
        certifications: ['ISO 9001'],
        paymentTerms: {
          standardDays: 30,
          preferredMethod: 'bank_transfer' as const
        },
        performanceMetrics: {
          onTimeDelivery: 90,
          qualityScore: 8.0,
          costCompetitiveness: 8.5,
          communicationScore: 9.0,
          innovationScore: 8.0,
          sustainabilityScore: 8.5,
          // PR-69: Service level below threshold
          otif: 92.0,
          leadTime: 8.5,
          ppv: -1.5,
          sl: 92.5 // Below 95% threshold but above 90% (should be high, not critical)
        },
        riskAssessment: {
          financialRisk: 'low' as const,
          operationalRisk: 'low' as const,
          complianceRisk: 'low' as const,
          overallRisk: 'low' as const,
          riskFactors: []
        }
      };

      await supplierScorecardService.createSupplier(supplierData);

      const alerts = await supplierScorecardService.generateVendorScorecardAlerts('test-org-4');

      expect(alerts).toBeDefined();
      expect(alerts.length).toBeGreaterThan(0);

      const slAlert = alerts.find(a =>
        a.alerts.some(alert => alert.type === 'service_level_decline')
      );

      expect(slAlert).toBeDefined();
      expect(slAlert?.alerts[0].type).toBe('service_level_decline');
      expect(slAlert?.alerts[0].severity).toBe('high'); // 88.5% is below 93%
      expect(slAlert?.alerts[0].currentValue).toBe(92.5);
      expect(slAlert?.alerts[0].targetValue).toBe(95);
    });

    it('should generate critical severity alerts for extreme values', async () => {
      // Create supplier with critical values
      const supplierData = {
        organizationId: 'test-org-5',
        name: 'Critical Supplier',
        code: 'CRIT001',
        type: 'manufacturer' as const,
        category: 'Electronics',
        status: 'active' as const,
        contactInfo: {
          email: 'critical@supplier.com',
          phone: '+34 91 123 4567',
          address: 'Test Address 123',
          city: 'Madrid',
          country: 'Spain'
        },
        businessInfo: {
          taxId: 'B12345678',
          registrationNumber: 'REG-2023-001',
          legalName: 'Critical Supplier S.L.',
          currency: 'EUR'
        },
        certifications: ['ISO 9001'],
        paymentTerms: {
          standardDays: 30,
          preferredMethod: 'bank_transfer' as const
        },
        performanceMetrics: {
          onTimeDelivery: 70,
          qualityScore: 6.0,
          costCompetitiveness: 6.5,
          communicationScore: 7.0,
          innovationScore: 6.0,
          sustainabilityScore: 6.5,
          // PR-69: Critical values
          otif: 75.0, // Critical: below 80%
          leadTime: 18.0, // Critical: above 15 days
          ppv: 12.0, // Critical: above 10%
          sl: 85.0 // Critical: below 90%
        },
        riskAssessment: {
          financialRisk: 'high' as const,
          operationalRisk: 'high' as const,
          complianceRisk: 'high' as const,
          overallRisk: 'high' as const,
          riskFactors: ['Multiple critical issues']
        }
      };

      await supplierScorecardService.createSupplier(supplierData);

      const alerts = await supplierScorecardService.generateVendorScorecardAlerts('test-org-5');

      expect(alerts).toBeDefined();
      expect(alerts.length).toBeGreaterThan(0);

      const criticalAlerts = alerts.find(a => a.supplierName === 'Critical Supplier');
      expect(criticalAlerts).toBeDefined();
      expect(criticalAlerts?.alerts.length).toBe(4); // All 4 metrics should trigger alerts

      // Check all alerts are critical severity
      criticalAlerts?.alerts.forEach(alert => {
        expect(alert.severity).toBe('critical');
      });
    });

    it('should not generate alerts for suppliers within thresholds', async () => {
      // Create supplier with good metrics
      const supplierData = {
        organizationId: 'test-org-6',
        name: 'Good Supplier',
        code: 'GOOD001',
        type: 'manufacturer' as const,
        category: 'Electronics',
        status: 'active' as const,
        contactInfo: {
          email: 'good@supplier.com',
          phone: '+34 91 123 4567',
          address: 'Test Address 123',
          city: 'Madrid',
          country: 'Spain'
        },
        businessInfo: {
          taxId: 'B12345678',
          registrationNumber: 'REG-2023-001',
          legalName: 'Good Supplier S.L.',
          currency: 'EUR'
        },
        certifications: ['ISO 9001'],
        paymentTerms: {
          standardDays: 30,
          preferredMethod: 'bank_transfer' as const
        },
        performanceMetrics: {
          onTimeDelivery: 98,
          qualityScore: 9.5,
          costCompetitiveness: 9.0,
          communicationScore: 9.5,
          innovationScore: 9.0,
          sustainabilityScore: 9.5,
          // PR-69: All metrics within good thresholds
          otif: 95.0, // Above 90%
          leadTime: 6.0, // Below 10 days
          ppv: -3.0, // Below 5% (negative is good)
          sl: 98.0 // Above 95%
        },
        riskAssessment: {
          financialRisk: 'low' as const,
          operationalRisk: 'low' as const,
          complianceRisk: 'low' as const,
          overallRisk: 'low' as const,
          riskFactors: []
        }
      };

      await supplierScorecardService.createSupplier(supplierData);

      const alerts = await supplierScorecardService.generateVendorScorecardAlerts('test-org-6');

      expect(alerts).toBeDefined();

      const goodSupplierAlert = alerts.find(a => a.supplierName === 'Good Supplier');
      expect(goodSupplierAlert).toBeUndefined(); // Should not have any alerts
    });
  });

  describe('Vendor Scorecard Performance Metrics', () => {
    it('should include vendor scorecard metrics in performance data', async () => {
      const performances = await supplierScorecardService.getSuppliersPerformance('demo-org-1');

      expect(performances).toBeDefined();
      expect(performances.length).toBeGreaterThan(0);

      const firstPerformance = performances[0];
      expect(firstPerformance.metrics).toHaveProperty('otifRate');
      expect(firstPerformance.metrics).toHaveProperty('averageLeadTime');
      expect(firstPerformance.metrics).toHaveProperty('ppvRate');
      expect(firstPerformance.metrics).toHaveProperty('serviceLevel');
    });
  });
});
