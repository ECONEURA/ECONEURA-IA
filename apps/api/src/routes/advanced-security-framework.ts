import { Router } from 'express';
import { z } from 'zod';
import { advancedSecurityFramework } from '../lib/advanced-security-framework.service.js';
import { logger } from '@econeura/shared/logger';

const router = Router();

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const MFASetupSchema = z.object({
  userId: z.string().uuid(),
  method: z.enum(['totp', 'sms', 'email']),
  phoneNumber: z.string().optional(),
  email: z.string().email().optional()
});

const MFACodeSchema = z.object({
  userId: z.string().uuid(),
  code: z.string().length(6),
  method: z.enum(['totp', 'sms', 'email', 'backup'])
});

const RBACPermissionSchema = z.object({
  userId: z.string().uuid(),
  resource: z.string().min(1),
  action: z.string().min(1),
  context: z.record(z.any()).optional()
});

const RoleAssignmentSchema = z.object({
  userId: z.string().uuid(),
  role: z.string().min(1),
  assignedBy: z.string().uuid()
});

const CSRFTokenSchema = z.object({
  sessionId: z.string().min(1),
  token: z.string().min(32)
});

const SanitizeInputSchema = z.object({
  input: z.string().min(1),
  type: z.enum(['html', 'sql', 'xss', 'general']).optional()
});

const ThreatDetectionSchema = z.object({
  ipAddress: z.string().ip(),
  userAgent: z.string().min(1),
  request: z.record(z.any()),
  riskFactors: z.array(z.string())
});

const ComplianceCheckSchema = z.object({
  organizationId: z.string().uuid(),
  complianceType: z.enum(['gdpr', 'sox', 'pci-dss', 'hipaa', 'iso27001'])
});

// ============================================================================
// MFA ENDPOINTS
// ============================================================================

/**
 * @route POST /v1/security-framework/mfa/initialize
 * @desc Initialize MFA for a user
 * @access Private
 */
router.post('/mfa/initialize', async (req, res) => {
  try {
    const validatedData = MFASetupSchema.parse(req.body);

    const result = await advancedSecurityFramework.initializeMFA(validatedData);

    logger.info('MFA initialization request processed', {
      userId: validatedData.userId,
      method: validatedData.method
    });

    res.status(200).json({
      success: true,
      data: result,
      message: 'MFA initialized successfully'
    });
  } catch (error) {
    logger.error('MFA initialization failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to initialize MFA'
    });
  }
});

/**
 * @route POST /v1/security-framework/mfa/verify
 * @desc Verify MFA code
 * @access Private
 */
router.post('/mfa/verify', async (req, res) => {
  try {
    const validatedData = MFACodeSchema.parse(req.body);

    const result = await advancedSecurityFramework.verifyMFACode(validatedData);

    logger.info('MFA verification request processed', {
      userId: validatedData.userId,
      method: validatedData.method,
      success: result.valid
    });

    res.status(200).json({
      success: true,
      data: result,
      message: result.valid ? 'MFA verification successful' : 'MFA verification failed'
    });
  } catch (error) {
    logger.error('MFA verification failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to verify MFA code'
    });
  }
});

/**
 * @route POST /v1/security-framework/mfa/session
 * @desc Create MFA session
 * @access Private
 */
router.post('/mfa/session', async (req, res) => {
  try {
    const { userId, sessionData } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required',
        message: 'Failed to create MFA session'
      });
    }

    const sessionId = await advancedSecurityFramework.createMFASession(userId, sessionData);

    logger.info('MFA session creation request processed', { userId, sessionId });

    res.status(200).json({
      success: true,
      data: { sessionId },
      message: 'MFA session created successfully'
    });
  } catch (error) {
    logger.error('MFA session creation failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to create MFA session'
    });
  }
});

// ============================================================================
// RBAC ENDPOINTS
// ============================================================================

/**
 * @route POST /v1/security-framework/rbac/check-permission
 * @desc Check user permission for a resource and action
 * @access Private
 */
router.post('/rbac/check-permission', async (req, res) => {
  try {
    const validatedData = RBACPermissionSchema.parse(req.body);

    const result = await advancedSecurityFramework.checkPermission(validatedData);

    logger.info('RBAC permission check request processed', {
      userId: validatedData.userId,
      resource: validatedData.resource,
      action: validatedData.action,
      allowed: result.allowed
    });

    res.status(200).json({
      success: true,
      data: result,
      message: result.allowed ? 'Permission granted' : 'Permission denied'
    });
  } catch (error) {
    logger.error('RBAC permission check failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to check permission'
    });
  }
});

/**
 * @route POST /v1/security-framework/rbac/assign-role
 * @desc Assign role to user
 * @access Private
 */
router.post('/rbac/assign-role', async (req, res) => {
  try {
    const validatedData = RoleAssignmentSchema.parse(req.body);

    const result = await advancedSecurityFramework.assignRole(
      validatedData.userId,
      validatedData.role,
      validatedData.assignedBy
    );

    logger.info('RBAC role assignment request processed', {
      userId: validatedData.userId,
      role: validatedData.role,
      assignedBy: validatedData.assignedBy,
      success: result.success
    });

    res.status(200).json({
      success: true,
      data: result,
      message: 'Role assigned successfully'
    });
  } catch (error) {
    logger.error('RBAC role assignment failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to assign role'
    });
  }
});

