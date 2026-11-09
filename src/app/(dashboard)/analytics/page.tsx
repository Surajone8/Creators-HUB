import { ChannelOverview } from "@/components/modules/analytics/channel-overview";

export default function AnalyticsPage() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-zinc-100">YouTube Performance Analytics</h2>
        <p className="text-xs text-zinc-400">
          Basic performance metrics snapshot constrained by official YouTube Data API reporting
        </p>
      </div>

      <ChannelOverview />
    </div>
  );
}
