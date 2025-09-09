'use client';

import React, { useState, useEffect } from 'react';

interface Workflow {
  id: string;
  name: string;
  type: 'bpmn' | 'state_machine';
  status: 'active' | 'inactive' | 'draft';
  version: number;
  definition: any;
  actions: Array<{
    id: string;
    name: string;
    type: string;
    config: any;
    order: number;
  }>;
  metadata: {
    author: string;
    category?: string;
    tags?: string[];
    priority?: number;
    timeout?: number;
    description?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface WorkflowInstance {
  id: string;
  workflowId: string;
  status: 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  currentElement?: string;
  currentState?: string;
  context: Record<string, any>;
  metadata: Record<string, any>;
  startedAt: string;
  completedAt?: string;
  executionHistory?: Array<{
    timestamp: string;
    action: string;
    status: 'success' | 'failed' | 'skipped';
    details?: any;
  }>;
}

interface WorkflowStats {
  totalWorkflows: number;
  totalInstances: number;
  workflowsByType: Record<string, number>;
  instancesByStatus: Record<string, number>;
  averageExecutionTime: number;
  successRate: number;
}

export default function WorkflowsDashboard(): void {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [instances, setInstances] = useState<WorkflowInstance[]>([]);
  const [stats, setStats] = useState<WorkflowStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'workflows' | 'instances' | 'stats'>('workflows');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Cargar datos iniciales
  useEffect(() => {
    loadData();
  }, [selectedType, selectedStatus]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [workflowsResponse, instancesResponse, statsResponse] = await Promise.all([
        fetch(`/api/workflows?type=${selectedType !== 'all' ? selectedType : ''}&status=${selectedStatus !== 'all' ? selectedStatus : ''}`),
        fetch('/api/workflows/instances'),
        fetch('/api/workflows/stats')
      ]);

      if (workflowsResponse.ok) {
        const workflowsData = await workflowsResponse.json();
        setWorkflows(workflowsData.data || []);
      }

      if (instancesResponse.ok) {
        const instancesData = await instancesResponse.json();
        setInstances(instancesData.data || []);
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workflows data');
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
          context: {
            testParam: 'testValue',
            userId: 'demo-user',
            userEmail: 'demo@example.com'
          },
          metadata: {
            source: 'dashboard',
            timestamp: new Date().toISOString()
          }
        })
      });

