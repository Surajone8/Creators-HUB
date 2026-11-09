"use client";

import { useState } from "react";
import { Cpu, HardDrive, Shield, CheckCircle2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { APP_CONFIG } from "@/constants/config";

export default function SettingsPage() {
  const [model, setModel] = useState("llama3.2");
  const [endpoint, setEndpoint] = useState("http://127.0.0.1:11434");
  const [retentionHours, setRetentionHours] = useState("48");
  const [saved, setSaved] = useState(false);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-zinc-100">Settings & Configuration</h2>
        <p className="text-xs text-zinc-400">
          Configure local Ollama runtime endpoints, temporary media retention, and system preferences
        </p>
      </div>

      {saved && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl flex items-center gap-2 text-xs text-emerald-300">
          <CheckCircle2 className="h-4 w-4" />
          Configuration settings updated successfully.
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Local AI Settings */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
            <Cpu className="h-5 w-5 text-red-500" />
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">Local AI Runtime (Ollama)</h3>
              <p className="text-xs text-zinc-400">Metadata generation without cloud AI provider costs</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Ollama API Endpoint</label>
              <Input
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                placeholder="http://127.0.0.1:11434"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Active Model</label>
              <Select value={model} onChange={(e) => setModel(e.target.value)}>
                {APP_CONFIG.ai.recommendedModels.map((m) => (
                  <option key={m} value={m}>
                    {m} (Local)
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </Card>

        {/* Media Storage Policy */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
            <HardDrive className="h-5 w-5 text-blue-500" />
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">Temporary Media Storage & Retention</h3>
              <p className="text-xs text-zinc-400">Google Drive staging rules and auto-cleanup safeguards</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">
                Staging Max Retention Window (Hours)
              </label>
              <Input
                type="number"
                value={retentionHours}
                onChange={(e) => setRetentionHours(e.target.value)}
              />
              <p className="text-[11px] text-zinc-500">
                Drive files older than this window without active jobs are flagged for cleanup.
              </p>
            </div>
          </div>
        </Card>

        {/* Security & Token Storage */}
        <Card className="p-5 space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
            <Shield className="h-5 w-5 text-emerald-500" />
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">Security & Encryption</h3>
              <p className="text-xs text-zinc-400">Database encryption and token protection</p>
            </div>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed">
            Google OAuth refresh tokens and API credentials are encrypted at rest with AES-256 before insertion into PostgreSQL. Browser clients are never exposed to Google client secrets or raw tokens.
          </p>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" size="sm">
            Save Preferences
          </Button>
        </div>
      </form>
    </div>
  );
}
