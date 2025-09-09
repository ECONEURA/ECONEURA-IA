import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { AdvancedSecurityFrameworkService } from '../../../lib/advanced-security-framework.service.js';

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

describe('AdvancedSecurityFrameworkService', () => {
  let service: AdvancedSecurityFrameworkService;

  beforeEach(() => {
    service = new AdvancedSecurityFrameworkService();
    jest.clearAllMocks();
  });

  describe('MFA (Multi-Factor Authentication)', () => {
    describe('initializeMFA', () => {
      it('should initialize MFA successfully', async () => {
        const mfaData = {
          userId: '123e4567-e89b-12d3-a456-426614174000',
          method: 'totp' as const
        };

        const result = await service.initializeMFA(mfaData);

        expect(result).toHaveProperty('qrCode');
        expect(result).toHaveProperty('backupCodes');
        expect(result.backupCodes).toHaveLength(10);
        expect(result.qrCode).toContain('otpauth://totp/');
      });

      it('should throw error for invalid user ID', async () => {
        const mfaData = {
          userId: 'invalid-uuid',
          method: 'totp' as const
        };

        await expect(service.initializeMFA(mfaData)).rejects.toThrow('Failed to initialize MFA');
      });

      it('should throw error for invalid method', async () => {
        const mfaData = {
          userId: '123e4567-e89b-12d3-a456-426614174000',
          method: 'invalid' as any
        };

        await expect(service.initializeMFA(mfaData)).rejects.toThrow('Failed to initialize MFA');
      });
    });

    describe('verifyMFACode', () => {
      beforeEach(async () => {
        // Initialize MFA first
        const mfaData = {
          userId: '123e4567-e89b-12d3-a456-426614174000',
          method: 'totp' as const
        };
        await service.initializeMFA(mfaData);
      });

      it('should verify valid MFA code', async () => {
        const codeData = {
          userId: '123e4567-e89b-12d3-a456-426614174000',
          code: '123456',
          method: 'totp' as const
        };

        const result = await service.verifyMFACode(codeData);

        expect(result).toHaveProperty('valid');
        expect(result).toHaveProperty('sessionToken');
      });

      it('should reject invalid MFA code', async () => {
        const codeData = {
          userId: '123e4567-e89b-12d3-a456-426614174000',
          code: '000000',
          method: 'totp' as const
        };

        const result = await service.verifyMFACode(codeData);

        expect(result.valid).toBe(false);
        expect(result.sessionToken).toBeUndefined();
      });

      it('should throw error for uninitialized user', async () => {
        const codeData = {
          userId: '999e4567-e89b-12d3-a456-426614174000',
          code: '123456',
          method: 'totp' as const
        };

        await expect(service.verifyMFACode(codeData)).rejects.toThrow('Failed to verify MFA code');
      });
    });

    describe('createMFASession', () => {
      it('should create MFA session successfully', async () => {
        const userId = '123e4567-e89b-12d3-a456-426614174000';
        const sessionData = { device: 'mobile' };

        const sessionId = await service.createMFASession(userId, sessionData);

        expect(sessionId).toBeDefined();
        expect(sessionId).toContain('mfa_');
      });
    });
  });

  describe('RBAC (Role-Based Access Control)', () => {
    describe('checkPermission', () => {
      it('should grant permission for admin user', async () => {
        const permissionData = {
          userId: '123e4567-e89b-12d3-a456-426614174000',
          resource: 'users',
          action: 'delete'
        };

        const result = await service.checkPermission(permissionData);

        expect(result.allowed).toBe(true);
        expect(result.reason).toBeUndefined();
      });

      it('should deny permission for regular user', async () => {
        const permissionData = {
          userId: '456e7890-e89b-12d3-a456-426614174000',
          resource: 'admin',
          action: 'delete'
        };

        const result = await service.checkPermission(permissionData);

        expect(result.allowed).toBe(false);
        expect(result.reason).toBe('Insufficient permissions');
      });

      it('should throw error for invalid user ID', async () => {
        const permissionData = {
          userId: 'invalid-uuid',
          resource: 'users',
          action: 'read'
        };

        await expect(service.checkPermission(permissionData)).rejects.toThrow('Failed to check permission');
      });
    });

    describe('assignRole', () => {
      it('should assign role successfully', async () => {
        const roleData = {
          userId: '123e4567-e89b-12d3-a456-426614174000',
          role: 'manager',
          assignedBy: '456e7890-e89b-12d3-a456-426614174000'
        };

        const result = await service.assignRole(roleData.userId, roleData.role, roleData.assignedBy);

        expect(result.success).toBe(true);
      });
    });
  });

  describe('CSRF Protection', () => {
    describe('generateCSRFToken', () => {
      it('should generate CSRF token successfully', async () => {
        const sessionId = 'session_123';

        const token = await service.generateCSRFToken(sessionId);

        expect(token).toBeDefined();
        expect(token).toHaveLength(32);
      });
    });

    describe('verifyCSRFToken', () => {
      it('should verify valid CSRF token', async () => {
        const sessionId = 'session_123';
        const token = await service.generateCSRFToken(sessionId);

        const result = await service.verifyCSRFToken({ sessionId, token });

        expect(result.valid).toBe(true);
      });

      it('should reject invalid CSRF token', async () => {
        const sessionId = 'session_123';
        const invalidToken = 'invalid_token_12345678901234567890';

        const result = await service.verifyCSRFToken({ sessionId, token: invalidToken });

        expect(result.valid).toBe(false);
      });
    });
  });

  describe('Input Sanitization', () => {
    describe('sanitizeInput', () => {
      it('should sanitize clean input', async () => {
        const inputData = {
          input: 'Hello, world!',
          type: 'general' as const
        };

        const result = await service.sanitizeInput(inputData);

        expect(result.sanitized).toBe('Hello, world!');
        expect(result.threats).toHaveLength(0);
      });

      it('should detect and sanitize malicious input', async () => {
        const inputData = {
          input: '<script>alert("xss")</script>Hello',
          type: 'html' as const
        };

        const result = await service.sanitizeInput(inputData);

        expect(result.sanitized).not.toContain('<script>');
        expect(result.threats.length).toBeGreaterThan(0);
      });

      it('should handle long input', async () => {
        const longInput = 'a'.repeat(15000);
        const inputData = {
          input: longInput,
          type: 'general' as const
        };

        const result = await service.sanitizeInput(inputData);

        expect(result.sanitized.length).toBeLessThanOrEqual(10000);
        expect(result.threats).toContain('Input exceeds maximum length');
      });
    });
  });

  describe('Threat Detection', () => {
    describe('detectThreats', () => {
      it('should detect no threats for clean request', async () => {
        const threatData = {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          request: { path: '/api/users', method: 'GET' },
          riskFactors: []
        };

        const result = await service.detectThreats(threatData);

        expect(result.threats).toHaveLength(0);
        expect(result.riskScore).toBe(0);
        expect(result.blocked).toBe(false);
      });

      it('should detect bot traffic', async () => {
        const threatData = {
          ipAddress: '192.168.1.1',
          userAgent: 'Googlebot/2.1',
          request: { path: '/api/users', method: 'GET' },
          riskFactors: []
        };

        const result = await service.detectThreats(threatData);

        expect(result.threats).toContain('Bot traffic detected');
        expect(result.riskScore).toBeGreaterThan(0);
      });

      it('should detect suspicious patterns', async () => {
        const threatData = {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          request: {
            path: '/api/users',
            method: 'GET',
            query: 'SELECT * FROM users WHERE id = 1'
          },
          riskFactors: []
        };

        const result = await service.detectThreats(threatData);

        expect(result.threats.length).toBeGreaterThan(0);
        expect(result.riskScore).toBeGreaterThan(0);
      });

      it('should block high-risk requests', async () => {
        const threatData = {
          ipAddress: '192.168.1.1',
          userAgent: 'bot',
          request: {
            path: '/api/users',
            method: 'GET',
            query: 'SELECT * FROM users WHERE id = 1 OR 1=1'
          },
          riskFactors: ['sql injection', 'bot traffic']
        };

        const result = await service.detectThreats(threatData);

        expect(result.blocked).toBe(true);
        expect(result.riskScore).toBeGreaterThan(70);
      });
    });
  });

  describe('Compliance', () => {
    describe('checkCompliance', () => {
      it('should check GDPR compliance', async () => {
        const complianceData = {
          organizationId: '123e4567-e89b-12d3-a456-426614174000',
          complianceType: 'gdpr' as const
        };

        const result = await service.checkCompliance(complianceData.organizationId, complianceData.complianceType);

        expect(result).toHaveProperty('compliant');
        expect(result).toHaveProperty('violations');
        expect(result).toHaveProperty('score');
        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(result.score).toBeLessThanOrEqual(100);
      });

      it('should check SOX compliance', async () => {
        const complianceData = {
          organizationId: '123e4567-e89b-12d3-a456-426614174000',
          complianceType: 'sox' as const
        };

        const result = await service.checkCompliance(complianceData.organizationId, complianceData.complianceType);

        expect(result).toHaveProperty('compliant');
        expect(result).toHaveProperty('violations');
        expect(result).toHaveProperty('score');
      });
    });
  });

  describe('Metrics and Monitoring', () => {
    describe('getSecurityMetrics', () => {
      it('should return security metrics', async () => {
        const metrics = await service.getSecurityMetrics();

        expect(metrics).toHaveProperty('authentication');
        expect(metrics).toHaveProperty('authorization');
        expect(metrics).toHaveProperty('threats');
        expect(metrics).toHaveProperty('compliance');
        expect(metrics).toHaveProperty('performance');

        expect(metrics.authentication).toHaveProperty('totalLogins');
        expect(metrics.authentication).toHaveProperty('successfulLogins');
        expect(metrics.authentication).toHaveProperty('failedLogins');
        expect(metrics.authentication).toHaveProperty('mfaCompletions');
        expect(metrics.authentication).toHaveProperty('mfaFailures');

        expect(metrics.authorization).toHaveProperty('permissionChecks');
        expect(metrics.authorization).toHaveProperty('deniedAccess');
        expect(metrics.authorization).toHaveProperty('roleAssignments');
        expect(metrics.authorization).toHaveProperty('permissionGrants');

        expect(metrics.threats).toHaveProperty('detectedThreats');
        expect(metrics.threats).toHaveProperty('blockedIPs');
        expect(metrics.threats).toHaveProperty('suspiciousActivities');
        expect(metrics.threats).toHaveProperty('csrfAttacks');

        expect(metrics.compliance).toHaveProperty('complianceChecks');
        expect(metrics.compliance).toHaveProperty('violations');
        expect(metrics.compliance).toHaveProperty('remediations');
        expect(metrics.compliance).toHaveProperty('auditLogs');

        expect(metrics.performance).toHaveProperty('avgResponseTime');
        expect(metrics.performance).toHaveProperty('p95ResponseTime');
        expect(metrics.performance).toHaveProperty('errorRate');
        expect(metrics.performance).toHaveProperty('throughput');
      });
    });

    describe('getHealthStatus', () => {
      it('should return health status', async () => {
        const health = await service.getHealthStatus();

        expect(health).toHaveProperty('status');
        expect(health).toHaveProperty('services');
        expect(health).toHaveProperty('lastCheck');

        expect(health.status).toMatch(/^(healthy|degraded)$/);
        expect(health.services).toHaveProperty('database');
        expect(health.services).toHaveProperty('mfa');
        expect(health.services).toHaveProperty('csrf');
        expect(health.services).toHaveProperty('threatDetection');
        expect(health.services).toHaveProperty('compliance');

        expect(typeof health.services.database).toBe('boolean');
        expect(typeof health.services.mfa).toBe('boolean');
        expect(typeof health.services.csrf).toBe('boolean');
        expect(typeof health.services.threatDetection).toBe('boolean');
        expect(typeof health.services.compliance).toBe('boolean');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid input gracefully', async () => {
      const invalidData = {
        userId: 'invalid',
        method: 'invalid'
      };

      await expect(service.initializeMFA(invalidData as any)).rejects.toThrow();
    });

    it('should handle missing required fields', async () => {
      const incompleteData = {
        userId: '123e4567-e89b-12d3-a456-426614174000'
        // missing method
      };

      await expect(service.initializeMFA(incompleteData as any)).rejects.toThrow();
    });
  });

  describe('Integration Tests', () => {
    it('should complete full MFA flow', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';

      // Initialize MFA
      const initResult = await service.initializeMFA({
        userId,
        method: 'totp'
      });

      expect(initResult.qrCode).toBeDefined();
      expect(initResult.backupCodes).toHaveLength(10);

      // Verify MFA code
      const verifyResult = await service.verifyMFACode({
        userId,
        code: '123456',
        method: 'totp'
      });

      expect(verifyResult.valid).toBeDefined();
    });

    it('should complete full RBAC flow', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const assignedBy = '456e7890-e89b-12d3-a456-426614174000';

      // Assign role
      const assignResult = await service.assignRole(userId, 'admin', assignedBy);
      expect(assignResult.success).toBe(true);

      // Check permission
      const permissionResult = await service.checkPermission({
        userId,
        resource: 'users',
        action: 'delete'
      });

      expect(permissionResult.allowed).toBe(true);
    });

    it('should complete full CSRF flow', async () => {
      const sessionId = 'session_123';

      // Generate token
      const token = await service.generateCSRFToken(sessionId);
      expect(token).toBeDefined();

      // Verify token
      const verifyResult = await service.verifyCSRFToken({ sessionId, token });
      expect(verifyResult.valid).toBe(true);
    });
  });
});
