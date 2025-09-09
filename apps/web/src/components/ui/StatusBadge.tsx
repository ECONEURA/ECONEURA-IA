interface StatusBadgeProps {
  status: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  children: React.ReactNode;
  size?: 'sm' | 'md';
  className?: string;
}

export default function StatusBadge({
  status,
  children,
  size = 'md',
  className = ''
}: StatusBadgeProps) {
  const baseClasses = 'status-badge';

  const statusClasses = {
    success: 'status-success',
    warning: 'status-warning',
    danger: 'status-danger',
    info: 'status-info',
    neutral: 'bg-gray-50 text-gray-600',
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-sm',
  };

  return (;
    <span
      className={`${baseClasses} ${statusClasses[status]} ${sizeClasses[size]} ${className}`}
    >
      {children}
    </span>
  );
}
