/**
 * Controlador para agentes NEURA
 * FASE 2 - AGENTES NEURA + MEMORIA
 * 
 * Funcionalidades:
 * - Ejecución de agentes con idempotencia
 * - Verificación de salud
 * - Estadísticas y métricas
 * - Gestión de memoria
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

import { AgentConnector } from '../../../../packages/agents/connector.d.js';
import { AgentSpecificMemory } from '../../../../packages/agents/memory.js';
import { AgentContext } from '../../../../packages/agents/src/types.js';
import { logger } from '../../infrastructure/logger.js';
import { generateCorrelationId } from '../../utils/correlation.js';

// ============================================================================
// TYPES AND SCHEMAS
// ============================================================================

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

// ============================================================================
// AGENTS CONTROLLER
// ============================================================================

export class AgentsController {
  private agentConnectors: Map<string, AgentConnector> = new Map();
  private memory: AgentSpecificMemory;

  constructor(memory: AgentSpecificMemory) {
    this.memory = memory;
  }

  /**
   * Registra un conector de agente
   */
  registerAgent(connector: AgentConnector): void {
    this.agentConnectors.set(connector.id, connector);
    logger.info(`Agent registered: ${connector.id} (${connector.name})`);
  }

  /**
   * POST /v1/agents/:id/execute
   * Ejecuta un agente con inputs y contexto
   */
  executeAgent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const correlationId = generateCorrelationId();
      
      // Validar request body
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

      // Obtener conector del agente
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

      // Crear contexto de ejecución
      const context: AgentContext = {
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

      // Verificar idempotencia si se proporciona clave
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

      // Validar inputs
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

      // Ejecutar agente
      logger.info(`Executing agent: ${id}`, { correlationId, context });
      const startTime = Date.now();
      
      const result = await connector.run(inputs, context);
      const executionTime = Date.now() - startTime;

      // Validar outputs
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

      // Almacenar resultado en memoria si hay idempotencyKey
      if (idempotencyKey) {
        await this.memory.putAgentResult(id, idempotencyKey, result, 3600); // 1 hora TTL
      }

      // Almacenar contexto de ejecución
      await this.memory.putAgentContext(id, correlationId, context, 1800); // 30 min TTL

      // Respuesta exitosa
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

    } catch (error) {
      logger.error(`Error executing agent ${req.params.id}`, { 
        error: error.message, 
        stack: error.stack,
        correlationId: req.headers['x-correlation-id']
      });
      next(error);
    }
  };

  /**
   * GET /v1/agents/:id/health
   * Verifica la salud del agente
   */
  getAgentHealth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const correlationId = generateCorrelationId();

      // Obtener conector del agente
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

      // Obtener información de salud
      const health = await connector.health();

      // Respuesta
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

    } catch (error) {
      logger.error(`Error getting agent health ${req.params.id}`, { 
        error: error.message, 
        stack: error.stack 
      });
      next(error);
    }
  };

  /**
   * GET /v1/agents/:id/stats
   * Obtiene estadísticas del agente
   */
  getAgentStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { timeWindowMs } = req.query;
      const correlationId = generateCorrelationId();

      // Obtener conector del agente
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

      // Obtener estadísticas
      const timeWindow = timeWindowMs ? parseInt(timeWindowMs as string) : 3600000; // 1 hora default
      const stats = await connector.getStats(timeWindow);

      // Respuesta
      res.json({
        success: true,
        data: {
          agentId: id,
          timeWindowMs: timeWindow,
          ...stats
        },
        correlationId
      });

    } catch (error) {
      logger.error(`Error getting agent stats ${req.params.id}`, { 
        error: error.message, 
        stack: error.stack 
      });
      next(error);
    }
  };

  /**
   * POST /v1/agents/:id/reset
   * Resetea el circuit breaker del agente
   */
  resetAgent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const correlationId = generateCorrelationId();

      // Validar request body
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

      // Obtener conector del agente
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

      // Verificar permisos de administrador
      if (!req.user?.isAdmin) {
        res.status(403).json({
          success: false,
          error: 'Admin privileges required',
          correlationId
        });
        return;
      }

      // Resetear circuit breaker
      if (resetCircuitBreaker) {
        await connector.resetCircuitBreaker();
        logger.info(`Circuit breaker reset for agent: ${id}`, { correlationId });
      }

      // Limpiar cache de idempotencia
      if (clearIdempotencyCache) {
        await connector.clearIdempotencyCache();
        logger.info(`Idempotency cache cleared for agent: ${id}`, { correlationId });
      }

      // Respuesta
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

    } catch (error) {
      logger.error(`Error resetting agent ${req.params.id}`, { 
        error: error.message, 
        stack: error.stack 
      });
      next(error);
    }
  };

  /**
   * GET /v1/agents
   * Lista todos los agentes disponibles
   */
  listAgents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { category, status, limit = '50', offset = '0' } = req.query;
      const correlationId = generateCorrelationId();

      // Convertir parámetros
      const limitNum = parseInt(limit as string);
      const offsetNum = parseInt(offset as string);

      // Obtener lista de agentes
      const agents = Array.from(this.agentConnectors.values())
        .filter(connector => {
          if (category && connector.policy.costCategory !== category) return false;
          if (status && connector.policy.requiresApproval !== (status === 'active')) return false;
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

      // Respuesta
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

    } catch (error) {
      logger.error('Error listing agents', { 
        error: error.message, 
        stack: error.stack 
      });
      next(error);
    }
  };

  /**
   * GET /v1/agents/:id
   * Obtiene información detallada de un agente
   */
  getAgent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const correlationId = generateCorrelationId();

      // Obtener conector del agente
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

      // Respuesta
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

    } catch (error) {
      logger.error(`Error getting agent ${req.params.id}`, { 
        error: error.message, 
        stack: error.stack 
      });
      next(error);
    }
  };

  /**
   * GET /v1/agents/:id/memory
   * Obtiene memoria del agente
   */
  getAgentMemory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { keyPattern, limit = '100', offset = '0', includeExpired = 'false' } = req.query;
      const correlationId = generateCorrelationId();

      // Convertir parámetros
      const limitNum = parseInt(limit as string);
      const offsetNum = parseInt(offset as string);
      const includeExpiredBool = includeExpired === 'true';

      // Construir query
      const query = {
        keyPattern: keyPattern as string || `agent:${id}:*`,
        limit: limitNum,
        offset: offsetNum,
        includeExpired: includeExpiredBool,
        sortBy: 'updatedAt' as const,
        sortOrder: 'desc' as const
      };

      // Ejecutar query
      const result = await this.memory.query(query);

      // Respuesta
      res.json({
        success: true,
        data: {
          agentId: id,
          ...result
        },
        correlationId
      });

    } catch (error) {
      logger.error(`Error getting agent memory ${req.params.id}`, { 
        error: error.message, 
        stack: error.stack 
      });
      next(error);
    }
  };

  /**
   * DELETE /v1/agents/:id/memory
   * Limpia memoria del agente
   */
  clearAgentMemory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const correlationId = generateCorrelationId();

      // Validar request body
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

      // Verificar confirmación
      if (!confirm) {
        res.status(400).json({
          success: false,
          error: 'Confirmation required',
          correlationId
        });
        return;
      }

      // Verificar permisos de administrador
      if (!req.user?.isAdmin) {
        res.status(403).json({
          success: false,
          error: 'Admin privileges required',
          correlationId
        });
        return;
      }

      // Limpiar memoria
      const pattern = keyPattern || `agent:${id}:*`;
      const deletedCount = await this.memory.deleteByPattern(pattern);

      logger.info(`Agent memory cleared: ${id}`, { 
        pattern, 
        deletedCount, 
        correlationId 
      });

      // Respuesta
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

    } catch (error) {
      logger.error(`Error clearing agent memory ${req.params.id}`, { 
        error: error.message, 
        stack: error.stack 
      });
      next(error);
    }
  };
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let agentsControllerInstance: AgentsController | null = null;

export const createAgentsController = (memory: AgentSpecificMemory): AgentsController => {
  if (!agentsControllerInstance) {
    agentsControllerInstance = new AgentsController(memory);
  }
  return agentsControllerInstance;
};

export const agentsController = agentsControllerInstance!;
