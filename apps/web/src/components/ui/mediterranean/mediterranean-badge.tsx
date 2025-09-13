import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface MediterraneanBadgeProps {
  children: ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  color?: 'mediterranean' | 'coral' | 'olive' | 'sand'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function MediterraneanBadge({
  children,
  variant = 'default',
  color = 'mediterranean',
  size = 'md',
  className,
}: MediterraneanBadgeProps) {
  const baseClasses = 'inline-flex items-center font-medium rounded-full'
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  }

  const variantClasses = {
    default: {
      mediterranean: 'bg-mediterranean-100 text-mediterranean-700',
      coral: 'bg-coral-100 text-coral-700',
      olive: 'bg-olive-100 text-olive-700',
      sand: 'bg-sand-100 text-sand-700',
    },
    success: 'bg-success-100 text-success-700',
    warning: 'bg-coral-100 text-coral-700',
    danger: 'bg-danger-100 text-danger-700',
    info: 'bg-mediterranean-100 text-mediterranean-700',
  }

  return (
    <span
      className={cn(
        baseClasses,
        sizeClasses[size],
        variant === 'default' 
          ? variantClasses.default[color]
          : variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
