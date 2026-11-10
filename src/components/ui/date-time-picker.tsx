"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  Sparkles,
} from "lucide-react";
import {
  format,
  addDays,
  addHours,
  addMinutes,
  setHours,
  setMinutes,
  isSameDay,
  isBefore,
  startOfToday,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  parseISO,
} from "date-fns";
import { cn } from "@/lib/utils/cn";

export interface DateTimePickerProps {
  value: string; // ISO string or "YYYY-MM-DDTHH:mm"
  onChange: (value: string) => void;
  timezone?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function DateTimePicker({
  value,
  onChange,
  timezone,
  placeholder = "Select date & time...",
  className,
  disabled = false,
}: DateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse current value or fallback
  const currentDate = useMemo(() => {
    if (!value) return null;
    try {
      const d = parseISO(value);
      return isNaN(d.getTime()) ? null : d;
    } catch {
      return null;
    }
  }, [value]);

  // Calendar navigation state: initialize with deterministic date to satisfy Next.js 16 prerender
  const [viewMonth, setViewMonth] = useState<Date>(
    () => currentDate || new Date(2026, 10, 1)
  );

  // Temporary selection inside popover
  const [selectedDay, setSelectedDay] = useState<Date>(
    () => currentDate || new Date(2026, 10, 1)
  );

  const [todayDate, setTodayDate] = useState<Date | null>(null);

  // 12-hour format time state
  const [hour12, setHour12] = useState<number>(() => {
    if (!currentDate) return 12;
    const h = currentDate.getHours();
    return h === 0 ? 12 : h > 12 ? h - 12 : h;
  });

  const [minute, setMinute] = useState<number>(() => {
    return currentDate ? currentDate.getMinutes() : 0;
  });

  const [period, setPeriod] = useState<"AM" | "PM">(() => {
    if (!currentDate) return "PM";
    return currentDate.getHours() >= 12 ? "PM" : "AM";
  });

  // Client-side hydration of current time
  useEffect(() => {
    const now = new Date();
    setTodayDate(startOfToday());
    if (!currentDate) {
      setViewMonth(now);
      setSelectedDay(now);
      const h = now.getHours();
      setHour12(h === 0 ? 12 : h > 12 ? h - 12 : h);
      setMinute(now.getMinutes());
      setPeriod(h >= 12 ? "PM" : "AM");
    }
  }, [currentDate]);

  // Sync internal state when prop `value` changes
  useEffect(() => {
    if (currentDate) {
      setSelectedDay(currentDate);
      setViewMonth(currentDate);
      const h = currentDate.getHours();
      setHour12(h === 0 ? 12 : h > 12 ? h - 12 : h);
      setMinute(currentDate.getMinutes());
      setPeriod(h >= 12 ? "PM" : "AM");
    }
  }, [currentDate]);

  // Close on click outside or Escape
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Calendar grid calculation
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(viewMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [viewMonth]);

  // Convert 12-hour + AM/PM back to 24-hour Date and format string
  const assembleDateTime = (day: Date, h12: number, min: number, ampm: "AM" | "PM"): string => {
    let hours24 = h12;
    if (ampm === "PM" && h12 < 12) hours24 = h12 + 12;
    if (ampm === "AM" && h12 === 12) hours24 = 0;

    let target = setHours(day, hours24);
    target = setMinutes(target, min);
    return format(target, "yyyy-MM-dd'T'HH:mm");
  };

  const handleApply = () => {
    const formatted = assembleDateTime(selectedDay, hour12, minute, period);
    onChange(formatted);
    setIsOpen(false);
  };

  // Quick Presets
  const applyPreset = (presetDate: Date) => {
    const formatted = format(presetDate, "yyyy-MM-dd'T'HH:mm");
    onChange(formatted);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border transition-all text-left cursor-pointer",
          "bg-zinc-950/80 hover:bg-zinc-900/90 border-zinc-800 hover:border-zinc-700 shadow-sm",
          isOpen && "border-red-500/80 ring-2 ring-red-500/20 bg-zinc-900",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded-lg bg-red-950/50 border border-red-900/40 text-red-400 shrink-0">
            <CalendarIcon className="h-4 w-4" />
          </div>
          <div className="truncate">
            {currentDate ? (
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-semibold text-zinc-100">
                  {format(currentDate, "MMM d, yyyy")}
                </span>
                <span className="text-xs font-medium text-red-400 font-mono">
                  {format(currentDate, "hh:mm a")}
                </span>
                {timezone && (
                  <span className="text-[10px] text-zinc-500 font-mono hidden sm:inline">
                    ({timezone})
                  </span>
                )}
              </div>
            ) : (
              <span className="text-xs text-zinc-500 font-normal">
                {placeholder}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {currentDate && !disabled && (
            <span
              role="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              title="Clear selection"
              className="p-1 rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
          <Clock className="h-3.5 w-3.5 text-zinc-500" />
        </div>
      </button>

      {/* Floating Modern Date-Time Popover */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="absolute left-0 sm:left-auto right-0 top-full mt-2 z-50 w-full sm:w-[380px] rounded-2xl border border-zinc-800 bg-zinc-950/98 backdrop-blur-xl p-4 shadow-2xl space-y-4 animate-in fade-in slide-in-from-top-2"
        >
          {/* Header & Quick Presets */}
          <div className="space-y-2 pb-3 border-b border-zinc-800/80">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold tracking-wider text-zinc-400 uppercase flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-red-400" />
                Quick Presets
              </span>
              {timezone && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono">
                  {timezone}
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-1.5 text-[11px]">
              <button
                type="button"
                onClick={() => applyPreset(addMinutes(new Date(), 15))}
                className="px-2 py-1.5 rounded-lg bg-zinc-900/80 hover:bg-red-950/60 hover:text-red-300 hover:border-red-900/50 border border-zinc-800 text-zinc-300 transition-colors text-center font-medium"
              >
                +15 Mins
              </button>
              <button
                type="button"
                onClick={() => applyPreset(addHours(new Date(), 1))}
                className="px-2 py-1.5 rounded-lg bg-zinc-900/80 hover:bg-red-950/60 hover:text-red-300 hover:border-red-900/50 border border-zinc-800 text-zinc-300 transition-colors text-center font-medium"
              >
                +1 Hour
              </button>
              <button
                type="button"
                onClick={() => applyPreset(addHours(new Date(), 3))}
                className="px-2 py-1.5 rounded-lg bg-zinc-900/80 hover:bg-red-950/60 hover:text-red-300 hover:border-red-900/50 border border-zinc-800 text-zinc-300 transition-colors text-center font-medium"
              >
                +3 Hours
              </button>
              <button
                type="button"
                onClick={() => {
                  const tm = setMinutes(setHours(addDays(new Date(), 1), 9), 0);
                  applyPreset(tm);
                }}
                className="px-2 py-1.5 rounded-lg bg-zinc-900/80 hover:bg-red-950/60 hover:text-red-300 hover:border-red-900/50 border border-zinc-800 text-zinc-300 transition-colors text-center font-medium"
              >
                Tomorrow 9 AM
              </button>
              <button
                type="button"
                onClick={() => {
                  const tm = setMinutes(setHours(addDays(new Date(), 1), 17), 0);
                  applyPreset(tm);
                }}
                className="px-2 py-1.5 rounded-lg bg-zinc-900/80 hover:bg-red-950/60 hover:text-red-300 hover:border-red-900/50 border border-zinc-800 text-zinc-300 transition-colors text-center font-medium"
              >
                Tomorrow 5 PM
              </button>
              <button
                type="button"
                onClick={() => {
                  const tm = setMinutes(setHours(addDays(new Date(), 2), 12), 0);
                  applyPreset(tm);
                }}
                className="px-2 py-1.5 rounded-lg bg-zinc-900/80 hover:bg-red-950/60 hover:text-red-300 hover:border-red-900/50 border border-zinc-800 text-zinc-300 transition-colors text-center font-medium"
              >
                In 2 Days
              </button>
            </div>
          </div>

          {/* Calendar Month Selector & Controls */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-semibold text-zinc-100">
                {format(viewMonth, "MMMM yyyy")}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setViewMonth((prev) => addDays(startOfMonth(prev), -1))}
                  className="p-1 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMonth((prev) => addDays(endOfMonth(prev), 1))}
                  className="p-1 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Weekday Labels */}
            <div className="grid grid-cols-7 text-center text-[10px] font-semibold text-zinc-500 uppercase">
              <div>Su</div>
              <div>Mo</div>
              <div>Tu</div>
              <div>We</div>
              <div>Th</div>
              <div>Fr</div>
              <div>Sa</div>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day) => {
                const isSelected = isSameDay(day, selectedDay);
                const isCurrentMonth = isSameMonth(day, viewMonth);
                const isPast = todayDate ? isBefore(day, todayDate) : false;

                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    onClick={() => setSelectedDay(day)}
                    className={cn(
                      "h-8 w-full rounded-lg text-xs font-medium transition-all flex items-center justify-center relative cursor-pointer",
                      isSelected
                        ? "bg-red-600 text-white font-bold shadow-md shadow-red-950/50"
                        : isCurrentMonth
                        ? isPast
                          ? "text-zinc-600 hover:text-zinc-300 hover:bg-zinc-900"
                          : "text-zinc-200 hover:bg-zinc-800/80"
                        : "text-zinc-700 hover:text-zinc-500"
                    )}
                  >
                    {format(day, "d")}
                    {todayDate && isSameDay(day, todayDate) && !isSelected && (
                      <span className="absolute bottom-1 h-1 w-1 rounded-full bg-red-500" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Selector */}
          <div className="pt-3 border-t border-zinc-800/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Clock className="h-3 w-3 text-red-400" />
                Publish Time
              </span>
              <div className="font-mono text-xs font-bold text-red-400 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800">
                {String(hour12).padStart(2, "0")}:{String(minute).padStart(2, "0")} {period}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Hour Selector */}
              <div className="flex-1">
                <label className="text-[10px] text-zinc-500 block mb-1">Hour</label>
                <select
                  value={hour12}
                  onChange={(e) => setHour12(parseInt(e.target.value, 10))}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-red-500"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                    <option key={h} value={h}>
                      {String(h).padStart(2, "0")}
                    </option>
                  ))}
                </select>
              </div>

              {/* Minute Selector */}
              <div className="flex-1">
                <label className="text-[10px] text-zinc-500 block mb-1">Minute</label>
                <select
                  value={minute}
                  onChange={(e) => setMinute(parseInt(e.target.value, 10))}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-red-500 font-mono"
                >
                  {Array.from({ length: 60 }, (_, i) => i).map((m) => (
                    <option key={m} value={m}>
                      :{String(m).padStart(2, "0")}
                    </option>
                  ))}
                </select>
              </div>

              {/* AM / PM Toggle */}
              <div className="w-24">
                <label className="text-[10px] text-zinc-500 block mb-1">Period</label>
                <div className="grid grid-cols-2 rounded-lg border border-zinc-800 bg-zinc-900 p-0.5">
                  <button
                    type="button"
                    onClick={() => setPeriod("AM")}
                    className={cn(
                      "py-1 text-xs font-semibold rounded-md transition-colors",
                      period === "AM"
                        ? "bg-red-600 text-white shadow-sm"
                        : "text-zinc-400 hover:text-zinc-200"
                    )}
                  >
                    AM
                  </button>
                  <button
                    type="button"
                    onClick={() => setPeriod("PM")}
                    className={cn(
                      "py-1 text-xs font-semibold rounded-md transition-colors",
                      period === "PM"
                        ? "bg-red-600 text-white shadow-sm"
                        : "text-zinc-400 hover:text-zinc-200"
                    )}
                  >
                    PM
                  </button>
                </div>
              </div>
            </div>

            {/* Quick minute pills */}
            <div className="flex items-center gap-1.5 pt-1">
              {[0, 15, 30, 45].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMinute(m)}
                  className={cn(
                    "flex-1 py-1 text-[10px] font-mono rounded-md border transition-colors",
                    minute === m
                      ? "border-red-500/60 bg-red-950/40 text-red-300 font-bold"
                      : "border-zinc-800/80 bg-zinc-900/50 text-zinc-400 hover:bg-zinc-800"
                  )}
                >
                  :{String(m).padStart(2, "0")}
                </button>
              ))}
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-xs text-zinc-400 hover:text-zinc-200 px-2 py-1 rounded transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-md flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Check className="h-3.5 w-3.5" />
              Set Schedule
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
