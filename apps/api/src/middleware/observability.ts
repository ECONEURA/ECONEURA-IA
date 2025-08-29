import { Request, Response, NextFunction } from 'express'
import { 
  tracer, 
  meter, 
  createSpan, 
  recordException, 
  addEvent, 
  setAttributes,
  recordHTTPRequest,
  getTraceId,
  getSpanId,
  customMetrics
} from '@econeura/shared/otel'
import { context, SpanStatusCode } from '@opentelemetry/api'

/**
 * OpenTelemetry observability middleware for Express
 */
export function observabilityMiddleware() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now()
    
    // Create span for the request
    const span = createSpan('http.request', {
      'http.method': req.method,
      'http.url': req.url,
      'http.route': req.route?.path || req.path,
      'http.target': req.path,
      'http.host': req.hostname,
      'http.user_agent': req.get('user-agent'),
      'http.request_id': req.get('x-request-id'),
      'http.traceparent': req.get('traceparent'),
      'http.org_id': req.get('x-org-id'),
      'http.correlation_id': req.get('correlation-id'),
      'http.client_ip': req.ip || req.connection.remoteAddress,
    })

    // Set span as active
    const activeContext = context.active().with(span)
    context.with(activeContext, () => {
      // Add request body size if present
      if (req.body && typeof req.body === 'object') {
        const bodySize = JSON.stringify(req.body).length
        setAttributes(span, {
          'http.request.body.size': bodySize,
        })
      }

      // Add query parameters
      if (Object.keys(req.query).length > 0) {
        setAttributes(span, {
          'http.request.query': JSON.stringify(req.query),
        })
      }

      // Add headers (filtered for sensitive data)
      const safeHeaders = { ...req.headers }
      delete safeHeaders.authorization
      delete safeHeaders.cookie
      delete safeHeaders['x-api-key']
      
      setAttributes(span, {
        'http.request.headers': JSON.stringify(safeHeaders),
      })

      // Add event for request start
      addEvent(span, 'request.start', {
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.url,
      })

      // Override res.end to capture response
      const originalEnd = res.end
      res.end = function(chunk?: any, encoding?: any, callback?: any) {
        const endTime = Date.now()
        const duration = endTime - startTime

        // Record response details
        setAttributes(span, {
          'http.status_code': res.statusCode,
          'http.response.size': chunk ? chunk.length : 0,
          'http.response.duration_ms': duration,
        })

        // Add event for request end
        addEvent(span, 'request.end', {
          timestamp: new Date().toISOString(),
          status_code: res.statusCode,
          duration_ms: duration,
        })

        // Set span status based on response
        if (res.statusCode >= 400) {
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: `HTTP ${res.statusCode}`,
          })
        } else {
          span.setStatus({
            code: SpanStatusCode.OK,
          })
        }

        // Record metrics
        const orgId = req.get('x-org-id')
        recordHTTPRequest(
          req.method,
          req.route?.path || req.path,
          res.statusCode,
          duration,
          orgId || undefined
        )

        // End the span
        span.end()

        // Call original end
        return originalEnd.call(this, chunk, encoding, callback)
      }

      // Add trace context to response headers
      res.setHeader('x-trace-id', getTraceId() || '')
      res.setHeader('x-span-id', getSpanId() || '')

      // Continue to next middleware
      next()
    })
  }
}

/**
 * Error handling middleware with observability
 */
export function errorObservabilityMiddleware() {
  return (error: Error, req: Request, res: Response, next: NextFunction) => {
    const span = getCurrentSpan()
    
    if (span) {
      // Record exception in span
      recordException(span, error, {
        'error.type': error.constructor.name,
        'error.message': error.message,
        'error.stack': error.stack,
        'http.method': req.method,
        'http.url': req.url,
        'http.org_id': req.get('x-org-id'),
      })

      // Set span status to error
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error.message,
      })

      // Add error event
      addEvent(span, 'error.occurred', {
        error_type: error.constructor.name,
        error_message: error.message,
        timestamp: new Date().toISOString(),
      })

      span.end()
    }

    // Record error metrics
    const orgId = req.get('x-org-id')
    customMetrics.httpRequestsTotal.add(1, {
      method: req.method,
      route: req.route?.path || req.path,
      status_code: '500',
      org_id: orgId || 'unknown',
    })

    next(error)
  }
}

/**
 * Database query observability wrapper
 */
