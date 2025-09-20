/**
 * PR-38: Advanced Audit & Compliance Monitoring Routes
 */

import { Router } from 'express';
import { z } from 'zod';
import { advancedAuditComplianceService } from '../lib/advanced-audit-compliance.service.js';
import { structuredLogger } from '../lib/structured-logger.js';

const router = Router();

// Schemas de validación
const AuditEventSchema = z.object({
  userId: z.string().min(1),
  organizationId: z.string().min(1),
  action: z.string().min(1),
  resource: z.string().min(1),
  resourceId: z.string().optional(),
  details: z.record(z.any()).optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  compliance: z.object({
    gdpr: z.boolean(),
    sox: z.boolean(),
    pci: z.boolean(),
    hipaa: z.boolean(),
    iso27001: z.boolean()
  }),
  riskScore: z.number().min(0).max(100),
  tags: z.array(z.string()).optional()
});

const ComplianceRuleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  framework: z.enum(['gdpr', 'sox', 'pci', 'hipaa', 'iso27001']),
  conditions: z.object({
    action: z.array(z.string()).optional(),
    resource: z.array(z.string()).optional(),
    severity: z.array(z.string()).optional(),
    timeWindow: z.number().optional(),
    threshold: z.number().optional()
  }),
  actions: z.object({
    alert: z.boolean(),
    block: z.boolean(),
    notify: z.array(z.string()),
    escalate: z.boolean()
  }),
  isActive: z.boolean().default(true)
});

const AuditFiltersSchema = z.object({
  organizationId: z.string().optional(),
  userId: z.string().optional(),
  action: z.string().optional(),
  resource: z.string().optional(),
  severity: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  limit: z.number().int().min(1).max(1000).default(50),
  offset: z.number().int().min(0).default(0)
});

const ViolationFiltersSchema = z.object({
  organizationId: z.string().optional(),
  status: z.string().optional(),
  severity: z.string().optional(),
  ruleId: z.string().optional(),
  limit: z.number().int().min(1).max(1000).default(50),
  offset: z.number().int().min(0).default(0)
});

const AuditReportSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  organizationId: z.string().min(1),
  period: z.object({
    start: z.string(),
    end: z.string()
  }),
  filters: z.object({
    actions: z.array(z.string()).optional(),
    resources: z.array(z.string()).optional(),
    severities: z.array(z.string()).optional(),
    frameworks: z.array(z.string()).optional()
  }).optional(),
  generatedBy: z.string().min(1)
});

const ViolationUpdateSchema = z.object({
  status: z.enum(['open', 'investigating', 'resolved', 'false_positive']),
  resolution: z.string().optional(),
  assignedTo: z.string().optional()
});

/**
 * POST /advanced-audit-compliance/events
 * Log a new audit event
 */
router.post('/events', async (req, res) => {
  const traceId = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const spanId = `span_${Math.random().toString(36).substr(2, 9)}`;

  try {
    const eventData = AuditEventSchema.parse(req.body);
    
    structuredLogger.info('Audit event logging requested', {
      traceId,
      spanId,
      action: eventData.action,
      resource: eventData.resource,
      severity: eventData.severity
    });

    const event = await advancedAuditComplianceService.logAuditEvent(eventData);

    structuredLogger.info('Audit event logged successfully', {
      traceId,
      spanId,
      eventId: event.id,
      riskScore: event.riskScore
    });

    res.status(201).json({
      success: true,
      data: {
        event,
        message: 'Audit event logged successfully',
        timestamp: new Date().toISOString(),
        traceId
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid audit event data',
        details: error.errors,
        traceId
      });
    }

    structuredLogger.error('Failed to log audit event', {
      error: error instanceof Error ? error.message : String(error),
      traceId,
      spanId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to log audit event',
      traceId
    });
  }
});

/**
 * GET /advanced-audit-compliance/events
 * Get audit events with filters
 */
router.get('/events', async (req, res) => {
  const traceId = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const spanId = `span_${Math.random().toString(36).substr(2, 9)}`;

  try {
    const filters = AuditFiltersSchema.parse(req.query);
    
    structuredLogger.info('Audit events requested', {
      traceId,
      spanId,
      filters
    });

    const result = await advancedAuditComplianceService.getAuditEvents(filters);

    structuredLogger.info('Audit events retrieved successfully', {
      traceId,
      spanId,
      total: result.total,
      returned: result.events.length
    });

    res.json({
      success: true,
      data: {
        events: result.events,
        total: result.total,
        filters,
        timestamp: new Date().toISOString(),
        traceId
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid filter parameters',
        details: error.errors,
        traceId
      });
    }

    structuredLogger.error('Failed to get audit events', {
      error: error instanceof Error ? error.message : String(error),
      traceId,
      spanId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get audit events',
      traceId
    });
  }
});

