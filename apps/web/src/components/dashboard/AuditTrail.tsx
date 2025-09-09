// ============================================================================
// AUDIT TRAIL - AUDIT LOG COMPONENT
// ============================================================================

'use client';

import React, { useState, useEffect } from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface AuditEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  resource: string;
  organizationId: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
}

interface AuditTrailProps {
  data?: any; // Optional metrics data
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function AuditTrail({ data }: AuditTrailProps): JSX.Element {
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<AuditEntry[]>([]);
  const [filter, setFilter] = useState<{
    user: string;
    action: string;
    resource: string;
    dateRange: string;
    search: string;
  }>({
    user: 'all',
    action: 'all',
    resource: 'all',
    dateRange: 'all',
    search: ''
  });

  // ============================================================================
  // MOCK DATA (Replace with real API call)
  // ============================================================================

  useEffect(() => {
    // Mock audit entries - replace with real API call
    const mockEntries: AuditEntry[] = [
      {
        id: 'audit-1',
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
        user: 'admin@econeura.com',
        action: 'login',
        resource: 'auth',
        organizationId: 'org-1',
        details: { method: 'password', success: true },
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      {
        id: 'audit-2',
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 minutes ago
        user: 'user@econeura.com',
        action: 'create',
        resource: 'contact',
        organizationId: 'org-1',
        details: { contactId: 'contact-123', name: 'John Doe' },
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      },
      {
        id: 'audit-3',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
        user: 'manager@econeura.com',
        action: 'update',
        resource: 'deal',
        organizationId: 'org-1',
        details: { dealId: 'deal-456', status: 'closed', value: 50000 },
        ipAddress: '192.168.1.102',
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
      },
      {
        id: 'audit-4',
        timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 minutes ago
        user: 'admin@econeura.com',
        action: 'delete',
        resource: 'user',
        organizationId: 'org-1',
        details: { userId: 'user-789', reason: 'inactive' },
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      {
        id: 'audit-5',
        timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
        user: 'user@econeura.com',
        action: 'view',
        resource: 'dashboard',
        organizationId: 'org-1',
        details: { page: 'metrics', duration: 120 },
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    ];

    setAuditEntries(mockEntries);
  }, []);

  // ============================================================================
  // FILTERING
  // ============================================================================

  useEffect(() => {
    let filtered = auditEntries;

    // Filter by user
    if (filter.user !== 'all') {
      filtered = filtered.filter(entry => entry.user === filter.user);
    }

    // Filter by action
    if (filter.action !== 'all') {
      filtered = filtered.filter(entry => entry.action === filter.action);
    }

    // Filter by resource
    if (filter.resource !== 'all') {
      filtered = filtered.filter(entry => entry.resource === filter.resource);
    }

    // Filter by date range
    if (filter.dateRange !== 'all') {
      const now = new Date();
      const cutoff = new Date();

      switch (filter.dateRange) {
        case '1h':
          cutoff.setHours(now.getHours() - 1);
          break;
        case '24h':
          cutoff.setDate(now.getDate() - 1);
          break;
        case '7d':
          cutoff.setDate(now.getDate() - 7);
          break;
        case '30d':
          cutoff.setDate(now.getDate() - 30);
          break;
      }

      filtered = filtered.filter(entry => new Date(entry.timestamp) >= cutoff);
    }

    // Filter by search
    if (filter.search) {
      filtered = filtered.filter(entry =>
        entry.user.toLowerCase().includes(filter.search.toLowerCase()) ||
        entry.action.toLowerCase().includes(filter.search.toLowerCase()) ||
        entry.resource.toLowerCase().includes(filter.search.toLowerCase()) ||
        entry.ipAddress.toLowerCase().includes(filter.search.toLowerCase())
      );
    }

    setFilteredEntries(filtered);
  }, [auditEntries, filter]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleFilterChange = (key: string, value: string): void => {
    setFilter(prev => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = (): void => {
    setFilter({
      user: 'all',
      action: 'all',
      resource: 'all',
      dateRange: 'all',
      search: ''
    });
  };

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const getActionColor = (action: string): string => {
    switch (action) {
      case 'create': return 'text-green-600 bg-green-100';
      case 'update': return 'text-blue-600 bg-blue-100';
      case 'delete': return 'text-red-600 bg-red-100';
      case 'login': return 'text-purple-600 bg-purple-100';
      case 'logout': return 'text-gray-600 bg-gray-100';
      case 'view': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getActionIcon = (action: string): JSX.Element => {
    switch (action) {
      case 'create':
        return (;
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
        );
      case 'update':
        return (;
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
          </svg>
        );
      case 'delete':
        return (;
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      case 'login':
        return (;
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        );
      case 'logout':
        return (;
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
          </svg>
        );
      case 'view':
        return (;
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (;
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const renderAuditEntry = (entry: AuditEntry): JSX.Element => (
    <div key={entry.id} className="bg-white p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className={`p-1 rounded-full ${getActionColor(entry.action)}`}>
            {getActionIcon(entry.action)}
          </div>

          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h4 className="font-medium text-gray-900">
                {entry.user} {entry.action}d {entry.resource}
              </h4>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionColor(entry.action)}`}>
                {entry.action.toUpperCase()}
              </span>
            </div>

            <p className="text-sm text-gray-600 mb-2">
              {entry.ipAddress} • {entry.userAgent.split(' ')[0]}...
            </p>

            <p className="text-xs text-gray-500 mb-2">
              {new Date(entry.timestamp).toLocaleString()}
            </p>

            {Object.keys(entry.details).length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {Object.entries(entry.details).map(([key, value]) => (
                  <span
                    key={key}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700"
                  >
                    {key}: {String(value)}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex space-x-2">
          <button className="text-gray-400 hover:text-gray-600">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );

  // ============================================================================
  // RENDER
  // ============================================================================

  return (;
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Audit Trail</h2>
        <div className="text-sm text-gray-500">
          {filteredEntries.length} of {auditEntries.length} entries
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
            <select
              value={filter.user}
              onChange={(e) => handleFilterChange('user', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="all">All Users</option>
              <option value="admin@econeura.com">Admin</option>
              <option value="user@econeura.com">User</option>
              <option value="manager@econeura.com">Manager</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
            <select
              value={filter.action}
              onChange={(e) => handleFilterChange('action', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="all">All Actions</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
              <option value="login">Login</option>
              <option value="logout">Logout</option>
              <option value="view">View</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Resource</label>
            <select
              value={filter.resource}
              onChange={(e) => handleFilterChange('resource', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="all">All Resources</option>
              <option value="auth">Auth</option>
              <option value="contact">Contact</option>
              <option value="deal">Deal</option>
              <option value="user">User</option>
              <option value="dashboard">Dashboard</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <select
              value={filter.dateRange}
              onChange={(e) => handleFilterChange('dateRange', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="all">All Time</option>
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              value={filter.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Search entries..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleClearFilters}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Audit Entries */}
      <div className="space-y-3">
        {filteredEntries.length === 0 ? (
          <div className="bg-white p-6 rounded-lg border text-center text-gray-500">
            <svg className="h-12 w-12 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p>No audit entries found matching your filters</p>
          </div>
        ) : (
          filteredEntries.map(renderAuditEntry);
        )}
      </div>

      {/* Summary */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Audit Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Total Entries:</span>
            <span className="ml-2 text-gray-600">{auditEntries.length}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Creates:</span>
            <span className="ml-2 text-green-600">
              {auditEntries.filter(e => e.action === 'create').length}
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Updates:</span>
            <span className="ml-2 text-blue-600">
              {auditEntries.filter(e => e.action === 'update').length}
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Deletes:</span>
            <span className="ml-2 text-red-600">
              {auditEntries.filter(e => e.action === 'delete').length}
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Logins:</span>
            <span className="ml-2 text-purple-600">
              {auditEntries.filter(e => e.action === 'login').length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
