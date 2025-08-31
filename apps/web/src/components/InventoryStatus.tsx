'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

// ============================================================================
// INTERFACES
// ============================================================================

interface InventoryReport {
  totalProducts: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  overstockItems: number;
  expiringItems: number;
  turnoverRate: number;
  averageCost: number;
  topProducts: Array<{
    productId: string;
    productName: string;
    quantity: number;
    value: number;
  }>;
  categoryBreakdown: Record<string, {
    count: number;
    value: number;
  }>;
  recentTransactions: Array<{
    id: string;
    productName: string;
    type: string;
    quantity: number;
    date: string;
  }>;
}

interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  category: string;
  unit: string;
  cost: number;
  price: number;
  minStock: number;
  maxStock: number;
  currentStock: number;
  reorderPoint: number;
  reorderQuantity: number;
  supplier?: string;
  location?: string;
  expiryDate?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

interface StockAlert {
  id: string;
  productId: string;
  type: string;
  status: string;
  message: string;
  threshold: number;
  currentValue: number;
  severity: string;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function InventoryStatus() {
  const [report, setReport] = useState<InventoryReport | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInventoryData();
    const interval = setInterval(fetchInventoryData, 30000); // Actualizar cada 30 segundos
    return () => clearInterval(interval);
  }, []);

  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener reporte de inventario
      const reportResponse = await fetch('/api/inventory/report');
      if (reportResponse.ok) {
        const reportData = await reportResponse.json();
        setReport(reportData);
      }

      // Obtener productos
      const productsResponse = await fetch('/api/inventory/products');
      if (productsResponse.ok) {
        const productsData = await productsResponse.json();
        setProducts(productsData);
      }

      // Obtener alertas activas
      const alertsResponse = await fetch('/api/inventory/alerts?status=active');
      if (alertsResponse.ok) {
        const alertsData = await alertsResponse.json();
        setAlerts(alertsData);
      }

    } catch (err) {
      console.error('Error fetching inventory data:', err);
      setError('Failed to fetch inventory data');
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/inventory/alerts/${alertId}/acknowledge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: 'demo-user' }),
      });

      if (response.ok) {
        // Actualizar la lista de alertas
        fetchInventoryData();
      }
    } catch (err) {
      console.error('Error acknowledging alert:', err);
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/inventory/alerts/${alertId}/resolve`, {
        method: 'POST',
      });

      if (response.ok) {
        // Actualizar la lista de alertas
        fetchInventoryData();
      }
    } catch (err) {
      console.error('Error resolving alert:', err);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getAlertTypeColor = (type: string) => {
    switch (type) {
      case 'low_stock': return 'bg-yellow-100 text-yellow-800';
      case 'out_of_stock': return 'bg-red-100 text-red-800';
      case 'overstock': return 'bg-blue-100 text-blue-800';
      case 'expiry_warning': return 'bg-orange-100 text-orange-800';
      case 'expiry_critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'purchase': return 'bg-green-100 text-green-800';
      case 'sale': return 'bg-blue-100 text-blue-800';
      case 'return': return 'bg-purple-100 text-purple-800';
      case 'adjustment': return 'bg-gray-100 text-gray-800';
      case 'damage': return 'bg-red-100 text-red-800';
      case 'expiry': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading inventory data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <div className="text-lg font-semibold">Error</div>
              <div>{error}</div>
              <Button onClick={fetchInventoryData} className="mt-4">
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumen del Inventario */}
      {report && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Badge variant="secondary">{report.totalProducts}</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{report.totalProducts}</div>
              <p className="text-xs text-muted-foreground">
                Total value: {formatCurrency(report.totalValue)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
              <Badge variant="destructive">{report.lowStockItems}</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{report.lowStockItems}</div>
              <p className="text-xs text-muted-foreground">
                Needs reorder
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
              <Badge variant="destructive">{report.outOfStockItems}</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{report.outOfStockItems}</div>
              <p className="text-xs text-muted-foreground">
                Critical
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
              <Badge variant="secondary">{report.expiringItems}</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{report.expiringItems}</div>
              <p className="text-xs text-muted-foreground">
                Next 30 days
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alertas Activas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Active Alerts</span>
            <Badge variant="destructive">{alerts.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No active alerts
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.slice(0, 5).map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${getSeverityColor(alert.severity)}`} />
                    <div>
                      <div className="font-medium">{alert.message}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(alert.createdAt)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getAlertTypeColor(alert.type)}>
                      {alert.type.replace('_', ' ')}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => acknowledgeAlert(alert.id)}
                    >
                      Acknowledge
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => resolveAlert(alert.id)}
                    >
                      Resolve
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Productos con Stock Bajo */}
      <Card>
        <CardHeader>
          <CardTitle>Low Stock Products</CardTitle>
        </CardHeader>
        <CardContent>
          {products.filter(p => p.currentStock <= p.reorderPoint).length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No low stock products
            </div>
          ) : (
            <div className="space-y-3">
              {products
                .filter(p => p.currentStock <= p.reorderPoint)
                .slice(0, 5)
                .map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-muted-foreground">
                        SKU: {product.sku} • Location: {product.location || 'N/A'}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="font-medium">{product.currentStock} / {product.maxStock}</div>
                        <div className="text-sm text-muted-foreground">
                          Reorder: {product.reorderPoint}
                        </div>
                      </div>
                      <Progress 
                        value={(product.currentStock / product.maxStock) * 100} 
                        className="w-20"
                      />
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transacciones Recientes */}
      {report && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {report.recentTransactions.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No recent transactions
              </div>
            ) : (
              <div className="space-y-3">
                {report.recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{transaction.productName}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(transaction.date)}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge className={getTransactionTypeColor(transaction.type)}>
                        {transaction.type}
                      </Badge>
                      <div className="text-right">
                        <div className="font-medium">{transaction.quantity}</div>
                        <div className="text-sm text-muted-foreground">units</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Desglose por Categoría */}
      {report && (
        <Card>
          <CardHeader>
            <CardTitle>Category Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(report.categoryBreakdown).map(([category, data]) => (
                <div key={category} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium capitalize">{category}</div>
                    <div className="text-sm text-muted-foreground">
                      {data.count} products
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(data.value)}</div>
                    <div className="text-sm text-muted-foreground">
                      {((data.value / report.totalValue) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
