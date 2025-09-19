import { Router } from 'express';
import { agentsController } from '../controllers/agents.controller.js';
import { jwtAuthMiddleware } from '../../middleware/auth.js';
import { rateLimitMiddleware } from '../../middleware/rate-limit-org.js';
import { validationMiddleware } from '../middleware/validation.middleware.js';
import { responseMiddleware } from '../middleware/response.middleware.js';
import { errorMiddleware } from '../middleware/error.middleware.js';
import { finopsEnforceMiddleware } from '../../middleware/finops-enforce.js';
import { telemetryMiddleware } from '../../middleware/telemetry.js';
const router = Router();
router.use(jwtAuthMiddleware);
router.use(telemetryMiddleware);
router.use(finopsEnforceMiddleware);
router.use(rateLimitMiddleware({
    windowMs: 15 * 60 * 1000,
    max: 50,
    message: 'Too many agent requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false
}));
router.use(responseMiddleware);
router.post('/:id/execute', validationMiddleware({
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
}), agentsController.executeAgent);
router.get('/:id/health', validationMiddleware({
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
}), agentsController.getAgentHealth);
router.get('/:id/stats', validationMiddleware({
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
}), agentsController.getAgentStats);
router.post('/:id/reset', validationMiddleware({
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
}), agentsController.resetAgent);
router.get('/', validationMiddleware({
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
}), agentsController.listAgents);
router.get('/:id', validationMiddleware({
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
}), agentsController.getAgent);
router.get('/:id/memory', validationMiddleware({
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
}), agentsController.getAgentMemory);
router.delete('/:id/memory', validationMiddleware({
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
}), agentsController.clearAgentMemory);
router.use(errorMiddleware);
export { router as agentsRoutes };
//# sourceMappingURL=agents.routes.js.map