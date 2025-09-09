'use client';

import { useState, useEffect } from 'react';
import { CacheStatus } from '@/components/CacheStatus';
import { FinOpsStatus } from '@/components/FinOpsStatus';
import RLSStatus from '@/components/RLSStatus';

interface DashboardData {
  overview: {
    total_customers: number;
    total_products: number;
    total_sales: number;
    active_interactions: number;
  };
  recent_activity: Array<{
    type: string;
    message: string;
    timestamp: string;
  }>;
}

interface AnalyticsData {
  timestamp: string;
  period: string;
  crm: {
    total_interactions: number;
    active_deals: number;
    conversion_rate: string;
    avg_deal_value: string;
    top_sources: string[];
  };
  erp: {
    total_invoices: number;
    paid_invoices: number;
    outstanding_amount: string;
    avg_payment_time: number;
    top_products: string[];
  };
  inventory: {
    total_products: number;
    low_stock_alerts: number;
    total_value: string;
    turnover_rate: string;
  };
  ai: {
    total_requests: number;
    chat_sessions: number;
    image_generations: number;
    tts_requests: number;
    total_tokens: number;
    estimated_cost: string;
    cache_hit_rate: string;
  };
  performance: {
    api_p95_latency: number;
    ai_p95_latency: number;
    error_rate: string;
    uptime_percentage: string;
  };
}

interface Alert {
  id: string;
  type: string;
  severity: string;
  title: string;
  message: string;
  timestamp: string;
  category: string;
  actionable: boolean;
  action_url: string;
}

export default function DashboardPage(): void {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashboardRes, analyticsRes, alertsRes] = await Promise.all([
          fetch('/api/dashboard'),
          fetch('/api/v1/analytics/overview'),
          fetch('/api/v1/alerts/active')
        ]);

        if (dashboardRes.ok) {
          const dashboard = await dashboardRes.json();
          setDashboardData(dashboard);
        }

        if (analyticsRes.ok) {
          const analytics = await analyticsRes.json();
          setAnalyticsData(analytics.data);
        }

        if (alertsRes.ok) {
          const alertsData = await alertsRes.json();
          setAlerts(alertsData.data.alerts);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (;
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (;
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <span className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          Live Data
        </span>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500">Total Customers</h3>
            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          </div>
          <div className="text-2xl font-bold">{dashboardData?.overview.total_customers || 0}</div>
          <p className="text-xs text-gray-500 mt-1">
            <span className="text-green-500">↗</span> +12% from last month
          </p>
        </div>

        <div className="bg-white rounded-lg border shadow-sm p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500">Total Sales</h3>
            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-2xl font-bold">€{dashboardData?.overview.total_sales?.toLocaleString() || 0}</div>
          <p className="text-xs text-gray-500 mt-1">
            <span className="text-green-500">↗</span> +8% from last month
          </p>
        </div>

        <div className="bg-white rounded-lg border shadow-sm p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500">Active Interactions</h3>
            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            </div>
          <div className="text-2xl font-bold">{dashboardData?.overview.active_interactions || 0}</div>
          <p className="text-xs text-gray-500 mt-1">
            <span className="text-red-500">↘</span> -3% from last week
          </p>
            </div>

        <div className="bg-white rounded-lg border shadow-sm p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500">Total Products</h3>
            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div className="text-2xl font-bold">{dashboardData?.overview.total_products || 0}</div>
          <p className="text-xs text-gray-500 mt-1">
            <span className="text-green-500">↗</span> +5% from last month
          </p>
        </div>
      </div>

      {/* Analytics and Alerts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CRM Analytics */}
        <div className="bg-white rounded-lg border shadow-sm lg:col-span-2">
          <div className="p-6">
            <h3 className="text-lg font-semibold">CRM Analytics</h3>
          </div>
          <div className="p-6 pt-0 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Total Interactions</p>
                <p className="text-2xl font-bold">{analyticsData?.crm.total_interactions || 0}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Active Deals</p>
                <p className="text-2xl font-bold">{analyticsData?.crm.active_deals || 0}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Conversion Rate</p>
                <p className="text-2xl font-bold">{analyticsData?.crm.conversion_rate || '0%'}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Avg Deal Value</p>
                <p className="text-2xl font-bold">€{analyticsData?.crm.avg_deal_value || '0'}</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Top Lead Sources</p>
              <div className="flex flex-wrap gap-2">
                {analyticsData?.crm.top_sources.map((source, index) => (
                  <span key={index} className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                    {source}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Active Alerts */}
        <div className="bg-white rounded-lg border shadow-sm">
          <div className="p-6">
            <h3 className="text-lg font-semibold">Active Alerts</h3>
          </div>
          <div className="p-6 pt-0">
            <div className="space-y-4">
              {alerts.length === 0 ? (
                <p className="text-sm text-gray-500">No active alerts</p>
              ) : (
                alerts.map((alert) => (
                  <div key={alert.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <div className={`p-1 rounded ${getSeverityColor(alert.severity)}`}>
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{alert.title}</p>
                      <p className="text-xs text-gray-500">{alert.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(alert.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
                  </div>
                </div>
              </div>

      {/* Performance Metrics */}
      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-6">
          <h3 className="text-lg font-semibold">System Performance</h3>
                </div>
        <div className="p-6 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-sm font-medium">API Latency (p95)</p>
              <p className="text-2xl font-bold">{analyticsData?.performance.api_p95_latency || 0}ms</p>
              </div>
            <div>
              <p className="text-sm font-medium">AI Latency (p95)</p>
              <p className="text-2xl font-bold">{analyticsData?.performance.ai_p95_latency || 0}ms</p>
            </div>
            <div>
              <p className="text-sm font-medium">Error Rate</p>
              <p className="text-2xl font-bold">{(parseFloat(analyticsData?.performance.error_rate || '0') * 100).toFixed(2)}%</p>
                  </div>
            <div>
              <p className="text-sm font-medium">Uptime</p>
              <p className="text-2xl font-bold">{analyticsData?.performance.uptime_percentage || '0'}%</p>
                  </div>
                </div>
              </div>
                </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-6">
          <h3 className="text-lg font-semibold">Recent Activity</h3>
        </div>
        <div className="p-6 pt-0">
          <div className="space-y-4">
            {dashboardData?.recent_activity.map((activity, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm">{activity.message}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(activity.timestamp).toLocaleString()}
                  </p>
                </div>
                <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                  {activity.type}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cache Status */}
      <CacheStatus />

      {/* FinOps Status */}
      <FinOpsStatus />
    </div>
  );
}
