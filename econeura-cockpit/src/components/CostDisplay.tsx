/**
 * Componente para mostrar costes visibles SOLO en IA
 * FASE 4 - COCKPIT SIN MOCKS EMBEBIDOS
 * 
 * Funcionalidades:
 * - Mostrar costes solo en departamento IA
 * - Integración con FinOps
 * - Alertas de presupuesto
 * - Kill-switch status
 */

import React, { useState, useEffect } from 'react';
import { useCostUpdates, useRealtime } from '@/lib/realtime';
import { type DeptKey } from '@/lib/palette';

interface CostDisplayProps {
  dept: DeptKey;
  orgId: string;
  userId: string;
}

interface CostStatus {
  currentDaily: number;
  currentMonthly: number;
  limits: {
    dailyLimitEUR: number;
    monthlyLimitEUR: number;
    perRequestLimitEUR: number;
  };
  status: 'healthy' | 'warning' | 'critical' | 'emergency';
  killSwitchActive: boolean;
}

export default function CostDisplay({ dept, orgId, userId }: CostDisplayProps) {
  const [costStatus, setCostStatus] = useState<CostStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { client } = useRealtime(orgId, userId);
  const realtimeCostStatus = useCostUpdates(client);

  // Solo mostrar en departamento IA
  if (dept !== 'ia') {
    return null;
  }

  useEffect(() => {
    fetchCostStatus();
  }, [orgId]);

  useEffect(() => {
    if (realtimeCostStatus) {
      setCostStatus(prev => prev ? {
        ...prev,
        ...realtimeCostStatus,
      } : null);
    }
  }, [realtimeCostStatus]);

  const fetchCostStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/cockpit/bff?endpoint=cost-status&orgId=${orgId}`);
      const result = await response.json();
      
      if (result.success) {
        setCostStatus(result.data);
      } else {
        setError(result.error || 'Failed to fetch cost status');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'critical': return 'text-orange-600 bg-orange-50';
      case 'emergency': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return '✅';
      case 'warning': return '⚠️';
      case 'critical': return '🔶';
      case 'emergency': return '🚨';
      default: return '❓';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(amount);
  };

  const calculatePercentage = (current: number, limit: number) => {
    return Math.min((current / limit) * 100, 100);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <span className="text-red-600 mr-2">❌</span>
          <span className="text-red-800 font-medium">Error loading cost status</span>
        </div>
        <p className="text-red-600 text-sm mt-1">{error}</p>
        <button
          onClick={fetchCostStatus}
          className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!costStatus) {
    return null;
  }

  const dailyPercentage = calculatePercentage(costStatus.currentDaily, costStatus.limits.dailyLimitEUR);
  const monthlyPercentage = calculatePercentage(costStatus.currentMonthly, costStatus.limits.monthlyLimitEUR);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Costos de IA</h3>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(costStatus.status)}`}>
          {getStatusIcon(costStatus.status)} {costStatus.status.toUpperCase()}
        </div>
      </div>

      {costStatus.killSwitchActive && (
        <div className="bg-red-100 border border-red-300 rounded-lg p-3 mb-4">
          <div className="flex items-center">
            <span className="text-red-600 mr-2">🚨</span>
            <span className="text-red-800 font-medium">Kill Switch Activo</span>
          </div>
          <p className="text-red-600 text-sm mt-1">
            El sistema de IA está temporalmente deshabilitado debido a límites de presupuesto excedidos.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {/* Daily Cost */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Gasto Diario</span>
            <span className="text-sm text-gray-600">
              {formatCurrency(costStatus.currentDaily)} / {formatCurrency(costStatus.limits.dailyLimitEUR)}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                dailyPercentage >= 100 ? 'bg-red-500' :
                dailyPercentage >= 95 ? 'bg-orange-500' :
                dailyPercentage >= 80 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(dailyPercentage, 100)}%` }}
            ></div>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {dailyPercentage.toFixed(1)}% del límite diario
          </div>
        </div>

        {/* Monthly Cost */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Gasto Mensual</span>
            <span className="text-sm text-gray-600">
              {formatCurrency(costStatus.currentMonthly)} / {formatCurrency(costStatus.limits.monthlyLimitEUR)}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                monthlyPercentage >= 100 ? 'bg-red-500' :
                monthlyPercentage >= 95 ? 'bg-orange-500' :
                monthlyPercentage >= 80 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(monthlyPercentage, 100)}%` }}
            ></div>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {monthlyPercentage.toFixed(1)}% del límite mensual
          </div>
        </div>

        {/* Per-Request Limit */}
        <div className="pt-2 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Límite por Request</span>
            <span className="text-sm text-gray-600">
              {formatCurrency(costStatus.limits.perRequestLimitEUR)}
            </span>
          </div>
        </div>

        {/* Status Messages */}
        {costStatus.status === 'warning' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center">
              <span className="text-yellow-600 mr-2">⚠️</span>
              <span className="text-yellow-800 text-sm font-medium">Advertencia de Presupuesto</span>
            </div>
            <p className="text-yellow-600 text-sm mt-1">
              Te estás acercando a los límites de presupuesto. Considera optimizar el uso de IA.
            </p>
          </div>
        )}

        {costStatus.status === 'critical' && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div className="flex items-center">
              <span className="text-orange-600 mr-2">🔶</span>
              <span className="text-orange-800 text-sm font-medium">Presupuesto Crítico</span>
            </div>
            <p className="text-orange-600 text-sm mt-1">
              Has alcanzado el 95% de tu presupuesto. El kill-switch se activará al 100%.
            </p>
          </div>
        )}

        {costStatus.status === 'emergency' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center">
              <span className="text-red-600 mr-2">🚨</span>
              <span className="text-red-800 text-sm font-medium">Presupuesto Excedido</span>
            </div>
            <p className="text-red-600 text-sm mt-1">
              Has excedido tu presupuesto. El sistema de IA está temporalmente deshabilitado.
            </p>
          </div>
        )}
      </div>

      {/* Refresh Button */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <button
          onClick={fetchCostStatus}
          className="w-full text-sm text-gray-600 hover:text-gray-800 py-2 px-3 rounded-md hover:bg-gray-50 transition-colors"
        >
          🔄 Actualizar Costos
        </button>
      </div>
    </div>
  );
}
