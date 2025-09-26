import { Router } from 'express';
import { z } from 'zod';

import { supplierScorecardService } from '../lib/supplier-scorecard.service.js';
import { structuredLogger } from '../lib/structured-logger.js';

const supplierScorecardRouter = Router();

// Validation schemas
const GetSuppliersSchema = z.object({
  organizationId: z.string().min(1),
  status: z.enum(['active', 'inactive', 'suspended', 'pending_approval']).optional(),
  type: z.enum(['manufacturer', 'distributor', 'service_provider', 'consultant', 'other']).optional(),
  category: z.string().optional(),
  grade: z.enum(['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F']).optional(),
  riskLevel: z.enum(['low', 'medium', 'high']).optional(),
  search: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).default(50).optional(),
});

const CreateSupplierSchema = z.object({
  organizationId: z.string().min(1),
  name: z.string().min(1),
  code: z.string().min(1),
  type: z.enum(['manufacturer', 'distributor', 'service_provider', 'consultant', 'other']),
  category: z.string().min(1),
  status: z.enum(['active', 'inactive', 'suspended', 'pending_approval']).default('pending_approval'),
  contactInfo: z.object({
    email: z.string().email(),
    phone: z.string().min(1),
    address: z.string().min(1),
    city: z.string().min(1),
    country: z.string().min(1),
    website: z.string().url().optional(),
  }),
  businessInfo: z.object({
    taxId: z.string().min(1),
    registrationNumber: z.string().min(1),
    legalName: z.string().min(1),
    foundedYear: z.coerce.number().int().positive().optional(),
    employeeCount: z.coerce.number().int().positive().optional(),
    annualRevenue: z.coerce.number().positive().optional(),
    currency: z.string().length(3),
  }),
  certifications: z.array(z.string()).default([]),
  paymentTerms: z.object({
    standardDays: z.coerce.number().int().positive(),
    earlyPaymentDiscount: z.coerce.number().positive().optional(),
    latePaymentPenalty: z.coerce.number().positive().optional(),
    preferredMethod: z.enum(['bank_transfer', 'check', 'credit_card', 'cash']),
  }),
  performanceMetrics: z.object({
    onTimeDelivery: z.coerce.number().min(0).max(100),
    qualityScore: z.coerce.number().min(1).max(10),
    costCompetitiveness: z.coerce.number().min(1).max(10),
    communicationScore: z.coerce.number().min(1).max(10),
    innovationScore: z.coerce.number().min(1).max(10),
    sustainabilityScore: z.coerce.number().min(1).max(10),
    // PR-69: Métricas específicas de vendor scorecard
    otif: z.coerce.number().min(0).max(100),
    leadTime: z.coerce.number().positive(),
    ppv: z.coerce.number(),
    sl: z.coerce.number().min(0).max(100),
  }),
  riskAssessment: z.object({
    financialRisk: z.enum(['low', 'medium', 'high']),
    operationalRisk: z.enum(['low', 'medium', 'high']),
    complianceRisk: z.enum(['low', 'medium', 'high']),
    overallRisk: z.enum(['low', 'medium', 'high']),
    riskFactors: z.array(z.string()).default([]),
  }),
});

