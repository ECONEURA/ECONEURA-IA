'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  Plus,
  Search,
  Mail,
  Phone,
  MapPin,
  MoreVertical,
  Pencil,
  Trash2,
  Star,
  CheckCircle,
  XCircle,
  Filter
} from 'lucide-react';
import { ProtectedRoute } from '../../../components/auth/ProtectedRoute';

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  position: string;
  location: string;
  status: 'active' | 'inactive' | 'prospect';
  favorite: boolean;
  avatar?: string;
  lastContact: string;
  dealValue: number;
}

function MediterraneanContacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'inactive' | 'prospect'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);

  // Mock contacts data
  useEffect(() => {
    const loadContacts = async () => {
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockContacts: Contact[] = [
        {
          id: '1',
          name: 'María García López',
          email: 'maria.garcia@mediterranetech.com',
          phone: '+34 654 321 987',
          company: 'Mediterráneo Tech Solutions',
          position: 'Directora de Compras',
          location: 'Valencia, España',
          status: 'active',
          favorite: true,
          lastContact: '2024-08-25',
          dealValue: 85000
        },
        {
          id: '2',
          name: 'Carlos Ruiz Mendoza',
          email: 'carlos@costadelsolbiz.es',
          phone: '+34 612 345 678',
          company: 'Costa del Sol Business',
          position: 'CEO',
          location: 'Málaga, España',
          status: 'prospect',
          favorite: false,
          lastContact: '2024-08-20',
          dealValue: 125000
        },
        {
          id: '3',
          name: 'Ana Martínez Silva',
          email: 'ana.martinez@barcelonainnova.com',
          phone: '+34 698 765 432',
          company: 'Barcelona Innova',
          position: 'Gerente de Proyectos',
          location: 'Barcelona, España',
          status: 'active',
          favorite: true,
          lastContact: '2024-08-28',
          dealValue: 65000
        },
        {
          id: '4',
          name: 'Diego Fernández Castro',
          email: 'diego@sevillasistemas.es',
          phone: '+34 677 889 123',
          company: 'Sevilla Sistemas Integrados',
          position: 'Director Técnico',
          location: 'Sevilla, España',
          status: 'inactive',
          favorite: false,
          lastContact: '2024-07-15',
          dealValue: 45000
        },
        {
          id: '5',
          name: 'Laura Jiménez Moreno',
          email: 'laura.jimenez@bilbaodigital.com',
          phone: '+34 634 567 890',
          company: 'Bilbao Digital Solutions',
          position: 'Responsable de Adquisiciones',
          location: 'Bilbao, España',
          status: 'prospect',
          favorite: false,
          lastContact: '2024-08-22',
          dealValue: 95000
        },
        {
          id: '6',
          name: 'Roberto Sánchez Vega',
          email: 'roberto@madridcorp.es',
          phone: '+34 645 123 789',
          company: 'Madrid Corporate Systems',
          position: 'CTO',
          location: 'Madrid, España',
          status: 'active',
          favorite: true,
          lastContact: '2024-08-27',
          dealValue: 180000
        }
      ];
      
      setContacts(mockContacts);
      setLoading(false);
    };
    
    loadContacts();
  }, []);

  // Filter contacts based on search and status
  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         contact.company.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || contact.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  const toggleFavorite = (contactId: string) => {
    setContacts(prev => prev.map(contact =>
      contact.id === contactId 
        ? { ...contact, favorite: !contact.favorite }
        : contact
    ));
  };

  const getStatusColor = (status: Contact['status']) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50';
      case 'inactive': return 'text-red-600 bg-red-50';
      case 'prospect': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusLabel = (status: Contact['status']) => {
    switch (status) {
      case 'active': return 'Activo';
      case 'inactive': return 'Inactivo';
      case 'prospect': return 'Prospecto';
      default: return 'Desconocido';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-mediterranean-50 via-white to-coral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-mediterranean-200 border-t-mediterranean-500 rounded-full animate-spin mx-auto"></div>
            <Users className="w-6 h-6 text-coral-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="mt-4 text-mediterranean-700 font-medium">Cargando contactos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-mediterranean-50 via-white to-coral-50">
      {/* Mediterranean Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-coral-600 via-coral-500 to-mediterranean-500 opacity-90"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-20"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white font-playfair mb-2">
                Gestión de Contactos
              </h1>
              <p className="text-coral-100 text-lg">
                {filteredContacts.length} contactos encontrados
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <button className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Nuevo Contacto
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-mediterranean-400" />
              <input
                type="text"
                placeholder="Buscar contactos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-mediterranean-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-coral-500 focus:border-coral-500"
              />
            </div>
            
            {/* Filters */}
            <div className="flex items-center gap-4">
              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-mediterranean-600" />
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as any)}
                  className="border border-mediterranean-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-coral-500 focus:border-coral-500"
                >
                  <option value="all">Todos los estados</option>
                  <option value="active">Activos</option>
                  <option value="prospect">Prospectos</option>
                  <option value="inactive">Inactivos</option>
                </select>
              </div>
              
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

      {/* Contacts Grid/List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredContacts.map((contact) => (
              <div
                key={contact.id}
                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                {/* Contact Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-coral-400 to-mediterranean-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {contact.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </div>
                    <div>
                      <h3 className="font-bold text-mediterranean-800 font-playfair">
                        {contact.name}
                      </h3>
                      <p className="text-mediterranean-600 text-sm">
                        {contact.position}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleFavorite(contact.id)}
                      className="p-1 hover:bg-mediterranean-50 rounded-full transition-colors"
                    >
                      {contact.favorite ? (
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

                {/* Contact Details */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-mediterranean-600">
                    <Mail className="w-4 h-4" />
                    <span className="text-sm truncate">{contact.email}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-mediterranean-600">
                    <Phone className="w-4 h-4" />
                    <span className="text-sm">{contact.phone}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-mediterranean-600">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">{contact.location}</span>
                  </div>
                </div>

                {/* Status and Actions */}
                <div className="flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(contact.status)}`}>
                    {getStatusLabel(contact.status)}
                  </span>
                  
                  <div className="text-right">
                    <div className="text-lg font-bold text-mediterranean-800">
                      €{(contact.dealValue / 1000).toFixed(0)}K
                    </div>
                    <div className="text-xs text-mediterranean-600">
                      Valor potencial
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-4 pt-4 border-t border-mediterranean-100">
                  <button className="flex-1 bg-gradient-to-r from-coral-500 to-coral-600 text-white py-2 rounded-xl text-sm font-medium hover:shadow-md transition-all duration-200">
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
                      Contacto
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-mediterranean-600 uppercase tracking-wider">
                      Empresa
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-mediterranean-600 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-mediterranean-600 uppercase tracking-wider">
                      Valor Potencial
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-mediterranean-600 uppercase tracking-wider">
                      Último Contacto
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-mediterranean-600 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-mediterranean-100">
                  {filteredContacts.map((contact) => (
                    <tr key={contact.id} className="hover:bg-mediterranean-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-coral-400 to-mediterranean-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {contact.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                          </div>
                          <div>
                            <div className="font-medium text-mediterranean-800 flex items-center gap-2">
                              {contact.name}
                              {contact.favorite && <Star className="w-4 h-4 text-yellow-500" />}
                            </div>
                            <div className="text-sm text-mediterranean-600">{contact.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-mediterranean-800">{contact.company}</div>
                          <div className="text-sm text-mediterranean-600">{contact.position}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(contact.status)}`}>
                          {getStatusLabel(contact.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-mediterranean-800">
                          €{contact.dealValue.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-mediterranean-600">
                        {new Date(contact.lastContact).toLocaleDateString('es-ES')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <button className="p-2 text-coral-600 hover:bg-coral-50 rounded-lg transition-colors">
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
        {filteredContacts.length === 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-12 text-center">
            <Users className="w-16 h-16 text-mediterranean-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-mediterranean-800 font-playfair mb-2">
              No se encontraron contactos
            </h3>
            <p className="text-mediterranean-600 mb-6">
              {searchQuery || selectedStatus !== 'all' 
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'Comienza agregando tu primer contacto'
              }
            </p>
            <button className="bg-gradient-to-r from-coral-500 to-mediterranean-500 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-200">
              <Plus className="w-4 h-4 inline mr-2" />
              Agregar Contacto
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ContactsPage() {
  return (
    <ProtectedRoute requiredPermission="crm:contacts:view">
      <MediterraneanContacts />
    </ProtectedRoute>
  );
}