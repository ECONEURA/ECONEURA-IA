'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface CacheStats {
  ai: {
    hits: number;
    misses: number;
    sets: number;
    deletes: number;
    warmupItems: number;
    size: number;
    maxSize: number;
    hitRate: number;
  };
  search: {
    hits: number;
    misses: number;
    sets: number;
    deletes: number;
    warmupItems: number;
    size: number;
    maxSize: number;
    hitRate: number;
  };
}

export function CacheStatus(): void {
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCacheStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/cache/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch cache stats');
      }
      const data = await response.json();
      setCacheStats(data.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const triggerWarmup = async () => {
    try {
      const response = await fetch('/api/cache/warmup', {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to trigger warmup');
      }
      // Refresh stats after warmup
      setTimeout(fetchCacheStats, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const clearCache = async (type: 'ai' | 'search' | 'all') => {
    try {
      const endpoint = type === 'all' ? '/api/cache/all' : `/api/cache/${type}`;
      const response = await fetch(endpoint, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(`Failed to clear ${type} cache`);
      }
      // Refresh stats after clearing
      setTimeout(fetchCacheStats, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  useEffect(() => {
    fetchCacheStats();
    const interval = setInterval(fetchCacheStats, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (;
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Cache Status</h3>
        <div className="text-center text-gray-500">Loading cache statistics...</div>
      </Card>
    );
  }

  if (error) {
    return (;
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Cache Status</h3>
        <div className="text-red-500 mb-4">Error: {error}</div>
        <button
          onClick={fetchCacheStats}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </Card>
    );
  }

  if (!cacheStats) {
    return (;
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Cache Status</h3>
        <div className="text-gray-500">No cache data available</div>
      </Card>
    );
  }

  const getHitRateColor = (hitRate: number) => {
    if (hitRate >= 0.8) return 'bg-green-500';
    if (hitRate >= 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getHitRateText = (hitRate: number) => {
    if (hitRate >= 0.8) return 'Excellent';
    if (hitRate >= 0.6) return 'Good';
    return 'Poor';
  };

  return (;
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Cache Status</h3>
        <div className="space-x-2">
          <button
            onClick={triggerWarmup}
            className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
          >
            Warmup
          </button>
          <button
            onClick={() => clearCache('all')}
            className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
          >
            Clear All
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* AI Cache */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-medium">AI Cache</h4>
            <div className="space-x-2">
              <button
                onClick={() => clearCache('ai')}
                className="px-2 py-1 bg-red-400 text-white text-xs rounded hover:bg-red-500"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Hit Rate</span>
              <span className="font-medium">
                {(cacheStats.ai.hitRate * 100).toFixed(1)}%
              </span>
            </div>
            <Progress value={cacheStats.ai.hitRate * 100} className="h-2" />
            <div className="flex justify-between text-xs text-gray-500">
              <span>{getHitRateText(cacheStats.ai.hitRate)}</span>
              <Badge className={getHitRateColor(cacheStats.ai.hitRate)}>
                {cacheStats.ai.hits} hits / {cacheStats.ai.hits + cacheStats.ai.misses} requests
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-500">Size</div>
              <div className="font-medium">
                {cacheStats.ai.size} / {cacheStats.ai.maxSize}
              </div>
            </div>
            <div>
              <div className="text-gray-500">Warmup Items</div>
              <div className="font-medium">{cacheStats.ai.warmupItems}</div>
            </div>
            <div>
              <div className="text-gray-500">Sets</div>
              <div className="font-medium">{cacheStats.ai.sets}</div>
            </div>
            <div>
              <div className="text-gray-500">Deletes</div>
              <div className="font-medium">{cacheStats.ai.deletes}</div>
            </div>
          </div>
        </div>

        {/* Search Cache */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-medium">Search Cache</h4>
            <div className="space-x-2">
              <button
                onClick={() => clearCache('search')}
                className="px-2 py-1 bg-red-400 text-white text-xs rounded hover:bg-red-500"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Hit Rate</span>
              <span className="font-medium">
                {(cacheStats.search.hitRate * 100).toFixed(1)}%
              </span>
            </div>
            <Progress value={cacheStats.search.hitRate * 100} className="h-2" />
            <div className="flex justify-between text-xs text-gray-500">
              <span>{getHitRateText(cacheStats.search.hitRate)}</span>
              <Badge className={getHitRateColor(cacheStats.search.hitRate)}>
                {cacheStats.search.hits} hits / {cacheStats.search.hits + cacheStats.search.misses} requests
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-500">Size</div>
              <div className="font-medium">
                {cacheStats.search.size} / {cacheStats.search.maxSize}
              </div>
            </div>
            <div>
              <div className="text-gray-500">Warmup Items</div>
              <div className="font-medium">{cacheStats.search.warmupItems}</div>
            </div>
            <div>
              <div className="text-gray-500">Sets</div>
              <div className="font-medium">{cacheStats.search.sets}</div>
            </div>
            <div>
              <div className="text-gray-500">Deletes</div>
              <div className="font-medium">{cacheStats.search.deletes}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t">
        <div className="text-xs text-gray-500">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>
    </Card>
  );
}
