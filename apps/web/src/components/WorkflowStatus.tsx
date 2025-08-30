'use client';

import { useState, useEffect } from 'react';

interface WorkflowDefinition {
  id: string;
  name: string;
  version: string;
  description: string;
  type: 'bpmn' | 'state-machine';
  definition: any;
  metadata: WorkflowMetadata;
  createdAt: string;
  updatedAt: string;
}

interface WorkflowMetadata {
  author: string;
  category: string;
  tags: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  timeout: number;
  retryPolicy: RetryPolicy;
  notifications: NotificationConfig[];
}

interface RetryPolicy {
  maxRetries: number;
  backoffStrategy: 'fixed' | 'exponential' | 'linear';
  initialDelay: number;
  maxDelay: number;
}

interface NotificationConfig {
  type: 'email' | 'webhook' | 'slack' | 'sms';
  trigger: 'start' | 'complete' | 'error' | 'timeout';
  config: Record<string, any>;
}

interface WorkflowInstance {
  id: string;
  workflowId: string;
  status: 'running' | 'completed' | 'failed' | 'paused' | 'cancelled';
  currentState: string;
  context: Record<string, any>;
  history: WorkflowHistoryItem[];
  metadata: WorkflowInstanceMetadata;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
}

interface WorkflowHistoryItem {
  id: string;
  timestamp: string;
  type: 'state_change' | 'action_executed' | 'error' | 'timeout' | 'user_action';
  state?: string;
  action?: string;
  data: Record<string, any>;
  message: string;
}

interface WorkflowInstanceMetadata {
  userId: string;
  organizationId: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  tags: string[];
  customData: Record<string, any>;
}

interface WorkflowStats {
  totalWorkflows: number;
  totalInstances: number;
  runningInstances: number;
  completedInstances: number;
  failedInstances: number;
  averageExecutionTime: number;
  workflowsByType: Record<string, number>;
  instancesByStatus: Record<string, number>;
}

