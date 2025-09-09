'use client';

import { useState, useEffect } from 'react';

interface ServiceEndpoint {
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

interface RouteRule {
  id: string;
  name: string;
  path: string;
  method: string;
  serviceId: string;
  priority: number;
  conditions: any[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface GatewayStats {
  totalRequests: number;
  activeConnections: number;
  averageResponseTime: number;
  errorRate: number;
  servicesCount: number;
  routesCount: number;
}

export default function GatewayStatus(): void {
  const [stats, setStats] = useState<GatewayStats | null>(null);
  const [services, setServices] = useState<ServiceEndpoint[]>([]);
  const [routes, setRoutes] = useState<RouteRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGatewayData();
    const interval = setInterval(fetchGatewayData, 30000); // Actualizar cada 30 segundos
    return () => clearInterval(interval);
  }, []);

  const fetchGatewayData = async () => {
    try {
      setLoading(true);

      // Obtener estadísticas
      const statsResponse = await fetch('/api/gateway/stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.data);
      }

      // Obtener servicios
      const servicesResponse = await fetch('/api/gateway/services');
      if (servicesResponse.ok) {
        const servicesData = await servicesResponse.json();
        setServices(servicesData.data.services);
      }

      // Obtener rutas
      const routesResponse = await fetch('/api/gateway/routes');
      if (routesResponse.ok) {
        const routesData = await routesResponse.json();
        setRoutes(routesData.data.routes);
      }

      setError(null);
    } catch (err) {
      setError('Failed to fetch gateway data');
      console.error('Error fetching gateway data:', err);
    } finally {
      setLoading(false);
    }
  };

  const testRoute = async (path: string, method: string) => {
    try {
      const response = await fetch('/api/gateway/test-route', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path, method }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Route test: ${data.success ? 'FOUND' : 'NOT FOUND'}\nService: ${data.data.service?.name || 'N/A'}`);
      }
    } catch (err) {
      console.error('Error testing route:', err);
      alert('Error testing route');
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-600';
      case 'unhealthy': return 'text-red-600';
      default: return 'text-yellow-600';
    }
  };

  if (loading) {
    return (;
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">🌐 API Gateway</h3>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (;
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">🌐 API Gateway</h3>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {stats && (
        <div className="mb-6">
          <h4 className="font-medium text-gray-700 mb-3">Gateway Statistics</h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.totalRequests}</div>
              <div className="text-sm text-gray-500">Total Requests</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.activeConnections}</div>
              <div className="text-sm text-gray-500">Active Connections</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.averageResponseTime.toFixed(0)}ms</div>
              <div className="text-sm text-gray-500">Avg Response Time</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{(stats.errorRate * 100).toFixed(1)}%</div>
              <div className="text-sm text-gray-500">Error Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">{stats.servicesCount}</div>
              <div className="text-sm text-gray-500">Services</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-teal-600">{stats.routesCount}</div>
              <div className="text-sm text-gray-500">Routes</div>
            </div>
          </div>
        </div>
      )}

      {services.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium text-gray-700 mb-3">Services</h4>
          <div className="space-y-3">
            {services.map((service) => (
              <div key={service.id} className="border rounded p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="font-medium">{service.name}</h5>
                    <p className="text-sm text-gray-500">{service.url}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-medium ${getHealthColor(service.health)}`}>
                      {service.health}
                    </span>
                    <div className="text-xs text-gray-500">
                      {service.currentConnections}/{service.maxConnections} conn
                    </div>
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                  <div>Weight: {service.weight}</div>
                  <div>Response: {service.responseTime}ms</div>
                  <div>Errors: {(service.errorRate * 100).toFixed(1)}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {routes.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium text-gray-700 mb-3">Routes</h4>
          <div className="space-y-2">
            {routes.map((route) => (
              <div key={route.id} className="flex justify-between items-center p-2 border rounded">
                <div>
                  <span className="font-medium">{route.method}</span>
                  <span className="text-gray-600 ml-2">{route.path}</span>
                  <span className="text-sm text-gray-500 ml-2">({route.name})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs ${route.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {route.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <button
                    onClick={() => testRoute(route.path, route.method)}
                    className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-2 py-1 rounded"
                  >
                    Test
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-xs text-gray-500">
        <p>🌐 Intelligent routing with multiple load balancing strategies</p>
        <p>⚡ Health checks and circuit breaker protection</p>
        <p>📊 Real-time metrics and performance monitoring</p>
      </div>
    </div>
  );
}
