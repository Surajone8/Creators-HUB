import Link from "next/link";
import {
  Sparkles,
  Calendar,
  HardDrive,
  History,
  ArrowRight,
  TrendingUp,
  Clock,
  Plus,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-red-950/40 via-zinc-900 to-zinc-900 border border-zinc-800">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-red-950 text-red-400 border border-red-800/60 text-xs font-medium mb-1">
            <Sparkles className="h-3.5 w-3.5" />
            Phase 1 Baseline Active
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-100">Welcome to Creator Hub</h2>
          <p className="text-xs text-zinc-400 max-w-xl">
            Your single workspace for local AI metadata generation (Ollama), zero-permanent-storage Google Drive staging, and YouTube scheduled publishing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/studio">
            <Button className="gap-2 shadow-lg shadow-red-600/20">
              <Plus className="h-4 w-4" />
              Open Content Studio
            </Button>
          </Link>
        </div>
      </div>

      {/* Core Operational Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Local AI status */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Local LLM Runtime
              </span>
              <Badge variant="success">READY</Badge>
            </div>
            <h3 className="text-lg font-bold text-zinc-100">Ollama (llama3.2)</h3>
            <p className="text-xs text-zinc-400">
              All metadata prompts & descriptions run locally on your hardware. No cloud LLM leakages.
            </p>
          </div>
          <div className="pt-4 border-t border-zinc-800 mt-4 flex items-center justify-between text-xs">
            <span className="text-zinc-500">Latency: ~45ms</span>
            <Link href="/settings" className="text-red-400 hover:text-red-300 font-medium flex items-center gap-1">
              Configure <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </Card>

        {/* Drive Staging status */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Media Staging
              </span>
              <Badge variant="info">2 FILES STAGED</Badge>
            </div>
            <h3 className="text-lg font-bold text-zinc-100">Google Drive API</h3>
            <p className="text-xs text-zinc-400">
              1.3 GB staged. Deletion triggered strictly after confirmed YouTube upload verification.
            </p>
          </div>
          <div className="pt-4 border-t border-zinc-800 mt-4 flex items-center justify-between text-xs">
            <span className="text-zinc-500">Retention: 48h limit</span>
            <Link href="/media" className="text-red-400 hover:text-red-300 font-medium flex items-center gap-1">
              Manage Staging <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </Card>

        {/* YouTube Publishing */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Publishing Queue
              </span>
              <Badge variant="warning">1 SCHEDULED</Badge>
            </div>
            <h3 className="text-lg font-bold text-zinc-100">YouTube Channel</h3>
            <p className="text-xs text-zinc-400">
              Next scheduled video will be published automatically tomorrow at 10:00 AM UTC.
            </p>
          </div>
          <div className="pt-4 border-t border-zinc-800 mt-4 flex items-center justify-between text-xs">
            <span className="text-zinc-500">Quota: Healthy</span>
            <Link href="/calendar" className="text-red-400 hover:text-red-300 font-medium flex items-center gap-1">
              View Calendar <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </Card>
      </div>

      {/* Next Up / Scheduled Pipeline & Recent Drafts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Posts */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-red-500" />
              Upcoming Scheduled Posts
            </h3>
            <Link href="/calendar" className="text-xs text-zinc-400 hover:text-zinc-200">
              View all
            </Link>
          </div>

          <div className="space-y-2.5">
            <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-950/60 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-semibold text-zinc-200">Next.js 16 Production Blueprint</h4>
                <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-1">
                  <Clock className="h-3 w-3" />
                  <span>Tomorrow at 10:00 AM (UTC)</span>
                  <span className="text-emerald-400">• Media Ready</span>
                </div>
              </div>
              <Badge variant="info">SCHEDULED</Badge>
            </div>
          </div>
        </div>

        {/* Recent Drafts */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-rose-500" />
              Active Drafts
            </h3>
            <Link href="/studio" className="text-xs text-zinc-400 hover:text-zinc-200">
              New Draft
            </Link>
          </div>

          <div className="space-y-2.5">
            <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-950/60 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-semibold text-zinc-200">
                  Building an AI-Powered YouTube Automation Engine
                </h4>
                <p className="text-[11px] text-zinc-500 mt-0.5">Metadata generated with local Ollama</p>
              </div>
              <Link href="/studio">
                <Button variant="outline" size="sm" className="text-xs h-7 px-2.5">
                  Resume
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
