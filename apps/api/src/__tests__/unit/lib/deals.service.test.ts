// Unit tests for DealsService - PR-9: Deals Management

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DealsService, CreateDealSchema, UpdateDealSchema, DealFilterSchema, MoveDealStageSchema } from '../../../lib/deals.service.js';

describe('DealsService', () => {
  let service: DealsService;
  const orgId = 'test-org-1';
  const userId = 'test-user-1';

  beforeEach(() => {
    service = new DealsService();
  });

  describe('createDeal', () => {
    it('should create a new deal successfully', async () => {
      const dealData = {
        name: 'Test Deal',
        description: 'This is a test deal',
        amount: 10000,
        currency: 'EUR',
        stage: 'lead' as const,
        status: 'active' as const,
        probability: 25,
        companyId: 'company-1',
        contactId: 'contact-1',
        assignedTo: 'user-1',
        tags: ['test', 'deal']
      };

      const result = await service.createDeal(orgId, userId, dealData);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.orgId).toBe(orgId);
      expect(result.name).toBe(dealData.name);
      expect(result.description).toBe(dealData.description);
      expect(result.amount).toBe(dealData.amount);
      expect(result.currency).toBe(dealData.currency);
      expect(result.stage).toBe(dealData.stage);
      expect(result.status).toBe(dealData.status);
      expect(result.probability).toBe(dealData.probability);
      expect(result.companyId).toBe(dealData.companyId);
      expect(result.contactId).toBe(dealData.contactId);
      expect(result.assignedTo).toBe(dealData.assignedTo);
      expect(result.tags).toEqual(dealData.tags);
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });

    it('should validate deal data', async () => {
      const invalidData = {
        name: '', // Empty name should fail
        amount: -1000, // Negative amount should fail
        stage: 'invalid-stage' as any,
      };

      await expect(service.createDeal(orgId, userId, invalidData))
        .rejects.toThrow();
    });

    it('should set default values for optional fields', async () => {
      const minimalData = {
        name: 'Minimal Deal',
        amount: 5000
      };

      const result = await service.createDeal(orgId, userId, minimalData);

      expect(result.currency).toBe('EUR');
      expect(result.stage).toBe('lead');
      expect(result.status).toBe('active');
      expect(result.probability).toBe(0);
      expect(result.tags).toEqual([]);
    });
  });

  describe('getDeals', () => {
    beforeEach(async () => {
      // Create some test deals
      await service.createDeal(orgId, userId, {
        name: 'Deal 1',
        amount: 10000,
        stage: 'lead',
        companyId: 'company-1'
      });

      await service.createDeal(orgId, userId, {
        name: 'Deal 2',
        amount: 20000,
        stage: 'qualified',
        companyId: 'company-2'
      });

      await service.createDeal(orgId, userId, {
        name: 'Deal 3',
        amount: 30000,
        stage: 'closed_won',
        status: 'active'
      });
    });

    it('should return all deals for an organization', async () => {
      const result = await service.getDeals(orgId, {});

      expect(result.deals).toBeDefined();
      expect(result.total).toBeGreaterThan(0);
      expect(result.deals.length).toBeGreaterThan(0);
    });

    it('should filter deals by stage', async () => {
      const result = await service.getDeals(orgId, { stage: 'lead' });

      expect(result.deals.every(deal => deal.stage === 'lead')).toBe(true);
    });

    it('should filter deals by status', async () => {
      const result = await service.getDeals(orgId, { status: 'active' });

      expect(result.deals.every(deal => deal.status === 'active')).toBe(true);
    });

    it('should filter deals by company_id', async () => {
      const result = await service.getDeals(orgId, { companyId: 'company-1' });

      expect(result.deals.every(deal => deal.companyId === 'company-1')).toBe(true);
    });

    it('should filter deals by amount range', async () => {
      const result = await service.getDeals(orgId, { minAmount: 15000, maxAmount: 25000 });

      expect(result.deals.every(deal => deal.amount >= 15000 && deal.amount <= 25000)).toBe(true);
    });

    it('should filter deals by search query', async () => {
      const result = await service.getDeals(orgId, { q: 'Deal 1' });

      expect(result.deals.every(deal => deal.name.includes('Deal 1'))).toBe(true);
    });

    it('should respect limit and offset', async () => {
      const result = await service.getDeals(orgId, { limit: 1, offset: 0 });

      expect(result.deals.length).toBeLessThanOrEqual(1);
    });

    it('should return empty result for non-existent organization', async () => {
      const result = await service.getDeals('non-existent-org', {});

      expect(result.deals).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('getDealById', () => {
    let dealId: string;

    beforeEach(async () => {
      const deal = await service.createDeal(orgId, userId, {
        name: 'Test Deal for get by ID',
        amount: 15000
      });
      dealId = deal.id;
    });

    it('should return deal by ID', async () => {
      const result = await service.getDealById(orgId, dealId);

      expect(result).toBeDefined();
      expect(result!.id).toBe(dealId);
      expect(result!.orgId).toBe(orgId);
    });

    it('should return null for non-existent deal', async () => {
      const result = await service.getDealById(orgId, 'non-existent-id');

      expect(result).toBeNull();
    });

    it('should return null for deal from different organization', async () => {
      const result = await service.getDealById('different-org', dealId);

      expect(result).toBeNull();
    });
  });

  describe('updateDeal', () => {
    let dealId: string;

    beforeEach(async () => {
      const deal = await service.createDeal(orgId, userId, {
        name: 'Original Deal',
        amount: 10000,
        stage: 'lead'
      });
      dealId = deal.id;
    });

    it('should update deal successfully', async () => {
      const updateData = {
        name: 'Updated Deal',
        amount: 15000,
        stage: 'qualified' as const,
        probability: 50
      };

      const result = await service.updateDeal(orgId, dealId, userId, updateData);

      expect(result).toBeDefined();
      expect(result!.name).toBe(updateData.name);
      expect(result!.amount).toBe(updateData.amount);
      expect(result!.stage).toBe(updateData.stage);
      expect(result!.probability).toBe(updateData.probability);
      expect(result!.updatedAt).toBeDefined();
    });

    it('should return null for non-existent deal', async () => {
      const result = await service.updateDeal(orgId, 'non-existent-id', userId, {
        name: 'Updated Deal'
      });

      expect(result).toBeNull();
    });

    it('should return null for deal from different organization', async () => {
      const result = await service.updateDeal('different-org', dealId, userId, {
        name: 'Updated Deal'
      });

      expect(result).toBeNull();
    });
  });

  describe('moveDealStage', () => {
    let dealId: string;

    beforeEach(async () => {
      const deal = await service.createDeal(orgId, userId, {
        name: 'Deal for stage move',
        amount: 20000,
        stage: 'lead'
      });
      dealId = deal.id;
    });

    it('should move deal stage successfully', async () => {
      const moveData = {
        stage: 'qualified' as const,
        reason: 'Qualified by sales team',
        notes: 'Customer showed strong interest'
      };

      const result = await service.moveDealStage(orgId, dealId, userId, moveData);

      expect(result).toBeDefined();
      expect(result!.stage).toBe(moveData.stage);
      expect(result!.updatedAt).toBeDefined();
    });

    it('should update probability based on stage', async () => {
      const moveData = { stage: 'negotiation' as const };

      const result = await service.moveDealStage(orgId, dealId, userId, moveData);

      expect(result!.probability).toBe(75); // negotiation stage probability
    });

    it('should return null for non-existent deal', async () => {
      const result = await service.moveDealStage(orgId, 'non-existent-id', userId, {
        stage: 'qualified'
      });

      expect(result).toBeNull();
    });
  });

  describe('deleteDeal', () => {
    let dealId: string;

    beforeEach(async () => {
      const deal = await service.createDeal(orgId, userId, {
        name: 'Deal to be deleted',
        amount: 5000
      });
      dealId = deal.id;
    });

    it('should delete deal successfully', async () => {
      const result = await service.deleteDeal(orgId, dealId, userId);

      expect(result).toBe(true);

      // Verify deal is deleted
      const deletedDeal = await service.getDealById(orgId, dealId);
      expect(deletedDeal).toBeNull();
    });

    it('should return false for non-existent deal', async () => {
      const result = await service.deleteDeal(orgId, 'non-existent-id', userId);

      expect(result).toBe(false);
    });

    it('should return false for deal from different organization', async () => {
      const result = await service.deleteDeal('different-org', dealId, userId);

      expect(result).toBe(false);
    });
  });

  describe('getDealSummary', () => {
    beforeEach(async () => {
      // Create test deals with different stages and statuses
      await service.createDeal(orgId, userId, {
        name: 'Deal 1',
        amount: 10000,
        stage: 'lead',
        status: 'active'
      });

      await service.createDeal(orgId, userId, {
        name: 'Deal 2',
        amount: 20000,
        stage: 'qualified',
        status: 'active'
      });

      await service.createDeal(orgId, userId, {
        name: 'Deal 3',
        amount: 30000,
        stage: 'closed_won',
        status: 'active'
      });

      await service.createDeal(orgId, userId, {
        name: 'Deal 4',
        amount: 15000,
        stage: 'closed_lost',
        status: 'active'
      });
    });

    it('should return comprehensive summary', async () => {
      const summary = await service.getDealSummary(orgId);

      expect(summary).toBeDefined();
      expect(summary.total).toBeGreaterThan(0);
      expect(summary.totalValue).toBeGreaterThan(0);
      expect(summary.averageDealSize).toBeGreaterThan(0);
      expect(summary.winRate).toBeGreaterThanOrEqual(0);
      expect(summary.averageSalesCycle).toBeGreaterThanOrEqual(0);
      expect(summary.dealsByStage).toBeDefined();
      expect(summary.dealsByStatus).toBeDefined();
      expect(summary.dealsByMonth).toBeDefined();
      expect(summary.topPerformers).toBeDefined();
      expect(summary.pipelineHealth).toBeDefined();
    });

    it('should calculate correct win rate', async () => {
      const summary = await service.getDealSummary(orgId);

      // With 1 closed_won and 1 closed_lost, win rate should be 50%
      expect(summary.winRate).toBe(50);
    });

    it('should calculate correct total value', async () => {
      const summary = await service.getDealSummary(orgId);

      // Total should be sum of all deal amounts
      expect(summary.totalValue).toBe(75000); // 10000 + 20000 + 30000 + 15000
    });

    it('should return empty summary for non-existent organization', async () => {
      const summary = await service.getDealSummary('non-existent-org');

      expect(summary.total).toBe(0);
      expect(summary.totalValue).toBe(0);
      expect(summary.winRate).toBe(0);
    });
  });

  describe('getDealAnalytics', () => {
    beforeEach(async () => {
      // Create test deals for analytics
      await service.createDeal(orgId, userId, {
        name: 'Deal for analytics',
        amount: 25000,
        stage: 'closed_won'
      });

      await service.createDeal(orgId, userId, {
        name: 'Another deal for analytics',
        amount: 15000,
        stage: 'lead'
      });
    });

    it('should return comprehensive analytics', async () => {
      const analytics = await service.getDealAnalytics(orgId);

      expect(analytics).toBeDefined();
      expect(analytics.totalDeals).toBeDefined();
      expect(analytics.openDeals).toBeDefined();
      expect(analytics.closedWon).toBeDefined();
      expect(analytics.closedLost).toBeDefined();
      expect(analytics.totalValue).toBeDefined();
      expect(analytics.averageDealSize).toBeDefined();
      expect(analytics.winRate).toBeDefined();
      expect(analytics.averageSalesCycle).toBeDefined();
      expect(analytics.dealsByStage).toBeDefined();
      expect(analytics.dealsByStatus).toBeDefined();
      expect(analytics.dealsByMonth).toBeDefined();
      expect(analytics.topPerformers).toBeDefined();
      expect(analytics.recentActivity).toBeDefined();
      expect(analytics.pipelineHealth).toBeDefined();
    });
  });

  describe('bulkUpdateDeals', () => {
    let dealIds: string[];

    beforeEach(async () => {
      // Create test deals for bulk update
      const deal1 = await service.createDeal(orgId, userId, {
        name: 'Deal 1 for bulk update',
        amount: 10000
      });

      const deal2 = await service.createDeal(orgId, userId, {
        name: 'Deal 2 for bulk update',
        amount: 20000
      });

      dealIds = [deal1.id, deal2.id];
    });

    it('should update multiple deals successfully', async () => {
      const updates = [
        {
          id: dealIds[0],
          data: { stage: 'qualified' as const, probability: 50 }
        },
        {
          id: dealIds[1],
          data: { stage: 'proposal' as const, probability: 75 }
        }
      ];

      const result = await service.bulkUpdateDeals(orgId, userId, updates);

      expect(result.updated).toBe(2);
      expect(result.failed).toBe(0);
      expect(result.errors).toEqual([]);
    });

    it('should handle partial failures', async () => {
      const updates = [
        {
          id: dealIds[0],
          data: { stage: 'qualified' as const }
        },
        {
          id: 'non-existent-id',
          data: { stage: 'qualified' as const }
        }
      ];

      const result = await service.bulkUpdateDeals(orgId, userId, updates);

      expect(result.updated).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.errors.length).toBe(1);
    });

    it('should handle empty updates array', async () => {
      const result = await service.bulkUpdateDeals(orgId, userId, []);

      expect(result.updated).toBe(0);
      expect(result.failed).toBe(0);
      expect(result.errors).toEqual([]);
    });
  });

  describe('getStats', () => {
    it('should return service statistics', () => {
      const stats = service.getStats();

      expect(stats).toBeDefined();
      expect(stats.totalDeals).toBeDefined();
      expect(stats.byStage).toBeDefined();
      expect(stats.byStatus).toBeDefined();
      expect(stats.byOrg).toBeDefined();
    });
  });

  describe('Schema Validation', () => {
    describe('CreateDealSchema', () => {
      it('should validate valid deal data', () => {
        const validData = {
          name: 'Valid Deal',
          amount: 10000,
          stage: 'lead',
          status: 'active'
        };

        expect(() => CreateDealSchema.parse(validData)).not.toThrow();
      });

      it('should reject invalid deal data', () => {
        const invalidData = {
          name: '',
          amount: -1000,
          stage: 'invalid-stage'
        };

        expect(() => CreateDealSchema.parse(invalidData)).toThrow();
      });
    });

    describe('UpdateDealSchema', () => {
      it('should validate partial update data', () => {
        const validData = {
          name: 'Updated Deal',
          amount: 15000
        };

        expect(() => UpdateDealSchema.parse(validData)).not.toThrow();
      });

      it('should allow empty object for partial updates', () => {
        expect(() => UpdateDealSchema.parse({})).not.toThrow();
      });
    });

    describe('DealFilterSchema', () => {
      it('should validate filter parameters', () => {
        const validFilters = {
          stage: 'lead',
          status: 'active',
          minAmount: 1000,
          maxAmount: 50000
        };

        expect(() => DealFilterSchema.parse(validFilters)).not.toThrow();
      });
    });

    describe('MoveDealStageSchema', () => {
      it('should validate stage move data', () => {
        const validData = {
          stage: 'qualified',
          reason: 'Customer qualified',
          notes: 'Strong interest shown'
        };

        expect(() => MoveDealStageSchema.parse(validData)).not.toThrow();
      });

      it('should allow minimal stage move data', () => {
        const minimalData = {
          stage: 'qualified'
        };

        expect(() => MoveDealStageSchema.parse(minimalData)).not.toThrow();
      });
    });
  });
});

