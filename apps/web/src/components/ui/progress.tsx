import * as React from "react"
import { cn } from "@/lib/utils"

export function Progress({ value = 0, className }: { value?: number; className?: string }): void {
  const clamped = Math.min(100, Math.max(0, value))
  return (;
    <div className={cn("w-full h-2 bg-gray-200 rounded", className)}>
      <div className="h-2 bg-blue-600 rounded" style={{ width: `${clamped}%` }} />
    </div>
  )
}