// ============================================================================
// CSRF ENDPOINTS
// ============================================================================

/**
 * @route GET /v1/security-framework/csrf/generate
 * @desc Generate CSRF token
 * @access Private
 */
router.get('/csrf/generate', async (req, res) => {
  try {
    const { sessionId } = req.query;

    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required',
        message: 'Failed to generate CSRF token'
      });
    }

    const token = await advancedSecurityFramework.generateCSRFToken(sessionId);

    logger.info('CSRF token generation request processed', { sessionId });

    res.status(200).json({
      success: true,
      data: { token },
      message: 'CSRF token generated successfully'
    });
  } catch (error) {
    logger.error('CSRF token generation failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to generate CSRF token'
    });
  }
});

/**
 * @route POST /v1/security-framework/csrf/verify
 * @desc Verify CSRF token
 * @access Private
 */
router.post('/csrf/verify', async (req, res) => {
  try {
    const validatedData = CSRFTokenSchema.parse(req.body);

    const result = await advancedSecurityFramework.verifyCSRFToken(validatedData);

    logger.info('CSRF token verification request processed', {
      sessionId: validatedData.sessionId,
      valid: result.valid
    });

    res.status(200).json({
      success: true,
      data: result,
      message: result.valid ? 'CSRF token is valid' : 'CSRF token is invalid'
    });
  } catch (error) {
    logger.error('CSRF token verification failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to verify CSRF token'
    });
  }
});

// ============================================================================
// INPUT SANITIZATION ENDPOINTS
// ============================================================================

/**
 * @route POST /v1/security-framework/sanitize
 * @desc Sanitize input data
 * @access Private
 */
router.post('/sanitize', async (req, res) => {
  try {
    const validatedData = SanitizeInputSchema.parse(req.body);

    const result = await advancedSecurityFramework.sanitizeInput(validatedData);

    logger.info('Input sanitization request processed', {
      type: validatedData.type,
      threats: result.threats.length
    });

    res.status(200).json({
      success: true,
      data: result,
      message: 'Input sanitized successfully'
    });
  } catch (error) {
    logger.error('Input sanitization failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to sanitize input'
    });
  }
});

// ============================================================================
// THREAT DETECTION ENDPOINTS
// ============================================================================

/**
 * @route POST /v1/security-framework/threats/detect
 * @desc Detect security threats
 * @access Private
 */
router.post('/threats/detect', async (req, res) => {
  try {
    const validatedData = ThreatDetectionSchema.parse(req.body);

    const result = await advancedSecurityFramework.detectThreats(validatedData);

    logger.info('Threat detection request processed', {
      ipAddress: validatedData.ipAddress,
      threats: result.threats.length,
      riskScore: result.riskScore,
      blocked: result.blocked
    });

    res.status(200).json({
      success: true,
      data: result,
      message: result.blocked ? 'Threats detected and blocked' : 'Threats detected'
    });
  } catch (error) {
    logger.error('Threat detection failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to detect threats'
    });
  }
});

// ============================================================================
// COMPLIANCE ENDPOINTS
// ============================================================================

/**
 * @route POST /v1/security-framework/compliance/check
 * @desc Check compliance status
 * @access Private
 */
router.post('/compliance/check', async (req, res) => {
  try {
    const validatedData = ComplianceCheckSchema.parse(req.body);

    const result = await advancedSecurityFramework.checkCompliance(
      validatedData.organizationId,
      validatedData.complianceType
    );

    logger.info('Compliance check request processed', {
      organizationId: validatedData.organizationId,
      complianceType: validatedData.complianceType,
      compliant: result.compliant,
      score: result.score
    });

    res.status(200).json({
      success: true,
      data: result,
      message: result.compliant ? 'Compliance check passed' : 'Compliance violations detected'
    });
  } catch (error) {
    logger.error('Compliance check failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to check compliance'
    });
  }
});

// ============================================================================
// METRICS & MONITORING ENDPOINTS
// ============================================================================

/**
 * @route GET /v1/security-framework/metrics
 * @desc Get security metrics
 * @access Private
 */
router.get('/metrics', async (req, res) => {
  try {
    const metrics = await advancedSecurityFramework.getSecurityMetrics();

    logger.info('Security metrics request processed');

    res.status(200).json({
      success: true,
      data: metrics,
      message: 'Security metrics retrieved successfully'
    });
  } catch (error) {
    logger.error('Failed to get security metrics', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to retrieve security metrics'
    });
  }
});

/**
 * @route GET /v1/security-framework/health
 * @desc Get health status
 * @access Public
 */
router.get('/health', async (req, res) => {
  try {
    const health = await advancedSecurityFramework.getHealthStatus();

    logger.info('Health check request processed', { status: health.status });

    res.status(200).json({
      success: true,
      data: health,
      message: 'Health check completed'
    });
  } catch (error) {
    logger.error('Health check failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Health check failed'
    });
  }
});

// ============================================================================
// ERROR HANDLING MIDDLEWARE
// ============================================================================

router.use((error: any, req: any, res: any, next: any) => {
  logger.error('Advanced Security Framework route error', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method
  });

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: 'An unexpected error occurred'
  });
});

export { router as advancedSecurityFrameworkRouter };
