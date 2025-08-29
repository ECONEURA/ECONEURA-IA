'use client';

import { useState, useEffect } from 'react';
import { 
  Truck, 
  Plus,
  Search,
  Mail,
  Phone,
  MapPin,
  Globe,
  MoreVertical,
  Pencil,
  Trash2,
  Star,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Filter,
  BarChart3
} from 'lucide-react';
import { ProtectedRoute } from '../../../components/auth/ProtectedRoute';

interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  city: string;
  country: string;
  taxId: string;
  category: string;
  paymentTerms: string;
  currency: string;
  status: 'active' | 'inactive' | 'pending' | 'blocked';
  rating: number;
  preferred: boolean;
  totalOrders: number;
  totalSpent: number;
  averageDeliveryTime: number;
  onTimeDeliveryRate: number;
  qualityRating: number;
  lastOrderDate: string;
  createdAt: string;
  products: string[];
  notes: string;
}

function MediterraneanSuppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedRating, setSelectedRating] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'rating' | 'orders' | 'spent'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Mock suppliers data
  useEffect(() => {
    const loadSuppliers = async () => {
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockSuppliers: Supplier[] = [
        {
          id: '1',
          name: 'Dell Technologies España',
          contactPerson: 'María González Ruiz',
          email: 'ventas@dell.es',
          phone: '+34 902 887 881',
          website: 'www.dell.es',
          address: 'Calle Ribera del Loira, 28',
          city: 'Madrid',
          country: 'España',
          taxId: 'ESA12345678',
          category: 'Hardware',
          paymentTerms: '30 días',
          currency: 'EUR',
          status: 'active',
          rating: 4.8,
          preferred: true,
          totalOrders: 156,
          totalSpent: 890250.00,
          averageDeliveryTime: 3.2,
          onTimeDeliveryRate: 94.5,
          qualityRating: 4.9,
          lastOrderDate: '2024-08-25',
          createdAt: '2022-01-15',
          products: ['Servidores', 'Workstations', 'Almacenamiento'],
          notes: 'Proveedor principal para equipos empresariales. Excelente soporte técnico y garantías extendidas.'
        },
        {
          id: '2',
          name: 'HP Inc. Ibérica',
          contactPerson: 'Carlos Fernández López',
          email: 'partners@hp.com',
          phone: '+34 917 229 200',
          website: 'www.hp.es',
          address: 'Avda. de Granadilla, 7',
          city: 'Alcobendas, Madrid',
          country: 'España',
          taxId: 'ESB87654321',
          category: 'Hardware',
          paymentTerms: '45 días',
          currency: 'EUR',
          status: 'active',
          rating: 4.6,
          preferred: true,
          totalOrders: 203,
          totalSpent: 1250480.00,
          averageDeliveryTime: 4.1,
          onTimeDeliveryRate: 91.2,
          qualityRating: 4.7,
          lastOrderDate: '2024-08-28',
          createdAt: '2021-11-20',
          products: ['Portátiles', 'Impresoras', 'Monitores', 'Accesorios'],
          notes: 'Gran variedad de productos para oficina. Programa de partners con descuentos especiales.'
        },
        {
          id: '3',
          name: 'Cisco Systems España',
          contactPerson: 'Ana Martínez Torres',
          email: 'spain-partners@cisco.com',
          phone: '+34 914 567 800',
          website: 'www.cisco.com/es',
          address: 'Torre Espacio, Paseo de la Castellana 259',
          city: 'Madrid',
          country: 'España',
          taxId: 'ESC11223344',
          category: 'Networking',
          paymentTerms: '60 días',
          currency: 'EUR',
          status: 'active',
          rating: 4.9,
          preferred: true,
          totalOrders: 89,
          totalSpent: 567890.00,
          averageDeliveryTime: 5.8,
          onTimeDeliveryRate: 88.7,
          qualityRating: 4.9,
          lastOrderDate: '2024-08-15',
          createdAt: '2022-03-10',
          products: ['Switches', 'Routers', 'Firewalls', 'Puntos de Acceso'],
          notes: 'Líder en networking empresarial. Productos de alta calidad con certificaciones avanzadas.'
        },
        {
          id: '4',
          name: 'LG Electronics España',
          contactPerson: 'Diego Sánchez Moreno',
          email: 'b2b@lge.es',
          phone: '+34 933 919 770',
          website: 'www.lg.com/es',
          address: 'Zona Franca, Sector A, Calle 3, 32-40',
          city: 'Barcelona',
          country: 'España',
          taxId: 'ESD55667788',
          category: 'Displays',
          paymentTerms: '30 días',
          currency: 'EUR',
          status: 'active',
          rating: 4.4,
          preferred: false,
          totalOrders: 67,
          totalSpent: 234560.00,
          averageDeliveryTime: 6.2,
          onTimeDeliveryRate: 85.1,
          qualityRating: 4.5,
          lastOrderDate: '2024-08-20',
          createdAt: '2023-01-25',
          products: ['Monitores', 'TVs comerciales', 'Señalización digital'],
          notes: 'Buenos monitores para oficina, precios competitivos. Mejorar tiempos de entrega.'
        },
        {
          id: '5',
          name: 'Mikrotik España',
          contactPerson: 'Laura Jiménez Castro',
          email: 'distribucion@mikrotik.es',
          phone: '+34 658 123 456',
          website: 'www.mikrotik.es',
          address: 'Polígono Industrial Las Mercedes, Nave 15',
          city: 'Valencia',
          country: 'España',
          taxId: 'ESE99887766',
          category: 'Networking',
          paymentTerms: '15 días',
          currency: 'EUR',
          status: 'active',
          rating: 4.3,
          preferred: false,
          totalOrders: 45,
          totalSpent: 89340.00,
          averageDeliveryTime: 2.8,
          onTimeDeliveryRate: 96.7,
          qualityRating: 4.2,
          lastOrderDate: '2024-08-27',
          createdAt: '2023-06-12',
          products: ['Routers', 'Switches', 'Antenas', 'Accesorios'],
          notes: 'Productos especializados en networking. Excelente relación calidad-precio y entrega rápida.'
        },
        {
          id: '6',
          name: 'Samsung Electronics Iberia',
          contactPerson: 'Roberto García Vega',
          email: 'b2b.spain@samsung.com',
          phone: '+34 915 213 400',
          website: 'www.samsung.com/es',
          address: 'Calle Torrelaguna, 77',
          city: 'Madrid',
          country: 'España',
          taxId: 'ESF44556677',
          category: 'Hardware',
          paymentTerms: '45 días',
          currency: 'EUR',
          status: 'pending',
          rating: 4.1,
          preferred: false,
          totalOrders: 23,
          totalSpent: 145670.00,
          averageDeliveryTime: 7.5,
          onTimeDeliveryRate: 78.3,
          qualityRating: 4.3,
          lastOrderDate: '2024-07-10',
          createdAt: '2024-02-15',
          products: ['SSD', 'Monitores', 'Smartphones', 'Tablets'],
          notes: 'Nuevo proveedor en evaluación. Buenos productos pero necesita mejorar logística.'
        },
        {
          id: '7',
          name: 'Office Depot España (Inactivo)',
          contactPerson: 'Mónica López Herrera',
          email: 'empresas@officedepot.es',
          phone: '+34 902 505 060',
          website: 'www.officedepot.es',
          address: 'Parque Empresarial Alvento, C/ Dublín, 4',
          city: 'Alcorcón, Madrid',
          country: 'España',
          taxId: 'ESG22334455',
          category: 'Oficina',
          paymentTerms: '30 días',
          currency: 'EUR',
          status: 'inactive',
          rating: 3.8,
          preferred: false,
          totalOrders: 134,
          totalSpent: 67890.00,
          averageDeliveryTime: 4.5,
          onTimeDeliveryRate: 82.1,
          qualityRating: 3.9,
          lastOrderDate: '2024-03-15',
          createdAt: '2021-09-08',
          products: ['Material de oficina', 'Mobiliario', 'Consumibles'],
          notes: 'Proveedor suspendido por problemas de calidad y retrasos continuos en entregas.'
        }
      ];
      
      setSuppliers(mockSuppliers);
      setLoading(false);
    };
    
    loadSuppliers();
  }, []);

  // Get unique categories for filter
  const categories = Array.from(new Set(suppliers.map(s => s.category)));

  // Filter and sort suppliers
  const filteredAndSortedSuppliers = suppliers
    .filter(supplier => {
      const matchesSearch = supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           supplier.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           supplier.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || supplier.category === selectedCategory;
      const matchesStatus = selectedStatus === 'all' || supplier.status === selectedStatus;
      const matchesRating = selectedRating === 'all' || 
                          (selectedRating === '4+' && supplier.rating >= 4) ||
                          (selectedRating === '3+' && supplier.rating >= 3) ||
                          (selectedRating === '2+' && supplier.rating >= 2);
      
      return matchesSearch && matchesCategory && matchesStatus && matchesRating;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'rating':
          aValue = a.rating;
          bValue = b.rating;
          break;
        case 'orders':
          aValue = a.totalOrders;
          bValue = b.totalOrders;
          break;
        case 'spent':
          aValue = a.totalSpent;
          bValue = b.totalSpent;
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

  const togglePreferred = (supplierId: string) => {
    setSuppliers(prev => prev.map(supplier =>
      supplier.id === supplierId 
        ? { ...supplier, preferred: !supplier.preferred }
        : supplier
    ));
  };

  const getStatusColor = (status: Supplier['status']) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50 border-green-200';
      case 'inactive': return 'text-red-600 bg-red-50 border-red-200';
      case 'pending': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'blocked': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusLabel = (status: Supplier['status']) => {
    switch (status) {
      case 'active': return 'Activo';
      case 'inactive': return 'Inactivo';
      case 'pending': return 'Pendiente';
      case 'blocked': return 'Bloqueado';
      default: return 'Desconocido';
    }
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-200'}`}
      />
    ));
  };

  const formatCurrency = (amount: number) => {
    return `€${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  // Calculate statistics
  const activeSuppliers = suppliers.filter(s => s.status === 'active').length;
  const totalSpent = suppliers.reduce((sum, s) => sum + s.totalSpent, 0);
  const averageRating = suppliers.reduce((sum, s) => sum + s.rating, 0) / suppliers.length;
  const preferredSuppliers = suppliers.filter(s => s.preferred).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-mediterranean-50 via-white to-coral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-mediterranean-200 border-t-mediterranean-500 rounded-full animate-spin mx-auto"></div>
            <Truck className="w-6 h-6 text-coral-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="mt-4 text-mediterranean-700 font-medium">Cargando proveedores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-mediterranean-50 via-white to-coral-50">
      {/* Mediterranean Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-mediterranean-600 via-mediterranean-500 to-olive-500 opacity-90"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-20"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white font-playfair mb-2">
                Gestión de Proveedores
              </h1>
              <p className="text-mediterranean-100 text-lg">
                {filteredAndSortedSuppliers.length} proveedores • {activeSuppliers} activos • {averageRating.toFixed(1)}★ rating promedio
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <button className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Evaluación
              </button>
              
              <button className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Nuevo Proveedor
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
              label: 'Proveedores Activos',
              value: activeSuppliers.toString(),
              icon: Truck,
              color: 'mediterranean'
            },
            {
              label: 'Proveedores Preferidos',
              value: preferredSuppliers.toString(),
              icon: Star,
              color: 'yellow'
            },
            {
              label: 'Total Gastado',
              value: `€${(totalSpent / 1000000).toFixed(1)}M`,
              icon: BarChart3,
              color: 'olive'
            },
            {
              label: 'Rating Promedio',
              value: `${averageRating.toFixed(1)}★`,
              icon: BarChart3,
              color: 'terracotta'
            }
          ].map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div
                key={stat.label}
                className={`relative overflow-hidden rounded-2xl p-6 shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-105 ${
                  stat.color === 'mediterranean' ? 'bg-gradient-to-br from-mediterranean-500 to-mediterranean-600' :
                  stat.color === 'yellow' ? 'bg-gradient-to-br from-yellow-500 to-yellow-600' :
                  stat.color === 'olive' ? 'bg-gradient-to-br from-olive-500 to-olive-600' :
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

      {/* Filters and Search */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-mediterranean-400" />
              <input
                type="text"
                placeholder="Buscar proveedores..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-mediterranean-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-mediterranean-500 focus:border-mediterranean-500"
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
                  className="border border-mediterranean-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-mediterranean-500 focus:border-mediterranean-500"
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
                className="border border-mediterranean-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-mediterranean-500 focus:border-mediterranean-500"
              >
                <option value="all">Todos los estados</option>
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
                <option value="pending">Pendiente</option>
                <option value="blocked">Bloqueado</option>
              </select>
              
              {/* Rating Filter */}
              <select
                value={selectedRating}
                onChange={(e) => setSelectedRating(e.target.value)}
                className="border border-mediterranean-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-mediterranean-500 focus:border-mediterranean-500"
              >
                <option value="all">Todos los ratings</option>
                <option value="4+">4+ estrellas</option>
                <option value="3+">3+ estrellas</option>
                <option value="2+">2+ estrellas</option>
              </select>
              
              {/* Sort */}
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field as any);
                  setSortOrder(order as any);
                }}
                className="border border-mediterranean-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-mediterranean-500 focus:border-mediterranean-500"
              >
                <option value="name-asc">Nombre A-Z</option>
                <option value="name-desc">Nombre Z-A</option>
                <option value="rating-desc">Mejor rating</option>
                <option value="orders-desc">Más pedidos</option>
                <option value="spent-desc">Mayor gasto</option>
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

      {/* Suppliers Grid/List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedSuppliers.map((supplier) => (
              <div
                key={supplier.id}
                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                {/* Supplier Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-mediterranean-800 text-lg font-playfair line-clamp-2">
                      {supplier.name}
                    </h3>
                    <p className="text-mediterranean-600 text-sm">
                      {supplier.contactPerson}
                    </p>
                    <p className="text-mediterranean-500 text-sm">
                      {supplier.category}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-2">
                    <button
                      onClick={() => togglePreferred(supplier.id)}
                      className="p-1 hover:bg-mediterranean-50 rounded-full transition-colors"
                    >
                      {supplier.preferred ? (
                        <Star className="w-5 h-5 text-yellow-500" />
                      ) : (
                        <Star className="w-5 h-5 text-mediterranean-400" />
                      )}
                    </button>
                    
                    <button className="p-1 hover:bg-mediterranean-50 rounded-full transition-colors">
                      <MoreVertical className="w-5 h-5 text-mediterranean-400" />
                    </button>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-mediterranean-600">
                    <Mail className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm truncate">{supplier.email}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-mediterranean-600">
                    <Phone className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm">{supplier.phone}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-mediterranean-600">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm">{supplier.city}, {supplier.country}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-mediterranean-600">
                    <Globe className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm">{supplier.website}</span>
                  </div>
                </div>

                {/* Rating and Performance */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-mediterranean-600 text-sm">Rating</span>
                    <div className="flex items-center gap-1">
                      {getRatingStars(supplier.rating)}
                      <span className="text-mediterranean-700 text-sm ml-1">
                        {supplier.rating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-mediterranean-600 text-sm">Pedidos</span>
                    <span className="font-medium text-mediterranean-800">
                      {supplier.totalOrders}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-mediterranean-600 text-sm">Total Gastado</span>
                    <span className="font-bold text-mediterranean-800">
                      {formatCurrency(supplier.totalSpent)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-mediterranean-600 text-sm">Entrega a tiempo</span>
                    <span className="text-mediterranean-700">
                      {supplier.onTimeDeliveryRate.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Status and Payment Terms */}
                <div className="flex items-center justify-between mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(supplier.status)}`}>
                    {getStatusLabel(supplier.status)}
                  </span>
                  
                  <span className="text-sm text-mediterranean-600">
                    {supplier.paymentTerms}
                  </span>
                </div>

                {/* Last Order */}
                <div className="text-xs text-mediterranean-500 mb-4">
                  Último pedido: {formatDate(supplier.lastOrderDate)}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 border-t border-mediterranean-100">
                  <button className="flex-1 bg-gradient-to-r from-mediterranean-500 to-mediterranean-600 text-white py-2 rounded-xl text-sm font-medium hover:shadow-md transition-all duration-200">
                    <Mail className="w-4 h-4 inline mr-1" />
                    Contactar
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
                <thead className="bg-mediterranean-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-mediterranean-600 uppercase tracking-wider">
                      Proveedor
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-mediterranean-600 uppercase tracking-wider">
                      Contacto
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-mediterranean-600 uppercase tracking-wider">
                      Rating
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-mediterranean-600 uppercase tracking-wider">
                      Pedidos
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-mediterranean-600 uppercase tracking-wider">
                      Total Gastado
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-mediterranean-600 uppercase tracking-wider">
                      Entrega
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
                  {filteredAndSortedSuppliers.map((supplier) => (
                    <tr key={supplier.id} className="hover:bg-mediterranean-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-mediterranean-400 to-olive-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {supplier.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-mediterranean-800 flex items-center gap-2">
                              {supplier.name}
                              {supplier.preferred && <Star className="w-4 h-4 text-yellow-500" />}
                            </div>
                            <div className="text-sm text-mediterranean-600">{supplier.category}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-mediterranean-800">{supplier.contactPerson}</div>
                          <div className="text-sm text-mediterranean-600">{supplier.email}</div>
                          <div className="text-sm text-mediterranean-600">{supplier.phone}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          {getRatingStars(supplier.rating)}
                          <span className="text-mediterranean-700 text-sm ml-1">
                            {supplier.rating.toFixed(1)}
                          </span>
                        </div>
                        <div className="text-xs text-mediterranean-500">
                          Calidad: {supplier.qualityRating.toFixed(1)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-mediterranean-800">
                          {supplier.totalOrders}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-mediterranean-800">
                          {formatCurrency(supplier.totalSpent)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-mediterranean-800">
                            {supplier.onTimeDeliveryRate.toFixed(1)}%
                          </div>
                          <div className="text-xs text-mediterranean-600">
                            Promedio: {supplier.averageDeliveryTime.toFixed(1)} días
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(supplier.status)}`}>
                          {getStatusLabel(supplier.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <button className="p-2 text-mediterranean-600 hover:bg-mediterranean-50 rounded-lg transition-colors">
                            <Mail className="w-4 h-4" />
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
        {filteredAndSortedSuppliers.length === 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-12 text-center">
            <Truck className="w-16 h-16 text-mediterranean-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-mediterranean-800 font-playfair mb-2">
              No se encontraron proveedores
            </h3>
            <p className="text-mediterranean-600 mb-6">
              {searchQuery || selectedCategory !== 'all' || selectedStatus !== 'all' || selectedRating !== 'all'
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'Comienza agregando proveedores a tu red'
              }
            </p>
            <button className="bg-gradient-to-r from-mediterranean-500 to-olive-500 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-200">
              <Plus className="w-4 h-4 inline mr-2" />
              Agregar Proveedor
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SuppliersPage() {
  return (
    <ProtectedRoute requiredPermission="erp:suppliers:view">
      <MediterraneanSuppliers />
    </ProtectedRoute>
  );
}