export function withDatabaseObservability<T>(
  operation: string,
  table: string,
  queryFn: () => Promise<T>,
  orgId?: string
): Promise<T> {
  return tracer.startActiveSpan(`db.${operation}`, async (span) => {
    const startTime = Date.now()
    
    try {
      setAttributes(span, {
        'db.operation': operation,
        'db.table': table,
        'db.system': 'postgresql',
        'org_id': orgId,
      })

      addEvent(span, 'db.query.start', {
        operation,
        table,
        timestamp: new Date().toISOString(),
      })

      const result = await queryFn()
      const duration = Date.now() - startTime

      setAttributes(span, {
        'db.query.duration_ms': duration,
        'db.query.success': true,
      })

      addEvent(span, 'db.query.end', {
        operation,
        table,
        duration_ms: duration,
        timestamp: new Date().toISOString(),
      })

      // Record database metrics
      customMetrics.dbQueryLatencyMs.record(duration, {
        operation,
        table,
        org_id: orgId || 'unknown',
      })

      span.setStatus({ code: SpanStatusCode.OK })
      return result

    } catch (error) {
      const duration = Date.now() - startTime
      
      recordException(span, error as Error, {
        'db.operation': operation,
        'db.table': table,
        'db.query.duration_ms': duration,
        'db.query.success': false,
      })

      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: (error as Error).message,
      })

      // Record error metrics
      customMetrics.dbQueryLatencyMs.record(duration, {
        operation,
        table,
        org_id: orgId || 'unknown',
        error: 'true',
      })

      throw error
    } finally {
      span.end()
    }
  })
}

/**
 * AI request observability wrapper
 */
export function withAIObservability<T>(
  provider: string,
  model: string,
  requestFn: () => Promise<T>,
  orgId?: string
): Promise<T> {
  return tracer.startActiveSpan(`ai.request`, async (span) => {
    const startTime = Date.now()
    
    try {
      setAttributes(span, {
        'ai.provider': provider,
        'ai.model': model,
        'org_id': orgId,
      })

      addEvent(span, 'ai.request.start', {
        provider,
        model,
        timestamp: new Date().toISOString(),
      })

      const result = await requestFn()
      const duration = Date.now() - startTime

      setAttributes(span, {
        'ai.request.duration_ms': duration,
        'ai.request.success': true,
      })

      addEvent(span, 'ai.request.end', {
        provider,
        model,
        duration_ms: duration,
        timestamp: new Date().toISOString(),
      })

      span.setStatus({ code: SpanStatusCode.OK })
      return result

    } catch (error) {
      const duration = Date.now() - startTime
      
      recordException(span, error as Error, {
        'ai.provider': provider,
        'ai.model': model,
        'ai.request.duration_ms': duration,
        'ai.request.success': false,
      })

      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: (error as Error).message,
      })

      throw error
    } finally {
      span.end()
    }
  })
}

/**
 * Flow execution observability wrapper
 */
export function withFlowObservability<T>(
  flowType: string,
  flowFn: () => Promise<T>,
  orgId?: string
): Promise<T> {
  return tracer.startActiveSpan(`flow.${flowType}`, async (span) => {
    const startTime = Date.now()
    
    try {
      setAttributes(span, {
        'flow.type': flowType,
        'org_id': orgId,
      })

      addEvent(span, 'flow.start', {
        flow_type: flowType,
        timestamp: new Date().toISOString(),
      })

      const result = await flowFn()
      const duration = Date.now() - startTime

      setAttributes(span, {
        'flow.duration_ms': duration,
        'flow.success': true,
      })

      addEvent(span, 'flow.end', {
        flow_type: flowType,
        duration_ms: duration,
        timestamp: new Date().toISOString(),
      })

      // Record flow metrics
      customMetrics.flowExecutionsTotal.add(1, {
        flow_type: flowType,
        status: 'success',
        org_id: orgId || 'unknown',
      })
      customMetrics.flowLatencyMs.record(duration, {
        flow_type: flowType,
        org_id: orgId || 'unknown',
      })

      span.setStatus({ code: SpanStatusCode.OK })
      return result

    } catch (error) {
      const duration = Date.now() - startTime
      
      recordException(span, error as Error, {
        'flow.type': flowType,
        'flow.duration_ms': duration,
        'flow.success': false,
      })

      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: (error as Error).message,
      })

      // Record error metrics
      customMetrics.flowExecutionsTotal.add(1, {
        flow_type: flowType,
        status: 'error',
        org_id: orgId || 'unknown',
      })
      customMetrics.flowLatencyMs.record(duration, {
        flow_type: flowType,
        org_id: orgId || 'unknown',
      })

      throw error
    } finally {
      span.end()
    }
  })
}

// Helper function to get current span
function getCurrentSpan() {
  return tracer.startActiveSpan('helper', (span) => span)
}
