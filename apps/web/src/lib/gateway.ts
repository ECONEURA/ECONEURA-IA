export interface ServiceEndpoint {
  id: string;
  name: string;
  url: string;
  health: string;
  weight: number;
  maxConnections: number;
  currentConnections: number;
  responseTime: number;
  errorRate: number;
  lastHealthCheck: Date;
  isActive: boolean;
}

export interface RouteRule {
  id: string;
  name: string;
  path: string;
  method: string;
  serviceId: string;
  priority: number;
  conditions: RouteCondition[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RouteCondition {
  type: 'header' | 'query' | 'body' | 'ip' | 'user-agent';
  field: string;
  operator: 'equals' | 'contains' | 'starts_with' | 'ends_with' | 'regex';
  value: string;
}

export interface LoadBalancerConfig {
  strategy: 'round-robin' | 'least-connections' | 'weighted' | 'ip-hash' | 'response-time';
  healthCheckInterval: number;
  healthCheckTimeout: number;
  maxRetries: number;
  circuitBreakerThreshold: number;
}

export interface GatewayStats {
  totalRequests: number;
  activeConnections: number;
  averageResponseTime: number;
  errorRate: number;
  servicesCount: number;
  routesCount: number;
}

export class WebAPIGateway {
  private services: Map<string, ServiceEndpoint> = new Map();
  private routes: Map<string, RouteRule> = new Map();
  private loadBalancerConfig: LoadBalancerConfig;
  private currentIndex: number = 0;
  private requestCounts: Map<string, number> = new Map();
  private responseTimes: Map<string, number[]> = new Map();
  private errorCounts: Map<string, number> = new Map();

  constructor(config: LoadBalancerConfig) {
    this.loadBalancerConfig = config;
    console.log('Web API Gateway initialized', { config });
    this.initializeDefaultServices();
    this.initializeDefaultRoutes();
  }

  // Gestión de servicios
  addService(service: Omit<ServiceEndpoint, 'id' | 'lastHealthCheck' | 'currentConnections' | 'responseTime' | 'errorRate'>): string {
    const id = `service_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const serviceEndpoint: ServiceEndpoint = {
      ...service,
      id,
      lastHealthCheck: new Date(),
      currentConnections: 0,
      responseTime: 0,
      errorRate: 0,
    };

    this.services.set(id, serviceEndpoint);
    this.requestCounts.set(id, 0);
    this.responseTimes.set(id, []);
    this.errorCounts.set(id, 0);

    console.log('Service added to web gateway', {
      serviceId: id,
      name: service.name,
      url: service.url,
    });

    return id;
  }

  removeService(serviceId: string): boolean {
    const deleted = this.services.delete(serviceId);
    if (deleted) {
      this.requestCounts.delete(serviceId);
      this.responseTimes.delete(serviceId);
      this.errorCounts.delete(serviceId);
      console.log('Service removed from web gateway', { serviceId });
    }
    return deleted;
  }

  getService(serviceId: string): ServiceEndpoint | undefined {
    return this.services.get(serviceId);
  }

  getAllServices(): ServiceEndpoint[] {
    return Array.from(this.services.values());
  }

  // Gestión de rutas
  addRoute(routeData: Omit<RouteRule, 'id' | 'createdAt' | 'updatedAt'>): string {
    const id = `route_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const route: RouteRule = {
      ...routeData,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.routes.set(id, route);
    console.log('Route added to web gateway', {
      routeId: id,
      name: route.name,
      path: route.path,
      method: route.method,
      serviceId: route.serviceId,
    });

    return id;
  }

  removeRoute(routeId: string): boolean {
    const deleted = this.routes.delete(routeId);
    if (deleted) {
      console.log('Route removed from web gateway', { routeId });
    }
    return deleted;
  }

  getRoute(routeId: string): RouteRule | undefined {
    return this.routes.get(routeId);
  }

  getAllRoutes(): RouteRule[] {
    return Array.from(this.routes.values());
  }

  // Routing inteligente
  findRoute(path: string, method: string, headers: Record<string, string> = {}, query: Record<string, string> = {}): RouteRule | null {
    const matchingRoutes: RouteRule[] = [];

    for (const route of this.routes.values()) {
      if (!route.isActive) continue;

      // Verificar coincidencia de path y método
      if (this.matchesPath(route.path, path) && route.method.toUpperCase() === method.toUpperCase()) {
        // Verificar condiciones adicionales
        if (this.matchesConditions(route.conditions, headers, query)) {
          matchingRoutes.push(route);
        }
      }
    }

    if (matchingRoutes.length === 0) {
      return null;
    }

    // Ordenar por prioridad (mayor prioridad primero)
    matchingRoutes.sort((a, b) => b.priority - a.priority);

    return matchingRoutes[0];
  }

  // Load balancing
  selectService(serviceIds: string[], clientIp?: string): ServiceEndpoint | null {
    const availableServices = serviceIds
      .map(id => this.services.get(id))
      .filter((service): service is ServiceEndpoint => service !== undefined && service.isActive && service.health === 'healthy');

    if (availableServices.length === 0) {
      return null;
    }

    switch (this.loadBalancerConfig.strategy) {
      case 'round-robin':
        return this.roundRobinSelection(availableServices);
      case 'least-connections':
        return this.leastConnectionsSelection(availableServices);
      case 'weighted':
        return this.weightedSelection(availableServices);
      case 'ip-hash':
        return this.ipHashSelection(availableServices, clientIp);
      case 'response-time':
        return this.responseTimeSelection(availableServices);
      default:
        return availableServices[0];
    }
  }

  // Estrategias de load balancing
  private roundRobinSelection(services: ServiceEndpoint[]): ServiceEndpoint {
    const service = services[this.currentIndex % services.length];
    this.currentIndex = (this.currentIndex + 1) % services.length;
    return service;
  }

  private leastConnectionsSelection(services: ServiceEndpoint[]): ServiceEndpoint {
    return services.reduce((min, service) => 
      service.currentConnections < min.currentConnections ? service : min
    );
  }

  private weightedSelection(services: ServiceEndpoint[]): ServiceEndpoint {
    const totalWeight = services.reduce((sum, service) => sum + service.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const service of services) {
      random -= service.weight;
      if (random <= 0) {
        return service;
      }
    }
    
    return services[0];
  }

  private ipHashSelection(services: ServiceEndpoint[], clientIp?: string): ServiceEndpoint {
    if (!clientIp) {
      return services[0];
    }
    
    const hash = clientIp.split('.').reduce((acc, octet) => acc + parseInt(octet), 0);
    return services[hash % services.length];
  }

  private responseTimeSelection(services: ServiceEndpoint[]): ServiceEndpoint {
    return services.reduce((min, service) => 
      service.responseTime < min.responseTime ? service : min
    );
  }

  // Métodos de utilidad
  private matchesPath(routePath: string, requestPath: string): boolean {
    if (routePath === requestPath) {
      return true;
    }

    const routeSegments = routePath.split('/');
    const requestSegments = requestPath.split('/');

    if (routeSegments.length !== requestSegments.length) {
      return false;
    }

    for (let i = 0; i < routeSegments.length; i++) {
      if (routeSegments[i].startsWith(':')) {
        continue;
      }
      if (routeSegments[i] !== requestSegments[i]) {
        return false;
      }
    }

    return true;
  }

  private matchesConditions(conditions: RouteCondition[], headers: Record<string, string>, query: Record<string, string>): boolean {
    if (conditions.length === 0) {
      return true;
    }

    return conditions.every(condition => {
      let value: string | undefined;

      switch (condition.type) {
        case 'header':
          value = headers[condition.field.toLowerCase()];
          break;
        case 'query':
          value = query[condition.field];
          break;
        default:
          return true;
      }

      if (!value) {
        return false;
      }

      switch (condition.operator) {
        case 'equals':
          return value === condition.value;
        case 'contains':
          return value.includes(condition.value);
        case 'starts_with':
          return value.startsWith(condition.value);
        case 'ends_with':
          return value.endsWith(condition.value);
        case 'regex':
          try {
            const regex = new RegExp(condition.value);
            return regex.test(value);
          } catch {
            return false;
          }
        default:
          return false;
      }
    });
  }

  // Métricas y estadísticas
  recordRequest(serviceId: string, responseTime: number, success: boolean): void {
    const currentCount = this.requestCounts.get(serviceId) || 0;
    this.requestCounts.set(serviceId, currentCount + 1);

    const responseTimes = this.responseTimes.get(serviceId) || [];
    responseTimes.push(responseTime);
    
    if (responseTimes.length > 100) {
      responseTimes.shift();
    }
    this.responseTimes.set(serviceId, responseTimes);

    if (!success) {
      const errorCount = this.errorCounts.get(serviceId) || 0;
      this.errorCounts.set(serviceId, errorCount + 1);
    }
  }

  getStats(): GatewayStats {
    const totalRequests = Array.from(this.requestCounts.values()).reduce((sum, count) => sum + count, 0);
    const activeConnections = Array.from(this.services.values()).reduce((sum, service) => sum + service.currentConnections, 0);
    
    const allResponseTimes = Array.from(this.responseTimes.values()).flat();
    const averageResponseTime = allResponseTimes.length > 0 
      ? allResponseTimes.reduce((sum, time) => sum + time, 0) / allResponseTimes.length 
      : 0;

    const totalErrors = Array.from(this.errorCounts.values()).reduce((sum, count) => sum + count, 0);
    const errorRate = totalRequests > 0 ? totalErrors / totalRequests : 0;

    return {
      totalRequests,
      activeConnections,
      averageResponseTime,
      errorRate,
      servicesCount: this.services.size,
      routesCount: this.routes.size,
    };
  }

  // Inicialización de servicios por defecto
  private initializeDefaultServices(): void {
    const defaultServices = [
      {
        name: 'Web BFF',
        url: 'http://localhost:3000',
        health: 'healthy',
        weight: 1,
        maxConnections: 500,
        isActive: true,
      },
      {
        name: 'API Express',
        url: 'http://localhost:4000',
        health: 'healthy',
        weight: 1,
        maxConnections: 1000,
        isActive: true,
      },
    ];

    for (const serviceData of defaultServices) {
      this.addService(serviceData);
    }
  }

  // Inicialización de rutas por defecto
  private initializeDefaultRoutes(): void {
    const defaultRoutes = [
      {
        name: 'Web Dashboard',
        path: '/dashboard',
        method: 'GET',
        serviceId: 'service_1', // Web BFF
        priority: 100,
        conditions: [],
        isActive: true,
      },
      {
        name: 'Web API Routes',
        path: '/api',
        method: 'GET',
        serviceId: 'service_1', // Web BFF
        priority: 90,
        conditions: [],
        isActive: true,
      },
      {
        name: 'API Health Check',
        path: '/health',
        method: 'GET',
        serviceId: 'service_2', // API Express
        priority: 80,
        conditions: [],
        isActive: true,
      },
    ];

    for (const routeData of defaultRoutes) {
      this.addRoute(routeData);
    }
  }
}

// Configuración por defecto del load balancer
const defaultLoadBalancerConfig: LoadBalancerConfig = {
  strategy: 'round-robin',
  healthCheckInterval: 30000,
  healthCheckTimeout: 5000,
  maxRetries: 3,
  circuitBreakerThreshold: 0.5,
};

export const webApiGateway = new WebAPIGateway(defaultLoadBalancerConfig);
