'use client';

import { useState } from 'react';
import { 
  CubeIcon, 
  BuildingStorefrontIcon, 
  TruckIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';
import { ProtectedRoute } from '../../components/auth/ProtectedRoute';

interface ERPStats {
  totalProducts: number;
  lowStockItems: number;
  totalSuppliers: number;
  pendingOrders: number;
  totalInventoryValue: number;
  monthlyMovement: number;
}

function MediterraneanERP() {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'inventory' | 'products' | 'suppliers'>('overview');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock ERP statistics
  const erpStats: ERPStats = {
    totalProducts: 1847,
    lowStockItems: 23,
    totalSuppliers: 156,
    pendingOrders: 12,
    totalInventoryValue: 2480550,
    monthlyMovement: 845200
  };

  const recentActivity = [
    {
      id: 1,
      type: 'stock-low',
      title: 'Stock bajo detectado',
      description: 'Producto "Servidor Dell PowerEdge" - Solo quedan 2 unidades',
      time: 'Hace 10 minutos',
      icon: ExclamationTriangleIcon,
      color: 'red'
    },
    {
      id: 2,
      type: 'order-received',
      title: 'Pedido recibido',
      description: 'Orden de compra #PO-2024-0856 - Proveedor Tech Solutions',
      time: 'Hace 45 minutos',
      icon: CheckCircleIcon,
      color: 'green'
    },
    {
      id: 3,
      type: 'supplier-updated',
      title: 'Proveedor actualizado',
      description: 'Mediterráneo Hardware - Nuevos precios actualizados',
      time: 'Hace 1 hora',
      icon: TruckIcon,
      color: 'blue'
    },
    {
      id: 4,
      type: 'product-added',
      title: 'Producto añadido',
      description: 'Nuevo producto: "Laptop HP EliteBook 850" agregado al catálogo',
      time: 'Hace 2 horas',
      icon: CubeIcon,
      color: 'purple'
    }
  ];

  const topProducts = [
    {
      id: 1,
      name: 'Servidor Dell PowerEdge R740',
      sku: 'DELL-R740-001',
      category: 'Servidores',
      stock: 2,
      minStock: 5,
      price: 4250.00,
      monthlySales: 8,
      supplier: 'Dell Technologies'
    },
    {
      id: 2,
      name: 'Laptop HP EliteBook 850',
      sku: 'HP-EB850-002',
      category: 'Portátiles',
      stock: 15,
      minStock: 10,
      price: 1850.00,
      monthlySales: 24,
      supplier: 'HP Inc.'
    },
    {
      id: 3,
      name: 'Switch Cisco Catalyst 2960',
      sku: 'CISCO-2960-003',
      category: 'Networking',
      stock: 8,
      minStock: 6,
      price: 890.00,
      monthlySales: 12,
      supplier: 'Cisco Systems'
    },
    {
      id: 4,
      name: 'Monitor LG UltraWide 34"',
      sku: 'LG-UW34-004',
      category: 'Monitores',
      stock: 25,
      minStock: 15,
      price: 650.00,
      monthlySales: 35,
      supplier: 'LG Electronics'
    }
  ];

  const quickActions = [
    {
      title: 'Añadir Producto',
      description: 'Registrar nuevo producto en el inventario',
      icon: CubeIcon,
      color: 'coral',
      href: '/erp/products/new'
    },
    {
      title: 'Gestionar Stock',
      description: 'Actualizar niveles de inventario',
      icon: BuildingStorefrontIcon,
      color: 'olive',
      href: '/erp/inventory'
    },
    {
      title: 'Nuevo Proveedor',
      description: 'Registrar proveedor en el sistema',
      icon: TruckIcon,
      color: 'mediterranean',
      href: '/erp/suppliers/new'
    },
    {
      title: 'Generar Orden',
      description: 'Crear orden de compra automática',
      icon: ClockIcon,
      color: 'terracotta',
      href: '/erp/orders/new'
    }
  ];

  const getStockStatusColor = (stock: number, minStock: number) => {
    if (stock === 0) return 'text-red-600 bg-red-50';
    if (stock <= minStock) return 'text-orange-600 bg-orange-50';
    return 'text-green-600 bg-green-50';
  };

  const getStockStatusLabel = (stock: number, minStock: number) => {
    if (stock === 0) return 'Sin Stock';
    if (stock <= minStock) return 'Stock Bajo';
    return 'En Stock';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-mediterranean-50 via-white to-coral-50">
      {/* Mediterranean Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-olive-600 via-olive-500 to-terracotta-500 opacity-90"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23ffffff\" fill-opacity=\"0.1\"%3E%3Ccircle cx=\"30\" cy=\"30\" r=\"4\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white font-playfair mb-2">
                ERP Mediterráneo
              </h1>
              <p className="text-olive-100 text-lg">
                Sistema integral de gestión empresarial
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Search Bar */}
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60" />
                <input
                  type="text"
                  placeholder="Buscar productos, proveedores..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 w-64"
                />
              </div>
              
              <button className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center gap-2">
                <PlusIcon className="w-4 h-4" />
                Nuevo
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-2">
          <div className="flex space-x-1">
            {[
              { id: 'overview', label: 'Resumen', icon: ChartBarIcon },
              { id: 'inventory', label: 'Inventario', icon: BuildingStorefrontIcon },
              { id: 'products', label: 'Productos', icon: CubeIcon },
              { id: 'suppliers', label: 'Proveedores', icon: TruckIcon }
            ].map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                    selectedTab === tab.id
                      ? 'bg-gradient-to-r from-olive-500 to-terracotta-500 text-white shadow-md'
                      : 'text-mediterranean-700 hover:bg-mediterranean-50'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {selectedTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
              {[
                {
                  label: 'Productos Totales',
                  value: erpStats.totalProducts.toLocaleString(),
                  icon: CubeIcon,
                  color: 'olive',
                  change: '+8%'
                },
                {
                  label: 'Stock Bajo',
                  value: erpStats.lowStockItems.toString(),
                  icon: ExclamationTriangleIcon,
                  color: 'red',
                  change: '-15%'
                },
                {
                  label: 'Proveedores Activos',
                  value: erpStats.totalSuppliers.toLocaleString(),
                  icon: TruckIcon,
                  color: 'mediterranean',
                  change: '+5%'
                },
                {
                  label: 'Órdenes Pendientes',
                  value: erpStats.pendingOrders.toString(),
                  icon: ClockIcon,
                  color: 'terracotta',
                  change: '+12%'
                },
                {
                  label: 'Valor Inventario',
                  value: `€${(erpStats.totalInventoryValue / 1000000).toFixed(1)}M`,
                  icon: ChartBarIcon,
                  color: 'coral',
                  change: '+18%'
                },
                {
                  label: 'Movimiento Mensual',
                  value: `€${(erpStats.monthlyMovement / 1000).toFixed(0)}K`,
                  icon: ArrowTrendingUpIcon,
                  color: 'green',
                  change: '+24%'
                }
              ].map((stat, index) => {
                const IconComponent = stat.icon;
                const isPositive = !stat.change.startsWith('-');
                
                return (
                  <div
                    key={stat.label}
                    className={`relative overflow-hidden rounded-2xl p-6 shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-xl ${
                      stat.color === 'olive' ? 'bg-gradient-to-br from-olive-500 to-olive-600' :
                      stat.color === 'red' ? 'bg-gradient-to-br from-red-500 to-red-600' :
                      stat.color === 'mediterranean' ? 'bg-gradient-to-br from-mediterranean-500 to-mediterranean-600' :
                      stat.color === 'terracotta' ? 'bg-gradient-to-br from-terracotta-500 to-terracotta-600' :
                      stat.color === 'coral' ? 'bg-gradient-to-br from-coral-500 to-coral-600' :
                      'bg-gradient-to-br from-green-500 to-green-600'
                    }`}
                  >
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full"></div>
                    
                    <div className="relative">
                      <div className="flex items-center justify-between mb-4">
                        <IconComponent className="w-8 h-8 text-white" />
                        <span className={`text-sm font-medium ${
                          isPositive ? 'text-green-200' : 'text-red-200'
                        }`}>
                          {stat.change}
                        </span>
                      </div>
                      
                      <div className="text-3xl font-bold text-white mb-1 font-playfair">
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

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
              {/* Quick Actions */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-mediterranean-800 font-playfair mb-6">
                  Acciones Rápidas
                </h3>
                
                <div className="grid grid-cols-1 gap-4">
                  {quickActions.map((action) => {
                    const IconComponent = action.icon;
                    return (
                      <button
                        key={action.title}
                        className={`text-left p-4 rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-md ${
                          action.color === 'coral' ? 'bg-coral-50 hover:bg-coral-100' :
                          action.color === 'olive' ? 'bg-olive-50 hover:bg-olive-100' :
                          action.color === 'mediterranean' ? 'bg-mediterranean-50 hover:bg-mediterranean-100' :
                          'bg-terracotta-50 hover:bg-terracotta-100'
                        }`}
                      >
                        <div className="flex items-center mb-2">
                          <IconComponent className={`w-5 h-5 mr-2 ${
                            action.color === 'coral' ? 'text-coral-600' :
                            action.color === 'olive' ? 'text-olive-600' :
                            action.color === 'mediterranean' ? 'text-mediterranean-600' :
                            'text-terracotta-600'
                          }`} />
                          <span className={`font-medium ${
                            action.color === 'coral' ? 'text-coral-800' :
                            action.color === 'olive' ? 'text-olive-800' :
                            action.color === 'mediterranean' ? 'text-mediterranean-800' :
                            'text-terracotta-800'
                          }`}>
                            {action.title}
                          </span>
                        </div>
                        <p className={`text-sm ${
                          action.color === 'coral' ? 'text-coral-600' :
                          action.color === 'olive' ? 'text-olive-600' :
                          action.color === 'mediterranean' ? 'text-mediterranean-600' :
                          'text-terracotta-600'
                        }`}>
                          {action.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-mediterranean-800 font-playfair mb-6">
                  Actividad Reciente
                </h3>
                
                <div className="space-y-4">
                  {recentActivity.map((activity) => {
                    const IconComponent = activity.icon;
                    return (
                      <div key={activity.id} className="flex items-start gap-4 p-3 rounded-xl hover:bg-mediterranean-50 transition-colors duration-200">
                        <div className={`p-2 rounded-full ${
                          activity.color === 'red' ? 'bg-red-100' :
                          activity.color === 'green' ? 'bg-green-100' :
                          activity.color === 'blue' ? 'bg-blue-100' :
                          'bg-purple-100'
                        }`}>
                          <IconComponent className={`w-4 h-4 ${
                            activity.color === 'red' ? 'text-red-600' :
                            activity.color === 'green' ? 'text-green-600' :
                            activity.color === 'blue' ? 'text-blue-600' :
                            'text-purple-600'
                          }`} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-mediterranean-800">
                            {activity.title}
                          </p>
                          <p className="text-mediterranean-600 text-sm">
                            {activity.description}
                          </p>
                          <p className="text-mediterranean-500 text-xs mt-1">
                            {activity.time}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Top Products */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-mediterranean-800 font-playfair mb-6">
                  Productos Destacados
                </h3>
                
                <div className="space-y-4">
                  {topProducts.map((product) => (
                    <div key={product.id} className="p-3 border border-mediterranean-100 rounded-xl hover:bg-mediterranean-50 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-mediterranean-800 text-sm truncate">
                            {product.name}
                          </h4>
                          <p className="text-mediterranean-600 text-xs">
                            {product.sku} • {product.category}
                          </p>
                        </div>
                        
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStockStatusColor(product.stock, product.minStock)}`}>
                          {getStockStatusLabel(product.stock, product.minStock)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-mediterranean-600">
                          Stock: {product.stock}
                        </span>
                        <span className="font-bold text-mediterranean-800">
                          €{product.price.toFixed(2)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-mediterranean-500 mt-1">
                        <span>Ventas: {product.monthlySales}/mes</span>
                        <span>{product.supplier}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Placeholder for other tabs */}
        {selectedTab !== 'overview' && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 text-center">
            <div className="text-mediterranean-600 mb-4">
              <ChartBarIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-bold text-mediterranean-800 font-playfair mb-2">
                {selectedTab === 'inventory' && 'Gestión de Inventario'}
                {selectedTab === 'products' && 'Catálogo de Productos'}
                {selectedTab === 'suppliers' && 'Gestión de Proveedores'}
              </h3>
              <p className="text-mediterranean-600">
                Esta sección está en desarrollo. Próximamente disponible con diseño mediterráneo completo.
              </p>
            </div>
            
            <button className="bg-gradient-to-r from-olive-500 to-terracotta-500 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-200">
              Explorar Funcionalidades
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ERPPage() {
  return (
    <ProtectedRoute requiredPermission="erp:view">
      <MediterraneanERP />
    </ProtectedRoute>
  );
}