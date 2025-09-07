/**
 * PR-28: Advanced Security Framework - Integration Tests
 * 
 * Pruebas de integración para el sistema consolidado de seguridad:
 * - Autenticación multi-factor (MFA)
 * - Autorización basada en roles (RBAC)
 * - Protección CSRF
 * - Sanitización de entrada
 * - Detección de amenazas
 * - Compliance y auditoría
 * - Métricas de seguridad
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import advancedSecurityFrameworkRouter from '../../../routes/advanced-security-framework.js';

const app = express();
app.use(express.json());
app.use('/v1/security-framework', advancedSecurityFrameworkRouter);

describe('Advanced Security Framework API Integration Tests', () => {
  describe('MFA (Multi-Factor Authentication)', () => {
    describe('POST /v1/security-framework/mfa/initialize', () => {
      it('should initialize MFA for a user', async () => {
        const requestData = {
          userId: '123e4567-e89b-12d3-a456-426614174000'
        };

        const response = await request(app)
          .post('/v1/security-framework/mfa/initialize')
          .send(requestData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.secret).toBeDefined();
        expect(response.body.data.qrCode).toBeDefined();
        expect(response.body.data.backupCodes).toBeDefined();
        expect(response.body.data.backupCodes).toHaveLength(10);
        expect(response.body.timestamp).toBeDefined();
      });

      it('should validate request data', async () => {
        const invalidRequest = {
          userId: 'invalid-uuid'
        };

        const response = await request(app)
          .post('/v1/security-framework/mfa/initialize')
          .send(invalidRequest)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Invalid request data');
        expect(response.body.details).toBeDefined();
      });

      it('should require userId parameter', async () => {
        const requestData = {};

        const response = await request(app)
          .post('/v1/security-framework/mfa/initialize')
          .send(requestData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Invalid request data');
      });
    });

    describe('POST /v1/security-framework/mfa/verify', () => {
      it('should verify MFA code', async () => {
        const requestData = {
          userId: '123e4567-e89b-12d3-a456-426614174000',
          code: '123456',
          method: 'totp'
        };

        const response = await request(app)
          .post('/v1/security-framework/mfa/verify')
          .send(requestData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.isValid).toBeDefined();
        expect(typeof response.body.data.isValid).toBe('boolean');
      });

      it('should validate MFA verification data', async () => {
        const invalidRequest = {
          userId: 'invalid-uuid',
          code: '123',
          method: 'invalid'
        };

        const response = await request(app)
          .post('/v1/security-framework/mfa/verify')
          .send(invalidRequest)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Invalid request data');
      });
    });

    describe('POST /v1/security-framework/mfa/session', () => {
      it('should create MFA session', async () => {
        const requestData = {
          userId: '123e4567-e89b-12d3-a456-426614174000',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        };

        const response = await request(app)
          .post('/v1/security-framework/mfa/session')
          .send(requestData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.userId).toBe(requestData.userId);
        expect(response.body.data.sessionId).toBeDefined();
        expect(response.body.data.ipAddress).toBe(requestData.ipAddress);
        expect(response.body.data.userAgent).toBe(requestData.userAgent);
        expect(response.body.data.expiresAt).toBeDefined();
        expect(response.body.data.riskScore).toBeDefined();
      });

      it('should validate MFA session data', async () => {
        const invalidRequest = {
          userId: 'invalid-uuid',
          ipAddress: 'invalid-ip',
          userAgent: ''
        };

        const response = await request(app)
          .post('/v1/security-framework/mfa/session')
          .send(invalidRequest)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Invalid request data');
      });
    });
  });

  describe('RBAC (Role-Based Access Control)', () => {
    describe('POST /v1/security-framework/rbac/check-permission', () => {
      it('should check user permission', async () => {
        const requestData = {
          userId: '123e4567-e89b-12d3-a456-426614174000',
          resource: 'users',
          action: 'read'
        };

        const response = await request(app)
          .post('/v1/security-framework/rbac/check-permission')
          .send(requestData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.hasPermission).toBeDefined();
        expect(typeof response.body.data.hasPermission).toBe('boolean');
      });

      it('should check user permission with context', async () => {
        const requestData = {
          userId: '123e4567-e89b-12d3-a456-426614174000',
          resource: 'users',
          action: 'read',
          context: { organizationId: 'org-123' }
        };

        const response = await request(app)
          .post('/v1/security-framework/rbac/check-permission')
          .send(requestData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.hasPermission).toBeDefined();
      });

      it('should validate permission check data', async () => {
        const invalidRequest = {
          userId: 'invalid-uuid',
          resource: '',
          action: ''
        };

        const response = await request(app)
          .post('/v1/security-framework/rbac/check-permission')
          .send(invalidRequest)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Invalid request data');
      });
    });

    describe('POST /v1/security-framework/rbac/assign-role', () => {
      it('should assign role to user', async () => {
        const requestData = {
          userId: '123e4567-e89b-12d3-a456-426614174000',
          roleId: '456e7890-e89b-12d3-a456-426614174001',
          assignedBy: '789e0123-e89b-12d3-a456-426614174002'
        };

        const response = await request(app)
          .post('/v1/security-framework/rbac/assign-role')
          .send(requestData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Role assigned successfully');
      });

      it('should validate role assignment data', async () => {
        const invalidRequest = {
          userId: 'invalid-uuid',
          roleId: 'invalid-uuid',
          assignedBy: 'invalid-uuid'
        };

        const response = await request(app)
          .post('/v1/security-framework/rbac/assign-role')
          .send(invalidRequest)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Invalid request data');
      });
    });
  });

  describe('CSRF Protection', () => {
    describe('GET /v1/security-framework/csrf/generate', () => {
      it('should generate CSRF token', async () => {
        const response = await request(app)
          .get('/v1/security-framework/csrf/generate')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.token).toBeDefined();
        expect(typeof response.body.data.token).toBe('string');
        expect(response.body.data.token.length).toBeGreaterThan(0);
      });
    });

    describe('POST /v1/security-framework/csrf/verify', () => {
      it('should verify CSRF token', async () => {
        const requestData = {
          token: 'valid-token',
          sessionToken: 'valid-token'
        };

        const response = await request(app)
          .post('/v1/security-framework/csrf/verify')
          .send(requestData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.isValid).toBeDefined();
        expect(typeof response.body.data.isValid).toBe('boolean');
      });

      it('should validate CSRF verification data', async () => {
        const invalidRequest = {
          token: '',
          sessionToken: ''
        };

        const response = await request(app)
          .post('/v1/security-framework/csrf/verify')
          .send(invalidRequest)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Invalid request data');
      });
    });
  });

  describe('Input Sanitization', () => {
    describe('POST /v1/security-framework/sanitize', () => {
      it('should sanitize string input', async () => {
        const requestData = {
          input: '<script>alert("xss")</script>'
        };

        const response = await request(app)
          .post('/v1/security-framework/sanitize')
          .send(requestData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.sanitizedInput).toBeDefined();
        expect(response.body.data.sanitizedInput).not.toContain('<script>');
      });

      it('should sanitize object input', async () => {
        const requestData = {
          input: {
            name: '<script>alert("xss")</script>',
            email: 'test@example.com',
            description: 'Safe content'
          }
        };

        const response = await request(app)
          .post('/v1/security-framework/sanitize')
          .send(requestData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.sanitizedInput).toBeDefined();
        expect(response.body.data.sanitizedInput.name).not.toContain('<script>');
        expect(response.body.data.sanitizedInput.email).toBe('test@example.com');
      });

      it('should reject blocked patterns', async () => {
        const requestData = {
          input: 'javascript:alert("xss")'
        };

        const response = await request(app)
          .post('/v1/security-framework/sanitize')
          .send(requestData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Blocked pattern detected');
      });

      it('should validate sanitization request', async () => {
        const invalidRequest = {};

        const response = await request(app)
          .post('/v1/security-framework/sanitize')
          .send(invalidRequest)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Invalid request data');
      });
    });
  });

  describe('Threat Detection', () => {
    describe('POST /v1/security-framework/threats/detect', () => {
      it('should detect threats in request', async () => {
        const requestData = {
          request: { query: "'; DROP TABLE users; --" },
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        };

        const response = await request(app)
          .post('/v1/security-framework/threats/detect')
          .send(requestData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.isThreat).toBeDefined();
        expect(typeof response.body.data.isThreat).toBe('boolean');
        expect(response.body.data.riskScore).toBeDefined();
        expect(typeof response.body.data.riskScore).toBe('number');
        expect(response.body.data.threats).toBeDefined();
        expect(Array.isArray(response.body.data.threats)).toBe(true);
      });

      it('should detect suspicious user agent', async () => {
        const requestData = {
          request: { data: 'normal data' },
          ipAddress: '192.168.1.1',
          userAgent: 'curl/7.68.0'
        };

        const response = await request(app)
          .post('/v1/security-framework/threats/detect')
          .send(requestData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.isThreat).toBeDefined();
        expect(response.body.data.threats).toContain('suspicious_user_agent');
      });

      it('should not detect threats in normal request', async () => {
        const requestData = {
          request: { data: 'normal data' },
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        };

        const response = await request(app)
          .post('/v1/security-framework/threats/detect')
          .send(requestData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.isThreat).toBe(false);
        expect(response.body.data.riskScore).toBe(0);
        expect(response.body.data.threats).toHaveLength(0);
      });

      it('should validate threat detection request', async () => {
        const invalidRequest = {
          request: 'invalid',
          ipAddress: 'invalid-ip',
          userAgent: ''
        };

        const response = await request(app)
          .post('/v1/security-framework/threats/detect')
          .send(invalidRequest)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Invalid request data');
      });
    });
  });

  describe('Compliance', () => {
    describe('POST /v1/security-framework/compliance/check', () => {
      it('should check compliance', async () => {
        const requestData = {
          userId: '123e4567-e89b-12d3-a456-426614174000',
          action: 'read',
          resource: 'users',
          data: { userId: '456e7890-e89b-12d3-a456-426614174001' }
        };

        const response = await request(app)
          .post('/v1/security-framework/compliance/check')
          .send(requestData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.compliant).toBeDefined();
        expect(typeof response.body.data.compliant).toBe('boolean');
        expect(response.body.data.violations).toBeDefined();
        expect(Array.isArray(response.body.data.violations)).toBe(true);
      });

      it('should check compliance without data', async () => {
        const requestData = {
          userId: '123e4567-e89b-12d3-a456-426614174000',
          action: 'read',
          resource: 'users'
        };

        const response = await request(app)
          .post('/v1/security-framework/compliance/check')
          .send(requestData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.compliant).toBeDefined();
        expect(response.body.data.violations).toBeDefined();
      });

      it('should validate compliance check request', async () => {
        const invalidRequest = {
          userId: 'invalid-uuid',
          action: '',
          resource: ''
        };

        const response = await request(app)
          .post('/v1/security-framework/compliance/check')
          .send(invalidRequest)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Invalid request data');
      });
    });
  });

  describe('Security Metrics', () => {
    describe('GET /v1/security-framework/metrics', () => {
      it('should get security metrics', async () => {
        const response = await request(app)
          .get('/v1/security-framework/metrics')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.authentication).toBeDefined();
        expect(response.body.data.authorization).toBeDefined();
        expect(response.body.data.threats).toBeDefined();
        expect(response.body.data.compliance).toBeDefined();
        expect(response.body.data.performance).toBeDefined();
      });

      it('should have correct metrics structure', async () => {
        const response = await request(app)
          .get('/v1/security-framework/metrics')
          .expect(200);

        const metrics = response.body.data;

        // Authentication metrics
        expect(metrics.authentication.totalLogins).toBeDefined();
        expect(metrics.authentication.successfulLogins).toBeDefined();
        expect(metrics.authentication.failedLogins).toBeDefined();
        expect(metrics.authentication.mfaCompletions).toBeDefined();
        expect(metrics.authentication.mfaFailures).toBeDefined();

        // Authorization metrics
        expect(metrics.authorization.permissionChecks).toBeDefined();
        expect(metrics.authorization.deniedAccess).toBeDefined();
        expect(metrics.authorization.roleAssignments).toBeDefined();
        expect(metrics.authorization.permissionGrants).toBeDefined();

        // Threat metrics
        expect(metrics.threats.detectedThreats).toBeDefined();
        expect(metrics.threats.blockedIPs).toBeDefined();
        expect(metrics.threats.suspiciousActivities).toBeDefined();
        expect(metrics.threats.csrfAttacks).toBeDefined();

        // Compliance metrics
        expect(metrics.compliance.complianceChecks).toBeDefined();
        expect(metrics.compliance.violations).toBeDefined();
        expect(metrics.compliance.remediations).toBeDefined();
        expect(metrics.compliance.auditLogs).toBeDefined();

        // Performance metrics
        expect(metrics.performance.avgResponseTime).toBeDefined();
        expect(metrics.performance.p95ResponseTime).toBeDefined();
        expect(metrics.performance.errorRate).toBeDefined();
        expect(metrics.performance.throughput).toBeDefined();
      });
    });
  });

  describe('Health Check', () => {
    describe('GET /v1/security-framework/health', () => {
      it('should return health status', async () => {
        const response = await request(app)
          .get('/v1/security-framework/health')
          .expect(200);

        expect(response.body.status).toBe('healthy');
        expect(response.body.timestamp).toBeDefined();
        expect(response.body.services).toBeDefined();
        expect(response.body.uptime).toBeDefined();
      });

      it('should include all security services', async () => {
        const response = await request(app)
          .get('/v1/security-framework/health')
          .expect(200);

        expect(response.body.services.mfa).toBe('operational');
        expect(response.body.services.rbac).toBe('operational');
        expect(response.body.services.csrf).toBe('operational');
        expect(response.body.services.sanitization).toBe('operational');
        expect(response.body.services.threatDetection).toBe('operational');
        expect(response.body.services.compliance).toBe('operational');
      });
    });
  });
});
