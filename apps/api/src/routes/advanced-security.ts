/**
 * PR-54: Advanced Security Routes
 * 
 * Endpoints para gestión avanzada de seguridad y compliance
 */

import { Router } from 'express';
import { z } from 'zod';
import { securityComplianceEnhanced } from '../lib/security-compliance-enhanced.service.js';
import { structuredLogger } from '../lib/structured-logger.js';

const router = Router();

// Validation schemas
const SecurityEventSchema = z.object({
  type: z.enum(['authentication', 'authorization', 'data_access', 'data_modification', 'security_violation', 'compliance_breach']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  ipAddress: z.string().ip(),
  userAgent: z.string(),
  resource: z.string(),
  action: z.string(),
  result: z.enum(['success', 'failure', 'blocked']),
  details: z.record(z.any())
});

const ComplianceRuleSchema = z.object({
  name: z.string().min(1),
  framework: z.enum(['GDPR', 'SOX', 'PCI-DSS', 'HIPAA', 'ISO27001']),
  description: z.string(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  enabled: z.boolean(),
  conditions: z.array(z.object({
    field: z.string(),
    operator: z.enum(['equals', 'not_equals', 'contains', 'greater_than', 'less_than']),
    value: z.any(),
    weight: z.number().min(0).max(1)
  })),
  actions: z.array(z.object({
    type: z.enum(['alert', 'block', 'log', 'notify', 'auto_remediate']),
    parameters: z.record(z.any())
  }))
});

const ThreatDetectionRuleSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  enabled: z.boolean(),
  conditions: z.array(z.object({
    field: z.string(),
    operator: z.enum(['equals', 'not_equals', 'contains', 'regex', 'frequency']),
    value: z.any(),
    timeWindow: z.number().optional(),
    threshold: z.number().optional()
  })),
  actions: z.array(z.object({
    type: z.enum(['block', 'alert', 'quarantine', 'escalate', 'log']),
    parameters: z.record(z.any())
  })),
  riskScore: z.number().min(0).max(100)
});

/**
 * GET /advanced-security/events
 * Obtiene eventos de seguridad
 */
router.get('/events', async (req, res) => {
  const traceId = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const { 
      type, 
      severity, 
      userId, 
      startDate, 
      endDate, 
      limit = 50 
    } = req.query;

    const filters = {
      type: type as string,
      severity: severity as string,
      userId: userId as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      limit: parseInt(limit as string, 10)
    };

    const events = await securityComplianceEnhanced.getSecurityEvents(filters);
    
    structuredLogger.info('Security events requested', {
      traceId,
      filters,
      count: events.length
    });

    res.json({
      success: true,
      data: {
        events,
        count: events.length,
        filters
      },
      timestamp: new Date().toISOString(),
      traceId
    });

  } catch (error) {
    structuredLogger.error('Failed to get security events', {
      error: error instanceof Error ? error.message : String(error),
      traceId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get security events',
      traceId
    });
  }
});

/**
 * POST /advanced-security/events
 * Registra un evento de seguridad
 */
router.post('/events', async (req, res) => {
  const traceId = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const eventData = SecurityEventSchema.parse(req.body);
    const event = await securityComplianceEnhanced.recordSecurityEvent(eventData);
    
    structuredLogger.info('Security event recorded', {
      traceId,
      eventId: event.id,
      type: event.type,
      severity: event.severity
    });

    res.status(201).json({
      success: true,
      data: event,
      timestamp: new Date().toISOString(),
      traceId
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid event data',
        details: error.errors,
        traceId
      });
    }

    structuredLogger.error('Failed to record security event', {
      error: error instanceof Error ? error.message : String(error),
      traceId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to record security event',
      traceId
    });
  }
});

/**
 * GET /advanced-security/compliance/rules
 * Obtiene reglas de compliance
 */
router.get('/compliance/rules', async (req, res) => {
  const traceId = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const { framework, enabled, limit = 50 } = req.query;

    const filters = {
      framework: framework as string,
      enabled: enabled ? enabled === 'true' : undefined,
      limit: parseInt(limit as string, 10)
    };

    const rules = await securityComplianceEnhanced.getComplianceRules(filters);
    
    structuredLogger.info('Compliance rules requested', {
      traceId,
      filters,
      count: rules.length
    });

    res.json({
      success: true,
      data: {
        rules,
        count: rules.length,
        filters
      },
      timestamp: new Date().toISOString(),
      traceId
    });

  } catch (error) {
    structuredLogger.error('Failed to get compliance rules', {
      error: error instanceof Error ? error.message : String(error),
      traceId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get compliance rules',
      traceId
    });
  }
});

