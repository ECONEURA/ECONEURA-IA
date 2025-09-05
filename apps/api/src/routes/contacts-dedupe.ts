/**
 * PR-52: Contacts Dedupe Proactivo Routes
 * 
 * Endpoints para el sistema de deduplicación proactiva de contactos
 */

import { Router } from 'express';
import { z } from 'zod';
import { contactsDedupeService } from '../lib/contacts-dedupe.service.js';
import { structuredLogger } from '../lib/structured-logger.js';

const router = Router();

// Schemas de validación
const processDeduplicationSchema = z.object({
  organizationId: z.string().uuid(),
  autoMerge: z.boolean().optional(),
  confidenceThreshold: z.number().min(0).max(1).optional(),
  similarityThreshold: z.number().min(0).max(1).optional()
});

const executeMergeSchema = z.object({
  mergeId: z.string(),
  approvedBy: z.string(),
  reason: z.string().optional()
});

const updateConfigSchema = z.object({
  enabled: z.boolean().optional(),
  autoMerge: z.boolean().optional(),
  confidenceThreshold: z.number().min(0).max(1).optional(),
  similarityThreshold: z.number().min(0).max(1).optional()
});

/**
 * GET /contacts-dedupe/stats
 * Obtiene estadísticas del servicio de deduplicación
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = contactsDedupeService.getStats();
    
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to get dedupe stats', {
      error: error instanceof Error ? error.message : String(error),
      requestId: req.headers['x-request-id'] as string || ''
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to get dedupe stats',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * POST /contacts-dedupe/process
 * Inicia el proceso de deduplicación
 */
