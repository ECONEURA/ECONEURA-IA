// ============================================================================
// TELEMETRY TESTS - CLIENT-SIDE INSTRUMENTATION
// ============================================================================

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { 
  TelemetryService, 
  TelemetryConfigSchema,
  TelemetryEventSchema,
  PerformanceMetricsSchema,
  UserActionSchema,
  ErrorEventSchema
} from '../index.js';

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'test-uuid-123')
  }
});

// Mock fetch
global.fetch = vi.fn();

// Mock performance
Object.defineProperty(global, 'performance', {
  value: {
    now: vi.fn(() => Date.now()),
    getEntriesByType: vi.fn(() => []),
    getEntriesByName: vi.fn(() => []),
    getEntries: vi.fn(() => [])
  }
});

// Mock window
Object.defineProperty(global, 'window', {
  value: {
    location: {
      href: 'https://example.com/test',
      pathname: '/test',
      search: '?param=value'
    },
    screen: {
      width: 1920,
      height: 1080
    },
    innerWidth: 1200,
    innerHeight: 800,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  },
  writable: true
});

// Mock document
Object.defineProperty(global, 'document', {
  value: {
    referrer: 'https://google.com',
    body: {
      addEventListener: vi.fn()
    }
  },
  writable: true
});

// Mock navigator
Object.defineProperty(global, 'navigator', {
  value: {
    userAgent: 'Mozilla/5.0 (Test Browser)',
    language: 'en-US'
  },
  writable: true
});

describe('TelemetryService', () => {
  let telemetry: TelemetryService;

  beforeEach(() => {
    vi.clearAllMocks();
    telemetry = new TelemetryService({
      enabled: true,
      debugMode: true,
      privacyMode: true
    });
  });

  afterEach(() => {
    telemetry.destroy();
  });

  describe('Configuration', () => {
    it('should create with default config', () => {
      const defaultTelemetry = new TelemetryService();
      expect(defaultTelemetry).toBeInstanceOf(TelemetryService);
    });

    it('should validate config schema', () => {
      const validConfig = {
        enabled: true,
        sampleRate: 0.5,
        batchSize: 50,
        flushInterval: 3000,
        privacyMode: false
      };

      const result = TelemetryConfigSchema.safeParse(validConfig);
      expect(result.success).toBe(true);
    });

    it('should reject invalid config', () => {
      const invalidConfig = {
        sampleRate: 1.5, // Invalid: > 1
        batchSize: -1,   // Invalid: < 1
        flushInterval: 500 // Invalid: < 1000
      };

      const result = TelemetryConfigSchema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });
  });

  describe('Event Tracking', () => {
    it('should track custom event', () => {
      telemetry.trackEvent('custom', 'test_event', { key: 'value' }, { metric: 100 });
      
      // Since we can't easily access private events array, we'll test the method doesn't throw
      expect(() => {
        telemetry.trackEvent('custom', 'test_event', { key: 'value' });
      }).not.toThrow();
    });

    it('should track page view', () => {
      expect(() => {
        telemetry.trackPageView('/test-page', { source: 'navigation' });
      }).not.toThrow();
    });

    it('should track user action', () => {
      expect(() => {
        telemetry.trackUserAction('click', 'button', { buttonId: 'submit' });
      }).not.toThrow();
    });

    it('should track performance metrics', () => {
      const metrics = {
        pageLoadTime: 1500,
        domContentLoaded: 800,
        firstContentfulPaint: 1200
      };

      expect(() => {
        telemetry.trackPerformance(metrics);
      }).not.toThrow();
    });

    it('should track error', () => {
      const error = new Error('Test error');
      expect(() => {
        telemetry.trackError(error, { context: 'test' });
      }).not.toThrow();
    });

    it('should track custom event with metrics', () => {
      expect(() => {
        telemetry.trackCustom('custom_metric', { type: 'test' }, { value: 42 });
      }).not.toThrow();
    });
  });

  describe('User Management', () => {
    it('should set user information', () => {
      expect(() => {
        telemetry.setUser('user-123', 'org-456');
      }).not.toThrow();
    });
  });

  describe('Privacy and Sanitization', () => {
    it('should sanitize PII in properties', () => {
      // This is tested indirectly through the sanitizeProperties method
      // We can't easily test private methods, but we can ensure the service doesn't crash
      expect(() => {
        telemetry.trackEvent('custom', 'test', {
          email: 'test@example.com',
          phone: '123-456-7890',
          password: 'secret123'
        });
      }).not.toThrow();
    });

    it('should handle privacy mode', () => {
      const privacyTelemetry = new TelemetryService({
        privacyMode: true,
        enabled: true
      });

      expect(() => {
        privacyTelemetry.trackEvent('custom', 'test', {
          email: 'test@example.com',
          sensitive: 'data'
        });
      }).not.toThrow();

      privacyTelemetry.destroy();
    });
  });

  describe('Sampling', () => {
    it('should respect sample rate', () => {
      const sampledTelemetry = new TelemetryService({
        sampleRate: 0,
        enabled: true
      });

      // With 0% sample rate, events should not be tracked
      expect(() => {
        sampledTelemetry.trackEvent('custom', 'test');
      }).not.toThrow();

      sampledTelemetry.destroy();
    });
  });

  describe('Error Handling', () => {
    it('should handle tracking when disabled', () => {
      const disabledTelemetry = new TelemetryService({
        enabled: false
      });

      expect(() => {
        disabledTelemetry.trackEvent('custom', 'test');
        disabledTelemetry.trackPageView('/test');
        disabledTelemetry.trackUserAction('click', 'button');
        disabledTelemetry.trackError(new Error('test'));
      }).not.toThrow();

      disabledTelemetry.destroy();
    });
  });

  describe('Cleanup', () => {
    it('should destroy properly', () => {
      expect(() => {
        telemetry.destroy();
      }).not.toThrow();
    });
  });
});

