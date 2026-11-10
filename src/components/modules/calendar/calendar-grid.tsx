"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  HardDrive,
  Filter,
  RefreshCw,
  Plus,
  ExternalLink,
  X,
  AlertTriangle,
  CheckCircle2,
  CalendarCheck,
  CalendarX,
  Send,
  Trash2,
  Mail,
  Zap,
} from "lucide-react";
import Link from "next/link";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  parseISO,
} from "date-fns";
import { YouTubeIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { toast } from "@/components/ui/toast";
import { formatDate } from "@/lib/utils/formatters";
import { CalendarEventItem } from "@/types/schedule";

export function CalendarGrid() {
  // Initialize with fixed reference date to satisfy Next.js 16 prerender time guard
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date(2026, 10, 1));
  const [todayDate, setTodayDate] = useState<Date | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [view, setView] = useState<"month" | "list">("month");
  const [events, setEvents] = useState<CalendarEventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Inspect Modal State
  const [inspectEvent, setInspectEvent] = useState<CalendarEventItem | null>(null);

  // Reschedule Modal State
  const [rescheduleEvent, setRescheduleEvent] = useState<CalendarEventItem | null>(null);
  const [newScheduleDate, setNewScheduleDate] = useState("");
  const [rescheduleAutoPublish, setRescheduleAutoPublish] = useState(true);
  const [rescheduleAutoDeleteMedia, setRescheduleAutoDeleteMedia] = useState(true);
  const [isRescheduling, setIsRescheduling] = useState(false);

  // Cancel Schedule State
  const [isCancelling, setIsCancelling] = useState<string | null>(null);

  // Immediate Publish State
  const [isPublishingNow, setIsPublishingNow] = useState<string | null>(null);

  // Drive Cleanup State
  const [isCleaningDrive, setIsCleaningDrive] = useState<string | null>(null);

  const fetchSchedules = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/schedules");
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to retrieve schedules.");
      }
      setEvents(json.data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error connecting to database.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const liveNow = new Date();
    setTodayDate(liveNow);
    setCurrentDate(liveNow);
    fetchSchedules();
  }, [fetchSchedules]);

  // Listen to Global Publishing Heartbeat schedule updates
  useEffect(() => {
    function handleGlobalUpdate() {
      fetchSchedules();
    }
    window.addEventListener("creator-hub-schedules-updated", handleGlobalUpdate);
    return () => {
      window.removeEventListener("creator-hub-schedules-updated", handleGlobalUpdate);
    };
  }, [fetchSchedules]);

  // Periodic UI refresh to keep schedule status badges up to date
  // Note: Automated upload and email dispatching is handled globally by PublishingHeartbeat in DashboardLayout
  useEffect(() => {
    const interval = setInterval(() => {
      fetchSchedules();
    }, 15000);

    return () => clearInterval(interval);
  }, [fetchSchedules]);

  // Calendar Grid Days Calculation
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentDate]);

  // Filter events by status & selected day
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      // Status filter
      if (statusFilter !== "all" && e.status !== statusFilter) {
        return false;
      }
      // Selected day filter
      if (selectedDate) {
        try {
          const itemDate = parseISO(e.targetPublishTime);
          if (!isSameDay(itemDate, selectedDate)) {
            return false;
          }
        } catch {
          return false;
        }
      }
      return true;
    });
  }, [events, statusFilter, selectedDate]);

  // Handle Publish Now for Due/Immediate Schedules
  async function handlePublishNow(scheduleId: string) {
    setIsPublishingNow(scheduleId);
    try {
      const res = await fetch("/api/publishing/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduleId }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to trigger publishing.");
      }

      const outcome = json.data?.results?.[0];
      if (outcome && !outcome.success) {
        throw new Error(outcome.error || "Publishing job failed.");
      }

      toast.success("Publish Initiated", "Video publishing process dispatched to YouTube.");
      await fetchSchedules();
      if (inspectEvent?.id === scheduleId) {
        setInspectEvent(null);
      }
    } catch (err: unknown) {
      toast.error("Publish Failed", err instanceof Error ? err.message : "Publish request failed.");
    } finally {
      setIsPublishingNow(null);
    }
  }

  // Handle Reschedule Submit
  async function handleRescheduleSubmit() {
    if (!rescheduleEvent || !newScheduleDate) return;

    setIsRescheduling(true);
    try {
      const res = await fetch(`/api/schedules/${rescheduleEvent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetPublishTime: newScheduleDate,
          displayTimezone: rescheduleEvent.displayTimezone,
          autoPublish: rescheduleAutoPublish,
          autoDeleteMedia: rescheduleAutoDeleteMedia,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to update schedule date.");
      }

      toast.success("Schedule Updated", `"${rescheduleEvent.title}" rescheduled successfully!`);
      setRescheduleEvent(null);
      setNewScheduleDate("");
      await fetchSchedules();
    } catch (err: unknown) {
      toast.error("Reschedule Failed", err instanceof Error ? err.message : "Reschedule failed.");
    } finally {
      setIsRescheduling(false);
    }
  }

  // Handle Cancel Schedule
  async function handleCancelSchedule(id: string) {
    if (!confirm("Are you sure you want to cancel this scheduled publishing job?")) {
      return;
    }

    setIsCancelling(id);
    try {
      const res = await fetch(`/api/schedules/${id}/cancel`, {
        method: "POST",
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to cancel schedule.");
      }

      toast.info("Schedule Cancelled", "The scheduled release was cancelled.");
      await fetchSchedules();
      if (inspectEvent?.id === id) {
        setInspectEvent(null);
      }
    } catch (err: unknown) {
      toast.error("Cancel Failed", err instanceof Error ? err.message : "Cancel request failed.");
    } finally {
      setIsCancelling(null);
    }
  }

  // Handle Manual Clean Staged Drive File
  async function handleCleanStagedDriveFile(item: CalendarEventItem) {
    if (!item.driveFileId) return;
    if (!confirm(`Are you sure you want to purge "${item.fileName || item.driveFileId}" from Google Drive? This will clear temporary staged video bytes.`)) {
      return;
    }

    setIsCleaningDrive(item.id);
    try {
      const res = await fetch("/api/media/delete-staged", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driveFileId: item.driveFileId,
          mediaAssetId: item.mediaAssetId,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Drive Cleaned", "Temporary staged video successfully cleaned up from Google Drive!");
        await fetchSchedules();
        if (inspectEvent?.id === item.id) {
          setInspectEvent((prev) => (prev ? { ...prev, mediaCleanupStatus: "deleted" } : null));
        }
      } else {
        if (data.data?.activationUrl) {
          window.open(data.data.activationUrl, "_blank");
          toast.warning("Google Drive API Disabled", "An activation page has been opened in a new tab. Please click 'Enable' then retry.");
        } else {
          toast.error("Drive Cleanup Failed", data.error?.message || "Failed to purge file from Google Drive. Please ensure your Google Drive is connected under Connected Accounts.");
        }
      }
    } catch {
      toast.error("Network Error", "Network request failed while attempting Drive cleanup.");
    } finally {
      setIsCleaningDrive(null);
    }
  }

  function getStatusConfig(status: string, isDue?: boolean, autoPublish?: boolean) {
    const normalized = (status || "").toLowerCase();

    if (normalized === "published" || normalized === "completed") {
      return {
        label: "PUBLISHED",
        badgeVariant: "success" as const,
        chipStyle: "bg-emerald-950/80 text-emerald-300 border-emerald-800/60 hover:bg-emerald-900/60",
        dotColor: "bg-emerald-400",
        description: "Successfully published to YouTube",
      };
    }

    if (normalized === "scheduled") {
      if (isDue) {
        return {
          label: autoPublish === false ? "DUE (AWAITING CLICK)" : "DUE FOR PUBLISH",
          badgeVariant: "warning" as const,
          chipStyle: "bg-amber-950/90 text-amber-200 border-amber-800/80 animate-pulse hover:bg-amber-900/80",
          dotColor: "bg-amber-400",
          description: autoPublish === false ? "Scheduled time reached; awaiting creator click" : "Scheduled time reached; dispatching upload",
        };
      }
      return {
        label: autoPublish === false ? "SCHEDULED (MANUAL)" : "SCHEDULED (AUTO)",
        badgeVariant: "info" as const,
        chipStyle: "bg-blue-950/80 text-blue-300 border-blue-800/60 hover:bg-blue-900/60",
        dotColor: "bg-blue-400",
        description: autoPublish === false ? "Queued; waiting for creator trigger at target time" : "Queued for automated future release",
      };
    }

    if (normalized === "publishing" || normalized === "in_progress") {
      return {
        label: "PUBLISHING",
        badgeVariant: "warning" as const,
        chipStyle: "bg-purple-950/80 text-purple-300 border-purple-800/60 animate-pulse hover:bg-purple-900/60",
        dotColor: "bg-purple-400",
        description: "Currently streaming bytes to YouTube",
      };
    }

    if (normalized === "cancelled") {
      return {
        label: "CANCELLED",
        badgeVariant: "outline" as const,
        chipStyle: "bg-zinc-950/80 text-zinc-500 border-zinc-800 line-through opacity-75",
        dotColor: "bg-zinc-600",
        description: "Cancelled by creator",
      };
    }

    if (normalized === "failed") {
      return {
        label: "FAILED",
        badgeVariant: "danger" as const,
        chipStyle: "bg-rose-950/80 text-rose-300 border-rose-800/70 hover:bg-rose-900/60",
        dotColor: "bg-rose-500",
        description: "Upload failed; Drive staging safely retained for retry",
      };
    }

    if (normalized === "draft") {
      return {
        label: "DRAFT",
        badgeVariant: "default" as const,
        chipStyle: "bg-zinc-900 text-zinc-400 border-zinc-800",
        dotColor: "bg-zinc-500",
        description: "Draft concept saved in workspace",
      };
    }

    return {
      label: status.toUpperCase(),
      badgeVariant: "default" as const,
      chipStyle: "bg-zinc-900 text-zinc-400 border-zinc-800",
      dotColor: "bg-zinc-500",
      description: "Standard status",
    };
  }

  return (
    <div className="space-y-6">
      {/* Calendar Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-sm shadow-sm">
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center bg-zinc-950 rounded-xl p-1 border border-zinc-800">
            <button
              onClick={() => setView("month")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                view === "month" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Month View
            </button>
            <button
              onClick={() => setView("list")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                view === "list" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              List View
            </button>
          </div>

          {/* Month Steppers */}
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate((d) => subMonths(d, 1))}
              className="h-8 w-8 p-0"
              aria-label="Previous Month"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate((d) => addMonths(d, 1))}
              className="h-8 w-8 p-0"
              aria-label="Next Month"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const now = new Date();
                setCurrentDate(now);
                setSelectedDate(now);
              }}
              className="text-xs text-zinc-400 hover:text-zinc-100"
            >
              Today
            </Button>
            <span className="text-sm font-semibold text-zinc-100 ml-1">
              {format(currentDate, "MMMM yyyy")}
            </span>
          </div>
        </div>

        {/* Right Actions: Filter, Refresh, Schedule New */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-zinc-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-8 rounded-lg border border-zinc-700 bg-zinc-950 px-2.5 text-xs text-zinc-200 focus:outline-none focus:border-red-500"
            >
              <option value="all">All Statuses ({events.length})</option>
              <option value="scheduled">Scheduled</option>
              <option value="published">Published</option>
              <option value="cancelled">Cancelled</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchSchedules}
            isLoading={isLoading}
            className="h-8 px-2.5 gap-1 text-xs"
            title="Refresh database schedules"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Link href="/studio">
            <Button
              size="sm"
              className="h-8 px-3 gap-1.5 text-xs bg-red-600 hover:bg-red-700 text-white shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              Schedule Post
            </Button>
          </Link>
        </div>
      </div>

      {/* Status Legend Strip */}
      <div className="flex flex-wrap items-center gap-3 px-3.5 py-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800 text-xs text-zinc-400">
        <span className="font-semibold text-zinc-200">Status Guide:</span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-blue-400" />
          <strong className="text-zinc-300">Scheduled:</strong> Queued for future
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
          <strong className="text-amber-300">Due:</strong> Ready to dispatch
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-purple-400 animate-pulse" />
          <strong className="text-purple-300">Publishing:</strong> Uploading
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <strong className="text-emerald-300">Published:</strong> Live on YouTube
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-zinc-600" />
          <strong className="text-zinc-400">Cancelled:</strong> Dismissed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-rose-500" />
          <strong className="text-rose-400">Failed:</strong> Retry required
        </span>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl border border-rose-800/80 bg-rose-950/50 flex items-center justify-between text-xs text-rose-300">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={fetchSchedules} className="h-7 text-xs border-rose-700">
            Retry
          </Button>
        </div>
      )}

      {/* Month View Grid */}
      {view === "month" && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-2">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-zinc-400 uppercase tracking-wider py-1 border-b border-zinc-800/80">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Days Cells */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day) => {
              const dateStr = format(day, "yyyy-MM-dd");
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isToday = todayDate ? isSameDay(day, todayDate) : false;
              const isSelected = selectedDate && isSameDay(day, selectedDate);

              // Find events on this day
              const dayEvents = events.filter((e) => {
                try {
                  return isSameDay(parseISO(e.targetPublishTime), day);
                } catch {
                  return false;
                }
              });

              return (
                <div
                  key={dateStr}
                  onClick={() => {
                    setSelectedDate(isSelected ? null : day);
                  }}
                  className={`min-h-[92px] p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? "border-red-500 bg-zinc-900 shadow-md ring-1 ring-red-500/50"
                      : isToday
                      ? "border-zinc-700 bg-zinc-900/80"
                      : isCurrentMonth
                      ? "border-zinc-800/80 bg-zinc-950/50 hover:bg-zinc-900/60 hover:border-zinc-700"
                      : "border-zinc-900 bg-zinc-950/20 opacity-40 hover:opacity-75"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-semibold ${
                        isToday
                          ? "h-5 w-5 rounded-full bg-red-600 text-white flex items-center justify-center font-bold"
                          : isSelected
                          ? "text-red-400"
                          : "text-zinc-300"
                      }`}
                    >
                      {format(day, "d")}
                    </span>

                    {dayEvents.length > 0 && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
                        {dayEvents.length}
                      </span>
                    )}
                  </div>

                  {/* Event Badges / Chips inside the day cell */}
                  <div className="space-y-1 mt-1">
                    {dayEvents.slice(0, 2).map((ev) => {
                      const evIsDue =
                        ev.status === "scheduled" &&
                        todayDate !== null &&
                        new Date(ev.targetPublishTime).getTime() <= new Date().getTime();
                      const config = getStatusConfig(ev.status, !!evIsDue, ev.autoPublish);

                      return (
                        <div
                          key={ev.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setInspectEvent(ev);
                          }}
                          className={`truncate text-[10px] px-1.5 py-0.5 rounded font-medium flex items-center gap-1 border transition-transform hover:scale-[1.02] ${config.chipStyle}`}
                          title={`${ev.title} (${config.label})`}
                        >
                          <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${config.dotColor}`} />
                          <span className="truncate">{ev.title}</span>
                        </div>
                      );
                    })}
                    {dayEvents.length > 2 && (
                      <span className="text-[9px] text-zinc-400 block pl-1">
                        +{dayEvents.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Day Filter Badge */}
      {selectedDate && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-200">
          <div className="flex items-center gap-2">
            <CalendarCheck className="h-4 w-4 text-red-400" />
            <span>
              Showing schedules for <strong>{format(selectedDate, "MMMM d, yyyy")}</strong> ({filteredEvents.length} video{filteredEvents.length === 1 ? "" : "s"})
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedDate(null)}
            className="h-6 px-2 text-[11px] text-zinc-400 hover:text-zinc-100"
          >
            Clear day filter
          </Button>
        </div>
      )}

      {/* Schedule Items List */}
      <div className="space-y-3">
        {isLoading && events.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-zinc-800 bg-zinc-900/30 space-y-3">
            <div className="animate-spin h-6 w-6 border-2 border-red-500 border-t-transparent rounded-full mx-auto" />
            <p className="text-xs text-zinc-400">Loading schedules from database...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-zinc-800 bg-zinc-900/30 space-y-3">
            <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 w-fit mx-auto text-zinc-500">
              <CalendarIcon className="h-8 w-8" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-zinc-200">No scheduled videos found</h4>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1">
                {selectedDate
                  ? `There are no scheduled releases on ${format(selectedDate, "MMM d, yyyy")}.`
                  : statusFilter !== "all"
                  ? `No videos match the status filter "${statusFilter}".`
                  : "Plan your next YouTube upload in Content Studio to schedule automatic publishing."}
              </p>
            </div>
            <Link href="/studio">
              <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white text-xs gap-1.5 mt-2">
                <Plus className="h-3.5 w-3.5" />
                Schedule a Video in Studio
              </Button>
            </Link>
          </div>
        ) : (
          filteredEvents.map((item) => {
            const isDue =
              item.status === "scheduled" &&
              todayDate !== null &&
              new Date(item.targetPublishTime).getTime() <= new Date().getTime();

            const config = getStatusConfig(item.status, !!isDue, item.autoPublish);

            return (
              <div
                key={item.id}
                className={`rounded-2xl border p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors shadow-sm ${
                  isDue
                    ? "border-amber-800/80 bg-amber-950/15"
                    : "border-zinc-800 bg-zinc-900/60 hover:border-zinc-700"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-red-500 mt-0.5 shrink-0 shadow-inner">
                    <YouTubeIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h4 className="text-sm font-semibold text-zinc-100">{item.title}</h4>
                      <Badge variant={config.badgeVariant}>{config.label}</Badge>
                      <span className="text-[10px] text-zinc-400 uppercase px-2 py-0.5 rounded bg-zinc-800/80 font-mono">
                        {item.visibility}
                      </span>

                      {/* Automation Options Badges */}
                      {item.autoPublish ? (
                        <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-1.5 py-0.5 rounded flex items-center gap-1 font-medium">
                          <Zap className="h-2.5 w-2.5" /> Auto-Publish
                        </span>
                      ) : (
                        <span className="text-[10px] text-amber-400 bg-amber-950/60 border border-amber-800/60 px-1.5 py-0.5 rounded font-medium">
                          Manual Publish
                        </span>
                      )}

                      {item.autoDeleteMedia ? (
                        <span className="text-[10px] text-zinc-400 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded">
                          Auto-Cleanup
                        </span>
                      ) : (
                        <span className="text-[10px] text-sky-400 bg-sky-950/60 border border-sky-800/60 px-1.5 py-0.5 rounded font-medium">
                          Manual Drive Cleanup
                        </span>
                      )}

                      {item.youtubeVideoId && (
                        <a
                          href={`https://youtu.be/${item.youtubeVideoId}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-red-400 hover:underline flex items-center gap-0.5"
                        >
                          Watch
                          <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400">
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-zinc-500" />
                        {formatDate(item.targetPublishTime)}
                        <span className="text-[10px] text-zinc-500 font-mono">
                          ({item.displayTimezone})
                        </span>
                      </span>

                      {/* Email Alert Indicator */}
                      {item.status === "scheduled" && (
                        <span className="flex items-center gap-1 text-[11px]">
                          <Mail className="h-3 w-3 text-amber-400" />
                          <span
                            className={
                              item.autoPublish && item.autoDeleteMedia
                                ? "text-emerald-400"
                                : item.notifyEmailSent
                                ? "text-emerald-400"
                                : "text-amber-300"
                            }
                          >
                            {item.autoPublish && item.autoDeleteMedia
                              ? "Post-Upload Email Armed"
                              : item.notifyEmailSent
                              ? "2m Alert Sent"
                              : "2m Alert Armed"}
                          </span>
                        </span>
                      )}
                      {(item.status === "completed" || item.status === "published") && (
                        <span className="flex items-center gap-1 text-[11px]">
                          <Mail className="h-3 w-3 text-emerald-400" />
                          <span className={item.postPublishEmailSent ? "text-emerald-400" : "text-zinc-500"}>
                            {item.postPublishEmailSent ? "Receipt Emailed" : "Direct Release"}
                          </span>
                        </span>
                      )}

                      {item.hasMedia ? (
                        item.mediaCleanupStatus === "deleted" ? (
                          <span className="flex items-center gap-1 text-zinc-500 line-through">
                            <HardDrive className="h-3.5 w-3.5 text-zinc-600" />
                            Drive Cleaned ({item.fileName || "video.mp4"})
                          </span>
                        ) : (item.status === "completed" || item.status === "published") ? (
                          <span className="flex items-center gap-1 text-amber-400">
                            <HardDrive className="h-3.5 w-3.5 text-amber-400" />
                            Drive Staged ({item.fileName || "video.mp4"}) • Pending Cleanup
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-emerald-400">
                            <HardDrive className="h-3.5 w-3.5" />
                            Drive Staged ({item.fileName || "video.mp4"})
                          </span>
                        )
                      ) : (
                        <span className="text-zinc-500">No media staged</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                  {(item.status === "completed" || item.status === "published") && item.hasMedia && item.mediaCleanupStatus !== "deleted" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCleanStagedDriveFile(item)}
                      isLoading={isCleaningDrive === item.id}
                      className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border-rose-900/50"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      Clean Drive File
                    </Button>
                  )}

                  {item.status === "scheduled" && (
                    <>
                      {isDue && (
                        <Button
                          size="sm"
                          onClick={() => handlePublishNow(item.id)}
                          isLoading={isPublishingNow === item.id}
                          className="text-xs bg-red-600 hover:bg-red-700 text-white font-semibold gap-1.5 shadow-sm"
                        >
                          <Send className="h-3.5 w-3.5" />
                          Publish Now
                        </Button>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setRescheduleEvent(item);
                          setNewScheduleDate(item.targetPublishTime.slice(0, 16));
                          setRescheduleAutoPublish(item.autoPublish !== false);
                          setRescheduleAutoDeleteMedia(item.autoDeleteMedia !== false);
                        }}
                        className="text-xs"
                      >
                        Reschedule
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancelSchedule(item.id)}
                        isLoading={isCancelling === item.id}
                        className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40"
                      >
                        Cancel
                      </Button>
                    </>
                  )}

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setInspectEvent(item)}
                    className="text-xs"
                  >
                    Inspect
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Inspect Modal */}
      {inspectEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 w-full max-w-lg p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <YouTubeIcon className="h-5 w-5 text-red-500" />
                <h3 className="text-base font-semibold text-zinc-100">Schedule Details</h3>
              </div>
              <button
                onClick={() => setInspectEvent(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-zinc-500 block mb-0.5">Title</span>
                <p className="font-semibold text-zinc-100 text-sm">{inspectEvent.title}</p>
              </div>

              {inspectEvent.description && (
                <div>
                  <span className="text-zinc-500 block mb-0.5">Description</span>
                  <p className="text-zinc-300 bg-zinc-900 p-2.5 rounded-lg border border-zinc-800 whitespace-pre-wrap max-h-32 overflow-y-auto">
                    {inspectEvent.description}
                  </p>
                </div>
              )}

              {inspectEvent.tags && inspectEvent.tags.length > 0 && (
                <div>
                  <span className="text-zinc-500 block mb-1">Tags</span>
                  <div className="flex flex-wrap gap-1">
                    {inspectEvent.tags.map((t) => (
                      <span key={t} className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 text-[10px]">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-800/80">
                <div>
                  <span className="text-zinc-500 block mb-0.5">Target Time</span>
                  <span className="font-medium text-zinc-200">{formatDate(inspectEvent.targetPublishTime)}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block mb-0.5">Status</span>
                  <div>
                    <Badge variant={getStatusConfig(inspectEvent.status).badgeVariant}>
                      {getStatusConfig(inspectEvent.status).label}
                    </Badge>
                  </div>
                </div>
                <div>
                  <span className="text-zinc-500 block mb-0.5">Visibility</span>
                  <span className="font-medium text-zinc-200 uppercase">{inspectEvent.visibility}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block mb-0.5">Google Drive Media</span>
                  <span className="font-medium text-zinc-200">
                    {inspectEvent.driveFileId ? (
                      <div className="space-y-0.5">
                        <span
                          className={`font-mono text-[11px] truncate block ${
                            inspectEvent.mediaCleanupStatus === "deleted"
                              ? "line-through text-zinc-500"
                              : "text-emerald-400"
                          }`}
                          title={inspectEvent.driveFileId}
                        >
                          {inspectEvent.fileName || inspectEvent.driveFileId}
                        </span>
                        <span className="text-[10px] text-zinc-400 block">
                          Cleanup Status:{" "}
                          <strong
                            className={
                              inspectEvent.mediaCleanupStatus === "deleted"
                                ? "text-zinc-400"
                                : "text-amber-400"
                            }
                          >
                            {inspectEvent.mediaCleanupStatus === "deleted"
                              ? "SAFELY DELETED"
                              : "PENDING PURGE"}
                          </strong>
                        </span>
                      </div>
                    ) : (
                      "None"
                    )}
                  </span>
                </div>

                {/* Automation Rules in Inspect Modal */}
                <div className="col-span-2 pt-2 border-t border-zinc-800/80 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-zinc-500 block mb-0.5">Auto-Publish Rule</span>
                    <span className="font-medium text-zinc-200">
                      {inspectEvent.autoPublish ? (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <Zap className="h-3 w-3" /> Auto-Publish Active
                        </span>
                      ) : (
                        <span className="text-amber-400 font-semibold">
                          ⚠️ Manual Publish Required
                        </span>
                      )}
                    </span>
                  </div>

                  <div>
                    <span className="text-zinc-500 block mb-0.5">Google Drive Cleanup Rule</span>
                    <span className="font-medium text-zinc-200">
                      {inspectEvent.autoDeleteMedia ? (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <Trash2 className="h-3 w-3" /> Auto-Purge Post-Upload
                        </span>
                      ) : (
                        <span className="text-sky-300 font-semibold">
                          Manual Drive Cleanup Required
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="col-span-2 p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs flex items-center justify-between">
                    <span className="text-zinc-400 flex items-center gap-1.5 text-[11px]">
                      <Mail className="h-3.5 w-3.5 text-amber-400" />
                      {inspectEvent.autoPublish && inspectEvent.autoDeleteMedia
                        ? "Post-Upload Confirmation Receipt:"
                        : "2-Minute Advance Action Required Alert:"}
                    </span>
                    <span
                      className={`text-[11px] font-medium ${
                        (inspectEvent.autoPublish && inspectEvent.autoDeleteMedia && inspectEvent.postPublishEmailSent) ||
                        ((!inspectEvent.autoPublish || !inspectEvent.autoDeleteMedia) && inspectEvent.notifyEmailSent)
                          ? "text-emerald-400"
                          : "text-amber-300"
                      }`}
                    >
                      {inspectEvent.autoPublish && inspectEvent.autoDeleteMedia
                        ? inspectEvent.postPublishEmailSent
                          ? `Delivered to ${inspectEvent.notifyEmailTarget || "Creator"}`
                          : `Armed (Will send after upload to ${inspectEvent.notifyEmailTarget || "Creator"})`
                        : inspectEvent.notifyEmailSent
                        ? `Dispatched to ${inspectEvent.notifyEmailTarget || "Creator"}`
                        : `Armed (Will send 2m prior to ${inspectEvent.notifyEmailTarget || "Creator"})`}
                    </span>
                  </div>
                </div>
              </div>

              {inspectEvent.youtubeVideoId && (
                <div className="p-3 rounded-xl bg-red-950/30 border border-red-800/50 flex items-center justify-between">
                  <span className="text-red-300">YouTube Video: {inspectEvent.youtubeVideoId}</span>
                  <a
                    href={`https://youtu.be/${inspectEvent.youtubeVideoId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs bg-red-600 hover:bg-red-700 text-white px-2.5 py-1 rounded"
                  >
                    Open <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              {(inspectEvent.status === "completed" || inspectEvent.status === "published") &&
                inspectEvent.hasMedia &&
                inspectEvent.mediaCleanupStatus !== "deleted" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCleanStagedDriveFile(inspectEvent)}
                    isLoading={isCleaningDrive === inspectEvent.id}
                    className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border-rose-900/50"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Clean Staged Drive File
                  </Button>
                )}
              {inspectEvent.status === "scheduled" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setRescheduleEvent(inspectEvent);
                    setNewScheduleDate(inspectEvent.targetPublishTime.slice(0, 16));
                    setRescheduleAutoPublish(inspectEvent.autoPublish !== false);
                    setRescheduleAutoDeleteMedia(inspectEvent.autoDeleteMedia !== false);
                    setInspectEvent(null);
                  }}
                  className="text-xs"
                >
                  Reschedule
                </Button>
              )}
              <Button variant="secondary" size="sm" onClick={() => setInspectEvent(null)} className="text-xs">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-semibold text-zinc-100">Reschedule Video</h3>
              <button
                onClick={() => setRescheduleEvent(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Select a new target date and time to publish <strong>{rescheduleEvent.title}</strong>:
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">New Target Publish Time</label>
              <DateTimePicker
                value={newScheduleDate}
                onChange={setNewScheduleDate}
                timezone={rescheduleEvent.displayTimezone}
                placeholder="Pick new release date & time..."
              />
            </div>

            <div className="space-y-2 pt-2 border-t border-zinc-800">
              <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rescheduleAutoPublish}
                  onChange={(e) => setRescheduleAutoPublish(e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-900 text-red-600 focus:ring-red-500"
                />
                <span>Directly publish & upload at scheduled time</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rescheduleAutoDeleteMedia}
                  onChange={(e) => setRescheduleAutoDeleteMedia(e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-900 text-red-600 focus:ring-red-500"
                />
                <span>Directly delete staged media from Drive post-upload</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRescheduleEvent(null)}
                className="text-xs text-zinc-400"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleRescheduleSubmit}
                isLoading={isRescheduling}
                className="text-xs bg-red-600 hover:bg-red-700 text-white"
              >
                Save Schedule
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
