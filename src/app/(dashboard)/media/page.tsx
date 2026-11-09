import { StagedMediaTable } from "@/components/modules/media/staged-media-table";

export default function MediaStagingPage() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-zinc-100">Google Drive Media Staging</h2>
        <p className="text-xs text-zinc-400">
          Track temporary staged video files, active publishing job locks, and verified post-upload deletions
        </p>
      </div>

      <StagedMediaTable />
    </div>
  );
}
