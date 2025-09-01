// Tipos base
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantEntity extends BaseEntity {
  orgId: string;
}

// Tipos de autenticación y autorización
export interface TokenPayload {
  userId: string;
  orgId: string;
  roles: string[];
  permissions: string[];
  exp: number;
}

export interface AuthenticatedRequest {
  user: TokenPayload;
}

// Tipos de métricas y observabilidad
export interface MetricValue {
  value: number;
  timestamp: number;
  labels?: Record<string, string>;
}

export interface Metric {
  name: string;
  type: 'counter' | 'gauge' | 'histogram';
  description: string;
  values: MetricValue[];
  maxValues: number;
  alerts?: {
    warning?: number;
    critical?: number;
  };
}

export interface AIMetrics {
  tokens: number;
  cost: number;
  latency: number;
  model: string;
  success: boolean;
}

// Tipos de logging
export interface LogContext {
  // Contexto organizacional
  org?: string;
  orgTier?: string;
  orgFeatures?: string[];
  
  // Contexto de usuario
  userId?: string;
  userRole?: string;
  userPermissions?: string[];
  
  // Contexto de request
  requestId?: string;
  correlationId?: string;
  traceId?: string;
  spanId?: string;
  parentSpanId?: string;
  endpoint?: string;
  method?: string;
  path?: string;
  query?: Record<string, unknown>;
  
  // Métricas de rendimiento
  duration?: number;
  startTime?: number;
  endTime?: number;
  
  // Métricas de IA
  tokens?: number;
  cost?: number;
  aiModel?: string;
  aiProvider?: string;
  promptTokens?: number;
  completionTokens?: number;
  
  // Contexto técnico
  userAgent?: string;
  ip?: string;
  statusCode?: number;
  error?: string;
  stack?: string;
  port?: number;
  environment?: string;
  version?: string;
}

// Tipos de caché
export interface CacheConfig {
  ttl?: number;
  prefix?: string;
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  errors: number;
}

// Tipos de IA
export interface AIServiceConfig {
  endpoint?: string;
  apiKey?: string;
  apiVersion?: string;
  defaultModel?: string;
}

export interface CompletionRequest {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  model?: string;
  orgId: string;
}

// Tipos de health check
export interface HealthCheck {
  status: 'ok' | 'error' | 'degraded';
  checks: {
    [key: string]: {
      status: 'ok' | 'error';
      message?: string;
      latency?: number;
    };
  };
  timestamp: string;
}
