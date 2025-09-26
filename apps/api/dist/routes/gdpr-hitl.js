import { Router } from 'express';
import { z } from 'zod';

import { gdprHITLService } from '../services/gdpr-hitl.service.js';
import { gdprConsolidated } from '../lib/gdpr-consolidated.service.js';
import { structuredLogger } from '../lib/structured-logger.js';
const router = Router();
const CreateGDPRHITLRequestSchema = z.object({
    gdprRequestId: z.string().min(1),
    type: z.enum(['export_approval', 'erase_approval', 'data_review', 'legal_hold_review']),
    organizationId: z.string().uuid(),
    assignedBy: z.string().uuid(),
    options: z.object({
        priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
        assignedTo: z.string().uuid().optional(),
        dueDate: z.string().datetime().optional(),
        slaHours: z.number().positive().optional(),
        metadata: z.record(z.any()).optional()
    }).optional()
});
const MakeDecisionSchema = z.object({
    decision: z.enum(['approved', 'rejected', 'conditional_approval', 'escalated']),
    decisionBy: z.string().uuid(),
    reasoning: z.string().min(10),
    options: z.object({
        conditions: z.array(z.string()).optional(),
        riskMitigation: z.array(z.string()).optional(),
        legalBasis: z.string().optional(),
        complianceNotes: z.string().optional(),
        attachments: z.array(z.string()).optional(),
        requiresFollowUp: z.boolean().optional(),
        followUpDate: z.string().datetime().optional(),
        metadata: z.record(z.any()).optional()
    }).optional()
});
const CreateWorkflowSchema = z.object({
    name: z.string().min(1),
    description: z.string().min(1),
    type: z.enum(['export', 'erase', 'data_review']),
    steps: z.array(z.object({
        name: z.string().min(1),
        type: z.enum(['data_review', 'legal_review', 'technical_review', 'business_approval', 'final_approval']),
        assignedRole: z.string().min(1),
        isRequired: z.boolean(),
        order: z.number().positive(),
        criteria: z.array(z.string()),
        autoApprovalConditions: z.array(z.string()).optional(),
        escalationConditions: z.array(z.string()).optional(),
        slaHours: z.number().positive()
    })),
    autoApprovalThreshold: z.number().min(0).max(1),
    escalationRules: z.array(z.object({
        condition: z.string().min(1),
        escalationLevel: z.number().positive(),
        assignedRole: z.string().min(1),
        slaHours: z.number().positive(),
        notificationChannels: z.array(z.string())
    })),
    slaHours: z.number().positive(),
    isActive: z.boolean()
});
router.post('/requests', async (req, res) => {
    try {
        const validatedData = CreateGDPRHITLRequestSchema.parse(req.body);
        const hitlRequest = await gdprHITLService.createGDPRHITLRequest(validatedData.gdprRequestId, validatedData.type, validatedData.organizationId, validatedData.assignedBy, validatedData.options);
        structuredLogger.info('GDPR HITL request created', {
            hitlRequestId: hitlRequest.id,
            gdprRequestId: validatedData.gdprRequestId,
            type: validatedData.type,
            organizationId: validatedData.organizationId,
            assignedBy: validatedData.assignedBy
        });
        res.status(201).json({
            success: true,
            data: hitlRequest,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            structuredLogger.warn('Invalid GDPR HITL request creation', { errors: error.errors });
            return res.status(400).json({
                success: false,
                error: 'Invalid request data',
                details: error.errors
            });
        }
        structuredLogger.error('Failed to create GDPR HITL request', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create GDPR HITL request',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/requests/:requestId', async (req, res) => {
    try {
        const { requestId } = req.params;
        const hitlRequest = await gdprHITLService.getGDPRHITLRequest(requestId);
        if (!hitlRequest) {
            return res.status(404).json({
                success: false,
                error: 'GDPR HITL request not found'
            });
        }
        structuredLogger.info('GDPR HITL request retrieved', { requestId });
        res.json({
            success: true,
            data: hitlRequest,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Failed to get GDPR HITL request', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get GDPR HITL request',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/requests', async (req, res) => {
    try {
        const { organizationId, type, status, priority, riskLevel, assignedTo } = req.query;
        if (!organizationId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID is required'
            });
        }
        const filters = {
            type: type,
            status: status,
            priority: priority,
            riskLevel: riskLevel,
            assignedTo: assignedTo
        };
        const hitlRequests = await gdprHITLService.getGDPRHITLRequests(organizationId, Object.keys(filters).length > 0 ? filters : undefined);
        structuredLogger.info('GDPR HITL requests retrieved', {
            count: hitlRequests.length,
            organizationId,
            filters: { type, status, priority, riskLevel, assignedTo }
        });
        res.json({
            success: true,
            data: hitlRequests,
            count: hitlRequests.length,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Failed to get GDPR HITL requests', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get GDPR HITL requests',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.post('/requests/:requestId/decisions', async (req, res) => {
    try {
        const { requestId } = req.params;
        const validatedData = MakeDecisionSchema.parse(req.body);
        const decision = await gdprHITLService.makeDecision(requestId, validatedData.decision, validatedData.decisionBy, validatedData.reasoning, validatedData.options);
        structuredLogger.info('GDPR HITL decision made', {
            requestId,
            decisionId: decision.id,
            decision: validatedData.decision,
            decisionBy: validatedData.decisionBy
        });
        res.status(201).json({
            success: true,
            data: decision,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            structuredLogger.warn('Invalid GDPR HITL decision', { errors: error.errors });
            return res.status(400).json({
                success: false,
                error: 'Invalid request data',
                details: error.errors
            });
        }
        structuredLogger.error('Failed to make GDPR HITL decision', error);
        res.status(500).json({
            success: false,
            error: 'Failed to make GDPR HITL decision',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/requests/:requestId/decisions', async (req, res) => {
    try {
        const { requestId } = req.params;
        const decisions = await gdprHITLService.getDecisions(requestId);
        structuredLogger.info('GDPR HITL decisions retrieved', {
            requestId,
            count: decisions.length
        });
        res.json({
            success: true,
            data: decisions,
            count: decisions.length,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Failed to get GDPR HITL decisions', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get GDPR HITL decisions',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.post('/workflows', async (req, res) => {
    try {
        const validatedData = CreateWorkflowSchema.parse(req.body);
        const workflow = await gdprHITLService.createWorkflow(validatedData);
        structuredLogger.info('GDPR HITL workflow created', {
            workflowId: workflow.id,
            name: workflow.name,
            type: workflow.type,
            steps: workflow.steps.length
        });
        res.status(201).json({
            success: true,
            data: workflow,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            structuredLogger.warn('Invalid GDPR HITL workflow creation', { errors: error.errors });
            return res.status(400).json({
                success: false,
                error: 'Invalid request data',
                details: error.errors
            });
        }
        structuredLogger.error('Failed to create GDPR HITL workflow', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create GDPR HITL workflow',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/workflows/:workflowId', async (req, res) => {
    try {
        const { workflowId } = req.params;
        const workflow = await gdprHITLService.getWorkflow(workflowId);
        if (!workflow) {
            return res.status(404).json({
                success: false,
                error: 'GDPR HITL workflow not found'
            });
        }
        structuredLogger.info('GDPR HITL workflow retrieved', { workflowId });
        res.json({
            success: true,
            data: workflow,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Failed to get GDPR HITL workflow', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get GDPR HITL workflow',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/workflows', async (req, res) => {
    try {
        const { type } = req.query;
        const workflows = await gdprHITLService.getWorkflows(type);
        structuredLogger.info('GDPR HITL workflows retrieved', {
            count: workflows.length,
            type
        });
        res.json({
            success: true,
            data: workflows,
            count: workflows.length,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Failed to get GDPR HITL workflows', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get GDPR HITL workflows',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/stats/:organizationId', async (req, res) => {
    try {
        const { organizationId } = req.params;
        const stats = await gdprHITLService.getStats(organizationId);
        structuredLogger.info('GDPR HITL stats retrieved', { organizationId });
        res.json({
            success: true,
            data: stats,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Failed to get GDPR HITL stats', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get GDPR HITL stats',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.post('/gdpr-requests-with-hitl', async (req, res) => {
    try {
        const { gdprRequest, hitlConfig } = req.body;
        const gdprRequestData = {
            userId: gdprRequest.userId,
            type: gdprRequest.type,
            requestedBy: gdprRequest.requestedBy,
            dataCategories: gdprRequest.dataCategories,
            options: gdprRequest.options
        };
        const createdGDPRRequest = await gdprConsolidated.createGDPRRequest(gdprRequestData.userId, gdprRequestData.type, gdprRequestData.requestedBy, gdprRequestData.dataCategories, gdprRequestData.options);
        const requiresHITL = hitlConfig?.forceHITL ||
            gdprRequestData.dataCategories.includes('financial_data') ||
            gdprRequestData.dataCategories.includes('sepa_transactions') ||
            gdprRequestData.type === 'erase';
        let hitlRequest = null;
        if (requiresHITL) {
            const hitlType = gdprRequestData.type === 'export' ? 'export_approval' : 'erase_approval';
            hitlRequest = await gdprHITLService.createGDPRHITLRequest(createdGDPRRequest.id, hitlType, hitlConfig.organizationId, gdprRequestData.requestedBy, {
                priority: hitlConfig.priority,
                assignedTo: hitlConfig.assignedTo,
                dueDate: hitlConfig.dueDate,
                slaHours: hitlConfig.slaHours,
                metadata: hitlConfig.metadata
            });
        }
        structuredLogger.info('GDPR request with HITL created', {
            gdprRequestId: createdGDPRRequest.id,
            hitlRequestId: hitlRequest?.id,
            requiresHITL,
            type: gdprRequestData.type
        });
        res.status(201).json({
            success: true,
            data: {
                gdprRequest: createdGDPRRequest,
                hitlRequest,
                requiresHITL
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Failed to create GDPR request with HITL', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create GDPR request with HITL',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/gdpr-requests-with-hitl/:gdprRequestId', async (req, res) => {
    try {
        const { gdprRequestId } = req.params;
        const gdprRequest = await gdprConsolidated.getGDPRRequest(gdprRequestId);
        if (!gdprRequest) {
            return res.status(404).json({
                success: false,
                error: 'GDPR request not found'
            });
        }
        const hitlRequests = await gdprHITLService.getGDPRHITLRequests('', {});
        const relatedHITLRequests = hitlRequests.filter(req => req.gdprRequestId === gdprRequestId);
        structuredLogger.info('GDPR request with HITL retrieved', {
            gdprRequestId,
            hitlRequestsCount: relatedHITLRequests.length
        });
        res.json({
            success: true,
            data: {
                gdprRequest,
                hitlRequests: relatedHITLRequests,
                hasHITL: relatedHITLRequests.length > 0
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Failed to get GDPR request with HITL', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get GDPR request with HITL',
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
                gdprHITLRequests: 'operational',
                decisionManagement: 'operational',
                workflowManagement: 'operational',
                statistics: 'operational',
                gdprIntegration: 'operational'
            },
            uptime: process.uptime(),
            stats: {
                totalHITLRequests: 0,
                pendingRequests: 0,
                completedRequests: 0
            }
        };
        structuredLogger.info('GDPR HITL service health check', health);
        res.json(health);
    }
    catch (error) {
        structuredLogger.error('GDPR HITL service health check failed', error);
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
export default router;
//# sourceMappingURL=gdpr-hitl.js.map