const GetEvaluationsSchema = z.object({
  organizationId: z.string().min(1),
  supplierId: z.string().optional(),
  status: z.enum(['draft', 'approved', 'rejected']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.coerce.number().int().positive().max(100).default(50).optional(),
});

const CreateEvaluationSchema = z.object({
  organizationId: z.string().min(1),
  supplierId: z.string().min(1),
  evaluationDate: z.string().datetime(),
  evaluatedBy: z.string().min(1),
  evaluatedByName: z.string().min(1),
  period: z.object({
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
  }),
  scores: z.object({
    delivery: z.coerce.number().min(0).max(100),
    quality: z.coerce.number().min(0).max(100),
    cost: z.coerce.number().min(0).max(100),
    communication: z.coerce.number().min(0).max(100),
    innovation: z.coerce.number().min(0).max(100),
    sustainability: z.coerce.number().min(0).max(100),
    overall: z.coerce.number().min(0).max(100),
  }),
  metrics: z.object({
    ordersCount: z.coerce.number().int().nonnegative(),
    totalValue: z.coerce.number().nonnegative(),
    onTimeDeliveries: z.coerce.number().int().nonnegative(),
    qualityIssues: z.coerce.number().int().nonnegative(),
    costSavings: z.coerce.number().nonnegative(),
    responseTime: z.coerce.number().positive(),
  }),
  comments: z.string().optional(),
  recommendations: z.array(z.string()).default([]),
  status: z.enum(['draft', 'approved', 'rejected']).default('draft'),
});

const GetPerformanceSchema = z.object({
  organizationId: z.string().min(1),
  category: z.string().optional(),
  minScore: z.coerce.number().min(0).max(100).optional(),
  maxScore: z.coerce.number().min(0).max(100).optional(),
  limit: z.coerce.number().int().positive().max(100).default(50).optional(),
});

const CreateComparisonSchema = z.object({
  organizationId: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
  suppliers: z.array(z.object({
    supplierId: z.string().min(1),
    supplierName: z.string().min(1),
  })).min(2),
});

const GenerateReportSchema = z.object({
  organizationId: z.string().min(1),
  reportType: z.enum(['performance_summary', 'scorecard_analysis', 'risk_assessment', 'comparative_analysis', 'trend_analysis']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  generatedBy: z.string().min(1),
});

const GetStatsSchema = z.object({
  organizationId: z.string().min(1),
});

const GetVendorScorecardAlertsSchema = z.object({
  organizationId: z.string().min(1),
});

// Routes

// Supplier Management
supplierScorecardRouter.get('/suppliers', async (req, res) => {
  try {
    const filters = GetSuppliersSchema.parse(req.query);
    const suppliers = await supplierScorecardService.getSuppliers(filters.organizationId, filters);
    
    res.json({
      success: true,
      data: {
        suppliers,
        total: suppliers.length,
        filters
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error getting suppliers', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

supplierScorecardRouter.get('/suppliers/:id', async (req, res) => {
  try {
    const { id } = z.object({ id: z.string().min(1) }).parse(req.params);
    const supplier = await supplierScorecardService.getSupplier(id);
    
    if (!supplier) {
      return res.status(404).json({
        success: false,
        error: 'Supplier not found'
      });
    }
    
    res.json({
      success: true,
      data: supplier,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error getting supplier', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

supplierScorecardRouter.post('/suppliers', async (req, res) => {
  try {
    const supplierData = CreateSupplierSchema.parse(req.body);
    const supplier = await supplierScorecardService.createSupplier(supplierData);
    
    res.status(201).json({
      success: true,
      data: supplier,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error creating supplier', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

// Evaluation Management
supplierScorecardRouter.get('/evaluations', async (req, res) => {
  try {
    const filters = GetEvaluationsSchema.parse(req.query);
    const evaluations = await supplierScorecardService.getEvaluations(filters.organizationId, filters);
    
    res.json({
      success: true,
      data: {
        evaluations,
        total: evaluations.length,
        filters
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error getting evaluations', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

supplierScorecardRouter.post('/evaluations', async (req, res) => {
  try {
    const evaluationData = CreateEvaluationSchema.parse(req.body);
    const evaluation = await supplierScorecardService.createEvaluation(evaluationData);
    
    res.status(201).json({
      success: true,
      data: evaluation,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error creating evaluation', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

// Performance Management
supplierScorecardRouter.get('/performance', async (req, res) => {
  try {
    const filters = GetPerformanceSchema.parse(req.query);
    const performances = await supplierScorecardService.getSuppliersPerformance(filters.organizationId, filters);
    
    res.json({
      success: true,
      data: {
        performances,
        total: performances.length,
        filters
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error getting supplier performance', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

supplierScorecardRouter.get('/performance/:supplierId', async (req, res) => {
  try {
    const { supplierId } = z.object({ supplierId: z.string().min(1) }).parse(req.params);
    const { organizationId } = z.object({ organizationId: z.string().min(1) }).parse(req.query);
    
    const performance = await supplierScorecardService.getSupplierPerformance(supplierId, organizationId);
    
    if (!performance) {
      return res.status(404).json({
        success: false,
        error: 'Supplier performance not found'
      });
    }
    
    res.json({
      success: true,
      data: performance,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error getting supplier performance', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

// Comparison Management
supplierScorecardRouter.get('/comparisons', async (req, res) => {
  try {
    const { organizationId, category, limit } = z.object({
      organizationId: z.string().min(1),
      category: z.string().optional(),
      limit: z.coerce.number().int().positive().max(100).default(50).optional(),
    }).parse(req.query);
    
    const comparisons = await supplierScorecardService.getSupplierComparisons(organizationId, { category, limit });
    
    res.json({
      success: true,
      data: {
        comparisons,
        total: comparisons.length,
        filters: { organizationId, category, limit }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error getting supplier comparisons', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

supplierScorecardRouter.post('/comparisons', async (req, res) => {
  try {
    const comparisonData = CreateComparisonSchema.parse(req.body);
    const comparison = await supplierScorecardService.createSupplierComparison(comparisonData);
    
    res.status(201).json({
      success: true,
      data: comparison,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error creating supplier comparison', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

// Reports
supplierScorecardRouter.post('/reports', async (req, res) => {
  try {
    const reportData = GenerateReportSchema.parse(req.body);
    const report = await supplierScorecardService.generateSupplierReport(
      reportData.organizationId,
      reportData.reportType,
      reportData.startDate,
      reportData.endDate,
      reportData.generatedBy
    );
    
    res.status(201).json({
      success: true,
      data: report,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error generating supplier report', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

// Statistics
supplierScorecardRouter.get('/stats', async (req, res) => {
  try {
    const { organizationId } = GetStatsSchema.parse(req.query);
    const stats = await supplierScorecardService.getSupplierStats(organizationId);
    
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error getting supplier stats', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

// PR-69: Vendor Scorecard Alerts
supplierScorecardRouter.get('/alerts', async (req, res) => {
  try {
    const { organizationId } = GetVendorScorecardAlertsSchema.parse(req.query);
    const alerts = await supplierScorecardService.generateVendorScorecardAlerts(organizationId);
    
    res.json({
      success: true,
      data: {
        alerts,
        totalSuppliers: alerts.length,
        totalAlerts: alerts.reduce((sum, a) => sum + a.alerts.length, 0),
        organizationId
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error getting vendor scorecard alerts', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

// Health Check
supplierScorecardRouter.get('/health', async (req, res) => {
  try {
    const stats = await supplierScorecardService.getSupplierStats('demo-org-1');
    
    res.json({
      success: true,
      data: {
        status: 'ok',
        totalSuppliers: stats.totalSuppliers,
        activeSuppliers: stats.activeSuppliers,
        averageScore: stats.averageScore,
        topPerformers: stats.topPerformers,
        riskSuppliers: stats.riskSuppliers,
        lastUpdated: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error checking supplier scorecard health', { error });
    res.status(500).json({
      success: false,
      error: 'Health check failed'
    });
  }
});

export { supplierScorecardRouter };
