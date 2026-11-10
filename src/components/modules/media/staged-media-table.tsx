"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HardDrive, Trash2, Clock, CheckCircle2, ShieldAlert, AlertCircle, RefreshCw, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
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
  deletedAt?: string | null;
  associatedPost: string;
  scheduleState: string;
  isReadyForCleanup: boolean;
}

export function StagedMediaTable() {
  const [assets, setAssets] = useState<StagedMediaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [purgingAll, setPurgingAll] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string; link?: string } | null>(null);
  const [driveConnected, setDriveConnected] = useState<boolean | null>(null);

  async function loadData() {
    try {
      const [mediaRes, driveStatusRes] = await Promise.all([
        fetch("/api/media/staged"),
        fetch("/api/accounts/drive/status"),
      ]);

      const mediaJson = await mediaRes.json();
      const driveJson = await driveStatusRes.json();

      if (mediaJson.data) {
        setAssets(mediaJson.data);
      }
      setDriveConnected(driveJson.data?.connected ?? false);
    } catch {
      setStatusMessage({ type: "error", text: "Failed to load staged media." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleDeleteFile(asset: StagedMediaRow) {
    if (!driveConnected) {
      setStatusMessage({
        type: "error",
        text: "Google Drive is not connected. Please connect Google Drive in Connected Accounts to authorize file deletion.",
        link: "/accounts",
      });
      return;
    }

    if (!confirm(`Are you sure you want to delete "${asset.fileName}" from Google Drive?`)) return;

    setDeletingId(asset.id);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/media/delete-staged", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaAssetId: asset.id,
          driveFileId: asset.driveFileId,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success("File Purged", `"${asset.fileName}" successfully purged from Google Drive.`);
        setStatusMessage({
          type: "success",
          text: `"${asset.fileName}" successfully purged from Google Drive.`,
        });
        await loadData();
      } else {
        if (data.data?.activationUrl) {
          toast.warning("Google Drive API Disabled", "Activation required on Google Cloud.");
          setStatusMessage({
            type: "error",
            text: "Google Drive API is disabled in your Google Cloud Project. Click to enable it then retry.",
            link: data.data.activationUrl,
          });
        } else {
          toast.error("Delete Failed", data.error?.message || "Failed to delete file from Google Drive.");
          setStatusMessage({
            type: "error",
            text: data.error?.message || "Failed to delete file from Google Drive.",
          });
        }
      }
    } catch (err: unknown) {
      toast.error("Network Error", err instanceof Error ? err.message : "Network error deleting file");
      setStatusMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Network error deleting file",
      });
    } finally {
      setDeletingId(null);
    }
  }

  async function handlePurgeAll() {
    if (!driveConnected) {
      toast.warning("Drive Disconnected", "Please connect Google Drive in Connected Accounts first.");
      setStatusMessage({
        type: "error",
        text: "Google Drive is not connected. Please connect Google Drive in Connected Accounts first.",
        link: "/accounts",
      });
      return;
    }

    setPurgingAll(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/media/delete-staged", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purgeAllCompleted: true }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success("Purge Complete", `Cleaned up ${data.data.purgedCount || 0} completed staged file(s).`);
        setStatusMessage({
          type: "success",
          text: `Cleaned up ${data.data.purgedCount || 0} completed staged file(s) from Google Drive.`,
        });
        await loadData();
      } else {
        toast.error("Purge Failed", data.error?.message || "Purge failed.");
        setStatusMessage({
          type: "error",
          text: data.error?.message || "Purge failed.",
        });
      }
    } catch (err: unknown) {
      toast.error("Network Error", err instanceof Error ? err.message : "Network error purging files");
      setStatusMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Network error purging files",
      });
    } finally {
      setPurgingAll(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Google Drive Auth Notice */}
      {driveConnected === false && (
        <div className="p-4 rounded-xl border border-amber-800/60 bg-amber-950/30 flex items-start justify-between gap-3 animate-in fade-in">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-200 leading-relaxed">
              <strong>Google Drive Authorization Required:</strong> To enable automated safe deletion of source video files post-upload (Section 5.1), connect your Google Drive account.
            </div>
          </div>
          <Link href="/accounts">
            <Button size="sm" className="bg-amber-600 hover:bg-amber-500 text-xs shrink-0">
              Connect Google Drive
            </Button>
          </Link>
        </div>
      )}

      {/* Status Alert Banner */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs animate-in fade-in ${
            statusMessage.type === "success"
              ? "bg-emerald-950/50 border-emerald-800/70 text-emerald-300"
              : "bg-rose-950/50 border-rose-800/70 text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          {statusMessage.link && (
            <a
              href={statusMessage.link}
              target={statusMessage.link.startsWith("http") ? "_blank" : "_self"}
              rel="noreferrer"
              className="font-medium underline hover:opacity-80 flex items-center gap-1 shrink-0"
            >
              {statusMessage.link.startsWith("http") ? "Enable API on Google Cloud" : "Go to Connected Accounts"}
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      )}

      {/* Info Card with Purge Button */}
      <div className="p-4 rounded-xl border border-blue-900/50 bg-blue-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
          <div className="text-xs text-blue-200 leading-relaxed">
            <strong>Temporary Staging Policy (Section 5):</strong> Video files are never permanently stored in the application database. Google Drive serves as a temporary staging location. Upon confirmed YouTube upload, the background worker safely deletes the Drive file.
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            isLoading={loading}
            className="text-xs gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePurgeAll}
            isLoading={purgingAll}
            disabled={!driveConnected || assets.filter((a) => a.isReadyForCleanup).length === 0}
            className="text-xs gap-1.5 text-zinc-300 hover:text-zinc-100"
          >
            <Trash2 className="h-3.5 w-3.5 text-rose-400" />
            Purge Completed Media
          </Button>
        </div>
      </div>

      {/* Media Assets Table */}
      <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/50">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-950/80 text-zinc-400 border-b border-zinc-800">
            <tr>
              <th className="p-3.5 font-medium">File Name</th>
              <th className="p-3.5 font-medium">Google Drive ID</th>
              <th className="p-3.5 font-medium">Size</th>
              <th className="p-3.5 font-medium">Associated Post</th>
              <th className="p-3.5 font-medium">Retention Status</th>
              <th className="p-3.5 font-medium">Expires / Deleted</th>
              <th className="p-3.5 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {loading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-zinc-500">
                  Loading staged Google Drive files...
                </td>
              </tr>
            ) : assets.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-zinc-500">
                  No temporary media currently staged in Google Drive.
                </td>
              </tr>
            ) : (
              assets.map((asset) => {
                const isDeleted = asset.status === "deleted";
                const isDeleting = deletingId === asset.id;

                return (
                  <tr key={asset.id} className="hover:bg-zinc-850/40 transition-colors">
                    <td className="p-3.5 font-medium text-zinc-200 flex items-center gap-2">
                      <HardDrive className={`h-3.5 w-3.5 ${isDeleted ? "text-zinc-600" : "text-blue-400"}`} />
                      <span className={isDeleted ? "line-through text-zinc-500" : ""}>{asset.fileName}</span>
                    </td>
                    <td className="p-3.5 font-mono text-zinc-400 text-[11px]">
                      <a
                        href={`https://drive.google.com/file/d/${asset.driveFileId}/view`}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-blue-400 underline flex items-center gap-1"
                      >
                        {asset.driveFileId.slice(0, 14)}...
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    </td>
                    <td className="p-3.5 text-zinc-300">{formatBytes(asset.fileSize)}</td>
                    <td className="p-3.5 text-zinc-300 max-w-xs truncate">{asset.associatedPost}</td>
                    <td className="p-3.5">
                      <Badge
                        variant={
                          isDeleted
                            ? "default"
                            : asset.status === "staged"
                            ? "info"
                            : "warning"
                        }
                      >
                        {isDeleted
                          ? "SAFELY DELETED"
                          : asset.status === "staged"
                          ? asset.isReadyForCleanup
                            ? "PENDING CLEANUP"
                            : "STAGED"
                          : asset.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="p-3.5 text-zinc-400">
                      {isDeleted && asset.deletedAt ? (
                        <span className="text-zinc-500 text-[11px]">
                          Purged {formatDate(asset.deletedAt, "MMM d, h:mm a")}
                        </span>
                      ) : (
                        <span className="text-[11px]">
                          {formatDate(asset.expiresOn, "MMM d, h:mm a")}
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-right">
                      {!isDeleted && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteFile(asset)}
                          isLoading={isDeleting}
                          title="Purge file from Google Drive"
                          className="h-7 px-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" />
                          Delete from Drive
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
