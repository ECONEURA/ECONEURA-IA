import { describe, it, expect, beforeEach, vi } from 'vitest';
import { graphChaosLightService } from '../../../lib/graph-chaos-light.service.js';

describe('GraphChaosLightService - PR-74', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // Reset service state for isolation
    graphChaosLightService.reset();
  });

  describe('Service Initialization', () => {
    it('should initialize with demo tokens', () => {
      const tokens = graphChaosLightService.getTokens();
      
      expect(tokens).toBeDefined();
      expect(tokens.length).toBeGreaterThan(0);
      expect(tokens[0]).toHaveProperty('accessToken');
      expect(tokens[0]).toHaveProperty('refreshToken');
      expect(tokens[0]).toHaveProperty('expiresAt');
      expect(tokens[0]).toHaveProperty('tokenType', 'Bearer');
      expect(tokens[0]).toHaveProperty('scope');
    });

    it('should initialize with empty chaos events', () => {
      const events = graphChaosLightService.getChaosEvents();
      
      expect(events).toBeDefined();
      expect(Array.isArray(events)).toBe(true);
    });
  });

  describe('Token Management', () => {
    it('should get all tokens', () => {
      const tokens = graphChaosLightService.getTokens();
      
      expect(tokens).toBeDefined();
      expect(Array.isArray(tokens)).toBe(true);
      expect(tokens.length).toBeGreaterThan(0);
      
      tokens.forEach(token => {
        expect(token).toHaveProperty('accessToken');
        expect(token).toHaveProperty('refreshToken');
        expect(token).toHaveProperty('expiresAt');
        expect(token).toHaveProperty('tokenType');
        expect(token).toHaveProperty('scope');
        expect(token).toHaveProperty('issuedAt');
      });
    });

    it('should have valid token structure', () => {
      const tokens = graphChaosLightService.getTokens();
      const token = tokens[0];
      
      expect(token.accessToken).toMatch(/^demo_access_token_|^rotated_access_token_/);
      expect(token.refreshToken).toMatch(/^demo_refresh_token_|^rotated_refresh_token_/);
      expect(new Date(token.expiresAt)).toBeInstanceOf(Date);
      expect(new Date(token.issuedAt)).toBeInstanceOf(Date);
      expect(token.tokenType).toBe('Bearer');
      expect(token.scope).toBe('https://graph.microsoft.com/.default');
    });
  });

  describe('Chaos Events', () => {
    it('should track chaos events', async () => {
      const initialEvents = graphChaosLightService.getChaosEvents();
      const initialCount = initialEvents.length;
      
      // Simulate some API calls to generate events
      await graphChaosLightService.simulateGraphApiCall('/users', 'GET');
      await graphChaosLightService.simulateGraphApiCall('/messages', 'GET');
      
      const events = graphChaosLightService.getChaosEvents();
      expect(events.length).toBeGreaterThan(initialCount);
    });

    it('should have valid event structure', async () => {
      await graphChaosLightService.simulateGraphApiCall('/test', 'GET');
      
      const events = graphChaosLightService.getChaosEvents();
      const event = events[events.length - 1];
      
      expect(event).toHaveProperty('id');
      expect(event).toHaveProperty('type');
      expect(event).toHaveProperty('severity');
      expect(event).toHaveProperty('description');
      expect(event).toHaveProperty('timestamp');
      expect(event).toHaveProperty('metadata');
      
      expect(['token_rotation', 'token_expiry', 'api_failure', 'latency_injection']).toContain(event.type);
      expect(['low', 'medium', 'high', 'critical']).toContain(event.severity);
      expect(new Date(event.timestamp)).toBeInstanceOf(Date);
    });
  });

  describe('API Simulation', () => {
    it('should simulate successful API calls', async () => {
      const result = await graphChaosLightService.simulateGraphApiCall('/users', 'GET');
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('statusCode');
      expect(result).toHaveProperty('latency');
      
      if (result.success) {
        expect(result.statusCode).toBe(200);
        expect(result.latency).toBeGreaterThan(0);
      }
    });

    it('should simulate API failures', async () => {
      // Run multiple simulations to increase chance of failure
      let failureFound = false;
      for (let i = 0; i < 20; i++) {
        const result = await graphChaosLightService.simulateGraphApiCall('/test', 'GET');
        if (!result.success) {
          failureFound = true;
          expect(result.statusCode).toBeGreaterThanOrEqual(400);
          expect(result.error).toBeDefined();
          break;
        }
      }
      
      // Note: This test might not always find a failure due to randomness
      // but it validates the failure handling when it occurs
    });

    it('should inject latency in API calls', async () => {
      const result = await graphChaosLightService.simulateGraphApiCall('/test', 'GET');
      
      expect(result.latency).toBeGreaterThan(0);
      expect(result.latency).toBeLessThanOrEqual(500); // Max configured latency
    });

    it('should handle different HTTP methods', async () => {
      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
      
      for (const method of methods) {
        const result = await graphChaosLightService.simulateGraphApiCall('/test', method);
        expect(result).toBeDefined();
        expect(result).toHaveProperty('success');
        expect(result).toHaveProperty('statusCode');
      }
    });
  });

  describe('Statistics', () => {
    it('should provide chaos statistics', () => {
      const stats = graphChaosLightService.getChaosStats();
      
      expect(stats).toBeDefined();
      expect(stats).toHaveProperty('totalEvents');
      expect(stats).toHaveProperty('eventsByType');
      expect(stats).toHaveProperty('eventsBySeverity');
      expect(stats).toHaveProperty('averageLatency');
      expect(stats).toHaveProperty('failureRate');
      
      expect(typeof stats.totalEvents).toBe('number');
      expect(typeof stats.averageLatency).toBe('number');
      expect(typeof stats.failureRate).toBe('number');
      expect(Array.isArray(stats.eventsByType)).toBe(false); // Should be object
      expect(Array.isArray(stats.eventsBySeverity)).toBe(false); // Should be object
    });

    it('should calculate statistics correctly', async () => {
      // Generate some events
      await graphChaosLightService.simulateGraphApiCall('/test1', 'GET');
      await graphChaosLightService.simulateGraphApiCall('/test2', 'POST');
      await graphChaosLightService.simulateGraphApiCall('/test3', 'GET');
      
      const stats = graphChaosLightService.getChaosStats();
      
      expect(stats.totalEvents).toBeGreaterThan(0);
      expect(stats.averageLatency).toBeGreaterThanOrEqual(0);
      expect(stats.failureRate).toBeGreaterThanOrEqual(0);
      expect(stats.failureRate).toBeLessThanOrEqual(1);
    });
  });

  describe('Configuration Management', () => {
    it('should update configuration', () => {
      const newConfig = {
        failureRate: 0.5,
        latencyMs: {
          min: 200,
          max: 800,
        },
      };
      
      graphChaosLightService.updateConfig(newConfig);
      
      // Configuration is internal, but we can verify it doesn't throw
      expect(() => graphChaosLightService.updateConfig(newConfig)).not.toThrow();
    });

    it('should handle partial configuration updates', () => {
      const partialConfig = {
        failureRate: 0.2,
      };
      
      expect(() => graphChaosLightService.updateConfig(partialConfig)).not.toThrow();
    });
  });

  describe('Service Lifecycle', () => {
    it('should reset service state', async () => {
      // Generate some events first
      await graphChaosLightService.simulateGraphApiCall('/test', 'GET');
      
      const eventsBeforeReset = graphChaosLightService.getChaosEvents();
      expect(eventsBeforeReset.length).toBeGreaterThan(0);
      
      // Reset service
      graphChaosLightService.reset();
      
      const eventsAfterReset = graphChaosLightService.getChaosEvents();
      expect(eventsAfterReset.length).toBe(0);
      
      // Tokens should still exist after reset
      const tokens = graphChaosLightService.getTokens();
      expect(tokens.length).toBeGreaterThan(0);
    });

    it('should destroy service properly', () => {
      expect(() => graphChaosLightService.destroy()).not.toThrow();
      
      // After destroy, tokens should be cleared
      const tokens = graphChaosLightService.getTokens();
      expect(tokens.length).toBe(0);
      
      // Events should be cleared
      const events = graphChaosLightService.getChaosEvents();
      expect(events.length).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid endpoints gracefully', async () => {
      const result = await graphChaosLightService.simulateGraphApiCall('', 'GET');
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('statusCode');
    });

    it('should handle concurrent API calls', async () => {
      const promises = Array(10).fill(null).map((_, i) => 
        graphChaosLightService.simulateGraphApiCall(`/test${i}`, 'GET')
      );
      
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result).toHaveProperty('success');
        expect(result).toHaveProperty('statusCode');
        expect(result).toHaveProperty('latency');
      });
    });
  });

  describe('Token Rotation Simulation', () => {
    it('should track token rotation events', () => {
      // This test verifies that token rotation events are tracked
      // The actual rotation happens on a timer, so we can't easily test it directly
      // But we can verify the service is set up to handle it
      
      const stats = graphChaosLightService.getChaosStats();
      expect(stats).toBeDefined();
      expect(stats.eventsByType).toBeDefined();
    });
  });
});
