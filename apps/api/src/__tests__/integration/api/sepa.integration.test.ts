// Integration tests for SEPA API - PR-42: SEPA Integration

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '../../../index.js';

describe('SEPA API Integration Tests', () => {
  const baseHeaders = {
    'x-org-id': 'test-org-1',
    'x-user-id': 'test-user-1',
    'Content-Type': 'application/json'
  };

  let createdTransactionId: string;

  describe('POST /v1/sepa/transactions', () => {
    it('should create a new SEPA transaction successfully', async () => {
      const transactionData = {
        accountId: 'account-1',
        transactionId: 'TXN-001',
        amount: 1500.00,
        currency: 'EUR',
        date: new Date().toISOString(),
        valueDate: new Date().toISOString(),
        description: 'Test SEPA transaction for integration',
        reference: 'REF-001',
        counterparty: {
          name: 'Test Counterparty',
          iban: 'ES1234567890123456789012',
          bic: 'TESTESMM'
        },
        category: 'income',
        status: 'pending'
      };

      const response = await request(app)
        .post('/v1/sepa/transactions')
        .set(baseHeaders)
        .send(transactionData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.accountId).toBe(transactionData.accountId);
      expect(response.body.data.transactionId).toBe(transactionData.transactionId);
      expect(response.body.data.amount).toBe(transactionData.amount);
      expect(response.body.data.currency).toBe(transactionData.currency);
      expect(response.body.data.description).toBe(transactionData.description);
      expect(response.body.data.reference).toBe(transactionData.reference);
      expect(response.body.data.counterparty.name).toBe(transactionData.counterparty.name);
      expect(response.body.data.counterparty.iban).toBe(transactionData.counterparty.iban);
      expect(response.body.data.counterparty.bic).toBe(transactionData.counterparty.bic);
      expect(response.body.data.category).toBe(transactionData.category);
      expect(response.body.data.status).toBe(transactionData.status);
      expect(response.body.data.createdAt).toBeDefined();
      expect(response.body.data.updatedAt).toBeDefined();

      // Store for other tests
      createdTransactionId = response.body.data.id;
    });

    it('should create transaction with minimal required data', async () => {
      const minimalData = {
        accountId: 'account-1',
        transactionId: 'TXN-002',
        amount: 1000.00,
        date: new Date().toISOString(),
        valueDate: new Date().toISOString(),
        description: 'Minimal SEPA transaction'
      };

      const response = await request(app)
        .post('/v1/sepa/transactions')
        .set(baseHeaders)
        .send(minimalData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.currency).toBe('EUR'); // Default value
      expect(response.body.data.category).toBe('unknown'); // Default value
      expect(response.body.data.status).toBe('pending'); // Default value
    });

    it('should return validation error for invalid data', async () => {
      const invalidData = {
        accountId: '', // Empty accountId should fail
        amount: 'invalid-amount', // Invalid amount should fail
        currency: 'INVALID', // Invalid currency should fail
        status: 'invalid-status'
      };

      const response = await request(app)
        .post('/v1/sepa/transactions')
        .set(baseHeaders)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation error');
      expect(response.body.details).toBeDefined();
    });

    it('should return error for missing required fields', async () => {
      const incompleteData = {
        amount: 1000.00
        // Missing required fields
      };

      const response = await request(app)
        .post('/v1/sepa/transactions')
        .set(baseHeaders)
        .send(incompleteData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation error');
    });
  });

  describe('GET /v1/sepa/transactions', () => {
    beforeEach(async () => {
      // Create test transactions
      const transactions = [
        {
          accountId: 'account-1',
          transactionId: 'TXN-001',
          amount: 1000.00,
          date: new Date().toISOString(),
          valueDate: new Date().toISOString(),
          description: 'Transaction 1',
          category: 'income'
        },
        {
          accountId: 'account-2',
          transactionId: 'TXN-002',
          amount: -500.00,
          date: new Date().toISOString(),
          valueDate: new Date().toISOString(),
          description: 'Transaction 2',
          category: 'expense'
        },
        {
          accountId: 'account-1',
          transactionId: 'TXN-003',
          amount: 2000.00,
          date: new Date().toISOString(),
          valueDate: new Date().toISOString(),
          description: 'Transaction 3',
          status: 'matched'
        }
      ];

      for (const transaction of transactions) {
        await request(app)
          .post('/v1/sepa/transactions')
          .set(baseHeaders)
          .send(transaction);
      }
    });

    it('should return all transactions', async () => {
      const response = await request(app)
        .get('/v1/sepa/transactions')
        .set(baseHeaders)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.count).toBeDefined();
      expect(response.body.total).toBeDefined();
      expect(response.body.filters).toBeDefined();
    });

    it('should filter transactions by account_id', async () => {
      const response = await request(app)
        .get('/v1/sepa/transactions?accountId=account-1')
        .set(baseHeaders)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.every((t: any) => t.accountId === 'account-1')).toBe(true);
    });

    it('should filter transactions by status', async () => {
      const response = await request(app)
        .get('/v1/sepa/transactions?status=matched')
        .set(baseHeaders)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.every((t: any) => t.status === 'matched')).toBe(true);
    });

    it('should filter transactions by category', async () => {
      const response = await request(app)
        .get('/v1/sepa/transactions?category=income')
        .set(baseHeaders)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.every((t: any) => t.category === 'income')).toBe(true);
    });

    it('should filter transactions by amount range', async () => {
      const response = await request(app)
        .get('/v1/sepa/transactions?amountMin=1000&amountMax=1500')
        .set(baseHeaders)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.every((t: any) => 
        t.amount >= 1000 && t.amount <= 1500
      )).toBe(true);
    });

    it('should respect limit and offset parameters', async () => {
      const response = await request(app)
        .get('/v1/sepa/transactions?limit=1&offset=0')
        .set(baseHeaders)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(1);
    });

    it('should return validation error for invalid filter parameters', async () => {
      const response = await request(app)
        .get('/v1/sepa/transactions?status=invalid-status&amountMin=invalid-amount')
        .set(baseHeaders)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation error');
    });
  });

  describe('GET /v1/sepa/transactions/:id', () => {
    it('should return transaction by ID', async () => {
      // First create a transaction
      const createResponse = await request(app)
        .post('/v1/sepa/transactions')
        .set(baseHeaders)
        .send({
          accountId: 'account-1',
          transactionId: 'TXN-001',
          amount: 1500.00,
          date: new Date().toISOString(),
          valueDate: new Date().toISOString(),
          description: 'Test transaction for get by ID'
        });

      const transactionId = createResponse.body.data.id;

      const response = await request(app)
        .get(`/v1/sepa/transactions/${transactionId}`)
        .set(baseHeaders)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(transactionId);
    });

    it('should return 404 for non-existent transaction', async () => {
      const response = await request(app)
        .get('/v1/sepa/transactions/non-existent-id')
        .set(baseHeaders)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('SEPA transaction not found');
    });
  });

  describe('PUT /v1/sepa/transactions/:id', () => {
    it('should update transaction successfully', async () => {
      // First create a transaction
      const createResponse = await request(app)
        .post('/v1/sepa/transactions')
        .set(baseHeaders)
        .send({
          accountId: 'account-1',
          transactionId: 'TXN-001',
          amount: 1000.00,
          date: new Date().toISOString(),
          valueDate: new Date().toISOString(),
          description: 'Original transaction',
          status: 'pending'
        });

      const transactionId = createResponse.body.data.id;

      const updateData = {
        description: 'Updated transaction',
        status: 'matched',
        category: 'income'
      };

      const response = await request(app)
        .put(`/v1/sepa/transactions/${transactionId}`)
        .set(baseHeaders)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.description).toBe(updateData.description);
      expect(response.body.data.status).toBe(updateData.status);
      expect(response.body.data.category).toBe(updateData.category);
      expect(response.body.data.updatedAt).toBeDefined();
    });

    it('should return 404 for non-existent transaction', async () => {
      const response = await request(app)
        .put('/v1/sepa/transactions/non-existent-id')
        .set(baseHeaders)
        .send({ description: 'Updated transaction' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('SEPA transaction not found');
    });

    it('should return validation error for invalid update data', async () => {
      const response = await request(app)
        .put(`/v1/sepa/transactions/${createdTransactionId}`)
        .set(baseHeaders)
        .send({ status: 'invalid-status' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation error');
    });
  });

  describe('DELETE /v1/sepa/transactions/:id', () => {
    it('should delete transaction successfully', async () => {
      // First create a transaction
      const createResponse = await request(app)
        .post('/v1/sepa/transactions')
        .set(baseHeaders)
        .send({
          accountId: 'account-1',
          transactionId: 'TXN-001',
          amount: 1000.00,
          date: new Date().toISOString(),
          valueDate: new Date().toISOString(),
          description: 'Transaction to be deleted'
        });

      const transactionId = createResponse.body.data.id;

      const response = await request(app)
        .delete(`/v1/sepa/transactions/${transactionId}`)
        .set(baseHeaders)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('SEPA transaction deleted successfully');

      // Verify transaction is deleted
      await request(app)
        .get(`/v1/sepa/transactions/${transactionId}`)
        .set(baseHeaders)
        .expect(404);
    });

    it('should return 404 for non-existent transaction', async () => {
      const response = await request(app)
        .delete('/v1/sepa/transactions/non-existent-id')
        .set(baseHeaders)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('SEPA transaction not found');
    });
  });

  describe('POST /v1/sepa/transactions/:id/match', () => {
    it('should attempt to auto-match transaction', async () => {
      // First create a transaction
      const createResponse = await request(app)
        .post('/v1/sepa/transactions')
        .set(baseHeaders)
        .send({
          accountId: 'account-1',
          transactionId: 'TXN-001',
          amount: 1000.00,
          date: new Date().toISOString(),
          valueDate: new Date().toISOString(),
          description: 'Transaction for auto-matching',
          status: 'pending'
        });

      const transactionId = createResponse.body.data.id;

      const response = await request(app)
        .post(`/v1/sepa/transactions/${transactionId}/match`)
        .set(baseHeaders)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.matched).toBeDefined();
    });
  });

  describe('GET /v1/sepa/summary', () => {
    beforeEach(async () => {
      // Create test transactions for summary
      const transactions = [
        { accountId: 'account-1', transactionId: 'TXN-001', amount: 1000.00, date: new Date().toISOString(), valueDate: new Date().toISOString(), description: 'Transaction 1', category: 'income', status: 'matched' },
        { accountId: 'account-2', transactionId: 'TXN-002', amount: -500.00, date: new Date().toISOString(), valueDate: new Date().toISOString(), description: 'Transaction 2', category: 'expense', status: 'pending' }
      ];

      for (const transaction of transactions) {
        await request(app)
          .post('/v1/sepa/transactions')
          .set(baseHeaders)
          .send(transaction);
      }
    });

    it('should return SEPA summary', async () => {
      const response = await request(app)
        .get('/v1/sepa/summary')
        .set(baseHeaders)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.total).toBeDefined();
      expect(response.body.data.totalValue).toBeDefined();
      expect(response.body.data.averageAmount).toBeDefined();
      expect(response.body.data.byStatus).toBeDefined();
      expect(response.body.data.byCategory).toBeDefined();
      expect(response.body.data.byAccount).toBeDefined();
      expect(response.body.data.pendingCount).toBeDefined();
      expect(response.body.data.matchedCount).toBeDefined();
      expect(response.body.data.reconciledCount).toBeDefined();
      expect(response.body.data.disputedCount).toBeDefined();
      expect(response.body.data.topCounterparties).toBeDefined();
      expect(response.body.data.recentActivity).toBeDefined();
    });
  });

  describe('GET /v1/sepa/analytics', () => {
    beforeEach(async () => {
      // Create test transactions for analytics
      const transactions = [
        { accountId: 'account-1', transactionId: 'TXN-001', amount: 1000.00, date: new Date().toISOString(), valueDate: new Date().toISOString(), description: 'Transaction for analytics', status: 'matched' },
        { accountId: 'account-2', transactionId: 'TXN-002', amount: -500.00, date: new Date().toISOString(), valueDate: new Date().toISOString(), description: 'Another transaction for analytics', status: 'pending' }
      ];

      for (const transaction of transactions) {
        await request(app)
          .post('/v1/sepa/transactions')
          .set(baseHeaders)
          .send(transaction);
      }
    });

    it('should return SEPA analytics', async () => {
      const response = await request(app)
        .get('/v1/sepa/analytics')
        .set(baseHeaders)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.summary).toBeDefined();
      expect(response.body.data.trends).toBeDefined();
      expect(response.body.data.performance).toBeDefined();
      expect(response.body.data.recommendations).toBeDefined();

      expect(response.body.data.trends.matchingRate).toBeDefined();
      expect(response.body.data.trends.reconciliationRate).toBeDefined();
      expect(response.body.data.trends.averageProcessingTime).toBeDefined();
      expect(response.body.data.trends.errorRate).toBeDefined();

      expect(response.body.data.performance.totalTransactions).toBeDefined();
      expect(response.body.data.performance.matchedTransactions).toBeDefined();
      expect(response.body.data.performance.reconciledTransactions).toBeDefined();
      expect(response.body.data.performance.disputedTransactions).toBeDefined();
      expect(response.body.data.performance.matchingAccuracy).toBeDefined();
      expect(response.body.data.performance.processingEfficiency).toBeDefined();
    });
  });

  describe('GET /v1/sepa/rules', () => {
    it('should return matching rules', async () => {
      const response = await request(app)
        .get('/v1/sepa/rules')
        .set(baseHeaders)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('POST /v1/sepa/rules', () => {
    it('should create matching rule successfully', async () => {
      const ruleData = {
        name: 'Test Matching Rule',
        description: 'Test rule for matching transactions',
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

      const response = await request(app)
        .post('/v1/sepa/rules')
        .set(baseHeaders)
        .send(ruleData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.name).toBe(ruleData.name);
      expect(response.body.data.description).toBe(ruleData.description);
      expect(response.body.data.priority).toBe(ruleData.priority);
      expect(response.body.data.conditions).toEqual(ruleData.conditions);
      expect(response.body.data.actions).toEqual(ruleData.actions);
      expect(response.body.data.enabled).toBe(ruleData.enabled);
    });

    it('should return validation error for invalid rule data', async () => {
      const invalidData = {
        name: '', // Empty name should fail
        priority: 'invalid-priority', // Invalid priority should fail
        conditions: 'invalid-conditions' // Invalid conditions should fail
      };

      const response = await request(app)
        .post('/v1/sepa/rules')
        .set(baseHeaders)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation error');
    });
  });

  describe('POST /v1/sepa/upload', () => {
    it('should handle SEPA file upload', async () => {
      const uploadData = {
        fileName: 'test_sepa_file.xml',
        fileContent: 'mock file content'
      };

      const response = await request(app)
        .post('/v1/sepa/upload')
        .set(baseHeaders)
        .send(uploadData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.fileId).toBeDefined();
      expect(response.body.data.fileName).toBe(uploadData.fileName);
      expect(response.body.data.transactionsCount).toBeDefined();
      expect(response.body.data.processedCount).toBeDefined();
      expect(response.body.data.errorsCount).toBeDefined();
      expect(response.body.data.status).toBeDefined();
      expect(response.body.data.errors).toBeDefined();
      expect(response.body.data.createdAt).toBeDefined();
    });
  });

  describe('Headers and Middleware', () => {
    it('should include FinOps headers in responses', async () => {
      const response = await request(app)
        .get('/v1/sepa/transactions')
        .set(baseHeaders)
        .expect(200);

      expect(response.headers['x-est-cost-eur']).toBeDefined();
      expect(response.headers['x-budget-pct']).toBeDefined();
      expect(response.headers['x-latency-ms']).toBeDefined();
      expect(response.headers['x-route']).toBeDefined();
      expect(response.headers['x-correlation-id']).toBeDefined();
    });

    it('should work without organization headers (using defaults)', async () => {
      const response = await request(app)
        .get('/v1/sepa/transactions')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle server errors gracefully', async () => {
      // This test would require mocking the service to throw an error
      // For now, we'll test that the error structure is consistent
      const response = await request(app)
        .get('/v1/sepa/transactions/non-existent-id')
        .set(baseHeaders)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });
});

