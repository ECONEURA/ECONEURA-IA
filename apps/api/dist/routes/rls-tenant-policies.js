import { Router } from 'express';

import { tenantRLSPoliciesService } from '../services/rls-tenant-policies.service.js';
import { structuredLogger } from '../lib/structured-logger.js';
const router = Router();
router.get('/policies/:tenantId', async (req, res) => {
    try {
        const { tenantId } = req.params;
        const { tableName, operation, isActive, enforceTenantIsolation, limit } = req.query;
        const filters = {
            tableName: tableName,
            operation: operation,
            isActive: isActive ? isActive === 'true' : undefined,
            enforceTenantIsolation: enforceTenantIsolation ? enforceTenantIsolation === 'true' : undefined,
            limit: limit ? parseInt(limit) : undefined
        };
        const policies = await tenantRLSPoliciesService.getTenantPolicies(tenantId, filters);
        res.json({
            success: true,
            data: policies,
            count: policies.length,
            filters: {
                tenantId,
                ...filters
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Failed to get tenant policies', {
            error: error.message,
            tenantId: req.params.tenantId,
            path: req.path
        });
        res.status(500).json({
            success: false,
            error: 'Failed to get tenant policies',
            message: error.message
        });
    }
});
router.post('/policies', async (req, res) => {
    try {
        const policyData = req.body;
        if (!policyData.tenantId || !policyData.tableName || !policyData.policyName) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields',
                message: 'tenantId, tableName, and policyName are required'
            });
        }
        const policy = await tenantRLSPoliciesService.createTenantPolicy(policyData);
        structuredLogger.info('Tenant RLS policy created', {
            policyId: policy.id,
            tenantId: policy.tenantId,
            tableName: policy.tableName,
            policyName: policy.policyName
        });
        res.status(201).json({
            success: true,
            data: policy,
            message: 'Tenant RLS policy created successfully'
        });
    }
    catch (error) {
        structuredLogger.error('Failed to create tenant policy', {
            error: error.message,
            body: req.body
        });
        res.status(500).json({
            success: false,
            error: 'Failed to create tenant policy',
            message: error.message
        });
    }
});
router.get('/policies/:tenantId/:policyId', async (req, res) => {
    try {
        const { tenantId, policyId } = req.params;
        const policies = await tenantRLSPoliciesService.getTenantPolicies(tenantId);
        const policy = policies.find(p => p.id === policyId);
        if (!policy) {
            return res.status(404).json({
                success: false,
                error: 'Policy not found',
                message: `Policy ${policyId} not found for tenant ${tenantId}`
            });
        }
        res.json({
            success: true,
            data: policy,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Failed to get tenant policy', {
            error: error.message,
            tenantId: req.params.tenantId,
            policyId: req.params.policyId
        });
        res.status(500).json({
            success: false,
            error: 'Failed to get tenant policy',
            message: error.message
        });
    }
});
router.get('/rules/:tenantId', async (req, res) => {
    try {
        const { tenantId } = req.params;
        const { isActive, role, tenantScope, limit } = req.query;
        const filters = {
            isActive: isActive ? isActive === 'true' : undefined,
            role: role,
            tenantScope: tenantScope,
            limit: limit ? parseInt(limit) : undefined
        };
        const rules = await tenantRLSPoliciesService.getTenantRules(tenantId, filters);
        res.json({
            success: true,
            data: rules,
            count: rules.length,
            filters: {
                tenantId,
                ...filters
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Failed to get tenant rules', {
            error: error.message,
            tenantId: req.params.tenantId,
            path: req.path
        });
        res.status(500).json({
            success: false,
            error: 'Failed to get tenant rules',
            message: error.message
        });
    }
});
router.post('/rules', async (req, res) => {
    try {
        const ruleData = req.body;
        if (!ruleData.tenantId || !ruleData.ruleName) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields',
                message: 'tenantId and ruleName are required'
            });
        }
        const rule = await tenantRLSPoliciesService.createTenantRule(ruleData);
        structuredLogger.info('Tenant RLS rule created', {
            ruleId: rule.id,
            tenantId: rule.tenantId,
            ruleName: rule.ruleName
        });
        res.status(201).json({
            success: true,
            data: rule,
            message: 'Tenant RLS rule created successfully'
        });
    }
    catch (error) {
        structuredLogger.error('Failed to create tenant rule', {
            error: error.message,
            body: req.body
        });
        res.status(500).json({
            success: false,
            error: 'Failed to create tenant rule',
            message: error.message
        });
    }
});
router.post('/evaluate-access', async (req, res) => {
    try {
        const { context, operation } = req.body;
        if (!context || !operation) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields',
                message: 'context and operation are required'
            });
        }
        if (!context.tenantId || !context.userId || !operation.type || !operation.tableName) {
            return res.status(400).json({
                success: false,
                error: 'Missing required context or operation fields',
                message: 'tenantId, userId, operation.type, and operation.tableName are required'
            });
        }
        const result = await tenantRLSPoliciesService.evaluateTenantAccess(context, operation);
        await tenantRLSPoliciesService.logTenantAccess({
            organizationId: context.organizationId || 'default',
            tenantId: context.tenantId,
            userId: context.userId,
            sessionId: context.sessionId || 'unknown',
            operation: {
                type: operation.type,
                tableName: operation.tableName,
                recordId: operation.recordId,
                columns: operation.columns,
                tenantId: operation.targetTenantId
            },
            securityContext: {
                ipAddress: context.ipAddress || req.ip || 'unknown',
                userAgent: context.userAgent || req.headers['user-agent'] || 'unknown',
                role: context.role || 'user',
                permissions: context.permissions || [],
                policiesApplied: result.policiesApplied,
                rulesEvaluated: result.rulesEvaluated,
                tenantIsolation: result.tenantIsolationEnforced
            },
            result: {
                allowed: result.allowed,
                reason: result.reason,
                dataReturned: result.allowed ? 1 : 0,
                executionTime: result.executionTime,
                policiesMatched: result.policiesApplied.length,
                rulesMatched: result.rulesEvaluated.length,
                tenantIsolationEnforced: result.tenantIsolationEnforced
            },
            requestId: req.headers['x-request-id']
        });
        res.json({
            success: true,
            data: result,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Failed to evaluate tenant access', {
            error: error.message,
            body: req.body
        });
        res.status(500).json({
            success: false,
            error: 'Failed to evaluate tenant access',
            message: error.message
        });
    }
});
router.post('/contexts', async (req, res) => {
    try {
        const contextData = req.body;
        if (!contextData.tenantId || !contextData.userId || !contextData.organizationId) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields',
                message: 'tenantId, userId, and organizationId are required'
            });
        }
        const context = await tenantRLSPoliciesService.createTenantContext(contextData);
        structuredLogger.info('Tenant RLS context created', {
            sessionId: context.sessionId,
            tenantId: context.tenantId,
            userId: context.userId,
            organizationId: context.organizationId
        });
        res.status(201).json({
            success: true,
            data: context,
            message: 'Tenant RLS context created successfully'
        });
    }
    catch (error) {
        structuredLogger.error('Failed to create tenant context', {
            error: error.message,
            body: req.body
        });
        res.status(500).json({
            success: false,
            error: 'Failed to create tenant context',
            message: error.message
        });
    }
});
router.get('/contexts/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const context = await tenantRLSPoliciesService.getTenantContext(sessionId);
        if (!context) {
            return res.status(404).json({
                success: false,
                error: 'Context not found',
                message: `Context for session ${sessionId} not found`
            });
        }
        res.json({
            success: true,
            data: context,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Failed to get tenant context', {
            error: error.message,
            sessionId: req.params.sessionId
        });
        res.status(500).json({
            success: false,
            error: 'Failed to get tenant context',
            message: error.message
        });
    }
});
router.get('/stats/:tenantId', async (req, res) => {
    try {
        const { tenantId } = req.params;
        const stats = await tenantRLSPoliciesService.getTenantStats(tenantId);
        res.json({
            success: true,
            data: stats,
            tenantId,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Failed to get tenant stats', {
            error: error.message,
            tenantId: req.params.tenantId
        });
        res.status(500).json({
            success: false,
            error: 'Failed to get tenant stats',
            message: error.message
        });
    }
});
router.post('/generate-policy', async (req, res) => {
    try {
        const { tenantId, tableName, requirements } = req.body;
        if (!tenantId || !tableName || !requirements) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields',
                message: 'tenantId, tableName, and requirements are required'
            });
        }
        if (!requirements.accessLevel || !requirements.operations || !requirements.roles) {
            return res.status(400).json({
                success: false,
                error: 'Missing required requirements fields',
                message: 'accessLevel, operations, and roles are required in requirements'
            });
        }
        const policy = await tenantRLSPoliciesService.generateTenantPolicy(tenantId, tableName, requirements);
        structuredLogger.info('Tenant RLS policy generated', {
            policyId: policy.id,
            tenantId: policy.tenantId,
            tableName: policy.tableName,
            accessLevel: requirements.accessLevel
        });
        res.status(201).json({
            success: true,
            data: policy,
            message: 'Tenant RLS policy generated successfully'
        });
    }
    catch (error) {
        structuredLogger.error('Failed to generate tenant policy', {
            error: error.message,
            body: req.body
        });
        res.status(500).json({
            success: false,
            error: 'Failed to generate tenant policy',
            message: error.message
        });
    }
});
router.get('/health', async (req, res) => {
    try {
        const health = {
            status: 'healthy',
            service: 'RLS Tenant Policies',
            version: '1.0.0',
            timestamp: new Date().toISOString(),
            features: [
                'Tenant isolation policies',
                'Cross-tenant access control',
                'Role-based access rules',
                'Automatic policy generation',
                'Compliance tracking',
                'Audit logging'
            ],
            capabilities: {
                tenantIsolation: true,
                crossTenantAccess: true,
                roleBasedAccess: true,
                timeRestrictions: true,
                ipRestrictions: true,
                complianceTracking: true,
                auditLogging: true,
                autoPolicyGeneration: true
            }
        };
        res.json({
            success: true,
            data: health
        });
    }
    catch (error) {
        structuredLogger.error('Health check failed', {
            error: error.message
        });
        res.status(500).json({
            success: false,
            error: 'Health check failed',
            message: error.message
        });
    }
});
export default router;
//# sourceMappingURL=rls-tenant-policies.js.map