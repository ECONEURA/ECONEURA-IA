import { describe, it, expect, beforeEach, vi } from 'vitest';
import { sepaRobustService } from '../../../lib/sepa-robust.service.js';

// ============================================================================
// SEPA ROBUST SERVICE UNIT TESTS - PR-70
// ============================================================================

describe('SEPARobustService - PR-70', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // Reset service state for isolation
    (sepaRobustService as any).transactions = new Map();
    (sepaRobustService as any).rules = new Map();
    (sepaRobustService as any).exceptions = new Map();
    (sepaRobustService as any).validations = new Map();
    sepaRobustService.init(); // Re-initialize with demo data
  });

  describe('SEPA Robust Transaction Management', () => {
    it('should create transaction with CAMT version and validation', async () => {
      const transactionData = {
        organizationId: 'test-org-1',
        accountId: 'acc_001',
        transactionId: 'TXN-TEST-001',
        amount: 1000.00,
        currency: 'EUR',
        date: new Date().toISOString(),
        valueDate: new Date().toISOString(),
        description: 'Test payment',
        reference: 'REF-TEST-001',
        counterparty: {
          name: 'Test Company',
          iban: 'ES1234567890123456789012',
          bic: 'TESTESMM'
        },
        category: 'test',
        camtVersion: '053' as const
      };

      const transaction = await sepaRobustService.createTransaction(transactionData);

      expect(transaction).toBeDefined();
      expect(transaction.camtVersion).toBe('053');
      expect(transaction.validationErrors).toBeDefined();
      expect(transaction.processingFlags).toBeDefined();
      expect(transaction.status).toBeDefined();
    });

    it('should get transactions with filters', async () => {
      const transactions = await sepaRobustService.getTransactions('demo-org-1', {
        status: 'exception',
        limit: 10
      });

      expect(transactions).toBeDefined();
      expect(Array.isArray(transactions)).toBe(true);
      expect(transactions.length).toBeGreaterThan(0);
      expect(transactions.every(t => t.status === 'exception')).toBe(true);
    });

    it('should get transaction by ID', async () => {
      const transaction = await sepaRobustService.getTransaction('sepa_robust_1');

      expect(transaction).toBeDefined();
      expect(transaction?.id).toBe('sepa_robust_1');
      expect(transaction?.camtVersion).toBeDefined();
    });
  });

  describe('SEPA Robust Rule Management', () => {
    it('should create rule with conditions and actions', async () => {
      const ruleData = {
        organizationId: 'test-org-1',
        name: 'Test Rule',
        description: 'Test rule for validation',
        priority: 1,
        conditions: [
          {
            field: 'amount',
            operator: 'range' as const,
            value: { min: 100, max: 1000 },
            weight: 80
          }
        ],
        actions: [
          {
            type: 'auto_match' as const,
            parameters: { confidence_threshold: 90 }
          }
        ],
        enabled: true
      };

      const rule = await sepaRobustService.createRule(ruleData);

      expect(rule).toBeDefined();
      expect(rule.name).toBe('Test Rule');
      expect(rule.conditions).toHaveLength(1);
      expect(rule.actions).toHaveLength(1);
      expect(rule.enabled).toBe(true);
    });

    it('should get rules with filters', async () => {
      const rules = await sepaRobustService.getRules('demo-org-1', {
        enabled: true,
        limit: 10
      });

      expect(rules).toBeDefined();
      expect(Array.isArray(rules)).toBe(true);
      expect(rules.length).toBeGreaterThan(0);
      expect(rules.every(r => r.enabled === true)).toBe(true);
    });
  });

  describe('SEPA Robust Exception Management', () => {
    it('should create exception with details', async () => {
      const exceptionData = {
        organizationId: 'test-org-1',
        transactionId: 'sepa_robust_1',
        exceptionType: 'duplicate' as const,
        severity: 'high' as const,
        description: 'Test exception',
        details: { test: 'value' },
        status: 'open' as const
      };

      const exception = await sepaRobustService.createException(exceptionData);

      expect(exception).toBeDefined();
      expect(exception.exceptionType).toBe('duplicate');
      expect(exception.severity).toBe('high');
      expect(exception.details).toEqual({ test: 'value' });
    });

    it('should get exceptions with filters', async () => {
      const exceptions = await sepaRobustService.getExceptions('demo-org-1', {
        severity: 'high',
        limit: 10
      });

      expect(exceptions).toBeDefined();
      expect(Array.isArray(exceptions)).toBe(true);
      expect(exceptions.length).toBeGreaterThan(0);
      expect(exceptions.every(e => e.severity === 'high')).toBe(true);
    });
  });

  describe('SEPA Robust Validation', () => {
    it('should validate transaction with valid data', async () => {
      const transaction = {
        id: 'test_transaction',
        organizationId: 'test-org-1',
        accountId: 'acc_001',
        transactionId: 'TXN-VALID-001',
        amount: 500.00,
        currency: 'EUR',
        date: new Date().toISOString(),
        valueDate: new Date().toISOString(),
        description: 'Valid transaction',
        reference: 'REF-VALID-001',
        counterparty: {
          name: 'Valid Company',
          iban: 'ES1234567890123456789012',
          bic: 'VALIDESMM'
        },
        category: 'valid',
        status: 'pending' as const,
        matchingScore: 0,
        camtVersion: '053' as const,
        validationErrors: [],
        processingFlags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const validation = await sepaRobustService.validateTransaction(transaction);

      expect(validation).toBeDefined();
      expect(validation.transactionId).toBe('test_transaction');
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      expect(validation.confidence).toBeGreaterThan(0);
    });

    it('should validate transaction with invalid IBAN', async () => {
      const transaction = {
        id: 'test_transaction_invalid',
        organizationId: 'test-org-1',
        accountId: 'acc_001',
        transactionId: 'TXN-INVALID-001',
        amount: 500.00,
        currency: 'EUR',
        date: new Date().toISOString(),
        valueDate: new Date().toISOString(),
        description: 'Invalid transaction',
        reference: 'REF-INVALID-001',
        counterparty: {
          name: 'Invalid Company',
          iban: 'INVALID-IBAN',
          bic: 'INVALID'
        },
        category: 'invalid',
        status: 'pending' as const,
        matchingScore: 0,
        camtVersion: '053' as const,
        validationErrors: [],
        processingFlags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const validation = await sepaRobustService.validateTransaction(transaction);

      expect(validation).toBeDefined();
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Invalid IBAN format');
      expect(validation.confidence).toBeLessThan(100);
    });

    it('should validate transaction with negative amount', async () => {
      const transaction = {
        id: 'test_transaction_negative',
        organizationId: 'test-org-1',
        accountId: 'acc_001',
        transactionId: 'TXN-NEGATIVE-001',
        amount: -100.00,
        currency: 'EUR',
        date: new Date().toISOString(),
        valueDate: new Date().toISOString(),
        description: 'Negative amount transaction',
        reference: 'REF-NEGATIVE-001',
        counterparty: {
          name: 'Test Company',
          iban: 'ES1234567890123456789012',
          bic: 'TESTESMM'
        },
        category: 'test',
        status: 'pending' as const,
        matchingScore: 0,
        camtVersion: '053' as const,
        validationErrors: [],
        processingFlags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const validation = await sepaRobustService.validateTransaction(transaction);

      expect(validation).toBeDefined();
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Amount must be positive');
    });
  });

  describe('SEPA Robust Rule Application', () => {
    it('should apply auto-match rule for high confidence transactions', async () => {
      const transactionData = {
        organizationId: 'demo-org-1',
        accountId: 'acc_001',
        transactionId: 'TXN-AUTO-MATCH-001',
        amount: 1500.00,
        currency: 'EUR',
        date: new Date().toISOString(),
        valueDate: new Date().toISOString(),
        description: 'High confidence transaction',
        reference: 'REF-AUTO-001',
        counterparty: {
          name: 'Auto Match Company',
          iban: 'ES1234567890123456789012',
          bic: 'AUTOESMM'
        },
        category: 'auto',
        camtVersion: '053' as const
      };

      const transaction = await sepaRobustService.createTransaction(transactionData);

      // The transaction should be processed and potentially auto-matched
      expect(transaction).toBeDefined();
      expect(transaction.status).toBeDefined();
      expect(transaction.processingFlags).toBeDefined();
    });

    it('should flag exception for duplicate transactions', async () => {
      const transactionData = {
        organizationId: 'demo-org-1',
        accountId: 'acc_001',
        transactionId: 'TXN-DUPLICATE-001',
        amount: 750.50,
        currency: 'EUR',
        date: new Date().toISOString(),
        valueDate: new Date().toISOString(),
        description: 'Potential duplicate',
        reference: 'REF-001', // Same reference as demo data
        counterparty: {
          name: 'TechCorp Solutions',
          iban: 'ES1234567890123456789012',
          bic: 'TECHESMM'
        },
        category: 'duplicate',
        camtVersion: '053' as const
      };

      const transaction = await sepaRobustService.createTransaction(transactionData);

      // Should be flagged as exception due to duplicate detection
      expect(transaction).toBeDefined();
      expect(transaction.status).toBe('exception');
      expect(transaction.exceptionType).toBe('duplicate');
      expect(transaction.processingFlags).toContain('duplicate_detected');
    });
  });

  describe('SEPA Robust Reports', () => {
    it('should generate processing summary report', async () => {
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = new Date().toISOString();

      const report = await sepaRobustService.generateReport(
        'demo-org-1',
        'processing_summary',
        startDate,
        endDate,
        'test-user'
      );

      expect(report).toBeDefined();
      expect(report.reportType).toBe('processing_summary');
      expect(report.summary).toBeDefined();
      expect(report.summary.totalTransactions).toBeGreaterThan(0);
      expect(report.data).toBeDefined();
    });

    it('should generate exception analysis report', async () => {
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = new Date().toISOString();

      const report = await sepaRobustService.generateReport(
        'demo-org-1',
        'exception_analysis',
        startDate,
        endDate,
        'test-user'
      );

      expect(report).toBeDefined();
      expect(report.reportType).toBe('exception_analysis');
      expect(report.summary).toBeDefined();
      expect(report.data).toBeDefined();
      expect(report.data.exceptionTypes).toBeDefined();
    });
  });

  describe('SEPA Robust Statistics', () => {
    it('should get comprehensive statistics', async () => {
      const stats = await sepaRobustService.getStats('demo-org-1');

      expect(stats).toBeDefined();
      expect(stats.totalTransactions).toBeGreaterThan(0);
      expect(stats.totalExceptions).toBeGreaterThan(0);
      expect(stats.totalRules).toBeGreaterThan(0);
      expect(stats.activeRules).toBeGreaterThan(0);
      expect(stats.last24Hours).toBeDefined();
      expect(stats.last7Days).toBeDefined();
      expect(stats.byStatus).toBeDefined();
      expect(stats.byExceptionType).toBeDefined();
      expect(stats.bySeverity).toBeDefined();
    });

    it('should calculate success rate correctly', async () => {
      const stats = await sepaRobustService.getStats('demo-org-1');

      expect(stats.last24Hours.successRate).toBeGreaterThanOrEqual(0);
      expect(stats.last24Hours.successRate).toBeLessThanOrEqual(100);
    });
  });

  describe('SEPA Robust CAMT Version Support', () => {
    it('should handle CAMT.053 transactions', async () => {
      const transactionData = {
        organizationId: 'test-org-1',
        accountId: 'acc_001',
        transactionId: 'TXN-CAMT053-001',
        amount: 1000.00,
        currency: 'EUR',
        date: new Date().toISOString(),
        valueDate: new Date().toISOString(),
        description: 'CAMT.053 transaction',
        reference: 'REF-CAMT053-001',
        counterparty: {
          name: 'CAMT053 Company',
          iban: 'ES1234567890123456789012',
          bic: 'CAMT53MM'
        },
        category: 'camt053',
        camtVersion: '053' as const
      };

      const transaction = await sepaRobustService.createTransaction(transactionData);

      expect(transaction).toBeDefined();
      expect(transaction.camtVersion).toBe('053');
    });

    it('should handle CAMT.054 transactions', async () => {
      const transactionData = {
        organizationId: 'test-org-1',
        accountId: 'acc_001',
        transactionId: 'TXN-CAMT054-001',
        amount: 2000.00,
        currency: 'EUR',
        date: new Date().toISOString(),
        valueDate: new Date().toISOString(),
        description: 'CAMT.054 transaction',
        reference: 'REF-CAMT054-001',
        counterparty: {
          name: 'CAMT054 Company',
          iban: 'ES9876543210987654321098',
          bic: 'CAMT54MM'
        },
        category: 'camt054',
        camtVersion: '054' as const
      };

      const transaction = await sepaRobustService.createTransaction(transactionData);

      expect(transaction).toBeDefined();
      expect(transaction.camtVersion).toBe('054');
    });
  });
});
