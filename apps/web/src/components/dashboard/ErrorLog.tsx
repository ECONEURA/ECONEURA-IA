// ============================================================================
// ERROR LOG - ERROR DISPLAY COMPONENT
// ============================================================================

'use client';

import React, { useState, useEffect } from 'react';

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

interface ErrorLogProps {
  data: MetricsData | null;
}

interface ErrorEntry {
  id: string;
  timestamp: string;
  level: 'error' | 'warning' | 'info';
  message: string;
  source: string;
  count: number;
  labels: Record<string, string>;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function ErrorLog({ data }: ErrorLogProps): JSX.Element {
  const [errors, setErrors] = useState<ErrorEntry[]>([]);
  const [filteredErrors, setFilteredErrors] = useState<ErrorEntry[]>([]);
  const [filter, setFilter] = useState<{
    level: string;
    source: string;
    search: string;
  }>({
    level: 'all',
    source: 'all',
    search: ''
  });

  // ============================================================================
  // DATA PROCESSING
  // ============================================================================

  useEffect(() => {
    if (!data?.metrics) return;

    // Filter error metrics
    const errorMetrics = data.metrics.filter(metric => 
      metric.name.includes('errors_total') || 
      metric.name.includes('failures_total') ||
      metric.name.includes('exceptions_total') ||
      metric.name.includes('client_errors_total')
    );

    // Convert metrics to error entries
    const errorEntries: ErrorEntry[] = errorMetrics.map((metric, index) => ({
      id: `error-${index}`,
      timestamp: metric.timestamp,
      level: metric.name.includes('client_errors') ? 'error' : 
             metric.name.includes('warnings') ? 'warning' : 'info',
      message: metric.name.replace(/_/g, ' ').toUpperCase(),
      source: metric.labels.source || 'unknown',
      count: metric.value,
      labels: metric.labels
    }));

    setErrors(errorEntries);
  }, [data]);

  // ============================================================================
  // FILTERING
  // ============================================================================

  useEffect(() => {
    let filtered = errors;

    // Filter by level
    if (filter.level !== 'all') {
      filtered = filtered.filter(error => error.level === filter.level);
    }

    // Filter by source
    if (filter.source !== 'all') {
      filtered = filtered.filter(error => error.source === filter.source);
    }

    // Filter by search
    if (filter.search) {
      filtered = filtered.filter(error => 
        error.message.toLowerCase().includes(filter.search.toLowerCase()) ||
        error.source.toLowerCase().includes(filter.search.toLowerCase())
      );
    }

    setFilteredErrors(filtered);
  }, [errors, filter]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleFilterChange = (key: string, value: string): void => {
    setFilter(prev => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = (): void => {
    setFilter({
      level: 'all',
      source: 'all',
      search: ''
    });
  };

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const getLevelColor = (level: string): string => {
    switch (level) {
      case 'error': return 'text-red-600 bg-red-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'info': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getLevelIcon = (level: string): JSX.Element => {
    switch (level) {
      case 'error':
        return (
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'info':
        return (
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const renderErrorEntry = (error: ErrorEntry): JSX.Element => (
    <div key={error.id} className="bg-white p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className={`p-1 rounded-full ${getLevelColor(error.level)}`}>
            {getLevelIcon(error.level)}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h4 className="font-medium text-gray-900">{error.message}</h4>
              <span className="text-sm text-gray-500">({error.count} occurrences)</span>
            </div>
            
            <p className="text-sm text-gray-600 mb-2">
              Source: <span className="font-medium">{error.source}</span>
            </p>
            
            <p className="text-xs text-gray-500">
              {new Date(error.timestamp).toLocaleString()}
            </p>
            
            {Object.keys(error.labels).length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {Object.entries(error.labels).map(([key, value]) => (
                  <span
                    key={key}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700"
                  >
                    {key}: {value}
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
          
          <button className="text-gray-400 hover:text-gray-600">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );

  // ============================================================================
  // RENDER
  // ============================================================================

  if (!data?.metrics) {
    return (
      <div className="bg-white p-6 rounded-lg border">
        <div className="text-center text-gray-500">
          <svg className="h-12 w-12 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p>No error data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Error Log</h2>
        <div className="text-sm text-gray-500">
          {filteredErrors.length} of {errors.length} errors
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
            <select
              value={filter.level}
              onChange={(e) => handleFilterChange('level', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="all">All Levels</option>
              <option value="error">Errors</option>
              <option value="warning">Warnings</option>
              <option value="info">Info</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
            <select
              value={filter.source}
              onChange={(e) => handleFilterChange('source', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="all">All Sources</option>
              <option value="api">API</option>
              <option value="client">Client</option>
              <option value="database">Database</option>
              <option value="system">System</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              value={filter.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Search errors..."
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

      {/* Error List */}
      <div className="space-y-3">
        {filteredErrors.length === 0 ? (
          <div className="bg-white p-6 rounded-lg border text-center text-gray-500">
            <svg className="h-12 w-12 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p>No errors found matching your filters</p>
          </div>
        ) : (
          filteredErrors.map(renderErrorEntry)
        )}
      </div>

      {/* Summary */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Total Errors:</span>
            <span className="ml-2 text-red-600">
              {errors.filter(e => e.level === 'error').length}
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Warnings:</span>
            <span className="ml-2 text-yellow-600">
              {errors.filter(e => e.level === 'warning').length}
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Info:</span>
            <span className="ml-2 text-blue-600">
              {errors.filter(e => e.level === 'info').length}
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Total Count:</span>
            <span className="ml-2 text-gray-600">
              {errors.reduce((sum, error) => sum + error.count, 0)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
