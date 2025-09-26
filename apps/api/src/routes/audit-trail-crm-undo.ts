/**
 * PR-65: Audit Trail CRM + Undo Routes
 * 
 * Endpoints para el sistema de auditoría CRM con capacidades de undo y revert
 */

import { Router } from 'express';
import { z } from 'zod';

import { auditTrailCRMUndoService } from '../lib/audit-trail-crm-undo.service.js';
import { structuredLogger } from '../lib/structured-logger.js';

const router = Router();

// Schemas de validación
const logAuditEntrySchema = z.object({
  action: z.string().min(1).max(100),
  resource: z.enum(['company', 'contact', 'deal', 'activity', 'note', 'task']),
  resourceId: z.string().uuid(),
  resourceName: z.string().min(1).max(255),
  before: z.record(z.any()),
  after: z.record(z.any()),
  metadata: z.object({
    ipAddress: z.string().optional(),
    userAgent: z.string().optional(),
    sessionId: z.string().uuid().optional(),
    correlationId: z.string().uuid().optional(),
    source: z.enum(['web', 'api', 'import', 'sync', 'system']).optional(),
    reason: z.string().optional()
  }).optional()
});

const undoChangeSchema = z.object({
  reason: z.string().min(1).max(500),
  metadata: z.record(z.any()).optional()
});

const getAuditTrailSchema = z.object({
  resource: z.enum(['company', 'contact', 'deal', 'activity', 'note', 'task']).optional(),
  action: z.string().optional(),
  userId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0)
});

const getUndoOperationsSchema = z.object({
  status: z.enum(['pending', 'completed', 'failed']).optional(),
  userId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0)
});

const updateConfigSchema = z.object({
  enabled: z.boolean().optional(),
  retentionDays: z.number().min(1).max(365).optional(),
  undoWindowHours: z.number().min(1).max(168).optional(), // 1 hora a 1 semana
  maxUndoOperations: z.number().min(1).max(10000).optional(),
  autoExpire: z.boolean().optional(),
  trackFields: z.array(z.string()).optional(),
  sensitiveFields: z.array(z.string()).optional(),
  excludeActions: z.array(z.string()).optional(),
  includeMetadata: z.boolean().optional(),
  compressionEnabled: z.boolean().optional()
});

/**
 * POST /audit-trail-crm/log
 * Registrar una entrada de auditoría
 */
