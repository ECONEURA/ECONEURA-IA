import { Request, Response, NextFunction } from 'express';
import { apiGateway } from '../lib/gateway.js';
import { logger } from '../lib/logger.js';

export interface GatewayRequest extends Request {
  gatewayInfo?: {
    routeId?: string;
    serviceId?: string;
    serviceUrl?: string;
    loadBalancerStrategy?: string;
    startTime?: number;
  };
}

export function gatewayRoutingMiddleware(req: GatewayRequest, res: Response, next: NextFunction): void {
  try {
    const startTime = Date.now();
    req.gatewayInfo = { startTime };

    // Extraer información de la request
    const path = req.path;
    const method = req.method;
    const headers = req.headers as Record<string, string>;
    const query = req.query as Record<string, string>;
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';

    // Buscar ruta que coincida
    const route = apiGateway.findRoute(path, method, headers, query);

    if (!route) {
      logger.warn('No route found for request', {
        path,
        method,
        clientIp,
        headersCount: Object.keys(headers).length,
        queryCount: Object.keys(query).length,
      });

      res.status(404).json({
        error: 'Route not found',
        message: `No route found for ${method} ${path}`,
        code: 'GATEWAY_ROUTE_NOT_FOUND',
      });
      return;
    }

    // Seleccionar servicio usando load balancing
    const service = apiGateway.selectService([route.serviceId], clientIp);

    if (!service) {
      logger.error('No available service for route', {
        routeId: route.id,
        ruleName: route.name,
        serviceId: route.serviceId,
        path,
        method,
      });

      res.status(503).json({
        error: 'Service unavailable',
        message: 'No healthy service available for this route',
        code: 'GATEWAY_SERVICE_UNAVAILABLE',
      });
      return;
    }

    // Agregar información del gateway a la request
    req.gatewayInfo.routeId = route.id;
    req.gatewayInfo.serviceId = service.id;
    req.gatewayInfo.serviceUrl = service.url;
    req.gatewayInfo.loadBalancerStrategy = apiGateway['loadBalancerConfig'].strategy;

    // Incrementar contador de conexiones activas
    service.currentConnections++;

    logger.debug('Gateway routing completed', {
      routeId: route.id,
      routeName: route.name,
      serviceId: service.id,
      serviceName: service.name,
      serviceUrl: service.url,
      loadBalancerStrategy: req.gatewayInfo.loadBalancerStrategy,
      clientIp,
      path,
      method,
    });

    next();
  } catch (error) {
    logger.error('Gateway routing failed', {
      error: (error as Error).message,
      path: req.path,
      method: req.method,
    });

    res.status(500).json({
      error: 'Gateway error',
      message: 'Internal gateway routing error',
    });
  }
}

