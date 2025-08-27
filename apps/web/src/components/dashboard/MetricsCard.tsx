import { ReactNode } from 'react';

interface MetricsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    label: string;
    direction: 'up' | 'down' | 'neutral';
  };
  icon?: ReactNode;
  className?: string;
}

export default function MetricsCard({
  title,
  value,
  subtitle,
  trend,
  icon,
  className = '',
}: MetricsCardProps) {
  const trendIcon = trend ? (
    trend.direction === 'up' ? (
      <svg className="w-3 h-3 text-success-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L10 4.414 4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
      </svg>
    ) : trend.direction === 'down' ? (
      <svg className="w-3 h-3 text-danger-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L10 15.586l5.293-5.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
    ) : (
      <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
      </svg>
    )
  ) : null;

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
              <div className={`flex items-center gap-1 text-sm ${
                trend.direction === 'up' 
                  ? 'text-success-600' 
                  : trend.direction === 'down' 
                  ? 'text-danger-600' 
                  : 'text-gray-500'
              }`}>
                {trendIcon}
                <span>{trend.value}%</span>
              </div>
            )}
          </div>
          
          {subtitle && (
            <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
          )}
          
          {trend && (
            <p className="text-xs text-gray-500 mt-1">{trend.label}</p>
          )}
        </div>
      </div>
    </div>
  );
}