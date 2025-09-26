/**
 * PR-57: Security Framework Routes
 * 
 * Endpoints para el sistema avanzado de seguridad con MFA,
 * RBAC, CSRF protection y detección de amenazas.
 */

import { Router } from 'express';
import { z } from 'zod';

import { securityManagerService } from '../security/security-manager.service.js';
import { mfaService } from '../security/mfa.service.js';
import { rbacService } from '../security/rbac.service.js';
import { structuredLogger } from '../lib/structured-logger.js';

const router = Router();

// Schemas de validación
const initializeMFASchema = z.object({
  userId: z.string().min(1)
});

const verifyTOTPSchema = z.object({
  userId: z.string().min(1),
  code: z.string().length(6)
});

const sendSMSSchema = z.object({
  userId: z.string().min(1),
  phoneNumber: z.string().min(10)
});

const sendEmailSchema = z.object({
  userId: z.string().min(1),
  email: z.string().email()
});

const verifyCodeSchema = z.object({
  userId: z.string().min(1),
  code: z.string().min(4),
  type: z.enum(['sms', 'email'])
});

const verifyBackupCodeSchema = z.object({
  userId: z.string().min(1),
  code: z.string().length(8)
});

const createMFASessionSchema = z.object({
  userId: z.string().min(1),
  requiredMethods: z.array(z.string()).min(1),
  ipAddress: z.string().ip(),
  userAgent: z.string().min(1)
});

const completeMFAMethodSchema = z.object({
  sessionId: z.string().min(1),
  methodId: z.string().min(1)
});

const assignRoleSchema = z.object({
  userId: z.string().min(1),
  roleId: z.string().min(1),
  organizationId: z.string().min(1),
  assignedBy: z.string().min(1),
  expiresAt: z.string().datetime().optional()
});

const revokeRoleSchema = z.object({
  userId: z.string().min(1),
  roleId: z.string().min(1),
  organizationId: z.string().min(1),
  revokedBy: z.string().min(1)
});

const createRoleSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().min(10).max(500),
  permissions: z.array(z.string()).min(1),
  inheritedRoles: z.array(z.string()).optional(),
  organizationId: z.string().min(1),
  isSystem: z.boolean().default(false)
});

const checkPermissionSchema = z.object({
  userId: z.string().min(1),
  permission: z.string().min(1),
  resource: z.string().optional(),
  organizationId: z.string().optional()
});

const sanitizeInputSchema = z.object({
  input: z.string().min(1).max(10000)
});

/**
 * GET /security/stats
 * Obtiene estadísticas de seguridad
 */
