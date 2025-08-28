'use client';

import { useState, useEffect } from 'react';
import { 
  BuildingOfficeIcon, 
  PlusIcon,
  MagnifyingGlassIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  StarIcon,
  UsersIcon,
  BanknotesIcon,
  ChartBarIcon,
  GlobeAltIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { ProtectedRoute } from '../../../components/auth/ProtectedRoute';

interface Company {
  id: string;
  name: string;
  email: string;
  phone: string;
  website: string;
  industry: string;
  size: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  location: string;
  status: 'active' | 'inactive' | 'prospect';
  favorite: boolean;
  logo?: string;
  founded: number;
  employees: number;
  revenue: number;
  lastContact: string;
  dealsCount: number;
  totalValue: number;
}

function MediterraneanCompanies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all');
  const [selectedSize, setSelectedSize] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Mock companies data
  useEffect(() => {
    const loadCompanies = async () => {
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      const mockCompanies: Company[] = [
        {
          id: '1',
          name: 'Mediterráneo Tech Solutions',
          email: 'info@mediterranetech.com',
          phone: '+34 965 123 456',
          website: 'www.mediterranetech.com',
          industry: 'Tecnología',
          size: 'medium',
          location: 'Valencia, España',
          status: 'active',
          favorite: true,
          founded: 2018,
          employees: 125,
          revenue: 8500000,
          lastContact: '2024-08-25',
          dealsCount: 3,
          totalValue: 285000
        },
        {
          id: '2',
          name: 'Costa del Sol Business Group',
          email: 'contacto@costadelsolbiz.es',
          phone: '+34 952 789 123',
          website: 'www.costadelsolbiz.es',
          industry: 'Consultoría',
          size: 'large',
          location: 'Málaga, España',
          status: 'prospect',
          favorite: false,
          founded: 2015,
          employees: 280,
          revenue: 15200000,
          lastContact: '2024-08-20',
          dealsCount: 2,
          totalValue: 450000
        },
        {
          id: '3',
          name: 'Barcelona Innovation Hub',
          email: 'hello@barcelonainnova.com',
          phone: '+34 933 456 789',
          website: 'www.barcelonainnova.com',
          industry: 'I+D+i',
          size: 'startup',
          location: 'Barcelona, España',
          status: 'active',
          favorite: true,
          founded: 2022,
          employees: 35,
          revenue: 1200000,
          lastContact: '2024-08-28',
          dealsCount: 1,
          totalValue: 85000
        },
        {
          id: '4',
          name: 'Sevilla Sistemas Integrados S.L.',
          email: 'comercial@sevillasistemas.es',
          phone: '+34 954 321 654',
          website: 'www.sevillasistemas.es',
          industry: 'Software',
          size: 'small',
          location: 'Sevilla, España',
          status: 'inactive',
          favorite: false,
          founded: 2010,
          employees: 85,
          revenue: 3500000,
          lastContact: '2024-07-15',
          dealsCount: 1,
          totalValue: 65000
        },
        {
          id: '5',
          name: 'Bilbao Digital Solutions',
          email: 'info@bilbaodigital.com',
          phone: '+34 944 567 890',
          website: 'www.bilbaodigital.com',
          industry: 'Marketing Digital',
          size: 'medium',
          location: 'Bilbao, España',
          status: 'prospect',
          favorite: false,
          founded: 2019,
          employees: 95,
          revenue: 4800000,
          lastContact: '2024-08-22',
          dealsCount: 2,
          totalValue: 175000
        },
        {
          id: '6',
          name: 'Madrid Corporate Systems',
          email: 'ventas@madridcorp.es',
          phone: '+34 914 789 012',
          website: 'www.madridcorp.es',
          industry: 'Fintech',
          size: 'enterprise',
          location: 'Madrid, España',
          status: 'active',
          favorite: true,
          founded: 2012,
          employees: 450,
          revenue: 28000000,
          lastContact: '2024-08-27',
          dealsCount: 4,
          totalValue: 750000
        }
      ];
      
      setCompanies(mockCompanies);
      setLoading(false);
    };
    
    loadCompanies();
  }, []);

  // Get unique industries for filter
  const industries = Array.from(new Set(companies.map(c => c.industry)));

  // Filter companies based on search and filters
  const filteredCompanies = companies.filter(company => {
    const matchesSearch = company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         company.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         company.industry.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesIndustry = selectedIndustry === 'all' || company.industry === selectedIndustry;
    const matchesSize = selectedSize === 'all' || company.size === selectedSize;
    
    return matchesSearch && matchesIndustry && matchesSize;
  });

  const toggleFavorite = (companyId: string) => {
    setCompanies(prev => prev.map(company =>
      company.id === companyId 
        ? { ...company, favorite: !company.favorite }
        : company
    ));
  };

  const getStatusColor = (status: Company['status']) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50 border-green-200';
      case 'inactive': return 'text-red-600 bg-red-50 border-red-200';
      case 'prospect': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusLabel = (status: Company['status']) => {
    switch (status) {
      case 'active': return 'Cliente Activo';
      case 'inactive': return 'Inactivo';
      case 'prospect': return 'Prospecto';
      default: return 'Desconocido';
    }
  };

  const getSizeColor = (size: Company['size']) => {
    switch (size) {
      case 'startup': return 'text-purple-600 bg-purple-50';
      case 'small': return 'text-blue-600 bg-blue-50';
      case 'medium': return 'text-green-600 bg-green-50';
      case 'large': return 'text-orange-600 bg-orange-50';
      case 'enterprise': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getSizeLabel = (size: Company['size']) => {
    switch (size) {
      case 'startup': return 'Startup';
      case 'small': return 'Pequeña';
      case 'medium': return 'Mediana';
      case 'large': return 'Grande';
      case 'enterprise': return 'Corporativa';
      default: return 'No definido';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-mediterranean-50 via-white to-coral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-mediterranean-200 border-t-mediterranean-500 rounded-full animate-spin mx-auto"></div>
            <BuildingOfficeIcon className="w-6 h-6 text-coral-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="mt-4 text-mediterranean-700 font-medium">Cargando empresas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-mediterranean-50 via-white to-coral-50">
      {/* Mediterranean Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-olive-600 via-olive-500 to-mediterranean-500 opacity-90"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23ffffff\" fill-opacity=\"0.1\"%3E%3Ccircle cx=\"30\" cy=\"30\" r=\"4\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white font-playfair mb-2">
                Gestión de Empresas
              </h1>
              <p className="text-olive-100 text-lg">
                {filteredCompanies.length} empresas en tu cartera comercial
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <button className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center gap-2">
                <PlusIcon className="w-4 h-4" />
                Nueva Empresa
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-mediterranean-400" />
              <input
                type="text"
                placeholder="Buscar empresas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-mediterranean-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-olive-500 focus:border-olive-500"
              />
            </div>
            
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4">
              {/* Industry Filter */}
              <div className="flex items-center gap-2">
                <FunnelIcon className="w-5 h-5 text-mediterranean-600" />
                <select
                  value={selectedIndustry}
                  onChange={(e) => setSelectedIndustry(e.target.value)}
                  className="border border-mediterranean-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-olive-500 focus:border-olive-500"
                >
                  <option value="all">Todas las industrias</option>
                  {industries.map(industry => (
                    <option key={industry} value={industry}>{industry}</option>
                  ))}
                </select>
              </div>
              
              {/* Size Filter */}
              <select
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value)}
                className="border border-mediterranean-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-olive-500 focus:border-olive-500"
              >
                <option value="all">Todos los tamaños</option>
                <option value="startup">Startup</option>
                <option value="small">Pequeña</option>
                <option value="medium">Mediana</option>
                <option value="large">Grande</option>
                <option value="enterprise">Corporativa</option>
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

      {/* Companies Grid/List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCompanies.map((company) => (
              <div
                key={company.id}
                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                {/* Company Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-olive-400 to-mediterranean-500 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                      {company.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-mediterranean-800 font-playfair truncate">
                        {company.name}
                      </h3>
                      <p className="text-mediterranean-600 text-sm truncate">
                        {company.industry}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => toggleFavorite(company.id)}
                      className="p-1 hover:bg-mediterranean-50 rounded-full transition-colors"
                    >
                      {company.favorite ? (
                        <StarSolidIcon className="w-5 h-5 text-yellow-500" />
                      ) : (
                        <StarIcon className="w-5 h-5 text-mediterranean-400" />
                      )}
                    </button>
                    
                    <button className="p-1 hover:bg-mediterranean-50 rounded-full transition-colors">
                      <EllipsisVerticalIcon className="w-5 h-5 text-mediterranean-400" />
                    </button>
                  </div>
                </div>

                {/* Company Details */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-mediterranean-600">
                    <GlobeAltIcon className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm truncate">{company.website}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-mediterranean-600">
                    <MapPinIcon className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm">{company.location}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-mediterranean-600">
                    <UsersIcon className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm">{company.employees} empleados</span>
                  </div>
                </div>

                {/* Status and Size Badges */}
                <div className="flex items-center gap-2 mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(company.status)}`}>
                    {getStatusLabel(company.status)}
                  </span>
                  
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getSizeColor(company.size)}`}>
                    {getSizeLabel(company.size)}
                  </span>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-mediterranean-50 rounded-xl">
                  <div className="text-center">
                    <div className="text-lg font-bold text-mediterranean-800">
                      {company.dealsCount}
                    </div>
                    <div className="text-xs text-mediterranean-600">
                      Oportunidades
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-lg font-bold text-mediterranean-800">
                      €{(company.totalValue / 1000).toFixed(0)}K
                    </div>
                    <div className="text-xs text-mediterranean-600">
                      Valor Total
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 border-t border-mediterranean-100">
                  <button className="flex-1 bg-gradient-to-r from-olive-500 to-olive-600 text-white py-2 rounded-xl text-sm font-medium hover:shadow-md transition-all duration-200">
                    <EnvelopeIcon className="w-4 h-4 inline mr-1" />
                    Contactar
                  </button>
                  <button className="px-3 py-2 border border-mediterranean-200 text-mediterranean-600 rounded-xl hover:bg-mediterranean-50 transition-colors">
                    <PencilIcon className="w-4 h-4" />
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
                <thead className="bg-olive-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-mediterranean-600 uppercase tracking-wider">
                      Empresa
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-mediterranean-600 uppercase tracking-wider">
                      Industria
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-mediterranean-600 uppercase tracking-wider">
                      Tamaño
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-mediterranean-600 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-mediterranean-600 uppercase tracking-wider">
                      Oportunidades
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-mediterranean-600 uppercase tracking-wider">
                      Valor Total
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-mediterranean-600 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-mediterranean-100">
                  {filteredCompanies.map((company) => (
                    <tr key={company.id} className="hover:bg-mediterranean-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-olive-400 to-mediterranean-500 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                            {company.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-mediterranean-800 flex items-center gap-2">
                              {company.name}
                              {company.favorite && <StarSolidIcon className="w-4 h-4 text-yellow-500" />}
                            </div>
                            <div className="text-sm text-mediterranean-600 truncate">{company.website}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-mediterranean-800">{company.industry}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getSizeColor(company.size)}`}>
                          {getSizeLabel(company.size)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(company.status)}`}>
                          {getStatusLabel(company.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-mediterranean-800">
                          {company.dealsCount}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-mediterranean-800">
                          €{company.totalValue.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <button className="p-2 text-olive-600 hover:bg-olive-50 rounded-lg transition-colors">
                            <EnvelopeIcon className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-mediterranean-600 hover:bg-mediterranean-50 rounded-lg transition-colors">
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <TrashIcon className="w-4 h-4" />
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
        {filteredCompanies.length === 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-12 text-center">
            <BuildingOfficeIcon className="w-16 h-16 text-mediterranean-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-mediterranean-800 font-playfair mb-2">
              No se encontraron empresas
            </h3>
            <p className="text-mediterranean-600 mb-6">
              {searchQuery || selectedIndustry !== 'all' || selectedSize !== 'all'
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'Comienza agregando tu primera empresa'
              }
            </p>
            <button className="bg-gradient-to-r from-olive-500 to-mediterranean-500 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-200">
              <PlusIcon className="w-4 h-4 inline mr-2" />
              Agregar Empresa
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CompaniesPage() {
  return (
    <ProtectedRoute requiredPermission="crm:companies:view">
      <MediterraneanCompanies />
    </ProtectedRoute>
  );
}