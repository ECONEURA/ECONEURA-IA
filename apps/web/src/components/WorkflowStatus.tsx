'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

// ============================================================================
// TIPOS
// ============================================================================

interface WorkflowStats {
  totalWorkflows: number;
  totalInstances: number;
  workflowsByType: {
    bpmn: number;
    state_machine: number;
  };
  instancesByStatus: {
    running: number;
    completed: number;
    failed: number;
    paused: number;
    cancelled: number;
  };
  averageExecutionTime: number;
  successRate: number;
  recentActivity: Array<{
    workflowId: string;
    workflowName: string;
    instanceId: string;
    action: string;
    timestamp: string;
  }>;
}

interface Workflow {
  id: string;
  name: string;
  type: 'bpmn' | 'state_machine';
  status: 'draft' | 'active' | 'inactive' | 'archived';
  version: number;
  metadata: {
    category?: string;
    tags?: string[];
    description?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface WorkflowInstance {
  id: string;
  workflowId: string;
  status: 'running' | 'completed' | 'failed' | 'paused' | 'cancelled';
  currentElement?: string;
  currentState?: string;
  startedAt: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function WorkflowStatus(): void {
  const [stats, setStats] = useState<WorkflowStats | null>(null);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [instances, setInstances] = useState<WorkflowInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);

  // ============================================================================
  // EFECTOS
  // ============================================================================

  useEffect(() => {
    fetchWorkflowData();
    const interval = setInterval(fetchWorkflowData, 30000); // Actualizar cada 30 segundos
    return () => clearInterval(interval);
  }, []);

  // ============================================================================
  // FUNCIONES
  // ============================================================================

  const fetchWorkflowData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener estadísticas
      const statsResponse = await fetch('/api/workflows/stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.data);
      }

      // Obtener workflows
      const workflowsResponse = await fetch('/api/workflows');
      if (workflowsResponse.ok) {
        const workflowsData = await workflowsResponse.json();
        setWorkflows(workflowsData.data);
      }

      // Obtener instancias
      const instancesResponse = await fetch('/api/workflows/instances');
      if (instancesResponse.ok) {
        const instancesData = await instancesResponse.json();
        setInstances(instancesData.data);
      }

    } catch (err) {
      console.error('Error fetching workflow data:', err);
      setError('Failed to fetch workflow data');
    } finally {
      setLoading(false);
    }
  };

