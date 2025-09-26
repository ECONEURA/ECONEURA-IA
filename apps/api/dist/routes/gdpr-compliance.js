import { Router } from 'express';
import { z } from 'zod';

import { gdprConsolidated } from '../lib/gdpr-consolidated.service.js';
import { structuredLogger } from '../lib/structured-logger.js';
const router = Router();
const CreateGDPRRequestSchema = z.object({
    userId: z.string().uuid(),
    type: z.enum(['export', 'erase', 'rectification', 'portability']),
    requestedBy: z.string().uuid(),
    dataCategories: z.array(z.string()),
    options: z.object({
        reason: z.string().optional(),
        legalBasis: z.string().optional(),
        scope: z.enum(['user', 'organization']).optional(),
        priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
        metadata: z.record(z.any()).optional()
    }).optional()
});
const UpdateGDPRRequestStatusSchema = z.object({
    status: z.enum(['pending', 'processing', 'completed', 'failed']),
    processedBy: z.string().uuid(),
    details: z.record(z.any()).optional()
});
const CreateLegalHoldSchema = z.object({
    name: z.string().min(1),
    description: z.string().min(1),
    type: z.enum(['litigation', 'regulatory', 'investigation']),
    dataCategories: z.array(z.string()),
    startDate: z.string().datetime(),
    endDate: z.string().datetime().optional(),
    status: z.enum(['active', 'expired', 'suspended']),
    createdBy: z.string().uuid(),
    legalBasis: z.string().min(1),
    metadata: z.record(z.any()).optional()
});
const CreateConsentRecordSchema = z.object({
    userId: z.string().uuid(),
    dataCategory: z.string(),
    consentGiven: z.boolean(),
    consentDate: z.string().datetime(),
    purpose: z.string().min(1),
    legalBasis: z.string().min(1),
    withdrawalDate: z.string().datetime().optional(),
    metadata: z.record(z.any()).optional()
});
const CreateDataProcessingActivitySchema = z.object({
    name: z.string().min(1),
    description: z.string().min(1),
    purpose: z.string().min(1),
    legalBasis: z.string().min(1),
    dataCategories: z.array(z.string()),
    retentionPeriod: z.number().positive(),
    dataController: z.string().min(1),
    dataProcessor: z.string().optional(),
    thirdParties: z.array(z.string()).optional(),
    safeguards: z.array(z.string()).optional(),
    metadata: z.record(z.any()).optional()
});
const CreateBreachRecordSchema = z.object({
    type: z.enum(['confidentiality', 'integrity', 'availability']),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    description: z.string().min(1),
    affectedDataCategories: z.array(z.string()),
    affectedUsers: z.number().nonnegative(),
    discoveredAt: z.string().datetime(),
    reportedAt: z.string().datetime().optional(),
    status: z.enum(['discovered', 'investigating', 'contained', 'resolved']),
    impact: z.string().min(1),
    rootCause: z.string().optional(),
    remediation: z.string().optional(),
    metadata: z.record(z.any()).optional()
});
const GenerateComplianceReportSchema = z.object({
    organizationId: z.string().uuid(),
    period: z.object({
        start: z.string().datetime(),
        end: z.string().datetime()
    }),
    generatedBy: z.string().uuid()
});
router.post('/requests', async (req, res) => {
    try {
        const validatedData = CreateGDPRRequestSchema.parse(req.body);
        const gdprRequest = await gdprConsolidated.createGDPRRequest(validatedData.userId, validatedData.type, validatedData.requestedBy, validatedData.dataCategories, validatedData.options);
        structuredLogger.info('GDPR request created', {
            requestId: gdprRequest.id,
            userId: validatedData.userId,
            type: validatedData.type,
            requestedBy: validatedData.requestedBy
        });
        res.status(201).json({
            success: true,
            data: gdprRequest,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            structuredLogger.warn('Invalid GDPR request creation', { errors: error.errors });
            return res.status(400).json({
                success: false,
                error: 'Invalid request data',
                details: error.errors
            });
        }
        structuredLogger.error('Failed to create GDPR request', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create GDPR request',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/requests/:requestId', async (req, res) => {
    try {
        const { requestId } = req.params;
        const gdprRequest = await gdprConsolidated.getGDPRRequest(requestId);
        if (!gdprRequest) {
            return res.status(404).json({
                success: false,
                error: 'GDPR request not found'
            });
        }
        structuredLogger.info('GDPR request retrieved', { requestId });
        res.json({
            success: true,
            data: gdprRequest,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Failed to get GDPR request', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get GDPR request',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/requests', async (req, res) => {
    try {
        const { userId, type, status, priority } = req.query;
        const filters = {
            type: type,
            status: status,
            priority: priority
        };
        const gdprRequests = await gdprConsolidated.getGDPRRequests(userId, Object.keys(filters).length > 0 ? filters : undefined);
        structuredLogger.info('GDPR requests retrieved', {
            count: gdprRequests.length,
            filters: { userId, type, status, priority }
        });
        res.json({
            success: true,
            data: gdprRequests,
            count: gdprRequests.length,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Failed to get GDPR requests', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get GDPR requests',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.patch('/requests/:requestId/status', async (req, res) => {
    try {
        const { requestId } = req.params;
        const validatedData = UpdateGDPRRequestStatusSchema.parse(req.body);
        const updatedRequest = await gdprConsolidated.updateGDPRRequestStatus(requestId, validatedData.status, validatedData.processedBy, validatedData.details);
        if (!updatedRequest) {
            return res.status(404).json({
                success: false,
                error: 'GDPR request not found'
            });
        }
        structuredLogger.info('GDPR request status updated', {
            requestId,
            status: validatedData.status,
            processedBy: validatedData.processedBy
        });
        res.json({
            success: true,
            data: updatedRequest,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            structuredLogger.warn('Invalid GDPR request status update', { errors: error.errors });
            return res.status(400).json({
                success: false,
                error: 'Invalid request data',
                details: error.errors
            });
        }
        structuredLogger.error('Failed to update GDPR request status', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update GDPR request status',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/exports/:exportId', async (req, res) => {
    try {
        const { exportId } = req.params;
        const dataExport = await gdprConsolidated.getDataExport(exportId);
        if (!dataExport) {
            return res.status(404).json({
                success: false,
                error: 'Data export not found'
            });
        }
        structuredLogger.info('Data export retrieved', { exportId });
        res.json({
            success: true,
            data: dataExport,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Failed to get data export', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get data export',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/exports/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const userExports = await gdprConsolidated.getUserExports(userId);
        structuredLogger.info('User exports retrieved', { userId, count: userExports.length });
        res.json({
            success: true,
            data: userExports,
            count: userExports.length,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Failed to get user exports', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get user exports',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.post('/exports/:exportId/download', async (req, res) => {
    try {
        const { exportId } = req.params;
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'User ID is required'
            });
        }
        const downloadResult = await gdprConsolidated.downloadExport(exportId, userId);
        if (!downloadResult) {
            return res.status(404).json({
                success: false,
                error: 'Export not found or access denied'
            });
        }
        structuredLogger.info('Data export downloaded', { exportId, userId });
        res.json({
            success: true,
            data: downloadResult,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Failed to download export', error);
        res.status(500).json({
            success: false,
            error: 'Failed to download export',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/erasures/:eraseId', async (req, res) => {
    try {
        const { eraseId } = req.params;
        const dataErase = await gdprConsolidated.getDataErase(eraseId);
        if (!dataErase) {
            return res.status(404).json({
                success: false,
                error: 'Data erase not found'
            });
        }
        structuredLogger.info('Data erase retrieved', { eraseId });
        res.json({
            success: true,
            data: dataErase,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Failed to get data erase', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get data erase',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/erasures/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const userErasures = await gdprConsolidated.getUserErasures(userId);
        structuredLogger.info('User erasures retrieved', { userId, count: userErasures.length });
        res.json({
            success: true,
            data: userErasures,
            count: userErasures.length,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Failed to get user erasures', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get user erasures',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.post('/legal-holds', async (req, res) => {
    try {
        const validatedData = CreateLegalHoldSchema.parse(req.body);
        const legalHold = await gdprConsolidated.createLegalHold({
            ...validatedData,
            startDate: new Date(validatedData.startDate),
            endDate: validatedData.endDate ? new Date(validatedData.endDate) : undefined
        });
        structuredLogger.info('Legal hold created', {
            holdId: legalHold.id,
            name: legalHold.name,
            type: legalHold.type
        });
        res.status(201).json({
            success: true,
            data: legalHold,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            structuredLogger.warn('Invalid legal hold creation', { errors: error.errors });
            return res.status(400).json({
                success: false,
                error: 'Invalid request data',
                details: error.errors
            });
        }
        structuredLogger.error('Failed to create legal hold', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create legal hold',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/legal-holds', async (req, res) => {
    try {
        const { status, type, userId } = req.query;
        const filters = {
            status: status,
            type: type,
            userId: userId
        };
        const legalHolds = await gdprConsolidated.getLegalHolds(Object.keys(filters).length > 0 ? filters : undefined);
        structuredLogger.info('Legal holds retrieved', {
            count: legalHolds.length,
            filters: { status, type, userId }
        });
        res.json({
            success: true,
            data: legalHolds,
            count: legalHolds.length,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Failed to get legal holds', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get legal holds',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.post('/consent', async (req, res) => {
    try {
        const validatedData = CreateConsentRecordSchema.parse(req.body);
        const consentRecord = await gdprConsolidated.createConsentRecord({
            ...validatedData,
            consentDate: new Date(validatedData.consentDate),
            withdrawalDate: validatedData.withdrawalDate ? new Date(validatedData.withdrawalDate) : undefined
        });
        structuredLogger.info('Consent record created', {
            consentId: consentRecord.id,
            userId: consentRecord.userId,
            dataCategory: consentRecord.dataCategory
        });
        res.status(201).json({
            success: true,
            data: consentRecord,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            structuredLogger.warn('Invalid consent record creation', { errors: error.errors });
            return res.status(400).json({
                success: false,
                error: 'Invalid request data',
                details: error.errors
            });
        }
        structuredLogger.error('Failed to create consent record', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create consent record',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/consent/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { dataCategory } = req.query;
        const consentRecords = await gdprConsolidated.getConsentRecords(userId, dataCategory);
        structuredLogger.info('Consent records retrieved', {
            userId,
            dataCategory,
            count: consentRecords.length
        });
        res.json({
            success: true,
            data: consentRecords,
            count: consentRecords.length,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Failed to get consent records', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get consent records',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.post('/consent/:consentId/withdraw', async (req, res) => {
    try {
        const { consentId } = req.params;
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'User ID is required'
            });
        }
        const updatedConsent = await gdprConsolidated.withdrawConsent(consentId, userId);
        if (!updatedConsent) {
            return res.status(404).json({
                success: false,
                error: 'Consent record not found or access denied'
            });
        }
        structuredLogger.info('Consent withdrawn', { consentId, userId });
        res.json({
            success: true,
            data: updatedConsent,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Failed to withdraw consent', error);
        res.status(500).json({
            success: false,
            error: 'Failed to withdraw consent',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.post('/data-processing-activities', async (req, res) => {
    try {
        const validatedData = CreateDataProcessingActivitySchema.parse(req.body);
        const activity = await gdprConsolidated.createDataProcessingActivity(validatedData);
        structuredLogger.info('Data processing activity created', {
            activityId: activity.id,
            name: activity.name,
            purpose: activity.purpose
        });
        res.status(201).json({
            success: true,
            data: activity,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            structuredLogger.warn('Invalid data processing activity creation', { errors: error.errors });
            return res.status(400).json({
                success: false,
                error: 'Invalid request data',
                details: error.errors
            });
        }
        structuredLogger.error('Failed to create data processing activity', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create data processing activity',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/data-processing-activities', async (req, res) => {
    try {
        const activities = await gdprConsolidated.getDataProcessingActivities();
        structuredLogger.info('Data processing activities retrieved', { count: activities.length });
        res.json({
            success: true,
            data: activities,
            count: activities.length,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Failed to get data processing activities', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get data processing activities',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.post('/breaches', async (req, res) => {
    try {
        const validatedData = CreateBreachRecordSchema.parse(req.body);
        const breach = await gdprConsolidated.createBreachRecord({
            ...validatedData,
            discoveredAt: new Date(validatedData.discoveredAt),
            reportedAt: validatedData.reportedAt ? new Date(validatedData.reportedAt) : undefined
        });
        structuredLogger.info('Breach record created', {
            breachId: breach.id,
            type: breach.type,
            severity: breach.severity
        });
        res.status(201).json({
            success: true,
            data: breach,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            structuredLogger.warn('Invalid breach record creation', { errors: error.errors });
            return res.status(400).json({
                success: false,
                error: 'Invalid request data',
                details: error.errors
            });
        }
        structuredLogger.error('Failed to create breach record', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create breach record',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/breaches', async (req, res) => {
    try {
        const { status, severity, type } = req.query;
        const filters = {
            status: status,
            severity: severity,
            type: type
        };
        const breaches = await gdprConsolidated.getBreachRecords(Object.keys(filters).length > 0 ? filters : undefined);
        structuredLogger.info('Breach records retrieved', {
            count: breaches.length,
            filters: { status, severity, type }
        });
        res.json({
            success: true,
            data: breaches,
            count: breaches.length,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Failed to get breach records', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get breach records',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.post('/compliance-reports', async (req, res) => {
    try {
        const validatedData = GenerateComplianceReportSchema.parse(req.body);
        const report = await gdprConsolidated.generateComplianceReport(validatedData.organizationId, {
            start: new Date(validatedData.period.start),
            end: new Date(validatedData.period.end)
        }, validatedData.generatedBy);
        structuredLogger.info('Compliance report generated', {
            reportId: report.id,
            organizationId: validatedData.organizationId,
            complianceScore: report.complianceScore
        });
        res.status(201).json({
            success: true,
            data: report,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            structuredLogger.warn('Invalid compliance report generation', { errors: error.errors });
            return res.status(400).json({
                success: false,
                error: 'Invalid request data',
                details: error.errors
            });
        }
        structuredLogger.error('Failed to generate compliance report', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate compliance report',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/stats', async (req, res) => {
    try {
        const stats = await gdprConsolidated.getGDPRStats();
        structuredLogger.info('GDPR stats retrieved');
        res.json({
            success: true,
            data: stats,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Failed to get GDPR stats', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get GDPR stats',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/service-stats', async (req, res) => {
    try {
        const serviceStats = await gdprConsolidated.getServiceStats();
        structuredLogger.info('GDPR service stats retrieved');
        res.json({
            success: true,
            data: serviceStats,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Failed to get GDPR service stats', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get GDPR service stats',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/health', async (req, res) => {
    try {
        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            services: {
                gdprRequests: 'operational',
                dataExports: 'operational',
                dataErasures: 'operational',
                legalHolds: 'operational',
                consentManagement: 'operational',
                dataProcessingActivities: 'operational',
                breachManagement: 'operational',
                complianceReporting: 'operational'
            },
            uptime: process.uptime()
        };
        structuredLogger.info('GDPR compliance service health check', health);
        res.json(health);
    }
    catch (error) {
        structuredLogger.error('GDPR compliance service health check failed', error);
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
export default router;
//# sourceMappingURL=gdpr-compliance.js.map