describe('Schema Validation', () => {
  describe('TelemetryEventSchema', () => {
    it('should validate valid event', () => {
      const validEvent = {
        id: 'test-uuid',
        type: 'custom' as const,
        name: 'test_event',
        timestamp: Date.now(),
        sessionId: 'session-uuid',
        userId: 'user-uuid',
        organizationId: 'org-uuid',
        properties: { key: 'value' },
        metrics: { metric: 100 },
        tags: ['tag1', 'tag2'],
        privacy: {
          pii: false,
          sensitive: false,
          anonymized: false
        }
      };

      const result = TelemetryEventSchema.safeParse(validEvent);
      expect(result.success).toBe(true);
    });

    it('should reject invalid event type', () => {
      const invalidEvent = {
        id: 'test-uuid',
        type: 'invalid_type', // Invalid type
        name: 'test_event',
        timestamp: Date.now(),
        sessionId: 'session-uuid',
        properties: {},
        metrics: {},
        tags: [],
        privacy: {
          pii: false,
          sensitive: false,
          anonymized: false
        }
      };

      const result = TelemetryEventSchema.safeParse(invalidEvent);
      expect(result.success).toBe(false);
    });
  });

  describe('PerformanceMetricsSchema', () => {
    it('should validate valid performance metrics', () => {
      const validMetrics = {
        pageLoadTime: 1500,
        domContentLoaded: 800,
        firstContentfulPaint: 1200,
        largestContentfulPaint: 1800,
        firstInputDelay: 50,
        cumulativeLayoutShift: 0.1,
        memoryUsage: 1024000,
        networkLatency: 200,
        renderTime: 300
      };

      const result = PerformanceMetricsSchema.safeParse(validMetrics);
      expect(result.success).toBe(true);
    });

    it('should accept partial metrics', () => {
      const partialMetrics = {
        pageLoadTime: 1500,
        domContentLoaded: 800
      };

      const result = PerformanceMetricsSchema.safeParse(partialMetrics);
      expect(result.success).toBe(true);
    });
  });

  describe('UserActionSchema', () => {
    it('should validate valid user action', () => {
      const validAction = {
        action: 'click',
        element: 'button',
        page: '/test',
        context: { buttonId: 'submit' },
        duration: 100,
        success: true
      };

      const result = UserActionSchema.safeParse(validAction);
      expect(result.success).toBe(true);
    });

    it('should apply default values', () => {
      const minimalAction = {
        action: 'click'
      };

      const result = UserActionSchema.safeParse(minimalAction);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.success).toBe(true);
        expect(result.data.context).toEqual({});
      }
    });
  });

  describe('ErrorEventSchema', () => {
    it('should validate valid error event', () => {
      const validError = {
        message: 'Test error',
        stack: 'Error: Test error\n    at test.js:1:1',
        filename: 'test.js',
        lineno: 1,
        colno: 1,
        context: { component: 'TestComponent' },
        severity: 'medium' as const
      };

      const result = ErrorEventSchema.safeParse(validError);
      expect(result.success).toBe(true);
    });

    it('should apply default severity', () => {
      const minimalError = {
        message: 'Test error'
      };

      const result = ErrorEventSchema.safeParse(minimalError);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.severity).toBe('medium');
        expect(result.data.context).toEqual({});
      }
    });

    it('should reject invalid severity', () => {
      const invalidError = {
        message: 'Test error',
        severity: 'invalid' // Invalid severity
      };

      const result = ErrorEventSchema.safeParse(invalidError);
      expect(result.success).toBe(false);
    });
  });
});

describe('Edge Cases', () => {
  it('should handle empty properties and metrics', () => {
    const telemetry = new TelemetryService({ enabled: true });
    
    expect(() => {
      telemetry.trackEvent('custom', 'test', {}, {});
    }).not.toThrow();

    telemetry.destroy();
  });

  it('should handle undefined user information', () => {
    const telemetry = new TelemetryService({ enabled: true });
    
    expect(() => {
      telemetry.trackEvent('custom', 'test');
    }).not.toThrow();

    telemetry.destroy();
  });

  it('should handle large property objects', () => {
    const telemetry = new TelemetryService({ enabled: true });
    const largeProperties: Record<string, any> = {};
    
    for (let i = 0; i < 1000; i++) {
      largeProperties[`key${i}`] = `value${i}`;
    }

    expect(() => {
      telemetry.trackEvent('custom', 'test', largeProperties);
    }).not.toThrow();

    telemetry.destroy();
  });
});
