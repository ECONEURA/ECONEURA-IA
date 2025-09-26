/**
 * Rutas para agentes NEURA
 * FASE 2 - AGENTES NEURA + MEMORIA
 * 
 * Endpoints:
 * - POST /v1/agents/:id/execute - Ejecutar agente
 * - GET /v1/agents/:id/health - Verificar salud del agente
 * - GET /v1/agents/:id/stats - Obtener estadísticas del agente
 * - POST /v1/agents/:id/reset - Resetear circuit breaker
 */

import { Router } from 'express';

import { agentsController } from '../controllers/agents.controller.js';
import { jwtAuthMiddleware } from '../../middleware/auth.js';
import { rateLimitMiddleware } from '../../middleware/rate-limit-org.js';
import { validationMiddleware } from '../middleware/validation.middleware.js';
import { responseMiddleware } from '../middleware/response.middleware.js';
import { errorMiddleware } from '../middleware/error.middleware.js';
import { finopsEnforceMiddleware } from '../../middleware/finops-enforce.js';
import { telemetryMiddleware } from '../../middleware/telemetry.js';

// ============================================================================
// AGENTS ROUTES - FASE 2
// ============================================================================

const router = Router();

// ============================================================================
// MIDDLEWARE CONFIGURATION
// ============================================================================

// Aplicar middleware de autenticación a todas las rutas
router.use(jwtAuthMiddleware);

// Aplicar middleware de telemetría
router.use(telemetryMiddleware);

// Aplicar middleware de FinOps enforcement
router.use(finopsEnforceMiddleware);

// Aplicar middleware de rate limiting específico para agentes
router.use(rateLimitMiddleware({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 50, // 50 requests por ventana (más restrictivo que IA básica)
  message: 'Too many agent requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false
}));

// Aplicar middleware de respuesta
router.use(responseMiddleware);

// ============================================================================
// AGENT EXECUTION ROUTES
// ============================================================================

/**
 * POST /v1/agents/:id/execute
 * Ejecuta un agente con inputs y contexto
 * 
 * Características:
 * - Idempotencia con idempotencyKey
 * - Retry automático con backoff exponencial
 * - Circuit breaker para fallos
 * - Validación de inputs/outputs
 * - Tracking de costos
 */
router.post(
  '/:id/execute',
  validationMiddleware({
    body: {
      type: 'object',
      required: ['inputs'],
      properties: {
        inputs: {
          type: 'object',
          description: 'Inputs del agente (validados contra inputSchema)'
        },
        idempotencyKey: {
          type: 'string',
          description: 'Clave de idempotencia (opcional)'
        },
        metadata: {
          type: 'object',
          description: 'Metadatos adicionales (opcional)'
        }
      }
    },
    params: {
      type: 'object',
      required: ['id'],
      properties: {
        id: {
          type: 'string',
          pattern: '^[a-zA-Z0-9_-]+$',
          description: 'ID del agente'
        }
      }
    }
  }),
  agentsController.executeAgent
);

/**
 * GET /v1/agents/:id/health
 * Verifica la salud del agente
 * 
 * Características:
 * - Estado del circuit breaker
 * - Métricas de rendimiento
 * - Tiempo de respuesta promedio
 * - Última verificación
 */
router.get(
  '/:id/health',
  validationMiddleware({
    params: {
      type: 'object',
      required: ['id'],
      properties: {
        id: {
          type: 'string',
          pattern: '^[a-zA-Z0-9_-]+$',
          description: 'ID del agente'
        }
      }
    }
  }),
  agentsController.getAgentHealth
);

/**
 * GET /v1/agents/:id/stats
 * Obtiene estadísticas del agente
 * 
 * Características:
 * - Estadísticas de ejecución
 * - Métricas de rendimiento
 * - Costos acumulados
 * - Estado del circuit breaker
 */
router.get(
  '/:id/stats',
  validationMiddleware({
    params: {
      type: 'object',
      required: ['id'],
      properties: {
        id: {
          type: 'string',
          pattern: '^[a-zA-Z0-9_-]+$',
          description: 'ID del agente'
        }
      }
    },
    query: {
      type: 'object',
      properties: {
        timeWindowMs: {
          type: 'string',
          pattern: '^\\d+$',
          description: 'Ventana de tiempo en ms (default: 3600000 = 1 hora)'
        }
      }
    }
  }),
  agentsController.getAgentStats
);

/**
 * POST /v1/agents/:id/reset
 * Resetea el circuit breaker del agente
 * 
 * Características:
 * - Solo para administradores
 * - Reset completo del circuit breaker
 * - Limpieza de cache de idempotencia
 * - Logging de la operación
 */
