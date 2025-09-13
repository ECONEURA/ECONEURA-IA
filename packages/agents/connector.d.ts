/**
 * Contrato para conectores de agentes NEURA
 * FASE 2 - AGENTES NEURA + MEMORIA
 */

import { z } from 'zod';
import { AgentContext, AgentResult, AgentPolicy } from './src/types.js';

/**
 * Esquema de entrada para validación de inputs del agente
 */
export interface AgentInputSchema {
  [key: string]: z.ZodSchema;
}

/**
 * Esquema de salida para validación de outputs del agente
 */
export interface AgentOutputSchema {
  [key: string]: z.ZodSchema;
}

/**
 * Configuración de idempotencia para ejecuciones de agentes
 */
export interface IdempotencyConfig {
  /** Clave única para identificar ejecuciones idénticas */
  key: string;
  /** TTL en segundos para la clave de idempotencia */
  ttlSeconds: number;
  /** Si debe retornar resultado cacheado en caso de duplicado */
  returnCached: boolean;
}

/**
 * Configuración de retry y backoff para agentes
 */
export interface RetryConfig {
  /** Número máximo de reintentos */
  maxRetries: number;
  /** Delay inicial en ms */
  initialDelayMs: number;
  /** Factor de multiplicación para backoff exponencial */
  backoffMultiplier: number;
  /** Delay máximo en ms */
  maxDelayMs: number;
  /** Códigos de error que justifican retry */
  retryableErrors: number[];
}

/**
 * Configuración del circuit breaker
 */
export interface CircuitBreakerConfig {
  /** Número de fallos consecutivos antes de abrir */
  failureThreshold: number;
  /** Tiempo en ms antes de intentar cerrar el circuit breaker */
  recoveryTimeoutMs: number;
  /** Porcentaje de requests que deben fallar para abrir */
  failureRateThreshold: number;
  /** Ventana de tiempo en ms para calcular el porcentaje de fallos */
  windowMs: number;
}

/**
 * Estado del circuit breaker
 */
export type CircuitBreakerState = 'closed' | 'open' | 'half-open';

/**
 * Información de salud del agente
 */
export interface AgentHealth {
  /** Estado general del agente */
  status: 'healthy' | 'degraded' | 'unhealthy';
  /** Timestamp de la última verificación */
  lastChecked: Date;
  /** Tiempo de respuesta promedio en ms */
  avgResponseTimeMs: number;
  /** Número de ejecuciones exitosas en la última hora */
  successCount: number;
  /** Número de ejecuciones fallidas en la última hora */
  failureCount: number;
  /** Estado del circuit breaker */
  circuitBreakerState: CircuitBreakerState;
  /** Mensaje de estado opcional */
  message?: string;
  /** Métricas adicionales */
  metrics?: Record<string, unknown>;
}

/**
 * Resultado de ejecución de agente con metadatos extendidos
 */
export interface AgentExecutionResult extends AgentResult {
  /** ID único de la ejecución */
  executionId: string;
  /** Timestamp de inicio */
  startedAt: Date;
  /** Timestamp de finalización */
  completedAt: Date;
  /** Número de reintentos realizados */
  retryCount: number;
  /** Estado del circuit breaker al momento de la ejecución */
  circuitBreakerState: CircuitBreakerState;
  /** Clave de idempotencia utilizada */
  idempotencyKey?: string;
  /** Si el resultado fue cacheado por idempotencia */
  wasCached?: boolean;
}

/**
 * Interfaz principal del conector de agente
 */
export interface AgentConnector {
  /**
   * ID único del agente
   */
  readonly id: string;

  /**
   * Nombre descriptivo del agente
   */
  readonly name: string;

  /**
   * Versión del agente
   */
  readonly version: string;

  /**
   * Esquema de validación para inputs
   */
  readonly inputSchema: AgentInputSchema;

  /**
   * Esquema de validación para outputs
   */
  readonly outputSchema: AgentOutputSchema;

  /**
   * Política de ejecución del agente
   */
  readonly policy: AgentPolicy;

  /**
   * Configuración de idempotencia
   */
  readonly idempotencyConfig: IdempotencyConfig;

  /**
   * Configuración de retry y backoff
   */
  readonly retryConfig: RetryConfig;

  /**
   * Configuración del circuit breaker
   */
  readonly circuitBreakerConfig: CircuitBreakerConfig;

  /**
   * Ejecuta el agente con los inputs y contexto proporcionados
   * @param inputs - Datos de entrada validados contra inputSchema
   * @param context - Contexto de ejecución (org, usuario, etc.)
   * @returns Promise con el resultado de la ejecución
   */
  run(inputs: unknown, context: AgentContext): Promise<AgentExecutionResult>;