      if (response.ok) {
        await loadData(); // Recargar datos
      } else {
        throw new Error('Failed to start workflow');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start workflow');
    }
  };

  const pauseInstance = async (instanceId: string) => {
    try {
      const response = await fetch(`/api/workflows/instances/${instanceId}/pause`, {
        method: 'POST'
      });

      if (response.ok) {
        await loadData(); // Recargar datos
      } else {
        throw new Error('Failed to pause instance');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to pause instance');
    }
  };

  const resumeInstance = async (instanceId: string) => {
    try {
      const response = await fetch(`/api/workflows/instances/${instanceId}/resume`, {
        method: 'POST'
      });

      if (response.ok) {
        await loadData(); // Recargar datos
      } else {
        throw new Error('Failed to resume instance');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resume instance');
    }
  };

  const cancelInstance = async (instanceId: string) => {
    try {
      const response = await fetch(`/api/workflows/instances/${instanceId}/cancel`, {
        method: 'POST'
      });

      if (response.ok) {
        await loadData(); // Recargar datos
      } else {
        throw new Error('Failed to cancel instance');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel instance');
    }
  };

  if (loading) {
    return (;
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (;
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading workflows</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <button
                onClick={loadData}
                className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (;
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Workflows Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage BPMN and State Machine workflows
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="all">All Types</option>
                <option value="bpmn">BPMN</option>
                <option value="state_machine">State Machine</option>
              </select>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="draft">Draft</option>
              </select>
              <button
                onClick={loadData}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'workflows', name: 'Workflows', count: workflows.length },
              { id: 'instances', name: 'Instances', count: instances.length },
              { id: 'stats', name: 'Statistics', count: stats ? Object.keys(stats.workflowsByType).length : 0 }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.name}
                <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Workflows Tab */}
          {activeTab === 'workflows' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Workflows</h3>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                  Create Workflow
                </button>
              </div>

              <div className="grid gap-4">
                {workflows.map((workflow) => (
                  <div key={workflow.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h4 className="text-sm font-medium text-gray-900">{workflow.name}</h4>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            workflow.type === 'bpmn'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {workflow.type === 'bpmn' ? 'BPMN' : 'State Machine'}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            workflow.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : workflow.status === 'inactive'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {workflow.status}
                          </span>
                        </div>
                        {workflow.metadata.description && (
                          <p className="mt-1 text-sm text-gray-500">{workflow.metadata.description}</p>
                        )}
                        <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                          <span>Version: {workflow.version}</span>
                          <span>Author: {workflow.metadata.author}</span>
                          <span>Actions: {workflow.actions.length}</span>
                          {workflow.metadata.category && <span>Category: {workflow.metadata.category}</span>}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => startWorkflow(workflow.id)}
                          className="bg-green-100 text-green-800 hover:bg-green-200 px-3 py-1 rounded-md text-xs font-medium"
                        >
                          Start
                        </button>
                        <button className="bg-blue-100 text-blue-800 hover:bg-blue-200 px-3 py-1 rounded-md text-xs font-medium">
                          Edit
                        </button>
                        <button className="bg-gray-100 text-gray-800 hover:bg-gray-200 px-3 py-1 rounded-md text-xs font-medium">
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Instances Tab */}
          {activeTab === 'instances' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Workflow Instances</h3>
              </div>

              <div className="grid gap-4">
                {instances.map((instance) => (
                  <div key={instance.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h4 className="text-sm font-medium text-gray-900">Instance {instance.id.slice(-8)}</h4>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            instance.status === 'running'
                              ? 'bg-green-100 text-green-800'
                              : instance.status === 'completed'
                              ? 'bg-blue-100 text-blue-800'
                              : instance.status === 'failed'
                              ? 'bg-red-100 text-red-800'
                              : instance.status === 'paused'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {instance.status}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                          <span>Workflow: {instance.workflowId.slice(-8)}</span>
                          <span>Started: {new Date(instance.startedAt).toLocaleString()}</span>
                          {instance.currentElement && <span>Element: {instance.currentElement}</span>}
                          {instance.currentState && <span>State: {instance.currentState}</span>}
                          {instance.executionHistory && <span>Actions: {instance.executionHistory.length}</span>}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {instance.status === 'running' && (
                          <button
                            onClick={() => pauseInstance(instance.id)}
                            className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 px-3 py-1 rounded-md text-xs font-medium"
                          >
                            Pause
                          </button>
                        )}
                        {instance.status === 'paused' && (
                          <button
                            onClick={() => resumeInstance(instance.id)}
                            className="bg-green-100 text-green-800 hover:bg-green-200 px-3 py-1 rounded-md text-xs font-medium"
                          >
                            Resume
                          </button>
                        )}
                        {(instance.status === 'running' || instance.status === 'paused') && (
                          <button
                            onClick={() => cancelInstance(instance.id)}
                            className="bg-red-100 text-red-800 hover:bg-red-200 px-3 py-1 rounded-md text-xs font-medium"
                          >
                            Cancel
                          </button>
                        )}
                        <button className="bg-gray-100 text-gray-800 hover:bg-gray-200 px-3 py-1 rounded-md text-xs font-medium">
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Statistics Tab */}
          {activeTab === 'stats' && stats && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Workflow Statistics</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-600">{stats.totalWorkflows}</div>
                  <div className="text-sm text-blue-800">Total Workflows</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-600">{stats.totalInstances}</div>
                  <div className="text-sm text-green-800">Total Instances</div>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-yellow-600">{Math.round(stats.averageExecutionTime)}ms</div>
                  <div className="text-sm text-yellow-800">Avg Execution Time</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-purple-600">{Math.round(stats.successRate)}%</div>
                  <div className="text-sm text-purple-800">Success Rate</div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Workflows by Type</h4>
                  <div className="space-y-2">
                    {Object.entries(stats.workflowsByType).map(([type, count]) => (
                      <div key={type} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 capitalize">{type.replace('_', ' ')}</span>
                        <span className="text-sm font-medium text-gray-900">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Instances by Status</h4>
                  <div className="space-y-2">
                    {Object.entries(stats.instancesByStatus).map(([status, count]) => (
                      <div key={status} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 capitalize">{status}</span>
                        <span className="text-sm font-medium text-gray-900">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
