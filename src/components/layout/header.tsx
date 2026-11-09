"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Plus, UserCircle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SystemStatusBar } from "./system-status-bar";
import { supabase } from "@/lib/supabase/client";
import { signOutAction } from "@/app/actions/auth";

export function Header() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setUserEmail(data.user.email ?? null);
        setDisplayName(
          data.user.user_metadata?.display_name || data.user.email?.split("@")[0] || "Creator"
        );
      }
    }
    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUserEmail(session.user.email ?? null);
        setDisplayName(
          session.user.user_metadata?.display_name || session.user.email?.split("@")[0] || "Creator"
        );
      } else {
        setUserEmail(null);
        setDisplayName(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <header className="h-16 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <SystemStatusBar />
      </div>

      <div className="flex items-center gap-3">
        <Link href="/studio">
          <Button size="sm" className="gap-1.5 shadow-sm">
            <Plus className="h-4 w-4" />
            New Post
          </Button>
        </Link>

        <button className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors">
          <Bell className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3 pl-3 border-l border-zinc-800">
          <div className="flex items-center gap-2">
            <UserCircle className="h-6 w-6 text-zinc-400" />
            <div className="text-left hidden sm:block">
              <span className="text-xs font-semibold text-zinc-200 block leading-tight">
                {displayName || "Creator"}
              </span>
              <span className="text-[10px] text-zinc-500 block leading-tight">
                {userEmail || "Workspace Active"}
              </span>
            </div>
          </div>

          <form action={signOutAction}>
            <button
              type="submit"
              title="Sign Out"
              className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