export default function WorkflowStatus() {
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([]);
  const [instances, setInstances] = useState<WorkflowInstance[]>([]);
  const [stats, setStats] = useState<WorkflowStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newWorkflow, setNewWorkflow] = useState({
    name: 'Test Workflow',
    version: '1.0.0',
    description: 'Test workflow description',
    type: 'bpmn' as const,
    definition: {
      elements: [],
      flows: [],
      startEvent: 'start',
      endEvents: ['end'],
    },
    metadata: {
      author: 'System',
      category: 'Test',
      tags: ['test'],
      priority: 'medium' as const,
      timeout: 300000,
      retryPolicy: {
        maxRetries: 3,
        backoffStrategy: 'exponential' as const,
        initialDelay: 1000,
        maxDelay: 10000,
      },
      notifications: [],
    },
  });

  useEffect(() => {
    fetchWorkflowData();
    const interval = setInterval(fetchWorkflowData, 30000); // Actualizar cada 30 segundos
    return () => clearInterval(interval);
  }, []);

  const fetchWorkflowData = async () => {
    try {
      setLoading(true);
      
      // Obtener workflows
      const workflowsResponse = await fetch('/api/workflows');
      if (workflowsResponse.ok) {
        const workflowsData = await workflowsResponse.json();
        setWorkflows(workflowsData.data.workflows);
      }

      // Obtener instancias desde la API principal
      const instancesResponse = await fetch('http://localhost:4000/v1/workflows/instances');
      if (instancesResponse.ok) {
        const instancesData = await instancesResponse.json();
        setInstances(instancesData.data.instances);
      }

      // Obtener estadísticas
      const statsResponse = await fetch('/api/workflows/stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.data);
      }

      setError(null);
    } catch (err) {
      setError('Failed to fetch workflow data');
      console.error('Error fetching workflow data:', err);
    } finally {
      setLoading(false);
    }
  };

  const createWorkflow = async () => {
    try {
      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newWorkflow),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Workflow created successfully!\nWorkflow ID: ${result.data.workflowId}`);
        fetchWorkflowData(); // Refresh data
      } else {
        const error = await response.json();
        alert(`Workflow creation failed: ${error.error}`);
      }
    } catch (err) {
      console.error('Error creating workflow:', err);
      alert('Error creating workflow');
    }
  };

  const startWorkflow = async (workflowId: string) => {
    try {
      const response = await fetch(`http://localhost:4000/v1/workflows/${workflowId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          context: {
            userId: 'test-user-123',
            userType: 'premium',
            orderId: 'order-456',
          },
          metadata: {
            userId: 'test-user-123',
            organizationId: 'test-org-456',
            priority: 'medium',
            tags: ['test'],
            customData: {},
          },
        }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Workflow started successfully!\nInstance ID: ${result.data.instanceId}`);
        fetchWorkflowData(); // Refresh data
      } else {
        const error = await response.json();
        alert(`Workflow start failed: ${error.error}`);
      }
    } catch (err) {
      console.error('Error starting workflow:', err);
      alert('Error starting workflow');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-green-600';
      case 'completed': return 'text-blue-600';
      case 'failed': return 'text-red-600';
      case 'paused': return 'text-yellow-600';
      case 'cancelled': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'bpmn': return 'text-purple-600';
      case 'state-machine': return 'text-indigo-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">🔄 Workflows & BPMN</h3>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">🔄 Workflows & BPMN</h3>
      
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
              <h5 className="font-medium text-sm text-gray-600 mb-2">Workflows</h5>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">{stats.totalWorkflows}</div>
                  <div className="text-gray-500">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-600">{stats.workflowsByType.bpmn || 0}</div>
                  <div className="text-gray-500">BPMN</div>
                </div>
              </div>
            </div>
            <div>
              <h5 className="font-medium text-sm text-gray-600 mb-2">Instances</h5>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">{stats.runningInstances}</div>
                  <div className="text-gray-500">Running</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">{stats.completedInstances}</div>
                  <div className="text-gray-500">Completed</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6">
        <h4 className="font-medium text-gray-700 mb-3">Create Workflow</h4>
        <div className="border rounded p-3">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
              <input
                type="text"
                value={newWorkflow.name}
                onChange={(e) => setNewWorkflow({ ...newWorkflow, name: e.target.value })}
                className="w-full px-2 py-1 text-sm border rounded"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
              <select
                value={newWorkflow.type}
                onChange={(e) => setNewWorkflow({ ...newWorkflow, type: e.target.value as 'bpmn' | 'state-machine' })}
                className="w-full px-2 py-1 text-sm border rounded"
              >
                <option value="bpmn">BPMN</option>
                <option value="state-machine">State Machine</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
              <input
                type="text"
                value={newWorkflow.metadata.category}
                onChange={(e) => setNewWorkflow({
                  ...newWorkflow,
                  metadata: { ...newWorkflow.metadata, category: e.target.value }
                })}
                className="w-full px-2 py-1 text-sm border rounded"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Priority</label>
              <select
                value={newWorkflow.metadata.priority}
                onChange={(e) => setNewWorkflow({
                  ...newWorkflow,
                  metadata: { ...newWorkflow.metadata, priority: e.target.value as any }
                })}
                className="w-full px-2 py-1 text-sm border rounded"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
          <button
            onClick={createWorkflow}
            className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-3 py-1 rounded"
          >
            Create Workflow
          </button>
        </div>
      </div>

      {workflows.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium text-gray-700 mb-3">Workflows ({workflows.length})</h4>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {workflows.map((workflow) => (
              <div key={workflow.id} className="border rounded p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="font-medium">{workflow.name}</h5>
                    <p className="text-sm text-gray-500">{workflow.description}</p>
                    <p className="text-xs text-gray-400">
                      v{workflow.version} | Created: {new Date(workflow.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-medium ${getTypeColor(workflow.type)}`}>
                      {workflow.type.toUpperCase()}
                    </span>
                    <div className={`text-xs ${getPriorityColor(workflow.metadata.priority)}`}>
                      {workflow.metadata.priority}
                    </div>
                    <div className="text-xs text-gray-500">
                      {workflow.metadata.category}
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex justify-between items-center">
                  <div className="text-xs text-gray-500">
                    Tags: {workflow.metadata.tags.join(', ')} | 
                    Timeout: {workflow.metadata.timeout / 1000}s |
                    Retries: {workflow.metadata.retryPolicy.maxRetries}
                  </div>
                  <button
                    onClick={() => startWorkflow(workflow.id)}
                    className="bg-green-500 hover:bg-green-600 text-white text-xs px-2 py-1 rounded"
                  >
                    Start
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {instances.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium text-gray-700 mb-3">Workflow Instances ({instances.length})</h4>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {instances.map((instance) => (
              <div key={instance.id} className="border rounded p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="font-medium">Instance {instance.id.slice(-8)}</h5>
                    <p className="text-sm text-gray-500">Workflow: {instance.workflowId.slice(-8)}</p>
                    <p className="text-xs text-gray-400">
                      Created: {new Date(instance.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-medium ${getStatusColor(instance.status)}`}>
                      {instance.status.toUpperCase()}
                    </span>
                    <div className="text-xs text-gray-500">
                      State: {instance.currentState}
                    </div>
                    <div className="text-xs text-gray-400">
                      {instance.startedAt && `Started: ${new Date(instance.startedAt).toLocaleTimeString()}`}
                    </div>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="text-xs text-gray-500">
                    User: {instance.metadata.userId} | 
                    Org: {instance.metadata.organizationId} |
                    History: {instance.history.length} items
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-xs text-gray-500">
        <p>🔄 BPMN workflows with visual process modeling</p>
        <p>🏗️ State machines with complex state transitions</p>
        <p>⚡ Real-time workflow execution and monitoring</p>
        <p>📊 Comprehensive workflow statistics and analytics</p>
      </div>
    </div>
  );
}
