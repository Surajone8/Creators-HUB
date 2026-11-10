"use client";

import { useEffect, useRef } from "react";

/**
 * Global background publisher & email notification heartbeat.
 * Mounted in DashboardLayout so that scheduled uploads and 2-minute advance emails
 * trigger precisely on time regardless of which page the creator is viewing.
 */
export function PublishingHeartbeat() {
  const isRunningRef = useRef(false);

  useEffect(() => {
    async function triggerDispatchSweep() {
      if (isRunningRef.current) return;
      isRunningRef.current = true;

      try {
        const res = await fetch("/api/publishing/dispatch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ source: "heartbeat" }),
        });

        if (res.ok) {
          const json = await res.json().catch(() => ({}));
          const processedCount = json.data?.totalProcessed || 0;
          const emailsSent = json.data?.advanceReminderEmailsDispatched || 0;

          if (processedCount > 0 || emailsSent > 0) {
            // Notify active components (like CalendarGrid) to refresh their views immediately
            window.dispatchEvent(
              new CustomEvent("creator-hub-schedules-updated", {
                detail: { processedCount, emailsSent },
              })
            );
          }
        }
      } catch {
        // Silently retry on next tick
      } finally {
        isRunningRef.current = false;
      }
    }

    // Run initial sweep on mount
    triggerDispatchSweep();

    // High-precision 5-second heartbeat
    const interval = setInterval(() => {
      triggerDispatchSweep();
    }, 5000);

    // Immediate sweep when the user switches tabs back or refocuses window
    function handleVisibilityOrFocus() {
      if (document.visibilityState === "visible") {
        triggerDispatchSweep();
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityOrFocus);
    window.addEventListener("focus", handleVisibilityOrFocus);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
      window.removeEventListener("focus", handleVisibilityOrFocus);
    };
  }, []);

  return null;
}
