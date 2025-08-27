'use client';

import React, { useState, useEffect } from 'react';
import { 
  CurrencyEuroIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ArrowPathIcon,
  CogIcon,
  ShieldCheckIcon,
  BoltIcon
} from '@heroicons/react/24/outline';
import MetricsCard from '../dashboard/MetricsCard';
import LoadingSpinner from '../ui/LoadingSpinner';
import StatusBadge from '../ui/StatusBadge';
import toast from 'react-hot-toast';

interface FinOpsMetrics {
  organizationId: string;
  currentPeriod: {
    dailyCostEur: number;
    monthlyCostEur: number;
    yearlyProjectionEur: number;
    totalRequests: number;
    avgCostPerRequest: number;
  };
  budgetLimits: {
    dailyLimitEur: number;
    monthlyLimitEur: number;
    perRequestLimitEur: number;
    emergencyStopEnabled: boolean;
    emergencyStopThresholdEur: number;
  };
  utilization: {
    dailyPercent: number;
    monthlyPercent: number;
    trend: 'up' | 'down' | 'stable';
    growthRatePercent: number;
  };
  costBreakdown: {
    byProvider: Array<{
      provider: string;
      costEur: number;
      requests: number;
      percentage: number;
    }>;
    byTaskType: Array<{
      taskType: string;
      costEur: number;
      requests: number;
      percentage: number;
    }>;
  };
  alerts: Array<{
    type: 'warning' | 'limit_exceeded' | 'emergency_stop';
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    timestamp: Date;
    resolved: boolean;
  }>;
  lastUpdated: Date;
}

interface CostLimitSettings {
  dailyLimitEur: number;
  monthlyLimitEur: number;
  perRequestLimitEur: number;
  warningThresholds: {
    daily: number;
    monthly: number;
  };
  emergencyStop: {
    enabled: boolean;
    thresholdEur: number;
  };
}

