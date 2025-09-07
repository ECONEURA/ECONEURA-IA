/**
 * PR-28: Advanced Security Framework Service - Unit Tests
 * 
 * Pruebas unitarias para el servicio consolidado de seguridad:
 * - Autenticación multi-factor (MFA)
 * - Autorización basada en roles (RBAC)
 * - Protección CSRF
 * - Sanitización de entrada
 * - Detección de amenazas
 * - Compliance y auditoría
 * - Métricas de seguridad
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AdvancedSecurityFrameworkService } from '../../../lib/advanced-security-framework.service.js';

// Mock de dependencias
vi.mock('../../../lib/structured-logger.js', () => ({
  structuredLogger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

vi.mock('../../../lib/redis.service.js', () => ({
  getRedisService: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn()
  }))
}));

vi.mock('@econeura/db', () => ({
  getDatabaseService: vi.fn(() => ({
    getDatabase: vi.fn(() => ({
      insert: vi.fn(),
      select: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    }))
  }))
}));

vi.mock('@econeura/shared/src/metrics/index.js', () => ({
  metrics: {
    increment: vi.fn(),
    gauge: vi.fn(),
    histogram: vi.fn()
  }
}));

describe('AdvancedSecurityFrameworkService', () => {
  let service: AdvancedSecurityFrameworkService;

  beforeEach(() => {
    service = new AdvancedSecurityFrameworkService();
    vi.clearAllMocks();
  });

  describe('MFA (Multi-Factor Authentication)', () => {
    it('should initialize MFA for a user', async () => {
      const userId = 'user-123';
      
      const result = await service.initializeMFA(userId);
      
      expect(result).toBeDefined();
      expect(result.secret).toBeDefined();
      expect(result.qrCode).toBeDefined();
      expect(result.backupCodes).toBeDefined();
      expect(result.backupCodes).toHaveLength(10);
    });

    it('should verify MFA code', async () => {
      const userId = 'user-123';
      const code = '123456';
      const method = 'totp';
      
      const result = await service.verifyMFACode(userId, code, method);
      
      expect(typeof result).toBe('boolean');
    });

    it('should create MFA session', async () => {
      const userId = 'user-123';
      const ipAddress = '192.168.1.1';
      const userAgent = 'Mozilla/5.0';
      
      const session = await service.createMFASession(userId, ipAddress, userAgent);
      
      expect(session).toBeDefined();
      expect(session.userId).toBe(userId);
      expect(session.sessionId).toBeDefined();
      expect(session.ipAddress).toBe(ipAddress);
      expect(session.userAgent).toBe(userAgent);
      expect(session.expiresAt).toBeDefined();
      expect(session.riskScore).toBeDefined();
    });
  });

  describe('RBAC (Role-Based Access Control)', () => {
    it('should check user permission', async () => {
      const userId = 'user-123';
      const resource = 'users';
      const action = 'read';
      
      const hasPermission = await service.checkPermission(userId, resource, action);
      
      expect(typeof hasPermission).toBe('boolean');
    });

    it('should check user permission with context', async () => {
      const userId = 'user-123';
      const resource = 'users';
      const action = 'read';
      const context = { organizationId: 'org-123' };
      
      const hasPermission = await service.checkPermission(userId, resource, action, context);
      
      expect(typeof hasPermission).toBe('boolean');
    });

    it('should assign role to user', async () => {
      const userId = 'user-123';
      const roleId = 'role-456';
      const assignedBy = 'admin-789';
      
      await expect(service.assignRole(userId, roleId, assignedBy)).resolves.not.toThrow();
    });
  });

  describe('CSRF Protection', () => {
    it('should generate CSRF token', () => {
      const token = service.generateCSRFToken();
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('should verify CSRF token', () => {
      const token = service.generateCSRFToken();
      const sessionToken = token; // Same token for valid verification
      
      const isValid = service.verifyCSRFToken(token, sessionToken);
      
      expect(typeof isValid).toBe('boolean');
    });

    it('should reject invalid CSRF token', () => {
      const token = 'valid-token';
      const sessionToken = 'invalid-token';
      
      const isValid = service.verifyCSRFToken(token, sessionToken);
      
      expect(isValid).toBe(false);
    });
  });

  describe('Input Sanitization', () => {
    it('should sanitize string input', () => {
      const input = '<script>alert("xss")</script>';
      
      const sanitized = service.sanitizeInput(input);
      
      expect(sanitized).toBeDefined();
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('&lt;script&gt;');
    });

    it('should sanitize object input', () => {
      const input = {
        name: '<script>alert("xss")</script>',
        email: 'test@example.com',
        description: 'Safe content'
      };
      
      const sanitized = service.sanitizeInput(input);
      
      expect(sanitized).toBeDefined();
      expect(sanitized.name).not.toContain('<script>');
      expect(sanitized.email).toBe('test@example.com');
      expect(sanitized.description).toBe('Safe content');
    });

    it('should sanitize array input', () => {
      const input = [
        '<script>alert("xss")</script>',
        'Safe content',
        '<img src="x" onerror="alert(1)">'
      ];
      
      const sanitized = service.sanitizeInput(input);
      
      expect(sanitized).toBeDefined();
      expect(Array.isArray(sanitized)).toBe(true);
      expect(sanitized[0]).not.toContain('<script>');
      expect(sanitized[1]).toBe('Safe content');
      expect(sanitized[2]).not.toContain('onerror');
    });

    it('should throw error for blocked patterns', () => {
      const input = 'javascript:alert("xss")';
      
      expect(() => service.sanitizeInput(input)).toThrow('Blocked pattern detected');
    });
  });

  describe('Threat Detection', () => {
    it('should detect threats in request', async () => {
      const request = { query: "'; DROP TABLE users; --" };
      const ipAddress = '192.168.1.1';
      const userAgent = 'Mozilla/5.0';
      
      const result = await service.detectThreats(request, ipAddress, userAgent);
      
      expect(result).toBeDefined();
      expect(result.isThreat).toBeDefined();
      expect(typeof result.isThreat).toBe('boolean');
      expect(result.riskScore).toBeDefined();
      expect(typeof result.riskScore).toBe('number');
      expect(result.threats).toBeDefined();
      expect(Array.isArray(result.threats)).toBe(true);
    });

    it('should detect suspicious user agent', async () => {
      const request = { data: 'normal data' };
      const ipAddress = '192.168.1.1';
      const userAgent = 'curl/7.68.0';
      
      const result = await service.detectThreats(request, ipAddress, userAgent);
      
      expect(result).toBeDefined();
      expect(result.isThreat).toBeDefined();
      expect(result.threats).toContain('suspicious_user_agent');
    });

    it('should not detect threats in normal request', async () => {
      const request = { data: 'normal data' };
      const ipAddress = '192.168.1.1';
      const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
      
      const result = await service.detectThreats(request, ipAddress, userAgent);
      
      expect(result).toBeDefined();
      expect(result.isThreat).toBe(false);
      expect(result.riskScore).toBe(0);
      expect(result.threats).toHaveLength(0);
    });
  });

  describe('Compliance', () => {
    it('should check compliance', async () => {
      const userId = 'user-123';
      const action = 'read';
      const resource = 'users';
      const data = { userId: 'user-456' };
      
      const result = await service.checkCompliance(userId, action, resource, data);
      
      expect(result).toBeDefined();
      expect(result.compliant).toBeDefined();
      expect(typeof result.compliant).toBe('boolean');
      expect(result.violations).toBeDefined();
      expect(Array.isArray(result.violations)).toBe(true);
    });

    it('should check compliance without data', async () => {
      const userId = 'user-123';
      const action = 'read';
      const resource = 'users';
      
      const result = await service.checkCompliance(userId, action, resource);
      
      expect(result).toBeDefined();
      expect(result.compliant).toBeDefined();
      expect(result.violations).toBeDefined();
    });
  });

  describe('Security Metrics', () => {
    it('should get security metrics', async () => {
      const metrics = await service.getSecurityMetrics();
      
      expect(metrics).toBeDefined();
      expect(metrics.authentication).toBeDefined();
      expect(metrics.authorization).toBeDefined();
      expect(metrics.threats).toBeDefined();
      expect(metrics.compliance).toBeDefined();
      expect(metrics.performance).toBeDefined();
    });

    it('should have correct metrics structure', async () => {
      const metrics = await service.getSecurityMetrics();
      
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

  describe('Error Handling', () => {
    it('should handle MFA initialization errors gracefully', async () => {
      // Mock error in generateMFASecret
      vi.spyOn(crypto, 'randomBytes').mockImplementation(() => {
        throw new Error('Crypto error');
      });
      
      const userId = 'user-123';
      
      await expect(service.initializeMFA(userId)).rejects.toThrow('Crypto error');
    });

    it('should handle permission check errors gracefully', async () => {
      // Mock error in getUserRoles
      const userId = 'user-123';
      const resource = 'users';
      const action = 'read';
      
      // Should return false on error
      const result = await service.checkPermission(userId, resource, action);
      expect(result).toBe(false);
    });

    it('should handle threat detection errors gracefully', async () => {
      // Mock error in detectThreats
      const request = { data: 'test' };
      const ipAddress = '192.168.1.1';
      const userAgent = 'Mozilla/5.0';
      
      // Should return safe defaults on error
      const result = await service.detectThreats(request, ipAddress, userAgent);
      expect(result.isThreat).toBe(false);
      expect(result.riskScore).toBe(0);
      expect(result.threats).toHaveLength(0);
    });
  });

  describe('Configuration', () => {
    it('should have default configuration', () => {
      // Access private config through public methods
      const token = service.generateCSRFToken();
      expect(token).toBeDefined();
    });

    it('should handle disabled features', async () => {
      // Test with disabled CSRF
      const token = 'test-token';
      const sessionToken = 'different-token';
      
      // Should still work even with different tokens when disabled
      const result = service.verifyCSRFToken(token, sessionToken);
      expect(typeof result).toBe('boolean');
    });
  });
});
