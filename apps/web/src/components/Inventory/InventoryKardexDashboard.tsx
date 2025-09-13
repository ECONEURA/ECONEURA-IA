'use client';

import { useState, useEffect } from 'react';
import { 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  MoreVertical
} from 'lucide-react';

// ============================================================================
// INVENTORY KARDEX DASHBOARD - PR-34
// ============================================================================

interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  unit: string;
  cost: number;
  price: number;
  currency: string;
  reorderPoint: number;
  reorderQuantity: number;
  maxStock: number;
  minStock: number;
  isActive: boolean;
  supplierId?: string;
  location: string;
  barcode?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface KardexEntry {
  id: string;
  organizationId: string;
  productId: string;
  transactionType: 'in' | 'out' | 'adjustment' | 'transfer' | 'return' | 'waste' | 'cycle_count';
  quantity: number;
  unitCost: number;
  totalCost: number;
  reference: string;
  referenceType: 'purchase' | 'sale' | 'adjustment' | 'transfer' | 'return' | 'cycle_count' | 'waste';
  location: string;
  notes?: string;
  userId: string;
  userName: string;
  createdAt: string;
  updatedAt: string;
}

interface StockLevel {
  productId: string;
  organizationId: string;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  totalValue: number;
  averageCost: number;
  lastMovement: string;
  lastMovementType: string;
  location: string;
  updatedAt: string;
}

interface Alert {
  id: string;
  organizationId: string;
  productId: string;
  alertType: 'low_stock' | 'overstock' | 'reorder_point' | 'negative_stock' | 'slow_moving' | 'expired' | 'cycle_count_due';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  currentValue: number;
  thresholdValue: number;
  isActive: boolean;
  isAcknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface InventoryStats {
  totalProducts: number;
  totalValue: number;
  totalMovements: number;
  activeAlerts: number;
  lowStockItems: number;
  overstockItems: number;
  pendingCycleCounts: number;
  last30Days: {
    movements: number;
    value: number;
    products: number;
  };
  last7Days: {
    movements: number;
    value: number;
  };
  byCategory: Record<string, number>;
  byLocation: Record<string, number>;
}

interface InventoryKardexDashboardProps {
  className?: string;
  refreshInterval?: number;
}

export default function InventoryKardexDashboard({
  className = "",
  refreshInterval = 30000
}: InventoryKardexDashboardProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [kardexEntries, setKardexEntries] = useState<KardexEntry[]>([]);
  const [stockLevels, setStockLevels] = useState<StockLevel[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedView, setSelectedView] = useState<'overview' | 'products' | 'kardex' | 'alerts' | 'reports'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, refreshInterval);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load all data in parallel
      const [productsRes, kardexRes, stockRes, alertsRes, statsRes] = await Promise.all([
        fetch('/api/inventory/products?organizationId=demo-org-1'),
        fetch('/api/inventory/kardex?organizationId=demo-org-1'),
        fetch('/api/inventory/stock-levels?organizationId=demo-org-1'),
        fetch('/api/inventory/alerts?organizationId=demo-org-1'),
        fetch('/api/inventory/stats?organizationId=demo-org-1')
      ]);

      const [productsData, kardexData, stockData, alertsData, statsData] = await Promise.all([
        productsRes.json(),
        kardexRes.json(),
        stockRes.json(),
        alertsRes.json(),
        statsRes.json()
      ]);

      if (productsData.success) setProducts(productsData.data.products || []);
      if (kardexData.success) setKardexEntries(kardexData.data.entries || []);
      if (stockData.success) setStockLevels(stockData.data.stockLevels || []);
      if (alertsData.success) setAlerts(alertsData.data.alerts || []);
      if (statsData.success) setStats(statsData.data);

