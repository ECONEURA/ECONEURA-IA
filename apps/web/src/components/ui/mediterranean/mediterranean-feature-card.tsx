import { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowRightIcon } from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import { MediterraneanCard } from './mediterranean-card'

interface MediterraneanFeatureCardProps {
  title: string
  description: string
  icon: ReactNode
  href: string
  color?: 'mediterranean' | 'coral' | 'olive' | 'sand'
  gradientFrom?: string
  gradientTo?: string
  className?: string
}

export function MediterraneanFeatureCard({
  title,
  description,
  icon,
  href,
  color = 'mediterranean',
  gradientFrom,
  gradientTo,
  className,
}: MediterraneanFeatureCardProps) {
  const colorClasses = {
    mediterranean: {
      iconBg: 'from-mediterranean-400 to-mediterranean-600',
      cardBg: 'from-mediterranean-50 to-mediterranean-100',
      textHover: 'group-hover:text-mediterranean-700',
      linkHover: 'group-hover:text-coral-500',
    },
    coral: {
      iconBg: 'from-coral-400 to-coral-600',
      cardBg: 'from-coral-50 to-coral-100',
      textHover: 'group-hover:text-coral-700',
      linkHover: 'group-hover:text-terracotta-500',
    },
    olive: {
      iconBg: 'from-olive-400 to-olive-600',
      cardBg: 'from-olive-50 to-olive-100',
      textHover: 'group-hover:text-olive-700',
      linkHover: 'group-hover:text-olive-600',
    },
    sand: {
      iconBg: 'from-sand-400 to-sand-600',
      cardBg: 'from-sand-50 to-sand-100',
      textHover: 'group-hover:text-sand-700',
      linkHover: 'group-hover:text-sand-600',
    },
  }

  const currentColor = colorClasses[color]

  return (
    <Link href={href} className="group">
      <MediterraneanCard 
        variant="default" 
        className={cn('p-8 group', className)}
      >
        <div className={cn(
          'absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity duration-500',
          gradientFrom && gradientTo ? `from-${gradientFrom} to-${gradientTo}` : currentColor.cardBg
        )} />
        
        <div className="relative">
          <div className={cn(
            'inline-flex p-4 rounded-2xl bg-gradient-to-br shadow-lg',
            gradientFrom && gradientTo ? `from-${gradientFrom} to-${gradientTo}` : currentColor.iconBg
          )}>
            <div className="h-8 w-8 text-white">
              {icon}
            </div>
          </div>
          
          <h3 className={cn(
            'mt-6 text-xl font-bold text-mediterranean-900 font-display transition-colors duration-300',
            currentColor.textHover
          )}>
            {title}
          </h3>
          
          <p className="mt-3 text-mediterranean-600 leading-relaxed">
            {description}
          </p>
          
          <div className={cn(
            'mt-6 flex items-center text-mediterranean-500 transition-colors duration-300',
            currentColor.linkHover
          )}>
            <span className="text-sm font-semibold">Explorar</span>
            <ArrowRightIcon className="ml-2 h-4 w-4 transform group-hover:translate-x-1 transition-transform duration-300" />
          </div>
        </div>
      </MediterraneanCard>
    </Link>
  )
}