/**
 * GET /advanced-audit-compliance/rules
 * Get compliance rules
 */
router.get('/rules', async (req, res) => {
  const traceId = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const spanId = `span_${Math.random().toString(36).substr(2, 9)}`;

  try {
    const rules = await advancedAuditComplianceService.getComplianceRules();
    
    structuredLogger.info('Compliance rules requested', {
      traceId,
      spanId,
      count: rules.length
    });

    res.json({
      success: true,
      data: {
        rules,
        count: rules.length,
        timestamp: new Date().toISOString(),
        traceId
      }
    });

  } catch (error) {
    structuredLogger.error('Failed to get compliance rules', {
      error: error instanceof Error ? error.message : String(error),
      traceId,
      spanId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get compliance rules',
      traceId
    });
  }
});

/**
 * POST /advanced-audit-compliance/rules
 * Create a new compliance rule
 */
router.post('/rules', async (req, res) => {
  const traceId = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const spanId = `span_${Math.random().toString(36).substr(2, 9)}`;

  try {
    const ruleData = ComplianceRuleSchema.parse(req.body);
    
    structuredLogger.info('Compliance rule creation requested', {
      traceId,
      spanId,
      name: ruleData.name,
      framework: ruleData.framework
    });

    const rule = await advancedAuditComplianceService.createComplianceRule(ruleData);

    structuredLogger.info('Compliance rule created successfully', {
      traceId,
      spanId,
      ruleId: rule.id,
      name: rule.name
    });

    res.status(201).json({
      success: true,
      data: {
        rule,
        message: 'Compliance rule created successfully',
        timestamp: new Date().toISOString(),
        traceId
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid compliance rule data',
        details: error.errors,
        traceId
      });
    }

    structuredLogger.error('Failed to create compliance rule', {
      error: error instanceof Error ? error.message : String(error),
      traceId,
      spanId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to create compliance rule',
      traceId
    });
  }
});

/**
 * GET /advanced-audit-compliance/violations
 * Get compliance violations
 */
router.get('/violations', async (req, res) => {
  const traceId = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const spanId = `span_${Math.random().toString(36).substr(2, 9)}`;

  try {
    const filters = ViolationFiltersSchema.parse(req.query);
    
    structuredLogger.info('Compliance violations requested', {
      traceId,
      spanId,
      filters
    });

    const result = await advancedAuditComplianceService.getViolations(filters);

    structuredLogger.info('Compliance violations retrieved successfully', {
      traceId,
      spanId,
      total: result.total,
      returned: result.violations.length
    });

    res.json({
      success: true,
      data: {
        violations: result.violations,
        total: result.total,
        filters,
        timestamp: new Date().toISOString(),
        traceId
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid filter parameters',
        details: error.errors,
        traceId
      });
    }

    structuredLogger.error('Failed to get compliance violations', {
      error: error instanceof Error ? error.message : String(error),
      traceId,
      spanId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get compliance violations',
      traceId
    });
  }
});

/**
 * PUT /advanced-audit-compliance/violations/:id
 * Update violation status
 */
router.put('/violations/:id', async (req, res) => {
  const traceId = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const spanId = `span_${Math.random().toString(36).substr(2, 9)}`;
  const { id } = req.params;

  try {
    const updateData = ViolationUpdateSchema.parse(req.body);
    
    structuredLogger.info('Violation status update requested', {
      traceId,
      spanId,
      violationId: id,
      status: updateData.status
    });

    const violation = await advancedAuditComplianceService.updateViolationStatus(
      id,
      updateData.status,
      updateData.resolution,
      updateData.assignedTo
    );

    structuredLogger.info('Violation status updated successfully', {
      traceId,
      spanId,
      violationId: id,
      status: violation.status
    });

    res.json({
      success: true,
      data: {
        violation,
        message: 'Violation status updated successfully',
        timestamp: new Date().toISOString(),
        traceId
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid update data',
        details: error.errors,
        traceId
      });
    }

    if (error instanceof Error && error.message === 'Violation not found') {
      return res.status(404).json({
        success: false,
        error: 'Violation not found',
        traceId
      });
    }

    structuredLogger.error('Failed to update violation status', {
      error: error instanceof Error ? error.message : String(error),
      traceId,
      spanId,
      violationId: id
    });

    res.status(500).json({
      success: false,
      error: 'Failed to update violation status',
      traceId
    });
  }
});