  const startWorkflow = async (workflowId: string) => {
    try {
      const response = await fetch(`/api/workflows/${workflowId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          context: { userId: 'demo-user', orgId: 'demo-org' },
          metadata: { source: 'web-ui' },
        }),
      });

      if (response.ok) {
        await fetchWorkflowData(); // Recargar datos
      } else {
        const errorData = await response.json();
        setError(`Failed to start workflow: ${errorData.error}`);
      }
    } catch (err) {
      console.error('Error starting workflow:', err);
      setError('Failed to start workflow');
    }
  };

  const pauseInstance = async (instanceId: string) => {
    try {
      const response = await fetch(`/api/workflows/instances/${instanceId}/pause`, {
        method: 'POST',
      });

      if (response.ok) {
        await fetchWorkflowData();
      } else {
        const errorData = await response.json();
        setError(`Failed to pause instance: ${errorData.error}`);
      }
    } catch (err) {
      console.error('Error pausing instance:', err);
      setError('Failed to pause instance');
    }
  };

  const resumeInstance = async (instanceId: string) => {
    try {
      const response = await fetch(`/api/workflows/instances/${instanceId}/resume`, {
        method: 'POST',
      });

      if (response.ok) {
        await fetchWorkflowData();
      } else {
        const errorData = await response.json();
        setError(`Failed to resume instance: ${errorData.error}`);
      }
    } catch (err) {
      console.error('Error resuming instance:', err);
      setError('Failed to resume instance');
    }
  };

  const cancelInstance = async (instanceId: string) => {
    try {
      const response = await fetch(`/api/workflows/instances/${instanceId}/cancel`, {
        method: 'POST',
      });

      if (response.ok) {
        await fetchWorkflowData();
      } else {
        const errorData = await response.json();
        setError(`Failed to cancel instance: ${errorData.error}`);
      }
    } catch (err) {
      console.error('Error cancelling instance:', err);
      setError('Failed to cancel instance');
    }
  };

  // ============================================================================
  // FUNCIONES AUXILIARES
  // ============================================================================

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      case 'paused':
        return 'bg-yellow-500';
      case 'cancelled':
        return 'bg-gray-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getWorkflowTypeColor = (type: string) => {
    switch (type) {
      case 'bpmn':
        return 'bg-purple-500';
      case 'state_machine':
        return 'bg-indigo-500';
      default:
        return 'bg-gray-400';
    }
  };

  const formatDuration = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // ============================================================================
  // RENDERIZADO
  // ============================================================================

  if (loading) {
    return (;
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Workflow Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-2">Loading workflow data...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (;
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Workflow Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                  <div className="mt-4">
                    <Button onClick={fetchWorkflowData} variant="outline" size="sm">
                      Retry
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (;
    <div className="space-y-6">
      {/* Estadísticas Generales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Workflow Statistics
            <Button onClick={fetchWorkflowData} variant="outline" size="sm">
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.totalWorkflows}</div>
                <div className="text-sm text-gray-600">Total Workflows</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.totalInstances}</div>
                <div className="text-sm text-gray-600">Total Instances</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.successRate.toFixed(1)}%</div>
                <div className="text-sm text-gray-600">Success Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {formatDuration(stats.averageExecutionTime)}
                </div>
                <div className="text-sm text-gray-600">Avg Execution Time</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Distribución por Tipo */}
      <Card>
        <CardHeader>
          <CardTitle>Workflows by Type</CardTitle>
        </CardHeader>
        <CardContent>
          {stats && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Badge className={`${getWorkflowTypeColor('bpmn')} text-white`}>BPMN</Badge>
                  <span className="ml-2">{stats.workflowsByType.bpmn} workflows</span>
                </div>
                <div className="text-sm text-gray-600">
                  {((stats.workflowsByType.bpmn / stats.totalWorkflows) * 100).toFixed(1)}%
                </div>
              </div>
              <Progress value={(stats.workflowsByType.bpmn / stats.totalWorkflows) * 100} className="h-2" />

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Badge className={`${getWorkflowTypeColor('state_machine')} text-white`}>State Machine</Badge>
                  <span className="ml-2">{stats.workflowsByType.state_machine} workflows</span>
                </div>
                <div className="text-sm text-gray-600">
                  {((stats.workflowsByType.state_machine / stats.totalWorkflows) * 100).toFixed(1)}%
                </div>
              </div>
              <Progress value={(stats.workflowsByType.state_machine / stats.totalWorkflows) * 100} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instancias por Status */}
      <Card>
        <CardHeader>
          <CardTitle>Instances by Status</CardTitle>
        </CardHeader>
        <CardContent>
          {stats && (
            <div className="space-y-3">
              {Object.entries(stats.instancesByStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(status)} mr-2`}></div>
                    <span className="capitalize">{status}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{count}</span>
                    <span className="text-sm text-gray-600">
                      ({((count / stats.totalInstances) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Workflows Disponibles */}
      <Card>
        <CardHeader>
          <CardTitle>Available Workflows</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {workflows.map((workflow) => (
              <div key={workflow.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Badge className={`${getWorkflowTypeColor(workflow.type)} text-white`}>
                      {workflow.type.toUpperCase()}
                    </Badge>
                    <div>
                      <h3 className="font-medium">{workflow.name}</h3>
                      <p className="text-sm text-gray-600">
                        v{workflow.version} • {workflow.metadata.category || 'No category'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={workflow.status === 'active' ? 'default' : 'secondary'}>
                      {workflow.status}
                    </Badge>
                    {workflow.status === 'active' && (
                      <Button
                        onClick={() => startWorkflow(workflow.id)}
                        size="sm"
                        variant="outline"
                      >
                        Start
                      </Button>
                    )}
                  </div>
                </div>
                {workflow.metadata.description && (
                  <p className="text-sm text-gray-600 mt-2">{workflow.metadata.description}</p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Instancias Activas */}
      <Card>
        <CardHeader>
          <CardTitle>Active Instances</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {instances
              .filter((instance) => ['running', 'paused'].includes(instance.status))
              .map((instance) => {
                const workflow = workflows.find((w) => w.id === instance.workflowId);
                return (;
                  <div key={instance.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">
                          {workflow?.name || 'Unknown Workflow'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Instance: {instance.id.slice(0, 8)}...
                        </p>
                        <p className="text-sm text-gray-600">
                          Started: {formatDate(instance.startedAt)}
                        </p>
                        {instance.currentElement && (
                          <p className="text-sm text-gray-600">
                            Current Element: {instance.currentElement}
                          </p>
                        )}
                        {instance.currentState && (
                          <p className="text-sm text-gray-600">
                            Current State: {instance.currentState}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={`${getStatusColor(instance.status)} text-white`}>
                          {instance.status}
                        </Badge>
                        <div className="flex space-x-1">
                          {instance.status === 'running' && (
                            <Button
                              onClick={() => pauseInstance(instance.id)}
                              size="sm"
                              variant="outline"
                            >
                              Pause
                            </Button>
                          )}
                          {instance.status === 'paused' && (
                            <Button
                              onClick={() => resumeInstance(instance.id)}
                              size="sm"
                              variant="outline"
                            >
                              Resume
                            </Button>
                          )}
                          <Button
                            onClick={() => cancelInstance(instance.id)}
                            size="sm"
                            variant="destructive"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            {instances.filter((instance) => ['running', 'paused'].includes(instance.status)).length === 0 && (
              <p className="text-gray-500 text-center py-4">No active instances</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actividad Reciente */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats?.recentActivity.slice(0, 10).map((activity, index) => (
              <div key={index} className="flex items-center space-x-3 text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <span className="font-medium">{activity.action}</span>
                  <span className="text-gray-600"> on </span>
                  <span className="font-medium">{activity.workflowName}</span>
                </div>
                <div className="text-gray-500">
                  {formatDate(activity.timestamp)}
                </div>
              </div>
            ))}
            {(!stats?.recentActivity || stats.recentActivity.length === 0) && (
              <p className="text-gray-500 text-center py-4">No recent activity</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
