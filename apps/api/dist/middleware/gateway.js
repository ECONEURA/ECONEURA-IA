import { apiGateway } from '../lib/gateway.js';
import { logger } from '../lib/logger.js';
export function gatewayRoutingMiddleware(req, res, next) {
    try {
        const startTime = Date.now();
        req.gatewayInfo = { startTime };
        const path = req.path;
        const method = req.method;
        const headers = req.headers;
        const query = req.query;
        const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
        const localRoutes = ['/health', '/metrics', '/v1/gateway'];
        const isLocalRoute = localRoutes.some(route => path.startsWith(route));
        if (isLocalRoute) {
            logger.debug('Gateway: local route, passing through to Express', {
                path,
                method,
                clientIp,
            });
            return next();
        }
        const route = apiGateway.findRoute(path, method, headers, query);
        if (!route) {
            logger.debug('Gateway: no matching route, passing through to Express', {
                path,
                method,
                clientIp,
            });
            return next();
        }
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
        req.gatewayInfo.routeId = route.id;
        req.gatewayInfo.serviceId = service.id;
        req.gatewayInfo.serviceUrl = service.url;
        req.gatewayInfo.loadBalancerStrategy = apiGateway['loadBalancerConfig'].strategy;
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
    }
    catch (error) {
        logger.error('Gateway routing failed', {
            error: error.message,
            path: req.path,
            method: req.method,
        });
        res.status(500).json({
            error: 'Gateway error',
            message: 'Internal gateway routing error',
        });
    }
}
export function gatewayProxyMiddleware(req, res, next) {
    if (!req.gatewayInfo?.serviceUrl) {
        return next();
    }
    try {
        const serviceUrl = req.gatewayInfo.serviceUrl;
        const targetUrl = `${serviceUrl}${req.path}`;
        const proxyHeaders = {
            'Content-Type': req.headers['content-type'] || 'application/json',
            'User-Agent': req.headers['user-agent'] || 'API-Gateway/1.0',
            'X-Forwarded-For': req.ip || req.connection.remoteAddress || 'unknown',
            'X-Forwarded-Proto': req.protocol,
            'X-Forwarded-Host': req.get('host') || 'unknown',
            'X-Gateway-Route-Id': req.gatewayInfo.routeId || '',
            'X-Gateway-Service-Id': req.gatewayInfo.serviceId || '',
        };
        Object.keys(req.headers).forEach(key => {
            if (!['host', 'content-length'].includes(key.toLowerCase())) {
                proxyHeaders[key] = req.headers[key];
            }
        });
        const fetchOptions = {
            method: req.method,
            headers: proxyHeaders,
            signal: AbortSignal.timeout(30000),
        };
        if (req.body && ['POST', 'PUT', 'PATCH'].includes(req.method)) {
            fetchOptions.body = JSON.stringify(req.body);
        }
        fetch(targetUrl, fetchOptions)
            .then(async (response) => {
            const responseTime = Date.now() - (req.gatewayInfo?.startTime || Date.now());
            const success = response.ok;
            if (req.gatewayInfo?.serviceId) {
                apiGateway.recordRequest(req.gatewayInfo.serviceId, responseTime, success);
            }
            if (req.gatewayInfo?.serviceId) {
                const service = apiGateway.getService(req.gatewayInfo.serviceId);
                if (service) {
                    service.currentConnections = Math.max(0, service.currentConnections - 1);
                }
            }
            const responseHeaders = {};
            response.headers.forEach((value, key) => {
                responseHeaders[key] = value;
            });
            responseHeaders['X-Gateway-Response-Time'] = responseTime.toString();
            responseHeaders['X-Gateway-Service'] = req.gatewayInfo?.serviceId || '';
            Object.keys(responseHeaders).forEach(key => {
                res.setHeader(key, responseHeaders[key]);
            });
            res.status(response.status);
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
            if (req.gatewayInfo?.serviceId) {
                apiGateway.recordRequest(req.gatewayInfo.serviceId, responseTime, success);
            }
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
    }
    catch (error) {
        logger.error('Gateway proxy setup failed', {
            error: error.message,
            routeId: req.gatewayInfo?.routeId,
            serviceId: req.gatewayInfo?.serviceId,
        });
        res.status(500).json({
            error: 'Gateway error',
            message: 'Internal gateway proxy error',
        });
    }
}
export function gatewayMetricsMiddleware(req, res, next) {
    res.setHeader('X-Gateway-Request-Id', req.headers['x-request-id'] || 'unknown');
    res.setHeader('X-Gateway-Timestamp', new Date().toISOString());
    if (req.gatewayInfo) {
        res.setHeader('X-Gateway-Route-Id', req.gatewayInfo.routeId || 'unknown');
        res.setHeader('X-Gateway-Service-Id', req.gatewayInfo.serviceId || 'unknown');
        res.setHeader('X-Gateway-Load-Balancer-Strategy', req.gatewayInfo.loadBalancerStrategy || 'unknown');
    }
    next();
}
export function gatewayCircuitBreakerMiddleware(req, res, next) {
    if (!req.gatewayInfo?.serviceId) {
        return next();
    }
    const service = apiGateway.getService(req.gatewayInfo.serviceId);
    if (!service) {
        return next();
    }
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
//# sourceMappingURL=gateway.js.map