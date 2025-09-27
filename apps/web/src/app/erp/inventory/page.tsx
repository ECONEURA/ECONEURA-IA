'use client';

import { useState, useEffect } from 'react';
import { 
  Store, 
  Plus,
  Search,
  Box,
  AlertTriangle,
  Download,
  Upload,
  MoreVertical,
  Pencil,
  Filter,
  BarChart3
} from 'lucide-react';

import { ProtectedRoute } from '../../../components/auth/ProtectedRoute';

interface InventoryItem {
  id: string;
  productName: string;
  sku: string;
  category: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  unitCost: number;
  totalValue: number;
  location: string;
  supplier: string;
  lastMovement: string;
  movementType: 'in' | 'out' | 'adjustment';
  status: 'in-stock' | 'low-stock' | 'out-of-stock' | 'overstock';
}

interface StockMovement {
  id: string;
  productName: string;
  sku: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason: string;
  user: string;
  timestamp: string;
  reference?: string;
}

function MediterraneanInventory() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [showMovements, setShowMovements] = useState(false);

  // Mock inventory data
  useEffect(() => {
    const loadInventoryData = async () => {
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      const mockInventory: InventoryItem[] = [
        {
          id: '1',
          productName: 'Servidor Dell PowerEdge R740',
          sku: 'DELL-R740-001',
          category: 'Servidores',
          currentStock: 2,
          minStock: 5,
          maxStock: 20,
          unitCost: 4250.00,
          totalValue: 8500.00,
          location: 'Almacén A - Estante 1',
          supplier: 'Dell Technologies',
          lastMovement: '2024-08-20',
          movementType: 'out',
          status: 'low-stock'
        },
        {
          id: '2',
          productName: 'Laptop HP EliteBook 850',
          sku: 'HP-EB850-002',
          category: 'Portátiles',
          currentStock: 15,
          minStock: 10,
          maxStock: 50,
          unitCost: 1850.00,
          totalValue: 27750.00,
          location: 'Almacén B - Estante 3',
          supplier: 'HP Inc.',
          lastMovement: '2024-08-25',
          movementType: 'in',
          status: 'in-stock'
        },
        {
          id: '3',
          productName: 'Switch Cisco Catalyst 2960',
          sku: 'CISCO-2960-003',
          category: 'Networking',
          currentStock: 0,
          minStock: 6,
          maxStock: 25,
          unitCost: 890.00,
          totalValue: 0.00,
          location: 'Almacén A - Estante 5',
          supplier: 'Cisco Systems',
          lastMovement: '2024-08-15',
          movementType: 'out',
          status: 'out-of-stock'
        },
        {
          id: '4',
          productName: 'Monitor LG UltraWide 34"',
          sku: 'LG-UW34-004',
          category: 'Monitores',
          currentStock: 45,
          minStock: 15,
          maxStock: 40,
          unitCost: 650.00,
          totalValue: 29250.00,
          location: 'Almacén C - Estante 2',
          supplier: 'LG Electronics',
          lastMovement: '2024-08-28',
          movementType: 'in',
          status: 'overstock'
        },
        {
          id: '5',
          productName: 'Router Mikrotik RB5009',
          sku: 'MIKROTIK-RB5009-005',
          category: 'Networking',
          currentStock: 12,
          minStock: 8,
          maxStock: 30,
          unitCost: 420.00,
          totalValue: 5040.00,
          location: 'Almacén A - Estante 7',
          supplier: 'Mikrotik',
          lastMovement: '2024-08-27',
          movementType: 'adjustment',
          status: 'in-stock'
        },
        {
          id: '6',
          productName: 'SSD Samsung 970 EVO Plus 1TB',
          sku: 'SAMSUNG-SSD-970-006',
          category: 'Almacenamiento',
          currentStock: 28,
          minStock: 20,
          maxStock: 100,
          unitCost: 145.00,
          totalValue: 4060.00,
          location: 'Almacén B - Estante 1',
          supplier: 'Samsung Electronics',
          lastMovement: '2024-08-26',
          movementType: 'in',
          status: 'in-stock'
        }
      ];

      const mockMovements: StockMovement[] = [
        {
          id: '1',
          productName: 'Laptop HP EliteBook 850',
          sku: 'HP-EB850-002',
          type: 'in',
          quantity: 10,
          reason: 'Recepción de pedido #PO-2024-0856',
          user: 'Ana Martínez',
          timestamp: '2024-08-25T10:30:00Z',
          reference: 'PO-2024-0856'
        },
        {
          id: '2',
          productName: 'Switch Cisco Catalyst 2960',
          sku: 'CISCO-2960-003',
          type: 'out',
          quantity: 3,
          reason: 'Venta a cliente - Proyecto Red Corporativa',
          user: 'Carlos Mendoza',
          timestamp: '2024-08-15T14:15:00Z',
          reference: 'SO-2024-1247'
        },
        {
          id: '3',
          productName: 'Router Mikrotik RB5009',
          sku: 'MIKROTIK-RB5009-005',
          type: 'adjustment',
          quantity: -2,
          reason: 'Ajuste por inventario físico',
          user: 'Laura Jiménez',
          timestamp: '2024-08-27T16:45:00Z'
        },
        {
          id: '4',
          productName: 'Monitor LG UltraWide 34"',
          sku: 'LG-UW34-004',
          type: 'in',
          quantity: 15,
          reason: 'Recepción masiva - Promoción Q3',
          user: 'Diego Fernández',
          timestamp: '2024-08-28T09:20:00Z',
          reference: 'PO-2024-0891'
        }
      ];
      
      setInventory(mockInventory);
      setMovements(mockMovements);
      setLoading(false);
    };
    
    loadInventoryData();
  }, []);

  // Get unique categories for filter
  const categories = Array.from(new Set(inventory.map(item => item.category)));

  // Filter inventory based on search and filters
  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusColor = (status: InventoryItem['status']) => {
    switch (status) {
      case 'in-stock': return 'text-green-600 bg-green-50 border-green-200';
      case 'low-stock': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'out-of-stock': return 'text-red-600 bg-red-50 border-red-200';
      case 'overstock': return 'text-purple-600 bg-purple-50 border-purple-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusLabel = (status: InventoryItem['status']) => {
    switch (status) {
      case 'in-stock': return 'En Stock';
      case 'low-stock': return 'Stock Bajo';
      case 'out-of-stock': return 'Sin Stock';
      case 'overstock': return 'Sobrestock';
      default: return 'Desconocido';
    }
  };

  const getMovementColor = (type: StockMovement['type']) => {
    switch (type) {
      case 'in': return 'text-green-600 bg-green-100';
      case 'out': return 'text-red-600 bg-red-100';
      case 'adjustment': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getMovementIcon = (type: StockMovement['type']) => {
    switch (type) {
      case 'in': return Download;
      case 'out': return Upload;
      case 'adjustment': return Pencil;
      default: return Box;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate inventory statistics
  const totalValue = inventory.reduce((sum, item) => sum + item.totalValue, 0);
  const lowStockItems = inventory.filter(item => item.status === 'low-stock' || item.status === 'out-of-stock');
  const totalItems = inventory.reduce((sum, item) => sum + item.currentStock, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-mediterranean-50 via-white to-coral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-mediterranean-200 border-t-mediterranean-500 rounded-full animate-spin mx-auto"></div>
            <Store className="w-6 h-6 text-coral-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="mt-4 text-mediterranean-700 font-medium">Cargando inventario...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-mediterranean-50 via-white to-coral-50">
      {/* Mediterranean Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-olive-600 via-olive-500 to-terracotta-500 opacity-90"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-20"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white font-playfair mb-2">
                Gestión de Inventario
              </h1>
              <p className="text-olive-100 text-lg">
                {filteredInventory.length} productos • €{totalValue.toLocaleString()} valor total • {lowStockItems.length} alertas
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setShowMovements(!showMovements)}
                className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center gap-2"
              >
                <BarChart3 className="w-4 h-4" />
                {showMovements ? 'Ver Inventario' : 'Ver Movimientos'}
              </button>
              
              <button className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Ajuste Stock
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          {[
            {
              label: 'Valor Total Inventario',
              value: `€${(totalValue / 1000).toFixed(0)}K`,
              icon: BarChart3,
              color: 'olive'
            },
            {
              label: 'Total Productos',
              value: totalItems.toLocaleString(),
              icon: Box,
              color: 'mediterranean'
            },
            {
              label: 'Alertas de Stock',
              value: lowStockItems.length.toString(),
              icon: AlertTriangle,
              color: 'red'
            },
            {
              label: 'Categorías',
              value: categories.length.toString(),
              icon: Store,
              color: 'terracotta'
            }
          ].map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div
                key={stat.label}
                className={`relative overflow-hidden rounded-2xl p-6 shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-105 ${
                  stat.color === 'olive' ? 'bg-gradient-to-br from-olive-500 to-olive-600' :
                  stat.color === 'mediterranean' ? 'bg-gradient-to-br from-mediterranean-500 to-mediterranean-600' :
                  stat.color === 'red' ? 'bg-gradient-to-br from-red-500 to-red-600' :
                  'bg-gradient-to-br from-terracotta-500 to-terracotta-600'
                }`}
              >
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-20 h-20 bg-white/10 rounded-full"></div>
                <div className="relative">
                  <IconComponent className="w-8 h-8 text-white mb-4" />
                  <div className="text-2xl font-bold text-white mb-1 font-playfair">
                    {stat.value}
                  </div>
                  <div className="text-white/80 text-sm font-medium">
                    {stat.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {!showMovements ? (
        <>
          {/* Filters and Search */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-6">
              <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-mediterranean-400" />
                  <input
                    type="text"
                    placeholder="Buscar productos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-mediterranean-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-olive-500 focus:border-olive-500"
                  />
                </div>
                
                {/* Filters */}
                <div className="flex flex-wrap items-center gap-4">
                  {/* Category Filter */}
                  <div className="flex items-center gap-2">
                    <Filter className="w-5 h-5 text-mediterranean-600" />
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="border border-mediterranean-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-olive-500 focus:border-olive-500"
                    >
                      <option value="all">Todas las categorías</option>
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Status Filter */}
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="border border-mediterranean-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-olive-500 focus:border-olive-500"
                  >
                    <option value="all">Todos los estados</option>
                    <option value="in-stock">En Stock</option>
                    <option value="low-stock">Stock Bajo</option>
                    <option value="out-of-stock">Sin Stock</option>
                    <option value="overstock">Sobrestock</option>
                  </select>
                  
                  {/* View Mode */}
                  <div className="flex bg-mediterranean-100 rounded-xl p-1">
                    <button
                      onClick={() => setViewMode('list')}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        viewMode === 'list' 
                          ? 'bg-white text-mediterranean-600 shadow-sm' 
                          : 'text-mediterranean-600 hover:bg-mediterranean-50'
                      }`}
                    >
                      Lista
                    </button>
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        viewMode === 'grid' 
                          ? 'bg-white text-mediterranean-600 shadow-sm' 
                          : 'text-mediterranean-600 hover:bg-mediterranean-50'
                      }`}
                    >
                      Cuadrícula
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Inventory List/Grid */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
            {viewMode === 'list' ? (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-olive-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-mediterranean-600 uppercase tracking-wider">
                          Producto
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-mediterranean-600 uppercase tracking-wider">
                          SKU / Categoría
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-mediterranean-600 uppercase tracking-wider">
                          Stock Actual
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-mediterranean-600 uppercase tracking-wider">
                          Rango Stock
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-mediterranean-600 uppercase tracking-wider">
                          Valor
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-mediterranean-600 uppercase tracking-wider">
                          Ubicación
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-mediterranean-600 uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-medium text-mediterranean-600 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-mediterranean-100">
                      {filteredInventory.map((item) => (
                        <tr key={item.id} className="hover:bg-mediterranean-50 transition-colors">
                          <td className="px-6 py-4">
                            <div>
                              <div className="font-medium text-mediterranean-800">{item.productName}</div>
                              <div className="text-sm text-mediterranean-600">{item.supplier}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <div className="font-mono text-sm text-mediterranean-800">{item.sku}</div>
                              <div className="text-sm text-mediterranean-600">{item.category}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-bold text-mediterranean-800 text-lg">
                              {item.currentStock}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-mediterranean-600">
                              Min: {item.minStock} | Max: {item.maxStock}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <div className="font-bold text-mediterranean-800">
                                €{item.totalValue.toLocaleString()}
                              </div>
                              <div className="text-sm text-mediterranean-600">
                                €{item.unitCost} c/u
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-mediterranean-600 text-sm">{item.location}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(item.status)}`}>
                              {getStatusLabel(item.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center gap-2 justify-end">
                              <button className="p-2 text-olive-600 hover:bg-olive-50 rounded-lg transition-colors">
                                <Download className="w-4 h-4" />
                              </button>
                              <button className="p-2 text-mediterranean-600 hover:bg-mediterranean-50 rounded-lg transition-colors">
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button className="p-2 text-mediterranean-600 hover:bg-mediterranean-50 rounded-lg transition-colors">
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
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredInventory.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 hover:scale-105"
                  >
                    {/* Item Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-mediterranean-800 text-sm font-playfair truncate">
                          {item.productName}
                        </h3>
                        <p className="text-mediterranean-600 text-xs font-mono">
                          {item.sku}
                        </p>
                        <p className="text-mediterranean-500 text-xs">
                          {item.category}
                        </p>
                      </div>
                      
                      <button className="p-1 hover:bg-mediterranean-50 rounded-full transition-colors">
                        <MoreVertical className="w-4 h-4 text-mediterranean-400" />
                      </button>
                    </div>

                    {/* Stock Information */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-mediterranean-600 text-sm">Stock Actual</span>
                        <span className="font-bold text-mediterranean-800 text-xl">
                          {item.currentStock}
                        </span>
                      </div>
                      
                      <div className="w-full bg-mediterranean-100 rounded-full h-2 mb-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            item.currentStock === 0 ? 'bg-red-500' :
                            item.currentStock <= item.minStock ? 'bg-orange-500' :
                            item.currentStock >= item.maxStock ? 'bg-purple-500' :
                            'bg-green-500'
                          }`}
                          style={{ 
                            width: `${Math.min((item.currentStock / item.maxStock) * 100, 100)}%` 
                          }}
                        ></div>
                      </div>
                      
                      <div className="flex justify-between text-xs text-mediterranean-600">
                        <span>Min: {item.minStock}</span>
                        <span>Max: {item.maxStock}</span>
                      </div>
                    </div>

                    {/* Value and Status */}
                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between items-center">
                        <span className="text-mediterranean-600 text-sm">Valor Total</span>
                        <span className="font-bold text-mediterranean-800">
                          €{item.totalValue.toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-mediterranean-600 text-sm">Costo Unitario</span>
                        <span className="text-mediterranean-700">
                          €{item.unitCost.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Location and Status */}
                    <div className="space-y-2 mb-4">
                      <div className="text-xs text-mediterranean-600">
                        📍 {item.location}
                      </div>
                      
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(item.status)}`}>
                        {getStatusLabel(item.status)}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-4 border-t border-mediterranean-100">
                      <button className="flex-1 bg-gradient-to-r from-olive-500 to-olive-600 text-white py-2 rounded-xl text-sm font-medium hover:shadow-md transition-all duration-200">
                        <Download className="w-4 h-4 inline mr-1" />
                        Entrada
                      </button>
                      <button className="flex-1 bg-gradient-to-r from-terracotta-500 to-terracotta-600 text-white py-2 rounded-xl text-sm font-medium hover:shadow-md transition-all duration-200">
                        <Upload className="w-4 h-4 inline mr-1" />
                        Salida
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {filteredInventory.length === 0 && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-12 text-center">
                <Store className="w-16 h-16 text-mediterranean-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-mediterranean-800 font-playfair mb-2">
                  No se encontraron productos
                </h3>
                <p className="text-mediterranean-600 mb-6">
                  {searchQuery || selectedCategory !== 'all' || selectedStatus !== 'all'
                    ? 'Intenta ajustar los filtros de búsqueda'
                    : 'Comienza agregando productos al inventario'
                  }
                </p>
                <button className="bg-gradient-to-r from-olive-500 to-terracotta-500 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-200">
                  <Plus className="w-4 h-4 inline mr-2" />
                  Agregar Producto
                </button>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Stock Movements View */
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-mediterranean-800 font-playfair mb-6">
              Movimientos de Stock Recientes
            </h3>
            
            <div className="space-y-4">
              {movements.map((movement) => {
                const IconComponent = getMovementIcon(movement.type);
                return (
                  <div key={movement.id} className="flex items-start gap-4 p-4 border border-mediterranean-100 rounded-xl hover:bg-mediterranean-50 transition-colors">
                    <div className={`p-2 rounded-full ${getMovementColor(movement.type)}`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-mediterranean-800">
                            {movement.productName}
                          </h4>
                          <p className="text-sm text-mediterranean-600 font-mono">
                            {movement.sku}
                          </p>
                          <p className="text-sm text-mediterranean-600 mt-1">
                            {movement.reason}
                          </p>
                          {movement.reference && (
                            <p className="text-xs text-mediterranean-500 mt-1">
                              Ref: {movement.reference}
                            </p>
                          )}
                        </div>
                        
                        <div className="text-right">
                          <div className={`text-lg font-bold ${
                            movement.type === 'in' ? 'text-green-600' :
                            movement.type === 'out' ? 'text-red-600' :
                            'text-blue-600'
                          }`}>
                            {movement.type === 'in' ? '+' : movement.type === 'out' ? '-' : '±'}{Math.abs(movement.quantity)}
                          </div>
                          <div className="text-xs text-mediterranean-500">
                            {formatDate(movement.timestamp)}
                          </div>
                          <div className="text-xs text-mediterranean-600">
                            por {movement.user}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function InventoryPage() {
  return (
    <ProtectedRoute requiredPermission="erp:inventory:view">
      <MediterraneanInventory />
    </ProtectedRoute>
  );
}