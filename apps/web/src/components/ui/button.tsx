import * as React from "react"
type VariantProps<T> = T extends { variants: infer V } ? { [K in keyof V]?: keyof V[K] } : never
import { cn } from "@/lib/utils"

const buttonVariants = {
  variants: {
    variant: {
      default: "bg-blue-600 text-white hover:bg-blue-700 border-transparent",
      outline: "bg-transparent border-gray-300 hover:bg-gray-100",
      secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300 border-transparent",
      destructive: "bg-red-600 text-white hover:bg-red-700 border-transparent",
      ghost: "hover:bg-gray-100 border-transparent",
      link: "underline-offset-4 hover:underline text-blue-600 border-transparent",
    },
    size: {
      default: "h-10 px-4 py-2",
      sm: "h-9 rounded-md px-3",
      lg: "h-11 rounded-md px-8",
      icon: "h-10 w-10",
    },
  },
  defaultVariants: { variant: "default" as const, size: "default" as const },
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border",
          buttonVariants.variants.variant[variant || buttonVariants.defaultVariants.variant],
          buttonVariants.variants.size[size || buttonVariants.defaultVariants.size],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }


