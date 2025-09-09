'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { cn } from '@/lib/utils'
import {
  BarChart3,
  FileText,
  Settings,
  LogOut,
  User,
  Bell,
  ChevronDown,
  Cpu,
  Beaker,
  Users,
  Building2,
  ShoppingCart,
  ClipboardList,
  Calculator,
  PieChart,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: BarChart3,
    permission: 'dashboard:view',
    category: 'main'
  },
  {
    name: 'CRM',
    href: '/crm',
    icon: Users,
    permission: 'crm:view',
    category: 'crm',
    children: [
      { name: 'Contactos', href: '/crm/contacts', permission: 'crm:contacts:view' },
      { name: 'Empresas', href: '/crm/companies', permission: 'crm:companies:view' },
      { name: 'Oportunidades', href: '/crm/deals', permission: 'crm:deals:view' },
      { name: 'Actividades', href: '/crm/activities', permission: 'crm:activities:view' },
    ]
  },
  {
    name: 'ERP',
    href: '/erp',
    icon: Building2,
    permission: 'erp:view',
    category: 'erp',
    children: [
      { name: 'Clientes', href: '/erp/customers', permission: 'erp:customers:view' },
      { name: 'Proveedores', href: '/erp/suppliers', permission: 'erp:suppliers:view' },
      { name: 'Productos', href: '/erp/products', permission: 'erp:products:view' },
      { name: 'Facturas', href: '/erp/invoices', permission: 'erp:invoices:view' },
    ]
  },
  {
    name: 'Finanzas',
    href: '/finance',
    icon: Calculator,
    permission: 'finance:view',
    category: 'finance',
    children: [
      { name: 'Panel CFO', href: '/finance/cfo', permission: 'finance:cfo:view' },
      { name: 'Contabilidad', href: '/finance/accounting', permission: 'finance:accounting:view' },
      { name: 'Reportes', href: '/finance/reports', permission: 'finance:reports:view' },
    ]
  },
  {
    name: 'AI Suite',
    href: '/ai',
    icon: Cpu,
    permission: 'ai:view',
    category: 'ai',
    children: [
      { name: 'AI Router', href: '/ai/router', permission: 'ai:router:view' },
      { name: 'Playground', href: '/ai/playground', permission: 'ai:playground:view' },
      { name: 'Flujos', href: '/ai/flows', permission: 'ai:flows:view' },
    ]
  },
  {
    name: 'Analytics',
    href: '/analytics',
    icon: PieChart,
    permission: 'analytics:view',
    category: 'analytics'
  },
]

