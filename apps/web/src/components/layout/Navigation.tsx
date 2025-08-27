'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { cn } from '@/lib/utils'
import {
  ChartBarIcon,
  DocumentTextIcon,
  CogIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  BellIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline'
import {
  ChartBarIcon as ChartBarIconSolid,
  DocumentTextIcon as DocumentTextIconSolid,
} from '@heroicons/react/24/solid'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: ChartBarIcon,
    iconSolid: ChartBarIconSolid,
    permission: 'dashboard:view'
  },
  {
    name: 'Facturas',
    href: '/invoices',
    icon: DocumentTextIcon,
    iconSolid: DocumentTextIconSolid,
    permission: 'invoices:view'
  },
  {
    name: 'Flujos Activos',
    href: '/flows',
    icon: ChartBarIcon,
    iconSolid: ChartBarIconSolid,
    permission: 'flows:view'
  },
  {
    name: 'Reportes',
    href: '/reports',
    icon: DocumentTextIcon,
    iconSolid: DocumentTextIconSolid,
    permission: 'reports:view'
  },
]

export function Navigation() {
  const { user, logout, hasPermission } = useAuth()
  const pathname = usePathname()
  const [showUserMenu, setShowUserMenu] = useState(false)

  if (!user) {
    return null
  }

  const filteredNavigation = navigation.filter(item => 
    hasPermission(item.permission)
  )

  return (
    <nav className="fixed inset-y-0 left-0 w-64 bg-slate-900 border-r border-slate-800">
      <div className="flex flex-col h-full">
        <div className="flex items-center px-6 py-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">EN</span>
            </div>
            <div>
              <h1 className="text-white font-semibold text-lg">EcoNeura</h1>
              <p className="text-slate-400 text-xs">CFO Cockpit</p>
            </div>
          </div>
        </div>

        <div className="flex-1 px-4 py-6 space-y-2">
          {filteredNavigation.map((item) => {
            const isActive = pathname === item.href
            const Icon = isActive ? item.iconSolid : item.icon
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200',
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                )}
              >
                <Icon
                  className={cn(
                    'mr-3 h-5 w-5 flex-shrink-0',
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                  )}
                />
                {item.name}
              </Link>
            )
          })}
        </div>

        <div className="border-t border-slate-800 p-4">
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-full flex items-center px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-colors duration-200"
            >
              <UserCircleIcon className="mr-3 h-8 w-8" />
              <div className="flex-1 text-left">
                <p className="font-medium">{user.name}</p>
                <p className="text-xs text-slate-400">{user.organizationName}</p>
              </div>
              <ChevronDownIcon
                className={cn(
                  'ml-2 h-4 w-4 transition-transform duration-200',
                  showUserMenu && 'rotate-180'
                )}
              />
            </button>

            {showUserMenu && (
              <div className="absolute bottom-full mb-2 left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-sm font-medium text-slate-900">{user.name}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      {user.role.toUpperCase()}
                    </span>
                  </p>
                </div>
                
                <Link
                  href="/settings"
                  className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  onClick={() => setShowUserMenu(false)}
                >
                  <CogIcon className="mr-3 h-4 w-4" />
                  Configuración
                </Link>
                
                <Link
                  href="/notifications"
                  className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  onClick={() => setShowUserMenu(false)}
                >
                  <BellIcon className="mr-3 h-4 w-4" />
                  Notificaciones
                </Link>
                
                <hr className="my-1" />
                
                <button
                  onClick={() => {
                    setShowUserMenu(false)
                    logout()
                  }}
                  className="w-full flex items-center px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                >
                  <ArrowRightOnRectangleIcon className="mr-3 h-4 w-4" />
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