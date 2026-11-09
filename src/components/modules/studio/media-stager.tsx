"use client";

import { useState } from "react";
import { HardDrive, CheckCircle2, ShieldCheck, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatBytes } from "@/lib/utils/formatters";

interface MediaStagerProps {
  onMediaStaged: (media: { driveFileId: string; fileName: string; fileSize: number }) => void;
}

/**
 * Extracts Google Drive File ID from full URLs or raw IDs
 * Supports formats:
 * - https://drive.google.com/file/d/FILE_ID/view
 * - https://drive.google.com/open?id=FILE_ID
 * - Raw FILE_ID
 */
function extractDriveFileId(input: string): string {
  const trimmed = input.trim();
  const urlMatch = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/) || trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (urlMatch && urlMatch[1]) {
    return urlMatch[1];
  }
  return trimmed;
}

export function MediaStager({ onMediaStaged }: MediaStagerProps) {
  const [inputUrlOrId, setInputUrlOrId] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileSizeMB, setFileSizeMB] = useState("350");
  const [staged, setStaged] = useState(false);

  const parsedId = extractDriveFileId(inputUrlOrId);

  function handleStage() {
    if (!parsedId || !fileName.trim()) return;

    const size = parseInt(fileSizeMB || "100", 10) * 1024 * 1024;
    onMediaStaged({
      driveFileId: parsedId,
      fileName,
      fileSize: size,
    });
    setStaged(true);
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-950/60 text-blue-400 border border-blue-800/50">
            <HardDrive className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-zinc-100">Google Drive Temporary Media Staging</h4>
            <p className="text-xs text-zinc-400">Zero database storage • Safe automatic cleanup post-upload</p>
          </div>
        </div>
      </div>

      <div className="p-3 bg-zinc-950/80 rounded-lg border border-zinc-800/80 flex items-start gap-2.5 text-xs text-zinc-400">
        <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
        <p>
          <strong className="text-zinc-200">Retention Safeguard:</strong> Video files are never retained permanently in Creator Hub. The worker reads directly from your Google Drive, uploads to YouTube, and deletes the Drive staging file only after YouTube video ID confirmation.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="space-y-1.5 md:col-span-1">
          <div className="flex items-center justify-between text-xs font-medium text-zinc-300">
            <label htmlFor="driveInput">Google Drive Link or File ID *</label>
            {parsedId && parsedId !== inputUrlOrId && (
              <span className="text-[10px] text-emerald-400 font-mono">ID Extracted</span>
            )}
          </div>
          <div className="relative">
            <Input
              id="driveInput"
              placeholder="Paste Drive share link or ID..."
              value={inputUrlOrId}
              onChange={(e) => {
                setInputUrlOrId(e.target.value);
                setStaged(false);
              }}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-300" htmlFor="videoFileName">
            Video File Name *
          </label>
          <Input
            id="videoFileName"
            placeholder="e.g. final_video_1080p.mp4"
            value={fileName}
            onChange={(e) => {
              setFileName(e.target.value);
              setStaged(false);
            }}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-300" htmlFor="videoSize">
            Approx. Size (MB)
          </label>
          <Input
            id="videoSize"
            type="number"
            placeholder="350"
            value={fileSizeMB}
            onChange={(e) => {
              setFileSizeMB(e.target.value);
              setStaged(false);
            }}
          />
        </div>
      </div>

      {parsedId && (
        <div className="text-[11px] text-zinc-500 font-mono flex items-center gap-1.5">
          <Link2 className="h-3 w-3 text-zinc-400" />
          Target Staged File ID: <span className="text-zinc-300">{parsedId}</span>
        </div>
      )}

      <div className="flex items-center justify-between pt-1">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleStage}
          disabled={!parsedId || !fileName.trim()}
          className="gap-2"
        >
          {staged ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              Staging Reference Linked
            </>
          ) : (
            "Link Drive Media Asset"
          )}
        </Button>

        {staged && (
          <span className="text-xs text-emerald-400 font-mono">
            {fileName} ({formatBytes(parseInt(fileSizeMB || "0", 10) * 1024 * 1024)}) linked
          </span>
        )}
      </div>
    </div>
  );
}
