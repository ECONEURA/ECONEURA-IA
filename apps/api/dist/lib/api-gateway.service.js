import { getDatabaseService } from '@econeura/db';
import { organizations, users } from '@econeura/db/schema';

import { structuredLogger } from './structured-logger.js';
export class ApiGatewayService {
    config;
    routes = new Map();
    serviceHealth = new Map();
    circuitBreakers = new Map();
    db;
    constructor(config) {
        this.config = {
            enableCaching: true,
            cacheTTL: 300000,
            enableMetrics: true,
            enableCircuitBreaker: true,
            circuitBreakerThreshold: 5,
            enableLoadBalancing: true,
            maxRetries: 3,
            timeout: 30000,
            ...config
        };
        this.db = getDatabaseService();
        this.initializeRoutes();
        this.startHealthChecks();
    }
    initializeRoutes() {
        this.addRoute({
            path: '/v1/auth',
            method: 'POST',
            service: 'auth',
            version: 'v1',
            requiresAuth: false,
            rateLimit: 10,
            timeout: 5000
        });
        this.addRoute({
            path: '/v1/auth/refresh',
            method: 'POST',
            service: 'auth',
            version: 'v1',
            requiresAuth: true,
            rateLimit: 5,
            timeout: 3000
        });
        this.addRoute({
            path: '/v1/users',
            method: 'GET',
            service: 'users',
            version: 'v1',
            requiresAuth: true,
            rateLimit: 100,
            timeout: 10000
        });
        this.addRoute({
            path: '/v1/companies',
            method: 'GET',
            service: 'companies',
            version: 'v1',
            requiresAuth: true,
            rateLimit: 200,
            timeout: 15000
        });
        this.addRoute({
            path: '/v1/contacts',
            method: 'GET',
            service: 'contacts',
            version: 'v1',
            requiresAuth: true,
            rateLimit: 200,
            timeout: 15000
        });
        this.addRoute({
            path: '/v1/products',
            method: 'GET',
            service: 'products',
            version: 'v1',
            requiresAuth: true,
            rateLimit: 200,
            timeout: 15000
        });
        this.addRoute({
            path: '/v1/invoices',
            method: 'GET',
            service: 'invoices',
            version: 'v1',
            requiresAuth: true,
            rateLimit: 100,
            timeout: 20000
        });
        this.addRoute({
            path: '/v1/ai',
            method: 'POST',
            service: 'ai',
            version: 'v1',
            requiresAuth: true,
            rateLimit: 50,
            timeout: 60000,
            circuitBreaker: true
        });
        this.addRoute({
            path: '/v1/analytics',
            method: 'GET',
            service: 'analytics',
            version: 'v1',
            requiresAuth: true,
            rateLimit: 100,
            timeout: 30000
        });
        this.addRoute({
            path: '/health',
            method: 'GET',
            service: 'health',
            version: 'v1',
            requiresAuth: false,
            rateLimit: 1000,
            timeout: 2000
        });
        this.addRoute({
            path: '/metrics',
            method: 'GET',
            service: 'metrics',
            version: 'v1',
            requiresAuth: true,
            rateLimit: 10,
            timeout: 5000
        });
        structuredLogger.info('API Gateway routes initialized', {
            totalRoutes: this.routes.size,
            services: [...new Set(Array.from(this.routes.values()).map(r => r.service))]
        });
    }
    addRoute(config) {
        const key = `${config.method}:${config.path}`;
        this.routes.set(key, config);
    }
    gatewayMiddleware = async (req, res, next) => {
        const startTime = Date.now();
        const requestId = this.generateRequestId();
        try {
            req.headers['x-request-id'] = requestId;
            res.set('X-Request-ID', requestId);
            const routeKey = `${req.method}:${req.path}`;
            const routeConfig = this.routes.get(routeKey);
            if (!routeConfig) {
                structuredLogger.warn('Route not found', {
                    requestId,
                    method: req.method,
                    path: req.path,
                    ip: req.ip
                });
                res.status(404).json({
                    error: 'Route not found',
                    message: `No route found for ${req.method} ${req.path}`,
                    requestId,
                    timestamp: new Date().toISOString()
                });
                return;
            }
            const serviceHealth = this.serviceHealth.get(routeConfig.service);
            if (serviceHealth && serviceHealth.status === 'unhealthy') {
                structuredLogger.warn('Service unhealthy', {
                    requestId,
                    service: routeConfig.service,
                    status: serviceHealth.status
                });
                res.status(503).json({
                    error: 'Service unavailable',
                    message: `Service ${routeConfig.service} is currently unavailable`,
                    requestId,
                    timestamp: new Date().toISOString()
                });
                return;
            }
            if (routeConfig.circuitBreaker && this.isCircuitBreakerOpen(routeConfig.service)) {
                structuredLogger.warn('Circuit breaker open', {
                    requestId,
                    service: routeConfig.service
                });
                res.status(503).json({
                    error: 'Service temporarily unavailable',
                    message: `Service ${routeConfig.service} is temporarily unavailable due to high error rate`,
                    requestId,
                    timestamp: new Date().toISOString()
                });
                return;
            }
            req.routeConfig = routeConfig;
            req.requestId = requestId;
            structuredLogger.info('API Gateway request', {
                requestId,
                method: req.method,
                path: req.path,
                service: routeConfig.service,
                version: routeConfig.version,
                requiresAuth: routeConfig.requiresAuth,
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
            next();
        }
        catch (error) {
            const processingTime = Date.now() - startTime;
            structuredLogger.error('API Gateway error', {
                error: error instanceof Error ? error.message : 'Unknown error',
                requestId,
                method: req.method,
                path: req.path,
                processingTime
            });
            res.status(500).json({
                error: 'Internal gateway error',
                message: 'An error occurred while processing the request',
                requestId,
                timestamp: new Date().toISOString()
            });
        }
    };
    startHealthChecks() {
        if (!this.config.enableMetrics)
            return;
        setInterval(async () => {
            await this.performHealthChecks();
        }, 30000);
    }
    async performHealthChecks() {
        const services = [...new Set(Array.from(this.routes.values()).map(r => r.service))];
        for (const service of services) {
            try {
                const startTime = Date.now();
                await this.checkServiceHealth(service);
                const responseTime = Date.now() - startTime;
                this.serviceHealth.set(service, {
                    service,
                    status: 'healthy',
                    responseTime,
                    lastCheck: Date.now(),
                    errorRate: 0
                });
            }
            catch (error) {
                const currentHealth = this.serviceHealth.get(service);
                const errorRate = currentHealth ? currentHealth.errorRate + 0.1 : 0.1;
                this.serviceHealth.set(service, {
                    service,
                    status: errorRate > 0.5 ? 'unhealthy' : 'degraded',
                    responseTime: 0,
                    lastCheck: Date.now(),
                    errorRate: Math.min(errorRate, 1)
                });
                structuredLogger.warn('Service health check failed', {
                    service,
                    error: error instanceof Error ? error.message : 'Unknown error',
                    errorRate
                });
            }
        }
    }
    async checkServiceHealth(service) {
        switch (service) {
            case 'auth':
                await this.checkAuthServiceHealth();
                break;
            case 'users':
                await this.checkUsersServiceHealth();
                break;
            case 'companies':
                await this.checkCompaniesServiceHealth();
                break;
            case 'contacts':
                await this.checkContactsServiceHealth();
                break;
            case 'products':
                await this.checkProductsServiceHealth();
                break;
            case 'invoices':
                await this.checkInvoicesServiceHealth();
                break;
            case 'ai':
                await this.checkAIServiceHealth();
                break;
            case 'analytics':
                await this.checkAnalyticsServiceHealth();
                break;
            case 'health':
                break;
            case 'metrics':
                await this.checkMetricsServiceHealth();
                break;
            default:
                throw new Error(`Unknown service: ${service}`);
        }
    }
    async checkAuthServiceHealth() {
        const db = this.db.getDatabase();
        await db.select().from(users).limit(1);
    }
    async checkUsersServiceHealth() {
        const db = this.db.getDatabase();
        await db.select().from(users).limit(1);
    }
    async checkCompaniesServiceHealth() {
        const db = this.db.getDatabase();
        await db.select().from(organizations).limit(1);
    }
    async checkContactsServiceHealth() {
        return Promise.resolve();
    }
    async checkProductsServiceHealth() {
        return Promise.resolve();
    }
    async checkInvoicesServiceHealth() {
        return Promise.resolve();
    }
    async checkAIServiceHealth() {
        if (!process.env.AZURE_OPENAI_API_KEY) {
            throw new Error('Azure OpenAI API key not configured');
        }
    }
    async checkAnalyticsServiceHealth() {
        return Promise.resolve();
    }
    async checkMetricsServiceHealth() {
        return Promise.resolve();
    }
    isCircuitBreakerOpen(service) {
        if (!this.config.enableCircuitBreaker)
            return false;
        const breaker = this.circuitBreakers.get(service);
        if (!breaker)
            return false;
        const now = Date.now();
        switch (breaker.state) {
            case 'open':
                if (now >= breaker.nextAttempt) {
                    breaker.state = 'half-open';
                    return false;
                }
                return true;
            case 'half-open':
                return false;
            case 'closed':
                return false;
            default:
                return false;
        }
    }
    recordServiceFailure(service) {
        if (!this.config.enableCircuitBreaker)
            return;
        const breaker = this.circuitBreakers.get(service) || {
            failures: 0,
            lastFailure: 0,
            state: 'closed',
            nextAttempt: 0
        };
        breaker.failures++;
        breaker.lastFailure = Date.now();
        if (breaker.failures >= this.config.circuitBreakerThreshold) {
            breaker.state = 'open';
            breaker.nextAttempt = Date.now() + 60000;
            structuredLogger.warn('Circuit breaker opened', {
                service,
                failures: breaker.failures,
                threshold: this.config.circuitBreakerThreshold
            });
        }
        this.circuitBreakers.set(service, breaker);
    }
    recordServiceSuccess(service) {
        if (!this.config.enableCircuitBreaker)
            return;
        const breaker = this.circuitBreakers.get(service);
        if (breaker && breaker.state === 'half-open') {
            breaker.state = 'closed';
            breaker.failures = 0;
            this.circuitBreakers.set(service, breaker);
        }
    }
    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    getServiceHealth() {
        return new Map(this.serviceHealth);
    }
    getCircuitBreakerStatus() {
        return new Map(this.circuitBreakers);
    }
    getRouteConfig(path, method) {
        return this.routes.get(`${method}:${path}`);
    }
}
export const apiGatewayService = new ApiGatewayService();
//# sourceMappingURL=api-gateway.service.js.map