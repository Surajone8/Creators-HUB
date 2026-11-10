"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, RefreshCw, ShieldCheck, AlertCircle, LogOut } from "lucide-react";
import { YouTubeIcon } from "@/components/ui/icons";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";

interface ChannelInfo {
  channelId: string;
  title: string;
  handle?: string | null;
  avatarUrl?: string | null;
  connectionState: "connected" | "disconnected" | "expired" | "pending";
}

function YouTubeChannelCardContent() {
  const searchParams = useSearchParams();
  const isJustConnected = searchParams.get("status") === "connected";
  const errorMessage = searchParams.get("error");

  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [channel, setChannel] = useState<ChannelInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAccount() {
      try {
        const res = await fetch("/api/accounts");
        const json = await res.json();
        if (json.data && json.data.length > 0) {
          const acc = json.data[0];
          setChannel({
            channelId: acc.channel_id || "UC_verified_channel",
            title: acc.display_name || "Connected Channel",
            handle: acc.account_handle || "@creator",
            avatarUrl: acc.thumbnail_url,
            connectionState: acc.connection_state || "connected",
          });
        } else {
          setChannel(null);
        }
      } catch {
        setChannel(null);
      } finally {
        setIsLoading(false);
      }
    }
    loadAccount();
  }, []);

  async function handleConnect() {
    setConnecting(true);
    try {
      const res = await fetch("/api/accounts/youtube/connect", { method: "POST" });
      const data = await res.json();
      if (data.data?.authorizationUrl) {
        window.location.href = data.data.authorizationUrl;
      }
    } finally {
      setConnecting(false);
    }
  }

  async function handleDisconnect() {
    if (!confirm("Are you sure you want to disconnect this YouTube account?")) return;
    setDisconnecting(true);
    try {
      await fetch("/api/accounts/youtube/disconnect", { method: "POST" });
      setChannel(null);
      toast.info("Account Disconnected", "YouTube account has been disconnected.");
    } finally {
      setDisconnecting(false);
    }
  }

  if (isLoading) {
    return <div className="p-6 text-xs text-zinc-500">Checking connected YouTube account...</div>;
  }

  const isConnected = channel && channel.connectionState === "connected";

  return (
    <div className="space-y-4">
      {isJustConnected && (
        <div className="p-4 bg-emerald-950/50 border border-emerald-800/70 rounded-xl flex items-center gap-3 text-emerald-300 text-xs animate-in fade-in">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
          <div>
            <strong className="font-semibold block text-emerald-200">
              YouTube Account Successfully Connected!
            </strong>
            Creator Hub is authorized to prepare and schedule uploads to your channel.
          </div>
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
            {isConnected && channel.avatarUrl ? (
              <img
                src={channel.avatarUrl}
                alt={channel.title}
                className="h-12 w-12 rounded-xl object-cover border border-zinc-700 shrink-0"
              />
            ) : (
              <div className="h-12 w-12 rounded-xl bg-red-600/10 border border-red-500/20 flex items-center justify-center text-red-500 shrink-0">
                <YouTubeIcon className="h-6 w-6" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-zinc-100">
                  {isConnected ? channel.title : "YouTube Channel"}
                </h3>
                <Badge variant={isConnected ? "success" : "default"}>
                  {isConnected ? "CONNECTED" : "NOT CONNECTED"}
                </Badge>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                {isConnected
                  ? `Channel ID: ${channel.channelId} ${channel.handle ? `• Handle: ${channel.handle}` : ""}`
                  : "Connect your YouTube channel using official Google OAuth"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isConnected ? (
              <>
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
              <Button size="sm" onClick={handleConnect} isLoading={connecting}>
                <YouTubeIcon className="h-4 w-4 mr-1.5" />
                Connect YouTube
              </Button>
            )}
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-zinc-800 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-zinc-500 block">Token Security</span>
            <span className="text-zinc-200 font-medium flex items-center gap-1 mt-0.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              Encrypted Server-Side
            </span>
          </div>

          <div>
            <span className="text-zinc-500 block">Authorized Scopes</span>
            <span className="text-zinc-200 font-medium block mt-0.5">
              youtube.upload, youtube.readonly
            </span>
          </div>

          <div>
            <span className="text-zinc-500 block">Token Expiry</span>
            <span className="text-zinc-200 font-medium block mt-0.5">
              Auto-refreshed via refresh_token
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}

export function YouTubeChannelCard() {
  return (
    <Suspense fallback={<div className="p-6 text-xs text-zinc-500">Loading channel state...</div>}>
      <YouTubeChannelCardContent />
    </Suspense>
  );
}
