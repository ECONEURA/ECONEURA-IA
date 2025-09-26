import { Router } from 'express';
import { z } from 'zod';

import AutomatedTestingService from '../lib/automated-testing.service.js';
import { logger } from '../lib/logger.js';
const router = Router();
const defaultConfig = {
    testSuites: ['default-suite'],
    secretRotationInterval: 90,
    securityCheckInterval: 30,
    maxConcurrentTests: 5,
    timeoutMs: 30000,
    retryAttempts: 3,
    notificationChannels: ['email', 'slack']
};
const testingService = new AutomatedTestingService(defaultConfig);
const CreateTestSuiteSchema = z.object({
    name: z.string().min(1),
    description: z.string().min(1),
    tests: z.array(z.object({
        testName: z.string().min(1),
        message: z.string().optional(),
        details: z.record(z.any()).optional()
    }))
});
const CreateSecretRotationSchema = z.object({
    secretName: z.string().min(1),
    currentVersion: z.string().min(1),
    rotationDate: z.string().datetime().optional(),
    nextRotation: z.string().datetime().optional(),
    metadata: z.record(z.any()).optional()
});
const CreateSecurityChecklistSchema = z.object({
    name: z.string().min(1),
    category: z.enum(['SECRETS', 'AUTHENTICATION', 'AUTHORIZATION', 'ENCRYPTION', 'NETWORK', 'LOGGING']),
    description: z.string().min(1),
    remediation: z.string().optional(),
    severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
});
const UpdateConfigSchema = z.object({
    testSuites: z.array(z.string()).optional(),
    secretRotationInterval: z.number().min(1).optional(),
    securityCheckInterval: z.number().min(1).optional(),
    maxConcurrentTests: z.number().min(1).optional(),
    timeoutMs: z.number().min(1000).optional(),
    retryAttempts: z.number().min(1).optional(),
    notificationChannels: z.array(z.string()).optional()
});
router.get('/test-suites', async (req, res) => {
    try {
        const suites = await testingService.listTestSuites();
        res.json({
            success: true,
            data: suites,
            count: suites.length
        });
    }
    catch (error) {
        logger.error('Error listing test suites', { error });
        res.status(500).json({
            success: false,
            error: 'Failed to list test suites',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/test-suites/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const suite = await testingService.getTestSuite(id);
        if (!suite) {
            return res.status(404).json({
                success: false,
                error: 'Test suite not found'
            });
        }
        res.json({
            success: true,
            data: suite
        });
    }
    catch (error) {
        logger.error('Error getting test suite', { error });
        res.status(500).json({
            success: false,
            error: 'Failed to get test suite',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.post('/test-suites', async (req, res) => {
    try {
        const validatedData = CreateTestSuiteSchema.parse(req.body);
        const suite = await testingService.createTestSuite({
            name: validatedData.name,
            description: validatedData.description,
            tests: validatedData.tests.map(test => ({
                id: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                testName: test.testName,
                status: 'RUNNING',
                message: test.message || '',
                duration: 0,
                timestamp: new Date(),
                details: test.details
            })),
            status: 'RUNNING'
        });
        res.status(201).json({
            success: true,
            data: suite,
            message: 'Test suite created successfully'
        });
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                details: error.errors
            });
        }
        logger.error('Error creating test suite', { error });
        res.status(500).json({
            success: false,
            error: 'Failed to create test suite',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.put('/test-suites/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const updatedSuite = await testingService.updateTestSuite(id, updates);
        if (!updatedSuite) {
            return res.status(404).json({
                success: false,
                error: 'Test suite not found'
            });
        }
        res.json({
            success: true,
            data: updatedSuite,
            message: 'Test suite updated successfully'
        });
    }
    catch (error) {
        logger.error('Error updating test suite', { error });
        res.status(500).json({
            success: false,
            error: 'Failed to update test suite',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.delete('/test-suites/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await testingService.deleteTestSuite(id);
        if (!deleted) {
            return res.status(404).json({
                success: false,
                error: 'Test suite not found'
            });
        }
        res.json({
            success: true,
            message: 'Test suite deleted successfully'
        });
    }
    catch (error) {
        logger.error('Error deleting test suite', { error });
        res.status(500).json({
            success: false,
            error: 'Failed to delete test suite',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.post('/test-suites/:id/execute', async (req, res) => {
    try {
        const { id } = req.params;
        const execution = await testingService.executeTestSuite(id);
        res.json({
            success: true,
            data: execution,
            message: 'Test suite execution started'
        });
    }
    catch (error) {
        logger.error('Error executing test suite', { error });
        res.status(500).json({
            success: false,
            error: 'Failed to execute test suite',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/secret-rotations', async (req, res) => {
    try {
        const rotations = await testingService.listSecretRotations();
        res.json({
            success: true,
            data: rotations,
            count: rotations.length
        });
    }
    catch (error) {
        logger.error('Error listing secret rotations', { error });
        res.status(500).json({
            success: false,
            error: 'Failed to list secret rotations',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/secret-rotations/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const rotation = await testingService.getSecretRotation(id);
        if (!rotation) {
            return res.status(404).json({
                success: false,
                error: 'Secret rotation not found'
            });
        }
        res.json({
            success: true,
            data: rotation
        });
    }
    catch (error) {
        logger.error('Error getting secret rotation', { error });
        res.status(500).json({
            success: false,
            error: 'Failed to get secret rotation',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.post('/secret-rotations', async (req, res) => {
    try {
        const validatedData = CreateSecretRotationSchema.parse(req.body);
        const rotation = await testingService.createSecretRotation({
            secretName: validatedData.secretName,
            currentVersion: validatedData.currentVersion,
            rotationDate: validatedData.rotationDate ? new Date(validatedData.rotationDate) : new Date(),
            status: 'PENDING',
            nextRotation: validatedData.nextRotation ? new Date(validatedData.nextRotation) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            metadata: validatedData.metadata
        });
        res.status(201).json({
            success: true,
            data: rotation,
            message: 'Secret rotation created successfully'
        });
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                details: error.errors
            });
        }
        logger.error('Error creating secret rotation', { error });
        res.status(500).json({
            success: false,
            error: 'Failed to create secret rotation',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.post('/secret-rotations/:id/execute', async (req, res) => {
    try {
        const { id } = req.params;
        const rotation = await testingService.executeSecretRotation(id);
        res.json({
            success: true,
            data: rotation,
            message: 'Secret rotation executed successfully'
        });
    }
    catch (error) {
        logger.error('Error executing secret rotation', { error });
        res.status(500).json({
            success: false,
            error: 'Failed to execute secret rotation',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.post('/secret-rotations/schedule', async (req, res) => {
    try {
        const rotations = await testingService.scheduleSecretRotations();
        res.json({
            success: true,
            data: rotations,
            count: rotations.length,
            message: `Scheduled ${rotations.length} secret rotations`
        });
    }
    catch (error) {
        logger.error('Error scheduling secret rotations', { error });
        res.status(500).json({
            success: false,
            error: 'Failed to schedule secret rotations',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/security-checklist', async (req, res) => {
    try {
        const checklist = await testingService.listSecurityChecklist();
        res.json({
            success: true,
            data: checklist,
            count: checklist.length
        });
    }
    catch (error) {
        logger.error('Error listing security checklist', { error });
        res.status(500).json({
            success: false,
            error: 'Failed to list security checklist',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/security-checklist/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const checklist = await testingService.getSecurityChecklist(id);
        if (!checklist) {
            return res.status(404).json({
                success: false,
                error: 'Security checklist not found'
            });
        }
        res.json({
            success: true,
            data: checklist
        });
    }
    catch (error) {
        logger.error('Error getting security checklist', { error });
        res.status(500).json({
            success: false,
            error: 'Failed to get security checklist',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.post('/security-checklist', async (req, res) => {
    try {
        const validatedData = CreateSecurityChecklistSchema.parse(req.body);
        const checklist = await testingService.createSecurityChecklist({
            name: validatedData.name,
            category: validatedData.category,
            description: validatedData.description,
            remediation: validatedData.remediation,
            status: 'WARNING',
            lastChecked: new Date(),
            nextCheck: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            severity: validatedData.severity
        });
        res.status(201).json({
            success: true,
            data: checklist,
            message: 'Security checklist created successfully'
        });
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                details: error.errors
            });
        }
        logger.error('Error creating security checklist', { error });
        res.status(500).json({
            success: false,
            error: 'Failed to create security checklist',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.post('/security-checklist/:id/execute', async (req, res) => {
    try {
        const { id } = req.params;
        const checklist = await testingService.executeSecurityCheck(id);
        res.json({
            success: true,
            data: checklist,
            message: 'Security check executed successfully'
        });
    }
    catch (error) {
        logger.error('Error executing security check', { error });
        res.status(500).json({
            success: false,
            error: 'Failed to execute security check',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.post('/security-checklist/quarterly-audit', async (req, res) => {
    try {
        const results = await testingService.executeQuarterlySecurityAudit();
        res.json({
            success: true,
            data: results,
            count: results.length,
            message: 'Quarterly security audit completed'
        });
    }
    catch (error) {
        logger.error('Error executing quarterly security audit', { error });
        res.status(500).json({
            success: false,
            error: 'Failed to execute quarterly security audit',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/statistics', async (req, res) => {
    try {
        const statistics = await testingService.getTestingStatistics();
        res.json({
            success: true,
            data: statistics
        });
    }
    catch (error) {
        logger.error('Error getting testing statistics', { error });
        res.status(500).json({
            success: false,
            error: 'Failed to get testing statistics',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/reports/:period', async (req, res) => {
    try {
        const { period } = req.params;
        if (!['daily', 'weekly', 'monthly', 'quarterly'].includes(period)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid period. Must be: daily, weekly, monthly, or quarterly'
            });
        }
        const report = await testingService.generateTestingReport(period);
        res.json({
            success: true,
            data: report
        });
    }
    catch (error) {
        logger.error('Error generating testing report', { error, period: req.params.period });
        res.status(500).json({
            success: false,
            error: 'Failed to generate testing report',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/config', async (req, res) => {
    try {
        res.json({
            success: true,
            data: defaultConfig
        });
    }
    catch (error) {
        logger.error('Error getting configuration', { error });
        res.status(500).json({
            success: false,
            error: 'Failed to get configuration',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.put('/config', async (req, res) => {
    try {
        const validatedData = UpdateConfigSchema.parse(req.body);
        Object.assign(defaultConfig, validatedData);
        res.json({
            success: true,
            data: defaultConfig,
            message: 'Configuration updated successfully'
        });
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                details: error.errors
            });
        }
        logger.error('Error updating configuration', { error });
        res.status(500).json({
            success: false,
            error: 'Failed to update configuration',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/health', async (req, res) => {
    try {
        const statistics = await testingService.getTestingStatistics();
        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            services: {
                testSuites: statistics.totalTestSuites > 0 ? 'operational' : 'no_suites',
                secretRotations: 'operational',
                securityChecks: 'operational'
            },
            statistics: {
                totalTestSuites: statistics.totalTestSuites,
                successRate: statistics.successRate,
                lastExecution: statistics.lastExecution
            }
        };
        res.json({
            success: true,
            data: health
        });
    }
    catch (error) {
        logger.error('Error checking health', { error });
        res.status(500).json({
            success: false,
            error: 'Health check failed',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
export default router;
//# sourceMappingURL=automated-testing.js.map