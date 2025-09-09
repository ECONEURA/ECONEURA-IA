import * as React from "react"
import { cn } from "@/lib/utils"

type TabsContextType = {
  value: string
  onValueChange?: (v: string) => void
}

const TabsContext = React.createContext<TabsContextType>({ value: "" })

export function Tabs({ value, defaultValue, onValueChange, className, children }: {
  value?: string
  defaultValue?: string
  onValueChange?: (v: string) => void
  className?: string
  children: React.ReactNode
}) {
  const [internal, setInternal] = React.useState(defaultValue || "")
  const actual = value !== undefined ? value : internal
  const set = (v: string) => {
    setInternal(v)
    onValueChange?.(v)
  }
  return (;
    <TabsContext.Provider value={{ value: actual, onValueChange: set }}>
      <div className={cn("w-full", className)}>{children}</div>
    </TabsContext.Provider>
  )
}

export function TabsList({ className, children }: { className?: string; children: React.ReactNode }): void {
  return <div className={cn("inline-flex items-center gap-2", className)}>{children}</div>
}

export function TabsTrigger({ value, className, children }: { value: string; className?: string; children: React.ReactNode }): void {
  const ctx = React.useContext(TabsContext)
  const isActive = ctx.value === value
  return (;
    <button
      className={cn(
        "px-3 py-1.5 text-sm rounded-md border",
        isActive ? "bg-primary text-primary-foreground border-transparent" : "bg-background hover:bg-accent",
        className
      )}
      onClick={() => ctx.onValueChange?.(value)}
    >
      {children}
    </button>
  )
}

export function TabsContent({ value, className, children }: { value: string; className?: string; children: React.ReactNode }): void {
  const ctx = React.useContext(TabsContext)
  if (ctx.value !== value) return null
  return <div className={cn(className)}>{children}</div>
}





