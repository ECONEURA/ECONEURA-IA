import React from 'react'

interface KpiProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  trend?: {
    value: number
    direction: 'up' | 'down' | 'neutral'
    label?: string
  }
  className?: string
}

export function Kpi({ title, value, subtitle, icon, trend, className = '' }: KpiProps) {
  const trendColor = trend?.direction === 'up' ? 'text-success-600' : trend?.direction === 'down' ? 'text-danger-600' : 'text-gray-500'
  return (
    <div className={`card ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {icon && <div className="text-gray-400">{icon}</div>}
            <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
            {trend && (
              <div className={`flex items-center gap-1 text-sm ${trendColor}`}>
                <span>{trend.value}%</span>
              </div>
            )}
          </div>
          {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
          {trend?.label && <p className="text-xs text-gray-500 mt-1">{trend.label}</p>}
        </div>
      </div>
    </div>
  )
}

export default Kpi

