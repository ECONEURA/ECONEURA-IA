'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface User {
  id: string
  email: string
  name: string
  role: 'cfo' | 'admin' | 'user'
  organizationId: string
  organizationName: string
  permissions: string[]
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  hasPermission: (permission: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for existing session on mount
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token')
        if (token) {
          // For demo purposes, set a mock CFO user
          // In production, validate token with backend
          setUser({
            id: 'cfo-001',
            email: 'cfo@empresa.com',
            name: 'María González',
            role: 'cfo',
            organizationId: 'org-001',
            organizationName: 'Empresa Demo S.L.',
            permissions: [
              'dashboard:view',
              'invoices:view',
              'invoices:manage',
              'flows:view',
              'flows:cancel',
              'ai:use',
              'reports:view'
            ]
          })
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        localStorage.removeItem('auth_token')
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      // For demo purposes, accept any email/password
      // In production, authenticate with backend
      const mockToken = 'demo-jwt-token-' + Date.now()
      localStorage.setItem('auth_token', mockToken)
      
      setUser({
        id: 'cfo-001',
        email,
        name: email.split('@')[0],
        role: 'cfo',
        organizationId: 'org-001',
        organizationName: 'Empresa Demo S.L.',
        permissions: [
          'dashboard:view',
          'invoices:view',
          'invoices:manage',
          'flows:view',
          'flows:cancel',
          'ai:use',
          'reports:view'
        ]
      })
    } catch (error) {
      console.error('Login failed:', error)
      throw new Error('Credenciales inválidas')
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('auth_token')
    setUser(null)
  }

  const hasPermission = (permission: string): boolean => {
    return user?.permissions.includes(permission) ?? false
  }

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      login,
      logout,
      hasPermission
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}