router.get('/stats', async (req, res) => {
  try {
    const securityStats = securityManagerService.getSecurityStats();
    const mfaStats = mfaService.getMFAStats();
    const rbacStats = rbacService.getRBACStats();
    
    res.json({
      success: true,
      data: {
        security: securityStats,
        mfa: mfaStats,
        rbac: rbacStats
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to get security stats', {
      error: error instanceof Error ? error.message : String(error),
      requestId: req.headers['x-request-id'] as string || ''
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to get security stats',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * POST /security/mfa/initialize
 * Inicializa MFA para un usuario
 */
router.post('/mfa/initialize', async (req, res) => {
  try {
    const validatedData = initializeMFASchema.parse(req.body);
    
    const result = await mfaService.initializeMFA(validatedData.userId);
    
    structuredLogger.info('MFA initialized', {
      userId: validatedData.userId,
      methodsCount: result.methods.length,
      requestId: req.headers['x-request-id'] as string || ''
    });
    
    res.json({
      success: true,
      data: result,
      message: 'MFA initialized successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to initialize MFA', {
      error: error instanceof Error ? error.message : String(error),
      requestId: req.headers['x-request-id'] as string || ''
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to initialize MFA',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * POST /security/mfa/verify-totp
 * Verifica código TOTP
 */
router.post('/mfa/verify-totp', async (req, res) => {
  try {
    const validatedData = verifyTOTPSchema.parse(req.body);
    
    const isValid = await mfaService.verifyTOTPCode(
      validatedData.userId,
      validatedData.code
    );
    
    if (isValid) {
      structuredLogger.info('TOTP verification successful', {
        userId: validatedData.userId,
        requestId: req.headers['x-request-id'] as string || ''
      });
      
      res.json({
        success: true,
        data: { verified: true },
        message: 'TOTP code verified successfully',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Invalid TOTP code',
        message: 'The provided TOTP code is invalid'
      });
    }
  } catch (error) {
    structuredLogger.error('Failed to verify TOTP', {
      error: error instanceof Error ? error.message : String(error),
      requestId: req.headers['x-request-id'] as string || ''
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to verify TOTP',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * POST /security/mfa/send-sms
 * Envía código SMS
 */
router.post('/mfa/send-sms', async (req, res) => {
  try {
    const validatedData = sendSMSSchema.parse(req.body);
    
    const code = await mfaService.sendSMSCode(
      validatedData.userId,
      validatedData.phoneNumber
    );
    
    structuredLogger.info('SMS code sent', {
      userId: validatedData.userId,
      phoneNumber: validatedData.phoneNumber.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2'),
      requestId: req.headers['x-request-id'] as string || ''
    });
    
    res.json({
      success: true,
      data: { code }, // En producción, no devolver el código
      message: 'SMS code sent successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to send SMS code', {
      error: error instanceof Error ? error.message : String(error),
      requestId: req.headers['x-request-id'] as string || ''
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to send SMS code',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * POST /security/mfa/send-email
 * Envía código por email
 */
router.post('/mfa/send-email', async (req, res) => {
  try {
    const validatedData = sendEmailSchema.parse(req.body);
    
    const code = await mfaService.sendEmailCode(
      validatedData.userId,
      validatedData.email
    );
    
    structuredLogger.info('Email code sent', {
      userId: validatedData.userId,
      email: validatedData.email.replace(/(.{2}).*(@.*)/, '$1****$2'),
      requestId: req.headers['x-request-id'] as string || ''
    });
    
    res.json({
      success: true,
      data: { code }, // En producción, no devolver el código
      message: 'Email code sent successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to send email code', {
      error: error instanceof Error ? error.message : String(error),
      requestId: req.headers['x-request-id'] as string || ''
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to send email code',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * POST /security/mfa/verify-code
 * Verifica código SMS o Email
 */
router.post('/mfa/verify-code', async (req, res) => {
  try {
    const validatedData = verifyCodeSchema.parse(req.body);
    
    const isValid = await mfaService.verifyCode(
      validatedData.userId,
      validatedData.code,
      validatedData.type
    );
    
    if (isValid) {
      structuredLogger.info('Code verification successful', {
        userId: validatedData.userId,
        type: validatedData.type,
        requestId: req.headers['x-request-id'] as string || ''
      });
      
      res.json({
        success: true,
        data: { verified: true },
        message: `${validatedData.type.toUpperCase()} code verified successfully`,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Invalid code',
        message: `The provided ${validatedData.type.toUpperCase()} code is invalid`
      });
    }
  } catch (error) {
    structuredLogger.error('Failed to verify code', {
      error: error instanceof Error ? error.message : String(error),
      requestId: req.headers['x-request-id'] as string || ''
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to verify code',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * POST /security/mfa/verify-backup
 * Verifica código de respaldo
 */
router.post('/mfa/verify-backup', async (req, res) => {
  try {
    const validatedData = verifyBackupCodeSchema.parse(req.body);
    
    const isValid = await mfaService.verifyBackupCode(
      validatedData.userId,
      validatedData.code
    );
    
    if (isValid) {
      structuredLogger.info('Backup code verification successful', {
        userId: validatedData.userId,
        requestId: req.headers['x-request-id'] as string || ''
      });
      
      res.json({
        success: true,
        data: { verified: true },
        message: 'Backup code verified successfully',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Invalid backup code',
        message: 'The provided backup code is invalid'
      });
    }
  } catch (error) {
    structuredLogger.error('Failed to verify backup code', {
      error: error instanceof Error ? error.message : String(error),
      requestId: req.headers['x-request-id'] as string || ''
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to verify backup code',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * POST /security/mfa/session
 * Crea una sesión MFA
 */
router.post('/mfa/session', async (req, res) => {
  try {
    const validatedData = createMFASessionSchema.parse(req.body);
    
    const session = await mfaService.createMFASession(
      validatedData.userId,
      validatedData.requiredMethods,
      validatedData.ipAddress,
      validatedData.userAgent
    );
    
    structuredLogger.info('MFA session created', {
      userId: validatedData.userId,
      sessionId: session.sessionId,
      requiredMethods: validatedData.requiredMethods,
      requestId: req.headers['x-request-id'] as string || ''
    });
    
    res.json({
      success: true,
      data: session,
      message: 'MFA session created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to create MFA session', {
      error: error instanceof Error ? error.message : String(error),
      requestId: req.headers['x-request-id'] as string || ''
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to create MFA session',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * POST /security/mfa/complete-method
 * Completa un método MFA en la sesión
 */
router.post('/mfa/complete-method', async (req, res) => {
  try {
    const validatedData = completeMFAMethodSchema.parse(req.body);
    
    const isComplete = await mfaService.completeMFAMethod(
      validatedData.sessionId,
      validatedData.methodId
    );
    
    structuredLogger.info('MFA method completed', {
      sessionId: validatedData.sessionId,
      methodId: validatedData.methodId,
      isComplete,
      requestId: req.headers['x-request-id'] as string || ''
    });
    
    res.json({
      success: true,
      data: { isComplete },
      message: isComplete ? 'MFA session completed' : 'MFA method completed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to complete MFA method', {
      error: error instanceof Error ? error.message : String(error),
      requestId: req.headers['x-request-id'] as string || ''
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to complete MFA method',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /security/mfa/notifications/:userId
 * Obtiene notificaciones MFA del usuario
 */
router.get('/mfa/notifications/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const notifications = await mfaService.getUserNotifications(userId);
    
    res.json({
      success: true,
      data: notifications,
      count: notifications.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to get MFA notifications', {
      userId: req.params.userId,
      error: error instanceof Error ? error.message : String(error),
      requestId: req.headers['x-request-id'] as string || ''
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to get MFA notifications',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * PUT /security/mfa/notifications/:userId/:notificationId/read
 * Marca notificación como leída
 */
router.put('/mfa/notifications/:userId/:notificationId/read', async (req, res) => {
  try {
    const { userId, notificationId } = req.params;
    
    const success = await mfaService.markNotificationAsRead(userId, notificationId);
    
    if (success) {
      res.json({
        success: true,
        message: 'Notification marked as read',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }
  } catch (error) {
    structuredLogger.error('Failed to mark notification as read', {
      userId: req.params.userId,
      notificationId: req.params.notificationId,
      error: error instanceof Error ? error.message : String(error),
      requestId: req.headers['x-request-id'] as string || ''
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * POST /security/rbac/assign-role
 * Asigna un rol a un usuario
 */
router.post('/rbac/assign-role', async (req, res) => {
  try {
    const validatedData = assignRoleSchema.parse(req.body);
    
    const success = await rbacService.assignRole(
      validatedData.userId,
      validatedData.roleId,
      validatedData.organizationId,
      validatedData.assignedBy,
      validatedData.expiresAt ? new Date(validatedData.expiresAt) : undefined
    );
    
    if (success) {
      structuredLogger.info('Role assigned successfully', {
        userId: validatedData.userId,
        roleId: validatedData.roleId,
        organizationId: validatedData.organizationId,
        assignedBy: validatedData.assignedBy,
        requestId: req.headers['x-request-id'] as string || ''
      });
      
      res.json({
        success: true,
        message: 'Role assigned successfully',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to assign role'
      });
    }
  } catch (error) {
    structuredLogger.error('Failed to assign role', {
      error: error instanceof Error ? error.message : String(error),
      requestId: req.headers['x-request-id'] as string || ''
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to assign role',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * POST /security/rbac/revoke-role
 * Revoca un rol de un usuario
 */
router.post('/rbac/revoke-role', async (req, res) => {
  try {
    const validatedData = revokeRoleSchema.parse(req.body);
    
    const success = await rbacService.revokeRole(
      validatedData.userId,
      validatedData.roleId,
      validatedData.organizationId,
      validatedData.revokedBy
    );
    
    if (success) {
      structuredLogger.info('Role revoked successfully', {
        userId: validatedData.userId,
        roleId: validatedData.roleId,
        organizationId: validatedData.organizationId,
        revokedBy: validatedData.revokedBy,
        requestId: req.headers['x-request-id'] as string || ''
      });
      
      res.json({
        success: true,
        message: 'Role revoked successfully',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to revoke role'
      });
    }
  } catch (error) {
    structuredLogger.error('Failed to revoke role', {
      error: error instanceof Error ? error.message : String(error),
      requestId: req.headers['x-request-id'] as string || ''
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to revoke role',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * POST /security/rbac/create-role
 * Crea un nuevo rol
 */
router.post('/rbac/create-role', async (req, res) => {
  try {
    const validatedData = createRoleSchema.parse(req.body);
    
    const role = await rbacService.createRole(validatedData);
    
    structuredLogger.info('Role created successfully', {
      roleId: role.id,
      roleName: role.name,
      organizationId: role.organizationId,
      permissionsCount: role.permissions.length,
      requestId: req.headers['x-request-id'] as string || ''
    });
    
    res.json({
      success: true,
      data: role,
      message: 'Role created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to create role', {
      error: error instanceof Error ? error.message : String(error),
      requestId: req.headers['x-request-id'] as string || ''
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to create role',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * POST /security/rbac/check-permission
 * Verifica permisos de un usuario
 */
router.post('/rbac/check-permission', async (req, res) => {
  try {
    const validatedData = checkPermissionSchema.parse(req.body);
    
    const decision = await rbacService.checkPermission(
      validatedData.userId,
      validatedData.permission,
      validatedData.resource,
      validatedData.organizationId
    );
    
    structuredLogger.info('Permission check completed', {
      userId: validatedData.userId,
      permission: validatedData.permission,
      resource: validatedData.resource,
      allowed: decision.allowed,
      reason: decision.reason,
      requestId: req.headers['x-request-id'] as string || ''
    });
    
    res.json({
      success: true,
      data: decision,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to check permission', {
      error: error instanceof Error ? error.message : String(error),
      requestId: req.headers['x-request-id'] as string || ''
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to check permission',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /security/rbac/user-roles/:userId
 * Obtiene roles de un usuario
 */
router.get('/rbac/user-roles/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { organizationId } = req.query;
    
    const userRoles = rbacService.getUserRoles(userId, organizationId as string);
    
    res.json({
      success: true,
      data: userRoles,
      count: userRoles.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to get user roles', {
      userId: req.params.userId,
      error: error instanceof Error ? error.message : String(error),
      requestId: req.headers['x-request-id'] as string || ''
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to get user roles',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /security/rbac/user-permissions/:userId
 * Obtiene permisos efectivos de un usuario
 */
router.get('/rbac/user-permissions/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { organizationId } = req.query;
    
    const permissions = rbacService.getUserPermissions(userId, organizationId as string);
    
    res.json({
      success: true,
      data: permissions,
      count: permissions.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to get user permissions', {
      userId: req.params.userId,
      error: error instanceof Error ? error.message : String(error),
      requestId: req.headers['x-request-id'] as string || ''
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to get user permissions',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * POST /security/sanitize-input
 * Sanitiza entrada de usuario
 */
router.post('/sanitize-input', async (req, res) => {
  try {
    const validatedData = sanitizeInputSchema.parse(req.body);
    
    const sanitizedInput = securityManagerService.sanitizeInput(validatedData.input);
    
    res.json({
      success: true,
      data: {
        original: validatedData.input,
        sanitized: sanitizedInput,
        wasSanitized: validatedData.input !== sanitizedInput
      },
      message: 'Input sanitized successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to sanitize input', {
      error: error instanceof Error ? error.message : String(error),
      requestId: req.headers['x-request-id'] as string || ''
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to sanitize input',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * POST /security/generate-csrf-token
 * Genera token CSRF
 */
router.post('/generate-csrf-token', async (req, res) => {
  try {
    const token = securityManagerService.generateCSRFToken();
    
    res.json({
      success: true,
      data: { token },
      message: 'CSRF token generated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to generate CSRF token', {
      error: error instanceof Error ? error.message : String(error),
      requestId: req.headers['x-request-id'] as string || ''
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to generate CSRF token',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * POST /security/verify-csrf-token
 * Verifica token CSRF
 */
router.post('/verify-csrf-token', async (req, res) => {
  try {
    const { token, sessionToken } = req.body;
    
    if (!token || !sessionToken) {
      return res.status(400).json({
        success: false,
        error: 'Missing token or session token'
      });
    }
    
    const isValid = securityManagerService.verifyCSRFToken(token, sessionToken);
    
    res.json({
      success: true,
      data: { valid: isValid },
      message: isValid ? 'CSRF token is valid' : 'CSRF token is invalid',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to verify CSRF token', {
      error: error instanceof Error ? error.message : String(error),
      requestId: req.headers['x-request-id'] as string || ''
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to verify CSRF token',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;
