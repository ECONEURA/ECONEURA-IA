import * as React from "react"
type VariantProps<T> = T extends { variants: infer V } ? { [K in keyof V]?: keyof V[K] } : never
import { cn } from "@/lib/utils"

const badgeVariants = {
  variants: {
    variant: {
      default: "border-transparent bg-blue-600 text-white hover:bg-blue-700",
      secondary: "border-transparent bg-gray-200 text-gray-900 hover:bg-gray-300",
      destructive: "border-transparent bg-red-600 text-white hover:bg-red-700",
      outline: "text-gray-900 border border-gray-300",
    },
  },
  defaultVariants: {
    variant: "default" as const,
  },
}

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps): void {
  const classes = [
    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
    badgeVariants.variants.variant[variant || badgeVariants.defaultVariants.variant],
    className,
  ]
    .filter(Boolean)
    .join(" ")
  return <div className={classes} {...props} />
}

export { Badge, badgeVariants }