      setError(null);
    } catch (err) {
      setError('Error loading inventory data');
      console.error('Inventory dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'in': return 'text-green-600 bg-green-50';
      case 'out': return 'text-red-600 bg-red-50';
      case 'adjustment': return 'text-blue-600 bg-blue-50';
      case 'transfer': return 'text-purple-600 bg-purple-50';
      case 'return': return 'text-yellow-600 bg-yellow-50';
      case 'waste': return 'text-gray-600 bg-gray-50';
      case 'cycle_count': return 'text-indigo-600 bg-indigo-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredAlerts = alerts.filter(alert => alert.isActive);

  if (loading && !stats) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-sand-100 rounded-lg p-6 h-32"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="bg-sand-100 rounded-lg p-6 h-80"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="text-red-600 mb-4">
          <AlertTriangle className="w-12 h-12 mx-auto mb-2" />
          <h3 className="text-lg font-semibold">Error Loading Inventory</h3>
          <p className="text-gray-600">{error}</p>
        </div>
        <button
          onClick={loadData}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4 inline mr-2" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Kardex Dashboard</h1>
          <p className="text-gray-600">Complete inventory management with Kardex tracking and alerts</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4 inline mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'products', label: 'Products', icon: Package },
            { id: 'kardex', label: 'Kardex', icon: TrendingUp },
            { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
            { id: 'reports', label: 'Reports', icon: Download }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setSelectedView(id as any)}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                selectedView === id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {selectedView === 'overview' && stats && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Products</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
                </div>
                <Package className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Value</p>
                  <p className="text-2xl font-bold text-gray-900">€{stats.totalValue.toLocaleString()}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Alerts</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeAlerts}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-orange-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.lowStockItems}</p>
                </div>
                <TrendingDown className="w-8 h-8 text-red-600" />
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Kardex Entries</h3>
              <div className="space-y-3">
                {kardexEntries.slice(0, 5).map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTransactionTypeColor(entry.transactionType)}`}>
                        {entry.transactionType.toUpperCase()}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{entry.reference}</p>
                        <p className="text-xs text-gray-500">{entry.location}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{entry.quantity} units</p>
                      <p className="text-xs text-gray-500">€{entry.totalCost.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Alerts</h3>
              <div className="space-y-3">
                {filteredAlerts.slice(0, 5).map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                        {alert.severity.toUpperCase()}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{alert.title}</p>
                        <p className="text-xs text-gray-500">{alert.message}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{alert.currentValue}</p>
                      <p className="text-xs text-gray-500">vs {alert.thresholdValue}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Products Tab */}
      {selectedView === 'products' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {Array.from(new Set(products.map(p => p.category))).map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* Products Table */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProducts.map((product) => {
                    const stockLevel = stockLevels.find(s => s.productId === product.id);
                    return (
                      <tr key={product.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{product.name}</div>
                            <div className="text-sm text-gray-500">{product.sku}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                            {product.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{stockLevel?.currentStock || 0}</div>
                          <div className="text-xs text-gray-500">
                            Min: {product.minStock} | Max: {product.maxStock}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">€{stockLevel?.totalValue?.toLocaleString() || 0}</div>
                          <div className="text-xs text-gray-500">€{product.cost}/unit</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.location}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button className="text-blue-600 hover:text-blue-900">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="text-gray-600 hover:text-gray-900">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button className="text-red-600 hover:text-red-900">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Kardex Tab */}
      {selectedView === 'kardex' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Cost</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cost</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {kardexEntries.map((entry) => (
                    <tr key={entry.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTransactionTypeColor(entry.transactionType)}`}>
                          {entry.transactionType.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {entry.reference}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {entry.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        €{entry.unitCost.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        €{entry.totalCost.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {entry.location}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {entry.userName}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Alerts Tab */}
      {selectedView === 'alerts' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alert</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Value</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Threshold</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {alerts.map((alert) => (
                    <tr key={alert.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{alert.title}</div>
                          <div className="text-sm text-gray-500">{alert.message}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                          {alert.alertType.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(alert.severity)}`}>
                          {alert.severity.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {alert.currentValue}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {alert.thresholdValue}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {alert.isAcknowledged ? (
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                            Acknowledged
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          {!alert.isAcknowledged && (
                            <button className="text-blue-600 hover:text-blue-900">
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          <button className="text-gray-600 hover:text-gray-900">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Reports Tab */}
      {selectedView === 'reports' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock Levels Report</h3>
              <p className="text-gray-600 mb-4">Generate a comprehensive report of current stock levels across all products.</p>
              <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                <Download className="w-4 h-4 inline mr-2" />
                Generate Report
              </button>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Movements Report</h3>
              <p className="text-gray-600 mb-4">Analyze inventory movements and transactions over a specified period.</p>
              <button className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                <Download className="w-4 h-4 inline mr-2" />
                Generate Report
              </button>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">ABC Analysis</h3>
              <p className="text-gray-600 mb-4">Perform ABC analysis to categorize products by value and importance.</p>
              <button className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                <Download className="w-4 h-4 inline mr-2" />
                Generate Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
