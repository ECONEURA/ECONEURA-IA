'use client';

import { useState, useEffect } from 'react';

interface RLSStats {
  totalRules: number;
  activeRules: number;
  contextActive: boolean;
}

interface RLSContext {
  organizationId: string;
  userId?: string;
  role?: string;
  permissions?: string[];
  tenantId?: string;
  requestId?: string;
}

export default function RLSStatus() {
  const [stats, setStats] = useState<RLSStats | null>(null);
  const [context, setContext] = useState<RLSContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRLSData();
    const interval = setInterval(fetchRLSData, 30000); // Actualizar cada 30 segundos
    return () => clearInterval(interval);
  }, []);

  const fetchRLSData = async () => {
    try {
      setLoading(true);
      
      // Obtener estadísticas
      const statsResponse = await fetch('/api/rls/stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.data);
      }

      // Obtener contexto
      const contextResponse = await fetch('/api/rls/context');
      if (contextResponse.ok) {
        const contextData = await contextResponse.json();
        setContext(contextData.data);
      }

      setError(null);
    } catch (err) {
      setError('Failed to fetch RLS data');
      console.error('Error fetching RLS data:', err);
    } finally {
      setLoading(false);
    }
  };

  const testAccess = async (resource: string, action: string) => {
    try {
      const response = await fetch('/api/rls/check-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resource, action }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`${resource}:${action} - Access: ${data.data.hasAccess ? 'GRANTED' : 'DENIED'}`);
      }
    } catch (err) {
      console.error('Error testing access:', err);
      alert('Error testing access');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">🔒 Row Level Security</h3>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">🔒 Row Level Security</h3>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {stats && (
        <div className="mb-6">
          <h4 className="font-medium text-gray-700 mb-3">System Statistics</h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.totalRules}</div>
              <div className="text-sm text-gray-500">Total Rules</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.activeRules}</div>
              <div className="text-sm text-gray-500">Active Rules</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${stats.contextActive ? 'text-green-600' : 'text-red-600'}`}>
                {stats.contextActive ? '✓' : '✗'}
              </div>
              <div className="text-sm text-gray-500">Context Active</div>
            </div>
          </div>
        </div>
      )}

      {context && (
        <div className="mb-6">
          <h4 className="font-medium text-gray-700 mb-3">Current Context</h4>
          <div className="bg-gray-50 rounded p-3 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div><span className="font-medium">Organization:</span> {context.organizationId}</div>
              <div><span className="font-medium">User:</span> {context.userId || 'N/A'}</div>
              <div><span className="font-medium">Role:</span> {context.role || 'N/A'}</div>
              <div><span className="font-medium">Tenant:</span> {context.tenantId || 'N/A'}</div>
            </div>
            {context.permissions && context.permissions.length > 0 && (
              <div className="mt-2">
                <span className="font-medium">Permissions:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {context.permissions.map((permission, index) => (
                    <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                      {permission}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div>
        <h4 className="font-medium text-gray-700 mb-3">Access Tests</h4>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => testAccess('organizations', 'read')}
            className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-3 py-2 rounded"
          >
            Test: orgs:read
          </button>
          <button
            onClick={() => testAccess('budgets', 'write')}
            className="bg-green-500 hover:bg-green-600 text-white text-sm px-3 py-2 rounded"
          >
            Test: budgets:write
          </button>
          <button
            onClick={() => testAccess('users', 'delete')}
            className="bg-red-500 hover:bg-red-600 text-white text-sm px-3 py-2 rounded"
          >
            Test: users:delete
          </button>
          <button
            onClick={() => testAccess('admin', 'all')}
            className="bg-purple-500 hover:bg-purple-600 text-white text-sm px-3 py-2 rounded"
          >
            Test: admin:all
          </button>
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-500">
        <p>🔒 RLS ensures data isolation between organizations</p>
        <p>🛡️ Access control based on roles and permissions</p>
        <p>📊 Real-time monitoring of security context</p>
      </div>
    </div>
  );
}
