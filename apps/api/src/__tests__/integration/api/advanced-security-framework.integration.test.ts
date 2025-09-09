import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import request from 'supertest';
import { app } from '../../../index.js';

// Mock dependencies
jest.mock('@econeura/shared/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

jest.mock('@econeura/shared/metrics', () => ({
  prometheusMetrics: {
    counter: jest.fn(() => ({
      inc: jest.fn()
    })),
    histogram: jest.fn(() => ({
      observe: jest.fn()
    })),
    gauge: jest.fn(() => ({
      set: jest.fn()
    }))
  }
}));

describe('Advanced Security Framework API Integration Tests', () => {
  const baseUrl = '/v1/security-framework';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('MFA Endpoints', () => {
    describe('POST /mfa/initialize', () => {
      it('should initialize MFA successfully', async () => {
        const mfaData = {
          userId: '123e4567-e89b-12d3-a456-426614174000',
          method: 'totp'
        };

        const response = await request(app)
          .post(`${baseUrl}/mfa/initialize`)
          .send(mfaData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('qrCode');
        expect(response.body.data).toHaveProperty('backupCodes');
        expect(response.body.data.backupCodes).toHaveLength(10);
        expect(response.body.message).toBe('MFA initialized successfully');
      });

      it('should return 400 for invalid user ID', async () => {
        const mfaData = {
          userId: 'invalid-uuid',
          method: 'totp'
        };

        const response = await request(app)
          .post(`${baseUrl}/mfa/initialize`)
          .send(mfaData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBeDefined();
        expect(response.body.message).toBe('Failed to initialize MFA');
      });

      it('should return 400 for invalid method', async () => {
        const mfaData = {
          userId: '123e4567-e89b-12d3-a456-426614174000',
          method: 'invalid'
        };

        const response = await request(app)
          .post(`${baseUrl}/mfa/initialize`)
          .send(mfaData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBeDefined();
        expect(response.body.message).toBe('Failed to initialize MFA');
      });

      it('should return 400 for missing required fields', async () => {
        const mfaData = {
          userId: '123e4567-e89b-12d3-a456-426614174000'
          // missing method
        };

        const response = await request(app)
          .post(`${baseUrl}/mfa/initialize`)
          .send(mfaData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBeDefined();
      });
    });

    describe('POST /mfa/verify', () => {
      it('should verify MFA code successfully', async () => {
        const codeData = {
          userId: '123e4567-e89b-12d3-a456-426614174000',
          code: '123456',
          method: 'totp'
        };

        const response = await request(app)
          .post(`${baseUrl}/mfa/verify`)
          .send(codeData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('valid');
        expect(response.body.data).toHaveProperty('sessionToken');
        expect(response.body.message).toContain('MFA verification');
      });

      it('should return 400 for invalid user ID', async () => {
        const codeData = {
          userId: 'invalid-uuid',
          code: '123456',
          method: 'totp'
        };

        const response = await request(app)
          .post(`${baseUrl}/mfa/verify`)
          .send(codeData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBeDefined();
        expect(response.body.message).toBe('Failed to verify MFA code');
      });

      it('should return 400 for invalid code format', async () => {
        const codeData = {
          userId: '123e4567-e89b-12d3-a456-426614174000',
          code: '12345', // too short
          method: 'totp'
        };

        const response = await request(app)
          .post(`${baseUrl}/mfa/verify`)
          .send(codeData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBeDefined();
      });
    });

    describe('POST /mfa/session', () => {
      it('should create MFA session successfully', async () => {
        const sessionData = {
          userId: '123e4567-e89b-12d3-a456-426614174000',
          sessionData: { device: 'mobile' }
        };

        const response = await request(app)
          .post(`${baseUrl}/mfa/session`)
          .send(sessionData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('sessionId');
        expect(response.body.message).toBe('MFA session created successfully');
      });

      it('should return 400 for missing user ID', async () => {
        const sessionData = {
          sessionData: { device: 'mobile' }
          // missing userId
        };

        const response = await request(app)
          .post(`${baseUrl}/mfa/session`)
          .send(sessionData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('User ID is required');
        expect(response.body.message).toBe('Failed to create MFA session');
      });
    });
  });

  describe('RBAC Endpoints', () => {
    describe('POST /rbac/check-permission', () => {
      it('should check permission successfully', async () => {
        const permissionData = {
          userId: '123e4567-e89b-12d3-a456-426614174000',
          resource: 'users',
          action: 'read'
        };

        const response = await request(app)
          .post(`${baseUrl}/rbac/check-permission`)
          .send(permissionData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('allowed');
        expect(response.body.message).toContain('Permission');
      });

      it('should return 400 for invalid user ID', async () => {
        const permissionData = {
          userId: 'invalid-uuid',
          resource: 'users',
          action: 'read'
        };

        const response = await request(app)
          .post(`${baseUrl}/rbac/check-permission`)
          .send(permissionData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBeDefined();
        expect(response.body.message).toBe('Failed to check permission');
      });

      it('should return 400 for missing required fields', async () => {
        const permissionData = {
          userId: '123e4567-e89b-12d3-a456-426614174000'
          // missing resource and action
        };

        const response = await request(app)
          .post(`${baseUrl}/rbac/check-permission`)
          .send(permissionData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBeDefined();
      });
    });

    describe('POST /rbac/assign-role', () => {
      it('should assign role successfully', async () => {
        const roleData = {
          userId: '123e4567-e89b-12d3-a456-426614174000',
          role: 'manager',
          assignedBy: '456e7890-e89b-12d3-a456-426614174000'
        };

        const response = await request(app)
          .post(`${baseUrl}/rbac/assign-role`)
          .send(roleData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('success');
        expect(response.body.message).toBe('Role assigned successfully');
      });

      it('should return 400 for invalid user ID', async () => {
        const roleData = {
          userId: 'invalid-uuid',
          role: 'manager',
          assignedBy: '456e7890-e89b-12d3-a456-426614174000'
        };

        const response = await request(app)
          .post(`${baseUrl}/rbac/assign-role`)
          .send(roleData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBeDefined();
        expect(response.body.message).toBe('Failed to assign role');
      });
    });
  });

  describe('CSRF Endpoints', () => {
    describe('GET /csrf/generate', () => {
      it('should generate CSRF token successfully', async () => {
        const response = await request(app)
          .get(`${baseUrl}/csrf/generate`)
          .query({ sessionId: 'session_123' })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('token');
        expect(response.body.data.token).toHaveLength(32);
        expect(response.body.message).toBe('CSRF token generated successfully');
      });

      it('should return 400 for missing session ID', async () => {
        const response = await request(app)
          .get(`${baseUrl}/csrf/generate`)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Session ID is required');
        expect(response.body.message).toBe('Failed to generate CSRF token');
      });
    });

    describe('POST /csrf/verify', () => {
      it('should verify CSRF token successfully', async () => {
        const tokenData = {
          sessionId: 'session_123',
          token: 'valid_token_12345678901234567890'
        };

        const response = await request(app)
          .post(`${baseUrl}/csrf/verify`)
          .send(tokenData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('valid');
        expect(response.body.message).toContain('CSRF token');
      });

      it('should return 400 for invalid token format', async () => {
        const tokenData = {
          sessionId: 'session_123',
          token: 'short' // too short
        };

        const response = await request(app)
          .post(`${baseUrl}/csrf/verify`)
          .send(tokenData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBeDefined();
      });
    });
  });

  describe('Input Sanitization Endpoints', () => {
    describe('POST /sanitize', () => {
      it('should sanitize clean input successfully', async () => {
        const inputData = {
          input: 'Hello, world!',
          type: 'general'
        };

        const response = await request(app)
          .post(`${baseUrl}/sanitize`)
          .send(inputData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('sanitized');
        expect(response.body.data).toHaveProperty('threats');
        expect(response.body.data.sanitized).toBe('Hello, world!');
        expect(response.body.data.threats).toHaveLength(0);
        expect(response.body.message).toBe('Input sanitized successfully');
      });

      it('should detect and sanitize malicious input', async () => {
        const inputData = {
          input: '<script>alert("xss")</script>Hello',
          type: 'html'
        };

        const response = await request(app)
          .post(`${baseUrl}/sanitize`)
          .send(inputData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('sanitized');
        expect(response.body.data).toHaveProperty('threats');
        expect(response.body.data.sanitized).not.toContain('<script>');
        expect(response.body.data.threats.length).toBeGreaterThan(0);
      });

      it('should return 400 for missing input', async () => {
        const inputData = {
          type: 'general'
          // missing input
        };

        const response = await request(app)
          .post(`${baseUrl}/sanitize`)
          .send(inputData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBeDefined();
      });
    });
  });

  describe('Threat Detection Endpoints', () => {
    describe('POST /threats/detect', () => {
      it('should detect no threats for clean request', async () => {
        const threatData = {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          request: { path: '/api/users', method: 'GET' },
          riskFactors: []
        };

        const response = await request(app)
          .post(`${baseUrl}/threats/detect`)
          .send(threatData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('threats');
        expect(response.body.data).toHaveProperty('riskScore');
        expect(response.body.data).toHaveProperty('blocked');
        expect(response.body.data.threats).toHaveLength(0);
        expect(response.body.data.riskScore).toBe(0);
        expect(response.body.data.blocked).toBe(false);
        expect(response.body.message).toBe('Threats detected');
      });

      it('should detect bot traffic', async () => {
        const threatData = {
          ipAddress: '192.168.1.1',
          userAgent: 'Googlebot/2.1',
          request: { path: '/api/users', method: 'GET' },
          riskFactors: []
        };

        const response = await request(app)
          .post(`${baseUrl}/threats/detect`)
          .send(threatData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.threats).toContain('Bot traffic detected');
        expect(response.body.data.riskScore).toBeGreaterThan(0);
      });

      it('should return 400 for invalid IP address', async () => {
        const threatData = {
          ipAddress: 'invalid-ip',
          userAgent: 'Mozilla/5.0',
          request: { path: '/api/users', method: 'GET' },
          riskFactors: []
        };

        const response = await request(app)
          .post(`${baseUrl}/threats/detect`)
          .send(threatData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBeDefined();
        expect(response.body.message).toBe('Failed to detect threats');
      });
    });
  });

  describe('Compliance Endpoints', () => {
    describe('POST /compliance/check', () => {
      it('should check GDPR compliance successfully', async () => {
        const complianceData = {
          organizationId: '123e4567-e89b-12d3-a456-426614174000',
          complianceType: 'gdpr'
        };

        const response = await request(app)
          .post(`${baseUrl}/compliance/check`)
          .send(complianceData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('compliant');
        expect(response.body.data).toHaveProperty('violations');
        expect(response.body.data).toHaveProperty('score');
        expect(response.body.data.score).toBeGreaterThanOrEqual(0);
        expect(response.body.data.score).toBeLessThanOrEqual(100);
        expect(response.body.message).toContain('Compliance check');
      });

      it('should check SOX compliance successfully', async () => {
        const complianceData = {
          organizationId: '123e4567-e89b-12d3-a456-426614174000',
          complianceType: 'sox'
        };

        const response = await request(app)
          .post(`${baseUrl}/compliance/check`)
          .send(complianceData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('compliant');
        expect(response.body.data).toHaveProperty('violations');
        expect(response.body.data).toHaveProperty('score');
      });

      it('should return 400 for invalid organization ID', async () => {
        const complianceData = {
          organizationId: 'invalid-uuid',
          complianceType: 'gdpr'
        };

        const response = await request(app)
          .post(`${baseUrl}/compliance/check`)
          .send(complianceData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBeDefined();
        expect(response.body.message).toBe('Failed to check compliance');
      });

      it('should return 400 for invalid compliance type', async () => {
        const complianceData = {
          organizationId: '123e4567-e89b-12d3-a456-426614174000',
          complianceType: 'invalid'
        };

        const response = await request(app)
          .post(`${baseUrl}/compliance/check`)
          .send(complianceData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBeDefined();
      });
    });
  });

  describe('Metrics and Monitoring Endpoints', () => {
    describe('GET /metrics', () => {
      it('should return security metrics successfully', async () => {
        const response = await request(app)
          .get(`${baseUrl}/metrics`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('authentication');
        expect(response.body.data).toHaveProperty('authorization');
        expect(response.body.data).toHaveProperty('threats');
        expect(response.body.data).toHaveProperty('compliance');
        expect(response.body.data).toHaveProperty('performance');
        expect(response.body.message).toBe('Security metrics retrieved successfully');
      });
    });

    describe('GET /health', () => {
      it('should return health status successfully', async () => {
        const response = await request(app)
          .get(`${baseUrl}/health`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('status');
        expect(response.body.data).toHaveProperty('services');
        expect(response.body.data).toHaveProperty('lastCheck');
        expect(response.body.data.status).toMatch(/^(healthy|degraded)$/);
        expect(response.body.data.services).toHaveProperty('database');
        expect(response.body.data.services).toHaveProperty('mfa');
        expect(response.body.data.services).toHaveProperty('csrf');
        expect(response.body.data.services).toHaveProperty('threatDetection');
        expect(response.body.data.services).toHaveProperty('compliance');
        expect(response.body.message).toBe('Health check completed');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for non-existent endpoints', async () => {
      const response = await request(app)
        .get(`${baseUrl}/non-existent`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post(`${baseUrl}/mfa/initialize`)
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle empty request body', async () => {
      const response = await request(app)
        .post(`${baseUrl}/mfa/initialize`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('Security Headers', () => {
    it('should include security headers in responses', async () => {
      const response = await request(app)
        .get(`${baseUrl}/health`)
        .expect(200);

      // Check for common security headers
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-xss-protection');
    });
  });

  describe('Rate Limiting', () => {
    it('should handle multiple requests', async () => {
      const requests = Array.from({ length: 5 }, () =>
        request(app)
          .get(`${baseUrl}/health`)
          .expect(200)
      );

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect(response.body.success).toBe(true);
      });
    });
  });
});