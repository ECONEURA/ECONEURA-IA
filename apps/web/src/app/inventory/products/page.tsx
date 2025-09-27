'use client';

import { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Euro
} from 'lucide-react';

import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api-client';

interface Product {
  id: string;
  name: string;
  description: string;
  sku: string;
  category: string;
  unit_price: number;
  cost_price: number;
  currency: string;
  unit: string;
  stock_quantity: number;
  min_stock_level: number;
  supplier_id: string;
  is_active: boolean;
  metadata: any;
  created_at: string;
  updated_at: string;
}

interface ProductsResponse {
  data: Product[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export default function ProductsPage() {
  const { user } = useAuth();
  const api = apiClient;
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    offset: 0,
    hasMore: false
  });

  useEffect(() => {
    loadProducts();
  }, [pagination.offset, searchTerm, selectedCategory]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: pagination.limit.toString(),
        offset: pagination.offset.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(selectedCategory && { category: selectedCategory })
      });

      const data: ProductsResponse = await api.request({ url: `/products?${params.toString()}`, method: 'GET' });
      const list = (data as any).data ?? (data as any);
      setProducts(list);
      setPagination(prev => ({
        ...prev,
        total: (data as any).pagination?.total ?? prev.total,
        hasMore: (data as any).pagination?.hasMore ?? prev.hasMore
      }));
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => `€${price.toFixed(2)}`;
  const formatStockStatus = (quantity: number, minLevel: number) => {
    if (quantity === 0) return { status: 'out', color: 'text-red-600', bg: 'bg-red-50' };
    if (quantity <= minLevel) return { status: 'low', color: 'text-orange-600', bg: 'bg-orange-50' };
    return { status: 'ok', color: 'text-green-600', bg: 'bg-green-50' };
  };

  const getStockIcon = (status: string) => {
    switch (status) {
      case 'out': return <AlertTriangle className="w-4 h-4" />;
      case 'low': return <TrendingDown className="w-4 h-4" />;
      default: return <TrendingUp className="w-4 h-4" />;
    }
  };

  if (loading && products.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sand-50 via-white to-mediterranean-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-8 h-8 text-mediterranean-600 animate-pulse mx-auto mb-4" />
          <p className="text-mediterranean-600">Cargando productos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sand-50 via-white to-mediterranean-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-sand-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-mediterranean-900 font-playfair">
                Productos
              </h1>
              <p className="text-mediterranean-600 mt-1">
                Gestiona tu inventario de productos
              </p>
            </div>
            <button className="flex items-center px-4 py-2 bg-mediterranean-600 text-white rounded-lg hover:bg-mediterranean-700 transition-colors duration-200">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Producto
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sand-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-sand-300 rounded-lg focus:ring-2 focus:ring-mediterranean-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-4 py-2 border border-sand-300 rounded-lg hover:bg-sand-50 transition-colors duration-200"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filtros
              </button>
            </div>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-sand-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border border-sand-300 rounded-lg focus:ring-2 focus:ring-mediterranean-500 focus:border-transparent"
                >
                  <option value="">Todas las categorías</option>
                  <option value="Laptops">Laptops</option>
                  <option value="Monitors">Monitores</option>
                  <option value="Furniture">Mobiliario</option>
                  <option value="Software">Software</option>
                  <option value="Energy">Energía</option>
                  <option value="Peripherals">Periféricos</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => {
            const stockStatus = formatStockStatus(product.stock_quantity, product.min_stock_level);
            return (
              <div key={product.id} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                {/* Product Image Placeholder */}
                <div className="h-48 bg-gradient-to-br from-mediterranean-100 to-sand-100 flex items-center justify-center">
                  <Package className="w-16 h-16 text-mediterranean-400" />
                </div>

                {/* Product Info */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-mediterranean-900 text-lg line-clamp-2">
                      {product.name}
                    </h3>
                    <div className="relative">
                      <button className="p-1 hover:bg-sand-100 rounded">
                        <MoreVertical className="w-4 h-4 text-sand-600" />
                      </button>
                    </div>
                  </div>

                  <p className="text-sand-600 text-sm mb-3 line-clamp-2">
                    {product.description}
                  </p>

                  {/* SKU and Category */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-sand-500 bg-sand-100 px-2 py-1 rounded">
                      {product.sku}
                    </span>
                    <span className="text-xs text-mediterranean-600 bg-mediterranean-100 px-2 py-1 rounded">
                      {product.category}
                    </span>
                  </div>

                  {/* Price */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <Euro className="w-4 h-4 text-green-600 mr-1" />
                      <span className="font-bold text-green-600 text-lg">
                        {formatPrice(product.unit_price)}
                      </span>
                    </div>
                    <span className="text-xs text-sand-500">
                      {product.unit}
                    </span>
                  </div>

                  {/* Stock Status */}
                  <div className={`flex items-center justify-between p-2 rounded-lg ${stockStatus.bg}`}>
                    <div className="flex items-center">
                      <span className={`mr-2 ${stockStatus.color}`}>
                        {getStockIcon(stockStatus.status)}
                      </span>
                      <span className={`text-sm font-medium ${stockStatus.color}`}>
                        {product.stock_quantity} en stock
                      </span>
                    </div>
                    {stockStatus.status === 'low' && (
                      <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">
                        Mín: {product.min_stock_level}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-sand-200">
                    <button className="flex items-center text-sm text-mediterranean-600 hover:text-mediterranean-700">
                      <Eye className="w-4 h-4 mr-1" />
                      Ver
                    </button>
                    <div className="flex items-center gap-2">
                      <button className="p-1 text-sand-600 hover:text-mediterranean-600 hover:bg-sand-100 rounded">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-1 text-sand-600 hover:text-red-600 hover:bg-red-50 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        {pagination.total > 0 && (
          <div className="mt-8 flex items-center justify-between">
            <p className="text-sand-600">
              Mostrando {pagination.offset + 1} - {Math.min(pagination.offset + pagination.limit, pagination.total)} de {pagination.total} productos
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, offset: Math.max(0, prev.offset - prev.limit) }))}
                disabled={pagination.offset === 0}
                className="px-3 py-2 border border-sand-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-sand-50"
              >
                Anterior
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, offset: prev.offset + prev.limit }))}
                disabled={!pagination.hasMore}
                className="px-3 py-2 border border-sand-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-sand-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && products.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-sand-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-sand-600 mb-2">No hay productos</h3>
            <p className="text-sand-500 mb-6">
              {searchTerm || selectedCategory 
                ? 'No se encontraron productos con los filtros aplicados.'
                : 'Comienza agregando tu primer producto al inventario.'
              }
            </p>
            <button className="flex items-center px-4 py-2 bg-mediterranean-600 text-white rounded-lg hover:bg-mediterranean-700 transition-colors duration-200 mx-auto">
              <Plus className="w-4 h-4 mr-2" />
              Agregar Producto
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
