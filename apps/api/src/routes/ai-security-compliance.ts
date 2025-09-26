import { Router } from 'express';
import { z } from 'zod';

import { aiSecurityComplianceService } from '../services/ai-security-compliance.service.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { rateLimiter } from '../middleware/rate-limiter.middleware.js';
import { validateRequest } from '../middleware/validation.middleware.js';
import { logger } from '../lib/logger.js';

const router = Router();

// Schemas de validación
const CreateSecurityPolicySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  type: z.enum(['data_protection', 'access_control', 'content_filter', 'audit', 'compliance']),
  rules: z.array(z.object({
    field: z.string(),
    operator: z.enum(['equals', 'contains', 'regex', 'range', 'exists']),
    value: z.any(),
    action: z.enum(['allow', 'deny', 'log', 'encrypt', 'anonymize'])
  })),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  isActive: z.boolean().default(true)
});

const UpdateSecurityPolicySchema = CreateSecurityPolicySchema.partial();

const RunComplianceCheckSchema = z.object({
  policyId: z.string().uuid(),
  checkType: z.enum(['data_retention', 'access_audit', 'content_scan', 'encryption_check', 'gdpr_compliance'])
});

const CreateSecurityIncidentSchema = z.object({
  type: z.enum(['data_breach', 'unauthorized_access', 'content_violation', 'policy_violation', 'system_compromise']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  status: z.enum(['open', 'investigating', 'resolved', 'closed']).default('open'),
  description: z.string().min(1).max(1000),
  affectedData: z.array(z.string()).default([]),
  affectedUsers: z.array(z.string()).default([]),
  detectionMethod: z.string().min(1).max(100),
  remediation: z.string().optional()
});

const EvaluateAISecuritySchema = z.object({
  userId: z.string().uuid(),
  organizationId: z.string().uuid(),
  action: z.string().min(1).max(100),
  data: z.any(),
  context: z.object({
    ipAddress: z.string().ip(),
    userAgent: z.string().min(1).max(500),
    sessionId: z.string().optional()
  })
});

const GenerateComplianceReportSchema = z.object({
  organizationId: z.string().uuid(),
  reportType: z.string().min(1).max(50),
  period: z.object({
    start: z.string().datetime(),
    end: z.string().datetime()
  })
});

// Middleware de autenticación y rate limiting
router.use(authenticateToken);
router.use(rateLimiter);

// ===== GESTIÓN DE POLÍTICAS DE SEGURIDAD =====

// GET /v1/ai-security-compliance/policies - Obtener todas las políticas
router.get('/policies', async (req, res) => {
  try {
    const policies = await aiSecurityComplianceService.getSecurityPolicies();
    
    logger.info('Security policies retrieved', { 
      userId: req.user?.id, 
      count: policies.length 
    });
    
    res.json({
      success: true,
      data: policies,
      count: policies.length
    });
  } catch (error: any) {
    logger.error('Failed to get security policies', { 
      error: error.message, 
      userId: req.user?.id 
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve security policies',
      message: error.message
    });
  }
});

// POST /v1/ai-security-compliance/policies - Crear nueva política
router.post('/policies', 
  validateRequest(CreateSecurityPolicySchema),
  async (req, res) => {
    try {
      const policy = await aiSecurityComplianceService.createSecurityPolicy(req.body);
      
      logger.info('Security policy created', { 
        policyId: policy.id, 
        userId: req.user?.id 
      });
      
      res.status(201).json({
        success: true,
        data: policy,
        message: 'Security policy created successfully'
      });
    } catch (error: any) {
      logger.error('Failed to create security policy', { 
        error: error.message, 
        userId: req.user?.id 
      });
      
      res.status(500).json({
        success: false,
        error: 'Failed to create security policy',
        message: error.message
      });
    }
  }
);

// PUT /v1/ai-security-compliance/policies/:id - Actualizar política
router.put('/policies/:id',
  validateRequest(UpdateSecurityPolicySchema),
  async (req, res) => {
    try {
      const { id } = req.params;
      const policy = await aiSecurityComplianceService.updateSecurityPolicy(id, req.body);
      
      logger.info('Security policy updated', { 
        policyId: id, 
        userId: req.user?.id 
      });
      
      res.json({
        success: true,
        data: policy,
        message: 'Security policy updated successfully'
      });
    } catch (error: any) {
      logger.error('Failed to update security policy', { 
        error: error.message, 
        policyId: req.params.id,
        userId: req.user?.id 
      });
      
      res.status(500).json({
        success: false,
        error: 'Failed to update security policy',
        message: error.message
      });
    }
  }
);

// ===== VERIFICACIONES DE CUMPLIMIENTO =====

// POST /v1/ai-security-compliance/compliance/check - Ejecutar verificación
router.post('/compliance/check',
  validateRequest(RunComplianceCheckSchema),
  async (req, res) => {
    try {
      const { policyId, checkType } = req.body;
      const check = await aiSecurityComplianceService.runComplianceCheck(policyId, checkType);
      
      logger.info('Compliance check executed', { 
        checkId: check.id, 
        checkType,
        userId: req.user?.id 
      });
      
      res.status(201).json({
        success: true,
        data: check,
        message: 'Compliance check completed successfully'
      });
    } catch (error: any) {
      logger.error('Failed to run compliance check', { 
        error: error.message, 
        userId: req.user?.id 
      });
      
      res.status(500).json({
        success: false,
        error: 'Failed to run compliance check',
        message: error.message
      });
    }
  }
);

// GET /v1/ai-security-compliance/compliance/checks - Obtener verificaciones
router.get('/compliance/checks', async (req, res) => {
  try {
    // Simular obtención de verificaciones (implementar según necesidad)
    const checks = [];
    
    logger.info('Compliance checks retrieved', { 
      userId: req.user?.id, 
      count: checks.length 
    });
    
    res.json({
      success: true,
      data: checks,
      count: checks.length
    });
  } catch (error: any) {
    logger.error('Failed to get compliance checks', { 
      error: error.message, 
      userId: req.user?.id 
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve compliance checks',
      message: error.message
    });
  }
});

// ===== GESTIÓN DE INCIDENTES DE SEGURIDAD =====

// POST /v1/ai-security-compliance/incidents - Crear incidente
router.post('/incidents',
  validateRequest(CreateSecurityIncidentSchema),
  async (req, res) => {
    try {
      const incident = await aiSecurityComplianceService.createSecurityIncident(req.body);
      
      logger.warn('Security incident created', { 
        incidentId: incident.id, 
        type: incident.type,
        severity: incident.severity,
        userId: req.user?.id 
      });
      
      res.status(201).json({
        success: true,
        data: incident,
        message: 'Security incident created successfully'
      });
    } catch (error: any) {
      logger.error('Failed to create security incident', { 
        error: error.message, 
        userId: req.user?.id 
      });
      
      res.status(500).json({
        success: false,
        error: 'Failed to create security incident',
        message: error.message
      });
    }
  }
);

// GET /v1/ai-security-compliance/incidents - Obtener incidentes
router.get('/incidents', async (req, res) => {
  try {
    const incidents = await aiSecurityComplianceService.getSecurityIncidents();
    
    logger.info('Security incidents retrieved', { 
      userId: req.user?.id, 
      count: incidents.length 
    });
    
    res.json({
      success: true,
      data: incidents,
      count: incidents.length
    });
  } catch (error: any) {
    logger.error('Failed to get security incidents', { 
      error: error.message, 
      userId: req.user?.id 
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve security incidents',
      message: error.message
    });
  }
});

// ===== EVALUACIÓN DE SEGURIDAD DE AI =====

// POST /v1/ai-security-compliance/evaluate - Evaluar seguridad de request de AI
router.post('/evaluate',
  validateRequest(EvaluateAISecuritySchema),
  async (req, res) => {
    try {
      const evaluation = await aiSecurityComplianceService.evaluateAISecurity(req.body);
      
      logger.info('AI security evaluation completed', { 
        allowed: evaluation.allowed,
        violations: evaluation.violations.length,
        auditId: evaluation.auditId,
        userId: req.user?.id 
      });
      
      res.json({
        success: true,
        data: evaluation,
        message: 'AI security evaluation completed'
      });
    } catch (error: any) {
      logger.error('Failed to evaluate AI security', { 
        error: error.message, 
        userId: req.user?.id 
      });
      
      res.status(500).json({
        success: false,
        error: 'Failed to evaluate AI security',
        message: error.message
      });
    }
  }
);

// ===== REPORTES DE CUMPLIMIENTO =====

// POST /v1/ai-security-compliance/reports - Generar reporte de cumplimiento
router.post('/reports',
  validateRequest(GenerateComplianceReportSchema),
  async (req, res) => {
    try {
      const { organizationId, reportType, period } = req.body;
      const report = await aiSecurityComplianceService.generateComplianceReport(
        organizationId, 
        reportType, 
        {
          start: new Date(period.start),
          end: new Date(period.end)
        }
      );
      
      logger.info('Compliance report generated', { 
        reportId: report.id, 
        organizationId,
        overallScore: report.summary.overallScore,
        userId: req.user?.id 
      });
      
      res.status(201).json({
        success: true,
        data: report,
        message: 'Compliance report generated successfully'
      });
    } catch (error: any) {
      logger.error('Failed to generate compliance report', { 
        error: error.message, 
        userId: req.user?.id 
      });
      
      res.status(500).json({
        success: false,
        error: 'Failed to generate compliance report',
        message: error.message
      });
    }
  }
);

// ===== LOGS DE AUDITORÍA =====

// GET /v1/ai-security-compliance/audit-logs - Obtener logs de auditoría
router.get('/audit-logs', async (req, res) => {
  try {
    const { page = 1, limit = 50, userId, action, resource } = req.query;
    
    // Simular obtención de logs de auditoría (implementar según necesidad)
    const logs = [];
    
    logger.info('Audit logs retrieved', { 
      userId: req.user?.id, 
      count: logs.length,
      filters: { userId, action, resource }
    });
    
    res.json({
      success: true,
      data: logs,
      count: logs.length,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: logs.length
      }
    });
  } catch (error: any) {
    logger.error('Failed to get audit logs', { 
      error: error.message, 
      userId: req.user?.id 
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve audit logs',
      message: error.message
    });
  }
});

