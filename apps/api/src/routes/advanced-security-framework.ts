/**
 * PR-28: Advanced Security Framework Routes - CONSOLIDADO
 * 
 * Rutas API para el sistema unificado de seguridad que consolida:
 * - Autenticación multi-factor (MFA)
 * - Autorización basada en roles (RBAC)
 * - Protección CSRF
 * - Sanitización de entrada
 * - Detección de amenazas
 * - Compliance y auditoría
 * - Métricas de seguridad
 */

import { Router } from 'express';
import { z } from 'zod';
import { advancedSecurityFramework } from '../lib/advanced-security-framework.service.js';
import { structuredLogger } from '../lib/structured-logger.js';

const router = Router();

// ============================================================================
// SCHEMAS DE VALIDACIÓN
// ============================================================================

const InitializeMFASchema = z.object({
  userId: z.string().uuid()
});

const VerifyMFASchema = z.object({
  userId: z.string().uuid(),
  code: z.string().min(6).max(8),
  method: z.enum(['totp', 'sms', 'email', 'backup'])
});

const CreateMFASessionSchema = z.object({
  userId: z.string().uuid(),
  ipAddress: z.string().ip(),
  userAgent: z.string().min(1)
});

const CheckPermissionSchema = z.object({
  userId: z.string().uuid(),
  resource: z.string().min(1),
  action: z.string().min(1),
  context: z.record(z.any()).optional()
});

const AssignRoleSchema = z.object({
  userId: z.string().uuid(),
  roleId: z.string().uuid(),
  assignedBy: z.string().uuid()
});

const VerifyCSRFSchema = z.object({
  token: z.string().min(1),
  sessionToken: z.string().min(1)
});

const SanitizeInputSchema = z.object({
  input: z.any()
});

const DetectThreatsSchema = z.object({
  request: z.any(),
  ipAddress: z.string().ip(),
  userAgent: z.string().min(1)
});

const CheckComplianceSchema = z.object({
  userId: z.string().uuid(),
  action: z.string().min(1),
  resource: z.string().min(1),
  data: z.any().optional()
});

// ============================================================================
// AUTENTICACIÓN MULTI-FACTOR (MFA)
// ============================================================================

/**
 * POST /mfa/initialize
 * Inicializar MFA para un usuario
 */
