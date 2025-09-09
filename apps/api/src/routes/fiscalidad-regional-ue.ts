/**
 * PR-55: Fiscalidad Regional UE Routes
 *
 * Endpoints para el sistema de gestión de fiscalidad regional UE
 */

import { Router } from 'express';
import { z } from 'zod';
import { fiscalidadRegionalUEService } from '../lib/fiscalidad-regional-ue.service.js';
import { structuredLogger } from '../lib/structured-logger.js';

const router = Router();

// Schemas de validación
const calculateTaxSchema = z.object({
  customerId: z.string(),
  customerRegion: z.string(),
  supplierRegion: z.string(),
  amount: z.number().positive(),
  currency: z.string().length(3),
  customerType: z.enum(['business', 'consumer']).optional(),
  productType: z.string().optional(),
  serviceType: z.string().optional()
});

const updateConfigSchema = z.object({
  enabled: z.boolean().optional(),
  defaultRegion: z.string().optional(),
  autoCalculation: z.boolean().optional(),
  complianceMonitoring: z.boolean().optional(),
  reportingEnabled: z.boolean().optional(),
  auditTrail: z.boolean().optional(),
  thresholds: z.object({
    vatRegistration: z.number().min(0).optional(),
    reverseCharge: z.number().min(0).optional(),
    exemption: z.number().min(0).optional()
  }).optional(),
  reporting: z.object({
    frequency: z.enum(['monthly', 'quarterly', 'annually']).optional(),
    format: z.enum(['xml', 'json', 'csv']).optional(),
    deadline: z.number().min(1).max(30).optional()
  }).optional()
});

/**
 * GET /fiscalidad-regional-ue/stats
 * Obtiene estadísticas del servicio de fiscalidad
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = fiscalidadRegionalUEService.getStats();

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to get fiscalidad stats', {
      error: error instanceof Error ? error.message : String(error),
      requestId: req.headers['x-request-id'] as string || ''
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get fiscalidad stats',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * POST /fiscalidad-regional-ue/calculate
 * Calcula impuestos para una transacción
 */
