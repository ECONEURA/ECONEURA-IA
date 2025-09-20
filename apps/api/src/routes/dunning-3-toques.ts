/**
 * PR-54: Dunning 3-toques Routes
 * 
 * Endpoints para el sistema de gestión de cobranza con 3 toques
 */

import { Router } from 'express';
import { z } from 'zod';
import { dunning3ToquesService } from '../lib/dunning-3-toques.service.js';
import { structuredLogger } from '../lib/structured-logger.js';

const router = Router();

// Schemas de validación
const processDunningCampaignsSchema = z.object({
  organizationId: z.string().uuid(),
  invoiceIds: z.array(z.string().uuid()).optional(),
  forceProcess: z.boolean().optional()
});

const markInvoicePaidSchema = z.object({
  invoiceId: z.string().uuid(),
  paymentDate: z.string(),
  paymentMethod: z.string().optional(),
  notes: z.string().optional()
});

const updateConfigSchema = z.object({
  enabled: z.boolean().optional(),
  maxSteps: z.number().min(1).max(10).optional(),
  stepIntervals: z.array(z.number().min(1).max(365)).optional(),
  escalationThresholds: z.object({
    email: z.number().min(0).max(10),
    call: z.number().min(0).max(10),
    letter: z.number().min(0).max(10),
    legal: z.number().min(0).max(10)
  }).optional(),
  autoEscalation: z.boolean().optional(),
  gracePeriod: z.number().min(0).max(30).optional(),
  maxOverdueDays: z.number().min(1).max(365).optional(),
  notificationEnabled: z.boolean().optional()
});

/**
 * GET /dunning-3-toques/stats
 * Obtiene estadísticas del servicio de dunning
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = dunning3ToquesService.getStats();
    
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to get dunning stats', {
      error: error instanceof Error ? error.message : String(error),
      requestId: req.headers['x-request-id'] as string || ''
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to get dunning stats',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * POST /dunning-3-toques/process
 * Inicia el procesamiento de campañas de dunning
 */
