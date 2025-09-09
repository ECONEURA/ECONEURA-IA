/**
 * Advanced CI/CD Dashboard
 *
 * This component provides a comprehensive dashboard for managing advanced CI/CD operations,
 * including deployments, rollbacks, artifacts, test results, and analytics.
 */

import React, { useState, useEffect } from 'react';
import {
  GitBranch,
  Play,
  RotateCcw,
  Package,
  TestTube,
  BarChart3,
  Settings,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Download,
  Filter,
  Search,
  MoreVertical,
  Activity,
  Zap,
  Shield,
  Globe,
  Server,
  Database,
  Cpu,
  HardDrive,
  Wifi
} from 'lucide-react';

interface Deployment {
  id: string;
  version: string;
  environment: 'dev' | 'staging' | 'prod';
  strategy: 'blue_green' | 'rolling' | 'canary' | 'recreate';
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'rolled_back';
  startedAt: string;
  completedAt?: string;
  rollbackAt?: string;
  triggeredBy: string;
  commitSha: string;
  branch: string;
  buildNumber: string;
  healthChecks: HealthCheck[];
  metrics: DeploymentMetrics;
  rollbackReason?: string;
}

interface HealthCheck {
  name: string;
  url: string;
  status: 'pending' | 'passing' | 'failing';
  lastChecked: string;
  responseTime?: number;
  error?: string;
}

interface DeploymentMetrics {
  deploymentTime: number;
  downtime: number;
  errorRate: number;
  responseTime: number;
  throughput: number;
  resourceUsage: {
    cpu: number;
    memory: number;
    disk: number;
  };
}

interface BuildArtifact {
  id: string;
  name: string;
  version: string;
  type: 'api' | 'web' | 'workers' | 'infrastructure';
  size: number;
  checksum: string;
  createdAt: string;
}

interface TestResult {
  id: string;
  type: 'unit' | 'integration' | 'e2e' | 'performance' | 'security';
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  coverage?: number;
  results: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
  };
  createdAt: string;
}

interface DeploymentAnalytics {
  totalDeployments: number;
  successfulDeployments: number;
  failedDeployments: number;
  rollbackRate: number;
  averageDeploymentTime: number;
  averageDowntime: number;
  deploymentsByStrategy: Record<string, number>;
  deploymentsByStatus: Record<string, number>;
}