  /**
   * Verifica la salud del agente
   * @returns Promise con información de salud
   */
  health(): Promise<AgentHealth>;

  /**
   * Valida los inputs contra el esquema definido
   * @param inputs - Datos de entrada a validar
   * @returns Resultado de la validación
   */
  validateInputs(inputs: unknown): { valid: boolean; errors?: string[] };

  /**
   * Valida los outputs contra el esquema definido
   * @param outputs - Datos de salida a validar
   * @returns Resultado de la validación
   */
  validateOutputs(outputs: unknown): { valid: boolean; errors?: string[] };

  /**
   * Obtiene estadísticas de ejecución del agente
   * @param timeWindowMs - Ventana de tiempo en ms (default: 1 hora)
   * @returns Estadísticas de ejecución
   */
  getStats(timeWindowMs?: number): Promise<{
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    avgExecutionTimeMs: number;
    avgCostEur: number;
    circuitBreakerState: CircuitBreakerState;
  }>;

  /**
   * Resetea el circuit breaker (solo para testing/admin)
   */
  resetCircuitBreaker(): Promise<void>;

  /**
   * Limpia el cache de idempotencia (solo para testing/admin)
   */
  clearIdempotencyCache(): Promise<void>;
}

/**
 * Factory para crear conectores de agentes
 */
export interface AgentConnectorFactory {
  /**
   * Crea un nuevo conector de agente
   * @param config - Configuración del conector
   * @returns Promise con el conector creado
   */
  createConnector(config: AgentConnectorConfig): Promise<AgentConnector>;

  /**
   * Registra un nuevo tipo de agente
   * @param type - Tipo de agente
   * @param factory - Función factory para crear el agente
   */
  registerAgentType(type: string, factory: AgentFactoryFunction): void;

  /**
   * Obtiene un conector existente por ID
   * @param agentId - ID del agente
   * @returns Promise con el conector o null si no existe
   */
  getConnector(agentId: string): Promise<AgentConnector | null>;

  /**
   * Lista todos los conectores disponibles
   * @returns Promise con lista de conectores
   */
  listConnectors(): Promise<AgentConnector[]>;
}

/**
 * Configuración para crear un conector de agente
 */
export interface AgentConnectorConfig {
  /** ID único del agente */
  id: string;
  /** Nombre descriptivo */
  name: string;
  /** Versión */
  version: string;
  /** Esquema de inputs */
  inputSchema: AgentInputSchema;
  /** Esquema de outputs */
  outputSchema: AgentOutputSchema;
  /** Política de ejecución */
  policy: AgentPolicy;
  /** Configuración de idempotencia */
  idempotencyConfig: IdempotencyConfig;
  /** Configuración de retry */
  retryConfig: RetryConfig;
  /** Configuración de circuit breaker */
  circuitBreakerConfig: CircuitBreakerConfig;
  /** Función de ejecución del agente */
  runFunction: (inputs: unknown, context: AgentContext) => Promise<AgentResult>;
}

/**
 * Función factory para crear agentes
 */
export type AgentFactoryFunction = (config: AgentConnectorConfig) => Promise<AgentConnector>;

/**
 * Eventos emitidos por el conector de agente
 */
export interface AgentConnectorEvents {
  /** Emitido cuando el agente inicia ejecución */
  executionStarted: (executionId: string, agentId: string, context: AgentContext) => void;
  
  /** Emitido cuando el agente completa ejecución exitosamente */
  executionCompleted: (executionId: string, agentId: string, result: AgentExecutionResult) => void;
  
  /** Emitido cuando el agente falla en ejecución */
  executionFailed: (executionId: string, agentId: string, error: Error) => void;
  
  /** Emitido cuando el circuit breaker cambia de estado */
  circuitBreakerStateChanged: (agentId: string, oldState: CircuitBreakerState, newState: CircuitBreakerState) => void;
  
  /** Emitido cuando se detecta una ejecución idempotente */
  idempotentExecution: (executionId: string, agentId: string, cachedResult: AgentExecutionResult) => void;
}

/**
 * Extensión del conector con soporte para eventos
 */
export interface EventEmitterAgentConnector extends AgentConnector {
  /** Emisor de eventos */
  readonly events: AgentConnectorEvents;
  
  /** Suscribirse a eventos */
  on<K extends keyof AgentConnectorEvents>(
    event: K, 
    listener: AgentConnectorEvents[K]
  ): void;
  
  /** Desuscribirse de eventos */
  off<K extends keyof AgentConnectorEvents>(
    event: K, 
    listener: AgentConnectorEvents[K]
  ): void;
}
