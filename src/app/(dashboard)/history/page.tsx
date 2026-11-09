import { HistoryTable } from "@/components/modules/history/history-table";

export default function HistoryPage() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-zinc-100">Publishing History & Audit Logs</h2>
        <p className="text-xs text-zinc-400">
          Review automated publishing attempts, error reconciliation, and confirmed YouTube video IDs
        </p>
      </div>

      <HistoryTable />
    </div>
  );
}
