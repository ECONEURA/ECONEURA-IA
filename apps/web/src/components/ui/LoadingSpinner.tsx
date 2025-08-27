interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div 
      className={`${sizeClasses[size]} ${className} animate-spin rounded-full border-2 border-gray-300 border-t-blue-600`}
      role="status" 
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}