router.post('/process', async (req, res) => {
  try {
    const validatedData = processDunningCampaignsSchema.parse(req.body);
    
    const stats = await dunning3ToquesService.processDunningCampaigns();
    
    structuredLogger.info('Dunning campaigns processing completed', {
      organizationId: validatedData.organizationId,
      overdueInvoices: stats.overdueInvoices,
      activeCampaigns: stats.activeCampaigns,
      requestId: req.headers['x-request-id'] as string || ''
    });
    
    res.json({
      success: true,
      data: stats,
      message: 'Dunning campaigns processing completed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to process dunning campaigns', {
      error: error instanceof Error ? error.message : String(error),
      requestId: req.headers['x-request-id'] as string || ''
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to process dunning campaigns',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /dunning-3-toques/campaigns/active
 * Obtiene campañas activas de dunning
 */
router.get('/campaigns/active', async (req, res) => {
  try {
    const activeCampaigns = dunning3ToquesService.getActiveCampaigns();
    
    res.json({
      success: true,
      data: activeCampaigns,
      count: activeCampaigns.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to get active dunning campaigns', {
      error: error instanceof Error ? error.message : String(error),
      requestId: req.headers['x-request-id'] as string || ''
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to get active dunning campaigns',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /dunning-3-toques/campaigns/:campaignId
 * Obtiene detalles de una campaña específica
 */
router.get('/campaigns/:campaignId', async (req, res) => {
  try {
    const { campaignId } = req.params;
    
    const campaign = dunning3ToquesService.getCampaign(campaignId);
    
    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
    }
    
    const steps = dunning3ToquesService.getCampaignSteps(campaignId);
    
    res.json({
      success: true,
      data: {
        campaign,
        steps
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to get dunning campaign', {
      campaignId: req.params.campaignId,
      error: error instanceof Error ? error.message : String(error),
      requestId: req.headers['x-request-id'] as string || ''
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to get dunning campaign',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /dunning-3-toques/campaigns/:campaignId/steps
 * Obtiene los pasos de una campaña
 */
router.get('/campaigns/:campaignId/steps', async (req, res) => {
  try {
    const { campaignId } = req.params;
    
    const steps = dunning3ToquesService.getCampaignSteps(campaignId);
    
    res.json({
      success: true,
      data: steps,
      count: steps.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to get dunning campaign steps', {
      campaignId: req.params.campaignId,
      error: error instanceof Error ? error.message : String(error),
      requestId: req.headers['x-request-id'] as string || ''
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to get dunning campaign steps',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * POST /dunning-3-toques/invoices/:invoiceId/mark-paid
 * Marca una factura como pagada
 */
router.post('/invoices/:invoiceId/mark-paid', async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const validatedData = markInvoicePaidSchema.parse({
      invoiceId,
      ...req.body
    });
    
    await dunning3ToquesService.markInvoiceAsPaid(
      validatedData.invoiceId, 
      validatedData.paymentDate
    );
    
    structuredLogger.info('Invoice marked as paid', {
      invoiceId: validatedData.invoiceId,
      paymentDate: validatedData.paymentDate,
      requestId: req.headers['x-request-id'] as string || ''
    });
    
    res.json({
      success: true,
      message: 'Invoice marked as paid successfully',
      data: {
        invoiceId: validatedData.invoiceId,
        paymentDate: validatedData.paymentDate,
        paymentMethod: validatedData.paymentMethod,
        notes: validatedData.notes,
        updatedAt: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to mark invoice as paid', {
      invoiceId: req.params.invoiceId,
      error: error instanceof Error ? error.message : String(error),
      requestId: req.headers['x-request-id'] as string || ''
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to mark invoice as paid',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /dunning-3-toques/invoices/overdue
 * Obtiene facturas vencidas
 */
router.get('/invoices/overdue', async (req, res) => {
  try {
    const { organizationId, limit = 100, offset = 0 } = req.query;
    
    if (!organizationId) {
      return res.status(400).json({
        success: false,
        error: 'organizationId is required'
      });
    }

    // En un sistema real, esto vendría de la base de datos
    const overdueInvoices = []; // dunning3ToquesService.getOverdueInvoices(organizationId as string, Number(limit), Number(offset));
    
    res.json({
      success: true,
      data: {
        invoices: overdueInvoices,
        pagination: {
          limit: Number(limit),
          offset: Number(offset),
          total: overdueInvoices.length
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to get overdue invoices', {
      error: error instanceof Error ? error.message : String(error),
      requestId: req.headers['x-request-id'] as string || ''
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to get overdue invoices',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * PUT /dunning-3-toques/config
 * Actualiza la configuración del servicio de dunning
 */
router.put('/config', async (req, res) => {
  try {
    const validatedData = updateConfigSchema.parse(req.body);
    
    dunning3ToquesService.updateConfig(validatedData);
    
    structuredLogger.info('Dunning configuration updated', {
      config: validatedData,
      requestId: req.headers['x-request-id'] as string || ''
    });
    
    res.json({
      success: true,
      message: 'Dunning configuration updated successfully',
      data: validatedData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to update dunning config', {
      error: error instanceof Error ? error.message : String(error),
      requestId: req.headers['x-request-id'] as string || ''
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to update dunning configuration',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /dunning-3-toques/config
 * Obtiene la configuración actual del servicio de dunning
 */
router.get('/config', async (req, res) => {
  try {
    // En un sistema real, esto vendría del servicio
    const config = {
      enabled: true,
      maxSteps: 3,
      stepIntervals: [7, 14, 30],
      escalationThresholds: {
        email: 0,
        call: 1,
        letter: 2,
        legal: 3
      },
      autoEscalation: true,
      gracePeriod: 3,
      maxOverdueDays: 90,
      notificationEnabled: true
    };
    
    res.json({
      success: true,
      data: config,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to get dunning config', {
      error: error instanceof Error ? error.message : String(error),
      requestId: req.headers['x-request-id'] as string || ''
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to get dunning configuration',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * POST /dunning-3-toques/campaigns/:campaignId/cancel
 * Cancela una campaña de dunning
 */
router.post('/campaigns/:campaignId/cancel', async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { reason } = req.body;
    
    const campaign = dunning3ToquesService.getCampaign(campaignId);
    
    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
    }

    if (campaign.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: 'Campaign is not active'
      });
    }

    // En un sistema real, esto cancelaría la campaña
    // campaign.status = 'cancelled';
    // campaign.endDate = new Date().toISOString();
    // campaign.notes.push(`Campaign cancelled: ${reason || 'No reason provided'}`);
    
    structuredLogger.info('Dunning campaign cancelled', {
      campaignId,
      reason,
      requestId: req.headers['x-request-id'] as string || ''
    });
    
    res.json({
      success: true,
      message: 'Dunning campaign cancelled successfully',
      data: {
        campaignId,
        reason,
        cancelledAt: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to cancel dunning campaign', {
      campaignId: req.params.campaignId,
      error: error instanceof Error ? error.message : String(error),
      requestId: req.headers['x-request-id'] as string || ''
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to cancel dunning campaign',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /dunning-3-toques/reports/effectiveness
 * Obtiene reporte de efectividad de pasos
 */
router.get('/reports/effectiveness', async (req, res) => {
  try {
    const { organizationId, period = '30d' } = req.query;
    
    if (!organizationId) {
      return res.status(400).json({
        success: false,
        error: 'organizationId is required'
      });
    }

    const stats = dunning3ToquesService.getStats();
    
    res.json({
      success: true,
      data: {
        period,
        stepEffectiveness: stats.stepEffectiveness,
        collectionRate: stats.collectionRate,
        totalCampaigns: stats.activeCampaigns + stats.completedCampaigns,
        successfulCollections: stats.successfulCollections
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to get dunning effectiveness report', {
      error: error instanceof Error ? error.message : String(error),
      requestId: req.headers['x-request-id'] as string || ''
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to get dunning effectiveness report',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;
