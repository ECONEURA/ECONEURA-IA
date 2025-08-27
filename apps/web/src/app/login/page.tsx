'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { login, user } = useAuth()
  const router = useRouter()

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push('/dashboard')
    }
  }, [user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      toast.error('Por favor, complete todos los campos')
      return
    }

    setIsLoading(true)
    try {
      await login(email, password)
      toast.success('Bienvenido a EcoNeura')
      router.push('/dashboard')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error de inicio de sesión')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-2xl">EN</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Acceder a EcoNeura
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            CFO Cockpit - Sistema de Gestión Inteligente
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Correo electrónico
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="usuario@empresa.com"
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Contraseña
                </label>
                <div className="mt-1 relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Iniciando sesión...
                  </div>
                ) : (
                  'Iniciar Sesión'
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Demo credentials info */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-2">🚀 Modo Demo</p>
            <p className="mb-1">Puede usar cualquier email y contraseña para acceder.</p>
            <p className="text-xs text-blue-600">
              Ejemplo: <code>cfo@empresa.com</code> / <code>demo123</code>
            </p>
          </div>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            © 2024 EcoNeura. Sistema empresarial privado.
          </p>
        </div>
      </div>
    </div>
  )
}