// Unit tests for InteractionsService - PR-8: CRM Interactions

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InteractionsService, CreateInteractionSchema, UpdateInteractionSchema, InteractionFiltersSchema } from '../../../lib/interactions.service.js';

describe('InteractionsService', () => {
  let service: InteractionsService;
  const orgId = 'test-org-1';
  const userId = 'test-user-1';

  beforeEach(() => {
    service = new InteractionsService();
  });

  describe('createInteraction', () => {
    it('should create a new interaction successfully', async () => {
      const interactionData = {
        type: 'email' as const,
        subject: 'Test Email',
        content: 'This is a test email interaction',
        status: 'pending' as const,
        priority: 'medium' as const,
        company_id: 'company-1',
        contact_id: 'contact-1',
        deal_id: 'deal-1',
        metadata: { test: true }
      };

      const result = await service.createInteraction(orgId, userId, interactionData);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.org_id).toBe(orgId);
      expect(result.type).toBe(interactionData.type);
      expect(result.subject).toBe(interactionData.subject);
      expect(result.content).toBe(interactionData.content);
      expect(result.status).toBe(interactionData.status);
      expect(result.priority).toBe(interactionData.priority);
      expect(result.company_id).toBe(interactionData.company_id);
      expect(result.contact_id).toBe(interactionData.contact_id);
      expect(result.deal_id).toBe(interactionData.deal_id);
      expect(result.created_by).toBe(userId);
      expect(result.created_at).toBeDefined();
      expect(result.updated_at).toBeDefined();
    });

    it('should validate interaction data', async () => {
      const invalidData = {
        type: 'invalid-type' as any,
        content: '', // Empty content should fail
      };

      await expect(service.createInteraction(orgId, userId, invalidData))
        .rejects.toThrow();
    });

    it('should set default values for optional fields', async () => {
      const minimalData = {
        type: 'note' as const,
        content: 'Minimal interaction data'
      };

      const result = await service.createInteraction(orgId, userId, minimalData);

      expect(result.status).toBe('pending');
      expect(result.priority).toBe('medium');
      expect(result.created_by).toBe(userId);
    });
  });

  describe('getInteractions', () => {
    beforeEach(async () => {
      // Create some test interactions
      await service.createInteraction(orgId, userId, {
        type: 'email',
        content: 'Test email 1',
        company_id: 'company-1'
      });

      await service.createInteraction(orgId, userId, {
        type: 'call',
        content: 'Test call 1',
        company_id: 'company-2'
      });

      await service.createInteraction(orgId, userId, {
        type: 'meeting',
        content: 'Test meeting 1',
        status: 'completed'
      });
    });

    it('should return all interactions for an organization', async () => {
      const result = await service.getInteractions(orgId, {});

      expect(result.interactions).toBeDefined();
      expect(result.total).toBeGreaterThan(0);
      expect(result.interactions.length).toBeGreaterThan(0);
    });

    it('should filter interactions by type', async () => {
      const result = await service.getInteractions(orgId, { type: 'email' });

      expect(result.interactions.every(i => i.type === 'email')).toBe(true);
    });

    it('should filter interactions by status', async () => {
      const result = await service.getInteractions(orgId, { status: 'completed' });

      expect(result.interactions.every(i => i.status === 'completed')).toBe(true);
    });

    it('should filter interactions by company_id', async () => {
      const result = await service.getInteractions(orgId, { company_id: 'company-1' });

      expect(result.interactions.every(i => i.company_id === 'company-1')).toBe(true);
    });

    it('should respect limit and offset', async () => {
      const result = await service.getInteractions(orgId, { limit: 1, offset: 0 });

      expect(result.interactions.length).toBeLessThanOrEqual(1);
    });

    it('should return empty result for non-existent organization', async () => {
      const result = await service.getInteractions('non-existent-org', {});

      expect(result.interactions).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('getInteractionById', () => {
    let interactionId: string;

    beforeEach(async () => {
      const interaction = await service.createInteraction(orgId, userId, {
        type: 'email',
        content: 'Test interaction for get by ID'
      });
      interactionId = interaction.id;
    });

    it('should return interaction by ID', async () => {
      const result = await service.getInteractionById(orgId, interactionId);

      expect(result).toBeDefined();
      expect(result!.id).toBe(interactionId);
      expect(result!.org_id).toBe(orgId);
    });

    it('should return null for non-existent interaction', async () => {
      const result = await service.getInteractionById(orgId, 'non-existent-id');

      expect(result).toBeNull();
    });

    it('should return null for interaction from different organization', async () => {
      const result = await service.getInteractionById('different-org', interactionId);

      expect(result).toBeNull();
    });
  });

  describe('updateInteraction', () => {
    let interactionId: string;

    beforeEach(async () => {
      const interaction = await service.createInteraction(orgId, userId, {
        type: 'email',
        content: 'Original content',
        status: 'pending'
      });
      interactionId = interaction.id;
    });

    it('should update interaction successfully', async () => {
      const updateData = {
        content: 'Updated content',
        status: 'completed' as const,
        priority: 'high' as const
      };

      const result = await service.updateInteraction(orgId, interactionId, userId, updateData);

      expect(result).toBeDefined();
      expect(result!.content).toBe(updateData.content);
      expect(result!.status).toBe(updateData.status);
      expect(result!.priority).toBe(updateData.priority);
      expect(result!.updated_at).toBeDefined();
    });

    it('should set completed_at when status is changed to completed', async () => {
      const updateData = { status: 'completed' as const };

      const result = await service.updateInteraction(orgId, interactionId, userId, updateData);

      expect(result!.completed_at).toBeDefined();
    });

    it('should return null for non-existent interaction', async () => {
      const result = await service.updateInteraction(orgId, 'non-existent-id', userId, {
        content: 'Updated content'
      });

      expect(result).toBeNull();
    });

    it('should return null for interaction from different organization', async () => {
      const result = await service.updateInteraction('different-org', interactionId, userId, {
        content: 'Updated content'
      });

      expect(result).toBeNull();
    });
  });

  describe('deleteInteraction', () => {
    let interactionId: string;

    beforeEach(async () => {
      const interaction = await service.createInteraction(orgId, userId, {
        type: 'email',
        content: 'Interaction to be deleted'
      });
      interactionId = interaction.id;
    });

    it('should delete interaction successfully', async () => {
      const result = await service.deleteInteraction(orgId, interactionId, userId);

      expect(result).toBe(true);

      // Verify interaction is deleted
      const deletedInteraction = await service.getInteractionById(orgId, interactionId);
      expect(deletedInteraction).toBeNull();
    });

    it('should return false for non-existent interaction', async () => {
      const result = await service.deleteInteraction(orgId, 'non-existent-id', userId);

      expect(result).toBe(false);
    });

    it('should return false for interaction from different organization', async () => {
      const result = await service.deleteInteraction('different-org', interactionId, userId);

      expect(result).toBe(false);
    });
  });

  describe('getInteractionSummary', () => {
    beforeEach(async () => {
      // Create test interactions with different types and statuses
      await service.createInteraction(orgId, userId, {
        type: 'email',
        content: 'Email 1',
        status: 'completed',
        priority: 'high'
      });

      await service.createInteraction(orgId, userId, {
        type: 'call',
        content: 'Call 1',
        status: 'pending',
        priority: 'medium'
      });

      await service.createInteraction(orgId, userId, {
        type: 'meeting',
        content: 'Meeting 1',
        status: 'completed',
        priority: 'low'
      });
    });

    it('should return comprehensive summary', async () => {
      const summary = await service.getInteractionSummary(orgId);

      expect(summary).toBeDefined();
      expect(summary.total).toBeGreaterThan(0);
      expect(summary.by_type).toBeDefined();
      expect(summary.by_status).toBeDefined();
      expect(summary.by_priority).toBeDefined();
      expect(summary.pending_count).toBeDefined();
      expect(summary.overdue_count).toBeDefined();
      expect(summary.completed_today).toBeDefined();
      expect(summary.avg_completion_time).toBeDefined();
      expect(summary.top_assignees).toBeDefined();
      expect(summary.recent_activity).toBeDefined();
    });

    it('should calculate correct counts by type', async () => {
      const summary = await service.getInteractionSummary(orgId);

      expect(summary.by_type.email).toBeGreaterThan(0);
      expect(summary.by_type.call).toBeGreaterThan(0);
      expect(summary.by_type.meeting).toBeGreaterThan(0);
    });

    it('should calculate correct counts by status', async () => {
      const summary = await service.getInteractionSummary(orgId);

      expect(summary.by_status.completed).toBeGreaterThan(0);
      expect(summary.by_status.pending).toBeGreaterThan(0);
    });

    it('should return empty summary for non-existent organization', async () => {
      const summary = await service.getInteractionSummary('non-existent-org');

      expect(summary.total).toBe(0);
      expect(summary.pending_count).toBe(0);
      expect(summary.overdue_count).toBe(0);
    });
  });

  describe('getInteractionAnalytics', () => {
    beforeEach(async () => {
      // Create test interactions for analytics
      await service.createInteraction(orgId, userId, {
        type: 'email',
        content: 'Email for analytics',
        status: 'completed'
      });

      await service.createInteraction(orgId, userId, {
        type: 'call',
        content: 'Call for analytics',
        status: 'pending'
      });
    });

    it('should return comprehensive analytics', async () => {
      const analytics = await service.getInteractionAnalytics(orgId);

      expect(analytics).toBeDefined();
      expect(analytics.summary).toBeDefined();
      expect(analytics.trends).toBeDefined();
      expect(analytics.recommendations).toBeDefined();

      expect(analytics.trends.completion_rate).toBeDefined();
      expect(analytics.trends.avg_response_time).toBeDefined();
      expect(analytics.trends.satisfaction_score).toBeDefined();
      expect(analytics.trends.productivity_metrics).toBeDefined();
    });

    it('should include recommendations', async () => {
      const analytics = await service.getInteractionAnalytics(orgId);

      expect(analytics.recommendations).toBeDefined();
      expect(Array.isArray(analytics.recommendations)).toBe(true);
      expect(analytics.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('bulkUpdateInteractions', () => {
    let interactionIds: string[];

    beforeEach(async () => {
      // Create test interactions for bulk update
      const interaction1 = await service.createInteraction(orgId, userId, {
        type: 'email',
        content: 'Email 1 for bulk update'
      });

      const interaction2 = await service.createInteraction(orgId, userId, {
        type: 'call',
        content: 'Call 1 for bulk update'
      });

      interactionIds = [interaction1.id, interaction2.id];
    });

    it('should update multiple interactions successfully', async () => {
      const updates = [
        {
          id: interactionIds[0],
          data: { status: 'completed' as const, priority: 'high' as const }
        },
        {
          id: interactionIds[1],
          data: { status: 'completed' as const, priority: 'medium' as const }
        }
      ];

      const result = await service.bulkUpdateInteractions(orgId, userId, updates);

      expect(result.updated).toBe(2);
      expect(result.failed).toBe(0);
      expect(result.errors).toEqual([]);
    });

    it('should handle partial failures', async () => {
      const updates = [
        {
          id: interactionIds[0],
          data: { status: 'completed' as const }
        },
        {
          id: 'non-existent-id',
          data: { status: 'completed' as const }
        }
      ];

      const result = await service.bulkUpdateInteractions(orgId, userId, updates);

      expect(result.updated).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.errors.length).toBe(1);
    });

    it('should handle empty updates array', async () => {
      const result = await service.bulkUpdateInteractions(orgId, userId, []);

      expect(result.updated).toBe(0);
      expect(result.failed).toBe(0);
      expect(result.errors).toEqual([]);
    });
  });

  describe('getStats', () => {
    it('should return service statistics', () => {
      const stats = service.getStats();

      expect(stats).toBeDefined();
      expect(stats.totalInteractions).toBeDefined();
      expect(stats.byType).toBeDefined();
      expect(stats.byStatus).toBeDefined();
      expect(stats.byOrg).toBeDefined();
    });
  });

  describe('Schema Validation', () => {
    describe('CreateInteractionSchema', () => {
      it('should validate valid interaction data', () => {
        const validData = {
          type: 'email',
          content: 'Valid content',
          status: 'pending',
          priority: 'medium'
        };

        expect(() => CreateInteractionSchema.parse(validData)).not.toThrow();
      });

      it('should reject invalid interaction data', () => {
        const invalidData = {
          type: 'invalid-type',
          content: '',
          status: 'invalid-status'
        };

        expect(() => CreateInteractionSchema.parse(invalidData)).toThrow();
      });
    });

    describe('UpdateInteractionSchema', () => {
      it('should validate partial update data', () => {
        const validData = {
          content: 'Updated content',
          status: 'completed'
        };

        expect(() => UpdateInteractionSchema.parse(validData)).not.toThrow();
      });

      it('should allow empty object for partial updates', () => {
        expect(() => UpdateInteractionSchema.parse({})).not.toThrow();
      });
    });

    describe('InteractionFiltersSchema', () => {
      it('should validate filter parameters', () => {
        const validFilters = {
          type: 'email',
          status: 'pending',
          limit: 10,
          offset: 0
        };

        expect(() => InteractionFiltersSchema.parse(validFilters)).not.toThrow();
      });

      it('should set default values for limit and offset', () => {
        const filters = InteractionFiltersSchema.parse({});

        expect(filters.limit).toBe(50);
        expect(filters.offset).toBe(0);
      });
    });
  });
});