export function CFODashboard() {
  const [metrics, setMetrics] = useState<FinOpsMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [limitSettings, setLimitSettings] = useState<CostLimitSettings | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);

  const fetchMetrics = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      
      const response = await fetch('/api/econeura/ai/usage', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        // Transform API response to FinOpsMetrics
        const transformedMetrics: FinOpsMetrics = {
          organizationId: data.organization_id,
          currentPeriod: {
            dailyCostEur: data.daily_cost_eur || 0,
            monthlyCostEur: data.monthly_cost_eur || 0,
            yearlyProjectionEur: (data.monthly_cost_eur || 0) * 12,
            totalRequests: data.total_requests || 0,
            avgCostPerRequest: data.total_requests > 0 ? 
              (data.daily_cost_eur || 0) / data.total_requests : 0,
          },
          budgetLimits: {
            dailyLimitEur: data.limits?.daily_limit_eur || 50,
            monthlyLimitEur: data.limits?.monthly_limit_eur || 1000,
            perRequestLimitEur: data.limits?.per_request_limit_eur || 5,
            emergencyStopEnabled: data.limits?.emergency_stop_enabled || true,
            emergencyStopThresholdEur: data.limits?.emergency_stop_threshold_eur || 100,
          },
          utilization: {
            dailyPercent: data.utilization_daily || 0,
            monthlyPercent: data.utilization_monthly || 0,
            trend: data.utilization_daily > data.utilization_monthly ? 'up' : 
                   data.utilization_daily < data.utilization_monthly ? 'down' : 'stable',
            growthRatePercent: ((data.utilization_daily - data.utilization_monthly) / 
                               Math.max(data.utilization_monthly, 1)) * 100,
          },
          costBreakdown: {
            byProvider: data.breakdown?.by_provider || [],
            byTaskType: data.breakdown?.by_task_type || [],
          },
          alerts: data.alerts?.map((a: any) => ({
            type: a.type,
            message: a.message,
            severity: a.severity || 'medium',
            timestamp: new Date(a.timestamp),
            resolved: a.resolved || false,
          })) || [],
          lastUpdated: new Date(),
        };
        
        setMetrics(transformedMetrics);
        
        // Extract current limits for settings
        setLimitSettings({
          dailyLimitEur: transformedMetrics.budgetLimits.dailyLimitEur,
          monthlyLimitEur: transformedMetrics.budgetLimits.monthlyLimitEur,
          perRequestLimitEur: transformedMetrics.budgetLimits.perRequestLimitEur,
          warningThresholds: {
            daily: 80,
            monthly: 80,
          },
          emergencyStop: {
            enabled: transformedMetrics.budgetLimits.emergencyStopEnabled,
            thresholdEur: transformedMetrics.budgetLimits.emergencyStopThresholdEur,
          },
        });
      }

    } catch (error) {
      console.error('Failed to fetch CFO metrics:', error);
      toast.error('Failed to load financial metrics');
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  };

  const updateCostLimits = async () => {
    if (!limitSettings) return;
    
    setSavingSettings(true);
    try {
      const response = await fetch('/api/econeura/ai/usage/limits', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          daily_limit_eur: limitSettings.dailyLimitEur,
          monthly_limit_eur: limitSettings.monthlyLimitEur,
          per_request_limit_eur: limitSettings.perRequestLimitEur,
          warning_thresholds: limitSettings.warningThresholds,
          emergency_stop: limitSettings.emergencyStop,
        }),
      });

      if (response.ok) {
        toast.success('Cost limits updated successfully');
        setShowSettings(false);
        fetchMetrics(true);
      } else {
        throw new Error('Failed to update limits');
      }
    } catch (error) {
      console.error('Failed to update cost limits:', error);
      toast.error('Failed to update cost limits');
    } finally {
      setSavingSettings(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    
    // Set up periodic refresh every 60 seconds
    const interval = setInterval(() => fetchMetrics(false), 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No financial data available</p>
      </div>
    );
  }

  const activeAlerts = metrics.alerts.filter(a => !a.resolved);
  const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">CFO Financial Dashboard</h1>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <CogIcon className="h-4 w-4 mr-2" />
            Settings
          </button>
          <button
            onClick={() => fetchMetrics(true)}
            disabled={refreshing}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Critical Alerts */}
      {criticalAlerts.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Critical Cost Alerts</h3>
              <div className="mt-2 text-sm text-red-700">
                <ul className="list-disc list-inside space-y-1">
                  {criticalAlerts.map((alert, index) => (
                    <li key={index}>{alert.message}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Key Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricsCard
          title="Daily AI Spend"
          value={`€${metrics.currentPeriod.dailyCostEur.toFixed(2)}`}
          icon={<CurrencyEuroIcon className="h-5 w-5" />}
          subtitle={`${metrics.utilization.dailyPercent.toFixed(1)}% of €${metrics.budgetLimits.dailyLimitEur} limit`}
        />
        
        <MetricsCard
          title="Monthly AI Spend"
          value={`€${metrics.currentPeriod.monthlyCostEur.toFixed(2)}`}
          icon={<ArrowTrendingUpIcon className="h-5 w-5" />}
          subtitle={`${metrics.utilization.monthlyPercent.toFixed(1)}% of €${metrics.budgetLimits.monthlyLimitEur} limit`}
        />
        
        <MetricsCard
          title="Cost Per Request"
          value={`€${metrics.currentPeriod.avgCostPerRequest.toFixed(4)}`}
          icon={<BoltIcon className="h-5 w-5" />}
          subtitle={`${metrics.currentPeriod.totalRequests} requests today`}
        />
        
        <MetricsCard
          title="Yearly Projection"
          value={`€${metrics.currentPeriod.yearlyProjectionEur.toFixed(0)}`}
          icon={<ArrowTrendingDownIcon className="h-5 w-5" />}
          subtitle={`${metrics.utilization.growthRatePercent > 0 ? '+' : ''}${metrics.utilization.growthRatePercent.toFixed(1)}% growth rate`}
        />
      </div>

      {/* Budget Status */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Budget Status & Controls</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Daily Budget */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Daily Budget</span>
                <StatusBadge
                  status={metrics.utilization.dailyPercent > 90 ? 'danger' : 
                         metrics.utilization.dailyPercent > 80 ? 'warning' : 'success'}
                >
                  {`${metrics.utilization.dailyPercent.toFixed(0)}%`}
                </StatusBadge>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    metrics.utilization.dailyPercent > 90 ? 'bg-red-600' :
                    metrics.utilization.dailyPercent > 80 ? 'bg-yellow-600' : 'bg-green-600'
                  }`}
                  style={{ width: `${Math.min(metrics.utilization.dailyPercent, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-600">
                <span>€{metrics.currentPeriod.dailyCostEur.toFixed(2)}</span>
                <span>€{metrics.budgetLimits.dailyLimitEur}</span>
              </div>
            </div>

            {/* Monthly Budget */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Monthly Budget</span>
                <StatusBadge
                  status={metrics.utilization.monthlyPercent > 90 ? 'danger' : 
                         metrics.utilization.monthlyPercent > 80 ? 'warning' : 'success'}
                >
                  {`${metrics.utilization.monthlyPercent.toFixed(0)}%`}
                </StatusBadge>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    metrics.utilization.monthlyPercent > 90 ? 'bg-red-600' :
                    metrics.utilization.monthlyPercent > 80 ? 'bg-yellow-600' : 'bg-green-600'
                  }`}
                  style={{ width: `${Math.min(metrics.utilization.monthlyPercent, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-600">
                <span>€{metrics.currentPeriod.monthlyCostEur.toFixed(2)}</span>
                <span>€{metrics.budgetLimits.monthlyLimitEur}</span>
              </div>
            </div>

            {/* Emergency Stop Status */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Emergency Stop</span>
                <div className="flex items-center">
                  <ShieldCheckIcon className={`h-4 w-4 mr-1 ${
                    metrics.budgetLimits.emergencyStopEnabled ? 'text-green-600' : 'text-gray-400'
                  }`} />
                  <StatusBadge
                    status={metrics.budgetLimits.emergencyStopEnabled ? 'success' : 'neutral'}
                  >
                    {metrics.budgetLimits.emergencyStopEnabled ? 'Active' : 'Disabled'}
                  </StatusBadge>
                </div>
              </div>
              <div className="text-xs text-gray-600">
                {metrics.budgetLimits.emergencyStopEnabled ? (
                  <span>Triggers at €{metrics.budgetLimits.emergencyStopThresholdEur}</span>
                ) : (
                  <span>Manual controls only</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cost Breakdown */}
      {(metrics.costBreakdown.byProvider.length > 0 || metrics.costBreakdown.byTaskType.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* By Provider */}
          {metrics.costBreakdown.byProvider.length > 0 && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Cost by Provider</h3>
                <div className="space-y-3">
                  {metrics.costBreakdown.byProvider.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-900">{item.provider}</span>
                          <span className="text-sm text-gray-600">€{item.costEur.toFixed(2)}</span>
                        </div>
                        <div className="mt-1 w-full bg-gray-200 rounded-full h-1">
                          <div
                            className="h-1 bg-blue-600 rounded-full"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          {item.requests} requests ({item.percentage.toFixed(1)}%)
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* By Task Type */}
          {metrics.costBreakdown.byTaskType.length > 0 && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Cost by Task Type</h3>
                <div className="space-y-3">
                  {metrics.costBreakdown.byTaskType.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-900">{item.taskType}</span>
                          <span className="text-sm text-gray-600">€{item.costEur.toFixed(2)}</span>
                        </div>
                        <div className="mt-1 w-full bg-gray-200 rounded-full h-1">
                          <div
                            className="h-1 bg-green-600 rounded-full"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          {item.requests} requests ({item.percentage.toFixed(1)}%)
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && limitSettings && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Cost Limit Settings</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Daily Limit (EUR)</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={limitSettings.dailyLimitEur}
                  onChange={(e) => setLimitSettings(prev => prev ? 
                    { ...prev, dailyLimitEur: parseFloat(e.target.value) || 1 } : null
                  )}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Monthly Limit (EUR)</label>
                <input
                  type="number"
                  step="1"
                  min="10"
                  value={limitSettings.monthlyLimitEur}
                  onChange={(e) => setLimitSettings(prev => prev ? 
                    { ...prev, monthlyLimitEur: parseFloat(e.target.value) || 10 } : null
                  )}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Per Request Limit (EUR)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={limitSettings.perRequestLimitEur}
                  onChange={(e) => setLimitSettings(prev => prev ? 
                    { ...prev, perRequestLimitEur: parseFloat(e.target.value) || 0.01 } : null
                  )}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={limitSettings.emergencyStop.enabled}
                  onChange={(e) => setLimitSettings(prev => prev ? 
                    { ...prev, emergencyStop: { ...prev.emergencyStop, enabled: e.target.checked } } : null
                  )}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                <label className="ml-2 text-sm text-gray-700">Enable Emergency Stop</label>
              </div>
              
              {limitSettings.emergencyStop.enabled && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Emergency Stop Threshold (EUR)</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={limitSettings.emergencyStop.thresholdEur}
                    onChange={(e) => setLimitSettings(prev => prev ? 
                      { ...prev, emergencyStop: { ...prev.emergencyStop, thresholdEur: parseFloat(e.target.value) || 1 } } : null
                    )}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
              )}
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={updateCostLimits}
                disabled={savingSettings}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {savingSettings ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}