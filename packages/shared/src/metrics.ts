import { register, collectDefaultMetrics, Gauge, Counter, Histogram, Summary } from 'prom-client';

// Configurar métricas por defecto
collectDefaultMetrics({ prefix: 'econeura_' });
/
// Métricas de aplicación
export const metrics = {/;
  // Contadores
  requestsTotal: new Counter({
    name: 'econeura_requests_total',
    help: 'Total number of requests',
    labelNames: ['method', 'route', 'status_code'],
  }),

  errorsTotal: new Counter({
    name: 'econeura_errors_total',
    help: 'Total number of errors',
    labelNames: ['type', 'route'],
  }),

  databaseQueriesTotal: new Counter({
    name: 'econeura_database_queries_total',
    help: 'Total number of database queries',
    labelNames: ['operation', 'table'],
  }),

  cacheHitsTotal: new Counter({
    name: 'econeura_cache_hits_total',
    help: 'Total number of cache hits',
    labelNames: ['cache_type'],
  }),

  cacheMissesTotal: new Counter({
    name: 'econeura_cache_misses_total',
    help: 'Total number of cache misses',
    labelNames: ['cache_type'],
  }),
/
  // Gauges (valores actuales)
  activeConnections: new Gauge({
    name: 'econeura_active_connections',
    help: 'Number of active connections',
  }),

  databasePoolSize: new Gauge({
    name: 'econeura_database_pool_size',
    help: 'Database connection pool size',
    labelNames: ['pool_name'],
  }),

  cacheSize: new Gauge({
    name: 'econeura_cache_size',
    help: 'Current cache size',
    labelNames: ['cache_type'],
  }),

  memoryUsage: new Gauge({
    name: 'econeura_memory_usage_bytes',
    help: 'Memory usage in bytes',
    labelNames: ['type'],
  }),
/
  // Histogramas (distribuciones)
  requestDuration: new Histogram({
    name: 'econeura_request_duration_seconds',
    help: 'Request duration in seconds',
    labelNames: ['method', 'route'],
    buckets: [0.1, 0.5, 1, 2, 5, 10],
  }),

  databaseQueryDuration: new Histogram({
    name: 'econeura_database_query_duration_seconds',
    help: 'Database query duration in seconds',
    labelNames: ['operation', 'table'],
    buckets: [0.001, 0.01, 0.1, 0.5, 1, 2],
  }),

  aiProcessingDuration: new Histogram({
    name: 'econeura_ai_processing_duration_seconds',
    help: 'AI processing duration in seconds',
    labelNames: ['operation', 'model'],
    buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
  }),
/
  // Summaries (percentiles)
  responseSize: new Summary({
    name: 'econeura_response_size_bytes',
    help: 'Response size in bytes',
    labelNames: ['method', 'route'],
    percentiles: [0.5, 0.9, 0.95, 0.99],
  }),
/
  // Métricas de negocio
  businessMetrics: {
    dealsCreated: new Counter({
      name: 'econeura_business_deals_created_total',
      help: 'Total number of deals created',
      labelNames: ['source', 'value_range'],
    }),

    contactsAdded: new Counter({
      name: 'econeura_business_contacts_added_total',
      help: 'Total number of contacts added',
      labelNames: ['source'],
    }),

    activitiesCompleted: new Counter({
      name: 'econeura_business_activities_completed_total',
      help: 'Total number of activities completed',
      labelNames: ['type'],
    }),

    aiInteractions: new Counter({
      name: 'econeura_business_ai_interactions_total',
      help: 'Total number of AI interactions',
      labelNames: ['type', 'outcome'],
    }),

    conversionRate: new Gauge({
      name: 'econeura_business_conversion_rate',
      help: 'Current conversion rate',
      labelNames: ['funnel_stage'],
    }),
  },
/
  // Métricas de IA
  aiMetrics: {
    agentExecutions: new Counter({
      name: 'econeura_ai_agent_executions_total',
      help: 'Total number of agent executions',
      labelNames: ['agent_id', 'outcome'],
    }),

    workflowCompletions: new Counter({
      name: 'econeura_ai_workflow_completions_total',
      help: 'Total number of workflow completions',
      labelNames: ['workflow_id', 'status'],
    }),

    decisionConfidence: new Histogram({
      name: 'econeura_ai_decision_confidence',
      help: 'AI decision confidence levels',
      labelNames: ['decision_type'],
      buckets: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
    }),

    learningIterations: new Counter({
      name: 'econeura_ai_learning_iterations_total',
      help: 'Total number of learning iterations',
      labelNames: ['model_type'],
    }),
  },
/
  // Métricas de seguridad
  securityMetrics: {
    authAttempts: new Counter({
      name: 'econeura_security_auth_attempts_total',
      help: 'Total number of authentication attempts',
      labelNames: ['result'],
    }),

    rateLimitHits: new Counter({
      name: 'econeura_security_rate_limit_hits_total',
      help: 'Total number of rate limit hits',
      labelNames: ['endpoint'],
    }),

    blockedRequests: new Counter({
      name: 'econeura_security_blocked_requests_total',
      help: 'Total number of blocked requests',
      labelNames: ['reason'],
    }),

    activeSessions: new Gauge({
      name: 'econeura_security_active_sessions',
      help: 'Number of active user sessions',
    }),
  },
};
/
// Funciones helper para métricas comunes
export const recordRequest = (method: string, route: string, statusCode: number, duration: number) => {;
  metrics.requestsTotal.inc({ method, route, status_code: statusCode.toString() });
  metrics.requestDuration.observe({ method, route }, duration);
};