/**
 * POST /advanced-audit-compliance/reports
 * Generate audit report
 */
router.post('/reports', async (req, res) => {
  const traceId = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const spanId = `span_${Math.random().toString(36).substr(2, 9)}`;

  try {
    const reportData = AuditReportSchema.parse(req.body);
    
    structuredLogger.info('Audit report generation requested', {
      traceId,
      spanId,
      name: reportData.name,
      organizationId: reportData.organizationId
    });

    const report = await advancedAuditComplianceService.generateAuditReport(reportData);

    structuredLogger.info('Audit report generated successfully', {
      traceId,
      spanId,
      reportId: report.id,
      totalEvents: report.metrics.totalEvents,
      complianceScore: report.metrics.complianceScore
    });

    res.status(201).json({
      success: true,
      data: {
        report,
        message: 'Audit report generated successfully',
        timestamp: new Date().toISOString(),
        traceId
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid report data',
        details: error.errors,
        traceId
      });
    }

    structuredLogger.error('Failed to generate audit report', {
      error: error instanceof Error ? error.message : String(error),
      traceId,
      spanId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to generate audit report',
      traceId
    });
  }
});

/**
 * GET /advanced-audit-compliance/reports/:organizationId
 * Get audit reports for organization
 */
router.get('/reports/:organizationId', async (req, res) => {
  const traceId = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const spanId = `span_${Math.random().toString(36).substr(2, 9)}`;
  const { organizationId } = req.params;

  try {
    const reports = await advancedAuditComplianceService.getAuditReports(organizationId);
    
    structuredLogger.info('Audit reports requested', {
      traceId,
      spanId,
      organizationId,
      count: reports.length
    });

    res.json({
      success: true,
      data: {
        reports,
        count: reports.length,
        organizationId,
        timestamp: new Date().toISOString(),
        traceId
      }
    });

  } catch (error) {
    structuredLogger.error('Failed to get audit reports', {
      error: error instanceof Error ? error.message : String(error),
      traceId,
      spanId,
      organizationId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get audit reports',
      organizationId,
      traceId
    });
  }
});

/**
 * GET /advanced-audit-compliance/metrics/:organizationId
 * Get compliance metrics for organization
 */
router.get('/metrics/:organizationId', async (req, res) => {
  const traceId = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const spanId = `span_${Math.random().toString(36).substr(2, 9)}`;
  const { organizationId } = req.params;

  try {
    const metrics = await advancedAuditComplianceService.getComplianceMetrics(organizationId);
    
    structuredLogger.info('Compliance metrics requested', {
      traceId,
      spanId,
      organizationId,
      totalEvents: metrics.totalEvents,
      complianceScore: metrics.complianceScore
    });

    res.json({
      success: true,
      data: {
        metrics,
        organizationId,
        timestamp: new Date().toISOString(),
        traceId
      }
    });

  } catch (error) {
    structuredLogger.error('Failed to get compliance metrics', {
      error: error instanceof Error ? error.message : String(error),
      traceId,
      spanId,
      organizationId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get compliance metrics',
      organizationId,
      traceId
    });
  }
});

/**
 * GET /advanced-audit-compliance/health
 * Health check for audit and compliance service
 */
router.get('/health', async (req, res) => {
  const traceId = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const spanId = `span_${Math.random().toString(36).substr(2, 9)}`;

  try {
    const rules = await advancedAuditComplianceService.getComplianceRules();
    
    const healthChecks = {
      hasRules: rules.length > 0,
      serviceInitialized: true,
      canLogEvents: true,
      canGenerateReports: true
    };

    const isHealthy = Object.values(healthChecks).every(check => check);

    structuredLogger.info('Audit compliance service health check', {
      traceId,
      spanId,
      healthChecks,
      isHealthy
    });

    res.status(isHealthy ? 200 : 503).json({
      success: true,
      data: {
        status: isHealthy ? 'healthy' : 'degraded',
        checks: healthChecks,
        rulesCount: rules.length,
        timestamp: new Date().toISOString(),
        traceId
      }
    });

  } catch (error) {
    structuredLogger.error('Audit compliance service health check failed', {
      error: error instanceof Error ? error.message : String(error),
      traceId,
      spanId
    });

    res.status(500).json({
      success: false,
      error: 'Audit compliance service health check failed',
      traceId
    });
  }
});

export default router;
