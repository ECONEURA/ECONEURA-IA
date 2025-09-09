'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Shield,
  Users,
  Key,
  Lock,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Zap,
  User,
  Smartphone,
  Mail,
  Database,
  Activity,
  BarChart3,
  Gauge,
  LineChart,
  PieChart,
  Table,
  Globe,
  MapPin,
  ShieldCheck,
  Fingerprint,
  Settings
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  username: string;
  mfaEnabled: boolean;
  roles: string[];
  permissions: string[];
  lastLogin: Date;
  failedLoginAttempts: number;
  lockedUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface MFAMethod {
  id: string;
  userId: string;
  type: 'totp' | 'sms' | 'email' | 'hardware';
  secret?: string;
  phoneNumber?: string;
  email?: string;
  verified: boolean;
  createdAt: Date;
}

interface APIToken {
  id: string;
  userId: string;
  name: string;
  token: string;
  scopes: string[];
  expiresAt?: Date;
  lastUsed?: Date;
  createdAt: Date;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  orgId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
  orgId: string;
  createdAt: Date;
}

interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  success: boolean;
  errorMessage?: string;
}

interface SecurityEvent {
  id: string;
  type: 'login_attempt' | 'mfa_attempt' | 'permission_denied' | 'anomaly_detected' | 'threat_detected';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  ipAddress: string;
  userAgent: string;
  details: Record<string, any>;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
}

interface ThreatIntelligence {
  ipAddress: string;
  reputation: 'good' | 'suspicious' | 'malicious';
  country: string;
  city?: string;
  isp?: string;
  threatTypes: string[];
  lastSeen: Date;
  confidence: number;
}

interface SecurityStats {
  totalUsers: number;
  mfaEnabledUsers: number;
  activeAPITokens: number;
  totalRoles: number;
  totalPermissions: number;
  auditLogsCount: number;
  securityEventsCount: number;
  threatIntelligenceCount: number;
}

