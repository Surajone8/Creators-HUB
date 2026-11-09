"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileEdit,
  Calendar,
  HardDrive,
  History,
  BarChart3,
  Settings,
  Sparkles,
} from "lucide-react";
import { YouTubeIcon } from "@/components/ui/icons";
import { MAIN_NAVIGATION } from "@/constants/navigation";
import { cn } from "@/lib/utils/cn";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  FileEdit,
  Calendar,
  HardDrive,
  History,
  BarChart3,
  Youtube: YouTubeIcon,
  Settings,
};

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-zinc-800 bg-zinc-950/90 flex flex-col justify-between p-4 shrink-0 h-screen sticky top-0">
      <div>
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-3 py-4 mb-4">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center text-white shadow-md shadow-red-600/20">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-tight text-zinc-100">Creator Hub</h1>
            <p className="text-[11px] text-zinc-500 font-mono">Phase 1 MVP</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1">
          {MAIN_NAVIGATION.map((item) => {
            const Icon = ICON_MAP[item.iconName] || FileEdit;
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group",
                  isActive
                    ? "bg-zinc-800/90 text-white font-semibold"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 transition-colors",
                    isActive ? "text-red-500" : "text-zinc-500 group-hover:text-zinc-300"
                  )}
                />
                <span className="flex-1">{item.title}</span>
                {item.badge && (
                  <span className="text-[10px] bg-red-950 text-red-300 border border-red-800/50 px-1.5 py-0.5 rounded">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Local AI Badge / Workspace Info */}
      <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-3.5 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-400">Local AI Runtime</span>
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Ollama
          </span>
        </div>
        <p className="text-[11px] text-zinc-500 leading-tight">
          Private metadata generation active. No prompts leave your machine.
        </p>
      </div>
    </aside>
  );
}
