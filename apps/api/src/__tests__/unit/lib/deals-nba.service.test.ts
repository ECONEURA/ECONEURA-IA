import { describe, it, expect, beforeEach } from 'vitest';
import { DealsNBAService, type Deal, type NBARecommendation } from '../../../lib/deals-nba.service.js';

describe('DealsNBAService', () => {
  let service: DealsNBAService;
  let mockDeal: Deal;

  beforeEach(() => {
    service = new DealsNBAService();
    mockDeal = {
      id: 'deal-123',
      title: 'Test Deal',
      value: 100000,
      currency: 'EUR',
      stage: 'proposal',
      probability: 75,
      closeDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      ownerId: 'user-123',
      organizationId: 'org-123',
      companyId: 'company-123',
      contactId: 'contact-123',
      source: 'website',
      type: 'new',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: { priority: 'high' }
    };
  });

  describe('generateRecommendations', () => {
    it('should generate recommendations for a deal', async () => {
      const recommendations = await service.generateRecommendations(mockDeal);
      
      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);
    });

    it('should generate recommendations with proper structure', async () => {
      const recommendations = await service.generateRecommendations(mockDeal);
      
      if (recommendations.length > 0) {
        const rec = recommendations[0];
        expect(rec).toHaveProperty('id');
        expect(rec).toHaveProperty('dealId');
        expect(rec).toHaveProperty('action');
        expect(rec).toHaveProperty('actionType');
        expect(rec).toHaveProperty('priority');
        expect(rec).toHaveProperty('confidence');
        expect(rec).toHaveProperty('explanation');
        expect(rec).toHaveProperty('context');
      }
    });

    it('should generate recommendations with confidence above threshold', async () => {
      const recommendations = await service.generateRecommendations(mockDeal);
      
      recommendations.forEach(rec => {
        expect(rec.confidence).toBeGreaterThanOrEqual(0.7);
      });
    });

    it('should limit recommendations to max count', async () => {
      const recommendations = await service.generateRecommendations(mockDeal);
      
      expect(recommendations.length).toBeLessThanOrEqual(5);
    });
  });

  describe('getRecommendations', () => {
    it('should return empty array for non-existent deal', () => {
      const recommendations = service.getRecommendations('non-existent');
      expect(recommendations).toEqual([]);
    });

    it('should return stored recommendations', async () => {
      await service.generateRecommendations(mockDeal);
      const recommendations = service.getRecommendations(mockDeal.id);
      
      expect(Array.isArray(recommendations)).toBe(true);
    });
  });

  describe('executeRecommendation', () => {
    it('should execute recommendation successfully', async () => {
      const recommendationId = 'rec-123';
      const executedBy = 'user-123';
      
      await expect(service.executeRecommendation(recommendationId, executedBy))
        .resolves.not.toThrow();
    });
  });

  describe('getStats', () => {
    it('should return stats object', () => {
      const stats = service.getStats();
      
      expect(stats).toHaveProperty('totalDeals');
      expect(stats).toHaveProperty('recommendationsGenerated');
      expect(stats).toHaveProperty('recommendationsExecuted');
      expect(stats).toHaveProperty('successRate');
      expect(stats).toHaveProperty('averageConfidence');
      expect(stats).toHaveProperty('topActions');
      expect(stats).toHaveProperty('topFactors');
      expect(stats).toHaveProperty('lastRun');
    });
  });

  describe('updateConfig', () => {
    it('should update configuration', () => {
      const newConfig = {
        confidenceThreshold: 0.8,
        maxRecommendations: 3
      };
      
      expect(() => service.updateConfig(newConfig)).not.toThrow();
    });
  });

  describe('processNBARecommendations', () => {
    it('should process recommendations successfully', async () => {
      const stats = await service.processNBARecommendations();
      
      expect(stats).toBeDefined();
      expect(stats).toHaveProperty('totalDeals');
      expect(stats).toHaveProperty('recommendationsGenerated');
      expect(stats).toHaveProperty('lastRun');
    });
  });

  describe('stop', () => {
    it('should stop service without errors', () => {
      expect(() => service.stop()).not.toThrow();
    });
  });
});
