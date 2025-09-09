'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Shield,
  AlertTriangle,
  FileText,
  BarChart3,
  Eye,
  Plus,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Activity,
  Users,
  Lock,
  AlertCircle
} from 'lucide-react';
import {
  useAuditEvents,
  useLogAuditEvent,
  useComplianceRules,
  useCreateComplianceRule,
  useComplianceViolations,
  useUpdateViolationStatus,
  useGenerateAuditReport,
  useAuditReports,
  useComplianceMetrics,
  useAuditComplianceHealth,
  AuditEvent,
  ComplianceRule,
  ComplianceViolation,
  AuditReport,
  ComplianceMetrics
} from '@/hooks/use-advanced-audit-compliance';

interface AdvancedAuditComplianceDashboardProps {
  organizationId?: string;
}

export function AdvancedAuditComplianceDashboard({
  organizationId = 'default'
}: AdvancedAuditComplianceDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleDescription, setNewRuleDescription] = useState('');
  const [newRuleFramework, setNewRuleFramework] = useState<string>('');

  // Hooks
  const { data: auditEvents, isLoading: eventsLoading } = useAuditEvents({
    organizationId,
    severity: selectedSeverity || undefined,
    limit: 50
  });

  const { data: complianceRules, isLoading: rulesLoading } = useComplianceRules();
  const { data: violations, isLoading: violationsLoading } = useComplianceViolations({
    organizationId,
    limit: 20
  });
  const { data: metrics, isLoading: metricsLoading } = useComplianceMetrics(organizationId);
  const { data: health, isLoading: healthLoading } = useAuditComplianceHealth();
  const { data: reports, isLoading: reportsLoading } = useAuditReports(organizationId);

  const logAuditEvent = useLogAuditEvent();
  const createRule = useCreateComplianceRule();
  const updateViolationStatus = useUpdateViolationStatus();
  const generateReport = useGenerateAuditReport();

  // Handlers
  const handleLogTestEvent = async () => {
    await logAuditEvent.mutateAsync({
      userId: 'test-user',
      organizationId,
      action: 'read',
      resource: 'test_data',
      details: { test: true },
      severity: 'medium',
      compliance: {
        gdpr: true,
        sox: false,
        pci: false,
        hipaa: false,
        iso27001: true
      },
      riskScore: 65,
      tags: ['test', 'demo']
    });
  };

  const handleCreateRule = async () => {
    if (!newRuleName.trim() || !newRuleFramework) return;

    await createRule.mutateAsync({
      name: newRuleName,
      description: newRuleDescription,
      framework: newRuleFramework as any,
      conditions: {
        severity: ['high', 'critical']
      },
      actions: {
        alert: true,
        block: false,
        notify: ['admin@company.com'],
        escalate: true
      },
      isActive: true
    });

    setNewRuleName('');
    setNewRuleDescription('');
    setNewRuleFramework('');
  };

  const handleUpdateViolationStatus = async (violationId: string, status: string) => {
    await updateViolationStatus.mutateAsync({
      violationId,
      status,
      resolution: status === 'resolved' ? 'Resolved by admin' : undefined
    });
  };

  const handleGenerateReport = async () => {
    const endDate = new Date().toISOString();
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days ago

    await generateReport.mutateAsync({
      name: 'Monthly Compliance Report',
      description: 'Automated monthly compliance report',
      organizationId,
      period: { start: startDate, end: endDate },
      generatedBy: 'system'
    });
  };

  const getHealthStatus = () => {
    if (healthLoading) return { status: 'loading', color: 'text-gray-500' };
    if (health?.status === 'healthy') return { status: 'healthy', color: 'text-green-500' };
    return { status: 'degraded', color: 'text-yellow-500' };
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800';
      case 'investigating': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'false_positive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const healthStatus = getHealthStatus();

  return (;
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Advanced Audit & Compliance</h1>
          <p className="text-gray-600 mt-2">
            Monitor audit events, compliance violations, and generate comprehensive reports
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            {healthStatus.status === 'healthy' ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-yellow-500" />
            )}
            <span className={`text-sm font-medium ${healthStatus.color}`}>
              {healthStatus.status === 'loading' ? 'Checking...' :
               healthStatus.status === 'healthy' ? 'System Healthy' : 'System Degraded'}
            </span>
          </div>
          <Button onClick={handleLogTestEvent} disabled={logAuditEvent.isPending}>
            <Activity className="h-4 w-4 mr-2" />
            Test Event
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Events</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.totalEvents}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Violations</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.totalViolations}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Compliance Score</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.complianceScore}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <BarChart3 className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Risk Score</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.riskScore}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="violations">Violations</TabsTrigger>
          <TabsTrigger value="rules">Rules</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Framework Compliance */}
            <Card>
              <CardHeader>
                <CardTitle>Framework Compliance</CardTitle>
                <CardDescription>
                  Compliance scores by framework
                </CardDescription>
              </CardHeader>
              <CardContent>
                {metricsLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-600">Loading metrics...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {metrics && Object.entries(metrics.frameworkCompliance).map(([framework, score]) => (
                      <div key={framework} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Lock className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-900 uppercase">
                            {framework}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                score >= 90 ? 'bg-green-500' :
                                score >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${score}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-900 w-8">
                            {score}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Violations */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Violations</CardTitle>
                <CardDescription>
                  Latest compliance violations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {violationsLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-600">Loading violations...</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {violations?.violations?.slice(0, 5).map((violation: ComplianceViolation) => (
                      <div key={violation.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{violation.description}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(violation.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getSeverityColor(violation.severity)}>
                            {violation.severity}
                          </Badge>
                          <Badge className={getStatusColor(violation.status)}>
                            {violation.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Audit Events</CardTitle>
                  <CardDescription>
                    Monitor all audit events and activities
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-4">
                  <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search events..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {eventsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading events...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {auditEvents?.events?.map((event: AuditEvent) => (
                    <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Activity className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {event.action} on {event.resource}
                          </h4>
                          <p className="text-sm text-gray-600">
                            User: {event.userId} • {new Date(event.timestamp).toLocaleString()}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            {event.compliance.gdpr && <Badge variant="outline" className="text-xs">GDPR</Badge>}
                            {event.compliance.sox && <Badge variant="outline" className="text-xs">SOX</Badge>}
                            {event.compliance.pci && <Badge variant="outline" className="text-xs">PCI</Badge>}
                            {event.compliance.hipaa && <Badge variant="outline" className="text-xs">HIPAA</Badge>}
                            {event.compliance.iso27001 && <Badge variant="outline" className="text-xs">ISO27001</Badge>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            Risk: {event.riskScore}/100
                          </p>
                          <p className="text-sm text-gray-600">
                            {event.ipAddress}
                          </p>
                        </div>
                        <Badge className={getSeverityColor(event.severity)}>
                          {event.severity}
                        </Badge>
                      </div>
                    </div>
                  ))}

                  {auditEvents?.events?.length === 0 && (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Events Found</h3>
                      <p className="text-gray-600">
                        {searchTerm ? 'Try adjusting your search terms' : 'No audit events match the current filters'}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Violations Tab */}
        <TabsContent value="violations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Violations</CardTitle>
              <CardDescription>
                Manage and resolve compliance violations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {violationsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading violations...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {violations?.violations?.map((violation: ComplianceViolation) => (
                    <div key={violation.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                          <AlertTriangle className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{violation.description}</h4>
                          <p className="text-sm text-gray-600">
                            Rule: {violation.ruleId} • {new Date(violation.timestamp).toLocaleString()}
                          </p>
                          {violation.assignedTo && (
                            <p className="text-xs text-gray-500">
                              Assigned to: {violation.assignedTo}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {violation.details.riskScore}/100
                          </p>
                          <p className="text-sm text-gray-600">
                            {violation.details.event}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getSeverityColor(violation.severity)}>
                            {violation.severity}
                          </Badge>
                          <Badge className={getStatusColor(violation.status)}>
                            {violation.status}
                          </Badge>
                        </div>
                        {violation.status === 'open' && (
                          <Button
                            size="sm"
                            onClick={() => handleUpdateViolationStatus(violation.id, 'investigating')}
                            disabled={updateViolationStatus.isPending}
                          >
                            Investigate
                          </Button>
                        )}
                        {violation.status === 'investigating' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateViolationStatus(violation.id, 'resolved')}
                            disabled={updateViolationStatus.isPending}
                          >
                            Resolve
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}

                  {violations?.violations?.length === 0 && (
                    <div className="text-center py-8">
                      <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Violations</h3>
                      <p className="text-gray-600">All compliance rules are being followed</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rules Tab */}
        <TabsContent value="rules" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Create New Rule */}
            <Card>
              <CardHeader>
                <CardTitle>Create Compliance Rule</CardTitle>
                <CardDescription>
                  Define new compliance monitoring rules
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="ruleName">Rule Name</Label>
                  <Input
                    id="ruleName"
                    value={newRuleName}
                    onChange={(e) => setNewRuleName(e.target.value)}
                    placeholder="Enter rule name"
                  />
                </div>
                <div>
                  <Label htmlFor="ruleDescription">Description</Label>
                  <Textarea
                    id="ruleDescription"
                    value={newRuleDescription}
                    onChange={(e) => setNewRuleDescription(e.target.value)}
                    placeholder="Enter rule description"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="ruleFramework">Framework</Label>
                  <Select value={newRuleFramework} onValueChange={setNewRuleFramework}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select framework" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gdpr">GDPR</SelectItem>
                      <SelectItem value="sox">SOX</SelectItem>
                      <SelectItem value="pci">PCI DSS</SelectItem>
                      <SelectItem value="hipaa">HIPAA</SelectItem>
                      <SelectItem value="iso27001">ISO 27001</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleCreateRule}
                  disabled={!newRuleName.trim() || !newRuleFramework || createRule.isPending}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Rule
                </Button>
              </CardContent>
            </Card>

            {/* Existing Rules */}
            <Card>
              <CardHeader>
                <CardTitle>Compliance Rules</CardTitle>
                <CardDescription>
                  Active compliance monitoring rules
                </CardDescription>
              </CardHeader>
              <CardContent>
                {rulesLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-600">Loading rules...</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {complianceRules?.map((rule: ComplianceRule) => (
                      <div key={rule.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <h4 className="font-medium text-gray-900">{rule.name}</h4>
                          <p className="text-sm text-gray-600">{rule.description}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {rule.framework.toUpperCase()}
                            </Badge>
                            {rule.isActive ? (
                              <Badge variant="default" className="text-xs">Active</Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">Inactive</Badge>
                            )}
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Audit Reports</CardTitle>
                  <CardDescription>
                    Generate and view compliance reports
                  </CardDescription>
                </div>
                <Button onClick={handleGenerateReport} disabled={generateReport.isPending}>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {reportsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading reports...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reports?.map((report: AuditReport) => (
                    <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{report.name}</h4>
                          <p className="text-sm text-gray-600">{report.description}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(report.period.start).toLocaleDateString()} - {new Date(report.period.end).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {report.metrics.totalEvents} events
                          </p>
                          <p className="text-sm text-gray-600">
                            {report.metrics.complianceScore}% compliance
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">
                            {report.metrics.violations} violations
                          </Badge>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {reports?.length === 0 && (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Reports</h3>
                      <p className="text-gray-600">Generate your first compliance report</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