router.post(
  '/:id/reset',
  validationMiddleware({
    params: {
      type: 'object',
      required: ['id'],
      properties: {
        id: {
          type: 'string',
          pattern: '^[a-zA-Z0-9_-]+$',
          description: 'ID del agente'
        }
      }
    },
    body: {
      type: 'object',
      properties: {
        resetCircuitBreaker: {
          type: 'boolean',
          default: true,
          description: 'Resetear circuit breaker'
        },
        clearIdempotencyCache: {
          type: 'boolean',
          default: false,
          description: 'Limpiar cache de idempotencia'
        }
      }
    }
  }),
  agentsController.resetAgent
);

// ============================================================================
// AGENT MANAGEMENT ROUTES
// ============================================================================

/**
 * GET /v1/agents
 * Lista todos los agentes disponibles
 * 
 * Características:
 * - Lista paginada de agentes
 * - Filtros por categoría, estado, etc.
 * - Información básica de cada agente
 */
router.get(
  '/',
  validationMiddleware({
    query: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          enum: ['ventas', 'marketing', 'operaciones', 'finanzas', 'soporte_qa'],
          description: 'Filtrar por categoría'
        },
        status: {
          type: 'string',
          enum: ['active', 'inactive', 'deprecated'],
          description: 'Filtrar por estado'
        },
        limit: {
          type: 'string',
          pattern: '^\\d+$',
          description: 'Límite de resultados (default: 50)'
        },
        offset: {
          type: 'string',
          pattern: '^\\d+$',
          description: 'Offset para paginación (default: 0)'
        }
      }
    }
  }),
  agentsController.listAgents
);

/**
 * GET /v1/agents/:id
 * Obtiene información detallada de un agente
 * 
 * Características:
 * - Información completa del agente
 * - Esquemas de inputs/outputs
 * - Política de ejecución
 * - Configuración de retry y circuit breaker
 */
router.get(
  '/:id',
  validationMiddleware({
    params: {
      type: 'object',
      required: ['id'],
      properties: {
        id: {
          type: 'string',
          pattern: '^[a-zA-Z0-9_-]+$',
          description: 'ID del agente'
        }
      }
    }
  }),
  agentsController.getAgent
);

// ============================================================================
// AGENT MEMORY ROUTES
// ============================================================================

/**
 * GET /v1/agents/:id/memory
 * Obtiene memoria del agente
 * 
 * Características:
 * - Consulta memoria por patrones
 * - Filtros por tenant, usuario, etc.
 * - Paginación de resultados
 */
router.get(
  '/:id/memory',
  validationMiddleware({
    params: {
      type: 'object',
      required: ['id'],
      properties: {
        id: {
          type: 'string',
          pattern: '^[a-zA-Z0-9_-]+$',
          description: 'ID del agente'
        }
      }
    },
    query: {
      type: 'object',
      properties: {
        keyPattern: {
          type: 'string',
          description: 'Patrón de clave (soporta wildcards)'
        },
        limit: {
          type: 'string',
          pattern: '^\\d+$',
          description: 'Límite de resultados (default: 100)'
        },
        offset: {
          type: 'string',
          pattern: '^\\d+$',
          description: 'Offset para paginación (default: 0)'
        },
        includeExpired: {
          type: 'string',
          enum: ['true', 'false'],
          description: 'Incluir entradas expiradas (default: false)'
        }
      }
    }
  }),
  agentsController.getAgentMemory
);

/**
 * DELETE /v1/agents/:id/memory
 * Limpia memoria del agente
 * 
 * Características:
 * - Limpieza por patrones
 * - Confirmación requerida
 * - Logging de operaciones
 */
router.delete(
  '/:id/memory',
  validationMiddleware({
    params: {
      type: 'object',
      required: ['id'],
      properties: {
        id: {
          type: 'string',
          pattern: '^[a-zA-Z0-9_-]+$',
          description: 'ID del agente'
        }
      }
    },
    body: {
      type: 'object',
      properties: {
        keyPattern: {
          type: 'string',
          description: 'Patrón de claves a eliminar'
        },
        confirm: {
          type: 'boolean',
          description: 'Confirmación de la operación'
        }
      }
    }
  }),
  agentsController.clearAgentMemory
);

// ============================================================================
// ERROR HANDLING
// ============================================================================

// Aplicar middleware de manejo de errores al final
router.use(errorMiddleware);

export { router as agentsRoutes };