// ===== HEALTH CHECK =====

// GET /v1/ai-security-compliance/health - Estado del servicio
router.get('/health', async (req, res) => {
  try {
    const health = await aiSecurityComplianceService.getHealthStatus();
    
    const statusCode = health.status === 'healthy' ? 200 : 
                      health.status === 'degraded' ? 200 : 503;
    
    res.status(statusCode).json({
      success: true,
      data: health,
      message: `Service is ${health.status}`
    });
  } catch (error: any) {
    logger.error('Health check failed', { 
      error: error.message, 
      userId: req.user?.id 
    });
    
    res.status(503).json({
      success: false,
      error: 'Health check failed',
      message: error.message
    });
  }
});

// ===== ESTADÍSTICAS =====

// GET /v1/ai-security-compliance/stats - Estadísticas del servicio
router.get('/stats', async (req, res) => {
  try {
    const stats = {
      policies: {
        total: 0,
        active: 0,
        byType: {
          data_protection: 0,
          access_control: 0,
          content_filter: 0,
          audit: 0,
          compliance: 0
        }
      },
      compliance: {
        totalChecks: 0,
        passedChecks: 0,
        failedChecks: 0,
        averageScore: 0
      },
      incidents: {
        total: 0,
        open: 0,
        resolved: 0,
        bySeverity: {
          low: 0,
          medium: 0,
          high: 0,
          critical: 0
        }
      },
      audit: {
        totalLogs: 0,
        successfulActions: 0,
        failedActions: 0
      }
    };
    
    logger.info('Security compliance stats retrieved', { 
      userId: req.user?.id 
    });
    
    res.json({
      success: true,
      data: stats,
      message: 'Statistics retrieved successfully'
    });
  } catch (error: any) {
    logger.error('Failed to get statistics', { 
      error: error.message, 
      userId: req.user?.id 
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve statistics',
      message: error.message
    });
  }
});

export { router as aiSecurityComplianceRoutes };
