import { getDatabaseService } from '@econeura/db';

import { structuredLogger } from './structured-logger.js';
export class APIGatewayEnhancedService {
    static instance;
    routes = new Map();
    rateLimitStore = new Map();
    circuitBreakerStates = new Map();
    metrics = new Map();
    cache = new Map();
    db;
    cleanupInterval = null;
    constructor() {
        this.db = getDatabaseService();
        this.initializeDefaultRoutes();
        this.startCleanup();
        structuredLogger.info('APIGatewayEnhancedService initialized');
    }
    static getInstance() {
        if (!APIGatewayEnhancedService.instance) {
            APIGatewayEnhancedService.instance = new APIGatewayEnhancedService();
        }
        return APIGatewayEnhancedService.instance;
    }
    initializeDefaultRoutes() {
        const defaultRoutes = [
            {
                id: 'companies-list',
                path: '/api/v1/companies',
                method: 'GET',
                target: 'companies-service',
                version: 'v1',
                enabled: true,
                rateLimit: {
                    requests: 100,
                    window: 60,
                    burst: 20,
                    adaptive: true,
                    perUser: true,
                    perOrganization: false,
                    skipSuccessfulRequests: false
                },
                cache: {
                    enabled: true,
                    ttl: 300,
                    key: 'companies:list',
                    vary: ['user-id', 'organization-id'],
                    headers: ['authorization']
                },
                circuitBreaker: {
                    enabled: true,
                    failureThreshold: 5,
                    recoveryTimeout: 30,
                    monitoringPeriod: 60,
                    halfOpenMaxCalls: 3
                }
            },
            {
                id: 'contacts-create',
                path: '/api/v1/contacts',
                method: 'POST',
                target: 'contacts-service',
                version: 'v1',
                enabled: true,
                rateLimit: {
                    requests: 50,
                    window: 60,
                    burst: 10,
                    adaptive: true,
                    perUser: true,
                    perOrganization: true,
                    skipSuccessfulRequests: true
                },
                cache: {
                    enabled: false,
                    ttl: 0,
                    key: '',
                    vary: [],
                    headers: []
                },
                circuitBreaker: {
                    enabled: true,
                    failureThreshold: 3,
                    recoveryTimeout: 60,
                    monitoringPeriod: 120,
                    halfOpenMaxCalls: 2
                }
            },
            {
                id: 'ai-chat',
                path: '/api/v1/ai/chat',
                method: 'POST',
                target: 'ai-service',
                version: 'v1',
                enabled: true,
                rateLimit: {
                    requests: 20,
                    window: 60,
                    burst: 5,
                    adaptive: true,
                    perUser: true,
                    perOrganization: true,
                    skipSuccessfulRequests: false
                },
                cache: {
                    enabled: false,
                    ttl: 0,
                    key: '',
                    vary: [],
                    headers: []
                },
                circuitBreaker: {
                    enabled: true,
                    failureThreshold: 3,
                    recoveryTimeout: 120,
                    monitoringPeriod: 180,
                    halfOpenMaxCalls: 1
                }
            }
        ];
        defaultRoutes.forEach(route => {
            this.routes.set(route.id, route);
            this.initializeMetrics(route.id);
            this.initializeCircuitBreaker(route.id);
        });
    }
    initializeMetrics(routeId) {
        this.metrics.set(routeId, {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            averageResponseTime: 0,
            p95ResponseTime: 0,
            p99ResponseTime: 0,
            errorRate: 0,
            throughput: 0,
            activeConnections: 0,
            cacheHitRate: 0
        });
    }
    initializeCircuitBreaker(routeId) {
        this.circuitBreakerStates.set(routeId, {
            state: 'closed',
            failureCount: 0
        });
    }
    startCleanup() {
        this.cleanupInterval = setInterval(() => {
            this.cleanupExpiredData();
        }, 60000);
    }
    cleanupExpiredData() {
        const now = Date.now();
        for (const [key, value] of this.rateLimitStore.entries()) {
            if (now > value.resetTime) {
                this.rateLimitStore.delete(key);
            }
        }
        for (const [key, value] of this.cache.entries()) {
            if (now > value.expiry) {
                this.cache.delete(key);
            }
        }
    }
    async processRequest(path, method, headers, body, userId, organizationId) {
        try {
            const route = this.findMatchingRoute(path, method);
            if (!route || !route.enabled) {
                return { allowed: false, error: 'Route not found or disabled' };
            }
            const circuitBreakerState = this.circuitBreakerStates.get(route.id);
            if (circuitBreakerState.state === 'open') {
                if (circuitBreakerState.nextAttemptTime && Date.now() < circuitBreakerState.nextAttemptTime.getTime()) {
                    return {
                        allowed: false,
                        circuitBreakerState,
                        error: 'Circuit breaker is open'
                    };
                }
                else {
                    circuitBreakerState.state = 'half-open';
                    circuitBreakerState.failureCount = 0;
                }
            }
            if (circuitBreakerState.state === 'half-open') {
                if (circuitBreakerState.failureCount >= route.circuitBreaker.halfOpenMaxCalls) {
                    return {
                        allowed: false,
                        circuitBreakerState,
                        error: 'Circuit breaker half-open limit reached'
                    };
                }
            }
            let cacheHit = false;
            let cachedResponse = null;
            if (route.cache.enabled && method === 'GET') {
                const cacheKey = this.generateCacheKey(route, headers, userId, organizationId);
                const cached = this.cache.get(cacheKey);
                if (cached && Date.now() < cached.expiry) {
                    cacheHit = true;
                    cachedResponse = cached.data;
                    this.updateCacheHitRate(route.id);
                }
            }
            const rateLimitInfo = await this.checkRateLimit(route, userId, organizationId);
            if (!rateLimitInfo.allowed) {
                return {
                    allowed: false,
                    rateLimitInfo: rateLimitInfo.info,
                    error: 'Rate limit exceeded'
                };
            }
            this.updateMetrics(route.id, 'request');
            return {
                allowed: true,
                rateLimitInfo: rateLimitInfo.info,
                circuitBreakerState,
                cacheHit,
                cachedResponse,
                route
            };
        }
        catch (error) {
            structuredLogger.error('Failed to process request', {
                error: error.message,
                path,
                method
            });
            return { allowed: false, error: 'Internal server error' };
        }
    }
    findMatchingRoute(path, method) {
        for (const route of this.routes.values()) {
            if (route.method === method && this.pathMatches(route.path, path)) {
                return route;
            }
        }
        return null;
    }
    pathMatches(routePath, requestPath) {
        if (routePath === requestPath)
            return true;
        const routeParts = routePath.split('/');
        const requestParts = requestPath.split('/');
        if (routeParts.length !== requestParts.length)
            return false;
        for (let i = 0; i < routeParts.length; i++) {
            if (routeParts[i].startsWith(':'))
                continue;
            if (routeParts[i] !== requestParts[i])
                return false;
        }
        return true;
    }
    async checkRateLimit(route, userId, organizationId) {
        try {
            const now = Date.now();
            const windowStart = Math.floor(now / (route.rateLimit.window * 1000)) * (route.rateLimit.window * 1000);
            const windowEnd = windowStart + (route.rateLimit.window * 1000);
            let key = `${route.id}:${windowStart}`;
            if (route.rateLimit.perUser && userId) {
                key += `:user:${userId}`;
            }
            if (route.rateLimit.perOrganization && organizationId) {
                key += `:org:${organizationId}`;
            }
            const current = this.rateLimitStore.get(key) || { count: 0, resetTime: windowEnd };
            if (current.count >= route.rateLimit.requests) {
                return {
                    allowed: false,
                    info: {
                        limit: route.rateLimit.requests,
                        remaining: 0,
                        resetTime: windowEnd,
                        retryAfter: Math.ceil((windowEnd - now) / 1000)
                    }
                };
            }
            current.count++;
            this.rateLimitStore.set(key, current);
            return {
                allowed: true,
                info: {
                    limit: route.rateLimit.requests,
                    remaining: route.rateLimit.requests - current.count,
                    resetTime: windowEnd
                }
            };
        }
        catch (error) {
            structuredLogger.error('Failed to check rate limit', {
                error: error.message,
                routeId: route.id
            });
            return { allowed: true, info: { limit: 0, remaining: 0, resetTime: 0 } };
        }
    }
    generateCacheKey(route, headers, userId, organizationId) {
        let key = route.cache.key;
        if (route.cache.vary.includes('user-id') && userId) {
            key += `:user:${userId}`;
        }
        if (route.cache.vary.includes('organization-id') && organizationId) {
            key += `:org:${organizationId}`;
        }
        for (const header of route.cache.headers) {
            const value = headers[header.toLowerCase()];
            if (value) {
                key += `:${header}:${value}`;
            }
        }
        return key;
    }
    updateCacheHitRate(routeId) {
        const metrics = this.metrics.get(routeId);
        if (metrics) {
            metrics.cacheHitRate = Math.min(metrics.cacheHitRate + 1, 100);
            this.metrics.set(routeId, metrics);
        }
    }
    updateMetrics(routeId, type, responseTime) {
        const metrics = this.metrics.get(routeId);
        if (!metrics)
            return;
        if (type === 'request') {
            metrics.totalRequests++;
            metrics.activeConnections++;
        }
        else if (type === 'success') {
            metrics.successfulRequests++;
            metrics.activeConnections = Math.max(0, metrics.activeConnections - 1);
        }
        else if (type === 'failure') {
            metrics.failedRequests++;
            metrics.activeConnections = Math.max(0, metrics.activeConnections - 1);
        }
        if (responseTime !== undefined) {
            const totalResponses = metrics.successfulRequests + metrics.failedRequests;
            metrics.averageResponseTime = (metrics.averageResponseTime * (totalResponses - 1) + responseTime) / totalResponses;
            if (responseTime > metrics.p95ResponseTime) {
                metrics.p95ResponseTime = responseTime;
            }
            if (responseTime > metrics.p99ResponseTime) {
                metrics.p99ResponseTime = responseTime;
            }
        }
        if (metrics.totalRequests > 0) {
            metrics.errorRate = (metrics.failedRequests / metrics.totalRequests) * 100;
        }
        metrics.throughput = metrics.totalRequests / 60;
        this.metrics.set(routeId, metrics);
    }
    async recordResponse(routeId, success, responseTime, responseData) {
        try {
            const route = this.routes.get(routeId);
            if (!route)
                return;
            this.updateMetrics(routeId, success ? 'success' : 'failure', responseTime);
            if (!success) {
                await this.recordCircuitBreakerFailure(routeId);
            }
            else {
                await this.recordCircuitBreakerSuccess(routeId);
            }
            if (success && route.cache.enabled && responseData) {
                await this.cacheResponse(routeId, responseData);
            }
            structuredLogger.info('Response recorded', {
                routeId,
                success,
                responseTime,
                cached: !!responseData
            });
        }
        catch (error) {
            structuredLogger.error('Failed to record response', {
                error: error.message,
                routeId
            });
        }
    }
    async recordCircuitBreakerFailure(routeId) {
        const state = this.circuitBreakerStates.get(routeId);
        const route = this.routes.get(routeId);
        if (!state || !route || !route.circuitBreaker.enabled)
            return;
        state.failureCount++;
        state.lastFailureTime = new Date();
        if (state.failureCount >= route.circuitBreaker.failureThreshold) {
            state.state = 'open';
            state.nextAttemptTime = new Date(Date.now() + route.circuitBreaker.recoveryTimeout * 1000);
            structuredLogger.warn('Circuit breaker opened', {
                routeId,
                failureCount: state.failureCount,
                nextAttemptTime: state.nextAttemptTime
            });
        }
        this.circuitBreakerStates.set(routeId, state);
    }
    async recordCircuitBreakerSuccess(routeId) {
        const state = this.circuitBreakerStates.get(routeId);
        if (!state)
            return;
        if (state.state === 'half-open') {
            state.state = 'closed';
            state.failureCount = 0;
            state.lastFailureTime = undefined;
            state.nextAttemptTime = undefined;
            structuredLogger.info('Circuit breaker closed', { routeId });
        }
        else if (state.state === 'closed') {
            state.failureCount = Math.max(0, state.failureCount - 1);
        }
        this.circuitBreakerStates.set(routeId, state);
    }
    async cacheResponse(routeId, responseData) {
        const route = this.routes.get(routeId);
        if (!route || !route.cache.enabled)
            return;
        const cacheKey = `${routeId}:response:${Date.now()}`;
        const expiry = Date.now() + (route.cache.ttl * 1000);
        this.cache.set(cacheKey, {
            data: responseData,
            expiry
        });
    }
    async getRoutes() {
        return Array.from(this.routes.values());
    }
    async getMetrics(routeId) {
        if (routeId) {
            return this.metrics.get(routeId) || this.initializeMetrics(routeId);
        }
        return new Map(this.metrics);
    }
    async getCircuitBreakerStates() {
        return new Map(this.circuitBreakerStates);
    }
    async getRateLimitInfo(routeId, userId, organizationId) {
        const route = this.routes.get(routeId);
        if (!route)
            return null;
        const result = await this.checkRateLimit(route, userId, organizationId);
        return result.info;
    }
    async addRoute(route) {
        try {
            this.routes.set(route.id, route);
            this.initializeMetrics(route.id);
            this.initializeCircuitBreaker(route.id);
            structuredLogger.info('Route added', { routeId: route.id, path: route.path });
            return true;
        }
        catch (error) {
            structuredLogger.error('Failed to add route', {
                error: error.message,
                routeId: route.id
            });
            return false;
        }
    }
    async updateRoute(routeId, updates) {
        try {
            const route = this.routes.get(routeId);
            if (!route)
                return false;
            Object.assign(route, updates);
            this.routes.set(routeId, route);
            structuredLogger.info('Route updated', { routeId, updates });
            return true;
        }
        catch (error) {
            structuredLogger.error('Failed to update route', {
                error: error.message,
                routeId
            });
            return false;
        }
    }
    async removeRoute(routeId) {
        try {
            const deleted = this.routes.delete(routeId);
            this.metrics.delete(routeId);
            this.circuitBreakerStates.delete(routeId);
            if (deleted) {
                structuredLogger.info('Route removed', { routeId });
            }
            return deleted;
        }
        catch (error) {
            structuredLogger.error('Failed to remove route', {
                error: error.message,
                routeId
            });
            return false;
        }
    }
    async getHealthStatus() {
        const routes = await this.getRoutes();
        const metrics = await this.getMetrics();
        const circuitBreakerStates = await this.getCircuitBreakerStates();
        const openCircuitBreakers = Array.from(circuitBreakerStates.values())
            .filter(state => state.state === 'open').length;
        const highErrorRates = Array.from(metrics.values())
            .filter(m => m.errorRate > 10).length;
        let status = 'healthy';
        if (openCircuitBreakers > 0) {
            status = 'degraded';
        }
        if (highErrorRates > 0 || openCircuitBreakers > routes.length / 2) {
            status = 'unhealthy';
        }
        return {
            status,
            details: {
                totalRoutes: routes.length,
                enabledRoutes: routes.filter(r => r.enabled).length,
                openCircuitBreakers,
                highErrorRates,
                totalRequests: Array.from(metrics.values()).reduce((sum, m) => sum + m.totalRequests, 0),
                averageResponseTime: Array.from(metrics.values()).reduce((sum, m) => sum + m.averageResponseTime, 0) / routes.length
            }
        };
    }
    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
    }
}
export const apiGatewayEnhanced = APIGatewayEnhancedService.getInstance();
//# sourceMappingURL=api-gateway-enhanced.service.js.map