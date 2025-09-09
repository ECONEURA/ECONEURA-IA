// ============================================================================
// METRICS DASHBOARD - MAIN COMPONENT
// ============================================================================

'use client';

import React, { useState, useEffect } from 'react';
import { useMetrics } from '../MetricsProvider.js';
import PerformanceChart from './PerformanceChart.js';
import ErrorLog from './ErrorLog.js';
import AuditTrail from './AuditTrail.js';

// ============================================================================
// TYPES
// ============================================================================

interface MetricsData {
  metrics: Array<{
    name: string;
    value: number;
    labels: Record<string, string>;
    timestamp: string;
  }>;
  stats: {
    totalMetrics: number;
    lastUpdated: string;
  };
}

interface DashboardState {
  metricsData: MetricsData | null;
  systemMetrics: MetricsData | null;
  businessMetrics: MetricsData | null;
  performanceMetrics: MetricsData | null;
  errorMetrics: MetricsData | null;
  isLoading: boolean;
  error: string | null;
  activeTab: 'overview' | 'system' | 'business' | 'performance' | 'errors';
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function MetricsDashboard(): JSX.Element {
  const {
    getMetricsData,
    getSystemMetrics,
    getBusinessMetrics,
    getPerformanceMetrics,
    getErrorMetrics,
    isLoading,
    error
  } = useMetrics();

  const [state, setState] = useState<DashboardState>({
    metricsData: null,
    systemMetrics: null,
    businessMetrics: null,
    performanceMetrics: null,
    errorMetrics: null,
    isLoading: false,
    error: null,
    activeTab: 'overview'
  });

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const fetchAllMetrics = async (): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const [metricsData, systemMetrics, businessMetrics, performanceMetrics, errorMetrics] = await Promise.all([
        getMetricsData(),
        getSystemMetrics(),
        getBusinessMetrics(),
        getPerformanceMetrics(),
        getErrorMetrics()
      ]);

      setState(prev => ({
        ...prev,
        metricsData: metricsData.data,
        systemMetrics: systemMetrics.data,
        businessMetrics: businessMetrics.data,
        performanceMetrics: performanceMetrics.data,
        errorMetrics: errorMetrics.data,
        isLoading: false
      }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: `Failed to fetch metrics: ${err}`,
        isLoading: false
      }));
    }
  };

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    fetchAllMetrics();

    // Refresh metrics every 30 seconds
    const interval = setInterval(fetchAllMetrics, 30000);

    return () => clearInterval(interval);
  }, []);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleTabChange = (tab: DashboardState['activeTab']): void => {
    setState(prev => ({ ...prev, activeTab: tab }));
  };

  const handleRefresh = (): void => {
    fetchAllMetrics();
  };

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const renderTabContent = (): JSX.Element => {
    switch (state.activeTab) {
      case 'overview':
        return (;
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Metrics</h3>
              <p className="text-3xl font-bold text-blue-600">
                {state.metricsData?.stats.totalMetrics || 0}
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">System Health</h3>
              <p className="text-3xl font-bold text-green-600">Healthy</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Active Users</h3>
              <p className="text-3xl font-bold text-purple-600">
                {state.businessMetrics?.metrics.find(m => m.name === 'users_total')?.value || 0}
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">API Calls</h3>
              <p className="text-3xl font-bold text-orange-600">
                {state.performanceMetrics?.metrics.find(m => m.name === 'api_requests_total')?.value || 0}
              </p>
            </div>
          </div>
        );

      case 'system':
        return (;
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">System Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {state.systemMetrics?.metrics.map((metric, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <h4 className="font-medium text-gray-700">{metric.name}</h4>
                    <p className="text-2xl font-bold text-blue-600">{metric.value}</p>
                    <p className="text-sm text-gray-500">{metric.timestamp}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'business':
        return (;
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {state.businessMetrics?.metrics.map((metric, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <h4 className="font-medium text-gray-700">{metric.name}</h4>
                    <p className="text-2xl font-bold text-green-600">{metric.value}</p>
                    <p className="text-sm text-gray-500">{metric.timestamp}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'performance':
        return (;
          <div className="space-y-6">
            <PerformanceChart data={state.performanceMetrics} />
          </div>
        );

      case 'errors':
        return (;
          <div className="space-y-6">
            <ErrorLog data={state.errorMetrics} />
          </div>
        );

      default:
        return <div>Unknown tab</div>;
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (isLoading && !state.metricsData) {
    return (;
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading metrics...</p>
        </div>
      </div>
    );
  }

  if (error || state.error) {
    return (;
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading metrics</h3>
            <p className="mt-2 text-sm text-red-700">{error || state.error}</p>
            <button
              onClick={handleRefresh}
              className="mt-3 bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (;
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Metrics Dashboard</h1>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
        >
          <svg className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'system', label: 'System' },
            { id: 'business', label: 'Business' },
            { id: 'performance', label: 'Performance' },
            { id: 'errors', label: 'Errors' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as DashboardState['activeTab'])}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                state.activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="mt-6">
        {renderTabContent()}
      </div>

      {/* Audit Trail */}
      <div className="mt-8">
        <AuditTrail />
      </div>
    </div>
  );
}
