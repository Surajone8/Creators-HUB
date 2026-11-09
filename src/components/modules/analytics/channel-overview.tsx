"use client";

import { Eye, ThumbsUp, MessageSquare, Users, Video, TrendingUp } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatCompactNumber, formatDate } from "@/lib/utils/formatters";

export function ChannelOverview() {
  const metrics = [
    { title: "Total Channel Views", value: 1420500, icon: Eye, change: "+14.2%" },
    { title: "Subscribers", value: 28450, icon: Users, change: "+3.8%" },
    { title: "Likes (Last 30 Days)", value: 12450, icon: ThumbsUp, change: "+9.1%" },
    { title: "Comments (Last 30 Days)", value: 1890, icon: MessageSquare, change: "+5.4%" },
  ];

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <Card key={m.title} className="p-4">
              <div className="flex items-center justify-between pb-2">
                <span className="text-xs text-zinc-400 font-medium">{m.title}</span>
                <Icon className="h-4 w-4 text-zinc-500" />
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold tracking-tight text-zinc-100">
                  {formatCompactNumber(m.value)}
                </span>
                <span className="text-xs text-emerald-400 font-medium flex items-center gap-0.5">
                  <TrendingUp className="h-3 w-3" />
                  {m.change}
                </span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Recent Videos Performance */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-zinc-100">Recent Videos Performance Snapshot</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950/80 text-zinc-400 border-b border-zinc-800">
              <tr>
                <th className="p-3 font-medium">Video</th>
                <th className="p-3 font-medium">Published</th>
                <th className="p-3 font-medium">Views</th>
                <th className="p-3 font-medium">Likes</th>
                <th className="p-3 font-medium">Comments</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              <tr className="hover:bg-zinc-850/40">
                <td className="p-3 font-medium text-zinc-200">Building an Autonomous Agent in 2026</td>
                <td className="p-3 text-zinc-400">{formatDate("2026-11-06T14:30:00Z")}</td>
                <td className="p-3 text-zinc-200 font-semibold">{formatCompactNumber(14250)}</td>
                <td className="p-3 text-zinc-300">{formatCompactNumber(1120)}</td>
                <td className="p-3 text-zinc-300">{formatCompactNumber(184)}</td>
              </tr>
              <tr className="hover:bg-zinc-850/40">
                <td className="p-3 font-medium text-zinc-200">Local Ollama Benchmarks & Setup Guide</td>
                <td className="p-3 text-zinc-400">{formatDate("2026-11-05T09:15:00Z")}</td>
                <td className="p-3 text-zinc-200 font-semibold">{formatCompactNumber(31800)}</td>
                <td className="p-3 text-zinc-300">{formatCompactNumber(2450)}</td>
                <td className="p-3 text-zinc-300">{formatCompactNumber(412)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
