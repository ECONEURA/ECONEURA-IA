import React from 'react'

interface ChipProps {
  children: React.ReactNode
  color?: 'neutral' | 'success' | 'warning' | 'danger' | 'info'
  size?: 'sm' | 'md'
  className?: string
}

export function Chip({ children, color = 'neutral', size = 'md', className = '' }: ChipProps) {
  const colorClasses: Record<NonNullable<ChipProps['color']>, string> = {
    neutral: 'bg-gray-100 text-gray-700',
    success: 'bg-success-100 text-success-700',
    warning: 'bg-amber-100 text-amber-700',
    danger: 'bg-danger-100 text-danger-700',
    info: 'bg-mediterranean-100 text-mediterranean-700',
  }
  const sizeClasses: Record<NonNullable<ChipProps['size']>, string> = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-sm',
  }
  return (
    <span className={`inline-flex items-center rounded-full ${colorClasses[color]} ${sizeClasses[size]} ${className}`}>
      {children}
    </span>
  )
}

export default Chip

