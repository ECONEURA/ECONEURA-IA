// Unit tests for SEPAService - PR-42: SEPA Integration

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SEPAService, SEPATransactionSchema, MatchingRuleSchema, SEPAFilterSchema } from '../../../lib/sepa.service.js';

describe('SEPAService', () => {
  let service: SEPAService;
  const orgId = 'test-org-1';
  const userId = 'test-user-1';

  beforeEach(() => {
    service = new SEPAService();
  });

  describe('createTransaction', () => {
    it('should create a new SEPA transaction successfully', async () => {
      const transactionData = {
        accountId: 'account-1',
        transactionId: 'TXN-001',
        amount: 1000.00,
        currency: 'EUR',
        date: new Date().toISOString(),
        valueDate: new Date().toISOString(),
        description: 'Test SEPA transaction',
        reference: 'REF-001',
        counterparty: {
          name: 'Test Counterparty',
          iban: 'ES1234567890123456789012',
          bic: 'TESTESMM'
        },
        category: 'income',
        status: 'pending' as const
      };

      const result = await service.createTransaction(orgId, userId, transactionData);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.accountId).toBe(transactionData.accountId);
      expect(result.transactionId).toBe(transactionData.transactionId);
      expect(result.amount).toBe(transactionData.amount);
      expect(result.currency).toBe(transactionData.currency);
      expect(result.description).toBe(transactionData.description);
      expect(result.reference).toBe(transactionData.reference);
      expect(result.counterparty.name).toBe(transactionData.counterparty.name);
      expect(result.counterparty.iban).toBe(transactionData.counterparty.iban);
      expect(result.counterparty.bic).toBe(transactionData.counterparty.bic);
      expect(result.category).toBe(transactionData.category);
      expect(result.status).toBe(transactionData.status);
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });

    it('should validate transaction data', async () => {
      const invalidData = {
        accountId: '', // Empty accountId should fail
        amount: 'invalid-amount', // Invalid amount should fail
        currency: 'INVALID', // Invalid currency should fail
      };

      await expect(service.createTransaction(orgId, userId, invalidData))
        .rejects.toThrow();
    });

    it('should set default values for optional fields', async () => {
      const minimalData = {
        accountId: 'account-1',
        transactionId: 'TXN-002',
        amount: 500.00,
        date: new Date().toISOString(),
        valueDate: new Date().toISOString(),
        description: 'Minimal SEPA transaction'
      };

      const result = await service.createTransaction(orgId, userId, minimalData);

      expect(result.currency).toBe('EUR'); // Default value
      expect(result.category).toBe('unknown'); // Default value
      expect(result.status).toBe('pending'); // Default value
    });
  });

  describe('getTransactions', () => {
    beforeEach(async () => {
      // Create some test transactions
      await service.createTransaction(orgId, userId, {
        accountId: 'account-1',
        transactionId: 'TXN-001',
        amount: 1000.00,
        date: new Date().toISOString(),
        valueDate: new Date().toISOString(),
        description: 'Transaction 1',
        category: 'income'
      });

      await service.createTransaction(orgId, userId, {
        accountId: 'account-2',
        transactionId: 'TXN-002',
        amount: -500.00,
        date: new Date().toISOString(),
        valueDate: new Date().toISOString(),
        description: 'Transaction 2',
        category: 'expense'
      });

      await service.createTransaction(orgId, userId, {
        accountId: 'account-1',
        transactionId: 'TXN-003',
        amount: 2000.00,
        date: new Date().toISOString(),
        valueDate: new Date().toISOString(),
        description: 'Transaction 3',
        status: 'matched'
      });
    });

    it('should return all transactions for an organization', async () => {
      const result = await service.getTransactions(orgId, {});

      expect(result.transactions).toBeDefined();
      expect(result.total).toBeGreaterThan(0);
      expect(result.transactions.length).toBeGreaterThan(0);
    });

    it('should filter transactions by account_id', async () => {
      const result = await service.getTransactions(orgId, { accountId: 'account-1' });

      expect(result.transactions.every(t => t.accountId === 'account-1')).toBe(true);
    });

    it('should filter transactions by status', async () => {
      const result = await service.getTransactions(orgId, { status: 'matched' });

      expect(result.transactions.every(t => t.status === 'matched')).toBe(true);
    });

    it('should filter transactions by category', async () => {
      const result = await service.getTransactions(orgId, { category: 'income' });

      expect(result.transactions.every(t => t.category === 'income')).toBe(true);
    });

    it('should filter transactions by amount range', async () => {
      const result = await service.getTransactions(orgId, { amountMin: 1000, amountMax: 1500 });

      expect(result.transactions.every(t => t.amount >= 1000 && t.amount <= 1500)).toBe(true);
    });

    it('should filter transactions by reference', async () => {
      const result = await service.getTransactions(orgId, { reference: 'TXN-001' });

      expect(result.transactions.every(t => t.reference?.includes('TXN-001'))).toBe(true);
    });

    it('should respect limit and offset', async () => {
      const result = await service.getTransactions(orgId, { limit: 1, offset: 0 });

      expect(result.transactions.length).toBeLessThanOrEqual(1);
    });
  });

  describe('getTransactionById', () => {
    let transactionId: string;

    beforeEach(async () => {
      const transaction = await service.createTransaction(orgId, userId, {
        accountId: 'account-1',
        transactionId: 'TXN-001',
        amount: 1500.00,
        date: new Date().toISOString(),
        valueDate: new Date().toISOString(),
        description: 'Test transaction for get by ID'
      });
      transactionId = transaction.id;
    });

    it('should return transaction by ID', async () => {
      const result = await service.getTransactionById(orgId, transactionId);

      expect(result).toBeDefined();
      expect(result!.id).toBe(transactionId);
    });

    it('should return null for non-existent transaction', async () => {
      const result = await service.getTransactionById(orgId, 'non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('updateTransaction', () => {
    let transactionId: string;

    beforeEach(async () => {
      const transaction = await service.createTransaction(orgId, userId, {
        accountId: 'account-1',
        transactionId: 'TXN-001',
        amount: 1000.00,
        date: new Date().toISOString(),
        valueDate: new Date().toISOString(),
        description: 'Original transaction',
        status: 'pending'
      });
      transactionId = transaction.id;
    });

    it('should update transaction successfully', async () => {
      const updateData = {
        description: 'Updated transaction',
        status: 'matched' as const,
        category: 'income'
      };

      const result = await service.updateTransaction(orgId, transactionId, userId, updateData);

      expect(result).toBeDefined();
      expect(result!.description).toBe(updateData.description);
      expect(result!.status).toBe(updateData.status);
      expect(result!.category).toBe(updateData.category);
      expect(result!.updatedAt).toBeDefined();
    });

    it('should return null for non-existent transaction', async () => {
      const result = await service.updateTransaction(orgId, 'non-existent-id', userId, {
        description: 'Updated transaction'
      });

      expect(result).toBeNull();
    });
  });

  describe('deleteTransaction', () => {
    let transactionId: string;

    beforeEach(async () => {
      const transaction = await service.createTransaction(orgId, userId, {
        accountId: 'account-1',
        transactionId: 'TXN-001',
        amount: 1000.00,
        date: new Date().toISOString(),
        valueDate: new Date().toISOString(),
        description: 'Transaction to be deleted'
      });
      transactionId = transaction.id;
    });

    it('should delete transaction successfully', async () => {
      const result = await service.deleteTransaction(orgId, transactionId, userId);

      expect(result).toBe(true);

      // Verify transaction is deleted
      const deletedTransaction = await service.getTransactionById(orgId, transactionId);
      expect(deletedTransaction).toBeNull();
    });

    it('should return false for non-existent transaction', async () => {
      const result = await service.deleteTransaction(orgId, 'non-existent-id', userId);

      expect(result).toBe(false);
    });
  });

  describe('autoMatchTransaction', () => {
    let transactionId: string;

    beforeEach(async () => {
      const transaction = await service.createTransaction(orgId, userId, {
        accountId: 'account-1',
        transactionId: 'TXN-001',
        amount: 1000.00,
        date: new Date().toISOString(),
        valueDate: new Date().toISOString(),
        description: 'Transaction for auto-matching',
        status: 'pending'
      });
      transactionId = transaction.id;
    });

    it('should attempt to auto-match transaction', async () => {
      const result = await service.autoMatchTransaction(transactionId);

      expect(result).toBeDefined();
      expect(result.matched).toBeDefined();
      // The actual matching result depends on the rules and available transactions
    });

    it('should return not matched for non-existent transaction', async () => {
      const result = await service.autoMatchTransaction('non-existent-id');

      expect(result.matched).toBe(false);
    });
  });

  describe('getSEPASummary', () => {
    beforeEach(async () => {
      // Create test transactions for summary
      await service.createTransaction(orgId, userId, {
        accountId: 'account-1',
        transactionId: 'TXN-001',
        amount: 1000.00,
        date: new Date().toISOString(),
        valueDate: new Date().toISOString(),
        description: 'Transaction 1',
        category: 'income',
        status: 'matched'
      });

      await service.createTransaction(orgId, userId, {
        accountId: 'account-2',
        transactionId: 'TXN-002',
        amount: -500.00,
        date: new Date().toISOString(),
        valueDate: new Date().toISOString(),
        description: 'Transaction 2',
        category: 'expense',
        status: 'pending'
      });
    });

    it('should return comprehensive summary', async () => {
      const summary = await service.getSEPASummary(orgId);

      expect(summary).toBeDefined();
      expect(summary.total).toBeGreaterThan(0);
      expect(summary.totalValue).toBeDefined();
      expect(summary.averageAmount).toBeDefined();
      expect(summary.byStatus).toBeDefined();
      expect(summary.byCategory).toBeDefined();
      expect(summary.byAccount).toBeDefined();
      expect(summary.pendingCount).toBeDefined();
      expect(summary.matchedCount).toBeDefined();
      expect(summary.reconciledCount).toBeDefined();
      expect(summary.disputedCount).toBeDefined();
      expect(summary.topCounterparties).toBeDefined();
      expect(summary.recentActivity).toBeDefined();
    });

    it('should calculate correct counts by status', async () => {
      const summary = await service.getSEPASummary(orgId);

      expect(summary.byStatus.matched).toBeGreaterThan(0);
      expect(summary.byStatus.pending).toBeGreaterThan(0);
    });

    it('should calculate correct counts by category', async () => {
      const summary = await service.getSEPASummary(orgId);

      expect(summary.byCategory.income).toBeGreaterThan(0);
      expect(summary.byCategory.expense).toBeGreaterThan(0);
    });
  });

  describe('getSEPAAnalytics', () => {
    beforeEach(async () => {
      // Create test transactions for analytics
      await service.createTransaction(orgId, userId, {
        accountId: 'account-1',
        transactionId: 'TXN-001',
        amount: 1000.00,
        date: new Date().toISOString(),
        valueDate: new Date().toISOString(),
        description: 'Transaction for analytics',
        status: 'matched'
      });

      await service.createTransaction(orgId, userId, {
        accountId: 'account-2',
        transactionId: 'TXN-002',
        amount: -500.00,
        date: new Date().toISOString(),
        valueDate: new Date().toISOString(),
        description: 'Another transaction for analytics',
        status: 'pending'
      });
    });

    it('should return comprehensive analytics', async () => {
      const analytics = await service.getSEPAAnalytics(orgId);

      expect(analytics).toBeDefined();
      expect(analytics.summary).toBeDefined();
      expect(analytics.trends).toBeDefined();
      expect(analytics.performance).toBeDefined();
      expect(analytics.recommendations).toBeDefined();

      expect(analytics.trends.matchingRate).toBeDefined();
      expect(analytics.trends.reconciliationRate).toBeDefined();
      expect(analytics.trends.averageProcessingTime).toBeDefined();
      expect(analytics.trends.errorRate).toBeDefined();

      expect(analytics.performance.totalTransactions).toBeDefined();
      expect(analytics.performance.matchedTransactions).toBeDefined();
      expect(analytics.performance.reconciledTransactions).toBeDefined();
      expect(analytics.performance.disputedTransactions).toBeDefined();
      expect(analytics.performance.matchingAccuracy).toBeDefined();
      expect(analytics.performance.processingEfficiency).toBeDefined();
    });

    it('should include recommendations', async () => {
      const analytics = await service.getSEPAAnalytics(orgId);

      expect(analytics.recommendations).toBeDefined();
      expect(Array.isArray(analytics.recommendations)).toBe(true);
      expect(analytics.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('createMatchingRule', () => {
    it('should create a new matching rule successfully', async () => {
      const ruleData = {
        name: 'Test Matching Rule',
        description: 'Test rule for matching transactions',
        priority: 80,
        conditions: [
          {
            field: 'amount',
            operator: 'range' as const,
            value: { min: -0.01, max: 0.01 },
            weight: 100
          }
        ],
        actions: [
          {
            type: 'match' as const,
            parameters: { threshold: 80 }
          }
        ],
        enabled: true
      };

      const result = await service.createMatchingRule(orgId, userId, ruleData);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBe(ruleData.name);
      expect(result.description).toBe(ruleData.description);
      expect(result.priority).toBe(ruleData.priority);
      expect(result.conditions).toEqual(ruleData.conditions);
      expect(result.actions).toEqual(ruleData.actions);
      expect(result.enabled).toBe(ruleData.enabled);
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });

    it('should validate rule data', async () => {
      const invalidData = {
        name: '', // Empty name should fail
        priority: 'invalid-priority', // Invalid priority should fail
        conditions: 'invalid-conditions' // Invalid conditions should fail
      };

      await expect(service.createMatchingRule(orgId, userId, invalidData))
        .rejects.toThrow();
    });
  });

  describe('getMatchingRules', () => {
    it('should return all matching rules', async () => {
      const rules = await service.getMatchingRules(orgId);

      expect(rules).toBeDefined();
      expect(Array.isArray(rules)).toBe(true);
      expect(rules.length).toBeGreaterThan(0);
    });

    it('should return rules sorted by priority', async () => {
      const rules = await service.getMatchingRules(orgId);

      for (let i = 1; i < rules.length; i++) {
        expect(rules[i-1].priority).toBeGreaterThanOrEqual(rules[i].priority);
      }
    });
  });

  describe('getStats', () => {
    it('should return service statistics', () => {
      const stats = service.getStats();

      expect(stats).toBeDefined();
      expect(stats.totalTransactions).toBeDefined();
      expect(stats.totalRules).toBeDefined();
      expect(stats.totalReconciliations).toBeDefined();
      expect(stats.byStatus).toBeDefined();
      expect(stats.byCategory).toBeDefined();
    });
  });

  describe('Schema Validation', () => {
    describe('SEPATransactionSchema', () => {
      it('should validate valid transaction data', () => {
        const validData = {
          accountId: 'account-1',
          transactionId: 'TXN-001',
          amount: 1000.00,
          currency: 'EUR',
          date: new Date().toISOString(),
          valueDate: new Date().toISOString(),
          description: 'Valid transaction',
          reference: 'REF-001',
          counterparty: {
            name: 'Test Counterparty',
            iban: 'ES1234567890123456789012',
            bic: 'TESTESMM'
          },
          category: 'income',
          status: 'pending'
        };

        expect(() => SEPATransactionSchema.parse(validData)).not.toThrow();
      });

      it('should reject invalid transaction data', () => {
        const invalidData = {
          accountId: '',
          amount: 'invalid-amount',
          currency: 'INVALID',
          status: 'invalid-status'
        };

        expect(() => SEPATransactionSchema.parse(invalidData)).toThrow();
      });
    });

    describe('MatchingRuleSchema', () => {
      it('should validate valid rule data', () => {
        const validData = {
          name: 'Valid Rule',
          description: 'Valid rule description',
          priority: 80,
          conditions: [
            {
              field: 'amount',
              operator: 'range',
              value: { min: -0.01, max: 0.01 },
              weight: 100
            }
          ],
          actions: [
            {
              type: 'match',
              parameters: { threshold: 80 }
            }
          ],
          enabled: true
        };

        expect(() => MatchingRuleSchema.parse(validData)).not.toThrow();
      });

      it('should reject invalid rule data', () => {
        const invalidData = {
          name: '',
          priority: 'invalid-priority',
          conditions: 'invalid-conditions'
        };

        expect(() => MatchingRuleSchema.parse(invalidData)).toThrow();
      });
    });

    describe('SEPAFilterSchema', () => {
      it('should validate filter parameters', () => {
        const validFilters = {
          accountId: 'account-1',
          status: 'pending',
          category: 'income',
          amountMin: 1000,
          amountMax: 5000,
          limit: 10,
          offset: 0
        };

        expect(() => SEPAFilterSchema.parse(validFilters)).not.toThrow();
      });

      it('should set default values for limit and offset', () => {
        const filters = SEPAFilterSchema.parse({});

        expect(filters.limit).toBe(50);
        expect(filters.offset).toBe(0);
      });
    });
  });
});

