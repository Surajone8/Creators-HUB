import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "info" | "outline";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variantStyles = {
    default: "bg-zinc-800 text-zinc-300 border border-zinc-700",
    success: "bg-emerald-950/70 text-emerald-300 border border-emerald-800/60",
    warning: "bg-amber-950/70 text-amber-300 border border-amber-800/60",
    danger: "bg-rose-950/70 text-rose-300 border border-rose-800/60",
    info: "bg-blue-950/70 text-blue-300 border border-blue-800/60",
    outline: "text-zinc-400 border border-zinc-700 bg-transparent",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium tracking-wide",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}
