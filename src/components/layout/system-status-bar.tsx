"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HardDrive, Cpu } from "lucide-react";
import { YouTubeIcon } from "@/components/ui/icons";
import { StatusIndicator } from "@/components/ui/status-indicator";

export function SystemStatusBar() {
  const [ollamaOnline, setOllamaOnline] = useState<boolean | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [driveOnline, setDriveOnline] = useState<boolean | null>(null);
  const [ytOnline, setYtOnline] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkOllama() {
      try {
        const res = await fetch("/api/ai/health");
        const json = await res.json();
        setOllamaOnline(json.success);
        if (json.data?.latencyMs) setLatency(json.data.latencyMs);
      } catch {
        setOllamaOnline(false);
      }
    }

    async function checkAccounts() {
      try {
        const res = await fetch("/api/accounts");
        const json = await res.json();
        const accounts = json.data || [];
        setYtOnline(accounts.some((a: any) => a.platform_code === "youtube" && a.connection_state === "connected"));
        setDriveOnline(accounts.some((a: any) => a.platform_code === "google_drive" && a.connection_state === "connected"));
      } catch {
        setYtOnline(false);
        setDriveOnline(false);
      }
    }

    checkOllama();
    checkAccounts();
  }, []);

  return (
    <div className="flex items-center gap-4 text-xs py-1 px-3 bg-zinc-950/60 border border-zinc-800/80 rounded-lg">
      {/* Ollama Status */}
      <div className="flex items-center gap-2">
        <Cpu className="h-3.5 w-3.5 text-zinc-400" />
        <span className="text-zinc-400">Ollama:</span>
        <StatusIndicator
          status={ollamaOnline === null ? "busy" : ollamaOnline ? "online" : "offline"}
          label={ollamaOnline ? `Online (${latency || "<50"}ms)` : "Offline"}
        />
      </div>

      <div className="h-3 w-px bg-zinc-800" />

      {/* Drive Staging Status */}
      <Link href="/accounts" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
        <HardDrive className="h-3.5 w-3.5 text-zinc-400" />
        <span className="text-zinc-400">Drive Staging:</span>
        <StatusIndicator
          status={driveOnline === null ? "busy" : driveOnline ? "online" : "offline"}
          label={driveOnline ? "Active (Authorized)" : "Needs Auth"}
        />
      </Link>

      <div className="h-3 w-px bg-zinc-800" />

      {/* YouTube Connection */}
      <Link href="/accounts" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
        <YouTubeIcon className="h-3.5 w-3.5 text-red-500" />
        <span className="text-zinc-400">YouTube API:</span>
        <StatusIndicator
          status={ytOnline === null ? "busy" : ytOnline ? "online" : "offline"}
          label={ytOnline ? "Connected" : "Needs Auth"}
        />
      </Link>
    </div>
  );
}
