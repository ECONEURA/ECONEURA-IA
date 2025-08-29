import React from 'react'
import { formatDateTime } from '@/lib/utils'

interface FeedItemProps {
  avatar?: React.ReactNode
  title: string
  description?: string
  timestamp?: string | Date
  right?: React.ReactNode
  className?: string
}

export function FeedItem({ avatar, title, description, timestamp, right, className = '' }: FeedItemProps) {
  return (
    <div className={`flex items-start gap-3 py-3 ${className}`}>
      {avatar && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
          {avatar}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-gray-900 truncate">{title}</p>
          {right}
        </div>
        {description && <p className="mt-1 text-sm text-gray-600">{description}</p>}
        {timestamp && (
          <p className="mt-1 text-xs text-gray-500">{formatDateTime(timestamp)}</p>
        )}
      </div>
    </div>
  )
}

export default FeedItem

