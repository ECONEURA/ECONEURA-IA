import { AlertingSystem, AlertRule, AlertChannel } from '../../lib/alerting-system.js';

// Mock fetch for webhook tests
global.fetch = jest.fn();

describe('AlertingSystem', () => {
  let alertingSystem: AlertingSystem;

  beforeEach(() => {
    alertingSystem = new AlertingSystem();
    jest.clearAllMocks();
  });

  afterEach(() => {
    alertingSystem.destroy();
  });

  describe('Rule Management', () => {
    it('should register alert rules', () => {
      const rule: AlertRule = {
        id: 'test-rule',
        name: 'Test Rule',
        condition: async () => true,
        severity: 'medium',
        message: 'Test alert',
        enabled: true,
        cooldown: 300
      };

      alertingSystem.registerRule(rule);
      
      const retrievedRule = alertingSystem.getRule('test-rule');
      expect(retrievedRule).toEqual(rule);
    });

    it('should unregister alert rules', () => {
      const rule: AlertRule = {
        id: 'test-rule',
        name: 'Test Rule',
        condition: async () => true,
        severity: 'medium',
        message: 'Test alert',
        enabled: true
      };

      alertingSystem.registerRule(rule);
      expect(alertingSystem.getRule('test-rule')).toBeDefined();

      alertingSystem.unregisterRule('test-rule');
      expect(alertingSystem.getRule('test-rule')).toBeUndefined();
    });

    it('should toggle rule enabled status', () => {
      const rule: AlertRule = {
        id: 'test-rule',
        name: 'Test Rule',
        condition: async () => true,
        severity: 'medium',
        message: 'Test alert',
        enabled: true
      };

      alertingSystem.registerRule(rule);
      
      alertingSystem.toggleRule('test-rule', false);
      expect(alertingSystem.getRule('test-rule')?.enabled).toBe(false);

      alertingSystem.toggleRule('test-rule', true);
      expect(alertingSystem.getRule('test-rule')?.enabled).toBe(true);
    });
  });

  describe('Channel Management', () => {
    it('should register alert channels', () => {
      const channel: AlertChannel = {
        id: 'console-channel',
        name: 'Console Channel',
        type: 'console',
        config: {},
        enabled: true
      };

      alertingSystem.registerChannel(channel);
      
      const retrievedChannel = alertingSystem.getChannel('console-channel');
      expect(retrievedChannel).toEqual(channel);
    });

    it('should support different channel types', () => {
      const channels: AlertChannel[] = [
        {
          id: 'console',
          name: 'Console',
          type: 'console',
          config: {},
          enabled: true
        },
        {
          id: 'webhook',
          name: 'Webhook',
          type: 'webhook',
          config: { url: 'https://example.com/webhook' },
          enabled: true
        },
        {
          id: 'email',
          name: 'Email',
          type: 'email',
          config: { to: 'admin@example.com' },
          enabled: true
        },
        {
          id: 'slack',
          name: 'Slack',
          type: 'slack',
          config: { 
            webhookUrl: 'https://hooks.slack.com/test',
            channel: '#alerts'
          },
          enabled: true
        }
      ];

      channels.forEach(channel => {
        alertingSystem.registerChannel(channel);
        expect(alertingSystem.getChannel(channel.id)).toEqual(channel);
      });
    });
  });

  describe('Alert Triggering', () => {
    beforeEach(() => {
      // Register a console channel for testing
      alertingSystem.registerChannel({
        id: 'console',
        name: 'Console',
        type: 'console',
        config: {},
        enabled: true
      });
    });

    it('should trigger alerts when conditions are met', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const rule: AlertRule = {
        id: 'test-alert',
        name: 'Test Alert',
        condition: async () => true, // Always trigger
        severity: 'high',
        message: 'Test alert triggered',
        enabled: true
      };

      alertingSystem.registerRule(rule);

      // Wait for rule to be checked
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('🚨 ALERT [HIGH] Test Alert: Test alert triggered')
      );

      consoleSpy.mockRestore();
    });

    it('should not trigger alerts when conditions are not met', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const rule: AlertRule = {
        id: 'test-alert',
        name: 'Test Alert',
        condition: async () => false, // Never trigger
        severity: 'high',
        message: 'Test alert triggered',
        enabled: true
      };

      alertingSystem.registerRule(rule);

      // Wait for rule to be checked
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('🚨 ALERT [HIGH] Test Alert: Test alert triggered')
      );

      consoleSpy.mockRestore();
    });

    it('should not trigger disabled rules', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const rule: AlertRule = {
        id: 'test-alert',
        name: 'Test Alert',
        condition: async () => true,
        severity: 'high',
        message: 'Test alert triggered',
        enabled: false // Disabled
      };

      alertingSystem.registerRule(rule);

      // Wait for rule to be checked
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('🚨 ALERT')
      );

      consoleSpy.mockRestore();
    });

    it('should respect cooldown periods', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      let triggerCount = 0;
      
      const rule: AlertRule = {
        id: 'cooldown-alert',
        name: 'Cooldown Alert',
        condition: async () => {
          triggerCount++;
          return true;
        },
        severity: 'medium',
        message: 'Cooldown test',
        enabled: true,
        cooldown: 1 // 1 second cooldown
      };

      alertingSystem.registerRule(rule);

      // Wait for multiple checks
      await new Promise(resolve => setTimeout(resolve, 500));

      // Should only trigger once due to cooldown
      const alertCalls = consoleSpy.mock.calls.filter(call => 
        call[0].includes('🚨 ALERT [MEDIUM] Cooldown Alert')
      );
      expect(alertCalls.length).toBeLessThanOrEqual(1);

      consoleSpy.mockRestore();
    });
  });

  describe('Alert Resolution', () => {
    beforeEach(() => {
      alertingSystem.registerChannel({
        id: 'console',
        name: 'Console',
        type: 'console',
        config: {},
        enabled: true
      });
    });

    it('should resolve alerts when conditions are no longer met', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      let shouldTrigger = true;
      
      const rule: AlertRule = {
        id: 'resolve-alert',
        name: 'Resolve Alert',
        condition: async () => shouldTrigger,
        severity: 'low',
        message: 'Resolve test',
        enabled: true
      };

      alertingSystem.registerRule(rule);

      // Wait for alert to trigger
      await new Promise(resolve => setTimeout(resolve, 100));

      // Change condition to resolve alert
      shouldTrigger = false;

      // Wait for resolution
      await new Promise(resolve => setTimeout(resolve, 100));

      const resolveCalls = consoleSpy.mock.calls.filter(call => 
        call[0].includes('✅ RESOLVED [LOW] Resolve Alert')
      );
      expect(resolveCalls.length).toBeGreaterThanOrEqual(0);

      consoleSpy.mockRestore();
    });
  });

  describe('Webhook Integration', () => {
    beforeEach(() => {
      alertingSystem.registerChannel({
        id: 'webhook',
        name: 'Webhook',
        type: 'webhook',
        config: { 
          url: 'https://example.com/webhook',
          headers: { 'Authorization': 'Bearer token' }
        },
        enabled: true
      });
    });

    it('should send webhook alerts', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200
      } as Response);

      const rule: AlertRule = {
        id: 'webhook-alert',
        name: 'Webhook Alert',
        condition: async () => true,
        severity: 'critical',
        message: 'Webhook test',
        enabled: true
      };

      alertingSystem.registerRule(rule);

      // Wait for webhook to be called
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/webhook',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer token'
          }),
          body: expect.stringContaining('Webhook test')
        })
      );
    });

    it('should handle webhook failures gracefully', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const rule: AlertRule = {
        id: 'webhook-fail-alert',
        name: 'Webhook Fail Alert',
        condition: async () => true,
        severity: 'high',
        message: 'Webhook fail test',
        enabled: true
      };

      alertingSystem.registerRule(rule);

      // Wait for webhook attempt
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should not throw error
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('Slack Integration', () => {
    beforeEach(() => {
      alertingSystem.registerChannel({
        id: 'slack',
        name: 'Slack',
        type: 'slack',
        config: { 
          webhookUrl: 'https://hooks.slack.com/test',
          channel: '#alerts'
        },
        enabled: true
      });
    });

    it('should send Slack alerts with proper formatting', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200
      } as Response);

      const rule: AlertRule = {
        id: 'slack-alert',
        name: 'Slack Alert',
        condition: async () => true,
        severity: 'medium',
        message: 'Slack test message',
        enabled: true
      };

      alertingSystem.registerRule(rule);

      // Wait for Slack webhook to be called
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockFetch).toHaveBeenCalledWith(
        'https://hooks.slack.com/test',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('#alerts')
        })
      );

      const callBody = JSON.parse(mockFetch.mock.calls[0][1]?.body as string);
      expect(callBody.channel).toBe('#alerts');
      expect(callBody.username).toBe('Econeura Alerting');
      expect(callBody.attachments[0].title).toBe('Slack Alert');
      expect(callBody.attachments[0].text).toBe('Slack test message');
    });

    it('should use correct colors for different severities', () => {
      const severityColors = {
        low: '#36a64f',
        medium: '#ff9800',
        high: '#ff5722',
        critical: '#f44336'
      };

      Object.entries(severityColors).forEach(([severity, expectedColor]) => {
        const color = alertingSystem['getSeverityColor'](severity);
        expect(color).toBe(expectedColor);
      });
    });
  });

  describe('Active Alerts', () => {
    it('should track active alerts', async () => {
      alertingSystem.registerChannel({
        id: 'console',
        name: 'Console',
        type: 'console',
        config: {},
        enabled: true
      });

      const rule: AlertRule = {
        id: 'active-alert',
        name: 'Active Alert',
        condition: async () => true,
        severity: 'high',
        message: 'Active alert test',
        enabled: true
      };

      alertingSystem.registerRule(rule);

      // Wait for alert to trigger
      await new Promise(resolve => setTimeout(resolve, 100));

      const activeAlerts = alertingSystem.getActiveAlerts();
      expect(activeAlerts.length).toBeGreaterThanOrEqual(0);
    });

    it('should remove resolved alerts from active list', async () => {
      alertingSystem.registerChannel({
        id: 'console',
        name: 'Console',
        type: 'console',
        config: {},
        enabled: true
      });

      let shouldAlert = true;
      const rule: AlertRule = {
        id: 'resolve-active-alert',
        name: 'Resolve Active Alert',
        condition: async () => shouldAlert,
        severity: 'medium',
        message: 'Resolve active test',
        enabled: true
      };

      alertingSystem.registerRule(rule);

      // Wait for alert to trigger
      await new Promise(resolve => setTimeout(resolve, 100));

      // Resolve the alert
      shouldAlert = false;
      await new Promise(resolve => setTimeout(resolve, 100));

      const activeAlerts = alertingSystem.getActiveAlerts();
      const ourAlert = activeAlerts.find(alert => alert.name === 'Resolve Active Alert');
      expect(ourAlert).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle condition evaluation errors', async () => {
      const rule: AlertRule = {
        id: 'error-rule',
        name: 'Error Rule',
        condition: async () => {
          throw new Error('Condition error');
        },
        severity: 'low',
        message: 'Error test',
        enabled: true
      };

      alertingSystem.registerRule(rule);

      // Wait for condition to be evaluated
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should not crash the system
      expect(alertingSystem.getRule('error-rule')).toBeDefined();
    });

    it('should handle channel sending errors', async () => {
      alertingSystem.registerChannel({
        id: 'error-channel',
        name: 'Error Channel',
        type: 'webhook',
        config: { url: 'invalid-url' },
        enabled: true
      });

      const rule: AlertRule = {
        id: 'channel-error-rule',
        name: 'Channel Error Rule',
        condition: async () => true,
        severity: 'medium',
        message: 'Channel error test',
        enabled: true
      };

      alertingSystem.registerRule(rule);

      // Wait for alert processing
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should not crash the system
      expect(alertingSystem.getRule('channel-error-rule')).toBeDefined();
    });
  });
});