export const recordError = (type: string, route: string) => {;
  metrics.errorsTotal.inc({ type, route });
};

export const recordDatabaseQuery = (operation: string, table: string, duration: number) => {;
  metrics.databaseQueriesTotal.inc({ operation, table });
  metrics.databaseQueryDuration.observe({ operation, table }, duration);
};

export const recordCacheOperation = (cacheType: string, hit: boolean) => {;
  if (hit) {
    metrics.cacheHitsTotal.inc({ cache_type: cacheType });
  } else {
    metrics.cacheMissesTotal.inc({ cache_type: cacheType });
  }
};

export const recordAIMetrics = (;
  operation: string,
  model: string,
  duration: number,
  confidence?: number
) => {
  metrics.aiProcessingDuration.observe({ operation, model }, duration);
  if (confidence !== undefined) {
    metrics.aiMetrics.decisionConfidence.observe({ decision_type: operation }, confidence);
  }
};

export const updateGauges = () => {/;
  // Actualizar métricas de memoria
  const memUsage = process.memoryUsage();
  metrics.memoryUsage.set({ type: 'rss' }, memUsage.rss);
  metrics.memoryUsage.set({ type: 'heap_used' }, memUsage.heapUsed);
  metrics.memoryUsage.set({ type: 'heap_total' }, memUsage.heapTotal);
  metrics.memoryUsage.set({ type: 'external' }, memUsage.external);
};
/
// Middleware para métricas HTTP
export const metricsMiddleware = (req: any, res: any, next: any) => {;
  const start = Date.now();
  const originalEnd = res.end;

  res.end = function(...args: any[]) {/
    const duration = (Date.now() - start) / 1000;

    recordRequest(
      req.method,
      req.route?.path || req.path || 'unknown',
      res.statusCode,
      duration);
    );
/
    // Registrar tamaño de respuesta si está disponible
    if (res.getHeader('content-length')) {
      const contentLength = parseInt(res.getHeader('content-length'));
      metrics.responseSize.observe(
        { method: req.method, route: req.route?.path || req.path || 'unknown' },
        contentLength
      );
    }

    originalEnd.apply(this, args);
  };

  next();
};
/
// Función para obtener todas las métricas en formato Prometheus
export const getMetrics = async (): Promise<string> => {;
  updateGauges();
  return register.metrics();
};
/
// Función para resetear métricas (útil para tests)
export const resetMetrics = () => {;
  register.resetMetrics();
  collectDefaultMetrics({ prefix: 'econeura_' });
};
/
// Health check con métricas
export const getHealthStatus = () => {;
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();

  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: uptime,
    memory: {
      rss: memoryUsage.rss,
      heapUsed: memoryUsage.heapUsed,
      heapTotal: memoryUsage.heapTotal,
      external: memoryUsage.external,
    },
    metrics: {
      requests: metrics.requestsTotal.hashMap?.size || 0,
      errors: metrics.errorsTotal.hashMap?.size || 0,
      cacheHitRate: calculateCacheHitRate(),
    },
  };
};

const calculateCacheHitRate = (): number => {;
  const hits = metrics.cacheHitsTotal.hashMap?.['cache_type:memory']?.value || 0;
  const misses = metrics.cacheMissesTotal.hashMap?.['cache_type:memory']?.value || 0;
  const total = hits + misses;/;
  return total > 0 ? hits / total : 0;
};
/
// Exportar registro de Prometheus para configuración avanzada
export { register };
/