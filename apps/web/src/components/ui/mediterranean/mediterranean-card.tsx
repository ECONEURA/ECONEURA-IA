import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface MediterraneanCardProps {
  children: ReactNode
  className?: string
  variant?: 'default' | 'elevated' | 'outlined' | 'gradient'
  color?: 'mediterranean' | 'coral' | 'olive' | 'sand'
  hover?: boolean
}

export function MediterraneanCard({
  children,
  className,
  variant = 'default',
  color = 'mediterranean',
  hover = true,
}: MediterraneanCardProps) {
  const baseClasses = 'rounded-2xl transition-all duration-300'
  
  const variantClasses = {
    default: 'bg-white border border-sand-200/50 shadow-soft',
    elevated: 'bg-white border border-sand-200/50 shadow-mediterranean',
    outlined: 'bg-transparent border-2 border-mediterranean-200',
    gradient: 'bg-gradient-to-br from-white to-sand-50/50 border border-sand-200/50 shadow-soft',
  }

  const colorClasses = {
    mediterranean: 'hover:shadow-mediterranean',
    coral: 'hover:shadow-coral',
    olive: 'hover:shadow-soft',
    sand: 'hover:shadow-soft',
  }

  const hoverClasses = hover 
    ? 'transform hover:scale-[1.02] cursor-pointer' 
    : ''

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        colorClasses[color],
        hoverClasses,
        className
      )}
    >
      {children}
    </div>
  )
}