router.post('/process', async (req, res) => {
  try {
    const validatedData = processDeduplicationSchema.parse(req.body);
    
    // Actualizar configuración temporal si se proporciona
    if (validatedData.autoMerge !== undefined || 
        validatedData.confidenceThreshold !== undefined || 
        validatedData.similarityThreshold !== undefined) {
      contactsDedupeService.updateConfig({
        autoMerge: validatedData.autoMerge,
        confidenceThreshold: validatedData.confidenceThreshold,
        similarityThreshold: validatedData.similarityThreshold
      });
    }

    const stats = await contactsDedupeService.processDeduplication();
    
    structuredLogger.info('Deduplication process completed', {
      organizationId: validatedData.organizationId,
      duplicatesFound: stats.duplicatesFound,
      processingTime: stats.mergeOperations,
      requestId: req.headers['x-request-id'] as string || ''
    });
    
    res.json({
      success: true,
      data: stats,
      message: 'Deduplication process completed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to process deduplication', {
      error: error instanceof Error ? error.message : String(error),
      requestId: req.headers['x-request-id'] as string || ''
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to process deduplication',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /contacts-dedupe/duplicates
 * Obtiene duplicados encontrados
 */
router.get('/duplicates', async (req, res) => {
  try {
    const { organizationId, limit = 100, offset = 0 } = req.query;
    
    if (!organizationId) {
      return res.status(400).json({
        success: false,
        error: 'organizationId is required'
      });
    }

    // En un sistema real, esto vendría de la base de datos
    const duplicates = []; // contactsDedupeService.getDuplicates(organizationId as string, Number(limit), Number(offset));
    
    res.json({
      success: true,
      data: {
        duplicates,
        pagination: {
          limit: Number(limit),
          offset: Number(offset),
          total: duplicates.length
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to get duplicates', {
      error: error instanceof Error ? error.message : String(error),
      requestId: req.headers['x-request-id'] as string || ''
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to get duplicates',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /contacts-dedupe/merges/pending
 * Obtiene operaciones de merge pendientes
 */
router.get('/merges/pending', async (req, res) => {
  try {
    const pendingMerges = contactsDedupeService.getPendingMerges();
    
    res.json({
      success: true,
      data: pendingMerges,
      count: pendingMerges.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to get pending merges', {
      error: error instanceof Error ? error.message : String(error),
      requestId: req.headers['x-request-id'] as string || ''
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to get pending merges',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * POST /contacts-dedupe/merges/:mergeId/execute
 * Ejecuta una operación de merge
 */
router.post('/merges/:mergeId/execute', async (req, res) => {
  try {
    const { mergeId } = req.params;
    const validatedData = executeMergeSchema.parse({
      mergeId,
      ...req.body
    });
    
    await contactsDedupeService.executeMerge(validatedData.mergeId, validatedData.approvedBy);
    
    structuredLogger.info('Merge operation executed', {
      mergeId: validatedData.mergeId,
      approvedBy: validatedData.approvedBy,
      requestId: req.headers['x-request-id'] as string || ''
    });
    
    res.json({
      success: true,
      message: 'Merge operation executed successfully',
      data: {
        mergeId: validatedData.mergeId,
        approvedBy: validatedData.approvedBy,
        executedAt: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to execute merge', {
      mergeId: req.params.mergeId,
      error: error instanceof Error ? error.message : String(error),
      requestId: req.headers['x-request-id'] as string || ''
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to execute merge',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /contacts-dedupe/merges/:mergeId
 * Obtiene detalles de una operación de merge
 */
router.get('/merges/:mergeId', async (req, res) => {
  try {
    const { mergeId } = req.params;
    
    // En un sistema real, esto vendría de la base de datos
    const mergeOperation = null; // contactsDedupeService.getMergeOperation(mergeId);
    
    if (!mergeOperation) {
      return res.status(404).json({
        success: false,
        error: 'Merge operation not found'
      });
    }
    
    res.json({
      success: true,
      data: mergeOperation,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to get merge operation', {
      mergeId: req.params.mergeId,
      error: error instanceof Error ? error.message : String(error),
      requestId: req.headers['x-request-id'] as string || ''
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to get merge operation',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /contacts-dedupe/audit
 * Obtiene el historial de auditoría
 */
router.get('/audit', async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    
    // En un sistema real, esto vendría de la base de datos
    const auditTrail = []; // contactsDedupeService.getAuditTrail(Number(limit));
    
    res.json({
      success: true,
      data: auditTrail,
      count: auditTrail.length,
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
 * PUT /contacts-dedupe/config
 * Actualiza la configuración del servicio
 */
router.put('/config', async (req, res) => {
  try {
    const validatedData = updateConfigSchema.parse(req.body);
    
    contactsDedupeService.updateConfig(validatedData);
    
    structuredLogger.info('Dedupe configuration updated', {
      config: validatedData,
      requestId: req.headers['x-request-id'] as string || ''
    });
    
    res.json({
      success: true,
      message: 'Configuration updated successfully',
      data: validatedData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to update dedupe config', {
      error: error instanceof Error ? error.message : String(error),
      requestId: req.headers['x-request-id'] as string || ''
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to update configuration',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /contacts-dedupe/config
 * Obtiene la configuración actual del servicio
 */
router.get('/config', async (req, res) => {
  try {
    // En un sistema real, esto vendría del servicio
    const config = {
      enabled: true,
      autoMerge: false,
      confidenceThreshold: 0.8,
      similarityThreshold: 0.7
    };
    
    res.json({
      success: true,
      data: config,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to get dedupe config', {
      error: error instanceof Error ? error.message : String(error),
      requestId: req.headers['x-request-id'] as string || ''
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to get configuration',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * POST /contacts-dedupe/validate
 * Valida si dos contactos son duplicados
 */
router.post('/validate', async (req, res) => {
  try {
    const { contact1, contact2 } = req.body;
    
    if (!contact1 || !contact2) {
      return res.status(400).json({
        success: false,
        error: 'Both contact1 and contact2 are required'
      });
    }

    // En un sistema real, esto usaría el servicio de deduplicación
    const isDuplicate = false; // contactsDedupeService.validateDuplicates(contact1, contact2);
    const confidence = 0.0; // contactsDedupeService.calculateConfidence(contact1, contact2);
    
    res.json({
      success: true,
      data: {
        isDuplicate,
        confidence,
        reasons: isDuplicate ? ['Potential duplicate detected'] : []
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to validate duplicates', {
      error: error instanceof Error ? error.message : String(error),
      requestId: req.headers['x-request-id'] as string || ''
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to validate duplicates',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;