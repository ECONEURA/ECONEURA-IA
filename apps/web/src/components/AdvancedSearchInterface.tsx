'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, TrendingUp, History, Globe, Zap, BarChart3, Settings } from 'lucide-react';

interface SearchResult {
  id: string;
  title: string;
  content: string;
  url?: string;
  type: string;
  score: number;
  highlights?: string[];
  metadata?: Record<string, any>;
  source: string;
  timestamp: string;
}

interface SearchSuggestion {
  query: string;
  type: 'history' | 'popular' | 'related' | 'correction';
  score: number;
  count?: number;
}

interface SearchAnalytics {
  totalSearches: number;
  uniqueUsers: number;
  averageQueryLength: number;
  topQueries: Array<{ query: string; count: number }>;
  searchTypes: Record<string, number>;
  sources: Record<string, number>;
  averageResponseTime: number;
  cacheHitRate: number;
  zeroResultsRate: number;
}

interface FederatedSource {
  sourceId: string;
  name: string;
  url: string;
  type: 'api' | 'database' | 'file' | 'web';
  priority: number;
  timeout: number;
  enabled: boolean;
}

const AdvancedSearchInterface: React.FC = () => {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState<'semantic' | 'keyword' | 'fuzzy' | 'federated'>('keyword');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [analytics, setAnalytics] = useState<SearchAnalytics | null>(null);
  const [sources, setSources] = useState<FederatedSource[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [sortBy, setSortBy] = useState<string>('score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [responseTime, setResponseTime] = useState(0);
  const [cacheHit, setCacheHit] = useState(false);

  // Fetch analytics on component mount
  useEffect(() => {
    fetchAnalytics();
    fetchSources();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/search/analytics');
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    }
  };

  const fetchSources = async () => {
    try {
      const response = await fetch('/api/search/sources');
      if (response.ok) {
        const data = await response.json();
        setSources(data.sources || []);
      }
    } catch (error) {
      console.error('Failed to fetch sources:', error);
    }
  };

  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await fetch(`/api/search/suggestions?query=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
    }
  }, []);

  const performSearch = async (searchQuery: string, searchParams?: any) => {
    setLoading(true);
    const startTime = Date.now();

    try {
      const requestBody = {
        query: searchQuery,
        searchType,
        filters,
        sortBy,
        sortOrder,
        page,
        limit: 20,
        sources: searchType === 'federated' ? sources.map(s => s.sourceId) : undefined,
        includeSuggestions: true,
        useCache: true,
        ...searchParams,
      };

      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data.results || []);
        setTotalResults(data.analytics.totalResults);
        setResponseTime(data.analytics.responseTime);
        setCacheHit(data.analytics.cacheHit);
        
        // Update analytics
        fetchAnalytics();
      } else {
        console.error('Search failed:', response.statusText);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
      setShowSuggestions(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      performSearch(query.trim());
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.query);
    performSearch(suggestion.query);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    if (value.length >= 2) {
      fetchSuggestions(value);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const clearFilters = () => {
    setFilters({});
    setSortBy('score');
    setSortOrder('desc');
    setPage(1);
  };

  const getSearchTypeIcon = (type: string) => {
    switch (type) {
      case 'semantic': return <Brain className="w-4 h-4" />;
      case 'fuzzy': return <Zap className="w-4 h-4" />;
      case 'federated': return <Globe className="w-4 h-4" />;
      default: return <Search className="w-4 h-4" />;
    }
  };

  const getSuggestionIcon = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'history': return <History className="w-4 h-4" />;
      case 'popular': return <TrendingUp className="w-4 h-4" />;
      case 'related': return <Link className="w-4 h-4" />;
      case 'correction': return <CheckCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Advanced Search</h1>
          <p className="text-gray-600 mt-2">
            Semantic, fuzzy, and federated search with intelligent suggestions
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </button>
          <button
            onClick={fetchAnalytics}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors"
          >
            <BarChart3 className="w-4 h-4" />
            <span>Analytics</span>
          </button>
        </div>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="relative">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={query}
                onChange={handleInputChange}
                placeholder="Search for anything..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value as any)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="keyword">Keyword Search</option>
              <option value="semantic">Semantic Search</option>
              <option value="fuzzy">Fuzzy Search</option>
              <option value="federated">Federated Search</option>
            </select>
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>

          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3 border-b border-gray-100 last:border-b-0"
                >
                  {getSuggestionIcon(suggestion.type)}
                  <div className="flex-1">
                    <div className="font-medium">{suggestion.query}</div>
                    <div className="text-sm text-gray-500 capitalize">
                      {suggestion.type} {suggestion.count && `(${suggestion.count})`}
                    </div>
                  </div>
                  <div className="text-sm text-gray-400">
                    {Math.round(suggestion.score * 100)}%
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-gray-50 p-4 rounded-lg space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="score">Relevance</option>
                  <option value="timestamp">Date</option>
                  <option value="title">Title</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort Order</label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Page</label>
                <input
                  type="number"
                  value={page}
                  onChange={(e) => setPage(parseInt(e.target.value) || 1)}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={clearFilters}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </form>

      {/* Search Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Search Results ({totalResults})
              </h2>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>Response time: {responseTime}ms</span>
                {cacheHit && <span className="text-green-600">• Cached</span>}
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              {getSearchTypeIcon(searchType)}
              <span className="capitalize">{searchType} search</span>
            </div>
          </div>

          <div className="space-y-4">
            {results.map((result) => (
              <div key={result.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-blue-600 hover:text-blue-800 mb-2">
                      {result.url ? (
                        <a href={result.url} target="_blank" rel="noopener noreferrer">
                          {result.title}
                        </a>
                      ) : (
                        result.title
                      )}
                    </h3>
                    <p className="text-gray-600 mb-3 line-clamp-3">{result.content}</p>
                    
                    {result.highlights && result.highlights.length > 0 && (
                      <div className="mb-3">
                        <div className="text-sm font-medium text-gray-700 mb-1">Highlights:</div>
                        <div className="space-y-1">
                          {result.highlights.map((highlight, index) => (
                            <div key={index} className="text-sm text-gray-600 bg-yellow-50 p-2 rounded">
                              "...{highlight}..."
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>Score: {Math.round(result.score * 100)}%</span>
                      <span>Type: {result.type}</span>
                      <span>Source: {result.source}</span>
                      <span>{new Date(result.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analytics Panel */}
      {analytics && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Search Analytics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{analytics.totalSearches}</div>
              <div className="text-sm text-gray-600">Total Searches</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{Math.round(analytics.cacheHitRate * 100)}%</div>
              <div className="text-sm text-gray-600">Cache Hit Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{Math.round(analytics.averageResponseTime)}ms</div>
              <div className="text-sm text-gray-600">Avg Response Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{Math.round(analytics.zeroResultsRate * 100)}%</div>
              <div className="text-sm text-gray-600">Zero Results Rate</div>
            </div>
          </div>

          {analytics.topQueries.length > 0 && (
            <div className="mt-6">
              <h4 className="text-md font-medium text-gray-900 mb-3">Top Queries</h4>
              <div className="space-y-2">
                {analytics.topQueries.slice(0, 5).map((query, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">{query.query}</span>
                    <span className="text-sm text-gray-500">{query.count} searches</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Federated Sources */}
      {sources.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Federated Sources</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sources.map((source) => (
              <div key={source.sourceId} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{source.name}</h4>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    source.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {source.enabled ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Type: {source.type}</div>
                  <div>Priority: {source.priority}/10</div>
                  <div>Timeout: {source.timeout}ms</div>
                  <div className="truncate">URL: {source.url}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Icons components (you can replace these with your preferred icon library)
const Brain = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);

const Link = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
  </svg>
);

const CheckCircle = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default AdvancedSearchInterface;
