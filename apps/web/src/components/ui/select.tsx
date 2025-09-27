import * as React from "react"

import { cn } from "@/lib/utils"

export function Select({ value, onValueChange, children }: { value?: string; onValueChange?: (v: string) => void; children: React.ReactNode }) {
  return <div data-select-value={value}>{children}</div>
}

export function SelectTrigger({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("border rounded-md px-3 py-2", className)}>{children}</div>
}

export function SelectValue() {
  return <span className="text-sm text-muted-foreground">Select…</span>
}

export function SelectContent({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("mt-2 rounded-md border bg-background p-1", className)}>{children}</div>
}

export function SelectItem({ value, children, onSelect }: { value: string; children: React.ReactNode; onSelect?: (v: string) => void }) {
  return (
    <div
      className="cursor-pointer rounded px-2 py-1 hover:bg-accent"
      onClick={() => onSelect?.(value)}
      data-value={value}
    >
      {children}
    </div>
  )
}