export function gatewayProxyMiddleware(req: GatewayRequest, res: Response, next: NextFunction): void {
  if (!req.gatewayInfo?.serviceUrl) {
    return next();
  }

  try {
    const serviceUrl = req.gatewayInfo.serviceUrl;
    const targetUrl = `${serviceUrl}${req.path}`;

    // Preparar headers para el proxy
    const proxyHeaders: Record<string, string> = {
      'Content-Type': req.headers['content-type'] || 'application/json',
      'User-Agent': req.headers['user-agent'] || 'API-Gateway/1.0',
      'X-Forwarded-For': req.ip || req.connection.remoteAddress || 'unknown',
      'X-Forwarded-Proto': req.protocol,
      'X-Forwarded-Host': req.get('host') || 'unknown',
      'X-Gateway-Route-Id': req.gatewayInfo.routeId || '',
      'X-Gateway-Service-Id': req.gatewayInfo.serviceId || '',
    };

    // Agregar headers originales relevantes
    Object.keys(req.headers).forEach(key => {
      if (!['host', 'content-length'].includes(key.toLowerCase())) {
        proxyHeaders[key] = req.headers[key] as string;
      }
    });

    // Preparar opciones para fetch
    const fetchOptions: RequestInit = {
      method: req.method,
      headers: proxyHeaders,
      signal: AbortSignal.timeout(30000), // 30 segundos timeout
    };

    // Agregar body si existe
    if (req.body && ['POST', 'PUT', 'PATCH'].includes(req.method)) {
      fetchOptions.body = JSON.stringify(req.body);
    }

    // Realizar request al servicio
    fetch(targetUrl, fetchOptions)
      .then(async (response) => {
        const responseTime = Date.now() - (req.gatewayInfo?.startTime || Date.now());
        const success = response.ok;

        // Registrar métricas
        if (req.gatewayInfo?.serviceId) {
          apiGateway.recordRequest(req.gatewayInfo.serviceId, responseTime, success);
        }

        // Decrementar contador de conexiones activas
        if (req.gatewayInfo?.serviceId) {
          const service = apiGateway.getService(req.gatewayInfo.serviceId);
          if (service) {
            service.currentConnections = Math.max(0, service.currentConnections - 1);
          }
        }

        // Preparar respuesta
        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });

        // Agregar headers del gateway
        responseHeaders['X-Gateway-Response-Time'] = responseTime.toString();
        responseHeaders['X-Gateway-Service'] = req.gatewayInfo?.serviceId || '';

        // Establecer headers de respuesta
        Object.keys(responseHeaders).forEach(key => {
          res.setHeader(key, responseHeaders[key]);
        });

        // Establecer status code
        res.status(response.status);

        // Enviar respuesta
        const responseBody = await response.text();
        res.send(responseBody);

        logger.debug('Gateway proxy completed', {
          routeId: req.gatewayInfo?.routeId,
          serviceId: req.gatewayInfo?.serviceId,
          targetUrl,
          responseTime,
          statusCode: response.status,
          success,
        });
      })
      .catch((error) => {
        const responseTime = Date.now() - (req.gatewayInfo?.startTime || Date.now());
        const success = false;

        // Registrar métricas de error
        if (req.gatewayInfo?.serviceId) {
          apiGateway.recordRequest(req.gatewayInfo.serviceId, responseTime, success);
        }

        // Decrementar contador de conexiones activas
        if (req.gatewayInfo?.serviceId) {
          const service = apiGateway.getService(req.gatewayInfo.serviceId);
          if (service) {
            service.currentConnections = Math.max(0, service.currentConnections - 1);
          }
        }

        logger.error('Gateway proxy failed', {
          error: error.message,
          routeId: req.gatewayInfo?.routeId,
          serviceId: req.gatewayInfo?.serviceId,
          targetUrl,
          responseTime,
        });

        res.status(502).json({
          error: 'Bad Gateway',
          message: 'Failed to proxy request to service',
          code: 'GATEWAY_PROXY_ERROR',
        });
      });
  } catch (error) {
    logger.error('Gateway proxy setup failed', {
      error: (error as Error).message,
      routeId: req.gatewayInfo?.routeId,
      serviceId: req.gatewayInfo?.serviceId,
    });

    res.status(500).json({
      error: 'Gateway error',
      message: 'Internal gateway proxy error',
    });
  }
}

export function gatewayMetricsMiddleware(req: GatewayRequest, res: Response, next: NextFunction): void {
  // Agregar headers de métricas del gateway
  res.setHeader('X-Gateway-Request-Id', req.headers['x-request-id'] || 'unknown');
  res.setHeader('X-Gateway-Timestamp', new Date().toISOString());
  
  if (req.gatewayInfo) {
    res.setHeader('X-Gateway-Route-Id', req.gatewayInfo.routeId || 'unknown');
    res.setHeader('X-Gateway-Service-Id', req.gatewayInfo.serviceId || 'unknown');
    res.setHeader('X-Gateway-Load-Balancer-Strategy', req.gatewayInfo.loadBalancerStrategy || 'unknown');
  }

  next();
}

export function gatewayCircuitBreakerMiddleware(req: GatewayRequest, res: Response, next: NextFunction): void {
  if (!req.gatewayInfo?.serviceId) {
    return next();
  }

  const service = apiGateway.getService(req.gatewayInfo.serviceId);
  if (!service) {
    return next();
  }

  // Verificar si el servicio está en estado de circuit breaker
  const circuitBreakerThreshold = apiGateway['loadBalancerConfig'].circuitBreakerThreshold;
  
  if (service.errorRate > circuitBreakerThreshold) {
    logger.warn('Circuit breaker activated for service', {
      serviceId: service.id,
      serviceName: service.name,
      errorRate: service.errorRate,
      threshold: circuitBreakerThreshold,
    });

    res.status(503).json({
      error: 'Service temporarily unavailable',
      message: 'Service is experiencing high error rate',
      code: 'GATEWAY_CIRCUIT_BREAKER',
    });
  }

  next();
}
