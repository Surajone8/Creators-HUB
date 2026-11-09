"use client";

import { HardDrive, Trash2, Clock, CheckCircle2, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatBytes, formatDate } from "@/lib/utils/formatters";

interface StagedMediaRow {
  id: string;
  driveFileId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  status: "staged" | "uploading" | "deletion_pending" | "deleted";
  createdOn: string;
  expiresOn: string;
  associatedPost: string;
}

const MOCK_STAGED_ASSETS: StagedMediaRow[] = [
  {
    id: "med_1",
    driveFileId: "1AbCdEfGhIjKlMnOpQrStUvWxYz",
    fileName: "raw_recording_4k.mp4",
    fileSize: 1024 * 1024 * 450,
    mimeType: "video/mp4",
    status: "staged",
    createdOn: "2026-11-07T08:00:00Z",
    expiresOn: "2026-11-09T08:00:00Z",
    associatedPost: "Building an AI-Powered YouTube Automation Engine",
  },
  {
    id: "med_2",
    driveFileId: "9ZyXwVuTsRqPoNmLkJiHgFeDcBa",
    fileName: "nextjs16_masterclass.mp4",
    fileSize: 1024 * 1024 * 850,
    mimeType: "video/mp4",
    status: "staged",
    createdOn: "2026-11-07T06:00:00Z",
    expiresOn: "2026-11-08T06:00:00Z",
    associatedPost: "Next.js 16 Full Deep Dive for SaaS Creators",
  },
  {
    id: "med_3",
    driveFileId: "4TuvWxYzAbCdEfGhIjKlMnOpQr",
    fileName: "ollama_benchmarks.mp4",
    fileSize: 1024 * 1024 * 310,
    mimeType: "video/mp4",
    status: "deleted",
    createdOn: "2026-11-04T12:00:00Z",
    expiresOn: "2026-11-06T12:00:00Z",
    associatedPost: "Ollama Benchmarks & Setup Guide",
  },
];

export function StagedMediaTable() {
  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl border border-blue-900/50 bg-blue-950/20 flex items-start gap-3">
        <ShieldAlert className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-200 leading-relaxed">
          <strong>Temporary Staging Policy (Section 5):</strong> Video files are never permanently saved in the database. Google Drive serves as a temporary staging location. Upon verified YouTube upload, the background worker safely issues a Drive file deletion.
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/50">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-950/80 text-zinc-400 border-b border-zinc-800">
            <tr>
              <th className="p-3.5 font-medium">File Name</th>
              <th className="p-3.5 font-medium">Google Drive ID</th>
              <th className="p-3.5 font-medium">Size</th>
              <th className="p-3.5 font-medium">Associated Post</th>
              <th className="p-3.5 font-medium">Retention Status</th>
              <th className="p-3.5 font-medium">Expires In</th>
              <th className="p-3.5 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {MOCK_STAGED_ASSETS.map((asset) => (
              <tr key={asset.id} className="hover:bg-zinc-850/40 transition-colors">
                <td className="p-3.5 font-medium text-zinc-200 flex items-center gap-2">
                  <HardDrive className="h-3.5 w-3.5 text-zinc-500" />
                  {asset.fileName}
                </td>
                <td className="p-3.5 font-mono text-zinc-400 text-[11px]">
                  {asset.driveFileId.slice(0, 12)}...
                </td>
                <td className="p-3.5 text-zinc-300">{formatBytes(asset.fileSize)}</td>
                <td className="p-3.5 text-zinc-300 max-w-xs truncate">{asset.associatedPost}</td>
                <td className="p-3.5">
                  <Badge
                    variant={
                      asset.status === "staged"
                        ? "info"
                        : asset.status === "deleted"
                        ? "default"
                        : "warning"
                    }
                  >
                    {asset.status === "deleted" ? "Safely Deleted" : asset.status.toUpperCase()}
                  </Badge>
                </td>
                <td className="p-3.5 text-zinc-400">
                  {asset.status === "deleted" ? (
                    <span className="text-zinc-600">—</span>
                  ) : (
                    formatDate(asset.expiresOn, "MMM d, h:mm a")
                  )}
                </td>
                <td className="p-3.5 text-right">
                  {asset.status === "staged" && (
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-rose-400 hover:text-rose-300">
                      <Trash2 className="h-3.5 w-3.5" />
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
