import { Router } from 'express'
import { register } from 'prom-client'
import { customMetrics } from '@econeura/shared/otel'
import { logger } from '@econeura/shared'

const router = Router()

/**
 * Enhanced metrics endpoint combining Prometheus and OpenTelemetry
 */
router.get('/', async (req, res) => {
  try {
    // Get Prometheus metrics
    const prometheusMetrics = await register.metrics()
    
    // Add custom OpenTelemetry metrics
    const otelMetrics = await getOpenTelemetryMetrics()
    
    // Combine metrics
    const combinedMetrics = `${prometheusMetrics}\n\n# OpenTelemetry Custom Metrics\n${otelMetrics}`
    
    res.set('Content-Type', register.contentType)
    res.send(combinedMetrics)
    
  } catch (error) {
    logger.error('Error generating metrics', error as Error)
    res.status(500).json({
      error: 'Failed to generate metrics',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

/**
 * Get OpenTelemetry custom metrics in Prometheus format
 */
async function getOpenTelemetryMetrics(): Promise<string> {
  const metrics: string[] = []
  
  try {
    // AI Router metrics
    metrics.push('# HELP ai_requests_total Total AI requests by provider and status')
    metrics.push('# TYPE ai_requests_total counter')
    // Note: OpenTelemetry metrics are automatically exported via OTLP
    
    // HTTP metrics
    metrics.push('# HELP http_requests_total Total HTTP requests by route and status')
    metrics.push('# TYPE http_requests_total counter')
    
    // Webhook metrics
    metrics.push('# HELP webhook_received_total Total webhooks received by source')
    metrics.push('# TYPE webhook_received_total counter')
    
    // Flow metrics
    metrics.push('# HELP flow_executions_total Total flow executions by type')
    metrics.push('# TYPE flow_executions_total counter')
    
    // Database metrics
    metrics.push('# HELP db_connections_active Active database connections')
    metrics.push('# TYPE db_connections_active gauge')
    
    // Idempotency metrics
    metrics.push('# HELP idempotency_replays_total Total idempotency key replays')
    metrics.push('# TYPE idempotency_replays_total counter')
    
    // Rate limiting metrics
    metrics.push('# HELP rate_limit_exceeded_total Total rate limit violations')
    metrics.push('# TYPE rate_limit_exceeded_total counter')
    
    // Organization metrics
    metrics.push('# HELP org_monthly_cost_eur Organization monthly costs in EUR')
    metrics.push('# TYPE org_monthly_cost_eur histogram')
    
    return metrics.join('\n')
    
  } catch (error) {
    logger.error('Error getting OpenTelemetry metrics', error as Error)
    return '# Error getting OpenTelemetry metrics'
  }
}

/**
 * Health check endpoint with metrics summary
 */
router.get('/health', async (req, res) => {
  try {
    const metrics = await register.getMetricsAsJSON()
    
    // Calculate basic statistics
    const totalMetrics = metrics.length
    const counterMetrics = metrics.filter(m => m.type === 'Counter').length
    const gaugeMetrics = metrics.filter(m => m.type === 'Gauge').length
    const histogramMetrics = metrics.filter(m => m.type === 'Histogram').length
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      metrics: {
        total: totalMetrics,
        counters: counterMetrics,
        gauges: gaugeMetrics,
        histograms: histogramMetrics,
      },
      services: {
        prometheus: 'active',
        opentelemetry: 'active',
      },
    })
    
  } catch (error) {
    logger.error('Error in metrics health check', error as Error)
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

/**
 * Metrics summary endpoint
 */
router.get('/summary', async (req, res) => {
  try {
    const metrics = await register.getMetricsAsJSON()
    
    // Extract key metrics
    const summary: Record<string, any> = {
      timestamp: new Date().toISOString(),
      http_requests: {},
      ai_requests: {},
      webhooks: {},
      flows: {},
      database: {},
      errors: {},
    }
    
    // Process metrics by type
    metrics.forEach(metric => {
      if (metric.name.includes('http_requests_total')) {
        summary.http_requests[metric.name] = metric.values
      } else if (metric.name.includes('ai_requests_total')) {
        summary.ai_requests[metric.name] = metric.values
      } else if (metric.name.includes('webhook')) {
        summary.webhooks[metric.name] = metric.values
      } else if (metric.name.includes('flow')) {
        summary.flows[metric.name] = metric.values
      } else if (metric.name.includes('db_')) {
        summary.database[metric.name] = metric.values
      } else if (metric.name.includes('error')) {
        summary.errors[metric.name] = metric.values
      }
    })
    
    res.json(summary)
    
  } catch (error) {
    logger.error('Error generating metrics summary', error as Error)
    res.status(500).json({
      error: 'Failed to generate metrics summary',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

/**
 * Organization-specific metrics endpoint
 */
router.get('/org/:orgId', async (req, res) => {
  try {
    const { orgId } = req.params
    const metrics = await register.getMetricsAsJSON()
    
    // Filter metrics for specific organization
    const orgMetrics = metrics.filter(metric => 
      metric.values.some(value => 
        value.labels && value.labels.org_id === orgId
      )
    )
    
    // Transform to organization view
    const orgSummary: Record<string, any> = {
      org_id: orgId,
      timestamp: new Date().toISOString(),
      metrics: {},
    }
    
    orgMetrics.forEach(metric => {
      const orgValues = metric.values.filter(value => 
        value.labels && value.labels.org_id === orgId
      )
      
      if (orgValues.length > 0) {
        orgSummary.metrics[metric.name] = orgValues
      }
    })
    
    res.json(orgSummary)
    
  } catch (error) {
    logger.error('Error generating organization metrics', error as Error)
    res.status(500).json({
      error: 'Failed to generate organization metrics',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

export { router as metricsRouter }
