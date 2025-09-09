import { Router } from 'express';
import { z } from 'zod';
import { sepaRobustService } from '../lib/sepa-robust.service.js';
import { structuredLogger } from '../lib/structured-logger.js';

const sepaRobustRouter = Router();

// Validation schemas
const GetTransactionsSchema = z.object({
  organizationId: z.string().min(1),
  status: z.enum(['pending', 'matched', 'reconciled', 'disputed', 'exception']).optional(),
  exceptionType: z.enum(['duplicate', 'invalid_amount', 'missing_reference', 'invalid_iban', 'date_mismatch', 'currency_mismatch']).optional(),
  camtVersion: z.enum(['053', '054']).optional(),
  accountId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.coerce.number().int().positive().max(100).default(50).optional(),
});

const CreateTransactionSchema = z.object({
  organizationId: z.string().min(1),
  accountId: z.string().min(1),
  transactionId: z.string().min(1),
  amount: z.coerce.number().positive(),
  currency: z.string().length(3).default('EUR'),
  date: z.string().datetime(),
  valueDate: z.string().datetime(),
  description: z.string().min(1),
  reference: z.string().optional(),
  counterparty: z.object({
    name: z.string().min(1),
    iban: z.string().min(1),
    bic: z.string().optional(),
  }),
  category: z.string().default('unknown'),
  camtVersion: z.enum(['053', '054']).default('053'),
});

const GetRulesSchema = z.object({
  organizationId: z.string().min(1),
  enabled: z.coerce.boolean().optional(),
  priority: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).default(50).optional(),
});

const CreateRuleSchema = z.object({
  organizationId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  priority: z.coerce.number().int().min(1).max(100).default(50),
  conditions: z.array(z.object({
    field: z.string().min(1),
    operator: z.enum(['equals', 'contains', 'regex', 'range', 'exists', 'not_exists']),
    value: z.any(),
    weight: z.coerce.number().min(0).max(100).default(50),
  })).min(1),
  actions: z.array(z.object({
    type: z.enum(['auto_match', 'flag_exception', 'transform_data', 'send_alert', 'require_manual_review']),
    parameters: z.record(z.any()),
  })).min(1),
  enabled: z.coerce.boolean().default(true),
});

const GetExceptionsSchema = z.object({
  organizationId: z.string().min(1),
  status: z.enum(['open', 'in_review', 'resolved', 'ignored']).optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  exceptionType: z.enum(['duplicate', 'invalid_amount', 'missing_reference', 'invalid_iban', 'date_mismatch', 'currency_mismatch']).optional(),
  assignedTo: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).default(50).optional(),
});

const CreateExceptionSchema = z.object({
  organizationId: z.string().min(1),
  transactionId: z.string().min(1),
  exceptionType: z.enum(['duplicate', 'invalid_amount', 'missing_reference', 'invalid_iban', 'date_mismatch', 'currency_mismatch']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  description: z.string().min(1),
  details: z.record(z.any()).optional(),
  status: z.enum(['open', 'in_review', 'resolved', 'ignored']).default('open'),
  assignedTo: z.string().optional(),
});

const GenerateReportSchema = z.object({
  organizationId: z.string().min(1),
  reportType: z.enum(['processing_summary', 'exception_analysis', 'rule_performance', 'validation_report']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  generatedBy: z.string().min(1),
});

const GetStatsSchema = z.object({
  organizationId: z.string().min(1),
});

// Routes

// Transaction Management
sepaRobustRouter.get('/transactions', async (req, res) => {
  try {
    const filters = GetTransactionsSchema.parse(req.query);
    const transactions = await sepaRobustService.getTransactions(filters.organizationId, filters);
    
    res.json({
      success: true,
      data: {
        transactions,
        total: transactions.length,
        filters
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error getting SEPA robust transactions', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

sepaRobustRouter.get('/transactions/:id', async (req, res) => {
  try {
    const { id } = z.object({ id: z.string().min(1) }).parse(req.params);
    const transaction = await sepaRobustService.getTransaction(id);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }
    
    res.json({
      success: true,
      data: transaction,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error getting SEPA robust transaction', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

sepaRobustRouter.post('/transactions', async (req, res) => {
  try {
    const transactionData = CreateTransactionSchema.parse(req.body);
    const transaction = await sepaRobustService.createTransaction(transactionData);
    
    res.status(201).json({
      success: true,
      data: transaction,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error creating SEPA robust transaction', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

// Rule Management
sepaRobustRouter.get('/rules', async (req, res) => {
  try {
    const filters = GetRulesSchema.parse(req.query);
    const rules = await sepaRobustService.getRules(filters.organizationId, filters);
    
    res.json({
      success: true,
      data: {
        rules,
        total: rules.length,
        filters
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error getting SEPA robust rules', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

sepaRobustRouter.post('/rules', async (req, res) => {
  try {
    const ruleData = CreateRuleSchema.parse(req.body);
    const rule = await sepaRobustService.createRule(ruleData);
    
    res.status(201).json({
      success: true,
      data: rule,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error creating SEPA robust rule', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

// Exception Management
sepaRobustRouter.get('/exceptions', async (req, res) => {
  try {
    const filters = GetExceptionsSchema.parse(req.query);
    const exceptions = await sepaRobustService.getExceptions(filters.organizationId, filters);
    
    res.json({
      success: true,
      data: {
        exceptions,
        total: exceptions.length,
        filters
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error getting SEPA robust exceptions', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

sepaRobustRouter.post('/exceptions', async (req, res) => {
  try {
    const exceptionData = CreateExceptionSchema.parse(req.body);
    const exception = await sepaRobustService.createException(exceptionData);
    
    res.status(201).json({
      success: true,
      data: exception,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error creating SEPA robust exception', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

// Reports
sepaRobustRouter.post('/reports', async (req, res) => {
  try {
    const reportData = GenerateReportSchema.parse(req.body);
    const report = await sepaRobustService.generateReport(
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
    structuredLogger.error('Error generating SEPA robust report', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

// Statistics
sepaRobustRouter.get('/stats', async (req, res) => {
  try {
    const { organizationId } = GetStatsSchema.parse(req.query);
    const stats = await sepaRobustService.getStats(organizationId);
    
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error getting SEPA robust stats', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

// Health Check
sepaRobustRouter.get('/health', async (req, res) => {
  try {
    const stats = await sepaRobustService.getStats('demo-org-1');
    
    res.json({
      success: true,
      data: {
        status: 'ok',
        totalTransactions: stats.totalTransactions,
        totalExceptions: stats.totalExceptions,
        totalRules: stats.totalRules,
        activeRules: stats.activeRules,
        last24Hours: stats.last24Hours,
        lastUpdated: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error checking SEPA robust health', { error });
    res.status(500).json({
      success: false,
      error: 'Health check failed'
    });
  }
});

export { sepaRobustRouter };
