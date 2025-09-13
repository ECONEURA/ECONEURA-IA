import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '../../../index.js';

// Mock de autenticación
const mockAuth = {
  id: 'user-123',
  email: 'test@example.com',
  organizationId: 'org-123'
};

// Mock del middleware de autenticación
vi.mock('../../../middleware/auth.middleware.js', () => ({
  authenticateToken: (req: any, res: any, next: any) => {
    req.user = mockAuth;
    next();
  }
}));

// Mock del middleware de rate limiting
vi.mock('../../../middleware/rate-limiter.middleware.js', () => ({
  rateLimiter: (req: any, res: any, next: any) => {
    next();
  }
}));

// Mock del middleware de validación
vi.mock('../../../middleware/validation.middleware.js', () => ({
  validateRequest: (schema: any) => (req: any, res: any, next: any) => {
    next();
  }
}));

describe('AI Security & Compliance API Integration Tests', () => {
  const baseUrl = '/v1/ai-security-compliance';

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET /policies', () => {
    it('should retrieve security policies successfully', async () => {
      const response = await request(app)
        .get(`${baseUrl}/policies`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.any(Array),
        count: expect.any(Number)
      });
    });

    it('should handle authentication errors', async () => {
      // Simular error de autenticación
      vi.mocked(require('../../../middleware/auth.middleware.js').authenticateToken)
        .mockImplementationOnce((req: any, res: any, next: any) => {
          res.status(401).json({ error: 'Unauthorized' });
        });

      const response = await request(app)
        .get(`${baseUrl}/policies`)
        .expect(401);

      expect(response.body).toMatchObject({
        error: 'Unauthorized'
      });
    });
  });

  describe('POST /policies', () => {
    it('should create a new security policy successfully', async () => {
      const policyData = {
        name: 'Test Data Protection Policy',
        description: 'Test policy for data protection',
        type: 'data_protection',
        rules: [
          {
            field: 'data_type',
            operator: 'equals',
            value: 'personal',
            action: 'encrypt'
          }
        ],
        severity: 'high',
        isActive: true
      };

      const response = await request(app)
        .post(`${baseUrl}/policies`)
        .send(policyData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          name: policyData.name,
          type: policyData.type,
          severity: policyData.severity
        }),
        message: 'Security policy created successfully'
      });
    });

    it('should validate required fields', async () => {
      const invalidPolicyData = {
        name: '', // Invalid: empty name
        description: 'Test policy',
        type: 'invalid_type', // Invalid: not in enum
        rules: [],
        severity: 'high'
      };

      const response = await request(app)
        .post(`${baseUrl}/policies`)
        .send(invalidPolicyData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.any(String)
      });
    });
  });

  describe('PUT /policies/:id', () => {
    it('should update an existing security policy', async () => {
      const policyId = 'policy-123';
      const updateData = {
        name: 'Updated Policy Name',
        severity: 'critical'
      };

      const response = await request(app)
        .put(`${baseUrl}/policies/${policyId}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          id: policyId,
          name: updateData.name,
          severity: updateData.severity
        }),
        message: 'Security policy updated successfully'
      });
    });

    it('should handle policy not found', async () => {
      const nonExistentId = 'non-existent-policy';
      const updateData = {
        name: 'Updated Policy Name'
      };

      const response = await request(app)
        .put(`${baseUrl}/policies/${nonExistentId}`)
        .send(updateData)
        .expect(500);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Failed to update security policy'
      });
    });
  });

  describe('POST /compliance/check', () => {
    it('should run a compliance check successfully', async () => {
      const checkData = {
        policyId: 'policy-123',
        checkType: 'data_retention'
      };

      const response = await request(app)
        .post(`${baseUrl}/compliance/check`)
        .send(checkData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          id: expect.any(String),
          policyId: checkData.policyId,
          checkType: checkData.checkType,
          status: 'completed'
        }),
        message: 'Compliance check completed successfully'
      });
    });

    it('should validate check type enum', async () => {
      const invalidCheckData = {
        policyId: 'policy-123',
        checkType: 'invalid_check_type'
      };

      const response = await request(app)
        .post(`${baseUrl}/compliance/check`)
        .send(invalidCheckData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.any(String)
      });
    });
  });

  describe('GET /compliance/checks', () => {
    it('should retrieve compliance checks', async () => {
      const response = await request(app)
        .get(`${baseUrl}/compliance/checks`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.any(Array),
        count: expect.any(Number)
      });
    });
  });

  describe('POST /incidents', () => {
    it('should create a security incident successfully', async () => {
      const incidentData = {
        type: 'data_breach',
        severity: 'critical',
        status: 'open',
        description: 'Unauthorized access to user data detected',
        affectedData: ['user_profiles', 'payment_info'],
        affectedUsers: ['user-1', 'user-2'],
        detectionMethod: 'automated_monitoring',
        remediation: 'Immediate data encryption and access revocation'
      };

      const response = await request(app)
        .post(`${baseUrl}/incidents`)
        .send(incidentData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          type: incidentData.type,
          severity: incidentData.severity,
          status: incidentData.status,
          description: incidentData.description
        }),
        message: 'Security incident created successfully'
      });
    });

    it('should validate incident type enum', async () => {
      const invalidIncidentData = {
        type: 'invalid_incident_type',
        severity: 'high',
        description: 'Test incident',
        detectionMethod: 'manual'
      };

      const response = await request(app)
        .post(`${baseUrl}/incidents`)
        .send(invalidIncidentData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.any(String)
      });
    });
  });

  describe('GET /incidents', () => {
    it('should retrieve security incidents', async () => {
      const response = await request(app)
        .get(`${baseUrl}/incidents`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.any(Array),
        count: expect.any(Number)
      });
    });
  });

  describe('POST /evaluate', () => {
    it('should evaluate AI security request successfully', async () => {
      const evaluationData = {
        userId: 'user-123',
        organizationId: 'org-123',
        action: 'generate_text',
        data: {
          prompt: 'Generate a summary of the meeting notes',
          model: 'gpt-4'
        },
        context: {
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          sessionId: 'session-123'
        }
      };

      const response = await request(app)
        .post(`${baseUrl}/evaluate`)
        .send(evaluationData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          allowed: expect.any(Boolean),
          violations: expect.any(Array),
          recommendations: expect.any(Array),
          auditId: expect.any(String)
        }),
        message: 'AI security evaluation completed'
      });
    });

    it('should validate IP address format', async () => {
      const invalidEvaluationData = {
        userId: 'user-123',
        organizationId: 'org-123',
        action: 'generate_text',
        data: { prompt: 'Test' },
        context: {
          ipAddress: 'invalid-ip', // Invalid IP format
          userAgent: 'Mozilla/5.0'
        }
      };

      const response = await request(app)
        .post(`${baseUrl}/evaluate`)
        .send(invalidEvaluationData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.any(String)
      });
    });
  });

  describe('POST /reports', () => {
    it('should generate compliance report successfully', async () => {
      const reportData = {
        organizationId: 'org-123',
        reportType: 'monthly',
        period: {
          start: '2024-01-01T00:00:00Z',
          end: '2024-01-31T23:59:59Z'
        }
      };

      const response = await request(app)
        .post(`${baseUrl}/reports`)
        .send(reportData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          id: expect.any(String),
          organizationId: reportData.organizationId,
          reportType: reportData.reportType,
          summary: expect.objectContaining({
            totalChecks: expect.any(Number),
            passedChecks: expect.any(Number),
            failedChecks: expect.any(Number),
            overallScore: expect.any(Number)
          }),
          recommendations: expect.any(Array)
        }),
        message: 'Compliance report generated successfully'
      });
    });

    it('should validate date format in period', async () => {
      const invalidReportData = {
        organizationId: 'org-123',
        reportType: 'monthly',
        period: {
          start: 'invalid-date',
          end: '2024-01-31T23:59:59Z'
        }
      };

      const response = await request(app)
        .post(`${baseUrl}/reports`)
        .send(invalidReportData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.any(String)
      });
    });
  });

  describe('GET /audit-logs', () => {
    it('should retrieve audit logs with pagination', async () => {
      const response = await request(app)
        .get(`${baseUrl}/audit-logs?page=1&limit=10`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.any(Array),
        count: expect.any(Number),
        pagination: expect.objectContaining({
          page: 1,
          limit: 10,
          total: expect.any(Number)
        })
      });
    });

    it('should filter audit logs by parameters', async () => {
      const response = await request(app)
        .get(`${baseUrl}/audit-logs?userId=user-123&action=create_policy`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.any(Array),
        count: expect.any(Number)
      });
    });
  });

  describe('GET /health', () => {
    it('should return healthy status', async () => {
      const response = await request(app)
        .get(`${baseUrl}/health`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          status: expect.stringMatching(/^(healthy|degraded|unhealthy)$/),
          services: expect.objectContaining({
            database: expect.any(Boolean),
            policies: expect.any(Boolean),
            compliance: expect.any(Boolean)
          }),
          lastCheck: expect.any(String)
        })
      });
    });
  });

  describe('GET /stats', () => {
    it('should return service statistics', async () => {
      const response = await request(app)
        .get(`${baseUrl}/stats`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          policies: expect.objectContaining({
            total: expect.any(Number),
            active: expect.any(Number),
            byType: expect.objectContaining({
              data_protection: expect.any(Number),
              access_control: expect.any(Number),
              content_filter: expect.any(Number),
              audit: expect.any(Number),
              compliance: expect.any(Number)
            })
          }),
          compliance: expect.objectContaining({
            totalChecks: expect.any(Number),
            passedChecks: expect.any(Number),
            failedChecks: expect.any(Number),
            averageScore: expect.any(Number)
          }),
          incidents: expect.objectContaining({
            total: expect.any(Number),
            open: expect.any(Number),
            resolved: expect.any(Number),
            bySeverity: expect.objectContaining({
              low: expect.any(Number),
              medium: expect.any(Number),
              high: expect.any(Number),
              critical: expect.any(Number)
            })
          }),
          audit: expect.objectContaining({
            totalLogs: expect.any(Number),
            successfulActions: expect.any(Number),
            failedActions: expect.any(Number)
          })
        }),
        message: 'Statistics retrieved successfully'
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle rate limiting', async () => {
      // Simular rate limiting
      vi.mocked(require('../../../middleware/rate-limiter.middleware.js').rateLimiter)
        .mockImplementationOnce((req: any, res: any, next: any) => {
          res.status(429).json({ error: 'Too many requests' });
        });

      const response = await request(app)
        .get(`${baseUrl}/policies`)
        .expect(429);

      expect(response.body).toMatchObject({
        error: 'Too many requests'
      });
    });

    it('should handle server errors gracefully', async () => {
      // Simular error del servidor
      vi.mocked(require('../../../services/ai-security-compliance.service.js').aiSecurityComplianceService.getSecurityPolicies)
        .mockRejectedValueOnce(new Error('Internal server error'));

      const response = await request(app)
        .get(`${baseUrl}/policies`)
        .expect(500);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Failed to retrieve security policies'
      });
    });
  });

  describe('Security Headers', () => {
    it('should include security headers in responses', async () => {
      const response = await request(app)
        .get(`${baseUrl}/health`)
        .expect(200);

      // Verificar headers de seguridad básicos
      expect(response.headers).toMatchObject({
        'x-content-type-options': 'nosniff',
        'x-frame-options': 'DENY',
        'x-xss-protection': '1; mode=block'
      });
    });
  });
});
