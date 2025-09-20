import { Router } from 'express';
import { z } from 'zod';
import { rlsGenerativaService } from '../lib/rls-generativa.service.js';
import { structuredLogger } from '../lib/structured-logger.js';
const rlsGenerativaRouter = Router();
const CreateRLSContextSchema = z.object({
    userId: z.string().min(1),
    organizationId: z.string().min(1),
    role: z.string().min(1),
    permissions: z.array(z.string()),
    sessionId: z.string().min(1),
    ipAddress: z.string().ip(),
    userAgent: z.string().min(1)
});
const GetRLSPoliciesSchema = z.object({
    organizationId: z.string().min(1),
    tableName: z.string().optional(),
    operation: z.enum(['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'ALL']).optional(),
    isActive: z.coerce.boolean().optional(),
    limit: z.coerce.number().int().positive().max(100).default(50).optional(),
});
const CreateRLSPolicySchema = z.object({
    organizationId: z.string().min(1),
    tableName: z.string().min(1),
    policyName: z.string().min(1),
    description: z.string().optional(),
    configuration: z.object({
        operation: z.enum(['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'ALL']),
        isActive: z.boolean(),
        priority: z.coerce.number().int().min(1).max(10),
        bypassRLS: z.boolean()
    }),
    conditions: z.object({
        type: z.enum(['simple', 'complex', 'function', 'template']),
        expression: z.string().min(1),
        parameters: z.record(z.any()).optional(),
        dependencies: z.array(z.string()).optional()
    }),
    accessRules: z.object({
        roles: z.array(z.string()),
        users: z.array(z.string()).optional(),
        groups: z.array(z.string()).optional(),
        timeRestrictions: z.object({
            startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
            endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
            daysOfWeek: z.array(z.coerce.number().int().min(0).max(6)).optional(),
            timezone: z.string().optional()
        }).optional(),
        ipRestrictions: z.object({
            allowedIPs: z.array(z.string().ip()).optional(),
            blockedIPs: z.array(z.string().ip()).optional(),
            allowedRanges: z.array(z.string()).optional()
        }).optional()
    }),
    metadata: z.object({
        createdBy: z.string().min(1),
        lastModifiedBy: z.string().min(1),
        version: z.coerce.number().int().positive(),
        tags: z.array(z.string()).optional(),
        documentation: z.string().optional()
    })
});
const GetRLSRulesSchema = z.object({
    organizationId: z.string().min(1),
    isActive: z.coerce.boolean().optional(),
    role: z.string().optional(),
    limit: z.coerce.number().int().positive().max(100).default(50).optional(),
});
const CreateRLSRuleSchema = z.object({
    organizationId: z.string().min(1),
    ruleName: z.string().min(1),
    description: z.string().optional(),
    configuration: z.object({
        isActive: z.boolean(),
        priority: z.coerce.number().int().min(1).max(10),
        evaluationOrder: z.coerce.number().int().positive(),
        stopOnMatch: z.boolean()
    }),
    conditions: z.object({
        context: z.object({
            userId: z.string().optional(),
            organizationId: z.string().optional(),
            role: z.string().optional(),
            permissions: z.array(z.string()).optional(),
            sessionAttributes: z.record(z.any()).optional()
        }),
        data: z.object({
            tableName: z.string().optional(),
            columnName: z.string().optional(),
            operation: z.string().optional(),
            value: z.any().optional()
        }),
        time: z.object({
            startDate: z.string().datetime().optional(),
            endDate: z.string().datetime().optional(),
            timeOfDay: z.object({
                start: z.string(),
                end: z.string()
            }).optional()
        })
    }),
    actions: z.object({
        type: z.enum(['allow', 'deny', 'modify', 'log', 'redirect']),
        parameters: z.record(z.any()),
        message: z.string().optional()
    }),
    metadata: z.object({
        createdBy: z.string().min(1),
        lastModifiedBy: z.string().min(1),
        version: z.coerce.number().int().positive(),
        tags: z.array(z.string()).optional()
    })
});
const EvaluateAccessSchema = z.object({
    context: z.object({
        userId: z.string().min(1),
        organizationId: z.string().min(1),
        role: z.string().min(1),
        permissions: z.array(z.string()),
        sessionId: z.string().min(1),
        ipAddress: z.string().ip(),
        userAgent: z.string().min(1)
    }),
    operation: z.object({
        type: z.enum(['SELECT', 'INSERT', 'UPDATE', 'DELETE']),
        tableName: z.string().min(1),
        recordId: z.string().optional(),
        columns: z.array(z.string()).optional()
    })
});
const GenerateRLSPolicySchema = z.object({
    organizationId: z.string().min(1),
    tableName: z.string().min(1),
    requirements: z.object({
        accessLevel: z.enum(['public', 'organization', 'user', 'admin']),
        operations: z.array(z.enum(['SELECT', 'INSERT', 'UPDATE', 'DELETE'])),
        roles: z.array(z.string()),
        additionalConditions: z.string().optional()
    })
});
const GetStatsSchema = z.object({
    organizationId: z.string().min(1),
});
rlsGenerativaRouter.post('/context', async (req, res) => {
    try {
        const contextData = CreateRLSContextSchema.parse(req.body);
        const context = await rlsGenerativaService.createRLSContext(contextData);
        res.status(201).json({
            success: true,
            data: context,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error creating RLS context', { error });
        res.status(400).json({
            success: false,
            error: 'Invalid request data',
            details: error.errors
        });
    }
});
rlsGenerativaRouter.get('/context/:sessionId', async (req, res) => {
    try {
        const { sessionId } = z.object({ sessionId: z.string().min(1) }).parse(req.params);
        const context = await rlsGenerativaService.getRLSContext(sessionId);
        if (!context) {
            return res.status(404).json({
                success: false,
                error: 'RLS context not found'
            });
        }
        res.json({
            success: true,
            data: context,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error getting RLS context', { error });
        res.status(400).json({
            success: false,
            error: 'Invalid request data',
            details: error.errors
        });
    }
});
rlsGenerativaRouter.get('/policies', async (req, res) => {
    try {
        const filters = GetRLSPoliciesSchema.parse(req.query);
        const policies = await rlsGenerativaService.getRLSPolicies(filters.organizationId, filters);
        res.json({
            success: true,
            data: {
                policies,
                total: policies.length,
                filters
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error getting RLS policies', { error });
        res.status(400).json({
            success: false,
            error: 'Invalid request data',
            details: error.errors
        });
    }
});
rlsGenerativaRouter.post('/policies', async (req, res) => {
    try {
        const policyData = CreateRLSPolicySchema.parse(req.body);
        const policy = await rlsGenerativaService.createRLSPolicy(policyData);
        res.status(201).json({
            success: true,
            data: policy,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error creating RLS policy', { error });
        res.status(400).json({
            success: false,
            error: 'Invalid request data',
            details: error.errors
        });
    }
});
rlsGenerativaRouter.get('/rules', async (req, res) => {
    try {
        const filters = GetRLSRulesSchema.parse(req.query);
        const rules = await rlsGenerativaService.getRLSRules(filters.organizationId, filters);
        res.json({
            success: true,
            data: {
                rules,
                total: rules.length,
                filters
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error getting RLS rules', { error });
        res.status(400).json({
            success: false,
            error: 'Invalid request data',
            details: error.errors
        });
    }
});
rlsGenerativaRouter.post('/rules', async (req, res) => {
    try {
        const ruleData = CreateRLSRuleSchema.parse(req.body);
        const rule = await rlsGenerativaService.createRLSRule(ruleData);
        res.status(201).json({
            success: true,
            data: rule,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error creating RLS rule', { error });
        res.status(400).json({
            success: false,
            error: 'Invalid request data',
            details: error.errors
        });
    }
});
rlsGenerativaRouter.post('/evaluate-access', async (req, res) => {
    try {
        const { context, operation } = EvaluateAccessSchema.parse(req.body);
        const result = await rlsGenerativaService.evaluateAccess(context, operation);
        res.json({
            success: true,
            data: result,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error evaluating access', { error });
        res.status(400).json({
            success: false,
            error: 'Invalid request data',
            details: error.errors
        });
    }
});
rlsGenerativaRouter.post('/generate-policy', async (req, res) => {
    try {
        const { organizationId, tableName, requirements } = GenerateRLSPolicySchema.parse(req.body);
        const policy = await rlsGenerativaService.generateRLSPolicy(organizationId, tableName, requirements);
        res.status(201).json({
            success: true,
            data: policy,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error generating RLS policy', { error });
        res.status(400).json({
            success: false,
            error: 'Invalid request data',
            details: error.errors
        });
    }
});
rlsGenerativaRouter.get('/stats', async (req, res) => {
    try {
        const { organizationId } = GetStatsSchema.parse(req.query);
        const stats = await rlsGenerativaService.getRLSStats(organizationId);
        res.json({
            success: true,
            data: stats,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error getting RLS stats', { error });
        res.status(400).json({
            success: false,
            error: 'Invalid request data',
            details: error.errors
        });
    }
});
rlsGenerativaRouter.get('/health', async (req, res) => {
    try {
        const stats = await rlsGenerativaService.getRLSStats('demo-org-1');
        res.json({
            success: true,
            data: {
                status: 'ok',
                totalPolicies: stats.totalPolicies,
                activePolicies: stats.activePolicies,
                totalRules: stats.totalRules,
                activeRules: stats.activeRules,
                totalValidations: stats.totalValidations,
                activeValidations: stats.activeValidations,
                accessStats: {
                    totalAccessAttempts: stats.accessStats.totalAccessAttempts,
                    allowedAccess: stats.accessStats.allowedAccess,
                    deniedAccess: stats.accessStats.deniedAccess,
                    averageExecutionTime: stats.accessStats.averageExecutionTime
                },
                lastUpdated: new Date().toISOString()
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error checking RLS health', { error });
        res.status(500).json({
            success: false,
            error: 'Health check failed'
        });
    }
});
export { rlsGenerativaRouter };
//# sourceMappingURL=rls-generativa.js.map