/**
 * Agent Card V2 - Con Progreso en Tiempo Real
 * FASE 4 - COCKPIT SIN MOCKS EMBEBIDOS
 * 
 * Funcionalidades:
 * - Progreso en tiempo real
 * - Integración con FinOps
 * - Estados visuales mejorados
 */

import React, { useState } from 'react';
import { type AgentConfig } from '@/lib/models';
import { useAgentProgress } from '@/lib/realtime';
import { RealtimeClient } from '@/lib/realtime';

interface AgentCardV2Props {
  agent: AgentConfig;
  onExecute: (inputs: unknown) => Promise<unknown>;
  realtimeClient: RealtimeClient | null;
}

export default function AgentCardV2({ agent, onExecute, realtimeClient }: AgentCardV2Props) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionError, setExecutionError] = useState<string | null>(null);
  const [lastExecution, setLastExecution] = useState<{
    timestamp: string;
    cost?: number;
    tokens?: number;
  } | null>(null);

  // Get real-time progress for this agent
  const { progress, status: realtimeStatus } = useAgentProgress(agent.key, realtimeClient);

  const handleExecute = async () => {
    try {
      setIsExecuting(true);
      setExecutionError(null);

      // Simple inputs for demo - in production this would be more sophisticated
      const inputs = {
        message: `Execute agent ${agent.name}`,
        timestamp: new Date().toISOString(),
        dept: agent.dept,
      };

      const result = await onExecute(inputs);
      
      setLastExecution({
        timestamp: new Date().toISOString(),
        cost: (result as any)?.cost,
        tokens: (result as any)?.tokens,
      });

    } catch (error) {
      setExecutionError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsExecuting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'idle': return 'bg-gray-100 text-gray-800';
      case 'running': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'idle': return '⏸️';
      case 'running': return '🔄';
      case 'completed': return '✅';
      case 'error': return '❌';
      case 'paused': return '⏸️';
      default: return '❓';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    }).format(amount);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {agent.name}
          </h3>
          <p className="text-sm text-gray-600 mb-2">
            {agent.description}
          </p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(realtimeStatus || agent.status)}`}>
          {getStatusIcon(realtimeStatus || agent.status)} {realtimeStatus || agent.status}
        </span>
      </div>

      {/* Progress Bar */}
      {progress && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Progreso</span>
            <span className="text-sm text-gray-600">
              {progress.current} / {progress.total}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            ></div>
          </div>
          {progress.message && (
            <p className="text-xs text-gray-500 mt-1">{progress.message}</p>
          )}
        </div>
      )}

      {/* Usage Information */}
      {agent.usage && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Uso de IA</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-600">Tokens:</span>
              <span className="ml-1 font-medium">{agent.usage.tokens.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-gray-600">Costo:</span>
              <span className="ml-1 font-medium">{formatCurrency(agent.usage.cost)}</span>
            </div>
            <div>
              <span className="text-gray-600">Requests:</span>
              <span className="ml-1 font-medium">{agent.usage.requests}</span>
            </div>
            <div>
              <span className="text-gray-600">Actualizado:</span>
              <span className="ml-1 font-medium">
                {formatTimestamp(agent.usage.lastUpdated)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Last Execution */}
      {lastExecution && (
        <div className="mb-4 p-3 bg-green-50 rounded-lg">
          <h4 className="text-sm font-medium text-green-700 mb-2">Última Ejecución</h4>
          <div className="text-sm text-green-600">
            <div>Hora: {formatTimestamp(lastExecution.timestamp)}</div>
            {lastExecution.cost && (
              <div>Costo: {formatCurrency(lastExecution.cost)}</div>
            )}
            {lastExecution.tokens && (
              <div>Tokens: {lastExecution.tokens.toLocaleString()}</div>
            )}
          </div>
        </div>
      )}

      {/* Error Display */}
      {executionError && (
        <div className="mb-4 p-3 bg-red-50 rounded-lg">
          <div className="flex items-center">
            <span className="text-red-600 mr-2">❌</span>
            <span className="text-red-800 text-sm font-medium">Error de Ejecución</span>
          </div>
          <p className="text-red-600 text-sm mt-1">{executionError}</p>
        </div>
      )}

      {/* Execute Button */}
      <button
        onClick={handleExecute}
        disabled={isExecuting || realtimeStatus === 'running'}
        className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
          isExecuting || realtimeStatus === 'running'
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {isExecuting ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Ejecutando...
          </div>
        ) : realtimeStatus === 'running' ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            En Progreso...
          </div>
        ) : (
          'Ejecutar Agente'
        )}
      </button>

      {/* Connection Status */}
      {!realtimeClient && (
        <div className="mt-2 text-xs text-yellow-600 flex items-center">
          <span className="mr-1">⚠️</span>
          Sin conexión en tiempo real
        </div>
      )}
    </div>
  );
}
