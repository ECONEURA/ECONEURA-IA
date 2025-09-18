// ============================================================================
// PERFORMANCE CHART - VISUALIZATION COMPONENT
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

interface PerformanceChartProps {
  data: MetricsData | null;
}

interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
    tension: number;
  }>;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function PerformanceChart({ data }: PerformanceChartProps): JSX.Element {
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<string>('api_request_duration');

  // ============================================================================
  // DATA PROCESSING
  // ============================================================================

  useEffect(() => {
    if (!data?.metrics) return;

    // Filter performance metrics
    const performanceMetrics = data.metrics.filter(metric => 
      metric.name.includes('api_request_duration') || 
      metric.name.includes('api_requests_total') ||
      metric.name.includes('response_time') ||
      metric.name.includes('db_queries_total')
    );

    if (performanceMetrics.length === 0) return;

    // Group metrics by name and time
    const groupedMetrics = performanceMetrics.reduce((acc, metric) => {
      if (!acc[metric.name]) {
        acc[metric.name] = [];
      }
      acc[metric.name].push({
        value: metric.value,
        timestamp: new Date(metric.timestamp).getTime()
      });
      return acc;
    }, {} as Record<string, Array<{ value: number; timestamp: number }>>);

    // Create chart data
    const labels = Object.keys(groupedMetrics);
    const datasets = labels.map((label, index) => {
      const values = groupedMetrics[label].map(item => item.value);
      const colors = [
        'rgb(59, 130, 246)', // blue
        'rgb(16, 185, 129)', // green
        'rgb(245, 158, 11)', // yellow
        'rgb(239, 68, 68)',  // red
        'rgb(139, 92, 246)', // purple
        'rgb(236, 72, 153)'  // pink
      ];

      return {
        label: label.replace(/_/g, ' ').toUpperCase(),
        data: values,
        borderColor: colors[index % colors.length],
        backgroundColor: colors[index % colors.length] + '20',
        tension: 0.4
      };
    });

    setChartData({
      labels: labels.map(label => label.replace(/_/g, ' ').toUpperCase()),
      datasets
    });
  }, [data]);

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const renderSimpleChart = (): JSX.Element => {
    if (!chartData || chartData.datasets.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500">
          No performance data available
        </div>
      );
    }

    const maxValue = Math.max(...chartData.datasets.flatMap(dataset => dataset.data));
    const minValue = Math.min(...chartData.datasets.flatMap(dataset => dataset.data));
    const range = maxValue - minValue;

    return (
      <div className="space-y-4">
        {chartData.datasets.map((dataset, index) => (
          <div key={index} className="bg-white p-4 rounded-lg border">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium text-gray-700">{dataset.label}</h4>
              <span className="text-sm text-gray-500">
                {dataset.data.length} data points
              </span>
            </div>
            
            <div className="flex items-end space-x-1 h-32">
              {dataset.data.map((value, valueIndex) => {
                const height = range > 0 ? ((value - minValue) / range) * 100 : 50;
                return (
                  <div
                    key={valueIndex}
                    className="flex-1 bg-blue-200 rounded-t"
                    style={{ height: `${Math.max(height, 5)}%` }}
                    title={`${value.toFixed(2)}`}
                  />
                );
              })}
            </div>
            
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>Min: {minValue.toFixed(2)}</span>
              <span>Max: {maxValue.toFixed(2)}</span>
              <span>Avg: {(dataset.data.reduce((a, b) => a + b, 0) / dataset.data.length).toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderMetricCards = (): JSX.Element => {
    if (!data?.metrics) return <div>No data available</div>;

    const performanceMetrics = data.metrics.filter(metric => 
      metric.name.includes('api_request_duration') || 
      metric.name.includes('api_requests_total') ||
      metric.name.includes('response_time') ||
      metric.name.includes('db_queries_total')
    );

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {performanceMetrics.map((metric, index) => (
          <div key={index} className="bg-white p-4 rounded-lg border">
            <h4 className="font-medium text-gray-700 mb-2">
              {metric.name.replace(/_/g, ' ').toUpperCase()}
            </h4>
            <p className="text-2xl font-bold text-blue-600">
              {metric.value.toFixed(2)}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {new Date(metric.timestamp).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    );
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Performance Metrics</h2>
        <div className="flex space-x-2">
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1 text-sm"
          >
            <option value="api_request_duration">API Request Duration</option>
            <option value="api_requests_total">API Requests Total</option>
            <option value="response_time">Response Time</option>
            <option value="db_queries_total">DB Queries Total</option>
          </select>
        </div>
      </div>

      {/* Metric Cards */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Current Values</h3>
        {renderMetricCards()}
      </div>

      {/* Charts */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Trends</h3>
        {renderSimpleChart()}
      </div>

      {/* Summary */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Performance Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Total API Calls:</span>
            <span className="ml-2 text-blue-600">
              {data?.metrics.find(m => m.name === 'api_requests_total')?.value || 0}
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Avg Response Time:</span>
            <span className="ml-2 text-green-600">
              {data?.metrics.find(m => m.name === 'api_request_duration')?.value?.toFixed(2) || '0.00'}s
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-700">DB Queries:</span>
            <span className="ml-2 text-purple-600">
              {data?.metrics.find(m => m.name === 'db_queries_total')?.value || 0}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