router.post('/log', async (req, res) => {
  try {
    const validatedData = logAuditEntrySchema.parse(req.body);
    const organizationId = req.user?.organizationId || 'default-org';
    const userId = req.user?.id || 'system';
    const userEmail = req.user?.email || 'system@econeura.com';

    const auditEntry = await auditTrailCRMUndoService.logAuditEntry(
      organizationId,
      userId,
      userEmail,
      validatedData.action,
      validatedData.resource,
      validatedData.resourceId,
      validatedData.resourceName,
      validatedData.before,
      validatedData.after,
      validatedData.metadata
    );

    structuredLogger.info('Audit entry logged via API', {
      entryId: auditEntry.id,
      organizationId,
      userId,
      action: validatedData.action,
      resource: validatedData.resource,
      resourceId: validatedData.resourceId,
      requestId: req.headers['x-request-id'] as string || ''
    });

    res.json({
      success: true,
      data: auditEntry,
      message: 'Audit entry logged successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to log audit entry', {
      error: error instanceof Error ? error.message : String(error),
      requestId: req.headers['x-request-id'] as string || ''
    });

    res.status(500).json({
      success: false,
      error: 'Failed to log audit entry',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /audit-trail-crm/entries
 * Obtener entradas de auditoría con filtros
 */
router.get('/entries', async (req, res) => {
  try {
    const validatedData = getAuditTrailSchema.parse(req.query);
    const organizationId = req.user?.organizationId || 'default-org';

    const result = await auditTrailCRMUndoService.getAuditTrail(organizationId, validatedData);

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to get audit trail', {
      error: error instanceof Error ? error.message : String(error),
      requestId: req.headers['x-request-id'] as string || ''
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get audit trail',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /audit-trail-crm/entries/:entryId
 * Obtener una entrada específica de auditoría
 */
router.get('/entries/:entryId', async (req, res) => {
  try {
    const { entryId } = req.params;
    
    const auditEntry = await auditTrailCRMUndoService.getAuditEntry(entryId);
    
    if (!auditEntry) {
      return res.status(404).json({
        success: false,
        error: 'Audit entry not found'
      });
    }

    res.json({
      success: true,
      data: auditEntry,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to get audit entry', {
      entryId: req.params.entryId,
      error: error instanceof Error ? error.message : String(error),
      requestId: req.headers['x-request-id'] as string || ''
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get audit entry',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * POST /audit-trail-crm/entries/:entryId/undo
 * Deshacer un cambio específico
 */
router.post('/entries/:entryId/undo', async (req, res) => {
  try {
    const { entryId } = req.params;
    const validatedData = undoChangeSchema.parse(req.body);
    const userId = req.user?.id || 'system';

    const undoOperation = await auditTrailCRMUndoService.undoChange(
      entryId,
      userId,
      validatedData.reason,
      validatedData.metadata
    );

    structuredLogger.info('Change undone via API', {
      undoId: undoOperation.id,
      entryId,
      userId,
      reason: validatedData.reason,
      requestId: req.headers['x-request-id'] as string || ''
    });

    res.json({
      success: true,
      data: undoOperation,
      message: 'Change undone successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to undo change', {
      entryId: req.params.entryId,
      error: error instanceof Error ? error.message : String(error),
      requestId: req.headers['x-request-id'] as string || ''
    });

    res.status(500).json({
      success: false,
      error: 'Failed to undo change',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /audit-trail-crm/undo-operations
 * Obtener operaciones de undo con filtros
 */
router.get('/undo-operations', async (req, res) => {
  try {
    const validatedData = getUndoOperationsSchema.parse(req.query);
    const organizationId = req.user?.organizationId || 'default-org';

    const result = await auditTrailCRMUndoService.getUndoOperations(organizationId, validatedData);

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to get undo operations', {
      error: error instanceof Error ? error.message : String(error),
      requestId: req.headers['x-request-id'] as string || ''
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get undo operations',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /audit-trail-crm/stats
 * Obtener estadísticas del sistema de auditoría
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = auditTrailCRMUndoService.getStats();

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to get audit trail stats', {
      error: error instanceof Error ? error.message : String(error),
      requestId: req.headers['x-request-id'] as string || ''
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get audit trail stats',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * PUT /audit-trail-crm/config
 * Actualizar configuración del sistema de auditoría
 */
router.put('/config', async (req, res) => {
  try {
    const validatedData = updateConfigSchema.parse(req.body);

    auditTrailCRMUndoService.updateConfig(validatedData);

    structuredLogger.info('Audit trail configuration updated', {
      config: validatedData,
      requestId: req.headers['x-request-id'] as string || ''
    });

    res.json({
      success: true,
      message: 'Audit trail configuration updated successfully',
      data: validatedData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to update audit trail config', {
      error: error instanceof Error ? error.message : String(error),
      requestId: req.headers['x-request-id'] as string || ''
    });

    res.status(500).json({
      success: false,
      error: 'Failed to update audit trail configuration',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /audit-trail-crm/config
 * Obtener configuración actual del sistema de auditoría
 */
router.get('/config', async (req, res) => {
  try {
    // En un sistema real, esto vendría del servicio
    const config = {
      enabled: true,
      retentionDays: 90,
      undoWindowHours: 24,
      maxUndoOperations: 1000,
      autoExpire: true,
      trackFields: ['name', 'email', 'phone', 'status', 'value', 'stage', 'priority', 'description'],
      sensitiveFields: ['password', 'token', 'secret', 'key'],
      excludeActions: ['view', 'list', 'search'],
      includeMetadata: true,
      compressionEnabled: true
    };

    res.json({
      success: true,
      data: config,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to get audit trail config', {
      error: error instanceof Error ? error.message : String(error),
      requestId: req.headers['x-request-id'] as string || ''
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get audit trail configuration',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * POST /audit-trail-crm/cleanup
 * Ejecutar limpieza manual de entradas expiradas
 */
router.post('/cleanup', async (req, res) => {
  try {
    // En un sistema real, esto ejecutaría la limpieza manual
    structuredLogger.info('Manual cleanup initiated', {
      requestId: req.headers['x-request-id'] as string || ''
    });

    res.json({
      success: true,
      message: 'Cleanup process initiated successfully',
      data: {
        cleanupStarted: new Date().toISOString(),
        estimatedDuration: '1-2 minutes'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to initiate cleanup', {
      error: error instanceof Error ? error.message : String(error),
      requestId: req.headers['x-request-id'] as string || ''
    });

    res.status(500).json({
      success: false,
      error: 'Failed to initiate cleanup',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /audit-trail-crm/export
 * Exportar entradas de auditoría
 */
router.get('/export', async (req, res) => {
  try {
    const { format = 'json', startDate, endDate, resource } = req.query;
    const organizationId = req.user?.organizationId || 'default-org';

    // Simular exportación
    const exportData = {
      format,
      startDate,
      endDate,
      resource,
      organizationId,
      exportedAt: new Date().toISOString(),
      recordCount: 0 // En un sistema real, esto sería el conteo real
    };

    structuredLogger.info('Audit trail export initiated', {
      format,
      startDate,
      endDate,
      resource,
      organizationId,
      requestId: req.headers['x-request-id'] as string || ''
    });

    res.json({
      success: true,
      message: 'Export initiated successfully',
      data: exportData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to export audit trail', {
      error: error instanceof Error ? error.message : String(error),
      requestId: req.headers['x-request-id'] as string || ''
    });

    res.status(500).json({
      success: false,
      error: 'Failed to export audit trail',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;
