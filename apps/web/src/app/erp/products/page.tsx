'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Plus,
  Search,
  Image,
  Tag,
  BarChart3,
  Store,
  MoreVertical,
  Pencil,
  Trash2,
  Star,
  Eye,
  Filter,
  QrCode,
  RefreshCw,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { Star as StarSolid } from 'lucide-react';
import { ProtectedRoute } from '../../../components/auth/ProtectedRoute';

interface Product {
  id: string;
  name: string;
  sku: string;
  description: string;
  category: string;
  brand: string;
  unitCost: number;
  salePrice: number;
  margin: number;
  currentStock: number;
  minStock: number;
  weight: number;
  dimensions: string;
  supplier: string;
  barcode?: string;
  images: string[];
  status: 'active' | 'inactive' | 'discontinued';
  featured: boolean;
  createdAt: string;
  updatedAt: string;
  totalSales: number;
  monthlySales: number;
}

function MediterraneanProducts(): void {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock' | 'sales'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Mock products data
  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockProducts: Product[] = [
        {
          id: '1',
          name: 'Servidor Dell PowerEdge R740',
          sku: 'DELL-R740-001',
          description: 'Servidor rack 2U con procesadores Intel Xeon escalables, hasta 768GB RAM, ideal para virtualización y aplicaciones empresariales críticas.',
          category: 'Servidores',
          brand: 'Dell',
          unitCost: 4250.00,
          salePrice: 5950.00,
          margin: 40.0,
          currentStock: 2,
          minStock: 5,
          weight: 28.5,
          dimensions: '434 x 708 x 87 mm',
          supplier: 'Dell Technologies',
          barcode: '884116365068',
          images: ['/images/dell-r740.jpg'],
          status: 'active',
          featured: true,
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-08-25T14:30:00Z',
          totalSales: 45,
          monthlySales: 8
        },
        {
          id: '2',
          name: 'Laptop HP EliteBook 850 G8',
          sku: 'HP-EB850-002',
          description: 'Portátil empresarial de 15.6" con Intel Core i7, 16GB RAM, SSD 512GB, diseño premium y seguridad avanzada para profesionales.',
          category: 'Portátiles',
          brand: 'HP',
          unitCost: 1850.00,
          salePrice: 2590.00,
          margin: 40.0,
          currentStock: 15,
          minStock: 10,
          weight: 1.75,
          dimensions: '359 x 234 x 17.9 mm',
          supplier: 'HP Inc.',
          barcode: '196548049226',
          images: ['/images/hp-elitebook-850.jpg'],
          status: 'active',
          featured: true,
          createdAt: '2024-02-10T11:15:00Z',
          updatedAt: '2024-08-28T16:20:00Z',
          totalSales: 128,
          monthlySales: 24
        },
        {
          id: '3',
          name: 'Switch Cisco Catalyst 2960-X',
          sku: 'CISCO-2960X-003',
          description: 'Switch administrable de 24 puertos Gigabit Ethernet con 4 puertos SFP+, ideal para redes empresariales de pequeño y mediano tamaño.',
          category: 'Networking',
          brand: 'Cisco',
          unitCost: 890.00,
          salePrice: 1245.00,
          margin: 39.9,
          currentStock: 0,
          minStock: 6,
          weight: 4.1,
          dimensions: '445 x 254 x 44 mm',
          supplier: 'Cisco Systems',
          barcode: '882658710506',
          images: ['/images/cisco-2960x.jpg'],
          status: 'active',
          featured: false,
          createdAt: '2024-03-05T09:30:00Z',
          updatedAt: '2024-08-15T12:45:00Z',
          totalSales: 67,
          monthlySales: 12
        },
        {
          id: '4',
          name: 'Monitor LG UltraWide 34WN80C',
          sku: 'LG-UW34-004',
          description: 'Monitor curvo de 34" QHD (3440x1440), panel IPS, USB-C con carga de 60W, perfecto para productividad y diseño profesional.',
          category: 'Monitores',
          brand: 'LG',
          unitCost: 650.00,
          salePrice: 845.00,
          margin: 30.0,
          currentStock: 45,
          minStock: 15,
          weight: 6.4,
          dimensions: '808 x 571 x 260 mm',
          supplier: 'LG Electronics',
          barcode: '8806098688968',
          images: ['/images/lg-ultrawide-34.jpg'],
          status: 'active',
          featured: true,
          createdAt: '2024-01-20T14:00:00Z',
          updatedAt: '2024-08-28T10:30:00Z',
          totalSales: 198,
          monthlySales: 35
        },
        {
          id: '5',
          name: 'Router Mikrotik RB5009UG+S+IN',
          sku: 'MIKROTIK-RB5009-005',
          description: 'Router empresarial con 7 puertos Gigabit, 1 puerto 2.5G, 1 SFP+, RouterOS L5, ideal para oficinas y pequeñas empresas.',
          category: 'Networking',
          brand: 'Mikrotik',
          unitCost: 420.00,
          salePrice: 589.00,
          margin: 40.2,
          currentStock: 12,
          minStock: 8,
          weight: 1.3,
          dimensions: '230 x 113 x 28 mm',
          supplier: 'Mikrotik',
          barcode: '4752224003355',
          images: ['/images/mikrotik-rb5009.jpg'],
          status: 'active',
          featured: false,
          createdAt: '2024-04-12T16:45:00Z',
          updatedAt: '2024-08-27T11:15:00Z',
          totalSales: 89,
          monthlySales: 18
        },
        {
          id: '6',
          name: 'SSD Samsung 970 EVO Plus 1TB',
          sku: 'SAMSUNG-SSD-970-006',
          description: 'SSD NVMe M.2 de 1TB con tecnología V-NAND 3-bit MLC, velocidades de hasta 3,500 MB/s lectura, ideal para gaming y workstations.',
          category: 'Almacenamiento',
          brand: 'Samsung',
          unitCost: 145.00,
          salePrice: 189.00,
          margin: 30.3,
          currentStock: 28,
          minStock: 20,
          weight: 0.007,
          dimensions: '80 x 22 x 2.38 mm',
          supplier: 'Samsung Electronics',
          barcode: '8806090312922',
          images: ['/images/samsung-ssd-970-evo.jpg'],
          status: 'active',
          featured: false,
          createdAt: '2024-02-28T13:20:00Z',
          updatedAt: '2024-08-26T15:40:00Z',
          totalSales: 245,
          monthlySales: 42
        },
        {
          id: '7',
          name: 'Impresora HP LaserJet Pro 4301fdw',
          sku: 'HP-LJ4301-007',
          description: 'Impresora láser multifunción monocromo con WiFi, dúplex automático, ADF de 50 hojas, ideal para oficinas pequeñas y medianas.',
          category: 'Impresoras',
          brand: 'HP',
          unitCost: 320.00,
          salePrice: 429.00,
          margin: 34.1,
          currentStock: 8,
          minStock: 12,
          weight: 11.9,
          dimensions: '417 x 330 x 320 mm',
          supplier: 'HP Inc.',
          barcode: '196548048304',
          images: ['/images/hp-laserjet-4301.jpg'],
          status: 'discontinued',
          featured: false,
          createdAt: '2023-11-10T12:00:00Z',
          updatedAt: '2024-07-15T09:30:00Z',
          totalSales: 156,
          monthlySales: 0
        }
      ];

      setProducts(mockProducts);
      setLoading(false);
    };

    loadProducts();
  }, []);

  // Get unique values for filters
  const categories = Array.from(new Set(products.map(p => p.category)));
  const brands = Array.from(new Set(products.map(p => p.brand)));

  // Filter and sort products
  const filteredAndSortedProducts = products
    .filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           product.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      const matchesBrand = selectedBrand === 'all' || product.brand === selectedBrand;
      const matchesStatus = selectedStatus === 'all' || product.status === selectedStatus;

      return matchesSearch && matchesCategory && matchesBrand && matchesStatus;
    })
    .sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'price':
          aValue = a.salePrice;
          bValue = b.salePrice;
          break;
        case 'stock':
          aValue = a.currentStock;
          bValue = b.currentStock;
          break;
        case 'sales':
          aValue = a.monthlySales;
          bValue = b.monthlySales;
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  const toggleFeatured = (productId: string) => {
    setProducts(prev => prev.map(product =>
      product.id === productId
        ? { ...product, featured: !product.featured }
        : product
    ));
  };

  const getStatusColor = (status: Product['status']) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50 border-green-200';
      case 'inactive': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'discontinued': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusLabel = (status: Product['status']) => {
    switch (status) {
      case 'active': return 'Activo';
      case 'inactive': return 'Inactivo';
      case 'discontinued': return 'Descontinuado';
      default: return 'Desconocido';
    }
  };

  const getStockStatusColor = (currentStock: number, minStock: number) => {
    if (currentStock === 0) return 'text-red-600';
    if (currentStock <= minStock) return 'text-orange-600';
    return 'text-green-600';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  // Calculate statistics
  const totalProducts = products.length;
  const activeProducts = products.filter(p => p.status === 'active').length;
  const totalValue = products.reduce((sum, p) => sum + (p.currentStock * p.unitCost), 0);
  const lowStockProducts = products.filter(p => p.currentStock <= p.minStock).length;

  if (loading) {
    return (;
      <div className="min-h-screen bg-gradient-to-br from-mediterranean-50 via-white to-coral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-mediterranean-200 border-t-mediterranean-500 rounded-full animate-spin mx-auto"></div>
            <Box className="w-6 h-6 text-coral-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="mt-4 text-mediterranean-700 font-medium">Cargando catálogo de productos...</p>
        </div>
      </div>
    );
  }

  return (;
    <div className="min-h-screen bg-gradient-to-br from-mediterranean-50 via-white to-coral-50">
      {/* Mediterranean Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-coral-600 via-coral-500 to-terracotta-500 opacity-90"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-20"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white font-playfair mb-2">
                Catálogo de Productos
              </h1>
              <p className="text-coral-100 text-lg">
                {filteredAndSortedProducts.length} productos • {activeProducts} activos • €{(totalValue/1000).toFixed(0)}K valor inventario
              </p>
            </div>

            <div className="flex items-center gap-4">
              <button className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Sincronizar
              </button>

              <button className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Nuevo Producto
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
              label: 'Total Productos',
              value: totalProducts.toString(),
              icon: Box,
              color: 'coral'
            },
            {
              label: 'Productos Activos',
              value: activeProducts.toString(),
              icon: CheckCircle,
              color: 'green'
            },
            {
              label: 'Valor Inventario',
              value: `€${(totalValue / 1000).toFixed(0)}K`,
              icon: BarChart3,
              color: 'mediterranean'
            },
            {
              label: 'Alertas Stock',
              value: lowStockProducts.toString(),
              icon: AlertTriangle,
              color: 'red'
            }
          ].map((stat, index) => {
            const IconComponent = stat.icon;
            return (;
              <div
                key={stat.label}
                className={`relative overflow-hidden rounded-2xl p-6 shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-105 ${
                  stat.color === 'coral' ? 'bg-gradient-to-br from-coral-500 to-coral-600' :
                  stat.color === 'green' ? 'bg-gradient-to-br from-green-500 to-green-600' :
                  stat.color === 'mediterranean' ? 'bg-gradient-to-br from-mediterranean-500 to-mediterranean-600' :
                  'bg-gradient-to-br from-red-500 to-red-600'
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
                className="w-full pl-10 pr-4 py-3 border border-mediterranean-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-coral-500 focus:border-coral-500"
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
                  className="border border-mediterranean-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-coral-500 focus:border-coral-500"
                >
                  <option value="all">Todas las categorías</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              {/* Brand Filter */}
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="border border-mediterranean-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-coral-500 focus:border-coral-500"
              >
                <option value="all">Todas las marcas</option>
                {brands.map(brand => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="border border-mediterranean-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-coral-500 focus:border-coral-500"
              >
                <option value="all">Todos los estados</option>
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
                <option value="discontinued">Descontinuado</option>
              </select>

              {/* Sort */}
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field as any);
                  setSortOrder(order as any);
                }}
                className="border border-mediterranean-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-coral-500 focus:border-coral-500"
              >
                <option value="name-asc">Nombre A-Z</option>
                <option value="name-desc">Nombre Z-A</option>
                <option value="price-asc">Precio menor</option>
                <option value="price-desc">Precio mayor</option>
                <option value="stock-asc">Stock menor</option>
                <option value="stock-desc">Stock mayor</option>
                <option value="sales-desc">Más vendidos</option>
              </select>

              {/* View Mode */}
              <div className="flex bg-mediterranean-100 rounded-xl p-1">
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
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid/List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAndSortedProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                {/* Product Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    {/* Product Image Placeholder */}
                    <div className="w-full h-32 bg-mediterranean-100 rounded-xl mb-3 flex items-center justify-center">
                      <Image className="w-8 h-8 text-mediterranean-400" />
                    </div>

                    <h3 className="font-bold text-mediterranean-800 text-sm font-playfair line-clamp-2">
                      {product.name}
                    </h3>
                    <p className="text-mediterranean-600 text-xs font-mono mt-1">
                      {product.sku}
                    </p>
                    <p className="text-mediterranean-500 text-xs">
                      {product.category} • {product.brand}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 ml-2">
                    <button
                      onClick={() => toggleFeatured(product.id)}
                      className="p-1 hover:bg-mediterranean-50 rounded-full transition-colors"
                    >
                      {product.featured ? (
                        <Star className="w-4 h-4 text-yellow-500" />
                      ) : (
                        <Star className="w-4 h-4 text-mediterranean-400" />
                      )}
                    </button>

                    <button className="p-1 hover:bg-mediterranean-50 rounded-full transition-colors">
                      <MoreVertical className="w-4 h-4 text-mediterranean-400" />
                    </button>
                  </div>
                </div>

                {/* Product Details */}
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-mediterranean-600 text-sm">Precio Venta</span>
                    <span className="font-bold text-mediterranean-800">
                      €{product.salePrice.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-mediterranean-600 text-sm">Stock</span>
                    <span className={`font-bold ${getStockStatusColor(product.currentStock, product.minStock)}`}>
                      {product.currentStock}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-mediterranean-600 text-sm">Margen</span>
                    <span className="text-mediterranean-700">
                      {product.margin.toFixed(1)}%
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-mediterranean-600 text-sm">Ventas/mes</span>
                    <span className="text-mediterranean-700">
                      {product.monthlySales}
                    </span>
                  </div>
                </div>

                {/* Status and Actions */}
                <div className="flex items-center justify-between mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(product.status)}`}>
                    {getStatusLabel(product.status)}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 border-t border-mediterranean-100">
                  <button className="flex-1 bg-gradient-to-r from-coral-500 to-coral-600 text-white py-2 rounded-xl text-sm font-medium hover:shadow-md transition-all duration-200">
                    <Eye className="w-4 h-4 inline mr-1" />
                    Ver
                  </button>
                  <button className="px-3 py-2 border border-mediterranean-200 text-mediterranean-600 rounded-xl hover:bg-mediterranean-50 transition-colors">
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-coral-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-mediterranean-600 uppercase tracking-wider">
                      Producto
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-mediterranean-600 uppercase tracking-wider">
                      SKU / Categoría
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-mediterranean-600 uppercase tracking-wider">
                      Precio
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-mediterranean-600 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-mediterranean-600 uppercase tracking-wider">
                      Margen
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-mediterranean-600 uppercase tracking-wider">
                      Ventas
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
                  {filteredAndSortedProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-mediterranean-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-mediterranean-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Image className="w-5 h-5 text-mediterranean-400" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-mediterranean-800 flex items-center gap-2">
                              {product.name}
                              {product.featured && <Star className="w-4 h-4 text-yellow-500" />}
                            </div>
                            <div className="text-sm text-mediterranean-600">{product.brand}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-mono text-sm text-mediterranean-800">{product.sku}</div>
                          <div className="text-sm text-mediterranean-600">{product.category}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-bold text-mediterranean-800">
                            €{product.salePrice.toFixed(2)}
                          </div>
                          <div className="text-sm text-mediterranean-600">
                            Costo: €{product.unitCost.toFixed(2)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-bold text-lg ${getStockStatusColor(product.currentStock, product.minStock)}`}>
                          {product.currentStock}
                        </span>
                        <div className="text-xs text-mediterranean-600">
                          Min: {product.minStock}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-mediterranean-800">
                          {product.margin.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-mediterranean-800">
                            {product.monthlySales}/mes
                          </div>
                          <div className="text-sm text-mediterranean-600">
                            Total: {product.totalSales}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(product.status)}`}>
                          {getStatusLabel(product.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <button className="p-2 text-coral-600 hover:bg-coral-50 rounded-lg transition-colors">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-mediterranean-600 hover:bg-mediterranean-50 rounded-lg transition-colors">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredAndSortedProducts.length === 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-12 text-center">
            <Box className="w-16 h-16 text-mediterranean-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-mediterranean-800 font-playfair mb-2">
              No se encontraron productos
            </h3>
            <p className="text-mediterranean-600 mb-6">
              {searchQuery || selectedCategory !== 'all' || selectedBrand !== 'all' || selectedStatus !== 'all'
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'Comienza agregando productos al catálogo'
              }
            </p>
            <button className="bg-gradient-to-r from-coral-500 to-terracotta-500 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-200">
              <Plus className="w-4 h-4 inline mr-2" />
              Agregar Producto
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProductsPage(): void {
  return (;
    <ProtectedRoute requiredPermission="erp:products:view">
      <MediterraneanProducts />
    </ProtectedRoute>
  );
}
