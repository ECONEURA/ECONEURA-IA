/**
 * Advanced Reporting Dashboard
 * 
 * This component provides a comprehensive dashboard for managing advanced reports,
 * including creation, scheduling, generation, templates, and analytics.
 */

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Play, 
  Clock, 
  Download, 
  Settings, 
  BarChart3, 
  PieChart, 
  TrendingUp,
  Calendar,
  Users,
  Filter,
  Search,
  MoreVertical,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Edit,
  Trash2,
  Copy,
  Share
} from 'lucide-react';

interface Report {
  id: string;
  name: string;
  description?: string;
  type: 'executive' | 'operational' | 'analytics' | 'custom';
  format: 'pdf' | 'excel' | 'json' | 'csv';
  isActive: boolean;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  lastGenerated?: string;
  schedule?: {
    frequency: string;
    time: string;
    isActive: boolean;
  };
  recipients?: string[];
}

interface ReportGeneration {
  id: string;
  reportId: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  progress: number;
  generatedBy: string;
  createdAt: string;
  generatedAt?: string;
  fileUrl?: string;
  errorMessage?: string;
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
  template: string;
  sampleData: any[];
}

interface ReportAnalytics {
  totalReports: number;
  totalGenerations: number;
  successfulGenerations: number;
  failedGenerations: number;
  averageGenerationTime: number;
  mostPopularFormat: string;
  scheduledReports: number;
}

