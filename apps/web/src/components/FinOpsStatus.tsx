'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface CostMetrics {
  totalCost: number;
  costByService: Record<string, number>;
  costByOperation: Record<string, number>;
  costByOrganization: Record<string, number>;
  costByPeriod: Record<string, number>;
  averageCost: number;
  costTrend: 'increasing' | 'decreasing' | 'stable';
  topExpenses: Array<{
    id: string;
    service: string;
    operation: string;
    amount: number;
    timestamp: string;
  }>;
}

interface Budget {
  id: string;
  organizationId: string;
  name: string;
  amount: number;
  currency: string;
  period: string;
  categories: string[];
  alertThreshold: number;
  criticalThreshold: number;
  isActive: boolean;
}

interface BudgetAlert {
  id: string;
  budgetId: string;
  organizationId: string;
  type: 'threshold' | 'critical' | 'exceeded';
  currentAmount: number;
  budgetAmount: number;
  percentage: number;
  timestamp: string;
  message: string;
  acknowledged: boolean;
}

export function FinOpsStatus() {
  const [costMetrics, setCostMetrics] = useState<CostMetrics | null>(null);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [alerts, setAlerts] = useState<BudgetAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFinOpsData = async () => {
    try {
      setLoading(true);
      const [costsRes, budgetsRes, alertsRes] = await Promise.all([
        fetch('/api/finops/costs'),
        fetch('/api/finops/budgets'),
        fetch('/api/finops/alerts')
      ]);

      if (costsRes.ok) {
        const costsData = await costsRes.json();
        setCostMetrics(costsData.data);
      }

      if (budgetsRes.ok) {
        const budgetsData = await budgetsRes.json();
        setBudgets(budgetsData.data.budgets);
      }

      if (alertsRes.ok) {
        const alertsData = await alertsRes.json();
        setAlerts(alertsData.data.alerts);
      }

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/finops/alerts/${alertId}/acknowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acknowledgedBy: 'dashboard-user' }),
      });

      if (response.ok) {
        // Refresh data after acknowledging
        setTimeout(fetchFinOpsData, 500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  useEffect(() => {
    fetchFinOpsData();
    const interval = setInterval(fetchFinOpsData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">FinOps Status</h3>
        <div className="text-center text-gray-500">Loading FinOps data...</div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">FinOps Status</h3>
        <div className="text-red-500 mb-4">Error: {error}</div>
        <button
          onClick={fetchFinOpsData}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </Card>
    );
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'increasing': return 'text-red-500';
      case 'decreasing': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return '↗';
      case 'decreasing': return '↘';
      default: return '→';
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'critical': return 'bg-red-500';
      case 'exceeded': return 'bg-red-600';
      case 'threshold': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">FinOps Status</h3>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Cost Overview */}
      <div className="mb-6">
        <h4 className="font-medium mb-3">Cost Overview</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-2xl font-bold">${costMetrics?.totalCost.toFixed(2) || '0.00'}</div>
            <div className="text-sm text-gray-500">Total Cost</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-2xl font-bold">${costMetrics?.averageCost.toFixed(4) || '0.0000'}</div>
            <div className="text-sm text-gray-500">Average Cost</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className={`text-2xl font-bold ${getTrendColor(costMetrics?.costTrend || 'stable')}`}>
              {getTrendIcon(costMetrics?.costTrend || 'stable')} {costMetrics?.costTrend || 'stable'}
            </div>
            <div className="text-sm text-gray-500">Cost Trend</div>
          </div>
        </div>
      </div>

      {/* Budgets */}
      <div className="mb-6">
        <h4 className="font-medium mb-3">Budgets</h4>
        <div className="space-y-3">
          {budgets.length === 0 ? (
            <p className="text-sm text-gray-500">No budgets configured</p>
          ) : (
            budgets.map((budget) => {
              const percentage = 0; // This would be calculated from actual spend
              const isOverThreshold = percentage >= budget.alertThreshold;
              const isOverCritical = percentage >= budget.criticalThreshold;

              return (
                <div key={budget.id} className="border rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium">{budget.name}</div>
                      <div className="text-sm text-gray-500">
                        ${budget.amount} {budget.currency} / {budget.period}
                      </div>
                    </div>
                    <Badge className={isOverCritical ? 'bg-red-500' : isOverThreshold ? 'bg-yellow-500' : 'bg-green-500'}>
                      {percentage.toFixed(1)}%
                    </Badge>
                  </div>
                  <Progress value={percentage} className="h-2" />
                  <div className="text-xs text-gray-500 mt-1">
                    Alert: {budget.alertThreshold}% | Critical: {budget.criticalThreshold}%
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Budget Alerts */}
      {alerts.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium mb-3">Budget Alerts</h4>
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg bg-red-50">
                <div className="flex-1">
                  <div className="font-medium text-red-800">{alert.message}</div>
                  <div className="text-sm text-red-600">
                    {alert.percentage.toFixed(1)}% of budget used
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getAlertColor(alert.type)}>
                    {alert.type}
                  </Badge>
                  {!alert.acknowledged && (
                    <button
                      onClick={() => acknowledgeAlert(alert.id)}
                      className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                    >
                      Ack
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Expenses */}
      {costMetrics?.topExpenses && costMetrics.topExpenses.length > 0 && (
        <div>
          <h4 className="font-medium mb-3">Top Expenses</h4>
          <div className="space-y-2">
            {costMetrics.topExpenses.slice(0, 5).map((expense) => (
              <div key={expense.id} className="flex justify-between items-center p-2 border rounded">
                <div>
                  <div className="font-medium">{expense.service} - {expense.operation}</div>
                  <div className="text-sm text-gray-500">
                    {new Date(expense.timestamp).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">${expense.amount.toFixed(4)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
