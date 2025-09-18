# ECONEURA Workers

Sistema avanzado de workers para procesamiento de emails, trabajos programados y integración con Microsoft Graph.

## 🚀 Características

### 📧 Procesamiento de Emails
- **Análisis AI**: Categorización automática de emails
- **Acciones inteligentes**: Responder, reenviar, archivar
- **Procesamiento en lote**: Manejo eficiente de múltiples emails
- **Extracción de entidades**: Emails, teléfonos, montos

### ⏰ Trabajos Programados (Cron)
- **6 trabajos predefinidos**: Email processing, Graph sync, cleanup, health check, reports, export
- **Gestión dinámica**: Habilitar/deshabilitar trabajos
- **Monitoreo**: Estadísticas de ejecución y errores
- **Programación flexible**: Expresiones cron estándar

### 🔄 Cola de Trabajos
- **Redis-based**: Cola persistente y escalable
- **Prioridades**: Urgent, high, normal, low
- **Reintentos**: Lógica de backoff exponencial
- **Métricas**: Tiempo de procesamiento y estadísticas

### 📊 Métricas Prometheus
- **HTTP requests**: Duración y conteos
- **Email processing**: Acciones y categorías
- **Job processing**: Tipos y estados
- **Graph API**: Llamadas y duración
- **Redis operations**: Operaciones y latencia
- **System metrics**: Memoria, conexiones, errores

## 🛠️ Endpoints API

### Health & Metrics
- `GET /health` - Estado del sistema
- `GET /metrics` - Métricas Prometheus

### Cron Jobs
- `GET /cron/jobs` - Listar todos los trabajos
- `GET /cron/jobs/:jobId` - Estado de un trabajo específico
- `POST /cron/jobs/:jobId/enable` - Habilitar trabajo
- `POST /cron/jobs/:jobId/disable` - Deshabilitar trabajo
- `GET /cron/stats` - Estadísticas de trabajos

### Email Processing
- `POST /emails/process` - Procesar un email
- `POST /emails/process/bulk` - Procesar múltiples emails

### Microsoft Graph
- `POST /listen` - Webhook listener
- `GET /subscriptions` - Gestionar suscripciones

## 📋 Trabajos Programados

| ID | Nombre | Programación | Descripción |
|----|--------|--------------|-------------|
| `email_processing` | Email Processing | `*/5 * * * *` | Procesa emails pendientes cada 5 minutos |
| `graph_sync` | Microsoft Graph Sync | `*/15 * * * *` | Sincroniza datos de Graph cada 15 minutos |
| `cleanup` | System Cleanup | `0 * * * *` | Limpieza del sistema cada hora |
| `health_check` | Health Check | `* * * * *` | Verificación de salud cada minuto |
| `daily_reports` | Daily Reports | `0 6 * * *` | Genera reportes diarios a las 6 AM |
| `weekly_export` | Weekly Data Export | `0 2 * * 0` | Exporta datos semanalmente los domingos a las 2 AM |

## 🔧 Configuración

### Variables de Entorno
```bash
PORT=3001                    # Puerto del servidor
REDIS_HOST=localhost         # Host de Redis
REDIS_PORT=6379             # Puerto de Redis
```

### Dependencias
- **Express**: Servidor web
- **Redis (ioredis)**: Cola de trabajos
- **node-cron**: Trabajos programados
- **prom-client**: Métricas Prometheus
- **Microsoft Graph**: Integración con Outlook

## 📊 Métricas Disponibles

### Contadores
- `econeura_http_requests_total` - Total de requests HTTP
- `econeura_emails_processed_total` - Emails procesados
- `econeura_jobs_processed_total` - Trabajos procesados
- `econeura_graph_api_calls_total` - Llamadas a Graph API
- `econeura_redis_operations_total` - Operaciones Redis
- `econeura_cron_jobs_executed_total` - Trabajos cron ejecutados
- `econeura_errors_total` - Errores del sistema

### Histogramas
- `econeura_http_request_duration_seconds` - Duración requests HTTP
- `econeura_email_processing_duration_seconds` - Duración procesamiento emails
- `econeura_job_duration_seconds` - Duración trabajos
- `econeura_graph_api_duration_seconds` - Duración llamadas Graph
- `econeura_redis_operation_duration_seconds` - Duración operaciones Redis
- `econeura_cron_job_duration_seconds` - Duración trabajos cron

### Gauges
- `econeura_job_queue_size` - Tamaño de colas
- `econeura_active_connections` - Conexiones activas
- `econeura_memory_usage_bytes` - Uso de memoria

## 🚀 Uso

### Iniciar el servidor
```bash
cd apps/workers
pnpm dev
```

### Procesar un email
```bash
curl -X POST http://localhost:3001/emails/process \
  -H "Content-Type: application/json" \
  -d '{
    "messageId": "email_123",
    "organizationId": "org_456"
  }'
```

### Ver trabajos cron
```bash
curl http://localhost:3001/cron/jobs
```

### Ver métricas
```bash
curl http://localhost:3001/metrics
```

## 🔍 Monitoreo

### Health Check
```bash
curl http://localhost:3001/health
```

### Estadísticas de trabajos
```bash
curl http://localhost:3001/cron/stats
```

## 🏗️ Arquitectura

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Express API   │    │   Cron Service  │    │  Email Processor│
│                 │    │                 │    │                 │
│ - Health checks │    │ - Job scheduling│    │ - AI analysis   │
│ - Metrics       │    │ - Task execution│    │ - Categorization│
│ - Webhooks      │    │ - Error handling│    │ - Actions       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Job Queue     │
                    │                 │
                    │ - Redis-based   │
                    │ - Priorities    │
                    │ - Retries       │
                    │ - Metrics       │
                    └─────────────────┘
                                 │
                    ┌─────────────────┐
                    │  Microsoft Graph│
                    │                 │
                    │ - Email access  │
                    │ - Subscriptions │
                    │ - Delta queries │
                    └─────────────────┘
```

## 🔒 Seguridad

- **Helmet**: Headers de seguridad
- **CORS**: Configuración de origen cruzado
- **Rate limiting**: Limitación de requests
- **Input validation**: Validación de entrada
- **Error handling**: Manejo seguro de errores

## 📈 Escalabilidad

- **Redis clustering**: Soporte para clusters Redis
- **Horizontal scaling**: Múltiples instancias workers
- **Load balancing**: Distribución de carga
- **Connection pooling**: Pool de conexiones
- **Graceful shutdown**: Cierre ordenado

## 🐛 Troubleshooting

### Problemas comunes
1. **Redis connection**: Verificar que Redis esté ejecutándose
2. **Graph API**: Verificar tokens y permisos
3. **Memory usage**: Monitorear métricas de memoria
4. **Job failures**: Revisar logs de errores

### Logs
Los logs incluyen:
- Timestamps estructurados
- Correlation IDs
- Contexto de errores
- Métricas de rendimiento

## 📚 Referencias

- [Microsoft Graph API](https://docs.microsoft.com/graph/)
- [Prometheus Metrics](https://prometheus.io/docs/concepts/metric_types/)
- [Redis Commands](https://redis.io/commands/)
- [Cron Expressions](https://crontab.guru/)