router.post('/calculate', async (req, res) => {
  try {
    const validatedData = calculateTaxSchema.parse(req.body);

    const calculation = await fiscalidadRegionalUEService.calculateTax(validatedData);

    structuredLogger.info('Tax calculation completed', {
      calculationId: calculation.id,
      customerRegion: validatedData.customerRegion,
      supplierRegion: validatedData.supplierRegion,
      amount: validatedData.amount,
      taxRate: calculation.taxRate,
      taxAmount: calculation.taxAmount,
      requestId: req.headers['x-request-id'] as string || ''
    });

    res.json({
      success: true,
      data: calculation,
      message: 'Tax calculation completed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to calculate tax', {
      error: error instanceof Error ? error.message : String(error),
      requestId: req.headers['x-request-id'] as string || ''
    });

    res.status(500).json({
      success: false,
      error: 'Failed to calculate tax',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /fiscalidad-regional-ue/regions
 * Obtiene regiones fiscales disponibles
 */
router.get('/regions', async (req, res) => {
  try {
    const regions = fiscalidadRegionalUEService.getTaxRegions();

    res.json({
      success: true,
      data: regions,
      count: regions.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to get tax regions', {
      error: error instanceof Error ? error.message : String(error),
      requestId: req.headers['x-request-id'] as string || ''
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get tax regions',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /fiscalidad-regional-ue/regions/:regionCode
 * Obtiene detalles de una región fiscal específica
 */
router.get('/regions/:regionCode', async (req, res) => {
  try {
    const { regionCode } = req.params;

    const regions = fiscalidadRegionalUEService.getTaxRegions();
    const region = regions.find(r => r.country === regionCode.toUpperCase());

    if (!region) {
      return res.status(404).json({
        success: false,
        error: 'Tax region not found'
      });
    }

    res.json({
      success: true,
      data: region,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to get tax region', {
      regionCode: req.params.regionCode,
      error: error instanceof Error ? error.message : String(error),
      requestId: req.headers['x-request-id'] as string || ''
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get tax region',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /fiscalidad-regional-ue/rules
 * Obtiene reglas fiscales
 */
router.get('/rules', async (req, res) => {
  try {
    const rules = fiscalidadRegionalUEService.getTaxRules();

    res.json({
      success: true,
      data: rules,
      count: rules.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to get tax rules', {
      error: error instanceof Error ? error.message : String(error),
      requestId: req.headers['x-request-id'] as string || ''
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get tax rules',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /fiscalidad-regional-ue/calculations
 * Obtiene cálculos fiscales
 */
router.get('/calculations', async (req, res) => {
  try {
    const { limit = 100, offset = 0 } = req.query;

    const calculations = fiscalidadRegionalUEService.getTaxCalculations(Number(limit));

    res.json({
      success: true,
      data: {
        calculations,
        pagination: {
          limit: Number(limit),
          offset: Number(offset),
          total: calculations.length
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to get tax calculations', {
      error: error instanceof Error ? error.message : String(error),
      requestId: req.headers['x-request-id'] as string || ''
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get tax calculations',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /fiscalidad-regional-ue/compliance
 * Obtiene estado de cumplimiento fiscal
 */
router.get('/compliance', async (req, res) => {
  try {
    const compliance = fiscalidadRegionalUEService.getComplianceStatus();

    res.json({
      success: true,
      data: compliance,
      count: compliance.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to get compliance status', {
      error: error instanceof Error ? error.message : String(error),
      requestId: req.headers['x-request-id'] as string || ''
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get compliance status',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * POST /fiscalidad-regional-ue/process
 * Inicia el procesamiento de cumplimiento fiscal
 */
router.post('/process', async (req, res) => {
  try {
    const { organizationId } = req.body;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        error: 'organizationId is required'
      });
    }

    const stats = await fiscalidadRegionalUEService.processComplianceMonitoring();

    structuredLogger.info('Fiscalidad compliance processing completed', {
      organizationId,
      totalRegions: stats.totalRegions,
      complianceRate: stats.complianceRate,
      requestId: req.headers['x-request-id'] as string || ''
    });

    res.json({
      success: true,
      data: stats,
      message: 'Fiscalidad compliance processing completed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to process fiscalidad compliance', {
      error: error instanceof Error ? error.message : String(error),
      requestId: req.headers['x-request-id'] as string || ''
    });

    res.status(500).json({
      success: false,
      error: 'Failed to process fiscalidad compliance',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * PUT /fiscalidad-regional-ue/config
 * Actualiza la configuración del servicio de fiscalidad
 */
router.put('/config', async (req, res) => {
  try {
    const validatedData = updateConfigSchema.parse(req.body);

    fiscalidadRegionalUEService.updateConfig(validatedData);

    structuredLogger.info('Fiscalidad configuration updated', {
      config: validatedData,
      requestId: req.headers['x-request-id'] as string || ''
    });

    res.json({
      success: true,
      message: 'Fiscalidad configuration updated successfully',
      data: validatedData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to update fiscalidad config', {
      error: error instanceof Error ? error.message : String(error),
      requestId: req.headers['x-request-id'] as string || ''
    });

    res.status(500).json({
      success: false,
      error: 'Failed to update fiscalidad configuration',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /fiscalidad-regional-ue/config
 * Obtiene la configuración actual del servicio de fiscalidad
 */
router.get('/config', async (req, res) => {
  try {
    // En un sistema real, esto vendría del servicio
    const config = {
      enabled: true,
      defaultRegion: 'ES',
      autoCalculation: true,
      complianceMonitoring: true,
      reportingEnabled: true,
      auditTrail: true,
      thresholds: {
        vatRegistration: 85000,
        reverseCharge: 0,
        exemption: 0
      },
      reporting: {
        frequency: 'quarterly',
        format: 'xml',
        deadline: 7
      }
    };

    res.json({
      success: true,
      data: config,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to get fiscalidad config', {
      error: error instanceof Error ? error.message : String(error),
      requestId: req.headers['x-request-id'] as string || ''
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get fiscalidad configuration',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /fiscalidad-regional-ue/reports/vat
 * Genera reporte de IVA
 */
router.get('/reports/vat', async (req, res) => {
  try {
    const { organizationId, period, format = 'json' } = req.query;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        error: 'organizationId is required'
      });
    }

    // En un sistema real, esto generaría un reporte de IVA
    const report = {
      organizationId,
      period,
      format,
      totalSales: 0,
      totalVAT: 0,
      totalPurchases: 0,
      totalVATPaid: 0,
      netVAT: 0,
      generatedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      data: report,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to generate VAT report', {
      error: error instanceof Error ? error.message : String(error),
      requestId: req.headers['x-request-id'] as string || ''
    });

    res.status(500).json({
      success: false,
      error: 'Failed to generate VAT report',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /fiscalidad-regional-ue/reports/compliance
 * Genera reporte de cumplimiento
 */
router.get('/reports/compliance', async (req, res) => {
  try {
    const { organizationId, region } = req.query;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        error: 'organizationId is required'
      });
    }

    const compliance = fiscalidadRegionalUEService.getComplianceStatus();
    const stats = fiscalidadRegionalUEService.getStats();

    const report = {
      organizationId,
      region,
      complianceRate: stats.complianceRate,
      totalRegions: stats.totalRegions,
      activeRegions: stats.activeRegions,
      pendingCompliance: stats.pendingCompliance,
      complianceDetails: compliance,
      generatedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      data: report,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to generate compliance report', {
      error: error instanceof Error ? error.message : String(error),
      requestId: req.headers['x-request-id'] as string || ''
    });

    res.status(500).json({
      success: false,
      error: 'Failed to generate compliance report',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * POST /fiscalidad-regional-ue/validate
 * Valida una transacción fiscal
 */
router.post('/validate', async (req, res) => {
  try {
    const { transaction } = req.body;

    if (!transaction) {
      return res.status(400).json({
        success: false,
        error: 'Transaction data is required'
      });
    }

    // En un sistema real, esto validaría la transacción
    const validation = {
      isValid: true,
      errors: [],
      warnings: [],
      recommendations: [],
      validatedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      data: validation,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to validate transaction', {
      error: error instanceof Error ? error.message : String(error),
      requestId: req.headers['x-request-id'] as string || ''
    });

    res.status(500).json({
      success: false,
      error: 'Failed to validate transaction',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;