/**
 * POST /advanced-security/compliance/rules
 * Crea una nueva regla de compliance
 */
router.post('/compliance/rules', async (req, res) => {
  const traceId = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const ruleData = ComplianceRuleSchema.parse(req.body);
    const rule = await securityComplianceEnhanced.createComplianceRule(ruleData);
    
    structuredLogger.info('Compliance rule created', {
      traceId,
      ruleId: rule.id,
      name: rule.name,
      framework: rule.framework
    });

    res.status(201).json({
      success: true,
      data: rule,
      timestamp: new Date().toISOString(),
      traceId
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid rule data',
        details: error.errors,
        traceId
      });
    }

    structuredLogger.error('Failed to create compliance rule', {
      error: error instanceof Error ? error.message : String(error),
      traceId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to create compliance rule',
      traceId
    });
  }
});

/**
 * GET /advanced-security/threat-detection/rules
 * Obtiene reglas de detección de amenazas
 */
router.get('/threat-detection/rules', async (req, res) => {
  const traceId = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const { enabled, riskScore, limit = 50 } = req.query;

    const filters = {
      enabled: enabled ? enabled === 'true' : undefined,
      riskScore: riskScore ? parseInt(riskScore as string, 10) : undefined,
      limit: parseInt(limit as string, 10)
    };

    const rules = await securityComplianceEnhanced.getThreatDetectionRules(filters);
    
    structuredLogger.info('Threat detection rules requested', {
      traceId,
      filters,
      count: rules.length
    });

    res.json({
      success: true,
      data: {
        rules,
        count: rules.length,
        filters
      },
      timestamp: new Date().toISOString(),
      traceId
    });

  } catch (error) {
    structuredLogger.error('Failed to get threat detection rules', {
      error: error instanceof Error ? error.message : String(error),
      traceId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get threat detection rules',
      traceId
    });
  }
});

/**
 * POST /advanced-security/threat-detection/rules
 * Crea una nueva regla de detección de amenazas
 */
router.post('/threat-detection/rules', async (req, res) => {
  const traceId = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const ruleData = ThreatDetectionRuleSchema.parse(req.body);
    const rule = await securityComplianceEnhanced.createThreatDetectionRule(ruleData);
    
    structuredLogger.info('Threat detection rule created', {
      traceId,
      ruleId: rule.id,
      name: rule.name,
      riskScore: rule.riskScore
    });

    res.status(201).json({
      success: true,
      data: rule,
      timestamp: new Date().toISOString(),
      traceId
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid rule data',
        details: error.errors,
        traceId
      });
    }

    structuredLogger.error('Failed to create threat detection rule', {
      error: error instanceof Error ? error.message : String(error),
      traceId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to create threat detection rule',
      traceId
    });
  }
});

/**
 * GET /advanced-security/dashboard
 * Obtiene dashboard de seguridad
 */
router.get('/dashboard', async (req, res) => {
  const traceId = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const dashboard = await securityComplianceEnhanced.getSecurityDashboard();
    
    structuredLogger.info('Security dashboard requested', {
      traceId
    });

    res.json({
      success: true,
      data: dashboard,
      timestamp: new Date().toISOString(),
      traceId
    });

  } catch (error) {
    structuredLogger.error('Failed to get security dashboard', {
      error: error instanceof Error ? error.message : String(error),
      traceId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get security dashboard',
      traceId
    });
  }
});

/**
 * GET /advanced-security/health
 * Health check del sistema de seguridad
 */
router.get('/health', async (req, res) => {
  const traceId = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const health = await securityComplianceEnhanced.getHealthStatus();
    
    const isHealthy = health.status === 'healthy';
    const statusCode = isHealthy ? 200 : 503;

    structuredLogger.info('Security health check', {
      traceId,
      status: health.status,
      isHealthy
    });

    res.status(statusCode).json({
      success: true,
      data: health,
      timestamp: new Date().toISOString(),
      traceId
    });

  } catch (error) {
    structuredLogger.error('Security health check failed', {
      error: error instanceof Error ? error.message : String(error),
      traceId
    });

    res.status(500).json({
      success: false,
      error: 'Security health check failed',
      traceId
    });
  }
});

export default router;