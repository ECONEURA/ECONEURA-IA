import { Router } from 'express';
import { z } from 'zod';

import { inventoryKardexService } from '../lib/inventory-kardex.service.js';
import { structuredLogger } from '../lib/structured-logger.js';
const inventoryKardexRouter = Router();
const GetProductsSchema = z.object({
    organizationId: z.string().min(1),
    category: z.string().optional(),
    location: z.string().optional(),
    isActive: z.coerce.boolean().optional(),
    search: z.string().optional(),
    limit: z.coerce.number().int().positive().max(100).default(50).optional(),
});
const CreateProductSchema = z.object({
    organizationId: z.string().min(1),
    sku: z.string().min(1),
    name: z.string().min(1),
    description: z.string().min(1),
    category: z.string().min(1),
    unit: z.string().min(1),
    cost: z.coerce.number().positive(),
    price: z.coerce.number().positive(),
    currency: z.string().length(3),
    reorderPoint: z.coerce.number().int().nonnegative(),
    reorderQuantity: z.coerce.number().int().positive(),
    maxStock: z.coerce.number().int().positive(),
    minStock: z.coerce.number().int().nonnegative(),
    isActive: z.boolean().default(true),
    supplierId: z.string().optional(),
    location: z.string().min(1),
    barcode: z.string().optional(),
    tags: z.array(z.string()).default([]),
});
const GetKardexEntriesSchema = z.object({
    organizationId: z.string().min(1),
    productId: z.string().optional(),
    transactionType: z.enum(['in', 'out', 'adjustment', 'transfer', 'return', 'waste', 'cycle_count']).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    limit: z.coerce.number().int().positive().max(100).default(50).optional(),
});
const CreateKardexEntrySchema = z.object({
    organizationId: z.string().min(1),
    productId: z.string().min(1),
    transactionType: z.enum(['in', 'out', 'adjustment', 'transfer', 'return', 'waste', 'cycle_count']),
    quantity: z.coerce.number(),
    unitCost: z.coerce.number().nonnegative(),
    totalCost: z.coerce.number().nonnegative(),
    reference: z.string().min(1),
    referenceType: z.enum(['purchase', 'sale', 'adjustment', 'transfer', 'return', 'cycle_count', 'waste']),
    location: z.string().min(1),
    notes: z.string().optional(),
    userId: z.string().min(1),
    userName: z.string().min(1),
});
const GetStockLevelsSchema = z.object({
    organizationId: z.string().min(1),
    location: z.string().optional(),
    lowStock: z.coerce.boolean().optional(),
    overstock: z.coerce.boolean().optional(),
    limit: z.coerce.number().int().positive().max(100).default(50).optional(),
});
const GetAlertsSchema = z.object({
    organizationId: z.string().min(1),
    alertType: z.enum(['low_stock', 'overstock', 'reorder_point', 'negative_stock', 'slow_moving', 'expired', 'cycle_count_due']).optional(),
    severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    isActive: z.coerce.boolean().optional(),
    isAcknowledged: z.coerce.boolean().optional(),
    limit: z.coerce.number().int().positive().max(100).default(50).optional(),
});
const AcknowledgeAlertSchema = z.object({
    acknowledgedBy: z.string().min(1),
});
const GetCycleCountsSchema = z.object({
    organizationId: z.string().min(1),
    status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']).optional(),
    assignedTo: z.string().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    limit: z.coerce.number().int().positive().max(100).default(50).optional(),
});
const CreateCycleCountSchema = z.object({
    organizationId: z.string().min(1),
    productId: z.string().min(1),
    scheduledDate: z.string().datetime(),
    expectedQuantity: z.coerce.number().int().nonnegative(),
    assignedTo: z.string().min(1),
    assignedBy: z.string().min(1),
    notes: z.string().optional(),
});
const CompleteCycleCountSchema = z.object({
    actualQuantity: z.coerce.number().int().nonnegative(),
    notes: z.string().optional(),
});
const GenerateReportSchema = z.object({
    organizationId: z.string().min(1),
    reportType: z.enum(['stock_levels', 'movements', 'valuation', 'abc_analysis', 'cycle_count_summary']),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    generatedBy: z.string().min(1),
});
const GetStatsSchema = z.object({
    organizationId: z.string().min(1),
});
inventoryKardexRouter.get('/products', async (req, res) => {
    try {
        const filters = GetProductsSchema.parse(req.query);
        const products = await inventoryKardexService.getProducts(filters.organizationId, filters);
        res.json({
            success: true,
            data: {
                products,
                total: products.length,
                filters
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error getting products', { error });
        res.status(400).json({
            success: false,
            error: 'Invalid request data',
            details: error.errors
        });
    }
});
inventoryKardexRouter.get('/products/:id', async (req, res) => {
    try {
        const { id } = z.object({ id: z.string().min(1) }).parse(req.params);
        const product = await inventoryKardexService.getProduct(id);
        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }
        res.json({
            success: true,
            data: product,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error getting product', { error });
        res.status(400).json({
            success: false,
            error: 'Invalid request data',
            details: error.errors
        });
    }
});
inventoryKardexRouter.post('/products', async (req, res) => {
    try {
        const productData = CreateProductSchema.parse(req.body);
        const product = await inventoryKardexService.createProduct(productData);
        res.status(201).json({
            success: true,
            data: product,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error creating product', { error });
        res.status(400).json({
            success: false,
            error: 'Invalid request data',
            details: error.errors
        });
    }
});
inventoryKardexRouter.get('/kardex', async (req, res) => {
    try {
        const filters = GetKardexEntriesSchema.parse(req.query);
        const entries = await inventoryKardexService.getKardexEntries(filters.organizationId, filters);
        res.json({
            success: true,
            data: {
                entries,
                total: entries.length,
                filters
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error getting kardex entries', { error });
        res.status(400).json({
            success: false,
            error: 'Invalid request data',
            details: error.errors
        });
    }
});
inventoryKardexRouter.post('/kardex', async (req, res) => {
    try {
        const entryData = CreateKardexEntrySchema.parse(req.body);
        const entry = await inventoryKardexService.createKardexEntry(entryData);
        res.status(201).json({
            success: true,
            data: entry,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error creating kardex entry', { error });
        res.status(400).json({
            success: false,
            error: 'Invalid request data',
            details: error.errors
        });
    }
});
inventoryKardexRouter.get('/stock-levels', async (req, res) => {
    try {
        const filters = GetStockLevelsSchema.parse(req.query);
        const stockLevels = await inventoryKardexService.getStockLevels(filters.organizationId, filters);
        res.json({
            success: true,
            data: {
                stockLevels,
                total: stockLevels.length,
                filters
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error getting stock levels', { error });
        res.status(400).json({
            success: false,
            error: 'Invalid request data',
            details: error.errors
        });
    }
});
inventoryKardexRouter.get('/stock-levels/:productId', async (req, res) => {
    try {
        const { productId } = z.object({ productId: z.string().min(1) }).parse(req.params);
        const stockLevel = await inventoryKardexService.getStockLevel(productId);
        if (!stockLevel) {
            return res.status(404).json({
                success: false,
                error: 'Stock level not found'
            });
        }
        res.json({
            success: true,
            data: stockLevel,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error getting stock level', { error });
        res.status(400).json({
            success: false,
            error: 'Invalid request data',
            details: error.errors
        });
    }
});
inventoryKardexRouter.get('/alerts', async (req, res) => {
    try {
        const filters = GetAlertsSchema.parse(req.query);
        const alerts = await inventoryKardexService.getAlerts(filters.organizationId, filters);
        res.json({
            success: true,
            data: {
                alerts,
                total: alerts.length,
                filters
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error getting alerts', { error });
        res.status(400).json({
            success: false,
            error: 'Invalid request data',
            details: error.errors
        });
    }
});
inventoryKardexRouter.post('/alerts/:id/acknowledge', async (req, res) => {
    try {
        const { id } = z.object({ id: z.string().min(1) }).parse(req.params);
        const { acknowledgedBy } = AcknowledgeAlertSchema.parse(req.body);
        const alert = await inventoryKardexService.acknowledgeAlert(id, acknowledgedBy);
        if (!alert) {
            return res.status(404).json({
                success: false,
                error: 'Alert not found'
            });
        }
        res.json({
            success: true,
            data: alert,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error acknowledging alert', { error });
        res.status(400).json({
            success: false,
            error: 'Invalid request data',
            details: error.errors
        });
    }
});
inventoryKardexRouter.get('/cycle-counts', async (req, res) => {
    try {
        const filters = GetCycleCountsSchema.parse(req.query);
        const cycleCounts = await inventoryKardexService.getCycleCounts(filters.organizationId, filters);
        res.json({
            success: true,
            data: {
                cycleCounts,
                total: cycleCounts.length,
                filters
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error getting cycle counts', { error });
        res.status(400).json({
            success: false,
            error: 'Invalid request data',
            details: error.errors
        });
    }
});
inventoryKardexRouter.post('/cycle-counts', async (req, res) => {
    try {
        const cycleCountData = CreateCycleCountSchema.parse(req.body);
        const cycleCount = await inventoryKardexService.createCycleCount(cycleCountData);
        res.status(201).json({
            success: true,
            data: cycleCount,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error creating cycle count', { error });
        res.status(400).json({
            success: false,
            error: 'Invalid request data',
            details: error.errors
        });
    }
});
inventoryKardexRouter.post('/cycle-counts/:id/complete', async (req, res) => {
    try {
        const { id } = z.object({ id: z.string().min(1) }).parse(req.params);
        const { actualQuantity, notes } = CompleteCycleCountSchema.parse(req.body);
        const cycleCount = await inventoryKardexService.completeCycleCount(id, actualQuantity, notes);
        if (!cycleCount) {
            return res.status(404).json({
                success: false,
                error: 'Cycle count not found'
            });
        }
        res.json({
            success: true,
            data: cycleCount,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error completing cycle count', { error });
        res.status(400).json({
            success: false,
            error: 'Invalid request data',
            details: error.errors
        });
    }
});
inventoryKardexRouter.post('/reports', async (req, res) => {
    try {
        const reportData = GenerateReportSchema.parse(req.body);
        const report = await inventoryKardexService.generateInventoryReport(reportData.organizationId, reportData.reportType, reportData.startDate, reportData.endDate, reportData.generatedBy);
        res.status(201).json({
            success: true,
            data: report,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error generating inventory report', { error });
        res.status(400).json({
            success: false,
            error: 'Invalid request data',
            details: error.errors
        });
    }
});
inventoryKardexRouter.get('/stats', async (req, res) => {
    try {
        const { organizationId } = GetStatsSchema.parse(req.query);
        const stats = await inventoryKardexService.getInventoryStats(organizationId);
        res.json({
            success: true,
            data: stats,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error getting inventory stats', { error });
        res.status(400).json({
            success: false,
            error: 'Invalid request data',
            details: error.errors
        });
    }
});
inventoryKardexRouter.get('/health', async (req, res) => {
    try {
        const stats = await inventoryKardexService.getInventoryStats('demo-org-1');
        res.json({
            success: true,
            data: {
                status: 'ok',
                totalProducts: stats.totalProducts,
                totalValue: stats.totalValue,
                activeAlerts: stats.activeAlerts,
                lowStockItems: stats.lowStockItems,
                overstockItems: stats.overstockItems,
                lastUpdated: new Date().toISOString()
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error checking inventory health', { error });
        res.status(500).json({
            success: false,
            error: 'Health check failed'
        });
    }
});
export { inventoryKardexRouter };
//# sourceMappingURL=inventory-kardex.js.map