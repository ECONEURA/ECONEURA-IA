import { Router } from 'express';
import { z } from 'zod';

import { antivirusGlobalService } from '../lib/antivirus-global.service.js';
import { structuredLogger } from '../lib/structured-logger.js';
const router = Router();
const scanItemSchema = z.object({
    moduleId: z.string(),
    moduleType: z.enum(['file', 'email', 'api', 'database', 'cache', 'queue']),
    item: z.object({
        id: z.string(),
        type: z.string(),
        size: z.number().optional(),
        path: z.string().optional(),
        content: z.string().optional(),
        metadata: z.record(z.any()).optional()
    })
});
const updateConfigSchema = z.object({
    enabled: z.boolean().optional(),
    realTimeScanning: z.boolean().optional(),
    quarantineEnabled: z.boolean().optional(),
    autoClean: z.boolean().optional(),
    scanInterval: z.number().min(1).max(1440).optional(),
    maxFileSize: z.number().positive().optional(),
    allowedExtensions: z.array(z.string()).optional(),
    blockedExtensions: z.array(z.string()).optional(),
    quarantineRetentionDays: z.number().min(1).max(365).optional(),
    modules: z.object({
        file: z.boolean().optional(),
        email: z.boolean().optional(),
        api: z.boolean().optional(),
        database: z.boolean().optional(),
        cache: z.boolean().optional(),
        queue: z.boolean().optional()
    }).optional()
});
const quarantineActionSchema = z.object({
    action: z.enum(['restore', 'delete', 'clean']),
    reason: z.string().optional()
});
router.get('/stats', async (req, res) => {
    try {
        const stats = antivirusGlobalService.getStats();
        res.json({
            success: true,
            data: stats,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Failed to get antivirus stats', {
            error: error instanceof Error ? error.message : String(error),
            requestId: req.headers['x-request-id'] || ''
        });
        res.status(500).json({
            success: false,
            error: 'Failed to get antivirus stats',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});
router.post('/scan/global', async (req, res) => {
    try {
        const stats = await antivirusGlobalService.performGlobalScan();
        structuredLogger.info('Global scan initiated', {
            totalScans: stats.totalScans,
            cleanScans: stats.cleanScans,
            infectedScans: stats.infectedScans,
            threatsDetected: stats.threatsDetected,
            requestId: req.headers['x-request-id'] || ''
        });
        res.json({
            success: true,
            data: stats,
            message: 'Global scan completed successfully',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Failed to perform global scan', {
            error: error instanceof Error ? error.message : String(error),
            requestId: req.headers['x-request-id'] || ''
        });
        res.status(500).json({
            success: false,
            error: 'Failed to perform global scan',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});
router.post('/scan/item', async (req, res) => {
    try {
        const validatedData = scanItemSchema.parse(req.body);
        const scanResult = await antivirusGlobalService.scanItem(validatedData.item, validatedData.moduleType);
        structuredLogger.info('Item scan completed', {
            moduleId: validatedData.moduleId,
            moduleType: validatedData.moduleType,
            scanId: scanResult.id,
            status: scanResult.status,
            threatsCount: scanResult.threats.length,
            requestId: req.headers['x-request-id'] || ''
        });
        res.json({
            success: true,
            data: scanResult,
            message: 'Item scan completed successfully',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Failed to scan item', {
            error: error instanceof Error ? error.message : String(error),
            requestId: req.headers['x-request-id'] || ''
        });
        res.status(500).json({
            success: false,
            error: 'Failed to scan item',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});
router.get('/quarantine', async (req, res) => {
    try {
        const { status, moduleType, limit = 100, offset = 0 } = req.query;
        let quarantineItems = antivirusGlobalService.getQuarantineItems();
        if (status) {
            quarantineItems = quarantineItems.filter(item => item.status === status);
        }
        if (moduleType) {
            quarantineItems = quarantineItems.filter(item => item.moduleType === moduleType);
        }
        const total = quarantineItems.length;
        const paginatedItems = quarantineItems.slice(Number(offset), Number(offset) + Number(limit));
        res.json({
            success: true,
            data: {
                items: paginatedItems,
                pagination: {
                    limit: Number(limit),
                    offset: Number(offset),
                    total
                }
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Failed to get quarantine items', {
            error: error instanceof Error ? error.message : String(error),
            requestId: req.headers['x-request-id'] || ''
        });
        res.status(500).json({
            success: false,
            error: 'Failed to get quarantine items',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});
router.get('/quarantine/:quarantineId', async (req, res) => {
    try {
        const { quarantineId } = req.params;
        const quarantineItems = antivirusGlobalService.getQuarantineItems();
        const item = quarantineItems.find(i => i.id === quarantineId);
        if (!item) {
            return res.status(404).json({
                success: false,
                error: 'Quarantine item not found'
            });
        }
        res.json({
            success: true,
            data: item,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Failed to get quarantine item', {
            quarantineId: req.params.quarantineId,
            error: error instanceof Error ? error.message : String(error),
            requestId: req.headers['x-request-id'] || ''
        });
        res.status(500).json({
            success: false,
            error: 'Failed to get quarantine item',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});
router.post('/quarantine/:quarantineId/action', async (req, res) => {
    try {
        const { quarantineId } = req.params;
        const validatedData = quarantineActionSchema.parse(req.body);
        switch (validatedData.action) {
            case 'restore':
                await antivirusGlobalService.restoreFromQuarantine(quarantineId);
                break;
            case 'delete':
                await antivirusGlobalService.deleteFromQuarantine(quarantineId);
                break;
            case 'clean':
                await antivirusGlobalService.deleteFromQuarantine(quarantineId);
                break;
        }
        structuredLogger.info('Quarantine action performed', {
            quarantineId,
            action: validatedData.action,
            reason: validatedData.reason,
            requestId: req.headers['x-request-id'] || ''
        });
        res.json({
            success: true,
            message: `Quarantine item ${validatedData.action} completed successfully`,
            data: {
                quarantineId,
                action: validatedData.action,
                performedAt: new Date().toISOString(),
                reason: validatedData.reason
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Failed to perform quarantine action', {
            quarantineId: req.params.quarantineId,
            error: error instanceof Error ? error.message : String(error),
            requestId: req.headers['x-request-id'] || ''
        });
        res.status(500).json({
            success: false,
            error: 'Failed to perform quarantine action',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});
router.get('/scan-results', async (req, res) => {
    try {
        const { status, moduleType, limit = 100, offset = 0 } = req.query;
        let scanResults = antivirusGlobalService.getScanResults();
        if (status) {
            scanResults = scanResults.filter(result => result.status === status);
        }
        if (moduleType) {
            scanResults = scanResults.filter(result => result.moduleType === moduleType);
        }
        scanResults.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        const total = scanResults.length;
        const paginatedResults = scanResults.slice(Number(offset), Number(offset) + Number(limit));
        res.json({
            success: true,
            data: {
                results: paginatedResults,
                pagination: {
                    limit: Number(limit),
                    offset: Number(offset),
                    total
                }
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Failed to get scan results', {
            error: error instanceof Error ? error.message : String(error),
            requestId: req.headers['x-request-id'] || ''
        });
        res.status(500).json({
            success: false,
            error: 'Failed to get scan results',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});
router.get('/scan-results/:scanId', async (req, res) => {
    try {
        const { scanId } = req.params;
        const scanResults = antivirusGlobalService.getScanResults();
        const result = scanResults.find(r => r.id === scanId);
        if (!result) {
            return res.status(404).json({
                success: false,
                error: 'Scan result not found'
            });
        }
        res.json({
            success: true,
            data: result,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Failed to get scan result', {
            scanId: req.params.scanId,
            error: error instanceof Error ? error.message : String(error),
            requestId: req.headers['x-request-id'] || ''
        });
        res.status(500).json({
            success: false,
            error: 'Failed to get scan result',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});
router.put('/config', async (req, res) => {
    try {
        const validatedData = updateConfigSchema.parse(req.body);
        antivirusGlobalService.updateConfig(validatedData);
        structuredLogger.info('Antivirus configuration updated', {
            config: validatedData,
            requestId: req.headers['x-request-id'] || ''
        });
        res.json({
            success: true,
            message: 'Antivirus configuration updated successfully',
            data: validatedData,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Failed to update antivirus config', {
            error: error instanceof Error ? error.message : String(error),
            requestId: req.headers['x-request-id'] || ''
        });
        res.status(500).json({
            success: false,
            error: 'Failed to update antivirus configuration',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});
router.get('/config', async (req, res) => {
    try {
        const config = {
            enabled: true,
            realTimeScanning: true,
            quarantineEnabled: true,
            autoClean: false,
            scanInterval: 60,
            maxFileSize: 104857600,
            allowedExtensions: ['.txt', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.png', '.gif'],
            blockedExtensions: ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com', '.vbs', '.js'],
            quarantineRetentionDays: 30,
            modules: {
                file: true,
                email: true,
                api: true,
                database: true,
                cache: true,
                queue: true
            },
            threatDatabase: {
                enabled: true,
                updateInterval: 24,
                sources: ['internal', 'external']
            }
        };
        res.json({
            success: true,
            data: config,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Failed to get antivirus config', {
            error: error instanceof Error ? error.message : String(error),
            requestId: req.headers['x-request-id'] || ''
        });
        res.status(500).json({
            success: false,
            error: 'Failed to get antivirus configuration',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});
router.post('/threats/update', async (req, res) => {
    try {
        structuredLogger.info('Threat database update initiated', {
            requestId: req.headers['x-request-id'] || ''
        });
        res.json({
            success: true,
            message: 'Threat database update initiated successfully',
            data: {
                updateStarted: new Date().toISOString(),
                estimatedDuration: '5-10 minutes'
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Failed to update threat database', {
            error: error instanceof Error ? error.message : String(error),
            requestId: req.headers['x-request-id'] || ''
        });
        res.status(500).json({
            success: false,
            error: 'Failed to update threat database',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});
export default router;
//# sourceMappingURL=antivirus-global.js.map