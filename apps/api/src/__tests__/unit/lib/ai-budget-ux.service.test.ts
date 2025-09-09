import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AIBudgetUXService, aiBudgetUXService } from '../../../lib/ai-budget-ux.service.js';

describe('AIBudgetUXService - PR-76', () => {
  let service: AIBudgetUXService;

  beforeEach(() => {
    service = new AIBudgetUXService();
  });

  describe('Service Initialization', () => {
    it('should initialize with default configuration', () => {
      const config = service.getBudgetConfig('default');

      expect(config).toBeDefined();
      expect(config?.monthlyLimit).toBe(1000);
      expect(config?.warningThreshold).toBe(0.7);
      expect(config?.criticalThreshold).toBe(0.9);
      expect(config?.readOnlyThreshold).toBe(0.95);
      expect(config?.currency).toBe('EUR');
      expect(config?.autoReadOnly).toBe(true);
    });

    it('should return null for non-existent organization', () => {
      const config = service.getBudgetConfig('non-existent');
      expect(config).toBeNull();
    });
  });

  describe('Budget Configuration', () => {
    it('should set budget configuration correctly', async () => {
      const configData = {
        organizationId: 'test-org',
        monthlyLimit: 2000,
        dailyLimit: 100,
        warningThreshold: 0.6,
        criticalThreshold: 0.8,
        readOnlyThreshold: 0.9,
        currency: 'USD' as const,
        timezone: 'America/New_York',
        alertChannels: ['email', 'slack'] as const,
        autoReadOnly: false,
        gracePeriod: 48,
      };

      const config = await service.setBudgetConfig(configData);

      expect(config.organizationId).toBe('test-org');
      expect(config.monthlyLimit).toBe(2000);
      expect(config.dailyLimit).toBe(100);
      expect(config.warningThreshold).toBe(0.6);
      expect(config.criticalThreshold).toBe(0.8);
      expect(config.readOnlyThreshold).toBe(0.9);
      expect(config.currency).toBe('USD');
      expect(config.timezone).toBe('America/New_York');
      expect(config.alertChannels).toEqual(['email', 'slack']);
      expect(config.autoReadOnly).toBe(false);
      expect(config.gracePeriod).toBe(48);
    });

    it('should use default values for missing configuration', async () => {
      const configData = {
        organizationId: 'test-org-2',
        monthlyLimit: 1500,
      };

      const config = await service.setBudgetConfig(configData);

      expect(config.organizationId).toBe('test-org-2');
      expect(config.monthlyLimit).toBe(1500);
      expect(config.warningThreshold).toBe(0.7); // default
      expect(config.criticalThreshold).toBe(0.9); // default
      expect(config.readOnlyThreshold).toBe(0.95); // default
      expect(config.currency).toBe('EUR'); // default
      expect(config.autoReadOnly).toBe(true); // default
    });
  });

  describe('Budget Usage Updates', () => {
    beforeEach(async () => {
      await service.setBudgetConfig({
        organizationId: 'test-org',
        monthlyLimit: 1000,
        warningThreshold: 0.7,
        criticalThreshold: 0.9,
        readOnlyThreshold: 0.95,
      });
    });

    it('should update usage correctly', async () => {
      const usageData = {
        currentUsage: 100,
        dailyUsage: 50,
        monthlyUsage: 200,
        usageByModel: {
          'gpt-4': 150,
          'gpt-3.5-turbo': 50,
        },
        usageByUser: {
          'user-1': 120,
          'user-2': 80,
        },
        usageByFeature: {
          'chat': 180,
          'completion': 20,
        },
      };

      const usage = await service.updateUsage('test-org', usageData);

      expect(usage.organizationId).toBe('test-org');
      expect(usage.currentUsage).toBe(100);
      expect(usage.dailyUsage).toBe(50);
      expect(usage.monthlyUsage).toBe(200);
      expect(usage.usageByModel).toEqual({
        'gpt-4': 150,
        'gpt-3.5-turbo': 50,
      });
      expect(usage.usageByUser).toEqual({
        'user-1': 120,
        'user-2': 80,
      });
      expect(usage.usageByFeature).toEqual({
        'chat': 180,
        'completion': 20,
      });
      expect(usage.projectedMonthlyUsage).toBeGreaterThan(0);
      expect(usage.averageDailyUsage).toBeGreaterThan(0);
    });

    it('should calculate projections correctly', async () => {
      const usageData = {
        monthlyUsage: 500,
      };

      const usage = await service.updateUsage('test-org', usageData);

      expect(usage.projectedMonthlyUsage).toBeGreaterThan(500);
      expect(usage.averageDailyUsage).toBeGreaterThan(0);
    });
  });

  describe('Budget Progress', () => {
    beforeEach(async () => {
      await service.setBudgetConfig({
        organizationId: 'test-org',
        monthlyLimit: 1000,
        warningThreshold: 0.7,
        criticalThreshold: 0.9,
        readOnlyThreshold: 0.95,
      });
    });

    it('should return null for non-existent organization', () => {
      const progress = service.getBudgetProgress('non-existent');
      expect(progress).toBeNull();
    });

    it('should calculate progress correctly for safe status', async () => {
      await service.updateUsage('test-org', { monthlyUsage: 500 });
      const progress = service.getBudgetProgress('test-org');

      expect(progress).toBeDefined();
      expect(progress?.organizationId).toBe('test-org');
      expect(progress?.currentUsage).toBe(500);
      expect(progress?.limit).toBe(1000);
      expect(progress?.percentage).toBe(50);
      expect(progress?.status).toBe('safe');
      expect(progress?.canMakeRequests).toBe(true);
      expect(progress?.readOnlyMode).toBe(false);
    });

    it('should calculate progress correctly for warning status', async () => {
      await service.updateUsage('test-org', { monthlyUsage: 750 });
      const progress = service.getBudgetProgress('test-org');

      expect(progress?.percentage).toBe(75);
      expect(progress?.status).toBe('warning');
    });

    it('should calculate progress correctly for critical status', async () => {
      await service.updateUsage('test-org', { monthlyUsage: 950 });
      const progress = service.getBudgetProgress('test-org');

      expect(progress?.percentage).toBe(95);
      expect(progress?.status).toBe('critical');
    });

    it('should calculate progress correctly for read-only status', async () => {
      await service.updateUsage('test-org', { monthlyUsage: 980 });
      const progress = service.getBudgetProgress('test-org');

      expect(progress?.percentage).toBe(98);
      expect(progress?.status).toBe('read_only');
    });
  });

  describe('Budget Insights', () => {
    beforeEach(async () => {
      await service.setBudgetConfig({
        organizationId: 'test-org',
        monthlyLimit: 1000,
      });

      await service.updateUsage('test-org', {
        monthlyUsage: 500,
        usageByModel: {
          'gpt-4': 300,
          'gpt-3.5-turbo': 200,
        },
        usageByUser: {
          'user-1': 300,
          'user-2': 200,
        },
        usageByFeature: {
          'chat': 400,
          'completion': 100,
        },
      });
    });

    it('should generate insights correctly', () => {
      const insights = service.getBudgetInsights('test-org');

      expect(insights).toBeDefined();
      expect(insights?.organizationId).toBe('test-org');
      expect(insights?.trends).toBeDefined();
      expect(insights?.predictions).toBeDefined();
      expect(insights?.recommendations).toBeDefined();
      expect(insights?.topUsers).toBeDefined();
      expect(insights?.topModels).toBeDefined();
      expect(insights?.topFeatures).toBeDefined();

      expect(insights?.trends.dailyGrowth).toBeDefined();
      expect(insights?.trends.weeklyGrowth).toBeDefined();
      expect(insights?.trends.monthlyGrowth).toBeDefined();

      expect(insights?.predictions.projectedEndOfMonth).toBeGreaterThan(0);
      expect(insights?.predictions.confidence).toBeGreaterThan(0);
      expect(insights?.predictions.confidence).toBeLessThanOrEqual(1);

      expect(insights?.topUsers).toHaveLength(2);
      expect(insights?.topModels).toHaveLength(2);
      expect(insights?.topFeatures).toHaveLength(2);
    });

    it('should return null for non-existent organization', () => {
      const insights = service.getBudgetInsights('non-existent');
      expect(insights).toBeNull();
    });
  });

  describe('Read-Only Mode', () => {
    beforeEach(async () => {
      await service.setBudgetConfig({
        organizationId: 'test-org',
        monthlyLimit: 1000,
      });
    });

    it('should activate read-only mode', async () => {
      await service.activateReadOnlyMode('test-org', 'Budget exceeded');

      const progress = service.getBudgetProgress('test-org');
      expect(progress?.readOnlyMode).toBe(true);
      expect(progress?.canMakeRequests).toBe(false);
    });

    it('should deactivate read-only mode', async () => {
      await service.activateReadOnlyMode('test-org', 'Budget exceeded');
      await service.deactivateReadOnlyMode('test-org', 'Budget increased');

      const progress = service.getBudgetProgress('test-org');
      expect(progress?.readOnlyMode).toBe(false);
      expect(progress?.canMakeRequests).toBe(true);
    });
  });

  describe('Grace Period', () => {
    beforeEach(async () => {
      await service.setBudgetConfig({
        organizationId: 'test-org',
        monthlyLimit: 1000,
      });
    });

    it('should activate grace period', async () => {
      await service.activateReadOnlyMode('test-org', 'Budget exceeded');
      await service.activateGracePeriod('test-org', 24);

      const progress = service.getBudgetProgress('test-org');
      expect(progress?.readOnlyMode).toBe(true);
      expect(progress?.gracePeriodActive).toBe(true);
      expect(progress?.canMakeRequests).toBe(true);
      expect(progress?.gracePeriodEndsAt).toBeDefined();
    });
  });

  describe('Request Validation', () => {
    beforeEach(async () => {
      await service.setBudgetConfig({
        organizationId: 'test-org',
        monthlyLimit: 1000,
      });
    });

    it('should allow request when within budget', async () => {
      await service.updateUsage('test-org', { monthlyUsage: 500 });

      const result = service.canMakeRequest('test-org', 100);
      expect(result.allowed).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should deny request when would exceed budget', async () => {
      await service.updateUsage('test-org', { monthlyUsage: 950 });

      const result = service.canMakeRequest('test-org', 100);
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Request would exceed monthly limit');
    });

    it('should deny request when in read-only mode', async () => {
      await service.activateReadOnlyMode('test-org', 'Budget exceeded');

      const result = service.canMakeRequest('test-org', 10);
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Read-only mode active');
    });

    it('should allow request when in grace period', async () => {
      await service.activateReadOnlyMode('test-org', 'Budget exceeded');
      await service.activateGracePeriod('test-org', 24);

      const result = service.canMakeRequest('test-org', 10);
      expect(result.allowed).toBe(true);
    });

    it('should return error for non-existent organization', () => {
      const result = service.canMakeRequest('non-existent', 10);
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('No budget configuration found');
    });
  });

  describe('Alerts', () => {
    beforeEach(async () => {
      await service.setBudgetConfig({
        organizationId: 'test-org',
        monthlyLimit: 1000,
        warningThreshold: 0.7,
        criticalThreshold: 0.9,
        readOnlyThreshold: 0.95,
      });
    });

    it('should generate warning alert', async () => {
      await service.updateUsage('test-org', { monthlyUsage: 750 });

      const alerts = service.getActiveAlerts('test-org');
      expect(alerts.length).toBeGreaterThan(0);

      const warningAlert = alerts.find(alert => alert.type === 'warning');
      expect(warningAlert).toBeDefined();
      expect(warningAlert?.severity).toBe('medium');
    });

    it('should generate critical alert', async () => {
      await service.updateUsage('test-org', { monthlyUsage: 950 });

      const alerts = service.getActiveAlerts('test-org');
      const criticalAlert = alerts.find(alert => alert.type === 'critical');
      expect(criticalAlert).toBeDefined();
      expect(criticalAlert?.severity).toBe('high');
    });

    it('should acknowledge alert', async () => {
      await service.updateUsage('test-org', { monthlyUsage: 750 });

      const alerts = service.getActiveAlerts('test-org');
      expect(alerts.length).toBeGreaterThan(0);

      const alertId = alerts[0].id;
      const success = await service.acknowledgeAlert('test-org', alertId, 'admin');

      expect(success).toBe(true);

      const updatedAlerts = service.getActiveAlerts('test-org');
      const acknowledgedAlert = updatedAlerts.find(alert => alert.id === alertId);
      expect(acknowledgedAlert).toBeUndefined();
    });

    it('should return false for non-existent alert', async () => {
      const success = await service.acknowledgeAlert('test-org', 'non-existent', 'admin');
      expect(success).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero budget limit', async () => {
      await service.setBudgetConfig({
        organizationId: 'test-org',
        monthlyLimit: 0,
      });

      const progress = service.getBudgetProgress('test-org');
      expect(progress?.limit).toBe(0);
      expect(progress?.percentage).toBe(Infinity);
    });

    it('should handle negative usage gracefully', async () => {
      await service.setBudgetConfig({
        organizationId: 'test-org',
        monthlyLimit: 1000,
      });

      // This should not throw an error
      await expect(service.updateUsage('test-org', { monthlyUsage: -100 })).rejects.toThrow();
    });

    it('should handle very large usage values', async () => {
      await service.setBudgetConfig({
        organizationId: 'test-org',
        monthlyLimit: 1000,
      });

      await service.updateUsage('test-org', { monthlyUsage: 1000000 });

      const progress = service.getBudgetProgress('test-org');
      expect(progress?.percentage).toBeGreaterThan(100);
      expect(progress?.status).toBe('read_only');
    });
  });

  describe('Singleton Instance', () => {
    it('should provide singleton instance', () => {
      expect(aiBudgetUXService).toBeInstanceOf(AIBudgetUXService);
      expect(aiBudgetUXService.getBudgetConfig('default')).toBeDefined();
    });
  });
});