export const AdvancedReportingDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'reports' | 'templates' | 'analytics'>('overview');
  const [reports, setReports] = useState<Report[]>([]);
  const [generations, setGenerations] = useState<ReportGeneration[]>([]);
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [analytics, setAnalytics] = useState<ReportAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  // Mock data - in real implementation, this would come from API
  useEffect(() => {
    const mockReports: Report[] = [
      {
        id: '1',
        name: 'Executive Monthly Report',
        description: 'High-level overview of key business metrics',
        type: 'executive',
        format: 'pdf',
        isActive: true,
        isPublic: false,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
        lastGenerated: '2024-01-14T06:00:00Z',
        schedule: {
          frequency: 'monthly',
          time: '06:00',
          isActive: true
        },
        recipients: ['executives@company.com']
      },
      {
        id: '2',
        name: 'Operational Dashboard',
        description: 'Detailed operational metrics and KPIs',
        type: 'operational',
        format: 'excel',
        isActive: true,
        isPublic: true,
        createdAt: '2024-01-10T14:30:00Z',
        updatedAt: '2024-01-12T09:15:00Z',
        lastGenerated: '2024-01-13T08:00:00Z',
        schedule: {
          frequency: 'weekly',
          time: '08:00',
          isActive: true
        }
      },
      {
        id: '3',
        name: 'Analytics Deep Dive',
        description: 'Comprehensive analytics and insights',
        type: 'analytics',
        format: 'json',
        isActive: false,
        isPublic: false,
        createdAt: '2024-01-08T16:45:00Z',
        updatedAt: '2024-01-08T16:45:00Z'
      }
    ];

    const mockGenerations: ReportGeneration[] = [
      {
        id: 'gen1',
        reportId: '1',
        status: 'completed',
        progress: 100,
        generatedBy: 'system',
        createdAt: '2024-01-14T06:00:00Z',
        generatedAt: '2024-01-14T06:02:30Z',
        fileUrl: '/reports/executive-monthly-2024-01.pdf'
      },
      {
        id: 'gen2',
        reportId: '2',
        status: 'generating',
        progress: 65,
        generatedBy: 'admin',
        createdAt: '2024-01-15T10:30:00Z'
      },
      {
        id: 'gen3',
        reportId: '3',
        status: 'failed',
        progress: 0,
        generatedBy: 'user1',
        createdAt: '2024-01-15T09:15:00Z',
        errorMessage: 'Data source unavailable'
      }
    ];

    const mockTemplates: ReportTemplate[] = [
      {
        id: 'executive_summary',
        name: 'Executive Summary',
        description: 'High-level overview of key business metrics',
        type: 'executive',
        template: 'executive_summary',
        sampleData: []
      },
      {
        id: 'operational_dashboard',
        name: 'Operational Dashboard',
        description: 'Detailed operational metrics and KPIs',
        type: 'operational',
        template: 'operational_dashboard',
        sampleData: []
      },
      {
        id: 'analytics_report',
        name: 'Analytics Report',
        description: 'Comprehensive analytics and insights',
        type: 'analytics',
        template: 'analytics_report',
        sampleData: []
      }
    ];

    const mockAnalytics: ReportAnalytics = {
      totalReports: 3,
      totalGenerations: 15,
      successfulGenerations: 12,
      failedGenerations: 3,
      averageGenerationTime: 2.5,
      mostPopularFormat: 'pdf',
      scheduledReports: 2
    };

    setReports(mockReports);
    setGenerations(mockGenerations);
    setTemplates(mockTemplates);
    setAnalytics(mockAnalytics);
    setLoading(false);
  }, []);

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || report.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'generating':
        return <Clock className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'executive':
        return 'bg-purple-100 text-purple-800';
      case 'operational':
        return 'bg-blue-100 text-blue-800';
      case 'analytics':
        return 'bg-green-100 text-green-800';
      case 'custom':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'pdf':
        return <FileText className="w-4 h-4 text-red-500" />;
      case 'excel':
        return <BarChart3 className="w-4 h-4 text-green-500" />;
      case 'json':
        return <Settings className="w-4 h-4 text-blue-500" />;
      case 'csv':
        return <PieChart className="w-4 h-4 text-orange-500" />;
      default:
        return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Advanced Reporting System</h1>
          <p className="text-gray-600">Manage, generate, and schedule comprehensive business reports</p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'reports', label: 'Reports', icon: FileText },
              { id: 'templates', label: 'Templates', icon: Copy },
              { id: 'analytics', label: 'Analytics', icon: TrendingUp }
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
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Reports</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics?.totalReports || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Successful Generations</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics?.successfulGenerations || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Calendar className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Scheduled Reports</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics?.scheduledReports || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Clock className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Avg. Generation Time</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics?.averageGenerationTime || 0}m</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Generations */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Recent Generations</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {generations.slice(0, 5).map((generation) => {
                    const report = reports.find(r => r.id === generation.reportId);
                    return (
                      <div key={generation.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-4">
                          {getStatusIcon(generation.status)}
                          <div>
                            <p className="font-medium text-gray-900">{report?.name || 'Unknown Report'}</p>
                            <p className="text-sm text-gray-500">
                              Generated by {generation.generatedBy} • {new Date(generation.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {generation.status === 'generating' && (
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${generation.progress}%` }}
                              ></div>
                            </div>
                          )}
                          {generation.status === 'completed' && generation.fileUrl && (
                            <button className="p-2 text-gray-400 hover:text-gray-600">
                              <Download className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            {/* Actions Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search reports..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Types</option>
                  <option value="executive">Executive</option>
                  <option value="operational">Operational</option>
                  <option value="analytics">Analytics</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Create Report</span>
              </button>
            </div>

            {/* Reports Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredReports.map((report) => (
                <div key={report.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        {getFormatIcon(report.format)}
                        <div>
                          <h3 className="font-medium text-gray-900">{report.name}</h3>
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(report.type)}`}>
                            {report.type}
                          </span>
                        </div>
                      </div>
                      <button className="p-1 text-gray-400 hover:text-gray-600">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>

                    {report.description && (
                      <p className="text-sm text-gray-600 mb-4">{report.description}</p>
                    )}

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Status:</span>
                        <span className={`font-medium ${report.isActive ? 'text-green-600' : 'text-gray-500'}`}>
                          {report.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      {report.schedule && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Schedule:</span>
                          <span className="font-medium text-gray-900">
                            {report.schedule.frequency} at {report.schedule.time}
                          </span>
                        </div>
                      )}
                      {report.lastGenerated && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Last Generated:</span>
                          <span className="font-medium text-gray-900">
                            {new Date(report.lastGenerated).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <button className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
                        <Play className="w-4 h-4" />
                        <span>Generate</span>
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600">
                        <Share className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template) => (
                <div key={template.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-medium text-gray-900">{template.name}</h3>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(template.type)}`}>
                          {template.type}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-4">{template.description}</p>

                    <button className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      <Plus className="w-4 h-4" />
                      <span>Use Template</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && analytics && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Generation Success Rate</h3>
                <div className="text-3xl font-bold text-green-600">
                  {((analytics.successfulGenerations / analytics.totalGenerations) * 100).toFixed(1)}%
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {analytics.successfulGenerations} of {analytics.totalGenerations} generations successful
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Most Popular Format</h3>
                <div className="text-3xl font-bold text-blue-600 capitalize">
                  {analytics.mostPopularFormat}
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Most frequently used export format
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Scheduled Reports</h3>
                <div className="text-3xl font-bold text-purple-600">
                  {analytics.scheduledReports}
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Active scheduled reports
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Generation History</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {generations.map((generation) => {
                    const report = reports.find(r => r.id === generation.reportId);
                    return (
                      <div key={generation.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-4">
                          {getStatusIcon(generation.status)}
                          <div>
                            <p className="font-medium text-gray-900">{report?.name || 'Unknown Report'}</p>
                            <p className="text-sm text-gray-500">
                              {generation.status} • {new Date(generation.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          {generation.generatedBy}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedReportingDashboard;
