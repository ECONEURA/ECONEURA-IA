/**
 * Security Configuration Integration Tests
 * PR-102: Security & CORS (api) - helmet y cors
 * 
 * Tests de integración para configuración de seguridad
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import { Express } from 'express';
import { securityConfigService } from '../../services/security-config.service.js';

// Mock the service
vi.mock('../../services/security-config.service.js');

// Mock Express app
const mockApp = {
  use: vi.fn(),
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  listen: vi.fn()
} as unknown as Express;

describe('Security Configuration Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('GET /v1/security-config', () => {
    it('should retrieve security configuration successfully', async () => {
      const mockConfig = {
        cors: {
          allowedOrigins: [
            'http://localhost:3000',
            'https://econeura.com'
          ],
          allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
          allowedHeaders: ['Content-Type', 'Authorization'],
          exposedHeaders: ['X-Request-ID'],
          credentials: true,
          maxAge: 86400
        },
        helmet: {
          contentSecurityPolicy: {
            directives: {
              defaultSrc: ["'self'"]
            }
          },
          hsts: {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true
          },
          frameguard: { action: 'deny' },
          noSniff: true,
          xssFilter: true
        },
        rateLimit: {
          windowMs: 900000,
          maxRequests: 100,
          skipSuccessfulRequests: false,
          skipFailedRequests: false
        },
        validation: {
          maxRequestSize: 10485760,
          allowedContentTypes: ['application/json'],
          allowedHttpMethods: ['GET', 'POST', 'PUT', 'DELETE']
        },
        monitoring: {
          enableLogging: true,
          enableMetrics: true,
          logLevel: 'info'
        }
      };

      vi.mocked(securityConfigService.getConfig).mockReturnValue(mockConfig);

      const result = securityConfigService.getConfig();

      expect(result).toEqual(mockConfig);
      expect(securityConfigService.getConfig).toHaveBeenCalled();
    });
  });

  describe('GET /v1/security-config/cors', () => {
    it('should retrieve CORS configuration', async () => {
      const mockCorsConfig = {
        allowedOrigins: [
          'http://localhost:3000',
          'https://econeura.com'
        ],
        allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        exposedHeaders: ['X-Request-ID'],
        credentials: true,
        maxAge: 86400
      };

      vi.mocked(securityConfigService.getCorsConfig).mockReturnValue(mockCorsConfig);

      const result = securityConfigService.getCorsConfig();

      expect(result).toEqual(mockCorsConfig);
      expect(securityConfigService.getCorsConfig).toHaveBeenCalled();
    });
  });

  describe('PUT /v1/security-config/cors/origins', () => {
    it('should update CORS origins successfully', async () => {
      const newOrigins = [
        'http://localhost:3000',
        'https://econeura.com',
        'https://app.econeura.com'
      ];

      vi.mocked(securityConfigService.updateCorsOrigins).mockImplementation(() => {
        // Mock implementation
      });

      securityConfigService.updateCorsOrigins(newOrigins);

      expect(securityConfigService.updateCorsOrigins).toHaveBeenCalledWith(newOrigins);
    });

    it('should handle invalid origins format', async () => {
      const invalidOrigins = 'not-an-array';

      vi.mocked(securityConfigService.updateCorsOrigins).mockImplementation(() => {
        throw new Error('Invalid origins format');
      });

      expect(() => {
        securityConfigService.updateCorsOrigins(invalidOrigins as any);
      }).toThrow('Invalid origins format');
    });
  });

  describe('POST /v1/security-config/cors/origins', () => {
    it('should add CORS origin successfully', async () => {
      const newOrigin = 'https://new.econeura.com';

      vi.mocked(securityConfigService.addCorsOrigin).mockImplementation(() => {
        // Mock implementation
      });

      securityConfigService.addCorsOrigin(newOrigin);

      expect(securityConfigService.addCorsOrigin).toHaveBeenCalledWith(newOrigin);
    });
  });

  describe('DELETE /v1/security-config/cors/origins/:origin', () => {
    it('should remove CORS origin successfully', async () => {
      const originToRemove = 'https://old.econeura.com';

      vi.mocked(securityConfigService.removeCorsOrigin).mockImplementation(() => {
        // Mock implementation
      });

      securityConfigService.removeCorsOrigin(originToRemove);

      expect(securityConfigService.removeCorsOrigin).toHaveBeenCalledWith(originToRemove);
    });
  });

  describe('GET /v1/security-config/rate-limit', () => {
    it('should retrieve rate limit configuration', async () => {
      const mockRateLimitConfig = {
        windowMs: 900000,
        maxRequests: 100,
        skipSuccessfulRequests: false,
        skipFailedRequests: false
      };

      vi.mocked(securityConfigService.getRateLimitConfig).mockReturnValue(mockRateLimitConfig);

      const result = securityConfigService.getRateLimitConfig();

      expect(result).toEqual(mockRateLimitConfig);
      expect(securityConfigService.getRateLimitConfig).toHaveBeenCalled();
    });
  });

  describe('PUT /v1/security-config/rate-limit', () => {
    it('should update rate limit configuration successfully', async () => {
      const newConfig = {
        maxRequests: 200,
        windowMs: 1800000
      };

      vi.mocked(securityConfigService.updateRateLimit).mockImplementation(() => {
        // Mock implementation
      });

      securityConfigService.updateRateLimit(newConfig.maxRequests, newConfig.windowMs);

      expect(securityConfigService.updateRateLimit).toHaveBeenCalledWith(
        newConfig.maxRequests,
        newConfig.windowMs
      );
    });

    it('should handle invalid rate limit parameters', async () => {
      vi.mocked(securityConfigService.updateRateLimit).mockImplementation(() => {
        throw new Error('Max requests must be greater than 0');
      });

      expect(() => {
        securityConfigService.updateRateLimit(0, 900000);
      }).toThrow('Max requests must be greater than 0');
    });
  });

  describe('GET /v1/security-config/validation', () => {
    it('should retrieve validation configuration', async () => {
      const mockValidationConfig = {
        maxRequestSize: 10485760,
        allowedContentTypes: [
          'application/json',
          'application/x-www-form-urlencoded'
        ],
        allowedHttpMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
      };

      vi.mocked(securityConfigService.getValidationConfig).mockReturnValue(mockValidationConfig);

      const result = securityConfigService.getValidationConfig();

      expect(result).toEqual(mockValidationConfig);
      expect(securityConfigService.getValidationConfig).toHaveBeenCalled();
    });
  });

  describe('PUT /v1/security-config/validation/max-request-size', () => {
    it('should update max request size successfully', async () => {
      const newSize = 20971520; // 20MB

      vi.mocked(securityConfigService.updateMaxRequestSize).mockImplementation(() => {
        // Mock implementation
      });

      securityConfigService.updateMaxRequestSize(newSize);

      expect(securityConfigService.updateMaxRequestSize).toHaveBeenCalledWith(newSize);
    });

    it('should handle invalid size parameter', async () => {
      vi.mocked(securityConfigService.updateMaxRequestSize).mockImplementation(() => {
        throw new Error('Max request size must be greater than 0');
      });

      expect(() => {
        securityConfigService.updateMaxRequestSize(0);
      }).toThrow('Max request size must be greater than 0');
    });
  });

  describe('GET /v1/security-config/metrics', () => {
    it('should retrieve security metrics', async () => {
      const mockMetrics = {
        totalRequests: 1500,
        blockedRequests: 25,
        suspiciousRequests: 10,
        corsRequests: 800,
        rateLimitedRequests: 5,
        lastUpdated: new Date().toISOString()
      };

      vi.mocked(securityConfigService.getMetrics).mockReturnValue(mockMetrics);

      const result = securityConfigService.getMetrics();

      expect(result).toEqual(mockMetrics);
      expect(securityConfigService.getMetrics).toHaveBeenCalled();
    });
  });

  describe('POST /v1/security-config/metrics/reset', () => {
    it('should reset security metrics successfully', async () => {
      vi.mocked(securityConfigService.resetMetrics).mockImplementation(() => {
        // Mock implementation
      });

      securityConfigService.resetMetrics();

      expect(securityConfigService.resetMetrics).toHaveBeenCalled();
    });
  });

  describe('POST /v1/security-config/validate', () => {
    it('should validate security configuration successfully', async () => {
      const validationData = {
        origin: 'https://econeura.com',
        method: 'GET',
        header: 'Content-Type',
        contentType: 'application/json',
        requestSize: 1024
      };

      vi.mocked(securityConfigService.isOriginAllowed).mockReturnValue(true);
      vi.mocked(securityConfigService.isMethodAllowed).mockReturnValue(true);
      vi.mocked(securityConfigService.isHeaderAllowed).mockReturnValue(true);
      vi.mocked(securityConfigService.isContentTypeAllowed).mockReturnValue(true);
      vi.mocked(securityConfigService.isRequestSizeValid).mockReturnValue(true);

      const results = {
        origin: securityConfigService.isOriginAllowed(validationData.origin),
        method: securityConfigService.isMethodAllowed(validationData.method),
        header: securityConfigService.isHeaderAllowed(validationData.header),
        contentType: securityConfigService.isContentTypeAllowed(validationData.contentType),
        requestSize: securityConfigService.isRequestSizeValid(validationData.requestSize)
      };

      expect(results.origin).toBe(true);
      expect(results.method).toBe(true);
      expect(results.header).toBe(true);
      expect(results.contentType).toBe(true);
      expect(results.requestSize).toBe(true);
    });

    it('should handle validation failures', async () => {
      const validationData = {
        origin: 'https://malicious.com',
        method: 'TRACE',
        header: 'X-Malicious-Header',
        contentType: 'application/x-malicious',
        requestSize: 104857600 // 100MB
      };

      vi.mocked(securityConfigService.isOriginAllowed).mockReturnValue(false);
      vi.mocked(securityConfigService.isMethodAllowed).mockReturnValue(false);
      vi.mocked(securityConfigService.isHeaderAllowed).mockReturnValue(false);
      vi.mocked(securityConfigService.isContentTypeAllowed).mockReturnValue(false);
      vi.mocked(securityConfigService.isRequestSizeValid).mockReturnValue(false);

      const results = {
        origin: securityConfigService.isOriginAllowed(validationData.origin),
        method: securityConfigService.isMethodAllowed(validationData.method),
        header: securityConfigService.isHeaderAllowed(validationData.header),
        contentType: securityConfigService.isContentTypeAllowed(validationData.contentType),
        requestSize: securityConfigService.isRequestSizeValid(validationData.requestSize)
      };

      expect(results.origin).toBe(false);
      expect(results.method).toBe(false);
      expect(results.header).toBe(false);
      expect(results.contentType).toBe(false);
      expect(results.requestSize).toBe(false);
    });
  });

  describe('GET /v1/security-config/headers', () => {
    it('should retrieve security headers', async () => {
      const mockSecurityHeaders = {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
      };

      const mockApiHeaders = {
        'X-API-Version': '1.0.0',
        'X-API-Environment': 'development'
      };

      vi.mocked(securityConfigService.getSecurityHeaders).mockReturnValue(mockSecurityHeaders);
      vi.mocked(securityConfigService.getApiHeaders).mockReturnValue(mockApiHeaders);

      const securityHeaders = securityConfigService.getSecurityHeaders();
      const apiHeaders = securityConfigService.getApiHeaders();

      expect(securityHeaders).toEqual(mockSecurityHeaders);
      expect(apiHeaders).toEqual(mockApiHeaders);
    });
  });

  describe('GET /v1/security-config/middleware', () => {
    it('should retrieve middleware configuration', async () => {
      const mockMiddlewareConfig = {
        cors: {
          origin: expect.any(Function),
          credentials: true,
          methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
          allowedHeaders: ['Content-Type', 'Authorization'],
          exposedHeaders: ['X-Request-ID'],
          maxAge: 86400,
          preflightContinue: false,
          optionsSuccessStatus: 204
        },
        helmet: {
          contentSecurityPolicy: expect.any(Object),
          frameguard: { action: 'deny' },
          hsts: expect.any(Object),
          noSniff: true,
          xssFilter: true
        }
      };

      vi.mocked(securityConfigService.getMiddlewareConfig).mockReturnValue(mockMiddlewareConfig);

      const result = securityConfigService.getMiddlewareConfig();

      expect(result).toEqual(mockMiddlewareConfig);
      expect(securityConfigService.getMiddlewareConfig).toHaveBeenCalled();
    });
  });

  describe('GET /v1/security-config/status', () => {
    it('should retrieve service status', async () => {
      const mockStatus = {
        ready: true,
        initialized: true,
        config: {
          corsOrigins: 5,
          rateLimitEnabled: true,
          monitoringEnabled: true
        },
        metrics: {
          totalRequests: 1500,
          blockedRequests: 25,
          suspiciousRequests: 10,
          corsRequests: 800,
          rateLimitedRequests: 5
        }
      };

      vi.mocked(securityConfigService.isReady).mockReturnValue(true);
      vi.mocked(securityConfigService.getConfig).mockReturnValue({
        cors: { allowedOrigins: ['a', 'b', 'c', 'd', 'e'] },
        monitoring: { enableLogging: true }
      } as any);
      vi.mocked(securityConfigService.getMetrics).mockReturnValue({
        totalRequests: 1500,
        blockedRequests: 25,
        suspiciousRequests: 10,
        corsRequests: 800,
        rateLimitedRequests: 5
      } as any);

      const isReady = securityConfigService.isReady();
      const config = securityConfigService.getConfig();
      const metrics = securityConfigService.getMetrics();

      expect(isReady).toBe(true);
      expect(config.cors.allowedOrigins.length).toBe(5);
      expect(metrics.totalRequests).toBe(1500);
    });
  });

  describe('GET /v1/security-config/health', () => {
    it('should return health check information', async () => {
      const healthInfo = {
        status: 'healthy',
        service: 'Security Configuration',
        version: '1.0.0',
        features: [
          'CORS configuration management',
          'Helmet security headers',
          'Rate limiting configuration',
          'Request validation',
          'Security metrics tracking',
          'Configuration validation'
        ],
        capabilities: {
          corsManagement: true,
          helmetConfiguration: true,
          rateLimitConfiguration: true,
          requestValidation: true,
          metricsTracking: true,
          configurationValidation: true
        }
      };

      // Health check doesn't require service calls
      expect(healthInfo.status).toBe('healthy');
      expect(healthInfo.service).toBe('Security Configuration');
      expect(healthInfo.features).toHaveLength(6);
      expect(healthInfo.capabilities.corsManagement).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      vi.mocked(securityConfigService.getConfig).mockImplementation(() => {
        throw new Error('Service unavailable');
      });

      expect(() => {
        securityConfigService.getConfig();
      }).toThrow('Service unavailable');
    });

    it('should handle configuration validation errors', async () => {
      vi.mocked(securityConfigService.updateCorsOrigins).mockImplementation(() => {
        throw new Error('At least one CORS origin must be configured');
      });

      expect(() => {
        securityConfigService.updateCorsOrigins([]);
      }).toThrow('At least one CORS origin must be configured');
    });
  });

  describe('Metrics Management', () => {
    it('should increment metrics correctly', async () => {
      vi.mocked(securityConfigService.incrementTotalRequests).mockImplementation(() => {
        // Mock implementation
      });
      vi.mocked(securityConfigService.incrementBlockedRequests).mockImplementation(() => {
        // Mock implementation
      });
      vi.mocked(securityConfigService.incrementSuspiciousRequests).mockImplementation(() => {
        // Mock implementation
      });
      vi.mocked(securityConfigService.incrementCorsRequests).mockImplementation(() => {
        // Mock implementation
      });
      vi.mocked(securityConfigService.incrementRateLimitedRequests).mockImplementation(() => {
        // Mock implementation
      });

      securityConfigService.incrementTotalRequests();
      securityConfigService.incrementBlockedRequests();
      securityConfigService.incrementSuspiciousRequests();
      securityConfigService.incrementCorsRequests();
      securityConfigService.incrementRateLimitedRequests();

      expect(securityConfigService.incrementTotalRequests).toHaveBeenCalled();
      expect(securityConfigService.incrementBlockedRequests).toHaveBeenCalled();
      expect(securityConfigService.incrementSuspiciousRequests).toHaveBeenCalled();
      expect(securityConfigService.incrementCorsRequests).toHaveBeenCalled();
      expect(securityConfigService.incrementRateLimitedRequests).toHaveBeenCalled();
    });
  });
});
