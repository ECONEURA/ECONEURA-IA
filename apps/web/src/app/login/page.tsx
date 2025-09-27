'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { LoginButton } from '@/components/auth/LoginButton';
import { useAuth } from '@/lib/useAuth';

export default function LoginPage() {
  const { isAuthenticated, inProgress } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  if (inProgress === 'startup') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-600">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            ECONEURA IA
          </h2>
          <p className="text-gray-600 mb-8">
            Plataforma de CRM+ERP impulsada por IA
          </p>
        </div>

        <div className="bg-white shadow-lg rounded-lg p-8">
          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Iniciar Sesión
            </h3>
            <p className="text-gray-600 text-sm">
              Usa tu cuenta de Microsoft para acceder
            </p>
          </div>

          <div className="flex justify-center">
            <LoginButton />
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Al iniciar sesión, aceptas nuestros términos de servicio y política de privacidad.
            </p>
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            ¿Necesitas ayuda?{' '}
            <a href="mailto:support@econeura.com" className="text-blue-600 hover:text-blue-500">
              Contacta al soporte
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}