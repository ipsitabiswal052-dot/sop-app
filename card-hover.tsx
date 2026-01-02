import * as React from "react"
import { cn } from "@/lib/utils"

const CardHover = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-xl border bg-card text-card-foreground shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5",
      className
    )}
    {...props}
  />
))
CardHover.displayName = "CardHover"

export { CardHover }
