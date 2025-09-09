import { ReactNode, ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface MediterraneanButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'gradient'
  color?: 'mediterranean' | 'coral' | 'olive' | 'sand'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  icon?: ReactNode
  iconPosition?: 'left' | 'right'
  fullWidth?: boolean
  asChild?: boolean
}

export const MediterraneanButton = forwardRef<HTMLButtonElement, MediterraneanButtonProps>(({
  children,
  variant = 'primary',
  color = 'mediterranean',
  size = 'md',
  icon,
  iconPosition = 'right',
  fullWidth = false,
  className,
  disabled,
  asChild = false,
  ...props
}, ref) => {
  const baseClasses = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
    xl: 'px-10 py-5 text-xl',
  }

  const variantClasses = {
    primary: {
      mediterranean: 'bg-gradient-to-r from-mediterranean-500 to-mediterranean-600 hover:from-mediterranean-600 hover:to-mediterranean-700 text-white shadow-mediterranean hover:shadow-lg focus:ring-mediterranean-500',
      coral: 'bg-gradient-to-r from-coral-500 to-coral-600 hover:from-coral-600 hover:to-coral-700 text-white shadow-coral hover:shadow-lg focus:ring-coral-500',
      olive: 'bg-gradient-to-r from-olive-500 to-olive-600 hover:from-olive-600 hover:to-olive-700 text-white shadow-soft hover:shadow-lg focus:ring-olive-500',
      sand: 'bg-gradient-to-r from-sand-500 to-sand-600 hover:from-sand-600 hover:to-sand-700 text-white shadow-soft hover:shadow-lg focus:ring-sand-500',
    },
    secondary: {
      mediterranean: 'bg-mediterranean-100 hover:bg-mediterranean-200 text-mediterranean-700 focus:ring-mediterranean-500',
      coral: 'bg-coral-100 hover:bg-coral-200 text-coral-700 focus:ring-coral-500',
      olive: 'bg-olive-100 hover:bg-olive-200 text-olive-700 focus:ring-olive-500',
      sand: 'bg-sand-100 hover:bg-sand-200 text-sand-700 focus:ring-sand-500',
    },
    outline: {
      mediterranean: 'border-2 border-mediterranean-200 text-mediterranean-700 hover:bg-mediterranean-50 focus:ring-mediterranean-500',
      coral: 'border-2 border-coral-200 text-coral-700 hover:bg-coral-50 focus:ring-coral-500',
      olive: 'border-2 border-olive-200 text-olive-700 hover:bg-olive-50 focus:ring-olive-500',
      sand: 'border-2 border-sand-200 text-sand-700 hover:bg-sand-50 focus:ring-sand-500',
    },
    ghost: {
      mediterranean: 'text-mediterranean-700 hover:bg-mediterranean-50 focus:ring-mediterranean-500',
      coral: 'text-coral-700 hover:bg-coral-50 focus:ring-coral-500',
      olive: 'text-olive-700 hover:bg-olive-50 focus:ring-olive-500',
      sand: 'text-sand-700 hover:bg-sand-50 focus:ring-sand-500',
    },
    gradient: {
      mediterranean: 'bg-gradient-to-r from-mediterranean-400 via-coral-400 to-terracotta-400 hover:from-mediterranean-500 hover:via-coral-500 hover:to-terracotta-500 text-white shadow-warm hover:shadow-2xl focus:ring-mediterranean-500',
      coral: 'bg-gradient-to-r from-coral-400 to-terracotta-400 hover:from-coral-500 hover:to-terracotta-500 text-white shadow-coral hover:shadow-lg focus:ring-coral-500',
      olive: 'bg-gradient-to-r from-olive-400 to-olive-600 hover:from-olive-500 hover:to-olive-700 text-white shadow-soft hover:shadow-lg focus:ring-olive-500',
      sand: 'bg-gradient-to-r from-sand-400 to-sand-600 hover:from-sand-500 hover:to-sand-700 text-white shadow-soft hover:shadow-lg focus:ring-sand-500',
    },
  }

  const hoverClasses = !disabled ? 'transform hover:scale-105' : ''

  const buttonContent = (
    <>
      {icon && iconPosition === 'left' && (
        <span className="mr-2">{icon}</span>
      )}
      {children}
      {icon && iconPosition === 'right' && (
        <span className="ml-2">{icon}</span>
      )}
    </>
  )

  if (asChild) {
    return (;
      <span
        ref={ref}
        className={cn(
          baseClasses,
          sizeClasses[size],
          variantClasses[variant][color],
          hoverClasses,
          fullWidth && 'w-full',
          className
        )}
      >
        {buttonContent}
      </span>
    )
  }

  return (;
    <button
      ref={ref}
      className={cn(
        baseClasses,
        sizeClasses[size],
        variantClasses[variant][color],
        hoverClasses,
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled}
      {...props}
    >
      {buttonContent}
    </button>
  )
})

MediterraneanButton.displayName = 'MediterraneanButton'
