'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Activity,
  Cpu,
  HardDrive,
  MemoryStick,
  Network,
  Server,
  Zap
} from 'lucide-react';

interface SystemMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  uptime: string;
  requests: number;
  errors: number;
  responseTime: number;
}

export default function AdvancedMonitoringDashboard() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/metrics/system');
        if (response.ok) {
          const data = await response.json();
          setMetrics(data);
        }
      } catch (error) {
        console.error('Error fetching metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-2 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!metrics) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <p className="text-muted-foreground">No se pudieron cargar las métricas del sistema</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return 'destructive';
    if (value >= thresholds.warning) return 'secondary';
    return 'default';
  };

  const getStatusVariant = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return 'destructive';
    if (value >= thresholds.warning) return 'secondary';
    return 'default';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Monitoreo Avanzado del Sistema</h2>
        <Badge variant="outline" className="flex items-center gap-2">
          <Activity className="h-3 w-3" />
          En vivo
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* CPU Usage */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPU</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.cpu.toFixed(1)}%</div>
            <Progress value={metrics.cpu} className="mt-2" />
            <Badge
              variant={getStatusVariant(metrics.cpu, { warning: 70, critical: 90 })}
              className="mt-2"
            >
              {metrics.cpu < 70 ? 'Normal' : metrics.cpu < 90 ? 'Alto' : 'Crítico'}
            </Badge>
          </CardContent>
        </Card>

        {/* Memory Usage */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memoria</CardTitle>
            <MemoryStick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.memory.toFixed(1)}%</div>
            <Progress value={metrics.memory} className="mt-2" />
            <Badge
              variant={getStatusVariant(metrics.memory, { warning: 80, critical: 95 })}
              className="mt-2"
            >
              {metrics.memory < 80 ? 'Normal' : metrics.memory < 95 ? 'Alto' : 'Crítico'}
            </Badge>
          </CardContent>
        </Card>

        {/* Disk Usage */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disco</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.disk.toFixed(1)}%</div>
            <Progress value={metrics.disk} className="mt-2" />
            <Badge
              variant={getStatusVariant(metrics.disk, { warning: 85, critical: 95 })}
              className="mt-2"
            >
              {metrics.disk < 85 ? 'Normal' : metrics.disk < 95 ? 'Alto' : 'Crítico'}
            </Badge>
          </CardContent>
        </Card>

        {/* Network Usage */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Red</CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.network.toFixed(1)}%</div>
            <Progress value={metrics.network} className="mt-2" />
            <Badge
              variant={getStatusVariant(metrics.network, { warning: 75, critical: 90 })}
              className="mt-2"
            >
              {metrics.network < 75 ? 'Normal' : metrics.network < 90 ? 'Alto' : 'Crítico'}
            </Badge>
          </CardContent>
        </Card>

        {/* System Uptime */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tiempo Activo</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.uptime}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Sistema operativo
            </p>
          </CardContent>
        </Card>

        {/* Requests per Minute */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Solicitudes/min</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.requests}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Último minuto
            </p>
          </CardContent>
        </Card>

        {/* Error Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Error</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.errors}%</div>
            <Progress value={metrics.errors} className="mt-2" />
            <Badge
              variant={getStatusVariant(metrics.errors, { warning: 5, critical: 10 })}
              className="mt-2"
            >
              {metrics.errors < 5 ? 'Excelente' : metrics.errors < 10 ? 'Aceptable' : 'Crítico'}
            </Badge>
          </CardContent>
        </Card>

        {/* Response Time */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tiempo de Respuesta</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.responseTime}ms</div>
            <p className="text-xs text-muted-foreground mt-1">
              Promedio
            </p>
            <Badge
              variant={getStatusVariant(metrics.responseTime, { warning: 1000, critical: 3000 })}
              className="mt-2"
            >
              {metrics.responseTime < 1000 ? 'Excelente' : metrics.responseTime < 3000 ? 'Bueno' : 'Lento'}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Additional monitoring sections can be added here */}
      <Card>
        <CardHeader>
          <CardTitle>Estado de Servicios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm">API Backend</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm">Base de Datos</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm">Cache Redis</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}