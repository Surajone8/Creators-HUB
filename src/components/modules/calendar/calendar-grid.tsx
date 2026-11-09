"use client";

import { useState } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  HardDrive,
  Filter,
} from "lucide-react";
import { YouTubeIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils/formatters";

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  status: "scheduled" | "draft" | "publishing" | "published" | "failed";
  platform: "youtube";
  hasMedia: boolean;
  visibility: "public" | "unlisted" | "private";
}

const MOCK_EVENTS: CalendarEvent[] = [
  {
    id: "evt_1",
    title: "Next.js 16 Production Blueprint for Creators",
    date: "2026-11-08T10:00:00Z",
    status: "scheduled",
    platform: "youtube",
    hasMedia: true,
    visibility: "public",
  },
  {
    id: "evt_2",
    title: "Ollama vs vLLM: Choosing Your Local AI Engine",
    date: "2026-11-09T14:00:00Z",
    status: "scheduled",
    platform: "youtube",
    hasMedia: true,
    visibility: "unlisted",
  },
  {
    id: "evt_3",
    title: "Building an Autonomous Video Publishing Pipeline",
    date: "2026-11-06T18:00:00Z",
    status: "published",
    platform: "youtube",
    hasMedia: false,
    visibility: "public",
  },
];

export function CalendarGrid() {
  const [view, setView] = useState<"month" | "week" | "day">("month");
  const [events, setEvents] = useState<CalendarEvent[]>(MOCK_EVENTS);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredEvents = events.filter((e) =>
    statusFilter === "all" ? true : e.status === statusFilter
  );

  return (
    <div className="space-y-4">
      {/* Calendar Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-zinc-800 bg-zinc-900/60">
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-zinc-950 rounded-lg p-1 border border-zinc-800">
            <button
              onClick={() => setView("month")}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                view === "month" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setView("week")}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                view === "week" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setView("day")}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                view === "day" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Day
            </button>
          </div>

          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
              <ChevronRight className="h-4 w-4" />
            </Button>
            <span className="text-xs font-semibold text-zinc-200 ml-2">November 2026</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-zinc-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-8 rounded-lg border border-zinc-700 bg-zinc-950 px-2.5 text-xs text-zinc-200"
          >
            <option value="all">All Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="published">Published</option>
            <option value="draft">Drafts</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Schedule Items List / Cards */}
      <div className="space-y-3">
        {filteredEvents.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-zinc-700 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-red-500 mt-0.5">
                <YouTubeIcon className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-semibold text-zinc-100">{item.title}</h4>
                  <Badge
                    variant={
                      item.status === "published"
                        ? "success"
                        : item.status === "scheduled"
                        ? "info"
                        : "warning"
                    }
                  >
                    {item.status.toUpperCase()}
                  </Badge>
                  <span className="text-[10px] text-zinc-500 uppercase px-1.5 py-0.5 rounded bg-zinc-800/80">
                    {item.visibility}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-zinc-400">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-zinc-500" />
                    {formatDate(item.date)}
                  </span>
                  {item.hasMedia && (
                    <span className="flex items-center gap-1 text-emerald-400">
                      <HardDrive className="h-3.5 w-3.5" />
                      Drive Media Staged
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end md:self-auto">
              {item.status === "scheduled" && (
                <Button variant="outline" size="sm" className="text-xs">
                  Reschedule
                </Button>
              )}
              <Button variant="secondary" size="sm" className="text-xs">
                Inspect
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
