'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import StatusBadge from '../ui/StatusBadge';
import LoadingSpinner from '../ui/LoadingSpinner';
import { FlowExecution } from '../../lib/api-client';

interface ActiveFlowsProps {
  flows: FlowExecution[];
  onCancelFlow?: (flowId: string) => void;
  loading?: boolean;
}

export default function ActiveFlows({ flows, onCancelFlow, loading = false }: ActiveFlowsProps) {
  const [expandedFlows, setExpandedFlows] = useState<Set<string>>(new Set());

  const toggleFlowExpanded = (flowId: string) => {
    const newExpanded = new Set(expandedFlows);
    if (newExpanded.has(flowId)) {
      newExpanded.delete(flowId);
    } else {
      newExpanded.add(flowId);
    }
    setExpandedFlows(newExpanded);
  };

  const getStatusBadge = (status: FlowExecution['status']) => {
    switch (status) {
      case 'completed':
        return <StatusBadge status="success">Completed</StatusBadge>;
      case 'running':
        return <StatusBadge status="info">Running</StatusBadge>;
      case 'failed':
        return <StatusBadge status="danger">Failed</StatusBadge>;
      case 'cancelled':
        return <StatusBadge status="neutral">Cancelled</StatusBadge>;
      default:
        return <StatusBadge status="warning">Pending</StatusBadge>;
    }
  };

  const getFlowTypeLabel = (flowType: string) => {
    switch (flowType) {
      case 'cobro_proactivo':
        return 'Cobro Proactivo';
      case 'follow_up':
        return 'Follow Up';
      case 'reminder':
        return 'Reminder';
      default:
        return flowType;
    }
  };

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm');
  };

  const getProgressPercentage = (flow: FlowExecution) => {
    const totalSteps = 5; // Assume typical flow has 5 steps
    const completedSteps = flow.steps_completed.length;
    return Math.round((completedSteps / totalSteps) * 100);
  };

  const canCancel = (flow: FlowExecution) => {
    return ['pending', 'running'].includes(flow.status) && onCancelFlow;
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">
            Active Flows ({flows.length})
          </h2>
          {loading && <LoadingSpinner size="sm" />}
        </div>
      </div>

      <div className="space-y-4">
        {flows.map((flow) => {
          const isExpanded = expandedFlows.has(flow.id);
          const progressPercentage = getProgressPercentage(flow);

          return (
            <div
              key={flow.id}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              {/* Flow Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleFlowExpanded(flow.id)}
                    className="text-gray-400 hover:text-gray-600 focus-ring"
                  >
                    <svg
                      className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900">
                        {getFlowTypeLabel(flow.flow_type)}
                      </h3>
                      {getStatusBadge(flow.status)}
                    </div>
                    <p className="text-sm text-gray-500">
                      Started: {formatDateTime(flow.created_at)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Progress indicator */}
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full transition-all"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">{progressPercentage}%</span>
                  </div>

                  {/* Cancel button */}
                  {canCancel(flow) && (
                    <button
                      onClick={() => onCancelFlow!(flow.id)}
                      className="text-sm text-danger-600 hover:text-danger-700 focus-ring px-2 py-1 rounded"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="mt-4 pl-8 space-y-3 animate-slide-up">
                  {/* Flow Details */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Flow ID:</span>
                      <p className="font-mono text-xs text-gray-700">{flow.id}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Correlation ID:</span>
                      <p className="font-mono text-xs text-gray-700">{flow.corr_id}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Last Updated:</span>
                      <p className="text-gray-700">{formatDateTime(flow.updated_at)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Steps Completed:</span>
                      <p className="text-gray-700">{flow.steps_completed.length}</p>
                    </div>
                  </div>

                  {/* Steps Progress */}
                  {flow.steps_completed.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Completed Steps:</h4>
                      <div className="flex flex-wrap gap-2">
                        {flow.steps_completed.map((step, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-success-50 text-success-700 text-xs rounded-full"
                          >
                            {step.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Input Data */}
                  {flow.input_data && Object.keys(flow.input_data).length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Input Data:</h4>
                      <div className="bg-gray-50 rounded p-3">
                        <pre className="text-xs text-gray-600 overflow-x-auto">
                          {JSON.stringify(flow.input_data, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Error Message */}
                  {flow.error_message && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Error:</h4>
                      <div className="bg-danger-50 border border-danger-200 rounded p-3">
                        <p className="text-sm text-danger-800">{flow.error_message}</p>
                      </div>
                    </div>
                  )}

                  {/* Output Data */}
                  {flow.output_data && Object.keys(flow.output_data).length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Output Data:</h4>
                      <div className="bg-gray-50 rounded p-3">
                        <pre className="text-xs text-gray-600 overflow-x-auto">
                          {JSON.stringify(flow.output_data, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {flows.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <p>No active flows</p>
            <p className="text-sm mt-1">Start a cobro proactivo flow from overdue invoices</p>
          </div>
        )}
      </div>
    </div>
  );
}