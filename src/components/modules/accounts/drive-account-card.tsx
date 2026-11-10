"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, HardDrive, RefreshCw, ShieldCheck, AlertCircle, LogOut, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";

interface DriveAccountInfo {
  connected: boolean;
  email?: string;
  name?: string;
  avatarUrl?: string;
  expiresAt?: string;
}

function DriveAccountCardContent() {
  const searchParams = useSearchParams();
  const isJustConnected = searchParams.get("status") === "drive_connected";
  const errorMessage = searchParams.get("error");

  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [purging, setPurging] = useState(false);
  const [purgeResult, setPurgeResult] = useState<string | null>(null);
  const [account, setAccount] = useState<DriveAccountInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function loadStatus() {
    try {
      const res = await fetch("/api/accounts/drive/status");
      const json = await res.json();
      if (json.data?.connected) {
        setAccount(json.data);
      } else {
        setAccount({ connected: false });
      }
    } catch {
      setAccount({ connected: false });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadStatus();
  }, []);

  async function handleConnect() {
    setConnecting(true);
    try {
      const res = await fetch("/api/accounts/drive/connect", { method: "POST" });
      const data = await res.json();
      if (data.data?.authorizationUrl) {
        window.location.href = data.data.authorizationUrl;
      }
    } finally {
      setConnecting(false);
    }
  }

  async function handleDisconnect() {
    if (!confirm("Are you sure you want to disconnect Google Drive staging? Staged files will not be automatically cleaned up.")) return;
    setDisconnecting(true);
    try {
      await fetch("/api/accounts/drive/disconnect", { method: "POST" });
      setAccount({ connected: false });
      toast.info("Account Disconnected", "Google Drive staging account disconnected.");
    } finally {
      setDisconnecting(false);
    }
  }

  async function handlePurgeCompleted() {
    setPurging(true);
    setPurgeResult(null);
    try {
      const res = await fetch("/api/media/delete-staged", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purgeAllCompleted: true }),
      });
      const data = await res.json();
      if (data.success) {
        const msg = `Cleaned up ${data.data.purgedCount || 0} staged file(s) from your Google Drive.`;
        setPurgeResult(msg);
        toast.success("Purge Succeeded", msg);
      } else {
        const err = data.error?.message || "Purge failed.";
        setPurgeResult(err);
        toast.error("Purge Failed", err);
      }
    } catch {
      setPurgeResult("Network request failed while purging.");
      toast.error("Network Error", "Network request failed while purging.");
    } finally {
      setPurging(false);
    }
  }

  if (isLoading) {
    return <div className="p-6 text-xs text-zinc-500">Checking Google Drive staging authorization...</div>;
  }

  const isConnected = account?.connected ?? false;

  return (
    <div className="space-y-4">
      {isJustConnected && (
        <div className="p-4 bg-emerald-950/50 border border-emerald-800/70 rounded-xl flex items-center gap-3 text-emerald-300 text-xs animate-in fade-in">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
          <div>
            <strong className="font-semibold block text-emerald-200">
              Google Drive Staging Connected!
            </strong>
            Automated safe deletion is enabled. Ephemeral video files will now be purged from your Drive automatically post-upload.
          </div>
        </div>
      )}

      {purgeResult && (
        <div className="p-3 bg-blue-950/50 border border-blue-800/70 rounded-xl flex items-center gap-3 text-blue-300 text-xs animate-in fade-in">
          <HardDrive className="h-4 w-4 shrink-0 text-blue-400" />
          <div>{purgeResult}</div>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-950/50 border border-rose-800/70 rounded-xl flex items-center gap-3 text-rose-300 text-xs">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
          <div>
            <strong className="font-semibold block text-rose-200">
              Connection Issue
            </strong>
            {errorMessage}
          </div>
        </div>
      )}

      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {isConnected && account?.avatarUrl ? (
              <img
                src={account.avatarUrl}
                alt={account?.name || "Drive Account"}
                className="h-12 w-12 rounded-xl object-cover border border-zinc-700 shrink-0"
              />
            ) : (
              <div className="h-12 w-12 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                <HardDrive className="h-6 w-6" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-zinc-100">
                  {isConnected && account ? account.name || "Google Drive Account" : "Google Drive Media Staging"}
                </h3>
                <Badge variant={isConnected ? "success" : "default"}>
                  {isConnected ? "CONNECTED" : "NOT CONNECTED"}
                </Badge>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                {isConnected && account
                  ? `Authenticated as: ${account.email} • Post-upload safe cleanup enabled`
                  : "Connect your Google Drive to enable automated cleanup of temporary source videos (Section 5.1)"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isConnected ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePurgeCompleted}
                  isLoading={purging}
                  className="gap-1.5 text-zinc-300 hover:text-zinc-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Purge Completed Media
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleConnect}
                  isLoading={connecting}
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                  Switch Account
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDisconnect}
                  isLoading={disconnecting}
                  className="text-rose-400 hover:text-rose-300"
                >
                  <LogOut className="h-3.5 w-3.5 mr-1.5" />
                  Disconnect
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={handleConnect} isLoading={connecting} className="gap-1.5 bg-blue-600 hover:bg-blue-500">
                <HardDrive className="h-4 w-4" />
                Connect Google Drive
              </Button>
            )}
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-zinc-800 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-zinc-500 block">Staging Architecture</span>
            <span className="text-zinc-200 font-medium flex items-center gap-1 mt-0.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              Zero Permanent DB Storage
            </span>
          </div>

          <div>
            <span className="text-zinc-500 block">Required Scope</span>
            <span className="text-zinc-200 font-medium block mt-0.5 font-mono text-[11px]">
              drive (post-upload purge)
            </span>
          </div>

          <div>
            <span className="text-zinc-500 block">Safe Deletion Policy</span>
            <span className="text-zinc-200 font-medium block mt-0.5">
              Deleted only after confirmed YouTube ID
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}

export function DriveAccountCard() {
  return (
    <Suspense fallback={<div className="p-6 text-xs text-zinc-500">Loading Google Drive staging state...</div>}>
      <DriveAccountCardContent />
    </Suspense>
  );
}
