import { cn } from "@/lib/utils/cn";

export interface StatusIndicatorProps {
  status: "online" | "offline" | "busy" | "warning";
  label?: string;
  className?: string;
}

export function StatusIndicator({ status, label, className }: StatusIndicatorProps) {
  const dotStyles = {
    online: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]",
    offline: "bg-zinc-500",
    busy: "bg-amber-500 animate-pulse",
    warning: "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]",
  };

  return (
    <div className={cn("inline-flex items-center gap-2 text-xs text-zinc-300", className)}>
      <span className={cn("h-2 w-2 rounded-full", dotStyles[status])} />
      {label && <span>{label}</span>}
    </div>
  );
}
