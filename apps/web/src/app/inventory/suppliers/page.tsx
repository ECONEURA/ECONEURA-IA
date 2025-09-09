'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api-client';
import {
  Building2,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Star,
  Mail,
  Phone,
  Globe,
  MapPin,
  Euro,
  TrendingUp
} from 'lucide-react';

interface Supplier {
  id: string;
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  website: string;
  address: {
    street?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  tax_id: string;
  payment_terms: string;
  credit_limit: number;
  currency: string;
  is_active: boolean;
  rating: number;
  notes: string;
  metadata: any;
  created_at: string;
  updated_at: string;
}

interface SuppliersResponse {
  data: Supplier[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export default function SuppliersPage(): void {
  const { user } = useAuth();
  const api = apiClient;
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    offset: 0,
    hasMore: false
  });

  useEffect(() => {
    loadSuppliers();
  }, [pagination.offset, searchTerm]);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: pagination.limit.toString(),
        offset: pagination.offset.toString(),
        ...(searchTerm && { search: searchTerm })
      });

      const data: SuppliersResponse = await api.request({ url: `/suppliers?${params.toString()}`, method: 'GET' });
      const list = (data as any).data ?? (data as any);
      setSuppliers(list);
      setPagination(prev => ({
        ...prev,
        total: (data as any).pagination?.total ?? prev.total,
        hasMore: (data as any).pagination?.hasMore ?? prev.hasMore
      }));
    } catch (error) {
      console.error('Error loading suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => `€${amount.toLocaleString()}`;
  const formatAddress = (address: any) => {
    if (!address) return 'No address';
    const parts = [address.street, address.city, address.state, address.postal_code, address.country];
    return parts.filter(Boolean).join(', ');
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  if (loading && suppliers.length === 0) {
    return (;
      <div className="min-h-screen bg-gradient-to-br from-sand-50 via-white to-mediterranean-50 flex items-center justify-center">
        <div className="text-center">
          <Building2 className="w-8 h-8 text-mediterranean-600 animate-pulse mx-auto mb-4" />
          <p className="text-mediterranean-600">Cargando proveedores...</p>
        </div>
      </div>
    );
  }

  return (;
    <div className="min-h-screen bg-gradient-to-br from-sand-50 via-white to-mediterranean-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-sand-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-mediterranean-900 font-playfair">
                Proveedores
              </h1>
              <p className="text-mediterranean-600 mt-1">
                Gestiona tus proveedores y relaciones comerciales
              </p>
            </div>
            <button className="flex items-center px-4 py-2 bg-mediterranean-600 text-white rounded-lg hover:bg-mediterranean-700 transition-colors duration-200">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Proveedor
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
                  placeholder="Buscar proveedores..."
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
        </div>

        {/* Suppliers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {suppliers.map((supplier) => (
            <div key={supplier.id} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
              {/* Supplier Header */}
              <div className="p-6 border-b border-sand-100">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-mediterranean-900 text-lg mb-1">
                      {supplier.name}
                    </h3>
                    {supplier.contact_person && (
                      <p className="text-sand-600 text-sm">
                        Contacto: {supplier.contact_person}
                      </p>
                    )}
                  </div>
                  <div className="relative">
                    <button className="p-1 hover:bg-sand-100 rounded">
                      <MoreVertical className="w-4 h-4 text-sand-600" />
                    </button>
                  </div>
                </div>

                {/* Rating */}
                {supplier.rating && (
                  <div className="flex items-center mb-3">
                    <div className="flex mr-2">
                      {getRatingStars(supplier.rating)}
                    </div>
                    <span className="text-sm text-sand-600">
                      {supplier.rating}/5
                    </span>
                  </div>
                )}

                {/* Status */}
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  supplier.is_active
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {supplier.is_active ? 'Activo' : 'Inactivo'}
                </div>
              </div>

              {/* Contact Information */}
              <div className="p-6 space-y-3">
                {supplier.email && (
                  <div className="flex items-center text-sm text-sand-600">
                    <Mail className="w-4 h-4 mr-2 text-mediterranean-500" />
                    <a href={`mailto:${supplier.email}`} className="hover:text-mediterranean-600">
                      {supplier.email}
                    </a>
                  </div>
                )}

                {supplier.phone && (
                  <div className="flex items-center text-sm text-sand-600">
                    <Phone className="w-4 h-4 mr-2 text-mediterranean-500" />
                    <a href={`tel:${supplier.phone}`} className="hover:text-mediterranean-600">
                      {supplier.phone}
                    </a>
                  </div>
                )}

                {supplier.website && (
                  <div className="flex items-center text-sm text-sand-600">
                    <Globe className="w-4 h-4 mr-2 text-mediterranean-500" />
                    <a
                      href={supplier.website.startsWith('http') ? supplier.website : `https://${supplier.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-mediterranean-600"
                    >
                      {supplier.website}
                    </a>
                  </div>
                )}

                <div className="flex items-start text-sm text-sand-600">
                  <MapPin className="w-4 h-4 mr-2 text-mediterranean-500 mt-0.5" />
                  <span className="line-clamp-2">
                    {formatAddress(supplier.address)}
                  </span>
                </div>
              </div>

              {/* Financial Information */}
              <div className="px-6 pb-4 space-y-2">
                {supplier.credit_limit && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-sand-600">Límite de crédito:</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(supplier.credit_limit)}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm">
                  <span className="text-sand-600">Condiciones de pago:</span>
                  <span className="font-medium text-mediterranean-600">
                    {supplier.payment_terms}
                  </span>
                </div>

                {supplier.tax_id && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-sand-600">NIF/CIF:</span>
                    <span className="font-medium text-sand-700">
                      {supplier.tax_id}
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="px-6 py-4 border-t border-sand-200 flex items-center justify-between">
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
          ))}
        </div>

        {/* Pagination */}
        {pagination.total > 0 && (
          <div className="mt-8 flex items-center justify-between">
            <p className="text-sand-600">
              Mostrando {pagination.offset + 1} - {Math.min(pagination.offset + pagination.limit, pagination.total)} de {pagination.total} proveedores
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
        {!loading && suppliers.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="w-16 h-16 text-sand-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-sand-600 mb-2">No hay proveedores</h3>
            <p className="text-sand-500 mb-6">
              {searchTerm
                ? 'No se encontraron proveedores con los filtros aplicados.'
                : 'Comienza agregando tu primer proveedor.'
              }
            </p>
            <button className="flex items-center px-4 py-2 bg-mediterranean-600 text-white rounded-lg hover:bg-mediterranean-700 transition-colors duration-200 mx-auto">
              <Plus className="w-4 h-4 mr-2" />
              Agregar Proveedor
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