export function Navigation(): void {
  const { user, logout, hasPermission } = useAuth()
  const pathname = usePathname()
  const [showUserMenu, setShowUserMenu] = useState(false)

  if (!user) {
    return null;
  }

  const filteredNavigation = navigation.filter(item =>
    hasPermission(item.permission)
  )

  return (;
    <nav className="fixed inset-y-0 left-0 w-64 bg-gradient-to-b from-mediterranean-900 via-mediterranean-800 to-mediterranean-900 border-r border-mediterranean-700/50 backdrop-blur-xl shadow-2xl">
      <div className="flex flex-col h-full">
        <div className="flex items-center px-6 py-6 border-b border-mediterranean-700/30">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-coral-400 to-coral-600 rounded-xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-200">
              <span className="text-white font-bold text-lg font-display">EN</span>
            </div>
            <div>
              <h1 className="text-white font-bold text-xl font-display tracking-wide">EcoNeura</h1>
              <p className="text-mediterranean-300 text-sm font-medium">Mediterranean Suite</p>
            </div>
          </div>
        </div>

        <div className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {filteredNavigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            const Icon = item.icon

            return (;
              <div key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    'group flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02]',
                    isActive
                      ? 'bg-gradient-to-r from-coral-500/20 to-terracotta-500/20 text-white border-l-4 border-coral-400 shadow-mediterranean backdrop-blur-sm'
                      : 'text-mediterranean-200 hover:bg-mediterranean-700/30 hover:text-white hover:shadow-soft'
                  )}
                >
                  <Icon
                    className={cn(
                      'mr-3 h-5 w-5 flex-shrink-0 transition-colors duration-200',
                      isActive ? 'text-coral-300' : 'text-mediterranean-400 group-hover:text-coral-300'
                    )}
                  />
                  <span className="truncate">{item.name}</span>
                  {isActive && (
                    <div className="ml-auto w-2 h-2 bg-coral-400 rounded-full animate-pulse" />
                  )}
                </Link>

                {/* Sub-navigation for items with children */}
                {item.children && (isActive || pathname.startsWith(item.href + '/')) && (
                  <div className="ml-4 mt-2 space-y-1 animate-slide-down">
                    {item.children.map((child) => {
                      const isChildActive = pathname === child.href
                      return (;
                        <Link
                          key={child.name}
                          href={child.href}
                          className={cn(
                            'flex items-center px-3 py-2 text-xs font-medium rounded-lg transition-all duration-200',
                            isChildActive
                              ? 'bg-coral-500/10 text-coral-200 border-l-2 border-coral-400'
                              : 'text-mediterranean-300 hover:bg-mediterranean-700/20 hover:text-coral-200'
                          )}
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-current mr-2 opacity-60" />
                          {child.name}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="border-t border-mediterranean-700/30 p-4 bg-gradient-to-r from-mediterranean-800/50 to-mediterranean-700/30 backdrop-blur-sm">
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-full flex items-center px-4 py-3 text-sm text-mediterranean-200 hover:bg-mediterranean-700/40 hover:text-white rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-soft group"
            >
              <div className="relative mr-3">
                <User className="h-10 w-10 text-mediterranean-300 group-hover:text-coral-300 transition-colors duration-200" />
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-olive-400 border-2 border-mediterranean-800 rounded-full animate-pulse" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-white">{user.displayName}</p>
                <p className="text-xs text-mediterranean-300">ECONEURA</p>
              </div>
              <ChevronDown
                className={cn(
                  'ml-2 h-4 w-4 transition-all duration-300 text-mediterranean-400 group-hover:text-coral-300',
                  showUserMenu && 'rotate-180'
                )}
              />
            </button>

            {showUserMenu && (
              <div className="absolute bottom-full mb-2 left-0 right-0 bg-white/95 backdrop-blur-xl border border-sand-200 rounded-2xl shadow-2xl py-2 z-50 animate-slide-up">
                <div className="px-4 py-3 border-b border-sand-200/50">
                  <p className="text-sm font-semibold text-mediterranean-900">{user.displayName}</p>
                  <p className="text-xs text-mediterranean-600">{user.email}</p>
                  <p className="text-xs mt-1.5">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-coral-100 to-terracotta-100 text-coral-700 border border-coral-200">
                      {user.status.toUpperCase()}
                    </span>
                  </p>
                </div>

                <Link
                  href="/settings"
                  className="flex items-center px-4 py-3 text-sm text-mediterranean-700 hover:bg-sand-50/50 transition-colors duration-200 group"
                  onClick={() => setShowUserMenu(false)}
                >
                  <Settings className="mr-3 h-4 w-4 text-mediterranean-500 group-hover:text-coral-500 transition-colors duration-200" />
                  Configuración
                </Link>

                <Link
                  href="/notifications"
                  className="flex items-center px-4 py-3 text-sm text-mediterranean-700 hover:bg-sand-50/50 transition-colors duration-200 group"
                  onClick={() => setShowUserMenu(false)}
                >
                  <Bell className="mr-3 h-4 w-4 text-mediterranean-500 group-hover:text-coral-500 transition-colors duration-200" />
                  Notificaciones
                </Link>

                <hr className="my-1 border-sand-200/50" />

                <button
                  onClick={() => {
                    setShowUserMenu(false)
                    logout()
                  }}
                  className="w-full flex items-center px-4 py-3 text-sm text-danger-700 hover:bg-danger-50/50 transition-colors duration-200 group"
                >
                  <LogOut className="mr-3 h-4 w-4 text-danger-500 group-hover:text-danger-600 transition-colors duration-200" />
                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
