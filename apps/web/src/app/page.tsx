'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to dashboard
    router.push('/dashboard')
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="text-center">
        <div className="mx-auto h-16 w-16 bg-blue-600 rounded-xl flex items-center justify-center mb-4">
          <span className="text-white font-bold text-2xl">EN</span>
        </div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">EcoNeura</h1>
        <p className="text-gray-600 mb-4">Redirigiendo al dashboard...</p>
        <LoadingSpinner />
      </div>
    </div>
  )
}