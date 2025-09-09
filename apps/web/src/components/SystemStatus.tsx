'use client';

import { useState, useEffect } from 'react';

interface SystemStatus {
  web: {
    status: 'ok' | 'degraded' | 'down';
    mode: 'ok' | 'demo' | 'degraded';
    ai: 'ok' | 'demo' | 'down';
    search: 'ok' | 'demo' | 'down';
  };
  api: {
    status: 'ok' | 'degraded' | 'down';
    checks: {
      database: 'ok' | 'down';
      queues: 'ok' | 'down';
      integrations: 'ok' | 'down';
    };
  };
}

export default function SystemStatus(): void {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchSystemStatus = async () => {
    try {
      const [webHealth, apiHealth] = await Promise.all([
        fetch('/api/health/degraded').then(res => res.json()),
        fetch('http://localhost:4000/health/ready').then(res => res.json())
      ]);

      setSystemStatus({
        web: {
          status: webHealth.system_mode === 'ok' ? 'ok' : webHealth.system_mode === 'degraded' ? 'degraded' : 'down',
          mode: webHealth.system_mode,
          ai: webHealth.ia,
          search: webHealth.search
        },
        api: {
          status: apiHealth.status === 'ok' ? 'ok' : 'down',
          checks: apiHealth.checks || {
            database: 'ok',
            queues: 'ok',
            integrations: 'ok'
          }
        }
      });
    } catch (error) {
      console.error('Error fetching system status:', error);
      setSystemStatus({
        web: { status: 'down', mode: 'degraded', ai: 'down', search: 'down' },
        api: { status: 'down', checks: { database: 'down', queues: 'down', integrations: 'down' } }
      });
    } finally {
      setLoading(false);
      setLastUpdate(new Date());
    }
  };

  useEffect(() => {
    fetchSystemStatus();
    const interval = setInterval(fetchSystemStatus, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok': return 'text-green-600 bg-green-100';
      case 'degraded': return 'text-yellow-600 bg-yellow-100';
      case 'demo': return 'text-blue-600 bg-blue-100';
      case 'down': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ok': return '🟢';
      case 'degraded': return '🟡';
      case 'demo': return '🔵';
      case 'down': return '🔴';
      default: return '⚪';
    }
  };

  if (loading) {
    return (;
      <div className="fixed top-4 right-4 bg-white border rounded-lg shadow-lg p-4 min-w-[300px]">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
          <span className="ml-2 text-sm text-gray-600">Checking system status...</span>
        </div>
      </div>
    );
  }

  if (!systemStatus) {
    return null;
  }

  const overallStatus = systemStatus.web.status === 'ok' && systemStatus.api.status === 'ok' ? 'ok' :
                       systemStatus.web.status === 'down' || systemStatus.api.status === 'down' ? 'down' : 'degraded';

  return (;
    <div className="fixed top-4 right-4 bg-white border rounded-lg shadow-lg p-4 min-w-[300px] z-50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">System Status</h3>
        <div className="flex items-center space-x-2">
          <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(overallStatus)}`}>
            {getStatusIcon(overallStatus)} {overallStatus.toUpperCase()}
          </span>
          <button
            onClick={fetchSystemStatus}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            ↻
          </button>
        </div>
      </div>

      <div className="space-y-2 text-xs">
        {/* Web BFF Status */}
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Web BFF:</span>
          <div className="flex items-center space-x-1">
            <span className={`px-2 py-1 rounded ${getStatusColor(systemStatus.web.status)}`}>
              {getStatusIcon(systemStatus.web.status)} {systemStatus.web.status}
            </span>
            {systemStatus.web.mode !== 'ok' && (
              <span className="text-xs text-gray-500">({systemStatus.web.mode})</span>
            )}
          </div>
        </div>

        {/* API Status */}
        <div className="flex items-center justify-between">
          <span className="text-gray-600">API Express:</span>
          <span className={`px-2 py-1 rounded ${getStatusColor(systemStatus.api.status)}`}>
            {getStatusIcon(systemStatus.api.status)} {systemStatus.api.status}
          </span>
        </div>

        {/* AI Status */}
        <div className="flex items-center justify-between">
          <span className="text-gray-600">AI Service:</span>
          <span className={`px-2 py-1 rounded ${getStatusColor(systemStatus.web.ai)}`}>
            {getStatusIcon(systemStatus.web.ai)} {systemStatus.web.ai}
          </span>
        </div>

        {/* Search Status */}
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Search Service:</span>
          <span className={`px-2 py-1 rounded ${getStatusColor(systemStatus.web.search)}`}>
            {getStatusIcon(systemStatus.web.search)} {systemStatus.web.search}
          </span>
        </div>

        {/* API Checks */}
        {systemStatus.api.status === 'ok' && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <div className="text-gray-600 mb-1">API Checks:</div>
            <div className="grid grid-cols-3 gap-1 text-xs">
              <div className="flex items-center justify-between">
                <span>DB:</span>
                <span className={systemStatus.api.checks.database === 'ok' ? 'text-green-600' : 'text-red-600'}>
                  {systemStatus.api.checks.database === 'ok' ? '✓' : '✗'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Queues:</span>
                <span className={systemStatus.api.checks.queues === 'ok' ? 'text-green-600' : 'text-red-600'}>
                  {systemStatus.api.checks.queues === 'ok' ? '✓' : '✗'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Integrations:</span>
                <span className={systemStatus.api.checks.integrations === 'ok' ? 'text-green-600' : 'text-red-600'}>
                  {systemStatus.api.checks.integrations === 'ok' ? '✓' : '✗'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 pt-2 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          Last update: {lastUpdate.toLocaleTimeString()}
        </div>
      </div>

      {/* Degradation Notice */}
      {overallStatus !== 'ok' && (
        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
          <div className="font-medium text-yellow-800 mb-1">System Notice:</div>
          {overallStatus === 'down' ? (
            <div className="text-yellow-700">
              System is currently unavailable. Some features may not work properly.
            </div>
          ) : (
            <div className="text-yellow-700">
              System is running in degraded mode. Some features may have limited functionality.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
