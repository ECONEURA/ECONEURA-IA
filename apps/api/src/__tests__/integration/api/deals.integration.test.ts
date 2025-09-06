// Integration tests for Deals API - PR-9: Deals Management

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '../../../index.js';

describe('Deals API Integration Tests', () => {
  const baseHeaders = {
    'x-org-id': 'test-org-1',
    'x-user-id': 'test-user-1',
    'Content-Type': 'application/json'
  };

  let createdDealId: string;

  describe('POST /v1/deals', () => {
    it('should create a new deal successfully', async () => {
      const dealData = {
        name: 'Test Deal',
        description: 'This is a test deal for integration testing',
        amount: 25000,
        currency: 'EUR',
        stage: 'lead',
        status: 'active',
        probability: 25,
        companyId: 'company-1',
        contactId: 'contact-1',
        assignedTo: 'user-1',
        tags: ['test', 'integration']
      };

      const response = await request(app)
        .post('/v1/deals')
        .set(baseHeaders)
        .send(dealData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.name).toBe(dealData.name);
      expect(response.body.data.description).toBe(dealData.description);
      expect(response.body.data.amount).toBe(dealData.amount);
      expect(response.body.data.currency).toBe(dealData.currency);
      expect(response.body.data.stage).toBe(dealData.stage);
      expect(response.body.data.status).toBe(dealData.status);
      expect(response.body.data.probability).toBe(dealData.probability);
      expect(response.body.data.companyId).toBe(dealData.companyId);
      expect(response.body.data.contactId).toBe(dealData.contactId);
      expect(response.body.data.assignedTo).toBe(dealData.assignedTo);
      expect(response.body.data.tags).toEqual(dealData.tags);
      expect(response.body.data.createdAt).toBeDefined();
      expect(response.body.data.updatedAt).toBeDefined();

      // Store for other tests
      createdDealId = response.body.data.id;
    });

    it('should create deal with minimal required data', async () => {
      const minimalData = {
        name: 'Minimal Deal',
        amount: 10000
      };

      const response = await request(app)
        .post('/v1/deals')
        .set(baseHeaders)
        .send(minimalData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(minimalData.name);
      expect(response.body.data.amount).toBe(minimalData.amount);
      expect(response.body.data.currency).toBe('EUR'); // Default value
      expect(response.body.data.stage).toBe('lead'); // Default value
      expect(response.body.data.status).toBe('active'); // Default value
    });

    it('should return validation error for invalid data', async () => {
      const invalidData = {
        name: '', // Empty name should fail
        amount: -1000, // Negative amount should fail
        stage: 'invalid-stage'
      };

      const response = await request(app)
        .post('/v1/deals')
        .set(baseHeaders)
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Validation error');
      expect(response.body.details).toBeDefined();
    });

    it('should return error for missing required fields', async () => {
      const incompleteData = {
        amount: 10000
        // Missing required 'name' field
      };

      const response = await request(app)
        .post('/v1/deals')
        .set(baseHeaders)
        .send(incompleteData)
        .expect(400);

      expect(response.body.error).toBe('Validation error');
    });
  });

  describe('GET /v1/deals', () => {
    beforeEach(async () => {
      // Create test deals
      const deals = [
        {
          name: 'Test Deal 1',
          amount: 10000,
          stage: 'lead',
          companyId: 'company-1'
        },
        {
          name: 'Test Deal 2',
          amount: 20000,
          stage: 'qualified',
          companyId: 'company-2'
        },
        {
          name: 'Test Deal 3',
          amount: 30000,
          stage: 'closed_won',
          status: 'active'
        }
      ];

      for (const deal of deals) {
        await request(app)
          .post('/v1/deals')
          .set(baseHeaders)
          .send(deal);
      }
    });

    it('should return all deals', async () => {
      const response = await request(app)
        .get('/v1/deals')
        .set(baseHeaders)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.total).toBeGreaterThan(0);
    });

    it('should filter deals by stage', async () => {
      const response = await request(app)
        .get('/v1/deals?stage=lead')
        .set(baseHeaders)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.every((deal: any) => deal.stage === 'lead')).toBe(true);
    });

    it('should filter deals by status', async () => {
      const response = await request(app)
        .get('/v1/deals?status=active')
        .set(baseHeaders)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.every((deal: any) => deal.status === 'active')).toBe(true);
    });

    it('should filter deals by company_id', async () => {
      const response = await request(app)
        .get('/v1/deals?companyId=company-1')
        .set(baseHeaders)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.every((deal: any) => deal.companyId === 'company-1')).toBe(true);
    });

    it('should filter deals by amount range', async () => {
      const response = await request(app)
        .get('/v1/deals?minAmount=15000&maxAmount=25000')
        .set(baseHeaders)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.every((deal: any) => 
        deal.amount >= 15000 && deal.amount <= 25000
      )).toBe(true);
    });

    it('should filter deals by search query', async () => {
      const response = await request(app)
        .get('/v1/deals?q=Test Deal 1')
        .set(baseHeaders)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.every((deal: any) => 
        deal.name.includes('Test Deal 1')
      )).toBe(true);
    });

    it('should respect pagination parameters', async () => {
      const response = await request(app)
        .get('/v1/deals?page=1&limit=2')
        .set(baseHeaders)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(2);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(2);
    });

    it('should return validation error for invalid filter parameters', async () => {
      const response = await request(app)
        .get('/v1/deals?stage=invalid-stage&minAmount=invalid-amount')
        .set(baseHeaders)
        .expect(400);

      expect(response.body.error).toBe('Validation error');
    });
  });

  describe('GET /v1/deals/:id', () => {
    it('should return deal by ID', async () => {
      // First create a deal
      const createResponse = await request(app)
        .post('/v1/deals')
        .set(baseHeaders)
        .send({
          name: 'Test Deal for get by ID',
          amount: 15000
        });

      const dealId = createResponse.body.data.id;

      const response = await request(app)
        .get(`/v1/deals/${dealId}`)
        .set(baseHeaders)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(dealId);
    });

    it('should return 404 for non-existent deal', async () => {
      const response = await request(app)
        .get('/v1/deals/non-existent-id')
        .set(baseHeaders)
        .expect(404);

      expect(response.body.error).toBe('Deal not found');
    });
  });

  describe('PUT /v1/deals/:id', () => {
    it('should update deal successfully', async () => {
      // First create a deal
      const createResponse = await request(app)
        .post('/v1/deals')
        .set(baseHeaders)
        .send({
          name: 'Original Deal',
          amount: 10000,
          stage: 'lead'
        });

      const dealId = createResponse.body.data.id;

      const updateData = {
        name: 'Updated Deal',
        amount: 15000,
        stage: 'qualified',
        probability: 50
      };

      const response = await request(app)
        .put(`/v1/deals/${dealId}`)
        .set(baseHeaders)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.amount).toBe(updateData.amount);
      expect(response.body.data.stage).toBe(updateData.stage);
      expect(response.body.data.probability).toBe(updateData.probability);
      expect(response.body.data.updatedAt).toBeDefined();
    });

    it('should return 404 for non-existent deal', async () => {
      const response = await request(app)
        .put('/v1/deals/non-existent-id')
        .set(baseHeaders)
        .send({ name: 'Updated Deal' })
        .expect(404);

      expect(response.body.error).toBe('Deal not found');
    });

    it('should return validation error for invalid update data', async () => {
      const response = await request(app)
        .put(`/v1/deals/${createdDealId}`)
        .set(baseHeaders)
        .send({ stage: 'invalid-stage' })
        .expect(400);

      expect(response.body.error).toBe('Validation error');
    });
  });

  describe('POST /v1/deals/:id/move-stage', () => {
    it('should move deal stage successfully', async () => {
      // First create a deal
      const createResponse = await request(app)
        .post('/v1/deals')
        .set(baseHeaders)
        .send({
          name: 'Deal for stage move',
          amount: 20000,
          stage: 'lead'
        });

      const dealId = createResponse.body.data.id;

      const moveData = {
        stage: 'qualified',
        reason: 'Qualified by sales team',
        notes: 'Customer showed strong interest'
      };

      const response = await request(app)
        .post(`/v1/deals/${dealId}/move-stage`)
        .set(baseHeaders)
        .send(moveData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.stage).toBe(moveData.stage);
      expect(response.body.data.updatedAt).toBeDefined();
    });

    it('should return 404 for non-existent deal', async () => {
      const response = await request(app)
        .post('/v1/deals/non-existent-id/move-stage')
        .set(baseHeaders)
        .send({ stage: 'qualified' })
        .expect(404);

      expect(response.body.error).toBe('Deal not found');
    });

    it('should return validation error for invalid stage', async () => {
      const response = await request(app)
        .post(`/v1/deals/${createdDealId}/move-stage`)
        .set(baseHeaders)
        .send({ stage: 'invalid-stage' })
        .expect(400);

      expect(response.body.error).toBe('Validation error');
    });
  });

  describe('DELETE /v1/deals/:id', () => {
    it('should delete deal successfully', async () => {
      // First create a deal
      const createResponse = await request(app)
        .post('/v1/deals')
        .set(baseHeaders)
        .send({
          name: 'Deal to be deleted',
          amount: 5000
        });

      const dealId = createResponse.body.data.id;

      const response = await request(app)
        .delete(`/v1/deals/${dealId}`)
        .set(baseHeaders)
        .expect(204);

      // Verify deal is deleted
      await request(app)
        .get(`/v1/deals/${dealId}`)
        .set(baseHeaders)
        .expect(404);
    });

    it('should return 404 for non-existent deal', async () => {
      const response = await request(app)
        .delete('/v1/deals/non-existent-id')
        .set(baseHeaders)
        .expect(404);

      expect(response.body.error).toBe('Deal not found');
    });
  });

  describe('GET /v1/deals/summary', () => {
    beforeEach(async () => {
      // Create test deals for summary
      const deals = [
        { name: 'Deal 1', amount: 10000, stage: 'lead', status: 'active' },
        { name: 'Deal 2', amount: 20000, stage: 'qualified', status: 'active' },
        { name: 'Deal 3', amount: 30000, stage: 'closed_won', status: 'active' },
        { name: 'Deal 4', amount: 15000, stage: 'closed_lost', status: 'active' }
      ];

      for (const deal of deals) {
        await request(app)
          .post('/v1/deals')
          .set(baseHeaders)
          .send(deal);
      }
    });

    it('should return deal summary', async () => {
      const response = await request(app)
        .get('/v1/deals/summary')
        .set(baseHeaders)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.total).toBeDefined();
      expect(response.body.data.totalValue).toBeDefined();
      expect(response.body.data.averageDealSize).toBeDefined();
      expect(response.body.data.winRate).toBeDefined();
      expect(response.body.data.dealsByStage).toBeDefined();
      expect(response.body.data.dealsByStatus).toBeDefined();
      expect(response.body.data.closedWon).toBeDefined();
      expect(response.body.data.closedLost).toBeDefined();
      expect(response.body.data.openDeals).toBeDefined();
    });
  });

  describe('GET /v1/deals/analytics', () => {
    beforeEach(async () => {
      // Create test deals for analytics
      const deals = [
        { name: 'Deal for analytics 1', amount: 25000, stage: 'closed_won' },
        { name: 'Deal for analytics 2', amount: 15000, stage: 'lead' }
      ];

      for (const deal of deals) {
        await request(app)
          .post('/v1/deals')
          .set(baseHeaders)
          .send(deal);
      }
    });

    it('should return deal analytics', async () => {
      const response = await request(app)
        .get('/v1/deals/analytics')
        .set(baseHeaders)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.totalDeals).toBeDefined();
      expect(response.body.data.totalValue).toBeDefined();
      expect(response.body.data.averageDealSize).toBeDefined();
      expect(response.body.data.winRate).toBeDefined();
      expect(response.body.data.dealsByMonth).toBeDefined();
      expect(response.body.data.topPerformers).toBeDefined();
      expect(response.body.data.pipelineHealth).toBeDefined();
    });
  });

  describe('POST /v1/deals/bulk-update', () => {
    let dealIds: string[];

    beforeEach(async () => {
      // Create test deals for bulk update
      const deals = [
        { name: 'Deal 1 for bulk update', amount: 10000 },
        { name: 'Deal 2 for bulk update', amount: 20000 }
      ];

      dealIds = [];
      for (const deal of deals) {
        const response = await request(app)
          .post('/v1/deals')
          .set(baseHeaders)
          .send(deal);
        dealIds.push(response.body.data.id);
      }
    });

    it('should update multiple deals successfully', async () => {
      const updates = [
        {
          id: dealIds[0],
          data: { stage: 'qualified', probability: 50 }
        },
        {
          id: dealIds[1],
          data: { stage: 'proposal', probability: 75 }
        }
      ];

      const response = await request(app)
        .post('/v1/deals/bulk-update')
        .set(baseHeaders)
        .send({ updates })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.updated).toBe(2);
      expect(response.body.data.failed).toBe(0);
      expect(response.body.data.errors).toEqual([]);
    });

    it('should handle partial failures', async () => {
      const updates = [
        {
          id: dealIds[0],
          data: { stage: 'qualified' }
        },
        {
          id: 'non-existent-id',
          data: { stage: 'qualified' }
        }
      ];

      const response = await request(app)
        .post('/v1/deals/bulk-update')
        .set(baseHeaders)
        .send({ updates })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.updated).toBe(1);
      expect(response.body.data.failed).toBe(1);
      expect(response.body.data.errors.length).toBe(1);
    });

    it('should return error for empty updates array', async () => {
      const response = await request(app)
        .post('/v1/deals/bulk-update')
        .set(baseHeaders)
        .send({ updates: [] })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Updates array is required and must not be empty');
    });

    it('should return error for missing updates array', async () => {
      const response = await request(app)
        .post('/v1/deals/bulk-update')
        .set(baseHeaders)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Updates array is required and must not be empty');
    });
  });

  describe('Headers and Middleware', () => {
    it('should include FinOps headers in responses', async () => {
      const response = await request(app)
        .get('/v1/deals')
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
        .get('/v1/deals')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle server errors gracefully', async () => {
      // This test would require mocking the database to throw an error
      // For now, we'll test that the error structure is consistent
      const response = await request(app)
        .get('/v1/deals/non-existent-id')
        .set(baseHeaders)
        .expect(404);

      expect(response.body.error).toBeDefined();
    });
  });
});

