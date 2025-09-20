import { Router } from 'express';
import { z } from 'zod';
import { stripeReceiptsService } from '../lib/stripe-receipts.service.js';
import { structuredLogger } from '../lib/structured-logger.js';
const stripeReceiptsRouter = Router();
const GetReceiptsSchema = z.object({
    organizationId: z.string().min(1),
    status: z.enum(['pending', 'succeeded', 'failed', 'canceled', 'requires_action']).optional(),
    reconciliationStatus: z.enum(['pending', 'reconciled', 'discrepancy', 'manual_review']).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    limit: z.coerce.number().int().positive().max(100).default(50).optional(),
});
const CreateReceiptSchema = z.object({
    organizationId: z.string().min(1),
    stripePaymentIntentId: z.string().min(1),
    stripeChargeId: z.string().min(1),
    amount: z.coerce.number().int().positive(),
    currency: z.string().length(3),
    status: z.enum(['pending', 'succeeded', 'failed', 'canceled', 'requires_action']),
    customerId: z.string().min(1),
    customerEmail: z.string().email(),
    description: z.string().min(1),
    metadata: z.record(z.string()).default({}),
    receiptUrl: z.string().url().optional(),
    receiptNumber: z.string().min(1),
});
const ProcessWebhookSchema = z.object({
    id: z.string().min(1),
    type: z.string().min(1),
    data: z.object({
        object: z.any()
    }),
    created: z.coerce.number().int().positive(),
    livemode: z.boolean(),
});
const ManualReconcileSchema = z.object({
    bankTransactionId: z.string().min(1),
    bankReference: z.string().min(1),
    notes: z.string().optional(),
});
const CreateReconciliationRuleSchema = z.object({
    organizationId: z.string().min(1),
    name: z.string().min(1),
    description: z.string().min(1),
    conditions: z.object({
        amountRange: z.object({
            min: z.coerce.number().int().nonnegative(),
            max: z.coerce.number().int().positive(),
        }).optional(),
        currency: z.string().length(3).optional(),
        customerEmail: z.string().email().optional(),
        descriptionPattern: z.string().optional(),
        metadata: z.record(z.string()).optional(),
    }),
    actions: z.object({
        autoReconcile: z.boolean(),
        alertOnDiscrepancy: z.boolean(),
        requireManualReview: z.boolean(),
    }),
    isActive: z.boolean().default(true),
});
const GenerateReportSchema = z.object({
    organizationId: z.string().min(1),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    generatedBy: z.string().min(1),
});
const GetStatsSchema = z.object({
    organizationId: z.string().min(1),
});
stripeReceiptsRouter.get('/receipts', async (req, res) => {
    try {
        const filters = GetReceiptsSchema.parse(req.query);
        const receipts = await stripeReceiptsService.getReceipts(filters.organizationId, filters);
        res.json({
            success: true,
            data: {
                receipts,
                total: receipts.length,
                filters
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error getting Stripe receipts', { error });
        res.status(400).json({
            success: false,
            error: 'Invalid request data',
            details: error.errors
        });
    }
});
stripeReceiptsRouter.get('/receipts/:id', async (req, res) => {
    try {
        const { id } = z.object({ id: z.string().min(1) }).parse(req.params);
        const receipt = await stripeReceiptsService.getReceipt(id);
        if (!receipt) {
            return res.status(404).json({
                success: false,
                error: 'Receipt not found'
            });
        }
        res.json({
            success: true,
            data: receipt,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error getting Stripe receipt', { error });
        res.status(400).json({
            success: false,
            error: 'Invalid request data',
            details: error.errors
        });
    }
});
stripeReceiptsRouter.post('/receipts', async (req, res) => {
    try {
        const receiptData = CreateReceiptSchema.parse(req.body);
        const receipt = await stripeReceiptsService.createReceipt(receiptData);
        res.status(201).json({
            success: true,
            data: receipt,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error creating Stripe receipt', { error });
        res.status(400).json({
            success: false,
            error: 'Invalid request data',
            details: error.errors
        });
    }
});
stripeReceiptsRouter.post('/webhooks', async (req, res) => {
    try {
        const event = ProcessWebhookSchema.parse(req.body);
        const result = await stripeReceiptsService.processWebhookEvent(event);
        res.json({
            success: true,
            data: result,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error processing Stripe webhook', { error });
        res.status(400).json({
            success: false,
            error: 'Invalid webhook data',
            details: error.errors
        });
    }
});
stripeReceiptsRouter.post('/receipts/:id/reconcile', async (req, res) => {
    try {
        const { id } = z.object({ id: z.string().min(1) }).parse(req.params);
        const reconcileData = ManualReconcileSchema.parse(req.body);
        const receipt = await stripeReceiptsService.manualReconcileReceipt(id, reconcileData.bankTransactionId, reconcileData.bankReference, reconcileData.notes);
        if (!receipt) {
            return res.status(404).json({
                success: false,
                error: 'Receipt not found'
            });
        }
        res.json({
            success: true,
            data: receipt,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error reconciling Stripe receipt', { error });
        res.status(400).json({
            success: false,
            error: 'Invalid request data',
            details: error.errors
        });
    }
});
stripeReceiptsRouter.post('/receipts/:id/auto-reconcile', async (req, res) => {
    try {
        const { id } = z.object({ id: z.string().min(1) }).parse(req.params);
        const reconciled = await stripeReceiptsService.autoReconcileReceipt(id);
        res.json({
            success: true,
            data: { reconciled },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error auto-reconciling Stripe receipt', { error });
        res.status(400).json({
            success: false,
            error: 'Invalid request data',
            details: error.errors
        });
    }
});
stripeReceiptsRouter.get('/reconciliation-rules', async (req, res) => {
    try {
        const { organizationId } = z.object({ organizationId: z.string().min(1) }).parse(req.query);
        const rules = await stripeReceiptsService.getReconciliationRules(organizationId);
        res.json({
            success: true,
            data: {
                rules,
                total: rules.length
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error getting reconciliation rules', { error });
        res.status(400).json({
            success: false,
            error: 'Invalid request data',
            details: error.errors
        });
    }
});
stripeReceiptsRouter.post('/reconciliation-rules', async (req, res) => {
    try {
        const ruleData = CreateReconciliationRuleSchema.parse(req.body);
        const rule = await stripeReceiptsService.createReconciliationRule(ruleData);
        res.status(201).json({
            success: true,
            data: rule,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error creating reconciliation rule', { error });
        res.status(400).json({
            success: false,
            error: 'Invalid request data',
            details: error.errors
        });
    }
});
stripeReceiptsRouter.post('/reports/reconciliation', async (req, res) => {
    try {
        const reportData = GenerateReportSchema.parse(req.body);
        const report = await stripeReceiptsService.generateReconciliationReport(reportData.organizationId, reportData.startDate, reportData.endDate, reportData.generatedBy);
        res.status(201).json({
            success: true,
            data: report,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error generating reconciliation report', { error });
        res.status(400).json({
            success: false,
            error: 'Invalid request data',
            details: error.errors
        });
    }
});
stripeReceiptsRouter.get('/stats', async (req, res) => {
    try {
        const { organizationId } = GetStatsSchema.parse(req.query);
        const stats = await stripeReceiptsService.getReconciliationStats(organizationId);
        res.json({
            success: true,
            data: stats,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error getting Stripe stats', { error });
        res.status(400).json({
            success: false,
            error: 'Invalid request data',
            details: error.errors
        });
    }
});
stripeReceiptsRouter.get('/health', async (req, res) => {
    try {
        const stats = await stripeReceiptsService.getReconciliationStats('demo-org-1');
        res.json({
            success: true,
            data: {
                status: 'ok',
                totalReceipts: stats.totalReceipts,
                reconciliationRate: stats.reconciliationRate,
                pendingReceipts: stats.pendingReceipts,
                discrepancyReceipts: stats.discrepancyReceipts,
                lastUpdated: new Date().toISOString()
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error checking Stripe health', { error });
        res.status(500).json({
            success: false,
            error: 'Health check failed'
        });
    }
});
export { stripeReceiptsRouter };
//# sourceMappingURL=stripe-receipts.js.map