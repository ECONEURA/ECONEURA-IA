'use client';

import { useState } from 'react';
import { 
  Users, 
  Building2, 
  Handshake,
  Plus,
  Search,
  BarChart3,
  Mail,
  Phone,
  Calendar
} from 'lucide-react';
import { ProtectedRoute } from '../../components/auth/ProtectedRoute';

interface CRMStats {
  totalContacts: number;
  totalCompanies: number;
  activeDeals: number;
  monthlyRevenue: number;
}

function MediterraneanCRM() {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'contacts' | 'companies' | 'deals'>('overview');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock CRM statistics
  const crmStats: CRMStats = {
    totalContacts: 1247,
    totalCompanies: 342,
    activeDeals: 89,
    monthlyRevenue: 847650
  };

  const recentActivities = [
    {
      id: 1,
      type: 'contact',
      title: 'Nuevo contacto agregado',
      description: 'María García - Directora de Compras en Mediterráneo Tech',
      time: 'Hace 15 minutos',
      icon: UsersIcon,
      color: 'coral'
    },
    {
      id: 2,
      type: 'deal',
      title: 'Oportunidad actualizada',
      description: 'Proyecto ERP - Fase de negociación (€85,000)',
      time: 'Hace 1 hora',
      icon: HandshakeIcon,
      color: 'mediterranean'
    },
    {
      id: 3,
      type: 'company',
      title: 'Empresa actualizada',
      description: 'Costa del Sol Solutions - Información de contacto',
      time: 'Hace 2 horas',
      icon: BuildingOfficeIcon,
      color: 'olive'
    }
  ];

  const quickActions = [
    {
      title: 'Añadir Contacto',
      description: 'Crear un nuevo contacto en el CRM',
      icon: UsersIcon,
      color: 'coral',
      href: '/crm/contacts/new'
    },
    {
      title: 'Nueva Empresa',
      description: 'Registrar una nueva empresa',
      icon: BuildingOfficeIcon,
      color: 'olive', 
      href: '/crm/companies/new'
    },
    {
      title: 'Crear Oportunidad',
      description: 'Iniciar una nueva oportunidad de venta',
      icon: HandshakeIcon,
      color: 'mediterranean',
      href: '/crm/deals/new'
    },
    {
      title: 'Programar Reunión',
      description: 'Agendar cita con cliente',
      icon: CalendarIcon,
      color: 'terracotta',
      href: '/crm/meetings/new'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-mediterranean-50 via-white to-coral-50">
      {/* Mediterranean Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-coral-600 via-coral-500 to-mediterranean-500 opacity-90"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23ffffff\" fill-opacity=\"0.1\"%3E%3Ccircle cx=\"30\" cy=\"30\" r=\"4\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white font-playfair mb-2">
                CRM Mediterráneo
              </h1>
              <p className="text-coral-100 text-lg">
                Gestión inteligente de relaciones con clientes
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Search Bar */}
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60" />
                <input
                  type="text"
                  placeholder="Buscar contactos, empresas..."
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
              { id: 'contacts', label: 'Contactos', icon: UsersIcon },
              { id: 'companies', label: 'Empresas', icon: BuildingOfficeIcon },
              { id: 'deals', label: 'Oportunidades', icon: HandshakeIcon }
            ].map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                    selectedTab === tab.id
                      ? 'bg-gradient-to-r from-coral-500 to-mediterranean-500 text-white shadow-md'
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  label: 'Total Contactos',
                  value: crmStats.totalContacts.toLocaleString(),
                  icon: UsersIcon,
                  color: 'coral',
                  change: '+12%'
                },
                {
                  label: 'Empresas Activas',
                  value: crmStats.totalCompanies.toLocaleString(),
                  icon: BuildingOfficeIcon,
                  color: 'olive',
                  change: '+8%'
                },
                {
                  label: 'Oportunidades',
                  value: crmStats.activeDeals.toLocaleString(),
                  icon: HandshakeIcon,
                  color: 'mediterranean',
                  change: '+15%'
                },
                {
                  label: 'Ingresos Proyectados',
                  value: `€${(crmStats.monthlyRevenue / 1000).toFixed(0)}K`,
                  icon: ChartBarIcon,
                  color: 'terracotta',
                  change: '+24%'
                }
              ].map((stat, index) => {
                const IconComponent = stat.icon;
                return (
                  <div
                    key={stat.label}
                    className={`relative overflow-hidden rounded-2xl p-6 shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-xl ${
                      stat.color === 'coral' ? 'bg-gradient-to-br from-coral-500 to-coral-600' :
                      stat.color === 'olive' ? 'bg-gradient-to-br from-olive-500 to-olive-600' :
                      stat.color === 'mediterranean' ? 'bg-gradient-to-br from-mediterranean-500 to-mediterranean-600' :
                      'bg-gradient-to-br from-terracotta-500 to-terracotta-600'
                    }`}
                  >
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full"></div>
                    
                    <div className="relative">
                      <div className="flex items-center justify-between mb-4">
                        <IconComponent className="w-8 h-8 text-white" />
                        <span className="text-green-200 text-sm font-medium">{stat.change}</span>
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Quick Actions */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-mediterranean-800 font-playfair mb-6">
                  Acciones Rápidas
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  {recentActivities.map((activity) => {
                    const IconComponent = activity.icon;
                    return (
                      <div key={activity.id} className="flex items-start gap-4 p-3 rounded-xl hover:bg-mediterranean-50 transition-colors duration-200">
                        <div className={`p-2 rounded-full ${
                          activity.color === 'coral' ? 'bg-coral-100' :
                          activity.color === 'mediterranean' ? 'bg-mediterranean-100' :
                          'bg-olive-100'
                        }`}>
                          <IconComponent className={`w-4 h-4 ${
                            activity.color === 'coral' ? 'text-coral-600' :
                            activity.color === 'mediterranean' ? 'text-mediterranean-600' :
                            'text-olive-600'
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
            </div>
          </div>
        )}

        {/* Placeholder for other tabs */}
        {selectedTab !== 'overview' && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 text-center">
            <div className="text-mediterranean-600 mb-4">
              <ChartBarIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-bold text-mediterranean-800 font-playfair mb-2">
                {selectedTab === 'contacts' && 'Gestión de Contactos'}
                {selectedTab === 'companies' && 'Gestión de Empresas'}  
                {selectedTab === 'deals' && 'Gestión de Oportunidades'}
              </h3>
              <p className="text-mediterranean-600">
                Esta sección está en desarrollo. Próximamente disponible con diseño mediterráneo completo.
              </p>
            </div>
            
            <button className="bg-gradient-to-r from-coral-500 to-mediterranean-500 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-200">
              Explorar Funcionalidades
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CRMPage() {
  return (
    <ProtectedRoute requiredPermission="crm:view">
      <MediterraneanCRM />
    </ProtectedRoute>
  );
}