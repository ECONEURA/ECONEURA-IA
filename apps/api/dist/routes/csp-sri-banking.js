import { Router } from 'express';
import { z } from 'zod';

import { logger } from '../lib/logger.js';
import { cspBankingService } from '../lib/csp-sri-banking.service.js';
const router = Router();
const CSPReportSchema = z.object({
    'csp-report': z.object({
        'document-uri': z.string(),
        'referrer': z.string().optional(),
        'violated-directive': z.string(),
        'effective-directive': z.string().optional(),
        'original-policy': z.string(),
        'disposition': z.enum(['enforce', 'report']),
        'blocked-uri': z.string().optional(),
        'line-number': z.number().optional(),
        'column-number': z.number().optional(),
        'source-file': z.string().optional(),
        'status-code': z.number().optional(),
        'script-sample': z.string().optional(),
    })
});
const SRIReportSchema = z.object({
    'sri-report': z.object({
        'document-uri': z.string(),
        'referrer': z.string().optional(),
        'blocked-uri': z.string(),
        'violation-type': z.enum(['integrity-mismatch', 'missing-integrity', 'invalid-integrity']),
        'expected-hash': z.string().optional(),
        'actual-hash': z.string().optional(),
        'algorithm': z.enum(['sha256', 'sha384', 'sha512']).optional(),
    })
});
const ReportFiltersSchema = z.object({
    type: z.enum(['csp', 'sri']).optional(),
    severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    resolved: z.boolean().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    limit: z.number().min(1).max(1000).default(100),
    offset: z.number().min(0).default(0)
});
const ResolveReportSchema = z.object({
    resolution: z.string().min(1).max(500)
});
router.post('/csp-reports', async (req, res) => {
    try {
        const userAgent = req.headers['user-agent'] || 'unknown';
        const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
        const organizationId = req.headers['x-organization-id'];
        const userId = req.headers['x-user-id'];
        const metadata = {
            userAgent,
            ipAddress,
            organizationId,
            userId
        };
        if (req.body['csp-report']) {
            const cspData = CSPReportSchema.parse(req.body);
            const report = await cspBankingService.processCSPViolation(cspData, metadata);
            logger.info('CSP violation report received', {
                reportId: report.id,
                severity: report.severity,
                directive: cspData['csp-report']['violated-directive'],
                source: report.source,
                requestId: req.headers['x-request-id'] || ''
            });
            res.status(204).send();
        }
        else if (req.body['sri-report']) {
            const sriData = SRIReportSchema.parse(req.body);
            const report = await cspBankingService.processSRIViolation(sriData, metadata);
            logger.info('SRI violation report received', {
                reportId: report.id,
                severity: report.severity,
                violationType: sriData['sri-report']['violation-type'],
                source: report.source,
                requestId: req.headers['x-request-id'] || ''
            });
            res.status(204).send();
        }
        else {
            res.status(400).json({
                success: false,
                error: 'Invalid report format. Expected csp-report or sri-report',
                code: 'INVALID_REPORT_FORMAT'
            });
        }
    }
    catch (error) {
        logger.error('Failed to process CSP/SRI report', {
            error: error instanceof Error ? error.message : 'Unknown error',
            body: req.body,
            requestId: req.headers['x-request-id'] || ''
        });
        res.status(400).json({
            success: false,
            error: 'Failed to process report',
            code: 'REPORT_PROCESSING_ERROR'
        });
    }
});
router.get('/csp-reports', async (req, res) => {
    try {
        const filters = ReportFiltersSchema.parse({
            type: req.query.type,
            severity: req.query.severity,
            resolved: req.query.resolved === 'true' ? true : req.query.resolved === 'false' ? false : undefined,
            startDate: req.query.startDate,
            endDate: req.query.endDate,
            limit: req.query.limit ? parseInt(req.query.limit) : undefined,
            offset: req.query.offset ? parseInt(req.query.offset) : undefined
        });
        const reports = cspBankingService.getReports(filters);
        res.json({
            success: true,
            data: {
                reports,
                pagination: {
                    limit: filters.limit,
                    offset: filters.offset,
                    total: reports.length
                }
            }
        });
    }
    catch (error) {
        logger.error('Failed to get CSP/SRI reports', {
            error: error instanceof Error ? error.message : 'Unknown error',
            query: req.query,
            requestId: req.headers['x-request-id'] || ''
        });
        res.status(400).json({
            success: false,
            error: 'Failed to get reports',
            code: 'REPORTS_FETCH_ERROR'
        });
    }
});
router.get('/csp-reports/stats', async (req, res) => {
    try {
        const stats = cspBankingService.getStats();
        res.json({
            success: true,
            data: stats
        });
    }
    catch (error) {
        logger.error('Failed to get CSP/SRI stats', {
            error: error instanceof Error ? error.message : 'Unknown error',
            requestId: req.headers['x-request-id'] || ''
        });
        res.status(500).json({
            success: false,
            error: 'Failed to get stats',
            code: 'STATS_FETCH_ERROR'
        });
    }
});
router.get('/csp-reports/:reportId', async (req, res) => {
    try {
        const { reportId } = req.params;
        const reports = cspBankingService.getReports({ limit: 1, offset: 0 });
        const report = reports.find(r => r.id === reportId);
        if (!report) {
            res.status(404).json({
                success: false,
                error: 'Report not found',
                code: 'REPORT_NOT_FOUND'
            });
            return;
        }
        res.json({
            success: true,
            data: report
        });
    }
    catch (error) {
        logger.error('Failed to get CSP/SRI report', {
            error: error instanceof Error ? error.message : 'Unknown error',
            reportId: req.params.reportId,
            requestId: req.headers['x-request-id'] || ''
        });
        res.status(500).json({
            success: false,
            error: 'Failed to get report',
            code: 'REPORT_FETCH_ERROR'
        });
    }
});
router.patch('/csp-reports/:reportId/resolve', async (req, res) => {
    try {
        const { reportId } = req.params;
        const { resolution } = ResolveReportSchema.parse(req.body);
        const success = cspBankingService.resolveReport(reportId, resolution);
        if (!success) {
            res.status(404).json({
                success: false,
                error: 'Report not found',
                code: 'REPORT_NOT_FOUND'
            });
            return;
        }
        res.json({
            success: true,
            message: 'Report resolved successfully'
        });
    }
    catch (error) {
        logger.error('Failed to resolve CSP/SRI report', {
            error: error instanceof Error ? error.message : 'Unknown error',
            reportId: req.params.reportId,
            requestId: req.headers['x-request-id'] || ''
        });
        res.status(400).json({
            success: false,
            error: 'Failed to resolve report',
            code: 'REPORT_RESOLUTION_ERROR'
        });
    }
});
router.get('/csp-policy', async (req, res) => {
    try {
        const cspHeader = cspBankingService.generateCSPHeader();
        const config = cspBankingService.getConfig();
        res.json({
            success: true,
            data: {
                cspHeader,
                config: {
                    enabled: config.enabled,
                    bankingMode: config.bankingMode,
                    strictMode: config.strictMode,
                    enforceMode: config.enforceMode,
                    reportOnly: config.reportOnly,
                    reportUri: config.reportUri,
                    alertThreshold: config.alertThreshold
                }
            }
        });
    }
    catch (error) {
        logger.error('Failed to get CSP policy', {
            error: error instanceof Error ? error.message : 'Unknown error',
            requestId: req.headers['x-request-id'] || ''
        });
        res.status(500).json({
            success: false,
            error: 'Failed to get CSP policy',
            code: 'CSP_POLICY_FETCH_ERROR'
        });
    }
});
router.post('/csp-policy', async (req, res) => {
    try {
        const updateConfigSchema = z.object({
            enabled: z.boolean().optional(),
            bankingMode: z.boolean().optional(),
            strictMode: z.boolean().optional(),
            enforceMode: z.boolean().optional(),
            reportOnly: z.boolean().optional(),
            alertThreshold: z.number().min(1).max(1000).optional(),
            allowedDomains: z.array(z.string()).optional(),
            allowedScripts: z.array(z.string()).optional(),
            allowedStyles: z.array(z.string()).optional(),
            allowedImages: z.array(z.string()).optional(),
            allowedFonts: z.array(z.string()).optional(),
            allowedConnections: z.array(z.string()).optional(),
            customDirectives: z.record(z.array(z.string())).optional()
        });
        const configUpdate = updateConfigSchema.parse(req.body);
        cspBankingService.updateConfig(configUpdate);
        const newCspHeader = cspBankingService.generateCSPHeader();
        const newConfig = cspBankingService.getConfig();
        logger.info('CSP policy updated', {
            configUpdate,
            requestId: req.headers['x-request-id'] || ''
        });
        res.json({
            success: true,
            data: {
                cspHeader: newCspHeader,
                config: {
                    enabled: newConfig.enabled,
                    bankingMode: newConfig.bankingMode,
                    strictMode: newConfig.strictMode,
                    enforceMode: newConfig.enforceMode,
                    reportOnly: newConfig.reportOnly,
                    reportUri: newConfig.reportUri,
                    alertThreshold: newConfig.alertThreshold
                }
            }
        });
    }
    catch (error) {
        logger.error('Failed to update CSP policy', {
            error: error instanceof Error ? error.message : 'Unknown error',
            body: req.body,
            requestId: req.headers['x-request-id'] || ''
        });
        res.status(400).json({
            success: false,
            error: 'Failed to update CSP policy',
            code: 'CSP_POLICY_UPDATE_ERROR'
        });
    }
});
router.post('/sri-hashes', async (req, res) => {
    try {
        const resourcesSchema = z.object({
            resources: z.array(z.object({
                url: z.string().url(),
                content: z.string(),
                algorithm: z.enum(['sha256', 'sha384', 'sha512']).optional()
            }))
        });
        const { resources } = resourcesSchema.parse(req.body);
        const hashes = cspBankingService.generateSRIHashes(resources);
        res.json({
            success: true,
            data: {
                hashes
            }
        });
    }
    catch (error) {
        logger.error('Failed to generate SRI hashes', {
            error: error instanceof Error ? error.message : 'Unknown error',
            body: req.body,
            requestId: req.headers['x-request-id'] || ''
        });
        res.status(400).json({
            success: false,
            error: 'Failed to generate SRI hashes',
            code: 'SRI_HASH_GENERATION_ERROR'
        });
    }
});
router.post('/csp-reports/cleanup', async (req, res) => {
    try {
        const removedCount = cspBankingService.cleanupOldReports();
        logger.info('CSP/SRI reports cleanup completed', {
            removedCount,
            requestId: req.headers['x-request-id'] || ''
        });
        res.json({
            success: true,
            data: {
                removedCount,
                message: `Cleaned up ${removedCount} old reports`
            }
        });
    }
    catch (error) {
        logger.error('Failed to cleanup CSP/SRI reports', {
            error: error instanceof Error ? error.message : 'Unknown error',
            requestId: req.headers['x-request-id'] || ''
        });
        res.status(500).json({
            success: false,
            error: 'Failed to cleanup reports',
            code: 'CLEANUP_ERROR'
        });
    }
});
router.post('/csp-reports/reset', async (req, res) => {
    try {
        cspBankingService.reset();
        logger.info('CSP/SRI service reset', {
            requestId: req.headers['x-request-id'] || ''
        });
        res.json({
            success: true,
            message: 'CSP/SRI service reset successfully'
        });
    }
    catch (error) {
        logger.error('Failed to reset CSP/SRI service', {
            error: error instanceof Error ? error.message : 'Unknown error',
            requestId: req.headers['x-request-id'] || ''
        });
        res.status(500).json({
            success: false,
            error: 'Failed to reset service',
            code: 'RESET_ERROR'
        });
    }
});
export default router;
//# sourceMappingURL=csp-sri-banking.js.map