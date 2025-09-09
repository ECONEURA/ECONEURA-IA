import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { MediterraneanCard } from './mediterranean-card'
import { MediterraneanBadge } from './mediterranean-badge'

interface MediterraneanStatsCardProps {
  title: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  icon?: ReactNode
  color?: 'mediterranean' | 'coral' | 'olive' | 'sand'
  className?: string
}

export function MediterraneanStatsCard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon,
  color = 'mediterranean',
  className,
}: MediterraneanStatsCardProps) {
  const changeColor = {
    positive: 'success',
    negative: 'danger',
    neutral: 'sand',
  }[changeType]

  return (;
    <MediterraneanCard
      variant="gradient"
      color={color}
      className={cn('p-6', className)}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-mediterranean-600 truncate">
            {title}
          </p>
          <p className="text-2xl font-bold text-mediterranean-900 font-display">
            {value}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {change && (
            <MediterraneanBadge
              variant={changeColor as any}
              size="sm"
            >
              {change}
            </MediterraneanBadge>
          )}

          {icon && (
            <div className={cn(
              'p-2 rounded-xl',
              color === 'mediterranean' && 'bg-mediterranean-100',
              color === 'coral' && 'bg-coral-100',
              color === 'olive' && 'bg-olive-100',
              color === 'sand' && 'bg-sand-100',
            )}>
              <div className={cn(
                'h-5 w-5',
                color === 'mediterranean' && 'text-mediterranean-600',
                color === 'coral' && 'text-coral-600',
                color === 'olive' && 'text-olive-600',
                color === 'sand' && 'text-sand-600',
              )}>
                {icon}
              </div>
            </div>
          )}
        </div>
      </div>
    </MediterraneanCard>
  )
}
