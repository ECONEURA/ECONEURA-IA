import { Router } from 'express';
import { z } from 'zod';

import { fiscalidadRegionalService } from '../lib/fiscalidad-regional.service.js';
import { structuredLogger } from '../lib/structured-logger.js';
const fiscalidadRegionalRouter = Router();
const GetTaxRegionsSchema = z.object({
    organizationId: z.string().min(1),
});
const GetTaxRegionSchema = z.object({
    id: z.string().min(1),
});
const CreateTaxRegionSchema = z.object({
    organizationId: z.string().min(1),
    countryCode: z.string().length(2),
    countryName: z.string().min(1),
    regionCode: z.string().optional(),
    regionName: z.string().optional(),
    taxConfiguration: z.object({
        vatRate: z.coerce.number().min(0).max(100),
        reducedVatRates: z.array(z.object({
            rate: z.coerce.number().min(0).max(100),
            description: z.string().min(1),
            categories: z.array(z.string())
        })).optional(),
        withholdingTaxRate: z.coerce.number().min(0).max(100),
        corporateTaxRate: z.coerce.number().min(0).max(100),
        socialSecurityRate: z.coerce.number().min(0).max(100)
    }),
    regulations: z.object({
        vatRegistrationThreshold: z.coerce.number().nonnegative(),
        quarterlyReporting: z.boolean(),
        monthlyReporting: z.boolean(),
        annualReporting: z.boolean(),
        digitalServicesTax: z.boolean(),
        reverseCharge: z.boolean(),
        vatMoss: z.boolean()
    }),
    importantDates: z.object({
        vatReturnDeadline: z.string().min(1),
        corporateTaxDeadline: z.string().min(1),
        payrollTaxDeadline: z.string().min(1),
        annualReportDeadline: z.string().min(1)
    }),
    compliance: z.object({
        isActive: z.boolean(),
        lastAuditDate: z.string().optional(),
        nextAuditDate: z.string().optional(),
        complianceScore: z.coerce.number().min(0).max(100),
        riskLevel: z.enum(['low', 'medium', 'high']),
        notes: z.string().optional()
    })
});
const GetVATTransactionsSchema = z.object({
    organizationId: z.string().min(1),
    regionId: z.string().optional(),
    transactionType: z.enum(['sale', 'purchase', 'import', 'export', 'reverse_charge']).optional(),
    status: z.enum(['draft', 'confirmed', 'reported', 'paid', 'cancelled']).optional(),
    period: z.string().optional(),
    limit: z.coerce.number().int().positive().max(100).default(50).optional(),
});
const CreateVATTransactionSchema = z.object({
    organizationId: z.string().min(1),
    regionId: z.string().min(1),
    transactionType: z.enum(['sale', 'purchase', 'import', 'export', 'reverse_charge']),
    transaction: z.object({
        invoiceNumber: z.string().min(1),
        invoiceDate: z.string().datetime(),
        dueDate: z.string().datetime(),
        customerSupplierId: z.string().min(1),
        customerSupplierName: z.string().min(1),
        customerSupplierVatNumber: z.string().optional(),
        customerSupplierCountry: z.string().length(2)
    }),
    taxDetails: z.object({
        netAmount: z.coerce.number().nonnegative(),
        vatRate: z.coerce.number().min(0).max(100),
        vatAmount: z.coerce.number().nonnegative(),
        totalAmount: z.coerce.number().nonnegative(),
        currency: z.string().length(3),
        vatCode: z.string().min(1),
        exemptionReason: z.string().optional(),
        reverseCharge: z.boolean().optional()
    }),
    classification: z.object({
        category: z.string().min(1),
        subcategory: z.string().optional(),
        productServiceCode: z.string().optional(),
        isDigitalService: z.boolean(),
        isB2B: z.boolean(),
        isB2C: z.boolean()
    }),
    status: z.enum(['draft', 'confirmed', 'reported', 'paid', 'cancelled']).default('draft'),
    reportingPeriod: z.string().min(1)
});
const GetVATReturnsSchema = z.object({
    organizationId: z.string().min(1),
    regionId: z.string().optional(),
    period: z.string().optional(),
    status: z.enum(['draft', 'submitted', 'accepted', 'rejected', 'amended']).optional(),
    limit: z.coerce.number().int().positive().max(100).default(50).optional(),
});
const CreateVATReturnSchema = z.object({
    organizationId: z.string().min(1),
    regionId: z.string().min(1),
    period: z.string().min(1),
    status: z.enum(['draft', 'submitted', 'accepted', 'rejected', 'amended']).default('draft'),
    summary: z.object({
        totalSales: z.coerce.number().nonnegative(),
        totalPurchases: z.coerce.number().nonnegative(),
        vatOnSales: z.coerce.number().nonnegative(),
        vatOnPurchases: z.coerce.number().nonnegative(),
        vatToPay: z.coerce.number(),
        vatToRefund: z.coerce.number().nonnegative(),
        netVatPosition: z.coerce.number()
    }),
    vatBreakdown: z.array(z.object({
        vatRate: z.coerce.number().min(0).max(100),
        salesNet: z.coerce.number().nonnegative(),
        salesVat: z.coerce.number().nonnegative(),
        purchasesNet: z.coerce.number().nonnegative(),
        purchasesVat: z.coerce.number().nonnegative()
    })),
    transactions: z.array(z.string()),
    submission: z.object({
        submittedAt: z.string().datetime().optional(),
        submittedBy: z.string().optional(),
        referenceNumber: z.string().optional(),
        paymentReference: z.string().optional(),
        paymentDate: z.string().datetime().optional(),
        paymentAmount: z.coerce.number().optional(),
        rejectionReason: z.string().optional()
    }).optional()
});
const GetWithholdingTaxesSchema = z.object({
    organizationId: z.string().min(1),
    regionId: z.string().optional(),
    period: z.string().optional(),
    status: z.enum(['calculated', 'paid', 'reported', 'cancelled']).optional(),
    limit: z.coerce.number().int().positive().max(100).default(50).optional(),
});
const CalculateVATSchema = z.object({
    regionId: z.string().min(1),
    netAmount: z.coerce.number().nonnegative(),
    vatRate: z.coerce.number().min(0).max(100),
    transactionType: z.enum(['sale', 'purchase'])
});
const ValidateVATNumberSchema = z.object({
    vatNumber: z.string().min(1),
    countryCode: z.string().length(2)
});
const GetStatsSchema = z.object({
    organizationId: z.string().min(1),
});
fiscalidadRegionalRouter.get('/regions', async (req, res) => {
    try {
        const { organizationId } = GetTaxRegionsSchema.parse(req.query);
        const regions = await fiscalidadRegionalService.getTaxRegions(organizationId);
        res.json({
            success: true,
            data: {
                regions,
                total: regions.length
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error getting tax regions', { error });
        res.status(400).json({
            success: false,
            error: 'Invalid request data',
            details: error.errors
        });
    }
});
fiscalidadRegionalRouter.get('/regions/:id', async (req, res) => {
    try {
        const { id } = GetTaxRegionSchema.parse(req.params);
        const region = await fiscalidadRegionalService.getTaxRegion(id);
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
    }
    catch (error) {
        structuredLogger.error('Error getting tax region', { error });
        res.status(400).json({
            success: false,
            error: 'Invalid request data',
            details: error.errors
        });
    }
});
fiscalidadRegionalRouter.post('/regions', async (req, res) => {
    try {
        const regionData = CreateTaxRegionSchema.parse(req.body);
        const region = await fiscalidadRegionalService.createTaxRegion(regionData);
        res.status(201).json({
            success: true,
            data: region,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error creating tax region', { error });
        res.status(400).json({
            success: false,
            error: 'Invalid request data',
            details: error.errors
        });
    }
});
fiscalidadRegionalRouter.get('/vat-transactions', async (req, res) => {
    try {
        const filters = GetVATTransactionsSchema.parse(req.query);
        const transactions = await fiscalidadRegionalService.getVATTransactions(filters.organizationId, filters);
        res.json({
            success: true,
            data: {
                transactions,
                total: transactions.length,
                filters
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error getting VAT transactions', { error });
        res.status(400).json({
            success: false,
            error: 'Invalid request data',
            details: error.errors
        });
    }
});
fiscalidadRegionalRouter.post('/vat-transactions', async (req, res) => {
    try {
        const transactionData = CreateVATTransactionSchema.parse(req.body);
        const transaction = await fiscalidadRegionalService.createVATTransaction(transactionData);
        res.status(201).json({
            success: true,
            data: transaction,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error creating VAT transaction', { error });
        res.status(400).json({
            success: false,
            error: 'Invalid request data',
            details: error.errors
        });
    }
});
fiscalidadRegionalRouter.get('/vat-returns', async (req, res) => {
    try {
        const filters = GetVATReturnsSchema.parse(req.query);
        const returns = await fiscalidadRegionalService.getVATReturns(filters.organizationId, filters);
        res.json({
            success: true,
            data: {
                returns,
                total: returns.length,
                filters
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error getting VAT returns', { error });
        res.status(400).json({
            success: false,
            error: 'Invalid request data',
            details: error.errors
        });
    }
});
fiscalidadRegionalRouter.post('/vat-returns', async (req, res) => {
    try {
        const returnData = CreateVATReturnSchema.parse(req.body);
        const vatReturn = await fiscalidadRegionalService.createVATReturn(returnData);
        res.status(201).json({
            success: true,
            data: vatReturn,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error creating VAT return', { error });
        res.status(400).json({
            success: false,
            error: 'Invalid request data',
            details: error.errors
        });
    }
});
fiscalidadRegionalRouter.get('/withholding-taxes', async (req, res) => {
    try {
        const filters = GetWithholdingTaxesSchema.parse(req.query);
        const withholdings = await fiscalidadRegionalService.getWithholdingTaxes(filters.organizationId, filters);
        res.json({
            success: true,
            data: {
                withholdings,
                total: withholdings.length,
                filters
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error getting withholding taxes', { error });
        res.status(400).json({
            success: false,
            error: 'Invalid request data',
            details: error.errors
        });
    }
});
fiscalidadRegionalRouter.post('/calculate-vat', async (req, res) => {
    try {
        const { regionId, netAmount, vatRate, transactionType } = CalculateVATSchema.parse(req.body);
        const calculation = await fiscalidadRegionalService.calculateVAT(regionId, netAmount, vatRate, transactionType);
        res.json({
            success: true,
            data: calculation,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error calculating VAT', { error });
        res.status(400).json({
            success: false,
            error: error.message || 'Failed to calculate VAT',
            details: error.errors
        });
    }
});
fiscalidadRegionalRouter.post('/validate-vat-number', async (req, res) => {
    try {
        const { vatNumber, countryCode } = ValidateVATNumberSchema.parse(req.body);
        const validation = await fiscalidadRegionalService.validateVATNumber(vatNumber, countryCode);
        res.json({
            success: true,
            data: validation,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error validating VAT number', { error });
        res.status(400).json({
            success: false,
            error: 'Invalid request data',
            details: error.errors
        });
    }
});
fiscalidadRegionalRouter.get('/stats', async (req, res) => {
    try {
        const { organizationId } = GetStatsSchema.parse(req.query);
        const stats = await fiscalidadRegionalService.getTaxStats(organizationId);
        res.json({
            success: true,
            data: stats,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error getting tax stats', { error });
        res.status(400).json({
            success: false,
            error: 'Invalid request data',
            details: error.errors
        });
    }
});
fiscalidadRegionalRouter.get('/health', async (req, res) => {
    try {
        const stats = await fiscalidadRegionalService.getTaxStats('demo-org-1');
        res.json({
            success: true,
            data: {
                status: 'ok',
                totalRegions: stats.totalRegions,
                activeRegions: stats.activeRegions,
                totalTransactions: stats.totalTransactions,
                totalVATReturns: stats.totalVATReturns,
                totalWithholdings: stats.totalWithholdings,
                averageComplianceScore: stats.compliance.averageScore,
                highRiskRegions: stats.compliance.highRiskRegions,
                lastUpdated: new Date().toISOString()
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error checking fiscalidad health', { error });
        res.status(500).json({
            success: false,
            error: 'Health check failed'
        });
    }
});
export { fiscalidadRegionalRouter };
//# sourceMappingURL=fiscalidad-regional.js.map