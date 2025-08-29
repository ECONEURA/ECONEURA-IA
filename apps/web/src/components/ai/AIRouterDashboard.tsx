'use client';

import React, { useState, useEffect } from 'react';
import { 
  Cpu,
  BarChart3,
  AlertTriangle,
  Zap,
  RotateCcw,
  RefreshCw
} from 'lucide-react';
import MetricsCard from '../dashboard/MetricsCard';
import LoadingSpinner from '../ui/LoadingSpinner';
import StatusBadge from '../ui/StatusBadge';
import toast from 'react-hot-toast';

interface AIProviderStatus {
  id: string;
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  latency: number;
  successRate: number;
  lastCheck: Date;
}

interface AIUsageStats {
  organizationId: string;
  totalRequests: number;
  totalCostEur: number;
  dailyCostEur: number;
  monthlyCostEur: number;
  utilizationDaily: number;
  utilizationMonthly: number;
  activeProviders: string[];
  lastUpdated: Date;
}

interface CostAlert {
  type: 'warning' | 'limit_exceeded' | 'emergency_stop';
  message: string;
  currentCost: number;
  limit: number;
  period: 'daily' | 'monthly' | 'request';
  timestamp: Date;
}

export function AIRouterDashboard() {
  const [usage, setUsage] = useState<AIUsageStats | null>(null);
  const [providers, setProviders] = useState<AIProviderStatus[]>([]);
  const [alerts, setAlerts] = useState<CostAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      
      // Fetch AI usage stats
      const usageResponse = await fetch('/api/econeura/ai/usage', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (usageResponse.ok) {
        const usageData = await usageResponse.json();
        setUsage({
          organizationId: usageData.organization_id,
          totalRequests: usageData.total_requests,
          totalCostEur: usageData.total_cost_eur,
          dailyCostEur: usageData.daily_cost_eur,
          monthlyCostEur: usageData.monthly_cost_eur,
          utilizationDaily: usageData.utilization_daily,
          utilizationMonthly: usageData.utilization_monthly,
          activeProviders: usageData.active_providers,
          lastUpdated: new Date(usageData.last_updated),
        });
      }

      // Fetch provider health status
      const providersResponse = await fetch('/api/econeura/ai/providers', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (providersResponse.ok) {
        const providersData = await providersResponse.json();
        setProviders(providersData.providers.map((p: any) => ({
          id: p.id,
          name: p.name,
          status: p.healthy ? 'healthy' : 'down',
          latency: p.latency_ms,
          successRate: p.success_rate,
          lastCheck: new Date(p.last_check),
        })));
      }

      // Fetch recent alerts
      const alertsResponse = await fetch('/api/econeura/ai/health', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (alertsResponse.ok) {
        const alertsData = await alertsResponse.json();
        if (alertsData.alerts) {
          setAlerts(alertsData.alerts.map((a: any) => ({
            type: a.type,
            message: a.message,
            currentCost: a.current_cost,
            limit: a.limit,
            period: a.period,
            timestamp: new Date(a.timestamp),
          })));
        }
      }

    } catch (error) {
      console.error('Failed to fetch AI Router data:', error);
      toast.error('Failed to load AI Router data');
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Set up periodic refresh
    const interval = setInterval(() => fetchData(false), 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    fetchData(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">AI Router Dashboard</h1>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Active Cost Alerts</h3>
              <div className="mt-2 text-sm text-red-700">
                <ul className="list-disc list-inside space-y-1">
                  {alerts.map((alert, index) => (
                    <li key={index}>{alert.message}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Usage Metrics */}
      {usage && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricsCard
            title="Total Requests Today"
            value={usage.totalRequests.toLocaleString()}
            icon={<BarChart3 className="h-5 w-5" />}
          />
          <MetricsCard
            title="Daily Cost (EUR)"
            value={`€${usage.dailyCostEur.toFixed(2)}`}
            icon={<Zap className="h-5 w-5" />}
            subtitle={`${usage.utilizationDaily.toFixed(1)}% of limit`}
          />
          <MetricsCard
            title="Monthly Cost (EUR)"
            value={`€${usage.monthlyCostEur.toFixed(2)}`}
            icon={<BarChart3 className="h-5 w-5" />}
            subtitle={`${usage.utilizationMonthly.toFixed(1)}% of limit`}
          />
          <MetricsCard
            title="Active Providers"
            value={usage.activeProviders.length.toString()}
            icon={<Cpu className="h-5 w-5" />}
            subtitle={usage.activeProviders.join(', ')}
          />
        </div>
      )}

      {/* Provider Status */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Provider Health Status</h3>
          <div className="mt-5">
            {providers.length === 0 ? (
              <p className="text-sm text-gray-500">No providers configured</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {providers.map((provider) => (
                  <div
                    key={provider.id}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-medium text-gray-900">{provider.name}</h4>
                      <StatusBadge
                        status={provider.status === 'healthy' ? 'success' : provider.status === 'degraded' ? 'warning' : 'danger'}
                      >
                        {provider.status}
                      </StatusBadge>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>Latency:</span>
                        <span>{provider.latency}ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Success Rate:</span>
                        <span>{(provider.successRate * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Last Check:</span>
                        <span>{provider.lastCheck.toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Usage History Chart Placeholder */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Usage Trends</h3>
          <div className="mt-5 h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
            <div className="text-center">
              <BarChart3 className="mx-auto h-8 w-8 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">Usage charts will be implemented in M7</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}