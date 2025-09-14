import * as React from "react"
import { cn } from "@/lib/utils"

interface TabsContextValue {
  value: string
  setValue: (v: string) => void
}

const TabsContext = React.createContext<TabsContextValue | null>(null)

export function Tabs({ value: controlled, defaultValue, onValueChange, className, children }: {
  value?: string
  defaultValue?: string
  onValueChange?: (v: string) => void
  className?: string
  children: React.ReactNode
}) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultValue || "")
  const value = controlled ?? uncontrolled
  const setValue = (v: string) => {
    if (controlled === undefined) setUncontrolled(v)
    onValueChange?.(v)
  }
  return (
    <TabsContext.Provider value={{ value, setValue }}>
      <div className={cn(className)}>{children}</div>
    </TabsContext.Provider>
  )
}

export function TabsList({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("inline-flex items-center gap-2", className)}>{children}</div>
}

export function TabsTrigger({ value, children }: { value: string; children: React.ReactNode }) {
  const ctx = React.useContext(TabsContext)
  if (!ctx) return null
  const active = ctx.value === value
  return (
    <button
      className={cn(
        "px-3 py-1.5 rounded-md text-sm",
        active ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
      )}
      onClick={() => ctx.setValue(value)}
    >
      {children}
    </button>
  )
}

export function TabsContent({ value, className, children }: { value: string; className?: string; children: React.ReactNode }) {
  const ctx = React.useContext(TabsContext)
  if (!ctx) return null
  if (ctx.value !== value) return null
  return <div className={cn(className)}>{children}</div>
}
