'use client';

import { useState, useEffect } from 'react';

interface ServiceInstance {
  id: string;
  name: string;
  version: string;
  host: string;
  port: number;
  url: string;
  health: 'healthy' | 'unhealthy' | 'degraded';
  status: 'online' | 'offline' | 'maintenance';
  metadata: {
    environment: string;
    region: string;
    zone: string;
    tags: string[];
    capabilities: string[];
    load: number;
    memory: number;
    cpu: number;
    endpoints: Array<{
      path: string;
      method: string;
      description: string;
      version: string;
      deprecated: boolean;
    }>;
  };
  lastHeartbeat: string;
  createdAt: string;
  updatedAt: string;
}

interface ServiceMeshStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  circuitBreakers: any[];
}

interface ServiceRegistryStats {
  totalServices: number;
  healthyServices: number;
  onlineServices: number;
}

interface MicroservicesStats {
  serviceMesh: ServiceMeshStats;
  serviceRegistry: ServiceRegistryStats;
}

export default function MicroservicesStatus(): void {
  const [services, setServices] = useState<ServiceInstance[]>([]);
  const [stats, setStats] = useState<MicroservicesStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testService, setTestService] = useState({
    name: 'test-service',
    version: '1.0.0',
    host: 'localhost',
    port: 8080,
    url: 'http://localhost:8080',
    health: 'healthy' as const,
    status: 'online' as const,
    metadata: {
      environment: 'development',
      region: 'us-east-1',
      zone: 'zone-a',
      tags: ['test', 'demo'],
      capabilities: ['rest', 'api'],
      load: 0,
      memory: 256,
      cpu: 10,
      endpoints: [
        {
          path: '/health',
          method: 'GET',
          description: 'Health check',
          version: '1.0.0',
          deprecated: false,
        },
      ],
    },
  });

  useEffect(() => {
    fetchMicroservicesData();
    const interval = setInterval(fetchMicroservicesData, 30000); // Actualizar cada 30 segundos
    return () => clearInterval(interval);
  }, []);

  const fetchMicroservicesData = async () => {
    try {
      setLoading(true);

      // Obtener servicios
      const servicesResponse = await fetch('/api/microservices/services');
      if (servicesResponse.ok) {
        const servicesData = await servicesResponse.json();
        setServices(servicesData.data.services);
      }

      // Obtener estadísticas
      const statsResponse = await fetch('/api/microservices/stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.data);
      }

      setError(null);
    } catch (err) {
      setError('Failed to fetch microservices data');
      console.error('Error fetching microservices data:', err);
    } finally {
      setLoading(false);
    }
  };

  const registerTestService = async () => {
    try {
      const response = await fetch('/api/microservices/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testService),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Service registered successfully!\nService ID: ${result.data.serviceId}`);
        fetchMicroservicesData(); // Refresh data
      } else {
        const error = await response.json();
        alert(`Service registration failed: ${error.error}`);
      }
    } catch (err) {
      console.error('Error registering service:', err);
      alert('Error registering service');
    }
  };

  const testServiceRequest = async () => {
    try {
      const response = await fetch('http://localhost:4000/v1/microservices/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serviceName: 'api-express',
          path: '/health',
          method: 'GET',
          headers: {},
        }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Service request successful!\nStatus: ${result.data.status}\nDuration: ${result.data.duration}ms`);
      } else {
        const error = await response.json();
        alert(`Service request failed: ${error.error}`);
      }
    } catch (err) {
      console.error('Error testing service request:', err);
      alert('Error testing service request');
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-600';
      case 'unhealthy': return 'text-red-600';
      case 'degraded': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-600';
      case 'offline': return 'text-red-600';
      case 'maintenance': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (;
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">🔗 Microservices & Service Mesh</h3>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (;
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">🔗 Microservices & Service Mesh</h3>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {stats && (
        <div className="mb-6">
          <h4 className="font-medium text-gray-700 mb-3">System Statistics</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h5 className="font-medium text-sm text-gray-600 mb-2">Service Registry</h5>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">{stats.serviceRegistry.totalServices}</div>
                  <div className="text-gray-500">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">{stats.serviceRegistry.healthyServices}</div>
                  <div className="text-gray-500">Healthy</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-600">{stats.serviceRegistry.onlineServices}</div>
                  <div className="text-gray-500">Online</div>
                </div>
              </div>
            </div>
            <div>
              <h5 className="font-medium text-sm text-gray-600 mb-2">Service Mesh</h5>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">{stats.serviceMesh.totalRequests}</div>
                  <div className="text-gray-500">Requests</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">{stats.serviceMesh.successfulRequests}</div>
                  <div className="text-gray-500">Success</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-600">{stats.serviceMesh.averageResponseTime.toFixed(0)}ms</div>
                  <div className="text-gray-500">Avg Time</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6">
        <h4 className="font-medium text-gray-700 mb-3">Test Operations</h4>
        <div className="space-y-3">
          <div className="border rounded p-3">
            <h5 className="font-medium mb-2">Register Test Service</h5>
            <div className="text-xs text-gray-600 mb-2">
              Name: {testService.name} | Version: {testService.version}
            </div>
            <button
              onClick={registerTestService}
              className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-3 py-1 rounded"
            >
              Register Service
            </button>
          </div>

          <div className="border rounded p-3">
            <h5 className="font-medium mb-2">Test Service Request</h5>
            <div className="text-xs text-gray-600 mb-2">
              Service: api-express | Path: /health
            </div>
            <button
              onClick={testServiceRequest}
              className="bg-green-500 hover:bg-green-600 text-white text-sm px-3 py-1 rounded"
            >
              Test Request
            </button>
          </div>
        </div>
      </div>

      {services.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium text-gray-700 mb-3">Registered Services ({services.length})</h4>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {services.map((service) => (
              <div key={service.id} className="border rounded p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="font-medium">{service.name}</h5>
                    <p className="text-sm text-gray-500">{service.url}</p>
                    <p className="text-xs text-gray-400">v{service.version} | {service.metadata.environment}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-medium ${getHealthColor(service.health)}`}>
                      {service.health}
                    </span>
                    <div className={`text-xs ${getStatusColor(service.status)}`}>
                      {service.status}
                    </div>
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                  <div>Load: {service.metadata.load}%</div>
                  <div>Memory: {service.metadata.memory}MB</div>
                  <div>CPU: {service.metadata.cpu}%</div>
                </div>
                <div className="mt-2">
                  <div className="text-xs text-gray-500">Tags: {service.metadata.tags.join(', ')}</div>
                  <div className="text-xs text-gray-500">Capabilities: {service.metadata.capabilities.join(', ')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-xs text-gray-500">
        <p>🔗 Service discovery with health checks and load balancing</p>
        <p>🔄 Service mesh with circuit breakers and retry logic</p>
        <p>📊 Real-time monitoring and statistics</p>
        <p>⚡ Automatic service registration and deregistration</p>
      </div>
    </div>
  );
}