export const AdvancedCICDDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'deployments' | 'artifacts' | 'tests' | 'analytics'>('overview');
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [artifacts, setArtifacts] = useState<BuildArtifact[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [analytics, setAnalytics] = useState<DeploymentAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEnvironment, setFilterEnvironment] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Mock data - in real implementation, this would come from API
  useEffect(() => {
    const mockDeployments: Deployment[] = [
      {
        id: '1',
        version: 'v1.2.3',
        environment: 'prod',
        strategy: 'canary',
        status: 'completed',
        startedAt: '2024-01-15T10:00:00Z',
        completedAt: '2024-01-15T10:15:00Z',
        triggeredBy: 'admin',
        commitSha: 'abc123def456',
        branch: 'main',
        buildNumber: '1234',
        healthChecks: [
          { name: 'API Health', url: 'https://api.econeura.com/health', status: 'passing', lastChecked: '2024-01-15T10:15:00Z', responseTime: 120 },
          { name: 'Web Health', url: 'https://econeura.com/health', status: 'passing', lastChecked: '2024-01-15T10:15:00Z', responseTime: 95 },
          { name: 'Database Health', url: 'https://api.econeura.com/health/db', status: 'passing', lastChecked: '2024-01-15T10:15:00Z', responseTime: 45 }
        ],
        metrics: {
          deploymentTime: 900000, // 15 minutes
          downtime: 0,
          errorRate: 0.001,
          responseTime: 120,
          throughput: 1250,
          resourceUsage: { cpu: 45, memory: 60, disk: 25 }
        }
      },
      {
        id: '2',
        version: 'v1.2.2',
        environment: 'staging',
        strategy: 'blue_green',
        status: 'in_progress',
        startedAt: '2024-01-15T11:00:00Z',
        triggeredBy: 'ci-system',
        commitSha: 'def456ghi789',
        branch: 'develop',
        buildNumber: '1233',
        healthChecks: [
          { name: 'API Health', url: 'https://staging-api.econeura.com/health', status: 'pending', lastChecked: '2024-01-15T11:00:00Z' },
          { name: 'Web Health', url: 'https://staging.econeura.com/health', status: 'pending', lastChecked: '2024-01-15T11:00:00Z' }
        ],
        metrics: {
          deploymentTime: 0,
          downtime: 0,
          errorRate: 0,
          responseTime: 0,
          throughput: 0,
          resourceUsage: { cpu: 0, memory: 0, disk: 0 }
        }
      },
      {
        id: '3',
        version: 'v1.2.1',
        environment: 'prod',
        strategy: 'rolling',
        status: 'rolled_back',
        startedAt: '2024-01-14T14:00:00Z',
        completedAt: '2024-01-14T14:20:00Z',
        rollbackAt: '2024-01-14T14:25:00Z',
        triggeredBy: 'admin',
        commitSha: 'ghi789jkl012',
        branch: 'main',
        buildNumber: '1232',
        rollbackReason: 'High error rate detected',
        healthChecks: [
          { name: 'API Health', url: 'https://api.econeura.com/health', status: 'failing', lastChecked: '2024-01-14T14:20:00Z', error: 'Connection timeout' }
        ],
        metrics: {
          deploymentTime: 1200000, // 20 minutes
          downtime: 300000, // 5 minutes
          errorRate: 0.15,
          responseTime: 2500,
          throughput: 200,
          resourceUsage: { cpu: 85, memory: 90, disk: 45 }
        }
      }
    ];

    const mockArtifacts: BuildArtifact[] = [
      {
        id: '1',
        name: 'econeura-api',
        version: 'v1.2.3',
        type: 'api',
        size: 52428800, // 50MB
        checksum: 'sha256:abc123def456',
        createdAt: '2024-01-15T09:30:00Z'
      },
      {
        id: '2',
        name: 'econeura-web',
        version: 'v1.2.3',
        type: 'web',
        size: 104857600, // 100MB
        checksum: 'sha256:def456ghi789',
        createdAt: '2024-01-15T09:35:00Z'
      },
      {
        id: '3',
        name: 'econeura-workers',
        version: 'v1.2.3',
        type: 'workers',
        size: 31457280, // 30MB
        checksum: 'sha256:ghi789jkl012',
        createdAt: '2024-01-15T09:40:00Z'
      }
    ];

    const mockTestResults: TestResult[] = [
      {
        id: '1',
        type: 'unit',
        status: 'passed',
        duration: 45000, // 45 seconds
        coverage: 85,
        results: { total: 150, passed: 150, failed: 0, skipped: 0 },
        createdAt: '2024-01-15T09:00:00Z'
      },
      {
        id: '2',
        type: 'integration',
        status: 'passed',
        duration: 120000, // 2 minutes
        coverage: 72,
        results: { total: 45, passed: 45, failed: 0, skipped: 0 },
        createdAt: '2024-01-15T09:05:00Z'
      },
      {
        id: '3',
        type: 'e2e',
        status: 'passed',
        duration: 300000, // 5 minutes
        results: { total: 25, passed: 24, failed: 1, skipped: 0 },
        createdAt: '2024-01-15T09:10:00Z'
      },
      {
        id: '4',
        type: 'performance',
        status: 'passed',
        duration: 600000, // 10 minutes
        results: { total: 10, passed: 10, failed: 0, skipped: 0 },
        createdAt: '2024-01-15T09:15:00Z'
      },
      {
        id: '5',
        type: 'security',
        status: 'passed',
        duration: 180000, // 3 minutes
        results: { total: 8, passed: 8, failed: 0, skipped: 0 },
        createdAt: '2024-01-15T09:20:00Z'
      }
    ];

    const mockAnalytics: DeploymentAnalytics = {
      totalDeployments: 45,
      successfulDeployments: 42,
      failedDeployments: 2,
      rollbackRate: 0.067,
      averageDeploymentTime: 720000, // 12 minutes
      averageDowntime: 45000, // 45 seconds
      deploymentsByStrategy: {
        canary: 20,
        blue_green: 15,
        rolling: 8,
        recreate: 2
      },
      deploymentsByStatus: {
        completed: 42,
        failed: 2,
        rolled_back: 1
      }
    };

    setDeployments(mockDeployments);
    setArtifacts(mockArtifacts);
    setTestResults(mockTestResults);
    setAnalytics(mockAnalytics);
    setLoading(false);
  }, []);

  const filteredDeployments = deployments.filter(deployment => {
    const matchesSearch = deployment.version.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         deployment.branch.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         deployment.triggeredBy.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEnvironment = filterEnvironment === 'all' || deployment.environment === filterEnvironment;
    const matchesStatus = filterStatus === 'all' || deployment.status === filterStatus;
    return matchesSearch && matchesEnvironment && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'rolled_back':
        return <RotateCcw className="w-4 h-4 text-orange-500" />;
      case 'pending':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getEnvironmentColor = (environment: string) => {
    switch (environment) {
      case 'prod':
        return 'bg-red-100 text-red-800';
      case 'staging':
        return 'bg-yellow-100 text-yellow-800';
      case 'dev':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStrategyColor = (strategy: string) => {
    switch (strategy) {
      case 'canary':
        return 'bg-purple-100 text-purple-800';
      case 'blue_green':
        return 'bg-blue-100 text-blue-800';
      case 'rolling':
        return 'bg-green-100 text-green-800';
      case 'recreate':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getHealthCheckIcon = (status: string) => {
    switch (status) {
      case 'passing':
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      case 'failing':
        return <XCircle className="w-3 h-3 text-red-500" />;
      case 'pending':
        return <Clock className="w-3 h-3 text-yellow-500" />;
      default:
        return <AlertCircle className="w-3 h-3 text-gray-500" />;
    }
  };

  const getTestTypeIcon = (type: string) => {
    switch (type) {
      case 'unit':
        return <TestTube className="w-4 h-4 text-blue-500" />;
      case 'integration':
        return <GitBranch className="w-4 h-4 text-green-500" />;
      case 'e2e':
        return <Globe className="w-4 h-4 text-purple-500" />;
      case 'performance':
        return <Zap className="w-4 h-4 text-orange-500" />;
      case 'security':
        return <Shield className="w-4 h-4 text-red-500" />;
      default:
        return <TestTube className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  if (loading) {
    return (;
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (;
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Advanced CI/CD Dashboard</h1>
          <p className="text-gray-600">Manage deployments, artifacts, tests, and monitor CI/CD pipeline performance</p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'deployments', label: 'Deployments', icon: GitBranch },
              { id: 'artifacts', label: 'Artifacts', icon: Package },
              { id: 'tests', label: 'Tests', icon: TestTube },
              { id: 'analytics', label: 'Analytics', icon: Activity }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center space-x-2 px-3 py-2 border-b-2 font-medium text-sm ${
                  activeTab === id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <GitBranch className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Deployments</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics?.totalDeployments || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Success Rate</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {analytics ? ((analytics.successfulDeployments / analytics.totalDeployments) * 100).toFixed(1) : 0}%
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Clock className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Avg. Deploy Time</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {analytics ? formatDuration(analytics.averageDeploymentTime) : '0m 0s'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <RotateCcw className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Rollback Rate</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {analytics ? (analytics.rollbackRate * 100).toFixed(1) : 0}%
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Deployments */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Recent Deployments</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {deployments.slice(0, 5).map((deployment) => (
                    <div key={deployment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        {getStatusIcon(deployment.status)}
                        <div>
                          <p className="font-medium text-gray-900">{deployment.version}</p>
                          <p className="text-sm text-gray-500">
                            {deployment.environment} • {deployment.strategy} • {deployment.triggeredBy}
                          </p>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(deployment.startedAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Health Checks Status */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">System Health</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { name: 'API', status: 'passing', icon: Server },
                    { name: 'Web', status: 'passing', icon: Globe },
                    { name: 'Database', status: 'passing', icon: Database },
                    { name: 'Cache', status: 'passing', icon: HardDrive }
                  ].map(({ name, status, icon: Icon }) => (
                    <div key={name} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <Icon className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="font-medium text-gray-900">{name}</p>
                        <div className="flex items-center space-x-1">
                          {getHealthCheckIcon(status)}
                          <span className="text-sm text-gray-500 capitalize">{status}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Deployments Tab */}
        {activeTab === 'deployments' && (
          <div className="space-y-6">
            {/* Actions Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search deployments..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={filterEnvironment}
                  onChange={(e) => setFilterEnvironment(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Environments</option>
                  <option value="prod">Production</option>
                  <option value="staging">Staging</option>
                  <option value="dev">Development</option>
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="in_progress">In Progress</option>
                  <option value="failed">Failed</option>
                  <option value="rolled_back">Rolled Back</option>
                </select>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Play className="w-4 h-4" />
                <span>New Deployment</span>
              </button>
            </div>

            {/* Deployments List */}
            <div className="bg-white rounded-lg shadow">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Version</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Environment</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Strategy</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Health</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredDeployments.map((deployment) => (
                      <tr key={deployment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{deployment.version}</div>
                            <div className="text-sm text-gray-500">{deployment.branch}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getEnvironmentColor(deployment.environment)}`}>
                            {deployment.environment}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStrategyColor(deployment.strategy)}`}>
                            {deployment.strategy.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(deployment.status)}
                            <span className="text-sm text-gray-900 capitalize">{deployment.status.replace('_', ' ')}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {deployment.completedAt
                            ? formatDuration(new Date(deployment.completedAt).getTime() - new Date(deployment.startedAt).getTime())
                            : deployment.status === 'in_progress'
                              ? formatDuration(Date.now() - new Date(deployment.startedAt).getTime())
                              : '-'
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-1">
                            {deployment.healthChecks.map((check, index) => (
                              <div key={index} title={`${check.name}: ${check.status}`}>
                                {getHealthCheckIcon(check.status)}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button className="text-blue-600 hover:text-blue-900">
                              <Eye className="w-4 h-4" />
                            </button>
                            {deployment.status === 'completed' && (
                              <button className="text-orange-600 hover:text-orange-900">
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Artifacts Tab */}
        {activeTab === 'artifacts' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {artifacts.map((artifact) => (
                <div key={artifact.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <Package className="w-8 h-8 text-blue-500" />
                        <div>
                          <h3 className="font-medium text-gray-900">{artifact.name}</h3>
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStrategyColor(artifact.type)}`}>
                            {artifact.type}
                          </span>
                        </div>
                      </div>
                      <button className="p-1 text-gray-400 hover:text-gray-600">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Version:</span>
                        <span className="font-medium text-gray-900">{artifact.version}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Size:</span>
                        <span className="font-medium text-gray-900">{formatFileSize(artifact.size)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Created:</span>
                        <span className="font-medium text-gray-900">
                          {new Date(artifact.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
                        <Download className="w-4 h-4" />
                        <span>Download</span>
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600">
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tests Tab */}
        {activeTab === 'tests' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Test Results</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {testResults.map((test) => (
                    <div key={test.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        {getTestTypeIcon(test.type)}
                        <div>
                          <p className="font-medium text-gray-900 capitalize">{test.type} Tests</p>
                          <p className="text-sm text-gray-500">
                            {test.results.passed}/{test.results.total} passed • {formatDuration(test.duration)}
                            {test.coverage && ` • ${test.coverage}% coverage`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(test.status)}
                        <span className="text-sm text-gray-500">
                          {new Date(test.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && analytics && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Deployment Success Rate</h3>
                <div className="text-3xl font-bold text-green-600">
                  {((analytics.successfulDeployments / analytics.totalDeployments) * 100).toFixed(1)}%
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {analytics.successfulDeployments} of {analytics.totalDeployments} deployments successful
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Average Deployment Time</h3>
                <div className="text-3xl font-bold text-blue-600">
                  {formatDuration(analytics.averageDeploymentTime)}
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Average time to complete deployments
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Rollback Rate</h3>
                <div className="text-3xl font-bold text-orange-600">
                  {(analytics.rollbackRate * 100).toFixed(1)}%
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Percentage of deployments rolled back
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Deployments by Strategy</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {Object.entries(analytics.deploymentsByStrategy).map(([strategy, count]) => (
                      <div key={strategy} className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900 capitalize">
                          {strategy.replace('_', ' ')}
                        </span>
                        <span className="text-sm text-gray-500">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Deployments by Status</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {Object.entries(analytics.deploymentsByStatus).map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900 capitalize">
                          {status.replace('_', ' ')}
                        </span>
                        <span className="text-sm text-gray-500">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedCICDDashboard;
