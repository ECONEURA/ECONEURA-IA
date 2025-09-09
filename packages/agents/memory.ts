/**
 * Sistema de memoria para agentes NEURA
 * FASE 2 - AGENTES NEURA + MEMORIA
 * 
 * Funcionalidades:
 * - put/query/ttl por tenant/usuario/agent
 * - Cache distribuido con Redis
 * - Persistencia con PostgreSQL
 * - TTL automático y manual
 */

import { z } from 'zod';

/**
 * Esquema para entradas de memoria
 */
export const MemoryEntrySchema = z.object({
  /** Clave única de la entrada */
  key: z.string(),
  /** Valor almacenado */
  value: z.unknown(),
  /** Timestamp de creación */
  createdAt: z.date(),
  /** Timestamp de última actualización */
  updatedAt: z.date(),
  /** TTL en segundos (0 = sin expiración) */
  ttlSeconds: z.number().min(0).default(0),
  /** Timestamp de expiración calculado */
  expiresAt: z.date().optional(),
  /** Metadatos adicionales */
  metadata: z.record(z.unknown()).optional(),
});

export type MemoryEntry = z.infer<typeof MemoryEntrySchema>;

/**
 * Esquema para consultas de memoria
 */
export const MemoryQuerySchema = z.object({
  /** Patrón de clave (soporta wildcards) */
  keyPattern: z.string(),
  /** Filtro por tenant */
  tenantId: z.string().optional(),
  /** Filtro por usuario */
  userId: z.string().optional(),
  /** Filtro por agente */
  agentId: z.string().optional(),
  /** Límite de resultados */
  limit: z.number().min(1).max(1000).default(100),
  /** Offset para paginación */
  offset: z.number().min(0).default(0),
  /** Incluir entradas expiradas */
  includeExpired: z.boolean().default(false),
  /** Ordenar por campo */
  sortBy: z.enum(['createdAt', 'updatedAt', 'expiresAt', 'key']).default('updatedAt'),
  /** Orden ascendente o descendente */
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type MemoryQuery = z.infer<typeof MemoryQuerySchema>;

/**
 * Resultado de consulta de memoria
 */
export const MemoryQueryResultSchema = z.object({
  /** Entradas encontradas */
  entries: z.array(MemoryEntrySchema),
  /** Total de entradas que coinciden */
  total: z.number(),
  /** Si hay más resultados disponibles */
  hasMore: z.boolean(),
  /** Siguiente offset para paginación */
  nextOffset: z.number().optional(),
});

export type MemoryQueryResult = z.infer<typeof MemoryQueryResultSchema>;

/**
 * Configuración del sistema de memoria
 */
export interface MemoryConfig {
  /** Configuración de Redis */
  redis: {
    host: string;
    port: number;
    password?: string;
    db: number;
    keyPrefix: string;
    /** TTL por defecto en segundos */
    defaultTtlSeconds: number;
  };
  
  /** Configuración de PostgreSQL */
  postgres: {
    connectionString: string;
    tableName: string;
    /** Tamaño del pool de conexiones */
    poolSize: number;
  };
  
  /** Configuración de cache */
  cache: {
    /** Tamaño máximo del cache en memoria */
    maxSize: number;
    /** TTL por defecto en segundos */
    defaultTtlSeconds: number;
    /** Intervalo de limpieza en ms */
    cleanupIntervalMs: number;
  };
  
  /** Configuración de limpieza automática */
  cleanup: {
    /** Intervalo de limpieza de entradas expiradas en ms */
    intervalMs: number;
    /** Lote de limpieza por vez */
    batchSize: number;
  };
}

/**
 * Interfaz principal del sistema de memoria
 */
export interface AgentMemory {
  /**
   * Almacena una entrada en memoria
   * @param key - Clave única
   * @param value - Valor a almacenar
   * @param options - Opciones de almacenamiento
   */
  put(
    key: string, 
    value: unknown, 
    options?: {
      ttlSeconds?: number;
      tenantId?: string;
      userId?: string;
      agentId?: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<void>;

  /**
   * Obtiene una entrada de memoria
   * @param key - Clave a buscar
   * @returns Valor almacenado o null si no existe/expirado
   */
  get(key: string): Promise<unknown | null>;

  /**
   * Obtiene una entrada con metadatos completos
   * @param key - Clave a buscar
   * @returns Entrada completa o null si no existe/expirado
   */
  getEntry(key: string): Promise<MemoryEntry | null>;

  /**
   * Consulta entradas usando filtros
   * @param query - Parámetros de consulta
   * @returns Resultado de la consulta
   */
  query(query: MemoryQuery): Promise<MemoryQueryResult>;

  /**
   * Elimina una entrada
   * @param key - Clave a eliminar
   * @returns true si se eliminó, false si no existía
   */
  delete(key: string): Promise<boolean>;

  /**
   * Elimina múltiples entradas por patrón
   * @param keyPattern - Patrón de claves a eliminar
   * @returns Número de entradas eliminadas
   */
  deleteByPattern(keyPattern: string): Promise<number>;

  /**
   * Actualiza el TTL de una entrada
   * @param key - Clave a actualizar
   * @param ttlSeconds - Nuevo TTL en segundos
   * @returns true si se actualizó, false si no existe
   */
  updateTtl(key: string, ttlSeconds: number): Promise<boolean>;

  /**
   * Verifica si una entrada existe y no está expirada
   * @param key - Clave a verificar
   * @returns true si existe y no está expirada
   */
  exists(key: string): Promise<boolean>;

  /**
   * Obtiene estadísticas del sistema de memoria
   * @param tenantId - Filtro por tenant (opcional)
   * @returns Estadísticas del sistema
   */
  getStats(tenantId?: string): Promise<{
    totalEntries: number;
    expiredEntries: number;
    memoryUsageBytes: number;
    cacheHitRate: number;
    lastCleanup: Date;
  }>;

  /**
   * Limpia entradas expiradas
   * @param batchSize - Tamaño del lote de limpieza
   * @returns Número de entradas limpiadas
   */
  cleanupExpired(batchSize?: number): Promise<number>;

  /**
   * Cierra conexiones y libera recursos
   */
  close(): Promise<void>;
}

/**
 * Implementación específica para memoria de agentes
 */
export interface AgentSpecificMemory extends AgentMemory {
  /**
   * Almacena contexto de ejecución de agente
   * @param agentId - ID del agente
   * @param executionId - ID de la ejecución
   * @param context - Contexto a almacenar
   * @param ttlSeconds - TTL en segundos
   */
  putAgentContext(
    agentId: string,
    executionId: string,
    context: unknown,
    ttlSeconds?: number
  ): Promise<void>;

  /**
   * Obtiene contexto de ejecución de agente
   * @param agentId - ID del agente
   * @param executionId - ID de la ejecución
   * @returns Contexto almacenado o null
   */
  getAgentContext(agentId: string, executionId: string): Promise<unknown | null>;

  /**
   * Almacena resultado de ejecución de agente
   * @param agentId - ID del agente
   * @param executionId - ID de la ejecución
   * @param result - Resultado a almacenar
   * @param ttlSeconds - TTL en segundos
   */
  putAgentResult(
    agentId: string,
    executionId: string,
    result: unknown,
    ttlSeconds?: number
  ): Promise<void>;

  /**
   * Obtiene resultado de ejecución de agente
   * @param agentId - ID del agente
   * @param executionId - ID de la ejecución
   * @returns Resultado almacenado o null
   */
  getAgentResult(agentId: string, executionId: string): Promise<unknown | null>;

  /**
   * Almacena memoria de conversación
   * @param tenantId - ID del tenant
   * @param userId - ID del usuario
   * @param conversationId - ID de la conversación
   * @param message - Mensaje a almacenar
   * @param ttlSeconds - TTL en segundos
   */
  putConversationMemory(
    tenantId: string,
    userId: string,
    conversationId: string,
    message: unknown,
    ttlSeconds?: number
  ): Promise<void>;

  /**
   * Obtiene memoria de conversación
   * @param tenantId - ID del tenant
   * @param userId - ID del usuario
   * @param conversationId - ID de la conversación
   * @param limit - Límite de mensajes
   * @returns Lista de mensajes
   */
  getConversationMemory(
    tenantId: string,
    userId: string,
    conversationId: string,
    limit?: number
  ): Promise<unknown[]>;

  /**
   * Almacena preferencias de usuario
   * @param tenantId - ID del tenant
   * @param userId - ID del usuario
   * @param preferences - Preferencias a almacenar
   * @param ttlSeconds - TTL en segundos
   */
  putUserPreferences(
    tenantId: string,
    userId: string,
    preferences: Record<string, unknown>,
    ttlSeconds?: number
  ): Promise<void>;

  /**
   * Obtiene preferencias de usuario
   * @param tenantId - ID del tenant
   * @param userId - ID del usuario
   * @returns Preferencias almacenadas o null
   */
  getUserPreferences(tenantId: string, userId: string): Promise<Record<string, unknown> | null>;

  /**
   * Almacena configuración de agente
   * @param agentId - ID del agente
   * @param config - Configuración a almacenar
   * @param ttlSeconds - TTL en segundos
   */
  putAgentConfig(
    agentId: string,
    config: Record<string, unknown>,
    ttlSeconds?: number
  ): Promise<void>;

  /**
   * Obtiene configuración de agente
   * @param agentId - ID del agente
   * @returns Configuración almacenada o null
   */
  getAgentConfig(agentId: string): Promise<Record<string, unknown> | null>;
}

/**
 * Factory para crear instancias de memoria
 */
export interface MemoryFactory {
  /**
   * Crea una instancia de memoria con la configuración proporcionada
   * @param config - Configuración del sistema de memoria
   * @returns Promise con la instancia de memoria
   */
  createMemory(config: MemoryConfig): Promise<AgentSpecificMemory>;

  /**
   * Crea una instancia de memoria para testing
   * @param options - Opciones de configuración para testing
   * @returns Promise con la instancia de memoria para testing
   */
  createTestMemory(options?: {
    useRedis?: boolean;
    usePostgres?: boolean;
    defaultTtlSeconds?: number;
  }): Promise<AgentSpecificMemory>;
}

/**
 * Eventos emitidos por el sistema de memoria
 */
export interface MemoryEvents {
  /** Emitido cuando se almacena una entrada */
  entryStored: (key: string, value: unknown, ttlSeconds?: number) => void;
  
  /** Emitido cuando se obtiene una entrada */
  entryRetrieved: (key: string, value: unknown, fromCache: boolean) => void;
  
  /** Emitido cuando se elimina una entrada */
  entryDeleted: (key: string) => void;
  
  /** Emitido cuando una entrada expira */
  entryExpired: (key: string) => void;
  
  /** Emitido cuando se limpian entradas expiradas */
  cleanupCompleted: (entriesCleaned: number) => void;
  
  /** Emitido cuando hay un error en el sistema */
  error: (error: Error, operation: string) => void;
}

/**
 * Extensión del sistema de memoria con soporte para eventos
 */
export interface EventEmitterMemory extends AgentSpecificMemory {
  /** Emisor de eventos */
  readonly events: MemoryEvents;
  
  /** Suscribirse a eventos */
  on<K extends keyof MemoryEvents>(
    event: K, 
    listener: MemoryEvents[K]
  ): void;
  
  /** Desuscribirse de eventos */
  off<K extends keyof MemoryEvents>(
    event: K, 
    listener: MemoryEvents[K]
  ): void;
}

/**
 * Utilidades para generar claves de memoria
 */
export class MemoryKeyUtils {
  /**
   * Genera clave para contexto de agente
   */
  static agentContext(agentId: string, executionId: string): string {
    return `agent:${agentId}:context:${executionId}`;
  }

  /**
   * Genera clave para resultado de agente
   */
  static agentResult(agentId: string, executionId: string): string {
    return `agent:${agentId}:result:${executionId}`;
  }

  /**
   * Genera clave para memoria de conversación
   */
  static conversationMemory(tenantId: string, userId: string, conversationId: string): string {
    return `tenant:${tenantId}:user:${userId}:conversation:${conversationId}`;
  }

  /**
   * Genera clave para preferencias de usuario
   */
  static userPreferences(tenantId: string, userId: string): string {
    return `tenant:${tenantId}:user:${userId}:preferences`;
  }

  /**
   * Genera clave para configuración de agente
   */
  static agentConfig(agentId: string): string {
    return `agent:${agentId}:config`;
  }

  /**
   * Genera clave para idempotencia
   */
  static idempotency(agentId: string, idempotencyKey: string): string {
    return `agent:${agentId}:idempotency:${idempotencyKey}`;
  }

  /**
   * Genera patrón para consultas
   */
  static pattern(prefix: string, wildcard: string = '*'): string {
    return `${prefix}:${wildcard}`;
  }
}
