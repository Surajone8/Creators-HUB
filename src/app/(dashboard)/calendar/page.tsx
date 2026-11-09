import { CalendarGrid } from "@/components/modules/calendar/calendar-grid";

export default function CalendarPage() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-zinc-100">Content Calendar</h2>
        <p className="text-xs text-zinc-400">
          Inspect, filter, and reschedule upcoming and published YouTube videos
        </p>
      </div>

      <CalendarGrid />
    </div>
  );
}
