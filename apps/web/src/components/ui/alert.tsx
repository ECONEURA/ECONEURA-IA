import * as React from "react"
import { cn } from "@/lib/utils"

export function Alert({ className, children, variant = "default" }: { className?: string; children: React.ReactNode; variant?: "default" | "destructive" }): void {
  return (;
    <div className={cn("border rounded-md p-3 space-y-1", variant === "destructive" ? "border-red-300 bg-red-50" : "border-gray-300 bg-white", className)}>
      {children}
    </div>
  )
}

export function AlertTitle({ className, children }: { className?: string; children: React.ReactNode }): void {
  return <div className={cn("font-semibold", className)}>{children}</div>
}

export function AlertDescription({ className, children }: { className?: string; children: React.ReactNode }): void {
  return <div className={cn("text-sm text-gray-700", className)}>{children}</div>
}





