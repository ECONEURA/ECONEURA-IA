'use client';

import { useState, useEffect } from 'react';

import { featureFlagsClient, useMultipleFeatureFlags } from '@/lib/feature-flags';

interface FeatureFlag {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  environment: string;
  rolloutPercentage: number;
  targetUsers: string[];
  targetOrganizations: string[];
  conditions: Array<{
    field: string;
    operator: string;
    value: string | number | boolean;
  }>;
}

interface Environment {
  name: string;
  description?: string;
  variables: Record<string, any>;
  secrets: string[];
  isActive: boolean;
}

interface ConfigStats {
  totalFeatureFlags: number;
  totalEnvironments: number;
  totalConfigValues: number;
  totalSecrets: number;
  featureFlagsByEnvironment: Record<string, number>;
  configValuesByEnvironment: Record<string, number>;
}

export default function ConfigurationDashboard() {
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([]);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [stats, setStats] = useState<ConfigStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEnvironment, setSelectedEnvironment] = useState<string>('development');
  const [activeTab, setActiveTab] = useState<'flags' | 'environments' | 'stats'>('flags');

  // Feature flags para el dashboard
  const { flags: dashboardFlags } = useMultipleFeatureFlags([
    'advanced_analytics',
    'beta_features',
    'ai_predictions'
  ]);

  // Cargar datos iniciales
  useEffect(() => {
    loadData();
  }, [selectedEnvironment]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [flagsResponse, environmentsResponse, statsResponse] = await Promise.all([
        featureFlagsClient.getFeatureFlags(selectedEnvironment),
        featureFlagsClient.getEnvironmentConfig(selectedEnvironment),
        featureFlagsClient.getConfigStats()
      ]);

      if (flagsResponse.success) {
        setFeatureFlags(flagsResponse.data);
      }

      if (environmentsResponse.success) {
        setEnvironments([environmentsResponse.data]);
      }

      if (statsResponse.success) {
        setStats(statsResponse.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load configuration data');
    } finally {
      setLoading(false);
    }
  };

  const toggleFeatureFlag = async (flagId: string, enabled: boolean) => {
    try {
      // Aquí implementarías la lógica para actualizar el feature flag
      console.log(`Toggling feature flag ${flagId} to ${enabled}`);
      
      // Recargar datos
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update feature flag');
    }
  };

  const updateRolloutPercentage = async (flagId: string, percentage: number) => {
    try {
      // Aquí implementarías la lógica para actualizar el porcentaje de rollout
      console.log(`Updating rollout percentage for ${flagId} to ${percentage}%`);
      
      // Recargar datos
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update rollout percentage');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading configuration</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <button
                onClick={loadData}
                className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Configuration Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage feature flags, environments, and configuration values
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={selectedEnvironment}
                onChange={(e) => setSelectedEnvironment(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="development">Development</option>
                <option value="staging">Staging</option>
                <option value="production">Production</option>
              </select>
              <button
                onClick={loadData}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'flags', name: 'Feature Flags', count: featureFlags.length },
              { id: 'environments', name: 'Environments', count: environments.length },
              { id: 'stats', name: 'Statistics', count: stats ? Object.keys(stats.featureFlagsByEnvironment).length : 0 }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.name}
                <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Feature Flags Tab */}
          {activeTab === 'flags' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Feature Flags</h3>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                  Add Feature Flag
                </button>
              </div>
              
              <div className="grid gap-4">
                {featureFlags.map((flag) => (
                  <div key={flag.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h4 className="text-sm font-medium text-gray-900">{flag.name}</h4>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            flag.enabled 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {flag.enabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                        {flag.description && (
                          <p className="mt-1 text-sm text-gray-500">{flag.description}</p>
                        )}
                        <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                          <span>Environment: {flag.environment}</span>
                          <span>Rollout: {flag.rolloutPercentage}%</span>
                          <span>Target Users: {flag.targetUsers.length}</span>
                          <span>Target Orgs: {flag.targetOrganizations.length}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleFeatureFlag(flag.id, !flag.enabled)}
                          className={`px-3 py-1 rounded-md text-xs font-medium ${
                            flag.enabled
                              ? 'bg-red-100 text-red-800 hover:bg-red-200'
                              : 'bg-green-100 text-green-800 hover:bg-green-200'
                          }`}
                        >
                          {flag.enabled ? 'Disable' : 'Enable'}
                        </button>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={flag.rolloutPercentage}
                          onChange={(e) => updateRolloutPercentage(flag.id, parseInt(e.target.value))}
                          className="w-20"
                        />
                        <span className="text-xs text-gray-500 w-8">{flag.rolloutPercentage}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Environments Tab */}
          {activeTab === 'environments' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Environments</h3>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                  Add Environment
                </button>
              </div>
              
              <div className="grid gap-4">
                {environments.map((env) => (
                  <div key={env.name} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h4 className="text-sm font-medium text-gray-900 capitalize">{env.name}</h4>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            env.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {env.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        {env.description && (
                          <p className="mt-1 text-sm text-gray-500">{env.description}</p>
                        )}
                        <div className="mt-2 text-xs text-gray-500">
                          <span>Variables: {Object.keys(env.variables).length}</span>
                          <span className="ml-4">Secrets: {env.secrets.length}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="bg-blue-100 text-blue-800 hover:bg-blue-200 px-3 py-1 rounded-md text-xs font-medium">
                          Edit
                        </button>
                        <button className="bg-gray-100 text-gray-800 hover:bg-gray-200 px-3 py-1 rounded-md text-xs font-medium">
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Statistics Tab */}
          {activeTab === 'stats' && stats && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Configuration Statistics</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-600">{stats.totalFeatureFlags}</div>
                  <div className="text-sm text-blue-800">Feature Flags</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-600">{stats.totalEnvironments}</div>
                  <div className="text-sm text-green-800">Environments</div>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-yellow-600">{stats.totalConfigValues}</div>
                  <div className="text-sm text-yellow-800">Config Values</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-purple-600">{stats.totalSecrets}</div>
                  <div className="text-sm text-purple-800">Secrets</div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Feature Flags by Environment</h4>
                  <div className="space-y-2">
                    {Object.entries(stats.featureFlagsByEnvironment).map(([env, count]) => (
                      <div key={env} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 capitalize">{env}</span>
                        <span className="text-sm font-medium text-gray-900">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Config Values by Environment</h4>
                  <div className="space-y-2">
                    {Object.entries(stats.configValuesByEnvironment).map(([env, count]) => (
                      <div key={env} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 capitalize">{env}</span>
                        <span className="text-sm font-medium text-gray-900">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
