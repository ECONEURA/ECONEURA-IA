'use client';

import React, { useState, useEffect } from 'react';
import { Search, TrendingUp, Clock, Database, Globe, Zap } from 'lucide-react';

interface SearchStats {
  totalSearches: number;
  cacheHitRate: number;
  averageResponseTime: number;
  zeroResultsRate: number;
  topQueries: Array<{ query: string; count: number }>;
  searchTypes: Record<string, number>;
  sources: Record<string, number>;
}

const SearchStatus: React.FC = () => {
  const [stats, setStats] = useState<SearchStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSearchStats();
  }, []);

  const fetchSearchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/search/analytics');
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        setError('Failed to fetch search statistics');
      }
    } catch (error) {
      setError('Error loading search statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="text-center">
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-red-600">
          <Search className="w-8 h-8 mx-auto mb-2" />
          <p>{error}</p>
          <button
            onClick={fetchSearchStats}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-gray-500">
          <Search className="w-8 h-8 mx-auto mb-2" />
          <p>No search statistics available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Search Engine Status</h3>
          <p className="text-sm text-gray-600">Advanced search system statistics</p>
        </div>
        <button
          onClick={fetchSearchStats}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <TrendingUp className="w-5 h-5" />
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-center mb-2">
            <Search className="w-6 h-6 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-600">{stats.totalSearches.toLocaleString()}</div>
          <div className="text-sm text-gray-600">Total Searches</div>
        </div>

        <div className="text-center p-4 bg-green-50 rounded-lg">
          <div className="flex items-center justify-center mb-2">
            <Database className="w-6 h-6 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-green-600">{Math.round(stats.cacheHitRate * 100)}%</div>
          <div className="text-sm text-gray-600">Cache Hit Rate</div>
        </div>

        <div className="text-center p-4 bg-purple-50 rounded-lg">
          <div className="flex items-center justify-center mb-2">
            <Clock className="w-6 h-6 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-600">{Math.round(stats.averageResponseTime)}ms</div>
          <div className="text-sm text-gray-600">Avg Response Time</div>
        </div>

        <div className="text-center p-4 bg-orange-50 rounded-lg">
          <div className="flex items-center justify-center mb-2">
            <Zap className="w-6 h-6 text-orange-600" />
          </div>
          <div className="text-2xl font-bold text-orange-600">{Math.round(stats.zeroResultsRate * 100)}%</div>
          <div className="text-sm text-gray-600">Zero Results Rate</div>
        </div>
      </div>

      {/* Search Types Distribution */}
      {Object.keys(stats.searchTypes).length > 0 && (
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-900 mb-3">Search Types Distribution</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(stats.searchTypes).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700 capitalize">{type}</span>
                <span className="text-sm text-gray-500">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Queries */}
      {stats.topQueries.length > 0 && (
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-900 mb-3">Top Search Queries</h4>
          <div className="space-y-2">
            {stats.topQueries.slice(0, 5).map((query, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                  <span className="text-sm text-gray-700 truncate">{query.query}</span>
                </div>
                <span className="text-sm text-gray-500">{query.count} searches</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sources Usage */}
      {Object.keys(stats.sources).length > 0 && (
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-3">Sources Usage</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(stats.sources).map(([source, count]) => (
              <div key={source} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Globe className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">{source}</span>
                </div>
                <span className="text-sm text-gray-500">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchStatus;