export default function AdvancedSecurityDashboard(): void {
  const [users, setUsers] = useState<User[]>([]);
  const [mfaMethods, setMFAMethods] = useState<MFAMethod[]>([]);
  const [apiTokens, setAPITokens] = useState<APIToken[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [threatIntelligence, setThreatIntelligence] = useState<ThreatIntelligence[]>([]);
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshInterval, setRefreshInterval] = useState(30);

  useEffect(() => {
    fetchSecurityData();
    const interval = setInterval(fetchSecurityData, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const fetchSecurityData = async () => {
    try {
      setLoading(true);
      const [
        usersRes,
        rolesRes,
        permissionsRes,
        auditRes,
        eventsRes,
        threatsRes,
        statsRes
      ] = await Promise.all([
        fetch('/api/security/users'),
        fetch('/api/security/roles'),
        fetch('/api/security/permissions'),
        fetch('/api/security/audit?limit=50'),
        fetch('/api/security/events?limit=50'),
        fetch('/api/security/threats'),
        fetch('/api/security/stats')
      ]);

      if (usersRes.ok) setUsers(await usersRes.json());
      if (rolesRes.ok) setRoles(await rolesRes.json());
      if (permissionsRes.ok) setPermissions(await permissionsRes.json());
      if (auditRes.ok) setAuditLogs(await auditRes.json());
      if (eventsRes.ok) setSecurityEvents(await eventsRes.json());
      if (threatsRes.ok) setThreatIntelligence(await threatsRes.json());
      if (statsRes.ok) setStats(await statsRes.json());

      setError(null);
    } catch (err) {
      setError('Failed to fetch security data');
      console.error('Security data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-blue-100 text-blue-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getReputationColor = (reputation: string) => {
    switch (reputation) {
      case 'good': return 'text-green-600';
      case 'suspicious': return 'text-yellow-600';
      case 'malicious': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleString();
  };

  const getMFAIcon = (type: string) => {
    switch (type) {
      case 'totp': return <Smartphone className="h-4 w-4" />;
      case 'sms': return <Smartphone className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      case 'hardware': return <Key className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  if (loading && !stats) {
    return (;
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (;
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Advanced Security Dashboard</h1>
          <p className="text-gray-600">Comprehensive security monitoring and management</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            className="border rounded px-3 py-1"
          >
            <option value={5}>5s refresh</option>
            <option value={15}>15s refresh</option>
            <option value={30}>30s refresh</option>
            <option value={60}>1m refresh</option>
          </select>
          <Button onClick={fetchSecurityData} variant="outline">
            <Zap className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Users</p>
                  <p className="text-lg font-semibold">{stats.totalUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">MFA Enabled</p>
                  <p className="text-lg font-semibold">{stats.mfaEnabledUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Key className="h-4 w-4 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">API Tokens</p>
                  <p className="text-lg font-semibold">{stats.activeAPITokens}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">Roles</p>
                  <p className="text-lg font-semibold">{stats.totalRoles}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Lock className="h-4 w-4 text-indigo-600" />
                <div>
                  <p className="text-sm text-gray-600">Permissions</p>
                  <p className="text-lg font-semibold">{stats.totalPermissions}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Eye className="h-4 w-4 text-cyan-600" />
                <div>
                  <p className="text-sm text-gray-600">Audit Logs</p>
                  <p className="text-lg font-semibold">{stats.auditLogsCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <div>
                  <p className="text-sm text-gray-600">Security Events</p>
                  <p className="text-lg font-semibold">{stats.securityEventsCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Globe className="h-4 w-4 text-yellow-600" />
                <div>
                  <p className="text-sm text-gray-600">Threat Intel</p>
                  <p className="text-lg font-semibold">{stats.threatIntelligenceCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="mfa">MFA</TabsTrigger>
          <TabsTrigger value="tokens">API Tokens</TabsTrigger>
          <TabsTrigger value="rbac">RBAC</TabsTrigger>
          <TabsTrigger value="audit">Audit</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="threats">Threats</TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="font-medium">{user.username}</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <p className="text-xs text-gray-500">
                          Last login: {formatDate(user.lastLogin)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">{user.roles.join(', ')}</p>
                        <p className="text-sm text-gray-600">
                          {user.permissions.length} permissions
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Badge variant={user.mfaEnabled ? 'default' : 'secondary'}>
                          {user.mfaEnabled ? 'MFA Enabled' : 'MFA Disabled'}
                        </Badge>
                        {user.lockedUntil && (
                          <Badge variant="destructive">
                            Locked
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* MFA Tab */}
        <TabsContent value="mfa" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Multi-Factor Authentication</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mfaMethods.map((method) => (
                  <div key={method.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      {getMFAIcon(method.type)}
                      <div>
                        <p className="font-medium">{method.type.toUpperCase()}</p>
                        <p className="text-sm text-gray-600">
                          {method.phoneNumber || method.email || 'No contact info'}
                        </p>
                        <p className="text-xs text-gray-500">
                          Created: {formatDate(method.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Badge variant={method.verified ? 'default' : 'secondary'}>
                        {method.verified ? 'Verified' : 'Pending'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Tokens Tab */}
        <TabsContent value="tokens" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Token Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {apiTokens.map((token) => (
                  <div key={token.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Key className="h-4 w-4" />
                      <div>
                        <p className="font-medium">{token.name}</p>
                        <p className="text-sm text-gray-600">
                          Token: {token.token.substring(0, 20)}...
                        </p>
                        <p className="text-xs text-gray-500">
                          Created: {formatDate(token.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">{token.scopes.join(', ')}</p>
                        {token.lastUsed && (
                          <p className="text-xs text-gray-500">
                            Last used: {formatDate(token.lastUsed)}
                          </p>
                        )}
                      </div>
                      <Badge variant={token.expiresAt && token.expiresAt < new Date() ? 'destructive' : 'default'}>
                        {token.expiresAt && token.expiresAt < new Date() ? 'Expired' : 'Active'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* RBAC Tab */}
        <TabsContent value="rbac" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Roles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {roles.map((role) => (
                    <div key={role.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{role.name}</p>
                          <p className="text-sm text-gray-600">{role.description}</p>
                          <p className="text-xs text-gray-500">
                            {role.permissions.length} permissions
                          </p>
                        </div>
                        <Badge variant="outline">
                          {role.orgId}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Permissions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {permissions.map((permission) => (
                    <div key={permission.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{permission.name}</p>
                          <p className="text-sm text-gray-600">{permission.description}</p>
                          <p className="text-xs text-gray-500">
                            {permission.resource}:{permission.action}
                          </p>
                        </div>
                        <Badge variant="outline">
                          {permission.orgId}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Audit Tab */}
        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Audit Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {auditLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${log.success ? 'bg-green-500' : 'bg-red-500'}`} />
                      <div>
                        <p className="font-medium">{log.action}</p>
                        <p className="text-sm text-gray-600">
                          {log.resource} {log.resourceId ? `(${log.resourceId})` : ''}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(log.timestamp)} | {log.ipAddress}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={log.success ? 'default' : 'destructive'}>
                        {log.success ? 'Success' : 'Failed'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {securityEvents.map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${
                        event.severity === 'critical' ? 'bg-red-500' :
                        event.severity === 'high' ? 'bg-orange-500' :
                        event.severity === 'medium' ? 'bg-yellow-500' :
                        'bg-blue-500'
                      }`} />
                      <div>
                        <p className="font-medium">{event.type.replace('_', ' ')}</p>
                        <p className="text-sm text-gray-600">
                          {event.ipAddress} | {event.userAgent.substring(0, 50)}...
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(event.timestamp)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Badge className={getSeverityColor(event.severity)}>
                        {event.severity}
                      </Badge>
                      <Badge variant={event.resolved ? 'default' : 'secondary'}>
                        {event.resolved ? 'Resolved' : 'Active'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Threats Tab */}
        <TabsContent value="threats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Threat Intelligence</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {threatIntelligence.map((threat) => (
                  <div key={threat.ipAddress} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Globe className="h-4 w-4" />
                      <div>
                        <p className="font-medium">{threat.ipAddress}</p>
                        <p className="text-sm text-gray-600">
                          <MapPin className="inline h-3 w-3 mr-1" />
                          {threat.country} {threat.city && `- ${threat.city}`}
                        </p>
                        <p className="text-xs text-gray-500">
                          Last seen: {formatDate(threat.lastSeen)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className={`text-sm font-medium ${getReputationColor(threat.reputation)}`}>
                          {threat.reputation}
                        </p>
                        <p className="text-xs text-gray-500">
                          Confidence: {(threat.confidence * 100).toFixed(1)}%
                        </p>
                        {threat.threatTypes.length > 0 && (
                          <p className="text-xs text-red-600">
                            {threat.threatTypes.join(', ')}
                          </p>
                        )}
                      </div>
                      <Badge className={getSeverityColor(
                        threat.reputation === 'malicious' ? 'critical' :
                        threat.reputation === 'suspicious' ? 'high' : 'low'
                      )}>
                        {threat.reputation}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}



