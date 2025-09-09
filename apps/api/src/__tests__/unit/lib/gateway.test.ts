import { describe, it, expect, beforeEach, vi } from 'vitest';
import { APIGateway, ServiceEndpoint, RouteRule, LoadBalancerConfig } from '../../../lib/gateway.js';

describe('APIGateway', () => {
  let gateway: APIGateway;
  let config: LoadBalancerConfig;

  beforeEach(() => {
    config = {
      strategy: 'round-robin',
      healthCheckInterval: 1000,
      healthCheckTimeout: 5000,
      maxRetries: 3,
      circuitBreakerThreshold: 0.5,
    };
    gateway = new APIGateway(config);
  });

  describe('Service Management', () => {
    it('should add a service successfully', () => {
      const serviceData = {
        name: 'Test Service',
        url: 'http://localhost:3000',
        health: 'healthy',
        weight: 1,
        maxConnections: 100,
        isActive: true,
      };

      const serviceId = gateway.addService(serviceData);
      expect(serviceId).toBeDefined();
      expect(serviceId).toMatch(/^service_\d+_[a-z0-9]+$/);

      const service = gateway.getService(serviceId);
      expect(service).toBeDefined();
      expect(service?.name).toBe('Test Service');
      expect(service?.url).toBe('http://localhost:3000');
      expect(service?.health).toBe('healthy');
      expect(service?.weight).toBe(1);
      expect(service?.maxConnections).toBe(100);
      expect(service?.isActive).toBe(true);
    });

    it('should remove a service successfully', () => {
      const serviceData = {
        name: 'Test Service',
        url: 'http://localhost:3000',
        health: 'healthy',
        weight: 1,
        maxConnections: 100,
        isActive: true,
      };

      const serviceId = gateway.addService(serviceData);
      expect(gateway.getService(serviceId)).toBeDefined();

      const removed = gateway.removeService(serviceId);
      expect(removed).toBe(true);
      expect(gateway.getService(serviceId)).toBeUndefined();
    });

    it('should get all services', () => {
      const service1 = {
        name: 'Service 1',
        url: 'http://localhost:3001',
        health: 'healthy',
        weight: 1,
        maxConnections: 100,
        isActive: true,
      };

      const service2 = {
        name: 'Service 2',
        url: 'http://localhost:3002',
        health: 'healthy',
        weight: 2,
        maxConnections: 200,
        isActive: true,
      };

      gateway.addService(service1);
      gateway.addService(service2);

      const services = gateway.getAllServices();
      expect(services).toHaveLength(4); // 2 default + 2 added
      expect(services.some(s => s.name === 'Service 1')).toBe(true);
      expect(services.some(s => s.name === 'Service 2')).toBe(true);
    });
  });

  describe('Route Management', () => {
    it('should add a route successfully', () => {
      const routeData = {
        name: 'Test Route',
        path: '/test',
        method: 'GET',
        serviceId: 'service_1',
        priority: 100,
        conditions: [],
        isActive: true,
      };

      const routeId = gateway.addRoute(routeData);
      expect(routeId).toBeDefined();
      expect(routeId).toMatch(/^route_\d+_[a-z0-9]+$/);

      const route = gateway.getRoute(routeId);
      expect(route).toBeDefined();
      expect(route?.name).toBe('Test Route');
      expect(route?.path).toBe('/test');
      expect(route?.method).toBe('GET');
      expect(route?.serviceId).toBe('service_1');
      expect(route?.priority).toBe(100);
      expect(route?.isActive).toBe(true);
    });

    it('should remove a route successfully', () => {
      const routeData = {
        name: 'Test Route',
        path: '/test',
        method: 'GET',
        serviceId: 'service_1',
        priority: 100,
        conditions: [],
        isActive: true,
      };

      const routeId = gateway.addRoute(routeData);
      expect(gateway.getRoute(routeId)).toBeDefined();

      const removed = gateway.removeRoute(routeId);
      expect(removed).toBe(true);
      expect(gateway.getRoute(routeId)).toBeUndefined();
    });

    it('should get all routes', () => {
      const route1 = {
        name: 'Route 1',
        path: '/route1',
        method: 'GET',
        serviceId: 'service_1',
        priority: 100,
        conditions: [],
        isActive: true,
      };

      const route2 = {
        name: 'Route 2',
        path: '/route2',
        method: 'POST',
        serviceId: 'service_2',
        priority: 90,
        conditions: [],
        isActive: true,
      };

      gateway.addRoute(route1);
      gateway.addRoute(route2);

      const routes = gateway.getAllRoutes();
      expect(routes).toHaveLength(5); // 3 default + 2 added
      expect(routes.some(r => r.name === 'Route 1')).toBe(true);
      expect(routes.some(r => r.name === 'Route 2')).toBe(true);
    });
  });

  describe('Route Finding', () => {
    beforeEach(() => {
      // Add test routes
      gateway.addRoute({
        name: 'Exact Match',
        path: '/api/users',
        method: 'GET',
        serviceId: 'service_1',
        priority: 100,
        conditions: [],
        isActive: true,
      });

      gateway.addRoute({
        name: 'Dynamic Route',
        path: '/api/users/:id',
        method: 'GET',
        serviceId: 'service_2',
        priority: 90,
        conditions: [],
        isActive: true,
      });

      gateway.addRoute({
        name: 'Header Condition',
        path: '/api/admin',
        method: 'GET',
        serviceId: 'service_3',
        priority: 80,
        conditions: [{
          type: 'header',
          field: 'x-admin',
          operator: 'equals',
          value: 'true',
        }],
        isActive: true,
      });
    });

    it('should find exact path match', () => {
      const route = gateway.findRoute('/api/users', 'GET');
      expect(route).toBeDefined();
      expect(route?.name).toBe('Exact Match');
    });

    it('should find dynamic path match', () => {
      const route = gateway.findRoute('/api/users/123', 'GET');
      expect(route).toBeDefined();
      expect(route?.name).toBe('Dynamic Route');
    });

    it('should find route with header condition', () => {
      const headers = { 'x-admin': 'true' };
      const route = gateway.findRoute('/api/admin', 'GET', headers);
      expect(route).toBeDefined();
      expect(route?.name).toBe('Header Condition');
    });

    it('should not find route without matching header condition', () => {
      const headers = { 'x-admin': 'false' };
      const route = gateway.findRoute('/api/admin', 'GET', headers);
      expect(route).toBeNull();
    });

    it('should return null for non-matching path', () => {
      const route = gateway.findRoute('/api/nonexistent', 'GET');
      expect(route).toBeNull();
    });

    it('should return null for non-matching method', () => {
      const route = gateway.findRoute('/api/users', 'POST');
      expect(route).toBeNull();
    });
  });

  describe('Load Balancing', () => {
    beforeEach(() => {
      // Add test services
      gateway.addService({
        name: 'Service 1',
        url: 'http://localhost:3001',
        health: 'healthy',
        weight: 1,
        maxConnections: 100,
        isActive: true,
      });

      gateway.addService({
        name: 'Service 2',
        url: 'http://localhost:3002',
        health: 'healthy',
        weight: 2,
        maxConnections: 200,
        isActive: true,
      });

      gateway.addService({
        name: 'Service 3',
        url: 'http://localhost:3003',
        health: 'unhealthy',
        weight: 1,
        maxConnections: 100,
        isActive: true,
      });
    });

    it('should select service using round-robin strategy', () => {
      const serviceIds = ['service_1', 'service_2'];
      const service1 = gateway.selectService(serviceIds);
      const service2 = gateway.selectService(serviceIds);
      const service3 = gateway.selectService(serviceIds);

      expect(service1).toBeDefined();
      expect(service2).toBeDefined();
      expect(service3).toBeDefined();
      // Should cycle through services
      expect(service1?.id).not.toBe(service2?.id);
    });

    it('should not select unhealthy services', () => {
      const serviceIds = ['service_1', 'service_3']; // service_3 is unhealthy
      const service = gateway.selectService(serviceIds);
      
      expect(service).toBeDefined();
      expect(service?.health).toBe('healthy');
      expect(service?.id).toBe('service_1');
    });

    it('should return null when no healthy services available', () => {
      const serviceIds = ['service_3']; // Only unhealthy service
      const service = gateway.selectService(serviceIds);
      
      expect(service).toBeNull();
    });
  });

  describe('Metrics and Stats', () => {
    it('should record request metrics', () => {
      const serviceId = 'service_1';
      
      gateway.recordRequest(serviceId, 100, true);
      gateway.recordRequest(serviceId, 200, false);
      gateway.recordRequest(serviceId, 150, true);

      const stats = gateway.getStats();
      expect(stats.totalRequests).toBe(3);
      expect(stats.errorRate).toBeCloseTo(1/3, 2);
      expect(stats.averageResponseTime).toBe(150);
    });

    it('should calculate correct error rate', () => {
      const serviceId = 'service_1';
      
      // 5 successful requests
      for (let i = 0; i < 5; i++) {
        gateway.recordRequest(serviceId, 100, true);
      }
      
      // 2 failed requests
      for (let i = 0; i < 2; i++) {
        gateway.recordRequest(serviceId, 200, false);
      }

      const stats = gateway.getStats();
      expect(stats.totalRequests).toBe(7);
      expect(stats.errorRate).toBeCloseTo(2/7, 2);
    });

    it('should return correct service and route counts', () => {
      const stats = gateway.getStats();
      expect(stats.servicesCount).toBe(2); // Default services
      expect(stats.routesCount).toBe(3); // Default routes
    });
  });

  describe('Path Matching', () => {
    it('should match exact paths', () => {
      const route = gateway.findRoute('/health', 'GET');
      expect(route).toBeDefined();
      expect(route?.path).toBe('/health');
    });

    it('should match dynamic paths with parameters', () => {
      gateway.addRoute({
        name: 'User Profile',
        path: '/users/:id/profile',
        method: 'GET',
        serviceId: 'service_1',
        priority: 100,
        conditions: [],
        isActive: true,
      });

      const route = gateway.findRoute('/users/123/profile', 'GET');
      expect(route).toBeDefined();
      expect(route?.name).toBe('User Profile');
    });

    it('should not match paths with different segment counts', () => {
      gateway.addRoute({
        name: 'User Profile',
        path: '/users/:id/profile',
        method: 'GET',
        serviceId: 'service_1',
        priority: 100,
        conditions: [],
        isActive: true,
      });

      const route = gateway.findRoute('/users/123', 'GET');
      expect(route).toBeNull();
    });
  });

  describe('Condition Matching', () => {
    beforeEach(() => {
      gateway.addRoute({
        name: 'Query Condition',
        path: '/api/search',
        method: 'GET',
        serviceId: 'service_1',
        priority: 100,
        conditions: [{
          type: 'query',
          field: 'q',
          operator: 'contains',
          value: 'test',
        }],
        isActive: true,
      });
    });

    it('should match query conditions', () => {
      const query = { q: 'test query' };
      const route = gateway.findRoute('/api/search', 'GET', {}, query);
      expect(route).toBeDefined();
      expect(route?.name).toBe('Query Condition');
    });

    it('should not match when query condition fails', () => {
      const query = { q: 'other query' };
      const route = gateway.findRoute('/api/search', 'GET', {}, query);
      expect(route).toBeNull();
    });

    it('should handle regex conditions', () => {
      gateway.addRoute({
        name: 'Regex Condition',
        path: '/api/version',
        method: 'GET',
        serviceId: 'service_1',
        priority: 100,
        conditions: [{
          type: 'header',
          field: 'user-agent',
          operator: 'regex',
          value: '^Mozilla/.*',
        }],
        isActive: true,
      });

      const headers = { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' };
      const route = gateway.findRoute('/api/version', 'GET', headers);
      expect(route).toBeDefined();
      expect(route?.name).toBe('Regex Condition');
    });
  });
});
