"use client";

import { CheckCircle2, AlertTriangle, ExternalLink, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils/formatters";

interface HistoryRow {
  id: string;
  postTitle: string;
  attemptNumber: number;
  result: "success" | "failure" | "retried";
  youtubeVideoId: string | null;
  errorMessage: string | null;
  completedAt: string;
}

const MOCK_HISTORY: HistoryRow[] = [
  {
    id: "hist_1",
    postTitle: "Building an Autonomous Agent in 2026",
    attemptNumber: 1,
    result: "success",
    youtubeVideoId: "dQw4w9WgXcQ",
    errorMessage: null,
    completedAt: "2026-11-06T15:30:00Z",
  },
  {
    id: "hist_2",
    postTitle: "Local Ollama Benchmarks & Setup Guide",
    attemptNumber: 2,
    result: "success",
    youtubeVideoId: "M7lc1UVf-VE",
    errorMessage: null,
    completedAt: "2026-11-05T11:20:00Z",
  },
  {
    id: "hist_3",
    postTitle: "Supabase vs SQLite for Creator SaaS",
    attemptNumber: 1,
    result: "failure",
    youtubeVideoId: null,
    errorMessage: "YouTube API quota limit exceeded for channel upload endpoint.",
    completedAt: "2026-11-04T09:45:00Z",
  },
];

export function HistoryTable() {
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/50">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-950/80 text-zinc-400 border-b border-zinc-800">
            <tr>
              <th className="p-3.5 font-medium">Post / Video Title</th>
              <th className="p-3.5 font-medium">Result</th>
              <th className="p-3.5 font-medium">Attempt</th>
              <th className="p-3.5 font-medium">YouTube Video ID</th>
              <th className="p-3.5 font-medium">Completed At</th>
              <th className="p-3.5 font-medium">Error Details</th>
              <th className="p-3.5 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {MOCK_HISTORY.map((row) => (
              <tr key={row.id} className="hover:bg-zinc-850/40 transition-colors">
                <td className="p-3.5 font-medium text-zinc-200">{row.postTitle}</td>
                <td className="p-3.5">
                  <Badge variant={row.result === "success" ? "success" : "danger"}>
                    {row.result.toUpperCase()}
                  </Badge>
                </td>
                <td className="p-3.5 text-zinc-400 font-mono">#{row.attemptNumber}</td>
                <td className="p-3.5">
                  {row.youtubeVideoId ? (
                    <a
                      href={`https://youtube.com/watch?v=${row.youtubeVideoId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-mono text-red-400 hover:text-red-300 underline"
                    >
                      {row.youtubeVideoId}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="text-zinc-600">—</span>
                  )}
                </td>
                <td className="p-3.5 text-zinc-400">{formatDate(row.completedAt)}</td>
                <td className="p-3.5 text-zinc-400 max-w-xs truncate">
                  {row.errorMessage ? (
                    <span className="text-rose-400 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3 shrink-0" />
                      {row.errorMessage}
                    </span>
                  ) : (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Uploaded successfully
                    </span>
                  )}
                </td>
                <td className="p-3.5 text-right">
                  {row.result === "failure" && (
                    <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs gap-1">
                      <RefreshCw className="h-3 w-3" />
                      Retry Safe
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