router.post('/mfa/initialize', async (req, res) => {
  try {
    const { userId } = InitializeMFASchema.parse(req.body);
    
    const result = await advancedSecurityFramework.initializeMFA(userId);
    
    structuredLogger.info('MFA initialized', { userId });
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      structuredLogger.warn('Invalid MFA initialization request', { errors: error.errors });
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors
      });
    }

    structuredLogger.error('Failed to initialize MFA', error as Error);
    res.status(500).json({
      success: false,
      error: 'Failed to initialize MFA',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /mfa/verify
 * Verificar código MFA
 */
router.post('/mfa/verify', async (req, res) => {
  try {
    const { userId, code, method } = VerifyMFASchema.parse(req.body);
    
    const isValid = await advancedSecurityFramework.verifyMFACode(userId, code, method);
    
    structuredLogger.info('MFA verification attempted', { userId, method, isValid });
    
    res.json({
      success: true,
      data: { isValid },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      structuredLogger.warn('Invalid MFA verification request', { errors: error.errors });
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors
      });
    }

    structuredLogger.error('Failed to verify MFA code', error as Error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify MFA code',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /mfa/session
 * Crear sesión MFA
 */
router.post('/mfa/session', async (req, res) => {
  try {
    const { userId, ipAddress, userAgent } = CreateMFASessionSchema.parse(req.body);
    
    const session = await advancedSecurityFramework.createMFASession(userId, ipAddress, userAgent);
    
    structuredLogger.info('MFA session created', { userId, sessionId: session.sessionId });
    
    res.status(201).json({
      success: true,
      data: session,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      structuredLogger.warn('Invalid MFA session request', { errors: error.errors });
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors
      });
    }

    structuredLogger.error('Failed to create MFA session', error as Error);
    res.status(500).json({
      success: false,
      error: 'Failed to create MFA session',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// AUTORIZACIÓN BASADA EN ROLES (RBAC)
// ============================================================================

/**
 * POST /rbac/check-permission
 * Verificar permiso de usuario
 */
router.post('/rbac/check-permission', async (req, res) => {
  try {
    const { userId, resource, action, context } = CheckPermissionSchema.parse(req.body);
    
    const hasPermission = await advancedSecurityFramework.checkPermission(userId, resource, action, context);
    
    structuredLogger.info('Permission check performed', { userId, resource, action, hasPermission });
    
    res.json({
      success: true,
      data: { hasPermission },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      structuredLogger.warn('Invalid permission check request', { errors: error.errors });
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors
      });
    }

    structuredLogger.error('Failed to check permission', error as Error);
    res.status(500).json({
      success: false,
      error: 'Failed to check permission',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /rbac/assign-role
 * Asignar rol a usuario
 */
router.post('/rbac/assign-role', async (req, res) => {
  try {
    const { userId, roleId, assignedBy } = AssignRoleSchema.parse(req.body);
    
    await advancedSecurityFramework.assignRole(userId, roleId, assignedBy);
    
    structuredLogger.info('Role assigned', { userId, roleId, assignedBy });
    
    res.status(201).json({
      success: true,
      message: 'Role assigned successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      structuredLogger.warn('Invalid role assignment request', { errors: error.errors });
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors
      });
    }

    structuredLogger.error('Failed to assign role', error as Error);
    res.status(500).json({
      success: false,
      error: 'Failed to assign role',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// PROTECCIÓN CSRF
// ============================================================================

/**
 * GET /csrf/generate
 * Generar token CSRF
 */
router.get('/csrf/generate', async (req, res) => {
  try {
    const token = advancedSecurityFramework.generateCSRFToken();
    
    structuredLogger.info('CSRF token generated');
    
    res.json({
      success: true,
      data: { token },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to generate CSRF token', error as Error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate CSRF token',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /csrf/verify
 * Verificar token CSRF
 */
router.post('/csrf/verify', async (req, res) => {
  try {
    const { token, sessionToken } = VerifyCSRFSchema.parse(req.body);
    
    const isValid = advancedSecurityFramework.verifyCSRFToken(token, sessionToken);
    
    structuredLogger.info('CSRF token verification', { isValid });
    
    res.json({
      success: true,
      data: { isValid },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      structuredLogger.warn('Invalid CSRF verification request', { errors: error.errors });
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors
      });
    }

    structuredLogger.error('Failed to verify CSRF token', error as Error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify CSRF token',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// SANITIZACIÓN DE ENTRADA
// ============================================================================

/**
 * POST /sanitize
 * Sanitizar entrada de datos
 */
router.post('/sanitize', async (req, res) => {
  try {
    const { input } = SanitizeInputSchema.parse(req.body);
    
    const sanitizedInput = advancedSecurityFramework.sanitizeInput(input);
    
    structuredLogger.info('Input sanitized');
    
    res.json({
      success: true,
      data: { sanitizedInput },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      structuredLogger.warn('Invalid sanitization request', { errors: error.errors });
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors
      });
    }

    if (error instanceof Error && error.message.includes('Blocked pattern')) {
      structuredLogger.warn('Blocked pattern detected', { message: error.message });
      return res.status(400).json({
        success: false,
        error: 'Blocked pattern detected',
        message: error.message
      });
    }

    structuredLogger.error('Failed to sanitize input', error as Error);
    res.status(500).json({
      success: false,
      error: 'Failed to sanitize input',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// DETECCIÓN DE AMENAZAS
// ============================================================================

/**
 * POST /threats/detect
 * Detectar amenazas en request
 */
router.post('/threats/detect', async (req, res) => {
  try {
    const { request, ipAddress, userAgent } = DetectThreatsSchema.parse(req.body);
    
    const result = await advancedSecurityFramework.detectThreats(request, ipAddress, userAgent);
    
    structuredLogger.info('Threat detection performed', { 
      isThreat: result.isThreat, 
      riskScore: result.riskScore,
      threats: result.threats
    });
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      structuredLogger.warn('Invalid threat detection request', { errors: error.errors });
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors
      });
    }

    structuredLogger.error('Failed to detect threats', error as Error);
    res.status(500).json({
      success: false,
      error: 'Failed to detect threats',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// COMPLIANCE Y AUDITORÍA
// ============================================================================

/**
 * POST /compliance/check
 * Verificar compliance
 */
router.post('/compliance/check', async (req, res) => {
  try {
    const { userId, action, resource, data } = CheckComplianceSchema.parse(req.body);
    
    const result = await advancedSecurityFramework.checkCompliance(userId, action, resource, data);
    
    structuredLogger.info('Compliance check performed', { 
      userId, 
      action, 
      resource, 
      compliant: result.compliant,
      violations: result.violations
    });
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      structuredLogger.warn('Invalid compliance check request', { errors: error.errors });
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors
      });
    }

    structuredLogger.error('Failed to check compliance', error as Error);
    res.status(500).json({
      success: false,
      error: 'Failed to check compliance',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// MÉTRICAS Y MONITOREO
// ============================================================================

/**
 * GET /metrics
 * Obtener métricas de seguridad
 */
router.get('/metrics', async (req, res) => {
  try {
    const metrics = await advancedSecurityFramework.getSecurityMetrics();
    
    structuredLogger.info('Security metrics requested');
    
    res.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to get security metrics', error as Error);
    res.status(500).json({
      success: false,
      error: 'Failed to get security metrics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// HEALTH CHECK
// ============================================================================

/**
 * GET /health
 * Health check del servicio de seguridad
 */
router.get('/health', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        mfa: 'operational',
        rbac: 'operational',
        csrf: 'operational',
        sanitization: 'operational',
        threatDetection: 'operational',
        compliance: 'operational'
      },
      uptime: process.uptime()
    };

    structuredLogger.info('Security framework health check', health);

    res.json(health);
  } catch (error) {
    structuredLogger.error('Security framework health check failed', error as Error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
