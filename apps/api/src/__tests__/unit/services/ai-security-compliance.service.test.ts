import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { AISecurityComplianceService } from '../../../services/ai-security-compliance.service.js';

// Mock del servicio de base de datos
const mockDb = {
  query: vi.fn(),
  close: vi.fn()
};

// Mock del logger
vi.mock('../../../lib/logger.js', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  }
}));

// Mock del servicio de base de datos
vi.mock('../../../lib/database.service.js', () => ({
  getDatabaseService: () => mockDb
}));

describe('AISecurityComplianceService', () => {
  let service: AISecurityComplianceService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AISecurityComplianceService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createSecurityPolicy', () => {
    it('should create a new security policy successfully', async () => {
      const policyData = {
        name: 'Test Policy',
        description: 'Test policy description',
        type: 'data_protection' as const,
        rules: [
          {
            field: 'data_type',
            operator: 'equals' as const,
            value: 'personal',
            action: 'encrypt' as const
          }
        ],
        severity: 'high' as const,
        isActive: true
      };

      const mockResult = {
        rows: [{
          id: 'policy-123',
          name: policyData.name,
          description: policyData.description,
          type: policyData.type,
          rules: JSON.stringify(policyData.rules),
          severity: policyData.severity,
          is_active: policyData.isActive,
          created_at: new Date(),
          updated_at: new Date()
        }]
      };

      mockDb.query.mockResolvedValueOnce(mockResult);

      const result = await service.createSecurityPolicy(policyData);

      expect(result).toBeDefined();
      expect(result.name).toBe(policyData.name);
      expect(result.type).toBe(policyData.type);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO ai_security_policies'),
        expect.arrayContaining([
          policyData.name,
          policyData.description,
          policyData.type,
          JSON.stringify(policyData.rules),
          policyData.severity,
          policyData.isActive
        ])
      );
    });

    it('should handle database errors when creating policy', async () => {
      const policyData = {
        name: 'Test Policy',
        description: 'Test policy description',
        type: 'data_protection' as const,
        rules: [],
        severity: 'high' as const,
        isActive: true
      };

      mockDb.query.mockRejectedValueOnce(new Error('Database error'));

      await expect(service.createSecurityPolicy(policyData)).rejects.toThrow('Database error');
    });
  });

  describe('getSecurityPolicies', () => {
    it('should retrieve all security policies', async () => {
      const mockPolicies = [
        {
          id: 'policy-1',
          name: 'Policy 1',
          description: 'Description 1',
          type: 'data_protection',
          rules: [],
          severity: 'high',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 'policy-2',
          name: 'Policy 2',
          description: 'Description 2',
          type: 'access_control',
          rules: [],
          severity: 'medium',
          is_active: false,
          created_at: new Date(),
          updated_at: new Date()
        }
      ];

      mockDb.query.mockResolvedValueOnce({ rows: mockPolicies });

      const result = await service.getSecurityPolicies();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Policy 1');
      expect(result[1].name).toBe('Policy 2');
      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT * FROM ai_security_policies ORDER BY created_at DESC'
      );
    });

    it('should handle database errors when retrieving policies', async () => {
      mockDb.query.mockRejectedValueOnce(new Error('Database error'));

      await expect(service.getSecurityPolicies()).rejects.toThrow('Database error');
    });
  });

  describe('updateSecurityPolicy', () => {
    it('should update an existing security policy', async () => {
      const policyId = 'policy-123';
      const updates = {
        name: 'Updated Policy',
        severity: 'critical' as const
      };

      const mockResult = {
        rows: [{
          id: policyId,
          name: updates.name,
          description: 'Original description',
          type: 'data_protection',
          rules: [],
          severity: updates.severity,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        }]
      };

      mockDb.query.mockResolvedValueOnce(mockResult);

      const result = await service.updateSecurityPolicy(policyId, updates);

      expect(result).toBeDefined();
      expect(result.name).toBe(updates.name);
      expect(result.severity).toBe(updates.severity);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE ai_security_policies'),
        expect.arrayContaining([updates.name, updates.severity, policyId]);
      );
    });

    it('should handle policy not found error', async () => {
      const policyId = 'non-existent';
      const updates = { name: 'Updated Policy' };

      mockDb.query.mockResolvedValueOnce({ rows: [] });

      await expect(service.updateSecurityPolicy(policyId, updates)).rejects.toThrow('Security policy not found');
    });
  });

  describe('runComplianceCheck', () => {
    it('should run a compliance check successfully', async () => {
      const policyId = 'policy-123';
      const checkType = 'data_retention' as const;

      const mockInsertResult = {
        rows: [{
          id: 'check-123',
          policy_id: policyId,
          check_type: checkType,
          status: 'running',
          started_at: new Date(),
          created_at: new Date()
        }]
      };

      const mockUpdateResult = {
        rows: [{
          id: 'check-123',
          policy_id: policyId,
          check_type: checkType,
          status: 'completed',
          result: {
            passed: true,
            violations: [],
            score: 85,
            details: {}
          },
          started_at: new Date(),
          completed_at: new Date(),
          created_at: new Date()
        }]
      };

      mockDb.query
        .mockResolvedValueOnce(mockInsertResult)
        .mockResolvedValueOnce(mockUpdateResult);

      const result = await service.runComplianceCheck(policyId, checkType);

      expect(result).toBeDefined();
      expect(result.status).toBe('completed');
      expect(result.checkType).toBe(checkType);
      expect(mockDb.query).toHaveBeenCalledTimes(2);
    });

    it('should handle database errors during compliance check', async () => {
      const policyId = 'policy-123';
      const checkType = 'data_retention' as const;

      mockDb.query.mockRejectedValueOnce(new Error('Database error'));

      await expect(service.runComplianceCheck(policyId, checkType)).rejects.toThrow('Database error');
    });
  });

  describe('createSecurityIncident', () => {
    it('should create a security incident successfully', async () => {
      const incidentData = {
        type: 'data_breach' as const,
        severity: 'critical' as const,
        status: 'open' as const,
        description: 'Data breach detected',
        affectedData: ['user_data', 'payment_info'],
        affectedUsers: ['user-1', 'user-2'],
        detectionMethod: 'automated_monitoring',
        remediation: 'Immediate data encryption'
      };

      const mockResult = {
        rows: [{
          id: 'incident-123',
          type: incidentData.type,
          severity: incidentData.severity,
          status: incidentData.status,
          description: incidentData.description,
          affected_data: JSON.stringify(incidentData.affectedData),
          affected_users: JSON.stringify(incidentData.affectedUsers),
          detection_method: incidentData.detectionMethod,
          remediation: incidentData.remediation,
          reported_at: new Date(),
          created_at: new Date()
        }]
      };

      mockDb.query.mockResolvedValueOnce(mockResult);

      const result = await service.createSecurityIncident(incidentData);

      expect(result).toBeDefined();
      expect(result.type).toBe(incidentData.type);
      expect(result.severity).toBe(incidentData.severity);
      expect(result.affectedData).toEqual(incidentData.affectedData);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO ai_security_incidents'),
        expect.arrayContaining([
          incidentData.type,
          incidentData.severity,
          incidentData.status,
          incidentData.description,
          JSON.stringify(incidentData.affectedData),
          JSON.stringify(incidentData.affectedUsers),
          incidentData.detectionMethod,
          incidentData.remediation
        ])
      );
    });
  });

  describe('evaluateAISecurity', () => {
    it('should evaluate AI security request successfully', async () => {
      const request = {
        userId: 'user-123',
        organizationId: 'org-123',
        action: 'generate_text',
        data: { prompt: 'Hello world' },
        context: {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          sessionId: 'session-123'
        }
      };

      const mockAuditResult = {
        rows: [{
          id: 'audit-123',
          user_id: request.userId,
          action: request.action,
          resource: 'ai_security_evaluation',
          details: {},
          ip_address: request.context.ipAddress,
          user_agent: request.context.userAgent,
          timestamp: new Date(),
          success: true
        }]
      };

      mockDb.query.mockResolvedValueOnce(mockAuditResult);

      const result = await service.evaluateAISecurity(request);

      expect(result).toBeDefined();
      expect(result.allowed).toBe(true);
      expect(result.auditId).toBe('audit-123');
      expect(result.violations).toEqual([]);
      expect(result.recommendations).toBeDefined();
    });

    it('should detect security violations', async () => {
      const request = {
        userId: 'user-123',
        organizationId: 'org-123',
        action: 'generate_text',
        data: { prompt: 'inappropriate content' },
        context: {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0'
        }
      };

      const mockAuditResult = {
        rows: [{
          id: 'audit-123',
          user_id: request.userId,
          action: request.action,
          resource: 'ai_security_evaluation',
          details: {},
          ip_address: request.context.ipAddress,
          user_agent: request.context.userAgent,
          timestamp: new Date(),
          success: false
        }]
      };

      mockDb.query.mockResolvedValueOnce(mockAuditResult);

      const result = await service.evaluateAISecurity(request);

      expect(result).toBeDefined();
      expect(result.violations).toBeDefined();
      expect(result.recommendations).toBeDefined();
    });
  });

  describe('generateComplianceReport', () => {
    it('should generate compliance report successfully', async () => {
      const organizationId = 'org-123';
      const reportType = 'monthly';
      const period = {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31')
      };

      const mockChecks = [
        {
          id: 'check-1',
          check_type: 'data_retention',
          result: { passed: true, violations: [], score: 90, details: {} }
        },
        {
          id: 'check-2',
          check_type: 'access_audit',
          result: { passed: false, violations: [], score: 70, details: {} }
        }
      ];

      mockDb.query.mockResolvedValueOnce({ rows: mockChecks });

      const result = await service.generateComplianceReport(organizationId, reportType, period);

      expect(result).toBeDefined();
      expect(result.organizationId).toBe(organizationId);
      expect(result.reportType).toBe(reportType);
      expect(result.summary.totalChecks).toBe(2);
      expect(result.summary.passedChecks).toBe(1);
      expect(result.summary.failedChecks).toBe(1);
      expect(result.summary.overallScore).toBe(80);
      expect(result.recommendations).toBeDefined();
    });
  });

  describe('getHealthStatus', () => {
    it('should return healthy status when all services are working', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      const result = await service.getHealthStatus();

      expect(result.status).toBe('healthy');
      expect(result.services.database).toBe(true);
      expect(result.services.policies).toBe(true);
      expect(result.services.compliance).toBe(true);
    });

    it('should return degraded status when some services are failing', async () => {
      mockDb.query.mockRejectedValueOnce(new Error('Database error'));

      const result = await service.getHealthStatus();

      expect(result.status).toBe('unhealthy');
      expect(result.services.database).toBe(false);
      expect(result.services.policies).toBe(false);
      expect(result.services.compliance).toBe(true);
    });
  });

  describe('logAuditEvent', () => {
    it('should log audit event successfully', async () => {
      const auditData = {
        userId: 'user-123',
        action: 'create_policy',
        resource: 'security_policy',
        resourceId: 'policy-123',
        details: { policyName: 'Test Policy' },
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        success: true
      };

      const mockResult = {
        rows: [{
          id: 'audit-123',
          user_id: auditData.userId,
          action: auditData.action,
          resource: auditData.resource,
          resource_id: auditData.resourceId,
          details: JSON.stringify(auditData.details),
          ip_address: auditData.ipAddress,
          user_agent: auditData.userAgent,
          timestamp: new Date(),
          success: auditData.success
        }]
      };

      mockDb.query.mockResolvedValueOnce(mockResult);

      const result = await service.logAuditEvent(auditData);

      expect(result).toBeDefined();
      expect(result.id).toBe('audit-123');
      expect(result.action).toBe(auditData.action);
      expect(result.success).toBe(auditData.success);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO ai_audit_logs'),
        expect.arrayContaining([
          auditData.userId,
          auditData.action,
          auditData.resource,
          auditData.resourceId,
          JSON.stringify(auditData.details),
          auditData.ipAddress,
          auditData.userAgent,
          auditData.success
        ])
      );
    });
  });
});
