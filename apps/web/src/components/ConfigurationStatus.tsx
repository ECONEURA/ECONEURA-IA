'use client';

import { useState, useEffect } from 'react';

interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  environment: string;
  rolloutPercentage: number;
  targetUsers: string[];
  targetOrganizations: string[];
  conditions: any[];
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
}

interface ConfigurationStats {
  totalFeatureFlags: number;
  enabledFeatureFlags: number;
  environments: string[];
  totalConfigValues: number;
  totalSecrets: number;
}

export default function ConfigurationStatus(): void {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [stats, setStats] = useState<ConfigurationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newFlag, setNewFlag] = useState({
    name: 'test-feature',
    description: 'Test feature flag',
    enabled: true,
    environment: 'development',
    rolloutPercentage: 100,
    targetUsers: [],
    targetOrganizations: [],
    conditions: [],
  });

  useEffect(() => {
    fetchConfigurationData();
    const interval = setInterval(fetchConfigurationData, 30000); // Actualizar cada 30 segundos
    return () => clearInterval(interval);
  }, []);

  const fetchConfigurationData = async () => {
    try {
      setLoading(true);

      // Obtener feature flags
      const flagsResponse = await fetch('/api/config/feature-flags');
      if (flagsResponse.ok) {
        const flagsData = await flagsResponse.json();
        setFlags(flagsData.data.flags);
      }

      // Obtener estadísticas
      const statsResponse = await fetch('/api/config/stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.data);
      }

      setError(null);
    } catch (err) {
      setError('Failed to fetch configuration data');
      console.error('Error fetching configuration data:', err);
    } finally {
      setLoading(false);
    }
  };

  const createFeatureFlag = async () => {
    try {
      const response = await fetch('/api/config/feature-flags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newFlag),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Feature flag created successfully!\nFlag ID: ${result.data.flagId}`);
        fetchConfigurationData(); // Refresh data
      } else {
        const error = await response.json();
        alert(`Feature flag creation failed: ${error.error}`);
      }
    } catch (err) {
      console.error('Error creating feature flag:', err);
      alert('Error creating feature flag');
    }
  };

  const testFeatureFlag = async (flagId: string) => {
    try {
      const response = await fetch(`http://localhost:4000/v1/config/feature-flags/${flagId}/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'test-user-123',
          organizationId: 'test-org-456',
          userRole: 'admin',
          userEmail: 'test@example.com',
        }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Feature flag check result:\nFlag ID: ${result.data.flagId}\nEnabled: ${result.data.isEnabled}`);
      } else {
        const error = await response.json();
        alert(`Feature flag check failed: ${error.error}`);
      }
    } catch (err) {
      console.error('Error testing feature flag:', err);
      alert('Error testing feature flag');
    }
  };

  const getEnvironmentColor = (environment: string) => {
    switch (environment) {
      case 'development': return 'text-blue-600';
      case 'staging': return 'text-yellow-600';
      case 'production': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getRolloutColor = (percentage: number) => {
    if (percentage === 100) return 'text-green-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (;
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">⚙️ Configuration & Feature Flags</h3>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (;
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">⚙️ Configuration & Feature Flags</h3>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {stats && (
        <div className="mb-6">
          <h4 className="font-medium text-gray-700 mb-3">System Statistics</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h5 className="font-medium text-sm text-gray-600 mb-2">Feature Flags</h5>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">{stats.totalFeatureFlags}</div>
                  <div className="text-gray-500">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">{stats.enabledFeatureFlags}</div>
                  <div className="text-gray-500">Enabled</div>
                </div>
              </div>
            </div>
            <div>
              <h5 className="font-medium text-sm text-gray-600 mb-2">Environments</h5>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-600">{stats.environments.length}</div>
                  <div className="text-gray-500">Environments</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-orange-600">{stats.totalConfigValues}</div>
                  <div className="text-gray-500">Config Values</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6">
        <h4 className="font-medium text-gray-700 mb-3">Create Feature Flag</h4>
        <div className="border rounded p-3">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
              <input
                type="text"
                value={newFlag.name}
                onChange={(e) => setNewFlag({ ...newFlag, name: e.target.value })}
                className="w-full px-2 py-1 text-sm border rounded"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Environment</label>
              <select
                value={newFlag.environment}
                onChange={(e) => setNewFlag({ ...newFlag, environment: e.target.value })}
                className="w-full px-2 py-1 text-sm border rounded"
              >
                <option value="development">Development</option>
                <option value="staging">Staging</option>
                <option value="production">Production</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Rollout %</label>
              <input
                type="number"
                min="0"
                max="100"
                value={newFlag.rolloutPercentage}
                onChange={(e) => setNewFlag({ ...newFlag, rolloutPercentage: parseInt(e.target.value) })}
                className="w-full px-2 py-1 text-sm border rounded"
              />
            </div>
            <div className="flex items-center">
              <label className="flex items-center text-xs font-medium text-gray-600">
                <input
                  type="checkbox"
                  checked={newFlag.enabled}
                  onChange={(e) => setNewFlag({ ...newFlag, enabled: e.target.checked })}
                  className="mr-2"
                />
                Enabled
              </label>
            </div>
          </div>
          <button
            onClick={createFeatureFlag}
            className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-3 py-1 rounded"
          >
            Create Feature Flag
          </button>
        </div>
      </div>

      {flags.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium text-gray-700 mb-3">Feature Flags ({flags.length})</h4>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {flags.map((flag) => (
              <div key={flag.id} className="border rounded p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="font-medium">{flag.name}</h5>
                    <p className="text-sm text-gray-500">{flag.description}</p>
                    <p className="text-xs text-gray-400">
                      v{flag.environment} | Created: {new Date(flag.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-medium ${flag.enabled ? 'text-green-600' : 'text-red-600'}`}>
                      {flag.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                    <div className={`text-xs ${getEnvironmentColor(flag.environment)}`}>
                      {flag.environment}
                    </div>
                    <div className={`text-xs ${getRolloutColor(flag.rolloutPercentage)}`}>
                      {flag.rolloutPercentage}% rollout
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex justify-between items-center">
                  <div className="text-xs text-gray-500">
                    Target Users: {flag.targetUsers.length} |
                    Target Orgs: {flag.targetOrganizations.length} |
                    Conditions: {flag.conditions.length}
                  </div>
                  <button
                    onClick={() => testFeatureFlag(flag.id)}
                    className="bg-green-500 hover:bg-green-600 text-white text-xs px-2 py-1 rounded"
                  >
                    Test
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-xs text-gray-500">
        <p>⚙️ Feature flags with rollout percentages and targeting</p>
        <p>🌍 Environment-specific configuration management</p>
        <p>🔒 Secure secrets and config values</p>
        <p>📊 Real-time configuration statistics</p>
      </div>
    </div>
  );
}
