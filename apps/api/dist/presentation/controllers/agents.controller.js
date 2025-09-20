import { z } from 'zod';
import { logger } from '../../infrastructure/logger.js';
import { generateCorrelationId } from '../../utils/correlation.js';
const ExecuteAgentRequestSchema = z.object({
    inputs: z.unknown(),
    idempotencyKey: z.string().optional(),
    metadata: z.record(z.unknown()).optional(),
});
const ResetAgentRequestSchema = z.object({
    resetCircuitBreaker: z.boolean().default(true),
    clearIdempotencyCache: z.boolean().default(false),
});
const ClearMemoryRequestSchema = z.object({
    keyPattern: z.string().optional(),
    confirm: z.boolean(),
});
export class AgentsController {
    agentConnectors = new Map();
    memory;
    constructor(memory) {
        this.memory = memory;
    }
    registerAgent(connector) {
        this.agentConnectors.set(connector.id, connector);
        logger.info(`Agent registered: ${connector.id} (${connector.name})`);
    }
    executeAgent = async (req, res, next) => {
        try {
            const { id } = req.params;
            const correlationId = generateCorrelationId();
            const bodyValidation = ExecuteAgentRequestSchema.safeParse(req.body);
            if (!bodyValidation.success) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid request body',
                    details: bodyValidation.error.errors,
                    correlationId
                });
                return;
            }
            const { inputs, idempotencyKey, metadata } = bodyValidation.data;
            const connector = this.agentConnectors.get(id);
            if (!connector) {
                res.status(404).json({
                    success: false,
                    error: 'Agent not found',
                    agentId: id,
                    correlationId
                });
                return;
            }
            const context = {
                orgId: req.user?.orgId || 'unknown',
                userId: req.user?.id || 'unknown',
                correlationId,
                idempotencyKey,
                metadata: {
                    ...metadata,
                    userAgent: req.get('User-Agent'),
                    ip: req.ip,
                    timestamp: new Date().toISOString(),
                }
            };
            if (idempotencyKey) {
                const cachedResult = await this.memory.getAgentResult(id, idempotencyKey);
                if (cachedResult) {
                    logger.info(`Idempotent execution detected: ${id}:${idempotencyKey}`);
                    res.json({
                        success: true,
                        data: cachedResult,
                        idempotent: true,
                        correlationId,
                        agentId: id
                    });
                    return;
                }
            }
            const inputValidation = connector.validateInputs(inputs);
            if (!inputValidation.valid) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid inputs',
                    details: inputValidation.errors,
                    correlationId,
                    agentId: id
                });
                return;
            }
            logger.info(`Executing agent: ${id}`, { correlationId, context });
            const startTime = Date.now();
            const result = await connector.run(inputs, context);
            const executionTime = Date.now() - startTime;
            const outputValidation = connector.validateOutputs(result.data);
            if (!outputValidation.valid) {
                logger.error(`Invalid outputs from agent ${id}`, {
                    correlationId,
                    errors: outputValidation.errors
                });
                res.status(500).json({
                    success: false,
                    error: 'Agent returned invalid outputs',
                    details: outputValidation.errors,
                    correlationId,
                    agentId: id
                });
                return;
            }
            if (idempotencyKey) {
                await this.memory.putAgentResult(id, idempotencyKey, result, 3600);
            }
            await this.memory.putAgentContext(id, correlationId, context, 1800);
            res.json({
                success: true,
                data: result.data,
                metadata: {
                    executionId: result.executionId,
                    executionTimeMs: executionTime,
                    costEur: result.costEur,
                    retryCount: result.retryCount,
                    circuitBreakerState: result.circuitBreakerState,
                    wasCached: result.wasCached || false,
                },
                correlationId,
                agentId: id
            });
        }
        catch (error) {
            logger.error(`Error executing agent ${req.params.id}`, {
                error: error.message,
                stack: error.stack,
                correlationId: req.headers['x-correlation-id']
            });
            next(error);
        }
    };
    getAgentHealth = async (req, res, next) => {
        try {
            const { id } = req.params;
            const correlationId = generateCorrelationId();
            const connector = this.agentConnectors.get(id);
            if (!connector) {
                res.status(404).json({
                    success: false,
                    error: 'Agent not found',
                    agentId: id,
                    correlationId
                });
                return;
            }
            const health = await connector.health();
            res.json({
                success: true,
                data: {
                    agentId: id,
                    status: health.status,
                    lastChecked: health.lastChecked,
                    avgResponseTimeMs: health.avgResponseTimeMs,
                    successCount: health.successCount,
                    failureCount: health.failureCount,
                    circuitBreakerState: health.circuitBreakerState,
                    message: health.message,
                    metrics: health.metrics
                },
                correlationId
            });
        }
        catch (error) {
            logger.error(`Error getting agent health ${req.params.id}`, {
                error: error.message,
                stack: error.stack
            });
            next(error);
        }
    };
    getAgentStats = async (req, res, next) => {
        try {
            const { id } = req.params;
            const { timeWindowMs } = req.query;
            const correlationId = generateCorrelationId();
            const connector = this.agentConnectors.get(id);
            if (!connector) {
                res.status(404).json({
                    success: false,
                    error: 'Agent not found',
                    agentId: id,
                    correlationId
                });
                return;
            }
            const timeWindow = timeWindowMs ? parseInt(timeWindowMs) : 3600000;
            const stats = await connector.getStats(timeWindow);
            res.json({
                success: true,
                data: {
                    agentId: id,
                    timeWindowMs: timeWindow,
                    ...stats
                },
                correlationId
            });
        }
        catch (error) {
            logger.error(`Error getting agent stats ${req.params.id}`, {
                error: error.message,
                stack: error.stack
            });
            next(error);
        }
    };
    resetAgent = async (req, res, next) => {
        try {
            const { id } = req.params;
            const correlationId = generateCorrelationId();
            const bodyValidation = ResetAgentRequestSchema.safeParse(req.body);
            if (!bodyValidation.success) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid request body',
                    details: bodyValidation.error.errors,
                    correlationId
                });
                return;
            }
            const { resetCircuitBreaker, clearIdempotencyCache } = bodyValidation.data;
            const connector = this.agentConnectors.get(id);
            if (!connector) {
                res.status(404).json({
                    success: false,
                    error: 'Agent not found',
                    agentId: id,
                    correlationId
                });
                return;
            }
            if (!req.user?.isAdmin) {
                res.status(403).json({
                    success: false,
                    error: 'Admin privileges required',
                    correlationId
                });
                return;
            }
            if (resetCircuitBreaker) {
                await connector.resetCircuitBreaker();
                logger.info(`Circuit breaker reset for agent: ${id}`, { correlationId });
            }
            if (clearIdempotencyCache) {
                await connector.clearIdempotencyCache();
                logger.info(`Idempotency cache cleared for agent: ${id}`, { correlationId });
            }
            res.json({
                success: true,
                data: {
                    agentId: id,
                    resetCircuitBreaker,
                    clearIdempotencyCache,
                    timestamp: new Date().toISOString()
                },
                correlationId
            });
        }
        catch (error) {
            logger.error(`Error resetting agent ${req.params.id}`, {
                error: error.message,
                stack: error.stack
            });
            next(error);
        }
    };
    listAgents = async (req, res, next) => {
        try {
            const { category, status, limit = '50', offset = '0' } = req.query;
            const correlationId = generateCorrelationId();
            const limitNum = parseInt(limit);
            const offsetNum = parseInt(offset);
            const agents = Array.from(this.agentConnectors.values())
                .filter(connector => {
                if (category && connector.policy.costCategory !== category)
                    return false;
                if (status && connector.policy.requiresApproval !== (status === 'active'))
                    return false;
                return true;
            })
                .slice(offsetNum, offsetNum + limitNum)
                .map(connector => ({
                id: connector.id,
                name: connector.name,
                version: connector.version,
                category: connector.policy.costCategory,
                requiresApproval: connector.policy.requiresApproval,
                maxExecutionTimeMs: connector.policy.maxExecutionTimeMs,
                maxRetries: connector.policy.maxRetries
            }));
            res.json({
                success: true,
                data: {
                    agents,
                    pagination: {
                        limit: limitNum,
                        offset: offsetNum,
                        total: this.agentConnectors.size,
                        hasMore: offsetNum + limitNum < this.agentConnectors.size
                    }
                },
                correlationId
            });
        }
        catch (error) {
            logger.error('Error listing agents', {
                error: error.message,
                stack: error.stack
            });
            next(error);
        }
    };
    getAgent = async (req, res, next) => {
        try {
            const { id } = req.params;
            const correlationId = generateCorrelationId();
            const connector = this.agentConnectors.get(id);
            if (!connector) {
                res.status(404).json({
                    success: false,
                    error: 'Agent not found',
                    agentId: id,
                    correlationId
                });
                return;
            }
            res.json({
                success: true,
                data: {
                    id: connector.id,
                    name: connector.name,
                    version: connector.version,
                    inputSchema: connector.inputSchema,
                    outputSchema: connector.outputSchema,
                    policy: connector.policy,
                    idempotencyConfig: connector.idempotencyConfig,
                    retryConfig: connector.retryConfig,
                    circuitBreakerConfig: connector.circuitBreakerConfig
                },
                correlationId
            });
        }
        catch (error) {
            logger.error(`Error getting agent ${req.params.id}`, {
                error: error.message,
                stack: error.stack
            });
            next(error);
        }
    };
    getAgentMemory = async (req, res, next) => {
        try {
            const { id } = req.params;
            const { keyPattern, limit = '100', offset = '0', includeExpired = 'false' } = req.query;
            const correlationId = generateCorrelationId();
            const limitNum = parseInt(limit);
            const offsetNum = parseInt(offset);
            const includeExpiredBool = includeExpired === 'true';
            const query = {
                keyPattern: keyPattern || `agent:${id}:*`,
                limit: limitNum,
                offset: offsetNum,
                includeExpired: includeExpiredBool,
                sortBy: 'updatedAt',
                sortOrder: 'desc'
            };
            const result = await this.memory.query(query);
            res.json({
                success: true,
                data: {
                    agentId: id,
                    ...result
                },
                correlationId
            });
        }
        catch (error) {
            logger.error(`Error getting agent memory ${req.params.id}`, {
                error: error.message,
                stack: error.stack
            });
            next(error);
        }
    };
    clearAgentMemory = async (req, res, next) => {
        try {
            const { id } = req.params;
            const correlationId = generateCorrelationId();
            const bodyValidation = ClearMemoryRequestSchema.safeParse(req.body);
            if (!bodyValidation.success) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid request body',
                    details: bodyValidation.error.errors,
                    correlationId
                });
                return;
            }
            const { keyPattern, confirm } = bodyValidation.data;
            if (!confirm) {
                res.status(400).json({
                    success: false,
                    error: 'Confirmation required',
                    correlationId
                });
                return;
            }
            if (!req.user?.isAdmin) {
                res.status(403).json({
                    success: false,
                    error: 'Admin privileges required',
                    correlationId
                });
                return;
            }
            const pattern = keyPattern || `agent:${id}:*`;
            const deletedCount = await this.memory.deleteByPattern(pattern);
            logger.info(`Agent memory cleared: ${id}`, {
                pattern,
                deletedCount,
                correlationId
            });
            res.json({
                success: true,
                data: {
                    agentId: id,
                    pattern,
                    deletedCount,
                    timestamp: new Date().toISOString()
                },
                correlationId
            });
        }
        catch (error) {
            logger.error(`Error clearing agent memory ${req.params.id}`, {
                error: error.message,
                stack: error.stack
            });
            next(error);
        }
    };
}
let agentsControllerInstance = null;
export const createAgentsController = (memory) => {
    if (!agentsControllerInstance) {
        agentsControllerInstance = new AgentsController(memory);
    }
    return agentsControllerInstance;
};
export const agentsController = agentsControllerInstance;
//# sourceMappingURL=agents.controller.js.map