'use client'
import React from 'react'

export function ProtectedRoute({ children, requiredPermission }: { children: React.ReactNode; requiredPermission?: string }) {
  // Placeholder: en producción aquí validarías permisos / sesión.
  return <>{children}</>
}

export default ProtectedRoute
