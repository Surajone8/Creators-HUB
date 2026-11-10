"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Save,
  Calendar,
  Send,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Mail,
  Zap,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { toast } from "@/components/ui/toast";
import { AIMetadataAssistant } from "./ai-metadata-assistant";
import { MediaStager } from "./media-stager";
import { YOUTUBE_CATEGORIES, YOUTUBE_PRIVACY_OPTIONS } from "@/constants/youtube";
import { COMMON_TIMEZONES, getDefaultTimezone } from "@/lib/utils/timezone";
import { supabase } from "@/lib/supabase/client";

export function ContentComposer() {
  const router = useRouter();

  // Content & Metadata Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [category, setCategory] = useState("28");
  const [visibility, setVisibility] = useState<"private" | "unlisted" | "public">("public");

  // Media Staging State
  const [stagedMedia, setStagedMedia] = useState<{
    driveFileId: string;
    fileName: string;
    fileSize: number;
  } | null>(null);

  // Scheduling State
  const [scheduleDate, setScheduleDate] = useState("");
  const [timezone, setTimezone] = useState(getDefaultTimezone());
  const [autoPublish, setAutoPublish] = useState(true);
  const [autoDeleteMedia, setAutoDeleteMedia] = useState(true);
  const [userEmail, setUserEmail] = useState<string>("reachsurajyadav@gmail.com");

  useEffect(() => {
    async function loadCreatorEmail() {
      const { data } = await supabase.auth.getUser();
      if (data.user?.email) {
        setUserEmail(data.user.email);
      }
    }
    loadCreatorEmail();
  }, []);

  // UI status
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishStep, setPublishStep] = useState<string | null>(null);
  const [publishResult, setPublishResult] = useState<{
    youtubeVideoId: string;
    youtubeUrl: string;
    driveFileDeleted: boolean;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  function handleApplyAIMetadata(aiData: { title: string; description: string; tags: string[] }) {
    setTitle(aiData.title);
    setDescription(aiData.description);
    setTagsInput(aiData.tags.join(", "));
  }

  async function handlePublishNow() {
    if (!title.trim()) {
      setErrorMessage("Please enter a video title before publishing.");
      return;
    }

    if (!stagedMedia) {
      setErrorMessage("Please link a Google Drive staged video file before publishing.");
      return;
    }

    setIsPublishing(true);
    setErrorMessage(null);
    setPublishResult(null);
    setPublishStep("Initiating YouTube resumable upload session...");

    const tags = tagsInput.split(",").map((t) => t.trim()).filter(Boolean);

    try {
      setPublishStep("Streaming video bytes from Google Drive to YouTube...");

      const res = await fetch(`/api/publishing/post_${Date.now()}/publish-now`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          tags,
          categoryId: category,
          visibility,
          driveFileId: stagedMedia.driveFileId,
          fileSize: stagedMedia.fileSize,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Publishing to YouTube failed.");
      }

      setPublishStep("Safe deletion: Google Drive temporary file cleaned up.");
      setPublishResult({
        youtubeVideoId: data.data.youtubeVideoId,
        youtubeUrl: data.data.youtubeUrl,
        driveFileDeleted: data.data.driveFileDeleted ?? true,
      });
      setSuccessMessage("Video uploaded and verified on YouTube!");
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to publish video to YouTube");
    } finally {
      setIsPublishing(false);
      setPublishStep(null);
    }
  }

  async function handleSaveDraft() {
    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    const tags = tagsInput.split(",").map((t) => t.trim()).filter(Boolean);

    try {
      const res = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title || "Untitled Draft",
          mediaAssetId: stagedMedia?.driveFileId,
          platformSettings: {
            accountId: "acc_demo_1",
            title,
            description,
            tags,
            category_id: category,
            visibility,
          },
        }),
      });

      if (res.ok) {
        setSuccessMessage("Draft saved successfully to workspace!");
        toast.success("Draft Saved", "Video draft saved to workspace.");
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSchedule() {
    if (!scheduleDate) {
      toast.warning("Missing Schedule Date", "Please select a target publish date and time.");
      return;
    }

    if (!title.trim()) {
      toast.warning("Missing Video Title", "Please enter a video title before scheduling.");
      return;
    }

    setIsSaving(true);
    const tags = tagsInput.split(",").map((t) => t.trim()).filter(Boolean);

    try {
      const res = await fetch("/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description,
          tags,
          categoryId: category,
          visibility,
          targetPublishTime: scheduleDate,
          displayTimezone: timezone,
          driveFileId: stagedMedia?.driveFileId,
          fileName: stagedMedia?.fileName,
          fileSize: stagedMedia?.fileSize,
          autoPublish,
          autoDeleteMedia,
          notifyEmailTarget: userEmail,
        }),
      });

      if (res.ok) {
        toast.success("Video Scheduled", `"${title.trim()}" successfully scheduled!`);
        router.push("/calendar");
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error("Scheduling Failed", data.error?.message || "Failed to schedule video.");
      }
    } catch {
      toast.error("Network Error", "An unexpected error occurred while scheduling.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-100">Content Studio</h2>
          <p className="text-xs text-zinc-400">
            Compose YouTube video metadata, generate with local Ollama AI, stage Drive media, and publish
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleSaveDraft}
            isLoading={isSaving}
            className="gap-1.5"
          >
            <Save className="h-4 w-4" />
            Save Draft
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSchedule}
            isLoading={isSaving}
            className="gap-1.5"
          >
            <Calendar className="h-4 w-4" />
            Schedule
          </Button>

          <Button
            size="sm"
            onClick={handlePublishNow}
            isLoading={isPublishing}
            className="gap-1.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 shadow-sm"
          >
            <Send className="h-4 w-4" />
            Publish Now to YouTube
          </Button>
        </div>
      </div>

      {/* Progress & Status Indicators */}
      {publishStep && (
        <div className="p-4 bg-zinc-900 border border-zinc-700 rounded-xl flex items-center gap-3 text-xs text-zinc-200">
          <div className="animate-spin h-4 w-4 border-2 border-red-500 border-t-transparent rounded-full" />
          <span>{publishStep}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-950/50 border border-rose-800/70 rounded-xl flex items-center gap-3 text-xs text-rose-300">
          <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {publishResult && (
        <div className="p-5 bg-emerald-950/40 border border-emerald-800/70 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              <h4 className="font-semibold text-emerald-200 text-sm">
                Video Successfully Published to YouTube!
              </h4>
            </div>
            <a
              href={publishResult.youtubeUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs bg-red-600 hover:bg-red-700 text-white font-medium px-3 py-1.5 rounded-lg transition-colors"
            >
              Watch on YouTube
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-2 border-t border-emerald-900/60 text-emerald-300">
            <div>
              <span className="text-zinc-500 block">YouTube Video ID</span>
              <span className="font-mono font-medium text-zinc-200">{publishResult.youtubeVideoId}</span>
            </div>
            <div>
              <span className="text-zinc-500 block">Staged Drive Status</span>
              <span className="font-medium text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" />
                {publishResult.driveFileDeleted ? "Safely Deleted (Zero Storage)" : "Retention Active"}
              </span>
            </div>
            <div>
              <span className="text-zinc-500 block">Visibility</span>
              <span className="font-medium text-zinc-200 uppercase">{visibility}</span>
            </div>
          </div>
        </div>
      )}

      {successMessage && !publishResult && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl flex items-center gap-2 text-xs text-emerald-300">
          <CheckCircle2 className="h-4 w-4" />
          {successMessage}
        </div>
      )}

      {/* Local AI Assistant */}
      <AIMetadataAssistant onApply={handleApplyAIMetadata} />

      {/* Media Stager */}
      <MediaStager onMediaStaged={(media) => setStagedMedia(media)} />

      {/* Post Metadata Form */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-zinc-100">YouTube Video Metadata (Editable)</h3>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <label className="font-medium text-zinc-300">Video Title *</label>
            <span className="text-zinc-500">{title.length}/100</span>
          </div>
          <Input
            placeholder="Engaging, accurate title..."
            maxLength={100}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <label className="font-medium text-zinc-300">Description *</label>
            <span className="text-zinc-500">{description.length}/5000</span>
          </div>
          <Textarea
            placeholder="Detailed description, outline, links, and hashtags..."
            rows={6}
            maxLength={5000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-300">Tags (Comma-separated)</label>
          <Input
            placeholder="nextjs, artificial intelligence, ollama, programming"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300">Category</label>
            <Select value={category} onChange={(e) => setCategory(e.target.value)}>
              {YOUTUBE_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300">Publish Visibility</label>
            <Select value={visibility} onChange={(e) => setVisibility(e.target.value as any)}>
              {YOUTUBE_PRIVACY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      {/* Schedule Settings */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-red-500" />
            Publishing Schedule & Automation Rules
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300">Target Publish Date & Time</label>
            <DateTimePicker
              value={scheduleDate}
              onChange={setScheduleDate}
              timezone={timezone}
              placeholder="Click to pick release date & time..."
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300">Creator Timezone</label>
            <Select value={timezone} onChange={(e) => setTimezone(e.target.value)}>
              {COMMON_TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {/* 2 User Options: Auto-Publish & Auto-Delete */}
        <div className="pt-2 border-t border-zinc-800 space-y-3">
          <span className="text-xs font-semibold text-zinc-200 block">
            Schedule Execution Options:
          </span>

          {/* Option 1: Directly Publish */}
          <label className="flex items-start gap-3 p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/70 hover:bg-zinc-900/80 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={autoPublish}
              onChange={(e) => setAutoPublish(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-red-600 focus:ring-red-500"
            />
            <div className="text-xs space-y-0.5">
              <span className="font-semibold text-zinc-100 flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-emerald-400" />
                Directly publish and upload when scheduled time arrives
              </span>
              <p className="text-zinc-400 leading-relaxed text-[11px]">
                {autoPublish
                  ? "Active: When the scheduled time arrives, Creator Hub will automatically publish to YouTube without waiting for button clicks."
                  : "Manual confirmation: System will wait for you to visit the site and press 'Publish Now' when scheduled time arrives."}
              </p>
            </div>
          </label>

          {/* Option 2: Directly Delete from Drive */}
          <label className="flex items-start gap-3 p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/70 hover:bg-zinc-900/80 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={autoDeleteMedia}
              onChange={(e) => setAutoDeleteMedia(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-red-600 focus:ring-red-500"
            />
            <div className="text-xs space-y-0.5">
              <span className="font-semibold text-zinc-100 flex items-center gap-1.5">
                <Trash2 className="h-3.5 w-3.5 text-rose-400" />
                Directly delete temporarily staged media file from Google Drive
              </span>
              <p className="text-zinc-400 leading-relaxed text-[11px]">
                {autoDeleteMedia
                  ? "Active: The source video file will be permanently deleted from Google Drive immediately after YouTube upload confirmation."
                  : "Manual cleanup: Staged file is retained in your Google Drive until you manually click 'Clean Drive File'."}
              </p>
            </div>
          </label>

          {/* Dynamic Email Notification Preview Notice */}
          {autoPublish && autoDeleteMedia ? (
            <div className="p-3 bg-emerald-950/20 border border-emerald-800/40 rounded-xl flex items-start gap-2.5 text-xs text-emerald-200">
              <Mail className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                <strong>Post-Upload Confirmation Email:</strong> Both automation rules are enabled, so no pre-publish alert is needed. A confirmation email with your live YouTube link will be sent to{" "}
                <strong className="text-emerald-100 font-mono">{userEmail}</strong> right after publication and Drive media purge.
              </div>
            </div>
          ) : (
            <div className="p-3 bg-amber-950/20 border border-amber-800/40 rounded-xl flex items-start gap-2.5 text-xs text-amber-200">
              <Mail className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                <strong>2-Minute Advance Action Required Alert:</strong> Because manual confirmation is enabled (
                <strong className="text-amber-100">
                  {!autoPublish && !autoDeleteMedia
                    ? "Manual Publish & Manual Drive Cleanup"
                    : !autoPublish
                    ? "Manual Publish"
                    : "Manual Drive Cleanup"}
                </strong>
                ), an email alert will be sent to <strong className="text-amber-100 font-mono">{userEmail}</strong> exactly 2 minutes before the time arrives so you can reach the site on time to click the action button.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
